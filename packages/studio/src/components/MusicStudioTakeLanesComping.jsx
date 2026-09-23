"use client";

import React, { useState } from "react";
import { Plus, Layers, Check, CornerDownRight, Play, Volume2, Trash2 } from "lucide-react";

/**
 * Music Studio 5/6 Audio Comping & Take Lanes Component
 * Reference: Music Studio User Guide French (Section 10.1.4, p. 299–307)
 *
 * Concepts:
 * - Take Lanes (Lignes de prise) displaying recorded passes
 * - Swipe Comping: Clicking & dragging over any take activates that region in the Composite Master
 * - Up/Down arrow keys switch take selection for the active region (p. 303)
 * - Add Take button (+) to import or duplicate new takes
 */

export const DEFAULT_STUDIO_TAKES = [
  {
    id: "take_1",
    name: "Prise 1 (Lead Studio)",
    color: "#0284c7",
    url: "/samples/studio/piano_lr_bounce_1.wav"
  },
  {
    id: "take_2",
    name: "Prise 2 (Take Dynamique)",
    color: "#38bdf8",
    url: "/samples/studio/piano_lr_2_bounce_2.wav"
  },
  {
    id: "take_3",
    name: "Prise 3 (Alternate Vibrato)",
    color: "#818cf8",
    url: "/samples/studio/piano_pedal_bounce_1.wav"
  }
];

export default function MusicStudio({
  track,
  takes = DEFAULT_STUDIO_TAKES,
  compingRegions = [
    { id: "cr_1", takeId: "take_1", startBar: 1, endBar: 8 },
    { id: "cr_2", takeId: "take_2", startBar: 9, endBar: 16 },
    { id: "cr_3", takeId: "take_3", startBar: 17, endBar: 24 }
  ],
  maxTrackBars = 148,
  barWidthPx = 48,
  onUpdateRegions,
  onAddTake,
  onDeleteTake,
  setStatusHint
}) {
  const [selectedRegionId, setSelectedRegionId] = useState("cr_1");
  const [dragSwipe, setDragSwipe] = useState(null); // { takeId, startBar, currentBar }

  const handleMouseDownTake = (takeId, bar) => {
    setDragSwipe({ takeId, startBar: bar, currentBar: bar });
  };

  const handleMouseEnterBar = (bar) => {
    if (dragSwipe) {
      setDragSwipe((prev) => (prev ? { ...prev, currentBar: bar } : null));
    }
  };

  const handleMouseUpTake = () => {
    if (dragSwipe) {
      const sBar = Math.min(dragSwipe.startBar, dragSwipe.currentBar);
      const eBar = Math.max(dragSwipe.startBar, dragSwipe.currentBar);
      const newRegion = {
        id: `cr_${Date.now()}`,
        takeId: dragSwipe.takeId,
        startBar: sBar,
        endBar: Math.max(sBar + 1, eBar)
      };

      // Replace or splice into comping regions
      const filtered = compingRegions.filter(
        (r) => !(r.startBar >= sBar && r.endBar <= eBar)
      );
      const updated = [...filtered, newRegion].sort((a, b) => a.startBar - b.startBar);

      if (onUpdateRegions) onUpdateRegions(updated);
      setSelectedRegionId(newRegion.id);
      const takeObj = takes.find((t) => t.id === dragSwipe.takeId);
      if (setStatusHint) {
        setStatusHint(`Région d'assemblage affectée à "${takeObj?.name || 'Prise'}" (Mesures ${sBar}-${eBar})`);
      }
      setDragSwipe(null);
    }
  };

  return (
    <div
      data-testid="studio-take-lanes-container"
      onMouseUp={handleMouseUpTake}
      className="flex flex-col border-t border-[#2a2a2a] divide-y divide-[#202020] bg-[#101010]"
    >
      {/* Takes Header Summary Bar */}
      <div className="h-6 px-3 bg-[#131313] flex items-center justify-between text-[9px] font-mono text-zinc-400 border-b border-[#222222]">
        <div className="flex items-center gap-2">
          <Layers size={11} className="text-[#ea580c]" />
          <span className="font-bold uppercase tracking-wider text-zinc-300">
            Lignes de Prises (Comping Audio • Section 10.1.4)
          </span>
          <span className="text-zinc-500">• {takes.length} prises disponibles</span>
        </div>
        <button
          data-testid="btn-add-take"
          onClick={() => {
            if (onAddTake) onAddTake(track.id);
            if (setStatusHint) setStatusHint("Nouvelle ligne de prise ajoutée à l'assemblage");
          }}
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 hover:bg-[#ea580c] hover:text-white text-zinc-300 text-[9px] font-bold transition"
          title="Ajouter une nouvelle prise d'enregistrement (+)"
        >
          <Plus size={10} />
          <span>Nouvelle Prise</span>
        </button>
      </div>

      {/* Render each take lane */}
      {takes.map((take, tIdx) => {
        return (
          <div key={take.id} className="h-12 flex items-stretch hover:bg-[#141414] transition-colors relative">
            {/* Left Header */}
            <div className="w-56 flex-shrink-0 border-r border-[#262626] px-3 py-1 flex items-center justify-between bg-[#141414] sticky left-0 z-30 shadow-[2px_0_5px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: take.color }} />
                <span className="text-[10px] font-bold text-zinc-300 truncate">
                  {take.name}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[8.5px] font-mono text-zinc-500">T{tIdx + 1}</span>
                {takes.length > 1 && (
                  <button
                    onClick={() => {
                      if (onDeleteTake) onDeleteTake(track.id, take.id);
                      if (setStatusHint) setStatusHint(`Prise "${take.name}" supprimée`);
                    }}
                    className="p-1 text-zinc-600 hover:text-red-400 rounded"
                    title="Supprimer la prise"
                  >
                    <Trash2 size={10} />
                  </button>
                )}
              </div>
            </div>

            {/* Right Waveform & Swipe Comping Area */}
            <div
              style={{ width: `${maxTrackBars * barWidthPx}px` }}
              className="relative flex items-center h-12 overflow-hidden select-none"
            >
              {/* Grid columns */}
              <div className="absolute inset-0 pointer-events-none opacity-10 flex divide-x divide-white">
                {Array.from({ length: maxTrackBars }, (_, i) => i + 1).map((b) => (
                  <div
                    key={b}
                    style={{ width: `${barWidthPx}px` }}
                    className="h-full flex-shrink-0"
                    onMouseEnter={() => handleMouseEnterBar(b)}
                  />
                ))}
              </div>

              {/* Pseudo-waveform rendering for this take */}
              <div className="absolute inset-0 flex items-center px-1 pointer-events-none opacity-45">
                <svg className="w-full h-8">
                  {Array.from({ length: Math.min(120, maxTrackBars * 2) }).map((_, barIdx) => {
                    const seed = (tIdx * 17 + barIdx * 31) % 100;
                    const h = 6 + (seed / 100) * 22;
                    return (
                      <rect
                        key={barIdx}
                        x={barIdx * 20}
                        y={16 - h / 2}
                        width={14}
                        height={h}
                        rx={2}
                        fill={take.color}
                        opacity={0.7}
                      />
                    );
                  })}
                </svg>
              </div>

              {/* Active Comping Regions Highlighting on this take */}
              {compingRegions
                .filter((r) => r.takeId === take.id)
                .map((r) => {
                  const leftPx = (r.startBar - 1) * barWidthPx;
                  const widthPx = (r.endBar - r.startBar + 1) * barWidthPx;
                  const isSelected = selectedRegionId === r.id;

                  return (
                    <div
                      key={r.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRegionId(r.id);
                        if (setStatusHint) {
                          setStatusHint(`Région active : Mesures ${r.startBar}-${r.endBar} sur "${take.name}"`);
                        }
                      }}
                      style={{
                        left: `${leftPx}px`,
                        width: `${widthPx}px`
                      }}
                      className={`absolute top-1 bottom-1 rounded border-2 z-20 flex items-center justify-between px-2 cursor-pointer transition shadow-md ${
                        isSelected
                          ? "border-amber-400 bg-amber-500/25 ring-2 ring-amber-400/50"
                          : "border-emerald-400 bg-emerald-500/20 hover:brightness-125"
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <Check size={11} className="text-emerald-400 font-black" />
                        <span className="text-[9px] font-bold text-white uppercase tracking-wider drop-shadow">
                          {take.name.split(" ")[0]} M{r.startBar}-{r.endBar}
                        </span>
                      </div>
                      <span className="text-[8px] font-mono bg-black/60 px-1 py-0.2 rounded text-zinc-300">
                        {r.endBar - r.startBar + 1}b
                      </span>
                    </div>
                  );
                })}

              {/* Temporary Dragging Swipe Ghost Preview */}
              {dragSwipe && dragSwipe.takeId === take.id && (
                <div
                  style={{
                    left: `${(Math.min(dragSwipe.startBar, dragSwipe.currentBar) - 1) * barWidthPx}px`,
                    width: `${(Math.abs(dragSwipe.currentBar - dragSwipe.startBar) + 1) * barWidthPx}px`
                  }}
                  className="absolute top-1 bottom-1 rounded border-2 border-dashed border-amber-300 bg-amber-400/30 z-30 pointer-events-none animate-pulse flex items-center px-2 text-[9px] font-bold text-white shadow-lg"
                >
                  <span>Balayage ({Math.min(dragSwipe.startBar, dragSwipe.currentBar)} - {Math.max(dragSwipe.startBar, dragSwipe.currentBar)})</span>
                </div>
              )}

              {/* Click-to-swipe background hit area */}
              {Array.from({ length: maxTrackBars }, (_, i) => i + 1).map((b) => (
                <div
                  key={b}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleMouseDownTake(take.id, b);
                  }}
                  onMouseEnter={() => handleMouseEnterBar(b)}
                  style={{
                    left: `${(b - 1) * barWidthPx}px`,
                    width: `${barWidthPx}px`
                  }}
                  className="absolute top-0 bottom-0 cursor-crosshair hover:bg-white/5 z-10"
                  title={`Cliquer-glisser pour affecter la mesure ${b} à cette prise`}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
