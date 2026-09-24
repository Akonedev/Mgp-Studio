"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

// ─── Helpers ────────────────────────────────────────────────────────────────
function timeAgo(dateStr) {
  if (!dateStr) return "";
  const utcStr = dateStr.endsWith("Z") || dateStr.includes("+") ? dateStr : dateStr + "Z";
  const diff = Math.floor((Date.now() - new Date(utcStr)) / 1000);
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `il y a ${Math.floor(diff / 86400)} j`;
  return new Date(utcStr).toLocaleDateString();
}

export default function AgentStudio({ apiKey, isHeaderVisible, onToggleHeader }) {
  const router = useRouter();

  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState("agents"); // 'agents' | 'skills' | 'canvas' | 'chats'
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Data States
  const [agents, setAgents] = useState([]);
  const [skills, setSkills] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  // Modals States
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [agentForm, setAgentForm] = useState({
    name: "",
    description: "",
    avatar: "🎬",
    system_prompt: "",
    skills: []
  });

  const [showSkillModal, setShowSkillModal] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [skillForm, setSkillForm] = useState({
    name: "",
    category: "Cinematography",
    icon: "🎥",
    description: "",
    prompt_injection: "",
    tags: ""
  });

  const [showImportModal, setShowImportModal] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  // Canvas State
  const [selectedCanvasNode, setSelectedCanvasNode] = useState(null);
  const [canvasRunning, setCanvasRunning] = useState(false);
  const [canvasProgress, setCanvasProgress] = useState(0);

  // Fetch all agents and skills
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [agentsRes, skillsRes] = await Promise.all([
        axios.get("/api/agents"),
        axios.get("/api/skills")
      ]);
      setAgents(agentsRes.data || []);
      setSkills(skillsRes.data || []);
    } catch (err) {
      console.error("[AgentStudio] Fetch error:", err);
      setFeedback({ type: "error", message: "Erreur lors du chargement des données." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Agent Actions
  const handleOpenAgentChat = (agent) => {
    const slug = agent.slug || agent.id;
    router.push(`/agents/${slug}`);
  };

  const handleOpenCreateAgent = () => {
    setEditingAgent(null);
    setAgentForm({
      name: "",
      description: "",
      avatar: "🎬",
      system_prompt: "Tu es un réalisateur et directeur technique expert en génération vidéo sur DGX Spark.",
      skills: skills.slice(0, 2).map(s => s.id)
    });
    setShowAgentModal(true);
  };

  const handleOpenEditAgent = (agent, e) => {
    if (e) e.stopPropagation();
    setEditingAgent(agent);
    setAgentForm({
      name: agent.name || "",
      description: agent.description || "",
      avatar: agent.avatar || "🎬",
      system_prompt: agent.system_prompt || "",
      skills: agent.skills || []
    });
    setShowAgentModal(true);
  };

  const handleSaveAgent = async (e) => {
    e.preventDefault();
    try {
      if (editingAgent) {
        await axios.put(`/api/agents/${editingAgent.slug || editingAgent.id}`, agentForm);
        setFeedback({ type: "success", message: `Agent "${agentForm.name}" mis à jour avec succès.` });
      } else {
        await axios.post("/api/agents", agentForm);
        setFeedback({ type: "success", message: `Agent "${agentForm.name}" créé avec succès.` });
      }
      setShowAgentModal(false);
      fetchData();
    } catch (err) {
      setFeedback({ type: "error", message: "Erreur d'enregistrement de l'agent: " + err.message });
    }
  };

  const handleDeleteAgent = async (agent, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Confirmer la suppression de l'agent "${agent.name}" ?`)) return;
    try {
      await axios.delete(`/api/agents/${agent.slug || agent.id}`);
      setFeedback({ type: "success", message: `Agent "${agent.name}" supprimé.` });
      fetchData();
    } catch (err) {
      setFeedback({ type: "error", message: "Erreur de suppression: " + err.message });
    }
  };

  // Handle Skill Actions
  const handleOpenCreateSkill = () => {
    setEditingSkill(null);
    setSkillForm({
      name: "",
      category: "Cinematography",
      icon: "🎥",
      description: "",
      prompt_injection: "",
      tags: ""
    });
    setShowSkillModal(true);
  };

  const handleOpenEditSkill = (skill, e) => {
    if (e) e.stopPropagation();
    setEditingSkill(skill);
    setSkillForm({
      name: skill.name || "",
      category: skill.category || "Cinematography",
      icon: skill.icon || "✨",
      description: skill.description || "",
      prompt_injection: skill.prompt_injection || "",
      tags: Array.isArray(skill.tags) ? skill.tags.join(", ") : (skill.tags || "")
    });
    setShowSkillModal(true);
  };

  const handleSaveSkill = async (e) => {
    e.preventDefault();
    try {
      if (editingSkill) {
        await axios.put("/api/skills", { id: editingSkill.id, ...skillForm });
        setFeedback({ type: "success", message: `Skill "${skillForm.name}" mis à jour.` });
      } else {
        await axios.post("/api/skills", skillForm);
        setFeedback({ type: "success", message: `Skill "${skillForm.name}" créé avec succès.` });
      }
      setShowSkillModal(false);
      fetchData();
    } catch (err) {
      setFeedback({ type: "error", message: "Erreur d'enregistrement du skill: " + err.message });
    }
  };

  const handleDeleteSkill = async (skill, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Supprimer le skill "${skill.name}" ?`)) return;
    try {
      await axios.delete(`/api/skills?id=${skill.id}`);
      setFeedback({ type: "success", message: `Skill "${skill.name}" supprimé.` });
      fetchData();
    } catch (err) {
      setFeedback({ type: "error", message: "Erreur de suppression: " + err.message });
    }
  };

  // Import Skill from Web
  const handleImportSkill = async (e) => {
    e.preventDefault();
    if (!importUrl.trim()) return;
    setIsImporting(true);
    try {
      const res = await axios.post("/api/skills", {
        action: "import_url",
        url: importUrl.trim()
      });
      setFeedback({ type: "success", message: `Skill "${res.data?.skill?.name || 'Web'}" importé avec succès depuis le réseau.` });
      setImportUrl("");
      setShowImportModal(false);
      fetchData();
    } catch (err) {
      setFeedback({ type: "error", message: "Erreur lors de l'import : " + (err.response?.data?.error || err.message) });
    } finally {
      setIsImporting(false);
    }
  };

  // Toggle skill in agentForm
  const toggleSkillInAgent = (skillId) => {
    setAgentForm(prev => {
      const exists = prev.skills.includes(skillId);
      return {
        ...prev,
        skills: exists ? prev.skills.filter(s => s !== skillId) : [...prev.skills, skillId]
      };
    });
  };

  // Canvas Pipeline Execution Simulation
  const handleRunCanvasPipeline = () => {
    setCanvasRunning(true);
    setCanvasProgress(10);
    const interval = setInterval(() => {
      setCanvasProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setCanvasRunning(false);
          setFeedback({ type: "success", message: "Pipeline multi-agents exécuté avec succès sur DGX Spark !" });
          return 100;
        }
        return p + 20;
      });
    }, 700);
  };

  // Filtered lists
  const filteredAgents = agents.filter(a => {
    const q = searchQuery.toLowerCase();
    const matchQ = !q || a.name?.toLowerCase().includes(q) || a.description?.toLowerCase().includes(q);
    return matchQ;
  });

  const filteredSkills = skills.filter(s => {
    const q = searchQuery.toLowerCase();
    const matchQ = !q || s.name?.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q) || s.tags?.some(t => t.toLowerCase().includes(q));
    const matchCat = selectedCategory === "all" || s.category?.toLowerCase() === selectedCategory.toLowerCase();
    return matchQ && matchCat;
  });

  const skillCategories = ["all", ...new Set(skills.map(s => s.category).filter(Boolean))];

  // Canvas Pipeline Nodes
  const CANVAS_NODES = [
    {
      id: "step_story",
      name: "1. Scénariste & Storyboarder",
      agent: "Mini-Drama & Series Showrunner",
      role: "Découpage séquentiel & hooks 3s",
      icon: "🎭",
      skills: ["Scénarisation Mini-Drama", "Direction de Voix"],
      status: canvasProgress >= 20 ? "done" : canvasRunning ? "running" : "idle"
    },
    {
      id: "step_cinematography",
      name: "2. Directeur Photo & Cadrage",
      agent: "Directeur de la Photographie & Cadrage",
      role: "Échelle des plans, optiques 35mm, dolly/orbit",
      icon: "🎥",
      skills: ["Plans de Caméra", "Mouvements Caméra", "Lumière Volumétrique"],
      status: canvasProgress >= 50 ? "done" : canvasProgress >= 20 ? "running" : "idle"
    },
    {
      id: "step_generation",
      name: "3. Cluster Génératif Spark",
      agent: "Higgsfield Video Director",
      role: "Exécution Wan 2.2 5B TI2V ComfyUI (18s)",
      icon: "⚡",
      skills: ["Wan 2.2 SOTA", "IP-Adapter Personnage"],
      status: canvasProgress >= 80 ? "done" : canvasProgress >= 50 ? "running" : "idle"
    },
    {
      id: "step_postprod",
      name: "4. Colorimétrie & Sound Design",
      agent: "Coloriste ACES & Sound Designer",
      role: "Étalonnage teal & amber, Foley & OST",
      icon: "🎞️",
      skills: ["Étalonnage ACEScc", "Design Sonore OST"],
      status: canvasProgress >= 100 ? "done" : canvasProgress >= 80 ? "running" : "idle"
    }
  ];

  return (
    <div className="h-full flex flex-col bg-[#070605] text-[#f7ede2] select-none">
      {/* ─── Top Control Bar ─── */}
      <div className="flex-shrink-0 h-16 border-b border-[#df9c43]/15 flex items-center justify-between px-6 bg-[#0d0b09]/80 backdrop-blur-xl">
        {/* Left: Tab Switcher */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-[#df9c43] uppercase tracking-wider">Agents & Skills</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#df9c43]/15 text-[#f5c277] border border-[#df9c43]/30 font-mono">
              {agents.length} agents • {skills.length} skills
            </span>
          </div>

          <div className="flex items-center bg-black/40 border border-[#df9c43]/20 rounded-xl p-1 text-xs">
            {[
              { id: "agents", label: "🤖 Directeurs & Agents" },
              { id: "skills", label: "✨ Bibliothèque de Skills" },
              { id: "canvas", label: "🕸️ Canvas d'Orchestration" }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                  activeTab === t.id
                    ? "bg-[#241808] border border-[#df9c43] text-[#eaaf5d] shadow-[0_0_8px_rgba(223,156,67,0.25)]"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Search & Action Buttons */}
        <div className="flex items-center gap-3">
          <div className="relative w-56 sm:w-64">
            <input
              type="text"
              placeholder={activeTab === "skills" ? "Rechercher un skill..." : "Rechercher un agent..."}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-black/50 border border-[#df9c43]/25 rounded-xl px-3 py-1.5 text-xs text-white placeholder-white/30 focus:border-[#df9c43] focus:outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-2 text-white/40 hover:text-white text-xs">✕</button>
            )}
          </div>

          {activeTab === "agents" && (
            <button
              onClick={handleOpenCreateAgent}
              className="px-4 py-2 bg-[#241808] hover:bg-[#2d1e0d] border border-[#df9c43] text-[#eaaf5d] hover:text-[#f5c277] font-bold text-xs rounded-xl transition-all shadow-[0_0_10px_rgba(223,156,67,0.3)] flex items-center gap-1.5"
            >
              <span>+</span>
              <span>Créer un Agent</span>
            </button>
          )}

          {activeTab === "skills" && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowImportModal(true)}
                className="px-3 py-2 bg-[#14110d] text-[#f5c277] border border-[#df9c43]/30 font-bold text-xs rounded-xl hover:bg-[#df9c43]/15 transition-all flex items-center gap-1.5"
                title="Importer un skill depuis skills.sh, GitHub ou une URL"
              >
                <span>🌐</span>
                <span>Importer Web (skills.sh)</span>
              </button>
              <button
                onClick={handleOpenCreateSkill}
                className="px-4 py-2 bg-[#241808] hover:bg-[#2d1e0d] border border-[#df9c43] text-[#eaaf5d] hover:text-[#f5c277] font-bold text-xs rounded-xl transition-all shadow-[0_0_10px_rgba(223,156,67,0.3)] flex items-center gap-1.5"
              >
                <span>+</span>
                <span>Nouveau Skill</span>
              </button>
            </div>
          )}

          {activeTab === "canvas" && (
            <button
              onClick={handleRunCanvasPipeline}
              disabled={canvasRunning}
              className="px-4 py-2 bg-[#241808] hover:bg-[#2d1e0d] border border-[#df9c43] text-[#eaaf5d] hover:text-[#f5c277] font-bold text-xs rounded-xl transition-all shadow-[0_0_10px_rgba(223,156,67,0.3)] flex items-center gap-1.5 disabled:opacity-50"
            >
              {canvasRunning ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-[#eaaf5d] border-t-transparent rounded-full animate-spin" />
                  <span>Pipeline en cours ({canvasProgress}%)...</span>
                </>
              ) : (
                <>
                  <span>▶</span>
                  <span>Exécuter Pipeline Multi-Agents</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className={`px-6 py-2 text-xs font-semibold flex items-center justify-between transition-all ${
          feedback.type === "success"
            ? "bg-emerald-500/20 text-emerald-300 border-b border-emerald-500/30"
            : "bg-red-500/20 text-red-300 border-b border-red-500/30"
        }`}>
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* ─── Main Content Views ─── */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {/* TAB 1: AGENTS CATALOGUE */}
        {activeTab === "agents" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-white tracking-tight">Directeurs & Assistants Cinéma (DGX Spark)</h3>
                <p className="text-xs text-white/50">Chaque agent intègre des compétences techniques de prise de vue, mouvement et cadrage pour assister vos générations.</p>
              </div>
            </div>

            {loading ? (
              <div className="h-64 flex flex-col items-center justify-center gap-3 text-white/40">
                <div className="w-8 h-8 rounded-full border-2 border-[#df9c43] border-t-transparent animate-spin" />
                <span className="text-xs">Chargement des agents...</span>
              </div>
            ) : filteredAgents.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center gap-3 text-center bg-black/20 border border-white/5 rounded-2xl p-6">
                <span className="text-3xl">🤖</span>
                <p className="text-sm font-bold text-white/70">Aucun agent trouvé</p>
                <button onClick={handleOpenCreateAgent} className="text-xs text-[#df9c43] hover:underline">+ Créer votre premier agent</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredAgents.map(agent => {
                  const agentSkills = skills.filter(s => (agent.skills || []).includes(s.id) || (agent.skills || []).includes(s.slug));

                  return (
                    <div
                      key={agent.id || agent.slug}
                      onClick={() => handleOpenAgentChat(agent)}
                      className="group relative bg-[#0e0b08] border border-[#df9c43]/15 hover:border-[#df9c43]/50 rounded-2xl p-5 shadow-lg transition-all flex flex-col justify-between cursor-pointer hover:shadow-[0_0_20px_rgba(223,156,67,0.15)]"
                    >
                      <div>
                        {/* Header: Avatar, Name, Actions */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-[#14110d] border border-[#df9c43]/30 flex items-center justify-center text-2xl shadow-inner group-hover:scale-105 transition-transform">
                              {agent.avatar || "🎬"}
                            </div>
                            <div>
                              <h4 className="text-sm font-black text-white group-hover:text-[#f5c277] transition-colors line-clamp-1">
                                {agent.name}
                              </h4>
                              <span className="text-[10px] text-[#df9c43]/70 font-mono tracking-wider block">
                                @{agent.slug}
                              </span>
                            </div>
                          </div>

                          {/* Quick Action Buttons */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => handleOpenEditAgent(agent, e)}
                              title="Modifier l'agent"
                              className="p-1.5 rounded-lg bg-[#241808] hover:bg-[#2d1e0d] text-[#eaaf5d] hover:text-[#f5c277] border border-[#df9c43]/40 hover:border-[#df9c43] shadow-[0_0_6px_rgba(223,156,67,0.25)] transition-all"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                              </svg>
                            </button>
                            <button
                              onClick={(e) => handleDeleteAgent(agent, e)}
                              title="Supprimer l'agent"
                              className="p-1.5 rounded-lg bg-black/60 hover:bg-red-500 text-white/70 hover:text-white transition-colors"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-white/60 line-clamp-3 leading-relaxed mb-4">
                          {agent.description || "Assistant cinématique prêt à générer des découpages et prompts pour Wan 2.2 5B."}
                        </p>
                      </div>

                      {/* Skills Tags */}
                      <div>
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-white/30 mb-1.5">
                          Compétences ({agentSkills.length}) :
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {agentSkills.slice(0, 3).map(s => (
                            <span
                              key={s.id}
                              className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#df9c43]/15 text-[#f5c277] border border-[#df9c43]/30"
                            >
                              {s.icon} {s.name}
                            </span>
                          ))}
                          {agentSkills.length > 3 && (
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono bg-white/5 text-white/50 border border-white/10">
                              +{agentSkills.length - 3}
                            </span>
                          )}
                        </div>

                        {/* Launch Button */}
                        <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                          <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            vLLM Qwen3-VL
                          </span>
                          <span className="font-bold text-[#df9c43] group-hover:translate-x-1 transition-transform flex items-center gap-1">
                            Ouvrir Chat →
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SKILLS LIBRARY */}
        {activeTab === "skills" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-white tracking-tight">Bibliothèque de Compétences (Skills Engine)</h3>
                <p className="text-xs text-white/50">Compétences de cadrage, cinématique, lumière et scénarisation affectables à vos agents.</p>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 bg-black/40 border border-[#df9c43]/20 rounded-xl p-1 text-xs overflow-x-auto custom-scrollbar">
                {skillCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-lg font-bold capitalize transition-all whitespace-nowrap ${
                      selectedCategory === cat
                        ? "bg-[#241808] border border-[#df9c43] text-[#eaaf5d] shadow-[0_0_8px_rgba(223,156,67,0.25)]"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    {cat === "all" ? "Toutes les catégories" : cat}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="h-64 flex flex-col items-center justify-center gap-3 text-white/40">
                <div className="w-8 h-8 rounded-full border-2 border-[#df9c43] border-t-transparent animate-spin" />
                <span className="text-xs">Chargement des skills...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredSkills.map(skill => {
                  const assignedCount = agents.filter(a => (a.skills || []).includes(skill.id) || (a.skills || []).includes(skill.slug)).length;

                  return (
                    <div
                      key={skill.id}
                      className="bg-[#0e0b08] border border-[#df9c43]/15 hover:border-[#df9c43]/40 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all"
                    >
                      <div>
                        {/* Header: Icon, Name, Category */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl p-2 rounded-xl bg-[#14110d] border border-[#df9c43]/20">
                              {skill.icon || "✨"}
                            </span>
                            <div>
                              <h4 className="text-sm font-black text-white">{skill.name}</h4>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#df9c43]">
                                {skill.category}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => handleOpenEditSkill(skill, e)}
                              title="Modifier le skill"
                              className="p-1.5 rounded-lg bg-[#241808] hover:bg-[#2d1e0d] text-[#eaaf5d] hover:text-[#f5c277] border border-[#df9c43]/40 hover:border-[#df9c43] shadow-[0_0_6px_rgba(223,156,67,0.25)] transition-all"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                              </svg>
                            </button>
                            <button
                              onClick={(e) => handleDeleteSkill(skill, e)}
                              title="Supprimer le skill"
                              className="p-1.5 rounded-lg bg-black/60 hover:bg-red-500 text-white/70 hover:text-white transition-colors"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-white/60 line-clamp-3 mb-3 leading-relaxed">
                          {skill.description}
                        </p>

                        {/* Prompt Injection Preview */}
                        {skill.prompt_injection && (
                          <div className="bg-black/50 border border-white/5 rounded-xl p-2.5 mb-3">
                            <span className="text-[9px] font-mono text-white/40 uppercase block mb-1">Règle Injective :</span>
                            <p className="text-[11px] font-mono text-white/70 line-clamp-2 italic">
                              "{skill.prompt_injection}"
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Footer: Tags & Assignments */}
                      <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                        <div className="flex flex-wrap gap-1 max-w-[170px]">
                          {(skill.tags || []).slice(0, 2).map((t, idx) => (
                            <span key={idx} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-white/50 border border-white/10">
                              #{t}
                            </span>
                          ))}
                        </div>
                        <span className="text-[10px] font-bold text-[#df9c43] bg-[#df9c43]/10 px-2 py-0.5 rounded-full border border-[#df9c43]/20">
                          {assignedCount} agent{assignedCount > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CANVAS D'ORCHESTRATION */}
        {activeTab === "canvas" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-white tracking-tight">Pipeline d'Orchestration Multi-Agents</h3>
                <p className="text-xs text-white/50">Flux visuel interactif montrant le passage de relais entre le scénariste, le directeur photo, le cluster ComfyUI et le coloriste.</p>
              </div>
            </div>

            {/* Visual Interactive Pipeline Canvas */}
            <div className="bg-[#0b0907] border border-[#df9c43]/20 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-[radial-gradient(#df9c43_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

              <div className="relative z-10 flex flex-col lg:flex-row items-stretch justify-between gap-6">
                {CANVAS_NODES.map((node, index) => {
                  const isSelected = selectedCanvasNode?.id === node.id;

                  return (
                    <div key={node.id} className="flex-1 flex flex-col items-center">
                      <div
                        onClick={() => setSelectedCanvasNode(node)}
                        className={`w-full bg-[#14110d] rounded-2xl p-5 border-2 transition-all cursor-pointer shadow-xl ${
                          isSelected
                            ? "border-[#df9c43] shadow-[0_0_25px_rgba(223,156,67,0.35)] scale-[1.02]"
                            : node.status === "running"
                            ? "border-[#df9c43] animate-pulse"
                            : node.status === "done"
                            ? "border-emerald-500/60"
                            : "border-white/10 hover:border-[#df9c43]/40"
                        }`}
                      >
                        {/* Status Badge */}
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-2xl p-2 rounded-xl bg-black/40 border border-white/10">
                            {node.icon}
                          </span>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                            node.status === "done" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" :
                            node.status === "running" ? "bg-[#df9c43]/20 text-[#f5c277] border border-[#df9c43]/40 animate-pulse" :
                            "bg-white/5 text-white/40 border border-white/10"
                          }`}>
                            {node.status === "done" ? "✓ Prêt" : node.status === "running" ? "⚡ En Cours" : "En Attente"}
                          </span>
                        </div>

                        <h4 className="text-xs font-black text-white mb-1">{node.name}</h4>
                        <span className="text-[11px] font-bold text-[#df9c43] block mb-2">{node.agent}</span>
                        <p className="text-[11px] text-white/50 leading-relaxed mb-3">{node.role}</p>

                        <div className="space-y-1 pt-2 border-t border-white/5">
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-white/30">Skills Actifs :</span>
                          <div className="flex flex-wrap gap-1">
                            {node.skills.map((s, idx) => (
                              <span key={idx} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#df9c43]/10 text-[#f5c277] border border-[#df9c43]/20">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Connection arrow between nodes on desktop */}
                      {index < CANVAS_NODES.length - 1 && (
                        <div className="hidden lg:flex items-center justify-center text-[#df9c43] my-auto px-2 font-black text-xl">
                          ➔
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Node Inspector Drawer */}
              {selectedCanvasNode && (
                <div className="mt-8 p-6 rounded-2xl bg-black/60 border border-[#df9c43]/30 flex flex-col md:flex-row items-start justify-between gap-6 animate-fade-in-up">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{selectedCanvasNode.icon}</span>
                      <h4 className="text-sm font-black text-white">{selectedCanvasNode.name}</h4>
                      <span className="text-xs text-[#df9c43] font-bold">• {selectedCanvasNode.agent}</span>
                    </div>
                    <p className="text-xs text-white/70 max-w-2xl leading-relaxed">
                      Ce nœud orchestre le passage de relais technique. Les instructions générées ici alimentent directement le modèle suivant dans la chaîne de production.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        const ag = agents.find(a => a.name.includes(selectedCanvasNode.agent) || selectedCanvasNode.agent.includes(a.name));
                        if (ag) handleOpenAgentChat(ag);
                      }}
                      className="px-4 py-2 bg-[#241808] hover:bg-[#2d1e0d] border border-[#df9c43] text-[#eaaf5d] hover:text-[#f5c277] font-bold text-xs rounded-xl transition-all shadow-[0_0_10px_rgba(223,156,67,0.3)]"
                    >
                      Ouvrir Chat Dédié
                    </button>
                    <button
                      onClick={() => setSelectedCanvasNode(null)}
                      className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white/70 rounded-xl text-xs"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── MODAL 1: Create / Edit Agent ─── */}
      {showAgentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in-up">
          <div className="bg-[#0e0b08] border border-[#df9c43]/30 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <span>{editingAgent ? "Modifier l'Agent" : "Créer un Nouvel Agent"}</span>
              </h3>
              <button onClick={() => setShowAgentModal(false)} className="text-white/40 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveAgent} className="space-y-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-16">
                  <label className="block text-white/60 mb-1 font-bold">Avatar</label>
                  <input
                    type="text"
                    value={agentForm.avatar}
                    onChange={e => setAgentForm({ ...agentForm, avatar: e.target.value })}
                    className="w-full text-center text-xl bg-black/60 border border-white/20 rounded-xl py-2 text-white focus:border-[#df9c43] focus:outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-white/60 mb-1 font-bold">Nom de l'Agent</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: DP Cinéma Anamorphique"
                    value={agentForm.name}
                    onChange={e => setAgentForm({ ...agentForm, name: e.target.value })}
                    className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-white focus:border-[#df9c43] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/60 mb-1 font-bold">Description Rôle</label>
                <textarea
                  rows={2}
                  placeholder="Spécialité et domaine d'intervention..."
                  value={agentForm.description}
                  onChange={e => setAgentForm({ ...agentForm, description: e.target.value })}
                  className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-white focus:border-[#df9c43] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-white/60 mb-1 font-bold">Prompt Système (Directives Réalisateur)</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Tu es le réalisateur spécialisé dans..."
                  value={agentForm.system_prompt}
                  onChange={e => setAgentForm({ ...agentForm, system_prompt: e.target.value })}
                  className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:border-[#df9c43] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-white/60 mb-1.5 font-bold">Affectation des Compétences ({agentForm.skills.length} sélectionnées)</label>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-black/40 border border-white/10 rounded-xl custom-scrollbar">
                  {skills.map(s => {
                    const isSelected = agentForm.skills.includes(s.id);
                    return (
                      <button
                        type="button"
                        key={s.id}
                        onClick={() => toggleSkillInAgent(s.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          isSelected
                            ? "bg-[#241808] border border-[#df9c43] text-[#eaaf5d] shadow-[0_0_6px_rgba(223,156,67,0.25)]"
                            : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        {s.icon} {s.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAgentModal(false)}
                  className="px-4 py-2 text-white/60 hover:text-white rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#241808] hover:bg-[#2d1e0d] border border-[#df9c43] text-[#eaaf5d] hover:text-[#f5c277] font-bold rounded-xl shadow-[0_0_12px_rgba(223,156,67,0.3)] transition-all"
                >
                  Enregistrer l'Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: Create / Edit Skill ─── */}
      {showSkillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in-up">
          <div className="bg-[#0e0b08] border border-[#df9c43]/30 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-black text-white">
                {editingSkill ? "Modifier la Compétence" : "Créer une Nouvelle Compétence"}
              </h3>
              <button onClick={() => setShowSkillModal(false)} className="text-white/40 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveSkill} className="space-y-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-16">
                  <label className="block text-white/60 mb-1 font-bold">Icône</label>
                  <input
                    type="text"
                    value={skillForm.icon}
                    onChange={e => setSkillForm({ ...skillForm, icon: e.target.value })}
                    className="w-full text-center text-xl bg-black/60 border border-white/20 rounded-xl py-2 text-white focus:border-[#df9c43] focus:outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-white/60 mb-1 font-bold">Nom du Skill</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Cadrage Anamorphique 35mm"
                    value={skillForm.name}
                    onChange={e => setSkillForm({ ...skillForm, name: e.target.value })}
                    className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-white focus:border-[#df9c43] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/60 mb-1 font-bold">Catégorie</label>
                <select
                  value={skillForm.category}
                  onChange={e => setSkillForm({ ...skillForm, category: e.target.value })}
                  className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-white focus:border-[#df9c43] focus:outline-none"
                >
                  <option value="Cinematography">Cinematography (Prise de Vue & Cadrage)</option>
                  <option value="Lighting">Lighting (Lumière & Optique)</option>
                  <option value="Storytelling">Storytelling (Mini-Drama & Pacing)</option>
                  <option value="Consistency">Consistency (Cohérence Personnages)</option>
                  <option value="Audio & Voice">Audio & Voice (Voix & OST)</option>
                  <option value="Color Grading">Color Grading (Étalonnage ACES)</option>
                  <option value="Orchestration">Orchestration (Multi-Agents)</option>
                </select>
              </div>

              <div>
                <label className="block text-white/60 mb-1 font-bold">Description & Contexte d'Application</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Décrivez ce que cette compétence apporte à la génération..."
                  value={skillForm.description}
                  onChange={e => setSkillForm({ ...skillForm, description: e.target.value })}
                  className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-white focus:border-[#df9c43] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-white/60 mb-1 font-bold">Directives Injectives (Injecté dans le prompt)</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Terminologie exacte, règles optiques et mots-clés obligatoires..."
                  value={skillForm.prompt_injection}
                  onChange={e => setSkillForm({ ...skillForm, prompt_injection: e.target.value })}
                  className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:border-[#df9c43] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-white/60 mb-1 font-bold">Tags (séparés par des virgules)</label>
                <input
                  type="text"
                  placeholder="optics, framing, 35mm, cinema"
                  value={skillForm.tags}
                  onChange={e => setSkillForm({ ...skillForm, tags: e.target.value })}
                  className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-[#df9c43] focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowSkillModal(false)}
                  className="px-4 py-2 text-white/60 hover:text-white rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#241808] hover:bg-[#2d1e0d] border border-[#df9c43] text-[#eaaf5d] hover:text-[#f5c277] font-bold rounded-xl shadow-[0_0_12px_rgba(223,156,67,0.3)] transition-all"
                >
                  Enregistrer le Skill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: Import Skill from Web (skills.sh) ─── */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in-up">
          <div className="bg-[#0e0b08] border border-[#df9c43]/30 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <span>🌐 Importer une Compétence depuis le Web</span>
              </h3>
              <button onClick={() => setShowImportModal(false)} className="text-white/40 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-white/60 leading-relaxed">
              Chargez instantanément un skill depuis le site <strong>skills.sh</strong>, un dépôt <strong>GitHub</strong> (Markdown ou JSON), ou un dépôt Claude. Le contenu sera parsé et intégré dans votre bibliothèque locale.
            </p>

            <form onSubmit={handleImportSkill} className="space-y-4 text-xs">
              <div>
                <label className="block text-white/60 mb-1.5 font-bold">URL de la Compétence</label>
                <input
                  type="url"
                  required
                  placeholder="https://skills.sh/username/cinematography-pro ou https://raw.githubusercontent.com/..."
                  value={importUrl}
                  onChange={e => setImportUrl(e.target.value)}
                  className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2.5 text-white font-mono text-xs focus:border-[#df9c43] focus:outline-none"
                />
              </div>

              <div className="p-3 bg-[#df9c43]/10 border border-[#df9c43]/20 rounded-xl space-y-1 text-[11px] text-[#f5c277]">
                <div className="font-bold">Formats supportés :</div>
                <div>• skills.sh (spécification officielle)</div>
                <div>• Dépôts GitHub (SKILL.md, system prompt)</div>
                <div>• JSON descriptif ou prompt textuel</div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 text-white/60 hover:text-white rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isImporting}
                  className="px-5 py-2 bg-[#241808] hover:bg-[#2d1e0d] border border-[#df9c43] text-[#eaaf5d] hover:text-[#f5c277] font-bold rounded-xl shadow-[0_0_12px_rgba(223,156,67,0.3)] transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isImporting ? (
                    <>
                      <div className="w-3 h-3 border-2 border-[#eaaf5d] border-t-transparent rounded-full animate-spin" />
                      <span>Téléchargement...</span>
                    </>
                  ) : (
                    <span>Télécharger & Intégrer</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
