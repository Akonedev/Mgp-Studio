"use client";

import React, { useState } from "react";
import {
  X,
  Check,
  Copy,
  ExternalLink,
  Sparkles,
  Music,
  Disc,
  Layers,
  Clock,
  Sliders,
  FileText,
  Mic,
  Zap,
  Radio,
  ChevronRight,
  Info
} from "lucide-react";

export function CuratedStyleModal({ isOpen, onClose, style, onApplyStyle, onDirectGenerate }) {
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedLyrics, setCopiedLyrics] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'instruments' | 'structure' | 'lyrics'

  if (!isOpen || !style) return null;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(style.masterPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleCopyLyrics = () => {
    navigator.clipboard.writeText(style.lyricsTemplate);
    setCopiedLyrics(true);
    setTimeout(() => setCopiedLyrics(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100">
        
        {/* ── HEADER BANNER ── */}
        <div className={`relative p-5 sm:p-6 bg-gradient-to-r ${style.color || "from-[#df9c43] to-[#784c15]"} border-b border-white/10 flex-shrink-0`}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
          
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/20 text-white backdrop-blur-sm border border-white/20">
                  {style.category}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-black/40 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                  <Sparkles size={11} />
                  {style.badge}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                {style.name}
              </h2>

              <p className="text-xs sm:text-sm text-zinc-200/90 font-medium">
                <span className="text-zinc-400">Références :</span> {style.referenceArtists}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {style.originUrl && (
                <a
                  href={style.originUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-red-600/90 hover:bg-red-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-lg shadow-red-600/20"
                  title="Écouter la référence originale sur YouTube"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  <span>YouTube</span>
                  <ExternalLink size={12} />
                </a>
              )}

              <button
                onClick={onClose}
                className="p-1.5 rounded-xl bg-black/40 hover:bg-black/60 text-zinc-300 hover:text-white transition-all border border-white/10"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Quick Stats Strip */}
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-white/15 text-xs">
            <div className="bg-black/30 backdrop-blur-sm rounded-xl p-2 border border-white/10">
              <span className="text-zinc-400 block text-[10px] uppercase font-bold">Tempo (BPM)</span>
              <span className="font-bold text-white text-sm">{style.defaultBpm} BPM</span>
              <span className="text-[10px] text-zinc-400 ml-1">({style.bpmRange?.[0]}-{style.bpmRange?.[1]})</span>
            </div>

            <div className="bg-black/30 backdrop-blur-sm rounded-xl p-2 border border-white/10">
              <span className="text-zinc-400 block text-[10px] uppercase font-bold">Tonalité / Gamme</span>
              <span className="font-bold text-amber-300 text-sm">{style.keySignature}</span>
              <span className="text-[10px] text-zinc-400 ml-1">({style.timeSignature})</span>
            </div>

            <div className="bg-black/30 backdrop-blur-sm rounded-xl p-2 border border-white/10">
              <span className="text-zinc-400 block text-[10px] uppercase font-bold">Modèle Préféré</span>
              <span className="font-bold text-[#f5c277] text-sm capitalize">{style.suggestedModel}</span>
            </div>

            <div className="bg-black/30 backdrop-blur-sm rounded-xl p-2 border border-white/10">
              <span className="text-zinc-400 block text-[10px] uppercase font-bold">Voix & Cadence</span>
              <span className="font-bold text-cyan-300 text-xs truncate block">
                {style.vocalProfile?.gender || "Adaptative"} ({style.vocalProfile?.language?.toUpperCase() || "FR/EN"})
              </span>
            </div>
          </div>
        </div>

        {/* ── NAVIGATION TABS ── */}
        <div className="flex items-center gap-1 px-4 pt-3 border-b border-white/10 bg-zinc-900/50 flex-shrink-0">
          {[
            { id: "overview", label: "Aperçu & Prompts", icon: Info },
            { id: "instruments", label: "5 Tiers d'Instrumentation", icon: Sliders },
            { id: "structure", label: "Organisation & Sections", icon: Layers },
            { id: "lyrics", label: "Paroles & Template", icon: FileText }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                  active
                    ? "border-[#df9c43] text-white bg-white/5 rounded-t-lg"
                    : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]"
                }`}
              >
                <Icon size={14} className={active ? "text-[#df9c43]" : "text-zinc-500"} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── MODAL CONTENT (SCROLLABLE) ── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 space-y-6">
          
          {/* TAB 1: OVERVIEW & PROMPTS */}
          {activeTab === "overview" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Description */}
              <div className="p-4 rounded-xl bg-zinc-900/70 border border-white/10 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Music size={13} className="text-[#df9c43]" />
                  Description Musicologique & Signature Sonore
                </h3>
                <p className="text-sm text-zinc-200 leading-relaxed">
                  {style.description}
                </p>
              </div>

              {/* Master Prompt */}
              <div className="p-4 rounded-xl bg-zinc-900/70 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#df9c43] flex items-center gap-1.5">
                    <Sparkles size={13} />
                    Master Prompt Neural Optimisé (ACE-Step / DiT / MiniMax)
                  </h3>
                  <button
                    onClick={handleCopyPrompt}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-zinc-300 hover:text-white transition-all border border-white/10"
                  >
                    {copiedPrompt ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span>{copiedPrompt ? "Copié !" : "Copier"}</span>
                  </button>
                </div>
                <div className="p-3 bg-black/60 rounded-lg border border-white/5 text-xs text-zinc-300 font-mono leading-relaxed select-all">
                  {style.masterPrompt}
                </div>
              </div>

              {/* Negative Prompt */}
              {style.negativePrompt && (
                <div className="p-3.5 rounded-xl bg-zinc-900/50 border border-red-500/20 space-y-1.5">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-red-400">
                    Negative Prompt (Éléments sonores exclus)
                  </h4>
                  <p className="text-xs text-zinc-400 font-mono">
                    {style.negativePrompt}
                  </p>
                </div>
              )}

              {/* Vocal Profile Summary */}
              {style.vocalProfile && (
                <div className="p-4 rounded-xl bg-zinc-900/70 border border-white/10 space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                    <Mic size={13} />
                    Profil Vocal & Traitement Audio
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 bg-black/40 rounded-lg border border-white/5">
                      <span className="text-zinc-500 block text-[10px] uppercase">Style & Registre</span>
                      <span className="text-zinc-200 font-medium">{style.vocalProfile.style}</span>
                    </div>
                    <div className="p-2.5 bg-black/40 rounded-lg border border-white/5">
                      <span className="text-zinc-500 block text-[10px] uppercase">Effets & Traitement</span>
                      <span className="text-zinc-200 font-medium">{style.vocalProfile.effects}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: INSTRUMENTATION (5 TIERS) */}
          {activeTab === "instruments" && style.instruments && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Décomposition Acoustique et Mixage (5 Couches Sonores)
                </h3>
                <span className="text-[11px] text-[#df9c43] font-medium">Ingénierie SOTA</span>
              </div>

              {/* 1. Rhythm */}
              <div className="p-4 rounded-xl bg-zinc-900/70 border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>1. Rythmique & Percussions</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {style.instruments.rhythm?.map((inst, i) => (
                    <span key={i} className="px-2.5 py-1 bg-amber-500/10 text-amber-200 border border-amber-500/30 rounded-lg text-xs font-medium">
                      {inst}
                    </span>
                  ))}
                </div>
              </div>

              {/* 2. Bass */}
              <div className="p-4 rounded-xl bg-zinc-900/70 border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>2. Basse & Sub-Basses</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {style.instruments.bass?.map((inst, i) => (
                    <span key={i} className="px-2.5 py-1 bg-[#df9c43]/10 text-amber-200 border border-[#df9c43]/30 rounded-lg text-xs font-medium">
                      {inst}
                    </span>
                  ))}
                </div>
              </div>

              {/* 3. Harmony */}
              <div className="p-4 rounded-xl bg-zinc-900/70 border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span>3. Harmonie, Accords & Claviers</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {style.instruments.harmony?.map((inst, i) => (
                    <span key={i} className="px-2.5 py-1 bg-cyan-500/10 text-cyan-200 border border-cyan-500/30 rounded-lg text-xs font-medium">
                      {inst}
                    </span>
                  ))}
                </div>
              </div>

              {/* 4. Melody */}
              <div className="p-4 rounded-xl bg-zinc-900/70 border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>4. Mélodie & Instruments Lead</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {style.instruments.melody?.map((inst, i) => (
                    <span key={i} className="px-2.5 py-1 bg-emerald-500/10 text-emerald-200 border border-emerald-500/30 rounded-lg text-xs font-medium">
                      {inst}
                    </span>
                  ))}
                </div>
              </div>

              {/* 5. Textures */}
              <div className="p-4 rounded-xl bg-zinc-900/70 border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  <span>5. Textures, Saturation & Espace Sonore</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {style.instruments.textures?.map((inst, i) => (
                    <span key={i} className="px-2.5 py-1 bg-purple-500/10 text-purple-200 border border-purple-500/30 rounded-lg text-xs font-medium">
                      {inst}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STRUCTURE & ARRANGEMENT */}
          {activeTab === "structure" && style.structure && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Progression Musicale & Plan de Morceau ({style.structure.length} Sections)
                </h3>
                <span className="text-[11px] text-zinc-400">Structure formelle professionnelle</span>
              </div>

              <div className="space-y-2.5">
                {style.structure.map((sec, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-zinc-900/70 border border-white/10 flex items-start gap-3.5 hover:border-[#df9c43]/30 transition-all"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#df9c43]/10 text-[#df9c43] border border-[#df9c43]/20 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-sm text-white">{sec.name}</h4>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-white/5 text-zinc-400 border border-white/10">
                          {sec.bars} mesures
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">{sec.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: LYRICS & TEMPLATE */}
          {activeTab === "lyrics" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Modèle de Paroles Structuré (Prêt pour YuE2 & MiniMax)
                </h3>
                <button
                  onClick={handleCopyLyrics}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-zinc-300 hover:text-white transition-all border border-white/10"
                >
                  {copiedLyrics ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copiedLyrics ? "Copié !" : "Copier les paroles"}</span>
                </button>
              </div>

              <div className="p-4 bg-black/60 rounded-xl border border-white/10 font-mono text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed max-h-[380px] overflow-y-auto custom-scrollbar select-all">
                {style.lyricsTemplate || "Morceau principalement instrumental. Aucun modèle de paroles nécessaire."}
              </div>
            </div>
          )}
        </div>

        {/* ── FOOTER ACTIONS ── */}
        <div className="p-4 bg-zinc-900 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>NVIDIA DGX Spark GB10 Prêt</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                onApplyStyle(style, false);
                onClose();
              }}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs border border-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-1.5"
            >
              <Sliders size={14} className="text-[#df9c43]" />
              <span>Appliquer au Studio</span>
            </button>

            <button
              onClick={() => {
                onDirectGenerate(style);
                onClose();
              }}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#df9c43] to-[#c98837] hover:from-[#eaaf5d] hover:to-[#df9c43] text-zinc-950 font-extrabold text-xs shadow-lg shadow-[#df9c43]/30 transition-all flex items-center justify-center gap-1.5 active:scale-98"
            >
              <Zap size={14} />
              <span>Générer ce Style Immédiatement</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
