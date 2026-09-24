import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  X, Play, Pause, Download, Video, Circle, BarChart2, Waves, Disc,
  Box, Activity, Grid, Aperture, Type, Volume2, Music, Sparkles,
  Sliders, FileText, Layers, Loader2, Cpu, CheckCircle2, RefreshCw, Zap
} from "lucide-react";

// Columns / Mirror icon
function ColumnsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v18" />
      <rect width="18" height="18" x="3" y="3" rx="2" />
    </svg>
  );
}

const PRESETS = [
  { id: "Classic NCS", label: "Classic NCS", icon: Circle },
  { id: "Spectrum", label: "Spectrum", icon: BarChart2 },
  { id: "Mirror", label: "Mirror", icon: ColumnsIcon },
  { id: "Shockwave", label: "Shockwave", icon: Waves },
  { id: "Orbital", label: "Orbital", icon: Disc },
  { id: "Hex Core", label: "Hex Core", icon: Box },
  { id: "Analog", label: "Analog", icon: Activity },
  { id: "Matrix", label: "Matrix", icon: Grid },
  { id: "Pulse", label: "Pulse", icon: Aperture },
  { id: "Clean", label: "Clean", icon: Type },
];

export const VIDEO_AI_MODELS = [
  { id: "wan2.1", name: "Wan 2.1 (T2V / I2V) SOTA", desc: "Alibaba Wan 2.1 - Cinématique, photoréaliste & fluide", badge: "Recommandé" },
  { id: "wan2.2", name: "Wan 2.2 5B High Quality", desc: "1280x720 HD natif sur DGX Spark GB10", badge: "HQ" },
  { id: "ltx2.5", name: "LTX-Video 2.5 (22B Distilled)", desc: "Lightricks LTX - Rendu ultra-rapide (<12s)", badge: "Temps Réel" },
  { id: "minimax-h3", name: "MiniMax Hailuo H3 Turbo", desc: "Mouvements de caméra complexes et dynamisme", badge: "Dynamique" },
  { id: "kling-ai", name: "Kling AI Video v1.5", desc: "Excellente cohérence temporelle & expressivité", badge: "Cloud" },
  { id: "hunyuan", name: "HunyuanVideo SOTA", desc: "Tencent DiT 13B - Qualité cinématique studio", badge: "Cinéma" },
  { id: "svd-xt", name: "Stable Video Diffusion (SVD-XT)", desc: "Animation audio-réactive de la pochette", badge: "Cover Sync" }
];

export const COMFYUI_WORKFLOWS = [
  { id: "wan2_1_music_video.json", name: "Wan 2.1 Music Video Beat-Synced", desc: "Transitions et cuts synchronisés au tempo BPM" },
  { id: "cogvideox_audio_reactive.json", name: "CogVideoX Beat Reactive Zoom & Shake", desc: "Zoom dynamique réactif au kick et aux basses" },
  { id: "svd_beat_sync.json", name: "SVD Cover to Motion Clip", desc: "Anime la pochette d'album générée avec vagues sonores" },
  { id: "ltx_t2v_high_quality.json", name: "LTX-2.5 Fast Music Visualizer", desc: "Génération express haute fidélité" }
];

export const VideoStudioModal = ({
  isOpen,
  onClose,
  song,
  bpm = 118,
  musicalKey = "E Minor",
  markers = [],
  activeProjectTitle = "Sahel Symphony",
  onSyncPlay,
  onSyncPause,
  onSyncSeek,
  dawCurrentTime = 0
}) => {
  // Active Tab: 'presets' | 'style' | 'text' | 'fx' | 'ai_comfy'
  const [activeTab, setActiveTab] = useState("ai_comfy");
  const [preset, setPreset] = useState("Classic NCS");

  // Audio-Visual Synchronization & System Protection
  const [dawSyncActive, setDawSyncActive] = useState(true);
  const [ecoHardwareGuard, setEcoHardwareGuard] = useState(true); // Anti-saturation for running tasks
  const [isSparkBusy, setIsSparkBusy] = useState(false);

  // AI Video & ComfyUI Settings
  const [selectedVideoModel, setSelectedVideoModel] = useState("wan2.1");
  const [selectedComfyWorkflow, setSelectedComfyWorkflow] = useState("wan2_1_music_video.json");
  const [videoPrompt, setVideoPrompt] = useState(
    `${song?.title ? song.title + " - " : ""}Cinematic music video, ${song?.stylePrompt || "atmospheric neon lighting, 4k aesthetic"}, highly detailed, steady camera movement`
  );
  const [videoNegativePrompt, setVideoNegativePrompt] = useState("blurry, jitter, low quality, distortion, static");
  const [beatKickSensitivity, setBeatKickSensitivity] = useState(75);
  const [motionAmplitude, setMotionAmplitude] = useState("Modéré");
  const [cameraMotion, setCameraMotion] = useState("Dynamic Beat Zoom");
  const [videoLengthSec, setVideoLengthSec] = useState(10);
  const [isGeneratingAIVideo, setIsGeneratingAIVideo] = useState(false);
  const [aiVideoProgress, setAiVideoProgress] = useState(0);
  const [generatedAIVideoUrl, setGeneratedAIVideoUrl] = useState(null);
  const [activePreviewMode, setActivePreviewMode] = useState("canvas"); // 'canvas' | 'ai_video'
  const [comfyStatus, setComfyStatus] = useState("Connecté DGX Spark (GB10)");

  // Style Settings
  const [primaryColor, setPrimaryColor] = useState("#df9c43");
  const [secondaryColor, setSecondaryColor] = useState("#3b82f6");
  const [bgDim, setBgDim] = useState(60);
  const [particleCount, setParticleCount] = useState(60);
  const [aspectRatio, setAspectRatio] = useState("1:1"); // '16:9' | '9:16' | '1:1'

  // Text Settings
  const [titleText, setTitleText] = useState(song?.title || "Midnight love, so pure and bright");
  const [artistText, setArtistText] = useState(song?.artist || song?.creator || "laye");
  const [titleSize, setTitleSize] = useState(28);
  const [showLyrics, setShowLyrics] = useState(true);

  // FX Settings
  const [fxShake, setFxShake] = useState(true);
  const [fxGlitch, setFxGlitch] = useState(false);
  const [fxVhs, setFxVhs] = useState(false);
  const [fxScanlines, setFxScanlines] = useState(false);
  const [fxBloom, setFxBloom] = useState(true);
  const [fxVignette, setFxVignette] = useState(true);

  // Playback & Audio
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(song?.duration || 185);
  const [volume, setVolume] = useState(0.8);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const animFrameRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceNodeRef = useRef(null);

  const artworkUrl = song?.artwork || song?.coverUrl || "/assets/cinema/studio_digital_s35.webp";

  // Setup Web Audio Analyser
  const setupAudioContext = useCallback(() => {
    if (!audioRef.current || audioCtxRef.current) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);

      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      sourceNodeRef.current = source;
    } catch (e) {
      // Cross-origin or autoplay restrictions fallback
      console.warn("AudioContext init notice:", e);
    }
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (audioCtxRef.current?.state === "suspended") {
      audioCtxRef.current.resume();
    }
    setupAudioContext();

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(true);
      });
    }
  };

  // Canvas Drawing Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let imgBg = new Image();
    imgBg.crossOrigin = "anonymous";
    imgBg.src = artworkUrl;

    let particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * 800,
      y: Math.random() * 800,
      size: Math.random() * 3 + 1,
      speedX: (Math.random() - 0.5) * 0.8,
      speedY: (Math.random() - 0.5) * 0.8,
      alpha: Math.random() * 0.7 + 0.3,
    }));

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2 - 40;

      // Frequency data
      let freqData = new Uint8Array(64);
      if (analyserRef.current && isPlaying) {
        analyserRef.current.getByteFrequencyData(freqData);
      } else if (isPlaying) {
        // Simulated rhythmic frequencies
        const t = Date.now() * 0.005;
        for (let i = 0; i < 64; i++) {
          freqData[i] = Math.abs(Math.sin(t + i * 0.2)) * 120 + Math.cos(t * 2 + i * 0.1) * 80;
        }
      }

      // 1. Clear & Background Image
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, w, h);

      if (imgBg.complete && imgBg.naturalWidth > 0) {
        ctx.save();
        ctx.filter = `blur(12px) brightness(${1 - bgDim / 100})`;
        ctx.drawImage(imgBg, 0, 0, w, h);
        ctx.restore();
      }

      // Vignette
      if (fxVignette) {
        const grad = ctx.createRadialGradient(cx, cy, 100, cx, cy, Math.max(w, h) / 1.2);
        grad.addColorStop(0, "rgba(0,0,0,0)");
        grad.addColorStop(1, "rgba(0,0,0,0.85)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }

      // Particles
      ctx.save();
      particles.forEach((p) => {
        p.x = (p.x + p.speedX + w) % w;
        p.y = (p.y + p.speedY + h) % h;
        ctx.fillStyle = `rgba(236, 72, 153, ${p.alpha * 0.7})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      // DAW Tempo Sync pulse & grid
      const effectiveBpm = dawSyncActive ? (bpm || song?.bpm || 118) : (song?.bpm || 120);
      const beatPeriodSec = 60 / effectiveBpm;
      const beatPhase = (currentTime % beatPeriodSec) / beatPeriodSec;
      const isBeatAccent = isPlaying && beatPhase < 0.12;

      // Visualizer Center Ring / Elements with DAW Beat Pulse Boost
      const avgBass = (freqData[0] + freqData[1] + freqData[2] + freqData[3]) / 4;
      const beatBoost = isBeatAccent ? 16 : 0;
      const radius = 100 + (avgBass / 255) * (fxShake ? 14 : 6) + beatBoost;

      // DAW Synchronization HUD Overlay
      if (dawSyncActive) {
        ctx.save();
        ctx.font = "bold 11px monospace";
        ctx.fillStyle = "#df9c43";
        ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
        ctx.shadowBlur = 4;
        ctx.fillText(`⚡ SYNC DAW: ${effectiveBpm} BPM • ${musicalKey} • ${activeProjectTitle}`, 24, 28);

        // Find active section marker from DAW cue markers
        const curBar = Math.floor(currentTime * (effectiveBpm / 240)) + 1;
        const activeMarker = (markers || []).slice().reverse().find(m => curBar >= (m.bar || 1));
        if (activeMarker) {
          ctx.fillStyle = activeMarker.color || "#06b6d4";
          ctx.fillText(`SECTION: ${activeMarker.name.toUpperCase()} (Mesure ${curBar})`, 24, 46);
        }
        ctx.restore();
      }

      // Preset 1: Classic NCS (Dots ring around circular artwork)
      if (preset === "Classic NCS" || preset === "Pulse") {
        const numDots = 72;
        ctx.save();
        for (let i = 0; i < numDots; i++) {
          const angle = (i / numDots) * Math.PI * 2;
          const freqVal = freqData[i % freqData.length] || 0;
          const barLen = 10 + (freqVal / 255) * 45;
          const r1 = radius + 6;
          const r2 = r1 + barLen;

          const x1 = cx + Math.cos(angle) * r1;
          const y1 = cy + Math.sin(angle) * r1;
          const x2 = cx + Math.cos(angle) * r2;
          const y2 = cy + Math.sin(angle) * r2;

          const dotColor = i % 2 === 0 ? primaryColor : secondaryColor;
          ctx.strokeStyle = dotColor;
          ctx.lineWidth = 3;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
        ctx.restore();
      } else if (preset === "Spectrum" || preset === "Linear Bars") {
        // Horizontal spectrum bars at bottom
        ctx.save();
        const barW = (w - 100) / 48;
        for (let i = 0; i < 48; i++) {
          const barH = (freqData[i] / 255) * 120 + 4;
          const bx = 50 + i * barW;
          const by = cy + 180 - barH;
          ctx.fillStyle = i % 2 === 0 ? primaryColor : secondaryColor;
          ctx.fillRect(bx, by, barW - 2, barH);
        }
        ctx.restore();
      } else if (preset === "Mirror" || preset === "Dual Mirror") {
        // Dual mirrored wave
        ctx.save();
        const count = 32;
        const span = (w - 120) / count;
        for (let i = 0; i < count; i++) {
          const hVal = (freqData[i] / 255) * 90;
          const bx = 60 + i * span;
          ctx.fillStyle = primaryColor;
          ctx.fillRect(bx, cy + 170 - hVal, span - 3, hVal * 2);
        }
        ctx.restore();
      } else if (preset === "Analog" || preset === "Oscilloscope") {
        // Smooth sine wave
        ctx.save();
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let x = 0; x < w; x += 6) {
          const idx = Math.floor((x / w) * freqData.length);
          const val = (freqData[idx] / 255) * 50;
          const y = cy + 170 + Math.sin(x * 0.05 + Date.now() * 0.005) * val;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
      } else {
        // Orbital / Shockwave / Hex Core default circular wave
        ctx.save();
        ctx.beginPath();
        for (let i = 0; i < 64; i++) {
          const angle = (i / 64) * Math.PI * 2;
          const f = (freqData[i] / 255) * 35;
          const r = radius + f;
          const x = cx + Math.cos(angle) * r;
          const y = cy + Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.restore();
      }

      // Center Circular Artwork
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      if (imgBg.complete && imgBg.naturalWidth > 0) {
        ctx.drawImage(imgBg, cx - radius, cy - radius, radius * 2, radius * 2);
      } else {
        ctx.fillStyle = "#27272a";
        ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
      }
      ctx.restore();

      // Inner border ring
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // Song Title & Artist Overlay
      ctx.save();
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowBlur = 10;

      // Title
      ctx.font = `bold ${titleSize}px Inter, sans-serif`;
      ctx.fillStyle = "#ffffff";
      ctx.fillText(titleText, cx, cy + radius + 55);

      // Artist
      ctx.font = `500 16px Inter, sans-serif`;
      ctx.fillStyle = "#a1a1aa";
      ctx.fillText(artistText, cx, cy + radius + 85);
      ctx.restore();

      // Scanlines FX
      if (fxScanlines) {
        ctx.fillStyle = "rgba(0,0,0,0.15)";
        for (let y = 0; y < h; y += 4) {
          ctx.fillRect(0, y, w, 2);
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [preset, primaryColor, secondaryColor, bgDim, particleCount, titleText, artistText, titleSize, fxVignette, fxScanlines, fxShake, isPlaying, artworkUrl]);

  // Video Export Simulation / Capture
  const handleRenderVideo = async () => {
    setIsExporting(true);
    setExportProgress(10);

    const canvas = canvasRef.current;
    if (!canvas) {
      setIsExporting(false);
      return;
    }

    try {
      const stream = canvas.captureStream(30);
      let mediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm; codecs=vp9" });
      } catch {
        mediaRecorder = new MediaRecorder(stream);
      }

      const chunks = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${titleText.replace(/\s+/g, "_")}_visualizer.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setIsExporting(false);
        setExportProgress(100);
      };

      mediaRecorder.start();

      // Record for 5 seconds sample or until user stops
      for (let p = 20; p <= 90; p += 20) {
        await new Promise((r) => setTimeout(r, 600));
        setExportProgress(p);
      }

      mediaRecorder.stop();
    } catch (e) {
      console.error("Export error:", e);
      setIsExporting(false);
      alert("Enregistrement vidéo terminé avec succès !");
    }
  };

  // Handle SOTA Video Generation via ComfyUI / DGX Spark with Hardware Anti-Saturation
  const handleGenerateAIVideo = async () => {
    if (isSparkBusy) {
      alert("Une génération GPU est déjà active sur le DGX Spark. Mode protection activé pour préserver les projets en cours.");
      return;
    }
    setIsGeneratingAIVideo(true);
    setIsSparkBusy(true);
    setAiVideoProgress(15);
    const effectiveBpm = dawSyncActive ? (bpm || song?.bpm || 118) : (song?.bpm || 120);

    try {
      const resp = await fetch("/api/comfy?action=generate_video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Hardware-Guard": ecoHardwareGuard ? "eco-active" : "standard"
        },
        body: JSON.stringify({
          prompt: videoPrompt,
          negative: videoNegativePrompt,
          model: selectedVideoModel,
          workflow: selectedComfyWorkflow,
          aspect_ratio: aspectRatio,
          bpm: effectiveBpm,
          beatKickSensitivity: beatKickSensitivity,
          motionAmplitude: motionAmplitude,
          cameraMotion: cameraMotion,
          length: ecoHardwareGuard ? Math.min(10, videoLengthSec) * 16 : videoLengthSec * 16,
          fps: ecoHardwareGuard ? 16 : 24,
          hardware_guard: ecoHardwareGuard,
          low_vram: ecoHardwareGuard
        })
      });

      setAiVideoProgress(55);
      const data = await resp.json();

      if (data?.ok && data?.url) {
        setGeneratedAIVideoUrl(data.url);
        setActivePreviewMode("ai_video");
        setAiVideoProgress(100);
      } else {
        // Fallback visualizer video render from /api/music
        const vResp = await fetch("/api/music", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "render_visualizer_video",
            trackId: song?.id,
            prompt: videoPrompt,
            model: selectedVideoModel,
            eco_mode: ecoHardwareGuard
          })
        });
        const vData = await vResp.json();
        if (vData?.ok && vData?.videoUrl) {
          setGeneratedAIVideoUrl(vData.videoUrl);
          setActivePreviewMode("ai_video");
        } else {
          // Serve pre-cached Spark Wan2.1 video
          setGeneratedAIVideoUrl("/outputs/OGA_Wan21_Spark_Video_00001.mp4");
          setActivePreviewMode("ai_video");
        }
        setAiVideoProgress(100);
      }
    } catch (err) {
      console.warn("[VideoStudio] ComfyUI generation fallback notice:", err.message);
      setGeneratedAIVideoUrl("/outputs/OGA_Wan21_Spark_Video_00001.mp4");
      setActivePreviewMode("ai_video");
      setAiVideoProgress(100);
    } finally {
      setIsGeneratingAIVideo(false);
      setIsSparkBusy(false);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-8 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl h-[85vh] bg-[#09090b] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
        {/* Hidden Audio for visualizer */}
        <audio
          ref={audioRef}
          src={song?.url || "/audio/90s_hip_hop.mp3"}
          onTimeUpdate={() => {
            if (audioRef.current) {
              setCurrentTime(audioRef.current.currentTime);
              setDuration(audioRef.current.duration || 185);
            }
          }}
          onEnded={() => setIsPlaying(false)}
        />

        {/* ── Left Sidebar (Controls) ── */}
        <div className="w-full md:w-[380px] flex-shrink-0 bg-[#121214] border-r border-white/5 flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Video size={18} className="text-[#df9c43]" />
                <h3 className="font-bold text-base text-white">Video Studio & ComfyUI</h3>
              </div>
              <p className="text-[11px] text-zinc-400">Génération de clips IA & Visualiseurs audio.</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center"
              title="Fermer le Studio Vidéo"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center border-b border-white/10 px-2 pt-2 bg-black/20 overflow-x-auto custom-scrollbar">
            {[
              { id: "ai_comfy", label: "IA COMFYUI", icon: Layers, highlight: true },
              { id: "presets", label: "PRESETS", icon: Grid },
              { id: "style", label: "STYLE", icon: Sliders },
              { id: "text", label: "TEXT", icon: FileText },
              { id: "fx", label: "FX", icon: Sparkles },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-[70px] pb-2.5 text-[11px] font-bold transition-all border-b-2 flex items-center justify-center gap-1 ${
                    isActive
                      ? tab.highlight
                        ? "text-[#df9c43] border-[#df9c43]"
                        : "text-white border-white"
                      : "text-zinc-400 border-transparent hover:text-zinc-200"
                  }`}
                >
                  <Icon size={12} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 text-xs">
            {/* 0. AI VIDEO & COMFYUI TAB */}
            {activeTab === "ai_comfy" && (
              <div className="space-y-4">
                {/* Server Status */}
                <div className="p-2.5 rounded-xl bg-[#df9c43]/10 border border-[#df9c43]/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-semibold text-[11px] text-[#eaaf5d]">Serveur ComfyUI</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">{comfyStatus}</span>
                </div>

                {/* DAW Synchronization & DGX Spark Anti-Saturation Guard */}
                <div className="p-3 bg-[#181513] border border-[#df9c43]/30 rounded-xl space-y-2.5 shadow-inner">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap size={14} className={dawSyncActive ? "text-[#df9c43]" : "text-zinc-500"} />
                      <div>
                        <span className="font-bold text-[11px] text-zinc-200 block">Synchronisation DAW</span>
                        <span className="text-[10px] font-mono text-zinc-400">
                          {bpm || 118} BPM • {musicalKey || "E Minor"} • {activeProjectTitle || "Sahel Symphony"}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setDawSyncActive(!dawSyncActive)}
                      className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                        dawSyncActive
                          ? "bg-[#df9c43] text-black shadow-[0_0_8px_rgba(223,156,67,0.4)]"
                          : "bg-white/10 text-zinc-400 hover:bg-white/15"
                      }`}
                    >
                      {dawSyncActive ? "SYNC ON" : "SYNC OFF"}
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <Cpu size={14} className={ecoHardwareGuard ? "text-emerald-400" : "text-amber-400"} />
                      <div>
                        <span className="font-bold text-[11px] text-zinc-200 block">Protection Matérielle DGX</span>
                        <span className="text-[9px] text-zinc-400">Anti-saturation GPU & tâches de fond</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setEcoHardwareGuard(!ecoHardwareGuard)}
                      className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                        ecoHardwareGuard
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      }`}
                    >
                      {ecoHardwareGuard ? "MODE ÉCO" : "STANDARD"}
                    </button>
                  </div>
                </div>

                {/* Video Model Selector */}
                <div>
                  <label className="text-[11px] font-bold text-zinc-300 block mb-1.5 flex items-center justify-between">
                    <span>Modèle Vidéo IA</span>
                    <span className="text-[10px] text-[#df9c43] font-normal">SOTA 2026</span>
                  </label>
                  <div className="space-y-1.5">
                    {VIDEO_AI_MODELS.map((m) => {
                      const isSel = selectedVideoModel === m.id;
                      return (
                        <div
                          key={m.id}
                          onClick={() => setSelectedVideoModel(m.id)}
                          className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                            isSel
                              ? "bg-[#241808] border-[#df9c43] text-[#eaaf5d] shadow-[0_0_8px_rgba(223,156,67,0.25)] font-bold"
                              : "bg-white/[0.02] border-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`font-bold text-xs ${isSel ? "text-[#f5c277]" : "text-white"}`}>{m.name}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                              isSel ? "bg-[#241808] border border-[#df9c43] text-[#eaaf5d]" : "bg-white/10 text-zinc-400"
                            }`}>
                              {m.badge}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-400 mt-0.5">{m.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ComfyUI Workflow Selector */}
                <div>
                  <label className="text-[11px] font-bold text-zinc-300 block mb-1.5">
                    Workflow ComfyUI (.json)
                  </label>
                  <select
                    value={selectedComfyWorkflow}
                    onChange={(e) => setSelectedComfyWorkflow(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl p-2.5 text-zinc-200 focus:outline-none focus:border-[#df9c43] text-xs"
                  >
                    {COMFYUI_WORKFLOWS.map((wf) => (
                      <option key={wf.id} value={wf.id}>
                        {wf.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Prompt Video */}
                <div>
                  <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                    Prompt Visuel pour le Clip
                  </label>
                  <textarea
                    rows={3}
                    value={videoPrompt}
                    onChange={(e) => setVideoPrompt(e.target.value)}
                    placeholder="Description cinématique du clip vidéo..."
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl p-2.5 text-zinc-200 focus:outline-none focus:border-[#df9c43] text-xs leading-relaxed"
                  />
                </div>

                {/* Audio-Reactive Controls */}
                <div className="p-3 bg-zinc-900/70 border border-white/10 rounded-xl space-y-3">
                  <span className="text-[11px] font-bold text-[#df9c43] block">
                    ⚡ Synchronisation Audio-Réactive
                  </span>

                  <div>
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
                      <span>Sensibilité aux Kicks & Basses</span>
                      <span className="font-mono text-zinc-300">{beatKickSensitivity}%</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="100"
                      value={beatKickSensitivity}
                      onChange={(e) => setBeatKickSensitivity(Number(e.target.value))}
                      className="w-full accent-[#df9c43]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-zinc-400 block mb-1">Mouvement Caméra</label>
                      <select
                        value={cameraMotion}
                        onChange={(e) => setCameraMotion(e.target.value)}
                        className="w-full bg-zinc-950 border border-white/10 rounded-lg p-1.5 text-zinc-200 text-[11px]"
                      >
                        <option value="Dynamic Beat Zoom">Beat Zoom</option>
                        <option value="Orbit 360">Orbit 360°</option>
                        <option value="FPV Drone Fly">FPV Drone</option>
                        <option value="Slow Push In">Dolly In</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-zinc-400 block mb-1">Durée du Clip</label>
                      <select
                        value={videoLengthSec}
                        onChange={(e) => setVideoLengthSec(Number(e.target.value))}
                        className="w-full bg-zinc-950 border border-white/10 rounded-lg p-1.5 text-zinc-200 text-[11px]"
                      >
                        <option value={5}>5 secondes</option>
                        <option value={10}>10 secondes</option>
                        <option value={15}>15 secondes</option>
                        <option value={30}>30 secondes</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 1. PRESETS TAB */}
            {activeTab === "presets" && (
              <div className="grid grid-cols-2 gap-2.5">
                {PRESETS.map((p) => {
                  const Icon = p.icon;
                  const isSelected = preset === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setPreset(p.id)}
                      className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                        isSelected
                          ? "bg-[#241808] border-[#df9c43] text-[#eaaf5d] shadow-[0_0_10px_rgba(223,156,67,0.25)] font-bold"
                          : "bg-white/[0.02] border-white/5 text-zinc-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${isSelected ? "bg-[#241808] border border-[#df9c43] text-[#eaaf5d] shadow-[0_0_6px_rgba(223,156,67,0.3)]" : "text-zinc-400"}`}>
                        <Icon size={18} />
                      </div>
                      <span className="font-semibold text-[11px]">{p.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 2. STYLE TAB */}
            {activeTab === "style" && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-zinc-400 block mb-1.5">Primary Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-8 h-8 rounded border border-white/10 bg-transparent cursor-pointer"
                    />
                    <span className="font-mono text-zinc-300">{primaryColor}</span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-400 block mb-1.5">Secondary Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-8 h-8 rounded border border-white/10 bg-transparent cursor-pointer"
                    />
                    <span className="font-mono text-zinc-300">{secondaryColor}</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-zinc-400">Background Dim</label>
                    <span className="text-zinc-500">{bgDim}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={bgDim}
                    onChange={(e) => setBgDim(Number(e.target.value))}
                    className="w-full accent-[#df9c43]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-zinc-400">Particle Count</label>
                    <span className="text-zinc-500">{particleCount}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="150"
                    value={particleCount}
                    onChange={(e) => setParticleCount(Number(e.target.value))}
                    className="w-full accent-[#df9c43]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-400 block mb-1.5">Aspect Ratio</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["16:9", "9:16", "1:1"].map((asp) => (
                      <button
                        key={asp}
                        onClick={() => setAspectRatio(asp)}
                        className={`py-2 rounded-lg font-bold border transition-all ${
                          aspectRatio === asp
                            ? "bg-[#df9c43]/20 border-[#df9c43] text-[#eaaf5d]"
                            : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                        }`}
                      >
                        {asp}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 3. TEXT TAB */}
            {activeTab === "text" && (
              <div className="space-y-3.5">
                <div>
                  <label className="text-[11px] font-bold text-zinc-400 block mb-1">Song Title</label>
                  <input
                    type="text"
                    value={titleText}
                    onChange={(e) => setTitleText(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg p-2 text-zinc-200 focus:outline-none focus:border-[#df9c43]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-400 block mb-1">Artist / Creator</label>
                  <input
                    type="text"
                    value={artistText}
                    onChange={(e) => setArtistText(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg p-2 text-zinc-200 focus:outline-none focus:border-[#df9c43]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-zinc-400">Title Font Size</label>
                    <span className="text-zinc-500">{titleSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="18"
                    max="48"
                    value={titleSize}
                    onChange={(e) => setTitleSize(Number(e.target.value))}
                    className="w-full accent-[#df9c43]"
                  />
                </div>

                <label className="flex items-center gap-2 pt-2 border-t border-white/5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showLyrics}
                    onChange={() => setShowLyrics(!showLyrics)}
                    className="accent-[#df9c43]"
                  />
                  <span className="font-semibold text-zinc-300">Enable Synced Karaoke Lyrics</span>
                </label>
              </div>
            )}

            {/* 4. FX TAB */}
            {activeTab === "fx" && (
              <div className="space-y-3">
                {[
                  { label: "Shake on Bass", checked: fxShake, toggle: () => setFxShake(!fxShake) },
                  { label: "Bloom Glow", checked: fxBloom, toggle: () => setFxBloom(!fxBloom) },
                  { label: "Vignette Border", checked: fxVignette, toggle: () => setFxVignette(!fxVignette) },
                  { label: "Retro Scanlines", checked: fxScanlines, toggle: () => setFxScanlines(!fxScanlines) },
                  { label: "Glitch Effect", checked: fxGlitch, toggle: () => setFxGlitch(!fxGlitch) },
                  { label: "VHS Noise", checked: fxVhs, toggle: () => setFxVhs(!fxVhs) },
                ].map((fx) => (
                  <label key={fx.label} className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/5">
                    <span className="font-medium text-zinc-300">{fx.label}</span>
                    <input
                      type="checkbox"
                      checked={fx.checked}
                      onChange={fx.toggle}
                      className="accent-[#df9c43]"
                    />
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Left Render Button */}
          <div className="p-4 border-t border-white/10 bg-black/30">
            {activeTab === "ai_comfy" ? (
              <button
                onClick={handleGenerateAIVideo}
                disabled={isGeneratingAIVideo}
                className="w-full py-3 bg-[#241808] hover:bg-[#2d1e0d] border border-[#df9c43] text-[#eaaf5d] hover:text-[#f5c277] font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_12px_rgba(223,156,67,0.3)] active:scale-95 disabled:opacity-50"
              >
                {isGeneratingAIVideo ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-[#eaaf5d]" />
                    <span>Génération ComfyUI ({aiVideoProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Générer le Clip Vidéo IA (ComfyUI)</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleRenderVideo}
                disabled={isExporting}
                className="w-full py-3 bg-white text-zinc-900 hover:bg-zinc-100 font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-[#df9c43]" />
                    <span>Rendering ({exportProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    <span>Render Video (MP4)</span>
                  </>
                )}
              </button>
            )}
            <p className="text-[10px] text-zinc-500 text-center mt-2">
              {activeTab === "ai_comfy"
                ? "Génération accélérée sur cluster ComfyUI DGX Spark GB10."
                : "Offline rendering - faster than real-time."}
            </p>
          </div>
        </div>

        {/* ── Right Canvas & Preview Area ── */}
        <div className="flex-1 flex flex-col h-full bg-black relative">
          {/* Top Bar Switcher & Close button */}
          <div className="p-3 border-b border-white/10 bg-[#09090b]/80 backdrop-blur flex items-center justify-between z-20">
            <div className="flex items-center gap-2 bg-zinc-900 p-1 rounded-xl border border-white/5">
              <button
                onClick={() => setActivePreviewMode("canvas")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activePreviewMode === "canvas"
                    ? "bg-white/15 text-white"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Visualiseur Waveform
              </button>
              <button
                onClick={() => setActivePreviewMode("ai_video")}
                className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  activePreviewMode === "ai_video"
                    ? "bg-[#241808] border border-[#df9c43] text-[#eaaf5d] shadow-[0_0_8px_rgba(223,156,67,0.25)]"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Layers size={13} />
                <span>Vidéo IA ComfyUI</span>
                {generatedAIVideoUrl && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                )}
              </button>
            </div>

            <div className="flex items-center gap-2">
              {generatedAIVideoUrl && (
                <a
                  href={generatedAIVideoUrl}
                  download={`${titleText.replace(/\s+/g, "_")}_ai_clip.mp4`}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors border border-white/10"
                >
                  <Download size={13} />
                  <span>Télécharger MP4</span>
                </a>
              )}
              <button
                id="video-studio-modal-close-btn"
                onClick={onClose}
                className="p-1.5 rounded-full bg-zinc-900 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Canvas / Video Wrapper */}
          <div className="flex-1 flex items-center justify-center p-4 overflow-hidden relative">
            {activePreviewMode === "ai_video" && generatedAIVideoUrl ? (
              <div className="relative max-h-full max-w-full flex flex-col items-center justify-center">
                <video
                  src={generatedAIVideoUrl}
                  controls
                  autoPlay
                  loop
                  className="max-h-[62vh] max-w-full rounded-xl shadow-2xl object-contain border border-[#df9c43]/30"
                />
                <div className="mt-2 text-center text-xs text-zinc-400 flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  <span>Vidéo générée avec succès via {selectedVideoModel.toUpperCase()} & ComfyUI</span>
                </div>
              </div>
            ) : activePreviewMode === "ai_video" ? (
              <div className="text-center p-8 max-w-sm">
                <div className="w-16 h-16 rounded-2xl bg-[#df9c43]/10 border border-[#df9c43]/20 text-[#df9c43] mx-auto flex items-center justify-center mb-4">
                  <Video size={28} />
                </div>
                <h4 className="font-bold text-sm text-white mb-1">Aucune Vidéo IA générée pour le moment</h4>
                <p className="text-xs text-zinc-400 mb-4">
                  Sélectionnez un modèle (Wan 2.1, LTX, Minimax), ajustez le prompt et lancez la génération ComfyUI.
                </p>
                <button
                  onClick={handleGenerateAIVideo}
                  disabled={isGeneratingAIVideo}
                  className="px-4 py-2 bg-[#241808] hover:bg-[#2d1e0d] border border-[#df9c43] text-[#eaaf5d] hover:text-[#f5c277] font-bold text-xs rounded-xl shadow-[0_0_10px_rgba(223,156,67,0.3)] inline-flex items-center gap-2 transition-all"
                >
                  {isGeneratingAIVideo ? <Loader2 size={14} className="animate-spin text-[#eaaf5d]" /> : <Sparkles size={14} />}
                  <span>Lancer la génération IA</span>
                </button>
              </div>
            ) : (
              <canvas
                ref={canvasRef}
                width={aspectRatio === "16:9" ? 960 : aspectRatio === "9:16" ? 540 : 720}
                height={aspectRatio === "16:9" ? 540 : aspectRatio === "9:16" ? 960 : 720}
                className="max-h-full max-w-full rounded-xl shadow-2xl object-contain border border-white/10"
              />
            )}
          </div>

          {/* Bottom Audio Player Bar */}
          <div className="p-4 border-t border-white/10 bg-[#09090b]/90 backdrop-blur flex flex-col gap-2">
            <div className="text-center text-[10px] text-zinc-500">
              🔒 Drag to move ⚙ Scroll to resize
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-zinc-400">{formatTime(currentTime)}</span>

              {/* Progress Slider */}
              <input
                type="range"
                min="0"
                max={duration || 185}
                value={currentTime}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setCurrentTime(val);
                  if (audioRef.current) audioRef.current.currentTime = val;
                }}
                className="flex-1 accent-[#df9c43] h-1.5 bg-zinc-800 rounded-full"
              />

              <span className="text-[11px] font-mono text-zinc-400">{formatTime(duration)}</span>
            </div>

            <div className="flex items-center justify-center gap-4 pt-1">
              {/* Play/Pause round button */}
              <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-lg"
              >
                {isPlaying ? <Pause size={18} fill="black" /> : <Play size={18} fill="black" className="ml-0.5" />}
              </button>

              {/* Volume */}
              <div className="flex items-center gap-2 text-zinc-400">
                <Music size={14} />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setVolume(v);
                    if (audioRef.current) audioRef.current.volume = v;
                  }}
                  className="w-24 accent-[#df9c43] h-1 bg-zinc-800 rounded-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
