"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  Music,
  Sliders,
  Shuffle,
  Repeat,
  Zap,
  Activity,
  Compass,
  Volume2,
  Trash2,
  Plus,
  Play,
  Check,
  ChevronDown,
  Layers,
  Sparkles
} from "lucide-react";

/**
 * Music Studio 5/6 Piano Roll with Note Operators & MPE Expressions
 * Reference: Music Studio User Guide French (Chapters 11 & 12, p. 340–405)
 *
 * Concepts:
 * 1. Note Operators (Section 11.2, p. 344–358):
 *    - Chance: 0% to 100% trigger probability
 *    - Ratchets (Répétitions): 1x to 8x sub-division pulses with velocity ramp
 *    - Occurrence: Logical loop conditions (Always, First, Not First, 1:2, 2:2, 1:4, 2:4, 3:4, 4:4, Fill, !Fill)
 *    - Recurrence: Bit pattern cycles
 *
 * 2. MPE Per-Note Expressions (Chapter 12, p. 376–405):
 *    - Velocity: 0 to 127
 *    - Micro-Pitch: -24 st to +24 st (cents & semitones)
 *    - Pressure: 0% to 100% (Polyphonic Aftertouch)
 *    - Pan: L50 to R50
 *    - Timbre: 0% to 100% (CC74 filter modulation)
 */

export const PITCH_LIST = [
  "C5", "B4", "A#4", "A4", "G#4", "G4", "F#4", "F4", "E4", "D#4", "D4", "C#4",
  "C4", "B3", "A#3", "A3", "G3", "F3", "E3", "D3", "C3"
];

export const NOTE_FREQUENCIES = {
  C3: 130.81, "C#3": 138.59, D3: 146.83, "D#3": 155.56, E3: 164.81, F3: 174.61, "F#3": 185.00, G3: 196.00, "G#3": 207.65, A3: 220.00, "A#3": 233.08, B3: 246.94,
  C4: 261.63, "C#4": 277.18, D4: 293.66, "D#4": 311.13, E4: 329.63, F4: 349.23, "F#4": 369.99, G4: 392.00, "G#4": 415.30, A4: 440.00, "A#4": 466.16, B4: 493.88,
  C5: 523.25
};

export const OCCURRENCE_CONDITIONS = [
  { id: "Always", label: "Toujours", desc: "Déclenché à chaque passage (défaut)" },
  { id: "First", label: "1er Tour", desc: "Seulement au tout premier cycle de lecture" },
  { id: "Not First", label: "Sauf 1er", desc: "À tous les tours sauf le premier" },
  { id: "1:2", label: "1:2", desc: "Cycles impairs (1, 3, 5...)" },
  { id: "2:2", label: "2:2", desc: "Cycles pairs (2, 4, 6...)" },
  { id: "1:4", label: "1:4", desc: "Un tour sur 4 (cycle 1, 5, 9...)" },
  { id: "2:4", label: "2:4", desc: "Cycle 2 sur 4" },
  { id: "3:4", label: "3:4", desc: "Cycle 3 sur 4" },
  { id: "4:4", label: "4:4", desc: "Dernier cycle de 4 (Fill naturel)" },
  { id: "Fill", label: "Fill", desc: "Quand le mode Fill est armé" },
  { id: "!Fill", label: "Sans Fill", desc: "Quand le mode Fill est désactivé" }
];

export const OPERATOR_LANE_TABS = [
  { id: "velocity", label: "Vélocité", icon: Volume2, unit: "", min: 1, max: 127, def: 90 },
  { id: "chance", label: "Chance", icon: Shuffle, unit: "%", min: 0, max: 100, def: 100 },
  { id: "ratchets", label: "Répétitions", icon: Zap, unit: "x", min: 1, max: 8, def: 1 },
  { id: "occurrence", label: "Occurrence", icon: Repeat, unit: "", min: 0, max: 10, def: 0 },
  { id: "micropitch", label: "Micro-Pitch", icon: Activity, unit: "st", min: -24, max: 24, def: 0 },
  { id: "pressure", label: "Pression", icon: Sliders, unit: "%", min: 0, max: 100, def: 50 },
  { id: "pan", label: "Panoramique", icon: Compass, unit: "", min: -50, max: 50, def: 0 }
];

export default function MusicStudio({
  notes = [],
  selectedNoteId = null,
  onSelectNote,
  onUpdateNote,
  onAddNote,
  onDeleteNote,
  onPlayNote,
  isPlaying = false,
  currentBar = 1,
  currentBeat = 1,
  setStatusHint
}) {
  const [activeLaneTab, setActiveLaneTab] = useState("chance");
  const [isLaneCollapsed, setIsLaneCollapsed] = useState(false);
  const [dragState, setDragState] = useState(null); // { noteId, mode: 'move'|'resize', startX, startY, origBeat, origPitch, origDur }
  const gridScrollRef = useRef(null);

  const selectedNote = useMemo(() => {
    return notes.find((n) => n.id === selectedNoteId) || notes[0] || null;
  }, [notes, selectedNoteId]);

  // Handle Note Dragging / Resizing
  const handleMouseDownNote = (e, note, mode = "move") => {
    e.stopPropagation();
    if (onSelectNote) onSelectNote(note.id);
    if (onPlayNote) onPlayNote(note);

    setDragState({
      noteId: note.id,
      mode,
      startX: e.clientX,
      startY: e.clientY,
      origBeat: note.startBeat,
      origPitch: note.pitch,
      origDur: note.duration || 2
    });
  };

  const handleMouseMove = useCallback((e) => {
    if (!dragState) return;
    const deltaX = e.clientX - dragState.startX;
    const deltaY = e.clientY - dragState.startY;
    const beatOffset = Math.round(deltaX / 36);

    if (dragState.mode === "resize") {
      const newDuration = Math.max(1, dragState.origDur + beatOffset);
      onUpdateNote(dragState.noteId, { duration: newDuration });
    } else if (dragState.mode === "move") {
      const newBeat = Math.max(1, dragState.origBeat + beatOffset);
      const pitchIdxOffset = Math.round(deltaY / 20);
      const curPitchIdx = PITCH_LIST.indexOf(dragState.origPitch);
      const newPitchIdx = Math.max(0, Math.min(PITCH_LIST.length - 1, curPitchIdx + pitchIdxOffset));
      const newPitch = PITCH_LIST[newPitchIdx];

      onUpdateNote(dragState.noteId, { startBeat: newBeat, pitch: newPitch });
    }
  }, [dragState, onUpdateNote]);

  const handleMouseUp = useCallback(() => {
    if (dragState) {
      setDragState(null);
    }
  }, [dragState]);

  useEffect(() => {
    if (dragState) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [dragState, handleMouseMove, handleMouseUp]);

  // Direct Operator Value Update on Selected Note
  const handleUpdateActiveOperator = (field, val) => {
    if (!selectedNote) return;
    onUpdateNote(selectedNote.id, { [field]: val });
    if (setStatusHint) {
      setStatusHint(`Opérateur ${field} défini à ${val} sur la note ${selectedNote.pitch}`);
    }
  };

  return (
    <div
      data-testid="studio-pianoroll-operators-container"
      className="flex-1 flex flex-col bg-[#111111] overflow-hidden select-none"
    >
      {/* ── Top Bar: Quick Inspector for Selected Note ── */}
      <div className="h-8 px-3 bg-[#181818] border-b border-[#2a2a2a] flex items-center justify-between text-[11px] text-zinc-300 font-mono">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Music size={13} className="text-[#ea580c]" />
            <span className="font-bold text-white tracking-wide">
              {selectedNote ? `Note: ${selectedNote.pitch}` : "Aucune note sélectionnée"}
            </span>
            {selectedNote && (
              <span className="text-zinc-500 text-[9.5px]">
                (Temps {selectedNote.startBeat} • Durée {selectedNote.duration || 2}b)
              </span>
            )}
          </div>

          {selectedNote && (
            <div className="flex items-center gap-3 pl-3 border-l border-zinc-700 text-[10px]">
              {/* Chance badge */}
              <div
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${
                  (selectedNote.chance ?? 100) < 100 ? "bg-amber-950/80 border border-amber-500/50 text-amber-300" : "text-zinc-400"
                }`}
              >
                <Shuffle size={10} />
                <span>Chance: {selectedNote.chance ?? 100}%</span>
              </div>

              {/* Ratchets badge */}
              <div
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${
                  (selectedNote.ratchets || 1) > 1 ? "bg-orange-950/80 border border-orange-500/50 text-orange-300 font-bold" : "text-zinc-400"
                }`}
              >
                <Zap size={10} />
                <span>Répétitions: x{selectedNote.ratchets || 1}</span>
              </div>

              {/* Occurrence badge */}
              <div
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${
                  selectedNote.occurrence && selectedNote.occurrence !== "Always"
                    ? "bg-purple-950/80 border border-purple-500/50 text-purple-300"
                    : "text-zinc-400"
                }`}
              >
                <Repeat size={10} />
                <span>Occur: {selectedNote.occurrence || "Toujours"}</span>
              </div>

              {/* Micro-Pitch badge */}
              {(selectedNote.microPitch || 0) !== 0 && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-950/80 border border-blue-500/50 text-blue-300">
                  <Activity size={10} />
                  <span>Pitch: {selectedNote.microPitch > 0 ? `+${selectedNote.microPitch}` : selectedNote.microPitch} st</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Add Note / Actions */}
        <div className="flex items-center gap-2">
          <button
            data-testid="btn-add-note-c4"
            onClick={() => {
              if (onAddNote) onAddNote("C4", Math.max(1, Math.floor(currentBeat)));
            }}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 hover:bg-[#ea580c] hover:text-white text-zinc-300 text-[10px] font-bold transition"
            title="Ajouter une note C4 au curseur de lecture"
          >
            <Plus size={11} />
            <span>+ Note C4</span>
          </button>

          {selectedNote && (
            <button
              data-testid="btn-delete-selected-note"
              onClick={() => {
                if (onDeleteNote) onDeleteNote(selectedNote.id);
              }}
              className="p-1 rounded hover:bg-red-900/60 text-zinc-400 hover:text-red-300 transition"
              title="Supprimer la note sélectionnée (Suppr)"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>

      {/* ── Main Piano Roll Grid Area ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Vertical Pitch Keys (C5 to C3) */}
        <div className="w-20 bg-[#161616] border-r border-[#262626] overflow-y-auto custom-scrollbar select-none flex-shrink-0 z-20">
          {PITCH_LIST.map((pitch) => {
            const isSharp = pitch.includes("#");
            const isC = pitch.startsWith("C") && !isSharp;
            return (
              <div
                key={pitch}
                data-pitch-key={pitch}
                onClick={() => {
                  if (onPlayNote) onPlayNote({ pitch, velocity: 100, duration: 1 });
                }}
                className={`h-5 border-b border-[#242424] px-1.5 flex items-center justify-between text-[9px] font-mono cursor-pointer transition active:scale-95 ${
                  isSharp
                    ? "bg-[#111111] text-zinc-400 hover:bg-zinc-800"
                    : isC
                    ? "bg-[#292929] text-amber-200 font-extrabold hover:bg-zinc-700"
                    : "bg-[#202020] text-zinc-300 hover:bg-zinc-700"
                }`}
                title={`Jouer note ${pitch}`}
              >
                <span>{pitch}</span>
                <span className="text-[7.5px] text-zinc-600">♫</span>
              </div>
            );
          })}
        </div>

        {/* Right: Note Canvas Grid */}
        <div
          ref={gridScrollRef}
          onDoubleClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left + e.currentTarget.scrollLeft;
            const y = e.clientY - rect.top + e.currentTarget.scrollTop;
            const beat = Math.max(1, Math.floor(x / 36) + 1);
            const pitchIndex = Math.min(PITCH_LIST.length - 1, Math.max(0, Math.floor(y / 20)));
            const pitch = PITCH_LIST[pitchIndex] || "C4";
            if (onAddNote) onAddNote(pitch, beat);
          }}
          className="flex-1 bg-[#121212] overflow-auto custom-scrollbar relative select-none"
        >
          <div
            className="relative"
            style={{
              width: `${32 * 36}px`,
              height: `${PITCH_LIST.length * 20}px`
            }}
          >
            {/* Horizontal Pitch Lane Stripes */}
            {PITCH_LIST.map((pitch, pIdx) => {
              const isSharp = pitch.includes("#");
              return (
                <div
                  key={pitch}
                  style={{
                    position: "absolute",
                    top: `${pIdx * 20}px`,
                    left: 0,
                    right: 0,
                    height: "20px"
                  }}
                  className={`border-b border-[#1b1b1b] ${
                    isSharp ? "bg-[#101010]" : "bg-[#161616]"
                  }`}
                />
              );
            })}

            {/* Vertical Beat & Bar Columns */}
            {Array.from({ length: 33 }).map((_, bIdx) => {
              const isBarLine = bIdx % 4 === 0;
              return (
                <div
                  key={bIdx}
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: `${bIdx * 36}px`,
                    width: "1px"
                  }}
                  className={
                    isBarLine
                      ? "bg-white/20 z-0 pointer-events-none"
                      : "bg-white/5 z-0 pointer-events-none"
                  }
                />
              );
            })}

            {/* Scrub / Playhead Bar */}
            {isPlaying && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-[#ea580c] z-20 pointer-events-none shadow-[0_0_8px_#ea580c]"
                style={{
                  left: `${(currentBar - 1) * 4 * 36 + (currentBeat - 1) * 36}px`
                }}
              />
            )}

            {/* Rendered Notes with Music Studio Visual Operator Indicators */}
            {notes.map((note) => {
              const pitchIdx = PITCH_LIST.indexOf(note.pitch);
              const top = (pitchIdx >= 0 ? pitchIdx : 12) * 20;
              const left = (note.startBeat - 1) * 36;
              const width = Math.max(18, (note.duration || 2) * 36);
              const isSelected = selectedNoteId === note.id;

              const hasChance = (note.chance ?? 100) < 100;
              const hasRatchets = (note.ratchets || 1) > 1;
              const hasOccurrence = note.occurrence && note.occurrence !== "Always";

              return (
                <div
                  key={note.id}
                  data-note-id={note.id}
                  data-testid={`piano-note-${note.id}`}
                  onMouseDown={(e) => handleMouseDownNote(e, note, "move")}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (onDeleteNote) onDeleteNote(note.id);
                  }}
                  className={`rounded text-white font-bold text-[9px] px-1.5 flex items-center justify-between cursor-move shadow transition z-10 absolute ${
                    isSelected
                      ? "bg-[#ea580c] ring-2 ring-white border-2 border-[#ea580c] shadow-[0_0_12px_rgba(234,88,12,0.8)] brightness-110"
                      : "bg-[#d97706] hover:bg-[#ea580c] border border-black/40"
                  } ${hasChance ? "border-dashed border-amber-300" : ""}`}
                  style={{
                    top: `${top + 1}px`,
                    left: `${left}px`,
                    width: `${width - 2}px`,
                    height: "18px"
                  }}
                  title={`${note.pitch} • Temps ${note.startBeat} • Vélocité: ${note.velocity || 90} • Chance: ${note.chance ?? 100}% • Répétitions: x${note.ratchets || 1}`}
                >
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="truncate">{note.pitch}</span>
                    {/* Music Studio Ratchets Stripe Indicator */}
                    {hasRatchets && (
                      <span className="bg-black/50 text-orange-200 text-[7px] px-1 rounded font-mono">
                        x{note.ratchets}
                      </span>
                    )}
                    {/* Music Studio Chance Badge */}
                    {hasChance && (
                      <span className="bg-amber-950/80 text-amber-200 text-[7px] px-0.5 rounded font-mono">
                        {note.chance}%
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {hasOccurrence && (
                      <span className="text-[7px] bg-purple-950 text-purple-200 px-0.5 rounded">
                        {note.occurrence}
                      </span>
                    )}
                    <span className="text-[7.5px] font-mono opacity-80">v{note.velocity || 90}</span>

                    {/* Resize Handle on Right Edge */}
                    <div
                      data-testid={`resize-handle-${note.id}`}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        handleMouseDownNote(e, note, "resize");
                      }}
                      className="w-1.5 h-3.5 bg-white/40 hover:bg-white rounded-r cursor-ew-resize ml-0.5"
                      title="Redimensionner la durée de la note"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Bottom Sub-Lane: Music Studio Operators & MPE Expressions (Section 11.2 & Ch. 12) ── */}
      <div
        data-testid="studio-operators-sublane"
        className="border-t border-[#2a2a2a] bg-[#161616] flex flex-col select-none transition-all duration-150"
        style={{ height: isLaneCollapsed ? "28px" : "130px" }}
      >
        {/* Lane Tab Strip Header */}
        <div className="h-7 bg-[#1c1c1c] border-b border-[#292929] px-3 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-[9px] uppercase tracking-wider font-bold text-zinc-500 mr-1.5">
              Sous-Piste :
            </span>

            {OPERATOR_LANE_TABS.map((tab) => {
              const IconComp = tab.icon;
              const isActive = activeLaneTab === tab.id;
              return (
                <button
                  key={tab.id}
                  data-testid={`operator-tab-${tab.id}`}
                  onClick={() => {
                    setActiveLaneTab(tab.id);
                    if (isLaneCollapsed) setIsLaneCollapsed(false);
                  }}
                  className={`h-5 px-2 rounded text-[10px] font-bold flex items-center gap-1 transition ${
                    isActive
                      ? "bg-[#ea580c] text-white shadow-sm"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                  title={`Éditer ${tab.label}`}
                >
                  <IconComp size={10} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setIsLaneCollapsed(!isLaneCollapsed)}
            className="p-1 text-zinc-400 hover:text-white transition"
            title={isLaneCollapsed ? "Déplier la sous-piste d'opérateurs" : "Replier la sous-piste"}
          >
            <ChevronDown size={12} className={`transform transition ${isLaneCollapsed ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Lane Interactive Canvas / Value Bars */}
        {!isLaneCollapsed && (
          <div className="flex-1 flex items-stretch overflow-hidden">
            {/* Left Header / Value Indicator */}
            <div className="w-44 bg-[#141414] border-r border-[#262626] p-2 flex flex-col justify-between text-[10px] flex-shrink-0">
              <div>
                <span className="font-bold text-zinc-300 block">
                  {OPERATOR_LANE_TABS.find((t) => t.id === activeLaneTab)?.label}
                </span>
                <span className="text-[8.5px] text-zinc-500">
                  {activeLaneTab === "chance" && "Probabilité stochastique (0-100%)"}
                  {activeLaneTab === "ratchets" && "Répétitions par note (1x-8x)"}
                  {activeLaneTab === "occurrence" && "Conditions logiques de boucle"}
                  {activeLaneTab === "velocity" && "Vélocité MIDI (1-127)"}
                  {activeLaneTab === "micropitch" && "Désaccordage MPE (-24 à +24 st)"}
                  {activeLaneTab === "pressure" && "Polyphonic Aftertouch (0-100%)"}
                  {activeLaneTab === "pan" && "Positionnement stéréo (L50-R50)"}
                </span>
              </div>

              {/* Quick Slider or Picker for Selected Note */}
              {selectedNote ? (
                <div className="space-y-1">
                  {activeLaneTab === "chance" && (
                    <div>
                      <div className="flex justify-between text-[9px] text-zinc-400 mb-0.5">
                        <span>Chance:</span>
                        <span className="text-amber-400 font-bold">{selectedNote.chance ?? 100}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={selectedNote.chance ?? 100}
                        onChange={(e) => handleUpdateActiveOperator("chance", parseInt(e.target.value, 10))}
                        className="w-full accent-[#ea580c] h-1.5 bg-zinc-700 rounded-lg cursor-pointer"
                        data-testid="input-chance-slider"
                      />
                    </div>
                  )}

                  {activeLaneTab === "ratchets" && (
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 6, 8].map((rVal) => (
                        <button
                          key={rVal}
                          data-testid={`btn-ratchet-${rVal}`}
                          onClick={() => handleUpdateActiveOperator("ratchets", rVal)}
                          className={`flex-1 py-1 rounded text-[9px] font-bold transition ${
                            (selectedNote.ratchets || 1) === rVal
                              ? "bg-[#ea580c] text-white"
                              : "bg-zinc-800 text-zinc-400 hover:text-white"
                          }`}
                        >
                          x{rVal}
                        </button>
                      ))}
                    </div>
                  )}

                  {activeLaneTab === "occurrence" && (
                    <select
                      data-testid="select-occurrence"
                      value={selectedNote.occurrence || "Always"}
                      onChange={(e) => handleUpdateActiveOperator("occurrence", e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 rounded px-1.5 py-1 text-[9.5px] font-mono focus:outline-none focus:border-[#ea580c]"
                    >
                      {OCCURRENCE_CONDITIONS.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label} ({c.id})
                        </option>
                      ))}
                    </select>
                  )}

                  {activeLaneTab === "velocity" && (
                    <div>
                      <div className="flex justify-between text-[9px] text-zinc-400 mb-0.5">
                        <span>Vélocité:</span>
                        <span className="text-white font-bold">{selectedNote.velocity || 90}</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="127"
                        value={selectedNote.velocity || 90}
                        onChange={(e) => handleUpdateActiveOperator("velocity", parseInt(e.target.value, 10))}
                        className="w-full accent-[#ea580c] h-1.5 bg-zinc-700 rounded-lg cursor-pointer"
                        data-testid="input-velocity-slider"
                      />
                    </div>
                  )}

                  {activeLaneTab === "micropitch" && (
                    <div>
                      <div className="flex justify-between text-[9px] text-zinc-400 mb-0.5">
                        <span>Pitch:</span>
                        <span className="text-blue-400 font-bold">{selectedNote.microPitch || 0} st</span>
                      </div>
                      <input
                        type="range"
                        min="-24"
                        max="24"
                        value={selectedNote.microPitch || 0}
                        onChange={(e) => handleUpdateActiveOperator("microPitch", parseInt(e.target.value, 10))}
                        className="w-full accent-blue-500 h-1.5 bg-zinc-700 rounded-lg cursor-pointer"
                        data-testid="input-micropitch-slider"
                      />
                    </div>
                  )}

                  {activeLaneTab === "pressure" && (
                    <div>
                      <div className="flex justify-between text-[9px] text-zinc-400 mb-0.5">
                        <span>Pression:</span>
                        <span className="text-emerald-400 font-bold">{selectedNote.pressure || 50}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={selectedNote.pressure || 50}
                        onChange={(e) => handleUpdateActiveOperator("pressure", parseInt(e.target.value, 10))}
                        className="w-full accent-emerald-500 h-1.5 bg-zinc-700 rounded-lg cursor-pointer"
                        data-testid="input-pressure-slider"
                      />
                    </div>
                  )}

                  {activeLaneTab === "pan" && (
                    <div>
                      <div className="flex justify-between text-[9px] text-zinc-400 mb-0.5">
                        <span>Pan:</span>
                        <span className="text-purple-400 font-bold">
                          {(selectedNote.pan || 0) === 0 ? "Centre" : (selectedNote.pan || 0) < 0 ? `L${Math.abs(selectedNote.pan)}` : `R${selectedNote.pan}`}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-50"
                        max="50"
                        value={selectedNote.pan || 0}
                        onChange={(e) => handleUpdateActiveOperator("pan", parseInt(e.target.value, 10))}
                        className="w-full accent-purple-500 h-1.5 bg-zinc-700 rounded-lg cursor-pointer"
                        data-testid="input-pan-slider"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-[9px] text-zinc-600 italic">Sélectionnez une note</span>
              )}
            </div>

            {/* Right: Timeline-Aligned Histogram Bars */}
            <div className="flex-1 bg-[#101010] relative overflow-x-auto custom-scrollbar p-2">
              <div
                className="relative h-full"
                style={{ width: `${32 * 36}px` }}
              >
                {/* Beat Grid Lines */}
                {Array.from({ length: 33 }).map((_, bIdx) => {
                  const isBarLine = bIdx % 4 === 0;
                  return (
                    <div
                      key={bIdx}
                      style={{
                        position: "absolute",
                        top: 0,
                        bottom: 0,
                        left: `${bIdx * 36}px`,
                        width: "1px"
                      }}
                      className={isBarLine ? "bg-white/10 pointer-events-none" : "bg-white/5 pointer-events-none"}
                    />
                  );
                })}

                {/* Histogram Bars for each note aligned to its startBeat */}
                {notes.map((note) => {
                  const left = (note.startBeat - 1) * 36 + 6;
                  const isSelected = selectedNoteId === note.id;

                  let valPercent = 50;
                  let displayVal = "";
                  let barColor = "bg-zinc-600";

                  if (activeLaneTab === "chance") {
                    valPercent = note.chance ?? 100;
                    displayVal = `${valPercent}%`;
                    barColor = isSelected ? "bg-amber-400" : "bg-amber-600";
                  } else if (activeLaneTab === "ratchets") {
                    valPercent = ((note.ratchets || 1) / 8) * 100;
                    displayVal = `x${note.ratchets || 1}`;
                    barColor = isSelected ? "bg-[#ea580c]" : "bg-orange-600";
                  } else if (activeLaneTab === "occurrence") {
                    valPercent = 80;
                    displayVal = note.occurrence || "Always";
                    barColor = isSelected ? "bg-purple-400" : "bg-purple-600";
                  } else if (activeLaneTab === "velocity") {
                    valPercent = ((note.velocity || 90) / 127) * 100;
                    displayVal = `v${note.velocity || 90}`;
                    barColor = isSelected ? "bg-[#ea580c]" : "bg-zinc-500";
                  } else if (activeLaneTab === "micropitch") {
                    valPercent = 50 + (((note.microPitch || 0) / 24) * 50);
                    displayVal = `${note.microPitch || 0}st`;
                    barColor = isSelected ? "bg-blue-400" : "bg-blue-600";
                  } else if (activeLaneTab === "pressure") {
                    valPercent = note.pressure || 50;
                    displayVal = `${valPercent}%`;
                    barColor = isSelected ? "bg-emerald-400" : "bg-emerald-600";
                  } else if (activeLaneTab === "pan") {
                    valPercent = 50 + (((note.pan || 0) / 50) * 50);
                    displayVal = (note.pan || 0) === 0 ? "C" : (note.pan || 0) < 0 ? `L${Math.abs(note.pan)}` : `R${note.pan}`;
                    barColor = isSelected ? "bg-purple-400" : "bg-purple-600";
                  }

                  return (
                    <div
                      key={note.id}
                      onClick={() => {
                        if (onSelectNote) onSelectNote(note.id);
                        if (onPlayNote) onPlayNote(note);
                      }}
                      className="absolute bottom-0 w-5 flex flex-col items-center justify-end cursor-pointer group"
                      style={{ left: `${left}px`, height: "100%" }}
                      title={`${note.pitch} • ${activeLaneTab}: ${displayVal}`}
                    >
                      <span className="text-[7.5px] font-mono text-zinc-400 mb-1 opacity-0 group-hover:opacity-100 transition">
                        {displayVal}
                      </span>
                      <div
                        className={`w-2.5 rounded-t transition-all ${barColor} ${
                          isSelected ? "ring-1 ring-white" : ""
                        }`}
                        style={{ height: `${Math.max(6, valPercent * 0.75)}px` }}
                      />
                      <div className="w-1 h-1 rounded-full bg-white mt-0.5" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
