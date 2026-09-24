"use client";

import React, { useState } from "react";
import {
  Info,
  X,
  Volume2,
  VolumeX,
  Sliders,
  SlidersHorizontal,
  Circle,
  Power,
  RotateCcw,
  Palette,
  Layers,
  Music,
  Clock,
  Sparkles,
  Repeat,
  Compass,
  ArrowRight,
  TrendingUp,
  Activity
} from "lucide-react";

/**
 * Music Studio Panneau Inspecteur Universel Contextuel
 * Conforme au Chapitre 3.3 (p. 91-93), Chapitre 5.4 (p. 167-172),
 * Chapitre 11.4 (p. 380-387) et Chapitre 15.1.1 (p. 447-453 - Télécommandes).
 */
export default function MusicStudioInspectorPanel({
  isOpen,
  onClose,
  selectedTrack,
  selectedClip,
  onUpdateTrack,
  onUpdateClip,
  onToggleTrackActive,
  onBounceInPlace,
  onSliceToDrumMachine,
  onOpenAudioWarp,
  onOpenRadialMenu,
  setStatusHint
}) {
  const [inspectorTab, setInspectorTab] = useState("track"); // 'track' | 'clip' | 'remotes'

  // Palette officielle de 8 couleurs Music Studio (p. 89)
  const STUDIO_PALETTE = [
    { name: "Or Logo", hex: "#df9c43" },
    { name: "Ambre", hex: "#f59e0b" },
    { name: "Émeraude", hex: "#10b981" },
    { name: "Cyan", hex: "#06b6d4" },
    { name: "Bleu", hex: "#3b82f6" },
    { name: "Violet", hex: "#8b5cf6" },
    { name: "Bronze", hex: "#c98837" },
    { name: "Gris", hex: "#71717a" }
  ];

  // 8 Macros de Télécommandes de Piste (Section 15.1.1, p. 447)
  const [remoteKnobs, setRemoteKnobs] = useState({
    cutoff: 75,
    resonance: 30,
    drive: 15,
    mix: 80,
    space: 45,
    speed: 50,
    depth: 60,
    output: 0
  });

  const handleKnobChange = (param, delta) => {
    setRemoteKnobs((prev) => {
      const val = Math.max(0, Math.min(100, (prev[param] || 0) + delta));
      if (setStatusHint) {
        setStatusHint(`Télécommande "${param.toUpperCase()}": ${Math.round(val)}%`);
      }
      return { ...prev, [param]: val };
    });
  };

  if (!isOpen) return null;

  const trackActive = selectedTrack?.active !== false;

  return (
    <div
      data-testid="music-studio-inspector-panel"
      className="w-64 bg-[#181818] border-r border-[#2b2b2b] flex flex-col flex-shrink-0 z-30 select-none overflow-hidden text-xs text-zinc-300 font-sans shadow-lg"
    >
      {/* ── 1. Inspector Header & Context Switcher ── */}
      <div className="h-9 bg-[#141414] border-b border-[#292929] px-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-1.5 font-bold text-white text-[11px] tracking-wider">
          <Info size={13} className="text-[#df9c43]" />
          <span>INSPECTEUR</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Tabs: Piste / Clip / Télécommandes */}
          <div className="flex items-center bg-[#141414] rounded-lg p-0.5 border border-[#2d2d2d] gap-1">
            <button
              onClick={() => setInspectorTab("track")}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase transition ${
                inspectorTab === "track"
                  ? "bg-[#241808] border border-[#df9c43] text-[#eaaf5d] shadow-[0_0_6px_rgba(223,156,67,0.3)]"
                  : "text-zinc-400 hover:text-white border border-transparent"
              }`}
            >
              Piste
            </button>
            <button
              onClick={() => setInspectorTab("clip")}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase transition ${
                inspectorTab === "clip"
                  ? "bg-[#241808] border border-[#df9c43] text-[#eaaf5d] shadow-[0_0_6px_rgba(223,156,67,0.3)]"
                  : "text-zinc-400 hover:text-white border border-transparent"
              }`}
            >
              Clip
            </button>
            <button
              onClick={() => setInspectorTab("remotes")}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase transition ${
                inspectorTab === "remotes"
                  ? "bg-[#241808] border border-[#df9c43] text-[#eaaf5d] shadow-[0_0_6px_rgba(223,156,67,0.3)]"
                  : "text-zinc-400 hover:text-white border border-transparent"
              }`}
            >
              Macros
            </button>
          </div>

          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded hover:bg-white/10 transition ml-1"
            title="Fermer l'Inspecteur [Ctrl+I]"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* ── 2. Inspector Body ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">
        {/* ════════════════════════════════════════════════════════════
            MODE PISTE (Section 3.3, p. 91-93)
        ════════════════════════════════════════════════════════════ */}
        {inspectorTab === "track" && (
          <div className="space-y-4">
            {/* Header: Track Name, Color Swatch & Power Toggle */}
            <div className="bg-[#1f1f1f] p-2.5 rounded-lg border border-[#2d2d2d] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-zinc-400">Piste Sélectionnée</span>
                {/* Deactivate / Activate Button (Alt+A - Section 3.2.6, p. 90) */}
                <button
                  onClick={() => onToggleTrackActive && onToggleTrackActive(selectedTrack?.id)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 transition ${
                    trackActive
                      ? "text-emerald-400 bg-emerald-950/40 border border-emerald-800/50"
                      : "text-zinc-500 bg-zinc-900 border border-zinc-800"
                  }`}
                  title="Mettre en / hors service la piste [Alt+A]"
                >
                  <Power size={10} />
                  <span>{trackActive ? "EN SERVICE" : "HORS SERVICE"}</span>
                </button>
              </div>

              {/* Editable Name */}
              <input
                type="text"
                value={selectedTrack?.name || "Piste 1"}
                onChange={(e) =>
                  onUpdateTrack && onUpdateTrack(selectedTrack?.id, { name: e.target.value })
                }
                className="w-full bg-[#121212] border border-[#333333] rounded px-2 py-1 text-xs text-white font-bold focus:outline-none focus:border-[#df9c43]"
              />

              {/* Color Swatch Picker (p. 89) */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-zinc-400">Couleur :</span>
                <div className="flex items-center gap-1">
                  {STUDIO_PALETTE.map((c) => (
                    <button
                      key={c.hex}
                      onClick={() =>
                        onUpdateTrack && onUpdateTrack(selectedTrack?.id, { color: c.hex })
                      }
                      style={{ backgroundColor: c.hex }}
                      className={`w-3.5 h-3.5 rounded-full transition transform hover:scale-125 ${
                        selectedTrack?.color === c.hex
                          ? "ring-2 ring-white ring-offset-1 ring-offset-[#1f1f1f]"
                          : ""
                      }`}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Tranche de canal: Volume, Pan, Solo, Mute, Rec */}
            <div className="bg-[#1f1f1f] p-2.5 rounded-lg border border-[#2d2d2d] space-y-3">
              <span className="text-[10px] uppercase font-bold text-zinc-400">Tranche de Canal (Section 7.1.8)</span>

              {/* Volume & Meter */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-zinc-400">Volume</span>
                  <span className="text-white font-bold">
                    {selectedTrack?.volume !== undefined ? `${selectedTrack.volume} dB` : "-5.6 dB"}
                  </span>
                </div>
                <input
                  type="range"
                  min="-60"
                  max="6"
                  step="0.5"
                  value={selectedTrack?.volume !== undefined ? selectedTrack.volume : -5.6}
                  onChange={(e) =>
                    onUpdateTrack &&
                    onUpdateTrack(selectedTrack?.id, { volume: parseFloat(e.target.value) })
                  }
                  className="w-full accent-[#df9c43] h-1.5 bg-[#121212] rounded appearance-none cursor-pointer"
                />
              </div>

              {/* Pan Knob */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-zinc-400">Panoramique</span>
                  <span className="text-white">
                    {selectedTrack?.pan !== undefined
                      ? selectedTrack.pan === 0
                        ? "Centre"
                        : selectedTrack.pan > 0
                        ? `R ${selectedTrack.pan}%`
                        : `L ${Math.abs(selectedTrack.pan)}%`
                      : "Centre"}
                  </span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  step="5"
                  value={selectedTrack?.pan || 0}
                  onChange={(e) =>
                    onUpdateTrack &&
                    onUpdateTrack(selectedTrack?.id, { pan: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-[#df9c43] h-1.5 bg-[#121212] rounded appearance-none cursor-pointer"
                />
              </div>

              {/* Mute, Solo, Rec Buttons */}
              <div className="flex items-center gap-1.5 pt-1">
                <button
                  onClick={() =>
                    onUpdateTrack && onUpdateTrack(selectedTrack?.id, { solo: !selectedTrack?.solo })
                  }
                  className={`flex-1 py-1 rounded text-[10px] font-bold font-mono transition ${
                    selectedTrack?.solo
                      ? "bg-amber-500 text-black shadow-sm font-extrabold"
                      : "bg-[#141414] text-zinc-400 hover:text-white border border-[#2d2d2d]"
                  }`}
                >
                  SOLO
                </button>
                <button
                  onClick={() =>
                    onUpdateTrack && onUpdateTrack(selectedTrack?.id, { mute: !selectedTrack?.mute })
                  }
                  className={`flex-1 py-1 rounded text-[10px] font-bold font-mono transition ${
                    selectedTrack?.mute
                      ? "bg-red-500 text-white shadow-sm font-extrabold"
                      : "bg-[#141414] text-zinc-400 hover:text-white border border-[#2d2d2d]"
                  }`}
                >
                  MUTE
                </button>
                <button
                  onClick={() =>
                    onUpdateTrack && onUpdateTrack(selectedTrack?.id, { armed: !selectedTrack?.armed })
                  }
                  className={`flex-1 py-1 rounded text-[10px] font-bold font-mono transition ${
                    selectedTrack?.armed
                      ? "bg-red-600 text-white shadow-sm font-extrabold"
                      : "bg-[#141414] text-zinc-400 hover:text-white border border-[#2d2d2d]"
                  }`}
                >
                  REC
                </button>
              </div>
            </div>

            {/* Routages E/S & Départs Auxiliaires */}
            <div className="bg-[#1f1f1f] p-2.5 rounded-lg border border-[#2d2d2d] space-y-2.5 text-[11px]">
              <span className="text-[10px] uppercase font-bold text-zinc-400">Routages des E/S (Section 7.1.7)</span>

              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Entrée :</span>
                <span className="bg-[#121212] px-2 py-0.5 rounded border border-[#333333] text-white font-mono text-[10px]">
                  Stéréo In 1+2
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Sortie :</span>
                <span className="bg-[#121212] px-2 py-0.5 rounded border border-[#333333] text-white font-mono text-[10px]">
                  Master Out
                </span>
              </div>

              <div className="border-t border-[#292929] pt-2 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Départ FX 1 (Reverb) :</span>
                  <span className="font-mono text-zinc-300">-12.0 dB</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Départ FX 2 (Delay) :</span>
                  <span className="font-mono text-zinc-300">-18.5 dB</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            MODE CLIP (Section 5.4, p. 167-172)
        ════════════════════════════════════════════════════════════ */}
        {inspectorTab === "clip" && (
          <div className="space-y-4">
            <div className="bg-[#1f1f1f] p-2.5 rounded-lg border border-[#2d2d2d] space-y-2">
              <span className="text-[10px] uppercase font-bold text-zinc-400">Propriétés du Clip (p. 168)</span>

              <input
                type="text"
                defaultValue={selectedClip?.name || "Clip S2 (4 mesures)"}
                className="w-full bg-[#121212] border border-[#333333] rounded px-2 py-1 text-xs text-white font-bold"
              />

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
                <div className="bg-[#141414] p-2 rounded border border-[#2d2d2d]">
                  <span className="text-zinc-500 text-[9px] uppercase block">Position</span>
                  <span className="text-white font-bold">Mesure {selectedClip?.startBar || 1}.1</span>
                </div>
                <div className="bg-[#141414] p-2 rounded border border-[#2d2d2d]">
                  <span className="text-zinc-500 text-[9px] uppercase block">Longueur</span>
                  <span className="text-white font-bold">{selectedClip?.bars || 4} Mesures</span>
                </div>
              </div>
            </div>

            {/* Section Bouclage & Fondus */}
            <div className="bg-[#1f1f1f] p-2.5 rounded-lg border border-[#2d2d2d] space-y-2.5 text-[11px]">
              <span className="text-[10px] uppercase font-bold text-zinc-400">Bouclage & Fondus (p. 169)</span>

              <div className="flex items-center justify-between">
                <span className="text-zinc-300">Bouclage (Loop) :</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 font-bold border border-emerald-800/50 text-[10px]">
                  ACTIVÉ
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Longueur boucle :</span>
                <span className="font-mono text-white font-bold">4.0.0 Mesures</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Fondus audio (Fades) :</span>
                <span className="font-mono text-zinc-300">12 ms Bézier</span>
              </div>
            </div>

            {/* Action Suivante (Next Action - Section 6.2.5.3, p. 198) */}
            <div className="bg-[#1f1f1f] p-2.5 rounded-lg border border-[#2d2d2d] space-y-2 text-[11px]">
              <span className="text-[10px] uppercase font-bold text-zinc-400">Action Suivante (p. 198)</span>

              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Après 4 mesures :</span>
                <select className="bg-[#121212] border border-[#333333] rounded px-2 py-0.5 text-white text-[10px]">
                  <option value="next">Lire le clip suivant</option>
                  <option value="loop">Reboucler ce clip</option>
                  <option value="random">Lire un clip aléatoire</option>
                  <option value="stop">Arrêter la lecture</option>
                </select>
              </div>
            </div>

            {/* ── Audio Warp & Stretching 6 Modes (Chapitre 9 & 10) ── */}
            <div className="bg-[#1f1f1f] p-2.5 rounded-lg border border-[#2d2d2d] space-y-2.5 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-zinc-400 flex items-center gap-1">
                  <Activity size={12} className="text-[#df9c43]" />
                  <span>Audio Warp & Stretching (p. 271)</span>
                </span>
                <span className="px-1.5 py-0.2 rounded bg-cyan-950/70 border border-cyan-800/60 text-cyan-300 font-mono text-[9px]">
                  {selectedClip?.warpMode || "Stretch"}
                </span>
              </div>

              {/* 6 Modes Selector */}
              <div>
                <span className="text-zinc-400 text-[10px] block mb-1">Mode d'étirement :</span>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { id: "stretch", label: "Stretch" },
                    { id: "stretch_hd", label: "Stretch HD" },
                    { id: "slice", label: "Slice" },
                    { id: "repitch", label: "Repitch" },
                    { id: "raw", label: "Raw" },
                    { id: "cycle", label: "Cycle" }
                  ].map((m) => {
                    const active = (selectedClip?.warpMode || "stretch") === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() =>
                          onUpdateClip &&
                          onUpdateClip(selectedClip?.id, { warpMode: m.id })
                        }
                        className={`py-1 rounded text-[10px] font-bold transition text-center ${
                          active
                            ? "bg-[#241808] border border-[#df9c43] text-[#eaaf5d] shadow-[0_0_6px_rgba(223,156,67,0.3)] font-extrabold"
                            : "bg-[#141414] text-zinc-400 hover:text-white border border-[#2d2d2d]"
                        }`}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pitch Transpose & Fine Tuning */}
              <div className="space-y-1.5 pt-1 border-t border-[#292929]">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Transposition (Pitch) :</span>
                  <span className="font-mono text-white font-bold">
                    {(selectedClip?.pitchSemitones || 0) > 0
                      ? `+${selectedClip?.pitchSemitones} st`
                      : `${selectedClip?.pitchSemitones || 0} st`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-24"
                  max="24"
                  step="1"
                  value={selectedClip?.pitchSemitones || 0}
                  onChange={(e) =>
                    onUpdateClip &&
                    onUpdateClip(selectedClip?.id, { pitchSemitones: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-[#df9c43] h-1.5 bg-[#121212] rounded appearance-none cursor-pointer"
                />

                <div className="flex items-center justify-between text-[10px] pt-1">
                  <span className="text-zinc-400">Accord Fin (Fine) :</span>
                  <span className="font-mono text-zinc-300">
                    {selectedClip?.fineCents || 0} ct
                  </span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  step="5"
                  value={selectedClip?.fineCents || 0}
                  onChange={(e) =>
                    onUpdateClip &&
                    onUpdateClip(selectedClip?.id, { fineCents: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-cyan-400 h-1.5 bg-[#121212] rounded appearance-none cursor-pointer"
                />
              </div>

              {/* Formants & Grain Size */}
              <div className="flex items-center justify-between pt-1 border-t border-[#292929]">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedClip?.preserveFormants ?? true}
                    onChange={(e) =>
                      onUpdateClip &&
                      onUpdateClip(selectedClip?.id, { preserveFormants: e.target.checked })
                    }
                    className="rounded accent-[#df9c43]"
                  />
                  <span className="text-[10px] text-zinc-300 font-bold">Conserver Formants</span>
                </label>

                <div className="flex items-center gap-1 text-[10px]">
                  <span className="text-zinc-400">Grain :</span>
                  <span className="font-mono text-cyan-400 font-bold">
                    {selectedClip?.grainSizeMs || 45} ms
                  </span>
                </div>
              </div>

              {/* Actions Rapides Audio Warp */}
              <div className="pt-2 border-t border-[#292929] space-y-1.5">
                <button
                  onClick={() => onOpenAudioWarp && onOpenAudioWarp(selectedClip)}
                  className="w-full py-1.5 rounded bg-[#202020] hover:bg-[#282828] text-white border border-[#383838] text-[10px] font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <Activity size={12} className="text-[#df9c43]" />
                  <span>Ouvrir Éditeur Audio Warp & Marqueurs</span>
                </button>

                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => onBounceInPlace && onBounceInPlace(selectedClip?.id, selectedTrack?.id)}
                    className="py-1.5 px-1 rounded bg-[#241808] hover:bg-[#2d1e0d] border border-[#df9c43] text-[#eaaf5d] hover:text-[#f5c277] text-[9.5px] font-bold flex items-center justify-center gap-1 transition shadow-[0_0_8px_rgba(223,156,67,0.25)]"
                    title="Rendre le clip sur place (Bounce in place)"
                  >
                    <span>⚡ Bounce</span>
                  </button>
                  <button
                    onClick={() => onSliceToDrumMachine && onSliceToDrumMachine(selectedClip?.id, selectedTrack?.id)}
                    className="py-1.5 px-1 rounded bg-[#1e293b] hover:bg-[#334155] text-cyan-300 border border-cyan-800/40 text-[9.5px] font-bold flex items-center justify-center gap-1 transition"
                    title="Découper aux transitoires vers une Drum Machine"
                  >
                    <span>🥁 Slice</span>
                  </button>
                  <button
                    data-testid="btn-inspector-radial-menu"
                    onClick={() => onOpenRadialMenu && onOpenRadialMenu(selectedClip, selectedTrack)}
                    className="py-1.5 px-1 rounded bg-[#241808] hover:bg-[#2d1e0d] border border-[#df9c43] text-[#eaaf5d] hover:text-[#f5c277] text-[9.5px] font-bold flex items-center justify-center gap-1 transition shadow-[0_0_8px_rgba(223,156,67,0.25)]"
                    title="Ouvrir le menu radial tactile à 8 actions (Chapitre 18)"
                  >
                    <span>⭕ Radial</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            MODE TÉLÉCOMMANDES (Section 15.1.1, p. 447-453)
        ════════════════════════════════════════════════════════════ */}
        {inspectorTab === "remotes" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-zinc-400">
                15.1.1. Télécommandes de Piste (8 Macros)
              </span>
              <span className="text-[9px] font-mono text-[#df9c43]">Page 1 / 8</span>
            </div>

            {/* 2x4 Grid of Macro Rotary Encoders */}
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { key: "cutoff", name: "Cutoff", unit: "Hz", val: `${Math.round(20 + remoteKnobs.cutoff * 180)}` },
                { key: "resonance", name: "Resonance", unit: "%", val: `${Math.round(remoteKnobs.resonance)}` },
                { key: "drive", name: "Drive", unit: "dB", val: `+${(remoteKnobs.drive * 0.24).toFixed(1)}` },
                { key: "mix", name: "Mix", unit: "%", val: `${Math.round(remoteKnobs.mix)}` },
                { key: "space", name: "Space", unit: "%", val: `${Math.round(remoteKnobs.space)}` },
                { key: "speed", name: "Speed", unit: "Hz", val: `${(remoteKnobs.speed * 0.1).toFixed(1)}` },
                { key: "depth", name: "Depth", unit: "%", val: `${Math.round(remoteKnobs.depth)}` },
                { key: "output", name: "Output", unit: "dB", val: `${(remoteKnobs.output * 0.12 - 6).toFixed(1)}` }
              ].map((m) => (
                <div
                  key={m.key}
                  className="bg-[#1f1f1f] border border-[#2d2d2d] rounded-lg p-2 flex flex-col items-center justify-center space-y-1 group hover:border-[#df9c43]/50 transition"
                >
                  <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">
                    {m.name}
                  </span>

                  {/* Circular Rotary Visualizer */}
                  <div
                    onClick={() => handleKnobChange(m.key, 10)}
                    className="w-10 h-10 rounded-full bg-[#121212] border-2 border-[#333333] relative flex items-center justify-center cursor-pointer group-hover:border-[#df9c43] transition"
                  >
                    <div
                      style={{
                        transform: `rotate(${((remoteKnobs[m.key] || 50) / 100) * 270 - 135}deg)`
                      }}
                      className="absolute top-1/2 left-1/2 w-0.5 h-3 bg-[#df9c43] origin-top"
                    />
                    <span className="text-[9px] font-mono text-zinc-300 z-10">
                      {m.val}
                    </span>
                  </div>

                  <span className="text-[8px] font-mono text-zinc-500">{m.unit}</span>
                </div>
              ))}
            </div>

            <div className="bg-[#141414] p-2 rounded-lg border border-[#262626] text-[10px] text-zinc-400 leading-normal">
              💡 Cliquez sur un potentiomètre pour ajuster sa valeur ou affectez des contrôleurs MIDI via clic droit.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
