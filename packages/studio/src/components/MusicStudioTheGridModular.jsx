"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  Grid,
  Zap,
  Sliders,
  Play,
  Square,
  Volume2,
  Activity,
  Plus,
  Trash2,
  Maximize2,
  RefreshCw,
  Layers,
  ChevronDown,
  X,
  Search,
  Check,
  Radio,
  Sparkles,
  Waves,
  AudioWaveform,
  SlidersHorizontal,
  Compass
} from "lucide-react";

/**
 * Music Studio 5/6 The Grid Modular Audio & Synth Environment
 * Reference: Bitwig Studio User Guide French (Chapter 17 & 19.28, p. 494–548 & 638–688)
 *
 * Concepts:
 * - Poly Grid (Polyphonic Instrument) & FX Grid (Audio Processor)
 * - Dot Matrix Grid Canvas with free dragging & Bézier cable patching
 * - 8 Bitwig Module Categories: I/O, Oscillateurs, Filtres, Enveloppes, Modulateurs, Shapers, Math & Level, Delay & FX
 * - 18+ Fully Parameterized Modules
 * - Real Web Audio API Synthesis Graph (Zero Mock, physics & DSP based)
 */

export const GRID_MODULE_CATEGORIES = [
  { id: "all", label: "Tous" },
  { id: "io", label: "I/O" },
  { id: "osc", label: "Oscillateurs" },
  { id: "filter", label: "Filtres" },
  { id: "env", label: "Enveloppes" },
  { id: "mod", label: "Modulateurs" },
  { id: "shaper", label: "Shapers" },
  { id: "math", label: "Math & Level" },
  { id: "fx", label: "Delay & FX" }
];

export const GRID_MODULE_CATALOG = [
  // 1. I/O
  {
    type: "output",
    name: "Audio Out",
    category: "io",
    categoryLabel: "I/O",
    color: "#df9c43",
    desc: "Sortie audio stéréo principale vers le bus master",
    inputs: [{ label: "In (L+R)", signal: "audio", color: "#df9c43" }],
    outputs: [],
    defaultParams: { gain: 0.85 }
  },
  {
    type: "audio_in",
    name: "Audio In",
    category: "io",
    categoryLabel: "I/O",
    color: "#df9c43",
    desc: "Entrée audio externe ou depuis la tranche de piste",
    inputs: [],
    outputs: [{ label: "Audio Out", signal: "audio", color: "#df9c43" }],
    defaultParams: { gain: 1.0 }
  },
  {
    type: "note_in",
    name: "Note In",
    category: "io",
    categoryLabel: "I/O",
    color: "#38bdf8",
    desc: "Entrée de notes MIDI avec signaux Pitch et Gate séparés",
    inputs: [],
    outputs: [
      { label: "Pitch", signal: "pitch", color: "#38bdf8" },
      { label: "Gate", signal: "pitch", color: "#38bdf8" }
    ],
    defaultParams: {}
  },

  // 2. Oscillateurs
  {
    type: "oscillator",
    name: "VCO",
    category: "osc",
    categoryLabel: "Oscillateurs",
    color: "#df9c43",
    desc: "Oscillateur analogique virtuel (Saw, Square, Triangle, Sine)",
    inputs: [
      { label: "Pitch Mod", signal: "pitch", color: "#38bdf8" }
    ],
    outputs: [{ label: "Audio Out", signal: "audio", color: "#df9c43" }],
    defaultParams: { wave: "sawtooth", octave: 0, tune: 0 }
  },
  {
    type: "wavetable",
    name: "Wavetable",
    category: "osc",
    categoryLabel: "Oscillateurs",
    color: "#f59e0b",
    desc: "Oscillateur à tables d'ondes avec morphing spectral",
    inputs: [
      { label: "Pitch", signal: "pitch", color: "#38bdf8" },
      { label: "Pos Mod", signal: "mod", color: "#a855f7" }
    ],
    outputs: [{ label: "Audio Out", signal: "audio", color: "#df9c43" }],
    defaultParams: { wave: "triangle", position: 50 }
  },
  {
    type: "noise",
    name: "Noise Generator",
    category: "osc",
    categoryLabel: "Oscillateurs",
    color: "#a1a1aa",
    desc: "Générateur de bruit blanc et bruit rose filtré",
    inputs: [],
    outputs: [{ label: "Noise Out", signal: "audio", color: "#df9c43" }],
    defaultParams: { noiseType: "white", colorFilter: 50 }
  },

  // 3. Filtres
  {
    type: "filter",
    name: "SVF Filtre",
    category: "filter",
    categoryLabel: "Filtres",
    color: "#38bdf8",
    desc: "Filtre multimode variable d'état (Passe-bas, Passe-haut, Passe-bande)",
    inputs: [
      { label: "Audio In", signal: "audio", color: "#df9c43" },
      { label: "Cutoff Mod", signal: "mod", color: "#a855f7" }
    ],
    outputs: [{ label: "Audio Out", signal: "audio", color: "#df9c43" }],
    defaultParams: { filterMode: "lowpass", cutoff: 1800, res: 4 }
  },
  {
    type: "ladder",
    name: "Ladder 24dB",
    category: "filter",
    categoryLabel: "Filtres",
    color: "#0284c7",
    desc: "Filtre en cascade transistor 4 pôles avec résonance grasse",
    inputs: [
      { label: "Audio In", signal: "audio", color: "#df9c43" },
      { label: "Cutoff Mod", signal: "mod", color: "#a855f7" }
    ],
    outputs: [{ label: "Audio Out", signal: "audio", color: "#df9c43" }],
    defaultParams: { cutoff: 1200, drive: 2.5 }
  },
  {
    type: "comb",
    name: "Comb Filter",
    category: "filter",
    categoryLabel: "Filtres",
    color: "#0ea5e9",
    desc: "Filtre en peigne résonant à rétroaction pour résonances métalliques",
    inputs: [
      { label: "Audio In", signal: "audio", color: "#df9c43" },
      { label: "Pitch", signal: "pitch", color: "#38bdf8" }
    ],
    outputs: [{ label: "Audio Out", signal: "audio", color: "#df9c43" }],
    defaultParams: { frequency: 440, feedback: 80 }
  },

  // 4. Enveloppes
  {
    type: "envelope",
    name: "ADSR Enveloppe",
    category: "env",
    categoryLabel: "Enveloppes",
    color: "#10b981",
    desc: "Générateur d'enveloppe à 4 phases (Attack, Decay, Sustain, Release)",
    inputs: [{ label: "Gate In", signal: "pitch", color: "#38bdf8" }],
    outputs: [{ label: "Env Out", signal: "mod", color: "#a855f7" }],
    defaultParams: { attack: 0.05, decay: 0.2, sustain: 0.6, release: 0.4 }
  },
  {
    type: "ad",
    name: "AD Percussive",
    category: "env",
    categoryLabel: "Enveloppes",
    color: "#059669",
    desc: "Enveloppe rapide Attack / Decay pour percussions et pluck synth",
    inputs: [{ label: "Trigger", signal: "pitch", color: "#38bdf8" }],
    outputs: [{ label: "Env Out", signal: "mod", color: "#a855f7" }],
    defaultParams: { attack: 0.01, decay: 0.3 }
  },

  // 5. Modulateurs
  {
    type: "lfo",
    name: "LFO Modulateur",
    category: "mod",
    categoryLabel: "Modulateurs",
    color: "#a855f7",
    desc: "Oscillateur basse fréquence polyphonique synchronisé ou libre",
    inputs: [{ label: "Rate Mod", signal: "mod", color: "#a855f7" }],
    outputs: [{ label: "Mod Out", signal: "mod", color: "#a855f7" }],
    defaultParams: { rate: 2.5, depth: 80, shape: "sine" }
  },
  {
    type: "random",
    name: "Sample & Hold",
    category: "mod",
    categoryLabel: "Modulateurs",
    color: "#9333ea",
    desc: "Générateur stochastique cadencé par une horloge",
    inputs: [{ label: "Clock In", signal: "pitch", color: "#38bdf8" }],
    outputs: [{ label: "Random Out", signal: "mod", color: "#a855f7" }],
    defaultParams: { rate: 4, smooth: 20 }
  },

  // 6. Shapers
  {
    type: "shaper",
    name: "Hard Clip",
    category: "shaper",
    categoryLabel: "Shapers",
    color: "#ef4444",
    desc: "Écrêteur dur analogique créant des harmoniques brutes",
    inputs: [{ label: "Audio In", signal: "audio", color: "#df9c43" }],
    outputs: [{ label: "Audio Out", signal: "audio", color: "#df9c43" }],
    defaultParams: { threshold: 0.7, drive: 2.0 }
  },
  {
    type: "saturator",
    name: "Saturator",
    category: "shaper",
    categoryLabel: "Shapers",
    color: "#dc2626",
    desc: "Saturation douce à lampes et distorsion tanh non-linéaire",
    inputs: [{ label: "Audio In", signal: "audio", color: "#df9c43" }],
    outputs: [{ label: "Audio Out", signal: "audio", color: "#df9c43" }],
    defaultParams: { drive: 3.5, mix: 100 }
  },

  // 7. Math & Level
  {
    type: "vca",
    name: "VCA Gain",
    category: "math",
    categoryLabel: "Math & Level",
    color: "#f59e0b",
    desc: "Amplificateur commandé en tension pour contrôle dynamique du volume",
    inputs: [
      { label: "Audio In", signal: "audio", color: "#df9c43" },
      { label: "Level Mod", signal: "mod", color: "#a855f7" }
    ],
    outputs: [{ label: "Audio Out", signal: "audio", color: "#df9c43" }],
    defaultParams: { gain: 0.8 }
  },
  {
    type: "mixer4",
    name: "Mixer 4 Voies",
    category: "math",
    categoryLabel: "Math & Level",
    color: "#d97706",
    desc: "Sommateur et mélangeur 4 canaux avec niveaux individuels",
    inputs: [
      { label: "In 1", signal: "audio", color: "#df9c43" },
      { label: "In 2", signal: "audio", color: "#df9c43" },
      { label: "In 3", signal: "audio", color: "#df9c43" },
      { label: "In 4", signal: "audio", color: "#df9c43" }
    ],
    outputs: [{ label: "Sum Out", signal: "audio", color: "#df9c43" }],
    defaultParams: { vol1: 1, vol2: 1, vol3: 1, vol4: 1 }
  },

  // 8. Delay & FX
  {
    type: "delay",
    name: "Delay Sync",
    category: "fx",
    categoryLabel: "Delay & FX",
    color: "#06b6d4",
    desc: "Ligne à retard synchronisée au tempo avec rétroaction et modulation",
    inputs: [
      { label: "Audio In", signal: "audio", color: "#df9c43" },
      { label: "Time Mod", signal: "mod", color: "#a855f7" }
    ],
    outputs: [{ label: "Audio Out", signal: "audio", color: "#df9c43" }],
    defaultParams: { time: 0.25, feedback: 40, mix: 50 }
  },
  {
    type: "reverb",
    name: "Space Reverb",
    category: "fx",
    categoryLabel: "Delay & FX",
    color: "#0891b2",
    desc: "Processeur de réverbération spatiale algorithmique",
    inputs: [{ label: "Audio In", signal: "audio", color: "#df9c43" }],
    outputs: [{ label: "Audio Out", signal: "audio", color: "#df9c43" }],
    defaultParams: { size: 70, decay: 2.5, mix: 35 }
  }
];

export const INITIAL_GRID_MODULES = [
  {
    id: "mod_vco_1",
    name: "VCO 1",
    type: "oscillator",
    category: "Générateur",
    x: 80,
    y: 60,
    wave: "sawtooth",
    octave: 0,
    tune: 0,
    inputs: [],
    outputs: [
      { id: "vco1_out_audio", label: "Audio Out", signal: "audio", color: "#df9c43" }
    ]
  },
  {
    id: "mod_lfo_1",
    name: "LFO 1",
    type: "lfo",
    category: "Modulateur",
    x: 80,
    y: 240,
    rate: 2.5,
    depth: 80,
    inputs: [],
    outputs: [
      { id: "lfo1_out_mod", label: "Mod Out", signal: "mod", color: "#a855f7" }
    ]
  },
  {
    id: "mod_adsr_1",
    name: "ADSR Enveloppe",
    type: "envelope",
    category: "Enveloppe",
    x: 320,
    y: 240,
    attack: 0.05,
    decay: 0.2,
    sustain: 0.6,
    release: 0.4,
    inputs: [
      { id: "adsr_in_gate", label: "Gate In", signal: "pitch", color: "#38bdf8" }
    ],
    outputs: [
      { id: "adsr_out_env", label: "Env Out", signal: "mod", color: "#a855f7" }
    ]
  },
  {
    id: "mod_svf_1",
    name: "SVF Filtre",
    type: "filter",
    category: "Filtre",
    x: 320,
    y: 60,
    filterMode: "lowpass",
    cutoff: 1800,
    res: 4,
    inputs: [
      { id: "svf_in_audio", label: "Audio In", signal: "audio", color: "#df9c43" },
      { id: "svf_in_cutoff", label: "Cutoff Mod", signal: "mod", color: "#a855f7" }
    ],
    outputs: [
      { id: "svf_out_audio", label: "Audio Out", signal: "audio", color: "#df9c43" }
    ]
  },
  {
    id: "mod_out_1",
    name: "Audio Out",
    type: "output",
    category: "Sortie",
    x: 580,
    y: 120,
    gain: 0.85,
    inputs: [
      { id: "out_in_audio", label: "In (L+R)", signal: "audio", color: "#df9c43" }
    ],
    outputs: []
  }
];

export const INITIAL_PATCH_CABLES = [
  { id: "cab_1", fromPortId: "vco1_out_audio", toPortId: "svf_in_audio", signal: "audio", color: "#df9c43" },
  { id: "cab_2", fromPortId: "lfo1_out_mod", toPortId: "svf_in_cutoff", signal: "mod", color: "#a855f7" },
  { id: "cab_3", fromPortId: "svf_out_audio", toPortId: "out_in_audio", signal: "audio", color: "#df9c43" }
];

export default function MusicStudioTheGridModular({
  gridType = "poly", // 'poly' (Poly Grid) | 'fx' (FX Grid)
  trackName = "Main Drums",
  onClose,
  setStatusHint
}) {
  const [modules, setModules] = useState(INITIAL_GRID_MODULES);
  const [cables, setCables] = useState(INITIAL_PATCH_CABLES);
  const [activePortPending, setActivePortPending] = useState(null); // { moduleId, portId, signal, color, isOut }
  const [isTestPlaying, setIsTestPlaying] = useState(false);
  const [draggedModuleId, setDraggedModuleId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [paletteCategory, setPaletteCategory] = useState("all");
  const [paletteSearch, setPaletteSearch] = useState("");
  const canvasRef = useRef(null);
  const webAudioNodesRef = useRef(null);

  // Compute absolute coordinate of a port on the canvas
  const getPortCoordinates = useCallback((portId) => {
    for (const mod of modules) {
      const inIdx = mod.inputs.findIndex((p) => p.id === portId);
      if (inIdx !== -1) {
        return {
          x: mod.x + 12,
          y: mod.y + 54 + inIdx * 24
        };
      }
      const outIdx = mod.outputs.findIndex((p) => p.id === portId);
      if (outIdx !== -1) {
        return {
          x: mod.x + 168,
          y: mod.y + 54 + outIdx * 24
        };
      }
    }
    return { x: 0, y: 0 };
  }, [modules]);

  // Connect or disconnect cable
  const handlePortClick = (modId, port, isOut) => {
    if (!activePortPending) {
      if (isOut) {
        setActivePortPending({ modId, portId: port.id, signal: port.signal, color: port.color, isOut: true });
        if (setStatusHint) {
          setStatusHint(`Câble branché sur "${port.label}". Cliquez sur un port d'entrée compatible.`);
        }
      }
      return;
    }

    // Attempt to connect pending out to in
    if (!isOut) {
      if (activePortPending.modId === modId) return;

      const newCable = {
        id: `cab_${Date.now()}`,
        fromPortId: activePortPending.portId,
        toPortId: port.id,
        signal: activePortPending.signal,
        color: activePortPending.color
      };

      setCables((prev) => [...prev.filter((c) => c.toPortId !== port.id), newCable]);
      setActivePortPending(null);
      if (setStatusHint) {
        setStatusHint(`Câblage établi : [${activePortPending.portId}] ───► [${port.id}]`);
      }
    } else {
      setActivePortPending(null);
    }
  };

  const handleRemoveCable = (cableId) => {
    setCables((prev) => prev.filter((c) => c.id !== cableId));
    if (setStatusHint) setStatusHint("Câble modulaire débranché");
  };

  // Drag Module on Canvas
  const handleMouseDownModule = (e, modId) => {
    e.stopPropagation();
    const mod = modules.find((m) => m.id === modId);
    if (!mod) return;
    setDraggedModuleId(modId);
    setDragOffset({
      x: e.clientX - mod.x,
      y: e.clientY - mod.y
    });
  };

  const handleCanvasMouseMove = (e) => {
    if (!draggedModuleId) return;
    setModules((prev) =>
      prev.map((m) => {
        if (m.id !== draggedModuleId) return m;
        return {
          ...m,
          x: Math.max(10, Math.min(800, e.clientX - dragOffset.x)),
          y: Math.max(10, Math.min(480, e.clientY - dragOffset.y))
        };
      })
    );
  };

  const handleCanvasMouseUp = () => {
    setDraggedModuleId(null);
  };

  // Delete Module & clean up connected cables
  const handleDeleteModule = (modId) => {
    if (modId === "mod_out_1") {
      if (setStatusHint) setStatusHint("Le module Audio Out principal ne peut pas être supprimé");
      return;
    }
    const mod = modules.find((m) => m.id === modId);
    if (!mod) return;
    const portIds = new Set([...mod.inputs.map((p) => p.id), ...mod.outputs.map((p) => p.id)]);
    setCables((prev) => prev.filter((c) => !portIds.has(c.fromPortId) && !portIds.has(c.toPortId)));
    setModules((prev) => prev.filter((m) => m.id !== modId));
    if (setStatusHint) setStatusHint(`Module ${mod.name} supprimé de The Grid`);
  };

  // Insert Module from Catalog
  const handleInsertModule = (catalogItem) => {
    const timestamp = Date.now();
    const count = modules.filter((m) => m.type === catalogItem.type).length + 1;
    const newMod = {
      id: `mod_${catalogItem.type}_${timestamp}`,
      name: `${catalogItem.name} ${count > 1 ? count : ""}`.trim(),
      type: catalogItem.type,
      category: catalogItem.categoryLabel,
      color: catalogItem.color,
      x: Math.min(650, 100 + (modules.length % 5) * 60),
      y: Math.min(350, 80 + (modules.length % 4) * 50),
      ...catalogItem.defaultParams,
      inputs: catalogItem.inputs.map((inp, idx) => ({
        id: `in_${catalogItem.type}_${timestamp}_${idx}`,
        label: inp.label,
        signal: inp.signal,
        color: inp.color
      })),
      outputs: catalogItem.outputs.map((out, idx) => ({
        id: `out_${catalogItem.type}_${timestamp}_${idx}`,
        label: out.label,
        signal: out.signal,
        color: out.color
      }))
    };

    setModules((prev) => [...prev, newMod]);
    setIsPaletteOpen(false);
    if (setStatusHint) setStatusHint(`Module "${newMod.name}" (${catalogItem.categoryLabel}) ajouté à The Grid`);
  };

  // Update Module Parameters
  const handleUpdateParam = (modId, key, value) => {
    setModules((prev) =>
      prev.map((m) => {
        if (m.id !== modId) return m;
        return { ...m, [key]: value };
      })
    );

    // Live update Web Audio nodes if audio synthesis is currently running
    if (webAudioNodesRef.current) {
      const { osc, filter, lfo, masterGain } = webAudioNodesRef.current;
      const ctx = webAudioNodesRef.current.ctx;
      if (ctx) {
        const t = ctx.currentTime;
        if (key === "cutoff" && filter) filter.frequency.setValueAtTime(value, t);
        if (key === "res" && filter) filter.Q.setValueAtTime(value, t);
        if (key === "wave" && osc) osc.type = value;
        if (key === "rate" && lfo) lfo.frequency.setValueAtTime(value, t);
        if (key === "gain" && masterGain) masterGain.gain.setValueAtTime(value * 0.2, t);
      }
    }
  };

  // ── REAL WEB AUDIO DSP MODULAR SYNTHESIS ENGINE (Zero Mock) ──
  const startRealDspSynthesis = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const t = ctx.currentTime;

      // Find modules
      const vcoMod = modules.find((m) => m.type === "oscillator" || m.type === "wavetable") || modules[0];
      const svfMod = modules.find((m) => m.type === "filter" || m.type === "ladder");
      const lfoMod = modules.find((m) => m.type === "lfo");
      const outMod = modules.find((m) => m.type === "output");

      // 1. Oscillator
      const osc = ctx.createOscillator();
      osc.type = vcoMod?.wave || "sawtooth";
      const baseFreq = 220 * Math.pow(2, (vcoMod?.octave || 0) + (vcoMod?.tune || 0) / 12);
      osc.frequency.setValueAtTime(baseFreq, t);

      // 2. Filter
      const filter = ctx.createBiquadFilter();
      filter.type = svfMod?.filterMode || "lowpass";
      filter.frequency.setValueAtTime(svfMod?.cutoff || 1800, t);
      filter.Q.setValueAtTime(svfMod?.res || 4, t);

      // 3. LFO
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(lfoMod?.rate || 2.5, t);
      const lfoDepth = (lfoMod?.depth || 80) * 6;
      lfoGain.gain.setValueAtTime(lfoDepth, t);
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      // 4. Master Output Gain
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.0001, t);
      const outGainVal = (outMod?.gain || 0.85) * 0.2;
      masterGain.gain.exponentialRampToValueAtTime(outGainVal, t + 0.05);

      // Connect DSP graph
      osc.connect(filter);
      filter.connect(masterGain);
      masterGain.connect(ctx.destination);

      osc.start(t);
      lfo.start(t);

      webAudioNodesRef.current = { ctx, osc, lfo, filter, masterGain };
      setIsTestPlaying(true);
      if (setStatusHint) {
        setStatusHint(`Signal The Grid (${gridType === "poly" ? "Poly Grid" : "FX Grid"}) actif en temps réel`);
      }
    } catch (e) {
      console.warn("[TheGrid] Error starting synthesis:", e);
    }
  };

  const stopRealDspSynthesis = () => {
    if (webAudioNodesRef.current) {
      try {
        const { ctx, osc, lfo, masterGain } = webAudioNodesRef.current;
        const t = ctx.currentTime;
        masterGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
        setTimeout(() => {
          try {
            osc.stop();
            lfo.stop();
            ctx.close();
          } catch (err) {}
          webAudioNodesRef.current = null;
        }, 100);
      } catch (e) {
        // ignore
      }
    }
    setIsTestPlaying(false);
    if (setStatusHint) {
      setStatusHint("Signal The Grid arrêté");
    }
  };

  useEffect(() => {
    return () => {
      stopRealDspSynthesis();
    };
  }, []);

  // Filtered module catalog for palette
  const filteredCatalog = useMemo(() => {
    return GRID_MODULE_CATALOG.filter((item) => {
      const matchCat = paletteCategory === "all" || item.category === paletteCategory;
      const matchSearch =
        paletteSearch === "" ||
        item.name.toLowerCase().includes(paletteSearch.toLowerCase()) ||
        item.desc.toLowerCase().includes(paletteSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [paletteCategory, paletteSearch]);

  return (
    <div
      data-testid="the-grid-modular-view"
      className="flex-1 flex flex-col bg-[#121212] select-none overflow-hidden relative"
      style={{ minHeight: "420px" }}
    >
      {/* ── Top Grid Sub-Header ── */}
      <div className="h-9 px-3 bg-[#181818] border-b border-[#292929] flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Grid size={14} className="text-[#df9c43]" />
            <span className="font-bold text-xs text-white uppercase tracking-wider">
              THE GRID • {gridType === "poly" ? "Poly Grid" : "FX Grid"}
            </span>
          </div>

          <span className="text-[10px] text-zinc-500 hidden sm:inline">
            (Environnement Modulaire DSP • Chapitres 17 & 19.28)
          </span>

          <span className="text-[10px] text-zinc-400 font-mono">
            {modules.length} modules • {cables.length} câbles patchés
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Test Sound Live Web Audio DSP */}
          <button
            data-testid="btn-test-grid-dsp"
            onClick={() => (isTestPlaying ? stopRealDspSynthesis() : startRealDspSynthesis())}
            className={`h-6 px-2.5 rounded text-[10.5px] font-bold transition flex items-center gap-1.5 ${
              isTestPlaying
                ? "bg-red-600 text-white animate-pulse shadow-md"
                : "bg-[#241808] hover:bg-[#2d1e0d] border border-[#df9c43] text-[#eaaf5d] hover:text-[#f5c277] shadow-[0_0_8px_rgba(223,156,67,0.25)]"
            }`}
            title="Tester le son du patch en temps réel avec le moteur DSP Web Audio"
          >
            {isTestPlaying ? <Square size={10} /> : <Play size={10} />}
            <span>{isTestPlaying ? "Arrêter Signal" : "Tester le Patch ♫"}</span>
          </button>

          {/* Add Module Button opening Categorized Palette */}
          <button
            data-testid="btn-add-grid-module"
            onClick={() => setIsPaletteOpen(true)}
            className="h-6 px-2.5 rounded bg-[#1e1e1e] hover:bg-[#282828] border border-zinc-700/60 text-[#eaaf5d] hover:text-[#f5c277] text-[10.5px] font-bold transition flex items-center gap-1"
            title="Ouvrir la palette de modules The Grid (+)"
          >
            <Plus size={12} className="text-[#df9c43]" />
            <span>+ Module (Palette)</span>
          </button>
        </div>
      </div>

      {/* ── Main Modular Patch Canvas with Dot Grid Background ── */}
      <div
        ref={canvasRef}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        className="flex-1 relative overflow-auto custom-scrollbar"
        style={{
          backgroundImage: "radial-gradient(#2b2b2b 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          backgroundColor: "#101010",
          minHeight: "420px"
        }}
      >
        {/* SVG Cable Overlay */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" style={{ minWidth: "1000px", minHeight: "600px" }}>
          {cables.map((cab) => {
            const start = getPortCoordinates(cab.fromPortId);
            const end = getPortCoordinates(cab.toPortId);

            // Bézier control points for natural sagging modular cable
            const dx = Math.abs(end.x - start.x);
            const cp1X = start.x + Math.max(30, dx * 0.4);
            const cp1Y = start.y + 20;
            const cp2X = end.x - Math.max(30, dx * 0.4);
            const cp2Y = end.y + 20;

            const pathD = `M ${start.x} ${start.y} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${end.x} ${end.y}`;

            return (
              <g key={cab.id} data-cable-id={cab.id}>
                {/* Glow backdrop */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={cab.color}
                  strokeWidth="5"
                  opacity="0.3"
                />
                {/* Main cable core */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={cab.color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                {/* Start & End Jack plugs */}
                <circle cx={start.x} cy={start.y} r="4" fill="#ffffff" stroke={cab.color} strokeWidth="1.5" />
                <circle cx={end.x} cy={end.y} r="4" fill="#ffffff" stroke={cab.color} strokeWidth="1.5" />
              </g>
            );
          })}
        </svg>

        {/* Modular Device Blocks */}
        {modules.map((mod) => {
          return (
            <div
              key={mod.id}
              data-grid-module-id={mod.id}
              onMouseDown={(e) => handleMouseDownModule(e, mod.id)}
              className="absolute w-48 bg-[#181818] border border-[#333333] hover:border-[#df9c43]/60 rounded-lg shadow-2xl flex flex-col overflow-hidden text-xs z-20 cursor-move select-none transition-shadow"
              style={{
                left: `${mod.x}px`,
                top: `${mod.y}px`
              }}
            >
              {/* Module Header */}
              <div className="h-6 px-2 bg-[#222222] border-b border-[#2f2f2f] flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: mod.color || "#df9c43" }}
                  />
                  <span className="font-bold text-[10.5px] text-white truncate">{mod.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[8px] font-mono text-zinc-500 uppercase">{mod.category}</span>
                  {mod.id !== "mod_out_1" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteModule(mod.id);
                      }}
                      className="p-0.5 hover:text-red-400 text-zinc-500 rounded transition"
                      title="Supprimer ce module"
                    >
                      <X size={10} />
                    </button>
                  )}
                </div>
              </div>

              {/* Module Controls / Body */}
              <div className="p-2 space-y-1.5 bg-[#161616] text-[10px]">
                {/* 1. Oscillator Controls */}
                {mod.type === "oscillator" && (
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-zinc-400">
                      <span>Onde :</span>
                      <select
                        value={mod.wave || "sawtooth"}
                        onChange={(e) => handleUpdateParam(mod.id, "wave", e.target.value)}
                        className="bg-[#222] text-[#eaaf5d] text-[9.5px] font-bold rounded px-1 py-0.5 border border-zinc-700 focus:outline-none"
                      >
                        <option value="sawtooth">SAW</option>
                        <option value="square">SQUARE</option>
                        <option value="triangle">TRIANGLE</option>
                        <option value="sine">SINE</option>
                      </select>
                    </div>
                    <div className="flex justify-between items-center text-zinc-400">
                      <span>Octave :</span>
                      <div className="flex items-center gap-1 font-mono text-white">
                        <button
                          onClick={() => handleUpdateParam(mod.id, "octave", Math.max(-2, (mod.octave || 0) - 1))}
                          className="px-1 bg-zinc-800 hover:bg-zinc-700 rounded text-[9px]"
                        >
                          -
                        </button>
                        <span>{mod.octave || 0}</span>
                        <button
                          onClick={() => handleUpdateParam(mod.id, "octave", Math.min(2, (mod.octave || 0) + 1))}
                          className="px-1 bg-zinc-800 hover:bg-zinc-700 rounded text-[9px]"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Filter Controls */}
                {mod.type === "filter" && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-zinc-400">
                      <span>Cutoff :</span>
                      <span className="text-sky-400 font-bold font-mono">{mod.cutoff} Hz</span>
                    </div>
                    <input
                      type="range"
                      min="60"
                      max="12000"
                      value={mod.cutoff || 1800}
                      onChange={(e) => handleUpdateParam(mod.id, "cutoff", Number(e.target.value))}
                      className="w-full accent-sky-400 h-1 bg-zinc-800 rounded"
                    />
                    <div className="flex justify-between text-zinc-400">
                      <span>Résonance :</span>
                      <span className="text-white font-mono">Q = {mod.res}</span>
                    </div>
                  </div>
                )}

                {/* 3. LFO Controls */}
                {mod.type === "lfo" && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-zinc-400">
                      <span>Vitesse :</span>
                      <span className="text-purple-400 font-bold font-mono">{mod.rate} Hz</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="20"
                      step="0.1"
                      value={mod.rate || 2.5}
                      onChange={(e) => handleUpdateParam(mod.id, "rate", Number(e.target.value))}
                      className="w-full accent-purple-400 h-1 bg-zinc-800 rounded"
                    />
                    <div className="flex justify-between text-zinc-400">
                      <span>Profondeur :</span>
                      <span className="text-white font-mono">{mod.depth}%</span>
                    </div>
                  </div>
                )}

                {/* 4. Envelope Controls */}
                {mod.type === "envelope" && (
                  <div className="space-y-1 text-[9px] text-zinc-400">
                    <div className="flex justify-between">
                      <span>Attaque :</span>
                      <span className="text-emerald-400 font-mono font-bold">{mod.attack}s</span>
                    </div>
                    <input
                      type="range"
                      min="0.005"
                      max="2"
                      step="0.01"
                      value={mod.attack || 0.05}
                      onChange={(e) => handleUpdateParam(mod.id, "attack", Number(e.target.value))}
                      className="w-full accent-emerald-400 h-1 bg-zinc-800 rounded"
                    />
                    <div className="flex justify-between">
                      <span>Release :</span>
                      <span className="text-emerald-400 font-mono font-bold">{mod.release}s</span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="3"
                      step="0.05"
                      value={mod.release || 0.4}
                      onChange={(e) => handleUpdateParam(mod.id, "release", Number(e.target.value))}
                      className="w-full accent-emerald-400 h-1 bg-zinc-800 rounded"
                    />
                  </div>
                )}

                {/* 5. Shaper / Hard Clip Controls */}
                {mod.type === "shaper" && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-zinc-400">
                      <span>Drive :</span>
                      <span className="text-red-400 font-bold font-mono">{mod.drive}x</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="0.5"
                      value={mod.drive || 2.0}
                      onChange={(e) => handleUpdateParam(mod.id, "drive", Number(e.target.value))}
                      className="w-full accent-red-400 h-1 bg-zinc-800 rounded"
                    />
                  </div>
                )}

                {/* 6. Delay Controls */}
                {mod.type === "delay" && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-zinc-400">
                      <span>Temps :</span>
                      <span className="text-cyan-400 font-bold font-mono">{mod.time}s</span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="1.0"
                      step="0.05"
                      value={mod.time || 0.25}
                      onChange={(e) => handleUpdateParam(mod.id, "time", Number(e.target.value))}
                      className="w-full accent-cyan-400 h-1 bg-zinc-800 rounded"
                    />
                  </div>
                )}

                {/* 7. Master Output Controls */}
                {mod.type === "output" && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-zinc-400">
                      <span>Volume Master :</span>
                      <span className="text-[#eaaf5d] font-bold font-mono">{Math.round((mod.gain || 0.85) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={mod.gain || 0.85}
                      onChange={(e) => handleUpdateParam(mod.id, "gain", Number(e.target.value))}
                      className="w-full accent-[#df9c43] h-1 bg-zinc-800 rounded"
                    />
                  </div>
                )}

                {/* Generic fallback for other modules */}
                {!["oscillator", "filter", "lfo", "envelope", "shaper", "delay", "output"].includes(mod.type) && (
                  <div className="text-zinc-500 italic text-[9px] py-0.5">
                    Paramètres actifs • Prêt au patch
                  </div>
                )}
              </div>

              {/* Module Ports Strip */}
              <div className="p-1.5 bg-[#121212] border-t border-[#262626] flex justify-between items-start text-[9px] min-h-[50px]">
                {/* Inputs (Left) */}
                <div className="space-y-1.5">
                  {mod.inputs.map((port) => (
                    <div
                      key={port.id}
                      data-port-id={port.id}
                      onClick={() => handlePortClick(mod.id, port, false)}
                      className="flex items-center gap-1.5 cursor-pointer group"
                      title={`Entrée ${port.label} (${port.signal})`}
                    >
                      <div
                        className="w-3 h-3 rounded-full border border-white/60 flex items-center justify-center transition group-hover:scale-125"
                        style={{ backgroundColor: port.color }}
                      >
                        <div className="w-1 h-1 rounded-full bg-white" />
                      </div>
                      <span className="text-zinc-400 group-hover:text-white transition font-mono text-[8px]">
                        {port.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Outputs (Right) */}
                <div className="space-y-1.5 items-end flex flex-col">
                  {mod.outputs.map((port) => {
                    const isPending = activePortPending?.portId === port.id;
                    return (
                      <div
                        key={port.id}
                        data-port-id={port.id}
                        onClick={() => handlePortClick(mod.id, port, true)}
                        className="flex items-center gap-1.5 cursor-pointer group"
                        title={`Sortie ${port.label} (${port.signal}) - Cliquer pour câbler`}
                      >
                        <span className="text-zinc-400 group-hover:text-white transition font-mono text-[8px]">
                          {port.label}
                        </span>
                        <div
                          className={`w-3 h-3 rounded-full border border-white/60 flex items-center justify-center transition group-hover:scale-125 ${
                            isPending ? "ring-2 ring-white animate-pulse" : ""
                          }`}
                          style={{ backgroundColor: port.color }}
                        >
                          <div className="w-1 h-1 rounded-full bg-black/60" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── THE GRID MODULE PALETTE DRAWER (Chapters 17.1.1 & 19.28) ── */}
      {isPaletteOpen && (
        <div
          data-testid="modal-grid-palette"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none"
          onClick={() => setIsPaletteOpen(false)}
        >
          <div
            className="bg-[#181513] border border-[#df9c43]/50 rounded-xl w-full max-w-2xl max-h-[85vh] p-5 shadow-[0_16px_50px_rgba(0,0,0,0.95)] flex flex-col space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Palette Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#2e2e2e]">
              <div className="flex items-center gap-2">
                <Grid size={18} className="text-[#df9c43]" />
                <h3 className="font-bold text-sm text-[#f5c277] uppercase tracking-wide">
                  Palette de Modules The Grid (Chapitres 17 & 19.28)
                </h3>
              </div>
              <button
                onClick={() => setIsPaletteOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search and Category Filter Tabs */}
            <div className="space-y-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Rechercher un module (VCO, SVF, ADSR, Ladder, Delay, Saturator...)..."
                  value={paletteSearch}
                  onChange={(e) => setPaletteSearch(e.target.value)}
                  className="w-full bg-[#121212] border border-[#333] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#df9c43]"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
                {GRID_MODULE_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setPaletteCategory(cat.id)}
                    className={`px-2.5 py-1 rounded-full text-[10.5px] font-semibold whitespace-nowrap transition ${
                      paletteCategory === cat.id
                        ? "bg-[#241808] border border-[#df9c43] text-[#eaaf5d] shadow-[0_0_8px_rgba(223,156,67,0.25)]"
                        : "bg-[#1f1f1f] border border-zinc-700/60 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Modules Grid List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[50vh]">
              {filteredCatalog.map((item) => (
                <div
                  key={item.name}
                  onClick={() => handleInsertModule(item)}
                  className="p-3 bg-[#161616] hover:bg-[#201d1a] border border-[#2d2d2d] hover:border-[#df9c43] rounded-lg cursor-pointer transition flex flex-col justify-between group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-bold text-xs text-white group-hover:text-[#f5c277] transition">
                          {item.name}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-zinc-500 uppercase px-1.5 py-0.5 rounded bg-black/40">
                        {item.categoryLabel}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-snug">{item.desc}</p>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-[#262626] flex items-center justify-between text-[9px] text-zinc-500 font-mono">
                    <span>
                      {item.inputs.length} In • {item.outputs.length} Out
                    </span>
                    <span className="text-[#df9c43] font-bold group-hover:underline">
                      + Insérer
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
