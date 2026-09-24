"use client";

import React, { useState, useEffect } from "react";
import {
  Scissors,
  Copy,
  Zap,
  Radio,
  Trash2,
  RotateCcw,
  Volume2,
  Sparkles,
  X
} from "lucide-react";

/**
 * 8 Secteurs du Menu Radial d'Actions Studio (Chapitre 18, p. 553-558)
 */
export const RADIAL_ACTIONS = [
  {
    id: "split",
    angleDeg: -90, // Nord (0°)
    name: "Scinder",
    desc: "Scinder au curseur",
    icon: Scissors,
    color: "#f59e0b" // Ambre
  },
  {
    id: "duplicate",
    angleDeg: -45, // Nord-Est (45°)
    name: "Dupliquer",
    desc: "Dupliquer le clip",
    icon: Copy,
    color: "#3b82f6" // Bleu
  },
  {
    id: "bounce",
    angleDeg: 0, // Est (90°)
    name: "Bounce",
    desc: "Rendu sur place",
    icon: Zap,
    color: "#b87524" // Sahel Gold Studio
  },
  {
    id: "slice",
    angleDeg: 45, // Sud-Est (135°)
    name: "Slice Drum",
    desc: "Découper en pads",
    icon: Radio,
    color: "#10b981" // Émeraude
  },
  {
    id: "delete",
    angleDeg: 90, // Sud (180°)
    name: "Supprimer",
    desc: "Effacer le clip",
    icon: Trash2,
    color: "#ef4444" // Rouge
  },
  {
    id: "reverse",
    angleDeg: 135, // Sud-Ouest (225°)
    name: "Inverser",
    desc: "Inverser la forme d'onde",
    icon: RotateCcw,
    color: "#8b5cf6" // Violet
  },
  {
    id: "normalize",
    angleDeg: 180, // Ouest (270°)
    name: "Normaliser",
    desc: "Crête à 0 dBFS",
    icon: Volume2,
    color: "#06b6d4" // Cyan
  },
  {
    id: "ai_remix",
    angleDeg: -135, // Nord-Ouest (315°)
    name: "Remix IA",
    desc: "Régénérer par l'IA",
    icon: Sparkles,
    color: "#df9c43" // Sahel Gold Logo
  }
];

/**
 * Calcul d'un segment annulaire SVG (Wedge / Donut slice)
 */
function describeArc(x, y, innerRadius, outerRadius, startAngleDeg, endAngleDeg) {
  const toRad = (deg) => ((deg - 90) * Math.PI) / 180;
  const startRad = toRad(startAngleDeg);
  const endRad = toRad(endAngleDeg);

  const x1 = x + outerRadius * Math.cos(startRad);
  const y1 = y + outerRadius * Math.sin(startRad);
  const x2 = x + outerRadius * Math.cos(endRad);
  const y2 = y + outerRadius * Math.sin(endRad);

  const x3 = x + innerRadius * Math.cos(endRad);
  const y3 = y + innerRadius * Math.sin(endRad);
  const x4 = x + innerRadius * Math.cos(startRad);
  const y4 = y + innerRadius * Math.sin(startRad);

  const largeArcFlag = endAngleDeg - startAngleDeg <= 180 ? "0" : "1";

  return `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`;
}

/**
 * Composant MusicStudioRadialMenu : Menu Radial d'Actions Tactile et Bureau
 */
export default function MusicStudioRadialMenu({
  x,
  y,
  clip,
  track,
  onAction,
  onClose
}) {
  const [hoveredActionId, setHoveredActionId] = useState(null);

  // Fermeture par touche Échap
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const activeAction = RADIAL_ACTIONS.find((a) => a.id === hoveredActionId);

  const centerRadius = 46;
  const outerRadius = 128;
  const wedgeSpan = 42; // degrés par secteur (avec 3° de séparation)

  return (
    <div
      data-testid="music-studio-radial-menu"
      onClick={onClose}
      className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center select-none"
    >
      {/* Conteneur circulaire positionné aux coordonnées du clic */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "fixed",
          left: `${Math.min(window.innerWidth - 300, Math.max(150, x))}px`,
          top: `${Math.min(window.innerHeight - 300, Math.max(150, y))}px`,
          transform: "translate(-50%, -50%)"
        }}
        className="w-72 h-72 rounded-full relative flex items-center justify-center drop-shadow-[0_20px_50px_rgba(0,0,0,0.9)]"
      >
        {/* SVG des 8 Secteurs circulaires */}
        <svg className="w-full h-full absolute inset-0 pointer-events-auto" viewBox="-150 -150 300 300">
          {RADIAL_ACTIONS.map((action, i) => {
            const startAngle = (i * 360) / 8 - wedgeSpan / 2;
            const endAngle = (i * 360) / 8 + wedgeSpan / 2;
            const isHovered = hoveredActionId === action.id;
            const pathData = describeArc(0, 0, centerRadius, isHovered ? outerRadius + 8 : outerRadius, startAngle, endAngle);

            // Coordonnées pour l'icône
            const midAngleRad = (((i * 360) / 8 - 90) * Math.PI) / 180;
            const iconR = (centerRadius + outerRadius) / 2;
            const iconX = iconR * Math.cos(midAngleRad);
            const iconY = iconR * Math.sin(midAngleRad);

            return (
              <g
                key={action.id}
                onMouseEnter={() => setHoveredActionId(action.id)}
                onMouseLeave={() => setHoveredActionId(null)}
                onClick={() => {
                  onAction(action.id, clip, track);
                  onClose();
                }}
                className="cursor-pointer transition-all duration-150"
              >
                {/* Sector Path */}
                <path
                  d={pathData}
                  fill={isHovered ? action.color : "#1c1c1c"}
                  stroke={isHovered ? "#ffffff" : "#2d2d2d"}
                  strokeWidth={isHovered ? 2 : 1}
                  className="transition-colors duration-150 filter hover:brightness-110"
                />

                {/* Sector Icon representation */}
                <circle
                  cx={iconX}
                  cy={iconY}
                  r={15}
                  fill={isHovered ? "#ffffff" : "#262626"}
                  opacity={isHovered ? 0.95 : 0.6}
                />
              </g>
            );
          })}
        </svg>

        {/* HTML Overlaid Icons on each sector */}
        {RADIAL_ACTIONS.map((action, i) => {
          const midAngleRad = (((i * 360) / 8 - 90) * Math.PI) / 180;
          const iconR = (centerRadius + outerRadius) / 2;
          const iconX = iconR * Math.cos(midAngleRad) + 144;
          const iconY = iconR * Math.sin(midAngleRad) + 144;
          const isHovered = hoveredActionId === action.id;
          const IconComp = action.icon;

          return (
            <div
              key={`icon_${action.id}`}
              style={{
                left: `${iconX}px`,
                top: `${iconY}px`,
                transform: "translate(-50%, -50%)"
              }}
              onMouseEnter={() => setHoveredActionId(action.id)}
              onClick={() => {
                onAction(action.id, clip, track);
                onClose();
              }}
              className={`absolute pointer-events-none flex flex-col items-center justify-center transition-transform ${
                isHovered ? "scale-125" : "scale-100"
              }`}
            >
              <IconComp
                size={14}
                className={isHovered ? "text-black" : "text-zinc-200"}
              />
              <span
                className={`text-[8.5px] font-bold font-mono uppercase mt-0.5 whitespace-nowrap drop-shadow ${
                  isHovered ? "text-black font-extrabold" : "text-zinc-400"
                }`}
              >
                {action.name}
              </span>
            </div>
          );
        })}

        {/* Center Hub: Displays hovered action description or selected clip name */}
        <div
          onClick={onClose}
          className="w-20 h-20 rounded-full bg-[#121212] border-2 border-[#333333] hover:border-[#df9c43] flex flex-col items-center justify-center p-1.5 text-center cursor-pointer z-10 transition-colors shadow-2xl group"
        >
          {activeAction ? (
            <div className="flex flex-col items-center">
              <span
                className="text-[9px] font-black uppercase font-mono tracking-wider truncate max-w-[68px]"
                style={{ color: activeAction.color }}
              >
                {activeAction.name}
              </span>
              <span className="text-[7.5px] text-zinc-400 leading-tight mt-0.5 max-w-[64px] text-center">
                {activeAction.desc}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center text-zinc-400 group-hover:text-white">
              <span className="text-[8px] font-mono text-zinc-500 uppercase">CLIP</span>
              <span className="text-[9px] font-bold text-white truncate max-w-[64px]">
                {clip?.name || "Action"}
              </span>
              <span className="text-[7px] text-zinc-500 mt-0.5">[Échap]</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
