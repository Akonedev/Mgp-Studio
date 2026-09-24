"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Search,
  X,
  Star,
  Sliders,
  Sparkles,
  Music,
  Folder,
  Layers,
  Check,
  Play,
  Volume2,
  Tag,
  Grid,
  Zap,
  CornerDownRight
} from "lucide-react";

/**
 * Music Studio 5/6 Universal 4-Column Pop-up Browser
 * Reference: Music Studio User Guide French (Chapter 8, p. 235–262)
 *
 * 4 Columns:
 * 1. Smart Collections (Favoris, All, Factory, Instruments, FX, Grid, AI)
 * 2. Categories (Delay, Dynamics, EQ, Modulation, Synth, etc.)
 * 3. Creators / Tags (Music Studio, OGA Sahel, Analog, Vintage, Clean, etc.)
 * 4. Results List (with preview, detailed info card & insert button)
 */

export const STUDIO_BROWSER_ITEMS = [
  // ── INSTRUMENTS & THE GRID ──
  {
    id: "dev_polysynth",
    name: "PolySynth",
    type: "Instrument",
    collection: "Instruments",
    category: "Synthesis",
    creator: "Studio Factory",
    tags: ["Analog", "Polyphonic", "Subtractive"],
    desc: "Synthétiseur soustractif polyphonique avec double oscillateur et modulation MPE.",
    isFavorite: true
  },
  {
    id: "dev_polygrid",
    name: "Poly Grid",
    type: "The Grid",
    collection: "The Grid",
    category: "Synthesis",
    creator: "Studio Factory",
    tags: ["Modular", "Polyphonic", "DSP"],
    desc: "Environnement de synthèse modulaire polyphonique haute résolution sans compromis.",
    isFavorite: true
  },
  {
    id: "dev_fxgrid",
    name: "FX Grid",
    type: "The Grid",
    collection: "The Grid",
    category: "Modulation",
    creator: "Studio Factory",
    tags: ["Modular", "Audio FX", "DSP"],
    desc: "Environnement d'effets audio modulaire pour concevoir des processeurs de signaux custom.",
    isFavorite: false
  },
  {
    id: "dev_drum_machine",
    name: "Drum Machine",
    type: "Instrument",
    collection: "Instruments",
    category: "Drum & Percussion",
    creator: "Studio Factory",
    tags: ["Drums", "Sampler", "Multi-Pad"],
    desc: "Rack de percussions 16 pads avec chaînes d'effets et sous-canaux audio discrets.",
    isFavorite: true
  },
  {
    id: "dev_sampler",
    name: "Sampler",
    type: "Instrument",
    collection: "Instruments",
    category: "Synthesis",
    creator: "Studio Factory",
    tags: ["Acoustic", "Loop", "Granular"],
    desc: "Échantillonneur avancé avec modes Granular, Cycles et multisampling multisouche.",
    isFavorite: false
  },

  // ── AUDIO FX (DELAYS, REVERBS, DYNAMICS, EQ) ──
  {
    id: "dev_delay_plus",
    name: "Delay+",
    type: "Audio FX",
    collection: "Effets Audio",
    category: "Delay & Reverb",
    creator: "Studio Factory",
    tags: ["Delay", "Echo", "Modulation"],
    desc: "Ligne de retard stéréo avec coloration analogique/numérique, ducking et duck-duck filter.",
    isFavorite: true
  },
  {
    id: "dev_reverb",
    name: "Reverb",
    type: "Audio FX",
    collection: "Effets Audio",
    category: "Delay & Reverb",
    creator: "Studio Factory",
    tags: ["Spacial", "Reverb", "Diffusion"],
    desc: "Réverbération algorithmique riche simulant pièces, halls et plaques avec diffusion dynamique.",
    isFavorite: true
  },
  {
    id: "dev_eq_plus",
    name: "EQ+",
    type: "Audio FX",
    collection: "Effets Audio",
    category: "EQ & Filter",
    creator: "Studio Factory",
    tags: ["Equalizer", "Clean", "Analyzer"],
    desc: "Égaliseur paramétrique 8 bandes avec analyseur de spectre FFT temps réel et mode Solo.",
    isFavorite: true
  },
  {
    id: "dev_compressor",
    name: "Compressor",
    type: "Audio FX",
    collection: "Effets Audio",
    category: "Dynamics",
    creator: "Studio Factory",
    tags: ["Dynamics", "Sidechain", "Clean"],
    desc: "Compresseur de dynamique de studio transparent avec entrée sidechain et courbe de genou variable.",
    isFavorite: false
  },
  {
    id: "dev_saturator",
    name: "Saturator",
    type: "Audio FX",
    collection: "Effets Audio",
    category: "Distortion & Saturation",
    creator: "Studio Factory",
    tags: ["Analog", "Tube", "Color"],
    desc: "Processeur de distorsion à saturation harmonique simulant bandes magnétiques et lampes.",
    isFavorite: false
  },
  {
    id: "dev_flanger",
    name: "Flanger",
    type: "Audio FX",
    collection: "Effets Audio",
    category: "Modulation",
    creator: "Studio Factory",
    tags: ["Modulation", "Vintage", "Stereo"],
    desc: "Effet de modulation en peigne à temps de propagation variable avec cross-feedback.",
    isFavorite: false
  },
  {
    id: "dev_peak_limiter",
    name: "Peak Limiter",
    type: "Audio FX",
    collection: "Effets Audio",
    category: "Dynamics",
    creator: "Studio Factory",
    tags: ["Mastering", "Limiter", "Transparent"],
    desc: "Limiteur de crête brickwall avec lookahead pour la protection du bus Master.",
    isFavorite: true
  },

  // ── NOTE FX ──
  {
    id: "dev_arpeggiator",
    name: "Arpeggiator",
    type: "Note FX",
    collection: "Note FX",
    category: "MIDI / Note FX",
    creator: "Studio Factory",
    tags: ["Arp", "Pattern", "Gate"],
    desc: "Arpégiateur polyphonique riche avec modes ping-pong, accords et quantification de vélocité.",
    isFavorite: true
  },
  {
    id: "dev_humanize",
    name: "Humanize",
    type: "Note FX",
    collection: "Note FX",
    category: "MIDI / Note FX",
    creator: "Studio Factory",
    tags: ["Groove", "Timing", "Natural"],
    desc: "Micro-variation stochastique du timing et de la vélocité pour un jeu naturel.",
    isFavorite: false
  },

  // ── OGA SAHEL IA ──
  {
    id: "dev_sahel_dit",
    name: "Sahelian Groove Generator",
    type: "IA Tool",
    collection: "Générateurs IA",
    category: "Synthesis",
    creator: "OGA Sahel",
    tags: ["AI DiT", "Polyrythmic", "Neural"],
    desc: "Générateur neuronal de polyrythmies mandingues et sahéliennes basé sur MiniMax Music 3.",
    isFavorite: true
  },
  {
    id: "dev_acestep_neural",
    name: "ACE-Step Neural Instrument",
    type: "IA Tool",
    collection: "Générateurs IA",
    category: "Synthesis",
    creator: "OGA Sahel",
    tags: ["Neural VAE", "Diffusion", "Realtime"],
    desc: "Synthétiseur hybride à diffusion latente en temps réel connecté au serveur DGX Spark.",
    isFavorite: true
  }
];

export const SMART_COLLECTIONS = [
  "Tous les éléments",
  "Favoris ★",
  "Instruments",
  "Effets Audio",
  "Note FX",
  "The Grid",
  "Périphériques d'origine Music Studio",
  "Générateurs IA"
];

export const BROWSER_CATEGORIES = [
  "Toutes les catégories",
  "Synthesis",
  "Delay & Reverb",
  "EQ & Filter",
  "Dynamics",
  "Distortion & Saturation",
  "Modulation",
  "Drum & Percussion",
  "MIDI / Note FX"
];

export const BROWSER_CREATORS = [
  "Tous les créateurs",
  "Studio Factory",
  "OGA Sahel",
  "Analog",
  "Modular",
  "Clean",
  "Vintage"
];

export default function MusicStudio({
  isOpen = false,
  onClose,
  onInsertDevice,
  targetContext = "insert_device", // 'insert_device' | 'track_slot' | 'grid_module'
  targetTrackName = "Main Drums",
  onPreviewSound,
  setStatusHint
}) {
  const [activeTab, setActiveTab] = useState("devices"); // 'devices' | 'presets' | 'samples' | 'clips'
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCollection, setSelectedCollection] = useState("Tous les éléments");
  const [selectedCategory, setSelectedCategory] = useState("Toutes les catégories");
  const [selectedCreator, setSelectedCreator] = useState("Tous les créateurs");
  const [selectedItemId, setSelectedItemId] = useState(STUDIO_BROWSER_ITEMS[0].id);
  const [favorites, setFavorites] = useState(new Set(["dev_polysynth", "dev_polygrid", "dev_delay_plus", "dev_eq_plus"]));

  const searchInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Toggle favorite status
  const handleToggleFavorite = (e, id) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Filtered Items (4-column cascade)
  const filteredItems = useMemo(() => {
    return STUDIO_BROWSER_ITEMS.filter((item) => {
      // 1. Text Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchDesc = item.desc.toLowerCase().includes(q);
        const matchTags = item.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchName && !matchDesc && !matchTags) return false;
      }

      // 2. Collection
      if (selectedCollection === "Favoris ★") {
        if (!favorites.has(item.id)) return false;
      } else if (selectedCollection === "Instruments" && item.type !== "Instrument") {
        return false;
      } else if (selectedCollection === "Effets Audio" && item.type !== "Audio FX") {
        return false;
      } else if (selectedCollection === "Note FX" && item.type !== "Note FX") {
        return false;
      } else if (selectedCollection === "The Grid" && item.type !== "The Grid") {
        return false;
      } else if (selectedCollection === "Périphériques d'origine Music Studio" && item.creator !== "Studio Factory") {
        return false;
      } else if (selectedCollection === "Générateurs IA" && item.creator !== "OGA Sahel") {
        return false;
      }

      // 3. Category
      if (selectedCategory !== "Toutes les catégories" && item.category !== selectedCategory) {
        return false;
      }

      // 4. Creator / Tag
      if (selectedCreator !== "Tous les créateurs") {
        const matchCreator = item.creator.toLowerCase() === selectedCreator.toLowerCase();
        const matchTag = item.tags.some((t) => t.toLowerCase() === selectedCreator.toLowerCase());
        if (!matchCreator && !matchTag) return false;
      }

      return true;
    });
  }, [searchQuery, selectedCollection, selectedCategory, selectedCreator, favorites]);

  const activeItem = useMemo(() => {
    return filteredItems.find((i) => i.id === selectedItemId) || filteredItems[0] || null;
  }, [filteredItems, selectedItemId]);

  const handleConfirmInsert = (itemToInsert) => {
    const item = itemToInsert || activeItem;
    if (!item) return;
    if (onInsertDevice) onInsertDevice(item);
    if (setStatusHint) {
      setStatusHint(`Périphérique "${item.name}" inséré dans la chaîne de ${targetTrackName}`);
    }
    if (onClose) onClose();
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      if (onClose) onClose();
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleConfirmInsert();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const curIdx = filteredItems.findIndex((i) => i.id === selectedItemId);
      if (curIdx < filteredItems.length - 1) {
        setSelectedItemId(filteredItems[curIdx + 1].id);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const curIdx = filteredItems.findIndex((i) => i.id === selectedItemId);
      if (curIdx > 0) {
        setSelectedItemId(filteredItems[curIdx - 1].id);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      data-testid="studio-popup-browser-modal"
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-100 select-none"
      onClick={onClose}
    >
      <div
        data-testid="studio-popup-browser-window"
        onClick={(e) => e.stopPropagation()}
        className="w-[960px] h-[620px] bg-[#1a1a1a] border border-[#383838] rounded-xl shadow-[0_24px_64px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden text-xs text-zinc-300 font-sans"
      >
        {/* ── Top Bar: Search, Tabs & Close ── */}
        <div className="h-12 bg-[#202020] border-b border-[#2d2d2d] px-4 flex items-center justify-between gap-4 flex-shrink-0">
          {/* Main Context Tabs */}
          <div className="flex items-center gap-1">
            {[
              { id: "devices", label: "Périphériques", count: STUDIO_BROWSER_ITEMS.length },
              { id: "presets", label: "Presets", count: 148 },
              { id: "samples", label: "Échantillons", count: 864 },
              { id: "clips", label: "Clips", count: 42 }
            ].map((tab) => (
              <button
                key={tab.id}
                data-testid={`browser-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`h-7 px-3 rounded text-[11px] font-bold transition flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? "bg-[#241808] border border-[#df9c43] text-[#eaaf5d] shadow-[0_0_8px_rgba(223,156,67,0.25)]"
                    : "text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-[9px] opacity-75 font-mono">({tab.count})</span>
              </button>
            ))}
          </div>

          {/* Search Input Box */}
          <div className="flex-1 max-w-sm relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              ref={searchInputRef}
              type="text"
              data-testid="input-browser-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher périphérique, tag ou preset..."
              className="w-full bg-[#141414] border border-[#333333] focus:border-[#df9c43] rounded-md pl-8 pr-7 py-1 text-xs text-white placeholder-zinc-500 focus:outline-none transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Close Button */}
          <button
            data-testid="btn-close-browser"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-white/10 transition"
            title="Fermer le navigateur (Escape)"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Center: 4 Music Studio Columns ── */}
        <div className="flex-1 grid grid-cols-12 divide-x divide-[#262626] overflow-hidden bg-[#161616]">
          {/* Column 1: Smart Collections (2.5 / 12) */}
          <div className="col-span-3 flex flex-col overflow-hidden bg-[#161616]">
            <div className="h-7 px-3 bg-[#1c1c1c] border-b border-[#262626] flex items-center justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              <span>Collections</span>
              <Folder size={11} className="text-zinc-500" />
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-1.5 space-y-0.5">
              {SMART_COLLECTIONS.map((col) => {
                const isSelected = selectedCollection === col;
                return (
                  <button
                    key={col}
                    data-testid={`col-collection-${col.replace(/[^a-zA-Z0-9]/g, "")}`}
                    onClick={() => setSelectedCollection(col)}
                    className={`w-full px-2.5 py-1.5 rounded text-left flex items-center justify-between text-[11px] transition ${
                      isSelected
                        ? "bg-[#241808] border border-[#df9c43] text-[#eaaf5d] font-bold shadow-[0_0_8px_rgba(223,156,67,0.25)]"
                        : "text-zinc-300 hover:bg-[#222222] hover:text-white border border-transparent"
                    }`}
                  >
                    <span className="truncate">{col}</span>
                    {col.includes("★") && <Star size={10} className="text-amber-300 fill-amber-300" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Column 2: Categories (2.5 / 12) */}
          <div className="col-span-3 flex flex-col overflow-hidden bg-[#161616]">
            <div className="h-7 px-3 bg-[#1c1c1c] border-b border-[#262626] flex items-center justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              <span>Catégories</span>
              <Layers size={11} className="text-zinc-500" />
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-1.5 space-y-0.5">
              {BROWSER_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    data-testid={`col-category-${cat.replace(/[^a-zA-Z0-9]/g, "")}`}
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full px-2.5 py-1.5 rounded text-left text-[11px] truncate transition ${
                      isSelected
                        ? "bg-[#241808] border border-[#df9c43] text-[#eaaf5d] font-bold shadow-[0_0_8px_rgba(223,156,67,0.25)]"
                        : "text-zinc-300 hover:bg-[#222222] hover:text-white border border-transparent"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Column 3: Creators & Tags (2 / 12) */}
          <div className="col-span-2 flex flex-col overflow-hidden bg-[#161616]">
            <div className="h-7 px-3 bg-[#1c1c1c] border-b border-[#262626] flex items-center justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              <span>Créateurs & Tags</span>
              <Tag size={11} className="text-zinc-500" />
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-1.5 space-y-0.5">
              {BROWSER_CREATORS.map((crt) => {
                const isSelected = selectedCreator === crt;
                return (
                  <button
                    key={crt}
                    data-testid={`col-creator-${crt.replace(/[^a-zA-Z0-9]/g, "")}`}
                    onClick={() => setSelectedCreator(crt)}
                    className={`w-full px-2.5 py-1.5 rounded text-left text-[11px] truncate transition ${
                      isSelected
                        ? "bg-[#241808] border border-[#df9c43] text-[#eaaf5d] font-bold shadow-[0_0_8px_rgba(223,156,67,0.25)]"
                        : "text-zinc-300 hover:bg-[#222222] hover:text-white border border-transparent"
                    }`}
                  >
                    {crt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Column 4: Results List (4 / 12) */}
          <div className="col-span-4 flex flex-col overflow-hidden bg-[#131313]">
            <div className="h-7 px-3 bg-[#1c1c1c] border-b border-[#262626] flex items-center justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              <span>Résultats ({filteredItems.length})</span>
              <span className="text-[9px] font-mono text-zinc-500">Double-clic pour insérer</span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-1.5 space-y-1">
              {filteredItems.length === 0 ? (
                <div className="p-6 text-center text-zinc-500 italic">
                  Aucun résultat ne correspond aux filtres actuels.
                </div>
              ) : (
                filteredItems.map((item) => {
                  const isSelected = selectedItemId === item.id;
                  const isFav = favorites.has(item.id);

                  return (
                    <div
                      key={item.id}
                      data-testid={`browser-item-${item.id}`}
                      onClick={() => setSelectedItemId(item.id)}
                      onDoubleClick={() => handleConfirmInsert(item)}
                      className={`px-3 py-2 rounded-lg flex items-center justify-between cursor-pointer transition border ${
                        isSelected
                          ? "bg-[#252525] border-[#df9c43] text-white shadow-md ring-1 ring-[#df9c43]/50"
                          : "border-transparent hover:bg-[#1a1a1a] text-zinc-300 hover:text-white"
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[11.5px] truncate">{item.name}</span>
                          <span
                            className={`text-[8px] font-mono px-1 rounded uppercase font-extrabold ${
                              item.type === "Instrument"
                                ? "bg-amber-950 text-amber-300 border border-amber-500/40"
                                : item.type === "The Grid"
                                ? "bg-cyan-950 text-cyan-300 border border-cyan-500/40"
                                : item.type === "IA Tool"
                                ? "bg-[#241808] text-[#eaaf5d] border border-[#df9c43]/40"
                                : "bg-zinc-800 text-zinc-400"
                            }`}
                          >
                            {item.type}
                          </span>
                        </div>
                        <div className="text-[9px] text-zinc-500 truncate mt-0.5">
                          {item.category} • {item.creator}
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleToggleFavorite(e, item.id)}
                        className="p-1 text-zinc-500 hover:text-amber-400 transition"
                        title={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
                      >
                        <Star
                          size={13}
                          className={isFav ? "text-amber-400 fill-amber-400" : "text-zinc-600"}
                        />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ── Bottom Information Card & Actions ── */}
        <div className="h-20 bg-[#1e1e1e] border-t border-[#2e2e2e] px-4 py-2 flex items-center justify-between flex-shrink-0">
          {activeItem ? (
            <div className="flex items-center gap-3 min-w-0 flex-1 pr-4">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs shadow-inner flex-shrink-0 ${
                  activeItem.type === "Instrument"
                    ? "bg-amber-600 text-white"
                    : activeItem.type === "The Grid"
                    ? "bg-cyan-600 text-white"
                    : activeItem.type === "IA Tool"
                    ? "bg-[#241808] border border-[#df9c43] text-[#eaaf5d] shadow-[0_0_8px_rgba(223,156,67,0.3)]"
                    : "bg-zinc-700 text-zinc-200"
                }`}
              >
                {activeItem.type === "The Grid" ? <Grid size={18} /> : <Sliders size={18} />}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-[13px] text-white">{activeItem.name}</span>
                  <span className="text-[10px] text-zinc-400 font-mono">({activeItem.creator})</span>
                  <div className="flex items-center gap-1">
                    {activeItem.tags.map((t) => (
                      <span key={t} className="text-[8.5px] px-1 py-0.2 rounded bg-zinc-800 text-zinc-400">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-[10px] text-zinc-400 truncate mt-0.5">{activeItem.desc}</div>
              </div>
            </div>
          ) : (
            <div className="text-zinc-500 italic">Sélectionnez un élément dans les résultats</div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {activeItem && (
              <button
                data-testid="btn-preview-browser-item"
                onClick={() => {
                  if (onPreviewSound) onPreviewSound(activeItem);
                  if (setStatusHint) setStatusHint(`Pré-écoute de "${activeItem.name}"...`);
                }}
                className="h-8 px-3 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition flex items-center gap-1.5"
                title="Pré-écouter le périphérique"
              >
                <Volume2 size={13} className="text-amber-400" />
                <span>Pré-écouter</span>
              </button>
            )}

            <button
              data-testid="btn-insert-browser-item"
              onClick={() => handleConfirmInsert()}
              disabled={!activeItem}
              className="h-8 px-4 rounded bg-[#241808] hover:bg-[#2d1e0d] border border-[#df9c43] text-[#eaaf5d] hover:text-[#f5c277] text-xs font-bold transition flex items-center gap-1.5 shadow-[0_0_10px_rgba(223,156,67,0.3)] disabled:opacity-50"
              title="Insérer le périphérique sélectionné (Entrée)"
            >
              <Check size={13} />
              <span>Insérer dans {targetTrackName}</span>
              <span className="text-[9px] opacity-75 font-mono pl-1">↵</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
