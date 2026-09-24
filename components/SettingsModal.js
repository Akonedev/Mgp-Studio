'use client';

import React, { useState, useEffect } from 'react';

const MODES_CONFIG = [
  {
    id: 'text',
    name: 'Texte / LLM / Agents',
    icon: '📝',
    description: 'Scénarisation, dialogue des agents, storyboarding et prompts'
  },
  {
    id: 'image',
    name: 'Image Studio',
    icon: '🖼️',
    description: 'Génération et retouche d\'images photoréalistes (T2I / I2I)'
  },
  {
    id: 'video',
    name: 'Video Studio',
    icon: '🎬',
    description: 'Génération de plans vidéo cinématiques (T2V / I2V)'
  },
  {
    id: 'avatar',
    name: 'Avatar & Lip Sync',
    icon: '🎙️',
    description: 'Animation de visages, synchronisation labiale et humains digitaux'
  },
  {
    id: 'audio',
    name: 'Audio & Musique',
    icon: '🎵',
    description: 'Composition de bande originale, bruitages et sound design'
  }
];

export default function SettingsModal({ isOpen, onClose, onSave }) {
  const [activeTab, setActiveTab] = useState('modes'); // 'modes' | 'providers' | 'hardware'
  const [providers, setProviders] = useState([]);
  const [modeSettings, setModeSettings] = useState({
    text: { providerId: 'spark-vllm', model: 'qwen38' },
    image: { providerId: 'spark-comfy', model: 'DreamShaper_8_pruned.safetensors' },
    video: { providerId: 'spark-comfy', model: 'wan2.1_t2v_1.3B_bf16.safetensors' },
    audio: { providerId: 'spark-comfy', model: 'minimax_music3_dit_fp16.safetensors' },
    avatar: { providerId: 'spark-comfy', model: 'wan2.1_t2v_1.3B_bf16.safetensors' }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loadingModels, setLoadingModels] = useState({});
  const [statusMessage, setStatusMessage] = useState(null);
  const [editingProvider, setEditingProvider] = useState(null);
  const [isAddingProvider, setIsAddingProvider] = useState(false);

  // New Provider Form State
  const [newProvider, setNewProvider] = useState({
    id: '',
    name: '',
    type: 'openai_compatible',
    baseUrl: '',
    apiKey: '',
    supportedModes: ['text'],
    modelsText: '',
    defaultModel: '',
    description: ''
  });

  // Load configuration on mount
  useEffect(() => {
    if (!isOpen) return;
    loadProvidersAndSettings();
  }, [isOpen]);

  const loadProvidersAndSettings = async () => {
    try {
      const res = await fetch('/api/providers');
      if (res.ok) {
        const data = await res.json();
        if (data.providers) setProviders(data.providers);
        if (data.mode_settings) {
          setModeSettings(data.mode_settings);
          localStorage.setItem('mode_settings', JSON.stringify(data.mode_settings));
        }
      }
    } catch (e) {
      console.error('[SettingsModal] Erreur chargement providers:', e);
    }
  };

  // Switch model/provider for a specific mode
  const handleModeProviderChange = (modeId, providerId) => {
    const provider = providers.find(p => p.id === providerId);
    const availableModels = (provider?.modelsByMode && provider?.modelsByMode[modeId])
      ? provider.modelsByMode[modeId]
      : (provider?.models || []);
    const defaultModel = provider?.defaultModelByMode?.[modeId] || availableModels[0] || provider?.defaultModel || 'default-model';

    const updated = {
      ...modeSettings,
      [modeId]: {
        providerId,
        model: defaultModel
      }
    };
    setModeSettings(updated);
  };

  const handleModeModelChange = (modeId, model) => {
    setModeSettings({
      ...modeSettings,
      [modeId]: {
        ...modeSettings[modeId],
        model
      }
    });
  };

  // Save mode settings
  const handleSaveModeSettings = async () => {
    try {
      setStatusMessage({ type: 'info', text: 'Sauvegarde des affectations de modes en cours...' });
      const res = await fetch('/api/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_mode_settings',
          mode_settings: modeSettings
        })
      });
      if (res.ok) {
        localStorage.setItem('mode_settings', JSON.stringify(modeSettings));
        setStatusMessage({ type: 'success', text: 'Affectations des modes enregistrées avec succès !' });
        setTimeout(() => setStatusMessage(null), 3500);
        if (onSave) onSave(modeSettings);
      } else {
        setStatusMessage({ type: 'error', text: 'Erreur lors de la sauvegarde.' });
      }
    } catch (e) {
      setStatusMessage({ type: 'error', text: e.message });
    }
  };

  // Fetch / refresh models from provider URL + Key
  const handleFetchModels = async (provider) => {
    setLoadingModels(prev => ({ ...prev, [provider.id]: true }));
    setStatusMessage({ type: 'info', text: `Interrogation des modèles pour ${provider.name}...` });

    try {
      const res = await fetch('/api/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'fetch_models',
          providerId: provider.id,
          baseUrl: provider.baseUrl,
          apiKey: provider.apiKey,
          type: provider.type
        })
      });

      const data = await res.json();
      if (data.ok && Array.isArray(data.models)) {
        setStatusMessage({
          type: 'success',
          text: `${data.models.length} modèle(s) synchronisé(s) pour ${provider.name} !`
        });
        // Update local providers state
        setProviders(prev => prev.map(p => {
          if (p.id === provider.id) {
            return {
              ...p,
              models: data.models,
              defaultModel: data.models.includes(p.defaultModel) ? p.defaultModel : data.models[0]
            };
          }
          return p;
        }));
      } else {
        setStatusMessage({
          type: 'error',
          text: `Aucun modèle détecté ou impossible de joindre ${provider.baseUrl}`
        });
      }
    } catch (e) {
      setStatusMessage({ type: 'error', text: `Erreur: ${e.message}` });
    } finally {
      setLoadingModels(prev => ({ ...prev, [provider.id]: false }));
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  // Save new / edited provider
  const handleSaveProvider = async (providerData) => {
    try {
      const models = providerData.modelsText
        ? providerData.modelsText.split(/[\n,]+/).map(s => s.trim()).filter(Boolean)
        : (providerData.models || []);

      const payload = {
        id: providerData.id.trim().toLowerCase().replace(/\s+/g, '-'),
        name: providerData.name.trim(),
        type: providerData.type,
        baseUrl: providerData.baseUrl.trim(),
        apiKey: providerData.apiKey ? providerData.apiKey.trim() : '',
        supportedModes: providerData.supportedModes,
        models: models.length > 0 ? models : ['default-model'],
        defaultModel: providerData.defaultModel || models[0] || 'default-model',
        description: providerData.description || '',
        isCustom: providerData.isCustom !== undefined ? providerData.isCustom : true
      };

      const res = await fetch('/api/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_provider',
          provider: payload
        })
      });

      if (res.ok) {
        setStatusMessage({ type: 'success', text: `Provider "${payload.name}" enregistré !` });
        setIsAddingProvider(false);
        setEditingProvider(null);
        loadProvidersAndSettings();
      } else {
        setStatusMessage({ type: 'error', text: 'Erreur lors de l\'enregistrement du provider' });
      }
    } catch (e) {
      setStatusMessage({ type: 'error', text: e.message });
    }
  };

  // Delete provider
  const handleDeleteProvider = async (providerId) => {
    if (!confirm(`Confirmez-vous la suppression du provider "${providerId}" ?`)) return;
    try {
      const res = await fetch('/api/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_provider',
          providerId
        })
      });
      if (res.ok) {
        setStatusMessage({ type: 'success', text: `Provider "${providerId}" supprimé` });
        loadProvidersAndSettings();
      }
    } catch (e) {
      setStatusMessage({ type: 'error', text: e.message });
    }
  };

  // Filtered providers list
  const filteredProviders = providers.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (typeFilter === 'local') return p.type.includes('local') || p.id.includes('spark') || p.id.includes('local');
    if (typeFilter === 'comfyui') return p.type === 'comfyui' || p.id.includes('comfy');
    if (typeFilter === 'cloud') return !p.id.includes('spark') && !p.id.includes('local') && p.type !== 'comfyui';
    if (typeFilter === 'custom') return !!p.isCustom;
    return true;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-3 md:p-6 animate-fade-in-up">
      <div className="bg-[#0e0e0e] border border-white/10 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#df9c43]/10 border border-[#df9c43]/30 flex items-center justify-center text-[#df9c43] font-bold text-lg">
              ⚙
            </div>
            <div>
              <h2 className="text-white font-bold text-base md:text-lg flex items-center gap-2">
                Gestion des Providers & Modèles par Mode
              </h2>
              <p className="text-white/40 text-xs">
                Affectez un provider et un modèle distinct pour chaque mode génératif
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white text-xl p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-white/10 bg-black/40">
          <button
            onClick={() => setActiveTab('modes')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'modes'
                ? 'border-[#df9c43] text-[#df9c43] bg-white/[0.04]'
                : 'border-transparent text-white/60 hover:text-white'
            }`}
          >
            <span>🎯</span>
            <span>Modes & Affectations ({MODES_CONFIG.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('providers')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'providers'
                ? 'border-[#df9c43] text-[#df9c43] bg-white/[0.04]'
                : 'border-transparent text-white/60 hover:text-white'
            }`}
          >
            <span>🔌</span>
            <span>Gestion des Providers ({providers.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('hardware')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'hardware'
                ? 'border-[#df9c43] text-[#df9c43] bg-white/[0.04]'
                : 'border-transparent text-white/60 hover:text-white'
            }`}
          >
            <span>⚡</span>
            <span>Infrastructure & Matériel</span>
          </button>
        </div>

        {/* Feedback Alert Bar */}
        {statusMessage && (
          <div className={`px-6 py-2 text-xs font-medium flex items-center justify-between transition-all ${
            statusMessage.type === 'success' ? 'bg-green-500/20 text-green-300 border-b border-green-500/30' :
            statusMessage.type === 'error' ? 'bg-red-500/20 text-red-300 border-b border-red-500/30' :
            'bg-blue-500/20 text-blue-300 border-b border-blue-500/30'
          }`}>
            <span>{statusMessage.text}</span>
            <button onClick={() => setStatusMessage(null)} className="opacity-60 hover:opacity-100">✕</button>
          </div>
        )}

        {/* Tab 1: Modes & Mappings */}
        {activeTab === 'modes' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
            <div className="bg-[#df9c43]/5 border border-[#df9c43]/20 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#df9c43] uppercase tracking-wider block mb-1">
                  Principe d'Exécution Multi-Modes
                </span>
                <p className="text-xs text-white/70">
                  Chaque studio (Texte, Images, Vidéos, Avatar, Audio) utilise son provider et son modèle dédié.
                  Les changements sont appliqués instantanément lors de chaque génération.
                </p>
              </div>
              <button
                onClick={handleSaveModeSettings}
                className="px-4 py-2 bg-[#241808] hover:bg-[#2d1e0d] border border-[#df9c43] text-[#eaaf5d] hover:text-[#f5c277] font-bold text-xs rounded-xl transition-all shadow-[0_0_10px_rgba(223,156,67,0.3)] whitespace-nowrap ml-4"
              >
                💾 Enregistrer Tout
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MODES_CONFIG.map(mode => {
                const currentSetting = modeSettings[mode.id] || { providerId: 'spark-comfy', model: 'default' };
                // Filter providers compatible with this mode or all if none tagged
                const compatibleProviders = providers.filter(p =>
                  !p.supportedModes || p.supportedModes.includes(mode.id) || p.type === 'comfyui'
                );
                const selectedProvider = providers.find(p => p.id === currentSetting.providerId) || compatibleProviders[0];
                const availableModels = (selectedProvider?.modelsByMode && selectedProvider?.modelsByMode[mode.id])
                  ? selectedProvider.modelsByMode[mode.id]
                  : (selectedProvider?.models || []);

                return (
                  <div
                    key={mode.id}
                    className="bg-white/[0.03] border border-white/10 rounded-xl p-4.5 hover:border-white/20 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Mode Title & Icon */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">{mode.icon}</span>
                          <div>
                            <h3 className="text-sm font-bold text-white">{mode.name}</h3>
                            <span className="text-[10px] text-white/40 uppercase font-mono tracking-wider">
                              Mode: {mode.id}
                            </span>
                          </div>
                        </div>
                        {selectedProvider?.id.includes('spark') && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#df9c43]/10 text-[#df9c43] font-mono font-bold border border-[#df9c43]/20">
                            GB10 Spark
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-white/50 mb-3.5">
                        {mode.description}
                      </p>

                      {/* Provider Select */}
                      <div className="space-y-1.5 mb-3">
                        <label className="text-[11px] font-bold text-white/70 flex items-center justify-between">
                          <span>Provider Assigné :</span>
                          <span className="text-[10px] text-white/30 font-normal">
                            {compatibleProviders.length} compatibles
                          </span>
                        </label>
                        <select
                          value={currentSetting.providerId}
                          onChange={(e) => handleModeProviderChange(mode.id, e.target.value)}
                          className="w-full bg-black/80 border border-white/20 rounded-lg px-3 py-2 text-xs text-white focus:border-[#df9c43] focus:outline-none"
                        >
                          {compatibleProviders.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.type})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Model Select */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-white/70">
                            Modèle pour ce mode :
                          </label>
                          <button
                            type="button"
                            onClick={() => selectedProvider && handleFetchModels(selectedProvider)}
                            disabled={loadingModels[selectedProvider?.id]}
                            className="text-[10px] text-[#df9c43] hover:underline flex items-center gap-1"
                            title="Interroger l'URL du provider pour actualiser les modèles"
                          >
                            <span>🔄</span>
                            <span>{loadingModels[selectedProvider?.id] ? 'Chargement...' : 'Actualiser'}</span>
                          </button>
                        </div>

                        {availableModels.length > 0 ? (
                          <select
                            value={availableModels.includes(currentSetting.model) ? currentSetting.model : (availableModels[0] || '')}
                            onChange={(e) => handleModeModelChange(mode.id, e.target.value)}
                            className="w-full bg-black/80 border border-white/20 rounded-lg px-3 py-2 text-xs text-white focus:border-[#df9c43] focus:outline-none font-mono"
                          >
                            {availableModels.map(m => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={currentSetting.model || ''}
                            onChange={(e) => handleModeModelChange(mode.id, e.target.value)}
                            placeholder="Nom du modèle (ex: wan2.1_t2v_1.3B_bf16.safetensors)"
                            className="w-full bg-black/80 border border-white/20 rounded-lg px-3 py-2 text-xs text-white focus:border-[#df9c43] focus:outline-none font-mono"
                          />
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-white/40">
                      <span>Inférence active :</span>
                      <span className="font-mono text-white/80 font-bold">
                        {currentSetting.model || 'Défaut'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Providers Management */}
        {activeTab === 'providers' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {/* Top Toolbar: Search & Filters & Add Button */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Rechercher un provider par nom, id ou URL..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black/60 border border-white/20 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/40 focus:border-[#df9c43] focus:outline-none pl-9"
                />
                <span className="absolute left-3 top-2.5 text-white/40 text-xs">🔍</span>
              </div>

              <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10 overflow-x-auto">
                {[
                  { id: 'all', label: 'Tous' },
                  { id: 'local', label: 'Locaux & Spark' },
                  { id: 'comfyui', label: 'ComfyUI' },
                  { id: 'cloud', label: 'Cloud' },
                  { id: 'custom', label: 'Custom' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setTypeFilter(f.id)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      typeFilter === f.id
                        ? 'bg-[#241808] border border-[#df9c43] text-[#eaaf5d] shadow-[0_0_8px_rgba(223,156,67,0.3)]'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  setNewProvider({
                    id: `custom-${Date.now().toString(36)}`,
                    name: '',
                    type: 'openai_compatible',
                    baseUrl: '',
                    apiKey: '',
                    supportedModes: ['text'],
                    modelsText: '',
                    defaultModel: '',
                    description: '',
                    isCustom: true
                  });
                  setIsAddingProvider(true);
                }}
                className="px-4 py-2.5 bg-[#241808] hover:bg-[#2d1e0d] border border-[#df9c43] text-[#eaaf5d] hover:text-[#f5c277] font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(223,156,67,0.3)] whitespace-nowrap"
              >
                <span>+</span>
                <span>Nouveau Provider</span>
              </button>
            </div>

            {/* Providers Cards */}
            <div className="space-y-3">
              {filteredProviders.map(p => {
                const isLoadingThis = loadingModels[p.id];

                return (
                  <div
                    key={p.id}
                    className="bg-white/[0.03] border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-white">{p.name}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-white/10 text-white/70">
                          {p.id}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          p.type === 'comfyui' ? 'bg-[#b87524]/20 text-[#eaaf5d]' :
                          p.type.includes('local') ? 'bg-green-500/20 text-green-300' :
                          'bg-blue-500/20 text-blue-300'
                        }`}>
                          {p.type}
                        </span>
                        {p.isCustom && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                            Custom
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-white/50 font-mono truncate">
                        URL: <span className="text-white/80">{p.baseUrl || 'Inconnue'}</span>
                      </div>

                      {/* Modes Badges */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        <span className="text-[10px] text-white/40">Modes :</span>
                        {(p.supportedModes || ['text']).map(m => (
                          <span key={m} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/80 font-mono">
                            {m}
                          </span>
                        ))}
                        <span className="text-[10px] text-white/40 ml-2">
                          ({p.models ? p.models.length : 0} modèle(s) répertorié(s))
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleFetchModels(p)}
                        disabled={isLoadingThis}
                        title="Interroger l'URL et la clé API pour charger la liste dynamique des modèles"
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-white/80 hover:text-white font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <span>🔄</span>
                        <span>{isLoadingThis ? 'Chargement...' : 'Charger modèles'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setEditingProvider({
                            ...p,
                            modelsText: (p.models || []).join('\n')
                          });
                        }}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-white/80 hover:text-white font-medium transition-colors"
                      >
                        ✏️ Éditer
                      </button>

                      {p.isCustom && (
                        <button
                          onClick={() => handleDeleteProvider(p.id)}
                          className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-xs text-red-400 font-medium transition-colors"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Hardware */}
        {activeTab === 'hardware' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            <div className="bg-white/5 border border-[#df9c43]/30 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-[#df9c43] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#df9c43] animate-pulse"></span>
                  Supercalculateur DGX Spark (NVIDIA GB10)
                </span>
                <span className="text-xs px-2.5 py-1 rounded bg-green-500/20 text-green-400 font-bold border border-green-500/30">
                  Opérationnel (128 Go VRAM unifiée)
                </span>
              </div>

              <div className="text-base font-bold text-white mb-2">
                NVIDIA Grace Blackwell GB10 — Cluster Haute Densité
              </div>

              <p className="text-xs text-white/60 mb-4 leading-relaxed">
                Ce supercalculateur prend en charge nativement les workflows d'inférence lourds (Wan 2.2 5B TI2V, LTX-2.5 22B, MiniMax H3, SD 1.5, Qwen3-VL 30B FP8) avec une latence d'exécution ultra-réduite (~18 secondes par vidéo).
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                <div className="bg-black/50 border border-white/10 rounded-xl p-3">
                  <div className="text-white/40 text-[10px]">ComfyUI Spark</div>
                  <div className="text-white font-bold text-sm">Port 61009</div>
                  <div className="text-green-400 text-[11px]">Wan 2.1 & LTX & SD</div>
                </div>
                <div className="bg-black/50 border border-white/10 rounded-xl p-3">
                  <div className="text-white/40 text-[10px]">vLLM Spark</div>
                  <div className="text-white font-bold text-sm">Port 61005</div>
                  <div className="text-green-400 text-[11px]">Qwen3-VL 30B FP8</div>
                </div>
                <div className="bg-black/50 border border-white/10 rounded-xl p-3">
                  <div className="text-white/40 text-[10px]">Ollama Spark</div>
                  <div className="text-white font-bold text-sm">Port 61004</div>
                  <div className="text-green-400 text-[11px]">Gemma 3 4B</div>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white/70 uppercase tracking-wider">
                  GPU Hôte Local (AMD Radeon RX 7900 XTX)
                </span>
                <span className="text-xs px-2.5 py-1 rounded bg-blue-500/20 text-blue-400 font-bold">
                  0% Charge (Préservé)
                </span>
              </div>
              <p className="text-xs text-white/60">
                Conformément à vos directives, aucune génération n'est allouée sur le GPU de l'hôte local.
                Le serveur Wan2GP local est stoppé et l'ensemble du calcul est déporté sur le cluster DGX Spark.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-black/60 flex items-center justify-between">
          <span className="text-xs text-white/40">
            {providers.length} providers configurés • {MODES_CONFIG.length} modes gérés
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-white/70 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
            >
              Fermer
            </button>
            <button
              onClick={handleSaveModeSettings}
              className="px-5 py-2 bg-[#241808] hover:bg-[#2d1e0d] border border-[#df9c43] text-[#eaaf5d] hover:text-[#f5c277] font-bold text-xs rounded-xl transition-all shadow-[0_0_10px_rgba(223,156,67,0.3)]"
            >
              Enregistrer & Appliquer
            </button>
          </div>
        </div>

        {/* Form Modal: Add / Edit Provider */}
        {(isAddingProvider || editingProvider) && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[60] animate-fade-in-up">
            <div className="bg-[#121212] border border-white/20 rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[85vh] overflow-y-auto space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-sm font-bold text-white">
                  {editingProvider ? `Édition: ${editingProvider.name}` : 'Ajout d\'un Nouveau Provider'}
                </h3>
                <button
                  onClick={() => { setIsAddingProvider(false); setEditingProvider(null); }}
                  className="text-white/40 hover:text-white text-lg"
                >
                  ✕
                </button>
              </div>

              {/* Form Fields */}
              {(() => {
                const target = editingProvider || newProvider;
                const setTarget = editingProvider ? setEditingProvider : setNewProvider;

                return (
                  <div className="space-y-3.5">
                    <div>
                      <label className="text-xs font-bold text-white/80 block mb-1">Nom du Provider</label>
                      <input
                        type="text"
                        placeholder="Ex: Mon Cluster ComfyUI Local"
                        value={target.name}
                        onChange={(e) => setTarget({ ...target, name: e.target.value })}
                        className="w-full bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-xs text-white focus:border-[#df9c43] focus:outline-none"
                      />
                    </div>

                    {!editingProvider && (
                      <div>
                        <label className="text-xs font-bold text-white/80 block mb-1">ID Unique</label>
                        <input
                          type="text"
                          placeholder="Ex: custom-comfyui-host"
                          value={target.id}
                          onChange={(e) => setTarget({ ...target, id: e.target.value })}
                          className="w-full bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-xs text-white focus:border-[#df9c43] focus:outline-none font-mono"
                        />
                      </div>
                    )}

                    <div>
                      <label className="text-xs font-bold text-white/80 block mb-1">Type de Provider</label>
                      <select
                        value={target.type}
                        onChange={(e) => setTarget({ ...target, type: e.target.value })}
                        className="w-full bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-xs text-white focus:border-[#df9c43] focus:outline-none"
                      >
                        <option value="comfyui">ComfyUI (Local ou Réseau)</option>
                        <option value="local_openai">vLLM / LM Studio (OpenAI-compatible Local)</option>
                        <option value="ollama">Ollama</option>
                        <option value="openai_compatible">OpenAI-Compatible (DeepSeek, GLM, etc.)</option>
                        <option value="openrouter">OpenRouter Hub</option>
                        <option value="openai">OpenAI Officiel</option>
                        <option value="anthropic">Anthropic Claude</option>
                        <option value="google">Google Gemini</option>
                        <option value="minimax">MiniMax AI</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-white/80 block mb-1">URL de Base</label>
                      <input
                        type="text"
                        placeholder="Ex: http://192.168.1.219:61009 ou https://api.openai.com/v1"
                        value={target.baseUrl}
                        onChange={(e) => setTarget({ ...target, baseUrl: e.target.value })}
                        className="w-full bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-xs text-white focus:border-[#df9c43] focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-white/80 block mb-1">Clé API (Optionnelle pour local)</label>
                      <input
                        type="password"
                        placeholder="sk-..."
                        value={target.apiKey || ''}
                        onChange={(e) => setTarget({ ...target, apiKey: e.target.value })}
                        className="w-full bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-xs text-white focus:border-[#df9c43] focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-white/80 block mb-1.5">Modes Supportés</label>
                      <div className="flex items-center gap-3 flex-wrap">
                        {MODES_CONFIG.map(m => {
                          const isChecked = (target.supportedModes || []).includes(m.id);
                          return (
                            <label key={m.id} className="flex items-center gap-1.5 text-xs text-white/80 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  const current = target.supportedModes || [];
                                  const next = e.target.checked
                                    ? [...current, m.id]
                                    : current.filter(x => x !== m.id);
                                  setTarget({ ...target, supportedModes: next });
                                }}
                                className="accent-[#df9c43]"
                              />
                              <span>{m.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-white/80 block mb-1">
                        Modèles (un par ligne ou séparés par virgule)
                      </label>
                      <textarea
                        rows="3"
                        placeholder="Ex: wan2.1_t2v_1.3B_bf16.safetensors, DreamShaper_8_pruned.safetensors"
                        value={target.modelsText || ''}
                        onChange={(e) => setTarget({ ...target, modelsText: e.target.value })}
                        className="w-full bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-xs text-white focus:border-[#df9c43] focus:outline-none font-mono"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => { setIsAddingProvider(false); setEditingProvider(null); }}
                        className="px-3 py-1.5 text-xs text-white/60 hover:text-white"
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveProvider(target)}
                        className="px-4 py-2 bg-[#241808] hover:bg-[#2d1e0d] border border-[#df9c43] text-[#eaaf5d] hover:text-[#f5c277] font-bold text-xs rounded-xl transition-all shadow-[0_0_10px_rgba(223,156,67,0.3)]"
                      >
                        Enregistrer Provider
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
