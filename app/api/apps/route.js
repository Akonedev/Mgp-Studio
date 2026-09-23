import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

const INSTALLED_FILE = path.join(process.cwd(), 'data', 'installed_apps.json');
const APPS_DIR = path.join(process.cwd(), 'data', 'installed_apps');
const WORKFLOWS_FILE = path.join(process.cwd(), 'data', 'local_workflows.json');
const HISTORY_FILE = path.join(process.cwd(), 'data', 'generation_history.json');
const OUTPUTS_DIR = path.join(process.cwd(), 'public', 'outputs');

const SPARK_COMFY_HOST = 'http://192.168.1.219:61009';
const SPARK_VLLM_HOST = 'http://192.168.1.219:61005';

// Master Apps Registry with real GitHub repositories and metadata
export const APPS_REGISTRY = [
  {
    id: "ai-headshot-generator",
    name: "AI Headshot Studio",
    tagline: "Générateur de portraits professionnels et Corporate packs",
    description: "SaaS complet de génération de portraits professionnels, headshots LinkedIn, photos de profil studio et corporate. Raccordé au cluster DGX Spark.",
    category: "Portraits & Avatars",
    icon: "FaUserTie",
    color: "blue",
    repo: "https://github.com/SamurAIGPT/ai-headshot-generator",
    hosted: "https://ai-headshot-generator-xi.vercel.app/",
    thumbnail: "https://cdn.muapi.ai/apps/d9c39378f60e48098f6b6ce657dc18b5.png",
    stars: 142,
    port: 58110,
    mediaType: "image",
    defaultStyle: "corporate",
    styles: [
      { id: "corporate", name: "Corporate Executive", prompt: "professional corporate headshot, suit and tie, crisp studio lighting, 8k uhd, sharp focus, 35mm photograph" },
      { id: "linkedin", name: "LinkedIn Pro", prompt: "clean modern business portrait, friendly expression, soft office background blur, bokeh, photorealistic" },
      { id: "creative", name: "Creative Studio", prompt: "artistic headshot, dramatic rim lighting, dark stylish background, high fashion photography, hyperrealistic" },
      { id: "doctor", name: "Medical / Doctor", prompt: "professional medical doctor portrait, white coat, confident warm smile, modern clinic background, photorealistic" }
    ],
    sparkWorkflow: "OGA_01_Image_SD15_DreamShaper.json"
  },
  {
    id: "nano-banana-generator",
    name: "Nano Banana Studio",
    tagline: "Studio de création d'images IA photoréalistes et artistiques",
    description: "Plateforme complète de génération d'images avec styles, ratios multiples et optimisation de prompts. Exécution locale ultra-rapide sur Grace Blackwell GB10.",
    category: "Génération d'Images",
    icon: "FaHandSparkles",
    color: "amber",
    repo: "https://github.com/SamurAIGPT/nano-banana-generator",
    hosted: "https://nano-banana-generator-psi.vercel.app",
    thumbnail: "https://cdn.muapi.ai/data/2/874086171651/Screenshot_2026-04-15_103743.png",
    stars: 88,
    port: 58111,
    mediaType: "image",
    defaultStyle: "cinematic",
    styles: [
      { id: "cinematic", name: "Cinématique 8k", prompt: "cinematic film still, 35mm photograph, anamorphic lens flare, master lighting, highly detailed" },
      { id: "anime", name: "Anime Makoto Shinkai", prompt: "masterpiece anime artwork, vibrant colors, beautiful sky, high detailed, Makoto Shinkai style" },
      { id: "concept_art", name: "Art Conceptuel Cyberpunk", prompt: "cyberpunk concept art, neon reflections, futuristic tech, octane render, trending on artstation" },
      { id: "photography", name: "Photographie National Geographic", prompt: "award winning national geographic photo, 8k resolution, documentary shot, authentic details" }
    ],
    sparkWorkflow: "OGA_01_Image_SD15_DreamShaper.json"
  },
  {
    id: "seedance-2-generator",
    name: "Seedance V2 Studio",
    tagline: "Studio vidéo IA génératif et multi-références",
    description: "Suite vidéo texte-vers-vidéo et image-vers-vidéo haute définition. Dérivé vers le moteur Wan 2.2 TI2V et LTX 2.5 sur DGX Spark GB10.",
    category: "Vidéos & Motion",
    icon: "FaVideo",
    color: "purple",
    repo: "https://github.com/SamurAIGPT/seedance-2-generator",
    hosted: "https://seedance-2-generator.vercel.app/",
    thumbnail: "https://cdn.muapi.ai/apps/4cd1f49d48934d448e7f493f9d5e476e.png",
    stars: 176,
    port: 58112,
    mediaType: "video",
    defaultStyle: "wan22_action",
    styles: [
      { id: "wan22_action", name: "Mouvement Fluide Wan 2.2", prompt: "smooth high framerate cinematic shot, dynamic camera movement, photorealistic, 16fps" },
      { id: "drone_shot", name: "Drone Aérien 4k", prompt: "sweeping aerial drone shot, landscape view, ultra wide angle, cinematic lighting" },
      { id: "slow_motion", name: "Slow Motion Studio", prompt: "slow motion 120fps capture, water splash, studio lighting, hyper detailed, 4k" }
    ],
    sparkWorkflow: "OGA_06_Video_Wan22_TI2V.json"
  },
  {
    id: "ai-clipping-generator",
    name: "AI Clipping Studio",
    tagline: "Découpage automatique de Shorts, Reels et TikToks",
    description: "Découpage intelligent de vidéos longues avec extraction de highlights, sous-titrage automatique et format vertical 9:16 pour viralité.",
    category: "Vidéos & Motion",
    icon: "FaVideo",
    color: "emerald",
    repo: "https://github.com/SamurAIGPT/ai-clipping-generator",
    hosted: "https://ai-clipping-generator.vercel.app/",
    thumbnail: "https://cdn.muapi.ai/data/2/883345778103/cca8b5bb-25f1-40fe-928e-53dce2c8c928.png",
    stars: 215,
    port: 58113,
    mediaType: "video",
    defaultStyle: "viral_short",
    styles: [
      { id: "viral_short", name: "Format Vertical 9:16 Viral", prompt: "viral vertical video crop, high engagement, punchy zoom, 9:16 format" },
      { id: "podcast_clip", name: "Extrait Podcast Dynamique", prompt: "podcast conversation highlight, speaker framing, subtitles, smooth audio sync" }
    ],
    sparkWorkflow: "OGA_05_Video_Wan21_T2V.json"
  },
  {
    id: "veo4-video-generator",
    name: "EasyVeo Studio",
    tagline: "Suite vidéo avancée avec contrôles de caméra",
    description: "Génération vidéo avec contrôle précis de travelling, zoom, pan et dolly. Raccordé au moteur Wan 2.2 TI2V et LTX 2.5 sur DGX Spark.",
    category: "Vidéos & Motion",
    icon: "FaVideo",
    color: "indigo",
    repo: "https://github.com/SamurAIGPT/veo4-video-generator",
    hosted: "https://veo4-video-generator.vercel.app/",
    thumbnail: "https://cdn.muapi.ai/data/2/901343404247/94ac6d86-be4e-4b70-b1e6-96d7e3692604.png",
    stars: 129,
    port: 58114,
    mediaType: "video",
    defaultStyle: "camera_dolly",
    styles: [
      { id: "camera_dolly", name: "Dolly In Cinématique", prompt: "cinematic dolly in shot, seamless focus pull, shallow depth of field, 8k" },
      { id: "pan_reveal", name: "Panoramique Découverte", prompt: "slow pan reveal from left to right, dramatic atmosphere, golden hour lighting" }
    ],
    sparkWorkflow: "OGA_06_Video_Wan22_TI2V.json"
  },
  {
    id: "pet-product-studio",
    name: "Pet Product Studio",
    tagline: "Photographie produit spécialisée animaux de compagnie",
    description: "Génération de mises en scène publicitaires pour accessoires et nourriture pour animaux dans des décors réalistes de salon et extérieurs.",
    category: "E-Commerce & Ads",
    icon: "FaPaw",
    color: "amber",
    repo: "https://github.com/SamurAIGPT/pet-product-studio",
    hosted: "https://pet-product-studio.vercel.app/",
    thumbnail: "https://cdn.muapi.ai/apps/Pet_Product_Studio.jpg",
    stars: 94,
    port: 58115,
    mediaType: "image",
    defaultStyle: "living_room",
    styles: [
      { id: "living_room", name: "Salon Moderne Cozy", prompt: "cute dog next to modern pet product, cozy Scandinavian living room, sunlight, high-end commercial ad" },
      { id: "outdoor_park", name: "Parc & Plein Air", prompt: "happy cat in a sunny garden park, vibrant grass, commercial product photography, 8k uhd" }
    ],
    sparkWorkflow: "OGA_01_Image_SD15_DreamShaper.json"
  },
  {
    id: "resale-photo-enhancer",
    name: "Resale Photo Enhancer",
    tagline: "Amélioration studio pour Vinted, eBay, Leboncoin",
    description: "Transforme instantanément des photos de vêtements et d'objets prises au smartphone en visuels de catalogue avec fond studio blanc ou décor chic.",
    category: "E-Commerce & Ads",
    icon: "FaImage",
    color: "emerald",
    repo: "https://github.com/SamurAIGPT/resale-photo-enhancer",
    hosted: "https://resale-photo-enhancer.vercel.app/",
    thumbnail: "https://cdn.muapi.ai/apps/Resale_Photo_Enhancer.png",
    stars: 167,
    port: 58116,
    mediaType: "image",
    defaultStyle: "clean_white",
    styles: [
      { id: "clean_white", name: "Studio Minimaliste Blanc", prompt: "isolated commercial product on pure seamless light studio backdrop, soft studio shadows, e-commerce catalog" },
      { id: "luxury_podium", name: "Podium Marbre & Luxe", prompt: "luxury product presentation, marble pedestal, elegant architectural background, golden lighting" }
    ],
    sparkWorkflow: "OGA_01_Image_SD15_DreamShaper.json"
  },
  {
    id: "ai-real-estate-stager",
    name: "AI Real Estate Stager",
    tagline: "Home staging virtuel de pièces vides et immobilier",
    description: "Meuble et décore virtuellement des pièces vides ou démodées dans plusieurs styles architecturaux (Scandinave, Moderne, Haussmannien, Industriel).",
    category: "Immobilier & Déco",
    icon: "FaHome",
    color: "cyan",
    repo: "https://github.com/SamurAIGPT/ai-real-estate-stager",
    hosted: "https://ai-real-estate-stager.vercel.app/",
    thumbnail: "https://cdn.muapi.ai/apps/AI_Real_Estate_Stager.webp",
    stars: 203,
    port: 58117,
    mediaType: "image",
    defaultStyle: "modern_luxury",
    styles: [
      { id: "modern_luxury", name: "Moderne Contemporain", prompt: "beautifully furnished modern luxury living room, designer sofa, hardwood floors, large windows, architectural digest" },
      { id: "scandinavian", name: "Scandinave Lumineux", prompt: "Scandinavian interior staging, light oak furniture, minimalist warm aesthetics, plants, cozy vibes" },
      { id: "haussmann", name: "Haussmannien Chic", prompt: "renovated Parisian Haussmann apartment, ornate moldings, herringbone parquet, contemporary designer furniture" }
    ],
    sparkWorkflow: "OGA_01_Image_SD15_DreamShaper.json"
  },
  {
    id: "old-photo-restore",
    name: "Old Photo Restore",
    tagline: "Restauration, débruitage et colorisation de photos vintage",
    description: "Restaure les vieilles photos de famille déchirées, floues ou en noir et blanc avec reconstruction faciale haute fidélité et colorisation naturelle.",
    category: "Portraits & Avatars",
    icon: "FaImage",
    color: "purple",
    repo: "https://github.com/SamurAIGPT/old-photo-restore",
    hosted: "https://old-photo-restore.vercel.app/",
    thumbnail: "https://cdn.muapi.ai/apps/OldPhoto.png",
    stars: 312,
    port: 58118,
    mediaType: "image",
    defaultStyle: "restore_colorize",
    styles: [
      { id: "restore_colorize", name: "Restauration & Colorisation", prompt: "fully restored vintage family portrait, natural skin tones, sharp eyes, removed scratches, 8k crisp resolution" },
      { id: "sharpen_hd", name: "Netteté & Détails Haute Fidélité", prompt: "hyper-detailed restored historical photograph, enhanced clarity, perfect facial features, photorealistic" }
    ],
    sparkWorkflow: "OGA_01_Image_SD15_DreamShaper.json"
  },
  {
    id: "clearmark-ai",
    name: "ClearMark AI",
    tagline: "Nettoyage de filigranes et d'éléments indésirables",
    description: "Suppression automatique d'artefacts, sous-titres incrustés et logos via modèle d'inpainting haute résolution sur Grace Blackwell GB10.",
    category: "Génération d'Images",
    icon: "FaImage",
    color: "rose",
    repo: "https://github.com/SamurAIGPT/clearmark-ai",
    hosted: "https://clearmark-ai.vercel.app/",
    thumbnail: "https://cdn.muapi.ai/apps/ClearMark_AI.webp",
    stars: 145,
    port: 58119,
    mediaType: "image",
    defaultStyle: "clean_inpaint",
    styles: [
      { id: "clean_inpaint", name: "Nettoyage & Inpainting Parfait", prompt: "clean background restoration, seamless texture fill, no artifacts, pristine quality, 8k" }
    ],
    sparkWorkflow: "OGA_01_Image_SD15_DreamShaper.json"
  },
  {
    id: "ai-pet-portrait",
    name: "AI Pet Portrait",
    tagline: "Portraits artistiques et royaux d'animaux",
    description: "Transforme les photos de vos chiens et chats en peintures à l'huile royales du 18ème siècle, chefs-d'œuvre Renaissance ou aquarelles.",
    category: "Portraits & Avatars",
    icon: "FaPaw",
    color: "amber",
    repo: "https://github.com/SamurAIGPT/ai-pet-portrait",
    hosted: "https://ai-pet-portrait.vercel.app/",
    thumbnail: "https://cdn.muapi.ai/apps/AI_Pet_Portrait.webp",
    stars: 189,
    port: 58120,
    mediaType: "image",
    defaultStyle: "royal_oil",
    styles: [
      { id: "royal_oil", name: "Portrait Royal 18ème Siècle", prompt: "regal oil painting portrait of a pet wearing royal velvet cape and gold medals, Rembrandt lighting, masterpiece" },
      { id: "cyber_pet", name: "Cyberpunk Mecha Pet", prompt: "futuristic cybernetic pet companion, neon glow, cyber armor, detailed sci-fi illustration, 8k" }
    ],
    sparkWorkflow: "OGA_01_Image_SD15_DreamShaper.json"
  },
  {
    id: "ai-logo-studio",
    name: "AI Logo Studio",
    tagline: "Créateur de logos vectoriels et identités visuelles",
    description: "Génération de logos modernes, emblèmes minimalistes, mascottes et typographies vectorielles pour startups et marques.",
    category: "Business & Graphisme",
    icon: "FaHandSparkles",
    color: "teal",
    repo: "https://github.com/SamurAIGPT/ai-logo-studio",
    hosted: "https://ai-logo-studio.vercel.app/",
    thumbnail: "https://cdn.muapi.ai/apps/AI_Logo.png",
    stars: 240,
    port: 58120,
    mediaType: "image",
    defaultStyle: "vector_minimal",
    styles: [
      { id: "vector_minimal", name: "Minimaliste Moderne", prompt: "modern minimalist tech logo, clean lines, vector graphic style, flat design, behance winner" },
      { id: "luxury_crest", name: "Emblème Luxe & Doré", prompt: "luxury crest emblem logo, gold foil accents, dark background, premium brand identity, elegant" }
    ],
    sparkWorkflow: "OGA_01_Image_SD15_DreamShaper.json"
  }
];

function getInstalledApps() {
  if (!fs.existsSync(INSTALLED_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(INSTALLED_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[GET_INSTALLED_APPS] Parse error:', err);
    return [];
  }
}

function saveInstalledApps(list) {
  if (!fs.existsSync(path.dirname(INSTALLED_FILE))) {
    fs.mkdirSync(path.dirname(INSTALLED_FILE), { recursive: true });
  }
  fs.writeFileSync(INSTALLED_FILE, JSON.stringify(list, null, 2), 'utf8');
}

// Generate an automated .env file for an installed app template
function generateAppEnv(app, targetDir) {
  const hostPort = process.env.PORT || '58101';
  const appPort = app.port && app.port >= 58100 && app.port <= 58120 ? app.port : 58110;
  const envContent = `# Auto-configured by Mgp Studio for DGX Spark GB10 Cluster (Range 58100-58120)
NEXT_PUBLIC_APP_NAME="${app.name}"
NEXT_PUBLIC_SPARK_URL="${SPARK_COMFY_HOST}"
SPARK_COMFY_URL="${SPARK_COMFY_HOST}"
SPARK_VLLM_URL="${SPARK_VLLM_HOST}"
AI_ENDPOINT="http://localhost:${hostPort}/api/comfy"
MUAPIAPP_API_KEY="local-dgx-spark"

# Local SQLite Database (Zero external server required)
DATABASE_URL="file:./dev.db"
DIRECT_URL="file:./dev.db"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:${appPort}"
NEXTAUTH_SECRET="mgp-studio-secret-${app.id}"
PORT=${appPort}

# Dynamic Theme Configuration
NEXT_PUBLIC_THEME=dark
`;

  fs.writeFileSync(path.join(targetDir, '.env'), envContent, 'utf8');
  fs.writeFileSync(path.join(targetDir, '.env.local'), envContent, 'utf8');
}

// Automatically create an official Workflow entry in data/local_workflows.json
function registerWorkflowForApp(app) {
  try {
    let workflows = [];
    if (fs.existsSync(WORKFLOWS_FILE)) {
      workflows = JSON.parse(fs.readFileSync(WORKFLOWS_FILE, 'utf8'));
    }

    const workflowId = `app_wf_${app.id.replace(/-/g, '_')}`;
    const exists = workflows.find(w => w.id === workflowId || w.workflow_id === workflowId);
    if (!exists) {
      const newWf = {
        workflow_id: workflowId,
        id: workflowId,
        name: `${app.name} Pipeline`,
        description: `Workflow IA officiel issu du template ${app.name}. Exécution directe sur supercalculateur DGX Spark GB10.`,
        category: "App Template",
        app_id: app.id,
        spark_file: app.sparkWorkflow || "OGA_01_Image_SD15_DreamShaper.json",
        thumbnail: app.thumbnail,
        is_owner: true,
        nodes: [
          { id: "1", type: "node_text_prompt", position: { x: 80, y: 150 }, data: { prompt: app.styles?.[0]?.prompt || "Masterpiece, 8k uhd" } },
          { id: "2", type: app.mediaType === "video" ? "node_spark_wan_video" : "node_spark_sd15", position: { x: 420, y: 150 }, data: { width: 832, height: 480 } },
          { id: "3", type: "node_display_media", position: { x: 780, y: 150 }, data: {} }
        ],
        edges: [
          { id: "e1-2", source: "1", target: "2", sourceHandle: "text", targetHandle: "prompt" },
          { id: "e2-3", source: "2", target: "3", sourceHandle: app.mediaType === "video" ? "video" : "image", targetHandle: "media" }
        ],
        created_at: new Date().toISOString()
      };
      workflows.push(newWf);
      fs.writeFileSync(WORKFLOWS_FILE, JSON.stringify(workflows, null, 2), 'utf8');
      return newWf;
    }
    return exists;
  } catch (err) {
    console.error('[registerWorkflowForApp] Error:', err);
    return null;
  }
}

export async function GET(request) {
  try {
    const installed = getInstalledApps();
    const installedMap = new Map(installed.map(a => [a.id, a]));

    const catalog = APPS_REGISTRY.map(app => {
      const isInstalled = installedMap.has(app.id);
      const installedInfo = installedMap.get(app.id) || {};
      return {
        ...app,
        status: isInstalled ? (installedInfo.status || 'installed') : 'available',
        isInstalled,
        installed_at: installedInfo.installed_at || null,
        local_port: installedInfo.port || app.port,
        installed_path: installedInfo.installed_path || null,
        workflow_imported: Boolean(installedInfo.workflow_imported)
      };
    });

    return NextResponse.json({
      ok: true,
      total: catalog.length,
      installed_count: installed.length,
      apps: catalog
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, id, app_id, style_id, prompt, image_url, width, height } = body;
    const targetId = id || app_id;

    const appDef = APPS_REGISTRY.find(a => a.id === targetId);
    if (!appDef && action !== 'list') {
      return NextResponse.json({ ok: false, error: `App ID '${targetId}' introuvable` }, { status: 404 });
    }

    // 1. ACTION: INSTALL APP TEMPLATE
    if (action === 'install') {
      const targetDir = path.join(APPS_DIR, appDef.id);
      if (!fs.existsSync(APPS_DIR)) {
        fs.mkdirSync(APPS_DIR, { recursive: true });
      }

      // If directory already exists or clone needed
      if (!fs.existsSync(targetDir)) {
        try {
          console.log(`[INSTALL] Cloning ${appDef.repo} into ${targetDir}...`);
          await execPromise(`git clone --depth 1 ${appDef.repo}.git "${targetDir}"`);
        } catch (cloneErr) {
          console.warn(`[INSTALL] Git clone warning: ${cloneErr.message}. Creating template workspace.`);
          fs.mkdirSync(targetDir, { recursive: true });
        }
      }

      // Auto-Configure Environment Variables (.env and .env.local)
      generateAppEnv(appDef, targetDir);

      // Auto-Register Workflow in Workflows Studio
      registerWorkflowForApp(appDef);

      // Update installed_apps.json
      const installed = getInstalledApps();
      const existingIdx = installed.findIndex(a => a.id === appDef.id);
      const newEntry = {
        id: appDef.id,
        name: appDef.name,
        repo: appDef.repo,
        installed_path: targetDir,
        installed_at: new Date().toISOString(),
        status: "installed",
        port: appDef.port || 58110,
        spark_ready: true,
        workflow_imported: true
      };

      if (existingIdx >= 0) {
        installed[existingIdx] = newEntry;
      } else {
        installed.push(newEntry);
      }
      saveInstalledApps(installed);

      return NextResponse.json({
        ok: true,
        message: `Template ${appDef.name} installé et configuré avec succès pour DGX Spark GB10 !`,
        app: newEntry
      });
    }

    // 2. ACTION: IMPORT WORKFLOW TO WORKFLOW STUDIO
    if (action === 'import_workflow') {
      const wf = registerWorkflowForApp(appDef);
      const installed = getInstalledApps();
      const item = installed.find(a => a.id === appDef.id);
      if (item) {
        item.workflow_imported = true;
        saveInstalledApps(installed);
      }
      return NextResponse.json({
        ok: true,
        message: `Workflow "${wf.name}" importé dans le Studio de Workflows !`,
        workflow: wf
      });
    }

    // 3. ACTION: UNINSTALL APP TEMPLATE
    if (action === 'uninstall') {
      const targetDir = path.join(APPS_DIR, appDef.id);
      if (fs.existsSync(targetDir)) {
        try {
          fs.rmSync(targetDir, { recursive: true, force: true });
        } catch (rmErr) {
          console.error('[UNINSTALL] rmSync error:', rmErr);
        }
      }
      const installed = getInstalledApps().filter(a => a.id !== appDef.id);
      saveInstalledApps(installed);

      return NextResponse.json({
        ok: true,
        message: `Template ${appDef.name} désinstallé.`
      });
    }

    // 4. ACTION: RUN IN-APP (DGX SPARK GB10 NATIVE GENERATION)
    if (action === 'run_in_app') {
      console.log(`[RUN_IN_APP] Running ${appDef.name} on DGX Spark GB10...`);
      
      // Determine final prompt from chosen style or custom prompt
      const selectedStyle = appDef.styles?.find(s => s.id === style_id) || appDef.styles?.[0];
      const finalPrompt = prompt && prompt.trim().length > 0 
        ? `${prompt}, ${selectedStyle?.prompt || ''}`
        : (selectedStyle?.prompt || "Professional photorealistic capture, 8k uhd, masterpiece");

      const origin = request.nextUrl.origin || 'http://localhost:58101';
      // Route image vs video
      if (appDef.mediaType === 'video') {
        // Video Generation on DGX Spark GB10 (Wan 2.2 or Wan 2.1)
        const comfyRes = await fetch(`${origin}/api/comfy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'generate_video',
            prompt: finalPrompt,
            model: 'Wan2.2-TI2V-5B',
            width: width || 832,
            height: height || 480
          })
        });
        const data = await comfyRes.json();
        return NextResponse.json({
          ok: true,
          type: 'video',
          resultUrl: data.videoUrl || data.url,
          data,
          message: `Vidéo générée avec succès sur DGX Spark GB10 via ${appDef.name} !`
        });
      } else {
        // Image Generation on DGX Spark GB10 (SD 1.5 DreamShaper)
        const comfyRes = await fetch(`${origin}/api/comfy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'generate_image',
            prompt: finalPrompt,
            model: 'DreamShaper_8_pruned.safetensors',
            width: width || 768,
            height: height || 512
          })
        });
        const data = await comfyRes.json();
        return NextResponse.json({
          ok: true,
          type: 'image',
          resultUrl: data.imageUrl || data.url,
          data,
          message: `Rendu photo généré avec succès sur DGX Spark GB10 via ${appDef.name} !`
        });
      }
    }

    return NextResponse.json({ ok: false, error: `Action inconnue: '${action}'` }, { status: 400 });
  } catch (err) {
    console.error('[POST /api/apps] Error:', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
