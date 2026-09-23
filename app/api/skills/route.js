import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const SKILLS_FILE = path.join(DATA_DIR, 'local_skills.json');

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadSkills() {
    if (!fs.existsSync(SKILLS_FILE)) {
        return [];
    }
    try {
        const content = fs.readFileSync(SKILLS_FILE, 'utf-8');
        return JSON.parse(content);
    } catch {
        return [];
    }
}

function saveSkills(skills) {
    fs.writeFileSync(SKILLS_FILE, JSON.stringify(skills, null, 2), 'utf-8');
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.toLowerCase();
    const category = searchParams.get('category');
    
    let skills = loadSkills();

    if (category && category !== 'all') {
        skills = skills.filter(s => s.category?.toLowerCase() === category.toLowerCase());
    }

    if (q) {
        skills = skills.filter(s => 
            s.name?.toLowerCase().includes(q) ||
            s.description?.toLowerCase().includes(q) ||
            s.tags?.some(t => t.toLowerCase().includes(q)) ||
            s.category?.toLowerCase().includes(q)
        );
    }

    return NextResponse.json(skills);
}

export async function POST(request) {
    let body = {};
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 });
    }

    const skills = loadSkills();

    // 1. Import Skill from Web (skills.sh, GitHub raw, Claude skill)
    if (body.action === 'import_url' && body.url) {
        try {
            const url = body.url.trim();
            // If skills.sh URL without raw format, try to fetch or construct raw
            let fetchUrl = url;
            if (url.includes('github.com') && !url.includes('raw.githubusercontent.com') && url.includes('/blob/')) {
                fetchUrl = url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
            }

            const res = await fetch(fetchUrl);
            if (!res.ok) {
                return NextResponse.json({ error: `Impossible de récupérer le contenu (${res.status})` }, { status: 400 });
            }

            const rawText = await res.text();
            let parsedSkill = null;

            // Try JSON format first
            try {
                const jsonObj = JSON.parse(rawText);
                parsedSkill = {
                    id: `skill_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                    slug: (jsonObj.name || jsonObj.id || 'imported-skill').toLowerCase().replace(/[^a-z0-9]/g, '-'),
                    name: jsonObj.name || jsonObj.title || 'Skill Importé',
                    category: jsonObj.category || 'Imported Web',
                    icon: jsonObj.icon || '⚡',
                    description: jsonObj.description || 'Importé depuis ' + url,
                    prompt_injection: jsonObj.prompt_injection || jsonObj.system_prompt || jsonObj.instructions || rawText.slice(0, 1000),
                    tags: jsonObj.tags || ['imported', 'skills.sh'],
                    source: url,
                    created_at: new Date().toISOString()
                };
            } catch {
                // Parse Markdown format (e.g. SKILL.md, skills.sh)
                const titleMatch = rawText.match(/^#+\s+(.+)$/m);
                const name = titleMatch ? titleMatch[1].trim() : 'Skill ' + new URL(url).pathname.split('/').pop().replace(/\.[^/.]+$/, '');
                
                // Extract description or first paragraph
                const paragraphs = rawText.split(/\n\s*\n/).filter(p => !p.startsWith('#') && p.trim().length > 10);
                const description = paragraphs[0] ? paragraphs[0].trim().slice(0, 250) : 'Compétence importée depuis ' + url;

                parsedSkill = {
                    id: `skill_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                    slug: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                    name: name,
                    category: 'Imported Web',
                    icon: '🌐',
                    description: description,
                    prompt_injection: rawText.slice(0, 3000),
                    tags: ['imported', 'web', 'skills.sh'],
                    source: url,
                    created_at: new Date().toISOString()
                };
            }

            skills.unshift(parsedSkill);
            saveSkills(skills);
            return NextResponse.json({ success: true, skill: parsedSkill });
        } catch (err) {
            console.error('[SkillImport] Error importing URL:', err);
            return NextResponse.json({ error: 'Erreur lors du téléchargement : ' + err.message }, { status: 500 });
        }
    }

    // 2. Direct creation
    const newSkill = {
        id: body.id || `skill_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        slug: (body.name || 'skill').toLowerCase().replace(/[^a-z0-9]/g, '-'),
        name: body.name || 'Nouvelle Compétence',
        category: body.category || 'Général',
        icon: body.icon || '✨',
        description: body.description || '',
        prompt_injection: body.prompt_injection || body.instructions || '',
        tags: Array.isArray(body.tags) ? body.tags : (body.tags ? body.tags.split(',').map(t => t.trim()) : ['custom']),
        source: body.source || 'Local Mgp Studio',
        created_at: new Date().toISOString()
    };

    skills.unshift(newSkill);
    saveSkills(skills);
    return NextResponse.json(newSkill, { status: 201 });
}

export async function PUT(request) {
    let body = {};
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 });
    }

    const skills = loadSkills();
    const idx = skills.findIndex(s => s.id === body.id || s.slug === body.id);
    if (idx === -1) {
        return NextResponse.json({ error: 'Skill introuvable' }, { status: 404 });
    }

    skills[idx] = {
        ...skills[idx],
        ...body,
        tags: Array.isArray(body.tags) ? body.tags : (body.tags ? body.tags.split(',').map(t => t.trim()) : skills[idx].tags),
        updated_at: new Date().toISOString()
    };

    saveSkills(skills);
    return NextResponse.json(skills[idx]);
}

export async function DELETE(request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
        return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    let skills = loadSkills();
    skills = skills.filter(s => s.id !== id && s.slug !== id);
    saveSkills(skills);
    return NextResponse.json({ success: true, deleted_id: id });
}
