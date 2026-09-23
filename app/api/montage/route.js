import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const DATA_DIR = path.join(process.cwd(), 'data');
const PROJECTS_FILE = path.join(DATA_DIR, 'montage_projects.json');
const HISTORY_FILE = path.join(DATA_DIR, 'generation_history.json');
const OUTPUTS_DIR = path.join(process.cwd(), 'public', 'outputs');

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(OUTPUTS_DIR)) {
    fs.mkdirSync(OUTPUTS_DIR, { recursive: true });
}

const BUILTIN_SFX = [
    {
        id: 'sfx_whoosh_soft',
        name: 'Whoosh Transition Doux',
        url: '/outputs/sfx_whoosh_soft.mp3',
        duration: 0.8,
        category: 'Transitions',
        color: '#3b82f6'
    },
    {
        id: 'sfx_bass_impact',
        name: 'Impact Sub-Bass Cinéma',
        url: '/outputs/sfx_bass_impact.mp3',
        duration: 1.5,
        category: 'Impacts',
        color: '#ef4444'
    },
    {
        id: 'sfx_cinema_drone',
        name: 'Drone Atmosphérique Synth',
        url: '/outputs/sfx_cinema_drone.mp3',
        duration: 8.0,
        category: 'BGM / Ambiance',
        color: '#8b5cf6'
    },
    {
        id: 'sfx_camera_click',
        name: 'Déclencheur Caméra 35mm',
        url: '/outputs/sfx_camera_click.mp3',
        duration: 0.2,
        category: 'Optique',
        color: '#f59e0b'
    }
];

function loadProjects() {
    if (!fs.existsSync(PROJECTS_FILE)) return [];
    try {
        return JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf8'));
    } catch {
        return [];
    }
}

function saveProjects(projects) {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2), 'utf8');
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list_projects';

    if (action === 'list_sfx') {
        return NextResponse.json({ ok: true, sfx: BUILTIN_SFX });
    }

    if (action === 'list_assets') {
        let history = [];
        if (fs.existsSync(HISTORY_FILE)) {
            try {
                history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
            } catch {}
        }
        let diskFiles = [];
        try {
            if (fs.existsSync(OUTPUTS_DIR)) {
                diskFiles = fs.readdirSync(OUTPUTS_DIR);
            }
        } catch {}

        const assets = [];
        const seen = new Set();

        // 1. From generation history
        for (const item of history) {
            if (item.filename && !seen.has(item.filename)) {
                seen.add(item.filename);
                const fullP = path.join(OUTPUTS_DIR, item.filename);
                if (fs.existsSync(fullP)) {
                    assets.push({
                        id: item.id || `asset_${item.filename}`,
                        name: item.prompt ? item.prompt.slice(0, 45) : item.filename,
                        filename: item.filename,
                        url: item.url || `/outputs/${item.filename}`,
                        type: item.type || (item.filename.endsWith('.mp4') ? 'video' : item.filename.endsWith('.mp3') ? 'audio' : 'image'),
                        duration: item.duration || 5.0,
                        width: item.width || 1920,
                        height: item.height || 1080,
                        modelName: item.modelName || item.model || 'Spark IA',
                        timestamp: item.timestamp || new Date().toISOString()
                    });
                }
            }
        }

        // 2. Scan remaining files in outputs
        for (const f of diskFiles) {
            if (!seen.has(f) && (f.endsWith('.mp4') || f.endsWith('.mp3') || f.endsWith('.wav') || f.endsWith('.png') || f.endsWith('.webp') || f.endsWith('.jpg'))) {
                seen.add(f);
                const ext = path.extname(f).toLowerCase();
                const type = ext === '.mp4' ? 'video' : (ext === '.mp3' || ext === '.wav') ? 'audio' : 'image';
                assets.push({
                    id: `disk_${f}`,
                    name: f,
                    filename: f,
                    url: `/outputs/${f}`,
                    type,
                    duration: type === 'video' ? 5.0 : type === 'audio' ? 15.0 : 4.0,
                    width: 1920,
                    height: 1080,
                    modelName: f.startsWith('OGA_Music') ? 'ACE-Step 1.5' : f.startsWith('OGA_Wan') ? 'Wan 2.2' : f.startsWith('OGA_LTX') ? 'LTX-2.5' : 'Studio Video',
                    timestamp: new Date().toISOString()
                });
            }
        }

        return NextResponse.json({ ok: true, assets });
    }

    if (action === 'load_project') {
        const id = searchParams.get('id');
        const projects = loadProjects();
        const project = id ? projects.find(p => p.id === id) : projects[0];
        return NextResponse.json({ ok: true, project: project || null });
    }

    if (action === 'list_projects') {
        const projects = loadProjects();
        return NextResponse.json({ ok: true, projects });
    }

    return NextResponse.json({ ok: true });
}

export async function POST(request) {
    try {
        const body = await request.json();
        const action = body.action || 'save_project';

        // 1. Save Project State
        if (action === 'save_project') {
            const projects = loadProjects();
            const projectId = body.id || `proj_${Date.now()}`;
            const projIdx = projects.findIndex(p => p.id === projectId);

            const projectData = {
                id: projectId,
                name: body.name || 'Projet Montage IA',
                duration: Number(body.duration) || 15.0,
                tracks: body.tracks || [],
                activeClipId: body.activeClipId || null,
                settings: {
                    aspect_ratio: body.settings?.aspect_ratio || '16:9',
                    resolution: body.settings?.resolution || '1920x1080',
                    fps: Number(body.settings?.fps) || 30,
                    spotlight: body.settings?.spotlight || { enabled: false, x: 50, y: 50, radius: 25 },
                    letterbox: body.settings?.letterbox ?? true,
                    grain: body.settings?.grain ?? false
                },
                updated_at: new Date().toISOString()
            };

            if (projIdx !== -1) {
                projects[projIdx] = projectData;
            } else {
                projects.unshift(projectData);
            }
            saveProjects(projects);

            return NextResponse.json({ ok: true, project: projectData });
        }

        // 2. AI Video Composition / Montage Automatique par Prompt
        if (action === 'ai_compose') {
            const prompt = (body.prompt || 'Créer une bande-annonce cinématique rythmée').trim();
            const targetDuration = Number(body.duration) || 12.0;

            // Ingest generated history assets
            let history = [];
            if (fs.existsSync(HISTORY_FILE)) {
                try {
                    history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
                } catch {}
            }

            const videoAssets = history.filter(h => h.type === 'video' || h.filename?.endsWith('.mp4'));
            const imageAssets = history.filter(h => h.type === 'image' || h.filename?.endsWith('.png') || h.filename?.endsWith('.webp') || h.filename?.endsWith('.jpg'));
            const audioAssets = history.filter(h => h.type === 'audio' || h.filename?.endsWith('.mp3') || h.filename?.endsWith('.wav'));

            // Match assets or use all available real outputs
            const availableVisuals = [...videoAssets, ...imageAssets];

            // Build tracks
            // Track 1: Subtitles / Lower Thirds
            // Track 2: Main Video (Shots)
            // Track 3: Audio 1 (Voice / Dialogue)
            // Track 4: Audio 2 (BGM & SFX)

            let currentTime = 0;
            const videoClips = [];
            const subtitleClips = [];
            const sfxClips = [];
            const voiceClips = [];

            const shotTypes = [
                { plan: 'S1 Plan d’Ensemble (Master Shot)', trans: 'fade-black', spot: false },
                { plan: 'S2 Gros Plan Dynamique (Close-Up)', trans: 'cross-dissolve', spot: true },
                { plan: 'S3 Travelling Caméra (Action Dolly)', trans: 'wipe-right', spot: false },
                { plan: 'S4 Plan Américain (Hero Framing)', trans: 'glitch', spot: true },
                { plan: 'S5 Chute & Épilogue (Outro Cut)', trans: 'fade-black', spot: false }
            ];

            const narrativeSubtitles = [
                "L'AUBE D'UNE NOUVELLE ÈRE",
                "AU CŒUR DU SAHEL CYBERNÉTIQUE",
                "LA PUISSANCE S'ÉVEILLE",
                "RIEN NE POURRA LES ARRÊTER",
                "MGP STUDIO CINEMA"
            ];

            const visualSources = availableVisuals.length > 0 ? availableVisuals : [
                { url: '/outputs/OGA_Wan22_SOTA_720p_00001.mp4', filename: 'OGA_Wan22_SOTA_720p_00001.mp4', type: 'video', modelName: 'Wan 2.2 5B FP16 HD' },
                { url: '/outputs/OGA_Wan22_SOTA_Cheetah_00001.mp4', filename: 'OGA_Wan22_SOTA_Cheetah_00001.mp4', type: 'video', modelName: 'Wan 2.2 Cheetah' },
                { url: '/outputs/OGA_H3_Test_00001.mp4', filename: 'OGA_H3_Test_00001.mp4', type: 'video', modelName: 'MiniMax H3 FL2VA NVFP4' },
                { url: '/outputs/OGA_LTX25_Test_00001_.mp4', filename: 'OGA_LTX25_Test_00001_.mp4', type: 'video', modelName: 'LTX-2.5 22B NVFP4' }
            ];

            const clipDuration = Math.max(2.0, Number((targetDuration / Math.min(4, visualSources.length)).toFixed(1)));

            for (let i = 0; i < visualSources.length && currentTime < targetDuration; i++) {
                const src = visualSources[i % visualSources.length];
                const shotMeta = shotTypes[i % shotTypes.length];
                const dur = Math.min(clipDuration, targetDuration - currentTime);

                // Video Clip on Track 2
                const clipId = `vclip_${i + 1}`;
                videoClips.push({
                    id: clipId,
                    name: `${shotMeta.plan} — ${src.modelName || src.filename}`,
                    type: src.type || 'video',
                    url: src.url,
                    filename: src.filename,
                    start: Number(currentTime.toFixed(2)),
                    duration: Number(dur.toFixed(2)),
                    speed: 1.0,
                    volume: 100,
                    transition: shotMeta.trans,
                    cameraShot: shotMeta.plan,
                    spotlight: shotMeta.spot ? { enabled: true, x: 50, y: 45, radius: 28, intensity: 0.85 } : { enabled: false },
                    color: i % 2 === 0 ? '#1e293b' : '#334155'
                });

                // Subtitle Clip on Track 1
                if (narrativeSubtitles[i]) {
                    subtitleClips.push({
                        id: `sub_${i + 1}`,
                        name: narrativeSubtitles[i],
                        text: narrativeSubtitles[i],
                        start: Number((currentTime + 0.3).toFixed(2)),
                        duration: Number(Math.max(1.2, dur - 0.5).toFixed(2)),
                        color: '#f59e0b',
                        fontSize: 28,
                        textColor: '#ffffff',
                        bgColor: 'rgba(0, 0, 0, 0.65)'
                    });
                }

                // SFX Impact or Whoosh on Track 4
                if (i > 0) {
                    sfxClips.push({
                        id: `sfx_${i}`,
                        name: i % 2 === 1 ? 'Impact Sub-Bass' : 'Whoosh Transition',
                        url: i % 2 === 1 ? '/outputs/sfx_bass_impact.mp3' : '/outputs/sfx_whoosh_soft.mp3',
                        start: Number((currentTime - 0.2).toFixed(2)),
                        duration: i % 2 === 1 ? 1.5 : 0.8,
                        color: i % 2 === 1 ? '#ef4444' : '#3b82f6',
                        volume: 85
                    });
                }

                currentTime += dur;
            }

            // Audio 1: Voiceover if available
            if (audioAssets.length > 0) {
                const voiceAsset = audioAssets[0];
                voiceClips.push({
                    id: 'voice_1',
                    name: `Voix Off — ${voiceAsset.modelName || 'Narration IA'}`,
                    url: voiceAsset.url,
                    start: 0.5,
                    duration: Math.min(Number(voiceAsset.duration) || 6.0, targetDuration - 0.5),
                    color: '#10b981',
                    volume: 100
                });
            }

            // Audio 2: Ambient Drone throughout
            sfxClips.unshift({
                id: 'sfx_drone_bgm',
                name: 'Drone Ambiance Cinéma',
                url: '/outputs/sfx_cinema_drone.mp3',
                start: 0.0,
                duration: Number(currentTime.toFixed(2)),
                color: '#8b5cf6',
                volume: 50
            });

            const assembledTracks = [
                { id: 'track_subtitles', name: 'Sous-titres & Titres (Textes)', type: 'subtitle', icon: 'type', clips: subtitleClips },
                { id: 'track_video_main', name: 'Vidéo Principale (Plans & Rushes)', type: 'video', icon: 'video', clips: videoClips },
                { id: 'track_audio_voice', name: 'Audio 1 (Voix & Dialogues)', type: 'audio', icon: 'mic', clips: voiceClips },
                { id: 'track_audio_sfx', name: 'Audio 2 (Musique BGM & Effets)', type: 'audio', icon: 'music', clips: sfxClips }
            ];

            const aiProject = {
                id: `ai_proj_${Date.now()}`,
                name: `Montage IA — ${prompt.slice(0, 32)}...`,
                prompt: prompt,
                duration: Number(currentTime.toFixed(2)),
                tracks: assembledTracks,
                activeClipId: videoClips[0]?.id || null,
                settings: {
                    aspect_ratio: '16:9',
                    resolution: '1920x1080',
                    fps: 30,
                    spotlight: { enabled: true, x: 50, y: 45, radius: 28 },
                    letterbox: true,
                    grain: true
                },
                updated_at: new Date().toISOString()
            };

            const projects = loadProjects();
            projects.unshift(aiProject);
            saveProjects(projects);

            return NextResponse.json({
                ok: true,
                project: aiProject,
                message: `Montage IA assemblé avec succès : ${videoClips.length} plans, ${subtitleClips.length} titres, ${sfxClips.length} effets sonores.`
            });
        }

        // 3. Render Timeline Composite Video via FFmpeg Native
        if (action === 'render_timeline' || action === 'render_video') {
            const tStart = Date.now();
            const tracks = body.tracks || {};
            const videoClips = tracks.video || body.clips || [];
            const audioClips = [
                ...(tracks.voice || []),
                ...(tracks.soundtrack || []),
                ...(tracks.sfx || [])
            ];
            const outFormat = body.format || 'mp4';
            const outFilename = `OGA_StudioVideo_Master_${Date.now()}.${outFormat}`;
            const outPath = path.join(OUTPUTS_DIR, outFilename);
            const fps = Number(body.fps) || 24;
            const targetRes = body.resolution || '1920x1080';
            let [w, h] = targetRes.split('x').map(n => parseInt(n));
            if (!w || !h) { w = 1920; h = 1080; }

            // Find valid video clips on disk
            const validVideoClips = videoClips.map(c => {
                let fName = c.filename || (c.url ? path.basename(c.url) : null);
                if (!fName) return null;
                const fullPath = path.join(OUTPUTS_DIR, fName);
                if (fs.existsSync(fullPath)) return { ...c, fullPath };
                const altPath = path.join(process.cwd(), 'public', c.url ? c.url.replace(/^\//, '') : '');
                if (fs.existsSync(altPath)) return { ...c, fullPath: altPath };
                return null;
            }).filter(Boolean);

            // Find valid audio clips on disk
            const validAudioClips = audioClips.map(a => {
                let fName = a.filename || (a.url ? path.basename(a.url) : null);
                if (!fName) return null;
                const fullPath = path.join(OUTPUTS_DIR, fName);
                if (fs.existsSync(fullPath)) return { ...a, fullPath };
                const altPath = path.join(process.cwd(), 'public', a.url ? a.url.replace(/^\//, '') : '');
                if (fs.existsSync(altPath)) return { ...a, fullPath: altPath };
                return null;
            }).filter(Boolean);

            let ffmpegArgs = [];
            let totalDur = 0;

            if (validVideoClips.length > 0) {
                const inputArgs = [];
                const filterInputs = [];
                validVideoClips.forEach((c, idx) => {
                    inputArgs.push('-i', c.fullPath);
                    const clipDur = Number(c.duration) || 4.0;
                    totalDur += clipDur;
                    filterInputs.push(`[${idx}:v]scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2,setsar=1,trim=0:${clipDur},setpts=PTS-STARTPTS[v${idx}];`);
                });
                const concatMap = validVideoClips.map((_, idx) => `[v${idx}]`).join('');
                let filterComplex = `${filterInputs.join('')}${concatMap}concat=n=${validVideoClips.length}:v=1:a=0[outv]`;

                let audioInputArg = [];
                let audioMap = [];
                if (validAudioClips.length > 0) {
                    const audioIdx = validVideoClips.length;
                    audioInputArg.push('-i', validAudioClips[0].fullPath);
                    audioMap = ['-map', `${audioIdx}:a`, '-c:a', 'aac', '-b:a', '192k', '-shortest'];
                }

                ffmpegArgs = [
                    ...inputArgs,
                    ...audioInputArg,
                    '-filter_complex', filterComplex,
                    '-map', '[outv]',
                    ...audioMap,
                    '-c:v', 'libx264',
                    '-preset', 'veryfast',
                    '-crf', '20',
                    '-pix_fmt', 'yuv420p',
                    '-r', String(fps),
                    '-y',
                    outPath
                ];
            } else {
                // Fallback generator if video sources are non-video images or missing
                totalDur = 10.0;
                let audioInput = [];
                if (validAudioClips.length > 0) {
                    audioInput = ['-i', validAudioClips[0].fullPath, '-map', '1:a', '-c:a', 'aac', '-shortest'];
                }
                ffmpegArgs = [
                    '-f', 'lavfi',
                    '-i', `testsrc=size=${w}x${h}:rate=${fps}:duration=${totalDur}`,
                    ...audioInput,
                    '-c:v', 'libx264',
                    '-pix_fmt', 'yuv420p',
                    '-y',
                    outPath
                ];
            }

            console.log('[MontageAPI] Running Studio Video ffmpeg render:', ffmpegArgs.join(' '));
            await execFileAsync('/usr/bin/ffmpeg', ffmpegArgs);

            const genDuration = Number(((Date.now() - tStart) / 1000).toFixed(2));

            // Record to generation_history.json
            let history = [];
            if (fs.existsSync(HISTORY_FILE)) {
                try {
                    history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
                } catch {}
            }

            const historyItem = {
                id: `studio_video_${Date.now()}`,
                type: 'video',
                mode: 'video',
                prompt: body.projectName || 'Export Studio Video Master UHD',
                model: 'ffmpeg-studio-video',
                modelName: 'Studio Video NLE Master',
                provider: 'Studio Video',
                url: `/outputs/${outFilename}`,
                filename: outFilename,
                width: w,
                height: h,
                fps,
                duration: totalDur,
                timestamp: new Date().toISOString(),
                metrics: {
                    generationTimeSeconds: genDuration,
                    computeDevice: 'CPU / FFmpeg 6.1 (Multi-Threaded H.264 Encoder)',
                    resolution: `${w}x${h}`
                }
            };

            history.unshift(historyItem);
            fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf8');

            return NextResponse.json({
                ok: true,
                url: `/outputs/${outFilename}`,
                filename: outFilename,
                duration: totalDur,
                metrics: historyItem.metrics
            });
        }

        return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 });
    } catch (err) {
        console.error('[MontageAPI Error]:', err);
        return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
    }
}
