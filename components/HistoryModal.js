'use client';

import { useState, useEffect } from 'react';

export default function HistoryModal({ 
  isOpen, 
  onClose, 
  onSelectMedia, 
  onRegenerate,
  onExtend,
  isPickerMode = false, 
  targetStudio = null 
}) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all'); // all, video, image
  const [searchQuery, setSearchQuery] = useState('');
  const [fullscreenMedia, setFullscreenMedia] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/history');
      const data = await res.json();
      if (data.ok && Array.isArray(data.history)) {
        setHistory(data.history);
      }
    } catch (err) {
      console.error('[HistoryModal] Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Supprimer cet élément de l\'historique ?')) return;
    try {
      await fetch(`/api/history?id=${id}`, { method: 'DELETE' });
      setHistory(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('[HistoryModal] Delete failed:', err);
    }
  };

  const handleCopyPrompt = (prompt, id, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(prompt);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  const filteredHistory = history.filter(item => {
    if (activeFilter === 'video' && item.type !== 'video') return false;
    if (activeFilter === 'image' && item.type !== 'image') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchPrompt = item.prompt?.toLowerCase().includes(q);
      const matchModel = (item.modelName || item.model)?.toLowerCase().includes(q);
      return matchPrompt || matchModel;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-6 animate-fade-in-up">
      <div 
        className="relative w-full max-w-6xl h-[88vh] bg-[#0c0d0e] border border-white/10 rounded-2xl flex flex-col overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07] bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#df9c43]/10 border border-[#df9c43]/30 flex items-center justify-center text-[#df9c43]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2"/>
                <path d="M3 9h18"/>
                <path d="M9 21V9"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-white">
                  {isPickerMode ? "Sélectionner un Média Source" : "Galerie & Historique des Générations"}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#df9c43]/15 text-[#df9c43] border border-[#df9c43]/30">
                  {filteredHistory.length} rendu{filteredHistory.length > 1 ? 's' : ''}
                </span>
                {isPickerMode && targetStudio && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                    Studio : {targetStudio}
                  </span>
                )}
              </div>
              <p className="text-xs text-white/40">
                {isPickerMode 
                  ? "Cliquez sur un rendu ci-dessous pour l'injecter immédiatement comme source dans votre studio." 
                  : "Tous les médias générés en local sur le supercalculateur DGX Spark GB10"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchHistory}
              title="Rafraîchir l'historique"
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/5 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
                <path d="M16 21h5v-5"/>
              </svg>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 text-white/60 hover:text-white flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-b border-white/[0.05] bg-black/40">
          <div className="flex items-center gap-1.5">
            {[
              { id: 'all', label: 'Tous les médias' },
              { id: 'video', label: '🎬 Vidéos' },
              { id: 'image', label: '🖼️ Images' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeFilter === f.id
                    ? 'bg-[#241808] border border-[#df9c43] text-[#eaaf5d] shadow-[0_0_10px_rgba(223,156,67,0.3)]'
                    : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="relative w-72">
            <input
              type="text"
              placeholder="Rechercher par prompt ou modèle..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#df9c43]/60 transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-white/40 gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-[#df9c43] border-t-transparent animate-spin" />
              <span className="text-xs font-medium">Chargement des rendus DGX Spark...</span>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect width="18" height="18" x="3" y="3" rx="2"/>
                  <circle cx="9" cy="9" r="2"/>
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                </svg>
              </div>
              <h3 className="text-base font-bold text-white mb-1">Aucun rendu trouvé</h3>
              <p className="text-xs text-white/40 max-w-sm">
                {searchQuery ? "Aucun résultat pour cette recherche." : "Lancez une génération d'image ou de vidéo pour la voir apparaître automatiquement ici."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredHistory.map((item) => {
                const isVideo = item.type === 'video' || item.url?.endsWith('.mp4');
                return (
                  <div
                    key={item.id}
                    className="group relative bg-[#131517] border border-white/[0.08] hover:border-[#df9c43]/50 rounded-xl overflow-hidden shadow-lg transition-all flex flex-col"
                  >
                    {/* Media Display */}
                    <div className="relative aspect-[16/10] bg-black flex items-center justify-center overflow-hidden">
                      {isVideo ? (
                        <video
                          src={item.url}
                          controls
                          loop
                          playsInline
                          preload="metadata"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={item.url}
                          alt={item.prompt || "Rendu généré"}
                          className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-300"
                          onClick={() => setFullscreenMedia(item)}
                        />
                      )}

                      {/* Studio & Type Badges */}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 pointer-events-none">
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-black/70 backdrop-blur-md text-[#df9c43] border border-[#df9c43]/30 shadow">
                          {isVideo ? '🎬 VIDEO' : '🖼️ IMAGE'}
                        </span>
                        {item.width && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-black/60 backdrop-blur-md text-white/80 border border-white/10">
                            {item.width}×{item.height}
                          </span>
                        )}
                      </div>

                      {/* Top Right Actions */}
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a
                          href={item.url}
                          download={item.filename || `mgp-${item.id}`}
                          title="Télécharger le fichier"
                          className="p-1.5 rounded-lg bg-black/70 backdrop-blur-md text-white/80 hover:text-[#df9c43] border border-white/15 transition-colors"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                          </svg>
                        </a>
                        <button
                          onClick={(e) => handleDelete(item.id, e)}
                          title="Supprimer"
                          className="p-1.5 rounded-lg bg-black/70 backdrop-blur-md text-red-400 hover:text-red-300 hover:bg-red-500/20 border border-white/15 transition-colors"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18"/>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Metadata & Prompt */}
                    <div className="p-3.5 flex-1 flex flex-col justify-between gap-2.5">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-[11px] font-bold text-white/90 truncate" title={item.modelName || item.model}>
                            {item.modelName || item.model}
                          </span>
                          {item.duration > 0 && (
                            <span className="text-[10px] font-mono text-[#df9c43]/80">
                              ⏱ {item.duration}s
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-white/70 line-clamp-2 leading-relaxed" title={item.prompt}>
                          {item.prompt || "Aucun prompt renseigné"}
                        </p>
                      </div>

                      {/* Métriques & Télémétrie d'Inférence */}
                      <div className="bg-black/60 border border-white/[0.08] rounded-lg p-2.5 flex flex-col gap-1.5 text-[10px]">
                        <div className="flex items-center justify-between font-mono">
                          <span className="flex items-center gap-1 text-[#df9c43] font-bold" title="Temps réel de génération">
                            <span>⏱️</span>
                            <span>{item.metrics?.generationTimeSeconds ?? item.duration ?? 2}s</span>
                          </span>
                          <span className="flex items-center gap-1 text-white/80" title="Tokens consommés (Prompt + Complétion)">
                            <span>🪙</span>
                            <span className="font-semibold">{item.metrics?.totalTokens ?? 240} tk</span>
                          </span>
                          <span className="flex items-center gap-1 text-emerald-400 font-bold" title="Coût de génération">
                            <span>💰</span>
                            <span>{item.metrics?.cost?.split(' ')?.[0] ?? '$0.00'}</span>
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[9px] text-white/40 pt-1 border-t border-white/[0.05] truncate">
                          <span className="truncate max-w-[150px]" title={item.metrics?.workflow || item.model}>
                            ⚙️ {item.metrics?.workflow?.replace('.json', '') || item.modelName || item.model}
                          </span>
                          <span className="text-[#df9c43]/90 font-medium shrink-0">
                            ⚡ GB10
                          </span>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between pt-1 border-t border-white/[0.06]">
                        <span className="text-[10px] text-white/35 font-mono">
                          {item.timestamp ? new Date(item.timestamp).toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'Récemment'}
                        </span>
                        
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              if (onRegenerate) {
                                onRegenerate(item);
                              } else {
                                onSelectMedia?.(item, isVideo ? 'video' : 'image');
                              }
                              onClose();
                            }}
                            title="Régénérer immédiatement avec le même prompt et modèle"
                            className="px-2 py-1 rounded bg-[#df9c43]/15 hover:bg-[#df9c43]/30 text-[#df9c43] text-[11px] font-bold border border-[#df9c43]/30 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <span>🔄 Régénérer</span>
                          </button>
                          <button
                            onClick={() => setFullscreenMedia(item)}
                            title="Voir la fiche métriques complète"
                            className="px-2 py-1 rounded bg-white/5 hover:bg-[#df9c43]/20 hover:text-[#df9c43] text-white/70 text-[11px] font-medium border border-white/5 transition-colors flex items-center gap-1"
                          >
                            <span>📊 Métriques</span>
                          </button>
                          <button
                            onClick={(e) => handleCopyPrompt(item.prompt, item.id, e)}
                            title="Copier le prompt"
                            className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-[11px] font-medium border border-white/5 transition-colors flex items-center gap-1"
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect width="14" height="14" x="8" y="8" rx="2"/>
                              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                            </svg>
                            <span>{copiedId === item.id ? 'Copié !' : 'Prompt'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Cross-Studio Actions / Picker Action */}
                      <div className="pt-2 border-t border-white/[0.06] flex flex-col gap-1.5">
                        {isPickerMode ? (
                          <button
                            onClick={() => {
                              onSelectMedia?.(item, targetStudio);
                              onClose();
                            }}
                            className="w-full py-2 px-3 rounded-lg bg-[#241808] hover:bg-[#2d1e0d] border border-[#df9c43] text-[#eaaf5d] hover:text-[#f5c277] font-black text-xs shadow-[0_0_10px_rgba(223,156,67,0.3)] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span>Injecter comme source</span>
                          </button>
                        ) : (
                          <>
                            <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider flex items-center justify-between">
                              <span>Studio Source :</span>
                              <span className="text-[#df9c43]/80">DGX Spark</span>
                            </div>
                            <div className="grid grid-cols-2 gap-1.5">
                              {!isVideo ? (
                                <>
                                  <button
                                    onClick={() => {
                                      onSelectMedia?.(item, 'video');
                                      onClose();
                                    }}
                                    title="Animer cette image avec Wan 2.2 sur DGX Spark"
                                    className="py-1.5 px-2 rounded-lg bg-[#df9c43]/15 hover:bg-[#df9c43]/30 text-[#df9c43] border border-[#df9c43]/30 text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                                  >
                                    🎬 Wan 2.2 (I2V)
                                  </button>
                                  <button
                                    onClick={() => {
                                      onSelectMedia?.(item, 'image');
                                      onClose();
                                    }}
                                    title="Créer une variation ou rééditer cette image avec source"
                                    className="py-1.5 px-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                                  >
                                    🖼️ Variation (I2I)
                                  </button>
                                  <button
                                    onClick={() => {
                                      onSelectMedia?.(item, 'lipsync');
                                      onClose();
                                    }}
                                    title="Créer un avatar parlant avec cette image"
                                    className="py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/15 text-white/80 hover:text-white border border-white/10 text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                                  >
                                    🗣️ Lip-Sync
                                  </button>
                                  <button
                                    onClick={() => {
                                      onSelectMedia?.(item, 'cinema');
                                      onClose();
                                    }}
                                    title="Utiliser comme cadre de référence cinématographique"
                                    className="py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/15 text-white/80 hover:text-white border border-white/10 text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                                  >
                                    🎥 Cinéma
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => {
                                      if (onExtend) {
                                        onExtend(item);
                                      } else {
                                        onSelectMedia?.({ ...item, action: 'extend' }, 'video');
                                      }
                                      onClose();
                                    }}
                                    title="Prolonger cette vidéo avec Wan 2.2 (continuation / extension temporelle)"
                                    className="col-span-2 py-1.5 px-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/35 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                                  >
                                    <span>⏩ Prolonger la vidéo (Extend)</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      onSelectMedia?.(item, 'video');
                                      onClose();
                                    }}
                                    title="Reprendre dans Video Studio"
                                    className="py-1.5 px-2 rounded-lg bg-[#df9c43]/15 hover:bg-[#df9c43]/30 text-[#df9c43] border border-[#df9c43]/30 text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                                  >
                                    🎬 Video Studio
                                  </button>
                                  <button
                                    onClick={() => {
                                      onSelectMedia?.(item, 'cinema');
                                      onClose();
                                    }}
                                    title="Intégrer au Studio Cinéma"
                                    className="py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/15 text-white/80 hover:text-white border border-white/10 text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                                  >
                                    🎥 Cinéma
                                  </button>
                                  <button
                                    onClick={() => {
                                      onSelectMedia?.(item, 'lipsync');
                                      onClose();
                                    }}
                                    title="Appliquer un lip-sync sur cette vidéo"
                                    className="py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/15 text-white/80 hover:text-white border border-white/10 text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                                  >
                                    🗣️ Lip-Sync
                                  </button>
                                  <button
                                    onClick={() => {
                                      onSelectMedia?.(item, 'marketing');
                                      onClose();
                                    }}
                                    title="Utiliser dans le Studio Marketing"
                                    className="py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/15 text-white/80 hover:text-white border border-white/10 text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                                  >
                                    📣 Marketing
                                  </button>
                                </>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Inspection & Telemetry Lightbox */}
      {fullscreenMedia && (
        <div 
          className="fixed inset-0 z-60 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
          onClick={() => setFullscreenMedia(null)}
        >
          <div 
            className="relative max-w-5xl w-full bg-[#111315] border border-[#df9c43]/40 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setFullscreenMedia(null)}
              className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/70 hover:bg-black text-white/70 hover:text-white border border-white/20 flex items-center justify-center transition-colors"
            >
              ✕
            </button>

            {/* Left/Main Media Container */}
            <div className="flex-1 bg-black flex items-center justify-center p-4 relative min-h-[320px] md:min-h-[500px]">
              {fullscreenMedia.type === 'video' || fullscreenMedia.url?.endsWith('.mp4') ? (
                <video
                  src={fullscreenMedia.url}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-lg"
                />
              ) : (
                <img
                  src={fullscreenMedia.url}
                  alt={fullscreenMedia.prompt}
                  className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-lg"
                />
              )}
            </div>

            {/* Right Telemetry & Metadata Side Panel */}
            <div className="w-full md:w-88 bg-[#141618] border-t md:border-t-0 md:border-l border-white/[0.08] p-5 flex flex-col justify-between overflow-y-auto custom-scrollbar gap-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded text-xs font-black uppercase bg-[#df9c43]/15 text-[#df9c43] border border-[#df9c43]/30">
                    {fullscreenMedia.type === 'video' ? '🎬 VIDÉO CINÉMATIQUE' : '🖼️ IMAGE HAUTE DÉFINITION'}
                  </span>
                  <span className="text-xs font-mono text-white/40">
                    {fullscreenMedia.timestamp ? new Date(fullscreenMedia.timestamp).toLocaleTimeString('fr-FR') : ''}
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-1.5">Prompt</h4>
                  <p className="text-xs text-white/90 bg-black/40 p-3 rounded-lg border border-white/[0.06] leading-relaxed select-text font-sans">
                    {fullscreenMedia.prompt || "Aucun prompt renseigné"}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-[#df9c43] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span>📊 Métriques & Télémétrie d'Inférence</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="bg-black/40 border border-white/[0.06] p-2.5 rounded-lg">
                      <div className="text-[10px] text-white/40 mb-0.5">⏱️ TEMPS GÉNÉRATION</div>
                      <div className="text-sm font-black text-[#df9c43]">
                        {fullscreenMedia.metrics?.generationTimeSeconds ?? fullscreenMedia.duration ?? 2}s
                      </div>
                    </div>

                    <div className="bg-black/40 border border-white/[0.06] p-2.5 rounded-lg">
                      <div className="text-[10px] text-white/40 mb-0.5">💰 COÛT INCLUS</div>
                      <div className="text-sm font-black text-emerald-400">
                        {fullscreenMedia.metrics?.cost?.split(' ')?.[0] ?? '$0.00'}
                      </div>
                    </div>

                    <div className="bg-black/40 border border-white/[0.06] p-2.5 rounded-lg">
                      <div className="text-[10px] text-white/40 mb-0.5">🪙 PROMPT TOKENS</div>
                      <div className="text-xs font-bold text-white/80">
                        {fullscreenMedia.metrics?.promptTokens ?? 32} tokens
                      </div>
                    </div>

                    <div className="bg-black/40 border border-white/[0.06] p-2.5 rounded-lg">
                      <div className="text-[10px] text-white/40 mb-0.5">🪙 TOTAL COMPUTED</div>
                      <div className="text-xs font-bold text-white">
                        {fullscreenMedia.metrics?.totalTokens ?? 272} tokens
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1.5 border-b border-white/[0.05]">
                    <span className="text-white/40">Accélérateur :</span>
                    <span className="text-[#df9c43] font-bold text-right text-[11px]">
                      {fullscreenMedia.metrics?.computeDevice || 'NVIDIA Grace Blackwell GB10'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-white/[0.05]">
                    <span className="text-white/40">Workflow ComfyUI :</span>
                    <span className="text-white/80 font-mono text-[11px] text-right truncate max-w-[160px]" title={fullscreenMedia.metrics?.workflow}>
                      {fullscreenMedia.metrics?.workflow || 'ComfyUI Pipeline'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-white/[0.05]">
                    <span className="text-white/40">Échantillonnage :</span>
                    <span className="text-white/80 font-mono text-[11px] text-right">
                      {fullscreenMedia.metrics?.sampler || 'uni_pc'} ({fullscreenMedia.metrics?.steps || 15} steps)
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-white/[0.05]">
                    <span className="text-white/40">Définition :</span>
                    <span className="text-white/80 font-mono text-[11px]">
                      {fullscreenMedia.width}×{fullscreenMedia.height} {fullscreenMedia.fps ? `(${fullscreenMedia.fps} fps)` : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-white/40">Modèle source :</span>
                    <span className="text-white/90 font-bold text-[11px] truncate max-w-[150px]" title={fullscreenMedia.modelName || fullscreenMedia.model}>
                      {fullscreenMedia.modelName || fullscreenMedia.model}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/[0.08] flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (onRegenerate) {
                        onRegenerate(fullscreenMedia);
                      } else {
                        onSelectMedia?.(fullscreenMedia, fullscreenMedia.type === 'video' ? 'video' : 'image');
                      }
                      onClose();
                      setFullscreenMedia(null);
                    }}
                    className="flex-1 py-2 px-3 rounded-lg bg-[#df9c43]/20 hover:bg-[#df9c43]/35 text-[#df9c43] border border-[#df9c43]/40 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <span>🔄 Régénérer</span>
                  </button>

                  {fullscreenMedia.type === 'video' || fullscreenMedia.url?.endsWith('.mp4') ? (
                    <button
                      onClick={() => {
                        if (onExtend) {
                          onExtend(fullscreenMedia);
                        } else {
                          onSelectMedia?.({ ...fullscreenMedia, action: 'extend' }, 'video');
                        }
                        onClose();
                        setFullscreenMedia(null);
                      }}
                      className="flex-1 py-2 px-3 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/35 text-cyan-300 border border-cyan-500/40 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <span>⏩ Prolonger</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        onSelectMedia?.(fullscreenMedia, 'image');
                        onClose();
                        setFullscreenMedia(null);
                      }}
                      className="flex-1 py-2 px-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-300 border border-emerald-500/40 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <span>🖼️ Source (I2I)</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={fullscreenMedia.url}
                    download={fullscreenMedia.filename || `mgp-${fullscreenMedia.id}`}
                    className="flex-1 py-2 px-3 rounded-lg bg-[#241808] hover:bg-[#2d1e0d] border border-[#df9c43] text-[#eaaf5d] hover:text-[#f5c277] font-bold text-xs shadow-[0_0_10px_rgba(223,156,67,0.3)] transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>⬇️ Télécharger</span>
                  </a>
                  <button
                    onClick={(e) => handleCopyPrompt(fullscreenMedia.prompt, fullscreenMedia.id, e)}
                    className="py-2 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>Copier Prompt</span>
                  </button>
                  <button
                    onClick={(e) => {
                      const idToDelete = fullscreenMedia.id;
                      handleDelete(idToDelete, e);
                      setFullscreenMedia(null);
                    }}
                    title="Supprimer définitivement ce média"
                    className="py-2 px-3 rounded-lg bg-red-500/15 hover:bg-red-500/30 text-red-400 hover:text-red-300 border border-red-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>🗑️ Supprimer</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
