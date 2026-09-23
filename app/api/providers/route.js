import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CONFIG_FILE = path.join(process.cwd(), 'data', 'providers_config.json');

const SPARK_HOST = '192.168.1.219';
const SPARK_COMFY_URL = `http://${SPARK_HOST}:61009`;
const SPARK_VLLM_URL = `http://${SPARK_HOST}:61005/v1`;
const SPARK_OLLAMA_URL = `http://${SPARK_HOST}:61004`;

function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
            return JSON.parse(raw);
        }
    } catch (e) {
        console.error('[providers] Error loading providers_config.json:', e);
    }
    return {
        mode_settings: {
            text: { providerId: 'spark-vllm', model: 'qwen38' },
            image: { providerId: 'spark-comfy', model: 'DreamShaper_8_pruned.safetensors' },
            video: { providerId: 'spark-comfy', model: 'wan2.2_ti2v_5B_fp16.safetensors' },
            audio: { providerId: 'spark-comfy', model: 'minimax_music3_dit_fp16.safetensors' },
            avatar: { providerId: 'spark-comfy', model: 'wan2.2_ti2v_5B_fp16.safetensors' },
            cinema: { providerId: 'spark-comfy', model: 'DreamShaper_8_pruned.safetensors' },
            marketing: { providerId: 'spark-comfy', model: 'wan2.1_t2v_1.3B_bf16.safetensors' },
            montage: { providerId: 'spark-comfy', model: 'wan2.2_ti2v_5B_fp16.safetensors' },
            voice: { providerId: 'spark-comfy', model: 'fr-FR-HenriNeural' }
        },
        providers: []
    };
}

function saveConfig(config) {
    try {
        fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true });
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
        return true;
    } catch (e) {
        console.error('[providers] Error saving providers_config.json:', e);
        return false;
    }
}

export async function GET(request) {
    const config = loadConfig();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const mode = searchParams.get('mode') || 'all';

    if (action === 'valid_models') {
        const validProviders = (config.providers || []).filter(p => {
            const isLocal = p.type === 'comfyui' || p.type.includes('local') || p.id.includes('spark') || p.id.includes('local');
            if (isLocal) return true;
            return Boolean(p.apiKey && p.apiKey.trim().length > 0 && p.apiKey !== 'local-spark');
        });

        // Load local ComfyUI workflows
        const workflowsPath = path.join(process.cwd(), 'data', 'local_workflows.json');
        let localWorkflows = [];
        if (fs.existsSync(workflowsPath)) {
            try {
                localWorkflows = JSON.parse(fs.readFileSync(workflowsPath, 'utf8'));
            } catch (e) {
                localWorkflows = [];
            }
        }

        const models = [];

        // 1. If mode === 'cinema', add all ComfyUI cinematic workflows first
        if (mode === 'cinema') {
            for (const wf of localWorkflows) {
                const prefixEmoji = wf.name?.match(/^[\uD800-\uDBFF\uDC00-\uDFFF\u2600-\u27BF]/) ? '' : '🎬 ';
                models.push({
                    id: `wf_${wf.id || wf.workflow_id}`,
                    workflowId: wf.id || wf.workflow_id,
                    name: `${prefixEmoji}${wf.name} (Workflow ComfyUI)`,
                    provider: 'DGX Spark — Workflows ComfyUI',
                    providerId: 'spark-comfy',
                    isWorkflow: true,
                    isLocal: true,
                    category: wf.category || 'Cinéma Spark',
                    description: wf.description || '',
                    inputs: {
                        aspect_ratio: {
                            default: '16:9',
                            enum: ['16:9', '1:1', '9:16', '4:3', '3:2', '21:9']
                        },
                        resolution: {
                            default: wf.category?.includes('Image') ? '1024x1024' : '832x480',
                            enum: ['832x480', '1024x1024', '1280x720', '1920x1080']
                        },
                        duration: { default: 2, enum: [2, 3, 5] }
                    }
                });
            }
        }

        // 2. If mode === 'image', add ComfyUI image workflows
        if (mode === 'image' || mode === 'i2i') {
            const imageWfs = localWorkflows.filter(wf => 
                (wf.category && (wf.category.includes('Image') || wf.category.includes('App') || wf.category.includes('SOTA'))) ||
                wf.id?.includes('image') || wf.id?.includes('zimage') || wf.id?.includes('photo') || wf.id?.includes('banana') || wf.id?.includes('pet')
            );
            for (const wf of imageWfs) {
                const prefixEmoji = wf.name?.match(/^[\uD800-\uDBFF\uDC00-\uDFFF\u2600-\u27BF]/) ? '' : '🌟 ';
                models.push({
                    id: `wf_${wf.id || wf.workflow_id}`,
                    workflowId: wf.id || wf.workflow_id,
                    name: `${prefixEmoji}${wf.name} (Workflow ComfyUI)`,
                    provider: 'DGX Spark — Workflows ComfyUI',
                    providerId: 'spark-comfy',
                    isWorkflow: true,
                    isLocal: true,
                    category: wf.category || 'Image Spark',
                    description: wf.description || '',
                    inputs: {
                        aspect_ratio: {
                            default: '1:1',
                            enum: ['1:1', '16:9', '9:16', '4:3', '3:2', '21:9']
                        },
                        resolution: {
                            default: '1024x1024',
                            enum: ['768x512', '1024x1024', '1280x720']
                        }
                    }
                });
            }
        }

        // 3. Filter target providers
        const targetMode = (mode === 'marketing' ? 'video' : mode);
        const targetProviders = validProviders.filter(p => {
            if (mode === 'all' || mode === 'cinema') return true;
            return !p.supportedModes || p.supportedModes.includes(targetMode) || p.type === 'comfyui';
        });

        for (const p of targetProviders) {
            for (const mId of (p.models || [])) {
                const mLower = mId.toLowerCase();
                const isImageModel = mLower.includes('z_image') || mLower.includes('z-image') || mLower.includes('dreamshaper') || mLower.includes('qwen_image') || mLower.includes('dall-e') || mLower.includes('imagen') || mLower.includes('flux') || mLower.includes('sd15') || mLower.includes('sd1.5') || mLower.includes('v1-5') || mLower.includes('sdxl') || mLower.includes('midjourney') || mLower.includes('realisticvision');
                const isVideoModel = mLower.includes('wan') || mLower.includes('ltx-2.5-22b') || mLower.includes('minimax-h3') || mLower.includes('minimax_h3') || mLower.includes('sora') || mLower.includes('cogvideo') || mLower.includes('hailuo') || mLower.includes('kling') || mLower.includes('runway') || mLower.includes('luma');
                const isAudioModel = mLower.includes('music') || mLower.includes('audio') || mLower.includes('tts') || mLower.includes('voice');

                if (mode === 'cinema') {
                    // Cinema Studio accepts video models, image models, and LLM director models
                    if (isAudioModel) continue;
                } else if (targetMode === 'image' || targetMode === 'i2i') {
                    if (isVideoModel || isAudioModel || (!isImageModel && (p.type === 'comfyui' || p.type === 'local_engine'))) continue;
                } else if (targetMode === 'video' || targetMode === 'i2v' || targetMode === 'marketing') {
                    if (isImageModel && !isVideoModel) continue;
                    if (isAudioModel) continue;
                } else if (targetMode === 'avatar' || targetMode === 'lipsync') {
                    if (isAudioModel) continue;
                } else if (targetMode === 'audio') {
                    if (!isAudioModel) continue;
                } else if (targetMode === 'text') {
                    if (isImageModel || isVideoModel || isAudioModel) continue;
                }

                let displayName = mId;
                if (mId === 'z_image_turbo-Q4_K.gguf' || mId === 'z-image-turbo') displayName = 'Z-Image Turbo 1024px DiT (Local sd.cpp Haute Qualité)';
                else if (mId === 'realisticVisionV51_v51VAE.safetensors') displayName = 'Realistic Vision V5.1 Photoréaliste (Local sd.cpp)';
                else if (mId === 'wan2.2_t2v_high_noise_14B_fp8_scaled.safetensors') displayName = 'Wan 2.2 14B High Quality T2V (DGX Spark GB10)';
                else if (mId === 'wan2.2_i2v_high_noise_14B_fp8_scaled.safetensors') displayName = 'Wan 2.2 14B High Quality I2V (DGX Spark GB10)';
                else if (mId === 'wan2.2_ti2v_5B_fp16.safetensors') displayName = 'Wan 2.2 5B TI2V (DGX Spark GB10)';
                else if (mId === 'DreamShaper_8_pruned.safetensors') displayName = 'DreamShaper 8 SD 1.5 (Spark GB10)';
                else if (mId === 'qwen_image_2512_fp8_e4m3fn.safetensors') displayName = 'Qwen Image 2512 FP8 SOTA 2K (Spark GB10)';
                else if (mId === 'qwen_image_edit_2511_int8_convrot.safetensors') displayName = 'Qwen Image Edit (Spark GB10)';
                else if (mId === 'wan2.1_t2v_1.3B_bf16.safetensors') displayName = 'Wan 2.1 1.3B (DGX Spark GB10)';
                else if (mId === 'MiniMax-H3_FL2VA-NVFP4-HQ.safetensors') displayName = 'MiniMax Hailuo H3 Turbo (Spark GB10)';
                else if (mId.includes('ltx-2.5-22b-distilled-transformer-nvfp4-comfy-v2')) displayName = 'LTX-2.5 22B NVFP4 v2 (Spark GB10)';
                else if (mId.includes('ltx-2.5-22b')) displayName = 'LTX-2.5 22B Distilled (Spark GB10)';
                else if (mId.includes('minimax_h3_fl2va_pruned_nvfp4')) displayName = 'MiniMax H3 FL2VA NVFP4 (Spark GB10)';
                else if (mId.includes('minimax_h3_fl2va_pruned_int8')) displayName = 'MiniMax H3 FL2VA INT8 (Spark GB10)';
                else if (mId.includes('minimax_h3_ref2va')) displayName = 'MiniMax H3 Ref2VA (Spark GB10)';
                else if (mId.includes('minimax_h3_fused')) displayName = 'MiniMax H3 Fused Turbo (Spark GB10)';
                else if (mId.includes('minimax_music3')) displayName = 'MiniMax Music 3 OST (Spark GB10)';
                else if (mId.includes('ltx-2.5-audio')) displayName = 'LTX-2.5 Audio VAE (Spark GB10)';
                else if (mId === 'qwen38') displayName = 'Qwen3-VL 30B FP8 — Directeur Higgsfield (Spark GB10)';
                else if (mId === 'gemma3:4b') displayName = 'Gemma 3 4B — Assistant Story (Spark GB10)';
                else displayName = `${mId} (${p.name})`;

                models.push({
                    id: mId,
                    name: displayName,
                    provider: p.name,
                    providerId: p.id,
                    isLocal: p.type === 'comfyui' || p.id.includes('spark') || p.id.includes('local'),
                    isVideo: isVideoModel,
                    isImage: isImageModel,
                    inputs: {
                        aspect_ratio: {
                            default: '16:9',
                            enum: ['16:9', '1:1', '9:16', '4:3', '3:2', '21:9']
                        },
                        resolution: {
                            default: isVideoModel ? '832x480' : (mId.includes('z_image') ? '1024x1024' : '768x512'),
                            enum: isVideoModel ? ['832x480', '1280x720', '1920x1080'] : ['768x512', '1024x1024', '1280x720']
                        },
                        duration: {
                            default: 2,
                            enum: [2, 3, 5]
                        }
                    }
                });
            }
        }

        return NextResponse.json({
            ok: true,
            mode,
            count: models.length,
            models
        });
    }

    return NextResponse.json({
        ok: true,
        providers: config.providers || [],
        mode_settings: config.mode_settings || {
            text: { providerId: 'spark-vllm', model: 'qwen38' },
            image: { providerId: 'spark-comfy', model: 'DreamShaper_8_pruned.safetensors' },
            video: { providerId: 'spark-comfy', model: 'wan2.2_ti2v_5B_fp16.safetensors' },
            audio: { providerId: 'spark-comfy', model: 'minimax_music3_dit_fp16.safetensors' },
            avatar: { providerId: 'spark-comfy', model: 'wan2.2_ti2v_5B_fp16.safetensors' },
            cinema: { providerId: 'spark-comfy', model: 'DreamShaper_8_pruned.safetensors' },
            marketing: { providerId: 'spark-comfy', model: 'wan2.1_t2v_1.3B_bf16.safetensors' },
            montage: { providerId: 'spark-comfy', model: 'wan2.2_ti2v_5B_fp16.safetensors' },
            voice: { providerId: 'spark-comfy', model: 'fr-FR-HenriNeural' }
        }
    });
}

export async function POST(request) {
    try {
        const body = await request.json();
        const action = body.action;
        const config = loadConfig();

        // 1. Sauvegarde des affectations par mode
        if (action === 'save_mode_settings') {
            if (!body.mode_settings) {
                return NextResponse.json({ ok: false, error: 'mode_settings requis' }, { status: 400 });
            }
            config.mode_settings = {
                ...config.mode_settings,
                ...body.mode_settings
            };
            saveConfig(config);
            return NextResponse.json({ ok: true, mode_settings: config.mode_settings });
        }

        // 2. Ajout ou modification d'un provider
        if (action === 'save_provider') {
            const p = body.provider;
            if (!p || !p.id || !p.name) {
                return NextResponse.json({ ok: false, error: 'id et nom requis pour le provider' }, { status: 400 });
            }

            const existingIdx = config.providers.findIndex(x => x.id === p.id);
            const providerRecord = {
                id: p.id,
                name: p.name,
                type: p.type || 'openai_compatible',
                baseUrl: p.baseUrl || '',
                apiKey: p.apiKey || '',
                supportedModes: Array.isArray(p.supportedModes) ? p.supportedModes : ['text'],
                models: Array.isArray(p.models) && p.models.length > 0 ? p.models : [p.defaultModel || 'default-model'],
                defaultModel: p.defaultModel || (p.models && p.models[0]) || 'default-model',
                description: p.description || '',
                status: p.status || 'ready',
                isCustom: p.isCustom !== undefined ? p.isCustom : (existingIdx === -1)
            };

            if (existingIdx >= 0) {
                config.providers[existingIdx] = { ...config.providers[existingIdx], ...providerRecord };
            } else {
                config.providers.push(providerRecord);
            }

            saveConfig(config);
            return NextResponse.json({ ok: true, provider: providerRecord });
        }

        // 3. Suppression d'un provider
        if (action === 'delete_provider') {
            const providerId = body.providerId;
            if (!providerId) {
                return NextResponse.json({ ok: false, error: 'providerId requis' }, { status: 400 });
            }
            config.providers = config.providers.filter(x => x.id !== providerId);
            saveConfig(config);
            return NextResponse.json({ ok: true, deleted: providerId });
        }

        // 4. Chargement dynamique des modèles (Fetch Models from URL + Key)
        if (action === 'fetch_models') {
            const providerId = body.providerId;
            const targetProvider = config.providers.find(x => x.id === providerId) || body.provider || {};
            const baseUrl = (body.baseUrl || targetProvider.baseUrl || '').replace(/\/+$/, '');
            const apiKey = body.apiKey || targetProvider.apiKey || '';
            const type = body.type || targetProvider.type || 'openai_compatible';

            let fetchedModels = [];

            try {
                // A. ComfyUI
                if (type === 'comfyui' || baseUrl.includes('61009') || baseUrl.includes('8188')) {
                    const [ckptRes, unetRes] = await Promise.allSettled([
                        fetch(`${baseUrl}/object_info/CheckpointLoaderSimple`, { signal: AbortSignal.timeout(5000) }),
                        fetch(`${baseUrl}/object_info/UNETLoader`, { signal: AbortSignal.timeout(5000) })
                    ]);

                    if (ckptRes.status === 'fulfilled' && ckptRes.value.ok) {
                        const ckptData = await ckptRes.value.json();
                        const ckpts = ckptData?.CheckpointLoaderSimple?.input?.required?.ckpt_name?.[0] || [];
                        fetchedModels.push(...ckpts);
                    }
                    if (unetRes.status === 'fulfilled' && unetRes.value.ok) {
                        const unetData = await unetRes.value.json();
                        const unets = unetData?.UNETLoader?.input?.required?.unet_name?.[0] || [];
                        fetchedModels.push(...unets);
                    }
                }
                // B. Ollama
                else if (type === 'ollama' || baseUrl.includes('61004') || baseUrl.includes('11434')) {
                    const tagsUrl = baseUrl.endsWith('/api') ? `${baseUrl}/tags` : `${baseUrl}/api/tags`;
                    const res = await fetch(tagsUrl, { signal: AbortSignal.timeout(5000) });
                    if (res.ok) {
                        const data = await res.json();
                        if (Array.isArray(data.models)) {
                            fetchedModels = data.models.map(m => m.name || m.model);
                        }
                    }
                }
                // C. OpenAI Compatible / vLLM / LM Studio / OpenRouter / DeepSeek / Moonshot / HuggingFace
                else {
                    const modelsUrl = baseUrl.endsWith('/v1') ? `${baseUrl}/models` : `${baseUrl}/v1/models`;
                    const headers = { 'Content-Type': 'application/json' };
                    if (apiKey && apiKey !== 'local-spark') {
                        headers['Authorization'] = `Bearer ${apiKey}`;
                    }

                    const res = await fetch(modelsUrl, { headers, signal: AbortSignal.timeout(6000) });
                    if (res.ok) {
                        const data = await res.json();
                        if (Array.isArray(data.data)) {
                            fetchedModels = data.data.map(m => m.id);
                        } else if (Array.isArray(data.models)) {
                            fetchedModels = data.models.map(m => m.name || m.id);
                        }
                    }
                }
            } catch (err) {
                console.warn(`[fetch_models] Erreur interrogation provider ${providerId}:`, err.message);
            }

            // Dédoublonnage et filtrage
            fetchedModels = Array.from(new Set(fetchedModels.filter(Boolean)));

            // Si des modèles ont été trouvés, mise à jour dans la configuration
            if (fetchedModels.length > 0 && providerId) {
                const pIdx = config.providers.findIndex(x => x.id === providerId);
                if (pIdx >= 0) {
                    config.providers[pIdx].models = fetchedModels;
                    if (!config.providers[pIdx].defaultModel || !fetchedModels.includes(config.providers[pIdx].defaultModel)) {
                        config.providers[pIdx].defaultModel = fetchedModels[0];
                    }
                    saveConfig(config);
                }
            }

            return NextResponse.json({
                ok: true,
                providerId,
                models: fetchedModels.length > 0 ? fetchedModels : (targetProvider.models || [])
            });
        }

        // 5. Inférence Chat / LLM (Texte)
        const providerId = body.provider || config.mode_settings?.text?.providerId || 'spark-vllm';
        const provider = config.providers.find(p => p.id === providerId) || config.providers[0];
        const apiKey = body.apiKey || request.headers.get('x-api-key') || provider?.apiKey;
        const model = body.model || config.mode_settings?.text?.model || provider?.defaultModel || 'qwen38';
        const messages = body.messages || [
            { role: 'user', content: body.prompt || body.message || 'Bonjour' }
        ];

        // 5a. Spark vLLM
        if (provider?.id === 'spark-vllm' || provider?.type === 'local_openai' && provider?.baseUrl.includes('61005')) {
            const res = await fetch(`${SPARK_VLLM_URL}/chat/completions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: model || 'qwen38',
                    messages,
                    temperature: body.temperature || 0.7,
                    max_tokens: body.max_tokens || 1500
                })
            });
            const data = await res.json();
            return NextResponse.json(data);
        }

        // 5b. Spark Ollama
        if (provider?.id === 'spark-ollama' || provider?.type === 'ollama') {
            const res = await fetch(`${provider.baseUrl}/v1/chat/completions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: model || 'gemma3:4b',
                    messages,
                    temperature: body.temperature || 0.7
                })
            });
            const data = await res.json();
            return NextResponse.json(data);
        }

        // 5c. LM Studio Local
        if (provider?.id === 'local-lmstudio') {
            try {
                const res = await fetch(`${provider.baseUrl}/chat/completions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ model, messages, temperature: 0.7 })
                });
                const data = await res.json();
                return NextResponse.json(data);
            } catch {
                return NextResponse.json({
                    error: 'LM Studio n\'est pas détecté sur http://localhost:1234.'
                }, { status: 503 });
            }
        }

        // 5d. Cloud providers (requérant clé)
        if (!apiKey || apiKey === 'local-spark') {
            // Fallback transparent vers Spark vLLM
            const res = await fetch(`${SPARK_VLLM_URL}/chat/completions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'qwen38',
                    messages,
                    temperature: 0.7
                })
            });
            const data = await res.json();
            if (data.choices && data.choices[0]) {
                data.choices[0].message.content = `[Exécution locale Spark GB10 — Provider ${provider?.name || 'Local'}]\n\n${data.choices[0].message.content}`;
            }
            return NextResponse.json(data);
        }

        // Forward au provider externe
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        };
        if (provider?.id === 'anthropic' || provider?.type === 'anthropic') {
            headers['x-api-key'] = apiKey;
            headers['anthropic-version'] = '2023-06-01';
        }

        const endpoint = provider.baseUrl.endsWith('/v1') ? `${provider.baseUrl}/chat/completions` : `${provider.baseUrl}/v1/chat/completions`;
        const cloudRes = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify({ model, messages, temperature: 0.7 })
        });
        const cloudData = await cloudRes.json();
        return NextResponse.json(cloudData, { status: cloudRes.status });

    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
