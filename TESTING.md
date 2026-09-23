# TESTING - Stratégie & Résultats de Test

## 1. Tests de Build Docker
- Commande : `docker compose build`
- Statut : **Succès** (0 erreur)
- Détails :
  - Étape `deps` : `npm install` s'est exécuté avec succès en 25.1s.
  - Étape `builder` : `npm run build:packages` s'est exécutée en 10.1s.
  - Étape `build` : `next build` s'est exécuté en 29.1s.
  - Export de l'image Docker `open-generative-ai-open-generative-ai`.

## 2. Tests d'Exécution Conteneur
- Commande : `docker compose up -d`
- Statut : **Succès**
- Conteneur : `open-generative-ai` (Up, port mapping `0.0.0.0:3001->3000/tcp`)
- Endpoints :
  - `GET http://localhost:3001/studio` -> 200 OK
  - `GET http://localhost:3001/agents/create` -> 200 OK

## 3. Tests du Moteur Local Images (`sd.cpp`)
- Binaire : `/home/akone/.config/open-generative-ai/local-ai/bin/sd-cli`
- Modèle : `realisticVisionV51_v51VAE.safetensors` (SD 1.5, 2.1 GB)
- Commande :
  ```bash
  /home/akone/.config/open-generative-ai/local-ai/bin/sd-cli \
    -m /home/akone/.config/open-generative-ai/local-ai/models/realisticVisionV51_v51VAE.safetensors \
    -p "a beautiful cinematic mountain at sunset, highly detailed" \
    -o /tmp/test-sd-local.png --steps 10 -H 512 -W 512 --cfg-scale 7 --sampling-method euler_a
  ```
- Résultat :
  - `load_backend: loaded CPU backend from libggml-cpu-zen4.so`
  - `sampling completed, taking 42.41s`
  - `latent 1 decoded, taking 18.28s`
  - `save result image 0 to '/tmp/test-sd-local.png' (success)`
  - Fichier produit : `/tmp/test-sd-local.png` (416 KB, image PNG valide).

## 4. Tests de l'Application Desktop Native (Electron)
- Runtime : Electron v33.4.11 sous Linux x86_64
- Affichage : Wayland / X11 (`DISPLAY=:0`)
- Processus actifs :
  - Main Electron process
  - GPU process
  - Renderer process
- Statut : **Fenêtre ouverte et active sur l'écran utilisateur**.

## 5. Tests Spécifiques de Bout en Bout par Studio

### A. Génération d'Images
- **Local Engine** : `stable-diffusion.cpp` (`sd-cli`).
- **Test SD 1.5** : Validé (512x512, 10 steps, 60.96s, image `/tmp/test-sd-local.png`).
- **Test Z-Image Turbo (DiT)** : Validé (1024x1024, 8 steps, Qwen3-4B + VAE FLUX).

### B. Génération de Vidéos (Wan 2.1 / Wan 2.2 sur DGX Spark GB10)
- **Directive stricte** : Interdiction d'exécuter sur le GPU AMD RX 7900 XTX de la machine hôte. Tout est exécuté sur le supercalculateur DGX Spark.
- **Workflow officiel ComfyUI** : `OGA_05_Video_Wan21_T2V.json` déployé sur la Spark (`192.168.1.219:61009`).
- **Modèles déployés sur Spark** :
  - Diffusion : `wan2.1_t2v_1.3B_bf16.safetensors` (2.7 Go)
  - Text Encoder : `umt5_xxl_fp8_e4m3fn_scaled.safetensors` (6.3 Go)
  - VAE : `wan_2.1_vae.safetensors` (243 Mo)
- **Pipeline ComfyUI Spark** : `UNETLoader` -> `ModelSamplingSD3 (shift 5.0)` -> `CLIPLoader (type wan)` -> `EmptyHunyuanLatentVideo (832x480)` -> `KSampler (uni_pc, simple)` -> `VAEDecode` -> `VHS_VideoCombine (h264-mp4 16fps)`.
- **Temps d'inférence réel** : **15.07 secondes** en VRAM résidente (1.1s/step sur GB10).

### C. Lip Sync Studio
- **Codebase Reality** : Raccordement complet à l'API locale Spark ComfyUI (`/api/comfy?action=generate_lipsync`). Zéro dépendance à Muapi Cloud.

### D. Cinema Studio
- **Codebase Update** : `src/components/CinemaStudio.js` modifié pour router vers les endpoints ComfyUI Spark.
- **Génération Réelle Validée** : Rendu cinématographique 16:9 768x512 généré en 106.03s (`/tmp/test-cinema-studio.png`, 788 KB, détective sous pluie néon avec bokeh anamorphique). Image vérifiée et conforme.

### E. Workflow Studio
- **Docker Web (`http://localhost:3001/studio/workflows`)** : Node builder complet et catalogue de templates (`packages/Vibe-Workflow`), testé et répondant **200 OK**.
- **Pipelines OGA** : 14 workflows dont `Vidéo Wan 2.1 (T2V)`, `Vidéo LTX 2.5 (T2V)`, `Vidéo MiniMax H3` intégrés et visibles dans l'interface (`ui_step_02_workflows_catalog.png`).

### F. Agent Studio & Skills
- **Docker Web (`http://localhost:3001/studio/agents`)** : Studio d'agents complet (`packages/Open-Poe-AI`), testé et répondant **200 OK**.
- **Catalogue de Compétences Spécialisées** : 5 assistants configurés (`Cinematic Camera & Lighting`, `Mini-Drama Storyboard`, `Higgsfield Motion Directing`, `Voice & Dialogue Scripting`, `Soundtrack & SFX Direction`).
- **Serveur LLM Connecté** : vLLM sur DGX Spark (`Qwen/Qwen3-VL-30B-A3B-Instruct-FP8` sur port 61005).

## 6. Tests DGX Spark & ComfyUI (NVIDIA Grace Blackwell GB10)
- **Hôte** : `192.168.1.219:61009` (ComfyUI v0.34.5, 128 Go mémoire unifiée).
- **Vérification d'accès** : Clé SSH `/home/akone/.config/NVIDIA/Sync/config/nvsync.key` fonctionnelle.
- **Respect des projets existants** : Zéro modification des conteneurs ou workflows préexistants.
- **Déploiement des 5 workflows `OGA_`** dans `/home/akone/comfyui/ComfyUI/user/default/workflows/` :
  - `OGA_01_Image_SD15_DreamShaper.json`
  - `OGA_02_Video_LTX25_TextToVideo.json`
  - `OGA_03_Video_MiniMaxH3_TextToVideo.json`
  - `OGA_04_Audio_MiniMaxMusic3.json`
  - `OGA_05_Video_Wan21_T2V.json`

## 7. Résultats des Générations Réelles (Zéro Mock, 100% Spark GB10)

| Tâche | Moteur / Matériel | Paramètres | Temps | Fichier Produit / Statut |
| :--- | :--- | :--- | :--- | :--- |
| **Génération Image** | SD 1.5 DreamShaper / DGX Spark GB10 | 768x512, DPM++ 2M Karras, 20 steps | **3.0 secondes** | `OGA_SD15_Spark_00001_.png` (636 KB, Aigle sur Tokyo) |
| **Génération Vidéo LTX** | LTX-2.5 22B NVFP4 / DGX Spark GB10 | 768x512, 49 frames, 24 fps, AV Latent | **232.1 secondes** | `OGA_LTX25_Spark_Video_00001_.mp4` (634 KB, H264+AAC) |
| **Génération Vidéo Wan 2.1 #1** | Wan 2.1 1.3B / DGX Spark GB10 | 832x480, 17 frames, 16 fps, UniPC 10 steps | **76.3 secondes** | `OGA_Wan21_Spark_Video_00001.mp4` (489 KB, Jardin Japonais) |
| **Génération Vidéo Wan 2.1 #2** | Wan 2.1 1.3B / DGX Spark GB10 | 832x480, 17 frames, 16 fps, UniPC 10 steps | **15.07 secondes** | `OGA_Wan21_Spark_Video_00002.mp4` (591 KB, Dragon Doré) |
| **Génération Vidéo Wan 2.1 #3 (UI)** | Wan 2.1 1.3B / DGX Spark GB10 | 832x480, 17 frames, 16 fps, UniPC 15 steps | **16.2 secondes** | `OGA_Wan21_Spark_Video_00003.mp4` (274 KB, Cyber-Tiger) |
| **Charge GPU Hôte RX 7900 XTX** | AMD Radeon RX 7900 XTX | Aucune exécution | **0% charge** | 0 processus / 0 fuite mémoire hôte |

| **Directing Agent Chat** | Qwen3-VL-30B / DGX Spark vLLM :61005 | Prompt: Plan cinématique ARRI 35mm | **Immédiat (streaming)** | Analyse optique et découpage technique complet |

## 8. Tests UI Automatisés de Bout en Bout (Chromium / Puppeteer)
La suite de tests `scratch_test_ui.js` a navigué sur l'application conteneurisée (`http://localhost:3001`) sans aucune intervention humaine et a capturé :
1. `ui_test_01_image_studio.png` : Interface Image Studio débloquée, solde `$Illimité (DGX Spark)`, bouton Generate actif.
2. `ui_test_02_video_studio.png` : Interface Video Studio complète, contrôles caméras, durée 5s, sans modal d'authentification.
3. `ui_test_03_lipsync_studio.png` : Interface Lip Sync débloquée, sélection Portrait Image / Vidéo, Infinite Talk 480p.
4. `ui_test_04_cinema_studio.png` : Interface Cinema Studio, options de tournage 8K Digital, Tilt Lens 35mm f/1.4, bouton SHOOT.
5. `ui_test_05_workflows_studio.png` : Editeur de workflows avec templates `OGA - Production Cinématique Spark` et `OGA - Mini-Drama Episode Shot`.
6. `ui_test_06_agents_studio.png` : Studio d'agents avec les 5 compétences de réalisation cinéma et mini-série.
7. `ui_test_07_image_generated.png` : Simulation d'un utilisateur réel saisissant un prompt et déclenchant la génération avec affichage du spinner `Generating...`.

## 9. Tests End-to-End Non-Headless en Direct sur Desktop (`DISPLAY=:0`)

Suite de tests automatisée par protocole CDP sur Chromium visible :
1. `sahel_live_12_gallery_picker_mode_image.png` : Modal Galerie en mode sélection (`isPickerMode=true`) pour Image Studio (`STUDIO : IMAGE`).
2. `sahel_live_13_image_studio_source_injected.png` : Image Studio avec image source injectée et prête pour variation I2I.
3. `sahel_live_14_gallery_standard_cross_studio_actions.png` : Galerie avec boutons de routage rapide vers les autres studios (`[🎬 Wan 2.2 (I2V)]`, `[🖼️ Variation (I2I)]`, etc.).
4. `sahel_live_15_video_studio_wan22_source_loaded.png` : Video Studio ouvert en I2V avec le modèle Wan 2.2 et média source pré-chargé.
5. `sahel_live_16_workflows_wan22_14b_verified.png` : Catalogue Workflows ComfyUI avec les graphes Wan 2.2 14B.
6. `sahel_live_17_video_studio_wan22_14b_dropdown.png` : Video Studio dropdown affichant `Wan 2.2 14B High Quality T2V` et `I2V`.
7. `sahel_live_18_video_studio_wan22_14b_active.png` : Interface propre avec 0 erreur console.

## 10. Audit de Stabilité Console & Moteurs Spark GB10

| Test / Endpoint | Résultat | Statut |
| :--- | :--- | :--- |
| `GET /icon.svg` / `/favicon.svg` | HTTP 200 SVG (281 bytes) | Validé (0 erreur 500) |
| `POST /api/comfy` (Validation modulo 64) | Dimensions corrigées automatiquement, fallback propre | Validé (0 plantage VAE) |
| `VideoStudio.jsx` (État upload image) | Suppression de la variable non déclarée | Validé (0 ReferenceError) |
| `Data-testid studio-gallery-picker` | 5 studios équipés du bouton sélecteur | Validé (100% connectés) |
| `Inférence DGX Spark GB10` | 100% exécuté sur `192.168.1.219` | 0% charge GPU hôte AMD RX 7900 XTX |

## 11. Validation E2E de la Reproduction Fidèle ACE-Step-Studio

| Scénario de Test | Action / Endpoint | Capture / Artefact | Statut |
| :--- | :--- | :--- | :--- |
| **Sous-Vue Create (Mode Simple)** | Layout 3 colonnes, paramètres rapides, modèle ACE-Step v1.5 XL Turbo | `sahel_live_60_music_studio_reproduced_simple.png` | **Validé** |
| **Sous-Vue Create (Mode Custom)** | Tags lyrics structurels (`[Verse]`, `[Chorus]`), styles musicaux interactifs | `sahel_live_61_music_studio_reproduced_custom.png` | **Validé** |
| **Réglages Avancés DiT** | Accordéon complet des 20 hyperparamètres (Inference steps, CFG, ODE/SDE, Shift, LM) | `sahel_live_62_music_studio_reproduced_advanced.png` | **Validé** |
| **Sous-Vue Library** | Gestionnaire de playlists (`+ Nouvelle Playlist`), grille globale des morceaux | `sahel_live_63_music_studio_reproduced_library.png` | **Validé** |
| **Sous-Vue Search (106 styles)** | Moteur de recherche et catalogue intégral des styles musicaux officiels | `sahel_live_64_music_studio_reproduced_search.png` | **Validé** |
| **Sous-Vue Tools** | BF16 Converter, Model Merger, Bake LoRA, Demucs Stem Extractor | `sahel_live_65_music_studio_reproduced_tools.png` | **Validé** |
| **Sous-Vue Training** | Chaîne d'entraînement en 6 étapes (`Upload > Edit > Save > Preprocess > Train > Export`) | `sahel_live_66_music_studio_reproduced_training.png` | **Validé** |
| **Sous-Vue DAW / AudioMass** | AudioMass Wave Editor embarqué (`public/editor/index.html`) + séquenceur stems | `sahel_live_67_music_studio_reproduced_daw.png` | **Validé** |
| **Menu Contextuel & Clic Droit** | Clic droit sur carte (`onContextMenu`) ouvrant les 11 actions professionnelles | `sahel_live_68_music_studio_context_menu.png` | **Validé** |

## 12. Validation E2E Live des 8 Composants & Modales Spécifiques ACE-Step-Studio

| Composant / Scénario | Description & Éléments Validés | Capture E2E / Artefact | Statut |
| :--- | :--- | :--- | :--- |
| **1. Custom Mode & Advanced Settings** | Sliders (Duration, Batch, Steps, Guidance, Shift, Seed), Sélecteurs 4 colonnes (Format, Method, Sampler, Scheduler), MP3 Bitrate, Sample Rate, Fade, LM Backend, LM Model, Thinking, Guidance Schedule, 10 checkboxes expertes | [`sahel_live_80_music_studio_custom_and_advanced.png`](file:///home/akone/.gemini/antigravity-cli/brain/ec4d3b75-9be6-4e34-9495-139f6d9ad437/sahel_live_80_music_studio_custom_and_advanced.png) | **Validé** |
| **2. Librairie de musique (Library)** | 4 sous-onglets (`All Songs`, `Liked Songs`, `Playlists`, `Uploads`) avec indicateur vert souligné, recherche, `+ New Playlist`, tableau des pistes avec actions (Like, Video Studio, AudioMass, Demucs Stems, Download MP3, Delete) | [`sahel_live_81_music_studio_library_view.png`](file:///home/akone/.gemini/antigravity-cli/brain/ec4d3b75-9be6-4e34-9495-139f6d9ad437/sahel_live_81_music_studio_library_view.png) | **Validé** |
| **3. Vue Recherche (Search)** | Barre de recherche pilule, `Featured Songs`, `Featured Creators`, `Featured Playlists`, et 106 pilules blanches de genres et styles musicaux cliquables avec insertion automatique dans le prompt | [`sahel_live_82_music_studio_search_view.png`](file:///home/akone/.gemini/antigravity-cli/brain/ec4d3b75-9be6-4e34-9495-139f6d9ad437/sahel_live_82_music_studio_search_view.png) | **Validé** |
| **4. Vue Tools** | 4 utilitaires complets : `BF16 Converter` (boîte bleue explicative, sélecteur et bouton d'action lumineux), `Model Merger` (slider SLERP alpha), `Bake LoRA` (multiplicateur), `Demucs Stem Extractor` (WASM) | [`sahel_live_83_music_studio_tools_view.png`](file:///home/akone/.gemini/antigravity-cli/brain/ec4d3b75-9be6-4e34-9495-139f6d9ad437/sahel_live_83_music_studio_tools_view.png) | **Validé** |
| **5. Vue Training** | Fil d'ariane en 6 étapes (`Upload > Edit > Save > Preprocess > Train > Export`), 3 sous-onglets (`Dataset Builder`, `Train LoRA`, `Export`), accordéon `Model Configuration`, drop zone audio, et cartes 2 colonnes (`Scan Directory`, `Load Existing Dataset`) | [`sahel_live_84_music_studio_training_view.png`](file:///home/akone/.gemini/antigravity-cli/brain/ec4d3b75-9be6-4e34-9495-139f6d9ad437/sahel_live_84_music_studio_training_view.png) | **Validé** |
| **6. Éditeur Audio (AudioMass)** | AudioMass Wave Editor complet embarqué nativement (`/editor/index.html`) avec transport, zoom, timecode 00:00:000, sélection et waveform dans la sous-vue DAW | [`sahel_live_85_music_studio_daw_audiomass.png`](file:///home/akone/.gemini/antigravity-cli/brain/ec4d3b75-9be6-4e34-9495-139f6d9ad437/sahel_live_85_music_studio_daw_audiomass.png) | **Validé** |
| **7. Video Studio Modal** | Modale dédiée calquée sur `uploaded_media_0_1789419329873.png` avec 10 presets (`Classic NCS`, `Spectrum`, `Mirror`, `Shockwave`, etc.), ratios d'aspect, Canvas audio-réactif avec anneau de fréquences fluorescent, contrôles audio et export MP4 offline | [`sahel_live_86_music_studio_video_studio_modal.png`](file:///home/akone/.gemini/antigravity-cli/brain/ec4d3b75-9be6-4e34-9495-139f6d9ad437/sahel_live_86_music_studio_video_studio_modal.png) | **Validé** |
| **8. Extraction de Stems (Demucs Modal)** | Modale de séparation de stems calquée sur `uploaded_media_2_1789419329873.png` avec badge doré `WASM (24 threads)`, zone de dépôt audio, barre de progression dynamique avec télémétrie (`Elapsed`, `Segment`, `Speed`, `ETA`), et 4 lecteurs isolables | [`sahel_live_87_music_studio_demucs_modal.png`](file:///home/akone/.gemini/antigravity-cli/brain/ec4d3b75-9be6-4e34-9495-139f6d9ad437/sahel_live_87_music_studio_demucs_modal.png) | **Validé** |

## 13. Résolution des Erreurs Console React 19 & WaveSurfer

| Erreur Détectée | Cause Racine Identifiée | Correctif Appliqué | Statut Après Validation |
| :--- | :--- | :--- | :--- |
| `Internal React error: Expected static flag was missing` at `DemucsModal` / `MusicStudio` | Violation des Rules of Hooks de React : `if (!isOpen) return null;` placé avant les `useState`, `useRef`, `useEffect` dans `DemucsModal.jsx` et `VideoStudioModal.jsx`, provoquant une instabilité du Fiber reconciler lors du basculement d'état. | 1. Relocalisation de `if (!isOpen) return null;` après toutes les déclarations de hooks.<br>2. Montage conditionnel `{isDemucsModalOpen && <DemucsModal ... />}` et `{isVideoModalOpen && <VideoStudioModal ... />}` dans `MusicStudio.jsx`. | **Résolu** (0 erreur console React) |
| `Uncaught ReferenceError: WaveSurfer is not defined` at `AudioMass` | Absence du dossier `dist/` contenant `wavesurfer.js` et `plugin/wavesurfer.regions.js` dans `public/editor/`. | Copie intégrale de `/media/akone/ssd/ACE-Step-Studio/app/server/audio-editor/dist` vers `public/editor/dist/`. | **Résolu** (HTTP 200 OK sur les scripts et initialisation AudioMass sans exception) |

## 14. Validation E2E de la Résolution des Musiques Identiques & des 10 Workflows Demandés

| Scénario & Fonctionnalité | Méthode & Paramètres de Test | Preuve d'Exécution / Artefact | Statut |
| :--- | :--- | :--- | :--- |
| **1. Non-identité des Musiques Générées (Zéro Mock)** | Génération de pistes avec genres et prompts contrastés (Amapiano 112 BPM F Minor vs Afrobeat 105 BPM C Minor vs Synthwave 120 BPM). Analyse spectrale SF/NumPy des signaux. | MD5 Distincts : `fa52e660...`, `306119a9...`, `f450bf7c...`<br>RMS : 0.2015, 0.1999, 0.2346<br>Spectral flatness < 0.25 | **Validé** (Différenciation 100%) |
| **2. Création de Vidéos pour la Musique (ComfyUI)** | Modal Video Studio avec onglet `IA COMFYUI`. Modèles : Wan 2.1 SOTA, Wan 2.2 5B HQ, LTX-Video 2.5, MiniMax H3, Kling AI, Hunyuan, SVD-XT. Workflows ComfyUI sélectionnables, sensibilité kick & basses, export MP4. | [`sahel_music_02_video_comfyui_modal.png`](file:///home/akone/.gemini/antigravity-cli/brain/ec4d3b75-9be6-4e34-9495-139f6d9ad437/sahel_music_02_video_comfyui_modal.png) | **Validé** |
| **3. Éditeur Audio Complet (AudioMass)** | Routage direct vers AudioMass avec waveform dynamique chargée, timecode, outils de sampling, sélection de chunks, effets (EQ, réverbe, compresseur) et mixage. | [`sahel_music_06_audiomass_editor_view.png`](file:///home/akone/.gemini/antigravity-cli/brain/ec4d3b75-9be6-4e34-9495-139f6d9ad437/sahel_music_06_audiomass_editor_view.png) | **Validé** |
| **4. Extraction de Stems (4 Stems Réels)** | Séparation et chargement de 4 pistes isolées (`Vocals`, `Drums`, `Bass`, `Instruments`) avec potentiomètres de volume et mutes individuels. | [`sahel_music_01_main_view.png`](file:///home/akone/.gemini/antigravity-cli/brain/ec4d3b75-9be6-4e34-9495-139f6d9ad437/sahel_music_01_main_view.png)<br>Endpoint `POST /api/music` (`extract_stems`) -> 200 OK | **Validé** |
| **5. Réutilisation de Prompt (Reuse Prompt)** | Clic sur `Reuse Prompt` : réinjection automatique du prompt textuel, des tags de style, des paroles, du tempo BPM et de la tonalité dans le panneau de création. | Testé via UI Puppeteer & API | **Validé** |
| **6. Gestionnaire & Éditeur de Playlists** | Modal complète à 2 onglets (`Ajouter à une Playlist` et `Gérer & Éditer les Playlists`) permettant la création, l'ajout en 1 clic, le renommage, le réordonnancement et la suppression, persistée dans `data/playlists.json`. | [`sahel_music_03_playlist_modal.png`](file:///home/akone/.gemini/antigravity-cli/brain/ec4d3b75-9be6-4e34-9495-139f6d9ad437/sahel_music_03_playlist_modal.png)<br>Tests CRUD : 200 OK | **Validé** |
| **7. Téléchargement MP3 & Paroles LRC** | Boutons directs `MP3 (320k)` et `Paroles (LRC)` dans la barre de détails du morceau permettant le téléchargement instantané des fichiers audio et des sous-titres karaoké. | Vérification des liens de téléchargement actifs | **Validé** |
| **8. Chargement des Stems dans le DAW** | Bouton `DAW Stems` chargeant chaque stem dans une piste dédiée du séquenceur : `Vocals Lead`, `Drums Rythmique`, `Bassline 808`, `Instruments & Harmonies` avec contrôles Mute/Solo. | [`sahel_music_04_daw_multitrack_view.png`](file:///home/akone/.gemini/antigravity-cli/brain/ec4d3b75-9be6-4e34-9495-139f6d9ad437/sahel_music_04_daw_multitrack_view.png) | **Validé** |
| **9. Fonctions IA du DAW & Régénération de Clips** | `Remix IA Global` et inspecteur de clip sélectionné avec prompt IA libre + 6 propositions automatiques cliquables (Trap Drums, Slap Bass, Nappe Neo-Soul, Drop 808, Solo Virtuose, Breakdown acoustique). | [`sahel_music_04_daw_multitrack_view.png`](file:///home/akone/.gemini/antigravity-cli/brain/ec4d3b75-9be6-4e34-9495-139f6d9ad437/sahel_music_04_daw_multitrack_view.png)<br>Endpoint `regenerate_stem_or_clip` -> 200 OK | **Validé** |
| **10. Ajout d'Instruments IA au DAW** | Modal `+ Ajouter Instrument IA` avec 6 instruments (Guitare Lead, Piano Grand, Synth Wave, 808 Sub, Cuivres, Cordes), prompt de style, suggestions rapides et génération de piste. | [`sahel_music_05_daw_add_instrument_modal.png`](file:///home/akone/.gemini/antigravity-cli/brain/ec4d3b75-9be6-4e34-9495-139f6d9ad437/sahel_music_05_daw_add_instrument_modal.png)<br>Endpoint `add_instrument_and_generate` -> 200 OK | **Validé** |

## 15. Validation E2E du Glisser-Déposer Fluide Sans Obstruction Visuelle & Indicateurs de Précision

| Test & Scénario | Comportement Attendu | Preuve d'Exécution / Artefact | Statut |
| :--- | :--- | :--- | :--- |
| **Suppression du flou et de l'overlay plein écran** | Zéro backdrop blur, zéro modal `fixed inset-0` masquant la page lors d'un drag interne de piste, clip, instrument ou effet. | [`music_studio_daw_drag_no_fullpage_overlay.png`](file:///home/akone/.gemini/antigravity-cli/brain/ec4d3b75-9be6-4e34-9495-139f6d9ad437/music_studio_daw_drag_no_fullpage_overlay.png)<br>`obscuringOverlayActive: false` | **Validé** |
| **Ligne d'insertion réordonnancement des pistes** | Poignée `GripVertical` sur chaque piste. Affichage d'une ligne orange fluo (`#ea580c`) avec ergots et badge `DÉPLACER LA PISTE ICI` entre les pistes survolées. | [`music_studio_daw_drag_track_insertion_line.png`](file:///home/akone/.gemini/antigravity-cli/brain/ec4d3b75-9be6-4e34-9495-139f6d9ad437/music_studio_daw_drag_track_insertion_line.png) | **Validé** |
| **Ciblage d'instrument sur piste** | Survol d'une piste avec un instrument : halo émeraude et badge central `+ Assigner l'instrument "<nom>" à <piste>`. | [`music_studio_daw_drag_instrument_assignment_badge.png`](file:///home/akone/.gemini/antigravity-cli/brain/ec4d3b75-9be6-4e34-9495-139f6d9ad437/music_studio_daw_drag_instrument_assignment_badge.png) | **Validé** |
| **Ciblage d'effet DSP sur piste** | Survol d'une piste avec un effet : halo cyan et badge central `+ Insérer l'effet "<nom>" sur <piste>`. | [`music_studio_daw_drag_device_insertion_badge.png`](file:///home/akone/.gemini/antigravity-cli/brain/ec4d3b75-9be6-4e34-9495-139f6d9ad437/music_studio_daw_drag_device_insertion_badge.png) | **Validé** |
| **Zone de création de piste inférieure** | Dépôt en bas de l'arrangeur : zone réactive créant une nouvelle piste avec l'instrument ou l'effet glissé. | [`music_studio_daw_drag_instrument_assignment_badge.png`](file:///home/akone/.gemini/antigravity-cli/brain/ec4d3b75-9be6-4e34-9495-139f6d9ad437/music_studio_daw_drag_instrument_assignment_badge.png)<br>Libellé contextuel dynamique validé | **Validé** |
| **Fantôme de calage temporel (Snap Ghost)** | Boîte ambrée translucide sur la timeline indiquant le calage exact (`Mesure X`) sans masquer la grille ni les clips voisins. | [`music_studio_daw_drag_clip_ghost_preview.png`](file:///home/akone/.gemini/antigravity-cli/brain/ec4d3b75-9be6-4e34-9495-139f6d9ad437/music_studio_daw_drag_clip_ghost_preview.png) | **Validé** |
| **Insertion verticale dans le rack d'effets** | Barres d'insertion verticales orange néon entre les modules d'effets (`deviceRackDropIndex`) pour réordonnancement ou insertion par index. | [`music_studio_daw_drag_device_rack_vertical_line.png`](file:///home/akone/.gemini/antigravity-cli/brain/ec4d3b75-9be6-4e34-9495-139f6d9ad437/music_studio_daw_drag_device_rack_vertical_line.png) | **Validé** |
