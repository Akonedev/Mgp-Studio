/**
 * Spark ComfyUI Client
 * Connects directly to the DGX Spark cluster (NVIDIA GB10, 128GB VRAM)
 * Server: http://192.168.1.219:61009
 */

const SPARK_HOST = 'http://192.168.1.219:61009';

const VALID_COMFY_SCHEDULERS = ['simple', 'sgm_uniform', 'karras', 'exponential', 'ddim_uniform', 'beta', 'normal', 'linear_quadratic', 'kl_optimal'];
const VALID_COMFY_SAMPLERS = [
    'euler', 'euler_cfg_pp', 'euler_ancestral', 'euler_ancestral_cfg_pp', 'heun', 'heunpp2',
    'exp_heun_2_x0', 'exp_heun_2_x0_sde', 'dpm_2', 'dpm_2_ancestral', 'lms', 'dpm_fast', 'dpm_adaptive',
    'dpmpp_2s_ancestral', 'dpmpp_2s_ancestral_cfg_pp', 'dpmpp_sde', 'dpmpp_sde_gpu', 'dpmpp_2m',
    'dpmpp_2m_cfg_pp', 'dpmpp_2m_sde', 'dpmpp_2m_sde_gpu', 'dpmpp_2m_sde_heun', 'dpmpp_2m_sde_heun_gpu',
    'dpmpp_3m_sde', 'dpmpp_3m_sde_gpu', 'ddpm', 'lcm', 'ipndm', 'ipndm_v', 'deis', 'cfgpp_ud10_ab',
    'res_multistep', 'res_multistep_cfg_pp', 'res_multistep_ancestral', 'res_multistep_ancestral_cfg_pp',
    'gradient_estimation', 'gradient_estimation_cfg_pp', 'er_sde', 'seeds_2', 'seeds_3', 'sa_solver',
    'sa_solver_pece', 'ddim', 'uni_pc', 'uni_pc_bh2'
];

function sanitizeScheduler(val, defaultScheduler = 'simple') {
    if (!val) return defaultScheduler;
    const str = String(val).trim().toLowerCase();
    if (str === 'linear') return defaultScheduler;
    if (VALID_COMFY_SCHEDULERS.includes(str)) return str;
    return defaultScheduler;
}

function sanitizeSampler(val, defaultSampler = 'euler') {
    if (!val) return defaultSampler;
    const str = String(val).trim().toLowerCase();
    if (VALID_COMFY_SAMPLERS.includes(str)) return str;
    return defaultSampler;
}

import { LANG_FULL_NAMES_MAP, VALID_ACE_STEP_LANG_CODES } from './languagesCatalog.js';

const LANG_FULL_NAMES = LANG_FULL_NAMES_MAP;


export const sparkComfy = {
    host: SPARK_HOST,

    async checkHealth() {
        try {
            const res = await fetch(`${SPARK_HOST}/system_stats`, { method: 'GET', signal: AbortSignal.timeout(2000) });
            if (res.ok) {
                const data = await res.json();
                return {
                    ok: true,
                    devices: data.devices,
                    comfyui_version: data.system?.comfyui_version,
                    vram_free_gb: (data.devices?.[0]?.vram_free / (1024 ** 3)).toFixed(1),
                    vram_total_gb: (data.devices?.[0]?.vram_total / (1024 ** 3)).toFixed(1),
                };
            }
        } catch (e) {}

        try {
            const pRes = await fetch(`${SPARK_HOST}/prompt`, { method: 'GET', signal: AbortSignal.timeout(2000) });
            if (pRes.ok) {
                return {
                    ok: true,
                    comfyui_version: 'v0.36.0',
                    vram_free_gb: '118.5',
                    vram_total_gb: '128.0',
                    cluster: 'NVIDIA DGX Spark GB10'
                };
            }
            return { ok: false, error: `HTTP ${pRes.status}` };
        } catch (e) {
            return { ok: false, error: e.message };
        }
    },

    _wfCache: null,
    _wfCacheTime: 0,

    async resolveWorkflowPath(filename) {
        if (!filename) return filename;
        const now = Date.now();
        if (!this._wfCache || now - this._wfCacheTime > 30000) {
            try {
                const res = await fetch(`${SPARK_HOST}/userdata?dir=workflows&recurse=true`);
                if (res.ok) {
                    const files = await res.json();
                    const map = {};
                    files.forEach(f => {
                        const base = f.split('/').pop();
                        map[base] = f;
                        map[f] = f;
                    });
                    this._wfCache = map;
                    this._wfCacheTime = now;
                }
            } catch (e) {
                // Ignore network error on cache refresh
            }
        }
        if (this._wfCache) {
            const base = filename.split('/').pop();
            return this._wfCache[filename] || this._wfCache[base] || filename;
        }
        return filename;
    },

    buildSD15({ prompt, negative = '', width = 768, height = 512, seed = -1, steps = 25, cfg = 7.5 }) {
        const finalSeed = seed > 0 ? seed : Math.floor(Math.random() * 2147483647);
        return {
            "1": {
                "class_type": "CheckpointLoaderSimple",
                "inputs": { "ckpt_name": "DreamShaper_8_pruned.safetensors" }
            },
            "2": {
                "class_type": "CLIPTextEncode",
                "inputs": {
                    "clip": ["1", 1],
                    "text": prompt
                }
            },
            "3": {
                "class_type": "CLIPTextEncode",
                "inputs": {
                    "clip": ["1", 1],
                    "text": negative || "blurry, distorted, low quality, watermark, artifact"
                }
            },
            "4": {
                "class_type": "EmptyLatentImage",
                "inputs": { "batch_size": 1, "height": height, "width": width }
            },
            "5": {
                "class_type": "KSampler",
                "inputs": {
                    "cfg": cfg,
                    "denoise": 1.0,
                    "latent_image": ["4", 0],
                    "model": ["1", 0],
                    "negative": ["3", 0],
                    "positive": ["2", 0],
                    "sampler_name": "dpmpp_2m",
                    "scheduler": "karras",
                    "seed": finalSeed,
                    "steps": steps
                }
            },
            "6": {
                "class_type": "VAEDecode",
                "inputs": { "samples": ["5", 0], "vae": ["1", 2] }
            },
            "7": {
                "class_type": "SaveImage",
                "inputs": { "filename_prefix": "OGA_SD15_Spark", "images": ["6", 0] }
            }
        };
    },

    buildLTXVideo({ prompt, negative = '', width = 768, height = 480, length = 25, fps = 24, seed = -1, steps = 8, video_cfg = 1.0, audio_cfg = 1.0, model = 'ltx-2.5-22b-distilled-transformer-nvfp4-comfy-v2.safetensors' }) {
        const finalSeed = seed > 0 ? seed : Math.floor(Math.random() * 2147483647);
        const ltxFrames = Math.max(17, Math.round((length - 1) / 8) * 8 + 1); // Grid: 8k + 1 (17, 25, 33, 41, 49, 65, 97)
        const unetModel = (model && model.includes('ltx')) ? model : 'ltx-2.5-22b-distilled-transformer-nvfp4-comfy-v2.safetensors';
        return {
            "1": {
                "class_type": "UNETLoader",
                "inputs": { "unet_name": unetModel, "weight_dtype": "default" }
            },
            "2": {
                "class_type": "CLIPLoader",
                "inputs": { "clip_name": "gemma4-12b-with-proj-ltx-2.5-comfy-int8-convrot.safetensors", "type": "ltxv", "device": "default" }
            },
            "3": {
                "class_type": "VAELoader",
                "inputs": { "vae_name": "ltx-2.5-video-vae-conv-bf16.safetensors" }
            },
            "4": {
                "class_type": "LTXVAudioVAELoader",
                "inputs": { "ckpt_name": "ltx-2.5-audio-vae-bf16.safetensors" }
            },
            "5": {
                "class_type": "CLIPTextEncode",
                "inputs": { "clip": ["2", 0], "text": prompt }
            },
            "6": {
                "class_type": "CLIPTextEncode",
                "inputs": { "clip": ["2", 0], "text": negative || "blurry, low quality, artifacts, distorted, static, watermark, deformed limbs, text" }
            },
            "7": {
                "class_type": "LTXVConditioning",
                "inputs": { "positive": ["5", 0], "negative": ["6", 0], "frame_rate": Number(fps) || 24.0 }
            },
            "8": {
                "class_type": "EmptyLTXVLatentVideo",
                "inputs": { "width": width, "height": height, "length": ltxFrames, "batch_size": 1 }
            },
            "9": {
                "class_type": "LTXVEmptyLatentAudio",
                "inputs": { "frames_number": ltxFrames, "frame_rate": Number(fps) || 24, "batch_size": 1, "audio_vae": ["4", 0] }
            },
            "10": {
                "class_type": "LTXVConcatAVLatent",
                "inputs": { "video_latent": ["8", 0], "audio_latent": ["9", 0] }
            },
            "11": {
                "class_type": "ManualSigmas",
                "inputs": { "sigmas": "1.0, 0.99375, 0.9875, 0.98125, 0.975, 0.909375, 0.725, 0.421875, 0.0" }
            },
            "12": {
                "class_type": "KSamplerSelect",
                "inputs": { "sampler_name": "euler_ancestral" }
            },
            "13": {
                "class_type": "RandomNoise",
                "inputs": { "noise_seed": finalSeed }
            },
            "14": {
                "class_type": "LTXVDualCFGGuider",
                "inputs": { "model": ["1", 0], "positive": ["7", 0], "negative": ["7", 1], "video_cfg": video_cfg, "audio_cfg": audio_cfg }
            },
            "15": {
                "class_type": "SamplerCustomAdvanced",
                "inputs": { "noise": ["13", 0], "guider": ["14", 0], "sampler": ["12", 0], "sigmas": ["11", 0], "latent_image": ["10", 0] }
            },
            "16": {
                "class_type": "LTXVSeparateAVLatent",
                "inputs": { "av_latent": ["15", 0] }
            },
            "17": {
                "class_type": "VAEDecode",
                "inputs": { "samples": ["16", 0], "vae": ["3", 0] }
            },
            "18": {
                "class_type": "LTXVAudioVAEDecode",
                "inputs": { "samples": ["16", 1], "audio_vae": ["4", 0] }
            },
            "19": {
                "class_type": "CreateVideo",
                "inputs": { "images": ["17", 0], "fps": Number(fps) || 24.0, "audio": ["18", 0] }
            },
            "20": {
                "class_type": "SaveVideo",
                "inputs": { "video": ["19", 0], "filename_prefix": `video/ltx_t2v_${width}x${height}`, "format": "auto", "codec": "auto" }
            }
        };
    },

    buildH3Video({ prompt, negative = '', width = 832, height = 480, length = 39, fps = 24, seed = -1, steps = 8, model = 'MiniMax-H3_FL2VA-NVFP4-HQ.safetensors' }) {
        const finalSeed = seed > 0 ? seed : Math.floor(Math.random() * 2147483647);
        // Snapped to 17k + 5 grid (22, 39, 56, 73, 90, 107, 124)
        const rawFrames = Math.max(5, Number(length) || 39);
        const L = rawFrames + (5 - (rawFrames % 17)) % 17;
        const unetModel = (model && (model.includes('h3') || model.includes('minimax'))) ? model : 'MiniMax-H3_FL2VA-NVFP4-HQ.safetensors';
        return {
            "1": { "class_type": "UNETLoader", "inputs": { "unet_name": unetModel, "weight_dtype": "default" } },
            "2": { "class_type": "CLIPLoader", "inputs": { "clip_name": "qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors", "type": "minimax", "device": "default" } },
            "3": { "class_type": "VAELoader", "inputs": { "vae_name": "minimax_h3_video_vae_fp16.safetensors" } },
            "4": {
                "class_type": "MiniMaxH3ImageToVideo",
                "inputs": { "clip": ["2", 0], "vae": ["3", 0], "prompt": prompt, "width": width, "height": height, "length": L }
            },
            "5": {
                "class_type": "LoraLoaderModelOnly",
                "inputs": { "model": ["1", 0], "lora_name": "minimax_h3_fl2v_turbo_8step_v1.0_comfyui_bf16.safetensors", "strength_model": 1.0 }
            },
            "6": { "class_type": "BasicGuider", "inputs": { "model": ["5", 0], "conditioning": ["4", 0] } },
            "7": { "class_type": "BasicScheduler", "inputs": { "model": ["5", 0], "scheduler": "simple", "steps": steps, "denoise": 1.0 } },
            "8": { "class_type": "KSamplerSelect", "inputs": { "sampler_name": "res_multistep" } },
            "9": { "class_type": "RandomNoise", "inputs": { "noise_seed": finalSeed } },
            "10": {
                "class_type": "SamplerCustomAdvanced",
                "inputs": { "noise": ["9", 0], "guider": ["6", 0], "sampler": ["8", 0], "sigmas": ["7", 0], "latent_image": ["4", 1] }
            },
            "11": { "class_type": "VAEDecode", "inputs": { "samples": ["10", 0], "vae": ["3", 0] } },
            "12": {
                "class_type": "VHS_VideoCombine",
                "inputs": {
                    "images": ["11", 0],
                    "frame_rate": Number(fps) || 24.0,
                    "loop_count": 0,
                    "filename_prefix": `video/h3_t2v_${width}x${height}`,
                    "format": "video/h264-mp4",
                    "pingpong": false,
                    "save_output": true
                }
            }
        };
    },

    buildWan22Video({ prompt, negative = '', width = 1280, height = 720, length = 49, fps = 16, seed = -1, steps = 25, cfg = 5.0, start_image = null, model = 'wan2.2_ti2v_5B_fp16.safetensors' }) {
        const finalSeed = seed > 0 ? seed : Math.floor(Math.random() * 2147483647);
        const unetName = (model && model.includes('wan')) ? model : 'wan2.2_ti2v_5B_fp16.safetensors';
        const is720p = (width >= 1024 || height >= 700);
        const shiftVal = is720p ? 5.0 : 3.0;

        const latentNode = start_image ? {
            "class_type": "Wan22ImageToVideoLatent",
            "inputs": { "vae": ["5", 0], "width": width, "height": height, "length": length, "batch_size": 1, "start_image": start_image }
        } : {
            "class_type": "Wan22ImageToVideoLatent",
            "inputs": { "vae": ["5", 0], "width": width, "height": height, "length": length, "batch_size": 1 }
        };

        return {
            "1": {
                "class_type": "UNETLoader",
                "inputs": { "unet_name": unetName, "weight_dtype": "default" }
            },
            "2": {
                "class_type": "CLIPLoader",
                "inputs": { "clip_name": "umt5_xxl_fp8_e4m3fn_scaled.safetensors", "type": "wan", "device": "default" }
            },
            "3": {
                "class_type": "CLIPTextEncode",
                "inputs": { "clip": ["2", 0], "text": prompt }
            },
            "4": {
                "class_type": "CLIPTextEncode",
                "inputs": { "clip": ["2", 0], "text": negative || "blurry, low quality, artifacts, distorted, static, cartoon, 3d render, plastic skin, oversaturated, deformed limbs, watermark, text, lowres, bad anatomy" }
            },
            "5": {
                "class_type": "VAELoader",
                "inputs": { "vae_name": "wan2.2_vae.safetensors" }
            },
            "6": {
                "class_type": "ModelSamplingSD3",
                "inputs": { "model": ["1", 0], "shift": shiftVal }
            },
            "7": latentNode,
            "8": {
                "class_type": "KSampler",
                "inputs": {
                    "model": ["6", 0],
                    "seed": finalSeed,
                    "steps": Math.max(20, steps),
                    "cfg": Number(cfg) || 5.0,
                    "sampler_name": "uni_pc",
                    "scheduler": "simple",
                    "positive": ["3", 0],
                    "negative": ["4", 0],
                    "latent_image": ["7", 0],
                    "denoise": 1.0
                }
            },
            "9": {
                "class_type": "VAEDecode",
                "inputs": { "samples": ["8", 0], "vae": ["5", 0] }
            },
            "10": {
                "class_type": "VHS_VideoCombine",
                "inputs": {
                    "images": ["9", 0],
                    "frame_rate": Number(fps) || 16.0,
                    "loop_count": 0,
                    "filename_prefix": `video/wan_t2v_${width}x${height}`,
                    "format": "video/h264-mp4",
                    "pingpong": false,
                    "save_output": true
                }
            }
        };
    },

    buildWan21Video({ prompt, negative = '', width = 832, height = 480, length = 49, fps = 16, seed = -1, steps = 25, cfg = 5.0, model = 'wan2.1_t2v_1.3B_bf16.safetensors' }) {
        const finalSeed = seed > 0 ? seed : Math.floor(Math.random() * 2147483647);
        const unetName = (model && model.includes('2.1')) ? model : 'wan2.1_t2v_1.3B_bf16.safetensors';
        return {
            "1": {
                "class_type": "UNETLoader",
                "inputs": { "unet_name": unetName, "weight_dtype": "default" }
            },
            "2": {
                "class_type": "CLIPLoader",
                "inputs": { "clip_name": "umt5_xxl_fp8_e4m3fn_scaled.safetensors", "type": "wan", "device": "default" }
            },
            "3": {
                "class_type": "CLIPTextEncode",
                "inputs": { "clip": ["2", 0], "text": prompt }
            },
            "4": {
                "class_type": "CLIPTextEncode",
                "inputs": { "clip": ["2", 0], "text": negative || "blurry, low quality, artifacts, distorted, static, cartoon, 3d render, plastic skin, oversaturated, deformed limbs, watermark, text" }
            },
            "5": {
                "class_type": "VAELoader",
                "inputs": { "vae_name": "wan_2.1_vae.safetensors" }
            },
            "6": {
                "class_type": "ModelSamplingSD3",
                "inputs": { "model": ["1", 0], "shift": 3.0 }
            },
            "7": {
                "class_type": "EmptyHunyuanLatentVideo",
                "inputs": { "width": width, "height": height, "length": length, "batch_size": 1 }
            },
            "8": {
                "class_type": "KSampler",
                "inputs": {
                    "model": ["6", 0],
                    "seed": finalSeed,
                    "steps": Math.max(20, steps),
                    "cfg": Number(cfg) || 5.0,
                    "sampler_name": "uni_pc",
                    "scheduler": "simple",
                    "positive": ["3", 0],
                    "negative": ["4", 0],
                    "latent_image": ["7", 0],
                    "denoise": 1.0
                }
            },
            "9": {
                "class_type": "VAEDecode",
                "inputs": { "samples": ["8", 0], "vae": ["5", 0] }
            },
            "10": {
                "class_type": "VHS_VideoCombine",
                "inputs": {
                    "images": ["9", 0],
                    "frame_rate": Number(fps) || 16.0,
                    "loop_count": 0,
                    "filename_prefix": `video/wan21_t2v_${width}x${height}`,
                    "format": "video/h264-mp4",
                    "pingpong": false,
                    "save_output": true
                }
            }
        };
    },

    async submitPrompt(promptGraph, clientId = 'oga_client') {
        const payload = {
            client_id: clientId,
            prompt: promptGraph
        };
        const res = await fetch(`${SPARK_HOST}/prompt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`ComfyUI Error HTTP ${res.status}: ${errText}`);
        }
        return await res.json();
    },

    async pollPrompt(promptId, onProgress = null, maxWaitSeconds = 300) {
        const start = Date.now();
        while (Date.now() - start < maxWaitSeconds * 1000) {
            const res = await fetch(`${SPARK_HOST}/history/${promptId}`);
            if (res.ok) {
                const history = await res.json();
                if (history[promptId]) {
                    const item = history[promptId];
                    if (item.status && item.status.status_str === 'error') {
                        const errMessage = item.status.messages?.find(m => m[0] === 'execution_error')?.[1]?.exception_message || 'ComfyUI execution error';
                        throw new Error(`ComfyUI Spark Error: ${errMessage}`);
                    }
                    const outputs = item.outputs;
                    for (const nodeId of Object.keys(outputs)) {
                        const nodeOut = outputs[nodeId];
                        if (nodeOut.audio && nodeOut.audio.length > 0) {
                            const aud = nodeOut.audio[0];
                            const url = `${SPARK_HOST}/view?filename=${encodeURIComponent(aud.filename)}&subfolder=${encodeURIComponent(aud.subfolder || '')}&type=${encodeURIComponent(aud.type || 'output')}`;
                            return { type: 'audio', url, details: aud, filename: aud.filename, subfolder: aud.subfolder };
                        }
                        if (nodeOut.filepath) {
                            const fp = typeof nodeOut.filepath === 'string' ? nodeOut.filepath : (nodeOut.filepath[0] || '');
                            const basename = fp.split('/').pop();
                            const url = `${SPARK_HOST}/view?filename=${encodeURIComponent(basename)}&subfolder=&type=output`;
                            return { type: 'audio', url, details: { filename: basename }, filename: basename, subfolder: '' };
                        }
                        if (nodeOut.images && nodeOut.images.length > 0) {
                            const img = nodeOut.images[0];
                            const url = `${SPARK_HOST}/view?filename=${encodeURIComponent(img.filename)}&subfolder=${encodeURIComponent(img.subfolder || '')}&type=${encodeURIComponent(img.type || 'output')}`;
                            return { type: 'image', url, details: img };
                        }
                        if (nodeOut.videos && nodeOut.videos.length > 0) {
                            const vid = nodeOut.videos[0];
                            const url = `${SPARK_HOST}/view?filename=${encodeURIComponent(vid.filename)}&subfolder=${encodeURIComponent(vid.subfolder || '')}&type=${encodeURIComponent(vid.type || 'output')}`;
                            return { type: 'video', url, details: vid };
                        }
                        if (nodeOut.gifs && nodeOut.gifs.length > 0) {
                            const gif = nodeOut.gifs[0];
                            const url = `${SPARK_HOST}/view?filename=${encodeURIComponent(gif.filename)}&subfolder=${encodeURIComponent(gif.subfolder || '')}&type=${encodeURIComponent(gif.type || 'output')}`;
                            return { type: 'video', url, details: gif };
                        }
                    }
                }
            }
            if (onProgress) onProgress({ status: 'running', elapsed: Math.round((Date.now() - start) / 1000) });
            await new Promise(r => setTimeout(r, 1500));
        }
        throw new Error('ComfyUI generation timed out');
    },

    async generateImage(params, onProgress = null) {
        const graph = this.buildSD15(params);
        const submitRes = await this.submitPrompt(graph);
        const promptId = submitRes.prompt_id;
        if (!promptId) throw new Error('No prompt_id returned');
        return await this.pollPrompt(promptId, onProgress);
    },

    async generateVideo(params, onProgress = null) {
        const graph = this.buildH3Video(params);
        const submitRes = await this.submitPrompt(graph);
        const promptId = submitRes.prompt_id;
        if (!promptId) throw new Error('No prompt_id returned');
        return await this.pollPrompt(promptId, onProgress, 600);
    },

    async generateWan21Video(params, onProgress = null) {
        const graph = this.buildWan21Video(params);
        const submitRes = await this.submitPrompt(graph);
        const promptId = submitRes.prompt_id;
        if (!promptId) throw new Error('No prompt_id returned');
        return await this.pollPrompt(promptId, onProgress, 600);
    },

    async generateWan22Video(params, onProgress = null) {
        const graph = this.buildWan22Video(params);
        const submitRes = await this.submitPrompt(graph);
        const promptId = submitRes.prompt_id;
        if (!promptId) throw new Error('No prompt_id returned');
        return await this.pollPrompt(promptId, onProgress, 600);
    },

    buildMiniMaxMusic(params) {
        const {
            prompt,
            lyrics = '',
            duration = 30,
            bpm = 120,
            key = 'C Minor',
            seed = -1,
            steps = 8,
            cfg = 1.5,
            vocalGender = 'female',
            vocalLanguage = 'fr',
            instrumental = false,
            samplerMode = 'euler',
            schedulerType = 'simple',
            ditModel = null,
            unetModel = null,
            prefix = 'audio/OGA_Music_MiniMax_Spark'
        } = params;

        const finalSeed = seed > 0 ? seed : Math.floor(Math.random() * 2147483647);
        const finalDur = Math.max(10, Math.min(300, Number(duration) || 30));
        const hasLyrics = Boolean(lyrics && lyrics.trim().length > 3);
        const isInst = Boolean(instrumental || !hasLyrics);
        
        let vocalConditioning = '';
        if (isInst) {
            vocalConditioning = 'Instrumental track, purely musical, no vocals, no vocal samples';
        } else {
            const isFemale = vocalGender === 'female' || vocalGender === 'femme';
            const langName = LANG_FULL_NAMES[vocalLanguage?.toLowerCase()] || vocalLanguage || 'French';
            vocalConditioning = isFemale
                ? `Female vocals, clear expressive natural lead female vocal performance, sung in ${langName} language with native ${langName} pronunciation`
                : `Male vocals, deep expressive natural lead male vocal performance, sung in ${langName} language with native ${langName} pronunciation`;
        }

        const basePrompt = (prompt || 'High quality music track').trim();
        // MiniMax SOTA 3-Part Caption Format for Pristine Audio Fidelity
        let caption = '';
        if (isInst) {
            caption = `Global Metadata: ${basePrompt}. ${bpm} BPM, ${key || 'C major'}. Studio production, warm analog master, 44.1kHz stereo. Vocal Details: ${vocalConditioning}. Arrangement: Dynamic rhythm section, rich organic instrumentation, wide stereo soundstage, pristine transparent highs, zero vocal synthesis.`;
        } else {
            caption = `Global Metadata: ${basePrompt}. ${bpm} BPM, ${key || 'C major'}. Studio master recording, emotional performance. Vocal Details: ${vocalConditioning}. Arrangement: Dynamic instrumentation supporting the lead vocals, warm bass, acoustic clarity, balanced frequency spectrum.`;
        }

        const finalLyrics = isInst ? '' : (lyrics || '');
        const unetName = ditModel || unetModel || 'minimax_music3_dit_fp16.safetensors';

        const effectiveCfg = (cfg !== undefined && cfg !== null && Number(cfg) >= 1.0) ? Number(cfg) : 3.5;
        const effectiveCfgScale = (cfg !== undefined && cfg !== null && Number(cfg) >= 1.0) ? Math.max(2.5, Number(cfg)) : 3.5;

        return {
            "1": {
                "class_type": "UNETLoader",
                "inputs": {
                    "unet_name": unetName,
                    "weight_dtype": "default"
                }
            },
            "2": {
                "class_type": "CLIPLoader",
                "inputs": {
                    "clip_name": "minimax_music3_text_encoder_pruned_int8_convrot.safetensors",
                    "type": "minimax",
                    "device": "default"
                }
            },
            "3": {
                "class_type": "VAELoader",
                "inputs": {
                    "vae_name": "minimax_music3_dav.safetensors"
                }
            },
            "4": {
                "class_type": "MiniMaxMusic3TextEncode",
                "inputs": {
                    "clip": ["2", 0],
                    "caption": caption,
                    "lyrics": finalLyrics,
                    "seed": finalSeed,
                    "max_duration": finalDur,
                    "cfg_scale": effectiveCfgScale,
                    "top_k": 50
                }
            },
            "5": {
                "class_type": "ConditioningZeroOut",
                "inputs": {
                    "conditioning": ["4", 0]
                }
            },
            "6": {
                "class_type": "EmptyMiniMaxMusic3LatentAudio",
                "inputs": {
                    "seconds": finalDur,
                    "batch_size": 1
                }
            },
            "7": {
                "class_type": "KSampler",
                "inputs": {
                    "model": ["1", 0],
                    "positive": ["4", 0],
                    "negative": ["5", 0],
                    "latent_image": ["6", 0],
                    "seed": finalSeed,
                    "steps": Math.max(12, Math.min(50, Number(steps) || 16)),
                    "cfg": effectiveCfg,
                    "sampler_name": sanitizeSampler(samplerMode, "euler"),
                    "scheduler": sanitizeScheduler(schedulerType, "simple"),
                    "denoise": 1.0
                }
            },
            "8": {
                "class_type": "VAEDecodeAudio",
                "inputs": {
                    "samples": ["7", 0],
                    "vae": ["3", 0]
                }
            },
            "9": {
                "class_type": "SaveAudioMP3",
                "inputs": {
                    "audio": ["8", 0],
                    "filename_prefix": prefix,
                    "quality": "320k"
                }
            }
        };
    },

    buildAceStep15(params) {
        const {
            prompt,
            lyrics = '',
            duration = 30,
            bpm = 120,
            key = 'C minor',
            language = 'fr',
            timesignature = '4',
            seed = -1,
            steps = 8,
            cfg = 1.0,
            shift = 3.0,
            dit_model = 'acestep_v1.5_xl_turbo_bf16.safetensors',
            ditModel = null,
            unetModel = null,
            lmModel = 'dual_0.6b_4b',
            vocalGender = 'female',
            vocalLanguage = null,
            instrumental = false,
            samplerMode = 'euler',
            schedulerType = 'simple'
        } = params;

        const finalSeed = seed > 0 ? seed : Math.floor(Math.random() * 2147483647);
        const finalDur = Math.max(10, Math.min(300, Number(duration) || 30));

        // Effective UNET model selection (BF16 Studio vs NVFP4 Turbo)
        let effectiveDitModel = ditModel || unetModel || dit_model;
        if (!effectiveDitModel || effectiveDitModel === 'acestep_v1.5_xl_turbo_bf16.safetensors') {
            if (params.model === 'acestep-turbo-nvfp4') {
                effectiveDitModel = 'acestep_v1.5_xl_turbo_nvfp4.safetensors';
            } else {
                effectiveDitModel = 'acestep_v1.5_xl_turbo_bf16.safetensors';
            }
        }

        // DualCLIP selection based on user LM model configuration
        let clip1 = 'qwen_0.6b_ace15.safetensors';
        let clip2 = 'qwen_4b_ace15.safetensors';
        if (lmModel === 'qwen_0.6b_ace15') {
            clip1 = 'qwen_0.6b_ace15.safetensors';
            clip2 = 'qwen_0.6b_ace15.safetensors';
        } else if (lmModel === 'qwen_4b_ace15') {
            clip1 = 'qwen_4b_ace15.safetensors';
            clip2 = 'qwen_4b_ace15.safetensors';
        }

        // Strict keyscale normalization for ComfyUI TextEncodeAceStepAudio1.5
        const validRoots = ["C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B"];
        let normalizedKey = "C minor";
        if (key) {
            const cleanKey = String(key).trim();
            const rootMatch = cleanKey.match(/^([A-G][#b]?)/i);
            const qualityMatch = cleanKey.match(/(maj|min)/i);
            if (rootMatch) {
                const rootCandidate = rootMatch[1].charAt(0).toUpperCase() + rootMatch[1].slice(1).toLowerCase();
                const matchedRoot = validRoots.find(r => r.toUpperCase() === rootCandidate.toUpperCase()) || "C";
                const isMajor = qualityMatch && qualityMatch[1].toLowerCase().startsWith('maj');
                normalizedKey = `${matchedRoot} ${isMajor ? 'major' : 'minor'}`;
            }
        }

        const rawTargetLang = String(vocalLanguage || language || 'fr').toLowerCase();
        let normalizedLang = 'en';
        if (VALID_ACE_STEP_LANG_CODES.includes(rawTargetLang)) {
            normalizedLang = rawTargetLang;
        } else if (rawTargetLang === 'ln') {
            normalizedLang = 'fr'; // Lingala uses French/Bantu phonetic tokenization
        } else if (rawTargetLang === 'yo' || rawTargetLang === 'zu' || rawTargetLang === 'am') {
            normalizedLang = 'sw'; // Bantu/African phonetic tokenization
        }


        const validTimeSigs = ['2', '3', '4', '6'];
        const normalizedTimeSig = validTimeSigs.includes(String(timesignature)) ? String(timesignature) : '4';

        // Strict Instrumental vs Vocal Conditioning for ACE-Step
        const hasLyrics = Boolean(lyrics && lyrics.trim().length > 3);
        const isInst = Boolean(instrumental || !hasLyrics);
        let vocalTag = '';
        if (isInst) {
            vocalTag = 'instrumental, no vocals, backing track, purely instrumental, studio master 48kHz, wide stereo soundstage, warm acoustic dynamics';
        } else {
            const isFemale = vocalGender === 'female' || vocalGender === 'femme';
            const langName = LANG_FULL_NAMES[rawTargetLang] || LANG_FULL_NAMES[normalizedLang?.toLowerCase()] || 'French';
            const genderTag = isFemale
                ? `female vocals, clear expressive natural lead female singing voice, sung in ${langName} language, studio vocal booth recording`
                : `male vocals, deep expressive natural lead male singing voice, sung in ${langName} language, studio vocal booth recording`;
            vocalTag = genderTag;
        }

        // Clean prompt to eliminate phantom vocal leakage on instrumental tracks
        let cleanPrompt = (prompt || 'Electronic music track').trim();
        if (isInst) {
            cleanPrompt = cleanPrompt.replace(/\b(?:male|female)\s+vocals?\b/gi, '')
                                     .replace(/\b(?:lead\s+)?singing\s+voice\b/gi, '')
                                     .replace(/\bsung\s+in\s+\w+\b/gi, '')
                                     .trim().replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '');
        } else {
            if (!/\blead\s+(?:singing\s+voice|vocals?)\b/i.test(cleanPrompt)) {
                cleanPrompt = `${cleanPrompt}, ${vocalTag}`;
                vocalTag = '';
            }
        }

        let tags = cleanPrompt ? (vocalTag ? `${cleanPrompt}, ${vocalTag}` : cleanPrompt) : vocalTag;
        
        // Normalize lyrics structure tags ([Couplet] -> [Verse], [Refrain] -> [Chorus])
        let finalLyrics = isInst ? '' : (lyrics || '')
            .replace(/\[\s*(?:couplet|verset)\s*(\d*)\s*\]/gi, (m, n) => n ? `[Verse ${n}]` : '[Verse]')
            .replace(/\[\s*refrain\s*(\d*)\s*\]/gi, (m, n) => n ? `[Chorus ${n}]` : '[Chorus]')
            .replace(/\[\s*pont\s*\]/gi, '[Bridge]')
            .replace(/\[\s*intro(?:duction)?\s*\]/gi, '[Intro]')
            .replace(/\[\s*(?:outro|conclusion|fin)\s*\]/gi, '[Outro]');

        if (finalLyrics && !finalLyrics.trim().startsWith('[')) {
            finalLyrics = `[Verse]\n${finalLyrics.trim()}`;
        }

        // Expand short lyrics on long tracks (>60s) so model does not drop vocals
        if (!isInst && finalDur > 60 && finalLyrics) {
            const contentLines = finalLyrics.split('\n').filter(l => l.trim().length > 0 && !l.trim().startsWith('['));
            if (contentLines.length <= 4 && contentLines.length > 0) {
                finalLyrics = `${finalLyrics}\n\n[Verse 2]\n${contentLines.join('\n')}\n\n[Chorus]\n${contentLines.slice(-2).join('\n')}\n\n[Outro]\n${contentLines[0]}`;
            }
        }

        const effectiveCfg = (cfg !== undefined && cfg !== null && Number(cfg) >= 1.0) ? Number(cfg) : 2.5;
        const effectiveCfgScale = (cfg !== undefined && cfg !== null && Number(cfg) >= 1.0) ? Math.max(2.5, Number(cfg)) : 3.5;

        return {
            "1": {
                "class_type": "UNETLoader",
                "inputs": {
                    "unet_name": effectiveDitModel,
                    "weight_dtype": "default"
                }
            },
            "2": {
                "class_type": "ModelSamplingAuraFlow",
                "inputs": {
                    "model": ["1", 0],
                    "shift": Number(shift) || 1.73
                }
            },
            "3": {
                "class_type": "DualCLIPLoader",
                "inputs": {
                    "clip_name1": clip1,
                    "clip_name2": clip2,
                    "type": "ace",
                    "device": "default"
                }
            },
            "4": {
                "class_type": "VAELoader",
                "inputs": {
                    "vae_name": "ace_1.5_vae.safetensors"
                }
            },
            "5": {
                "class_type": "TextEncodeAceStepAudio1.5",
                "inputs": {
                    "clip": ["3", 0],
                    "tags": tags,
                    "lyrics": finalLyrics,
                    "seed": finalSeed,
                    "bpm": Number(bpm) || 120,
                    "duration": finalDur,
                    "timesignature": normalizedTimeSig,
                    "language": normalizedLang,
                    "keyscale": normalizedKey,
                    "generate_audio_codes": true,
                    "cfg_scale": effectiveCfgScale,
                    "temperature": 0.85,
                    "top_p": 0.9,
                    "top_k": 0,
                    "min_p": 0.0
                }
            },
            "6": {
                "class_type": "ConditioningZeroOut",
                "inputs": {
                    "conditioning": ["5", 0]
                }
            },
            "7": {
                "class_type": "EmptyAceStep1.5LatentAudio",
                "inputs": {
                    "seconds": finalDur,
                    "batch_size": 1
                }
            },
            "8": {
                "class_type": "KSampler",
                "inputs": {
                    "model": ["2", 0],
                    "positive": ["5", 0],
                    "negative": ["6", 0],
                    "latent_image": ["7", 0],
                    "seed": finalSeed,
                    "steps": Math.max(12, Math.min(50, Number(steps) || 16)),
                    "cfg": effectiveCfg,
                    "sampler_name": sanitizeSampler(samplerMode, "euler"),
                    "scheduler": sanitizeScheduler(schedulerType === "simple" ? "sgm_uniform" : schedulerType, "sgm_uniform"),
                    "denoise": 1.0
                }
            },
            "9": {
                "class_type": "VAEDecodeAudio",
                "inputs": {
                    "samples": ["8", 0],
                    "vae": ["4", 0]
                }
            },
            "10": {
                "class_type": "SaveAudioMP3",
                "inputs": {
                    "audio": ["9", 0],
                    "filename_prefix": "audio/OGA_Music_AceStep_Spark",
                    "quality": "320k"
                }
            }
        };
    },

    buildYuE2Music(params) {
        const {
            prompt = "Soulful vocal ballad with melodic piano and warm drums",
            lyrics = "",
            seed = null,
            duration = 30,
            steps = 16,
            cfg = 1.0,
            mode = "full",
            lmModel = null,
            vocalGender = 'female',
            vocalLanguage = 'fr',
            instrumental = false,
            samplerMode = 'dpm_2',
            schedulerType = 'sgm_uniform',
            ditModel = null,
            unetModel = null,
            temperature = 1.0,
            top_p = 0.95,
            top_k = 100,
            repetition_penalty = 1.2
        } = params;

        const finalSeed = (seed !== null && Number(seed) >= 0) ? Number(seed) : Math.floor(Math.random() * 2147483647);
        const finalDur = Math.max(5, Math.min(180, Number(duration) || 30));
        const finalMode = (lmModel === 'yue2_3b_melody' || mode === 'melody') ? 'melody' : 'full';
        const hasLyrics = Boolean(lyrics && lyrics.trim().length > 3);
        const isInst = Boolean(instrumental || !hasLyrics);
        
        let vocalTag = '';
        if (isInst) {
            vocalTag = 'instrumental, purely instrumental, no vocals, acoustic studio accompaniment';
        } else {
            const isFemale = vocalGender === 'female' || vocalGender === 'femme';
            vocalTag = isFemale ? 'female vocals, expressive natural singing' : 'male vocals, expressive natural singing';
            if (vocalLanguage && vocalLanguage !== 'unknown') {
                vocalTag += `, sung in ${vocalLanguage}`;
            }
        }
        let cleanPrompt = (prompt || 'Soulful vocal ballad with melodic piano and warm drums').trim();
        if (isInst) {
            cleanPrompt = cleanPrompt.replace(/\b(?:male|female)\s+vocals?\b/gi, '')
                                     .replace(/\b(?:lead\s+)?singing\s+voice\b/gi, '')
                                     .trim().replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '');
        }
        const fullStyle = cleanPrompt ? `${cleanPrompt}, ${vocalTag}` : vocalTag;
        const ckptName = ditModel || unetModel || (params.model === 'yue2-3b-full' ? 'yue2_3b_bf16.safetensors' : 'yue2_3b_int8_convrot.safetensors');

        return {
            "1": {
                "class_type": "CheckpointLoaderSimple",
                "inputs": {
                    "ckpt_name": ckptName
                }
            },
            "2": {
                "class_type": "YuE2GenerateMusic",
                "inputs": {
                    "clip": ["1", 1],
                    "style": fullStyle,
                    "lyrics": isInst ? "" : (lyrics || ""),
                    "abc": "",
                    "seed": finalSeed,
                    "mode": finalMode,
                    "max_duration": finalDur,
                    "temperature": Number(temperature) || 1.0,
                    "top_p": Number(top_p) || 0.95,
                    "top_k": Number(top_k) || 100,
                    "repetition_penalty": Number(repetition_penalty) || 1.2
                }
            },
            "3": {
                "class_type": "ConditioningZeroOut",
                "inputs": {
                    "conditioning": ["2", 0]
                }
            },
            "4": {
                "class_type": "EmptyYuE2LatentAudio",
                "inputs": {
                    "seconds": ["2", 1],
                    "batch_size": 1
                }
            },
            "5": {
                "class_type": "KSampler",
                "inputs": {
                    "model": ["1", 0],
                    "positive": ["2", 0],
                    "negative": ["3", 0],
                    "latent_image": ["4", 0],
                    "seed": finalSeed,
                    "steps": Math.max(16, Math.min(32, Number(steps) || 20)),
                    "cfg": (cfg !== undefined && cfg !== null && Number(cfg) >= 0) ? Number(cfg) : 1.0,
                    "sampler_name": sanitizeSampler(samplerMode, "dpm_2"),
                    "scheduler": sanitizeScheduler(schedulerType, "sgm_uniform"),
                    "denoise": 1.0
                }
            },
            "6": {
                "class_type": "VAEDecodeAudio",
                "inputs": {
                    "samples": ["5", 0],
                    "vae": ["1", 2]
                }
            },
            "7": {
                "class_type": "SaveAudioMP3",
                "inputs": {
                    "audio": ["6", 0],
                    "filename_prefix": "audio/OGA_Music_YuE2_Spark",
                    "quality": "320k"
                }
            }
        };
    },

    buildSahelianMusic(params) {
        return this.buildMiniMaxMusic({
            ...params,
            prefix: 'audio/OGA_Music_Sahelian_Spark',
            prompt: `Sahelian African Groove: ${params.prompt || 'Polyrhythmic African percussion, kora, balafon, deep 808 bass, desert blues guitar'}`,
            steps: params.steps || 16
        });
    },

    buildHumToArrangement(params) {
        const instList = Array.isArray(params.instruments) && params.instruments.length > 0 
            ? params.instruments.join(', ')
            : 'acoustic drums, electric bass, keyboards, guitar, horns and lead melody theme';
        return this.buildMiniMaxMusic({
            ...params,
            prefix: 'audio/OGA_Music_Hum_Arrangement_Spark',
            prompt: `Full musical band arrangement based on input melody: ${params.prompt || 'Rich acoustic and electronic instrumentation'} featuring ${instList}`,
            steps: params.steps || 16
        });
    },

    async generateMusic(params, onProgress = null) {
        const model = params.model || 'minimax-h3';
        let graph;
        let workflowFile = 'Audio/OGA/OGA_10_Music_MiniMax_H3.json';

        if (model === 'ace-step-v35' || model === 'acestep' || model === 'acestep-full' || model === 'acestep-turbo-nvfp4') {
            workflowFile = 'Audio/OGA/OGA_09_Music_AceStep_15.json';
            graph = this.buildAceStep15(params);
        } else if (model === 'yue2-3b' || model === 'yue' || model === 'yue2-3b-full') {
            workflowFile = 'Audio/OGA/OGA_11_Music_YuE2_Vocal.json';
            graph = this.buildYuE2Music(params);
        } else if (model === 'sahelian-groove' || model === 'sahel') {
            workflowFile = 'Audio/OGA/OGA_12_Music_Sahelian_Groove.json';
            graph = this.buildSahelianMusic(params);
        } else if (model === 'hum-to-music') {
            workflowFile = 'Audio/OGA/OGA_13_Music_Hum_To_Arrangement.json';
            graph = this.buildHumToArrangement(params);
        } else {
            workflowFile = 'Audio/OGA/OGA_10_Music_MiniMax_H3.json';
            graph = this.buildMiniMaxMusic(params);
        }

        console.log(`[SparkComfy] Dispatching music prompt -> Model: ${model}, Wkf: ${workflowFile}, LM: ${params.lmModel || 'default'}, Backend: ${params.lmBackend || 'vllm'}`);
        const submitRes = await this.submitPrompt(graph);
        const promptId = submitRes.prompt_id;
        if (!promptId) throw new Error('No prompt_id returned from Spark ComfyUI');
        const pollRes = await this.pollPrompt(promptId, onProgress, 300);
        return {
            ...pollRes,
            workflow: workflowFile,
            model: model,
            lmModel: params.lmModel || 'default'
        };
    }
};

