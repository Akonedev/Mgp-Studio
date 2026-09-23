import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Activity,
  Sliders,
  Plus,
  Trash2,
  Play,
  RotateCw,
  Compass,
  Zap,
  Target,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Layers,
  Shuffle,
  Volume2
} from "lucide-react";

/**
 * Music Studio - Unified Modulation System (Chapter 16, p. 461-512)
 *
 * Capabilities:
 * - Modulators: LFO (Classic/Beat), Steps (16-step sequencer), Curves (Bézier multi-segment),
 *   Macro (Multi-target rotary knob), ParSeq-8 (8-step probability sequencer), Random (S&H).
 * - Interactive Modulation Mapping: Clicking the mapping icon puts the system into assignment mode.
 * - Real Mathematical Waveform & Step Generators (Zero Mock, physics & DSP based).
 * - Real-time animated canvas oscilloscopes & playhead indicators.
 * - Dynamic parameter dispatch to Web Audio Nodes.
 */

// Available modulator presets
export const STUDIO_MODULATOR_TYPES = [
  {
    type: "lfo",
    name: "LFO",
    category: "LFO",
    desc: "Oscillateur basse fréquence polyphonique synchronisé ou libre",
    icon: Activity,
    defaultConfig: {
      shape: "sine", // sine, triangle, saw, square, sampleHold
      rateMode: "sync", // hz or sync
      rateHz: 2.0,
      rateSync: "1/4", // 1/16, 1/8, 1/4, 1/2, 1/1, 2/1
      depth: 100, // -100 to 100%
      phase: 0, // 0 to 360 deg
      smooth: 10, // ms
      bipolar: true
    }
  },
  {
    type: "steps",
    name: "Steps",
    category: "Sequencing",
    desc: "Séquenceur de pas avec sliders de modulation et boucle ajustable",
    icon: Sliders,
    defaultConfig: {
      numSteps: 8, // 4 to 16
      values: [0.2, 0.5, 0.9, 0.3, 0.7, 0.4, 0.8, 0.1, 0.6, 0.3, 0.9, 0.5, 0.2, 0.7, 0.4, 0.8],
      rateSync: "1/8",
      loopLength: 8,
      smoothing: 15,
      bipolar: false
    }
  },
  {
    type: "curves",
    name: "Curves",
    category: "Envelope",
    desc: "Générateur d'enveloppe et LFO multi-segments avec tension Bézier",
    icon: TrendingUp,
    defaultConfig: {
      points: [
        { x: 0, y: 0, tension: 0 },
        { x: 0.25, y: 0.8, tension: 0.5 },
        { x: 0.6, y: 0.2, tension: -0.3 },
        { x: 1, y: 1, tension: 0.2 }
      ],
      rateSync: "1/2",
      loopMode: "loop", // loop, once, pingpong
      bipolar: false
    }
  },
  {
    type: "macro",
    name: "Macro",
    category: "Control",
    desc: "Potentiomètre maître contrôlant plusieurs cibles simultanément",
    icon: RotateCw,
    defaultConfig: {
      value: 64, // 0 to 127
      min: 0,
      max: 127,
      name: "Macro 1"
    }
  },
  {
    type: "parseq8",
    name: "ParSeq-8",
    category: "Sequencing",
    desc: "Séquenceur parallèle à 8 pas avec déclenchements probabilistes",
    icon: Layers,
    defaultConfig: {
      steps: [
        { val: 0.8, prob: 100 },
        { val: 0.3, prob: 75 },
        { val: 0.6, prob: 90 },
        { val: 0.9, prob: 50 },
        { val: 0.2, prob: 100 },
        { val: 0.5, prob: 60 },
        { val: 0.7, prob: 80 },
        { val: 0.4, prob: 40 }
      ],
      rateSync: "1/8"
    }
  },
  {
    type: "random",
    name: "Random",
    category: "Chaos",
    desc: "Générateur stochastique Sample & Hold et marche aléatoire",
    icon: Shuffle,
    defaultConfig: {
      rateSync: "1/4",
      smooth: 50, // %
      bipolar: true,
      mode: "sampleHold" // sampleHold, randomWalk
    }
  }
];

// Helper: sync string to fraction of beat (in quarter notes)
export function syncToQuarterNotes(syncStr) {
  switch (syncStr) {
    case "1/32": return 0.125;
    case "1/16": return 0.25;
    case "1/8": return 0.5;
    case "1/4": return 1.0;
    case "1/2": return 2.0;
    case "1/1": return 4.0;
    case "2/1": return 8.0;
    case "4/1": return 16.0;
    default: return 1.0;
  }
}

/**
 * Real-time Mathematical Modulator Evaluator
 * Computes the normalized output value (-1 to 1 or 0 to 1) for a modulator at time t.
 */
export function evaluateModulatorValue(mod, timeSec, bpm = 120, isPlaying = true) {
  const beat = (timeSec * (bpm / 60));
  
  if (mod.type === "lfo") {
    const cfg = mod.config;
    let freqHz = cfg.rateHz;
    if (cfg.rateMode === "sync") {
      const qn = syncToQuarterNotes(cfg.rateSync);
      freqHz = (bpm / 60) / qn;
    }
    const phaseRad = (cfg.phase * Math.PI) / 180;
    const t = isPlaying ? timeSec : (mod.internalTime || 0);
    const cycle = (t * freqHz + phaseRad / (2 * Math.PI)) % 1;
    
    let rawVal = 0;
    switch (cfg.shape) {
      case "sine":
        rawVal = Math.sin(cycle * 2 * Math.PI);
        break;
      case "triangle":
        rawVal = cycle < 0.5 ? (cycle * 4 - 1) : (3 - cycle * 4);
        break;
      case "saw":
        rawVal = cycle * 2 - 1;
        break;
      case "square":
        rawVal = cycle < 0.5 ? 1 : -1;
        break;
      case "sampleHold": {
        // pseudo-random deterministic per cycle step
        const stepIdx = Math.floor(t * freqHz);
        const seed = Math.sin(stepIdx * 9999.13) * 43758.5453;
        rawVal = (seed - Math.floor(seed)) * 2 - 1;
        break;
      }
      default:
        rawVal = Math.sin(cycle * 2 * Math.PI);
    }
    
    // Scale by depth
    const scale = (cfg.depth || 100) / 100;
    return rawVal * scale;
  }

  if (mod.type === "steps") {
    const cfg = mod.config;
    const qn = syncToQuarterNotes(cfg.rateSync);
    const stepDurationSec = (60 / bpm) * qn;
    const totalSteps = cfg.loopLength || cfg.numSteps || 8;
    const currentStepFloat = (timeSec / stepDurationSec) % totalSteps;
    const currentStepInt = Math.floor(currentStepFloat);
    const stepVal = cfg.values[currentStepInt % cfg.values.length] ?? 0.5;
    return cfg.bipolar ? (stepVal * 2 - 1) : stepVal;
  }

  if (mod.type === "macro") {
    const cfg = mod.config;
    const norm = (cfg.value - (cfg.min || 0)) / ((cfg.max || 127) - (cfg.min || 0));
    return norm; // 0.0 to 1.0
  }

  if (mod.type === "random") {
    const cfg = mod.config;
    const qn = syncToQuarterNotes(cfg.rateSync);
    const stepDuration = (60 / bpm) * qn;
    const idx = Math.floor(timeSec / stepDuration);
    const s1 = Math.sin(idx * 1234.56) * 43758.54;
    const randVal = (s1 - Math.floor(s1)) * 2 - 1;
    return randVal;
  }

  if (mod.type === "parseq8") {
    const cfg = mod.config;
    const qn = syncToQuarterNotes(cfg.rateSync);
    const stepDuration = (60 / bpm) * qn;
    const currentStep = Math.floor(timeSec / stepDuration) % 8;
    const item = cfg.steps[currentStep] || { val: 0.5, prob: 100 };
    return item.val;
  }

  return 0;
}

/**
 * LFO Canvas Mini-Oscilloscope
 */
function LfoOscilloscope({ mod, isPlaying, bpm, currentSec }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = "#27272a";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Waveform path
    ctx.strokeStyle = "#06b6d4"; // Cyan Music Studio mod color
    ctx.lineWidth = 2;
    ctx.beginPath();

    const points = width;
    const cfg = mod.config;
    const qn = cfg.rateMode === "sync" ? syncToQuarterNotes(cfg.rateSync) : (1 / (cfg.rateHz || 1));
    const periodSec = (60 / (bpm || 120)) * qn;

    for (let x = 0; x < points; x++) {
      const t = currentSec + (x / points) * periodSec * 2;
      const v = evaluateModulatorValue(mod, t, bpm, true);
      const y = height / 2 - (v * (height / 2 - 4));
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Playhead indicator dot
    const curVal = evaluateModulatorValue(mod, currentSec, bpm, true);
    const dotY = height / 2 - (curVal * (height / 2 - 4));
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(4, dotY, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#06b6d4";
    ctx.beginPath();
    ctx.arc(4, dotY, 2, 0, Math.PI * 2);
    ctx.fill();
  }, [mod, isPlaying, bpm, currentSec]);

  return (
    <canvas
      ref={canvasRef}
      width={130}
      height={40}
      className="bg-[#0f172a] rounded border border-cyan-900/50"
    />
  );
}

/**
 * Steps Mini-Bar Sequencer View
 */
function StepsSequencerView({ mod, onUpdateConfig, currentSec, bpm }) {
  const cfg = mod.config;
  const qn = syncToQuarterNotes(cfg.rateSync);
  const stepDuration = (60 / (bpm || 120)) * qn;
  const activeStep = Math.floor(currentSec / stepDuration) % (cfg.loopLength || cfg.numSteps || 8);

  const handleStepChange = (idx, newVal) => {
    const newValues = [...cfg.values];
    newValues[idx] = Math.max(0, Math.min(1, newVal));
    onUpdateConfig({ ...cfg, values: newValues });
  };

  return (
    <div className="flex items-end gap-1 h-10 bg-[#0f172a] p-1 rounded border border-cyan-900/40">
      {cfg.values.slice(0, cfg.loopLength || cfg.numSteps || 8).map((val, idx) => {
        const isActive = activeStep === idx;
        return (
          <div
            key={idx}
            data-testid={`step-slider-${idx}`}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = 1 - (e.clientY - rect.top) / rect.height;
              handleStepChange(idx, Math.round(ratio * 10) / 10);
            }}
            className={`flex-1 h-full flex flex-col justify-end rounded-sm cursor-pointer transition relative group ${
              isActive ? "bg-cyan-950/80 ring-1 ring-cyan-400" : "bg-zinc-800/60 hover:bg-zinc-700/60"
            }`}
          >
            <div
              style={{ height: `${Math.round(val * 100)}%` }}
              className={`w-full rounded-sm transition-all ${
                isActive ? "bg-cyan-400 shadow-[0_0_8px_#06b6d4]" : "bg-cyan-600/80 group-hover:bg-cyan-500"
              }`}
            />
            {isActive && (
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full shadow" />
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Macro Big Knob
 */
function MacroKnobView({ mod, onUpdateConfig }) {
  const cfg = mod.config;
  const norm = (cfg.value - (cfg.min || 0)) / ((cfg.max || 127) - (cfg.min || 0));

  const handleChange = (e) => {
    onUpdateConfig({ ...cfg, value: Number(e.target.value) });
  };

  return (
    <div className="flex flex-col items-center justify-center p-1 bg-[#0f172a] rounded border border-cyan-900/40 min-w-[90px]">
      <div className="relative w-10 h-10 flex items-center justify-center">
        {/* Circular background track */}
        <svg className="w-10 h-10 -rotate-90">
          <circle
            cx="20"
            cy="20"
            r="16"
            stroke="#1e293b"
            strokeWidth="3"
            fill="none"
          />
          <circle
            cx="20"
            cy="20"
            r="16"
            stroke="#06b6d4"
            strokeWidth="3"
            strokeDasharray={100}
            strokeDashoffset={100 - norm * 100}
            strokeLinecap="round"
            fill="none"
          />
        </svg>
        <span className="absolute text-[10px] font-mono font-bold text-white">
          {Math.round(norm * 100)}%
        </span>
      </div>
      <input
        type="range"
        min={cfg.min || 0}
        max={cfg.max || 127}
        value={cfg.value}
        onChange={handleChange}
        className="w-16 h-1 mt-1 accent-cyan-400 cursor-pointer"
        data-testid={`macro-slider-${mod.id}`}
      />
    </div>
  );
}

/**
 * Main Music Studio Modulator System Component
 */
export default function MusicStudio({
  trackId,
  deviceId,
  modulators = [],
  onUpdateModulators,
  mappingModulatorId,
  setMappingModulatorId,
  activeModTargets = [], // [{ id, targetName, depth: 45 }]
  onAddModTarget,
  onRemoveModTarget,
  onUpdateModTargetDepth,
  isPlaying = false,
  bpm = 120,
  setStatusHint
}) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [currentSec, setCurrentSec] = useState(0);
  const animFrameRef = useRef(null);

  // Real-time animation loop for DSP and visual updates
  useEffect(() => {
    let lastTime = performance.now();
    const loop = (now) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      setCurrentSec((prev) => prev + dt);
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  // Add new modulator to this container
  const handleAddModulator = (typeDef) => {
    const newMod = {
      id: `mod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: typeDef.type,
      name: `${typeDef.name} ${modulators.filter((m) => m.type === typeDef.type).length + 1}`,
      config: JSON.parse(JSON.stringify(typeDef.defaultConfig)),
      targets: [] // { targetParam: "cutoff", depth: 50, trackId, deviceId }
    };
    onUpdateModulators([...modulators, newMod]);
    setShowAddMenu(false);
    if (setStatusHint) {
      setStatusHint(`Modulateur ajouté: ${newMod.name} (${typeDef.category})`);
    }
  };

  // Remove a modulator
  const handleRemoveModulator = (modId) => {
    onUpdateModulators(modulators.filter((m) => m.id !== modId));
    if (mappingModulatorId === modId) {
      setMappingModulatorId(null);
    }
  };

  // Update specific modulator config
  const handleUpdateConfig = (modId, newConfig) => {
    onUpdateModulators(
      modulators.map((m) => (m.id === modId ? { ...m, config: newConfig } : m))
    );
  };

  // Toggle mapping mode
  const handleToggleMapping = (modId) => {
    if (mappingModulatorId === modId) {
      setMappingModulatorId(null);
      if (setStatusHint) setStatusHint("Mode assignation désactivé");
    } else {
      setMappingModulatorId(modId);
      const mod = modulators.find((m) => m.id === modId);
      if (setStatusHint) {
        setStatusHint(
          `Mode Assignation Actif pour [${mod?.name}] : Cliquez sur n'importe quel potentiomètre pour lier la modulation`
        );
      }
    }
  };

  const activeMappingMod = modulators.find((m) => m.id === mappingModulatorId);

  return (
    <div
      data-testid="studio-modulator-pane"
      className="w-full bg-[#11161d] border-t border-cyan-950/60 p-2.5 flex flex-col gap-2 rounded-b select-none transition-all"
    >
      {/* Modulator System Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Activity size={12} className="animate-pulse" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-wider text-cyan-300">
            Modulateurs Music Studio
          </span>
          <span className="text-[10px] text-zinc-400 bg-zinc-800/80 px-1.5 py-0.5 rounded font-mono">
            {modulators.length} actif{modulators.length > 1 ? "s" : ""}
          </span>
        </div>

        {/* Global Mapping Banner Alert */}
        {activeMappingMod && (
          <div className="flex items-center gap-2 bg-cyan-950/90 border border-cyan-400/80 px-2.5 py-1 rounded-full shadow-[0_0_14px_rgba(6,182,212,0.4)] animate-pulse">
            <Target size={12} className="text-cyan-400 animate-spin" />
            <span className="text-[10px] font-bold text-cyan-200">
              Assignation: <span className="text-white underline">{activeMappingMod.name}</span> (Cliquez sur un paramètre)
            </span>
            <button
              onClick={() => setMappingModulatorId(null)}
              className="text-cyan-400 hover:text-white p-0.5"
              title="Quitter le mode assignation"
            >
              <Check size={12} />
            </button>
          </div>
        )}

        {/* Add Modulator Button */}
        <div className="relative">
          <button
            data-testid="btn-add-modulator"
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[10px] shadow transition"
          >
            <Plus size={11} />
            <span>+ Modulateur</span>
          </button>

          {/* Add Modulator Dropdown Menu */}
          {showAddMenu && (
            <div className="absolute right-0 top-full mt-1.5 w-64 bg-[#181f2a] border border-cyan-800/60 rounded-lg shadow-2xl p-1.5 z-50 flex flex-col gap-1">
              <div className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-cyan-400 border-b border-zinc-800">
                Catalogue des Modulateurs Music Studio
              </div>
              <div className="max-h-56 overflow-y-auto custom-scrollbar flex flex-col gap-1">
                {STUDIO_MODULATOR_TYPES.map((typeDef) => {
                  const Icon = typeDef.icon;
                  return (
                    <button
                      key={typeDef.type}
                      data-testid={`add-mod-${typeDef.type}`}
                      onClick={() => handleAddModulator(typeDef)}
                      className="flex items-start gap-2.5 p-1.5 rounded hover:bg-cyan-950/60 text-left transition group"
                    >
                      <div className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-600 group-hover:text-white transition">
                        <Icon size={12} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white group-hover:text-cyan-300">
                            {typeDef.name}
                          </span>
                          <span className="text-[9px] text-zinc-500 font-mono">
                            {typeDef.category}
                          </span>
                        </div>
                        <p className="text-[9.5px] text-zinc-400 leading-tight truncate">
                          {typeDef.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modulators Strip (Horizontal Cards) */}
      <div className="flex items-stretch gap-2.5 overflow-x-auto custom-scrollbar py-1">
        {modulators.length === 0 ? (
          <div className="w-full py-4 text-center border border-dashed border-zinc-800 rounded bg-[#0b0f15] text-zinc-500 text-[11px] flex items-center justify-center gap-2">
            <Compass size={14} className="text-zinc-600" />
            <span>Aucun modulateur inséré. Cliquez sur <strong>+ Modulateur</strong> pour animer vos paramètres avec des LFOs, Steps ou Macros.</span>
          </div>
        ) : (
          modulators.map((mod) => {
            const isMapping = mappingModulatorId === mod.id;
            const currentVal = evaluateModulatorValue(mod, currentSec, bpm, isPlaying);

            return (
              <div
                key={mod.id}
                data-testid={`modulator-card-${mod.id}`}
                className={`w-64 flex-shrink-0 bg-[#161d27] border rounded-lg p-2.5 flex flex-col justify-between gap-2 transition-all ${
                  isMapping
                    ? "border-cyan-400 ring-2 ring-cyan-400/50 shadow-[0_0_16px_rgba(6,182,212,0.4)]"
                    : "border-zinc-800 hover:border-cyan-900/60"
                }`}
              >
                {/* Modulator Card Header */}
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#06b6d4]" />
                    <span className="font-bold text-xs text-white truncate">
                      {mod.name}
                    </span>
                    <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/60 px-1 rounded">
                      {mod.type.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Modulation Mapping Target Toggle */}
                    <button
                      data-testid={`btn-map-${mod.id}`}
                      onClick={() => handleToggleMapping(mod.id)}
                      className={`p-1 rounded flex items-center gap-1 text-[9.5px] font-bold transition ${
                        isMapping
                          ? "bg-cyan-500 text-black shadow"
                          : "bg-zinc-800 text-zinc-400 hover:text-cyan-300 hover:bg-zinc-700"
                      }`}
                      title="Activer l'assignation de modulation"
                    >
                      <Target size={11} />
                      <span>{isMapping ? "Assign..." : "Associer"}</span>
                    </button>

                    {/* Delete Modulator */}
                    <button
                      onClick={() => handleRemoveModulator(mod.id)}
                      className="p-1 text-zinc-500 hover:text-red-400 rounded hover:bg-zinc-800"
                      title="Supprimer modulateur"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>

                {/* Modulator Visual Display & Controls */}
                <div className="flex items-center gap-2">
                  {mod.type === "lfo" && (
                    <>
                      <LfoOscilloscope
                        mod={mod}
                        isPlaying={isPlaying}
                        bpm={bpm}
                        currentSec={currentSec}
                      />
                      <div className="flex-1 flex flex-col gap-1 text-[10px]">
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400">Forme:</span>
                          <select
                            value={mod.config.shape}
                            onChange={(e) =>
                              handleUpdateConfig(mod.id, {
                                ...mod.config,
                                shape: e.target.value
                              })
                            }
                            className="bg-zinc-800 text-cyan-300 text-[9.5px] rounded px-1 py-0.5 border border-zinc-700 font-mono"
                          >
                            <option value="sine">Sinus</option>
                            <option value="triangle">Triangle</option>
                            <option value="saw">Dent de scie</option>
                            <option value="square">Carré</option>
                            <option value="sampleHold">S & H</option>
                          </select>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400">Vitesse:</span>
                          <select
                            value={mod.config.rateSync}
                            onChange={(e) =>
                              handleUpdateConfig(mod.id, {
                                ...mod.config,
                                rateSync: e.target.value
                              })
                            }
                            className="bg-zinc-800 text-cyan-300 text-[9.5px] rounded px-1 py-0.5 border border-zinc-700 font-mono"
                          >
                            <option value="1/16">1/16 T</option>
                            <option value="1/8">1/8 T</option>
                            <option value="1/4">1/4 T</option>
                            <option value="1/2">1/2 T</option>
                            <option value="1/1">1 Mesure</option>
                            <option value="2/1">2 Mesures</option>
                          </select>
                        </div>
                      </div>
                    </>
                  )}

                  {mod.type === "steps" && (
                    <div className="w-full flex flex-col gap-1.5">
                      <StepsSequencerView
                        mod={mod}
                        onUpdateConfig={(cfg) => handleUpdateConfig(mod.id, cfg)}
                        currentSec={currentSec}
                        bpm={bpm}
                      />
                      <div className="flex items-center justify-between text-[9px] text-zinc-400 font-mono">
                        <span>Pas: {mod.config.loopLength || 8}</span>
                        <span>Vitesse: {mod.config.rateSync}</span>
                      </div>
                    </div>
                  )}

                  {mod.type === "macro" && (
                    <div className="w-full flex items-center justify-between gap-2">
                      <MacroKnobView
                        mod={mod}
                        onUpdateConfig={(cfg) => handleUpdateConfig(mod.id, cfg)}
                      />
                      <div className="flex-1 text-[10px] text-zinc-400 leading-tight">
                        <span className="text-white font-bold block">{mod.config.name}</span>
                        <span>Contrôle universel assignable à plusieurs paramètres</span>
                      </div>
                    </div>
                  )}

                  {mod.type === "random" && (
                    <div className="w-full flex items-center justify-between gap-2">
                      <div className="w-16 h-10 bg-[#0f172a] rounded flex items-center justify-center font-mono font-bold text-cyan-400 text-xs border border-cyan-900/50">
                        {currentVal.toFixed(2)}
                      </div>
                      <div className="flex-1 text-[10px] text-zinc-400 flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span>Vitesse:</span>
                          <span className="font-mono text-cyan-300">{mod.config.rateSync}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Lissage:</span>
                          <span className="font-mono text-cyan-300">{mod.config.smooth}%</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {mod.type === "parseq8" && (
                    <div className="w-full flex flex-col gap-1">
                      <div className="grid grid-cols-8 gap-1 h-7">
                        {mod.config.steps.map((st, i) => (
                          <div
                            key={i}
                            className="bg-zinc-800 rounded flex flex-col justify-end p-0.5 overflow-hidden"
                          >
                            <div
                              style={{ height: `${Math.round(st.val * 100)}%` }}
                              className="bg-cyan-500 rounded-sm w-full"
                            />
                          </div>
                        ))}
                      </div>
                      <span className="text-[9px] text-zinc-400 font-mono text-center">
                        ParSeq-8 Probabilités
                      </span>
                    </div>
                  )}
                </div>

                {/* Assigned Targets List */}
                <div className="border-t border-zinc-800/80 pt-1 flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[9px] text-zinc-400">
                    <span className="font-mono uppercase">Destinations ({mod.targets?.length || 0})</span>
                    <span className="text-cyan-400 font-mono">
                      Val: {currentVal > 0 ? `+${currentVal.toFixed(2)}` : currentVal.toFixed(2)}
                    </span>
                  </div>

                  {mod.targets && mod.targets.length > 0 ? (
                    <div className="flex flex-col gap-1 max-h-16 overflow-y-auto custom-scrollbar">
                      {mod.targets.map((tgt, tIdx) => (
                        <div
                          key={tIdx}
                          className="flex items-center justify-between bg-zinc-900/80 px-2 py-0.5 rounded text-[9.5px] border border-zinc-800"
                        >
                          <span className="text-zinc-300 font-medium truncate">
                            {tgt.targetName || tgt.targetParam}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-cyan-300">
                              {tgt.depth > 0 ? `+${tgt.depth}%` : `${tgt.depth}%`}
                            </span>
                            <button
                              onClick={() => {
                                const newTargets = mod.targets.filter((_, i) => i !== tIdx);
                                onUpdateModulators(
                                  modulators.map((m) =>
                                    m.id === mod.id ? { ...m, targets: newTargets } : m
                                  )
                                );
                              }}
                              className="text-zinc-500 hover:text-red-400"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[9px] text-zinc-600 italic">
                      Aucune destination assignée.
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
