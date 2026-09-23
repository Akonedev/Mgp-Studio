"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  FaUserTie, FaImage, FaMagic, FaVideo, FaFileAlt, 
  FaBriefcase, FaHome, FaMicrophone, FaHandSparkles, FaBuilding,
  FaUserInjured, FaStethoscope, FaCar, FaPaw, FaBalanceScale, FaTruck, FaMapMarkerAlt,
  FaGithub, FaExternalLinkAlt, FaRocket, FaPlay, FaCheck, FaCog, FaSpinner, FaSearch,
  FaTimes, FaDownload, FaSyncAlt, FaLayerGroup, FaArrowRight, FaTrash
} from "react-icons/fa";
import toast, { Toaster } from 'react-hot-toast';

const ICON_MAP = {
  FaUserTie, FaImage, FaMagic, FaVideo, FaFileAlt, 
  FaBriefcase, FaHome, FaMicrophone, FaHandSparkles, FaBuilding,
  FaUserInjured, FaStethoscope, FaCar, FaPaw, FaBalanceScale, FaTruck, FaMapMarkerAlt
};

export default function AppsStudio({ apiKey }) {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Action states
  const [installingId, setInstallingId] = useState(null);
  const [importingWfId, setImportingWfId] = useState(null);
  
  // Modals
  const [activeRunApp, setActiveRunApp] = useState(null);
  const [activeConfigApp, setActiveConfigApp] = useState(null);
  
  // Generation state inside activeRunApp modal
  const [runStyle, setRunStyle] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState(null);

  // Fetch apps catalog and installation status from /api/apps
  const fetchApps = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/apps');
      const data = await res.json();
      if (data.ok && Array.isArray(data.apps)) {
        setApps(data.apps);
      }
    } catch (err) {
      console.error('Failed to load apps:', err);
      toast.error('Erreur lors du chargement des applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  // 1-Click Install Handler
  const handleInstall = async (app) => {
    setInstallingId(app.id);
    const toastId = toast.loading(`Installation de ${app.name} et configuration DGX Spark...`);
    try {
      const res = await fetch('/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'install', id: app.id })
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(`Template ${app.name} installé et configuré avec succès !`, { id: toastId });
        setApps(prev => prev.map(a => a.id === app.id ? { ...a, isInstalled: true, status: 'installed', workflow_imported: true } : a));
      } else {
        toast.error(data.error || "Échec de l'installation", { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error("Erreur de connexion lors de l'installation", { id: toastId });
    } finally {
      setInstallingId(null);
    }
  };

  // 1-Click Workflow Import Handler
  const handleImportWorkflow = async (app) => {
    setImportingWfId(app.id);
    const toastId = toast.loading(`Importation du workflow ${app.name} dans Workflows Studio...`);
    try {
      const res = await fetch('/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'import_workflow', id: app.id })
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(`Workflow importé ! Accessible dans l'onglet Workflows.`, { id: toastId });
        setApps(prev => prev.map(a => a.id === app.id ? { ...a, workflow_imported: true } : a));
      } else {
        toast.error(data.error || "Échec de l'import", { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'import du workflow", { id: toastId });
    } finally {
      setImportingWfId(null);
    }
  };

  // In-App Generation Execution
  const handleExecuteInApp = async () => {
    if (!activeRunApp) return;
    setIsGenerating(true);
    setGenerationResult(null);

    const toastId = toast.loading(`Génération en direct sur DGX Spark GB10 via ${activeRunApp.name}...`);
    try {
      const res = await fetch('/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'run_in_app',
          id: activeRunApp.id,
          style_id: runStyle,
          prompt: customPrompt,
          aspectRatio
        })
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(data.message || 'Génération terminée avec succès !', { id: toastId });
        setGenerationResult({
          url: data.resultUrl,
          type: data.type || activeRunApp.mediaType || 'image',
          prompt: customPrompt || activeRunApp.styles?.find(s => s.id === runStyle)?.prompt,
          data: data.data
        });
      } else {
        toast.error(data.error || "Erreur de génération", { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error("Échec de la communication avec le cluster Spark", { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  // Open run modal for an app
  const openRunModal = (app) => {
    setActiveRunApp(app);
    setRunStyle(app.defaultStyle || (app.styles && app.styles[0]?.id) || '');
    setCustomPrompt('');
    setGenerationResult(null);
  };

  // Filter categories
  const categories = useMemo(() => {
    const cats = new Set(apps.map(a => a.category).filter(Boolean));
    return ['all', 'installed', ...Array.from(cats)];
  }, [apps]);

  // Filtered apps list
  const filteredApps = useMemo(() => {
    return apps.filter(app => {
      // Category filter
      if (selectedCategory === 'installed' && !app.isInstalled) return false;
      if (selectedCategory !== 'all' && selectedCategory !== 'installed' && app.category !== selectedCategory) {
        return false;
      }
      // Search filter
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        const matchName = app.name.toLowerCase().includes(q);
        const matchDesc = (app.description || '').toLowerCase().includes(q);
        const matchCat = (app.category || '').toLowerCase().includes(q);
        const matchTag = (app.tagline || '').toLowerCase().includes(q);
        return matchName || matchDesc || matchCat || matchTag;
      }
      return true;
    });
  }, [apps, selectedCategory, searchQuery]);

  const installedCount = apps.filter(a => a.isInstalled).length;

  return (
    <div className="h-full w-full flex flex-col items-center bg-[#030303] overflow-y-auto custom-scrollbar relative text-white">
      <Toaster position="bottom-right" reverseOrder={false} />
      
      <div className="flex flex-col gap-8 items-center w-full max-w-7xl pt-10 pb-24 px-6">
        
        {/* Header Section */}
        <div className="text-center space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#df9c43]/10 border border-[#df9c43]/25 rounded-full shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#df9c43] animate-ping" />
            <span className="text-[11px] font-black text-[#df9c43] uppercase tracking-widest">
              Hub d&apos;Applications & Templates • Mgp Studio
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            APPLICATIONS & TEMPLATES IA
          </h1>
          
          <p className="text-white/60 text-sm font-medium leading-relaxed max-w-2xl mx-auto">
            Installez et intégrez des templates SaaS ouverts en 1 clic. Chaque application est automatiquement configurée pour exploiter le supercalculateur local <b>DGX Spark (Grace Blackwell GB10)</b> sans coût d&apos;API cloud.
          </p>

          {/* Spark Connection Status Banner */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              DGX Spark GB10 Connecté (:61009 ComfyUI / :61005 vLLM)
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/5 border border-white/10 text-white/70 font-semibold">
              <FaLayerGroup className="text-[#df9c43]" />
              {apps.length} Templates Open-Source
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#df9c43]/10 border border-[#df9c43]/20 text-[#df9c43] font-semibold">
              <FaCheck className="text-xs" />
              {installedCount} App{installedCount > 1 ? 's' : ''} Installée{installedCount > 1 ? 's' : ''} & Prête{installedCount > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4 bg-[#0a0a0a] border border-white/10 rounded-xl p-3 shadow-lg">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto py-1 custom-scrollbar">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              let label = cat === 'all' ? 'Toutes les Apps' : cat === 'installed' ? `Installées (${installedCount})` : cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    isActive 
                      ? 'bg-[#df9c43] text-black shadow-md' 
                      : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border border-white/5'
                  }`}
                >
                  {cat === 'installed' && <FaCheck className="text-[10px]" />}
                  {label}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-xs" />
            <input
              type="text"
              placeholder="Rechercher une application..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#121212] border border-white/10 rounded-lg pl-8 pr-8 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#df9c43] transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                <FaTimes className="text-xs" />
              </button>
            )}
          </div>
        </div>

        {/* Apps Grid */}
        {loading ? (
          <div className="w-full py-20 flex flex-col items-center justify-center gap-4 text-white/50">
            <FaSpinner className="text-3xl animate-spin text-[#df9c43]" />
            <p className="text-sm font-medium">Chargement des applications et statut DGX Spark...</p>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="w-full py-16 flex flex-col items-center justify-center gap-3 bg-[#0a0a0a] border border-white/5 rounded-2xl">
            <FaSearch className="text-4xl text-white/20" />
            <p className="text-base font-bold text-white/70">Aucune application ne correspond à votre recherche</p>
            <button 
              onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
              className="text-xs text-[#df9c43] hover:underline"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 w-full">
            {filteredApps.map((app) => {
              const IconComp = ICON_MAP[app.icon] || FaRocket;
              const isInstalling = installingId === app.id;
              const isImporting = importingWfId === app.id;

              return (
                <div
                  key={app.id}
                  className={`group bg-[#0a0a0a] border rounded-xl flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                    app.isInstalled 
                      ? 'border-emerald-500/30 hover:border-emerald-500/50 shadow-emerald-950/20' 
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  {/* Thumbnail Banner */}
                  <div className="relative h-44 w-full overflow-hidden bg-black/40">
                    {app.thumbnail ? (
                      <img
                        src={app.thumbnail}
                        alt={app.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/5 to-white/10">
                        <IconComp className="text-5xl opacity-20 text-white" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    
                    {/* Status Badges */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white uppercase tracking-wider">
                        {app.category}
                      </span>
                      {app.isInstalled && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/90 backdrop-blur-md text-[10px] font-black text-black flex items-center gap-1 shadow-sm">
                          <FaCheck className="text-[9px]" />
                          Installée (: {app.local_port || app.port})
                        </span>
                      )}
                      {app.workflow_imported && (
                        <span className="px-2 py-0.5 rounded-md bg-[#df9c43]/90 backdrop-blur-md text-[10px] font-black text-black flex items-center gap-1 shadow-sm">
                          ⚡ Workflow Prêt
                        </span>
                      )}
                    </div>

                    {/* Media Type Indicator */}
                    <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-bold text-[#df9c43] uppercase">
                      {app.mediaType === 'video' ? '🎬 Vidéo Spark' : '🖼️ Image Spark'}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex flex-col flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-lg text-[#df9c43] border border-white/10 flex-shrink-0">
                        <IconComp />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-white uppercase tracking-tight truncate">{app.name}</h3>
                        <p className="text-[11px] text-white/50 truncate font-medium">{app.tagline || app.category}</p>
                      </div>
                    </div>

                    <p className="text-xs text-white/60 leading-relaxed font-normal line-clamp-2 min-h-[2.5rem]">
                      {app.description}
                    </p>

                    {/* Action Buttons Row */}
                    <div className="pt-2 flex flex-col gap-2 mt-auto">
                      {/* Primary Actions */}
                      <div className="flex items-center gap-2">
                        {app.isInstalled ? (
                          <>
                            <button
                              onClick={() => openRunModal(app)}
                              className="flex-1 py-2.5 bg-[#df9c43] text-black rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-[#df9c43]/90 transition-all shadow-md active:scale-95"
                            >
                              <FaPlay className="text-[10px]" />
                              Exécuter Studio
                            </button>
                            <button
                              onClick={() => setActiveConfigApp(app)}
                              title="Configuration & Variables d'Environnement"
                              className="p-2.5 bg-white/5 text-white/80 rounded-lg hover:bg-white/10 hover:text-white transition-all border border-white/10"
                            >
                              <FaCog className="text-sm" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleInstall(app)}
                            disabled={isInstalling}
                            className="flex-1 py-2.5 bg-white/10 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#df9c43] hover:text-black transition-all border border-white/10 active:scale-95 disabled:opacity-50"
                          >
                            {isInstalling ? (
                              <>
                                <FaSpinner className="animate-spin text-xs" />
                                Installation...
                              </>
                            ) : (
                              <>
                                <FaRocket className="text-xs" />
                                Installer en 1-Clic
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {/* Secondary Actions */}
                      <div className="flex items-center gap-2 text-[11px]">
                        {/* Direct Execution shortcut if not installed */}
                        {!app.isInstalled && (
                          <button
                            onClick={() => openRunModal(app)}
                            className="flex-1 py-1.5 bg-[#df9c43]/10 text-[#df9c43] rounded-md font-bold uppercase tracking-wider flex items-center justify-center gap-1 hover:bg-[#df9c43]/20 transition-all border border-[#df9c43]/20"
                          >
                            <FaPlay className="text-[9px]" />
                            Lancer en Direct
                          </button>
                        )}

                        {/* Import Workflow */}
                        <button
                          onClick={() => handleImportWorkflow(app)}
                          disabled={isImporting || app.workflow_imported}
                          className={`flex-1 py-1.5 rounded-md font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all border ${
                            app.workflow_imported
                              ? 'bg-white/5 text-white/40 border-white/5 cursor-default'
                              : 'bg-white/5 text-white/80 hover:bg-white/10 hover:text-white border-white/10'
                          }`}
                        >
                          {isImporting ? (
                            <FaSpinner className="animate-spin text-[10px]" />
                          ) : (
                            <FaLayerGroup className="text-[10px] text-[#df9c43]" />
                          )}
                          {app.workflow_imported ? 'Workflow Prêt' : 'Workflow'}
                        </button>

                        {/* External Links */}
                        <a
                          href={app.repo || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Dépôt GitHub Open-Source Officiel"
                          className="p-2 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 rounded-md border border-white/5 transition-all"
                        >
                          <FaGithub className="text-xs" />
                        </a>
                        {app.hosted && (
                          <a
                            href={app.hosted}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Démo en Ligne"
                            className="p-2 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 rounded-md border border-white/5 transition-all"
                          >
                            <FaExternalLinkAlt className="text-[10px]" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: IN-APP GENERATION STUDIO */}
      {activeRunApp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in" onClick={() => !isGenerating && setActiveRunApp(null)} />
          <div className="relative bg-[#0d0d0d] border border-white/15 w-full max-w-2xl rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl overflow-y-auto max-h-[92vh] custom-scrollbar">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#df9c43]/10 border border-[#df9c43]/25 flex items-center justify-center text-2xl text-[#df9c43]">
                  {React.createElement(ICON_MAP[activeRunApp.icon] || FaRocket)}
                </div>
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                    {activeRunApp.name}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                      DGX Spark GB10
                    </span>
                  </h2>
                  <p className="text-xs text-white/50 font-medium">{activeRunApp.tagline}</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveRunApp(null)}
                disabled={isGenerating}
                className="text-white/40 hover:text-white p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Form */}
            <div className="space-y-4">
              {/* Style Selector */}
              {activeRunApp.styles && activeRunApp.styles.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/80 uppercase tracking-wider flex items-center justify-between">
                    <span>Preset / Style Recommandé</span>
                    <span className="text-[10px] text-white/40 font-normal">Optimisé pour ComfyUI Grace Blackwell</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activeRunApp.styles.map(s => {
                      const isSel = runStyle === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setRunStyle(s.id)}
                          className={`p-3 rounded-xl text-left transition-all border text-xs flex flex-col gap-1 ${
                            isSel
                              ? 'bg-[#df9c43]/10 border-[#df9c43] text-white'
                              : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                          }`}
                        >
                          <span className={`font-bold ${isSel ? 'text-[#df9c43]' : 'text-white'}`}>{s.name}</span>
                          <span className="text-[10px] text-white/40 line-clamp-1">{s.prompt}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Custom Prompt */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white/80 uppercase tracking-wider flex items-center justify-between">
                  <span>Instructions ou Sujet Personnalisé</span>
                  <span className="text-[10px] text-[#df9c43]">Optionnel</span>
                </label>
                <textarea
                  rows={3}
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Ex: Alexander, ingénieur IA senior en costume moderne, éclairage studio doux..."
                  className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#df9c43] transition-colors resize-none"
                />
              </div>

              {/* Format / Ratio */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white/80 uppercase tracking-wider">Format d&apos;Affichage</label>
                <div className="flex items-center gap-2">
                  {[
                    { id: '1:1', label: '1:1 Carré (Portrait/Profil)' },
                    { id: '16:9', label: '16:9 Cinéma (Paysage)' },
                    { id: '9:16', label: '9:16 Vertical (Shorts/TikTok)' }
                  ].map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setAspectRatio(r.id)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${
                        aspectRatio === r.id
                          ? 'bg-[#df9c43] text-black border-[#df9c43]'
                          : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Execute Button */}
            <div className="pt-2">
              <button
                onClick={handleExecuteInApp}
                disabled={isGenerating}
                className="w-full py-4 bg-[#df9c43] text-black rounded-xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#df9c43]/90 transition-all shadow-lg active:scale-95 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <FaSpinner className="animate-spin text-base" />
                    Inférence en cours sur DGX Spark GB10...
                  </>
                ) : (
                  <>
                    <FaPlay className="text-xs" />
                    Générer avec DGX Spark GB10 (0 Cloud)
                  </>
                )}
              </button>
            </div>

            {/* Result Display Box */}
            {generationResult && (
              <div className="mt-4 p-4 rounded-xl bg-black/60 border border-emerald-500/30 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <FaCheck className="text-xs" /> Rendu Généré et Enregistré dans l&apos;Historique
                  </span>
                  <a
                    href={generationResult.url}
                    download
                    className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <FaDownload className="text-xs" /> Télécharger
                  </a>
                </div>

                <div className="rounded-lg overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center max-h-80">
                  {generationResult.type === 'video' ? (
                    <video
                      src={generationResult.url}
                      controls
                      autoPlay
                      loop
                      className="max-h-80 w-auto rounded-lg object-contain"
                    />
                  ) : (
                    <img
                      src={generationResult.url}
                      alt="Résultat IA"
                      className="max-h-80 w-auto rounded-lg object-contain"
                    />
                  )}
                </div>
                
                <p className="text-[11px] text-white/50 italic line-clamp-2">
                  Prompt utilisé: &quot;{generationResult.prompt}&quot;
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: APP CONFIGURATION & DETAILS */}
      {activeConfigApp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in" onClick={() => setActiveConfigApp(null)} />
          <div className="relative bg-[#0d0d0d] border border-white/15 w-full max-w-xl rounded-2xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <FaCog className="text-[#df9c43] text-lg" />
                <h3 className="text-lg font-bold text-white">Configuration de {activeConfigApp.name}</h3>
              </div>
              <button 
                onClick={() => setActiveConfigApp(null)}
                className="text-white/40 hover:text-white p-1.5 rounded-lg bg-white/5 hover:bg-white/10"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-white/40 uppercase font-bold tracking-wider block mb-1">Chemin d&apos;Installation Local :</span>
                <code className="block p-2.5 bg-black/60 rounded-lg border border-white/10 text-emerald-400 font-mono text-[11px] select-all break-all">
                  {activeConfigApp.installed_path || `data/installed_apps/${activeConfigApp.id}`}
                </code>
              </div>

              <div>
                <span className="text-white/40 uppercase font-bold tracking-wider block mb-1">Port Local Attribué :</span>
                <code className="inline-block px-2.5 py-1 bg-black/60 rounded border border-white/10 text-[#df9c43] font-mono font-bold">
                  http://localhost:{activeConfigApp.local_port || activeConfigApp.port || 58110}
                </code>
              </div>

              <div>
                <span className="text-white/40 uppercase font-bold tracking-wider block mb-1">Variables d&apos;Environnement (.env.local) Générées :</span>
                <pre className="p-3 bg-black/80 rounded-xl border border-white/10 text-white/80 font-mono text-[11px] overflow-x-auto custom-scrollbar">
{`NEXT_PUBLIC_APP_NAME="${activeConfigApp.name}"
NEXT_PUBLIC_SPARK_URL="http://192.168.1.219:61009"
SPARK_COMFY_URL="http://192.168.1.219:61009"
SPARK_VLLM_URL="http://192.168.1.219:61005"
AI_ENDPOINT="${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:58101'}/api/comfy"
MUAPIAPP_API_KEY="local-dgx-spark"
DATABASE_URL="file:./dev.db"
PORT=${activeConfigApp.local_port || activeConfigApp.port || 58110}
NEXTAUTH_URL="http://localhost:${activeConfigApp.local_port || activeConfigApp.port || 58110}"`}
                </pre>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => {
                  toast.success("Configuration copiée dans le presse-papier !");
                  navigator.clipboard?.writeText(activeConfigApp.installed_path || '');
                }}
                className="flex-1 py-2.5 bg-white/10 text-white rounded-lg text-xs font-bold hover:bg-white/20 transition-all border border-white/10"
              >
                Copier le Chemin
              </button>
              <button
                onClick={() => setActiveConfigApp(null)}
                className="flex-1 py-2.5 bg-[#df9c43] text-black rounded-lg text-xs font-black uppercase tracking-wider hover:bg-[#df9c43]/90 transition-all"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in { animation: fadeIn 0.2s ease-out; }
      `}</style>
    </div>
  );
}
