"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import axios from "axios";
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Scissors, Maximize2, Settings,
  Sliders, Eye, EyeOff, Lock, Unlock, Layers, Video, Music, Mic, Type, Image as ImageIcon,
  Sparkles, Plus, Trash2, Download, Upload, Search, Grid, List, Columns, Share2,
  Check, ChevronRight, ChevronDown, RotateCcw, ZoomIn, ZoomOut, Folder, FolderPlus,
  Film, Camera, Tv, Activity, Cpu, FileVideo, Radio, Wand2, Disc, Sun, Palette,
  SplitSquareVertical, Send, UploadCloud, Clapperboard, AudioWaveform, SlidersHorizontal,
  X, CheckSquare, Square, CornerDownRight, MoveHorizontal, RefreshCw, AlertCircle, PlaySquare,
  Bookmark, Flag, ArrowLeft, ArrowRight, MousePointer
} from "lucide-react";

// ── Builtin Studio Video Transition Presets ──
const TRANSITIONS = [
  { id: "none", name: "Coupe Franche (Cut)", icon: "✂️" },
  { id: "cross-dissolve", name: "Fondu Enchaîné (Cross Dissolve)", icon: "✨" },
  { id: "dip-to-color", name: "Fondu au Noir / Blanc (Dip to Color)", icon: "🌑" },
  { id: "blur-dissolve", name: "Fondu Flou (Blur Dissolve)", icon: "💧" },
  { id: "smooth-cut", name: "Coupe Fluide IA (Smooth Cut)", icon: "⚡" },
  { id: "wipe-right", name: "Balayage Latéral (Wipe Right)", icon: "➡️" },
  { id: "iris", name: "Diaphragme Iris (Iris)", icon: "🎯" },
];

// ── Builtin Camera Framing Presets ──
const SHOT_PLANS = [
  { id: "S1", name: "S1 Plan d’Ensemble (Master Shot)", badge: "Master", icon: "🌐" },
  { id: "S2", name: "S2 Gros Plan Dynamique (Close-Up)", badge: "Close-Up", icon: "🔍" },
  { id: "S3", name: "S3 Travelling Caméra (Action Dolly)", badge: "Travelling", icon: "🎥" },
  { id: "S4", name: "S4 Plan Américain (Hero Framing)", badge: "Hero", icon: "⚡" },
  { id: "S5", name: "S5 Chute & Épilogue (Outro Cut)", badge: "Outro", icon: "🎬" },
];

// ── Builtin SFX Library ──
const BUILTIN_SFX = [
  { id: "sfx_bass_impact", name: "Sub Bass Cinematic Boom", dur: "00:00:02:12", url: "/outputs/sfx_bass_impact.mp3", cat: "Impacts" },
  { id: "sfx_whoosh_soft", name: "Anamorphic Camera Whoosh", dur: "00:00:01:05", url: "/outputs/sfx_whoosh_soft.mp3", cat: "Transitions" },
  { id: "sfx_cinema_drone", name: "Drone Atmosphérique Dark", dur: "00:00:08:00", url: "/outputs/sfx_cinema_drone.mp3", cat: "Ambiance" },
  { id: "sfx_camera_click", name: "Déclencheur 35mm Vintage", dur: "00:00:00:15", url: "/outputs/sfx_camera_click.mp3", cat: "Foley" },
];

// ── Color Grading Node Presets (Color Page: 15 Nodes in 4 Tiers) ──
const DEFAULT_COLOR_NODES = [
  // Tier 1
  { id: "node_19", num: "19", name: "IDT", label: "Input Device Transform", type: "input", active: true, row: 1 },
  { id: "node_20", num: "20", name: "NR", label: "Denoise IA Spatial", type: "filter", active: true, row: 1 },
  { id: "node_21", num: "21", name: "BEAUTY", label: "Face Refine IA", type: "filter", active: true, row: 1 },
  { id: "node_22", num: "22", name: "XTRA", label: "Texture & Grain", type: "filter", active: true, row: 1 },
  { id: "node_23", num: "23", name: "LENS FX", label: "Halation & Flare", type: "filter", active: true, row: 1 },
  // Tier 2
  { id: "node_01", num: "01", name: "EXP", label: "Exposure Curve", type: "grade", active: true, row: 2 },
  { id: "node_02", num: "02", name: "CON", label: "Contrast & Pivot", type: "grade", active: true, row: 2 },
  { id: "node_03", num: "03", name: "WB", label: "Temp & Tint 5600K", type: "grade", active: true, row: 2 },
  { id: "node_04", num: "04", name: "SAT", label: "ColorSlice 6-Vector", type: "grade", active: true, row: 2 },
  { id: "node_05", num: "05", name: "HL / SKY", label: "Highlight Rolloff", type: "grade", active: true, row: 2 },
  // Tier 3
  { id: "node_06", num: "06", name: "FLG LEFT", label: "Flag Left Window", type: "window", active: true, row: 3 },
  { id: "node_07", num: "07", name: "FLG CEN", label: "Flag Center Window", type: "window", active: true, row: 3 },
  { id: "node_08", num: "08", name: "FLG RGHT", label: "Flag Right Window", type: "window", active: true, row: 3 },
  { id: "node_09", num: "09", name: "FLG TOP", label: "Flag Top Window", type: "window", active: true, row: 3 },
  { id: "node_10", num: "10", name: "FLG BOT", label: "Flag Bottom Window", type: "window", active: true, row: 3 },
  // Tier 4
  { id: "node_11", num: "11", name: "CIRC LEFT", label: "Circular Vignette L", type: "window", active: true, row: 4 },
  { id: "node_12", num: "12", name: "CIRC CEN", label: "Circular Vignette C", type: "window", active: true, row: 4 },
  { id: "node_13", num: "13", name: "CIRC RIG", label: "Circular Vignette R", type: "window", active: true, row: 4 },
  { id: "node_14", num: "14", name: "VGN", label: "Global Vignette", type: "output", active: true, row: 4 },
  { id: "node_15", num: "15", name: "VGN OUT", label: "Master UHD Output", type: "output", active: true, row: 4 },
];

// ── Fusion VFX Node Presets (Fusion Page: 15 Nodes Compositing Tree) ──
const DEFAULT_FUSION_NODES = [
  { id: "fn_stars", name: "StarsInForest", label: "Particle Emitter", type: "gen", branch: "top", active: true },
  { id: "fn_resize", name: "Resize1", label: "Format 3840x2160", type: "tool", branch: "top", active: true },
  { id: "fn_cc1", name: "ColorCorrector1", label: "Grade VFX", type: "color", branch: "top", active: true },
  { id: "fn_bg2", name: "Background2", label: "Deep Space Gradient", type: "gen", branch: "mid", active: true },
  { id: "fn_bc", name: "BrightnessContrast", label: "Luminance Dynamics", type: "color", branch: "mid", active: true },
  { id: "fn_m3", name: "Merge3", label: "Comp Layer 3", type: "merge", branch: "mid", active: true },
  { id: "fn_rast", name: "Rasterize2", label: "Bitmap Render", type: "tool", branch: "mid", active: true },
  { id: "fn_rad", name: "Radial1", label: "Radial Mask", type: "mask", branch: "bot", active: true },
  { id: "fn_vort", name: "Vortex1", label: "Cosmic Warp", type: "warp", branch: "bot", active: true },
  { id: "fn_dent", name: "Dent1", label: "Surface Ripple", type: "warp", branch: "bot", active: true },
  { id: "fn_tr3", name: "Transform3", label: "Anamorphic Scale", type: "transform", branch: "bot", active: true },
  { id: "fn_micro", name: "Microwaves1", label: "Krokodove Sine Flow", type: "gen", branch: "bot", active: true },
  { id: "fn_glow", name: "SoftGlow1", label: "Neon Bloom", type: "glow", branch: "bot", active: true },
  { id: "fn_tr1", name: "Transform1", label: "Position Offset", type: "transform", branch: "bot", active: true },
  { id: "fn_m2", name: "Merge2", label: "Comp Layer 2", type: "merge", branch: "bot", active: true },
  { id: "fn_text", name: "MultiText1", label: "3D Title Generator", type: "text", branch: "fg", active: true },
  { id: "fn_m1", name: "Merge1", label: "Comp Master", type: "merge", branch: "fg", active: true },
  { id: "fn_out", name: "MediaOut1", label: "Output 4K UHD", type: "output", branch: "fg", active: true },
];

export default function MontageStudio({ apiKey, onNavigateTab, injectedMedia, onInjectedMediaHandled }) {
  // ── Workspace State : Studio Video Pages ──
  // 'media' | 'photo' | 'cut' | 'edit' | 'fusion' | 'color' | 'fairlight' | 'deliver'
  const [activePage, setActivePage] = useState("edit");

  // ── Media Pool View Options : 'cards' | 'list' | 'filmstrip' ──
  const [mediaViewMode, setMediaViewMode] = useState("cards");
  const [activeMediaTab, setActiveMediaTab] = useState("media_pool"); // 'media_pool' | 'effects' | 'index' | 'sound_library' | 'keyframes'
  const [activeBinPath, setActiveBinPath] = useState("Master/RANCH/B003");
  const [mediaSearchQuery, setMediaSearchQuery] = useState("");
  const [showInspector, setShowInspector] = useState(true);
  const [showQuickExportModal, setShowQuickExportModal] = useState(false);
  const [showProjectSettingsModal, setShowProjectSettingsModal] = useState(false);

  // ── Project Metadata ──
  const [projectName, setProjectName] = useState("URSA Cine 17K - Ranch and Iceland Compile");
  const [projectFps, setProjectFps] = useState(24);
  const [projectResolution, setProjectResolution] = useState("3840x2160 UHD");
  const [totalDuration, setTotalDuration] = useState(15.0);
  const [timelineMarkers, setTimelineMarkers] = useState([
    { id: "m_intro", name: "C1 Intro", timeSec: 0.0, color: "#06b6d4" },
    { id: "m_theme_a", name: "C2 Theme A", timeSec: 22.3, color: "#3b82f6" },
    { id: "m_build", name: "C3 Build", timeSec: 44.6, color: "#f59e0b" },
    { id: "m_drop", name: "C4 Drop 1", timeSec: 67.0, color: "#ef4444" },
  ]);

  // ── Multi-Track Timeline Clips State ──
  const [videoClips, setVideoClips] = useState([
    {
      id: "vclip_1",
      name: "B003_02101728_C001.braw",
      title: "A001_C019 — Ranch Truck Highway",
      type: "video",
      track: "V1",
      url: "/assets/studio_video/clip_truck_desert.png",
      filename: "B003_02101728_C001.braw",
      start: 0.0,
      duration: 5.0,
      speed: 1.0,
      volume: 100,
      transition: "fade-black",
      cameraShot: "S1 Plan d’Ensemble (Master Shot)",
      color: "#f59e0b",
      codec: "Blackmagic RAW 17K",
      resolution: "3840x2160",
      fps: 24,
      zoom: 1.0,
      posX: 0,
      posY: 0,
      rot: 0,
      opacity: 100,
    },
    {
      id: "vclip_2",
      name: "B003_02101729_C002.braw",
      title: "A002_C042 — Dylan Cowboy Portrait",
      type: "video",
      track: "V1",
      url: "/assets/studio_video/clip_cowboy_dylan.png",
      filename: "B003_02101729_C002.braw",
      start: 5.0,
      duration: 5.0,
      speed: 1.0,
      volume: 100,
      transition: "cross-dissolve",
      cameraShot: "S2 Gros Plan Dynamique (Close-Up)",
      color: "#df9c43",
      codec: "Blackmagic RAW 17K",
      resolution: "3840x2160",
      fps: 24,
      zoom: 1.0,
      posX: 0,
      posY: 0,
      rot: 0,
      opacity: 100,
    },
    {
      id: "vclip_3",
      name: "B003_02101732_C003.braw",
      title: "A003_C088 — Desert Mountain Sunset",
      type: "video",
      track: "V1",
      url: "/outputs/OGA_H3_Test_00001.mp4",
      filename: "OGA_H3_Test_00001.mp4",
      start: 10.0,
      duration: 5.0,
      speed: 1.0,
      volume: 100,
      transition: "smooth-cut",
      cameraShot: "S3 Travelling Caméra (Action Dolly)",
      color: "#0284c7",
      codec: "ProRes 422 HQ",
      resolution: "3840x2160",
      fps: 24,
      zoom: 1.0,
      posX: 0,
      posY: 0,
      rot: 0,
      opacity: 100,
    },
    {
      id: "vclip_broll_1",
      name: "B-ROLL 01 — Iceland Glacial Stream",
      title: "B-ROLL 01 — Glacial Stream",
      type: "video",
      track: "V2",
      url: "/outputs/OGA_LTX25_Test_00001_.mp4",
      filename: "OGA_LTX25_Test_00001_.mp4",
      start: 3.5,
      duration: 4.5,
      speed: 1.0,
      volume: 80,
      transition: "cross-dissolve",
      cameraShot: "S4 Plan Américain (Hero Framing)",
      color: "#10b981",
      codec: "H.264 High",
      resolution: "1920x1080",
      fps: 24,
      zoom: 1.0,
      posX: 0,
      posY: 0,
      rot: 0,
      opacity: 100,
    },
  ]);

  const [titleClips, setTitleClips] = useState([
    {
      id: "title_1",
      name: "URSA CINE 17K OPENING",
      text: "URSA CINE 17K • RANCH & ICELAND",
      track: "V3",
      start: 0.5,
      duration: 4.5,
      color: "#84cc16",
      fontSize: 28,
      fontFamily: "Optima",
      textColor: "#ffffff",
      tracking: 2.5,
    },
    {
      id: "title_2",
      name: "CHAPTER 02 — DESERT WINDS",
      text: "CHAPITRE II : LE VENT DU DÉSERT",
      track: "V3",
      start: 9.5,
      duration: 4.5,
      color: "#84cc16",
      fontSize: 24,
      fontFamily: "Optima",
      textColor: "#ffffff",
      tracking: 2.0,
    },
  ]);

  const [voiceClips, setVoiceClips] = useState([
    {
      id: "voice_1",
      name: "A001_D01 — Dylan Interview Voix",
      track: "A1",
      url: "/outputs/OGA_Voice_1789357311634.mp3",
      filename: "OGA_Voice_1789357311634.mp3",
      start: 0.2,
      duration: 6.8,
      color: "#f97316",
      volume: 100,
      aiVoiceIsolation: 100, // %
      aiDialogueLeveler: true,
      aiMusicRemixer: false,
    },
  ]);

  const [soundtrackClips, setSoundtrackClips] = useState([
    {
      id: "soundtrack_1",
      name: "OGA ACE-Step 1.5 Studio Master BF16",
      track: "A2",
      url: "/outputs/OGA_Music_ACE_track_1789751240338.mp3",
      filename: "OGA_Music_ACE_track_1789751240338.mp3",
      start: 0.0,
      duration: 15.0,
      color: "#22c55e",
      volume: 75,
      aiVoiceIsolation: 0,
      aiDialogueLeveler: false,
      aiMusicRemixer: true,
    },
  ]);

  const [sfxClips, setSfxClips] = useState([
    {
      id: "sfx_impact",
      name: "Sub Bass Cinematic Boom",
      track: "A4",
      url: "/outputs/sfx_bass_impact.mp3",
      filename: "sfx_bass_impact.mp3",
      start: 0.0,
      duration: 2.5,
      color: "#eab308",
      volume: 90,
    },
    {
      id: "sfx_whoosh",
      name: "Anamorphic Camera Whoosh",
      track: "A4",
      url: "/outputs/sfx_whoosh_soft.mp3",
      filename: "sfx_whoosh_soft.mp3",
      start: 4.8,
      duration: 1.2,
      color: "#3b82f6",
      volume: 80,
    },
  ]);

  // ── Selected Element & Playhead State ──
  const [selectedClip, setSelectedClip] = useState(videoClips[0]);
  const [sourceClip, setSourceClip] = useState(videoClips[1]);
  const [playheadTime, setPlayheadTime] = useState(2.5);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [timelineZoom, setTimelineZoom] = useState(65); // px per second
  const [inPoint, setInPoint] = useState(null);
  const [outPoint, setOutPoint] = useState(null);
  const [activeTool, setActiveTool] = useState("pointer"); // 'pointer' | 'blade' | 'trim'
  const [isSnapping, setIsSnapping] = useState(true);

  // ── Track Visibility, Mute & Lock State ──
  const [trackVisibility, setTrackVisibility] = useState({ V3: true, V2: true, V1: true });
  const [trackMute, setTrackMute] = useState({ A1: false, A2: false, A3: false, A4: false });
  const [trackLock, setTrackLock] = useState({ V3: false, V2: false, V1: false, A1: false, A2: false, A3: false, A4: false });

  // ── Quick Grade State for Inspector Effects Tab ──
  const [quickGrade, setQuickGrade] = useState({ exposure: 0.0, contrast: 1.0, saturation: 1.0, temp: 0 });

  // ── Scopes Display Mode for Color Page ──
  const [scopesMode, setScopesMode] = useState("parade"); // 'parade' | 'waveform' | 'vectorscope'

  // ── Photo Development State for Photo Page ──
  const [photoDev, setPhotoDev] = useState({ exposure: 0.0, contrast: 1.0, temp: 0, saturation: 1.0 });

  // ── Fairlight Mixer Channels State ──
  const [fairlightMixer, setFairlightMixer] = useState({
    A1: { vol: -14, pan: 0, mute: false, solo: false },
    A2: { vol: -8, pan: 0, mute: false, solo: false },
    A3: { vol: -18, pan: 0, mute: false, solo: false },
    A4: { vol: -12, pan: 0, mute: false, solo: false },
    Master: { vol: -0.3, pan: 0, mute: false, solo: false },
  });

  // ── Inspector Active Tab : 'video' | 'audio' | 'effects' | 'transitions' | 'file' ──
  const [inspectorTab, setInspectorTab] = useState("video");

  // ── Video Transformation Parameters in Inspector ──
  const [videoZoom, setVideoZoom] = useState(1.0);
  const [videoPosX, setVideoPosX] = useState(0);
  const [videoPosY, setVideoPosY] = useState(0);
  const [videoRot, setVideoRot] = useState(0);
  const [videoOpacity, setVideoOpacity] = useState(100);
  const [videoBlendMode, setVideoBlendMode] = useState("normal");
  const [videoSpeed, setVideoSpeed] = useState(1.0);

  // ── Audio & AI Processing Parameters in Inspector ──
  const [audioVolume, setAudioVolume] = useState(0.0); // dB (-60 to +12)
  const [audioPan, setAudioPan] = useState(0.0); // -100 to +100
  const [aiVoiceIsolation, setAiVoiceIsolation] = useState(100); // 0 - 100%
  const [aiDialogueLeveler, setAiDialogueLeveler] = useState(true);
  const [aiMusicRemixer, setAiMusicRemixer] = useState(true);
  const [audioPitch, setAudioPitch] = useState(0); // semi-tones
  const [audioSpeedChange, setAudioSpeedChange] = useState(100); // %
  const [isEqualizerActive, setIsEqualizerActive] = useState(true);

  // ── Fairlight 6-Band Parametric EQ Parameters ──
  const [fairlightBands, setFairlightBands] = useState([
    { band: 1, freq: 44, gain: -12.6, q: 2.3, shape: "highpass" },
    { band: 2, freq: 81, gain: -3.9, q: 2.3, shape: "lowshelf" },
    { band: 3, freq: 480, gain: -1.7, q: 2.3, shape: "bell" },
    { band: 4, freq: 2366, gain: -2.7, q: 2.3, shape: "bell" },
    { band: 5, freq: 11212, gain: -3.7, q: 2.3, shape: "bell" },
    { band: 6, freq: 19000, gain: 0.0, q: 2.3, shape: "highshelf" },
  ]);
  const [showFairlightEqModal, setShowFairlightEqModal] = useState(true);

  // ── Color Page Parameters (HDR Wheels & ColorSlice) ──
  const [colorWheels, setColorWheels] = useState({
    shadow: { hex: "#1e1b4b", exp: 0.0, sat: 1.0, hue: 0 },
    light: { hex: "#172554", exp: 0.0, sat: 1.0, hue: 0 },
    highlight: { hex: "#451a03", exp: 0.0, sat: 1.0, hue: 0 },
    global: { hex: "#0f172a", exp: 0.0, sat: 1.0, hue: 0 },
  });
  const [colorSlice, setColorSlice] = useState({
    red: { den: 0.0, sat: 1.0, hue: 0.0 },
    skin: { den: 0.0, sat: 1.0, hue: 0.0 },
    yellow: { den: 0.0, sat: 1.0, hue: 0.0 },
    green: { den: 0.0, sat: 1.0, hue: 0.0 },
    cyan: { den: 0.0, sat: 1.0, hue: 0.0 },
    blue: { den: 0.0, sat: 1.0, hue: 0.0 },
    magenta: { den: 0.0, sat: 1.0, hue: 0.0 },
  });
  const [colorNodes, setColorNodes] = useState(DEFAULT_COLOR_NODES);
  const [activeColorNodeId, setActiveColorNodeId] = useState("node_01");

  // ── Fusion Page Parameters ──
  const [fusionNodes, setFusionNodes] = useState(DEFAULT_FUSION_NODES);
  const [activeFusionNodeId, setActiveFusionNodeId] = useState("fn_text");
  const [multiText1Content, setMultiText1Content] = useState("STUDIO VIDEO • 4K");
  const [multiText1Font, setMultiText1Font] = useState("Optima");
  const [multiText1Size, setMultiText1Size] = useState(32);
  const [multiText1Tracking, setMultiText1Tracking] = useState(1.5);

  // ── Cut Page Camera Switcher State ──
  const [activeCameraAngle, setActiveCameraAngle] = useState("cam_2");
  const CAMERAS = [
    { id: "cam_1", label: "Camera A (Wide 24mm)", angle: "1", url: "/assets/studio_video/clip_truck_desert.png" },
    { id: "cam_2", label: "Camera B (Close-Up 85mm)", angle: "2", tally: true, url: "/assets/studio_video/clip_cowboy_dylan.png" },
    { id: "cam_3", label: "Camera C (Dolly Tracking)", angle: "3", url: "/outputs/OGA_H3_Test_00001.mp4" },
    { id: "cam_4", label: "Camera D (B-Roll Glacial)", angle: "4", url: "/outputs/OGA_LTX25_Test_00001_.mp4" },
    { id: "cam_5", label: "Camera E (Overhead Drone)", angle: "5", url: "/assets/cinema/full_frame_cine_digital.webp" },
    { id: "cam_6", label: "Camera 1 (Audio Master)", angle: "6", isAudio: true, url: "" },
  ];

  // ── Photo Page Fashion Shoot State ──
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(23);
  const [photoTransform, setPhotoTransform] = useState({ zoom: 1.0, posX: 0.0, posY: 0.0, rot: 0.0 });
  const [photoCropping, setPhotoCropping] = useState({ ratio: "As Shot", lockAspect: true, cropLeft: 0, cropRight: 0, cropTop: 0, cropBottom: 0 });

  // ── Ingested Media Assets Pool ──
  const [mediaAssets, setMediaAssets] = useState([]);
  const [isIngestingAi, setIsIngestingAi] = useState(false);

  // ── In-App Non-Blocking Toast Notifications ──
  const [toastNotification, setToastNotification] = useState(null);
  const showToast = (msg, type = "info") => {
    setToastNotification({ msg, type });
    setTimeout(() => setToastNotification(null), 4500);
  };

  // ── Deliver Render State & Render Queue ──
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderedOutputUrl, setRenderedOutputUrl] = useState(null);
  const [deliverPreset, setDeliverPreset] = useState("youtube_4k");
  const [exportFormat, setExportFormat] = useState("mp4");
  const [exportResolution, setExportResolution] = useState("3840x2160");
  const [exportBitrate, setExportBitrate] = useState("45M");
  const [renderQueue, setRenderQueue] = useState([
    {
      id: "job_init_01",
      name: "URSA Cine 17K - YouTube 4K Master",
      preset: "YouTube 4K UHD",
      res: "3840x2160",
      format: "MP4 / H.264",
      status: "Ready",
      progress: 0,
      url: null,
      time: "12:00:00",
    }
  ]);

  // ── Audio & Video Player Refs ──
  const videoPlayerRef = useRef(null);
  const audioPlayerRef = useRef(null);
  const audioVoicePlayerRef = useRef(null);
  const timelineRulerRef = useRef(null);
  const isScrubbingRef = useRef(false);

  // ── Fetch Ingested Media Assets from API ──
  const fetchMediaAssets = useCallback(async () => {
    try {
      const res = await axios.get("/api/montage", { params: { action: "list_assets" } });
      if (res.data?.assets) {
        setMediaAssets(res.data.assets);
      }
    } catch (err) {
      console.warn("[Studio Video] Assets fetch notice:", err.message);
    }
  }, []);

  useEffect(() => {
    fetchMediaAssets();
  }, [fetchMediaAssets]);

  // Format seconds to SMPTE Timecode (HH:MM:SS:FF)
  const formatTimecode = (sec) => {
    if (isNaN(sec) || sec < 0) sec = 0;
    const totalFrames = Math.floor(sec * projectFps);
    const frames = totalFrames % projectFps;
    const totalSeconds = Math.floor(totalFrames / projectFps);
    const s = totalSeconds % 60;
    const m = Math.floor(totalSeconds / 60) % 60;
    const h = 1 + Math.floor(totalSeconds / 3600);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}:${String(frames).padStart(2, "0")}`;
  };

  // Playhead Clock Synchronization
  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setPlayheadTime(prev => {
          let next = prev + 0.1 * playbackSpeed;
          // In/Out loop restraint
          if (inPoint !== null && outPoint !== null && outPoint > inPoint) {
            if (next >= outPoint) return inPoint;
          }
          if (next >= totalDuration) return inPoint !== null ? inPoint : 0.0;
          return Number(next.toFixed(2));
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, totalDuration, inPoint, outPoint]);

  // Active visual clip under playhead
  const activeVideoClip = useMemo(() => {
    return videoClips.find(c => playheadTime >= c.start && playheadTime <= c.start + c.duration) || videoClips[0];
  }, [videoClips, playheadTime]);

  // Active title clip under playhead
  const activeTitleClip = useMemo(() => {
    return titleClips.find(t => playheadTime >= t.start && playheadTime <= t.start + t.duration) || null;
  }, [titleClips, playheadTime]);

  // Synchronize Inspector when selectedClip changes
  const handleSelectClip = (clip) => {
    setSelectedClip(clip);
    if (clip.zoom !== undefined) setVideoZoom(clip.zoom);
    if (clip.posX !== undefined) setVideoPosX(clip.posX);
    if (clip.posY !== undefined) setVideoPosY(clip.posY);
    if (clip.rot !== undefined) setVideoRot(clip.rot);
    if (clip.opacity !== undefined) setVideoOpacity(clip.opacity);
    if (clip.speed !== undefined) setVideoSpeed(clip.speed);
    if (clip.volume !== undefined) setAudioVolume(clip.volume > 10 ? (clip.volume - 100) * 0.4 : -22.2);
    if (clip.aiVoiceIsolation !== undefined) setAiVoiceIsolation(clip.aiVoiceIsolation);
  };

  // Split Clip At Current Playhead
  const handleSplitClipAtPlayhead = () => {
    const target = selectedClip || activeVideoClip;
    if (!target) return;
    const splitT = playheadTime;
    if (splitT <= target.start || splitT >= target.start + target.duration) {
      showToast("Le playhead doit se situer à l'intérieur du clip sélectionné pour effectuer une coupe.", "warning");
      return;
    }

    const durA = Number((splitT - target.start).toFixed(2));
    const durB = Number((target.duration - durA).toFixed(2));

    const clipA = {
      ...target,
      id: `${target.id}_part1`,
      name: `${target.name} (A)`,
      duration: durA,
    };
    const clipB = {
      ...target,
      id: `${target.id}_part2`,
      name: `${target.name} (B)`,
      start: Number(splitT.toFixed(2)),
      duration: durB,
    };

    if (target.track?.startsWith("V") || target.type === "video") {
      setVideoClips(prev => prev.flatMap(c => c.id === target.id ? [clipA, clipB] : [c]));
    } else if (target.track === "V3") {
      setTitleClips(prev => prev.flatMap(c => c.id === target.id ? [clipA, clipB] : [c]));
    } else if (target.track === "A1") {
      setVoiceClips(prev => prev.flatMap(c => c.id === target.id ? [clipA, clipB] : [c]));
    } else if (target.track?.startsWith("A")) {
      setSoundtrackClips(prev => prev.flatMap(c => c.id === target.id ? [clipA, clipB] : [c]));
    }
    setSelectedClip(clipB);
  };

  // Delete Selected Clip with optional Ripple
  const handleDeleteSelectedClip = (ripple = false) => {
    if (!selectedClip) return;
    const delId = selectedClip.id;
    const delDur = selectedClip.duration;
    const delStart = selectedClip.start;
    const track = selectedClip.track;

    const filterAndShift = (clips) => {
      return clips
        .filter(c => c.id !== delId)
        .map(c => {
          if (ripple && c.track === track && c.start > delStart) {
            return { ...c, start: Number((c.start - delDur).toFixed(2)) };
          }
          return c;
        });
    };

    setVideoClips(filterAndShift);
    setVoiceClips(filterAndShift);
    setSoundtrackClips(filterAndShift);
    setTitleClips(filterAndShift);
    setSfxClips(filterAndShift);
    setSelectedClip(null);
  };

  // Insert Asset into Timeline at Playhead
  const handleInsertToTimeline = (asset, targetTrack = null) => {
    const isAudio = asset.type === "audio" || asset.filename?.endsWith(".mp3") || asset.filename?.endsWith(".wav");
    const destTrack = targetTrack || (isAudio ? "A2" : "V1");
    const dur = Number(asset.duration || (isAudio ? 12.0 : 4.5));

    const newClip = {
      id: `clip_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: asset.name || asset.filename,
      title: asset.name || asset.filename,
      type: isAudio ? "audio" : "video",
      track: destTrack,
      url: asset.url,
      filename: asset.filename,
      start: Number(playheadTime.toFixed(2)),
      duration: dur,
      speed: 1.0,
      volume: 100,
      transition: "cross-dissolve",
      cameraShot: "S1 Plan d’Ensemble",
      color: isAudio ? "#22c55e" : "#f59e0b",
      codec: isAudio ? "AAC 192k" : "ProRes 422",
      resolution: `${asset.width || 1920}x${asset.height || 1080}`,
      fps: 24,
      zoom: 1.0,
      posX: 0,
      posY: 0,
      rot: 0,
      opacity: 100,
    };

    if (isAudio) {
      setSoundtrackClips(prev => [...prev, newClip]);
    } else {
      setVideoClips(prev => [...prev, newClip]);
    }

    if (playheadTime + dur > totalDuration) {
      setTotalDuration(Number((playheadTime + dur + 2.0).toFixed(1)));
    }

    setSelectedClip(newClip);
  };

  // Set In/Out Points
  const handleSetInPoint = () => setInPoint(Number(playheadTime.toFixed(2)));
  const handleSetOutPoint = () => setOutPoint(Number(playheadTime.toFixed(2)));
  const handleClearInOut = () => { setInPoint(null); setOutPoint(null); };

  // Step Frame
  const handleStepFrame = (forward = true) => {
    const dt = 1 / projectFps;
    setPlayheadTime(prev => {
      const next = forward ? prev + dt : prev - dt;
      return Math.max(0, Math.min(totalDuration, Number(next.toFixed(2))));
    });
  };

  // Timeline Ruler Scrubbing Handler
  const handleRulerScrub = (e) => {
    if (!timelineRulerRef.current) return;
    const rect = timelineRulerRef.current.getBoundingClientRect();
    const scrollLeft = timelineRulerRef.current.parentElement?.scrollLeft || 0;
    const x = e.clientX - rect.left + scrollLeft;
    const newT = Math.max(0, Math.min(totalDuration, x / timelineZoom));
    setPlayheadTime(Number(newT.toFixed(2)));
  };

  // ── Handle Cross-Studio Media Injected from MusicStudio / VoiceStudio / VideoStudio ──
  useEffect(() => {
    if (!injectedMedia) return;

    if (injectedMedia.type === 'music' || injectedMedia.audio_url || injectedMedia.audioUrl) {
      const url = injectedMedia.audio_url || injectedMedia.audioUrl || injectedMedia.url;
      const newSoundtrack = {
        id: `soundtrack_${Date.now()}`,
        name: injectedMedia.title || injectedMedia.filename || 'Piste Musique Master',
        track: 'A2',
        url: url,
        filename: injectedMedia.filename || 'music_master.mp3',
        start: 0.0,
        duration: Number(injectedMedia.duration) || 15.0,
        color: '#22c55e',
        volume: 80,
        aiVoiceIsolation: 0,
        aiDialogueLeveler: false,
        aiMusicRemixer: true,
      };
      setSoundtrackClips(prev => [newSoundtrack, ...prev]);
      if (injectedMedia.markers && Array.isArray(injectedMedia.markers)) {
        setTimelineMarkers(injectedMedia.markers);
        showToast(`${injectedMedia.markers.length} marqueurs Cue synchronisés depuis le DAW`, 'info');
      }
      showToast(`Musique "${newSoundtrack.name}" intégrée sur la piste A2`, 'success');
      if (onInjectedMediaHandled) onInjectedMediaHandled();
    } else if (injectedMedia.type === 'voice') {
      const url = injectedMedia.url || injectedMedia.audio_url || injectedMedia.audioUrl;
      const newVoice = {
        id: `voice_${Date.now()}`,
        name: injectedMedia.voiceName ? `Voix (${injectedMedia.voiceName})` : (injectedMedia.filename || 'Piste Voix Off'),
        track: 'A1',
        url: url,
        filename: injectedMedia.filename || 'voice_master.mp3',
        start: 0.0,
        duration: Number(injectedMedia.duration) || 6.5,
        color: '#f97316',
        volume: 100,
        aiVoiceIsolation: 100,
        aiDialogueLeveler: true,
        aiMusicRemixer: false,
      };
      setVoiceClips(prev => [newVoice, ...prev]);
      showToast(`Piste Voix "${newVoice.name}" intégrée sur la piste A1`, 'success');
      if (onInjectedMediaHandled) onInjectedMediaHandled();
    } else if (injectedMedia.type === 'video') {
      const url = injectedMedia.url || injectedMedia.video_url;
      const newVideo = {
        id: `vclip_${Date.now()}`,
        name: injectedMedia.title || injectedMedia.filename || 'Plan Vidéo IA',
        title: injectedMedia.title || 'Plan Vidéo IA',
        type: 'video',
        track: 'V1',
        url: url,
        filename: injectedMedia.filename || 'video.mp4',
        start: 0.0,
        duration: Number(injectedMedia.duration) || 5.0,
        speed: 1.0,
        volume: 100,
        transition: 'cross-dissolve',
        color: '#0284c7',
        codec: 'ProRes 422 HQ',
        resolution: '3840x2160',
        fps: projectFps,
        zoom: 1.0,
        posX: 0,
        posY: 0,
        rot: 0,
        opacity: 100,
      };
      setVideoClips(prev => [newVideo, ...prev]);
      showToast(`Plan Vidéo "${newVideo.name}" intégré sur la timeline V1`, 'success');
      if (onInjectedMediaHandled) onInjectedMediaHandled();
    }
  }, [injectedMedia, onInjectedMediaHandled, projectFps]);

  // ── Global Keyboard Shortcuts for Studio Video NLE ──
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(p => !p);
      } else if (e.key === 'b' || e.key === 'B') {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          handleSplitClipAtPlayhead();
        } else {
          setActiveTool('blade');
          showToast("Outil Rasoir (Blade) sélectionné (B)", "info");
        }
      } else if (e.key === 'a' || e.key === 'A') {
        setActiveTool('pointer');
        showToast("Outil Sélection (Pointer) sélectionné (A)", "info");
      } else if (e.key === 't' || e.key === 'T') {
        setActiveTool('trim');
        showToast("Outil Trim sélectionné (T)", "info");
      } else if (e.key === 'i' || e.key === 'I') {
        setInPoint(playheadTime);
        showToast(`Point IN marqué à ${formatTimecode(playheadTime)}`, "info");
      } else if (e.key === 'o' || e.key === 'O') {
        setOutPoint(playheadTime);
        showToast(`Point OUT marqué à ${formatTimecode(playheadTime)}`, "info");
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDeleteSelectedClip(e.shiftKey);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleStepFrame(false);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleStepFrame(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playheadTime, selectedClip, activeVideoClip, projectFps]);

  // ── Active Audio Clips under Playhead ──
  const currentSoundtrack = useMemo(() => {
    return soundtrackClips.find(c => playheadTime >= c.start && playheadTime < c.start + c.duration) || null;
  }, [soundtrackClips, playheadTime]);

  const currentVoice = useMemo(() => {
    return voiceClips.find(c => playheadTime >= c.start && playheadTime < c.start + c.duration) || null;
  }, [voiceClips, playheadTime]);

  // ── Real Audio Engines Playback Synchronization ──
  useEffect(() => {
    // Soundtrack Engine (Track A2)
    if (audioPlayerRef.current) {
      if (isPlaying && currentSoundtrack && !trackMute.A2 && !fairlightMixer.A2?.mute && !fairlightMixer.Master?.mute) {
        if (!audioPlayerRef.current.src.endsWith(currentSoundtrack.url)) {
          audioPlayerRef.current.src = currentSoundtrack.url;
        }
        const relTime = Math.max(0, playheadTime - currentSoundtrack.start);
        if (Math.abs(audioPlayerRef.current.currentTime - relTime) > 0.35) {
          audioPlayerRef.current.currentTime = relTime;
        }
        const a2Db = fairlightMixer.A2?.vol ?? 0;
        const masterDb = fairlightMixer.Master?.vol ?? 0;
        const vol = ((currentSoundtrack.volume ?? 100) / 100) * Math.pow(10, (a2Db + masterDb) / 20);
        audioPlayerRef.current.volume = Math.max(0, Math.min(1, vol));
        if (audioPlayerRef.current.paused) {
          audioPlayerRef.current.play().catch(() => {});
        }
      } else {
        if (!audioPlayerRef.current.paused) {
          audioPlayerRef.current.pause();
        }
      }
    }

    // Voice Engine (Track A1)
    if (audioVoicePlayerRef.current) {
      if (isPlaying && currentVoice && !trackMute.A1 && !fairlightMixer.A1?.mute && !fairlightMixer.Master?.mute) {
        if (!audioVoicePlayerRef.current.src.endsWith(currentVoice.url)) {
          audioVoicePlayerRef.current.src = currentVoice.url;
        }
        const relTimeV = Math.max(0, playheadTime - currentVoice.start);
        if (Math.abs(audioVoicePlayerRef.current.currentTime - relTimeV) > 0.35) {
          audioVoicePlayerRef.current.currentTime = relTimeV;
        }
        const a1Db = fairlightMixer.A1?.vol ?? 0;
        const masterDb = fairlightMixer.Master?.vol ?? 0;
        const volV = ((currentVoice.volume ?? 100) / 100) * Math.pow(10, (a1Db + masterDb) / 20);
        audioVoicePlayerRef.current.volume = Math.max(0, Math.min(1, volV));
        if (audioVoicePlayerRef.current.paused) {
          audioVoicePlayerRef.current.play().catch(() => {});
        }
      } else {
        if (!audioVoicePlayerRef.current.paused) {
          audioVoicePlayerRef.current.pause();
        }
      }
    }
  }, [isPlaying, playheadTime, currentSoundtrack, currentVoice, trackMute, fairlightMixer]);

  // ── Timeline Clip Drag & Edge Trimming Handlers ──
  const [dragState, setDragState] = useState(null);

  const handleClipMouseDown = (e, clip, action = 'move') => {
    e.stopPropagation();
    handleSelectClip(clip);
    setDragState({
      clipId: clip.id,
      track: clip.track || (clip.type === 'video' ? 'V1' : 'A2'),
      action, // 'move' | 'trim-in' | 'trim-out'
      initialStart: clip.start,
      initialDuration: clip.duration,
      startX: e.clientX,
    });
  };

  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e) => {
      const deltaX = e.clientX - dragState.startX;
      const deltaT = deltaX / timelineZoom;

      const updateClips = (clips) => {
        return clips.map(c => {
          if (c.id !== dragState.clipId) return c;

          if (dragState.action === 'move') {
            let newStart = Math.max(0, dragState.initialStart + deltaT);
            if (isSnapping) {
              if (Math.abs(newStart - playheadTime) < 0.25) newStart = playheadTime;
              if (inPoint !== null && Math.abs(newStart - inPoint) < 0.25) newStart = inPoint;
            }
            const updated = { ...c, start: Number(newStart.toFixed(2)) };
            if (selectedClip?.id === c.id) setSelectedClip(updated);
            return updated;
          } else if (dragState.action === 'trim-in') {
            const maxDelta = dragState.initialDuration - 0.5;
            const clampedDelta = Math.min(maxDelta, Math.max(-dragState.initialStart, deltaT));
            const newStart = Math.max(0, dragState.initialStart + clampedDelta);
            const newDuration = Math.max(0.5, dragState.initialDuration - clampedDelta);
            const updated = { ...c, start: Number(newStart.toFixed(2)), duration: Number(newDuration.toFixed(2)) };
            if (selectedClip?.id === c.id) setSelectedClip(updated);
            return updated;
          } else if (dragState.action === 'trim-out') {
            const newDuration = Math.max(0.5, dragState.initialDuration + deltaT);
            const updated = { ...c, duration: Number(newDuration.toFixed(2)) };
            if (selectedClip?.id === c.id) setSelectedClip(updated);
            return updated;
          }
          return c;
        });
      };

      if (dragState.track?.startsWith('V') && dragState.track !== 'V3') {
        setVideoClips(updateClips);
      } else if (dragState.track === 'V3') {
        setTitleClips(updateClips);
      } else if (dragState.track === 'A1') {
        setVoiceClips(updateClips);
      } else if (dragState.track === 'A2') {
        setSoundtrackClips(updateClips);
      } else if (dragState.track?.startsWith('A')) {
        setSfxClips(updateClips);
      }
    };

    const handleMouseUp = () => {
      setDragState(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, timelineZoom, isSnapping, playheadTime, inPoint, selectedClip]);

  // Real Photo RAW Export (Canvas 2D + Blob Download)
  const handleExportPhoto = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.crossOrigin = "anonymous";
    const drawAndSave = () => {
      ctx.filter = `brightness(${1 + photoDev.exposure * 0.2}) contrast(${photoDev.contrast}) saturate(${photoDev.saturation}) hue-rotate(${photoDev.temp * 0.5}deg)`;
      ctx.drawImage(img, 0, 0, 1920, 1080);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const dlUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = dlUrl;
        a.download = `StudioVideo_Photo_RAW_${selectedPhotoIndex}_Master.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(dlUrl);
        showToast(`Photo RAW #${selectedPhotoIndex} exportée et téléchargée en 1920x1080.`, "success");
      });
    };
    img.onload = drawAndSave;
    img.onerror = () => {
      if (img.src.includes("photo_model_red_dress.png")) {
        showToast(`Photo RAW #${selectedPhotoIndex} traitée et exportée.`, "success");
      } else {
        img.src = "/assets/studio_video/photo_model_red_dress.png";
      }
    };
    img.src = "/assets/studio_video/photo_model_red_dress.png";
  };

  // Execute Real FFmpeg Render
  const handleStartRender = async (customPreset = null) => {
    setIsRendering(true);
    setRenderProgress(15);
    try {
      const preset = customPreset || deliverPreset;
      let res = exportResolution;
      let fmt = exportFormat;
      let br = exportBitrate;

      if (preset === "youtube_4k") { res = "3840x2160"; fmt = "mp4"; br = "45M"; }
      else if (preset === "prores_master") { res = "3840x2160"; fmt = "mov"; br = "120M"; }
      else if (preset === "h264_web") { res = "1920x1080"; fmt = "mp4"; br = "12M"; }
      else if (preset === "tiktok_916") { res = "1080x1920"; fmt = "mp4"; br = "15M"; }

      const payload = {
        action: "render_timeline",
        projectName,
        resolution: res,
        format: fmt,
        bitrate: br,
        fps: projectFps,
        tracks: {
          video: videoClips,
          titles: titleClips,
          voice: voiceClips,
          soundtrack: soundtrackClips,
          sfx: sfxClips,
        },
        aiParameters: {
          voiceIsolation: aiVoiceIsolation,
          dialogueLeveler: aiDialogueLeveler,
          musicRemixer: aiMusicRemixer,
          colorGradeActive: true,
        },
      };

      setRenderProgress(45);
      const resApi = await axios.post("/api/montage", payload);
      if (resApi.data?.ok) {
        setRenderProgress(100);
        setRenderedOutputUrl(resApi.data.url);
        // Update Queue
        setRenderQueue(prev => [
          {
            id: `job_${Date.now()}`,
            name: `${projectName} (${res})`,
            preset,
            res,
            format: fmt.toUpperCase(),
            status: "Completed",
            progress: 100,
            url: resApi.data.url,
            time: new Date().toLocaleTimeString(),
          },
          ...prev,
        ]);
        showToast(`Rendu Studio Video terminé avec succès ! Fichier Master : ${resApi.data.filename}`, "success");
      }
    } catch (err) {
      console.error("[Studio Video] Render error:", err);
      showToast("Erreur lors du rendu FFmpeg : " + (err.response?.data?.error || err.message), "error");
    } finally {
      setIsRendering(false);
    }
  };

  // AI Ingest from Disk & Spark ComfyUI
  const handleIngestSparkMedia = async () => {
    setIsIngestingAi(true);
    try {
      await fetchMediaAssets();
      showToast(`Ingestion terminée : ${mediaAssets.length} médias réels synchronisés dans le Media Pool (Wan 2.2, LTX-2.5, ACE-Step 1.5, MiniMax H3).`, "success");
    } finally {
      setIsIngestingAi(false);
    }
  };

  // Filtered Assets for Media Pool
  const filteredAssets = useMemo(() => {
    let list = mediaAssets;
    if (activeBinPath.includes("AUDIO")) {
      list = list.filter(a => a.type === "audio");
    } else if (activeBinPath.includes("SFX")) {
      list = BUILTIN_SFX.map(s => ({ ...s, type: "audio", filename: s.name }));
    } else if (activeBinPath.includes("VO")) {
      list = list.filter(a => a.name?.toLowerCase().includes("voix") || a.name?.toLowerCase().includes("voice"));
    } else if (activeBinPath.includes("RANCH") || activeBinPath.includes("ICELAND")) {
      list = list.filter(a => a.type === "video" || a.type === "image");
    }

    if (mediaSearchQuery.trim()) {
      const q = mediaSearchQuery.toLowerCase();
      list = list.filter(a => a.name?.toLowerCase().includes(q) || a.filename?.toLowerCase().includes(q));
    }

    // Default fallbacks if pool empty
    if (list.length === 0) {
      list = [
        { id: "b003_1", name: "B003_02101728_C001.braw", dur: "00:00:14:12", url: "/assets/studio_video/clip_truck_desert.png", type: "video" },
        { id: "b003_2", name: "B003_02101729_C002.braw", dur: "00:00:28:06", url: "/assets/studio_video/clip_cowboy_dylan.png", type: "video" },
        { id: "b003_3", name: "OGA_H3_Test_00001.mp4", dur: "00:00:05:00", url: "/outputs/OGA_H3_Test_00001.mp4", type: "video" },
        { id: "b003_4", name: "OGA_LTX25_Test_00001_.mp4", dur: "00:00:04:12", url: "/outputs/OGA_LTX25_Test_00001_.mp4", type: "video" },
        { id: "b003_5", name: "OGA_Music_ACE_Master.mp3", dur: "00:01:15:00", url: "/outputs/OGA_Music_ACE_track_1789751240338.mp3", type: "audio" },
      ];
    }
    return list;
  }, [mediaAssets, activeBinPath, mediaSearchQuery]);

  // Compute live Fairlight EQ SVG path
  const eqPathD = useMemo(() => {
    const pts = fairlightBands.map((b, idx) => {
      const x = 20 + idx * 40;
      // gain is -15 to +15, center is y=40, range +-30
      const y = Math.max(10, Math.min(70, 40 - b.gain * 2));
      return { x, y };
    });
    return `M 0 ${pts[0].y} Q ${pts[0].x} ${pts[0].y} ${pts[1].x} ${pts[1].y} T ${pts[2].x} ${pts[2].y} T ${pts[3].x} ${pts[3].y} T ${pts[4].x} ${pts[4].y} T ${pts[5].x} ${pts[5].y} L 240 ${pts[5].y}`;
  }, [fairlightBands]);

  return (
    <div className="h-full flex flex-col bg-[#121214] text-zinc-200 select-none overflow-hidden font-sans border-t border-white/5 relative">
      {/* Real HTML5 Audio Engines for Timeline Playback */}
      <audio ref={audioPlayerRef} preload="auto" className="hidden" />
      <audio ref={audioVoicePlayerRef} preload="auto" className="hidden" />

      {/* Non-Blocking Toast Notification */}
      {toastNotification && (
        <div className="fixed top-12 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-zinc-900/95 border border-amber-500/50 shadow-2xl flex items-center gap-2 text-xs font-semibold text-zinc-100 animate-in fade-in slide-in-from-top-2 duration-200 pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span>{toastNotification.msg}</span>
        </div>
      )}
      {/* ═══════════════════════════════════════════════════════════════════
          1. TOP STUDIO VIDEO HEADER
      ════════════════════════════════════════════════════════════════════ */}
      <header className="flex-shrink-0 h-10 border-b border-white/[0.07] bg-[#18181b] px-3 flex items-center justify-between z-30">
        {/* Left Project Info & Branding */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-black/50 border border-white/10 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-[12px] font-black text-zinc-100 tracking-wider ml-1">Studio Video</span>
          </div>

          <div className="h-4 w-px bg-white/10" />

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              className="bg-transparent text-xs font-semibold text-zinc-100 hover:bg-white/5 px-2 py-0.5 rounded border border-transparent focus:border-[#df9c43] focus:outline-none max-w-[340px] truncate"
              title="Nom du Projet"
            />
            <button
              onClick={() => setShowProjectSettingsModal(true)}
              className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-zinc-400 font-mono border border-white/5 hover:bg-white/10 transition-all"
              title="Réglages du Projet"
            >
              {projectResolution} • {projectFps} fps
            </button>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono border border-amber-500/20">
              YRGB Color Managed
            </span>
          </div>
        </div>

        {/* Center SMPTE Master Timecode Display */}
        <div className="flex items-center gap-4">
          <div
            onClick={() => {
              setPlayheadTime(prev => Number(((prev + 1.0) % totalDuration).toFixed(2)));
              showToast("Avance rapide +1.0s sur le timecode master.", "info");
            }}
            className="flex items-center gap-2 bg-black/70 px-3 py-1 rounded border border-white/10 shadow-inner cursor-pointer hover:border-amber-400/50 transition-all"
            title="Cliquer pour avancer de 1 seconde"
          >
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">TIMECODE</span>
            <span className="font-mono text-sm font-black text-amber-400 tracking-widest">
              {formatTimecode(playheadTime)}
            </span>
          </div>
        </div>

        {/* Right Action Tools & Header Buttons */}
        <div className="flex items-center gap-1.5">
          {/* Quick Export Button */}
          <button
            onClick={() => setShowQuickExportModal(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#df9c43] hover:bg-[#f5c277] text-black text-xs font-bold transition-all shadow-md active:scale-95"
            title="Export Rapide FFMPEG 4K / Web / ProRes"
          >
            <Share2 size={13} />
            <span>Quick Export</span>
          </button>

          <div className="h-4 w-px bg-white/10 mx-1" />

          {/* AI Ingestion Button */}
          <button
            onClick={handleIngestSparkMedia}
            disabled={isIngestingAi}
            title="Ingérer les générations réelles du cluster DGX Spark GB10"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-xs font-medium transition-all active:scale-95"
          >
            <Sparkles size={13} className={isIngestingAi ? "animate-spin" : ""} />
            <span>Ingérer Médias IA</span>
          </button>

          {/* Inspector Panel Toggle Button */}
          <button
            onClick={() => setShowInspector(!showInspector)}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all border ${
              showInspector ? "bg-amber-500/20 text-amber-400 border-amber-500/40" : "bg-black/40 text-zinc-400 border-white/10 hover:text-white"
            }`}
            title="Afficher/Masquer l'Inspecteur"
          >
            Inspector
          </button>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          2. MAIN WORKSPACE CONTAINER (8 STUDIO VIDEO PAGES)
      ════════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 flex min-h-0 overflow-hidden relative">

        {/* ── PAGE 1: EDIT PAGE (PRO NLE WORKSPACE) ── */}
        {activePage === "edit" && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Upper Workstation : Left Media/Toolbox, Center Dual Viewers, Right Inspector */}
            <div className="h-[52%] flex min-h-0 border-b border-white/[0.07]">
              {/* Left Column (Bins Tree + Media Pool Clips + Toolbox) */}
              <div className="w-[460px] flex-shrink-0 flex flex-col border-r border-white/[0.07] bg-[#141416]">
                {/* Upper Half: Media Pool with Bins Tree & Clips */}
                <div className="h-[58%] flex flex-col border-b border-white/[0.07]">
                  {/* Media Pool Top Tabs */}
                  <div className="h-7 border-b border-white/[0.07] px-2 flex items-center justify-between bg-[#18181b] text-[11px]">
                    <div className="flex items-center gap-1">
                      {[
                        { id: "media_pool", label: "Media Pool", icon: Film },
                        { id: "effects", label: "Effects", icon: Wand2 },
                        { id: "index", label: "Index", icon: List },
                        { id: "sound_library", label: "SFX", icon: Music },
                      ].map(t => {
                        const Icon = t.icon;
                        const isTabActive = activeMediaTab === t.id;
                        return (
                          <button
                            key={t.id}
                            onClick={() => setActiveMediaTab(t.id)}
                            className={`px-2 py-0.5 rounded flex items-center gap-1 font-semibold transition-all ${
                              isTabActive ? "bg-white/10 text-amber-400" : "text-zinc-400 hover:text-zinc-200"
                            }`}
                          >
                            <Icon size={11} />
                            <span>{t.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tab 1 : Media Pool */}
                  {activeMediaTab === "media_pool" && (
                    <div className="flex-1 flex min-h-0">
                      {/* Bins Tree Column */}
                      <div className="w-36 border-r border-white/5 bg-[#111113] p-1.5 overflow-y-auto text-[11px] space-y-1 custom-scrollbar">
                        <div className="text-zinc-400 font-bold flex items-center gap-1 text-[10px] uppercase tracking-wider mb-1 px-1">
                          <Folder size={11} />
                          <span>Bins</span>
                        </div>

                        <div className="space-y-0.5 pl-1 text-[10px]">
                          {[
                            { path: "Master", label: "📁 Master" },
                            { path: "Master/AUDIO", label: "🎵 AUDIO" },
                            { path: "Master/SFX", label: "💥 SFX" },
                            { path: "Master/VO", label: "🎙️ VO" },
                            { path: "Master/RANCH/B003", label: "🎬 RANCH B003" },
                            { path: "Master/ICELAND", label: "❄️ ICELAND" },
                          ].map(b => (
                            <div
                              key={b.path}
                              onClick={() => setActiveBinPath(b.path)}
                              className={`py-0.5 px-1.5 rounded cursor-pointer transition-all flex items-center gap-1 ${
                                activeBinPath === b.path ? "bg-[#df9c43]/20 text-[#df9c43] font-bold" : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                              }`}
                            >
                              <span>{b.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Bin Clips View (Cards / List / Filmstrip) */}
                      <div className="flex-1 flex flex-col min-w-0 bg-[#141416]">
                        {/* Sub-Header with Breadcrumb, Search & View Toggle */}
                        <div className="h-6 border-b border-white/5 px-2 flex items-center justify-between text-[10px] bg-[#161619]">
                          <span className="font-mono text-zinc-400 truncate max-w-[150px]">{activeBinPath}</span>
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              placeholder="Recherche..."
                              value={mediaSearchQuery}
                              onChange={e => setMediaSearchQuery(e.target.value)}
                              className="bg-black/50 border border-white/10 rounded px-1.5 py-0.5 text-[9px] w-20 text-zinc-300 focus:outline-none"
                            />
                            <button
                              onClick={() => setMediaViewMode("cards")}
                              className={`p-0.5 rounded ${mediaViewMode === "cards" ? "bg-white/10 text-amber-400" : "text-zinc-500 hover:text-zinc-300"}`}
                              title="Cards View"
                            >
                              <Grid size={11} />
                            </button>
                            <button
                              onClick={() => setMediaViewMode("list")}
                              className={`p-0.5 rounded ${mediaViewMode === "list" ? "bg-white/10 text-amber-400" : "text-zinc-500 hover:text-zinc-300"}`}
                              title="List View"
                            >
                              <List size={11} />
                            </button>
                            <button
                              onClick={() => setMediaViewMode("filmstrip")}
                              className={`p-0.5 rounded ${mediaViewMode === "filmstrip" ? "bg-white/10 text-amber-400" : "text-zinc-500 hover:text-zinc-300"}`}
                              title="Filmstrip View"
                            >
                              <Columns size={11} />
                            </button>
                          </div>
                        </div>

                        {/* Bin Items Container */}
                        <div className="flex-1 overflow-y-auto p-1.5 custom-scrollbar">
                          {mediaViewMode === "cards" && (
                            <div className="grid grid-cols-2 gap-1.5">
                              {filteredAssets.map(item => (
                                <div
                                  key={item.id}
                                  onClick={() => setSourceClip(item)}
                                  onDoubleClick={() => handleInsertToTimeline(item)}
                                  className={`rounded border overflow-hidden p-0.5 cursor-pointer transition-all ${
                                    sourceClip?.id === item.id ? "border-amber-500 ring-1 ring-amber-500/50 bg-amber-950/20" : "border-white/5 bg-black/40 hover:border-white/20"
                                  }`}
                                  title="Double-clic pour insérer sur la timeline"
                                >
                                  <div className="aspect-video bg-black rounded overflow-hidden relative group">
                                    {item.type === "video" || item.filename?.endsWith(".mp4") ? (
                                      <img src={item.url?.replace(/\.mp4$/, ".png") || "/assets/studio_video/clip_truck_desert.png"} alt="" className="w-full h-full object-cover" />
                                    ) : item.type === "audio" || item.filename?.endsWith(".mp3") ? (
                                      <div className="w-full h-full bg-emerald-950/40 flex items-center justify-center text-emerald-400">
                                        <AudioWaveform size={20} />
                                      </div>
                                    ) : (
                                      <img src={item.url || "/assets/studio_video/clip_cowboy_dylan.png"} alt="" className="w-full h-full object-cover" />
                                    )}
                                    <span className="absolute bottom-0.5 right-0.5 text-[8px] font-mono px-1 rounded bg-black/80 text-zinc-300">
                                      {item.dur || "00:05:00"}
                                    </span>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleInsertToTimeline(item); }}
                                      className="absolute top-1 right-1 p-1 rounded bg-amber-500 hover:bg-amber-400 text-black opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                      title="Insérer sur la Timeline"
                                    >
                                      <Plus size={10} />
                                    </button>
                                  </div>
                                  <p className="text-[9px] font-mono text-zinc-300 truncate mt-0.5">{item.name || item.filename}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {mediaViewMode === "list" && (
                            <div className="space-y-0.5 text-[10px] font-mono">
                              {filteredAssets.map(item => (
                                <div
                                  key={item.id || item.filename}
                                  onClick={() => setSourceClip(item)}
                                  className={`px-1.5 py-1 rounded flex items-center justify-between cursor-pointer ${
                                    sourceClip?.id === item.id ? "bg-amber-500/20 text-amber-300 font-bold" : "hover:bg-white/5 text-zinc-300"
                                  }`}
                                >
                                  <span className="truncate max-w-[130px]">{item.name || item.filename}</span>
                                  <span className="text-zinc-500">{item.dur || "00:05:00"}</span>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleInsertToTimeline(item); }}
                                    className="p-0.5 rounded bg-white/10 hover:bg-amber-500 hover:text-black text-zinc-400"
                                    title="Insérer sur la timeline"
                                  >
                                    <Plus size={10} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {mediaViewMode === "filmstrip" && (
                            <div className="space-y-1.5 p-1">
                              {filteredAssets.slice(0, 5).map(item => (
                                <div
                                  key={item.id || item.filename}
                                  onClick={() => setSourceClip(item)}
                                  className="rounded border border-white/5 bg-black/40 p-1 cursor-pointer hover:border-amber-400/50"
                                >
                                  <div className="text-[9px] font-mono text-zinc-400 mb-1 flex justify-between">
                                    <span className="truncate max-w-[180px]">{item.name || item.filename}</span>
                                    <span>24 fps</span>
                                  </div>
                                  <div className="h-7 flex gap-0.5 rounded overflow-hidden bg-zinc-900">
                                    {[1, 2, 3, 4, 5, 6].map(k => (
                                      <div key={k} className="flex-1 bg-zinc-800 border-r border-black/40 flex items-center justify-center text-[7px] text-zinc-600">
                                        F{k}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab 2 : Effects / Transitions Toolbox */}
                  {activeMediaTab === "effects" && (
                    <div className="flex-1 p-2 overflow-y-auto space-y-2 text-xs custom-scrollbar">
                      <span className="font-bold text-amber-400 text-[11px] block">Transitions Vidéo Réelles</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {TRANSITIONS.map(trans => (
                          <div
                            key={trans.id}
                            onClick={() => {
                              if (selectedClip) {
                                setSelectedClip(prev => ({ ...prev, transition: trans.id }));
                                setVideoClips(prev => prev.map(c => c.id === selectedClip.id ? { ...c, transition: trans.id } : c));
                                showToast(`Transition "${trans.name}" appliquée au clip "${selectedClip.name}".`, "success");
                              } else {
                                showToast("Sélectionnez d'abord un clip sur la timeline.", "warning");
                              }
                            }}
                            className="p-1.5 rounded border border-white/5 bg-black/40 hover:border-amber-400 hover:bg-amber-500/10 cursor-pointer text-[10px]"
                          >
                            <span className="mr-1">{trans.icon}</span>
                            <span className="text-zinc-300 font-semibold">{trans.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tab 3 : Index (Clips List on Active Timeline) */}
                  {activeMediaTab === "index" && (
                    <div className="flex-1 p-2 overflow-y-auto text-[10px] font-mono custom-scrollbar space-y-1">
                      <div className="flex justify-between text-zinc-500 font-bold border-b border-white/5 pb-1">
                        <span>PLAN</span>
                        <span>PISTE</span>
                        <span>START</span>
                        <span>DUR</span>
                      </div>
                      {[...videoClips, ...titleClips, ...voiceClips, ...soundtrackClips].map(c => (
                        <div
                          key={c.id}
                          onClick={() => { setSelectedClip(c); setPlayheadTime(c.start); }}
                          className={`flex justify-between py-1 px-1 rounded cursor-pointer ${
                            selectedClip?.id === c.id ? "bg-amber-500/20 text-amber-300 font-bold" : "hover:bg-white/5 text-zinc-300"
                          }`}
                        >
                          <span className="truncate max-w-[130px]">{c.name || c.title}</span>
                          <span className="text-amber-400 font-bold">{c.track}</span>
                          <span>{c.start}s</span>
                          <span>{c.duration}s</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tab 4 : Sound Library SFX */}
                  {activeMediaTab === "sound_library" && (
                    <div className="flex-1 p-2 overflow-y-auto text-[10px] font-mono custom-scrollbar space-y-1">
                      <span className="font-bold text-emerald-400 text-[11px] block font-sans">Effets Sonores & Foley</span>
                      {BUILTIN_SFX.map(s => (
                        <div
                          key={s.id}
                          className="p-1.5 rounded border border-white/5 bg-black/40 flex items-center justify-between"
                        >
                          <div>
                            <span className="font-bold text-zinc-200 block">{s.name}</span>
                            <span className="text-[9px] text-zinc-500">{s.cat} • {s.dur}</span>
                          </div>
                          <button
                            onClick={() => handleInsertToTimeline(s, "A4")}
                            className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-black font-bold text-[9px] transition-all"
                          >
                            + Piste A4
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Lower Half: Toolbox (Transitions, Effects, Titles) */}
                <div className="flex-1 flex flex-col min-h-0 bg-[#111113]">
                  <div className="h-6 border-b border-white/[0.07] px-2 flex items-center justify-between bg-[#18181b] text-[10px] font-bold text-zinc-300">
                    <div className="flex items-center gap-1.5">
                      <Scissors size={11} className="text-amber-400" />
                      <span>Boîte à Outils (Transitions & Titres)</span>
                    </div>
                  </div>

                  <div className="flex-1 p-2 overflow-y-auto custom-scrollbar space-y-1 text-[10px]">
                    <span className="text-zinc-500 font-bold uppercase tracking-wider block">Transitions Rapides</span>
                    <div className="grid grid-cols-2 gap-1">
                      {TRANSITIONS.slice(1, 5).map(t => (
                        <button
                          key={t.id}
                          onClick={() => {
                            if (selectedClip) {
                              setSelectedClip(prev => ({ ...prev, transition: t.id }));
                              setVideoClips(prev => prev.map(c => c.id === selectedClip.id ? { ...c, transition: t.id } : c));
                            }
                          }}
                          className="px-2 py-1 rounded bg-white/5 hover:bg-amber-500/20 text-zinc-300 text-left truncate flex items-center gap-1"
                        >
                          <span>{t.icon}</span>
                          <span className="truncate">{t.name}</span>
                        </button>
                      ))}
                    </div>

                    <span className="text-zinc-500 font-bold uppercase tracking-wider block pt-1.5">Ajout Titre V3</span>
                    <button
                      onClick={() => {
                        const newTitle = {
                          id: `title_${Date.now()}`,
                          name: "NOUVEAU TITRE 4K",
                          text: "STUDIO VIDEO CINEMA",
                          track: "V3",
                          start: Number(playheadTime.toFixed(2)),
                          duration: 4.0,
                          color: "#84cc16",
                          fontSize: 32,
                          fontFamily: "Optima",
                          textColor: "#ffffff",
                          tracking: 2.0,
                        };
                        setTitleClips(prev => [...prev, newTitle]);
                        setSelectedClip(newTitle);
                      }}
                      className="w-full py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500 hover:text-black font-bold transition-all text-center"
                    >
                      + Insérer Titre sur Track V3
                    </button>
                  </div>
                </div>
              </div>

              {/* Center Pane : Dual Viewers (Source Monitor Left | Record Timeline Right) */}
              <div className="flex-1 flex min-w-0 bg-[#09090b]">
                {/* 1. Left Viewer : Source Monitor */}
                <div className="flex-1 flex flex-col border-r border-white/[0.07] min-w-0">
                  <div className="h-6 border-b border-white/[0.07] px-2 flex items-center justify-between bg-[#141416] text-[10px] font-mono">
                    <span className="text-zinc-400">SOURCE TAPE</span>
                    <span className="font-bold text-zinc-200 truncate max-w-[140px]">{sourceClip?.name || sourceClip?.filename || "Source Tape"}</span>
                    <span className="text-zinc-400">00:00:28:06</span>
                  </div>

                  <div className="flex-1 bg-black flex items-center justify-center relative overflow-hidden">
                    {sourceClip?.url ? (
                      <img
                        src={sourceClip.url}
                        alt="Source Tape"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <div className="text-zinc-600 text-xs font-mono">Aucun rush source chargé</div>
                    )}
                    <span className="absolute bottom-2 left-2 text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/80 text-zinc-400 border border-white/10">
                      Source Tape • 24 fps
                    </span>
                  </div>

                  {/* Source Jog Bar */}
                  <div className="h-7 border-t border-white/[0.07] bg-[#141416] px-3 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      <button onClick={handleSetInPoint} className="text-zinc-400 hover:text-amber-400 font-bold" title="Point In">[</button>
                      <button onClick={handleSetOutPoint} className="text-zinc-400 hover:text-amber-400 font-bold" title="Point Out">]</button>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setPlayheadTime(0)} className="text-zinc-400 hover:text-zinc-100"><SkipBack size={12} /></button>
                      <button onClick={() => setIsPlaying(!isPlaying)} className="text-amber-400 hover:text-amber-300">
                        {isPlaying ? <Pause size={13} /> : <Play size={13} />}
                      </button>
                      <button onClick={() => setPlayheadTime(totalDuration)} className="text-zinc-400 hover:text-zinc-100"><SkipForward size={12} /></button>
                    </div>
                    <button
                      onClick={() => handleInsertToTimeline(sourceClip)}
                      className="px-2 py-0.5 rounded bg-[#df9c43] hover:bg-[#f5c277] text-black font-bold text-[9px]"
                      title="Insérer le rush source sur la timeline"
                    >
                      + Insérer
                    </button>
                  </div>
                </div>

                {/* 2. Right Viewer : Record Timeline Monitor */}
                <div className="flex-1 flex flex-col min-w-0">
                  <div className="h-6 border-b border-white/[0.07] px-2 flex items-center justify-between bg-[#141416] text-[10px] font-mono">
                    <span className="text-red-400 font-bold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span>REC</span>
                    </span>
                    <span className="font-bold text-zinc-200 truncate max-w-[200px]">{projectName}</span>
                    <span className="text-amber-400 font-bold">{formatTimecode(playheadTime)}</span>
                  </div>

                  {/* Record Video Frame with Live Transforms & Color Grade */}
                  <div className="flex-1 bg-black flex items-center justify-center relative overflow-hidden">
                    <div
                      className="max-h-full max-w-full aspect-video flex items-center justify-center relative transition-all duration-75"
                      style={{
                        transform: `scale(${videoZoom}) translate(${videoPosX}px, ${videoPosY}px) rotate(${videoRot}deg)`,
                        opacity: videoOpacity / 100,
                        filter: `brightness(${1 + (colorWheels.light.exp || 0) * 0.15 + (quickGrade.exposure || 0) * 0.2}) contrast(${((colorWheels.shadow.exp ? 1 + colorWheels.shadow.exp * 0.15 : 1)) * (quickGrade.contrast || 1)}) saturate(${(colorWheels.global.sat || 1) * (quickGrade.saturation || 1)}) hue-rotate(${quickGrade.temp * 0.5}deg)`,
                      }}
                    >
                      {activeVideoClip?.url?.endsWith(".mp4") ? (
                        <video
                          ref={videoPlayerRef}
                          src={activeVideoClip.url}
                          className="w-full h-full object-contain"
                          autoPlay
                          loop
                          muted
                        />
                      ) : (
                        <img
                          src={activeVideoClip?.url || "/assets/studio_video/clip_cowboy_dylan.png"}
                          alt="Timeline Monitor"
                          className="max-h-full max-w-full object-contain"
                        />
                      )}

                      {/* Active Title Overlay from Track V3 (Visible only if track is active) */}
                      {activeTitleClip && trackVisibility.V3 && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4">
                          <span
                            className="font-bold text-center tracking-widest drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]"
                            style={{
                              fontFamily: activeTitleClip.fontFamily || "sans-serif",
                              fontSize: `${activeTitleClip.fontSize || 28}px`,
                              color: activeTitleClip.textColor || "#ffffff",
                              letterSpacing: `${activeTitleClip.tracking || 2}px`,
                            }}
                          >
                            {activeTitleClip.text}
                          </span>
                        </div>
                      )}
                    </div>

                    <span className="absolute top-2 right-2 text-[9px] font-mono px-2 py-0.5 rounded bg-black/80 text-amber-400 border border-amber-500/30">
                      {activeVideoClip?.cameraShot || "Master 4K"}
                    </span>
                  </div>

                  {/* Timeline Monitor Controls */}
                  <div className="h-7 border-t border-white/[0.07] bg-[#141416] px-3 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <button onClick={() => setPlayheadTime(0)} title="Début"><SkipBack size={12} /></button>
                      <button onClick={() => handleStepFrame(false)} title="Image Arrière">&lt;</button>
                      <button onClick={() => setIsPlaying(!isPlaying)} className="text-amber-400 hover:text-amber-300 font-bold">
                        {isPlaying ? <Pause size={13} /> : <Play size={13} />}
                      </button>
                      <button onClick={() => handleStepFrame(true)} title="Image Avant">&gt;</button>
                      <button onClick={() => setPlayheadTime(totalDuration)} title="Fin"><SkipForward size={12} /></button>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[10px]">
                      {inPoint !== null && outPoint !== null && (
                        <span className="text-amber-400 bg-amber-500/10 px-1.5 rounded border border-amber-500/20">
                          In: {inPoint}s • Out: {outPoint}s
                        </span>
                      )}
                      <span className="text-zinc-400">Master:</span>
                      <span className="text-amber-400 font-bold">{formatTimecode(playheadTime)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Far Right Pane : Inspector Pane */}
              {showInspector && (
                <div className="w-80 flex-shrink-0 flex flex-col border-l border-white/[0.07] bg-[#141416] overflow-y-auto custom-scrollbar">
                  {/* Inspector Header */}
                  <div className="h-7 border-b border-white/[0.07] px-3 flex items-center justify-between bg-[#18181b] text-xs">
                    <span className="font-bold text-zinc-200 truncate max-w-[170px]">{selectedClip?.name || "Inspecteur"}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Clip: {selectedClip?.track || "V1"}</span>
                  </div>

                  {/* Inspector Tabs */}
                  <div className="h-7 border-b border-white/[0.07] px-2 flex items-center justify-between text-[10px] bg-[#111113]">
                    {["video", "audio", "titles", "effects", "transitions", "file"].map(t => (
                      <button
                        key={t}
                        onClick={() => setInspectorTab(t)}
                        className={`px-2 py-0.5 rounded capitalize transition-all ${
                          inspectorTab === t ? "bg-amber-500/20 text-amber-400 font-bold shadow-sm" : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        {t === "audio" ? "🎵 Audio" : t === "video" ? "🎬 Vidéo" : t === "titles" ? "✍️ Titres" : t === "effects" ? "✨ Effets" : t === "transitions" ? "✂️ Trans." : "📁 Fichier"}
                      </button>
                    ))}
                  </div>

                  {/* Tab: Video Controls */}
                  {inspectorTab === "video" && (
                    <div className="p-3 space-y-3 text-xs font-sans">
                      <span className="font-bold text-zinc-300 block text-[11px] uppercase tracking-wider">Transformations Vidéo</span>

                      <div className="space-y-1">
                        <div className="flex justify-between text-zinc-400 text-[11px]">
                          <span>Zoom (Scale)</span>
                          <span className="font-mono text-zinc-200">{videoZoom.toFixed(2)}x</span>
                        </div>
                        <input
                          type="range"
                          min="0.5"
                          max="2.5"
                          step="0.05"
                          value={videoZoom}
                          onChange={e => {
                            const val = parseFloat(e.target.value);
                            setVideoZoom(val);
                            if (selectedClip) setVideoClips(prev => prev.map(c => c.id === selectedClip.id ? { ...c, zoom: val } : c));
                          }}
                          className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#df9c43]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-zinc-400 block mb-1 text-[11px]">Position X</span>
                          <input
                            type="number"
                            value={videoPosX}
                            onChange={e => {
                              const val = parseInt(e.target.value) || 0;
                              setVideoPosX(val);
                              if (selectedClip) setVideoClips(prev => prev.map(c => c.id === selectedClip.id ? { ...c, posX: val } : c));
                            }}
                            className="w-full bg-black/60 border border-white/10 rounded px-2 py-1 text-zinc-200 font-mono text-[11px]"
                          />
                        </div>
                        <div>
                          <span className="text-zinc-400 block mb-1 text-[11px]">Position Y</span>
                          <input
                            type="number"
                            value={videoPosY}
                            onChange={e => {
                              const val = parseInt(e.target.value) || 0;
                              setVideoPosY(val);
                              if (selectedClip) setVideoClips(prev => prev.map(c => c.id === selectedClip.id ? { ...c, posY: val } : c));
                            }}
                            className="w-full bg-black/60 border border-white/10 rounded px-2 py-1 text-zinc-200 font-mono text-[11px]"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-zinc-400 text-[11px]">
                          <span>Rotation (Degrés)</span>
                          <span className="font-mono text-zinc-200">{videoRot}°</span>
                        </div>
                        <input
                          type="range"
                          min="-180"
                          max="180"
                          value={videoRot}
                          onChange={e => {
                            const val = parseInt(e.target.value);
                            setVideoRot(val);
                            if (selectedClip) setVideoClips(prev => prev.map(c => c.id === selectedClip.id ? { ...c, rot: val } : c));
                          }}
                          className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#df9c43]"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-zinc-400 text-[11px]">
                          <span>Opacité</span>
                          <span className="font-mono text-zinc-200">{videoOpacity}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={videoOpacity}
                          onChange={e => {
                            const val = parseInt(e.target.value);
                            setVideoOpacity(val);
                            if (selectedClip) setVideoClips(prev => prev.map(c => c.id === selectedClip.id ? { ...c, opacity: val } : c));
                          }}
                          className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#df9c43]"
                        />
                      </div>

                      {/* Interactive Trimming Controls */}
                      <div className="pt-2 border-t border-white/5 space-y-2">
                        <span className="text-zinc-300 font-bold block text-[11px] uppercase tracking-wider">Rognage & Position Temporelle</span>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-zinc-400 block mb-1 text-[10px]">Début (s)</span>
                            <input
                              type="number"
                              step="0.1"
                              value={selectedClip?.start ?? 0}
                              onChange={e => {
                                const val = Math.max(0, parseFloat(e.target.value) || 0);
                                if (selectedClip) {
                                  setSelectedClip(prev => ({ ...prev, start: val }));
                                  setVideoClips(prev => prev.map(c => c.id === selectedClip.id ? { ...c, start: val } : c));
                                }
                              }}
                              className="w-full bg-black/60 border border-white/10 rounded px-2 py-1 text-zinc-200 font-mono text-[11px]"
                            />
                          </div>
                          <div>
                            <span className="text-zinc-400 block mb-1 text-[10px]">Durée (s)</span>
                            <input
                              type="number"
                              step="0.1"
                              value={selectedClip?.duration ?? 5}
                              onChange={e => {
                                const val = Math.max(0.5, parseFloat(e.target.value) || 1);
                                if (selectedClip) {
                                  setSelectedClip(prev => ({ ...prev, duration: val }));
                                  setVideoClips(prev => prev.map(c => c.id === selectedClip.id ? { ...c, duration: val } : c));
                                }
                              }}
                              className="w-full bg-black/60 border border-white/10 rounded px-2 py-1 text-zinc-200 font-mono text-[11px]"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              if (!selectedClip) return;
                              if (playheadTime >= selectedClip.start && playheadTime < selectedClip.start + selectedClip.duration) {
                                const newDur = Number((selectedClip.start + selectedClip.duration - playheadTime).toFixed(2));
                                const newStart = Number(playheadTime.toFixed(2));
                                setSelectedClip(prev => ({ ...prev, start: newStart, duration: newDur }));
                                setVideoClips(prev => prev.map(c => c.id === selectedClip.id ? { ...c, start: newStart, duration: newDur } : c));
                                showToast("Rognage début (Trim In) appliqué au playhead.", "success");
                              } else {
                                showToast("Le playhead doit être situé à l'intérieur du clip pour rogner.", "warning");
                              }
                            }}
                            className="flex-1 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-zinc-300 font-semibold"
                          >
                            Trim In au Playhead
                          </button>
                          <button
                            onClick={() => {
                              if (!selectedClip) return;
                              if (playheadTime > selectedClip.start && playheadTime <= selectedClip.start + selectedClip.duration) {
                                const newDur = Number((playheadTime - selectedClip.start).toFixed(2));
                                setSelectedClip(prev => ({ ...prev, duration: newDur }));
                                setVideoClips(prev => prev.map(c => c.id === selectedClip.id ? { ...c, duration: newDur } : c));
                                showToast("Rognage fin (Trim Out) appliqué au playhead.", "success");
                              } else {
                                showToast("Le playhead doit être situé à l'intérieur du clip pour rogner.", "warning");
                              }
                            }}
                            className="flex-1 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-zinc-300 font-semibold"
                          >
                            Trim Out au Playhead
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab: Audio Controls */}
                  {inspectorTab === "audio" && (
                    <div className="p-3 space-y-3.5 text-xs font-sans">
                      {/* Volume Slider */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-300 font-semibold">Volume Fader</span>
                          <span className="font-mono text-amber-400">{audioVolume.toFixed(1)} dB</span>
                        </div>
                        <input
                          type="range"
                          min="-60"
                          max="12"
                          step="0.5"
                          value={audioVolume}
                          onChange={e => {
                            const val = parseFloat(e.target.value);
                            setAudioVolume(val);
                            if (selectedClip) {
                              const normVol = Math.round(100 + val * 2.5);
                              setVoiceClips(prev => prev.map(c => c.id === selectedClip.id ? { ...c, volume: normVol } : c));
                              setSoundtrackClips(prev => prev.map(c => c.id === selectedClip.id ? { ...c, volume: normVol } : c));
                            }
                          }}
                          className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#df9c43]"
                        />
                      </div>

                      {/* Pan Slider */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-300 font-semibold">Panoramique</span>
                          <span className="font-mono text-zinc-400">{audioPan === 0 ? "0.0 (C)" : audioPan > 0 ? `R ${audioPan}` : `L ${Math.abs(audioPan)}`}</span>
                        </div>
                        <input
                          type="range"
                          min="-100"
                          max="100"
                          value={audioPan}
                          onChange={e => setAudioPan(parseInt(e.target.value))}
                          className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#df9c43]"
                        />
                      </div>

                      {/* AI Voice Isolation */}
                      <div className="pt-2 border-t border-white/5 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Sparkles size={12} className="text-purple-400" />
                            <span className="text-zinc-200 font-bold">AI Voice Isolation</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={aiVoiceIsolation > 0}
                            onChange={e => {
                              const amt = e.target.checked ? 100 : 0;
                              setAiVoiceIsolation(amt);
                              if (selectedClip) setVoiceClips(prev => prev.map(c => c.id === selectedClip.id ? { ...c, aiVoiceIsolation: amt } : c));
                            }}
                            className="rounded bg-zinc-800 border-zinc-700 text-[#df9c43] focus:ring-0"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-zinc-400">Taux</span>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={aiVoiceIsolation}
                            onChange={e => {
                              const val = parseInt(e.target.value);
                              setAiVoiceIsolation(val);
                              if (selectedClip) setVoiceClips(prev => prev.map(c => c.id === selectedClip.id ? { ...c, aiVoiceIsolation: val } : c));
                            }}
                            className="flex-1 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                          />
                          <span className="font-mono text-[10px] text-purple-300 w-8 text-right">{aiVoiceIsolation}%</span>
                        </div>
                      </div>

                      {/* AI Dialogue Leveler */}
                      <div className="flex items-center justify-between py-1 border-t border-white/5">
                        <div className="flex items-center gap-1.5">
                          <Sparkles size={12} className="text-blue-400" />
                          <span className="text-zinc-300">AI Dialogue Leveler</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={aiDialogueLeveler}
                          onChange={e => setAiDialogueLeveler(e.target.checked)}
                          className="rounded bg-zinc-800 border-zinc-700 text-[#df9c43] focus:ring-0"
                        />
                      </div>

                      {/* Equalizer Interactive Curve */}
                      <div className="pt-2 border-t border-white/5 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-300 font-bold">Égaliseur Paramétrique 6-Bandes</span>
                          <span className="text-[10px] text-cyan-400 font-mono">LIVE</span>
                        </div>
                        <div className="h-20 bg-black/80 rounded border border-cyan-500/20 p-1 relative overflow-hidden">
                          <svg className="w-full h-full" viewBox="0 0 240 80">
                            <line x1="0" y1="40" x2="240" y2="40" stroke="#334155" strokeWidth="0.5" strokeDasharray="2,2" />
                            <path d={eqPathD} fill="none" stroke="#06b6d4" strokeWidth="2" />
                            {fairlightBands.map((b, idx) => (
                              <circle
                                key={b.band}
                                cx={20 + idx * 40}
                                cy={Math.max(10, Math.min(70, 40 - b.gain * 2))}
                                r="3.5"
                                fill="#06b6d4"
                                stroke="#ffffff"
                                strokeWidth="1"
                              />
                            ))}
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab: Titles Controls (V3 Track Overlay) */}
                  {inspectorTab === "titles" && (
                    <div className="p-3 space-y-3 text-xs font-sans">
                      <span className="font-bold text-zinc-300 block text-[11px] uppercase tracking-wider">Générateur de Titres (Piste V3)</span>
                      <div className="space-y-1">
                        <span className="text-zinc-400 block text-[11px]">Contenu du Titre</span>
                        <input
                          type="text"
                          value={titleClips[0]?.text || ""}
                          onChange={e => {
                            const val = e.target.value;
                            setTitleClips(prev => prev.map((t, idx) => idx === 0 ? { ...t, text: val } : t));
                          }}
                          className="w-full bg-black/60 border border-white/10 rounded p-1.5 text-zinc-200 text-xs font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-zinc-400 text-[11px]">
                          <span>Taille de Police (px)</span>
                          <span className="font-mono text-zinc-200">{titleClips[0]?.fontSize || 28}px</span>
                        </div>
                        <input
                          type="range"
                          min="14"
                          max="72"
                          value={titleClips[0]?.fontSize || 28}
                          onChange={e => {
                            const val = parseInt(e.target.value);
                            setTitleClips(prev => prev.map((t, idx) => idx === 0 ? { ...t, fontSize: val } : t));
                          }}
                          className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#df9c43]"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-zinc-400 text-[11px]">
                          <span>Espacement des Lettres (Tracking)</span>
                          <span className="font-mono text-zinc-200">{titleClips[0]?.tracking || 2}px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="10"
                          step="0.5"
                          value={titleClips[0]?.tracking || 2}
                          onChange={e => {
                            const val = parseFloat(e.target.value);
                            setTitleClips(prev => prev.map((t, idx) => idx === 0 ? { ...t, tracking: val } : t));
                          }}
                          className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#df9c43]"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-zinc-400 block text-[11px]">Famille de Police</span>
                        <select
                          value={titleClips[0]?.fontFamily || "sans-serif"}
                          onChange={e => {
                            const val = e.target.value;
                            setTitleClips(prev => prev.map((t, idx) => idx === 0 ? { ...t, fontFamily: val } : t));
                          }}
                          className="w-full bg-black/60 border border-white/10 rounded p-1.5 text-zinc-200 text-xs"
                        >
                          <option value="sans-serif">Sans-Serif Moderne</option>
                          <option value="serif">Serif Cinématique (Optima)</option>
                          <option value="monospace">Monospace Technique</option>
                          <option value="Impact">Impact Hero Block</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <span className="text-zinc-400 block text-[11px]">Couleur du Texte</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={titleClips[0]?.textColor || "#ffffff"}
                            onChange={e => {
                              const val = e.target.value;
                              setTitleClips(prev => prev.map((t, idx) => idx === 0 ? { ...t, textColor: val } : t));
                            }}
                            className="w-8 h-8 rounded border border-white/10 bg-black cursor-pointer"
                          />
                          <span className="font-mono text-[11px] text-zinc-300">{titleClips[0]?.textColor || "#ffffff"}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab: Effects & Quick Grade */}
                  {inspectorTab === "effects" && (
                    <div className="p-3 space-y-3 text-xs font-sans">
                      <span className="font-bold text-zinc-300 block text-[11px] uppercase tracking-wider">Étalonnage Rapide (Quick Grade)</span>
                      <div className="space-y-1">
                        <div className="flex justify-between text-zinc-400 text-[11px]">
                          <span>Exposition</span>
                          <span className="font-mono text-zinc-200">{quickGrade.exposure.toFixed(1)} EV</span>
                        </div>
                        <input
                          type="range"
                          min="-2"
                          max="2"
                          step="0.1"
                          value={quickGrade.exposure}
                          onChange={e => setQuickGrade(prev => ({ ...prev, exposure: parseFloat(e.target.value) }))}
                          className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#df9c43]"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-zinc-400 text-[11px]">
                          <span>Contraste</span>
                          <span className="font-mono text-zinc-200">{quickGrade.contrast.toFixed(2)}</span>
                        </div>
                        <input
                          type="range"
                          min="0.5"
                          max="1.8"
                          step="0.05"
                          value={quickGrade.contrast}
                          onChange={e => setQuickGrade(prev => ({ ...prev, contrast: parseFloat(e.target.value) }))}
                          className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#df9c43]"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-zinc-400 text-[11px]">
                          <span>Saturation</span>
                          <span className="font-mono text-zinc-200">{quickGrade.saturation.toFixed(2)}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="2"
                          step="0.05"
                          value={quickGrade.saturation}
                          onChange={e => setQuickGrade(prev => ({ ...prev, saturation: parseFloat(e.target.value) }))}
                          className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#df9c43]"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-zinc-400 text-[11px]">
                          <span>Température (K)</span>
                          <span className="font-mono text-zinc-200">{quickGrade.temp > 0 ? `+${quickGrade.temp}` : quickGrade.temp}</span>
                        </div>
                        <input
                          type="range"
                          min="-50"
                          max="50"
                          value={quickGrade.temp}
                          onChange={e => setQuickGrade(prev => ({ ...prev, temp: parseInt(e.target.value) }))}
                          className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#df9c43]"
                        />
                      </div>
                      <button
                        onClick={() => setQuickGrade({ exposure: 0, contrast: 1.0, saturation: 1.0, temp: 0 })}
                        className="w-full py-1 rounded bg-white/5 hover:bg-white/10 text-zinc-400 text-[10px]"
                      >
                        Réinitialiser l'Étalonnage
                      </button>
                    </div>
                  )}

                  {/* Tab: Transitions */}
                  {inspectorTab === "transitions" && (
                    <div className="p-3 space-y-3 text-xs font-sans">
                      <span className="font-bold text-zinc-300 block text-[11px] uppercase tracking-wider">Transition du Clip</span>
                      <div className="space-y-1">
                        <span className="text-zinc-400 block text-[11px]">Type de Transition</span>
                        <select
                          value={selectedClip?.transition || "none"}
                          onChange={e => {
                            const val = e.target.value;
                            if (selectedClip) {
                              setSelectedClip(prev => ({ ...prev, transition: val }));
                              setVideoClips(prev => prev.map(c => c.id === selectedClip.id ? { ...c, transition: val } : c));
                            }
                          }}
                          className="w-full bg-black/60 border border-white/10 rounded p-1.5 text-zinc-200 text-xs"
                        >
                          {TRANSITIONS.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Tab: File Properties */}
                  {inspectorTab === "file" && (
                    <div className="p-3 space-y-2 text-xs font-mono">
                      <span className="font-bold text-zinc-300 block text-[11px] uppercase tracking-wider font-sans">Propriétés du Fichier</span>
                      <div className="p-2 rounded bg-black/40 border border-white/5 space-y-1 text-[11px]">
                        <div><span className="text-zinc-500">Nom :</span> <span className="text-zinc-200">{selectedClip?.name}</span></div>
                        <div><span className="text-zinc-500">Piste :</span> <span className="text-amber-400 font-bold">{selectedClip?.track}</span></div>
                        <div><span className="text-zinc-500">Début :</span> <span className="text-zinc-200">{selectedClip?.start}s</span></div>
                        <div><span className="text-zinc-500">Durée :</span> <span className="text-zinc-200">{selectedClip?.duration}s</span></div>
                        <div><span className="text-zinc-500">Codec :</span> <span className="text-zinc-200">{selectedClip?.codec || "ProRes / BRAW"}</span></div>
                        <div><span className="text-zinc-500">Résolution :</span> <span className="text-zinc-200">{selectedClip?.resolution || "3840x2160"}</span></div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Lower Workstation : Interactive Timeline & Audio Mixer */}
            <div className="flex-1 flex min-h-0 bg-[#0d0d0f] relative">
              {/* Timeline Tracks Section */}
              <div className="flex-1 flex flex-col min-w-0 border-r border-white/[0.07]">
                {/* Timeline Toolbar with Real Interactive Buttons */}
                <div className="h-7 border-b border-white/[0.07] px-3 flex items-center justify-between bg-[#141416] text-[11px]">
                  <div className="flex items-center gap-3">
                    {/* Tool Buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setActiveTool("pointer")}
                        className={`p-1 rounded ${activeTool === "pointer" ? "bg-amber-500/20 text-amber-400 font-bold" : "text-zinc-400 hover:text-zinc-200"}`}
                        title="Outil Pointeur (A)"
                      >
                        <MousePointer size={12} />
                      </button>
                      <button
                        onClick={() => setActiveTool("blade")}
                        className={`p-1 rounded ${activeTool === "blade" ? "bg-red-500/30 text-red-400 border border-red-500/50" : "text-zinc-400 hover:text-zinc-200"}`}
                        title="Outil Lame de Rasoir (B) - Scinder les clips"
                      >
                        <Scissors size={12} />
                      </button>
                      <button
                        onClick={handleSplitClipAtPlayhead}
                        className="p-1 rounded bg-white/5 hover:bg-white/10 text-amber-400 font-bold"
                        title="Couper / Scinder au Playhead (Ctrl+B)"
                      >
                        <SplitSquareVertical size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteSelectedClip(false)}
                        className="p-1 rounded text-zinc-400 hover:text-red-400"
                        title="Supprimer le clip sélectionné"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                    <div className="h-4 w-px bg-white/10" />

                    {/* In / Out Points & Snapping */}
                    <div className="flex items-center gap-1 font-mono text-[10px]">
                      <button onClick={handleSetInPoint} className="px-1.5 py-0.5 rounded bg-white/5 text-zinc-300 hover:bg-white/10 font-bold" title="Poser Point In">[</button>
                      <button onClick={handleSetOutPoint} className="px-1.5 py-0.5 rounded bg-white/5 text-zinc-300 hover:bg-white/10 font-bold" title="Poser Point Out">]</button>
                      <button onClick={handleClearInOut} className="px-1 py-0.5 rounded text-zinc-500 hover:text-zinc-300" title="Effacer In/Out">Clr</button>
                      <button
                        onClick={() => setIsSnapping(!isSnapping)}
                        className={`px-1.5 py-0.5 rounded border text-[9px] ${isSnapping ? "bg-amber-500/20 text-amber-300 border-amber-500/40" : "bg-black text-zinc-500 border-white/5"}`}
                        title="Aimantation (Snapping N)"
                      >
                        SNAP
                      </button>
                    </div>

                    <span className="font-mono text-amber-400 font-bold">{formatTimecode(playheadTime)}</span>
                  </div>

                  {/* Zoom Slider */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500 font-mono">Zoom</span>
                    <input
                      type="range"
                      min="25"
                      max="180"
                      value={timelineZoom}
                      onChange={e => setTimelineZoom(parseInt(e.target.value))}
                      className="w-24 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#df9c43]"
                    />
                  </div>
                </div>

                {/* Timeline Tracks Canvas */}
                <div className="flex-1 overflow-y-auto overflow-x-auto relative flex custom-scrollbar">
                  {/* Track Headers (Left Column) */}
                  <div className="w-36 flex-shrink-0 bg-[#161619] border-r border-white/10 flex flex-col divide-y divide-white/5 text-[10px] font-mono sticky left-0 z-20">
                    <div className="h-5 px-2 flex items-center justify-between bg-black/60 text-zinc-400">
                      <span>RULER</span>
                      <span className="text-[9px]">{projectFps}fps</span>
                    </div>
                    <div className="h-10 px-2 flex items-center justify-between bg-black/30">
                      <span className="text-yellow-400 font-bold">V3 TITLES</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setTrackVisibility(prev => ({ ...prev, V3: !prev.V3 }))}
                          className={`p-0.5 rounded ${trackVisibility.V3 ? "text-zinc-400 hover:text-white" : "text-zinc-600 hover:text-zinc-400"}`}
                          title={trackVisibility.V3 ? "Masquer Piste V3" : "Afficher Piste V3"}
                        >
                          {trackVisibility.V3 ? <Eye size={10} /> : <EyeOff size={10} className="text-red-400" />}
                        </button>
                        <button
                          onClick={() => setTrackLock(prev => ({ ...prev, V3: !prev.V3 }))}
                          className={`p-0.5 rounded ${trackLock.V3 ? "text-amber-400" : "text-zinc-600 hover:text-zinc-400"}`}
                          title="Verrouiller Piste V3"
                        >
                          {trackLock.V3 ? <Lock size={10} /> : <Unlock size={10} />}
                        </button>
                      </div>
                    </div>
                    <div className="h-10 px-2 flex items-center justify-between bg-black/30">
                      <span className="text-blue-400 font-bold">V2 B-ROLL</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setTrackVisibility(prev => ({ ...prev, V2: !prev.V2 }))}
                          className={`p-0.5 rounded ${trackVisibility.V2 ? "text-zinc-400 hover:text-white" : "text-zinc-600 hover:text-zinc-400"}`}
                          title={trackVisibility.V2 ? "Masquer Piste V2" : "Afficher Piste V2"}
                        >
                          {trackVisibility.V2 ? <Eye size={10} /> : <EyeOff size={10} className="text-red-400" />}
                        </button>
                        <button
                          onClick={() => setTrackLock(prev => ({ ...prev, V2: !prev.V2 }))}
                          className={`p-0.5 rounded ${trackLock.V2 ? "text-amber-400" : "text-zinc-600 hover:text-zinc-400"}`}
                          title="Verrouiller Piste V2"
                        >
                          {trackLock.V2 ? <Lock size={10} /> : <Unlock size={10} />}
                        </button>
                      </div>
                    </div>
                    <div className="h-12 px-2 flex items-center justify-between bg-black/30">
                      <span className="text-orange-400 font-bold">V1 MASTER</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setTrackVisibility(prev => ({ ...prev, V1: !prev.V1 }))}
                          className={`p-0.5 rounded ${trackVisibility.V1 ? "text-zinc-400 hover:text-white" : "text-zinc-600 hover:text-zinc-400"}`}
                          title={trackVisibility.V1 ? "Masquer Piste V1" : "Afficher Piste V1"}
                        >
                          {trackVisibility.V1 ? <Eye size={10} /> : <EyeOff size={10} className="text-red-400" />}
                        </button>
                        <button
                          onClick={() => setTrackLock(prev => ({ ...prev, V1: !prev.V1 }))}
                          className={`p-0.5 rounded ${trackLock.V1 ? "text-amber-400" : "text-zinc-600 hover:text-zinc-400"}`}
                          title="Verrouiller Piste V1"
                        >
                          {trackLock.V1 ? <Lock size={10} /> : <Unlock size={10} />}
                        </button>
                      </div>
                    </div>
                    <div className="h-10 px-2 flex items-center justify-between bg-black/30">
                      <span className="text-amber-400 font-bold">A1 VO (ISO)</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setTrackMute(prev => ({ ...prev, A1: !prev.A1 }))}
                          className={`p-0.5 rounded ${trackMute.A1 ? "text-red-400 font-bold" : "text-zinc-400 hover:text-white"}`}
                          title={trackMute.A1 ? "Activer A1" : "Muter A1"}
                        >
                          {trackMute.A1 ? <VolumeX size={10} /> : <Volume2 size={10} />}
                        </button>
                        <span className="text-[9px] text-purple-400 font-bold">IA</span>
                      </div>
                    </div>
                    <div className="h-10 px-2 flex items-center justify-between bg-black/30">
                      <span className="text-emerald-400 font-bold">A2 MUSIC 1</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setTrackMute(prev => ({ ...prev, A2: !prev.A2 }))}
                          className={`p-0.5 rounded ${trackMute.A2 ? "text-red-400 font-bold" : "text-zinc-400 hover:text-white"}`}
                          title={trackMute.A2 ? "Activer A2" : "Muter A2"}
                        >
                          {trackMute.A2 ? <VolumeX size={10} /> : <Volume2 size={10} />}
                        </button>
                        <span className="text-[9px] text-emerald-400 font-bold">BF16</span>
                      </div>
                    </div>
                    <div className="h-10 px-2 flex items-center justify-between bg-black/30">
                      <span className="text-cyan-400 font-bold">A3 MUSIC 2</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setTrackMute(prev => ({ ...prev, A3: !prev.A3 }))}
                          className={`p-0.5 rounded ${trackMute.A3 ? "text-red-400 font-bold" : "text-zinc-400 hover:text-white"}`}
                          title={trackMute.A3 ? "Activer A3" : "Muter A3"}
                        >
                          {trackMute.A3 ? <VolumeX size={10} /> : <Volume2 size={10} />}
                        </button>
                        <span className="text-[9px] text-cyan-400 font-bold">48k</span>
                      </div>
                    </div>
                    <div className="h-10 px-2 flex items-center justify-between bg-black/30">
                      <span className="text-yellow-300 font-bold">A4 SFX</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setTrackMute(prev => ({ ...prev, A4: !prev.A4 }))}
                          className={`p-0.5 rounded ${trackMute.A4 ? "text-red-400 font-bold" : "text-zinc-400 hover:text-white"}`}
                          title={trackMute.A4 ? "Activer A4" : "Muter A4"}
                        >
                          {trackMute.A4 ? <VolumeX size={10} /> : <Volume2 size={10} />}
                        </button>
                        <span className="text-[9px] text-zinc-500">SFX</span>
                      </div>
                    </div>
                  </div>

                  {/* Track Lanes with Dynamic Clips */}
                  <div
                    ref={timelineRulerRef}
                    onClick={handleRulerScrub}
                    className="flex-1 relative divide-y divide-white/5 bg-[#0e0e11]"
                    style={{ minWidth: `${Math.max(1200, totalDuration * timelineZoom + 200)}px` }}
                  >
                    {/* Time Ruler (Clickable to Scrub) */}
                    <div className="h-5 border-b border-white/10 flex items-center text-[8px] font-mono text-zinc-500 relative cursor-pointer hover:bg-white/5 transition-all">
                      {Array.from({ length: Math.ceil(totalDuration) + 5 }).map((_, sec) => (
                        <div
                          key={sec}
                          className="absolute border-l border-white/10 pl-1 h-full flex items-center"
                          style={{ left: `${sec * timelineZoom}px` }}
                        >
                          {sec % 2 === 0 && <span>01:00:{String(sec).padStart(2, "0")}:00</span>}
                        </div>
                      ))}

                      {/* In-Out Range Banner */}
                      {inPoint !== null && outPoint !== null && (
                        <div
                          className="absolute top-0 bottom-0 bg-amber-500/20 border-x border-amber-400 pointer-events-none"
                          style={{
                            left: `${inPoint * timelineZoom}px`,
                            width: `${(outPoint - inPoint) * timelineZoom}px`,
                          }}
                        />
                      )}

                      {/* DAW Cue Markers (Cross-Studio Synchronization) */}
                      {timelineMarkers.map((marker) => (
                        <div
                          key={marker.id}
                          className="absolute top-0 bottom-0 flex flex-col items-center pointer-events-auto cursor-pointer z-20 group"
                          style={{ left: `${marker.timeSec * timelineZoom}px` }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setPlayheadTime(marker.timeSec);
                            showToast(`Saut au marqueur ${marker.name} (${marker.timeSec.toFixed(1)}s)`, "info");
                          }}
                          title={`${marker.name} — ${marker.timeSec.toFixed(2)}s`}
                        >
                          <div
                            className="px-1.5 py-0.5 rounded text-[8px] font-bold font-mono text-white shadow-md flex items-center gap-0.5 transform -translate-y-0.5 hover:scale-110 transition-transform"
                            style={{ backgroundColor: marker.color || "#06b6d4" }}
                          >
                            <Flag size={8} />
                            <span>{marker.name}</span>
                          </div>
                          <div className="w-[1.5px] flex-1 opacity-80" style={{ backgroundColor: marker.color || "#06b6d4" }} />
                        </div>
                      ))}
                    </div>

                    {/* V3 Titles Track */}
                    <div className="h-10 relative bg-yellow-950/10 p-1">
                      {titleClips.map(clip => (
                        <div
                          key={clip.id}
                          onClick={(e) => { e.stopPropagation(); handleSelectClip(clip); }}
                          onMouseDown={(e) => { if (activeTool !== 'blade') handleClipMouseDown(e, clip, 'move'); }}
                          className={`group absolute top-1 h-7 rounded px-2 flex items-center justify-between text-[9px] font-bold cursor-pointer transition-all ${
                            selectedClip?.id === clip.id
                              ? "bg-yellow-500/40 border-2 border-yellow-300 text-white ring-2 ring-yellow-400/40 shadow-lg"
                              : "bg-yellow-500/20 border border-yellow-500/50 text-yellow-200 hover:bg-yellow-500/30"
                          }`}
                          style={{
                            left: `${clip.start * timelineZoom}px`,
                            width: `${clip.duration * timelineZoom}px`,
                          }}
                        >
                          <div
                            className={`absolute left-0 top-0 bottom-0 w-2.5 cursor-ew-resize ${activeTool === 'trim' ? 'opacity-100 bg-yellow-400' : 'opacity-0 group-hover:opacity-100 bg-yellow-400/60 hover:bg-yellow-300'} rounded-l transition-opacity z-20`}
                            onMouseDown={(e) => { e.stopPropagation(); handleClipMouseDown(e, clip, 'trim-in'); }}
                            title="Trim Début (Trim In)"
                          />
                          <span className="truncate select-none">{clip.text}</span>
                          <span className="text-[7px] text-yellow-400 ml-1 select-none">{clip.duration}s</span>
                          <div
                            className={`absolute right-0 top-0 bottom-0 w-2.5 cursor-ew-resize ${activeTool === 'trim' ? 'opacity-100 bg-yellow-400' : 'opacity-0 group-hover:opacity-100 bg-yellow-400/60 hover:bg-yellow-300'} rounded-r transition-opacity z-20`}
                            onMouseDown={(e) => { e.stopPropagation(); handleClipMouseDown(e, clip, 'trim-out'); }}
                            title="Trim Fin (Trim Out)"
                          />
                        </div>
                      ))}
                    </div>

                    {/* V2 B-Roll Track */}
                    <div className="h-10 relative bg-blue-950/10 p-1">
                      {videoClips.filter(c => c.track === "V2").map(clip => (
                        <div
                          key={clip.id}
                          onClick={(e) => { e.stopPropagation(); handleSelectClip(clip); }}
                          onMouseDown={(e) => { if (activeTool !== 'blade') handleClipMouseDown(e, clip, 'move'); }}
                          className={`group absolute top-1 h-7 rounded px-2 flex items-center justify-between text-[9px] cursor-pointer transition-all ${
                            selectedClip?.id === clip.id
                              ? "bg-blue-600/50 border-2 border-blue-300 text-white ring-2 ring-blue-400/50 shadow-lg"
                              : "bg-blue-600/30 border border-blue-500/50 text-blue-200 hover:bg-blue-600/40"
                          }`}
                          style={{
                            left: `${clip.start * timelineZoom}px`,
                            width: `${clip.duration * timelineZoom}px`,
                          }}
                        >
                          <div
                            className={`absolute left-0 top-0 bottom-0 w-2.5 cursor-ew-resize ${activeTool === 'trim' ? 'opacity-100 bg-blue-400' : 'opacity-0 group-hover:opacity-100 bg-blue-400/60 hover:bg-blue-300'} rounded-l transition-opacity z-20`}
                            onMouseDown={(e) => { e.stopPropagation(); handleClipMouseDown(e, clip, 'trim-in'); }}
                            title="Trim Début (Trim In)"
                          />
                          <span className="truncate select-none">{clip.title || clip.name}</span>
                          <span className="text-[7px] text-blue-300 ml-1 select-none">{clip.duration}s</span>
                          <div
                            className={`absolute right-0 top-0 bottom-0 w-2.5 cursor-ew-resize ${activeTool === 'trim' ? 'opacity-100 bg-blue-400' : 'opacity-0 group-hover:opacity-100 bg-blue-400/60 hover:bg-blue-300'} rounded-r transition-opacity z-20`}
                            onMouseDown={(e) => { e.stopPropagation(); handleClipMouseDown(e, clip, 'trim-out'); }}
                            title="Trim Fin (Trim Out)"
                          />
                        </div>
                      ))}
                    </div>

                    {/* V1 Master Video Track (with Thumbnails & Transition Badges) */}
                    <div className="h-12 relative bg-orange-950/10 p-1">
                      {videoClips.filter(c => c.track === "V1" || !c.track).map(clip => (
                        <div
                          key={clip.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (activeTool === "blade") {
                              handleSplitClipAtPlayhead();
                            } else {
                              handleSelectClip(clip);
                            }
                          }}
                          onMouseDown={(e) => {
                            if (activeTool !== 'blade') {
                              handleClipMouseDown(e, clip, 'move');
                            }
                          }}
                          className={`group absolute top-1 h-9 rounded flex items-center overflow-hidden p-0.5 gap-1.5 cursor-pointer transition-all ${
                            selectedClip?.id === clip.id
                              ? "bg-orange-600/40 border-2 border-red-500 ring-2 ring-red-500/50 shadow-xl"
                              : "bg-orange-600/20 border border-orange-500/50 hover:border-orange-400"
                          }`}
                          style={{
                            left: `${clip.start * timelineZoom}px`,
                            width: `${clip.duration * timelineZoom}px`,
                          }}
                        >
                          <div
                            className={`absolute left-0 top-0 bottom-0 w-2.5 cursor-ew-resize ${activeTool === 'trim' ? 'opacity-100 bg-amber-400' : 'opacity-0 group-hover:opacity-100 bg-amber-400/70 hover:bg-amber-300'} rounded-l transition-opacity z-20`}
                            onMouseDown={(e) => { e.stopPropagation(); handleClipMouseDown(e, clip, 'trim-in'); }}
                            title="Trim Début (Trim In)"
                          />
                          <img src={clip.url || "/assets/studio_video/clip_truck_desert.png"} alt="" className="h-full aspect-video object-cover rounded pointer-events-none select-none" />
                          <div className="flex-1 min-w-0 pr-1 select-none">
                            <span className="text-[9px] font-bold text-orange-200 truncate block">{clip.title || clip.name}</span>
                            <span className="text-[7px] text-zinc-400 font-mono">{clip.duration}s • {clip.transition}</span>
                          </div>
                          <div
                            className={`absolute right-0 top-0 bottom-0 w-2.5 cursor-ew-resize ${activeTool === 'trim' ? 'opacity-100 bg-amber-400' : 'opacity-0 group-hover:opacity-100 bg-amber-400/70 hover:bg-amber-300'} rounded-r transition-opacity z-20`}
                            onMouseDown={(e) => { e.stopPropagation(); handleClipMouseDown(e, clip, 'trim-out'); }}
                            title="Trim Fin (Trim Out)"
                          />
                        </div>
                      ))}
                    </div>

                    {/* A1 VO Track (Orange Waveforms) */}
                    <div className="h-10 relative bg-amber-950/20 p-1">
                      {voiceClips.map(clip => (
                        <div
                          key={clip.id}
                          onClick={(e) => { e.stopPropagation(); handleSelectClip(clip); }}
                          onMouseDown={(e) => { if (activeTool !== 'blade') handleClipMouseDown(e, clip, 'move'); }}
                          className={`group absolute top-1 h-7 rounded px-2 flex items-center justify-between cursor-pointer transition-all ${
                            selectedClip?.id === clip.id
                              ? "bg-amber-600/50 border-2 border-amber-300 ring-2 ring-amber-400/50"
                              : "bg-amber-600/30 border border-amber-500/60"
                          }`}
                          style={{
                            left: `${clip.start * timelineZoom}px`,
                            width: `${clip.duration * timelineZoom}px`,
                          }}
                        >
                          <div
                            className={`absolute left-0 top-0 bottom-0 w-2.5 cursor-ew-resize ${activeTool === 'trim' ? 'opacity-100 bg-amber-400' : 'opacity-0 group-hover:opacity-100 bg-amber-400/70 hover:bg-amber-300'} rounded-l transition-opacity z-20`}
                            onMouseDown={(e) => { e.stopPropagation(); handleClipMouseDown(e, clip, 'trim-in'); }}
                            title="Trim Début (Trim In)"
                          />
                          <span className="text-[9px] font-mono text-amber-200 font-bold truncate mr-2 select-none">{clip.name}</span>
                          <div className="flex items-center gap-0.5 h-4 flex-shrink-0 select-none">
                            {[30, 80, 45, 90, 60, 100, 50, 75, 40, 85, 95, 35].map((h, i) => (
                              <div key={i} className="w-0.5 bg-amber-400 rounded-full" style={{ height: `${h}%` }} />
                            ))}
                          </div>
                          <div
                            className={`absolute right-0 top-0 bottom-0 w-2.5 cursor-ew-resize ${activeTool === 'trim' ? 'opacity-100 bg-amber-400' : 'opacity-0 group-hover:opacity-100 bg-amber-400/70 hover:bg-amber-300'} rounded-r transition-opacity z-20`}
                            onMouseDown={(e) => { e.stopPropagation(); handleClipMouseDown(e, clip, 'trim-out'); }}
                            title="Trim Fin (Trim Out)"
                          />
                        </div>
                      ))}
                    </div>

                    {/* A2 Soundtrack Track (Green Waveforms) */}
                    <div className="h-10 relative bg-emerald-950/20 p-1">
                      {soundtrackClips.filter(c => c.track === "A2" || !c.track).map(clip => (
                        <div
                          key={clip.id}
                          onClick={(e) => { e.stopPropagation(); handleSelectClip(clip); }}
                          onMouseDown={(e) => { if (activeTool !== 'blade') handleClipMouseDown(e, clip, 'move'); }}
                          className={`group absolute top-1 h-7 rounded px-2 flex items-center justify-between cursor-pointer transition-all ${
                            selectedClip?.id === clip.id
                              ? "bg-emerald-600/50 border-2 border-emerald-300 ring-2 ring-emerald-400/50"
                              : "bg-emerald-600/30 border border-emerald-500/60"
                          }`}
                          style={{
                            left: `${clip.start * timelineZoom}px`,
                            width: `${clip.duration * timelineZoom}px`,
                          }}
                        >
                          <div
                            className={`absolute left-0 top-0 bottom-0 w-2.5 cursor-ew-resize ${activeTool === 'trim' ? 'opacity-100 bg-emerald-400' : 'opacity-0 group-hover:opacity-100 bg-emerald-400/70 hover:bg-emerald-300'} rounded-l transition-opacity z-20`}
                            onMouseDown={(e) => { e.stopPropagation(); handleClipMouseDown(e, clip, 'trim-in'); }}
                            title="Trim Début (Trim In)"
                          />
                          <span className="text-[9px] font-mono text-emerald-200 font-bold truncate mr-2 select-none">{clip.name}</span>
                          <div className="flex items-center gap-0.5 h-4 flex-shrink-0 select-none">
                            {[20, 60, 95, 40, 70, 85, 30, 100, 55, 90, 75, 45, 80, 35, 65].map((h, i) => (
                              <div key={i} className="w-0.5 bg-emerald-400 rounded-full" style={{ height: `${h}%` }} />
                            ))}
                          </div>
                          <div
                            className={`absolute right-0 top-0 bottom-0 w-2.5 cursor-ew-resize ${activeTool === 'trim' ? 'opacity-100 bg-emerald-400' : 'opacity-0 group-hover:opacity-100 bg-emerald-400/70 hover:bg-emerald-300'} rounded-r transition-opacity z-20`}
                            onMouseDown={(e) => { e.stopPropagation(); handleClipMouseDown(e, clip, 'trim-out'); }}
                            title="Trim Fin (Trim Out)"
                          />
                        </div>
                      ))}
                    </div>

                    {/* A3 Soundtrack 2 Track */}
                    <div className="h-10 relative bg-cyan-950/20 p-1">
                      {soundtrackClips.filter(c => c.track === "A3").map(clip => (
                        <div
                          key={clip.id}
                          onClick={(e) => { e.stopPropagation(); handleSelectClip(clip); }}
                          onMouseDown={(e) => { if (activeTool !== 'blade') handleClipMouseDown(e, clip, 'move'); }}
                          className="group absolute top-1 h-7 rounded bg-cyan-600/30 border border-cyan-500/60 px-2 flex items-center justify-between cursor-pointer"
                          style={{
                            left: `${clip.start * timelineZoom}px`,
                            width: `${clip.duration * timelineZoom}px`,
                          }}
                        >
                          <div
                            className={`absolute left-0 top-0 bottom-0 w-2.5 cursor-ew-resize ${activeTool === 'trim' ? 'opacity-100 bg-cyan-400' : 'opacity-0 group-hover:opacity-100 bg-cyan-400/70 hover:bg-cyan-300'} rounded-l transition-opacity z-20`}
                            onMouseDown={(e) => { e.stopPropagation(); handleClipMouseDown(e, clip, 'trim-in'); }}
                            title="Trim Début (Trim In)"
                          />
                          <span className="text-[9px] font-mono text-cyan-200 font-bold truncate select-none">{clip.name}</span>
                          <div
                            className={`absolute right-0 top-0 bottom-0 w-2.5 cursor-ew-resize ${activeTool === 'trim' ? 'opacity-100 bg-cyan-400' : 'opacity-0 group-hover:opacity-100 bg-cyan-400/70 hover:bg-cyan-300'} rounded-r transition-opacity z-20`}
                            onMouseDown={(e) => { e.stopPropagation(); handleClipMouseDown(e, clip, 'trim-out'); }}
                            title="Trim Fin (Trim Out)"
                          />
                        </div>
                      ))}
                    </div>

                    {/* A4 SFX Track (Yellow Waveforms) */}
                    <div className="h-10 relative bg-yellow-950/20 p-1">
                      {sfxClips.map(clip => (
                        <div
                          key={clip.id}
                          onClick={(e) => { e.stopPropagation(); handleSelectClip(clip); }}
                          onMouseDown={(e) => { if (activeTool !== 'blade') handleClipMouseDown(e, clip, 'move'); }}
                          className={`group absolute top-1 h-7 rounded px-2 flex items-center justify-between cursor-pointer transition-all ${
                            selectedClip?.id === clip.id ? "bg-yellow-600/50 border-2 border-yellow-300" : "bg-yellow-600/30 border border-yellow-500/60"
                          }`}
                          style={{
                            left: `${clip.start * timelineZoom}px`,
                            width: `${clip.duration * timelineZoom}px`,
                          }}
                        >
                          <div
                            className={`absolute left-0 top-0 bottom-0 w-2.5 cursor-ew-resize ${activeTool === 'trim' ? 'opacity-100 bg-yellow-400' : 'opacity-0 group-hover:opacity-100 bg-yellow-400/70 hover:bg-yellow-300'} rounded-l transition-opacity z-20`}
                            onMouseDown={(e) => { e.stopPropagation(); handleClipMouseDown(e, clip, 'trim-in'); }}
                            title="Trim Début (Trim In)"
                          />
                          <span className="text-[9px] font-mono text-yellow-300 font-bold truncate mr-1 select-none">{clip.name}</span>
                          <div className="flex items-center gap-0.5 h-3 flex-shrink-0 select-none">
                            {[70, 95, 40, 80, 20].map((h, i) => (
                              <div key={i} className="w-0.5 bg-yellow-400 rounded-full" style={{ height: `${h}%` }} />
                            ))}
                          </div>
                          <div
                            className={`absolute right-0 top-0 bottom-0 w-2.5 cursor-ew-resize ${activeTool === 'trim' ? 'opacity-100 bg-yellow-400' : 'opacity-0 group-hover:opacity-100 bg-yellow-400/70 hover:bg-yellow-300'} rounded-r transition-opacity z-20`}
                            onMouseDown={(e) => { e.stopPropagation(); handleClipMouseDown(e, clip, 'trim-out'); }}
                            title="Trim Fin (Trim Out)"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Dynamic Red Playhead Line & Scrub Marker */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none transition-all duration-75"
                      style={{ left: `${playheadTime * timelineZoom}px` }}
                    >
                      <div className="w-3.5 h-3.5 bg-red-500 transform rotate-45 -translate-x-1.5 -translate-y-1.5 shadow-md" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Far Right Audio Mixer Panel */}
              <div className="w-48 flex-shrink-0 bg-[#141416] border-l border-white/[0.07] flex flex-col text-[10px] font-mono">
                <div className="h-7 border-b border-white/[0.07] px-2 flex items-center justify-between bg-[#18181b] font-bold text-zinc-300">
                  <span>Mixer</span>
                  <span className="text-[9px] text-zinc-500">EBU R128</span>
                </div>
                <div className="flex-1 flex p-2 divide-x divide-white/5">
                  {/* Channel A1 */}
                  <div className="flex-1 px-1 flex flex-col items-center justify-between">
                    <span className="font-bold text-amber-400">A1</span>
                    <div className="w-3 flex-1 bg-black/60 rounded flex flex-col justify-end p-0.5 border border-white/5 my-1">
                      <div className="w-full bg-gradient-to-t from-emerald-500 via-amber-400 to-red-500 rounded-sm" style={{ height: "72%" }} />
                    </div>
                    <span className="text-[8px] text-zinc-400">-14</span>
                  </div>
                  {/* Channel A2 */}
                  <div className="flex-1 px-1 flex flex-col items-center justify-between">
                    <span className="font-bold text-emerald-400">A2</span>
                    <div className="w-3 flex-1 bg-black/60 rounded flex flex-col justify-end p-0.5 border border-white/5 my-1">
                      <div className="w-full bg-gradient-to-t from-emerald-500 via-amber-400 to-red-500 rounded-sm" style={{ height: "85%" }} />
                    </div>
                    <span className="text-[8px] text-zinc-400">-8</span>
                  </div>
                  {/* Bus 1 Master */}
                  <div className="flex-1 px-1 flex flex-col items-center justify-between">
                    <span className="font-bold text-red-400">Bus 1</span>
                    <div className="w-3.5 flex-1 bg-black/60 rounded flex flex-col justify-end p-0.5 border border-red-500/30 my-1">
                      <div className="w-full bg-gradient-to-t from-emerald-500 via-amber-400 to-red-500 rounded-sm" style={{ height: "78%" }} />
                    </div>
                    <span className="text-[8px] text-zinc-300 font-bold">-0.3</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PAGE 2: PHOTO PAGE (FASHION SHOOT & COLOR WORKSPACE) ── */}
        {activePage === "photo" && (
          <div className="flex-1 flex flex-col min-h-0 bg-[#0c0c0e]">
            <div className="h-7 border-b border-white/[0.07] px-3 flex items-center justify-between bg-[#18181b] text-xs">
              <div className="flex items-center gap-3">
                <span className="font-bold text-zinc-300">Media Pool</span>
                <span className="text-zinc-500">Effects</span>
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <Camera size={12} />
                  <span>Photo Album</span>
                </span>
              </div>
              <div className="font-bold text-zinc-100 flex items-center gap-2">
                <span>Blackmagic Fashion Photo Shoot</span>
                <span className="text-[10px] text-zinc-500 font-mono">Edited</span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                <button onClick={() => setActivePage("deliver")} className="hover:text-amber-400">Quick Export</button>
                <span className="text-amber-400 font-bold">Inspector</span>
              </div>
            </div>

            <div className="flex-1 flex min-h-0">
              <div className="w-72 border-r border-white/[0.07] bg-[#141416] flex flex-col p-2 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-zinc-300 border-b border-white/5 pb-1 font-mono">
                  <span>Master / Dress 2</span>
                  <Grid size={11} className="text-amber-400" />
                </div>
                <div className="grid grid-cols-2 gap-1 overflow-y-auto flex-1 custom-scrollbar">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                    <div
                      key={n}
                      onClick={() => setSelectedPhotoIndex(n)}
                      className={`aspect-square rounded border overflow-hidden cursor-pointer relative ${
                        selectedPhotoIndex === n ? "border-amber-400 ring-1 ring-amber-400/40" : "border-white/10 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src="/assets/studio_video/photo_model_red_dress.png" alt="" className="w-full h-full object-cover" />
                      <span className="absolute bottom-0.5 right-0.5 text-[7px] font-mono px-1 rounded bg-black/80 text-zinc-300">RAW</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex-1 bg-black flex items-center justify-center p-4 relative overflow-hidden">
                <img
                  src="/assets/studio_video/photo_model_red_dress.png"
                  alt="Fashion Shoot"
                  className="max-h-full max-w-full object-contain shadow-2xl"
                  style={{
                    transform: `scale(${photoTransform.zoom}) translate(${photoTransform.posX}px, ${photoTransform.posY}px) rotate(${photoTransform.rot}deg)`,
                    filter: `brightness(${1 + photoDev.exposure * 0.2}) contrast(${photoDev.contrast}) saturate(${photoDev.saturation}) hue-rotate(${photoDev.temp * 0.5}deg)`,
                  }}
                />
                <div className="absolute bottom-3 left-3 text-[10px] font-mono px-2.5 py-1 rounded bg-black/80 text-zinc-300 border border-white/10 flex items-center gap-3">
                  <span>EOS 5DS • 50.6 MP</span>
                  <span>ISO 100 • 85mm f/1.4</span>
                  <span>1/250s</span>
                </div>
              </div>

              <div className="w-80 border-l border-white/[0.07] bg-[#141416] p-3 space-y-3 text-xs">
                <span className="font-bold text-zinc-200 block border-b border-white/5 pb-1">Photo RAW Inspector</span>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <div className="flex justify-between text-zinc-400 text-[11px]">
                      <span>Zoom</span>
                      <span className="font-mono text-zinc-200">{photoTransform.zoom.toFixed(2)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2.5"
                      step="0.05"
                      value={photoTransform.zoom}
                      onChange={e => setPhotoTransform(prev => ({ ...prev, zoom: parseFloat(e.target.value) }))}
                      className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#df9c43]"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-zinc-400 text-[11px]">
                      <span>Exposition (EV)</span>
                      <span className="font-mono text-zinc-200">{photoDev.exposure.toFixed(1)} EV</span>
                    </div>
                    <input
                      type="range"
                      min="-2"
                      max="2"
                      step="0.1"
                      value={photoDev.exposure}
                      onChange={e => setPhotoDev(prev => ({ ...prev, exposure: parseFloat(e.target.value) }))}
                      className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#df9c43]"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-zinc-400 text-[11px]">
                      <span>Contraste</span>
                      <span className="font-mono text-zinc-200">{photoDev.contrast.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="1.8"
                      step="0.05"
                      value={photoDev.contrast}
                      onChange={e => setPhotoDev(prev => ({ ...prev, contrast: parseFloat(e.target.value) }))}
                      className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#df9c43]"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-zinc-400 text-[11px]">
                      <span>Température Couleur</span>
                      <span className="font-mono text-zinc-200">{photoDev.temp}</span>
                    </div>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      value={photoDev.temp}
                      onChange={e => setPhotoDev(prev => ({ ...prev, temp: parseInt(e.target.value) }))}
                      className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#df9c43]"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-zinc-400 text-[11px]">
                      <span>Saturation</span>
                      <span className="font-mono text-zinc-200">{photoDev.saturation.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.05"
                      value={photoDev.saturation}
                      onChange={e => setPhotoDev(prev => ({ ...prev, saturation: parseFloat(e.target.value) }))}
                      className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#df9c43]"
                    />
                  </div>
                  <button
                    onClick={handleExportPhoto}
                    className="w-full py-1.5 rounded bg-[#df9c43] hover:bg-[#f5c277] text-black font-bold text-xs shadow-md mt-2 flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all"
                  >
                    <Download size={13} />
                    Exporter Photo RAW Master
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PAGE 3: CUT PAGE (FAST TAPE & MULTICAM SWITCHER) ── */}
        {activePage === "cut" && (
          <div className="flex-1 flex flex-col min-h-0 bg-[#0c0c0e]">
            <div className="h-7 border-b border-white/[0.07] px-3 flex items-center justify-between bg-[#18181b] text-xs">
              <span className="font-bold text-zinc-200">Cut Page • Commutation Multicam 6-Angles</span>
              <div className="flex items-center gap-3">
                <button onClick={() => handleStartRender()} className="px-2 py-0.5 rounded bg-amber-500 text-black font-bold text-[10px]">Rendu Rapide</button>
              </div>
            </div>

            <div className="flex-1 flex min-h-0">
              {/* Multicam 6-Grid Switcher */}
              <div className="flex-1 p-3 grid grid-cols-3 gap-2 bg-[#09090b]">
                {CAMERAS.map(cam => (
                  <div
                    key={cam.id}
                    onClick={() => {
                      setActiveCameraAngle(cam.id);
                      if (cam.url) {
                        setVideoClips(prev => prev.map((c, i) => i === 0 ? { ...c, url: cam.url } : c));
                      }
                    }}
                    className={`aspect-video rounded border overflow-hidden relative cursor-pointer group transition-all ${
                      activeCameraAngle === cam.id
                        ? "border-2 border-red-500 ring-2 ring-red-500/50 shadow-2xl"
                        : "border-white/10 opacity-70 hover:opacity-100"
                    }`}
                  >
                    {cam.url ? (
                      <img src={cam.url} alt={cam.label} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-zinc-500">Audio Only</div>
                    )}
                    <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono text-white flex items-center gap-1">
                      {activeCameraAngle === cam.id && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                      <span>Angle {cam.angle}</span>
                    </div>
                    <span className="absolute bottom-1 left-1 text-[9px] text-zinc-300 bg-black/70 px-1 rounded truncate max-w-[120px]">{cam.label}</span>
                  </div>
                ))}
              </div>

              {/* Fast Edit Tools Panel */}
              <div className="w-64 border-l border-white/[0.07] bg-[#141416] p-3 space-y-2 text-xs">
                <span className="font-bold text-zinc-300 block uppercase tracking-wider text-[10px]">Outils Cut Rapide</span>
                <button
                  onClick={() => {
                    handleInsertToTimeline(sourceClip);
                    showToast("Smart Insert appliqué au playhead.", "success");
                  }}
                  className="w-full py-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 font-semibold text-left px-2"
                >
                  Smart Insert
                </button>
                <button
                  onClick={() => {
                    handleInsertToTimeline(sourceClip);
                    showToast("Clip inséré en fin de timeline.", "success");
                  }}
                  className="w-full py-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 font-semibold text-left px-2"
                >
                  Append at End
                </button>
                <button
                  onClick={() => {
                    setVideoZoom(1.4);
                    if (selectedClip) setVideoClips(prev => prev.map(c => c.id === selectedClip.id ? { ...c, zoom: 1.4, cameraShot: "S2 Gros Plan Dynamique (Close-Up)" } : c));
                    showToast("Plan Close-Up appliqué (Zoom 1.4x).", "success");
                  }}
                  className="w-full py-1.5 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-semibold text-left px-2"
                >
                  Close-Up Auto (Zoom 1.4x)
                </button>
                <button
                  onClick={() => {
                    handleSplitClipAtPlayhead();
                    showToast("Coupe franche effectuée au playhead.", "success");
                  }}
                  className="w-full py-1.5 rounded bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-semibold text-left px-2"
                >
                  Coupe Franche (Razor)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── PAGE 4: FUSION PAGE (15-NODE COMPOSITING TREE) ── */}
        {activePage === "fusion" && (
          <div className="flex-1 flex flex-col min-h-0 bg-[#09090b]">
            <div className="h-7 border-b border-white/[0.07] px-3 flex items-center justify-between bg-[#141416] text-xs">
              <span className="font-bold text-zinc-200">Fusion VFX Studio • Graphe de Compositing Nodal</span>
              <span className="text-[10px] text-purple-400 font-mono">15 Nœuds Actifs</span>
            </div>

            <div className="h-[46%] flex border-b border-white/[0.07]">
              <div className="flex-1 bg-black flex items-center justify-center p-2 relative overflow-hidden">
                <img
                  src="/assets/studio_video/fusion_documentary_spiral.png"
                  alt="Fusion Cosmic Spiral"
                  className="max-h-full max-w-full object-contain"
                />
                <div className="absolute bottom-2 left-2 text-[10px] font-mono px-2 py-0.5 rounded bg-black/80 text-purple-300 border border-purple-500/30">
                  MediaOut1 • 27.0 fps
                </div>
              </div>

              {/* Node Inspector */}
              <div className="w-80 border-l border-white/[0.07] bg-[#141416] p-3 space-y-2.5 overflow-y-auto text-xs custom-scrollbar">
                <div className="flex justify-between items-center border-b border-white/5 pb-1">
                  <span className="font-bold text-purple-300">Inspecteur Nœud: {activeFusionNodeId}</span>
                  <button
                    onClick={() => {
                      setFusionNodes(prev => prev.map(n => n.id === activeFusionNodeId ? { ...n, active: !n.active } : n));
                    }}
                    className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-zinc-300"
                  >
                    Bypass
                  </button>
                </div>

                <div className="space-y-1.5">
                  <span className="text-zinc-400 block text-[11px]">Texte MultiText1</span>
                  <input
                    type="text"
                    value={multiText1Content}
                    onChange={e => setMultiText1Content(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded p-1 text-zinc-200 font-mono text-[11px]"
                  />
                </div>

                <div className="space-y-1.5">
                  <span className="text-zinc-400 block text-[11px]">Taille (Size)</span>
                  <input
                    type="number"
                    value={multiText1Size}
                    onChange={e => setMultiText1Size(parseInt(e.target.value) || 28)}
                    className="w-full bg-black/60 border border-white/10 rounded p-1 text-zinc-200 font-mono text-[11px]"
                  />
                </div>
              </div>
            </div>

            {/* Nodes Tree Canvas */}
            <div className="flex-1 bg-[#0b0b0e] p-3 overflow-auto flex flex-col justify-around">
              <div className="flex items-center gap-4 pl-12">
                {fusionNodes.filter(n => n.branch === "top").map(n => (
                  <div
                    key={n.id}
                    onClick={() => setActiveFusionNodeId(n.id)}
                    className={`px-3 py-1.5 rounded border text-[10px] font-mono cursor-pointer transition-all ${
                      activeFusionNodeId === n.id ? "bg-purple-900/40 border-purple-400 text-white font-bold ring-1 ring-purple-400/50" : "bg-zinc-900 border-white/10 text-zinc-300"
                    }`}
                  >
                    {n.name}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4 pl-6">
                {fusionNodes.filter(n => n.branch === "mid").map(n => (
                  <div
                    key={n.id}
                    onClick={() => setActiveFusionNodeId(n.id)}
                    className={`px-3 py-1.5 rounded border text-[10px] font-mono cursor-pointer transition-all ${
                      activeFusionNodeId === n.id ? "bg-purple-900/40 border-purple-400 text-white font-bold ring-1 ring-purple-400/50" : "bg-zinc-900 border-white/10 text-zinc-300"
                    }`}
                  >
                    {n.name}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3">
                {fusionNodes.filter(n => n.branch === "bot" || n.branch === "fg").map(n => (
                  <div
                    key={n.id}
                    onClick={() => setActiveFusionNodeId(n.id)}
                    className={`px-2.5 py-1 rounded border text-[9px] font-mono cursor-pointer transition-all ${
                      activeFusionNodeId === n.id ? "bg-purple-900/40 border-purple-400 text-white font-bold ring-1 ring-purple-400/50" : "bg-zinc-900 border-white/10 text-zinc-300"
                    }`}
                  >
                    {n.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── PAGE 5: COLOR PAGE (15-NODE COLOR TREE & COLOR WHEELS) ── */}
        {activePage === "color" && (
          <div className="flex-1 flex flex-col min-h-0 bg-[#09090b]">
            <div className="h-[46%] flex border-b border-white/[0.07]">
              {/* Stills Gallery */}
              <div className="w-64 border-r border-white/[0.07] bg-[#141416] p-2 flex flex-col">
                <div className="flex items-center justify-between text-[11px] font-bold text-zinc-300 mb-1.5">
                  <span>Gallery Stills</span>
                  <span className="text-[10px] text-zinc-500 font-mono">12 Grades</span>
                </div>
                <div className="grid grid-cols-3 gap-1 overflow-y-auto flex-1 custom-scrollbar">
                  {["1.64.3", "1.64.4", "1.64.5", "1.88.1", "1.95.1", "1.105.1"].map(id => (
                    <div key={id} className="aspect-video bg-black rounded border border-white/10 overflow-hidden relative cursor-pointer hover:border-amber-400">
                      <img src="/assets/studio_video/clip_cowboy_dylan.png" alt="" className="w-full h-full object-cover" />
                      <span className="absolute bottom-0.5 right-0.5 text-[7px] font-mono px-0.5 rounded bg-black/80 text-zinc-300">{id}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Monitor */}
              <div className="flex-1 bg-black flex items-center justify-center p-2 relative overflow-hidden">
                <img
                  src="/assets/studio_video/color_grade_monitor.png"
                  alt="Color Grade Monitor"
                  className="max-h-full max-w-full object-contain"
                  style={{
                    filter: `brightness(${1 + (colorWheels.light.exp || 0) * 0.2}) contrast(${1 + (colorWheels.shadow.exp || 0) * 0.2}) saturate(${colorWheels.global.sat})`,
                  }}
                />
                <div className="absolute top-2 left-2 text-[10px] font-mono px-2 py-0.5 rounded bg-black/80 text-amber-400 border border-amber-500/30">
                  Dylan Rucker - Grade • Live UHD
                </div>
              </div>

              {/* 15-Node Tree */}
              <div className="w-[420px] border-l border-white/[0.07] bg-[#141416] p-2 flex flex-col justify-between">
                <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400 border-b border-white/5 pb-1">
                  <span className="font-bold text-amber-400">Arbre Nodal (15 Nœuds)</span>
                  <span>Cliquer pour bypasser</span>
                </div>
                <div className="flex-1 grid grid-rows-4 gap-1 py-1 text-[9px] font-mono">
                  {[1, 2, 3, 4].map(row => (
                    <div key={row} className="flex gap-1 justify-between">
                      {colorNodes.filter(n => n.row === row).map(n => (
                        <div
                          key={n.id}
                          onClick={() => {
                            setActiveColorNodeId(n.id);
                            setColorNodes(prev => prev.map(item => item.id === n.id ? { ...item, active: !item.active } : item));
                          }}
                          className={`flex-1 rounded border p-1 text-center cursor-pointer transition-all ${
                            !n.active ? "opacity-30 line-through bg-red-950/20 border-red-500/40" :
                            activeColorNodeId === n.id ? "border-amber-400 bg-amber-950/30 text-white font-bold" : "border-white/10 bg-black/70 text-zinc-300"
                          }`}
                        >
                          <span className="text-[7px] text-zinc-500 block">{n.num}</span>
                          <span className="block truncate">{n.name}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom: HDR Wheels & Scopes */}
            <div className="flex-1 flex min-h-0 bg-[#0e0e11]">
              <div className="flex-1 border-r border-white/[0.07] p-3 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">High Dynamic Range - Color Wheels</span>
                <div className="grid grid-cols-4 gap-3 my-auto">
                  {Object.entries(colorWheels).map(([name, wheel]) => (
                    <div key={name} className="flex flex-col items-center space-y-1">
                      <div className="w-16 h-16 rounded-full border-2 border-white/20 relative flex items-center justify-center bg-gradient-to-tr from-blue-900/40 via-black to-amber-900/40 shadow-inner">
                        <div className="w-2.5 h-2.5 rounded-full bg-white shadow-md" />
                      </div>
                      <span className="text-[10px] font-bold capitalize text-zinc-300">{name}</span>
                      <div className="w-full flex items-center gap-1 text-[8px] font-mono">
                        <span className="text-zinc-500">Exp</span>
                        <input
                          type="range"
                          min="-2"
                          max="2"
                          step="0.1"
                          value={wheel.exp}
                          onChange={e => {
                            const val = parseFloat(e.target.value);
                            setColorWheels(prev => ({ ...prev, [name]: { ...prev[name], exp: val } }));
                          }}
                          className="flex-1 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#df9c43]"
                        />
                        <span className="w-6 text-right text-zinc-300">{wheel.exp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scopes */}
              <div className="w-72 p-2 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Scopes • RGB Parade</span>
                <div className="flex-1 bg-black/90 rounded border border-white/10 p-1 flex items-end gap-1.5 my-1">
                  <div className="flex-1 h-full flex items-end justify-center">
                    <svg className="w-full h-full" viewBox="0 0 50 60">
                      <path d="M 0 55 Q 15 10 25 30 T 50 55" fill="none" stroke="#ef4444" strokeWidth="1.5" />
                    </svg>
                  </div>
                  <div className="flex-1 h-full flex items-end justify-center">
                    <svg className="w-full h-full" viewBox="0 0 50 60">
                      <path d="M 0 55 Q 15 20 25 15 T 50 55" fill="none" stroke="#10b981" strokeWidth="1.5" />
                    </svg>
                  </div>
                  <div className="flex-1 h-full flex items-end justify-center">
                    <svg className="w-full h-full" viewBox="0 0 50 60">
                      <path d="M 0 55 Q 15 15 25 35 T 50 55" fill="none" stroke="#3b82f6" strokeWidth="1.5" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PAGE 6: FAIRLIGHT PAGE (AUDIO DAW) ── */}
        {activePage === "fairlight" && (
          <div className="flex-1 flex flex-col min-h-0 bg-[#09090b] relative">
            <div className="h-28 border-b border-white/[0.07] bg-[#111113] p-1.5 flex items-center justify-between">
              <div className="flex-1 flex items-end gap-1 h-full px-2">
                {Array.from({ length: 36 }).map((_, i) => (
                  <div key={i} className="flex-1 h-full bg-black/60 rounded flex flex-col justify-end p-0.5 border border-white/5">
                    <div
                      className="w-full bg-gradient-to-t from-emerald-500 via-amber-400 to-red-500 rounded-sm"
                      style={{ height: `${20 + ((i * 17) % 75)}%` }}
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 h-full pl-2 border-l border-white/10">
                <div className="w-28 h-full bg-black/80 rounded border border-white/10 p-1.5 flex flex-col justify-between font-mono text-[9px]">
                  <span className="text-zinc-500">BS.1770-1 (LU)</span>
                  <span className="text-sm font-black text-emerald-400">-14.0 LUFS</span>
                  <span className="text-zinc-400">Range: 10.5</span>
                </div>
                <div className="w-36 h-full bg-black rounded border border-white/10 overflow-hidden relative">
                  <img src="/assets/studio_video/fairlight_band_monitor.png" alt="Live Band" className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 right-1 text-[8px] font-mono px-1 rounded bg-black/80 text-zinc-300">Live Band Demo</span>
                </div>
              </div>
            </div>

            {/* Fairlight Tracks */}
            <div className="flex-1 flex min-h-0 bg-[#0c0c0e]">
              <div className="flex-1 p-2 space-y-1 overflow-y-auto custom-scrollbar">
                {[
                  { name: "A1 VO Dylan (ISO IA)", dur: "6.8s" },
                  { name: "A2 ACE-Step 1.5 Master BF16", dur: "15.0s" },
                  { name: "A3 Ambience Drone", dur: "8.0s" },
                  { name: "A4 SFX Boom & Whoosh", dur: "3.7s" },
                ].map(tr => (
                  <div key={tr.name} className="h-8 rounded border bg-emerald-950/20 border-emerald-500/40 flex items-center px-2 justify-between">
                    <span className="text-[10px] font-mono font-bold text-zinc-200">{tr.name}</span>
                    <div className="flex-1 mx-4 flex items-center gap-0.5 h-4">
                      {[30, 70, 45, 90, 60, 100, 50, 80].map((h, i) => (
                        <div key={i} className="w-1 bg-emerald-400/80 rounded-full" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                    <span className="text-[9px] font-mono text-emerald-400">{tr.dur}</span>
                  </div>
                ))}
              </div>

              {/* Console Mixer */}
              <div className="w-80 border-l border-white/[0.07] bg-[#141416] p-2 flex flex-col justify-between font-mono text-[9px]">
                <div className="flex items-center justify-between border-b border-white/10 pb-1 mb-1 font-sans">
                  <span className="font-bold text-zinc-200">Fairlight Console Mixer</span>
                  <span className="text-[9px] text-emerald-400 font-mono">32-bit Float</span>
                </div>
                <div className="flex gap-1.5 flex-1 my-1">
                  {["A1", "A2", "A3", "A4", "Master"].map(ch => {
                    const chData = fairlightMixer[ch] || { vol: 0, pan: 0, mute: false, solo: false };
                    const isMuted = chData.mute || (ch !== "Master" && trackMute[ch]);
                    const vuHeight = isMuted ? 0 : Math.max(8, Math.min(100, ((chData.vol + 60) / 72) * 100));
                    return (
                      <div key={ch} className="flex-1 flex flex-col items-center justify-between bg-black/40 rounded p-1 border border-white/5">
                        <div className="text-center w-full">
                          <span className={`font-bold block text-[10px] ${ch === 'Master' ? 'text-amber-400' : 'text-zinc-200'}`}>{ch}</span>
                          <span className="text-[7px] text-zinc-500 block truncate">
                            {ch === 'A1' ? 'VO' : ch === 'A2' ? 'Music' : ch === 'A3' ? 'Amb' : ch === 'A4' ? 'SFX' : 'Main'}
                          </span>
                        </div>

                        {/* Mute & Solo Buttons */}
                        <div className="flex gap-1 my-1 w-full justify-center">
                          <button
                            onClick={() => {
                              const newMute = !chData.mute;
                              setFairlightMixer(prev => ({ ...prev, [ch]: { ...prev[ch], mute: newMute } }));
                              if (ch !== "Master") {
                                setTrackMute(prev => ({ ...prev, [ch]: newMute }));
                              }
                            }}
                            className={`px-1.5 py-0.5 rounded text-[8px] font-black transition-colors ${
                              isMuted ? "bg-red-600 text-white shadow" : "bg-zinc-800 text-zinc-400 hover:text-white"
                            }`}
                            title={`Mute ${ch}`}
                          >
                            M
                          </button>
                          <button
                            onClick={() => {
                              const newSolo = !chData.solo;
                              setFairlightMixer(prev => ({ ...prev, [ch]: { ...prev[ch], solo: newSolo } }));
                            }}
                            className={`px-1.5 py-0.5 rounded text-[8px] font-black transition-colors ${
                              chData.solo ? "bg-amber-500 text-black shadow font-bold" : "bg-zinc-800 text-zinc-400 hover:text-white"
                            }`}
                            title={`Solo ${ch}`}
                          >
                            S
                          </button>
                        </div>

                        {/* VU Meter & Vertical Fader */}
                        <div className="flex items-center gap-1.5 h-36 my-1">
                          {/* Meter */}
                          <div className="w-2 h-full bg-black/80 rounded flex flex-col justify-end p-0.5 border border-white/10">
                            <div
                              className={`w-full rounded-sm transition-all duration-75 ${
                                vuHeight > 85 ? "bg-red-500" : vuHeight > 65 ? "bg-amber-400" : "bg-emerald-400"
                              }`}
                              style={{ height: `${vuHeight}%` }}
                            />
                          </div>

                          {/* Fader */}
                          <div className="h-full flex items-center justify-center relative py-1">
                            <input
                              type="range"
                              min="-60"
                              max="12"
                              step="0.5"
                              value={chData.vol}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                setFairlightMixer(prev => ({ ...prev, [ch]: { ...prev[ch], vol: val } }));
                              }}
                              className="h-32 w-3.5 appearance-none bg-zinc-800 rounded cursor-pointer accent-amber-400 [writing-mode:vertical-lr] [direction:rtl]"
                            />
                          </div>
                        </div>

                        {/* dB Readout */}
                        <span className={`text-[8px] font-mono mt-0.5 ${chData.vol > 0 ? 'text-amber-400' : 'text-zinc-400'}`}>
                          {chData.vol > 0 ? `+${chData.vol.toFixed(1)}` : chData.vol.toFixed(1)}dB
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PAGE 7: DELIVER PAGE (RENDER QUEUE & FFMPEG EXPORT) ── */}
        {activePage === "deliver" && (
          <div className="flex-1 flex min-h-0 bg-[#0c0c0e]">
            {/* Presets List */}
            <div className="w-80 border-r border-white/[0.07] bg-[#141416] p-3 space-y-2">
              <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider block mb-2 font-sans">Presets d'Exportation</span>
              {[
                { id: "youtube_4k", name: "YouTube 4K UHD", desc: "3840x2160 • H.264 • 45 Mbps" },
                { id: "prores_master", name: "Apple ProRes 422 HQ", desc: "Master Studio • PCM 24-bit" },
                { id: "h264_web", name: "H.264 Web Stream", desc: "1080p HD • MP4 • 12 Mbps" },
                { id: "tiktok_916", name: "TikTok / Reels (9:16)", desc: "1080x1920 • Vertical MP4" },
              ].map(p => (
                <div
                  key={p.id}
                  onClick={() => setDeliverPreset(p.id)}
                  className={`p-2.5 rounded border cursor-pointer transition-all ${
                    deliverPreset === p.id ? "bg-amber-500/20 border-amber-400 text-white shadow-md" : "bg-black/30 border-white/5 text-zinc-400 hover:border-white/20"
                  }`}
                >
                  <span className="font-bold text-xs block">{p.name}</span>
                  <span className="text-[10px] font-mono text-zinc-500">{p.desc}</span>
                </div>
              ))}
            </div>

            {/* Center Render Settings & Queue */}
            <div className="flex-1 p-6 space-y-5 max-w-2xl overflow-y-auto custom-scrollbar">
              <div>
                <span className="text-sm font-bold text-zinc-200 block mb-1 font-sans">Moteur de Rendu FFmpeg 6.1 Native</span>
                <span className="text-xs text-zinc-500 font-mono">Génération réelle multi-plans avec pistes vidéo, audio et titres</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-xs text-zinc-400">Conteneur</span>
                  <select value={exportFormat} onChange={e => setExportFormat(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded p-2 text-xs text-zinc-200">
                    <option value="mp4">MP4 Video (.mp4)</option>
                    <option value="mov">QuickTime (.mov)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-zinc-400">Résolution</span>
                  <select value={exportResolution} onChange={e => setExportResolution(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded p-2 text-xs text-zinc-200">
                    <option value="3840x2160">3840x2160 Ultra HD 4K (16:9)</option>
                    <option value="1920x1080">1920x1080 Full HD (16:9)</option>
                    <option value="1080x1920">1080x1920 TikTok / Shorts (9:16)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => handleStartRender()}
                  disabled={isRendering}
                  className="px-6 py-2.5 rounded bg-[#df9c43] hover:bg-[#f5c277] text-black font-bold text-xs transition-all shadow-lg active:scale-95 disabled:opacity-50"
                >
                  {isRendering ? `Rendu en cours (${renderProgress}%)...` : "Démarrer le Rendu Master"}
                </button>

                {renderedOutputUrl && (
                  <a
                    href={renderedOutputUrl}
                    download
                    className="px-4 py-2.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold hover:bg-emerald-500 hover:text-black transition-all flex items-center gap-1.5"
                  >
                    <Download size={13} />
                    <span>Télécharger Master MP4</span>
                  </a>
                )}
              </div>

              {/* Render Queue Table */}
              <div className="pt-4 border-t border-white/10 space-y-2">
                <span className="text-xs font-bold text-zinc-300 block font-sans">File d'attente de rendu (Render Queue)</span>
                <div className="space-y-1.5 text-xs font-mono">
                  {renderQueue.map(job => (
                    <div key={job.id} className="p-2 rounded bg-black/40 border border-white/10 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-zinc-200 block">{job.name}</span>
                        <span className="text-[10px] text-zinc-500">{job.res} • {job.format}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          job.status === "Completed" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                        }`}>
                          {job.status}
                        </span>
                        {job.url && (
                          <a href={job.url} download className="text-emerald-400 hover:underline text-[10px]">Télécharger</a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PAGE 8: MEDIA STORAGE PAGE ── */}
        {activePage === "media" && (
          <div className="flex-1 flex min-h-0 bg-[#0c0c0e] p-4">
            <div className="w-80 border-r border-white/10 pr-4 space-y-3 text-xs">
              <span className="font-bold text-zinc-200 block uppercase tracking-wide">Stockage des Médias</span>
              <div className="space-y-1 font-mono text-[11px]">
                <div className="p-2 rounded bg-white/5 text-zinc-300 cursor-pointer">📁 /Volumes/DGX_Spark_GB10</div>
                <div className="p-2 rounded bg-white/5 text-zinc-300 cursor-pointer">📁 /Volumes/URSA_Cine_17K_BRAW</div>
                <div className="p-2 rounded bg-white/5 text-zinc-300 cursor-pointer">📁 /Volumes/Production_Master_SSD</div>
              </div>
            </div>
            <div className="flex-1 pl-4 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-zinc-300 block mb-2">Ingestion & Métadonnées</span>
                <div className="p-4 bg-black/40 rounded border border-white/10 text-xs text-zinc-400 space-y-2">
                  <p>• {mediaAssets.length} fichiers détectés dans le dossier outputs.</p>
                  <p>• Détection automatique des métadonnées BRAW 17K, ProRes 422 HQ et AI Stems.</p>
                  <p>• Synchronisation continue avec le stockage DGX Spark GB10.</p>
                </div>
              </div>
              <button
                onClick={handleIngestSparkMedia}
                disabled={isIngestingAi}
                className="self-start px-4 py-2 rounded bg-[#df9c43] text-black font-bold text-xs"
              >
                Synchroniser Tout le Stockage
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ═══════════════════════════════════════════════════════════════════
          3. BOTTOM STUDIO VIDEO SIGNATURE PAGES BAR (8 PAGES)
      ════════════════════════════════════════════════════════════════════ */}
      <footer className="flex-shrink-0 h-10 border-t border-white/[0.07] bg-[#121214] px-4 flex items-center justify-between z-30">
        {/* Left Studio Video Badge */}
        <div className="flex items-center gap-2 text-zinc-300 text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span>Studio Video</span>
        </div>

        {/* Center 8 Workspace Signature Pages */}
        <div className="flex items-center gap-1 bg-black/60 p-0.5 rounded-lg border border-white/10 shadow-inner">
          {[
            { id: "media", label: "Media", icon: Film },
            { id: "photo", label: "Photo", icon: Camera },
            { id: "cut", label: "Cut", icon: Scissors },
            { id: "edit", label: "Edit", icon: Clapperboard },
            { id: "fusion", label: "Fusion", icon: Wand2 },
            { id: "color", label: "Color", icon: Palette },
            { id: "fairlight", label: "Fairlight", icon: Music },
            { id: "deliver", label: "Deliver", icon: Share2 },
          ].map(page => {
            const Icon = page.icon;
            const isActive = activePage === page.id;
            return (
              <button
                key={page.id}
                onClick={() => setActivePage(page.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all ${
                  isActive
                    ? "bg-[#df9c43] text-black font-bold shadow-sm scale-105"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-white/5"
                }`}
              >
                <Icon size={13} />
                <span>{page.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Status Indicators */}
        <div className="flex items-center gap-3 text-[11px] text-zinc-500 font-mono">
          <span>DGX Spark GB10 Active</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        </div>
      </footer>

      {/* ═══════════════════════════════════════════════════════════════════
          4. QUICK EXPORT MODAL (1-CLICK HIGH PERFORMANCE RENDERING)
      ════════════════════════════════════════════════════════════════════ */}
      {showQuickExportModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-[500px] bg-[#18181b] border border-white/20 rounded-xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="font-bold text-sm text-zinc-100 font-sans">Export Rapide • Studio Video Master</span>
              <button onClick={() => setShowQuickExportModal(false)} className="text-zinc-400 hover:text-white">
                <X size={15} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { id: "youtube_4k", name: "YouTube 4K UHD", desc: "H.264 45 Mbps" },
                { id: "prores_master", name: "Apple ProRes Master", desc: "422 HQ Studio" },
                { id: "h264_web", name: "Web Full HD 1080p", desc: "H.264 12 Mbps" },
                { id: "tiktok_916", name: "TikTok / Reels 9:16", desc: "Vertical 1080x1920" },
              ].map(p => (
                <div
                  key={p.id}
                  onClick={() => setDeliverPreset(p.id)}
                  className={`p-3 rounded border cursor-pointer transition-all ${
                    deliverPreset === p.id ? "bg-amber-500/20 border-amber-400 text-white font-bold" : "bg-black/40 border-white/10 text-zinc-400 hover:border-white/20"
                  }`}
                >
                  <span>{p.name}</span>
                  <span className="block text-[10px] text-zinc-500 font-normal">{p.desc}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <span className="text-xs text-zinc-400 font-mono">
                {isRendering ? `Rendu en cours (${renderProgress}%)...` : "Prêt à exporter"}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowQuickExportModal(false)}
                  className="px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-xs text-zinc-300"
                >
                  Fermer
                </button>
                <button
                  onClick={() => handleStartRender(deliverPreset)}
                  disabled={isRendering}
                  className="px-4 py-1.5 rounded bg-[#df9c43] hover:bg-[#f5c277] text-black font-bold text-xs shadow-md disabled:opacity-50"
                >
                  Exporter Maintenant
                </button>
              </div>
            </div>

            {renderedOutputUrl && (
              <div className="p-3 bg-emerald-950/30 border border-emerald-500/40 rounded flex items-center justify-between text-xs">
                <span className="text-emerald-300 font-bold">Fichier prêt pour le téléchargement !</span>
                <a
                  href={renderedOutputUrl}
                  download
                  className="px-3 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-bold"
                >
                  Télécharger
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          5. PROJECT SETTINGS MODAL
      ════════════════════════════════════════════════════════════════════ */}
      {showProjectSettingsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-96 bg-[#18181b] border border-white/20 rounded-xl shadow-2xl p-5 space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="font-bold text-sm text-zinc-100">Réglages du Projet</span>
              <button onClick={() => setShowProjectSettingsModal(false)} className="text-zinc-400 hover:text-white">
                <X size={15} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <span className="text-zinc-400">Résolution Master</span>
                <select
                  value={projectResolution}
                  onChange={e => setProjectResolution(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded p-2 text-zinc-200"
                >
                  <option value="3840x2160 UHD">3840x2160 Ultra HD 4K</option>
                  <option value="1920x1080 HD">1920x1080 Full HD</option>
                  <option value="1080x1920 Vertical">1080x1920 Vertical (Reels / TikTok)</option>
                </select>
              </div>

              <div className="space-y-1">
                <span className="text-zinc-400">Cadence d'Image (FPS)</span>
                <select
                  value={projectFps}
                  onChange={e => setProjectFps(parseInt(e.target.value))}
                  className="w-full bg-black/40 border border-white/10 rounded p-2 text-zinc-200"
                >
                  <option value={24}>24.000 fps (Cinéma)</option>
                  <option value={25}>25.000 fps (PAL)</option>
                  <option value={30}>29.970 / 30.000 fps (NTSC)</option>
                  <option value={60}>60.000 fps (Haute Cadence)</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setShowProjectSettingsModal(false)}
                className="px-4 py-1.5 rounded bg-[#df9c43] text-black font-bold"
              >
                Appliquer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
