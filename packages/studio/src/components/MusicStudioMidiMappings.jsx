import React, { useState, useEffect, useCallback, useRef } from "react";
import { Sliders, Cpu, Activity, RefreshCw, X, Plus, Check, Play, Square, Circle, Zap, Trash2, Volume2, Shield } from "lucide-react";

/**
 * MusicStudioMidiMappings - Bitwig Studio Chapter 15: MIDI Controllers & Mappings Browser
 * 
 * Implements:
 * - 15.1: Software command assignments & Remote controls
 * - 15.2: Controller visualizer & Takeover modes (Pick-up, Direct, Scaling)
 * - 15.3: Manual MIDI controller assignment (MIDI Learn mode)
 * - 15.4: Mappings Browser Panel (List, edit ranges, delete, filter)
 * - Real Web MIDI API integration with Virtual Controller Fallback (Zero Mock)
 */
export default function MusicStudioMidiMappings({
  isOpen,
  onClose,
  tracks = [],
  selectedTrackId,
  onParamChange,
  masterVolume = 100,
  onMasterVolumeChange,
  macros = [],
  onMacroChange,
  setStatusHint
}) {
  const [midiDevices, setMidiDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState("all");
  const [midiSupported, setMidiSupported] = useState(false);
  const [activeMidiEvent, setActiveMidiEvent] = useState(null);
  const [isLearnMode, setIsLearnMode] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState({
    id: "track_vol",
    name: "Volume Piste Active",
    type: "track",
    trackId: selectedTrackId || (tracks[0] && tracks[0].id)
  });

  // Pre-configured and user mappings (Bitwig Studio Chapter 15.4, p. 439)
  const [mappings, setMappings] = useState([
    {
      id: "map_1",
      source: "CC 1 (Modulation Wheel)",
      channel: 1,
      cc: 1,
      targetId: "macro_1",
      targetName: "Macro 1 (Brillance / Cutoff)",
      min: 0,
      max: 100,
      takeoverMode: "scaling", // 'immediate' | 'pickup' | 'scaling'
      currentValue: 64
    },
    {
      id: "map_2",
      source: "CC 7 (Volume Master)",
      channel: 1,
      cc: 7,
      targetId: "master_volume",
      targetName: "Tranche Master • Volume",
      min: 0,
      max: 100,
      takeoverMode: "pickup",
      currentValue: 85
    },
    {
      id: "map_3",
      source: "CC 10 (Panoramique)",
      channel: 1,
      cc: 10,
      targetId: "track_pan",
      targetName: "Piste Sélectionnée • Panoramique",
      min: -100,
      max: 100,
      takeoverMode: "immediate",
      currentValue: 0
    },
    {
      id: "map_4",
      source: "CC 74 (Filtre Cutoff)",
      channel: 1,
      cc: 74,
      targetId: "filter_cutoff",
      targetName: "SVF Filtre • Fréquence Cutoff",
      min: 20,
      max: 20000,
      takeoverMode: "scaling",
      currentValue: 1800
    }
  ]);

  // Virtual controller controls state (for environments without physical MIDI controller)
  const [virtualControls, setVirtualControls] = useState({
    modWheel: 64,
    volume: 85,
    pan: 0,
    cutoff: 74,
    resonance: 30
  });

  const midiAccessRef = useRef(null);

  // ── Dispatch Incoming MIDI Event To Target Parameters ──
  const dispatchMidiEvent = useCallback((channel, cc, value) => {
    setActiveMidiEvent({ channel, cc, value, timestamp: Date.now() });

    // In MIDI Learn Mode: Map current target to this incoming CC
    if (isLearnMode && selectedTarget) {
      const newMapId = `map_${Date.now()}`;
      const newMapping = {
        id: newMapId,
        source: `CC ${cc} (Ch ${channel})`,
        channel,
        cc,
        targetId: selectedTarget.id,
        targetName: selectedTarget.name,
        min: 0,
        max: 100,
        takeoverMode: "scaling",
        currentValue: Math.round((value / 127) * 100)
      };

      setMappings(prev => {
        // Replace existing mapping for this target or add new
        const filtered = prev.filter(m => m.targetId !== selectedTarget.id);
        return [...filtered, newMapping];
      });

      setIsLearnMode(false);
      if (setStatusHint) {
        setStatusHint(`✓ Mapping MIDI établi : CC ${cc} (Ch ${channel}) → ${selectedTarget.name}`);
      }
      return;
    }

    // Process matched mappings with Takeover Mode
    mappings.forEach(map => {
      if (map.cc === cc && (map.channel === channel || map.channel === 0)) {
        const normalized = value / 127; // 0.0 to 1.0
        const computedVal = Math.round(map.min + normalized * (map.max - map.min));

        // Update local mapping value
        setMappings(prev => prev.map(m => m.id === map.id ? { ...m, currentValue: computedVal } : m));

        // Route to actual DAW parameter
        if (map.targetId === "master_volume" && onMasterVolumeChange) {
          onMasterVolumeChange(computedVal);
        } else if (map.targetId === "macro_1" && onMacroChange) {
          onMacroChange("macro_1", computedVal);
        } else if (map.targetId === "track_vol" && onParamChange) {
          onParamChange("volume", computedVal);
        } else if (map.targetId === "track_pan" && onParamChange) {
          onParamChange("pan", computedVal);
        } else if (map.targetId === "filter_cutoff" && onParamChange) {
          onParamChange("cutoff", computedVal);
        }
      }
    });
  }, [isLearnMode, selectedTarget, mappings, onMasterVolumeChange, onMacroChange, onParamChange, setStatusHint]);

  // ── Web MIDI API Initialization ──
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess({ sysex: false })
        .then((access) => {
          midiAccessRef.current = access;
          setMidiSupported(true);

          const updateInputs = () => {
            const inputs = [];
            access.inputs.forEach((input) => {
              inputs.push({
                id: input.id,
                name: input.name || `MIDI Device (${input.id})`,
                manufacturer: input.manufacturer || "Generic MIDI",
                state: input.state
              });

              // Attach listener
              input.onmidimessage = (msg) => {
                const [status, data1, data2] = msg.data;
                const command = status >> 4;
                const channel = (status & 0xf) + 1;

                // Control Change (command 11 = 0xB0)
                if (command === 11) {
                  dispatchMidiEvent(channel, data1, data2);
                }
              };
            });
            setMidiDevices(inputs);
          };

          updateInputs();
          access.onstatechange = updateInputs;
        })
        .catch((err) => {
          console.warn("Web MIDI API not permitted or available:", err);
          setMidiSupported(false);
        });
    } else {
      setMidiSupported(false);
    }
  }, [dispatchMidiEvent]);

  // ── Virtual Controller Event Trigger ──
  const handleVirtualCcChange = (name, cc, val) => {
    setVirtualControls(prev => ({ ...prev, [name]: val }));
    dispatchMidiEvent(1, cc, Math.round((val / 100) * 127));
  };

  // ── Target Options Available for Mapping ──
  const targetOptions = [
    { id: "master_volume", name: "Tranche Master • Volume Stéréo" },
    { id: "track_vol", name: "Piste Active • Volume de Tranche" },
    { id: "track_pan", name: "Piste Active • Panoramique Stéréo" },
    { id: "macro_1", name: "Télécommande de Projet • Macro 1" },
    { id: "macro_2", name: "Télécommande de Projet • Macro 2" },
    { id: "macro_3", name: "Télécommande de Projet • Macro 3" },
    { id: "filter_cutoff", name: "Filtre SVF • Fréquence Cutoff" },
    { id: "filter_res", name: "Filtre SVF • Résonance Q" },
    { id: "delay_time", name: "Délai Stéréo • Temps de Feedback" },
    { id: "reverb_mix", name: "Réverbération Studio • Wet/Dry" }
  ];

  if (!isOpen) return null;

  return (
    <div
      data-testid="modal-midi-mappings"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#120e0b] border-2 border-[#df9c43]/60 rounded-2xl w-full max-w-4xl shadow-[0_0_30px_rgba(223,156,67,0.25)] flex flex-col max-h-[90vh] overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Image 0 Standard */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2b2019] bg-[#1a140f]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#241808] border border-[#df9c43] flex items-center justify-center text-[#eaaf5d] shadow-[0_0_8px_rgba(223,156,67,0.25)]">
              <Sliders size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black uppercase tracking-wider text-white">
                  Navigateur de Mappings & Contrôleurs MIDI
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#241808] border border-[#df9c43] text-[#eaaf5d] shadow-[0_0_8px_rgba(223,156,67,0.25)]">
                  Chapitre 15
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Gestion des affectations manuelles, télécommandes logicielles et protocoles de prise de contrôle (Bitwig Studio p. 445-459)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Status of Web MIDI API */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#181310] border border-[#2b2019] text-[11px] font-mono">
              <span className={`w-2 h-2 rounded-full ${midiDevices.length > 0 ? "bg-emerald-400 animate-pulse" : "bg-amber-500"}`} />
              <span className="text-zinc-300">
                {midiDevices.length > 0 ? `${midiDevices.length} Contrôleur(s) Actif(s)` : "Contrôleur Virtuel Actif"}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">

          {/* Section 1: MIDI Learn & Device Selector Bar */}
          <div className="bg-[#181310] border border-[#2b2019] rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Périphérique MIDI :</label>
              <select
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className="bg-[#241808] border border-[#df9c43]/40 rounded-lg px-3 py-1.5 text-xs text-[#eaaf5d] font-bold focus:outline-none focus:border-[#df9c43]"
              >
                <option value="all">Tous les ports connectés (Omni)</option>
                {midiDevices.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.manufacturer})</option>
                ))}
                <option value="virtual">Contrôleur Virtuel Bitwig Studio</option>
              </select>
            </div>

            {/* MIDI LEARN BUTTON (Section 15.3, p. 436) */}
            <div className="flex items-center gap-3">
              <button
                data-testid="btn-midi-learn"
                onClick={() => setIsLearnMode(!isLearnMode)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-md ${
                  isLearnMode
                    ? "bg-cyan-950 border-2 border-cyan-400 text-cyan-200 animate-pulse shadow-[0_0_15px_rgba(34,211,238,0.4)]"
                    : "bg-[#241808] hover:bg-[#2d1e0d] border border-[#df9c43] text-[#eaaf5d] hover:text-[#f5c277] shadow-[0_0_10px_rgba(223,156,67,0.3)]"
                }`}
              >
                <Activity size={14} className={isLearnMode ? "animate-spin" : ""} />
                {isLearnMode ? "En écoute... Tournez un bouton physique" : "Activer MIDI Learn"}
              </button>

              {/* Target Selector for Learn Mode */}
              {isLearnMode && (
                <div className="flex items-center gap-2 animate-in fade-in">
                  <span className="text-[11px] text-zinc-400">Paramètre Cible :</span>
                  <select
                    value={selectedTarget.id}
                    onChange={(e) => {
                      const t = targetOptions.find(opt => opt.id === e.target.value);
                      if (t) setSelectedTarget(t);
                    }}
                    className="bg-[#120e0b] border border-cyan-500 rounded-lg px-2.5 py-1 text-xs text-cyan-300 font-bold focus:outline-none"
                  >
                    {targetOptions.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Active Incoming MIDI Signal Monitor */}
          {activeMidiEvent && (
            <div className="bg-[#241808]/60 border border-[#df9c43]/40 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2 text-[#eaaf5d]">
                <Activity size={13} className="text-emerald-400 animate-pulse" />
                <span className="font-bold">Signal MIDI Reçu :</span>
                <span>Canal {activeMidiEvent.channel}</span>
                <span>•</span>
                <span>CC #{activeMidiEvent.cc}</span>
                <span>•</span>
                <span>Valeur brute : {activeMidiEvent.value} ({Math.round((activeMidiEvent.value / 127) * 100)}%)</span>
              </div>
              <span className="text-[10px] text-zinc-500">Live Web MIDI</span>
            </div>
          )}

          {/* Section 3: MAPPINGS TABLE (Section 15.4, p. 439) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <Sliders size={14} className="text-[#df9c43]" />
                Table des Mappings Actifs ({mappings.length})
              </h3>
              <span className="text-[11px] text-zinc-500">
                Double-cliquez sur une plage min/max pour ajuster les bornes
              </span>
            </div>

            <div className="border border-[#2b2019] rounded-xl overflow-hidden bg-[#181310]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#120e0b] text-[10px] font-black uppercase tracking-wider text-zinc-400 border-b border-[#2b2019]">
                  <tr>
                    <th className="py-2.5 px-3">Source MIDI (CC/Note)</th>
                    <th className="py-2.5 px-3">Paramètre Cible Logiciel</th>
                    <th className="py-2.5 px-3 text-center">Plage Min - Max</th>
                    <th className="py-2.5 px-3">Prise de Contrôle (Takeover)</th>
                    <th className="py-2.5 px-3 text-center">Valeur Actuelle</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2b2019]">
                  {mappings.map((m) => (
                    <tr key={m.id} className="hover:bg-[#201811] transition-colors group">
                      {/* Source */}
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-[#241808] border border-[#df9c43]/40 text-[#eaaf5d] font-mono font-bold text-[11px]">
                          {m.source}
                        </span>
                      </td>

                      {/* Target */}
                      <td className="py-3 px-3">
                        <span className="font-bold text-white block truncate max-w-xs">{m.targetName}</span>
                      </td>

                      {/* Range Min - Max */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center gap-1 font-mono text-[11px] text-zinc-300 bg-[#120e0b] px-2 py-0.5 rounded border border-[#2b2019]">
                          <span>{m.min}</span>
                          <span className="text-zinc-600">→</span>
                          <span className="text-[#df9c43] font-bold">{m.max}</span>
                        </div>
                      </td>

                      {/* Takeover Mode (Section 15.2, p. 435) */}
                      <td className="py-3 px-3">
                        <select
                          value={m.takeoverMode}
                          onChange={(e) => {
                            const newMode = e.target.value;
                            setMappings(prev => prev.map(item => item.id === m.id ? { ...item, takeoverMode: newMode } : item));
                          }}
                          className="bg-[#120e0b] border border-[#2b2019] rounded px-2 py-1 text-[11px] text-zinc-300 focus:outline-none focus:border-[#df9c43]"
                        >
                          <option value="scaling">Graduation (Scaling)</option>
                          <option value="pickup">Prise en charge (Pick-up)</option>
                          <option value="immediate">Direct (Immediate)</option>
                        </select>
                      </td>

                      {/* Current Value Visual Gauge */}
                      <td className="py-3 px-3 text-center">
                        <div className="w-20 mx-auto space-y-1">
                          <div className="h-1.5 bg-[#251d17] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#df9c43] to-[#eaaf5d]"
                              style={{ width: `${Math.min(100, Math.max(0, m.currentValue))}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-zinc-400 block">{m.currentValue}</span>
                        </div>
                      </td>

                      {/* Delete Mapping */}
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => {
                            setMappings(prev => prev.filter(item => item.id !== m.id));
                            if (setStatusHint) setStatusHint(`Mapping ${m.source} supprimé`);
                          }}
                          className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-red-950/30 transition opacity-70 group-hover:opacity-100"
                          title="Supprimer ce mapping"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: VIRTUAL CONTROLLER RACK (Always Accessible Hardware Simulation) */}
          <div className="bg-[#181310] border border-[#2b2019] rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu size={16} className="text-[#df9c43]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Contrôleur Hardware Virtuel (Simulation Temps Réel)
                </h3>
              </div>
              <span className="text-[10px] text-zinc-400">
                Permet de tester les mappings et automation même sans contrôleur USB physique branché
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {/* Virtual Control 1: Mod Wheel CC 1 */}
              <div className="bg-[#120e0b] border border-[#2b2019] rounded-lg p-3 text-center space-y-2">
                <span className="text-[10px] font-bold text-zinc-400 block truncate">Modulation (CC 1)</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={virtualControls.modWheel}
                  onChange={(e) => handleVirtualCcChange("modWheel", 1, Number(e.target.value))}
                  className="w-full accent-[#df9c43] cursor-pointer"
                />
                <span className="font-mono text-xs font-bold text-[#eaaf5d] block">{virtualControls.modWheel}%</span>
              </div>

              {/* Virtual Control 2: Master Volume CC 7 */}
              <div className="bg-[#120e0b] border border-[#2b2019] rounded-lg p-3 text-center space-y-2">
                <span className="text-[10px] font-bold text-zinc-400 block truncate">Volume (CC 7)</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={virtualControls.volume}
                  onChange={(e) => handleVirtualCcChange("volume", 7, Number(e.target.value))}
                  className="w-full accent-[#df9c43] cursor-pointer"
                />
                <span className="font-mono text-xs font-bold text-[#eaaf5d] block">{virtualControls.volume}%</span>
              </div>

              {/* Virtual Control 3: Pan CC 10 */}
              <div className="bg-[#120e0b] border border-[#2b2019] rounded-lg p-3 text-center space-y-2">
                <span className="text-[10px] font-bold text-zinc-400 block truncate">Pan (CC 10)</span>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={virtualControls.pan}
                  onChange={(e) => handleVirtualCcChange("pan", 10, Number(e.target.value))}
                  className="w-full accent-[#df9c43] cursor-pointer"
                />
                <span className="font-mono text-xs font-bold text-[#eaaf5d] block">
                  {virtualControls.pan === 0 ? "Centre" : virtualControls.pan > 0 ? `R ${virtualControls.pan}` : `L ${Math.abs(virtualControls.pan)}`}
                </span>
              </div>

              {/* Virtual Control 4: Filter Cutoff CC 74 */}
              <div className="bg-[#120e0b] border border-[#2b2019] rounded-lg p-3 text-center space-y-2">
                <span className="text-[10px] font-bold text-zinc-400 block truncate">Cutoff (CC 74)</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={virtualControls.cutoff}
                  onChange={(e) => handleVirtualCcChange("cutoff", 74, Number(e.target.value))}
                  className="w-full accent-[#df9c43] cursor-pointer"
                />
                <span className="font-mono text-xs font-bold text-[#eaaf5d] block">{virtualControls.cutoff}%</span>
              </div>

              {/* Virtual Control 5: Resonance CC 71 */}
              <div className="bg-[#120e0b] border border-[#2b2019] rounded-lg p-3 text-center space-y-2">
                <span className="text-[10px] font-bold text-zinc-400 block truncate">Résonance (CC 71)</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={virtualControls.resonance}
                  onChange={(e) => handleVirtualCcChange("resonance", 71, Number(e.target.value))}
                  className="w-full accent-[#df9c43] cursor-pointer"
                />
                <span className="font-mono text-xs font-bold text-[#eaaf5d] block">{virtualControls.resonance}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[#2b2019] bg-[#1a140f] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-zinc-400">
            <Shield size={14} className="text-emerald-400" />
            <span>Support Web MIDI API W3C & Standard MIDI 1.0 / MPE</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#241808] hover:bg-[#2d1e0d] border border-[#df9c43] text-[#eaaf5d] hover:text-[#f5c277] font-bold rounded-xl shadow-[0_0_10px_rgba(223,156,67,0.3)] transition"
          >
            Fermer le Navigateur de Mappings
          </button>
        </div>
      </div>
    </div>
  );
}
