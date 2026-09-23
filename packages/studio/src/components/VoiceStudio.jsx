"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

const QUICK_PROMPTS = [
  {
    title: "🎬 Bande-Annonce Épique",
    text: "Dans un monde où la lumière s'est éteinte, un seul espoir subsiste au cœur des ténèbres. L'heure du soulèvement est venue.",
  },
  {
    title: "🌌 Cyberpunk & Sci-Fi",
    text: "Protocole de synchronisation neuronal activé. Bienvenue dans la zone franche de Neo-Sahel. Préparez-vous à l'immersion.",
  },
  {
    title: "🏛️ Documentaire Historique",
    text: "Pendant des siècles, ces sables ont gardé le secret d'une civilisation oubliée. Aujourd'hui, les vestiges refont surface.",
  },
  {
    title: "⚡ Spot Publicitaire Percutant",
    text: "La puissance sans compromis. Découvrez la nouvelle génération de création visuelle assistée par intelligence artificielle.",
  },
];

export default function VoiceStudio({ apiKey, onSendToMontage, onSendToLipSync }) {
  const [presets, setPresets] = useState([]);
  const [customVoices, setCustomVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [activeTab, setActiveTab] = useState("presets"); // 'presets' | 'custom' | 'history'

  // Speech Generation Parameters
  const [promptText, setPromptText] = useState(QUICK_PROMPTS[0].text);
  const [pitch, setPitch] = useState(0); // -20 to +20 Hz
  const [rate, setRate] = useState(0); // -50 to +50 %
  const [volume, setVolume] = useState(0); // -50 to +50 %
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [audioHistory, setAudioHistory] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);

  // Audio Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  // Clone Voice Modal State
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [cloneName, setCloneName] = useState("");
  const [cloneBaseVoice, setCloneBaseVoice] = useState("fr-FR-HenriNeural");
  const [clonePitch, setClonePitch] = useState(-5);
  const [cloneRate, setCloneRate] = useState(0);
  const [cloneDesc, setCloneDesc] = useState("");
  const [cloneAvatar, setCloneAvatar] = useState("🎙️✨");
  const [isCloning, setIsCloning] = useState(false);

  // Fetch voice catalog & audio history on mount
  const fetchVoices = useCallback(async () => {
    try {
      const res = await axios.get("/api/voice?action=list_voices");
      if (res.data?.ok) {
        setPresets(res.data.presets || []);
        setCustomVoices(res.data.custom || []);
        if (!selectedVoice && res.data.presets?.length > 0) {
          setSelectedVoice(res.data.presets[0]);
        }
      }
    } catch (err) {
      console.error("[VoiceStudio] Error loading voices:", err);
    }
  }, [selectedVoice]);

  const fetchAudioHistory = useCallback(async () => {
    try {
      const res = await axios.get("/api/voice?action=list_audio");
      if (res.data?.ok) {
        setAudioHistory(res.data.audio || []);
      }
    } catch (err) {
      console.error("[VoiceStudio] Error loading audio history:", err);
    }
  }, []);

  useEffect(() => {
    fetchVoices();
    fetchAudioHistory();
  }, [fetchVoices, fetchAudioHistory]);

  // Audio element listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
  }, [currentAudio]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newTime = Number(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Generate real audio TTS
  const handleGenerateVoice = async () => {
    if (!promptText.trim()) {
      setErrorMsg("Veuillez saisir un texte à vocaliser.");
      return;
    }
    setErrorMsg(null);
    setIsGenerating(true);

    try {
      const pitchStr = pitch >= 0 ? `+${pitch}Hz` : `${pitch}Hz`;
      const rateStr = rate >= 0 ? `+${rate}%` : `${rate}%`;
      const volStr = volume >= 0 ? `+${volume}%` : `${volume}%`;

      const voiceId = selectedVoice?.id || "fr-FR-HenriNeural";
      const voiceName = selectedVoice?.name || "Voix Standard";

      const res = await axios.post("/api/voice", {
        action: "generate",
        text: promptText,
        voice: selectedVoice?.baseVoice || voiceId,
        voiceName: voiceName,
        pitch: pitchStr,
        rate: rateStr,
        volume: volStr,
      });

      if (res.data?.ok) {
        const audioObj = {
          url: res.data.url,
          filename: res.data.filename,
          duration: res.data.duration,
          metrics: res.data.metrics,
          text: promptText,
          voiceName: voiceName,
        };
        setCurrentAudio(audioObj);
        fetchAudioHistory();
        if (audioRef.current) {
          audioRef.current.src = res.data.url;
          audioRef.current.play().catch(() => {});
          setIsPlaying(true);
        }
      } else {
        setErrorMsg(res.data?.error || "Échec de génération audio");
      }
    } catch (err) {
      console.error("[VoiceStudio] Generation error:", err);
      setErrorMsg(err.response?.data?.error || err.message || "Erreur de génération");
    } finally {
      setIsGenerating(false);
    }
  };

  // Create / Duplicate cloned voice
  const handleCreateClonedVoice = async (e) => {
    e.preventDefault();
    if (!cloneName.trim()) return;
    setIsCloning(true);

    try {
      const pitchStr = clonePitch >= 0 ? `+${clonePitch}Hz` : `${clonePitch}Hz`;
      const rateStr = cloneRate >= 0 ? `+${cloneRate}%` : `${cloneRate}%`;

      const res = await axios.post("/api/voice", {
        action: "clone_voice",
        name: cloneName,
        baseVoice: cloneBaseVoice,
        pitch: pitchStr,
        rate: rateStr,
        description: cloneDesc || "Profil vocal personnalisé",
        avatar: cloneAvatar || "🎙️✨",
      });

      if (res.data?.ok) {
        await fetchVoices();
        setSelectedVoice(res.data.voice);
        setIsCloneModalOpen(false);
        setCloneName("");
        setCloneDesc("");
        setActiveTab("custom");
      }
    } catch (err) {
      console.error("[VoiceStudio] Clone error:", err);
    } finally {
      setIsCloning(false);
    }
  };

  // Delete cloned voice
  const handleDeleteCustomVoice = async (voiceId) => {
    if (!confirm("Voulez-vous supprimer ce profil de voix personnalisée ?")) return;
    try {
      const res = await axios.delete(`/api/voice?id=${voiceId}`);
      if (res.data?.ok) {
        await fetchVoices();
        if (selectedVoice?.id === voiceId) {
          setSelectedVoice(presets[0] || null);
        }
      }
    } catch (err) {
      console.error("[VoiceStudio] Delete error:", err);
    }
  };

  // Estimate duration
  const wordCount = promptText.trim() ? promptText.trim().split(/\s+/).length : 0;
  const estimatedDurationSec = Math.max(1.0, (wordCount / 2.6)).toFixed(1);

  return (
    <div className="h-full flex flex-col bg-[#070605] text-white select-none overflow-hidden">
      {/* ── Top Header ── */}
      <div className="flex-shrink-0 h-16 border-b border-[#df9c43]/15 bg-[#0d0b09]/90 px-6 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-[#df9c43]/20 border border-[#df9c43]/40 flex items-center justify-center text-lg shadow-[0_0_12px_rgba(223,156,67,0.25)]">
            🎙️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-wide text-white uppercase">
                Voice Lab & Sound Studio
              </h1>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#df9c43]/20 text-[#f5c277] border border-[#df9c43]/40">
                Neural TTS 48kHz
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Latence &lt; 1.2s
              </span>
            </div>
            <p className="text-xs text-white/50">
              Synthèse vocale pour voix off de films, duplication de timbres et intégration directe dans la timeline du Studio Video.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCloneModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#df9c43]/30 to-[#f5c277]/20 hover:from-[#df9c43]/50 hover:to-[#f5c277]/35 border border-[#df9c43]/40 text-[#f5c277] text-xs font-bold transition-all shadow-sm hover:shadow-[0_0_15px_rgba(223,156,67,0.25)]"
          >
            <span>✨</span>
            <span>Cloner / Dupliquer une Voix</span>
          </button>
        </div>
      </div>

      {/* ── Main 2-Column Studio Body ── */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* ── Left Column: Voice Catalog & Cloned Voices ── */}
        <div className="w-80 md:w-96 flex-shrink-0 border-r border-[#df9c43]/15 bg-[#0a0806] flex flex-col min-h-0">
          {/* Sub-tabs */}
          <div className="flex-shrink-0 p-3 border-b border-white/[0.06] flex gap-1.5">
            <button
              onClick={() => setActiveTab("presets")}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "presets"
                  ? "bg-[#df9c43]/20 text-[#f5c277] border border-[#df9c43]/40"
                  : "text-white/60 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <span>🎙️</span>
              <span>Recommandées ({presets.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("custom")}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "custom"
                  ? "bg-[#df9c43]/20 text-[#f5c277] border border-[#df9c43]/40"
                  : "text-white/60 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <span>✨</span>
              <span>Clonnées ({customVoices.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "history"
                  ? "bg-[#df9c43]/20 text-[#f5c277] border border-[#df9c43]/40"
                  : "text-white/60 hover:text-white hover:bg-white/[0.04]"
              }`}
              title="Bibliothèque des audios générés"
            >
              <span>📁</span>
              <span>({audioHistory.length})</span>
            </button>
          </div>

          {/* Voice Cards List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
            {activeTab === "presets" &&
              presets.map((voice) => {
                const isSelected = selectedVoice?.id === voice.id;
                return (
                  <div
                    key={voice.id}
                    onClick={() => setSelectedVoice(voice)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer relative group ${
                      isSelected
                        ? "bg-[#df9c43]/15 border-[#df9c43] shadow-[0_0_15px_rgba(223,156,67,0.18)]"
                        : "bg-[#110e0b] border-white/[0.06] hover:border-[#df9c43]/40 hover:bg-[#16120e]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-105 transition-transform">
                        {voice.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold text-white truncate group-hover:text-[#f5c277] transition-colors">
                            {voice.name}
                          </h4>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-white/[0.06] text-white/70">
                            {voice.lang}
                          </span>
                          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-[#df9c43]/15 text-[#f5c277]">
                            {voice.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-white/50 mt-1.5 line-clamp-2 leading-relaxed">
                          {voice.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}

            {activeTab === "custom" && (
              <>
                {customVoices.length === 0 ? (
                  <div className="py-12 text-center text-white/40 text-xs px-4">
                    <p className="text-2xl mb-2">🎭</p>
                    <p className="font-semibold text-white/60">Aucune voix clonnée pour l'instant.</p>
                    <p className="mt-1 text-[11px]">Cliquez sur « Cloner / Dupliquer une Voix » en haut pour créer votre premier timbre cinéma.</p>
                  </div>
                ) : (
                  customVoices.map((voice) => {
                    const isSelected = selectedVoice?.id === voice.id;
                    return (
                      <div
                        key={voice.id}
                        onClick={() => setSelectedVoice(voice)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer relative group ${
                          isSelected
                            ? "bg-[#df9c43]/15 border-[#df9c43] shadow-[0_0_15px_rgba(223,156,67,0.18)]"
                            : "bg-[#110e0b] border-white/[0.06] hover:border-[#df9c43]/40 hover:bg-[#16120e]"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#df9c43]/20 border border-[#df9c43]/40 flex items-center justify-center text-xl flex-shrink-0">
                            {voice.avatar || "🎙️"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="text-xs font-bold text-white truncate text-[#f5c277]">
                                {voice.name}
                              </h4>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCustomVoice(voice.id);
                                }}
                                title="Supprimer cette voix clonnée"
                                className="text-white/30 hover:text-red-400 p-1 text-xs transition-colors"
                              >
                                ✕
                              </button>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                Clonnée
                              </span>
                              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-white/[0.06] text-white/70">
                                Pitch: {voice.defaultPitch}
                              </span>
                            </div>
                            <p className="text-[11px] text-white/50 mt-1.5 line-clamp-2 leading-relaxed">
                              {voice.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </>
            )}

            {activeTab === "history" && (
              <>
                {audioHistory.length === 0 ? (
                  <div className="py-12 text-center text-white/40 text-xs px-4">
                    <p className="text-2xl mb-2">📁</p>
                    <p>Aucun fichier audio dans la bibliothèque.</p>
                  </div>
                ) : (
                  audioHistory.map((item) => (
                    <div
                      key={item.id || item.filename}
                      onClick={() => {
                        setCurrentAudio({
                          url: item.url,
                          filename: item.filename,
                          duration: item.duration || 3.0,
                          text: item.prompt,
                          voiceName: item.modelName || "Audio Synthétisé",
                          metrics: item.metrics,
                        });
                        if (audioRef.current) {
                          audioRef.current.src = item.url;
                          audioRef.current.play().catch(() => {});
                          setIsPlaying(true);
                        }
                      }}
                      className="p-3 rounded-xl border border-white/[0.06] bg-[#110e0b] hover:bg-[#16120e] hover:border-[#df9c43]/40 cursor-pointer transition-all flex items-center justify-between group"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs">🎵</span>
                          <p className="text-xs font-bold text-white truncate group-hover:text-[#f5c277]">
                            {item.modelName || item.filename}
                          </p>
                        </div>
                        <p className="text-[10px] text-white/50 truncate mt-0.5">
                          {item.prompt || item.filename}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[9px] text-white/40">
                          <span>⏱️ {item.duration ? `${item.duration}s` : "Audio"}</span>
                          <span>•</span>
                          <span>{item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : "Récent"}</span>
                        </div>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-white/[0.08] group-hover:bg-[#df9c43]/20 group-hover:text-[#f5c277] flex items-center justify-center text-xs flex-shrink-0 transition-colors">
                        ▶
                      </div>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Right Column: Text Prompter, Fine-tuning & Waveform Monitor ── */}
        <div className="flex-1 flex flex-col min-h-0 bg-[#070605] overflow-y-auto custom-scrollbar p-6 space-y-6">
          {/* Active Voice Banner */}
          {selectedVoice && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#14100c] via-[#1a1510] to-[#120f0c] border border-[#df9c43]/25 shadow-lg flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#df9c43]/20 border border-[#df9c43]/40 flex items-center justify-center text-2xl shadow-[0_0_15px_rgba(223,156,67,0.25)]">
                  {selectedVoice.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-extrabold text-white">
                      {selectedVoice.name}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#df9c43]/20 text-[#f5c277] border border-[#df9c43]/30">
                      {selectedVoice.category}
                    </span>
                  </div>
                  <p className="text-xs text-white/60 mt-0.5">
                    {selectedVoice.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setCloneBaseVoice(selectedVoice.baseVoice || selectedVoice.id);
                    setCloneName(`${selectedVoice.name.split("—")[0].trim()} (Variante)`);
                    setIsCloneModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white/80 hover:text-white text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  <span>📋</span>
                  <span>Dupliquer ce Timbre</span>
                </button>
              </div>
            </div>
          )}

          {/* Quick Script Chips */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-white/60">
                Templates de Narration & Scripts Scène
              </span>
              <span className="text-xs text-white/40">
                {wordCount} mots • ~{estimatedDurationSec}s estimées
              </span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {QUICK_PROMPTS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => setPromptText(q.text)}
                  className="p-2.5 rounded-xl border border-white/[0.08] bg-[#110e0b] hover:border-[#df9c43]/40 hover:bg-[#16120e] text-left transition-all group"
                >
                  <div className="text-xs font-bold text-white/90 group-hover:text-[#f5c277] transition-colors truncate">
                    {q.title}
                  </div>
                  <div className="text-[10px] text-white/40 truncate mt-0.5">
                    {q.text}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Main Script Textarea */}
          <div className="flex flex-col space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-white/70 flex items-center justify-between">
              <span>Texte du Script Vocale (TTS Haute-Fidélité)</span>
              <button
                onClick={() => setPromptText("")}
                className="text-white/40 hover:text-white text-[11px] font-normal transition-colors"
              >
                Effacer
              </button>
            </label>
            <textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              rows={4}
              placeholder="Écrivez ou collez votre script de narration cinéma ici..."
              className="w-full bg-[#110e0b] border border-[#df9c43]/25 focus:border-[#df9c43] rounded-2xl p-4 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-[#df9c43] transition-all resize-none shadow-inner"
            />
          </div>

          {/* Acoustic Controls: Pitch, Rate, Volume */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-[#110e0b] border border-white/[0.06]">
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-bold text-white/70">Hauteur (Pitch)</span>
                <span className="font-extrabold text-[#f5c277]">{pitch >= 0 ? `+${pitch}Hz` : `${pitch}Hz`}</span>
              </div>
              <input
                type="range"
                min="-20"
                max="20"
                step="1"
                value={pitch}
                onChange={(e) => setPitch(Number(e.target.value))}
                className="w-full accent-[#df9c43] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-white/30 mt-1">
                <span>Grave (-20Hz)</span>
                <span>Neutre</span>
                <span>Aigu (+20Hz)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-bold text-white/70">Vitesse d'Élocution (Rate)</span>
                <span className="font-extrabold text-[#f5c277]">{rate >= 0 ? `+${rate}%` : `${rate}%`}</span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                step="5"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-full accent-[#df9c43] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-white/30 mt-1">
                <span>Lent (-50%)</span>
                <span>1.0x</span>
                <span>Rapide (+50%)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-bold text-white/70">Volume d'Émission</span>
                <span className="font-extrabold text-[#f5c277]">{volume >= 0 ? `+${volume}%` : `${volume}%`}</span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                step="5"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full accent-[#df9c43] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-white/30 mt-1">
                <span>-50%</span>
                <span>Standard</span>
                <span>+50%</span>
              </div>
            </div>
          </div>

          {/* Action Trigger Button */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/50 text-red-300 text-xs flex items-center justify-between">
              <span>⚠️ {errorMsg}</span>
              <button onClick={() => setErrorMsg(null)} className="text-red-400 font-bold ml-2">✕</button>
            </div>
          )}

          <div className="flex items-center gap-4">
            <button
              onClick={handleGenerateVoice}
              disabled={isGenerating || !promptText.trim()}
              className={`flex-1 py-3.5 px-6 rounded-2xl font-black text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-3 shadow-lg ${
                isGenerating || !promptText.trim()
                  ? "bg-white/[0.05] text-white/30 border border-white/10 cursor-not-allowed"
                  : "bg-gradient-to-r from-[#df9c43] to-[#b37424] hover:from-[#f5c277] hover:to-[#df9c43] text-black font-extrabold border border-[#f5c277]/50 shadow-[0_0_25px_rgba(223,156,67,0.3)] hover:shadow-[0_0_35px_rgba(223,156,67,0.5)] transform active:scale-[0.99]"
              }`}
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                  <span>Synthèse Vocale en cours...</span>
                </>
              ) : (
                <>
                  <span className="text-lg">🎙️</span>
                  <span>Générer la Voix Réelle (Edge TTS 48kHz)</span>
                </>
              )}
            </button>
          </div>

          {/* ── Audio Output Monitor & Waveform Player ── */}
          {currentAudio && (
            <div className="p-5 rounded-2xl bg-gradient-to-b from-[#16120e] to-[#0f0c09] border border-[#df9c43]/35 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#df9c43]/20 border border-[#df9c43]/40 flex items-center justify-center text-xl shadow-[0_0_12px_rgba(223,156,67,0.2)]">
                    🔊
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{currentAudio.voiceName}</span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Prêt pour le Studio Video
                      </span>
                    </h4>
                    <p className="text-xs text-white/50 truncate max-w-lg mt-0.5">
                      "{currentAudio.text}"
                    </p>
                  </div>
                </div>

                <audio ref={audioRef} src={currentAudio.url} preload="auto" />
              </div>

              {/* Player Scrubber & Time */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-3">
                  <button
                    onClick={togglePlayPause}
                    className="w-10 h-10 rounded-full bg-[#df9c43] text-black font-extrabold flex items-center justify-center hover:bg-[#f5c277] transition-all shadow-[0_0_15px_rgba(223,156,67,0.3)] flex-shrink-0"
                  >
                    {isPlaying ? "⏸" : "▶"}
                  </button>

                  <div className="flex-1">
                    <input
                      type="range"
                      min="0"
                      max={duration || currentAudio.duration || 1}
                      step="0.05"
                      value={currentTime}
                      onChange={handleSeek}
                      className="w-full accent-[#df9c43] cursor-pointer"
                    />
                  </div>

                  <span className="text-xs font-mono text-[#f5c277] font-bold w-20 text-right">
                    {currentTime.toFixed(1)}s / {(duration || currentAudio.duration || 0).toFixed(1)}s
                  </span>
                </div>
              </div>

              {/* Telemetry row */}
              {currentAudio.metrics && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-white/[0.06] text-[11px]">
                  <div className="p-2 rounded-lg bg-black/40 border border-white/[0.04]">
                    <span className="text-white/40 block text-[9px] uppercase">Temps de Calcul</span>
                    <span className="text-[#f5c277] font-bold">{currentAudio.metrics.generationTimeSeconds}s</span>
                  </div>
                  <div className="p-2 rounded-lg bg-black/40 border border-white/[0.04]">
                    <span className="text-white/40 block text-[9px] uppercase">Résolution Audio</span>
                    <span className="text-white font-bold">{currentAudio.metrics.resolution}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-black/40 border border-white/[0.04]">
                    <span className="text-white/40 block text-[9px] uppercase">Jetons Synthétisés</span>
                    <span className="text-white font-bold">{currentAudio.metrics.totalTokens} tokens</span>
                  </div>
                  <div className="p-2 rounded-lg bg-black/40 border border-white/[0.04]">
                    <span className="text-white/40 block text-[9px] uppercase">Coût</span>
                    <span className="text-emerald-400 font-bold">{currentAudio.metrics.cost}</span>
                  </div>
                </div>
              )}

              {/* Direct Studio Routing Actions */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => {
                    if (onSendToMontage) {
                      onSendToMontage(currentAudio);
                    }
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#df9c43]/20 hover:bg-[#df9c43]/35 border border-[#df9c43]/40 text-[#f5c277] text-xs font-extrabold transition-all flex items-center justify-center gap-2"
                  title="Envoyer au Studio Video"
                >
                  <span>🎬</span>
                  <span>Envoyer au Studio Video</span>
                </button>

                <button
                  onClick={() => {
                    if (onSendToLipSync) {
                      onSendToLipSync(currentAudio);
                    } else {
                      alert(`Audio "${currentAudio.filename}" prêt pour le Lip-Sync.`);
                    }
                  }}
                  className="py-2.5 px-4 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-200 text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <span>🗣️</span>
                  <span>Utiliser dans Lip-Sync</span>
                </button>

                <a
                  href={currentAudio.url}
                  download={currentAudio.filename}
                  className="py-2.5 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <span>⬇️</span>
                  <span>Télécharger MP3</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Clone / Duplicate Voice Modal ── */}
      {isCloneModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#14100c] border border-[#df9c43]/35 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">✨</span>
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                  Cloner / Dupliquer un Profil Vocal
                </h3>
              </div>
              <button
                onClick={() => setIsCloneModalOpen(false)}
                className="text-white/40 hover:text-white text-base"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateClonedVoice} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white/70 mb-1">
                  Nom du Profil Vocal Clonnée
                </label>
                <input
                  type="text"
                  value={cloneName}
                  onChange={(e) => setCloneName(e.target.value)}
                  placeholder="Ex: Marcus — Narrateur Sombre Cyberpunk"
                  className="w-full bg-[#0a0806] border border-white/10 focus:border-[#df9c43] rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-white/70 mb-1">
                    Voix de Base (Acoustique)
                  </label>
                  <select
                    value={cloneBaseVoice}
                    onChange={(e) => setCloneBaseVoice(e.target.value)}
                    className="w-full bg-[#0a0806] border border-white/10 focus:border-[#df9c43] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    {presets.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name.split("—")[0].trim()} ({p.lang.split(" ")[0]})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/70 mb-1">
                    Avatar / Icône
                  </label>
                  <input
                    type="text"
                    value={cloneAvatar}
                    onChange={(e) => setCloneAvatar(e.target.value)}
                    className="w-full bg-[#0a0806] border border-white/10 focus:border-[#df9c43] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3 p-3 rounded-xl bg-black/40 border border-white/[0.06]">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white/70">Ajustement Pitch :</span>
                    <span className="text-[#f5c277] font-bold">{clonePitch >= 0 ? `+${clonePitch}Hz` : `${clonePitch}Hz`}</span>
                  </div>
                  <input
                    type="range"
                    min="-20"
                    max="20"
                    value={clonePitch}
                    onChange={(e) => setClonePitch(Number(e.target.value))}
                    className="w-full accent-[#df9c43] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white/70">Ajustement Débit :</span>
                    <span className="text-[#f5c277] font-bold">{cloneRate >= 0 ? `+${cloneRate}%` : `${cloneRate}%`}</span>
                  </div>
                  <input
                    type="range"
                    min="-40"
                    max="40"
                    value={cloneRate}
                    onChange={(e) => setCloneRate(Number(e.target.value))}
                    className="w-full accent-[#df9c43] cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-white/70 mb-1">
                  Description / Registre d'Émotion
                </label>
                <textarea
                  value={cloneDesc}
                  onChange={(e) => setCloneDesc(e.target.value)}
                  placeholder="Voix mystérieuse, débit lent pour scènes dramatiques..."
                  rows={2}
                  className="w-full bg-[#0a0806] border border-white/10 focus:border-[#df9c43] rounded-xl p-2.5 text-xs text-white placeholder-white/30 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCloneModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white/70 text-xs font-bold transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isCloning || !cloneName.trim()}
                  className="px-5 py-2 rounded-xl bg-[#df9c43] hover:bg-[#f5c277] text-black text-xs font-black transition-all shadow-[0_0_15px_rgba(223,156,67,0.3)] disabled:opacity-40"
                >
                  {isCloning ? "Clonage en cours..." : "Enregistrer la Voix Clonnée"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
