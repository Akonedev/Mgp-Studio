"use client";

import React from "react";
import {
  MousePointer,
  BetweenHorizontalStart,
  Pencil,
  Eraser,
  Scissors,
  MoveHorizontal,
  Layers,
  SlidersHorizontal,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Volume2,
  Play,
  Grid
} from "lucide-react";

/**
 * Music Studio 5/6 Universal Arranger Toolbar & Switches
 * Reference: Music Studio User Guide French (Section 3.1.4, p. 81–85 & Section 5.1.6, p. 165–167)
 *
 * Tools:
 * [1] Pointeur : Sélection et déplacement d'objets (clips, notes, automation)
 * [2] Outil Durée : Sélection temporelle libre (Time Selection bracket)
 * [3] Crayon : Dessin de nouveaux événements et clips
 * [4] Gomme : Suppression d'événements au clic ou par zone
 * [5] Cutter : Scission chirurgicale de clips en deux à la position cliquée
 * [6] Coulisser (Slip) : Déplacement du contenu sans bouger les frontières du clip
 *
 * Switches (p. 84):
 * - [E/S] : Entrées / Sorties des pistes
 * - [↕] : Hauteur de piste (Normal 64px / Compact 38px)
 * - [FX] : Pistes d'effets (Reverb, Delay Aux)
 * - [OFF] : Pistes désactivées (Alt+A)
 * - [▶] : Suivre la lecture (Follow Playhead)
 */

export const STUDIO_TOOLS = [
  {
    id: "pointer",
    num: "1",
    label: "Pointeur",
    desc: "Sélectionner et déplacer des objets (Clips, Notes, Automation)",
    icon: MousePointer
  },
  {
    id: "time",
    num: "2",
    label: "Durée",
    desc: "Sélection temporelle arbitraire sur la grille",
    icon: BetweenHorizontalStart
  },
  {
    id: "pencil",
    num: "3",
    label: "Crayon",
    desc: "Dessiner de nouveaux clips et notes",
    icon: Pencil
  },
  {
    id: "eraser",
    num: "4",
    label: "Gomme",
    desc: "Supprimer des clips ou portions au clic",
    icon: Eraser
  },
  {
    id: "knife",
    num: "5",
    label: "Cutter",
    desc: "Scinder un clip en deux à la mesure cliquée",
    icon: Scissors
  },
  {
    id: "slip",
    num: "6",
    label: "Coulisser",
    desc: "Faire coulisser le contenu d'un clip sans modifier ses frontières (Section 5.1.6)",
    icon: MoveHorizontal
  }
];

export default function MusicStudio({
  activeTool = "pointer",
  onSelectTool,
  mainView = "arrange",
  onSetMainView,
  snapValue = "1/16",
  onSelectSnap,
  showTrackIO = false,
  onToggleTrackIO,
  trackHeightMode = "normal",
  onToggleTrackHeight,
  showEffectTracks = true,
  onToggleEffectTracks,
  showDeactivatedTracks = true,
  onToggleDeactivatedTracks,
  followPlayhead = true,
  onToggleFollowPlayhead,
  timeSelection = null,
  onClearTimeSelection,
  setStatusHint
}) {
  const currentToolObj = STUDIO_TOOLS.find((t) => t.id === activeTool) || STUDIO_TOOLS[0];

  return (
    <div
      data-testid="studio-arranger-toolbar"
      className="h-9 bg-[#181818] border-b border-[#2b2b2b] px-3 flex items-center justify-between text-xs select-none relative z-30 shadow-sm"
    >
      {/* ── Left: View Toggles & 5 Universal Editing Tools ── */}
      <div className="flex items-center gap-3">
        {/* Primary View Switches (p. 81) */}
        <div className="flex items-center bg-[#121212] rounded border border-[#2d2d2d] p-0.5 gap-0.5">
          <button
            data-testid="btn-view-arrange"
            onClick={() => {
              if (onSetMainView) onSetMainView("arrange");
              if (setStatusHint) setStatusHint("Vue Arrangeur active");
            }}
            className={`px-2.5 py-1 rounded-md text-[10.5px] font-bold transition flex items-center gap-1.5 ${
              mainView === "arrange"
                ? "bg-[#241808] border-2 border-[#df9c43] text-[#eaaf5d] shadow-[0_0_8px_rgba(223,156,67,0.3)]"
                : "text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent"
            }`}
            title="Afficher l'Arrangeur linéaire temporel (Tab)"
          >
            <span>≡</span>
            <span>Arrangeur</span>
          </button>

          <button
            data-testid="btn-view-clips"
            onClick={() => {
              if (onSetMainView) onSetMainView("clips");
              if (setStatusHint) setStatusHint("Vue Lanceur de clips active");
            }}
            className={`px-2.5 py-1 rounded-md text-[10.5px] font-bold transition flex items-center gap-1.5 ${
              mainView === "clips"
                ? "bg-[#241808] border-2 border-[#df9c43] text-[#eaaf5d] shadow-[0_0_8px_rgba(223,156,67,0.3)]"
                : "text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent"
            }`}
            title="Afficher la matrice Lanceur de clips non-linéaire (Tab)"
          >
            <span>|||</span>
            <span>Clips</span>
          </button>
        </div>

        <div className="h-4 w-px bg-[#2f2f2f]" />

        {/* 5 Music Studio Editing Tools (p. 82-84) */}
        <div className="flex items-center gap-1">
          <span className="text-[9px] uppercase tracking-wider font-bold text-zinc-500 mr-0.5">
            Outils :
          </span>

          <div className="flex items-center bg-[#121212] rounded border border-[#2d2d2d] p-0.5 gap-0.5">
            {STUDIO_TOOLS.map((t) => {
              const IconComp = t.icon;
              const isActive = activeTool === t.id;
              return (
                <button
                  key={t.id}
                  data-testid={`tool-btn-${t.id}`}
                  onClick={() => {
                    if (onSelectTool) onSelectTool(t.id);
                    if (setStatusHint) setStatusHint(`Outil ${t.label} [${t.num}] actif : ${t.desc}`);
                  }}
                  className={`h-6 px-2 rounded-md flex items-center gap-1.5 transition text-[11px] ${
                    isActive
                      ? "bg-[#241808] border border-[#df9c43] text-[#eaaf5d] font-bold shadow-[0_0_6px_rgba(223,156,67,0.3)]"
                      : "text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                  title={`${t.label} [${t.num}] - ${t.desc}`}
                >
                  <IconComp size={12} className={isActive ? "text-[#df9c43]" : "text-zinc-400"} />
                  <span className="text-[10px] tracking-tight">{t.label}</span>
                  <span className={`text-[8.5px] font-mono px-1 rounded ${isActive ? "bg-black/40 text-amber-300 border border-white/5" : "bg-zinc-800 text-zinc-400"}`}>
                    {t.num}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Selection Indicator Chip (Tool 2) */}
        {timeSelection && (
          <div className="flex items-center gap-1.5 bg-amber-950/60 border border-amber-500/40 text-amber-300 px-2 py-0.5 rounded text-[10px] font-mono">
            <BetweenHorizontalStart size={11} className="text-amber-400" />
            <span>Sélection: {timeSelection.startBar} - {timeSelection.endBar} ({timeSelection.endBar - timeSelection.startBar + 1}b)</span>
            <button
              onClick={() => {
                if (onClearTimeSelection) onClearTimeSelection();
                if (setStatusHint) setStatusHint("Sélection temporelle effacée");
              }}
              className="hover:text-white hover:bg-amber-800/50 p-0.5 rounded ml-1"
              title="Désélectionner"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* ── Center: Active Tool Feedback & Magnetic Snap Grid ── */}
      <div className="hidden lg:flex items-center gap-3">
        <div className="text-[10px] text-zinc-400 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#df9c43] animate-pulse" />
          <span className="font-semibold text-zinc-200">{currentToolObj.label} [{currentToolObj.num}]</span>
          <span className="text-zinc-500">• {currentToolObj.desc}</span>
        </div>
      </div>

      {/* ── Right: Magnetism Snap & Bottom Switches (p. 84) ── */}
      <div className="flex items-center gap-2.5">
        {/* Magnetic Grid Snap */}
        <div className="flex items-center gap-1 text-[10.5px]">
          <Grid size={11} className="text-zinc-500" />
          <span className="text-[9.5px] uppercase font-bold text-zinc-500">Magnétisme :</span>
          <select
            data-testid="select-magnetic-snap"
            value={snapValue}
            onChange={(e) => {
              if (onSelectSnap) onSelectSnap(e.target.value);
              if (setStatusHint) setStatusHint(`Magnétisme calé sur : ${e.target.value}`);
            }}
            className="bg-[#121212] border border-[#2d2d2d] text-zinc-200 text-[10px] font-mono rounded px-1.5 py-0.5 focus:outline-none focus:border-[#df9c43]"
          >
            <option value="adaptatif">Adaptatif</option>
            <option value="1/1">1/1 (Mesure)</option>
            <option value="1/2">1/2 (Blanche)</option>
            <option value="1/4">1/4 (Noire)</option>
            <option value="1/8">1/8 (Croche)</option>
            <option value="1/16">1/16 (Double)</option>
            <option value="off">Désactivé</option>
          </select>
        </div>

        <div className="h-4 w-px bg-[#2f2f2f]" />

        {/* View Switches (French Manual Section 3.1.4, p. 84) */}
        <div className="flex items-center bg-[#121212] rounded border border-[#2d2d2d] p-0.5 gap-0.5">
          {/* 1. Track I/O Switch [E/S] */}
          <button
            data-testid="switch-track-io"
            onClick={() => {
              if (onToggleTrackIO) onToggleTrackIO();
              if (setStatusHint) setStatusHint(!showTrackIO ? "Entrées/Sorties affichées" : "Entrées/Sorties masquées");
            }}
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono transition ${
              showTrackIO ? "bg-[#241808] border border-[#df9c43] text-[#eaaf5d] shadow-[0_0_8px_rgba(223,156,67,0.3)]" : "text-zinc-400 hover:text-white"
            }`}
            title="Afficher/masquer la section Entrées/Sorties des pistes (p. 84)"
          >
            E/S
          </button>

          {/* 2. Track Height Switch [↕] */}
          <button
            data-testid="switch-track-height"
            onClick={() => {
              if (onToggleTrackHeight) onToggleTrackHeight();
              if (setStatusHint) setStatusHint(trackHeightMode === "normal" ? "Hauteur de piste : Demi-hauteur (Compact)" : "Hauteur de piste : Normale");
            }}
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition flex items-center gap-0.5 ${
              trackHeightMode === "compact" ? "bg-[#241808] border border-[#df9c43] text-[#eaaf5d] shadow-[0_0_8px_rgba(223,156,67,0.3)]" : "text-zinc-400 hover:text-white"
            }`}
            title="Basculer entre hauteur normale (64px) et demi-hauteur (38px) (p. 84)"
          >
            {trackHeightMode === "compact" ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
            <span>↕</span>
          </button>

          {/* 3. Effect Tracks Switch [FX] */}
          <button
            data-testid="switch-effect-tracks"
            onClick={() => {
              if (onToggleEffectTracks) onToggleEffectTracks();
              if (setStatusHint) setStatusHint(!showEffectTracks ? "Pistes d'effets affichées" : "Pistes d'effets masquées");
            }}
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono transition ${
              showEffectTracks ? "bg-cyan-950 text-cyan-300 border border-cyan-700/50" : "text-zinc-500 hover:text-white"
            }`}
            title="Afficher/masquer les pistes d'effets aux (p. 84)"
          >
            FX
          </button>

          {/* 4. Deactivated Tracks Switch [OFF] */}
          <button
            data-testid="switch-deactivated-tracks"
            onClick={() => {
              if (onToggleDeactivatedTracks) onToggleDeactivatedTracks();
              if (setStatusHint) setStatusHint(!showDeactivatedTracks ? "Pistes désactivées affichées" : "Pistes désactivées masquées");
            }}
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono transition ${
              showDeactivatedTracks ? "bg-zinc-800 text-zinc-300" : "text-zinc-600 hover:text-white"
            }`}
            title="Afficher/masquer les pistes désactivées (p. 84)"
          >
            OFF
          </button>

          {/* 5. Follow Playhead Switch [▶] */}
          <button
            data-testid="switch-follow-playhead"
            onClick={() => {
              if (onToggleFollowPlayhead) onToggleFollowPlayhead();
              if (setStatusHint) setStatusHint(!followPlayhead ? "Suivi de lecture ACTIF" : "Suivi de lecture DÉSACTIVÉ");
            }}
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition flex items-center gap-0.5 ${
              followPlayhead ? "bg-emerald-950 text-emerald-300 border border-emerald-700/50" : "text-zinc-500 hover:text-white"
            }`}
            title="Garder la tête de lecture constamment à l'écran (p. 84)"
          >
            <Play size={10} className={followPlayhead ? "fill-emerald-400 text-emerald-400" : ""} />
            <span>Suivre</span>
          </button>
        </div>
      </div>
    </div>
  );
}
