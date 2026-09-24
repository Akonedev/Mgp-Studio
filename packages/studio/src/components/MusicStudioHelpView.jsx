"use client";

import React, { useState, useMemo } from "react";
import {
  HelpCircle,
  Search,
  BookOpen,
  Sliders,
  Layers,
  Zap,
  Activity,
  Music,
  Radio,
  Cpu,
  Waves,
  X,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Command,
  Play
} from "lucide-react";

/**
 * ════════════════════════════════════════════════════════════════════════════════
 * MUSIC STUDIO DAW - COMPLETE CONTEXT HELP VIEW & INFO PANE (ZERO MOCK)
 * Official French Bitwig Studio User Guide Reference (Section 2.4, p. 55–60)
 * Image 0 Sahel Gold Theme (#181513, #241808, #df9c43, #eaaf5d, #f5c277)
 * ════════════════════════════════════════════════════════════════════════════════
 */

export const DAW_HELP_CATEGORIES = [
  { id: "all", label: "Tout le Guide", icon: BookOpen },
  { id: "instruments", label: "Instruments", icon: Music },
  { id: "audio_fx", label: "Effets Audio", icon: Sliders },
  { id: "spectral", label: "Spectral Suite", icon: Sparkles },
  { id: "modulators", label: "Modulateurs", icon: Activity },
  { id: "the_grid", label: "The Grid (Modulaire)", icon: Zap },
  { id: "comping_warp", label: "Comping & Audio Warp", icon: Layers },
  { id: "operators", label: "Opérateurs & MPE", icon: Waves },
  { id: "shortcuts", label: "Raccourcis Clavier", icon: Command }
];

export const DAW_HELP_ARTICLES = [
  // ── SPECTRAL SUITE (Chapter 21) ──
  {
    id: "spectral_transient_split",
    category: "spectral",
    title: "Transient Split (Spectral Suite)",
    subtitle: "Séparation dynamique transitoires vs composantes tonales",
    chapter: "Chapitre 21.1 • Spectral Suite",
    desc: "Transient Split sépare le signal audio entrant en deux flux distincts : la phase d'attaque percussive (transitoire) et la résonance continue (corps tonal). Cela permet d'appliquer par exemple une distorsion uniquement sur le claquement sans troubler la résonance, ou d'appliquer une réverbération diffuse sans étaler l'attaque.",
    parameters: [
      { name: "Transitoires Boost", range: "-12 dB à +12 dB", desc: "Gain appliqué aux impulsions transitoires détectées", modulatable: true },
      { name: "Corps Tonal", range: "-12 dB à +12 dB", desc: "Gain appliqué aux composantes harmoniques et résonances", modulatable: true },
      { name: "Sensibilité Attaque", range: "0% à 100%", desc: "Seuil de sensibilité du détecteur de flux spectral d'attaque", modulatable: true }
    ],
    tips: "Idéal sur les boucles de batterie, les percussions africaines (djembe, balafon, kalimba) et les guitares acoustiques."
  },
  {
    id: "spectral_loud_split",
    category: "spectral",
    title: "Loud Split (Spectral Suite)",
    subtitle: "Division de signal par seuil d'amplitude et hystérésis",
    chapter: "Chapitre 21.2 • Spectral Suite",
    desc: "Loud Split divise le spectre sonore selon l'énergie dynamique instantanée. Les parties de faible intensité (déclins de réverb, respirations, ambiances de pièce) sont routées vers un canal silencieux (Quiet), tandis que les crêtes vigoureuses sont envoyées vers le canal fort (Loud).",
    parameters: [
      { name: "Seuil Amplitude", range: "-60 dB à 0 dB", desc: "Niveau de coupure séparant les sons faibles des sons forts", modulatable: true },
      { name: "Gain Silencieux", range: "-24 dB à +12 dB", desc: "Amplification ou atténuation des passages pianissimo", modulatable: true },
      { name: "Gain Fort", range: "-24 dB à +12 dB", desc: "Gain appliqué aux transitoires fortissimo", modulatable: true }
    ],
    tips: "Utilisez-le pour insérer un chorus ou un délai stéréo sur les queues de réverbération uniquement, sans noyer le son direct."
  },
  {
    id: "spectral_freq_split",
    category: "spectral",
    title: "Freq Split (Spectral Suite)",
    subtitle: "Répartiteur spectral 4 bandes Linkwitz-Riley",
    chapter: "Chapitre 21.3 • Spectral Suite",
    desc: "Freq Split fractionne le spectre complet en 4 zones de fréquences indépendantes (Basse, Bas-Médium, Haut-Médium, Aigu) avec des filtres de coupure à phase linéaire sans déphasage destructif.",
    parameters: [
      { name: "Basse (< 250Hz)", range: "-24 dB à +6 dB", desc: "Sous-basses et fondamentale du kick/basse", modulatable: true },
      { name: "Bas-Médium (250-1200Hz)", range: "-24 dB à +6 dB", desc: "Chaleur harmonique, corps des voix et synthétiseurs", modulatable: true },
      { name: "Haut-Médium (1.2k-5kHz)", range: "-24 dB à +6 dB", desc: "Présence, clarté vocale et articulation rythmique", modulatable: true },
      { name: "Aigu (> 5kHz)", range: "-24 dB à +6 dB", desc: "Air, brillance, cymbales et harmoniques supérieures", modulatable: true }
    ],
    tips: "Modulez le filtre de coupure avec un LFO pour créer des effets de balayage spectral polyphonique fascinants."
  },
  {
    id: "spectral_harmonic_split",
    category: "spectral",
    title: "Harmonic Split (Spectral Suite)",
    subtitle: "Décomposition spectrale harmoniques paires, impaires et bruit",
    chapter: "Chapitre 21.4 • Spectral Suite",
    desc: "Harmonic Split décompose tout son en 3 composantes acoustiques fondamentales : les harmoniques paires (octaves, chaleur tubulaire), les harmoniques impaires (quintates, éclat, grain mordant) et le bruit inharmonique (souffle, frottements de corde, bruit d'archet).",
    parameters: [
      { name: "Harmoniques Impaires", range: "0% à 100%", desc: "Niveau des partiels 3, 5, 7, 9... (couleur agressive)", modulatable: true },
      { name: "Harmoniques Paires", range: "0% à 100%", desc: "Niveau des partiels 2, 4, 6, 8... (rondeur musicale)", modulatable: true },
      { name: "Bruit / Inharmonique", range: "0% à 100%", desc: "Part résiduelle sans hauteur tonale déterminée", modulatable: true }
    ],
    tips: "Permet de purifier un instrument à vent ou de donner un punch colossal à une basse analogique."
  },

  // ── INSTRUMENTS (Chapter 16) ──
  {
    id: "inst_polymer",
    category: "instruments",
    title: "Polymer (Synthétiseur Hybride)",
    subtitle: "Architecture modulaire de synthèse soustractive et wavetable",
    chapter: "Chapitre 16.3 • Instruments",
    desc: "Polymer est le synthétiseur hybride phare combinant des oscillateurs wavetables avec morphing temps réel, des filtres modélisés analogiques (ladder 24 dB, SVF, comb) et des générateurs d'enveloppe rapides.",
    parameters: [
      { name: "Morphing WT", range: "0% à 100%", desc: "Interpolation dans la table d'ondes 3D", modulatable: true },
      { name: "Cutoff Filtre", range: "20 Hz à 20 kHz", desc: "Fréquence de coupure du filtre modulaire", modulatable: true },
      { name: "Résonance Q", range: "0.1 à 10.0", desc: "Pic de résonance autour de la fréquence de coupure", modulatable: true }
    ],
    tips: "Connectez un modulateur 'Curves' sur le Morphing WT pour des balayages de timbre ultra-expressifs."
  },
  {
    id: "inst_drum_machine",
    category: "instruments",
    title: "Drum Machine 16",
    subtitle: "Matrice de 16 pads de percussion avec traitement par voie",
    chapter: "Chapitre 16.1 • Instruments",
    desc: "Drum Machine offre 16 pads configurables individuellement avec synthèse analogique de grosse caisse, caisse claire, charlestons et chargement d'échantillons PCM. Chaque pad dispose de son propre volume, panoramique et envoi FX.",
    parameters: [
      { name: "Pad Pitch", range: "-24 à +24 st", desc: "Hauteur de tonalité du son de percussion", modulatable: true },
      { name: "Decay Enveloppe", range: "10 ms à 2.5 s", desc: "Longueur d'atténuation du sample/synthétiseur", modulatable: true }
    ],
    tips: "Activez le mode 'Choke Group' sur les charlestons fermés et ouverts pour un jeu réaliste."
  },

  // ── MODULATION SYSTEM (Chapters 13 & 19) ──
  {
    id: "mod_lfo",
    category: "modulators",
    title: "LFO Modulateur",
    subtitle: "Oscillateur basse fréquence multi-formes d'onde",
    chapter: "Chapitre 19.1 • Modulateurs",
    desc: "Générateur d'oscillation basse fréquence capable d'animer n'importe quel paramètre d'un instrument, d'un effet ou d'une piste. Propose 5 formes d'onde mathématiques pures (Sinus, Triangle, Dent de scie, Carré, Random Sample & Hold) et synchronisation au tempo.",
    parameters: [
      { name: "Fréquence / Vitesse", range: "0.01 Hz à 20 Hz ou 8/1 à 1/64T", desc: "Vitesse d'oscillation en Hertz ou division rythmique", modulatable: true },
      { name: "Phase", range: "0° à 360°", desc: "Décalage angulaire de départ de l'onde", modulatable: true },
      { name: "Profondeur", range: "-100% à +100%", desc: "Intensité d'excursion sur le paramètre cible", modulatable: false }
    ],
    tips: "Dans Music Studio, cliquez sur [+ LIER] sur n'importe quel curseur pour lier instantanément le LFO."
  },
  {
    id: "mod_curves",
    category: "modulators",
    title: "Curves Modulateur LFO Graphique",
    subtitle: "Tracé vectoriel de courbes d'ondes personnalisées",
    chapter: "Chapitre 19.4 • Modulateurs",
    desc: "Curves permet de dessiner librement une courbe de modulation complexe point par point avec des tensions de Bézier ajustables, des boucles rythmiques et des rebonds.",
    parameters: [
      { name: "Vitesse", range: "Synchronisée aux mesures (1m, 2m, 4m, 1/2...)", desc: "Durée d'une révolution complète de la courbe", modulatable: true }
    ],
    tips: "Idéal pour reproduire des courbes de sidechain pumping sophistiquées sans compresseur physique."
  },

  // ── THE GRID MODULAR (Chapter 17) ──
  {
    id: "the_grid_poly",
    category: "the_grid",
    title: "The Grid • Poly Grid & FX Grid",
    subtitle: "Environnement de synthèse et d'effets visuel modulaire 100% DSP",
    chapter: "Chapitre 17 • The Grid",
    desc: "The Grid est l'environnement modulaire natif permettant de câbler des oscillateurs, filtres, enveloppes, processeurs mathématiques et modules de distorsion sans contrainte de routage fixe. Le traitement s'effectue avec un suréchantillonnage 4x et une latence nulle.",
    parameters: [
      { name: "Câbles de Patch", range: "Audio (orange), Contrôle (cyan), Logique (jaune)", desc: "Liaisons physiques entre sorties et entrées de modules", modulatable: false },
      { name: "Suréchantillonnage", range: "1x, 2x, 4x, 8x", desc: "Qualité de calcul anti-repliement (anti-aliasing)", modulatable: false }
    ],
    tips: "Déposez un module 'Value' pour contrôler plusieurs oscillateurs simultanément depuis une seule commande Macro."
  },

  // ── COMPING & AUDIO WARP (Chapters 7 & 9) ──
  {
    id: "comping_takes",
    category: "comping_warp",
    title: "Audio Comping & Lignes de Prises",
    subtitle: "Assemblage transparent des meilleures prises vocales ou instrumentales",
    chapter: "Chapitre 9 & 10.1.4 • Comping",
    desc: "Le système de Comping permet d'enregistrer plusieurs passages successifs sur une même piste sans créer de désordre. Les sous-pistes de prises (Take Lanes) se déplient d'un clic. Le glisser-sélectionner (Swipe Comping) active instantanément les fragments choisis dans le résultat composite maître.",
    parameters: [
      { name: "Swipe Comping", range: "Sélection directe à la souris", desc: "Définition de la portion active d'une prise", modulatable: false },
      { name: "Touches Fléchées Haut/Bas", range: "Prise précédente / suivante", desc: "Permutation instantanée de prise pour la section active", modulatable: false }
    ],
    tips: "Cliquez sur l'icône de calques [Layers] sur la piste LR ou Drum Break pour ouvrir les sous-pistes de comping."
  },
  {
    id: "warp_modes",
    category: "comping_warp",
    title: "Modes Audio Warp & Time-Stretching",
    subtitle: "Moteurs d'élasticité temporelle et préservation des formants",
    chapter: "Chapitre 7 • Audio Editing",
    desc: "Music Studio intègre 6 algorithmes d'étirement temporel : Stretch (polyphonique standard), Stretch HD (haute fidélité avec correction de formants), Slice (découpage sur transitoires), Repitch (émulation de vitesse de bande analogique), Raw (lecture native sans étirement) et Cycle (synthèse wavetable).",
    parameters: [
      { name: "Pitch Shifting", range: "-24 à +24 demi-tons", desc: "Transposition chromatique indépendante du tempo", modulatable: true },
      { name: "Formants", range: "On / Off", desc: "Préservation du timbre acoustique naturel de la voix", modulatable: false }
    ],
    tips: "Utilisez 'Repitch' sur les samples de batterie vintage pour retrouver le grain de boîte à rythmes 12-bit SP-1200."
  },

  // ── OPÉRATEURS & MPE (Chapters 11 & 20) ──
  {
    id: "operators_system",
    category: "operators",
    title: "Opérateurs de Notes & Chance Stochastique",
    subtitle: "Séquençage génératif, conditions et polyrythmie",
    chapter: "Chapitre 11 & 20 • Opérateurs",
    desc: "Chaque note du Piano Roll peut être enrichie d'opérateurs stochastiques : Chance (probabilité de déclenchement 0-100%), Répétition (ratchets de 1 à 128 avec courbes de vélocité), Occurrence (conditions logiques de cycle : First, Not First, A:B) et Fill.",
    parameters: [
      { name: "Chance", range: "0% à 100%", desc: "Probabilité mathématique d'exécution de la note", modulatable: true },
      { name: "Répétition (Ratchet)", range: "1x à 16x", desc: "Multiplication rapide de déclenchement dans la durée de la note", modulatable: true },
      { name: "Occurrence", range: "Always, 1:2, 2:2, 1:4, Fill, !Fill", desc: "Condition d'activation selon le numéro de répétition de boucle", modulatable: false }
    ],
    tips: "Combinez un ratchet 3x avec une vélocité décroissante pour générer des roulements de caisse claire trap et amapiano percutants."
  },

  // ── RACCOURCIS CLAVIER PRO (Chapter 2.5) ──
  {
    id: "shortcuts_reference",
    category: "shortcuts",
    title: "Table Complète des Raccourcis Clavier",
    subtitle: "Commandes rapides pour le flux de travail de production studio",
    chapter: "Chapitre 2.5 • Raccourcis",
    desc: "Les raccourcis clavier essentiels de Music Studio DAW conformes aux standards professionnels de production :",
    parameters: [
      { name: "Espace", range: "Transport", desc: "Lecture / Pause du moteur audio", modulatable: false },
      { name: "F1 ou ?", range: "Aide", desc: "Ouvrir cette fenêtre d'aide et documentation interactive", modulatable: false },
      { name: "Ctrl+I", range: "Inspecteur", desc: "Afficher/Masquer le panneau d'inspection contextuel", modulatable: false },
      { name: "B", range: "Navigateur", desc: "Ouvrir le panneau du navigateur de composants", modulatable: false },
      { name: "Tab", range: "Vues", desc: "Alterner entre vue Arranger et vue Matrice Clip Launcher", modulatable: false },
      { name: "Ctrl+Z / Ctrl+Y", range: "Historique", desc: "Annuler / Rétablir la dernière action", modulatable: false },
      { name: "1 à 5", range: "Outils", desc: "1=Pointeur, 2=Durée, 3=Crayon, 4=Gomme, 5=Cutter", modulatable: false },
      { name: "Ctrl+D", range: "Édition", desc: "Dupliquer la sélection (Clip, Note, Piste)", modulatable: false },
      { name: "S", range: "Édition", desc: "Découper le clip à l'emplacement de la tête de lecture", modulatable: false }
    ],
    tips: "Maintenez la touche Alt enfoncée pendant le déplacement d'un point d'automation pour ajuster sa courbure de Bézier."
  }
];

export default function MusicStudioHelpView({ isOpen, onClose, initialCategory = "all" }) {
  const [selectedCat, setSelectedCat] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticleId, setSelectedArticleId] = useState(DAW_HELP_ARTICLES[0].id);

  const filteredArticles = useMemo(() => {
    return DAW_HELP_ARTICLES.filter((a) => {
      const matchCat = selectedCat === "all" || a.category === selectedCat;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.subtitle.toLowerCase().includes(q) ||
        a.desc.toLowerCase().includes(q) ||
        a.chapter.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [selectedCat, searchQuery]);

  const activeArticle = useMemo(() => {
    return (
      DAW_HELP_ARTICLES.find((a) => a.id === selectedArticleId) ||
      filteredArticles[0] ||
      DAW_HELP_ARTICLES[0]
    );
  }, [selectedArticleId, filteredArticles]);

  if (!isOpen) return null;

  return (
    <div
      data-testid="modal-daw-help-view"
      className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
    >
      <div className="w-full max-w-5xl h-[85vh] bg-[#181513] border border-[#df9c43] rounded-2xl shadow-[0_0_50px_rgba(223,156,67,0.3)] flex flex-col overflow-hidden text-zinc-200">
        {/* ── HEADER STRIP ── */}
        <div className="h-14 px-6 bg-[#241808] border-b border-[#df9c43]/40 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#df9c43]/20 border border-[#df9c43] flex items-center justify-center text-[#df9c43] shadow-[0_0_10px_rgba(223,156,67,0.4)]">
              <HelpCircle size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-sm text-white tracking-wide">
                  Aide Interactive & Guide Bitwig Studio (French Reference)
                </h2>
                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-[#df9c43] text-black">
                  OFFICIEL 5.2 / 6.0
                </span>
              </div>
              <p className="text-[10px] text-[#eaaf5d] font-mono">
                Référence intégrale du Guide Utilisateur Français • Zero Mock • Traitement Audio Réel
              </p>
            </div>
          </div>

          {/* Search bar inside header */}
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Rechercher un concept, effet, paramètre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-3 bg-black/50 border border-white/10 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#df9c43]"
              />
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-black/40 hover:bg-red-950/60 border border-white/10 hover:border-red-500 text-zinc-400 hover:text-red-400 flex items-center justify-center transition"
              title="Fermer la fenêtre d'aide"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── CATEGORIES TAB BAR ── */}
        <div className="h-11 px-4 bg-[#141210] border-b border-[#2b2520] flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-shrink-0">
          {DAW_HELP_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSel = selectedCat === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCat(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap ${
                  isSel
                    ? "bg-[#241808] border border-[#df9c43] text-[#eaaf5d] shadow-[0_0_10px_rgba(223,156,67,0.3)] font-bold"
                    : "text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                <Icon size={13} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── MAIN CONTENT DUAL-PANE BODY ── */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Left list of articles */}
          <div className="w-72 bg-[#12100e] border-r border-[#2b2520] flex flex-col flex-shrink-0">
            <div className="p-3 text-[10px] font-mono uppercase tracking-wider text-zinc-400 border-b border-white/5 flex items-center justify-between">
              <span>Articles ({filteredArticles.length})</span>
              <span className="text-[#df9c43]">Catégorie : {selectedCat}</span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-white/5">
              {filteredArticles.map((art) => {
                const isSel = activeArticle.id === art.id;
                return (
                  <div
                    key={art.id}
                    onClick={() => setSelectedArticleId(art.id)}
                    className={`p-3 cursor-pointer transition flex flex-col gap-1 ${
                      isSel
                        ? "bg-[#241808] border-l-4 border-l-[#df9c43] text-white"
                        : "hover:bg-white/5 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono text-[#eaaf5d] uppercase">
                        {art.chapter}
                      </span>
                      <ChevronRight size={11} className={isSel ? "text-[#df9c43]" : "opacity-40"} />
                    </div>
                    <span className="font-bold text-xs truncate text-white">{art.title}</span>
                    <span className="text-[10px] text-zinc-400 line-clamp-1">{art.subtitle}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right detailed article view */}
          <div className="flex-1 bg-[#181513] overflow-y-auto p-6 space-y-6">
            {activeArticle && (
              <>
                {/* Article Header */}
                <div className="border-b border-[#2b2520] pb-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2 py-0.5 rounded text-[9.5px] font-mono font-bold bg-[#df9c43]/20 border border-[#df9c43] text-[#f5c277]">
                      {activeArticle.chapter}
                    </span>
                    <span className="text-zinc-400 text-xs font-mono">• Section Officielle</span>
                  </div>
                  <h1 className="text-2xl font-black text-white tracking-tight">
                    {activeArticle.title}
                  </h1>
                  <p className="text-sm text-[#eaaf5d] font-medium mt-1">
                    {activeArticle.subtitle}
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-400">
                    Présentation & Principe Acoustique
                  </h3>
                  <p className="text-sm leading-relaxed text-zinc-300 bg-[#12100e] p-4 rounded-xl border border-white/5">
                    {activeArticle.desc}
                  </p>
                </div>

                {/* Parameters table */}
                {activeArticle.parameters && activeArticle.parameters.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                      <span>Paramètres Principaux & Plages de Valeurs</span>
                      <span className="text-emerald-400 text-[10px] font-mono lowercase">
                        • 100% connectable aux modulateurs
                      </span>
                    </h3>
                    <div className="border border-white/10 rounded-xl overflow-hidden bg-[#12100e]">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#241808] text-[#eaaf5d] font-mono text-[10px] border-b border-white/10">
                          <tr>
                            <th className="py-2 px-3">PARAMÈTRE</th>
                            <th className="py-2 px-3">PLAGE</th>
                            <th className="py-2 px-3">MODULABLE</th>
                            <th className="py-2 px-3">FONCTION</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-zinc-300">
                          {activeArticle.parameters.map((p, idx) => (
                            <tr key={idx} className="hover:bg-white/5">
                              <td className="py-2 px-3 font-bold text-white">{p.name}</td>
                              <td className="py-2 px-3 font-mono text-[#f5c277] text-[11px]">{p.range}</td>
                              <td className="py-2 px-3">
                                {p.modulatable ? (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
                                    OUI (Halo)
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-zinc-500 font-mono">Fixe</span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-zinc-400">{p.desc}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Practical Tip */}
                {activeArticle.tips && (
                  <div className="p-4 rounded-xl bg-[#241808]/80 border border-[#df9c43]/40 flex items-start gap-3 shadow-[0_0_20px_rgba(223,156,67,0.15)]">
                    <Sparkles size={18} className="text-[#df9c43] flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-[#f5c277] block uppercase tracking-wider mb-0.5">
                        Conseil de Mixage & Workflow Studio
                      </span>
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        {activeArticle.tips}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── FOOTER BAR ── */}
        <div className="h-10 px-6 bg-[#141210] border-t border-[#2b2520] flex items-center justify-between text-xs text-zinc-400 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[10px]">
              Touche de raccourci d'aide : <strong className="text-[#df9c43]">F1</strong> ou <strong className="text-[#df9c43]">?</strong>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => window.open("https://www.bitwig.com/learn/", "_blank")}
              className="text-[#eaaf5d] hover:text-[#f5c277] flex items-center gap-1 text-[11px] font-bold"
            >
              <span>Centre de Ressources Bitwig</span>
              <ExternalLink size={11} />
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1 rounded bg-[#241808] hover:bg-[#33210b] border border-[#df9c43] text-[#eaaf5d] font-bold text-[11px]"
            >
              Fermer [Échap]
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
