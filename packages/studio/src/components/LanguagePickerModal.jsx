"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  Search,
  Check,
  Globe,
  Sparkles,
  Heart,
  Compass,
  Sun,
  Music,
  CheckCircle2
} from "lucide-react";
import {
  ALL_LANGUAGES,
  LANGUAGE_CATEGORIES,
  searchLanguages,
  getLanguageByCode
} from "@/src/lib/languagesCatalog";

export function LanguagePickerModal({
  isOpen,
  onClose,
  selectedLanguage = "fr",
  onSelectLanguage
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredLanguages = useMemo(() => {
    return searchLanguages(searchQuery, selectedCategory);
  }, [searchQuery, selectedCategory]);

  const activeLangMeta = useMemo(() => {
    return getLanguageByCode(selectedLanguage);
  }, [selectedLanguage]);

  if (!isOpen) return null;

  const handleSelect = (code) => {
    if (onSelectLanguage) {
      onSelectLanguage(code);
    }
    if (onClose) {
      onClose();
    }
  };

  const getCategoryIcon = (iconName) => {
    switch (iconName) {
      case "Sparkles":
        return <Sparkles size={13} className="text-amber-400" />;
      case "Heart":
        return <Heart size={13} className="text-[#df9c43]" />;
      case "Compass":
        return <Compass size={13} className="text-blue-400" />;
      case "Sun":
        return <Sun size={13} className="text-[#df9c43]" />;
      case "Music":
        return <Music size={13} className="text-emerald-400" />;
      default:
        return <Globe size={13} className="text-zinc-400" />;
    }
  };

  const QUICK_TRENDING_CODES = ["fr", "en", "es", "ht", "ln", "sw", "pt", "ja", "ar", "de", "zh", "unknown"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100">
        
        {/* ── HEADER BANNER ── */}
        <div className="p-5 bg-gradient-to-r from-[#241808] via-[#1a1205] to-zinc-950 border-b border-white/10 flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#241808] text-[#eaaf5d] border border-[#df9c43]/40 flex items-center gap-1.5">
                  <Globe size={12} />
                  55 Langues & Créoles Supportés
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  51 Natifs ACE-Step 1.5
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
                Sélection de la Langue Vocale
              </h3>
              <p className="text-xs text-zinc-400 max-w-2xl">
                Conditionnement vocal phonétique précis pour ACE-Step 1.5, acestep.cpp et MiniMax Music 3. Sélectionnez la langue des paroles pour un chant authentique.
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors border border-white/10"
              title="Fermer"
            >
              <X size={18} />
            </button>
          </div>

          {/* ── QUICK POPULAR PILLS ── */}
          <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-zinc-400 mr-1 flex items-center gap-1">
              <Sparkles size={11} className="text-amber-400" />
              Accès Rapide :
            </span>
            {QUICK_TRENDING_CODES.map((code) => {
              const lang = getLanguageByCode(code);
              const isSelected = selectedLanguage === code;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => handleSelect(code)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all border ${
                    isSelected
                      ? "bg-[#241808] border border-[#df9c43] text-[#eaaf5d] font-bold shadow-[0_0_8px_rgba(223,156,67,0.3)] scale-105"
                      : "bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10 hover:border-white/20"
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.nativeName || lang.label}</span>
                  {isSelected && <Check size={12} className="ml-0.5" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── SEARCH & CATEGORY BAR ── */}
        <div className="p-4 bg-zinc-900/60 border-b border-white/10 flex-shrink-0 space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une langue (ex: créole, haïtien, lingala, swahili, espagnol, japonais, arabe, zulu...)"
              className="w-full bg-zinc-950 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#df9c43] transition-colors"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {LANGUAGE_CATEGORIES.map((cat) => {
              const count = cat.id === "all"
                ? ALL_LANGUAGES.length
                : ALL_LANGUAGES.filter((l) => l.group === cat.id).length;
              const isActive = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all border ${
                    isActive
                      ? "bg-[#241808] border border-[#df9c43] text-[#eaaf5d] shadow-[0_0_8px_rgba(223,156,67,0.25)] font-bold"
                      : "bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 border-white/5"
                  }`}
                >
                  {getCategoryIcon(cat.icon)}
                  <span>{cat.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? "bg-[#241808] border border-[#df9c43]/40 text-[#f5c277]" : "bg-white/5 text-zinc-500"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── LANGUAGES GRID ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar">
          {filteredLanguages.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Globe size={36} className="mx-auto text-zinc-600 animate-pulse" />
              <p className="text-sm font-semibold text-zinc-300">Aucune langue trouvée pour &ldquo;{searchQuery}&rdquo;</p>
              <p className="text-xs text-zinc-500">Essayez un autre mot-clé ou sélectionnez une autre catégorie.</p>
              <button
                onClick={() => { setSearchQuery(""); setSelectedCategory("all"); }}
                className="mt-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/15 text-zinc-200 transition-colors"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {filteredLanguages.map((lang) => {
                const isSelected = selectedLanguage === lang.code;

                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleSelect(lang.code)}
                    className={`text-left p-3 rounded-xl border transition-all relative group flex flex-col justify-between ${
                      isSelected
                        ? "bg-[#241808]/60 border-[#df9c43]/60 shadow-lg shadow-[#df9c43]/20 ring-1 ring-[#df9c43]/30"
                        : "bg-zinc-900/50 hover:bg-zinc-900 border-white/5 hover:border-white/15"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-2xl flex-shrink-0" role="img" aria-label={lang.label}>
                            {lang.flag}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs font-bold text-zinc-100 truncate group-hover:text-[#eaaf5d] transition-colors">
                                {lang.nativeName}
                              </h4>
                              <span className="text-[10px] uppercase font-mono px-1 py-0.2 rounded bg-white/5 text-zinc-400 border border-white/10">
                                {lang.code}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-400 truncate">
                              {lang.englishName}
                            </p>
                          </div>
                        </div>

                        {isSelected ? (
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#241808] border border-[#df9c43] flex items-center justify-center text-[#eaaf5d] shadow-[0_0_6px_rgba(223,156,67,0.3)]">
                            <Check size={12} />
                          </div>
                        ) : (
                          lang.aceStepNative && (
                            <span className="flex-shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Natif
                            </span>
                          )
                        )}
                      </div>

                      {lang.description && (
                        <p className="text-[10px] text-zinc-400/90 line-clamp-2 mt-1 leading-relaxed">
                          {lang.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-500">
                      <span>Famille : {lang.group}</span>
                      <span className="text-zinc-400 group-hover:text-[#df9c43] transition-colors font-medium">
                        {isSelected ? "Actif" : "Sélectionner →"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── FOOTER BAR ── */}
        <div className="p-3.5 bg-zinc-950 border-t border-white/10 flex-shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="text-zinc-500">Langue active :</span>
            <span className="text-zinc-200 font-semibold flex items-center gap-1.5">
              <span>{activeLangMeta.flag}</span>
              <span>{activeLangMeta.label}</span>
              <span className="text-zinc-500 text-[11px]">({activeLangMeta.englishName})</span>
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-zinc-100 transition-colors border border-white/10"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
}
