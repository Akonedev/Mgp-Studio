'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ImageStudio, VideoStudio, LipSyncStudio, CinemaStudio, MarketingStudio, WorkflowStudio, AgentStudio, AppsStudio, VoiceStudio, MontageStudio, MusicStudio, getUserBalance } from 'studio';
import axios from 'axios';
import ApiKeyModal from './ApiKeyModal';
import SettingsModal from './SettingsModal';
import HistoryModal from './HistoryModal';

const STUDIO_TABS = [
  { id: 'image',     short: 'Image',     suffix: 'Studio', label: 'Image Studio',     desc: 'SD 1.5, Z-Image & Flux', icon: 'image' },
  { id: 'video',     short: 'Video',     suffix: 'Studio', label: 'Video Studio',     desc: 'ComfyUI Video Cluster (Wan 2.2 / LTX)',  icon: 'video' },
  { id: 'montage',   short: 'Studio Video', suffix: '', label: 'Studio Video',      desc: 'Timeline NLE Pro & Effets Multi-Pistes', icon: 'montage' },
  { id: 'music',     short: 'Music',     suffix: 'Studio', label: 'Music Studio',     desc: 'ACE-Step & YuE2 DAW',    icon: 'music' },
  { id: 'voice',     short: 'Voice',     suffix: 'Lab',    label: 'Voice Lab',        desc: 'Clonage & Voix Off HD',   icon: 'voice' },
  { id: 'lipsync',   short: 'Lip Sync',  suffix: '',       label: 'Lip Sync',         desc: 'Synchronisation labiale', icon: 'lipsync' },
  { id: 'cinema',    short: 'Cinema',    suffix: 'Studio', label: 'Cinema Studio',    desc: 'Plans anamorphiques 35mm', icon: 'cinema' },
  { id: 'marketing', short: 'Marketing', suffix: 'Studio', label: 'Marketing Studio', desc: 'Campagnes & Contenus IA', icon: 'marketing' },
];

const PIPELINE_TABS = [
  { id: 'workflows', short: 'Workflows', suffix: '', label: 'Workflows ComfyUI', desc: 'Graphes & Pipelines Spark', icon: 'workflows' },
  { id: 'agents',    short: 'Agents',    suffix: '', label: 'Agents & Skills',    desc: 'Orchestration & Directeurs', icon: 'agents' },
  { id: 'apps',      short: 'Apps Hub',  suffix: '', label: 'Apps & Templates',   desc: 'Hub 50+ Apps Installables', icon: 'apps' },
];

const ALL_TABS = [...STUDIO_TABS, ...PIPELINE_TABS];

const TAB_ICONS = {
  image: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  ),
  video: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7"/>
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
    </svg>
  ),
  montage: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
      <line x1="7" y1="2" x2="7" y2="22"/>
      <line x1="17" y1="2" x2="17" y2="22"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <line x1="2" y1="7" x2="7" y2="7"/>
      <line x1="2" y1="17" x2="7" y2="17"/>
      <line x1="17" y1="17" x2="22" y2="17"/>
      <line x1="17" y1="7" x2="22" y2="7"/>
    </svg>
  ),
  music: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13"/>
      <circle cx="6" cy="18" r="3"/>
      <circle cx="18" cy="16" r="3"/>
    </svg>
  ),
  voice: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="23"/>
      <line x1="8" y1="23" x2="16" y2="23"/>
    </svg>
  ),
  lipsync: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="22"/>
    </svg>
  ),
  cinema: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.4-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.4Z"/>
      <path d="m6.2 5.3 3.1 4"/>
      <path d="m12.4 3.4 3.1 4"/>
      <path d="M3 11h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>
    </svg>
  ),
  marketing: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 11 18-5v12L3 13v-2z"/>
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>
    </svg>
  ),
  workflows: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="6" height="6" rx="1"/>
      <rect x="15" y="3" width="6" height="6" rx="1"/>
      <rect x="9" y="15" width="6" height="6" rx="1"/>
      <path d="M6 9v3a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9"/>
      <path d="M12 14v1"/>
    </svg>
  ),
  agents: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 8V4H8"/>
      <rect width="16" height="12" x="4" y="8" rx="2"/>
      <path d="M2 14h2"/>
      <path d="M20 14h2"/>
      <path d="M15 13v2"/>
      <path d="M9 13v2"/>
    </svg>
  ),
  apps: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="7" height="7" x="3" y="3" rx="1"/>
      <rect width="7" height="7" x="14" y="3" rx="1"/>
      <rect width="7" height="7" x="14" y="14" rx="1"/>
      <rect width="7" height="7" x="3" y="14" rx="1"/>
    </svg>
  ),
};

const STORAGE_KEY = 'muapi_key';

export default function StandaloneShell() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug || []; 
  const idFromParams = params?.id;
  const tabFromParams = params?.tab;

  // Helper to extract workflow details precisely from either route structure
  const getWorkflowInfo = useCallback(() => {
    if (idFromParams) {
        return { id: idFromParams, tab: tabFromParams || null };
    }
    const wfIndex = slug.findIndex(s => s === 'workflows' || s === 'workflow');
    if (wfIndex === -1) return { id: null, tab: null };
    return {
      id: slug[wfIndex + 1] || null,
      tab: slug[wfIndex + 2] || null
    };
  }, [slug, idFromParams, tabFromParams]);

  const { id: urlWorkflowId } = getWorkflowInfo();

  // Initialize activeTab from URL slug/params or default to 'image'
  const getInitialTab = () => {
    if (idFromParams || slug.includes('workflow')) return 'workflows';
    if (slug.includes('agents')) return 'agents';
    if (slug.includes('apps')) return 'apps';
    const firstSegment = slug[0];
    if (firstSegment && ALL_TABS.find(t => t.id === firstSegment)) return firstSegment;
    return 'image';
  };
  
  const [apiKey, setApiKey] = useState(null);
  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const [balance, setBalance] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);

  // Drag and Drop State
  const [isDragging, setIsDragging] = useState(false);
  const [droppedFiles, setDroppedFiles] = useState(null);

  // Cross-Studio Source Media State & Universal Gallery Picker Target
  const [sourceMedia, setSourceMedia] = useState(null);
  const [galleryPickerTarget, setGalleryPickerTarget] = useState(null);
  const [injectedMontageMedia, setInjectedMontageMedia] = useState(null);

  const handleUseAsSource = useCallback((media, targetStudio) => {
    console.log('[StandaloneShell] Use as source media:', media, 'targetStudio:', targetStudio);
    setSourceMedia(media);
    if (targetStudio) {
      setActiveTab(targetStudio);
      router.push(`/studio/${targetStudio}`);
    }
    setShowHistory(false);
    setGalleryPickerTarget(null);
  }, [router]);

  const handleRegenerate = useCallback((media) => {
    console.log('[StandaloneShell] Regenerating media:', media);
    const isVid = media?.type === 'video' || media?.url?.endsWith('.mp4');
    const isCin = media?.mode === 'cinema';
    const target = isVid ? 'video' : (isCin ? 'cinema' : 'image');
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('mgp_regenerate_target', JSON.stringify(media));
      window.dispatchEvent(new CustomEvent('mgp_regenerate', { detail: media }));
    }
    setSourceMedia({
      ...media,
      action: 'regenerate',
      prompt: media?.prompt || '',
      model: media?.model || '',
      width: media?.width,
      height: media?.height,
    });
    setActiveTab(target);
    router.push(`/studio/${target}`);
    setShowHistory(false);
    setGalleryPickerTarget(null);
  }, [router]);

  const handleExtendVideo = useCallback((media) => {
    console.log('[StandaloneShell] Extending video media:', media);
    const extendPayload = {
      ...media,
      url: media?.url,
      prompt: media?.prompt || '',
      isVideo: true,
      action: 'extend',
      id: media?.id || `ext_${Date.now()}`
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('mgp_extend_target', JSON.stringify(extendPayload));
      window.dispatchEvent(new CustomEvent('mgp_extend_video', { detail: extendPayload }));
    }
    setSourceMedia(extendPayload);
    setActiveTab('video');
    router.push('/studio/video');
    setShowHistory(false);
    setGalleryPickerTarget(null);
  }, [router]);

  const handleOpenGalleryPicker = useCallback((targetStudio) => {
    setGalleryPickerTarget(targetStudio);
    setShowHistory(true);
  }, []);

  // Load sidebar preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('mgp_sidebar_open');
    if (saved !== null) {
      setIsSidebarOpen(saved === 'true');
    } else if (typeof window !== 'undefined') {
      setIsSidebarOpen(window.innerWidth >= 1280);
    }
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => {
      const next = !prev;
      localStorage.setItem('mgp_sidebar_open', String(next));
      return next;
    });
  }, []);

  // Sync tab with URL if user navigates manually or via browser back/forward
  useEffect(() => {
    const info = getWorkflowInfo();
    if (info.id) {
        setActiveTab('workflows');
    } else if (slug.includes('agents')) {
        setActiveTab('agents');
    } else if (slug.includes('apps')) {
        setActiveTab('apps');
    } else {
        const firstSegment = slug[0];
        if (firstSegment && ALL_TABS.find(t => t.id === firstSegment)) {
          setActiveTab(firstSegment);
        }
    }
  }, [slug, getWorkflowInfo]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    router.push(`/studio/${tabId}`);
  };

  // Auto-hide header when inside a specific workflow view
  useEffect(() => {
    const isEditingWorkflow = (activeTab === 'workflows' || !!idFromParams) && urlWorkflowId;
    if (isEditingWorkflow) {
      setIsHeaderVisible(false);
    } else {
      setIsHeaderVisible(true);
    }
  }, [activeTab, urlWorkflowId, idFromParams]);

  // Global builder CSS cleanup when switching away from Workflows tab
  useEffect(() => {
    const fromBuilder = sessionStorage.getItem("fromWorkflowBuilder");
    if (fromBuilder && activeTab !== 'workflows') {
      sessionStorage.removeItem("fromWorkflowBuilder");
      window.location.reload();
    }
  }, [activeTab]);

  const fetchBalance = useCallback(async (key) => {
    try {
      const data = await getUserBalance(key);
      setBalance(data.balance);
    } catch (err) {
      console.error('Balance fetch failed:', err);
    }
  }, []);

  useEffect(() => {
    setHasMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY) || 'local-spark';
    setApiKey(stored);
    setBalance('Illimité (DGX Spark)');
    document.cookie = `muapi_key=${stored}; path=/; max-age=31536000; SameSite=Lax`;
  }, [fetchBalance]);

  // Inject API key into all outgoing Axios requests
  useEffect(() => {
    delete axios.defaults.headers.common['x-api-key'];
    if (!apiKey) return;

    const interceptorId = axios.interceptors.request.use((config) => {
      const isRelative = config.url.startsWith('/') || !config.url.startsWith('http');
      const isInternalProxy = config.url.includes('/api/app') || config.url.includes('/api/workflow') || config.url.includes('/api/agents') || config.url.includes('/api/api') || config.url.includes('/api/v1');

      if (isRelative || isInternalProxy) {
        config.headers['x-api-key'] = apiKey;
      }
      return config;
    });

    return () => {
      axios.interceptors.request.eject(interceptorId);
    };
  }, [apiKey]);

  // Drag and Drop Handlers (Only for external OS files, never for internal DAW / Studio dragging)
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof window !== 'undefined' && (window.__isInternalDragging || window.__isInternalDawDragging)) {
      if (isDragging) setIsDragging(false);
      return;
    }
  }, [isDragging]);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    // NEVER activate external file drop overlay if an internal drag is in progress (tracks, clips, instruments, devices)
    if (typeof window !== 'undefined' && (window.__isInternalDragging || window.__isInternalDawDragging)) {
      return;
    }
    const types = Array.from(e.dataTransfer?.types || []);
    const hasFiles = types.includes('Files');
    const isCustomDomDrag = types.some(t => t.includes('json') || t.includes('daw') || t.includes('clip') || t.includes('track') || t.includes('device') || t.includes('instrument'));
    if (hasFiles && !isCustomDomDrag) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (typeof window !== 'undefined' && (window.__isInternalDragging || window.__isInternalDawDragging)) {
      return;
    }

    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) {
      setDroppedFiles(files);
    }
  }, []);

  const handleFilesHandled = useCallback(() => {
    setDroppedFiles(null);
  }, []);

  if (!hasMounted) return (
    <div className="min-h-screen bg-[#070605] flex items-center justify-center">
      <div className="animate-spin text-[#df9c43] text-3xl">◌</div>
    </div>
  );

  const effectiveApiKey = apiKey || 'local-spark';
  const currentTabObj = ALL_TABS.find(t => t.id === activeTab) || ALL_TABS[0];

  return (
    <div 
      className="h-screen bg-[#070605] flex overflow-hidden text-[#f7ede2] relative select-none font-sans"
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag Overlay with Sahel Ocre palette (non-intrusive perimeter indicator, no blinding backdrop blur) */}
      {isDragging && (
        <div className="fixed inset-0 z-[100] border-4 border-dashed border-[#df9c43]/80 bg-[#df9c43]/5 pointer-events-none transition-all duration-200 flex flex-col justify-start items-center pt-8">
          <div className="bg-[#0e0b08]/95 px-5 py-3 rounded-2xl border border-[#df9c43]/40 shadow-[0_0_30px_rgba(223,156,67,0.3)] flex items-center gap-3.5 animate-pulse">
            <div className="w-10 h-10 bg-gradient-to-br from-[#f5c277] via-[#df9c43] to-[#b6762c] rounded-xl flex items-center justify-center text-black shadow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white">Déposer des fichiers externes</span>
              <span className="text-[11px] text-white/60">Images, vidéos, audios ou documents (ne couvre pas le studio)</span>
            </div>
          </div>
        </div>
      )}

      {/* ─── RETRACTABLE SIDEBAR (Toggle on Logo Click) ─── */}
      <aside 
        className={`flex-shrink-0 bg-[#0a0806]/95 border-r border-[#df9c43]/15 flex flex-col z-50 transition-all duration-300 ease-in-out backdrop-blur-2xl relative ${
          isSidebarOpen ? 'w-64' : 'w-[68px]'
        }`}
      >
        {/* Sidebar Header: Logo & Branding */}
        <div className="h-14 border-b border-[#df9c43]/10 flex items-center justify-between px-3.5 bg-black/30">
          <button 
            onClick={toggleSidebar}
            title={isSidebarOpen ? "Rétracter la barre latérale (clic logo)" : "Déployer la barre latérale (clic logo)"}
            className="flex items-center gap-2.5 group text-left focus:outline-none w-full min-w-0"
          >
            {/* Logo Emblem with Sahel gold gradient */}
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#f5c277] via-[#df9c43] to-[#b6762c] flex items-center justify-center shadow-[0_0_15px_rgba(223,156,67,0.35)] flex-shrink-0 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(223,156,67,0.6)] transition-all">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#070605" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>

            {/* Logo Title (expanded only) */}
            {isSidebarOpen && (
              <div className="flex-1 min-w-0 flex items-center justify-between">
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[14px] font-black tracking-tight text-white leading-none">Mgp Studio</span>
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-[#df9c43]/20 text-[#f5c277] border border-[#df9c43]/40 tracking-wider">MGP</span>
                  </div>
                  <span className="text-[10px] font-medium text-[#df9c43]/70 tracking-wider leading-none mt-1 truncate">Môguô Puissant</span>
                </div>
                <div className="text-white/30 group-hover:text-[#df9c43] transition-colors p-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="m15 18-6-6 6-6"/>
                  </svg>
                </div>
              </div>
            )}
          </button>
        </div>

        {/* Sidebar Navigation Items */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4 custom-scrollbar">
          {/* Group 1: Studios Créatifs */}
          <div>
            {isSidebarOpen && (
              <div className="px-3 pb-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#df9c43]/60">
                Studios de Création
              </div>
            )}
            <div className="space-y-0.5">
              {STUDIO_TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                const icon = TAB_ICONS[tab.id];
                return (
                  <button
                    key={tab.id}
                    data-tab={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    title={tab.label}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all group relative ${
                      isActive
                        ? 'bg-[#df9c43]/15 text-[#f5c277] border border-[#df9c43]/35 shadow-[0_0_15px_rgba(223,156,67,0.15)] font-bold'
                        : 'text-white/70 hover:text-white hover:bg-white/[0.04] border border-transparent'
                    }`}
                  >
                    <span className={`transition-colors flex-shrink-0 ${isActive ? 'text-[#df9c43]' : 'text-white/40 group-hover:text-white/80'}`}>
                      {icon}
                    </span>
                    {isSidebarOpen && (
                      <div className="flex-1 text-left min-w-0 flex items-center justify-between">
                        <span className="truncate">{tab.label}</span>
                        {tab.id === 'video' && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-[#df9c43]/20 text-[#f5c277] border border-[#df9c43]/30">
                            ComfyUI
                          </span>
                        )}
                      </div>
                    )}
                    {isActive && (
                      <div className="absolute left-0 top-2 bottom-2 w-1 bg-[#df9c43] rounded-r-full shadow-[0_0_8px_#df9c43]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Group 2: Pipelines & Orchestration */}
          <div>
            {isSidebarOpen && (
              <div className="px-3 pb-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#df9c43]/60">
                Pipelines & Écosystème
              </div>
            )}
            <div className="space-y-0.5">
              {PIPELINE_TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                const icon = TAB_ICONS[tab.id];
                return (
                  <button
                    key={tab.id}
                    data-tab={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    title={tab.label}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all group relative ${
                      isActive
                        ? 'bg-[#df9c43]/15 text-[#f5c277] border border-[#df9c43]/35 shadow-[0_0_15px_rgba(223,156,67,0.15)] font-bold'
                        : 'text-white/70 hover:text-white hover:bg-white/[0.04] border border-transparent'
                    }`}
                  >
                    <span className={`transition-colors flex-shrink-0 ${isActive ? 'text-[#df9c43]' : 'text-white/40 group-hover:text-white/80'}`}>
                      {icon}
                    </span>
                    {isSidebarOpen && (
                      <div className="flex-1 text-left min-w-0">
                        <span className="truncate block">{tab.label}</span>
                        <span className="text-[10px] text-white/30 truncate block leading-tight font-normal">{tab.desc}</span>
                      </div>
                    )}
                    {isActive && (
                      <div className="absolute left-0 top-2 bottom-2 w-1 bg-[#df9c43] rounded-r-full shadow-[0_0_8px_#df9c43]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Group 3: Outils & Paramètres */}
          <div className="pt-2 border-t border-white/[0.06]">
            {isSidebarOpen && (
              <div className="px-3 pb-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/30">
                Production & Outils
              </div>
            )}
            <div className="space-y-1">
              {/* Historique */}
              <button
                onClick={() => setShowHistory(true)}
                title="Galerie & Historique — Tous les rendus DGX Spark"
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-[#f5c277] hover:text-white hover:bg-[#df9c43]/10 border border-[#df9c43]/20 transition-all group"
              >
                <span className="text-[#df9c43] flex-shrink-0">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect width="18" height="18" x="3" y="3" rx="2"/>
                    <path d="M3 9h18"/>
                    <path d="M9 21V9"/>
                  </svg>
                </span>
                {isSidebarOpen && (
                  <div className="flex-1 text-left">
                    <span className="truncate block">Galerie & Historique</span>
                  </div>
                )}
              </button>

              {/* Settings */}
              <button
                onClick={() => setShowSettings(true)}
                title="Paramètres — Providers & DGX Spark GB10"
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-white/70 hover:text-white hover:bg-white/[0.04] border border-transparent transition-all group"
              >
                <span className="text-white/40 group-hover:text-white flex-shrink-0">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </span>
                {isSidebarOpen && (
                  <div className="flex-1 text-left">
                    <span className="truncate block">Paramètres & Cluster</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Footer: Hardware Status Card */}
        {isSidebarOpen ? (
          <div className="p-3 border-t border-[#df9c43]/15 bg-black/40">
            <div className="p-2.5 rounded-xl bg-[#14110d] border border-[#df9c43]/20 flex flex-col gap-1.5 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  <span className="text-[11px] font-extrabold text-[#f5c277] tracking-tight">DGX Spark GB10</span>
                </div>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  128 Go
                </span>
              </div>
              <div className="text-[10px] text-white/50 leading-tight">
                Grace Blackwell • ComfyUI DGX • RX 7900 XTX 0% (Désactivé)
              </div>
            </div>
          </div>
        ) : (
          <div className="p-2 border-t border-[#df9c43]/15 flex items-center justify-center">
            <div 
              className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"
              title="DGX Spark GB10 (128 Go) : Opérationnel"
            />
          </div>
        )}
      </aside>

      {/* ─── MAIN CONTENT AREA ─── */}
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden relative">
        {/* Top Navbar — Fluid, Compact & Responsive */}
        {isHeaderVisible && (
          <header className="flex-shrink-0 min-h-[3rem] h-12 border-b border-[#df9c43]/15 flex items-center justify-between px-2 sm:px-3 lg:px-4 bg-[#0a0806]/85 backdrop-blur-xl z-40 relative gap-1.5 sm:gap-2">
            {/* Left: Quick Toggle Logo button & Breadcrumb */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 min-w-0">
              <button
                onClick={toggleSidebar}
                title="Basculer la barre latérale (Mgp Studio)"
                className="flex items-center gap-1 p-1.5 rounded-lg hover:bg-white/[0.06] text-white/70 hover:text-white transition-colors border border-transparent hover:border-white/10 flex-shrink-0"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="12" x2="21" y2="12"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              </button>

              <div className="flex items-center gap-1.5 text-xs min-w-0">
                <span className="font-black text-[#df9c43] uppercase tracking-wider hidden 2xl:inline">Mgp Studio</span>
                <span className="text-white/30 hidden 2xl:inline">/</span>
                <span className="font-bold text-white tracking-tight flex items-center gap-1 truncate">
                  <span className="truncate">{currentTabObj.label}</span>
                  {currentTabObj.id === 'video' && (
                    <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-[#df9c43]/20 text-[#f5c277] border border-[#df9c43]/40 flex-shrink-0 hidden sm:inline">
                      ComfyUI
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Center: Core Studios Quick Tabs (responsive & clean) */}
            <div className="flex-1 flex items-center justify-center min-w-0 px-1 overflow-hidden">
              <nav className="flex items-center gap-0.5 sm:gap-1 max-w-full overflow-x-auto no-scrollbar py-0.5">
                {STUDIO_TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  const icon = TAB_ICONS[tab.id];
                  return (
                    <button
                      key={tab.id}
                      data-tab={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      title={tab.label}
                      className={`group relative flex items-center gap-1 px-1.5 sm:px-2 lg:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
                        isActive
                          ? 'text-[#f5c277] bg-[#df9c43]/20 border border-[#df9c43]/40 shadow-[0_0_10px_rgba(223,156,67,0.2)]'
                          : 'text-white/60 hover:text-white hover:bg-white/[0.05] border border-transparent'
                      }`}
                    >
                      <span className={`transition-colors flex-shrink-0 [&>svg]:w-3.5 [&>svg]:h-3.5 ${isActive ? 'text-[#df9c43]' : 'text-white/40 group-hover:text-white/80'}`}>
                        {icon}
                      </span>
                      <span className="tracking-tight">{tab.short}</span>
                      {isActive && (
                        <div className="absolute -bottom-[5px] left-2 right-2 h-[2px] bg-[#df9c43] rounded-full shadow-[0_0_6px_#df9c43]" />
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Right: Actions (Sleek DGX status) */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <div 
                className="flex items-center gap-1.5 bg-[#14110d] hover:bg-[#1c1813] px-2 sm:px-2.5 py-1 rounded-full border border-[#df9c43]/20 transition-colors cursor-default shadow-sm"
                title="Cluster de calcul actif : DGX Spark (NVIDIA Grace Blackwell GB10 - 128 Go unifiée)"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)] flex-shrink-0" />
                <span className="text-[10px] sm:text-[11px] font-bold text-white/90 whitespace-nowrap">
                  {balance === 'Illimité (DGX Spark)' || balance === null ? (
                    <>
                      <span className="hidden xl:inline">Illimité </span>(DGX Spark)
                    </>
                  ) : (
                    typeof balance === 'number' ? `$${balance.toFixed(2)}` : balance
                  )}
                </span>
              </div>
            </div>
          </header>
        )}

        {/* Studio Content */}
        <div className="flex-1 min-h-0 relative overflow-hidden bg-[#070605]">
          {activeTab === 'image'   && (
            <ImageStudio   
              apiKey={effectiveApiKey} 
              droppedFiles={droppedFiles} 
              onFilesHandled={handleFilesHandled}
              sourceMedia={sourceMedia}
              onClearSourceMedia={() => setSourceMedia(null)}
              onOpenGalleryPicker={() => handleOpenGalleryPicker('image')}
            />
          )}
          {activeTab === 'video'   && (
            <VideoStudio   
              apiKey={effectiveApiKey} 
              droppedFiles={droppedFiles} 
              onFilesHandled={handleFilesHandled}
              sourceMedia={sourceMedia}
              onClearSourceMedia={() => setSourceMedia(null)}
              onOpenGalleryPicker={() => handleOpenGalleryPicker('video')}
            />
          )}
          {activeTab === 'montage' && (
            <MontageStudio
              apiKey={effectiveApiKey}
              onNavigateTab={handleTabChange}
              injectedMedia={injectedMontageMedia}
              onInjectedMediaHandled={() => setInjectedMontageMedia(null)}
            />
          )}
          {activeTab === 'music'   && (
            <MusicStudio
              apiKey={effectiveApiKey}
              onSendToMontage={(track) => {
                setInjectedMontageMedia({ type: 'music', ...track });
                handleTabChange('montage');
              }}
              onNavigateTab={handleTabChange}
            />
          )}
          {activeTab === 'voice'   && (
            <VoiceStudio
              apiKey={effectiveApiKey}
              onSendToMontage={(audio) => {
                setInjectedMontageMedia({ type: 'voice', ...audio });
                handleTabChange('montage');
              }}
              onSendToLipSync={(audio) => {
                handleTabChange('lipsync');
              }}
            />
          )}
          {activeTab === 'lipsync' && (
            <LipSyncStudio 
              apiKey={effectiveApiKey} 
              droppedFiles={droppedFiles} 
              onFilesHandled={handleFilesHandled}
              sourceMedia={sourceMedia}
              onClearSourceMedia={() => setSourceMedia(null)}
              onOpenGalleryPicker={() => handleOpenGalleryPicker('lipsync')}
            />
          )}
          {activeTab === 'cinema'  && (
            <CinemaStudio  
              apiKey={effectiveApiKey}
              sourceMedia={sourceMedia}
              onClearSourceMedia={() => setSourceMedia(null)}
              onOpenGalleryPicker={() => handleOpenGalleryPicker('cinema')}
            />
          )}
          {activeTab === 'marketing' && (
            <MarketingStudio 
              apiKey={effectiveApiKey} 
              droppedFiles={droppedFiles} 
              onFilesHandled={handleFilesHandled}
              sourceMedia={sourceMedia}
              onClearSourceMedia={() => setSourceMedia(null)}
              onOpenGalleryPicker={() => handleOpenGalleryPicker('marketing')}
            />
          )}
          {activeTab === 'workflows' && <WorkflowStudio apiKey={effectiveApiKey} isHeaderVisible={isHeaderVisible} onToggleHeader={setIsHeaderVisible} />}
          {activeTab === 'agents' && <AgentStudio apiKey={effectiveApiKey} isHeaderVisible={isHeaderVisible} onToggleHeader={setIsHeaderVisible} />}
          {activeTab === 'apps' && <AppsStudio apiKey={effectiveApiKey} />}
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={(newSettings) => {
          console.log('[StandaloneShell] Updated mode settings:', newSettings);
        }}
      />

      {/* History & Gallery Modal */}
      <HistoryModal
        isOpen={showHistory}
        onClose={() => {
          setShowHistory(false);
          setGalleryPickerTarget(null);
        }}
        onSelectMedia={handleUseAsSource}
        onRegenerate={handleRegenerate}
        onExtend={handleExtendVideo}
        isPickerMode={Boolean(galleryPickerTarget)}
        targetStudio={galleryPickerTarget}
      />
    </div>
  );
}
