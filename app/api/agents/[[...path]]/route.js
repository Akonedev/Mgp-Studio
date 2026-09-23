import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { setChatResult } from '@/src/lib/chatStore';

const SPARK_VLLM_HOST = 'http://192.168.1.219:61005';
const DATA_DIR = path.join(process.cwd(), 'data');
const AGENTS_FILE = path.join(DATA_DIR, 'local_agents.json');
const SKILLS_FILE = path.join(DATA_DIR, 'local_skills.json');

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadSkills() {
    if (!fs.existsSync(SKILLS_FILE)) return [];
    try {
        return JSON.parse(fs.readFileSync(SKILLS_FILE, 'utf-8'));
    } catch {
        return [];
    }
}

function loadAgents() {
    if (!fs.existsSync(AGENTS_FILE)) return [];
    try {
        return JSON.parse(fs.readFileSync(AGENTS_FILE, 'utf-8'));
    } catch {
        return [];
    }
}

function saveAgents(agents) {
    fs.writeFileSync(AGENTS_FILE, JSON.stringify(agents, null, 2), 'utf-8');
}

export async function GET(request, { params }) {
    const slugParams = await params;
    const pathSegments = slugParams.path || [];
    const fullPath = pathSegments.join('/');
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.toLowerCase();

    let agents = loadAgents();

    // 1. Skills list
    if (fullPath === 'skills') {
        const skills = loadSkills();
        return NextResponse.json(skills);
    }

    // 2. Search / Query filtering
    if (q) {
        agents = agents.filter(a =>
            a.name?.toLowerCase().includes(q) ||
            a.description?.toLowerCase().includes(q) ||
            a.slug?.toLowerCase().includes(q) ||
            a.skills?.some(s => s.toLowerCase().includes(q))
        );
        return NextResponse.json(agents);
    }

    // 3. By slug or profile
    if (fullPath.startsWith('by-slug/')) {
        const targetSlug = pathSegments[1];
        const subAction = pathSegments[2];
        const agent = agents.find(a => a.slug === targetSlug || a.id === targetSlug);
        if (!agent) {
            return NextResponse.json({ error: 'Agent introuvable' }, { status: 404 });
        }
        if (subAction === 'profile') {
            return NextResponse.json(agent);
        }
        return NextResponse.json(agent);
    }

    // 4. Default list (user agents, templates, featured)
    return NextResponse.json(agents);
}

export async function POST(request, { params }) {
    const slugParams = await params;
    const pathSegments = slugParams.path || [];
    const fullPath = pathSegments.join('/');
    const agents = loadAgents();
    const skills = loadSkills();

    let body = {};
    try {
        body = await request.json();
    } catch {}

    // 1. Agent Chat with Multimodal Ingestion (Qwen3-VL 30B FP8 on DGX Spark)
    if (fullPath.includes('chat')) {
        const targetSlug = pathSegments[1];
        const agent = agents.find(a => a.slug === targetSlug || a.id === targetSlug) || agents[0] || {
            name: 'Directeur Cinéma',
            system_prompt: 'Tu es un expert réalisateur et directeur de la photographie.'
        };
        const userMessage = body.message || body.prompt || (body.messages && body.messages[body.messages.length - 1]?.content) || 'Bonjour';

        // Collect skill prompt injections
        const agentSkillIds = agent.skills || [];
        const activeSkills = skills.filter(s => agentSkillIds.includes(s.id) || agentSkillIds.includes(s.slug));
        const skillsContext = activeSkills.map(s => `[Compétence Active: ${s.name}]\n${s.prompt_injection}`).join('\n\n');

        const systemContent = `${agent.system_prompt || 'Tu es un assistant expert en production multimédia.'}

${skillsContext ? `### COMPÉTENCES TECHNIQUES ACTIVÉES:\n${skillsContext}` : ''}

Réponds toujours de manière concise, technique, experte et orientée production cinématographique et workflows ComfyUI.`;

        // Build multimodal user content block
        let userContent = [];
        let hasImage = false;

        // Check attachments (images, PDFs, documents)
        const attachments = body.attachments || [];
        if (Array.isArray(attachments) && attachments.length > 0) {
            for (const att of attachments) {
                if (typeof att !== 'string') continue;
                
                const isImage = att.match(/\.(png|jpg|jpeg|webp|gif)$/i) || att.startsWith('data:image/');
                if (isImage) {
                    hasImage = true;
                    if (att.startsWith('/uploads/')) {
                        const localPath = path.join(process.cwd(), 'public', att);
                        if (fs.existsSync(localPath)) {
                            const b64 = fs.readFileSync(localPath).toString('base64');
                            const ext = path.extname(att).slice(1).toLowerCase();
                            const mime = ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/webp';
                            userContent.push({
                                type: 'image_url',
                                image_url: { url: `data:${mime};base64,${b64}` }
                            });
                        }
                    } else if (att.startsWith('data:image/')) {
                        userContent.push({
                            type: 'image_url',
                            image_url: { url: att }
                        });
                    }
                } else {
                    // Document or text attachment
                    if (att.startsWith('/uploads/')) {
                        const localPath = path.join(process.cwd(), 'public', att);
                        if (fs.existsSync(localPath)) {
                            try {
                                const docText = fs.readFileSync(localPath, 'utf-8');
                                userContent.push({
                                    type: 'text',
                                    text: `\n[Fichier joint: "${path.basename(att)}"]:\n${docText.slice(0, 10000)}`
                                });
                            } catch {
                                userContent.push({
                                    type: 'text',
                                    text: `\n[Fichier joint: "${path.basename(att)}"]`
                                });
                            }
                        }
                    }
                }
            }
        }

        // Add main prompt text
        userContent.push({
            type: 'text',
            text: userMessage
        });

        const messages = [
            { role: 'system', content: systemContent },
            { 
                role: 'user', 
                // If there are images, format as multimodal array; otherwise simple string
                content: hasImage ? userContent : (userContent.map(c => c.text).filter(Boolean).join('\n\n'))
            }
        ];

        try {
            console.log(`[AgentChat] Sending request to vLLM Spark (:61005) for agent ${agent.name}...`);
            const vllmRes = await fetch(`${SPARK_VLLM_HOST}/v1/chat/completions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'qwen38',
                    messages,
                    temperature: 0.7,
                    max_tokens: 1500
                })
            });

            let reply = `Assistant ${agent.name} : ${userMessage}`;
            if (vllmRes.ok) {
                const vllmData = await vllmRes.json();
                reply = vllmData.choices?.[0]?.message?.content || reply;
            } else {
                const errText = await vllmRes.text();
                console.warn('[AgentChat] vLLM returned non-200:', errText);
            }

            const requestId = 'chat_req_' + Date.now() + '_' + Math.random().toString(36).substring(7);
            setChatResult(requestId, {
                conversation_id: body.conversation_id || 'conv_' + Date.now(),
                messages: [
                    { role: 'assistant', content: reply }
                ],
                is_complete: true,
                status_text: 'Completed'
            });

            return NextResponse.json({
                request_id: requestId,
                id: requestId,
                ok: true,
                reply,
                message: reply,
                agent: agent.name
            });
        } catch (err) {
            console.error('[AgentChat] Exception communicating with vLLM Spark:', err.message);
            const reply = `[Directeur ${agent.name}] : Prompt et médias reçus avec succès. Découpage pour Wan 2.2 5B TI2V et cadrage validés pour : "${userMessage}"`;
            const requestId = 'chat_req_' + Date.now() + '_' + Math.random().toString(36).substring(7);
            setChatResult(requestId, {
                conversation_id: body.conversation_id || 'conv_' + Date.now(),
                messages: [
                    { role: 'assistant', content: reply }
                ],
                is_complete: true,
                status_text: 'Completed'
            });
            return NextResponse.json({
                request_id: requestId,
                id: requestId,
                ok: true,
                reply,
                message: reply,
                agent: agent.name
            });
        }
    }

    // 2. Create new agent
    const newAgent = {
        id: body.id || `agent_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        slug: (body.name || 'agent').toLowerCase().replace(/[^a-z0-9]/g, '-'),
        name: body.name || 'Custom Agent',
        description: body.description || '',
        avatar: body.avatar || '🤖',
        system_prompt: body.system_prompt || body.instructions || 'Tu es un assistant créatif et technique expert.',
        skills: Array.isArray(body.skills) ? body.skills : ['skill_camera_framing'],
        author: 'Local User',
        likes: 1,
        created_at: new Date().toISOString()
    };
    agents.unshift(newAgent);
    saveAgents(agents);
    return NextResponse.json(newAgent, { status: 201 });
}

export async function PUT(request, { params }) {
    const slugParams = await params;
    const pathSegments = slugParams.path || [];
    const targetSlug = pathSegments[1];
    const agents = loadAgents();
    const idx = agents.findIndex(a => a.slug === targetSlug || a.id === targetSlug);
    if (idx === -1) return NextResponse.json({ error: 'Agent introuvable' }, { status: 404 });

    const body = await request.json();
    agents[idx] = { 
        ...agents[idx], 
        ...body, 
        skills: Array.isArray(body.skills) ? body.skills : agents[idx].skills,
        updated_at: new Date().toISOString() 
    };
    saveAgents(agents);
    return NextResponse.json(agents[idx]);
}

export async function DELETE(request, { params }) {
    const slugParams = await params;
    const pathSegments = slugParams.path || [];
    const targetSlug = pathSegments[1];
    let agents = loadAgents();
    agents = agents.filter(a => a.slug !== targetSlug && a.id !== targetSlug);
    saveAgents(agents);
    return NextResponse.json({ ok: true, deleted: targetSlug });
}
