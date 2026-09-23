"use client";

import React, { useState, useRef, useEffect } from "react";

/**
 * Music Studio 5/6 Audio Clip Fade In/Out & Bézier Crossfade Overlay
 * Reference: Music Studio User Guide French (Section 5.1.7, p. 149–152)
 *
 * Capabilities:
 * - Top-left white triangle handle: Fade In duration (bars)
 * - Top-right white triangle handle: Fade Out duration (bars)
 * - Center curve handle: Bézier slope tension curvature (-1.0 to 1.0)
 * - Semi-transparent darkening mask over waveform showing exact gain attenuation
 * - Real-time tooltip feedback displaying fade duration in milliseconds & bars
 */

export default function MusicStudio({
  clip,
  track,
  clipWidthPx,
  clipHeightPx = 48,
  barWidthPx,
  bpm = 120,
  onUpdateFade,
  setStatusHint
}) {
  const [isDraggingFadeIn, setIsDraggingFadeIn] = useState(false);
  const [isDraggingFadeOut, setIsDraggingFadeOut] = useState(false);
  const [isDraggingCurve, setIsDraggingCurve] = useState(false);
  const [hoveredHandle, setHoveredHandle] = useState(null); // 'in' | 'out' | 'curve'

  const dragStartXRef = useRef(0);
  const dragStartYRef = useRef(0);
  const initialFadeInRef = useRef(0);
  const initialFadeOutRef = useRef(0);
  const initialCurveRef = useRef(0);

  const totalBars = clip.bars || 8;
  const fadeInBars = Math.min(totalBars / 2, Math.max(0, clip.fadeInBars !== undefined ? clip.fadeInBars : 0.5));
  const fadeOutBars = Math.min(totalBars / 2, Math.max(0, clip.fadeOutBars !== undefined ? clip.fadeOutBars : 0.5));
  const fadeCurve = clip.fadeCurve !== undefined ? clip.fadeCurve : 0; // -1 to 1

  const fadeInPx = Math.max(0, Math.min(clipWidthPx / 2, (fadeInBars / totalBars) * clipWidthPx));
  const fadeOutPx = Math.max(0, Math.min(clipWidthPx / 2, (fadeOutBars / totalBars) * clipWidthPx));

  const secPerBar = 240 / (bpm || 120);

  // Compute Bézier curve points for Fade In: (0, clipHeightPx) -> (fadeInPx, 0)
  const fadeInControlX = fadeInPx * (0.5 + fadeCurve * 0.35);
  const fadeInControlY = clipHeightPx * (0.5 - fadeCurve * 0.35);
  const fadeInPath = `M 0,0 L ${fadeInPx},0 Q ${fadeInControlX},${fadeInControlY} 0,${clipHeightPx} Z`;
  const fadeInCurveStroke = `M 0,${clipHeightPx} Q ${fadeInControlX},${fadeInControlY} ${fadeInPx},0`;

  // Compute Bézier curve points for Fade Out: (clipWidthPx - fadeOutPx, 0) -> (clipWidthPx, clipHeightPx)
  const fadeOutStartX = clipWidthPx - fadeOutPx;
  const fadeOutControlX = fadeOutStartX + fadeOutPx * (0.5 - fadeCurve * 0.35);
  const fadeOutControlY = clipHeightPx * (0.5 - fadeCurve * 0.35);
  const fadeOutPath = `M ${fadeOutStartX},0 L ${clipWidthPx},0 L ${clipWidthPx},${clipHeightPx} Q ${fadeOutControlX},${fadeOutControlY} ${fadeOutStartX},0 Z`;
  const fadeOutCurveStroke = `M ${fadeOutStartX},0 Q ${fadeOutControlX},${fadeOutControlY} ${clipWidthPx},${clipHeightPx}`;

  // Handle global mouse move during drag
  useEffect(() => {
    if (!isDraggingFadeIn && !isDraggingFadeOut && !isDraggingCurve) return;

    const handleMouseMove = (e) => {
      const deltaX = e.clientX - dragStartXRef.current;
      const deltaY = e.clientY - dragStartYRef.current;

      if (isDraggingFadeIn) {
        const deltaBars = (deltaX / clipWidthPx) * totalBars;
        const newFadeInBars = Math.max(0, Math.min(totalBars / 2, Number((initialFadeInRef.current + deltaBars).toFixed(2))));
        if (onUpdateFade) {
          onUpdateFade(clip.id, { fadeInBars: newFadeInBars });
        }
        if (setStatusHint) {
          const ms = Math.round(newFadeInBars * secPerBar * 1000);
          setStatusHint(`Fondu d'entrée (Fade In) : ${newFadeInBars} b (${ms} ms)`);
        }
      } else if (isDraggingFadeOut) {
        // Dragging left increases fade out
        const deltaBars = (-deltaX / clipWidthPx) * totalBars;
        const newFadeOutBars = Math.max(0, Math.min(totalBars / 2, Number((initialFadeOutRef.current + deltaBars).toFixed(2))));
        if (onUpdateFade) {
          onUpdateFade(clip.id, { fadeOutBars: newFadeOutBars });
        }
        if (setStatusHint) {
          const ms = Math.round(newFadeOutBars * secPerBar * 1000);
          setStatusHint(`Fondu de sortie (Fade Out) : ${newFadeOutBars} b (${ms} ms)`);
        }
      } else if (isDraggingCurve) {
        // Dragging up gives positive curve (logarithmic), dragging down gives negative (exponential)
        const deltaCurve = (-deltaY / (clipHeightPx / 2));
        const newCurve = Math.max(-1.0, Math.min(1.0, Number((initialCurveRef.current + deltaCurve).toFixed(2))));
        if (onUpdateFade) {
          onUpdateFade(clip.id, { fadeCurve: newCurve });
        }
        if (setStatusHint) {
          const type = newCurve > 0.05 ? "Logarithmique" : newCurve < -0.05 ? "Exponentielle" : "Linéaire";
          setStatusHint(`Courbure de fondu Bézier : ${newCurve > 0 ? "+" : ""}${newCurve} (${type})`);
        }
      }
    };

    const handleMouseUp = () => {
      setIsDraggingFadeIn(false);
      setIsDraggingFadeOut(false);
      setIsDraggingCurve(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingFadeIn, isDraggingFadeOut, isDraggingCurve, clipWidthPx, totalBars, clip.id, onUpdateFade, setStatusHint, secPerBar]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-10">
      {/* SVG Shading Masks & Bézier Curves */}
      <svg className="w-full h-full absolute inset-0">
        {/* Fade In Shading & Curve Line */}
        {fadeInPx > 2 && (
          <>
            <path d={fadeInPath} fill="rgba(0, 0, 0, 0.45)" />
            <path
              d={fadeInCurveStroke}
              fill="none"
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeLinecap="round"
              className="drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]"
            />
          </>
        )}

        {/* Fade Out Shading & Curve Line */}
        {fadeOutPx > 2 && (
          <>
            <path d={fadeOutPath} fill="rgba(0, 0, 0, 0.45)" />
            <path
              d={fadeOutCurveStroke}
              fill="none"
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeLinecap="round"
              className="drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]"
            />
          </>
        )}
      </svg>

      {/* ── Interactive Handles (Pointer events enabled) ── */}
      {/* 1. Fade In Triangle Handle (Top-Left, p. 149) */}
      <div
        data-testid="fade-in-handle"
        onMouseEnter={() => setHoveredHandle("in")}
        onMouseLeave={() => setHoveredHandle(null)}
        onMouseDown={(e) => {
          e.stopPropagation();
          dragStartXRef.current = e.clientX;
          initialFadeInRef.current = fadeInBars;
          setIsDraggingFadeIn(true);
        }}
        style={{ left: `${Math.max(0, fadeInPx - 6)}px` }}
        className="absolute top-0 w-3.5 h-3.5 pointer-events-auto cursor-ew-resize flex items-center justify-center group z-30"
        title="Tirer pour ajuster le fondu d'entrée (Fade In)"
      >
        <div className="w-0 h-0 border-t-[8px] border-t-white border-r-[8px] border-r-transparent opacity-85 group-hover:opacity-100 group-hover:scale-125 transition drop-shadow" />
      </div>

      {/* 2. Fade Out Triangle Handle (Top-Right, p. 149) */}
      <div
        data-testid="fade-out-handle"
        onMouseEnter={() => setHoveredHandle("out")}
        onMouseLeave={() => setHoveredHandle(null)}
        onMouseDown={(e) => {
          e.stopPropagation();
          dragStartXRef.current = e.clientX;
          initialFadeOutRef.current = fadeOutBars;
          setIsDraggingFadeOut(true);
        }}
        style={{ left: `${Math.min(clipWidthPx - 10, clipWidthPx - fadeOutPx)}px` }}
        className="absolute top-0 w-3.5 h-3.5 pointer-events-auto cursor-ew-resize flex items-center justify-center group z-30"
        title="Tirer pour ajuster le fondu de sortie (Fade Out)"
      >
        <div className="w-0 h-0 border-t-[8px] border-t-white border-l-[8px] border-l-transparent opacity-85 group-hover:opacity-100 group-hover:scale-125 transition drop-shadow" />
      </div>

      {/* 3. Bézier Curve Tension Handle (Middle of Fade In curve, p. 151) */}
      {fadeInPx > 16 && (
        <div
          data-testid="fade-curve-handle"
          onMouseEnter={() => setHoveredHandle("curve")}
          onMouseLeave={() => setHoveredHandle(null)}
          onMouseDown={(e) => {
            e.stopPropagation();
            dragStartYRef.current = e.clientY;
            initialCurveRef.current = fadeCurve;
            setIsDraggingCurve(true);
          }}
          style={{
            left: `${fadeInControlX}px`,
            top: `${fadeInControlY}px`
          }}
          className="absolute -translate-x-1/2 -translate-y-1/2 w-3 h-3 pointer-events-auto cursor-ns-resize flex items-center justify-center group z-30"
          title="Alt-cliquer ou tirer verticalement pour régler la courbure Bézier (p. 151)"
        >
          <div className="w-2 h-2 rounded-full bg-white ring-2 ring-black/80 group-hover:scale-150 transition drop-shadow" />
        </div>
      )}

      {/* Hover Info Tooltip */}
      {hoveredHandle && (
        <div
          style={{
            left: hoveredHandle === "in" ? `${fadeInPx + 4}px` : hoveredHandle === "out" ? `${clipWidthPx - fadeOutPx - 60}px` : `${fadeInControlX + 4}px`,
            top: "2px"
          }}
          className="absolute bg-black/90 border border-white/20 text-white text-[8px] font-mono px-1.5 py-0.5 rounded shadow pointer-events-none z-40 whitespace-nowrap"
        >
          {hoveredHandle === "in" && `In: ${fadeInBars} b (${Math.round(fadeInBars * secPerBar * 1000)} ms)`}
          {hoveredHandle === "out" && `Out: ${fadeOutBars} b (${Math.round(fadeOutBars * secPerBar * 1000)} ms)`}
          {hoveredHandle === "curve" && `Courbure: ${fadeCurve > 0 ? "+" : ""}${fadeCurve}`}
        </div>
      )}
    </div>
  );
}
