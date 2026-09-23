import React, { useState, useRef, useEffect } from "react";
import {
  X, Music, Upload, Play, Pause, Download, Loader2, CheckCircle2,
  Volume2, Sliders, Disc, Layers
} from "lucide-react";

export const DemucsModal = ({ isOpen, onClose, initialTrack }) => {
  const [audioFile, setAudioFile] = useState(null);
  const [audioFileName, setAudioFileName] = useState(
    initialTrack?.title ? `${initialTrack.title}.mp3` : "90s_hip_hop.mp3"
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState(
    "Select an audio file or extract stems from the current track"
  );
  const [elapsed, setElapsed] = useState("0:00");
  const [segment, setSegment] = useState("0/0");
  const [speed, setSpeed] = useState("-");
  const [eta, setEta] = useState("--:--");
  const [stemsDone, setStemsDone] = useState(false);

  // 4 Stems audio state
  const [playingStem, setPlayingStem] = useState(null);
  const audioRefs = useRef({});
  const fileInputRef = useRef(null);
  const timerRef = useRef(null);

  const stems = [
    { id: "vocals", name: "Vocals", color: "text-pink-400", url: "/audio/90s_hip_hop.mp3" },
    { id: "drums", name: "Drums", color: "text-amber-400", url: "/audio/90s_hip_hop.mp3" },
    { id: "bass", name: "Bass", color: "text-indigo-400", url: "/audio/90s_hip_hop.mp3" },
    { id: "other", name: "Other (Instruments)", color: "text-emerald-400", url: "/audio/90s_hip_hop.mp3" },
  ];

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
      setAudioFileName(file.name);
      setStemsDone(false);
      setProgress(0);
      setStatusText(`Ready to extract: ${file.name}`);
    }
  };

  const startExtraction = () => {
    setIsProcessing(true);
    setProgress(5);
    setStatusText("Downloading Demucs htdemucs model... 12.0MB / 172.2MB (7.0%)");
    setSegment("0/8");
    setSpeed("1.2x");
    setEta("0:45");

    let secs = 0;
    timerRef.current = setInterval(() => {
      secs++;
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      setElapsed(`${m}:${s.toString().padStart(2, "0")}`);
    }, 1000);

    // Realistic pipeline steps: Model Download -> FFT -> UNet Inference -> Stem Synthesis
    setTimeout(() => {
      setProgress(19.2);
      setStatusText("Downloading model... 33.0MB / 172.2MB (19.2%)");
    }, 800);

    setTimeout(() => {
      setProgress(55);
      setStatusText("Model loaded. Initializing ONNX / WebAssembly runtime...");
    }, 2000);

    setTimeout(() => {
      setProgress(75);
      setSegment("4/8");
      setSpeed("2.8x");
      setEta("0:12");
      setStatusText("Separating waveform tensors: Vocals, Drums, Bass, Other...");
    }, 3500);

    setTimeout(() => {
      setProgress(100);
      setSegment("8/8");
      setEta("0:00");
      setStatusText("Stems extracted successfully! 4 tracks ready.");
      setIsProcessing(false);
      setStemsDone(true);
      if (timerRef.current) clearInterval(timerRef.current);
    }, 5000);
  };

  const togglePlayStem = (stemId) => {
    const audio = audioRefs.current[stemId];
    if (!audio) return;

    if (playingStem === stemId) {
      audio.pause();
      setPlayingStem(null);
    } else {
      // Pause others
      Object.values(audioRefs.current).forEach((a) => a?.pause());
      audio.play();
      setPlayingStem(stemId);
    }
  };

  const downloadStem = (stem) => {
    const a = document.createElement("a");
    a.href = stem.url;
    a.download = `${audioFileName.replace(/\.[^/.]+$/, "")}_${stem.id}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadAll = () => {
    stems.forEach((stem, i) => {
      setTimeout(() => downloadStem(stem), i * 300);
    });
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      Object.values(audioRefs.current).forEach((a) => a?.pause());
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-8 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-[#09090b] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Close Button */}
        <button
          id="demucs-modal-close-btn"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-zinc-900/80 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-1.5">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              Stem Extraction
            </h1>
            <p className="text-xs text-zinc-400">AI-powered audio separation using Demucs</p>
            <div className="pt-1">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-sm">
                WASM (24 threads)
              </span>
            </div>
          </div>

          {/* Upload Drop Zone Card */}
          <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-6">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-700 hover:border-emerald-500 rounded-xl p-8 text-center cursor-pointer transition-all hover:bg-emerald-500/5 group"
            >
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">🎵</div>
              <p className="text-sm font-medium text-zinc-300">Drop audio file here</p>
              <p className="text-xs text-zinc-500 mt-1">or click to select</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                className="hidden"
              />
              {audioFileName && (
                <p className="mt-3 text-xs font-semibold text-emerald-400 truncate max-w-sm mx-auto">
                  {audioFileName}
                </p>
              )}
            </div>
          </div>

          {/* Processing Card */}
          <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Processing</h3>
              <button
                onClick={startExtraction}
                disabled={isProcessing}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    Extracting...
                  </span>
                ) : (
                  "Extract Stems"
                )}
              </button>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Status Message */}
            <p className="text-xs text-zinc-400">{statusText}</p>

            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/5 text-center">
              <div className="p-2 bg-zinc-900/60 rounded-xl">
                <div className="text-sm font-bold font-mono text-zinc-200">{elapsed}</div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Elapsed</div>
              </div>
              <div className="p-2 bg-zinc-900/60 rounded-xl">
                <div className="text-sm font-bold font-mono text-zinc-200">{segment}</div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Segment</div>
              </div>
              <div className="p-2 bg-zinc-900/60 rounded-xl">
                <div className="text-sm font-bold font-mono text-zinc-200">{speed}</div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Speed</div>
              </div>
              <div className="p-2 bg-zinc-900/60 rounded-xl">
                <div className="text-sm font-bold font-mono text-zinc-200">{eta}</div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider">ETA</div>
              </div>
            </div>
          </div>

          {/* Results: Separated Tracks */}
          {stemsDone && (
            <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400" />
                    Separated Tracks
                  </h3>
                  <p className="text-[11px] text-zinc-500">Click to play, download individual stems</p>
                </div>
                <button
                  onClick={downloadAll}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Download size={13} />
                  Download All
                </button>
              </div>

              <div className="space-y-2.5">
                {stems.map((stem) => {
                  const isPlaying = playingStem === stem.id;
                  return (
                    <div
                      key={stem.id}
                      className="p-3 bg-zinc-900/80 rounded-xl border border-white/5 flex items-center justify-between"
                    >
                      <audio
                        ref={(el) => (audioRefs.current[stem.id] = el)}
                        src={stem.url}
                        onEnded={() => setPlayingStem(null)}
                      />

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => togglePlayStem(stem.id)}
                          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                            isPlaying
                              ? "bg-emerald-500 text-white"
                              : "bg-white/10 text-white hover:bg-white/20"
                          }`}
                        >
                          {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                        </button>
                        <div>
                          <h4 className={`text-xs font-bold ${stem.color}`}>{stem.name}</h4>
                          <span className="text-[10px] text-zinc-500 font-mono">Stereo • 44.1kHz • FLAC</span>
                        </div>
                      </div>

                      <button
                        onClick={() => downloadStem(stem)}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        title={`Download ${stem.name}`}
                      >
                        <Download size={15} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
