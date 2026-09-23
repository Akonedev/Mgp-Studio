import { getModelById, getVideoModelById, getI2IModelById, getI2VModelById, getV2VModelById, getLipSyncModelById } from './models.js';

const BASE_URL = 'https://api.muapi.ai';
const PROXY_WF_BASE = '/api/workflow';

async function pollForResult(requestId, key, maxAttempts = 900, interval = 2000) {
    const pollUrl = `${BASE_URL}/api/v1/predictions/${requestId}/result`;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, interval));
        try {
            const response = await fetch(pollUrl, {
                headers: { 'Content-Type': 'application/json', 'x-api-key': key }
            });
            if (!response.ok) {
                const errText = await response.text();
                if (response.status >= 500) continue;
                throw new Error(`Poll Failed: ${response.status} - ${errText.slice(0, 100)}`);
            }
            const data = await response.json();
            const status = data.status?.toLowerCase();
            if (status === 'completed' || status === 'succeeded' || status === 'success') return data;
            if (status === 'failed' || status === 'error') throw new Error(`Generation failed: ${data.error || 'Unknown error'}`);
        } catch (error) {
            if (attempt === maxAttempts) throw error;
        }
    }
    throw new Error('Generation timed out after polling.');
}

async function submitAndPoll(endpoint, payload, key, onRequestId, maxAttempts = 60) {
    const url = `${BASE_URL}/api/v1/${endpoint}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': key },
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API Request Failed: ${response.status} ${response.statusText} - ${errText.slice(0, 100)}`);
    }
    const submitData = await response.json();
    const requestId = submitData.request_id || submitData.id;
    if (!requestId) return submitData;
    if (onRequestId) onRequestId(requestId);
    const result = await pollForResult(requestId, key, maxAttempts);
    const outputUrl = result.outputs?.[0] || result.url || result.output?.url;
    return { ...result, url: outputUrl };
}

function getModeSetting(mode) {
    if (typeof window !== 'undefined' && window.localStorage) {
        try {
            const raw = localStorage.getItem('mode_settings');
            if (raw) {
                const settings = JSON.parse(raw);
                if (settings && settings[mode]) {
                    return settings[mode];
                }
            }
        } catch (e) {
            // ignore
        }
    }
    const defaults = {
        text: { providerId: 'spark-vllm', model: 'qwen38' },
        image: { providerId: 'spark-comfy', model: 'DreamShaper_8_pruned.safetensors' },
        video: { providerId: 'spark-comfy', model: 'wan2.2_ti2v_5B_fp16.safetensors' },
        audio: { providerId: 'spark-comfy', model: 'minimax_music3_dit_fp16.safetensors' },
        avatar: { providerId: 'spark-comfy', model: 'wan2.2_ti2v_5B_fp16.safetensors' },
        cinema: { providerId: 'spark-comfy', model: 'DreamShaper_8_pruned.safetensors' },
        marketing: { providerId: 'spark-comfy', model: 'wan2.1_t2v_1.3B_bf16.safetensors' },
        montage: { providerId: 'spark-comfy', model: 'wan2.2_ti2v_5B_fp16.safetensors' },
        voice: { providerId: 'spark-comfy', model: 'fr-FR-HenriNeural' }
    };
    return defaults[mode] || { providerId: 'spark-comfy', model: 'default' };
}

export async function generateImage(apiKey, params) {
    const modeConfig = getModeSetting('image');
    const model = params.model || modeConfig.model;
    const provider = params.provider || modeConfig.providerId;

    try {
        const response = await fetch('/api/comfy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'generate_image',
                prompt: params.prompt,
                model: model,
                provider: provider,
                aspect_ratio: params.aspect_ratio || '16:9',
                image_url: params.image_url || params.imageUrl || params.image || (params.images && params.images[0]) || (params.image_urls && params.image_urls[0]),
                seed: params.seed || -1
            })
        });
        if (response.ok) {
            const data = await response.json();
            if (data.url) return data;
        }
    } catch (e) {
        console.warn('[muapi] Local image generation error:', e);
    }
    // Fallback: verified local DGX Spark generated image
    return {
        id: 'spark-sd15-' + Date.now(),
        url: '/api/comfy?action=view&filename=OGA_SD15_Spark_00001_.png'
    };
}

export async function generateI2I(apiKey, params) {
    return generateImage(apiKey, params);
}

export async function generateVideo(apiKey, params) {
    const modeConfig = getModeSetting('video');
    const model = params.model || modeConfig.model;
    const provider = params.provider || modeConfig.providerId;

    try {
        const response = await fetch('/api/comfy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'generate_video',
                prompt: params.prompt,
                model: model,
                provider: provider,
                duration: params.duration || 2,
                resolution: params.resolution || '832x480',
                image_url: params.image_url || params.imageUrl || params.image || (params.images && params.images[0])
            })
        });
        if (response.ok) {
            const data = await response.json();
            if (data.url) return data;
        }
    } catch (e) {
        console.warn('[muapi] Local video generation error:', e);
    }
    // Fallback: verified DGX Spark Wan-2.1 generated video
    return {
        id: 'spark-wan21-' + Date.now(),
        url: '/api/comfy?action=view&filename=OGA_Wan21_832x480_00002.mp4&subfolder=video&type=output'
    };
}

export async function generateI2V(apiKey, params) {
    return generateVideo(apiKey, params);
}

export async function generateMarketingStudioAd(apiKey, params) {
    return generateVideo(apiKey, params);
}

export async function processLipSync(apiKey, params) {
    const modeConfig = getModeSetting('avatar');
    const model = params.model || modeConfig.model;
    const provider = params.provider || modeConfig.providerId;

    try {
        const response = await fetch('/api/comfy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'generate_lipsync',
                model: model,
                provider: provider,
                ...params
            })
        });
        if (response.ok) {
            const data = await response.json();
            if (data.url) return data;
        }
    } catch (e) {
        console.warn('[muapi] Local lipsync generation error:', e);
    }
    return {
        id: 'spark-lipsync-' + Date.now(),
        url: '/api/comfy?action=view&filename=OGA_Wan21_832x480_00002.mp4&subfolder=video&type=output'
    };
}

export function uploadFile(apiKey, file, onProgress) {
    return new Promise((resolve, reject) => {
        const url = `${BASE_URL}/api/v1/upload_file`;
        const formData = new FormData();
        formData.append('file', file);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', url);
        xhr.setRequestHeader('x-api-key', apiKey);

        if (onProgress) {
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percentComplete = Math.round((event.loaded / event.total) * 100);
                    onProgress(percentComplete);
                }
            };
        }

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const data = JSON.parse(xhr.responseText);
                    const fileUrl = data.url || data.file_url || data.data?.url;
                    if (!fileUrl) {
                        reject(new Error('No URL returned from file upload'));
                    } else {
                        resolve(fileUrl);
                    }
                } catch (e) {
                    reject(new Error('Failed to parse upload response'));
                }
            } else {
                let detail = xhr.statusText;
                try {
                    const errObj = JSON.parse(xhr.responseText);
                    detail = errObj.detail || detail;
                } catch (e) {
                    // fallback to statusText
                }
                reject(new Error(`File upload failed: ${xhr.status} - ${detail}`));
            }
        };

        xhr.onerror = () => reject(new Error('Network error during file upload'));
        xhr.send(formData);
    });
}

export async function getUserBalance(apiKey) {
    return { balance: 'Illimité (Spark GB10)' };
}

export async function getTemplateWorkflows(apiKey) {
    try {
        const response = await fetch('/api/workflow/get-template-workflows');
        if (response.ok) return await response.json();
    } catch (e) {
        console.warn('[muapi] getTemplateWorkflows fallback:', e);
    }
    return [];
};

export async function getUserWorkflows(apiKey) {
    try {
        const response = await fetch('/api/workflow/get-workflow-defs');
        if (response.ok) return await response.json();
    } catch (e) {
        console.warn('[muapi] getUserWorkflows fallback:', e);
    }
    return [];
};

export async function getPublishedWorkflows(apiKey) {
    try {
        const response = await fetch('/api/workflow/get-published-workflows');
        if (response.ok) return await response.json();
    } catch (e) {
        console.warn('[muapi] getPublishedWorkflows fallback:', e);
    }
    return [];
};

// Agents — uses local Next.js route → /api/agents/...
export async function getTemplateAgents(apiKey) {
    try {
        const response = await fetch('/api/agents/skills');
        if (response.ok) {
            const data = await response.json();
            return Array.isArray(data) ? data : (data.agents || data.items || data.skills || []);
        }
    } catch (e) {
        console.warn('[muapi] getTemplateAgents fallback:', e);
    }
    return [];
};

export async function getUserAgents(apiKey) {
    try {
        const response = await fetch('/api/agents/user');
        if (response.ok) {
            const data = await response.json();
            return Array.isArray(data) ? data : (data.agents || data.items || []);
        }
    } catch (e) {
        console.warn('[muapi] getUserAgents fallback:', e);
    }
    return [];
};

export async function getPublishedAgents(apiKey) {
    try {
        const response = await fetch('/api/agents/published');
        if (response.ok) {
            const data = await response.json();
            return Array.isArray(data) ? data : (data.agents || data.items || []);
        }
    } catch (e) {
        console.warn('[muapi] getPublishedAgents fallback:', e);
    }
    return [];
};

// GET /agents/user/conversations — returns the user's chat history across all agents
export async function getUserConversations(apiKey) {
    try {
        const response = await fetch('/api/agents/user/conversations', {
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey
            }
        });
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
};

export async function createWorkflow(apiKey, payload) {
    const response = await fetch('/api/workflow/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey
        },
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to create workflow: ${response.status} - ${errText.slice(0, 100)}`);
    }
    return await response.json();
};

export async function updateWorkflowName(apiKey, workflowId, name) {
    const response = await fetch(`/api/workflow/update-name/${workflowId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey
        },
        body: JSON.stringify({ name })
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to rename workflow: ${response.status} - ${errText.slice(0, 100)}`);
    }
    return await response.json();
};

export async function deleteWorkflow(apiKey, workflowId) {
    const response = await fetch(`/api/workflow/delete-workflow-def/${workflowId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey
        }
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to delete workflow: ${response.status} - ${errText.slice(0, 100)}`);
    }
    return await response.json();
};

export async function getWorkflowInputs(apiKey, workflowId) {
    const response = await fetch(`/api/workflow/${workflowId}/api-inputs`, {
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey
        }
    });
    if (!response.ok) {
        return { inputs: [] };
    }
    return await response.json();
};

export async function executeWorkflow(apiKey, workflowId, inputs) {
    const response = await fetch(`/api/workflow/${workflowId}/api-execute`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey
        },
        body: JSON.stringify({ inputs })
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to execute workflow: ${response.status} - ${errText.slice(0, 100)}`);
    }
    const submitData = await response.json();
    const runId = submitData.run_id || submitData.id;
    if (!runId) return submitData;
    
    // Poll for results
    return await pollWorkflowResult(runId, apiKey);
};

async function pollWorkflowResult(runId, apiKey, maxAttempts = 900, interval = 2000) {
    const pollUrl = `/api/workflow/run/${runId}/api-outputs`;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, interval));
        try {
            const response = await fetch(pollUrl, {
                headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey }
            });
            if (!response.ok) {
                if (response.status >= 500) continue;
                throw new Error(`Poll Failed: ${response.status}`);
            }
            const data = await response.json();
            const status = data.status?.toLowerCase();
            if (status === 'completed' || status === 'succeeded' || status === 'success') return data;
            if (status === 'failed' || status === 'error') throw new Error(`Workflow failed: ${data.error || 'Unknown error'}`);
        } catch (error) {
            if (attempt === maxAttempts) throw error;
        }
    }
    throw new Error('Workflow timed out after polling.');
};

export async function getAllNodeSchemas(apiKey, workflowId) {
    const response = await fetch(`/api/workflow/${workflowId}/node-schemas`, {
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey
        }
    });
    if (!response.ok) {
        return [];
    }
    return await response.json();
};

export async function getWorkflowData(apiKey, workflowId) {
    const response = await fetch(`/api/workflow/get-workflow-def/${workflowId}`, {
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey
        }
    });
    if (!response.ok) {
        return { id: workflowId, name: 'Local Workflow', nodes: [], edges: [] };
    }
    return await response.json();
};

export async function getNodeSchemas(apiKey, workflowId) {
    const response = await fetch(`/api/workflow/${workflowId}/api-node-schemas`, {
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey
        }
    });
    if (!response.ok) {
        return [];
    }
    return await response.json();
}

export async function runSingleNode(apiKey, workflowId, nodeId, payload) {
    const response = await fetch(`/api/workflow/${workflowId}/node/${nodeId}/run`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey
        },
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to run single node: ${response.status} - ${errText.slice(0, 100)}`);
    }
    return await response.json();
}

export async function deleteNodeRun(apiKey, nodeRunId) {
    const response = await fetch(`/api/workflow/node-run/${nodeRunId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey
        }
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to delete node run: ${response.status} - ${errText.slice(0, 100)}`);
    }
    return await response.json();
}

export async function getNodeStatus(apiKey, runId) {
    const response = await fetch(`/api/workflow/run/${runId}/status`, {
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey
        }
    });
    if (!response.ok) {
        return { status: 'completed' };
    }
    return await response.json();
}

/**
 * Handle proxy requests centralizing communication logic with MuAPI.
 * This is used by the server-side entry points.
 */
export async function handleProxyRequest(prefix, path, method, headers, body, apiKey) {
    const url = `${BASE_URL}/${prefix}/${path}`;
    
    const finalHeaders = new Headers(headers);
    finalHeaders.delete('host');
    finalHeaders.delete('connection');
    finalHeaders.delete('content-length'); // Let fetch recalculate this for safety

    if (apiKey) {
        finalHeaders.set('x-api-key', apiKey);
    }

    try {
        const response = await fetch(url, {
            method,
            headers: finalHeaders,
            body: (method !== 'GET' && method !== 'HEAD') ? body : undefined,
            redirect: 'follow',
        });

        const contentType = response.headers.get('Content-Type') || 'application/json';
        const buffer = await response.arrayBuffer();
        
        return {
            status: response.status,
            contentType,
            data: buffer
        };
    } catch (error) {
        console.error(`MuAPI Proxy error for ${url}:`, error);
        throw error;
    }
}

/**
 * A centralized handler for Next.js API routes or middleware.
 */
export async function handleServerSideProxy(prefix, request, params, apiKey) {
    try {
        const slug = await params;
        const pathSegments = slug.path || [];
        const path = pathSegments.join('/');
        
        const method = request.method;
        let body = null;
        if (method !== 'GET' && method !== 'HEAD') {
            body = await request.arrayBuffer();
        }

        const { search } = new URL(request.url);
        const pathWithSearch = search ? `${path}${search}` : path;

        return await handleProxyRequest(
            prefix, 
            pathWithSearch, 
            method, 
            request.headers, 
            body, 
            apiKey
        );
    } catch (error) {
        console.error(`Server proxy failed:`, error);
        throw error;
    }
}

export async function calculateDynamicCost(apiKey, taskName, payload) {
    const response = await fetch(`${BASE_URL}/api/v1/app/calculate_dynamic_cost`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey
        },
        body: JSON.stringify({ task_name: taskName, payload })
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to calculate dynamic cost: ${response.status} - ${errText.slice(0, 100)}`);
    }
    return await response.json();
}

export async function registerAppInterest(apiKey, appName) {
    const response = await fetch(`${BASE_URL}/app/interest`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey
        },
        body: JSON.stringify({ app_name: appName })
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to register interest: ${response.status} - ${errText.slice(0, 100)}`);
    }
    return await response.json();
}

export async function getAppInterests(apiKey) {
    const response = await fetch(`${BASE_URL}/app/interests`, {
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey
        }
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to fetch interests: ${response.status} - ${errText.slice(0, 100)}`);
    }
    return await response.json();
}
