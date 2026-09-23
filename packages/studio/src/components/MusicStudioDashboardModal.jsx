"use client";

import React, { useState } from "react";
import {
  X,
  FileText,
  Settings,
  Package,
  HelpCircle,
  Play,
  FolderOpen,
  Music,
  Sliders,
  Check,
  Search,
  ExternalLink,
  Volume2,
  Cpu,
  Radio,
  BookOpen,
  Keyboard,
  Clock,
  Sparkles,
  ArrowRight
} from "lucide-react";

/**
 * Music Studio Tableau de Bord (Dashboard)
 * Conforme au Chapitre 0 du Guide de l'utilisateur de Music Studio (p. 25-42)
 * Hub central : Utilisateur (Projets/Modèles), Réglages (Audio/Comportement/Contrôleurs), Packages, Aide.
 */
export default function MusicStudio({
  isOpen,
  onClose,
  onOpenProject,
  onSelectTemplate,
  audioSettings = {},
  onUpdateAudioSettings,
  recentProjects = [],
  studioHostConnected = true
}) {
  const [activeTab, setActiveTab] = useState("user"); // 'user' | 'settings' | 'packages' | 'help'
  const [userSubSection, setUserSubSection] = useState("templates"); // 'templates' | 'demos' | 'recent'
  const [searchQuery, setSearchQuery] = useState("");
  const [shortcutFilter, setShortcutFilter] = useState("");

  if (!isOpen) return null;

  // Modèles de projet officiels (Section 0.2.1, p. 26)
  const TEMPLATES = [
    {
      id: "tpl_blank",
      name: "Point de départ vierge",
      category: "Générique",
      bpm: 120,
      key: "C Major",
      tracksCount: 4,
      desc: "Projet vierge avec 2 pistes audio, 1 piste instrument et piste Master."
    },
    {
      id: "tpl_ferrous",
      name: "Ferrous Rhythm (Référence Music Studio 6)",
      category: "Électronique / Techno",
      bpm: 172,
      key: "F# minor",
      tracksCount: 11,
      desc: "Projet complet avec Drum Machine 12 pads, dossiers hiérarchiques Drums & Inst, automations Bézier et waveforms."
    },
    {
      id: "tpl_amapiano",
      name: "Amapiano Deep Groove",
      category: "Afro / Dance",
      bpm: 113,
      key: "F# minor",
      tracksCount: 8,
      desc: "Configuration Amapiano avec Log Drum synthétisé, shakers syncopés et piano Rhodes feutré."
    },
    {
      id: "tpl_trap808",
      name: "808 Trap & Hip-Hop",
      category: "Urbain / Trap",
      bpm: 140,
      key: "C minor",
      tracksCount: 9,
      desc: "Sous-basses 808 saturées, roulements de charlestons en triolets et caisse claire tranchante."
    },
    {
      id: "tpl_synthwave",
      name: "Synthwave 80s Cyberpunk",
      category: "Rétro / Synthwave",
      bpm: 125,
      key: "D minor",
      tracksCount: 7,
      desc: "Arpèges analogiques, basse slap FM, batterie réverbérée gated et nappes analogiques chaudes."
    },
    {
      id: "tpl_cinematic",
      name: "Cinematic Orchestral OST",
      category: "Musique de Film",
      bpm: 90,
      key: "A minor",
      tracksCount: 10,
      desc: "Cordes amples, cuivres ambrés, percussions épiques et ambiances spectrales."
    }
  ];

  // Projets de démo officiels Music Studio
  const DEMO_PROJECTS = [
    {
      id: "demo_ferrous",
      name: "Ferrous Rhythm - Music Studio Official Demo",
      author: "Music Studio",
      bpm: 172,
      key: "F# minor",
      size: "18.4 MB",
      desc: "Démonstration officielle du workflow Music Studio 6 avec percussions polyphoniques et modulation dynamique."
    },
    {
      id: "demo_sahel",
      name: "Sahel Afrobeat Groove",
      author: "Môguô Puissant AI",
      bpm: 113,
      key: "F# minor",
      size: "24.1 MB",
      desc: "Production Afro-fusion polyrythmique avec stems séparés par Demucs IA et routing auxiliaire."
    },
    {
      id: "demo_zouk",
      name: "Zouk Love Kôle Séré",
      author: "Mgp Studio Music",
      bpm: 90,
      key: "Bb major",
      size: "16.8 MB",
      desc: "Ballade caribéenne avec ligne de basse acoustique, guitare zouk syncopée et choeurs expressifs."
    }
  ];

  // Banques officielles Packages (Section 0.2.3, p. 39)
  const PACKAGES = [
    {
      id: "pkg_essentials",
      title: "Music Studio Essentials Core Library",
      category: "Usine",
      size: "1.2 Go",
      presets: 140,
      installed: true,
      desc: "Instruments et effets fondamentaux pour la production musicale complète."
    },
    {
      id: "pkg_808",
      title: "808 Legends & Trap Vault",
      category: "Kits de batterie",
      size: "850 Mo",
      presets: 64,
      installed: true,
      desc: "Échantillons analogiques haute fidélité de boîtes à rythmes vintage et modernes."
    },
    {
      id: "pkg_acoustic",
      title: "Acoustic Drum Kits & Multi-mic",
      category: "Batterie acoustique",
      size: "1.8 Go",
      presets: 32,
      installed: true,
      desc: "Kits de batterie studio enregistrés avec micros d'ambiance et overheads stéréo."
    },
    {
      id: "pkg_world",
      title: "World & Ethnic Percussions",
      category: "Musique du Monde",
      size: "650 Mo",
      presets: 48,
      installed: true,
      desc: "Percussions traditionnelles d'Afrique, d'Amérique Latine et d'Asie du Sud."
    },
    {
      id: "pkg_grid",
      title: "Polymer & The Grid Modular Collection",
      category: "Synthèse modulaire",
      size: "420 Mo",
      presets: 200,
      installed: true,
      desc: "Patchs modulaires Poly Grid et FX Grid conçus par les sound designers de Music Studio."
    }
  ];

  // Tableau des raccourcis officiels Music Studio (Section 0.2.2.5, p. 36)
  const STUDIO_SHORTCUTS = [
    { key: "Espace", action: "Lecture / Arrêt du transport", category: "Transport" },
    { key: "Entrée", action: "Retour à la position de départ / Mesure 1", category: "Transport" },
    { key: "L", action: "Activer / Désactiver la boucle de lecture", category: "Transport" },
    { key: "C", action: "Activer / Désactiver le métronome", category: "Transport" },
    { key: "Tab", action: "Basculer entre la vue Arrangeur et le Lanceur de clips", category: "Vues" },
    { key: "Ctrl + I / Cmd + I", action: "Afficher / Masquer le panneau Inspecteur", category: "Panneaux" },
    { key: "Alt + B", action: "Afficher / Masquer le panneau Navigateur", category: "Panneaux" },
    { key: "Ctrl + D / Cmd + D", action: "Afficher / Masquer le Tableau de bord Music Studio", category: "Panneaux" },
    { key: "1", action: "Outil Pointeur (Sélection & déplacement d'objets)", category: "Outils" },
    { key: "2", action: "Outil Sélection temporelle (Time selection)", category: "Outils" },
    { key: "3", action: "Outil Couteau / Split (Scinder au curseur)", category: "Outils" },
    { key: "4", action: "Outil Gomme (Suppression)", category: "Outils" },
    { key: "5", action: "Outil Crayon (Création de notes et dessin d'automation)", category: "Outils" },
    { key: "Alt + A", action: "Mettre la piste sélectionnée en / hors service", category: "Pistes" },
    { key: "Ctrl + B / Ctrl + S", action: "Scinder le clip à la tête de lecture", category: "Édition" },
    { key: "Ctrl + D", action: "Dupliquer l'objet ou la sélection temporelle", category: "Édition" },
    { key: "Suppr / Backspace", action: "Supprimer les objets sélectionnés", category: "Édition" },
    { key: "Ctrl + Shift + B", action: "Exporter l'audio Master (Bounce WAV)", category: "Fichier" }
  ];

  return (
    <div
      data-testid="modal-studio-dashboard"
      className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 md:p-6"
      onClick={onClose}
    >
      <div
        className="bg-[#181818] border border-[#383838] rounded-2xl w-full max-w-5xl h-[85vh] max-h-[800px] flex flex-col shadow-[0_25px_60px_rgba(0,0,0,0.95)] overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Top Bar with Music Studio Neon Badge & Navigation Tabs ── */}
        <div className="h-14 bg-[#141414] border-b border-[#2b2b2b] px-5 flex items-center justify-between flex-shrink-0">
          {/* Left: Music Studio Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-[#ea580c]/15 px-2.5 py-1 rounded-lg border border-[#ea580c]/40">
              <div className="grid grid-cols-2 gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ea580c]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#ea580c]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#ea580c]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#ea580c]" />
              </div>
              <span className="font-extrabold text-sm tracking-wider text-white">MUSIC STUDIO</span>
            </div>
            <span className="text-xs text-zinc-400 font-medium">Tableau de bord</span>
          </div>

          {/* Center: The 4 Official Music Studio Navigation Tabs (p. 25) */}
          <div className="flex items-center bg-[#1e1e1e] p-1 rounded-xl border border-[#2e2e2e]">
            <button
              onClick={() => setActiveTab("user")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wide transition flex items-center gap-1.5 ${
                activeTab === "user"
                  ? "bg-[#ea580c] text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <FolderOpen size={13} />
              <span>Utilisateur</span>
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wide transition flex items-center gap-1.5 ${
                activeTab === "settings"
                  ? "bg-[#ea580c] text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Settings size={13} />
              <span>Réglages</span>
            </button>

            <button
              onClick={() => setActiveTab("packages")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wide transition flex items-center gap-1.5 ${
                activeTab === "packages"
                  ? "bg-[#ea580c] text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Package size={13} />
              <span>Packages</span>
            </button>

            <button
              onClick={() => setActiveTab("help")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wide transition flex items-center gap-1.5 ${
                activeTab === "help"
                  ? "bg-[#ea580c] text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <HelpCircle size={13} />
              <span>Aide</span>
            </button>
          </div>

          {/* Right: Close Button */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition"
            title="Fermer le Tableau de bord [Échap ou Ctrl+D]"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Dashboard Body ── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-[#181818]">
          {/* ════════════════════════════════════════════════════════════
              ONGLET 1: UTILISATEUR (Projets, Modèles & Démos - p. 25-27)
          ════════════════════════════════════════════════════════════ */}
          {activeTab === "user" && (
            <div className="space-y-6">
              {/* Sub-navigation: Modèles, Projets Démo, Projets Récents */}
              <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setUserSubSection("templates")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      userSubSection === "templates"
                        ? "bg-[#2c2c2c] text-white border border-[#444444]"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Modèles de projet (6)
                  </button>
                  <button
                    onClick={() => setUserSubSection("demos")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      userSubSection === "demos"
                        ? "bg-[#2c2c2c] text-white border border-[#444444]"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Projets de démo (3)
                  </button>
                  <button
                    onClick={() => setUserSubSection("recent")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      userSubSection === "recent"
                        ? "bg-[#2c2c2c] text-white border border-[#444444]"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Projets récents ({recentProjects.length || 1})
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative w-64">
                  <Search size={13} className="absolute left-2.5 top-2.5 text-zinc-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filtrer les projets..."
                    className="w-full bg-[#121212] border border-[#2d2d2d] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#ea580c]"
                  />
                </div>
              </div>

              {/* Sub-section A: Modèles de projet */}
              {userSubSection === "templates" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {TEMPLATES.filter(
                    (t) =>
                      !searchQuery ||
                      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      t.category.toLowerCase().includes(searchQuery.toLowerCase())
                  ).map((tpl) => (
                    <div
                      key={tpl.id}
                      className="bg-[#1e1e1e] hover:bg-[#232323] border border-[#2d2d2d] hover:border-[#ea580c]/60 rounded-xl p-4 flex flex-col justify-between transition-all group shadow-sm"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#141414] text-[#ea580c] font-bold border border-white/5">
                            {tpl.category}
                          </span>
                          <span className="text-[11px] font-mono text-zinc-400">
                            {tpl.bpm} BPM • {tpl.key}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-white group-hover:text-[#ea580c] transition">
                          {tpl.name}
                        </h4>
                        <p className="text-xs text-zinc-400 leading-relaxed">{tpl.desc}</p>
                      </div>

                      <div className="pt-4 mt-3 border-t border-[#292929] flex items-center justify-between">
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {tpl.tracksCount} pistes prêtes
                        </span>
                        <button
                          onClick={() => {
                            if (onSelectTemplate) onSelectTemplate(tpl);
                            onClose();
                          }}
                          className="px-3 py-1.5 bg-[#ea580c] hover:bg-[#f97316] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition shadow"
                        >
                          <Play size={12} fill="white" />
                          <span>Ouvrir</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Sub-section B: Projets de démo */}
              {userSubSection === "demos" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {DEMO_PROJECTS.map((demo) => (
                    <div
                      key={demo.id}
                      className="bg-[#1e1e1e] border border-[#2d2d2d] rounded-xl p-4 flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                          <span>{demo.author}</span>
                          <span>{demo.size}</span>
                        </div>
                        <h4 className="font-bold text-sm text-white">{demo.name}</h4>
                        <p className="text-xs text-zinc-400 leading-relaxed">{demo.desc}</p>
                        <div className="text-[11px] font-mono text-[#ea580c]">
                          {demo.bpm} BPM • Tonalité {demo.key}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (onOpenProject) onOpenProject(demo);
                          onClose();
                        }}
                        className="w-full py-2 bg-[#2c2c2c] hover:bg-[#ea580c] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition"
                      >
                        <Play size={12} fill="white" />
                        <span>Charger la démo</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Sub-section C: Projets récents */}
              {userSubSection === "recent" && (
                <div className="space-y-2">
                  <div className="bg-[#141414] border border-[#282828] rounded-xl p-3 flex items-center justify-between hover:bg-[#1c1c1c] transition">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#252525] flex items-center justify-center text-[#ea580c]">
                        <Music size={18} />
                      </div>
                      <div>
                        <h5 className="font-bold text-sm text-white">Ferrous Rhythm (Projet Actif)</h5>
                        <p className="text-xs text-zinc-400 font-mono">Modifié il y a 5 minutes • 11 pistes • 172 BPM</p>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="px-3.5 py-1.5 bg-[#ea580c] text-white text-xs font-bold rounded-lg hover:bg-[#f97316] transition"
                    >
                      Continuer
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════
              ONGLET 2: RÉGLAGES (Audio, Comportement, Contrôleurs - p. 27-37)
          ════════════════════════════════════════════════════════════ */}
          {activeTab === "settings" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Audio & Comportement */}
              <div className="space-y-5">
                <div className="bg-[#1e1e1e] border border-[#2d2d2d] rounded-xl p-4 space-y-4">
                  <div className="flex items-center gap-2 border-b border-[#2b2b2b] pb-2 text-white font-bold text-sm">
                    <Volume2 size={16} className="text-[#ea580c]" />
                    <span>0.2.2.2. Réglages Audio</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-300">Fréquence d'échantillonnage :</span>
                      <select
                        defaultValue={audioSettings.sampleRate || "48000"}
                        onChange={(e) => onUpdateAudioSettings && onUpdateAudioSettings({ sampleRate: e.target.value })}
                        className="bg-[#121212] border border-[#333333] rounded px-2.5 py-1 text-white font-mono"
                      >
                        <option value="44100">44 100 Hz</option>
                        <option value="48000">48 000 Hz (Projet DAW)</option>
                        <option value="96000">96 000 Hz (Haute Définition)</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-zinc-300">Taille du tampon (Buffer Size) :</span>
                      <select
                        defaultValue={audioSettings.bufferSize || "256"}
                        onChange={(e) => onUpdateAudioSettings && onUpdateAudioSettings({ bufferSize: e.target.value })}
                        className="bg-[#121212] border border-[#333333] rounded px-2.5 py-1 text-white font-mono"
                      >
                        <option value="128">128 samples (2.7 ms)</option>
                        <option value="256">256 samples (5.3 ms - Optimal)</option>
                        <option value="512">512 samples (10.7 ms)</option>
                        <option value="1024">1024 samples (21.3 ms)</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-zinc-300">Moteur Audio temps réel :</span>
                      <span className="text-emerald-400 font-mono font-semibold">Web Audio API / Triton Low-Latency</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#1e1e1e] border border-[#2d2d2d] rounded-xl p-4 space-y-4">
                  <div className="flex items-center gap-2 border-b border-[#2b2b2b] pb-2 text-white font-bold text-sm">
                    <Sliders size={16} className="text-[#ea580c]" />
                    <span>0.2.2.1. Réglages de Comportement</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-300">Importation audio :</span>
                      <select
                        defaultValue="stretch"
                        className="bg-[#121212] border border-[#333333] rounded px-2.5 py-1 text-white"
                      >
                        <option value="stretch">Étirer au tempo du projet (Défaut)</option>
                        <option value="original">Lire à la vitesse d'origine</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-zinc-300">Détection de tempo auto :</span>
                      <span className="text-emerald-400 font-mono font-semibold">ACTIVÉE (Algorithme Onset/YIN)</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-zinc-300">Temps de pré-roll :</span>
                      <select
                        defaultValue="off"
                        className="bg-[#121212] border border-[#333333] rounded px-2.5 py-1 text-white"
                      >
                        <option value="off">Désactivé</option>
                        <option value="1bar">1 mesure</option>
                        <option value="2bars">2 mesures</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Contrôleurs & Raccourcis */}
              <div className="space-y-5">
                <div className="bg-[#1e1e1e] border border-[#2d2d2d] rounded-xl p-4 space-y-4">
                  <div className="flex items-center gap-2 border-b border-[#2b2b2b] pb-2 text-white font-bold text-sm">
                    <Radio size={16} className="text-[#ea580c]" />
                    <span>0.2.2.3. Réglages des Contrôleurs</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-300">Pont OSC Music Studio :</span>
                      <span className={`font-mono font-bold ${studioHostConnected ? "text-emerald-400" : "text-amber-400"}`}>
                        {studioHostConnected ? "CONNECTÉ (UDP :9000/:9001)" : "EN ATTENTE"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-zinc-300">Protocole de transport :</span>
                      <span className="text-white font-mono">Music Studio JARVIS Controller v1.0</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-zinc-300">Support Web MIDI :</span>
                      <span className="text-emerald-400 font-mono">Clavier & Contrôleur MPE</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#1e1e1e] border border-[#2d2d2d] rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-[#2b2b2b] pb-2">
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                      <Keyboard size={16} className="text-[#ea580c]" />
                      <span>0.2.2.5. Raccourcis Clavier</span>
                    </div>
                    <input
                      type="text"
                      value={shortcutFilter}
                      onChange={(e) => setShortcutFilter(e.target.value)}
                      placeholder="Filtrer..."
                      className="bg-[#121212] border border-[#333333] rounded px-2 py-0.5 text-[11px] text-white w-28"
                    />
                  </div>

                  <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1.5 text-xs font-mono">
                    {STUDIO_SHORTCUTS.filter(
                      (s) =>
                        !shortcutFilter ||
                        s.action.toLowerCase().includes(shortcutFilter.toLowerCase()) ||
                        s.key.toLowerCase().includes(shortcutFilter.toLowerCase())
                    ).map((sc, i) => (
                      <div key={i} className="flex items-center justify-between bg-[#141414] px-2.5 py-1 rounded">
                        <span className="text-zinc-300 font-sans truncate mr-2">{sc.action}</span>
                        <span className="bg-[#242424] px-1.5 py-0.5 rounded text-[#ea580c] whitespace-nowrap">
                          {sc.key}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════
              ONGLET 3: PACKAGES (Banques de sons & Extensions - p. 39-40)
          ════════════════════════════════════════════════════════════ */}
          {activeTab === "packages" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-[#141414] p-3 rounded-xl border border-[#2a2a2a]">
                <div className="flex items-center gap-2">
                  <Package size={16} className="text-[#ea580c]" />
                  <span className="font-bold text-xs text-white">Gestionnaire de Packages Music Studio</span>
                </div>
                <span className="text-xs text-emerald-400 font-mono">5 Packages installés • 4.9 Go</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PACKAGES.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="bg-[#1e1e1e] border border-[#2d2d2d] rounded-xl p-4 flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                        <span className="text-[#ea580c] font-bold">{pkg.category}</span>
                        <span className="text-zinc-400">{pkg.size}</span>
                      </div>
                      <h4 className="font-bold text-sm text-white">{pkg.title}</h4>
                      <p className="text-xs text-zinc-400 leading-relaxed mt-1">{pkg.desc}</p>
                    </div>

                    <div className="pt-3 border-t border-[#2a2a2a] flex items-center justify-between">
                      <span className="text-[11px] text-zinc-500 font-mono">{pkg.presets} presets d'usine</span>
                      <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
                        <Check size={13} />
                        <span>Installé</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════
              ONGLET 4: AIDE (Documentation & Guides - p. 41-42)
          ════════════════════════════════════════════════════════════ */}
          {activeTab === "help" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#1e1e1e] border border-[#2d2d2d] rounded-xl p-5 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#ea580c]/15 text-[#ea580c] flex items-center justify-center">
                  <BookOpen size={20} />
                </div>
                <h4 className="font-bold text-base text-white">Guide de l'utilisateur de Music Studio</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Manuel officiel complet en langue française rédigé par Dave Linnenbank (701 pages, Octobre 2024). Contient l'anatomie de l'application, les 19 chapitres détaillés, les workflows, et les descriptions exhaustives de tous les composants audio et The Grid.
                </p>
                <div className="pt-2 text-[11px] font-mono text-zinc-500">
                  Emplacement : docs/Music Studio User Guide French.pdf (59 Mo)
                </div>
              </div>

              <div className="bg-[#1e1e1e] border border-[#2d2d2d] rounded-xl p-5 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
                  <Sparkles size={20} />
                </div>
                <h4 className="font-bold text-base text-white">Guide Interactif & Moteur DAW</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Apprenez à utiliser l'Arrangeur multi-pistes, le Lanceur de clips non-linéaire, le Drum Machine 12 pads et les courbes d'automations Bézier sans simulation (100% Web Audio temps réel et passerelle OSC).
                </p>
                <div className="pt-2 text-[11px] font-mono text-cyan-400">
                  Version DAW : Studio-Grade 6.0 Studio Edition
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="h-12 bg-[#141414] border-t border-[#2b2b2b] px-6 flex items-center justify-between flex-shrink-0 text-xs text-zinc-400">
          <span className="font-mono">Music Studio DAW • Tableau de bord de Production</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#2c2c2c] hover:bg-[#383838] text-white font-semibold rounded-lg transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
