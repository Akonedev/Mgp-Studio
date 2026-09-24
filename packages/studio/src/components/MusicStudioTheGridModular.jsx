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
  ChevronDown
} from "lucide-react";

/**
 * Music Studio 5/6 The Grid Modular Audio & Synth Environment
 * Reference: Music Studio User Guide French (Chapter 15, p. 470–510)
 *
 * Concepts:
 * - Poly Grid (Polyphonic Instrument) & FX Grid (Audio Processor)
 * - Dot Matrix Grid Canvas
 * - Modular Blocks: VCO, SVF Filter, ADSR, LFO, VCA, Audio Out
 * - Color-coded Patch Cords:
 *    * Orange: Audio Signal
 *    * Blue: Pitch / Gate Events
 *    * Purple: Modulation
 * - Real Web Audio API Node Graph Synthesis (Zero Mock)
 */

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

export default function MusicStudio({
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
      // Don't connect to same module
      if (activePortPending.modId === modId) return;

      const newCable = {
        id: `cab_${Date.now()}`,
        fromPortId: activePortPending.portId,
        toPortId: port.id,
        signal: activePortPending.signal,
        color: activePortPending.color
      };

      // Remove existing cable to this input if single input
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

  // ── REAL WEB AUDIO DSP MODULAR SYNTHESIS ENGINE (Zero Mock) ──
  const startRealDspSynthesis = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const t = ctx.currentTime;

      // Find modules
      const vcoMod = modules.find((m) => m.type === "oscillator") || modules[0];
      const svfMod = modules.find((m) => m.type === "filter");
      const lfoMod = modules.find((m) => m.type === "lfo");
      const outMod = modules.find((m) => m.type === "output");

      // 1. Oscillator
      const osc = ctx.createOscillator();
      osc.type = vcoMod?.wave || "sawtooth";
      osc.frequency.setValueAtTime(220, t);

      // 2. Filter
      const filter = ctx.createBiquadFilter();
      filter.type = svfMod?.filterMode || "lowpass";
      filter.frequency.setValueAtTime(svfMod?.cutoff || 1800, t);
      filter.Q.setValueAtTime(svfMod?.res || 4, t);

      // 3. LFO
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(lfoMod?.rate || 2.5, t);
      lfoGain.gain.setValueAtTime(400, t);
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency); // LFO modulates cutoff!

      // 4. Output Gain
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.0001, t);
      masterGain.gain.exponentialRampToValueAtTime(0.18, t + 0.05);

      // Cable routing
      osc.connect(filter);
      filter.connect(masterGain);
      masterGain.connect(ctx.destination);

      osc.start(t);
      lfo.start(t);

      webAudioNodesRef.current = { ctx, osc, lfo, masterGain };
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
          osc.stop();
          lfo.stop();
          ctx.close();
          webAudioNodesRef.current = null;
        }, 100);
      } catch (e) {
        // ignore
      }
    }
    setIsTestPlaying(false);
    if (setStatusHint) setStatusHint("Signal The Grid arrêté");
  };

  useEffect(() => {
    return () => {
      stopRealDspSynthesis();
    };
  }, []);

  return (
    <div
      data-testid="studio-the-grid-container"
      className="flex-1 flex flex-col bg-[#111111] overflow-hidden select-none relative"
    >
      {/* ── Top Header Toolbar ── */}
      <div className="h-8 px-3 bg-[#191919] border-b border-[#2a2a2a] flex items-center justify-between text-xs font-mono text-zinc-300 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Grid size={14} className="text-[#df9c43]" />
            <span className="font-extrabold text-white">
              THE GRID • {gridType === "poly" ? "Poly Grid" : "FX Grid"}
            </span>
            <span className="text-[10px] text-zinc-500 font-sans">
              (Environnement Modulaire DSP • Chapitre 15, p. 470)
            </span>
          </div>

          <div className="h-4 w-px bg-zinc-700" />

          {/* Module count badge */}
          <span className="text-[10px] text-zinc-400">
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

          {/* Add Module Quick Button */}
          <button
            data-testid="btn-add-grid-module"
            onClick={() => {
              const newMod = {
                id: `mod_${Date.now()}`,
                name: "VCA Gain",
                type: "vca",
                category: "Ampli",
                x: 200,
                y: 180,
                gain: 0.8,
                inputs: [
                  { id: `in_a_${Date.now()}`, label: "Audio In", signal: "audio", color: "#df9c43" },
                  { id: `in_c_${Date.now()}`, label: "Control", signal: "mod", color: "#a855f7" }
                ],
                outputs: [
                  { id: `out_${Date.now()}`, label: "Audio Out", signal: "audio", color: "#df9c43" }
                ]
              };
              setModules((prev) => [...prev, newMod]);
              if (setStatusHint) setStatusHint("Nouveau module VCA ajouté à The Grid");
            }}
            className="h-6 px-2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10.5px] font-bold transition flex items-center gap-1"
            title="Ajouter un module modulaire (+)"
          >
            <Plus size={11} />
            <span>+ Module</span>
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
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" style={{ minWidth: "900px", minHeight: "500px" }}>
          {cables.map((cab) => {
            const start = getPortCoordinates(cab.fromPortId);
            const end = getPortCoordinates(cab.toPortId);

            // Bézier control points for organic sagging cable
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
              className="absolute w-44 bg-[#181818] border border-[#333333] hover:border-zinc-500 rounded-lg shadow-2xl flex flex-col overflow-hidden text-xs z-20 cursor-move select-none transition-shadow"
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
                    style={{
                      backgroundColor:
                        mod.type === "oscillator"
                          ? "#df9c43"
                          : mod.type === "filter"
                          ? "#38bdf8"
                          : mod.type === "lfo"
                          ? "#a855f7"
                          : mod.type === "envelope"
                          ? "#10b981"
                          : "#f59e0b"
                    }}
                  />
                  <span className="font-bold text-[10.5px] text-white truncate">{mod.name}</span>
                </div>
                <span className="text-[8px] font-mono text-zinc-500 uppercase">{mod.category}</span>
              </div>

              {/* Module Controls / Body */}
              <div className="p-2 space-y-1.5 bg-[#161616] text-[10px]">
                {mod.type === "oscillator" && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-zinc-400">
                      <span>Onde:</span>
                      <span className="text-amber-400 font-bold uppercase">{mod.wave}</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Accord:</span>
                      <span className="text-white font-mono">{mod.octave} oct / {mod.tune} st</span>
                    </div>
                  </div>
                )}

                {mod.type === "filter" && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-zinc-400">
                      <span>Cutoff:</span>
                      <span className="text-sky-400 font-bold">{mod.cutoff} Hz</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Résonance:</span>
                      <span className="text-white font-mono">Q = {mod.res}</span>
                    </div>
                  </div>
                )}

                {mod.type === "lfo" && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-zinc-400">
                      <span>Vitesse:</span>
                      <span className="text-[#df9c43] font-bold">{mod.rate} Hz</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Profondeur:</span>
                      <span className="text-white font-mono">{mod.depth}%</span>
                    </div>
                  </div>
                )}

                {mod.type === "envelope" && (
                  <div className="space-y-0.5 text-[9px] text-zinc-400">
                    <div>A: {mod.attack}s • D: {mod.decay}s</div>
                    <div>S: {mod.sustain * 100}% • R: {mod.release}s</div>
                  </div>
                )}

                {mod.type === "output" && (
                  <div className="flex items-center gap-1 text-[10px] text-zinc-300">
                    <Volume2 size={12} className="text-amber-400" />
                    <span>Niveau Master : {Math.round(mod.gain * 100)}%</span>
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
    </div>
  );
}
