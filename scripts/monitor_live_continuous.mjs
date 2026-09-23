import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const SPARK_COMFY_URL = 'http://192.168.1.219:61009';
const OUTPUTS_DIR = path.resolve(process.cwd(), 'public/outputs');
const HISTORY_FILE = path.resolve(process.cwd(), 'data/music_history.json');

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function getInitialWatermark() {
    try {
        const res = await fetch(`${SPARK_COMFY_URL}/history`);
        const h = await res.json();
        return new Set(Object.keys(h));
    } catch (e) {
        return new Set();
    }
}

async function runMonitor() {
    console.log('===============================================================');
    console.log('🎧 SURVEILLANCE ACTIVE CONTINUE — NOUVEAUX TESTS UI');
    console.log(`- ComfyUI DGX Spark: ${SPARK_COMFY_URL}`);
    console.log(`- Dossier outputs: ${OUTPUTS_DIR}`);
    console.log('Prêt et en écoute permanente...');
    console.log('===============================================================\n');

    const knownPromptIds = await getInitialWatermark();
    const initialFiles = new Set(fs.existsSync(OUTPUTS_DIR) ? fs.readdirSync(OUTPUTS_DIR) : []);
    let lastSeenId = null;

    while (true) {
        // 1. Vérifier la queue ComfyUI (si une tâche est en cours)
        try {
            const queueRes = await fetch(`${SPARK_COMFY_URL}/queue`);
            if (queueRes.ok) {
                const q = await queueRes.json();
                const running = q.queue_running || [];
                if (running.length > 0) {
                    const activeTask = running[0];
                    const activeId = activeTask[1];
                    if (!knownPromptIds.has(activeId) && lastSeenId !== activeId) {
                        lastSeenId = activeId;
                        console.log(`\n🚀 [DETECTE EN COURS] Nouvelle exécution lancée sur DGX Spark !`);
                        console.log(`- Prompt ID: ${activeId}`);
                        const promptDetails = activeTask[2];
                        if (promptDetails) inspectPromptNodes(promptDetails);
                    }
                }
            }
        } catch (e) {}

        // 2. Vérifier l'historique ComfyUI (tâche terminée)
        try {
            const histRes = await fetch(`${SPARK_COMFY_URL}/history`);
            if (histRes.ok) {
                const h = await histRes.json();
                for (const pid of Object.keys(h)) {
                    if (!knownPromptIds.has(pid)) {
                        knownPromptIds.add(pid);
                        console.log(`\n✅ [TERMINE SUR COMFYUI] Exécution terminée: ${pid}`);
                        const item = h[pid];
                        if (item && item.prompt) {
                            inspectPromptNodes(item.prompt[2]);
                        }
                    }
                }
            }
        } catch (e) {}

        // 3. Vérifier les nouveaux fichiers dans public/outputs
        if (fs.existsSync(OUTPUTS_DIR)) {
            const currentFiles = fs.readdirSync(OUTPUTS_DIR);
            for (const f of currentFiles) {
                if (!initialFiles.has(f) && f.endsWith('.mp3')) {
                    initialFiles.add(f);
                    const detectedFile = path.join(OUTPUTS_DIR, f);
                    console.log(`\n📁 [NOUVEAU FICHIER AUDIO DETECTE]: ${detectedFile}`);
                    analyzeAudio(detectedFile);
                }
            }
        }

        await sleep(600);
    }
}

function inspectPromptNodes(nodes) {
    console.log('\n🔍 [PARAMETRES ENVOYES AU MODELE]:');
    const ksampler = nodes['8']?.inputs;
    const textEnc = nodes['5']?.inputs;
    const unet = nodes['1']?.inputs;
    const aura = nodes['2']?.inputs;

    if (unet) console.log(`- Modèle DiT: ${unet.unet_name}`);
    if (aura) console.log(`- AuraFlow Shift: ${aura.shift}`);
    if (ksampler) {
        console.log(`- KSampler CFG: ${ksampler.cfg}`);
        console.log(`- KSampler Pas (Steps): ${ksampler.steps}`);
        console.log(`- Sampler: ${ksampler.sampler_name} | Scheduler: ${ksampler.scheduler}`);
        console.log(`- Seed: ${ksampler.seed}`);
    }
    if (textEnc) {
        console.log(`- TextEncode CFG Scale: ${textEnc.cfg_scale}`);
        console.log(`- Langue: ${textEnc.language}`);
        console.log(`- Temperature: ${textEnc.temperature} | top_p: ${textEnc.top_p}`);
        console.log(`- Tags envoyés: "${textEnc.tags}"`);
        console.log(`- Paroles: "${textEnc.lyrics ? textEnc.lyrics.slice(0, 100) + '...' : '(Instrumental / Vide)'}"`);
    }
}

function analyzeAudio(filePath) {
    console.log(`\n📊 [ANALYSE ACOUSTIQUE FFmpeg]:`);
    try {
        const stat = fs.statSync(filePath);
        console.log(`- Taille: ${(stat.size / 1024).toFixed(1)} KB`);

        const volOutput = execSync(`ffmpeg -i "${filePath}" -af "volumedetect" -f null /dev/null 2>&1`, { encoding: 'utf-8' });
        const maxVol = volOutput.match(/max_volume:\s+([-\d.]+)\s+dB/);
        const meanVol = volOutput.match(/mean_volume:\s+([-\d.]+)\s+dB/);
        console.log(`- Max Volume: ${maxVol ? maxVol[1] + ' dB' : 'N/A'}`);
        console.log(`- Mean Volume: ${meanVol ? meanVol[1] + ' dB' : 'N/A'}`);

        const astatsOutput = execSync(`ffmpeg -i "${filePath}" -af "astats" -f null /dev/null 2>&1`, { encoding: 'utf-8' });
        const zeroCrossings = astatsOutput.match(/Zero crossings:\s+(\d+)/);
        const flatFactor = astatsOutput.match(/Flat factor:\s+([-\d.]+)/);
        const rmsMatch = astatsOutput.match(/RMS level dB:\s+([-\d.]+)/);
        console.log(`- Passages par zéro: ${zeroCrossings ? zeroCrossings[1] : 'N/A'}`);
        console.log(`- RMS: ${rmsMatch ? rmsMatch[1] + ' dB' : 'N/A'}`);
        console.log(`- Facteur de platitude: ${flatFactor ? flatFactor[1] : 'N/A'}`);
    } catch (e) {
        console.log('Erreur analyse ffmpeg:', e.message);
    }
}

runMonitor().catch(console.error);
