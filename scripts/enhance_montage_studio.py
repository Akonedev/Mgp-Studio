import re

FILE_PATH = "packages/studio/src/components/MontageStudio.jsx"

with open(FILE_PATH, "r", encoding="utf-8") as f:
    code = f.read()

# 1. Replace all /assets/davinci/ with /assets/studio_video/
code = code.replace("/assets/davinci/", "/assets/studio_video/")

# 2. Add extra state declarations after const [isSnapping, setIsSnapping] = useState(true);
old_snapping = '  const [isSnapping, setIsSnapping] = useState(true);'
new_states = """  const [isSnapping, setIsSnapping] = useState(true);

  // ── Track Visibility, Mute & Lock State ──
  const [trackVisibility, setTrackVisibility] = useState({ V3: true, V2: true, V1: true });
  const [trackMute, setTrackMute] = useState({ A1: false, A2: false, A3: false, A4: false });
  const [trackLock, setTrackLock] = useState({ V3: false, V2: false, V1: false, A1: false, A2: false, A3: false, A4: false });

  // ── Quick Grade State for Inspector Effects Tab ──
  const [quickGrade, setQuickGrade] = useState({ exposure: 0.0, contrast: 1.0, saturation: 1.0, temp: 0 });

  // ── Scopes Display Mode for Color Page ──
  const [scopesMode, setScopesMode] = useState("parade"); // 'parade' | 'waveform' | 'vectorscope'

  // ── Photo Development State for Photo Page ──
  const [photoDev, setPhotoDev] = useState({ exposure: 0.0, contrast: 1.0, temp: 0, saturation: 1.0 });

  // ── Fairlight Mixer Channels State ──
  const [fairlightMixer, setFairlightMixer] = useState({
    A1: { vol: -14, pan: 0, mute: false, solo: false },
    A2: { vol: -8, pan: 0, mute: false, solo: false },
    A3: { vol: -18, pan: 0, mute: false, solo: false },
    A4: { vol: -12, pan: 0, mute: false, solo: false },
    Master: { vol: -0.3, pan: 0, mute: false, solo: false },
  });"""

if old_snapping in code:
    code = code.replace(old_snapping, new_states, 1)
    print("[1/10] Added track and mixer states successfully.")
else:
    print("Warning: old_snapping not found")

# 3. Update Record Monitor filter and track visibility
old_monitor_filter = """                        transform: `scale(${videoZoom}) translate(${videoPosX}px, ${videoPosY}px) rotate(${videoRot}deg)`,
                        opacity: videoOpacity / 100,
                        filter: `brightness(${1 + (colorWheels.light.exp || 0) * 0.2}) contrast(${1 + (colorWheels.shadow.exp || 0) * 0.2}) saturate(${colorWheels.global.sat})`,"""

new_monitor_filter = """                        transform: `scale(${videoZoom}) translate(${videoPosX}px, ${videoPosY}px) rotate(${videoRot}deg)`,
                        opacity: videoOpacity / 100,
                        filter: `brightness(${1 + (colorWheels.light.exp || 0) * 0.15 + (quickGrade.exposure || 0) * 0.2}) contrast(${((colorWheels.shadow.exp ? 1 + colorWheels.shadow.exp * 0.15 : 1)) * (quickGrade.contrast || 1)}) saturate(${(colorWheels.global.sat || 1) * (quickGrade.saturation || 1)}) hue-rotate(${quickGrade.temp * 0.5}deg)`,"""

if old_monitor_filter in code:
    code = code.replace(old_monitor_filter, new_monitor_filter, 1)
    print("[2/10] Updated Record Monitor live filter successfully.")
else:
    print("Warning: old_monitor_filter not found")

# Also wrap title overlay with trackVisibility.V3
old_title_overlay = """                      {/* Active Title Overlay from Track V3 */}
                      {activeTitleClip && ("""
new_title_overlay = """                      {/* Active Title Overlay from Track V3 (Visible only if track is active) */}
                      {activeTitleClip && trackVisibility.V3 && ("""
if old_title_overlay in code:
    code = code.replace(old_title_overlay, new_title_overlay, 1)
    print("[3/10] Wrapped Title overlay with trackVisibility.V3.")
else:
    print("Warning: old_title_overlay not found")

# 4. Inspector tabs list and buttons
old_tabs_bar = """                    {["video", "audio", "effects", "transitions", "file"].map(t => (
                      <button
                        key={t}
                        onClick={() => setInspectorTab(t)}
                        className={`px-2 py-0.5 rounded capitalize transition-all ${
                          inspectorTab === t ? "bg-amber-500/20 text-amber-400 font-bold" : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        {t === "audio" ? "🎵 Audio" : t === "video" ? "🎬 Vidéo" : t}
                      </button>
                    ))}"""

new_tabs_bar = """                    {["video", "audio", "titles", "effects", "transitions", "file"].map(t => (
                      <button
                        key={t}
                        onClick={() => setInspectorTab(t)}
                        className={`px-2 py-0.5 rounded capitalize transition-all ${
                          inspectorTab === t ? "bg-amber-500/20 text-amber-400 font-bold shadow-sm" : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        {t === "audio" ? "🎵 Audio" : t === "video" ? "🎬 Vidéo" : t === "titles" ? "✍️ Titres" : t === "effects" ? "✨ Effets" : t === "transitions" ? "✂️ Trans." : "📁 Fichier"}
                      </button>
                    ))}"""

if old_tabs_bar in code:
    code = code.replace(old_tabs_bar, new_tabs_bar, 1)
    print("[4/10] Updated Inspector tabs list with titles and effects.")
else:
    print("Warning: old_tabs_bar not found")

# 5. In inspector video tab: add trimming controls
old_video_opacity_end = """                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={videoOpacity}
                          onChange={e => {
                            const val = parseInt(e.target.value);
                            setVideoOpacity(val);
                            if (selectedClip) setVideoClips(prev => prev.map(c => c.id === selectedClip.id ? { ...c, opacity: val } : c));
                          }}
                          className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#df9c43]"
                        />
                      </div>
                    </div>
                  )}"""

new_video_opacity_end = """                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={videoOpacity}
                          onChange={e => {
                            const val = parseInt(e.target.value);
                            setVideoOpacity(val);
                            if (selectedClip) setVideoClips(prev => prev.map(c => c.id === selectedClip.id ? { ...c, opacity: val } : c));
                          }}
                          className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#df9c43]"
                        />
                      </div>

                      {/* Interactive Trimming Controls */}
                      <div className="pt-2 border-t border-white/5 space-y-2">
                        <span className="text-zinc-300 font-bold block text-[11px] uppercase tracking-wider">Rognage & Position Temporelle</span>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-zinc-400 block mb-1 text-[10px]">Début (s)</span>
                            <input
                              type="number"
                              step="0.1"
                              value={selectedClip?.start ?? 0}
                              onChange={e => {
                                const val = Math.max(0, parseFloat(e.target.value) || 0);
                                if (selectedClip) {
                                  setSelectedClip(prev => ({ ...prev, start: val }));
                                  setVideoClips(prev => prev.map(c => c.id === selectedClip.id ? { ...c, start: val } : c));
                                }
                              }}
                              className="w-full bg-black/60 border border-white/10 rounded px-2 py-1 text-zinc-200 font-mono text-[11px]"
                            />
                          </div>
                          <div>
                            <span className="text-zinc-400 block mb-1 text-[10px]">Durée (s)</span>
                            <input
                              type="number"
                              step="0.1"
                              value={selectedClip?.duration ?? 5}
                              onChange={e => {
                                const val = Math.max(0.5, parseFloat(e.target.value) || 1);
                                if (selectedClip) {
                                  setSelectedClip(prev => ({ ...prev, duration: val }));
                                  setVideoClips(prev => prev.map(c => c.id === selectedClip.id ? { ...c, duration: val } : c));
                                }
                              }}
                              className="w-full bg-black/60 border border-white/10 rounded px-2 py-1 text-zinc-200 font-mono text-[11px]"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              if (!selectedClip) return;
                              if (playheadTime >= selectedClip.start && playheadTime < selectedClip.start + selectedClip.duration) {
                                const newDur = Number((selectedClip.start + selectedClip.duration - playheadTime).toFixed(2));
                                const newStart = Number(playheadTime.toFixed(2));
                                setSelectedClip(prev => ({ ...prev, start: newStart, duration: newDur }));
                                setVideoClips(prev => prev.map(c => c.id === selectedClip.id ? { ...c, start: newStart, duration: newDur } : c));
                                showToast("Rognage début (Trim In) appliqué au playhead.", "success");
                              } else {
                                showToast("Le playhead doit être situé à l'intérieur du clip pour rogner.", "warning");
                              }
                            }}
                            className="flex-1 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-zinc-300 font-semibold"
                          >
                            Trim In au Playhead
                          </button>
                          <button
                            onClick={() => {
                              if (!selectedClip) return;
                              if (playheadTime > selectedClip.start && playheadTime <= selectedClip.start + selectedClip.duration) {
                                const newDur = Number((playheadTime - selectedClip.start).toFixed(2));
                                setSelectedClip(prev => ({ ...prev, duration: newDur }));
                                setVideoClips(prev => prev.map(c => c.id === selectedClip.id ? { ...c, duration: newDur } : c));
                                showToast("Rognage fin (Trim Out) appliqué au playhead.", "success");
                              } else {
                                showToast("Le playhead doit être situé à l'intérieur du clip pour rogner.", "warning");
                              }
                            }}
                            className="flex-1 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-zinc-300 font-semibold"
                          >
                            Trim Out au Playhead
                          </button>
                        </div>
                      </div>
                    </div>
                  )}"""

if old_video_opacity_end in code:
    code = code.replace(old_video_opacity_end, new_video_opacity_end, 1)
    print("[5/10] Added interactive trimming controls to Video Inspector.")
else:
    print("Warning: old_video_opacity_end not found")

# 6. Add Titles Tab and Effects Tab in Inspector right after Audio tab
old_after_audio = """                  {/* Tab: Transitions */}
                  {inspectorTab === "transitions" && ("""

new_panels = """                  {/* Tab: Titles Controls (V3 Track Overlay) */}
                  {inspectorTab === "titles" && (
                    <div className="p-3 space-y-3 text-xs font-sans">
                      <span className="font-bold text-zinc-300 block text-[11px] uppercase tracking-wider">Générateur de Titres (Piste V3)</span>
                      <div className="space-y-1">
                        <span className="text-zinc-400 block text-[11px]">Contenu du Titre</span>
                        <input
                          type="text"
                          value={titleClips[0]?.text || ""}
                          onChange={e => {
                            const val = e.target.value;
                            setTitleClips(prev => prev.map((t, idx) => idx === 0 ? { ...t, text: val } : t));
                          }}
                          className="w-full bg-black/60 border border-white/10 rounded p-1.5 text-zinc-200 text-xs font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-zinc-400 text-[11px]">
                          <span>Taille de Police (px)</span>
                          <span className="font-mono text-zinc-200">{titleClips[0]?.fontSize || 28}px</span>
                        </div>
                        <input
                          type="range"
                          min="14"
                          max="72"
                          value={titleClips[0]?.fontSize || 28}
                          onChange={e => {
                            const val = parseInt(e.target.value);
                            setTitleClips(prev => prev.map((t, idx) => idx === 0 ? { ...t, fontSize: val } : t));
                          }}
                          className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#df9c43]"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-zinc-400 text-[11px]">
                          <span>Espacement des Lettres (Tracking)</span>
                          <span className="font-mono text-zinc-200">{titleClips[0]?.tracking || 2}px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="10"
                          step="0.5"
                          value={titleClips[0]?.tracking || 2}
                          onChange={e => {
                            const val = parseFloat(e.target.value);
                            setTitleClips(prev => prev.map((t, idx) => idx === 0 ? { ...t, tracking: val } : t));
                          }}
                          className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#df9c43]"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-zinc-400 block text-[11px]">Famille de Police</span>
                        <select
                          value={titleClips[0]?.fontFamily || "sans-serif"}
                          onChange={e => {
                            const val = e.target.value;
                            setTitleClips(prev => prev.map((t, idx) => idx === 0 ? { ...t, fontFamily: val } : t));
                          }}
                          className="w-full bg-black/60 border border-white/10 rounded p-1.5 text-zinc-200 text-xs"
                        >
                          <option value="sans-serif">Sans-Serif Moderne</option>
                          <option value="serif">Serif Cinématique (Optima)</option>
                          <option value="monospace">Monospace Technique</option>
                          <option value="Impact">Impact Hero Block</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <span className="text-zinc-400 block text-[11px]">Couleur du Texte</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={titleClips[0]?.textColor || "#ffffff"}
                            onChange={e => {
                              const val = e.target.value;
                              setTitleClips(prev => prev.map((t, idx) => idx === 0 ? { ...t, textColor: val } : t));
                            }}
                            className="w-8 h-8 rounded border border-white/10 bg-black cursor-pointer"
                          />
                          <span className="font-mono text-[11px] text-zinc-300">{titleClips[0]?.textColor || "#ffffff"}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab: Effects & Quick Grade */}
                  {inspectorTab === "effects" && (
                    <div className="p-3 space-y-3 text-xs font-sans">
                      <span className="font-bold text-zinc-300 block text-[11px] uppercase tracking-wider">Étalonnage Rapide (Quick Grade)</span>
                      <div className="space-y-1">
                        <div className="flex justify-between text-zinc-400 text-[11px]">
                          <span>Exposition</span>
                          <span className="font-mono text-zinc-200">{quickGrade.exposure.toFixed(1)} EV</span>
                        </div>
                        <input
                          type="range"
                          min="-2"
                          max="2"
                          step="0.1"
                          value={quickGrade.exposure}
                          onChange={e => setQuickGrade(prev => ({ ...prev, exposure: parseFloat(e.target.value) }))}
                          className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#df9c43]"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-zinc-400 text-[11px]">
                          <span>Contraste</span>
                          <span className="font-mono text-zinc-200">{quickGrade.contrast.toFixed(2)}</span>
                        </div>
                        <input
                          type="range"
                          min="0.5"
                          max="1.8"
                          step="0.05"
                          value={quickGrade.contrast}
                          onChange={e => setQuickGrade(prev => ({ ...prev, contrast: parseFloat(e.target.value) }))}
                          className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#df9c43]"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-zinc-400 text-[11px]">
                          <span>Saturation</span>
                          <span className="font-mono text-zinc-200">{quickGrade.saturation.toFixed(2)}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="2"
                          step="0.05"
                          value={quickGrade.saturation}
                          onChange={e => setQuickGrade(prev => ({ ...prev, saturation: parseFloat(e.target.value) }))}
                          className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#df9c43]"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-zinc-400 text-[11px]">
                          <span>Température (K)</span>
                          <span className="font-mono text-zinc-200">{quickGrade.temp > 0 ? `+${quickGrade.temp}` : quickGrade.temp}</span>
                        </div>
                        <input
                          type="range"
                          min="-50"
                          max="50"
                          value={quickGrade.temp}
                          onChange={e => setQuickGrade(prev => ({ ...prev, temp: parseInt(e.target.value) }))}
                          className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#df9c43]"
                        />
                      </div>
                      <button
                        onClick={() => setQuickGrade({ exposure: 0, contrast: 1.0, saturation: 1.0, temp: 0 })}
                        className="w-full py-1 rounded bg-white/5 hover:bg-white/10 text-zinc-400 text-[10px]"
                      >
                        Réinitialiser l'Étalonnage
                      </button>
                    </div>
                  )}

                  {/* Tab: Transitions */}
                  {inspectorTab === "transitions" && ("""

if old_after_audio in code:
    code = code.replace(old_after_audio, new_panels, 1)
    print("[6/10] Added Titles and Effects panels to Inspector.")
else:
    print("Warning: old_after_audio not found")

# 7. Timeline Track Headers with interactive Eye, Volume, Lock
old_track_headers = """                    <div className="h-10 px-2 flex items-center justify-between bg-black/30">
                      <span className="text-yellow-400 font-bold">V3 TITLES</span>
                      <button className="text-zinc-500 hover:text-white"><Eye size={10} /></button>
                    </div>
                    <div className="h-10 px-2 flex items-center justify-between bg-black/30">
                      <span className="text-blue-400 font-bold">V2 B-ROLL</span>
                      <button className="text-zinc-500 hover:text-white"><Eye size={10} /></button>
                    </div>
                    <div className="h-12 px-2 flex items-center justify-between bg-black/30">
                      <span className="text-orange-400 font-bold">V1 MASTER</span>
                      <button className="text-zinc-500 hover:text-white"><Eye size={10} /></button>
                    </div>
                    <div className="h-10 px-2 flex items-center justify-between bg-black/30">
                      <span className="text-amber-400 font-bold">A1 VO (ISO)</span>
                      <span className="text-[9px] text-purple-400 font-bold">100% IA</span>
                    </div>
                    <div className="h-10 px-2 flex items-center justify-between bg-black/30">
                      <span className="text-emerald-400 font-bold">A2 MUSIC 1</span>
                      <span className="text-[9px] text-emerald-400 font-bold">BF16</span>
                    </div>
                    <div className="h-10 px-2 flex items-center justify-between bg-black/30">
                      <span className="text-cyan-400 font-bold">A3 MUSIC 2</span>
                      <span className="text-[9px] text-cyan-400 font-bold">48k</span>
                    </div>
                    <div className="h-10 px-2 flex items-center justify-between bg-black/30">
                      <span className="text-yellow-300 font-bold">A4 SFX</span>
                      <span className="text-[9px] text-zinc-500">BOOM</span>
                    </div>"""

new_track_headers = """                    <div className="h-10 px-2 flex items-center justify-between bg-black/30">
                      <span className="text-yellow-400 font-bold">V3 TITLES</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setTrackVisibility(prev => ({ ...prev, V3: !prev.V3 }))}
                          className={`p-0.5 rounded ${trackVisibility.V3 ? "text-zinc-400 hover:text-white" : "text-zinc-600 hover:text-zinc-400"}`}
                          title={trackVisibility.V3 ? "Masquer Piste V3" : "Afficher Piste V3"}
                        >
                          {trackVisibility.V3 ? <Eye size={10} /> : <EyeOff size={10} className="text-red-400" />}
                        </button>
                        <button
                          onClick={() => setTrackLock(prev => ({ ...prev, V3: !prev.V3 }))}
                          className={`p-0.5 rounded ${trackLock.V3 ? "text-amber-400" : "text-zinc-600 hover:text-zinc-400"}`}
                          title="Verrouiller Piste V3"
                        >
                          {trackLock.V3 ? <Lock size={10} /> : <Unlock size={10} />}
                        </button>
                      </div>
                    </div>
                    <div className="h-10 px-2 flex items-center justify-between bg-black/30">
                      <span className="text-blue-400 font-bold">V2 B-ROLL</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setTrackVisibility(prev => ({ ...prev, V2: !prev.V2 }))}
                          className={`p-0.5 rounded ${trackVisibility.V2 ? "text-zinc-400 hover:text-white" : "text-zinc-600 hover:text-zinc-400"}`}
                          title={trackVisibility.V2 ? "Masquer Piste V2" : "Afficher Piste V2"}
                        >
                          {trackVisibility.V2 ? <Eye size={10} /> : <EyeOff size={10} className="text-red-400" />}
                        </button>
                        <button
                          onClick={() => setTrackLock(prev => ({ ...prev, V2: !prev.V2 }))}
                          className={`p-0.5 rounded ${trackLock.V2 ? "text-amber-400" : "text-zinc-600 hover:text-zinc-400"}`}
                          title="Verrouiller Piste V2"
                        >
                          {trackLock.V2 ? <Lock size={10} /> : <Unlock size={10} />}
                        </button>
                      </div>
                    </div>
                    <div className="h-12 px-2 flex items-center justify-between bg-black/30">
                      <span className="text-orange-400 font-bold">V1 MASTER</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setTrackVisibility(prev => ({ ...prev, V1: !prev.V1 }))}
                          className={`p-0.5 rounded ${trackVisibility.V1 ? "text-zinc-400 hover:text-white" : "text-zinc-600 hover:text-zinc-400"}`}
                          title={trackVisibility.V1 ? "Masquer Piste V1" : "Afficher Piste V1"}
                        >
                          {trackVisibility.V1 ? <Eye size={10} /> : <EyeOff size={10} className="text-red-400" />}
                        </button>
                        <button
                          onClick={() => setTrackLock(prev => ({ ...prev, V1: !prev.V1 }))}
                          className={`p-0.5 rounded ${trackLock.V1 ? "text-amber-400" : "text-zinc-600 hover:text-zinc-400"}`}
                          title="Verrouiller Piste V1"
                        >
                          {trackLock.V1 ? <Lock size={10} /> : <Unlock size={10} />}
                        </button>
                      </div>
                    </div>
                    <div className="h-10 px-2 flex items-center justify-between bg-black/30">
                      <span className="text-amber-400 font-bold">A1 VO (ISO)</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setTrackMute(prev => ({ ...prev, A1: !prev.A1 }))}
                          className={`p-0.5 rounded ${trackMute.A1 ? "text-red-400 font-bold" : "text-zinc-400 hover:text-white"}`}
                          title={trackMute.A1 ? "Activer A1" : "Muter A1"}
                        >
                          {trackMute.A1 ? <VolumeX size={10} /> : <Volume2 size={10} />}
                        </button>
                        <span className="text-[9px] text-purple-400 font-bold">IA</span>
                      </div>
                    </div>
                    <div className="h-10 px-2 flex items-center justify-between bg-black/30">
                      <span className="text-emerald-400 font-bold">A2 MUSIC 1</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setTrackMute(prev => ({ ...prev, A2: !prev.A2 }))}
                          className={`p-0.5 rounded ${trackMute.A2 ? "text-red-400 font-bold" : "text-zinc-400 hover:text-white"}`}
                          title={trackMute.A2 ? "Activer A2" : "Muter A2"}
                        >
                          {trackMute.A2 ? <VolumeX size={10} /> : <Volume2 size={10} />}
                        </button>
                        <span className="text-[9px] text-emerald-400 font-bold">BF16</span>
                      </div>
                    </div>
                    <div className="h-10 px-2 flex items-center justify-between bg-black/30">
                      <span className="text-cyan-400 font-bold">A3 MUSIC 2</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setTrackMute(prev => ({ ...prev, A3: !prev.A3 }))}
                          className={`p-0.5 rounded ${trackMute.A3 ? "text-red-400 font-bold" : "text-zinc-400 hover:text-white"}`}
                          title={trackMute.A3 ? "Activer A3" : "Muter A3"}
                        >
                          {trackMute.A3 ? <VolumeX size={10} /> : <Volume2 size={10} />}
                        </button>
                        <span className="text-[9px] text-cyan-400 font-bold">48k</span>
                      </div>
                    </div>
                    <div className="h-10 px-2 flex items-center justify-between bg-black/30">
                      <span className="text-yellow-300 font-bold">A4 SFX</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setTrackMute(prev => ({ ...prev, A4: !prev.A4 }))}
                          className={`p-0.5 rounded ${trackMute.A4 ? "text-red-400 font-bold" : "text-zinc-400 hover:text-white"}`}
                          title={trackMute.A4 ? "Activer A4" : "Muter A4"}
                        >
                          {trackMute.A4 ? <VolumeX size={10} /> : <Volume2 size={10} />}
                        </button>
                        <span className="text-[9px] text-zinc-500">SFX</span>
                      </div>
                    </div>"""

if old_track_headers in code:
    code = code.replace(old_track_headers, new_track_headers, 1)
    print("[7/10] Updated timeline track headers with interactive Eye, Mute, Lock controls.")
else:
    print("Warning: old_track_headers not found")

# 8. Cut Page Fast Edit Tools and Camera Switcher
old_cut_tools = """              {/* Fast Edit Tools Panel */}
              <div className="w-64 border-l border-white/[0.07] bg-[#141416] p-3 space-y-2 text-xs">
                <span className="font-bold text-zinc-300 block uppercase tracking-wider text-[10px]">Outils Cut Rapide</span>
                <button
                  onClick={() => handleInsertToTimeline(sourceClip)}
                  className="w-full py-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 font-semibold text-left px-2"
                >
                  Smart Insert
                </button>
                <button
                  onClick={() => handleInsertToTimeline(sourceClip)}
                  className="w-full py-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 font-semibold text-left px-2"
                >
                  Append at End
                </button>
                <button
                  onClick={() => handleSplitClipAtPlayhead()}
                  className="w-full py-1.5 rounded bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-semibold text-left px-2"
                >
                  Coupe Franche (Razor)
                </button>
              </div>"""

new_cut_tools = """              {/* Fast Edit Tools Panel */}
              <div className="w-64 border-l border-white/[0.07] bg-[#141416] p-3 space-y-2 text-xs">
                <span className="font-bold text-zinc-300 block uppercase tracking-wider text-[10px]">Outils Cut Rapide</span>
                <button
                  onClick={() => {
                    handleInsertToTimeline(sourceClip);
                    showToast("Smart Insert appliqué au playhead.", "success");
                  }}
                  className="w-full py-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 font-semibold text-left px-2"
                >
                  Smart Insert
                </button>
                <button
                  onClick={() => {
                    handleInsertToTimeline(sourceClip);
                    showToast("Clip inséré en fin de timeline.", "success");
                  }}
                  className="w-full py-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 font-semibold text-left px-2"
                >
                  Append at End
                </button>
                <button
                  onClick={() => {
                    setVideoZoom(1.4);
                    if (selectedClip) setVideoClips(prev => prev.map(c => c.id === selectedClip.id ? { ...c, zoom: 1.4, cameraShot: "S2 Gros Plan Dynamique (Close-Up)" } : c));
                    showToast("Plan Close-Up appliqué (Zoom 1.4x).", "success");
                  }}
                  className="w-full py-1.5 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-semibold text-left px-2"
                >
                  Close-Up Auto (Zoom 1.4x)
                </button>
                <button
                  onClick={() => {
                    handleSplitClipAtPlayhead();
                    showToast("Coupe franche effectuée au playhead.", "success");
                  }}
                  className="w-full py-1.5 rounded bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-semibold text-left px-2"
                >
                  Coupe Franche (Razor)
                </button>
              </div>"""

if old_cut_tools in code:
    code = code.replace(old_cut_tools, new_cut_tools, 1)
    print("[8/10] Updated Cut page fast edit tools.")
else:
    print("Warning: old_cut_tools not found")

# 9. Photo Page RAW Development Controls
old_photo_inspector = """              <div className="w-80 border-l border-white/[0.07] bg-[#141416] p-3 space-y-3 text-xs">
                <span className="font-bold text-zinc-200 block border-b border-white/5 pb-1">Photo Inspector</span>
                <div className="space-y-1">
                  <div className="flex justify-between text-zinc-400 text-[11px]">
                    <span>Zoom</span>
                    <span className="font-mono text-zinc-200">{photoTransform.zoom.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.5"
                    step="0.05"
                    value={photoTransform.zoom}
                    onChange={e => setPhotoTransform(prev => ({ ...prev, zoom: parseFloat(e.target.value) }))}
                    className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#df9c43]"
                  />
                </div>
              </div>"""

new_photo_inspector = """              <div className="w-80 border-l border-white/[0.07] bg-[#141416] p-3 space-y-3 text-xs">
                <span className="font-bold text-zinc-200 block border-b border-white/5 pb-1">Photo RAW Inspector</span>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <div className="flex justify-between text-zinc-400 text-[11px]">
                      <span>Zoom</span>
                      <span className="font-mono text-zinc-200">{photoTransform.zoom.toFixed(2)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2.5"
                      step="0.05"
                      value={photoTransform.zoom}
                      onChange={e => setPhotoTransform(prev => ({ ...prev, zoom: parseFloat(e.target.value) }))}
                      className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#df9c43]"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-zinc-400 text-[11px]">
                      <span>Exposition (EV)</span>
                      <span className="font-mono text-zinc-200">{photoDev.exposure.toFixed(1)} EV</span>
                    </div>
                    <input
                      type="range"
                      min="-2"
                      max="2"
                      step="0.1"
                      value={photoDev.exposure}
                      onChange={e => setPhotoDev(prev => ({ ...prev, exposure: parseFloat(e.target.value) }))}
                      className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#df9c43]"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-zinc-400 text-[11px]">
                      <span>Contraste</span>
                      <span className="font-mono text-zinc-200">{photoDev.contrast.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="1.8"
                      step="0.05"
                      value={photoDev.contrast}
                      onChange={e => setPhotoDev(prev => ({ ...prev, contrast: parseFloat(e.target.value) }))}
                      className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#df9c43]"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-zinc-400 text-[11px]">
                      <span>Température Couleur</span>
                      <span className="font-mono text-zinc-200">{photoDev.temp}</span>
                    </div>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      value={photoDev.temp}
                      onChange={e => setPhotoDev(prev => ({ ...prev, temp: parseInt(e.target.value) }))}
                      className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#df9c43]"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-zinc-400 text-[11px]">
                      <span>Saturation</span>
                      <span className="font-mono text-zinc-200">{photoDev.saturation.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.05"
                      value={photoDev.saturation}
                      onChange={e => setPhotoDev(prev => ({ ...prev, saturation: parseFloat(e.target.value) }))}
                      className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#df9c43]"
                    />
                  </div>
                  <button
                    onClick={() => showToast("Photo RAW développée et prête à l'export.", "success")}
                    className="w-full py-1.5 rounded bg-[#df9c43] hover:bg-[#f5c277] text-black font-bold text-xs shadow-md mt-2"
                  >
                    Exporter Photo RAW Master
                  </button>
                </div>
              </div>"""

if old_photo_inspector in code:
    code = code.replace(old_photo_inspector, new_photo_inspector, 1)
    print("[9/10] Updated Photo Page RAW development controls.")
else:
    print("Warning: old_photo_inspector not found")

# Also update photo viewer filter
old_photo_viewer = """                  style={{
                    transform: `scale(${photoTransform.zoom}) translate(${photoTransform.posX}px, ${photoTransform.posY}px) rotate(${photoTransform.rot}deg)`,
                  }}"""
new_photo_viewer = """                  style={{
                    transform: `scale(${photoTransform.zoom}) translate(${photoTransform.posX}px, ${photoTransform.posY}px) rotate(${photoTransform.rot}deg)`,
                    filter: `brightness(${1 + photoDev.exposure * 0.2}) contrast(${photoDev.contrast}) saturate(${photoDev.saturation}) hue-rotate(${photoDev.temp * 0.5}deg)`,
                  }}"""
if old_photo_viewer in code:
    code = code.replace(old_photo_viewer, new_photo_viewer, 1)
    print("[10/10] Updated Photo Viewer live filter.")

with open(FILE_PATH, "w", encoding="utf-8") as f:
    f.write(code)

print(f"Successfully patched {FILE_PATH} (new size: {len(code)} bytes)!")
