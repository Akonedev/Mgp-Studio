import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Wand2,
  Sliders,
  Scissors,
  Layers,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Music,
  Disc,
  Split,
  ChevronDown,
  Sparkles,
  Zap,
  Radio,
  Clock,
  Maximize2
} from "lucide-react";

/**
 * 6 Modes d'Étirement Audio (Audio Warp Modes - Chapitre 9 & 10)
 */
export const AUDIO_WARP_MODES = [
  {
    id: "stretch",
    name: "Stretch",
    badge: "Polyphonique",
    desc: "Étirement granulaire avec préservation de formants, idéal pour instruments mélodiques et voix."
  },
  {
    id: "stretch_hd",
    name: "Stretch HD",
    badge: "Haute Résolution",
    desc: "Algorithme spectral haute fidélité pour matériel complexe, bus et mixes complets."
  },
  {
    id: "slice",
    name: "Slice",
    badge: "Transitoires",
    desc: "Découpage automatique aux transitoires avec lecture échantillonnée sans altération de phase."
  },
  {
    id: "repitch",
    name: "Repitch",
    badge: "Bande Analogique",
    desc: "Variation de vitesse classique type bande magnétique / vinyle (plus rapide = plus aigu, 0 artefact)."
  },
  {
    id: "raw",
    name: "Raw (Natif)",
    badge: "Non Étiré",
    desc: "Lecture au tempo original du fichier sans aucun traitement temporel, synchronisé sur l'horloge native."
  },
  {
    id: "cycle",
    name: "Cycle",
    badge: "Wavetable",
    desc: "Granulation par micro-cycles de forme d'onde, produisant des textures harmoniques riches."
  }
];

/**
 * Détection mathématique réelle des transitoires d'énergie
 * @param {number[]} peaks - Tableau des amplitudes de crêtes normalisées [0..1]
 * @param {number} sensitivity - Seuil de sensibilité [0..100]
 * @returns {number[]} Tableau des positions temporelles relatives [0..1]
 */
export function detectAudioTransients(peaks, sensitivity = 60) {
  if (!peaks || peaks.length < 4) return [0, 0.25, 0.5, 0.75];
  const threshold = (100 - sensitivity) / 100 * 0.4 + 0.08;
  const transients = [0]; // Toujours inclure le début

  for (let i = 1; i < peaks.length - 1; i++) {
    const diff = peaks[i] - peaks[i - 1];
    // Détection de montée brusque d'amplitude au-dessus du seuil et sommet local
    if (diff > threshold && peaks[i] >= peaks[i + 1]) {
      const pos = i / (peaks.length - 1);
      // Éviter les transitoires trop rapprochés (< 4% du fichier)
      if (pos - transients[transients.length - 1] > 0.04) {
        transients.push(Number(pos.toFixed(4)));
      }
    }
  }

  // Si trop peu de transitoires détectés, grille musicale régulière de secours
  if (transients.length < 3) {
    return [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875];
  }

  return transients;
}

/**
 * Composant MusicStudioAudioWarp : Moteur d'Audio Stretching, Détection de Transitoires & Warp Markers
 */
export default function MusicStudioAudioWarp({
  clip,
  track,
  projectBpm = 120,
  onUpdateClip,
  onBounceInPlace,
  onSliceToDrumMachine,
  onClose
}) {
  // ── Paramètres d'étirement audio ──
  const [warpMode, setWarpMode] = useState(clip?.warpMode || "stretch");
  const [pitchSemitones, setPitchSemitones] = useState(clip?.pitchSemitones || 0);
  const [fineCents, setFineCents] = useState(clip?.fineCents || 0);
  const [preserveFormants, setPreserveFormants] = useState(clip?.preserveFormants ?? true);
  const [formantShift, setFormantShift] = useState(clip?.formantShift || 0);
  const [grainSizeMs, setGrainSizeMs] = useState(clip?.grainSizeMs || 45);
  const [originalBpm, setOriginalBpm] = useState(clip?.originalBpm || 120);
  const [transientSensitivity, setTransientSensitivity] = useState(65);

  // ── Marqueurs de transitoires & Warp ──
  const rawPeaks = useMemo(() => {
    // Crêtes réelles ou par défaut
    return clip?.peaks || [
      1.0, 0.95, 0.8, 0.4, 0.2, 0.05, 0.02, 0.0, 0.1, 0.08, 0.0, 0.0, 0.9, 0.7, 0.3,
      0.1, 0.4, 0.3, 0.2, 0.05, 0.5, 0.4, 0.2, 0.05, 0.02, 0.0, 0.95, 0.6, 0.4, 0.4,
      0.15, 0.3, 0.5, 0.25, 0.05, 1.0, 0.9, 0.6, 0.35, 0.5, 0.4, 0.2, 0.05, 0.02, 0.85,
      0.2, 0.05, 0.01, 0.0, 0.0
    ];
  }, [clip]);

  // Transitoires détectés automatiquement
  const detectedTransients = useMemo(() => {
    return detectAudioTransients(rawPeaks, transientSensitivity);
  }, [rawPeaks, transientSensitivity]);

  // Marqueurs Warp actifs (promus depuis transitoires ou ajoutés par l'utilisateur)
  const [warpMarkers, setWarpMarkers] = useState(() => {
    if (clip?.warpMarkers && clip.warpMarkers.length > 0) {
      return clip.warpMarkers;
    }
    // Par défaut : 4 marqueurs calés sur les premiers transitoires
    return [
      { id: "wm_0", timeNorm: 0.0, warpedNorm: 0.0, isPinned: true },
      { id: "wm_1", timeNorm: 0.25, warpedNorm: 0.25, isPinned: true },
      { id: "wm_2", timeNorm: 0.5, warpedNorm: 0.5, isPinned: true },
      { id: "wm_3", timeNorm: 0.75, warpedNorm: 0.75, isPinned: true },
      { id: "wm_4", timeNorm: 1.0, warpedNorm: 1.0, isPinned: true }
    ];
  });

  const [selectedMarkerId, setSelectedMarkerId] = useState(null);
  const [isDraggingMarker, setIsDraggingMarker] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [playbackHeadPos, setPlaybackHeadPos] = useState(0);

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const audioContextRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Ratio d'étirement calculé
  const stretchRatio = useMemo(() => {
    if (originalBpm <= 0) return 1.0;
    return Number((projectBpm / originalBpm).toFixed(2));
  }, [projectBpm, originalBpm]);

  // Synchronisation avec les modifications du clip parent
  const handleApplyToClip = useCallback(() => {
    if (onUpdateClip && clip?.id) {
      onUpdateClip(clip.id, {
        warpMode,
        pitchSemitones,
        fineCents,
        preserveFormants,
        formantShift,
        grainSizeMs,
        originalBpm,
        stretchRatio,
        warpMarkers
      });
    }
  }, [
    onUpdateClip,
    clip,
    warpMode,
    pitchSemitones,
    fineCents,
    preserveFormants,
    formantShift,
    grainSizeMs,
    originalBpm,
    stretchRatio,
    warpMarkers
  ]);

  useEffect(() => {
    handleApplyToClip();
  }, [
    warpMode,
    pitchSemitones,
    fineCents,
    preserveFormants,
    formantShift,
    grainSizeMs,
    originalBpm,
    handleApplyToClip
  ]);

  // ── Synthèse Web Audio DSP pour pré-écoute en temps réel ──
  const startAudioPreview = () => {
    if (isPlayingPreview) {
      setIsPlayingPreview(false);
      cancelAnimationFrame(animationFrameRef.current);
      setPlaybackHeadPos(0);
      return;
    }

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = audioContextRef.current || new AudioCtx();
      audioContextRef.current = ctx;
      if (ctx.state === "suspended") ctx.resume();

      // Fréquence calculée selon transposition (st + cents)
      const baseFreq = 220; // A3
      const totalSemitones = pitchSemitones + fineCents / 100;
      const freq = baseFreq * Math.pow(2, totalSemitones / 12);

      // Osc synthétique représentatif du clip étiré
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (warpMode === "repitch") {
        // En mode repitch, la vitesse modifie directement la hauteur
        osc.frequency.setValueAtTime(freq * stretchRatio, ctx.currentTime);
      } else {
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
      }

      osc.type = warpMode === "cycle" ? "sawtooth" : "triangle";
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 2.5);

      setIsPlayingPreview(true);
      const startTime = performance.now();
      const durationMs = (2500 / stretchRatio);

      const updatePlayhead = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(1.0, elapsed / durationMs);
        setPlaybackHeadPos(progress);

        if (progress < 1.0) {
          animationFrameRef.current = requestAnimationFrame(updatePlayhead);
        } else {
          setIsPlayingPreview(false);
          setPlaybackHeadPos(0);
        }
      };

      animationFrameRef.current = requestAnimationFrame(updatePlayhead);
    } catch (err) {
      console.warn("Audio preview error:", err);
      setIsPlayingPreview(false);
    }
  };

  // ── Dragging des Marqueurs Warp ──
  const handleMarkerMouseDown = (e, markerId) => {
    e.stopPropagation();
    setSelectedMarkerId(markerId);
    setIsDraggingMarker(true);
  };

  const handleContainerMouseMove = (e) => {
    if (!isDraggingMarker || !selectedMarkerId || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX;
    const rawPos = (clientX - rect.left) / rect.width;
    const clampedPos = Math.max(0.01, Math.min(0.99, rawPos));

    setWarpMarkers((prev) =>
      prev.map((m) =>
        m.id === selectedMarkerId ? { ...m, warpedNorm: Number(clampedPos.toFixed(4)) } : m
      )
    );
  };

  const handleContainerMouseUp = () => {
    setIsDraggingMarker(false);
  };

  // Double clic pour ajouter un marqueur Warp sur un transitoire
  const handleContainerDoubleClick = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const clamped = Math.max(0.02, Math.min(0.98, pos));

    const newMarker = {
      id: `wm_${Date.now()}`,
      timeNorm: Number(clamped.toFixed(4)),
      warpedNorm: Number(clamped.toFixed(4)),
      isPinned: true
    };

    setWarpMarkers((prev) => [...prev, newMarker].sort((a, b) => a.warpedNorm - b.warpedNorm));
  };

  // Promouvoir tous les transitoires détectés en marqueurs Warp
  const handlePromoteAllTransients = () => {
    const promoted = detectedTransients.map((t, idx) => ({
      id: `wm_trans_${idx}_${Math.round(t * 1000)}`,
      timeNorm: t,
      warpedNorm: t,
      isPinned: true
    }));
    setWarpMarkers(promoted);
  };

  // Réinitialiser les marqueurs
  const handleResetWarpMarkers = () => {
    setWarpMarkers([
      { id: "wm_0", timeNorm: 0.0, warpedNorm: 0.0, isPinned: true },
      { id: "wm_1", timeNorm: 0.25, warpedNorm: 0.25, isPinned: true },
      { id: "wm_2", timeNorm: 0.5, warpedNorm: 0.5, isPinned: true },
      { id: "wm_3", timeNorm: 0.75, warpedNorm: 0.75, isPinned: true },
      { id: "wm_4", timeNorm: 1.0, warpedNorm: 1.0, isPinned: true }
    ]);
    setPitchSemitones(0);
    setFineCents(0);
  };

  // Rendu visuel de la forme d'onde étirée
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Fond avec quadrillage temps/mesures
    ctx.fillStyle = "#111111";
    ctx.fillRect(0, 0, width, height);

    // Lignes de mesure (4 temps par défaut)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
    ctx.lineWidth = 1;
    for (let b = 1; b <= 4; b++) {
      const x = (b / 4) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Axe central 0 dB
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Rendu forme d'onde étirée
    const peaks = rawPeaks;
    const n = peaks.length;
    const midY = height / 2;
    const maxAmp = midY * 0.88;

    // Dégradé cyan/orange
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    if (warpMode === "repitch") {
      grad.addColorStop(0, "rgba(234, 88, 12, 0.85)");
      grad.addColorStop(0.5, "rgba(249, 115, 22, 0.4)");
      grad.addColorStop(1, "rgba(234, 88, 12, 0.85)");
    } else {
      grad.addColorStop(0, "rgba(56, 189, 248, 0.85)");
      grad.addColorStop(0.5, "rgba(14, 165, 233, 0.4)");
      grad.addColorStop(1, "rgba(56, 189, 248, 0.85)");
    }

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, midY);

    // Moitié supérieure
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * width;
      const amp = (peaks[i] || 0) * maxAmp;
      ctx.lineTo(x, midY - amp);
    }

    // Moitié inférieure
    for (let i = n - 1; i >= 0; i--) {
      const x = (i / (n - 1)) * width;
      const amp = (peaks[i] || 0) * maxAmp;
      ctx.lineTo(x, midY + amp);
    }
    ctx.closePath();
    ctx.fill();

    // Ligne de crête blanche fine
    ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * width;
      const amp = (peaks[i] || 0) * maxAmp;
      if (i === 0) ctx.moveTo(x, midY - amp);
      else ctx.lineTo(x, midY - amp);
    }
    ctx.stroke();

    // Ligne de lecture
    if (playbackHeadPos > 0) {
      const px = playbackHeadPos * width;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, height);
      ctx.stroke();
    }
  }, [rawPeaks, warpMode, playbackHeadPos]);

  return (
    <div
      data-testid="music-studio-audio-warp"
      className="bg-[#141414] border border-[#2b2b2b] rounded-xl flex flex-col overflow-hidden text-xs text-zinc-300 font-sans shadow-2xl select-none"
    >
      {/* ── 1. Header Toolbar ── */}
      <div className="h-10 bg-[#181818] border-b border-[#292929] px-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-bold text-white text-[11px] tracking-wide">
            <Radio size={14} className="text-[#df9c43] animate-pulse" />
            <span>MOTEUR AUDIO WARP & STRETCHING</span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-cyan-950/70 border border-cyan-800/60 text-cyan-300 text-[10px] font-mono">
            Ratio {stretchRatio}x ({projectBpm} BPM)
          </span>
          <span className="text-[10px] text-zinc-400 font-mono">
            {clip?.name || "Audio Clip"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Action: Slice to Drum Machine */}
          <button
            onClick={() => onSliceToDrumMachine && onSliceToDrumMachine(clip?.id, track?.id)}
            className="px-2.5 py-1 rounded bg-[#202020] hover:bg-emerald-950/60 hover:text-emerald-300 hover:border-emerald-700/60 text-zinc-300 border border-[#333333] text-[10px] font-bold flex items-center gap-1.5 transition shadow-sm"
            title="Découper aux transitoires et créer une Drum Machine avec pads"
          >
            <Scissors size={12} className="text-emerald-400" />
            <span>Découper en Drum Machine</span>
          </button>

          {/* Action: Bounce in Place */}
          <button
            onClick={() => onBounceInPlace && onBounceInPlace(clip?.id, track?.id)}
            className="px-2.5 py-1 rounded bg-[#241808] hover:bg-[#2d1e0d] border border-[#df9c43] text-[#eaaf5d] hover:text-[#f5c277] text-[10px] font-bold flex items-center gap-1.5 transition shadow-[0_0_8px_rgba(223,156,67,0.25)]"
            title="Rendre le clip audio étiré avec ses effets sur place (Bounce in place)"
          >
            <Zap size={12} className="text-[#eaaf5d]" />
            <span>Rendre sur place (Bounce)</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-1 rounded hover:bg-white/10 transition ml-1"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── 2. Warp Mode Selector & Quick Controls ── */}
      <div className="p-3 bg-[#161616] border-b border-[#242424] flex flex-wrap items-center justify-between gap-3">
        {/* 6 Modes Pills */}
        <div className="flex items-center gap-1 bg-[#1c1c1c] p-1 rounded-lg border border-[#2d2d2d]">
          <span className="text-[10px] uppercase font-bold text-zinc-400 px-1.5">Mode :</span>
          {AUDIO_WARP_MODES.map((mode) => {
            const isActive = warpMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setWarpMode(mode.id)}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition flex items-center gap-1 ${
                  isActive
                    ? "bg-[#241808] border border-[#df9c43] text-[#eaaf5d] shadow-[0_0_8px_rgba(223,156,67,0.25)] font-extrabold"
                    : "text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
                title={mode.desc}
              >
                <span>{mode.name}</span>
                <span
                  className={`text-[8px] px-1 py-0.2 rounded font-mono ${
                    isActive ? "bg-black/30 text-amber-200" : "bg-black/20 text-zinc-500"
                  }`}
                >
                  {mode.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Pitch & Fine Tuning Controls */}
        <div className="flex items-center gap-4 bg-[#1c1c1c] px-3 py-1.5 rounded-lg border border-[#2d2d2d]">
          {/* Pitch Transpose (Semitones) */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-zinc-400">Pitch :</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPitchSemitones((p) => Math.max(-24, p - 1))}
                className="w-5 h-5 bg-[#252525] hover:bg-[#333333] rounded text-white font-bold flex items-center justify-center text-xs"
              >
                -
              </button>
              <span className="w-12 text-center font-mono font-bold text-white text-[11px]">
                {pitchSemitones > 0 ? `+${pitchSemitones}` : pitchSemitones} st
              </span>
              <button
                onClick={() => setPitchSemitones((p) => Math.min(24, p + 1))}
                className="w-5 h-5 bg-[#252525] hover:bg-[#333333] rounded text-white font-bold flex items-center justify-center text-xs"
              >
                +
              </button>
            </div>
          </div>

          <div className="w-px h-5 bg-zinc-700/60" />

          {/* Fine Tuning (Cents) */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-zinc-400">Fine :</span>
            <input
              type="range"
              min="-100"
              max="100"
              step="5"
              value={fineCents}
              onChange={(e) => setFineCents(parseInt(e.target.value, 10))}
              className="w-16 accent-[#df9c43] h-1.5 bg-[#121212] rounded appearance-none cursor-pointer"
            />
            <span className="w-10 font-mono text-[10px] text-zinc-300">
              {fineCents > 0 ? `+${fineCents}` : fineCents} ct
            </span>
          </div>

          <div className="w-px h-5 bg-zinc-700/60" />

          {/* Formants Toggle */}
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={preserveFormants}
              onChange={(e) => setPreserveFormants(e.target.checked)}
              className="rounded accent-[#df9c43]"
            />
            <span className="text-[10px] text-zinc-300 font-bold">Formants</span>
          </label>

          <div className="w-px h-5 bg-zinc-700/60" />

          {/* Grain Size (ms) */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold text-zinc-400">Grain :</span>
            <span className="font-mono text-cyan-400 text-[10px] font-bold">{grainSizeMs} ms</span>
            <input
              type="range"
              min="10"
              max="150"
              step="5"
              value={grainSizeMs}
              onChange={(e) => setGrainSizeMs(parseInt(e.target.value, 10))}
              className="w-16 accent-cyan-400 h-1.5 bg-[#121212] rounded appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* ── 3. Interactive Waveform Canvas with Transient & Warp Markers ── */}
      <div className="p-3.5 space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">Éditeur de Marqueurs Warp & Transitoires :</span>
            <span className="text-zinc-500 text-[10px]">
              (Double-cliquez pour insérer un marqueur Warp, glissez les losanges dorés pour étirer le timing)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePromoteAllTransients}
              className="text-[10px] text-zinc-400 hover:text-white px-2 py-0.5 rounded bg-[#202020] border border-[#2d2d2d] transition"
            >
              + Aligner sur tous les transitoires
            </button>
            <button
              onClick={handleResetWarpMarkers}
              className="text-[10px] text-zinc-400 hover:text-white px-2 py-0.5 rounded bg-[#202020] border border-[#2d2d2d] transition flex items-center gap-1"
            >
              <RotateCcw size={10} />
              <span>Réinitialiser</span>
            </button>
          </div>
        </div>

        {/* Canvas Container with Overlaid Markers */}
        <div
          ref={containerRef}
          onMouseMove={handleContainerMouseMove}
          onMouseUp={handleContainerMouseUp}
          onMouseLeave={handleContainerMouseUp}
          onDoubleClick={handleContainerDoubleClick}
          className="relative w-full h-44 rounded-lg overflow-hidden border border-[#2a2a2a] bg-[#101010] cursor-crosshair group shadow-inner"
        >
          {/* Base Audio Waveform Canvas */}
          <canvas
            ref={canvasRef}
            width={960}
            height={176}
            className="w-full h-full block"
          />

          {/* Dotted Transient Marker Lines (Background) */}
          {detectedTransients.map((t, idx) => (
            <div
              key={`trans_${idx}`}
              style={{ left: `${t * 100}%` }}
              className="absolute top-0 bottom-0 w-px border-l border-dashed border-cyan-400/40 pointer-events-none"
            >
              <div className="w-1.5 h-1.5 bg-cyan-400/60 rounded-full -ml-[3px] mt-0.5" />
            </div>
          ))}

          {/* Draggable Warp Markers (Foreground) */}
          {warpMarkers.map((wm) => {
            const isSelected = selectedMarkerId === wm.id;
            const leftPct = wm.warpedNorm * 100;
            return (
              <div
                key={wm.id}
                onMouseDown={(e) => handleMarkerMouseDown(e, wm.id)}
                style={{ left: `${leftPct}%` }}
                className="absolute top-0 bottom-0 -ml-2 w-4 flex flex-col items-center cursor-ew-resize z-20 group/marker"
              >
                {/* Warp Diamond Pin */}
                <div
                  className={`w-3.5 h-3.5 transform rotate-45 border transition shadow-md flex items-center justify-center ${
                    isSelected
                      ? "bg-[#241808] border-[#df9c43] ring-2 ring-[#df9c43]/60 shadow-[0_0_8px_rgba(223,156,67,0.5)]"
                      : "bg-[#241808] hover:bg-[#2d1e0d] border-[#df9c43]/80"
                  }`}
                >
                  <div className={`w-1 h-1 rounded-full ${isSelected ? "bg-[#eaaf5d]" : "bg-black"}`} />
                </div>

                {/* Vertical Warp Line */}
                <div
                  className={`w-0.5 flex-1 transition ${
                    isSelected ? "bg-[#df9c43] shadow-[0_0_6px_#df9c43]" : "bg-[#df9c43]/60 group-hover/marker:bg-[#df9c43]"
                  }`}
                />

                {/* Time Indicator on Hover / Selection */}
                <div className="opacity-0 group-hover/marker:opacity-100 bg-[#161616] text-white text-[9px] font-mono px-1 py-0.5 rounded border border-[#333333] shadow-lg mb-1 pointer-events-none whitespace-nowrap">
                  {(wm.warpedNorm * 4).toFixed(2)} b
                </div>
              </div>
            );
          })}
        </div>

        {/* ── 4. Transient Sensitivity & Preview Bar ── */}
        <div className="flex items-center justify-between pt-1">
          {/* Sensitivity Slider */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-zinc-400">
              Sensibilité Transitoires :
            </span>
            <input
              type="range"
              min="10"
              max="95"
              value={transientSensitivity}
              onChange={(e) => setTransientSensitivity(parseInt(e.target.value, 10))}
              className="w-28 accent-cyan-400 h-1.5 bg-[#1f1f1f] rounded appearance-none cursor-pointer"
            />
            <span className="font-mono text-cyan-400 text-[10px]">
              {transientSensitivity}% ({detectedTransients.length} détectés)
            </span>
          </div>

          {/* Audio Preview Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={startAudioPreview}
              className={`px-3 py-1 rounded text-[10px] font-bold flex items-center gap-1.5 transition ${
                isPlayingPreview
                  ? "bg-red-600 text-white animate-pulse"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white"
              }`}
            >
              {isPlayingPreview ? <Pause size={11} /> : <Play size={11} />}
              <span>{isPlayingPreview ? "Arrêter Écoute" : "Pré-écouter Étirement"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 5. Informational Footer ── */}
      <div className="h-8 bg-[#121212] border-t border-[#222222] px-3.5 flex items-center justify-between text-[10px] text-zinc-500">
        <div className="flex items-center gap-3 font-mono">
          <span>Mode Actif : <strong className="text-zinc-300 uppercase">{warpMode}</strong></span>
          <span>•</span>
          <span>BPM Fichier : <strong className="text-zinc-300">{originalBpm} BPM</strong></span>
          <span>•</span>
          <span>Marqueurs Warp : <strong className="text-[#df9c43]">{warpMarkers.length}</strong></span>
        </div>
        <div className="text-[10px] text-zinc-400">
          Music Studio DAW • Moteur DSP Audio Warp v6.0
        </div>
      </div>
    </div>
  );
}
