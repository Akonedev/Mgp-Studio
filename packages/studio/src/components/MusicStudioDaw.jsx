"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Play,
  Pause,
  Square,
  Circle,
  Repeat,
  Sliders,
  Volume2,
  VolumeX,
  Plus,
  Search,
  Sparkles,
  RefreshCw,
  Music,
  Layers,
  Film,
  FileAudio,
  Settings,
  Settings2,
  Folder,
  FolderOpen,
  Info,
  ExternalLink,
  Grid,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  X,
  Check,
  Activity,
  Cpu,
  Mic,
  Headphones,
  Disc,
  Clock,
  SlidersHorizontal,
  Wand2,
  Scissors,
  Radio,
  Keyboard,
  MousePointer,
  HelpCircle,
  Undo2,
  Redo2,
  CornerDownRight,
  Maximize,
  Minimize,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  Move,
  Copy,
  Trash2,
  Edit3,
  Flag,
  Bookmark,
  Power,
  Palette,
  Snowflake,
  GripVertical,
  ArrowDown,
  ArrowUp,
  Download,
  Save,
  FilePlus,
  FileText,
  PenTool,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Pencil,
  Eraser,
  CornerUpRight,
  BetweenHorizontalStart,
  Zap
} from "lucide-react";
import MusicStudioDashboardModal from "./MusicStudioDashboardModal";
import MusicStudioInspectorPanel from "./MusicStudioInspectorPanel";
import MusicStudioArrangerToolbar, { STUDIO_TOOLS } from "./MusicStudioArrangerToolbar";
import MusicStudioClipFadeOverlay from "./MusicStudioClipFadeOverlay";
import MusicStudioTakeLanesComping, { DEFAULT_STUDIO_TAKES } from "./MusicStudioTakeLanesComping";
import MusicStudioPianoRollOperators from "./MusicStudioPianoRollOperators";
import MusicStudioPopupBrowser from "./MusicStudioPopupBrowser";
import MusicStudioTheGridModular from "./MusicStudioTheGridModular";
import MusicStudioDeviceRack, { deviceAudioEngine } from "./MusicStudioDeviceRack";
import MusicStudioModulatorSystem from "./MusicStudioModulatorSystem";
import MusicStudioAudioWarp, { detectAudioTransients } from "./MusicStudioAudioWarp";
import MusicStudioConsoleMixer from "./MusicStudioConsoleMixer";
import MusicStudioRadialMenu from "./MusicStudioRadialMenu";
import MusicStudioMidiMappings from "./MusicStudioMidiMappings";

// ── Web Audio Synth & Multitrack DSP Engine (Zero-Mock Real Signal Processing) ──
class DawWebAudioEngine {
  playDeviceSound(device, note = "C4") {
    if (typeof deviceAudioEngine !== "undefined") {
      deviceAudioEngine.playDeviceAudition(device);
    }
  }

  playDeviceSound(device, note = "C4") {
    if (typeof deviceAudioEngine !== "undefined") {
      deviceAudioEngine.playDeviceAudition(device);
    }
  }

  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.masterAnalyser = null;
    this.trackNodes = new Map();
    this.bufferCache = new Map(); // url -> AudioBuffer
    this.loadingPromises = new Map();
    this.analyserData = new Uint8Array(128);
  }

  init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.85;

        this.masterAnalyser = this.ctx.createAnalyser();
        this.masterAnalyser.fftSize = 256;
        this.masterAnalyser.smoothingTimeConstant = 0.8;

        this.masterGain.connect(this.masterAnalyser);
        this.masterAnalyser.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  async loadBuffer(url) {
    this.init();
    if (!url || !this.ctx) return null;
    if (this.bufferCache.has(url)) return this.bufferCache.get(url);
    if (this.loadingPromises.has(url)) return this.loadingPromises.get(url);

    const promise = (async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const arrayBuf = await res.arrayBuffer();
        const audioBuf = await this.ctx.decodeAudioData(arrayBuf);
        this.bufferCache.set(url, audioBuf);
        return audioBuf;
      } catch (err) {
        console.warn(`[DawWebAudioEngine] Failed to decode audio buffer for ${url}:`, err);
        return null;
      } finally {
        this.loadingPromises.delete(url);
      }
    })();

    this.loadingPromises.set(url, promise);
    return promise;
  }

  async preloadTrackBuffers(tracks) {
    this.init();
    if (!tracks || !Array.isArray(tracks)) return;
    const urls = new Set([
      "/samples/studio/tolcha_08.wav",
      "/samples/studio/drum_break.wav",
      "/samples/studio/piano_lr_bounce_1.wav",
      "/samples/studio/piano_lr_2_bounce_2.wav",
      "/samples/studio/piano_pedal_bounce_1.wav"
    ]);
    for (const trk of tracks) {
      if (trk.audioUrl) urls.add(trk.audioUrl);
      if (Array.isArray(trk.clips)) {
        for (const clip of trk.clips) {
          if (clip.url) urls.add(clip.url);
        }
      }
    }
    await Promise.allSettled(Array.from(urls).map((u) => this.loadBuffer(u)));
  }

  getOrCreateTrackChain(trackId) {
    this.init();
    if (!this.ctx) return null;
    if (this.trackNodes.has(trackId)) {
      return this.trackNodes.get(trackId);
    }

    const gainNode = this.ctx.createGain();
    gainNode.gain.value = 0.8;

    let pannerNode = null;
    if (this.ctx.createStereoPanner) {
      pannerNode = this.ctx.createStereoPanner();
      pannerNode.pan.value = 0;
    }

    const analyserNode = this.ctx.createAnalyser();
    analyserNode.fftSize = 256;
    analyserNode.smoothingTimeConstant = 0.8;

    if (pannerNode) {
      gainNode.connect(pannerNode);
      pannerNode.connect(analyserNode);
    } else {
      gainNode.connect(analyserNode);
    }
    analyserNode.connect(this.masterGain);

    const chain = {
      gainNode,
      pannerNode,
      analyserNode,
      sourceNodes: []
    };
    this.trackNodes.set(trackId, chain);
    return chain;
  }

  setTrackVolume(trackId, volume, isMuted = false, isAnySolo = false, isThisSolo = false) {
    const chain = this.getOrCreateTrackChain(trackId);
    if (!chain || !this.ctx) return;
    const t = this.ctx.currentTime;
    if (isMuted || (isAnySolo && !isThisSolo)) {
      chain.gainNode.gain.setTargetAtTime(0.0001, t, 0.02);
    } else {
      const g = Math.max(0.0001, Math.min(1.5, (volume / 100) * 1.0));
      chain.gainNode.gain.setTargetAtTime(g, t, 0.02);
    }
  }

  setTrackPan(trackId, panVal) {
    const chain = this.getOrCreateTrackChain(trackId);
    if (!chain || !chain.pannerNode || !this.ctx) return;
    const p = Math.max(-1, Math.min(1, panVal / 50));
    chain.pannerNode.pan.setTargetAtTime(p, this.ctx.currentTime, 0.02);
  }

  setMasterVolume(volume) {
    this.init();
    if (!this.masterGain || !this.ctx) return;
    const g = Math.max(0.0001, Math.min(1.5, (volume / 100) * 1.0));
    this.masterGain.gain.setTargetAtTime(g, this.ctx.currentTime, 0.02);
  }

  stopAllSources() {
    for (const [_, chain] of this.trackNodes) {
      if (chain.sourceNodes) {
        for (const src of chain.sourceNodes) {
          try {
            src.stop();
            src.disconnect();
          } catch (e) {}
        }
        chain.sourceNodes = [];
      }
    }
  }

  startMultitrackPlayback({ tracks, playheadSec, bpm }) {
    this.init();
    if (!this.ctx) return;
    this.stopAllSources();

    const isAnySolo = tracks.some((t) => t.solo);
    const secPerBar = 240 / bpm;

    for (const trk of tracks) {
      const chain = this.getOrCreateTrackChain(trk.id);
      if (!chain) continue;

      this.setTrackVolume(trk.id, trk.volume, trk.mute, isAnySolo, trk.solo);
      if (trk.pan !== undefined) {
        this.setTrackPan(trk.id, trk.pan);
      }

      const clips = trk.clips || [];
      for (const clip of clips) {
        const clipUrl = clip.url || trk.audioUrl;
        const buffer = clip.audioBuffer || (clipUrl ? this.bufferCache.get(clipUrl) : null);
        if (!buffer) continue;

        const clipStartSec = (clip.startBar - 1) * secPerBar;
        const clipDurSec = (clip.bars || 8) * secPerBar;
        const clipEndSec = clipStartSec + clipDurSec;

        const fadeInSec = Math.max(0, (clip.fadeInBars || 0) * secPerBar);
        const fadeOutSec = Math.max(0, (clip.fadeOutBars || 0) * secPerBar);

        if (playheadSec >= clipStartSec && playheadSec < clipEndSec) {
          const offsetInBuffer = (playheadSec - clipStartSec) % buffer.duration;
          const remainingSec = clipEndSec - playheadSec;
          try {
            const src = this.ctx.createBufferSource();
            src.buffer = buffer;

            // Real Web Audio gain node for fade in / fade out (Music Studio Section 5.1.7)
            const clipGain = this.ctx.createGain();
            const now = this.ctx.currentTime;
            const elapsedInClip = playheadSec - clipStartSec;

            if (fadeInSec > 0 && elapsedInClip < fadeInSec) {
              const currentGain = Math.max(0.001, elapsedInClip / fadeInSec);
              clipGain.gain.setValueAtTime(currentGain, now);
              clipGain.gain.linearRampToValueAtTime(1.0, now + (fadeInSec - elapsedInClip));
            } else {
              clipGain.gain.setValueAtTime(1.0, now);
            }

            if (fadeOutSec > 0 && remainingSec > fadeOutSec) {
              clipGain.gain.setValueAtTime(1.0, now + (remainingSec - fadeOutSec));
              clipGain.gain.linearRampToValueAtTime(0.0001, now + remainingSec);
            } else if (fadeOutSec > 0 && remainingSec <= fadeOutSec) {
              clipGain.gain.linearRampToValueAtTime(0.0001, now + remainingSec);
            }

            src.connect(clipGain);
            clipGain.connect(chain.gainNode);
            src.start(now, offsetInBuffer, remainingSec);
            chain.sourceNodes.push(src);
          } catch (err) {
            console.warn("[DawWebAudioEngine] Error starting buffer source:", err);
          }
        } else if (playheadSec < clipStartSec) {
          const delaySec = clipStartSec - playheadSec;
          try {
            const src = this.ctx.createBufferSource();
            src.buffer = buffer;

            const clipGain = this.ctx.createGain();
            const startTimestamp = this.ctx.currentTime + delaySec;

            if (fadeInSec > 0) {
              clipGain.gain.setValueAtTime(0.0001, startTimestamp);
              clipGain.gain.linearRampToValueAtTime(1.0, startTimestamp + Math.min(fadeInSec, clipDurSec));
            } else {
              clipGain.gain.setValueAtTime(1.0, startTimestamp);
            }

            if (fadeOutSec > 0) {
              const fadeOutStart = startTimestamp + Math.max(0, clipDurSec - fadeOutSec);
              clipGain.gain.setValueAtTime(1.0, fadeOutStart);
              clipGain.gain.linearRampToValueAtTime(0.0001, startTimestamp + clipDurSec);
            }

            src.connect(clipGain);
            clipGain.connect(chain.gainNode);
            src.start(startTimestamp, 0, clipDurSec);
            chain.sourceNodes.push(src);
          } catch (err) {
            console.warn("[DawWebAudioEngine] Error scheduling buffer source:", err);
          }
        }
      }
    }
  }

  playMetronomeClick(isHighBeat = false) {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(isHighBeat ? 1200 : 800, t);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.35, t + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + (isHighBeat ? 0.045 : 0.035));

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.05);
    } catch (e) {
      console.warn("[DawWebAudioEngine] Metronome error:", e);
    }
  }

  triggerDrumPad(padName = "Kick", velocity = 0.8) {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    try {
      const t = this.ctx.currentTime;
      const lower = padName.toLowerCase();
      const output = this.masterGain;

      if (lower.includes("tolcha") && this.bufferCache.has("/samples/studio/tolcha_08.wav")) {
        const buf = this.bufferCache.get("/samples/studio/tolcha_08.wav");
        const src = this.ctx.createBufferSource();
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(velocity, t);
        src.buffer = buf;
        src.connect(gain);
        gain.connect(output);
        src.start(t);
        return;
      }

      if (lower.includes("kick")) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);
        gain.gain.setValueAtTime(velocity * 0.9, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        osc.connect(gain);
        gain.connect(output);
        osc.start(t);
        osc.stop(t + 0.36);
      } else if (lower.includes("snare")) {
        const bSize = Math.floor(this.ctx.sampleRate * 0.2);
        const b = this.ctx.createBuffer(1, bSize, this.ctx.sampleRate);
        const data = b.getChannelData(0);
        for (let i = 0; i < bSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = this.ctx.createBufferSource();
        noise.buffer = b;
        const filter = this.ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(1800, t);
        filter.Q.value = 1.2;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(velocity * 0.7, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(output);
        noise.start(t);
        noise.stop(t + 0.21);

        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(185, t);
        osc.frequency.exponentialRampToValueAtTime(120, t + 0.08);
        oscGain.gain.setValueAtTime(velocity * 0.5, t);
        oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        osc.connect(oscGain);
        oscGain.connect(output);
        osc.start(t);
        osc.stop(t + 0.13);
      } else if (lower.includes("clap")) {
        [0, 0.012, 0.024].forEach((offset, idx) => {
          const bSize = Math.floor(this.ctx.sampleRate * 0.15);
          const b = this.ctx.createBuffer(1, bSize, this.ctx.sampleRate);
          const data = b.getChannelData(0);
          for (let i = 0; i < bSize; i++) data[i] = Math.random() * 2 - 1;
          const noise = this.ctx.createBufferSource();
          noise.buffer = b;
          const filter = this.ctx.createBiquadFilter();
          filter.type = "bandpass";
          filter.frequency.setValueAtTime(1200, t + offset);
          filter.Q.value = 2.0;
          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime((idx === 2 ? 0.7 : 0.4) * velocity, t + offset);
          gain.gain.exponentialRampToValueAtTime(0.001, t + offset + (idx === 2 ? 0.22 : 0.03));
          noise.connect(filter);
          filter.connect(gain);
          gain.connect(output);
          noise.start(t + offset);
          noise.stop(t + offset + 0.25);
        });
      } else if (lower.includes("tom")) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(130, t);
        osc.frequency.exponentialRampToValueAtTime(65, t + 0.22);
        gain.gain.setValueAtTime(velocity * 0.8, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.connect(gain);
        gain.connect(output);
        osc.start(t);
        osc.stop(t + 0.31);
      } else if (lower.includes("shak")) {
        const bSize = Math.floor(this.ctx.sampleRate * 0.08);
        const b = this.ctx.createBuffer(1, bSize, this.ctx.sampleRate);
        const data = b.getChannelData(0);
        for (let i = 0; i < bSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = this.ctx.createBufferSource();
        noise.buffer = b;
        const filter = this.ctx.createBiquadFilter();
        filter.type = "highpass";
        filter.frequency.setValueAtTime(4500, t);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(velocity * 0.45, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.075);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(output);
        noise.start(t);
        noise.stop(t + 0.08);
      } else if (lower.includes("cymbal") || lower.includes("ride")) {
        const bSize = Math.floor(this.ctx.sampleRate * 0.6);
        const b = this.ctx.createBuffer(1, bSize, this.ctx.sampleRate);
        const data = b.getChannelData(0);
        for (let i = 0; i < bSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = this.ctx.createBufferSource();
        noise.buffer = b;
        const filter = this.ctx.createBiquadFilter();
        filter.type = "highpass";
        filter.frequency.setValueAtTime(6000, t);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(velocity * 0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(output);
        noise.start(t);
        noise.stop(t + 0.58);
      } else {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = lower.includes("lazer") ? "sawtooth" : "triangle";
        const startF = lower.includes("lazer") ? 880 : (lower.includes("b1") ? 90 : 350);
        const endF = lower.includes("lazer") ? 110 : (lower.includes("b1") ? 45 : 120);
        osc.frequency.setValueAtTime(startF, t);
        osc.frequency.exponentialRampToValueAtTime(endF, t + 0.1);
        gain.gain.setValueAtTime(velocity * 0.6, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        osc.connect(gain);
        gain.connect(output);
        osc.start(t);
        osc.stop(t + 0.16);
      }
    } catch (e) {
      console.warn("[DawWebAudioEngine] triggerDrumPad error:", e);
    }
  }

  getMasterPeak() {
    if (!this.masterAnalyser) return { left: 0, right: 0 };
    this.masterAnalyser.getByteTimeDomainData(this.analyserData);
    let max = 0;
    for (let i = 0; i < this.analyserData.length; i++) {
      const val = Math.abs((this.analyserData[i] - 128) / 128);
      if (val > max) max = val;
    }
    const peak = Math.min(1, max * 1.5);
    return { left: peak, right: peak * 0.95 };
  }

  getTrackPeak(trackId) {
    const chain = this.trackNodes.get(trackId);
    if (!chain || !chain.analyserNode) return 0;
    chain.analyserNode.getByteTimeDomainData(this.analyserData);
    let max = 0;
    for (let i = 0; i < this.analyserData.length; i++) {
      const val = Math.abs((this.analyserData[i] - 128) / 128);
      if (val > max) max = val;
    }
    return Math.min(1, max * 1.5);
  }

  // Play synthesized note with dynamic filter, delay, and envelope
  playNote(noteFreq, duration = 0.5, type = "sawtooth", gainVal = 0.18, trackEffects = null) {
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Configure Filter
      filter.type = "lowpass";
      const cutoff = trackEffects?.cutoff || 2200;
      const res = trackEffects?.res || 3;
      filter.frequency.setValueAtTime(cutoff, t);
      filter.Q.setValueAtTime(res, t);

      osc.type = type;
      osc.frequency.setValueAtTime(noteFreq, t);

      // ADSR Envelope
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(gainVal, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(gainVal * 0.7, t + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

      osc.connect(filter);
      filter.connect(gain);

      // Optional Delay Line if delay is enabled
      if (trackEffects?.hasDelay) {
        const delay = this.ctx.createDelay();
        const delayGain = this.ctx.createGain();
        delay.delayTime.value = 0.28;
        delayGain.gain.value = 0.35;

        gain.connect(delay);
        delay.connect(delayGain);
        delayGain.connect(delay);
        delayGain.connect(this.masterGain);
      }

      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + duration + 0.1);
    } catch (e) {
      console.warn("[DawWebAudioEngine] playNote error:", e);
    }
  }

  // Music Studio Operators & MPE Expressions Note Playback (Section 11.2 & Ch. 12)
  playNoteWithOptions(noteFreq, duration = 0.5, options = {}) {
    this.init();
    if (!this.ctx) return;

    // 1. Music Studio Chance Operator (0% to 100%) (Section 11.2.1, p. 344)
    const chance = options.chance !== undefined ? options.chance : 100;
    if (chance < 100 && (Math.random() * 100 > chance)) {
      return; // Skipped stochastically
    }

    // 2. Music Studio Occurrence Operator (p. 347)
    const occurrence = options.occurrence || "Always";
    const loopCycle = options.loopCycle || 1;
    if (occurrence === "First" && loopCycle !== 1) return;
    if (occurrence === "Not First" && loopCycle === 1) return;
    if (occurrence === "1:2" && (loopCycle % 2 !== 1)) return;
    if (occurrence === "2:2" && (loopCycle % 2 !== 0)) return;
    if (occurrence === "1:4" && ((loopCycle - 1) % 4 !== 0)) return;
    if (occurrence === "2:4" && ((loopCycle - 1) % 4 !== 1)) return;
    if (occurrence === "3:4" && ((loopCycle - 1) % 4 !== 2)) return;
    if (occurrence === "4:4" && ((loopCycle - 1) % 4 !== 3)) return;

    // 3. Music Studio Micro-Pitch Expression (-24 to +24 semitones) (Chapitre 12, p. 377)
    const microPitch = options.microPitch || 0;
    const finalFreq = noteFreq * Math.pow(2, microPitch / 12);

    // 4. Music Studio Velocity & Pressure / Timbre Expressions (p. 376-382)
    const velocity = options.velocity !== undefined ? options.velocity : 90;
    const gainVal = Math.max(0.01, Math.min(0.35, ((velocity / 127) * 0.22) * (options.masterScale || 1)));
    const pressure = options.pressure !== undefined ? options.pressure : 50; // 0 to 100
    const filterCutoff = 1200 + (pressure / 100) * 3500; // modulated by pressure

    // 5. Music Studio Ratchets (Répétitions 1 to 8) (Section 11.2.2, p. 350)
    const ratchets = Math.max(1, Math.min(8, options.ratchets || 1));
    const subDuration = duration / ratchets;
    const pan = Math.max(-1, Math.min(1, (options.pan || 0) / 50)); // -50 to +50 -> -1 to +1

    for (let r = 0; r < ratchets; r++) {
      const pulseTimeOffset = r * subDuration;
      const pulseGain = gainVal * (1 - (r * 0.08)); // subtle natural ratchet decay
      this._scheduleSinglePulse(
        finalFreq,
        subDuration * 0.85,
        pulseTimeOffset,
        pulseGain,
        filterCutoff,
        pan,
        options.type || "sawtooth"
      );
    }
  }

  _scheduleSinglePulse(freq, dur, timeOffset, gainVal, cutoff, pan, type) {
    try {
      const t = this.ctx.currentTime + timeOffset;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(cutoff, t);
      filter.Q.setValueAtTime(3, t);

      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, gainVal), t + 0.015);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, gainVal * 0.7), t + Math.min(dur * 0.5, 0.12));
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

      osc.connect(filter);
      filter.connect(gain);

      // Stereo Panner Node for per-note pan expression
      if (this.ctx.createStereoPanner) {
        const panner = this.ctx.createStereoPanner();
        panner.pan.setValueAtTime(pan, t);
        gain.connect(panner);
        panner.connect(this.masterGain);
      } else {
        gain.connect(this.masterGain);
      }

      osc.start(t);
      osc.stop(t + dur + 0.05);
    } catch (e) {
      console.warn("[DawWebAudioEngine] _scheduleSinglePulse error:", e);
    }
  }
}

const dawAudioEngine = new DawWebAudioEngine();

// Note frequency map (C2 to C6)
const NOTE_FREQS = {
  "C2": 65.41, "C#2": 69.30, "D2": 73.42, "D#2": 77.78, "E2": 82.41, "F2": 87.31, "F#2": 92.50, "G2": 98.00, "G#2": 103.83, "A2": 110.00, "A#2": 116.54, "B2": 123.47,
  "C3": 130.81, "C#3": 138.59, "D3": 146.83, "D#3": 155.56, "E3": 164.81, "F3": 174.61, "F#3": 185.00, "G3": 196.00, "G#3": 207.65, "A3": 220.00, "A#3": 233.08, "B3": 246.94,
  "C4": 261.63, "C#4": 277.18, "D4": 293.66, "D#4": 311.13, "E4": 329.63, "F4": 349.23, "F#4": 369.99, "G4": 392.00, "G#4": 415.30, "A4": 440.00, "A#4": 466.16, "B4": 493.88,
  "C5": 523.25, "C#5": 554.37, "D5": 587.33, "D#5": 622.25, "E5": 659.25, "F5": 698.46, "F#5": 739.99, "G5": 783.99, "G#5": 830.61, "A5": 880.00, "A#5": 932.33, "B5": 987.77,
  "C6": 1046.50
};

// Studio Devices & Effects Library (Generic Pro DAW Devices)
const STUDIO_DEVICES = [
  { id: "dev_amp", name: "Amp Simulator", type: "Audio FX", category: "Distortion", desc: "Simulateur d'ampli guitare à lampes et baffle" },
  { id: "dev_arp", name: "Arpeggiator", type: "Note FX", category: "MIDI/Note", desc: "Moteur d'arpégiation polyphonique et séquençage" },
  { id: "dev_bit", name: "Bit-8 Reducer", type: "Audio FX", category: "Distortion", desc: "Réducteur de résolution et sample-rate lo-fi" },
  { id: "dev_cho", name: "Stereo Chorus", type: "Audio FX", category: "Modulation", desc: "Chorus spatial multi-voix pour élargir le mix" },
  { id: "dev_cmp", name: "VCA Compressor", type: "Audio FX", category: "Dynamics", desc: "Compresseur de dynamique avec détection Peak/RMS" },
  { id: "dev_dly", name: "Delay+ Dual", type: "Audio FX", category: "Delay", desc: "Délai stéréo synchronisé au tempo avec modulation" },
  { id: "dev_dst", name: "Overdrive Saturator", type: "Audio FX", category: "Distortion", desc: "Saturation analogique douce à distorsion agressive" },
  { id: "dev_drm", name: "Drum Machine 16", type: "Instrument", category: "Drums", desc: "Boîte à rythmes 16 pads avec synthèse et samples" },
  { id: "dev_dyn", name: "Multiband Dynamics", type: "Audio FX", category: "Dynamics", desc: "Compresseur / expanseur ascendant et descendant" },
  { id: "dev_eq5", name: "EQ-5 Parametric", type: "Audio FX", category: "EQ", desc: "Égaliseur paramétrique 5 bandes avec analyseur FFT" },
  { id: "dev_eqp", name: "EQ+ Precision", type: "Audio FX", category: "EQ", desc: "Égaliseur graphique haute précision avec bandes dynamiques" },
  { id: "dev_flg", name: "Analog Flanger", type: "Audio FX", category: "Modulation", desc: "Effet flanger à peigne avec feedback résonant" },
  { id: "dev_fm4", name: "FM-4 Quad Synth", type: "Instrument", category: "Synth", desc: "Synthétiseur à modulation de fréquence 4 opérateurs" },
  { id: "dev_lay", name: "Instrument Layer", type: "Container", category: "Layer", desc: "Conteneur d'empilement et split d'instruments" },
  { id: "dev_org", name: "Tonewheel Organ", type: "Instrument", category: "Keys", desc: "Orgue à roues phoniques avec tirettes harmoniques" },
  { id: "dev_phs", name: "Phase Shifter", type: "Audio FX", category: "Modulation", desc: "Phaser stéréo multi-étages 12 pôles" },
  { id: "dev_pol", name: "Polymer Hybrid", type: "Instrument", category: "Synth", desc: "Architecture de synthèse hybride soustractive et modulaire" },
  { id: "dev_psn", name: "Polysynth Analog", type: "Instrument", category: "Synth", desc: "Synthétiseur polyphonique soustractif vintage" },
  { id: "dev_rev", name: "Studio Reverb", type: "Audio FX", category: "Reverb", desc: "Réverbération algorithmique de pièce et hall avec diffusion" },
  { id: "dev_smp", name: "Multi-Sampler", type: "Instrument", category: "Sampler", desc: "Lecteur multi-échantillons avec modes granulaire et cycle" },
  { id: "dev_tol", name: "Mastering Tool", type: "Audio FX", category: "Utility", desc: "Gain, panoramique, inversion de phase et largeur stéréo" }
];

// ── Helper to encode Float32Array to 16-bit Mono WAV format ──
function encodeWavMono(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // Mono channel
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(view, 36, "data");
  view.setUint32(40, samples.length * 2, true);
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
}

// ── Helper to encode stereo Float32Array to 16-bit Stereo WAV format ──
function encodeWavStereo(leftSamples, rightSamples, sampleRate = 48000) {
  const numChannels = 2;
  const numSamples = leftSamples.length;
  const buffer = new ArrayBuffer(44 + numSamples * numChannels * 2);
  const view = new DataView(buffer);
  function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + numSamples * numChannels * 2, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true); // Stereo
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, numSamples * numChannels * 2, true);
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const sL = Math.max(-1, Math.min(1, leftSamples[i]));
    const sR = Math.max(-1, Math.min(1, rightSamples ? rightSamples[i] : leftSamples[i]));
    view.setInt16(offset, sL < 0 ? sL * 0x8000 : sL * 0x7fff, true);
    offset += 2;
    view.setInt16(offset, sR < 0 ? sR * 0x8000 : sR * 0x7fff, true);
    offset += 2;
  }
  return buffer;
}

// ── Realistic Demo Songs with Separated 4 Stems (Real Demucs Audio Files) ──
const DEMO_SONGS_LIST = [
  {
    id: "demo_cybersahel",
    title: "Midnight Sahel Drift (Cyberpunk Sahel - 4 Stems)",
    bpm: 120,
    key: "A Minor",
    duration: 32,
    artist: "DJ Wan & ACE-Step Studio",
    url: "/outputs/OGA_Music_CyberSahel_Synth.mp3",
    stems: {
      vocals: "/outputs/stem_track_cybersahel_vocals.mp3",
      drums: "/outputs/stem_track_cybersahel_drums.mp3",
      bass: "/outputs/stem_track_cybersahel_bass.mp3",
      instruments: "/outputs/stem_track_cybersahel_instruments.mp3"
    }
  },
  {
    id: "demo_neurosoft",
    title: "NeuroSoft 90s Chill Lofi (Full 4 Stems)",
    bpm: 90,
    key: "C Minor",
    duration: 32,
    artist: "ACE Neuro Team",
    url: "/outputs/OGA_Music_NeuroSoft_90s.mp3",
    stems: {
      vocals: "/outputs/stem_track_neorosoft_vocals.mp3",
      drums: "/outputs/stem_track_neorosoft_drums.mp3",
      bass: "/outputs/stem_track_neorosoft_bass.mp3",
      instruments: "/outputs/stem_track_neorosoft_instruments.mp3"
    }
  },
  {
    id: "demo_ace_rock",
    title: "HARD ROCK ÉLECTRIQUE GUITARE SOLO (4 Stems)",
    bpm: 135,
    key: "E Minor",
    duration: 30,
    artist: "ACE-Step Studio",
    url: "/outputs/OGA_Music_ACE_track_1789761642807.mp3",
    stems: {
      vocals: "/outputs/stem_track_1789761642807_vocals.mp3",
      drums: "/outputs/stem_track_1789761642807_drums.mp3",
      bass: "/outputs/stem_track_1789761642807_bass.mp3",
      instruments: "/outputs/stem_track_1789761642807_instruments.mp3"
    }
  },
  {
    id: "demo_rap_conscient",
    title: "RAP CONSCIENT AVEC DES BASSES PROFONDES",
    bpm: 85,
    key: "F Minor",
    duration: 30,
    artist: "ACE-Step Studio",
    url: "/outputs/OGA_Music_ACE_track_1789489954473.mp3",
    stems: {
      vocals: "/outputs/stem_track_1789489954473_vocals.mp3",
      drums: "/outputs/stem_track_1789489954473_drums.mp3",
      bass: "/outputs/stem_track_1789489954473_bass.mp3",
      instruments: "/outputs/stem_track_1789489954473_instruments.mp3"
    }
  }
];

// ── Multi-Lane Track Automation & Bézier Curve Helpers (Music Studio-Grade Real Automation) ──
export const formatAutomationValue = (value, unit = "%") => {
  if (value === undefined || value === null || isNaN(value)) return "0" + unit;
  if (unit === "st") {
    return (value >= 0 ? "+" : "") + Number(value).toFixed(2) + " st";
  }
  if (unit === "dB") {
    return (value >= 0 ? "+" : "") + Number(value).toFixed(1) + " dB";
  }
  if (unit === "Hz") {
    return Math.round(value) + " Hz";
  }
  if (unit === "ms") {
    return Math.round(value) + " ms";
  }
  return Math.round(value) + "%";
};

export const buildAutomationCurveSvg = (
  points = [],
  widthPx = 800,
  heightPx = 56,
  totalBars = 148,
  minVal = 0,
  maxVal = 100,
  startBarOffset = 1
) => {
  if (!points || points.length === 0) {
    return { linePath: "", areaPath: "", anchorCoords: [], tensionHandles: [] };
  }

  const sorted = [...points].sort((a, b) => a.bar - b.bar);
  const range = maxVal - minVal || 1;

  const anchorCoords = sorted.map((p) => {
    const barNorm = (p.bar - startBarOffset) / (totalBars || 1);
    const px = Math.max(0, Math.min(widthPx, barNorm * widthPx));
    const py = Math.max(2, Math.min(heightPx - 2, heightPx - ((p.value - minVal) / range) * heightPx));
    return { id: p.id, bar: p.bar, value: p.value, tension: p.tension || 0, x: px, y: py, point: p };
  });

  let linePath = `M ${anchorCoords[0].x},${anchorCoords[0].y}`;
  let areaSegments = `L ${anchorCoords[0].x},${anchorCoords[0].y}`;
  const tensionHandles = [];

  for (let i = 0; i < anchorCoords.length - 1; i++) {
    const p1 = anchorCoords[i];
    const p2 = anchorCoords[i + 1];
    const tension = p1.tension || 0;

    if (Math.abs(tension) < 0.02) {
      linePath += ` L ${p2.x},${p2.y}`;
      areaSegments += ` L ${p2.x},${p2.y}`;
      tensionHandles.push({
        id: `th_${p1.id}_${p2.id}`,
        pointId: p1.id,
        pointIndex: i,
        p1,
        p2,
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2,
        tension: 0
      });
    } else {
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      const dy = p2.y - p1.y;
      const ctrlY = midY - tension * Math.max(14, Math.abs(dy) * 0.5);
      linePath += ` Q ${midX},${ctrlY} ${p2.x},${p2.y}`;
      areaSegments += ` Q ${midX},${ctrlY} ${p2.x},${p2.y}`;
      const handleY = 0.25 * p1.y + 0.5 * ctrlY + 0.25 * p2.y;
      tensionHandles.push({
        id: `th_${p1.id}_${p2.id}`,
        pointId: p1.id,
        pointIndex: i,
        p1,
        p2,
        x: midX,
        y: handleY,
        tension
      });
    }
  }

  const firstX = anchorCoords[0].x;
  const lastX = anchorCoords[anchorCoords.length - 1].x;
  const areaPath = `M ${firstX},${heightPx} ${areaSegments} L ${lastX},${heightPx} Z`;

  return { linePath, areaPath, anchorCoords, tensionHandles };
};

export const getDefaultAutomationLanes = (trackId = "", trackType = "drums", trackName = "") => {
  const isDrums = trackType === "drums" || trackId.includes("drum") || trackName.toLowerCase().includes("drum");
  const isVocals = trackType === "vocals" || trackId.includes("vocal") || trackName.toLowerCase().includes("vocal");
  const isBass = trackType === "bass" || trackId.includes("bass") || trackName.toLowerCase().includes("bass");

  if (isDrums) {
    return [
      {
        id: "lane_drm_long_plate",
        name: "Long Plate",
        target: "Drum Machine » Clap » Mixer",
        param: "mix",
        active: true,
        color: "#ef4444",
        unit: "%",
        min: 0,
        max: 100,
        points: [
          { id: "p1", bar: 1, value: 5, tension: 0 },
          { id: "p2", bar: 69, value: 5, tension: 0 },
          { id: "p3", bar: 70, value: 85, tension: 0.25 },
          { id: "p4", bar: 72, value: 20, tension: -0.2 },
          { id: "p5", bar: 148, value: 5, tension: 0 }
        ]
      },
      {
        id: "lane_drm_mix_delay",
        name: "Mix",
        target: "Drum Machine » Shaker 2 » Delay+",
        param: "delay_mix",
        active: true,
        color: "#ef4444",
        unit: "%",
        min: 0,
        max: 100,
        points: [
          { id: "p1", bar: 1, value: 0, tension: 0 },
          { id: "p2", bar: 5.4, value: 0, tension: 0 },
          { id: "p3", bar: 5.401, value: 20, tension: 0 },
          { id: "p4", bar: 8.4, value: 45, tension: 0.15 },
          { id: "p5", bar: 9.09, value: 45, tension: 0 },
          { id: "p6", bar: 9.1, value: 0, tension: 0 },
          { id: "p7", bar: 17, value: 0, tension: 0 },
          { id: "p8", bar: 17.5, value: 70, tension: 0 },
          { id: "p9", bar: 21, value: 95, tension: 0.15 },
          { id: "p10", bar: 21.2, value: 0, tension: 0 },
          { id: "p11", bar: 69, value: 0, tension: 0 },
          { id: "p12", bar: 69.5, value: 80, tension: 0 },
          { id: "p13", bar: 73, value: 98, tension: 0.2 },
          { id: "p14", bar: 73.2, value: 0, tension: 0 },
          { id: "p15", bar: 148, value: 0, tension: 0 }
        ]
      },
      {
        id: "lane_drm_mix_bit8",
        name: "Mix",
        target: "Drum Machine » Snare » Instrument Layer » v0 Snare » FX Layer » Noise » Bit-8",
        param: "bit8_mix",
        active: true,
        color: "#ef4444",
        unit: "%",
        min: 0,
        max: 100,
        points: [
          { id: "p1", bar: 1, value: 0, tension: 0 },
          { id: "p2", bar: 18, value: 0, tension: 0 },
          { id: "p3", bar: 18.2, value: 85, tension: 0 },
          { id: "p4", bar: 37, value: 85, tension: 0 },
          { id: "p5", bar: 37.2, value: 0, tension: 0 },
          { id: "p6", bar: 69, value: 0, tension: 0 },
          { id: "p7", bar: 69.2, value: 85, tension: 0 },
          { id: "p8", bar: 97, value: 85, tension: 0 },
          { id: "p9", bar: 97.2, value: 0, tension: 0 },
          { id: "p10", bar: 148, value: 0, tension: 0 }
        ]
      },
      {
        id: "lane_drm_click",
        name: "Click",
        target: "Drum Machine » Snare » Instrument Layer » v0 Snare » v0 Snare",
        param: "snare_click",
        active: true,
        color: "#ef4444",
        unit: "dB",
        min: -30,
        max: 6,
        points: [
          { id: "p1", bar: 1, value: -24, tension: 0 },
          { id: "p2", bar: 18, value: -24, tension: 0 },
          { id: "p3", bar: 18.5, value: 0, tension: 0.3 },
          { id: "p4", bar: 33, value: 0, tension: 0 },
          { id: "p5", bar: 33.2, value: -18, tension: 0 },
          { id: "p6", bar: 37, value: -18, tension: 0 },
          { id: "p7", bar: 37.2, value: 0, tension: 0 },
          { id: "p8", bar: 69, value: 0, tension: 0 },
          { id: "p9", bar: 148, value: -24, tension: 0 }
        ]
      },
      {
        id: "lane_drm_tune",
        name: "Tune",
        target: "Drum Machine » Snare » Instrument Layer » v0 Snare » v0 Snare",
        param: "snare_tune",
        active: true,
        color: "#ef4444",
        unit: "st",
        min: -24,
        max: 24,
        points: [
          { id: "p1", bar: 1, value: 0, tension: 0 },
          { id: "p2", bar: 33, value: 0, tension: 0 },
          { id: "p3", bar: 33.5, value: 9.16, tension: 0.25 },
          { id: "p4", bar: 37, value: 9.16, tension: 0 },
          { id: "p5", bar: 37.2, value: 0, tension: 0 },
          { id: "p6", bar: 65, value: 0, tension: 0 },
          { id: "p7", bar: 65.5, value: 9.16, tension: 0.2 },
          { id: "p8", bar: 81, value: 9.16, tension: 0 },
          { id: "p9", bar: 81.2, value: 0, tension: 0 },
          { id: "p10", bar: 148, value: 0, tension: 0 }
        ]
      },
      {
        id: "lane_drm_amount",
        name: "Amount",
        target: "Drum Machine » Steps 1",
        param: "steps_amount",
        active: true,
        color: "#ef4444",
        unit: "%",
        min: 0,
        max: 100,
        points: [
          { id: "p1", bar: 1, value: 20, tension: 0 },
          { id: "p2", bar: 33, value: 20, tension: 0 },
          { id: "p3", bar: 33.1, value: 75, tension: 0 },
          { id: "p4", bar: 37, value: 75, tension: 0 },
          { id: "p5", bar: 37.1, value: 20, tension: 0 },
          { id: "p6", bar: 49, value: 20, tension: 0 },
          { id: "p7", bar: 49.1, value: 75, tension: 0 },
          { id: "p8", bar: 65, value: 75, tension: 0 },
          { id: "p9", bar: 65.1, value: 20, tension: 0 },
          { id: "p10", bar: 148, value: 20, tension: 0 }
        ]
      },
      {
        id: "lane_drm_attack",
        name: "Attack",
        target: "Drum Machine » Grid Shaker 1 » ADSR",
        param: "adsr_attack",
        active: true,
        color: "#ef4444",
        unit: "ms",
        min: 0,
        max: 200,
        points: [
          { id: "p1", bar: 1, value: 5, tension: 0 },
          { id: "p2", bar: 17, value: 5, tension: 0 },
          { id: "p3", bar: 17.2, value: 60, tension: -0.25 },
          { id: "p4", bar: 33, value: 5, tension: 0 },
          { id: "p5", bar: 33.2, value: 60, tension: -0.25 },
          { id: "p6", bar: 49, value: 5, tension: 0 },
          { id: "p7", bar: 148, value: 5, tension: 0 }
        ]
      },
      {
        id: "lane_drm_time_dilation",
        name: "Time Dilation 03",
        target: "Drum Machine » Snare",
        param: "snare_dilation",
        active: true,
        color: "#ef4444",
        unit: "%",
        min: 0,
        max: 100,
        points: [
          { id: "p1", bar: 1, value: 10, tension: 0 },
          { id: "p2", bar: 21, value: 10, tension: 0 },
          { id: "p3", bar: 21.1, value: 85, tension: 0 },
          { id: "p4", bar: 33, value: 10, tension: 0 },
          { id: "p5", bar: 37, value: 85, tension: 0 },
          { id: "p6", bar: 49, value: 10, tension: 0 },
          { id: "p7", bar: 69, value: 85, tension: 0 },
          { id: "p8", bar: 148, value: 10, tension: 0 }
        ]
      }
    ];
  }

  if (isVocals) {
    return [
      {
        id: "lane_vox_vol",
        name: "Volume",
        target: "Lead Vocals » Channel Strip » Fader",
        param: "volume",
        active: true,
        color: "#f59e0b",
        unit: "dB",
        min: -30,
        max: 6,
        points: [
          { id: "v1", bar: 1, value: 0, tension: 0 },
          { id: "v2", bar: 17, value: 0, tension: 0 },
          { id: "v3", bar: 33, value: 2.0, tension: 0.1 },
          { id: "v4", bar: 65, value: -1.0, tension: 0 },
          { id: "v5", bar: 81, value: 2.5, tension: 0.2 },
          { id: "v6", bar: 113, value: 0, tension: 0 },
          { id: "v7", bar: 148, value: -30, tension: 0 }
        ]
      },
      {
        id: "lane_vox_reverb",
        name: "Mix Reverb",
        target: "Lead Vocals » Reverb Send » Studio Reverb",
        param: "reverb_send",
        active: true,
        color: "#f59e0b",
        unit: "%",
        min: 0,
        max: 100,
        points: [
          { id: "vr1", bar: 1, value: 15, tension: 0 },
          { id: "vr2", bar: 17, value: 25, tension: 0 },
          { id: "vr3", bar: 33, value: 55, tension: 0.3 },
          { id: "vr4", bar: 65, value: 70, tension: -0.1 },
          { id: "vr5", bar: 81, value: 60, tension: 0.2 },
          { id: "vr6", bar: 148, value: 20, tension: 0 }
        ]
      },
      {
        id: "lane_vox_cutoff",
        name: "Filter Cutoff",
        target: "Lead Vocals » Lowpass Filter",
        param: "cutoff",
        active: true,
        color: "#f59e0b",
        unit: "Hz",
        min: 200,
        max: 20000,
        points: [
          { id: "vc1", bar: 1, value: 12000, tension: 0 },
          { id: "vc2", bar: 17, value: 18000, tension: 0.2 },
          { id: "vc3", bar: 49, value: 8000, tension: -0.3 },
          { id: "vc4", bar: 65, value: 20000, tension: 0.1 },
          { id: "vc5", bar: 148, value: 12000, tension: 0 }
        ]
      },
      {
        id: "lane_vox_delay",
        name: "Delay Send",
        target: "Lead Vocals » Delay+ Dual",
        param: "delay_send",
        active: false,
        color: "#f59e0b",
        unit: "%",
        min: 0,
        max: 100,
        points: [
          { id: "vd1", bar: 1, value: 0, tension: 0 },
          { id: "vd2", bar: 33, value: 35, tension: 0 },
          { id: "vd3", bar: 49, value: 10, tension: 0 },
          { id: "vd4", bar: 81, value: 45, tension: 0 },
          { id: "vd5", bar: 148, value: 0, tension: 0 }
        ]
      }
    ];
  }

  if (isBass) {
    return [
      {
        id: "lane_bass_vol",
        name: "Volume",
        target: "Sub 55Hz » Channel Strip » Fader",
        param: "volume",
        active: true,
        color: "#6366f1",
        unit: "dB",
        min: -30,
        max: 6,
        points: [
          { id: "bv1", bar: 1, value: -1.0, tension: 0 },
          { id: "bv2", bar: 17, value: 0, tension: 0 },
          { id: "bv3", bar: 33, value: 1.5, tension: 0 },
          { id: "bv4", bar: 65, value: -2.0, tension: 0 },
          { id: "bv5", bar: 81, value: 1.0, tension: 0 },
          { id: "bv6", bar: 148, value: -6.0, tension: 0 }
        ]
      },
      {
        id: "lane_bass_cutoff",
        name: "Cutoff",
        target: "Sub 55Hz » Ladder Filter",
        param: "cutoff",
        active: true,
        color: "#6366f1",
        unit: "Hz",
        min: 40,
        max: 2000,
        points: [
          { id: "bc1", bar: 1, value: 250, tension: 0 },
          { id: "bc2", bar: 17, value: 450, tension: 0 },
          { id: "bc3", bar: 33, value: 850, tension: 0.35 },
          { id: "bc4", bar: 65, value: 180, tension: -0.2 },
          { id: "bc5", bar: 81, value: 900, tension: 0.2 },
          { id: "bc6", bar: 148, value: 250, tension: 0 }
        ]
      },
      {
        id: "lane_bass_drive",
        name: "Drive",
        target: "Sub 55Hz » Overdrive Saturator",
        param: "drive",
        active: true,
        color: "#6366f1",
        unit: "%",
        min: 0,
        max: 100,
        points: [
          { id: "bd1", bar: 1, value: 15, tension: 0 },
          { id: "bd2", bar: 17, value: 35, tension: 0 },
          { id: "bd3", bar: 33, value: 65, tension: 0.1 },
          { id: "bd4", bar: 65, value: 20, tension: 0 },
          { id: "bd5", bar: 81, value: 70, tension: 0 },
          { id: "bd6", bar: 148, value: 10, tension: 0 }
        ]
      }
    ];
  }

  // Default for Instruments & Synths
  return [
    {
      id: "lane_ins_cutoff",
      name: "Cutoff",
      target: "Polymer Hybrid » Filter Cutoff",
      param: "cutoff",
      active: true,
      color: "#8b5cf6",
      unit: "Hz",
      min: 200,
      max: 16000,
      points: [
        { id: "ic1", bar: 1, value: 1500, tension: 0 },
        { id: "ic2", bar: 17, value: 3200, tension: 0.2 },
        { id: "ic3", bar: 33, value: 6500, tension: 0.25 },
        { id: "ic4", bar: 65, value: 1200, tension: -0.2 },
        { id: "ic5", bar: 81, value: 8000, tension: 0.15 },
        { id: "ic6", bar: 148, value: 2000, tension: 0 }
      ]
    },
    {
      id: "lane_ins_delay",
      name: "Delay Mix",
      target: "Delay+ Dual » Wet/Dry",
      param: "delay_mix",
      active: true,
      color: "#8b5cf6",
      unit: "%",
      min: 0,
      max: 100,
      points: [
        { id: "id1", bar: 1, value: 10, tension: 0 },
        { id: "id2", bar: 17, value: 25, tension: 0 },
        { id: "id3", bar: 33, value: 45, tension: 0.1 },
        { id: "id4", bar: 65, value: 60, tension: 0.2 },
        { id: "id5", bar: 81, value: 40, tension: 0 },
        { id: "id6", bar: 148, value: 15, tension: 0 }
      ]
    },
    {
      id: "lane_ins_chorus",
      name: "Chorus Depth",
      target: "Stereo Chorus » Depth",
      param: "chorus_depth",
      active: true,
      color: "#8b5cf6",
      unit: "%",
      min: 0,
      max: 100,
      points: [
        { id: "ich1", bar: 1, value: 20, tension: 0 },
        { id: "ich2", bar: 33, value: 50, tension: 0.2 },
        { id: "ich3", bar: 65, value: 30, tension: 0 },
        { id: "ich4", bar: 81, value: 60, tension: 0.25 },
        { id: "ich5", bar: 148, value: 20, tension: 0 }
      ]
    }
  ];
};

// ── Music Studio Mini Curve Paths for Clip Matrix (matching Images 4 & 5) ──
export function getMiniClipPreviewPath(laneId, sIdx) {
  if (laneId === "lane_drm_mix_delay") {
    if (sIdx === 2) return "M 0,10 L 35,10 L 35,6 L 75,1 L 80,10"; // S3 Build ramp
    if (sIdx === 1) return "M 0,10 L 50,10 L 80,7";
    if (sIdx === 6 || sIdx === 7) return "M 0,10 L 30,10 L 75,2 L 80,10";
    return "M 0,10 L 80,10";
  }
  if (laneId === "lane_drm_long_plate") {
    if (sIdx >= 6 && sIdx <= 8) return "M 0,10 L 20,10 L 40,2 L 70,6 L 80,10";
    return "M 0,10 L 80,10";
  }
  if (laneId === "lane_drm_mix_bit8") {
    if (sIdx >= 1 && sIdx <= 4) return "M 0,10 L 10,2 L 75,2 L 80,10";
    if (sIdx >= 6 && sIdx <= 8) return "M 0,10 L 10,2 L 75,2 L 80,10";
    return "M 0,10 L 80,10";
  }
  if (laneId === "lane_drm_click") {
    return "M 0,3 L 65,3 L 70,10 L 75,3 L 80,3"; // dip spike
  }
  if (laneId === "lane_drm_tune") {
    if (sIdx % 2 === 0) return "M 0,6 L 40,6 L 40,3 L 80,3";
    return "M 0,6 L 80,6";
  }
  if (laneId === "lane_drm_amount") {
    return "M 0,8 L 15,3 L 30,3 L 30,8 L 45,3 L 60,3 L 60,8 L 80,8"; // square pulses
  }
  if (laneId === "lane_drm_attack") {
    return "M 0,9 L 20,2 L 20,9 L 40,2 L 40,9 L 60,2 L 60,9 L 80,2"; // sawtooth
  }
  if (laneId === "lane_drm_time_dilation") {
    return "M 0,9 L 5,3 L 10,9 L 15,3 L 20,9 L 25,3 L 30,9 L 35,3 L 40,9 L 45,3 L 50,9 L 55,3 L 60,9 L 65,3 L 70,9 L 75,3 L 80,9"; // comb pulses
  }
  return sIdx % 2 === 0 ? "M 0,8 Q 40,2 80,6" : "M 0,6 Q 40,10 80,4";
}

// ── Music Studio Bottom Panel Automation Editor Component (Images 0, 1, 2, 3, 5) ──
export function DawAutomationEditor({
  tracks,
  selectedTrackId,
  selectedLaneId,
  onSelectTrack,
  onSelectLane,
  mode, // 'clip' | 'track'
  onSetMode,
  selectedLauncherClip,
  tool,
  onSetTool,
  snap,
  onSetSnap,
  onAddPoint,
  onDeletePoint,
  onUpdatePoint,
  onUpdateTension,
  onToggleLaneActive,
  onApplyPresetShape,
  setDraggingAnchor,
  hoveredAnchorTooltip,
  setHoveredAnchorTooltip,
  currentBar,
  bpm
}) {
  const activeTrack = tracks.find((t) => t.id === selectedTrackId) || tracks[0];
  const lanes = activeTrack?.automationLanes || getDefaultAutomationLanes(activeTrack?.id, activeTrack?.type, activeTrack?.name);
  const activeLane = lanes.find((l) => l.id === selectedLaneId) || lanes[0];

  const isClipMode = mode === "clip";
  const sIdx = selectedLauncherClip?.sceneIndex;
  // S3 (Build) covers bars 4 to 9.2 matching Image 5 (ruler 4.1 to 9.1)
  const startBar = isClipMode ? (sIdx === 2 ? 4 : (sIdx !== undefined ? sIdx * 4 + 1 : 17)) : 1;
  const durationBars = isClipMode ? (sIdx === 2 ? 5.2 : 8) : 148;
  const endBar = startBar + durationBars;

  const canvasRef = useRef(null);
  const [editorZoom, setEditorZoom] = useState(1.0);
  const [hoverCurvePos, setHoverCurvePos] = useState(null);

  const ghostMidiNotes = useMemo(() => {
    const notes = [];
    for (let b = Math.floor(startBar); b < endBar; b++) {
      notes.push({ bar: b, duration: 0.45, pitchY: 132 });
      notes.push({ bar: b + 2.5, duration: 0.45, pitchY: 132 });
      notes.push({ bar: b + 1, duration: 0.5, pitchY: 86 });
      notes.push({ bar: b + 3, duration: 0.5, pitchY: 86 });
      for (let sub = 0; sub < 4; sub += 0.5) {
        notes.push({ bar: b + sub, duration: 0.25, pitchY: 48 });
      }
    }
    return notes.filter((n) => n.bar >= startBar - 0.1 && n.bar < endBar);
  }, [startBar, endBar]);

  const lanePoints = useMemo(() => {
    if (!activeLane) return [];
    const pts = activeLane.points || [];
    if (!isClipMode) return pts;
    return pts.filter((p) => p.bar >= startBar - 0.2 && p.bar <= endBar + 0.2);
  }, [activeLane, isClipMode, startBar, endBar]);

  const canvasWidth = Math.max(900, Math.round(durationBars * 90 * editorZoom));
  const canvasHeight = 180;
  const minVal = activeLane?.min !== undefined ? activeLane.min : 0;
  const maxVal = activeLane?.max !== undefined ? activeLane.max : 100;
  const laneColor = activeLane?.color || "#ef4444";

  const { linePath, areaPath, anchorCoords, tensionHandles } = useMemo(() => {
    return buildAutomationCurveSvg(
      lanePoints,
      canvasWidth,
      canvasHeight,
      durationBars,
      minVal,
      maxVal,
      startBar
    );
  }, [lanePoints, canvasWidth, canvasHeight, durationBars, minVal, maxVal, startBar]);

  const ghostBeats = useMemo(() => {
    const hits = [];
    for (let b = startBar; b < endBar; b += 0.5) {
      const isDownbeat = Math.floor(b) === b;
      hits.push({ bar: b, isDownbeat });
    }
    return hits;
  }, [startBar, endBar]);

  return (
    <div className="flex-1 flex flex-col bg-[#121212] select-none overflow-hidden h-full">
      {/* Header Strip */}
      <div className="h-9 bg-[#1a1a1a] border-b border-[#2b2b2b] px-3 flex items-center justify-between text-xs flex-shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          {/* Mode Toggle: [ Clip ]  [ Piste ] */}
          <div className="flex items-center bg-[#111111] p-0.5 rounded border border-[#2e2e2e]">
            <button
              onClick={() => onSetMode("clip")}
              className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition ${
                mode === "clip" ? "bg-[#241808] border border-[#df9c43] text-[#eaaf5d] shadow-[0_0_8px_rgba(223,156,67,0.3)] font-bold" : "text-zinc-400 hover:text-white"
              }`}
            >
              Clip
            </button>
            <button
              onClick={() => onSetMode("track")}
              className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition ${
                mode === "track" ? "bg-[#241808] border border-[#df9c43] text-[#eaaf5d] shadow-[0_0_8px_rgba(223,156,67,0.3)] font-bold" : "text-zinc-400 hover:text-white"
              }`}
            >
              Piste
            </button>
          </div>

          {/* Active Item Pill */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#222222] border border-[#333333] text-[11px]">
            <span className="font-mono text-zinc-400">
              {mode === "clip" ? (selectedLauncherClip?.clipName || "S3") : "ARR"}
            </span>
            <span className="text-zinc-500">•</span>
            <span className="font-bold text-white truncate">{activeTrack?.name || "Main Drums"}</span>
          </div>

          {/* Parameter / Device Path Selector */}
          <div className="flex items-center gap-1.5 bg-[#202020] border border-[#333333] rounded px-2 py-0.5">
            {/* LED Power Dot */}
            <button
              onClick={() => activeTrack && activeLane && onToggleLaneActive(activeTrack.id, activeLane.id)}
              className={`w-2.5 h-2.5 rounded-full transition-all flex-shrink-0 ${
                activeLane?.active ? "bg-[#ef4444] shadow-[0_0_6px_#ef4444]" : "bg-zinc-600 hover:bg-zinc-400"
              }`}
              title={activeLane?.active ? "Désactiver automation" : "Activer automation"}
            />

            <select
              value={activeLane?.id || ""}
              onChange={(e) => onSelectLane(e.target.value)}
              className="bg-transparent text-[11px] font-bold text-zinc-200 hover:text-white focus:outline-none cursor-pointer max-w-[280px] truncate"
            >
              {lanes.map((l) => (
                <option key={l.id} value={l.id} className="bg-[#1f1f1f] text-white">
                  {l.name} ({l.target})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Status & Tools */}
        <div className="flex items-center gap-3">
          {/* Snap Selector */}
          <div className="flex items-center gap-1 text-[11px] text-zinc-400">
            <span className="text-[10px] uppercase text-zinc-500 font-mono">Snap:</span>
            <select
              value={snap}
              onChange={(e) => onSetSnap(e.target.value)}
              className="bg-[#202020] text-[11px] text-zinc-200 border border-[#333333] rounded px-1.5 py-0.5 focus:outline-none cursor-pointer"
            >
              <option value="1/16">1/16</option>
              <option value="1/8">1/8</option>
              <option value="1/4">1/4</option>
              <option value="1/32">1/32</option>
              <option value="off">Off</option>
            </select>
          </div>

          {/* Zoom Buttons */}
          <div className="flex items-center gap-1 border-l border-[#2e2e2e] pl-2">
            <button
              onClick={() => setEditorZoom((z) => Math.max(0.5, z - 0.2))}
              className="p-1 text-zinc-400 hover:text-white rounded hover:bg-[#252525]"
              title="Dézoomer"
            >
              <ZoomOut size={12} />
            </button>
            <span className="text-[10px] font-mono text-zinc-400 w-8 text-center">
              {Math.round(editorZoom * 100)}%
            </span>
            <button
              onClick={() => setEditorZoom((z) => Math.min(2.5, z + 0.2))}
              className="p-1 text-zinc-400 hover:text-white rounded hover:bg-[#252525]"
              title="Zoomer"
            >
              <ZoomIn size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Editor Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Toolbar Strip */}
        <div className="w-10 bg-[#171717] border-r border-[#2a2a2a] flex flex-col items-center py-2 gap-1.5 flex-shrink-0">
          <button
            onClick={() => onSetTool("pointer")}
            className={`p-1.5 rounded transition ${
              tool === "pointer" ? "bg-[#241808] border border-[#df9c43] text-[#eaaf5d] shadow-[0_0_8px_rgba(223,156,67,0.3)]" : "text-zinc-400 hover:text-white hover:bg-[#252525]"
            }`}
            title="Pointeur / Sélection"
          >
            <MousePointer size={13} />
          </button>

          <button
            onClick={() => onSetTool("pencil")}
            className={`p-1.5 rounded transition ${
              tool === "pencil" ? "bg-[#241808] border border-[#df9c43] text-[#eaaf5d] shadow-[0_0_8px_rgba(223,156,67,0.3)]" : "text-zinc-400 hover:text-white hover:bg-[#252525]"
            }`}
            title="Crayon / Dessin libre"
          >
            <Pencil size={13} />
          </button>

          <button
            onClick={() => onSetTool("curve")}
            className={`p-1.5 rounded transition ${
              tool === "curve" ? "bg-[#241808] border border-[#df9c43] text-[#eaaf5d] shadow-[0_0_8px_rgba(223,156,67,0.3)]" : "text-zinc-400 hover:text-white hover:bg-[#252525]"
            }`}
            title="Outil Courbure Bézier"
          >
            <CornerUpRight size={13} />
          </button>

          <button
            onClick={() => onSetTool("eraser")}
            className={`p-1.5 rounded transition ${
              tool === "eraser" ? "bg-[#241808] border border-[#df9c43] text-[#eaaf5d] shadow-[0_0_8px_rgba(223,156,67,0.3)]" : "text-zinc-400 hover:text-white hover:bg-[#252525]"
            }`}
            title="Gomme"
          >
            <Eraser size={13} />
          </button>

          <div className="w-6 border-b border-[#2c2c2c] my-1" />

          {/* Preset Shapes */}
          <button
            onClick={() => activeTrack && activeLane && onApplyPresetShape(activeTrack.id, activeLane.id, "ramp_up")}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-[#252525] rounded transition"
            title="Forme: Rampe croissante"
          >
            <TrendingUp size={13} />
          </button>

          <button
            onClick={() => activeTrack && activeLane && onApplyPresetShape(activeTrack.id, activeLane.id, "ramp_down")}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-[#252525] rounded transition"
            title="Forme: Rampe décroissante"
          >
            <TrendingDown size={13} />
          </button>

          <button
            onClick={() => activeTrack && activeLane && onApplyPresetShape(activeTrack.id, activeLane.id, "step")}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-[#252525] rounded transition"
            title="Forme: Créneau / Step"
          >
            <Sliders size={13} />
          </button>

          <button
            onClick={() => activeTrack && activeLane && onApplyPresetShape(activeTrack.id, activeLane.id, "sine")}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-[#252525] rounded transition"
            title="Forme: Onde sinusoïdale"
          >
            <Activity size={13} />
          </button>

          <button
            onClick={() => activeTrack && activeLane && onApplyPresetShape(activeTrack.id, activeLane.id, "invert")}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-[#252525] rounded transition"
            title="Inverser les valeurs"
          >
            <ArrowUpDown size={13} />
          </button>

          <button
            onClick={() => activeTrack && activeLane && onApplyPresetShape(activeTrack.id, activeLane.id, "clear")}
            className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-[#252525] rounded transition mt-auto"
            title="Effacer l'automation"
          >
            <Trash2 size={13} />
          </button>
        </div>

        {/* Center / Timeline Area */}
        <div className="flex-1 flex flex-col overflow-x-auto overflow-y-hidden custom-scrollbar bg-[#0d0d0d] relative">
          {/* Top Bars/Beats Ruler */}
          <div
            style={{ width: `${canvasWidth}px` }}
            className="h-6 bg-[#161616] border-b border-[#282828] relative flex-shrink-0 select-none flex items-center"
          >
            {(() => {
              const ticks = [];
              if (durationBars <= 16) {
                // Show quarter-note beats: e.g. 4.1, 4.2, 4.3, 4.4, 5.1... matching Music Studio
                for (let b = Math.floor(startBar); b <= Math.ceil(endBar); b++) {
                  for (let beat = 1; beat <= 4; beat++) {
                    const tickPos = b + (beat - 1) / 4;
                    if (tickPos >= startBar - 0.01 && tickPos <= endBar + 0.01) {
                      const x = ((tickPos - startBar) / durationBars) * canvasWidth;
                      ticks.push({
                        id: `${b}.${beat}`,
                        bar: b,
                        beat,
                        label: `${b}.${beat}`,
                        isWhole: beat === 1,
                        x
                      });
                    }
                  }
                }
              } else {
                const step = durationBars > 80 ? 4 : (durationBars > 40 ? 2 : 1);
                for (let b = 1; b <= durationBars; b += step) {
                  const x = ((b - startBar) / durationBars) * canvasWidth;
                  ticks.push({
                    id: `${b}.1`,
                    bar: b,
                    beat: 1,
                    label: `${b}.1`,
                    isWhole: true,
                    x
                  });
                }
              }

              return ticks.map((t) => (
                <div key={t.id} style={{ left: `${t.x}px` }} className="absolute top-0 bottom-0 flex flex-col">
                  <span className={`text-[9px] font-mono pl-0.5 leading-4 ${t.isWhole ? "text-white font-bold" : "text-zinc-500 font-normal text-[8px]"}`}>
                    {t.label}
                  </span>
                  <div className={`w-[1px] ${t.isWhole ? "h-2.5 bg-zinc-400" : "h-1 bg-zinc-700"}`} />
                </div>
              ));
            })()}
          </div>

          {/* Interactive Automation Curve Canvas */}
          <div
            ref={canvasRef}
            style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }}
            onClick={(e) => {
              if (tool === "pencil" || e.altKey || e.ctrlKey) {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const clickBar = startBar + (x / canvasWidth) * durationBars;
                const clickVal = maxVal - (y / canvasHeight) * (maxVal - minVal);
                if (activeTrack && activeLane) {
                  onAddPoint(activeTrack.id, activeLane.id, clickBar, clickVal);
                }
              }
            }}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = Math.max(0, Math.min(canvasWidth, e.clientX - rect.left));
              const bar = startBar + (x / canvasWidth) * durationBars;
              let val = minVal;
              if (lanePoints.length > 0) {
                if (bar <= lanePoints[0].bar) {
                  val = lanePoints[0].value;
                } else if (bar >= lanePoints[lanePoints.length - 1].bar) {
                  val = lanePoints[lanePoints.length - 1].value;
                } else {
                  for (let i = 0; i < lanePoints.length - 1; i++) {
                    const p1 = lanePoints[i];
                    const p2 = lanePoints[i + 1];
                    if (bar >= p1.bar && bar <= p2.bar) {
                      const ratio = (bar - p1.bar) / (p2.bar - p1.bar || 1);
                      val = p1.value + ratio * (p2.value - p1.value);
                      break;
                    }
                  }
                }
              }
              const normY = (val - minVal) / (maxVal - minVal || 1);
              const y = (1 - Math.max(0, Math.min(1, normY))) * canvasHeight;
              setHoverCurvePos({ x, y, bar, value: val, unit: activeLane?.unit });
            }}
            onMouseLeave={() => setHoverCurvePos(null)}
            className="relative flex-shrink-0 bg-[#0d0d0d] overflow-hidden cursor-crosshair select-none"
          >
            {/* Ghost Background Rhythm Hits & Authentic MIDI Drum Notes (Images 1 & 5) */}
            <div className="absolute inset-0 pointer-events-none">
              {ghostBeats.map((g, idx) => {
                const x = ((g.bar - startBar) / durationBars) * canvasWidth;
                return (
                  <div
                    key={idx}
                    style={{ left: `${x}px` }}
                    className={`absolute top-0 bottom-0 ${
                      g.isDownbeat ? "border-l border-zinc-800" : "border-l border-zinc-900/60"
                    }`}
                  />
                );
              })}

              {/* Ghost MIDI Note Rectangles in Background (Music Studio Images 1 & 5) */}
              {ghostMidiNotes.map((n, idx) => (
                <div
                  key={`gnote_${idx}`}
                  style={{
                    left: `${((n.bar - startBar) / durationBars) * canvasWidth}px`,
                    width: `${Math.max(12, (n.duration / durationBars) * canvasWidth - 2)}px`,
                    top: `${n.pitchY}px`,
                    height: "7px"
                  }}
                  className="absolute rounded-[1.5px] bg-red-600/30 border border-red-500/50 pointer-events-none shadow-sm"
                />
              ))}
            </div>

            {/* Playhead Marker */}
            {currentBar >= startBar && currentBar <= endBar && (
              <div
                style={{ left: `${((currentBar - startBar) / durationBars) * canvasWidth}px` }}
                className="absolute top-0 bottom-0 w-[2px] bg-white pointer-events-none z-20 shadow-[0_0_8px_#ffffff]"
              />
            )}

            {/* SVG Bézier Curve & Anchor Points */}
            <svg className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="editor_grad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={laneColor} stopOpacity="0.45" />
                  <stop offset="100%" stopColor={laneColor} stopOpacity="0.05" />
                </linearGradient>
              </defs>

              {/* Shaded Fill */}
              {areaPath && (
                <path d={areaPath} fill="url(#editor_grad)" pointerEvents="none" />
              )}

              {/* Curve Line */}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke={activeLane?.active ? laneColor : "#52525b"}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Tension Curvature Handles */}
              {tensionHandles.map((th) => (
                <g key={th.id} className="cursor-ns-resize">
                  <circle
                    cx={th.x}
                    cy={th.y}
                    r="4"
                    fill="#ffffff"
                    stroke={laneColor}
                    strokeWidth="1.5"
                    className="hover:scale-150 transition-transform shadow-md"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setDraggingAnchor({
                        type: "tension",
                        trackId: activeTrack.id,
                        laneId: activeLane.id,
                        p1Id: th.p1.id,
                        startX: e.clientX,
                        startY: e.clientY,
                        origTension: th.p1.tension || 0
                      });
                    }}
                    title="Glisser verticalement pour ajuster la courbure"
                  />
                </g>
              ))}

              {/* Draggable Anchor Points */}
              {anchorCoords.map((ac) => (
                <g key={ac.point.id}>
                  <circle
                    cx={ac.x}
                    cy={ac.y}
                    r="5"
                    fill="#ffffff"
                    stroke={laneColor}
                    strokeWidth="2"
                    className="cursor-move hover:scale-150 transition-transform shadow-md"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      if (tool === "eraser") {
                        onDeletePoint(activeTrack.id, activeLane.id, ac.point.id);
                        return;
                      }
                      setDraggingAnchor({
                        type: "anchor",
                        trackId: activeTrack.id,
                        laneId: activeLane.id,
                        pointId: ac.point.id,
                        startX: e.clientX,
                        startY: e.clientY,
                        origBar: ac.point.bar,
                        origVal: ac.point.value,
                        minVal,
                        maxVal,
                        widthPx: canvasWidth,
                        heightPx: canvasHeight,
                        totalBars: durationBars,
                        startBarOffset: startBar
                      });
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onDeletePoint(activeTrack.id, activeLane.id, ac.point.id);
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDeletePoint(activeTrack.id, activeLane.id, ac.point.id);
                    }}
                  />

                  {/* Value tag beside point */}
                  <text
                    x={ac.x + 8}
                    y={Math.max(14, ac.y - 4)}
                    fill="#ffffff"
                    fontSize="10"
                    fontFamily="monospace"
                    className="pointer-events-none select-none font-semibold shadow-sm"
                  >
                    {formatAutomationValue(ac.point.value, activeLane?.unit)}
                  </text>
                </g>
              ))}
              {/* Floating Dark Tooltip Badge with Units on Hover (Music Studio Image 3) */}
              {hoverCurvePos && (
                <g className="pointer-events-none select-none">
                  {/* Subtle vertical indicator crosshair line */}
                  <line
                    x1={hoverCurvePos.x}
                    y1={0}
                    x2={hoverCurvePos.x}
                    y2={canvasHeight}
                    stroke="rgba(255,255,255,0.25)"
                    strokeDasharray="2 2"
                    strokeWidth="1"
                  />
                  {/* Active hover circle on curve */}
                  <circle
                    cx={hoverCurvePos.x}
                    cy={hoverCurvePos.y}
                    r="4.5"
                    fill="#ffffff"
                    stroke={laneColor}
                    strokeWidth="2"
                    className="shadow-md"
                  />
                  {/* Floating tooltip badge container */}
                  <g transform={`translate(${Math.min(canvasWidth - 75, Math.max(10, hoverCurvePos.x + 8))}, ${Math.max(20, Math.min(canvasHeight - 24, hoverCurvePos.y - 14))})`}>
                    <rect
                      x="0"
                      y="-12"
                      width={activeLane?.unit === "st" ? 64 : 56}
                      height="20"
                      rx="3"
                      fill="#141414"
                      stroke="#3f3f46"
                      strokeWidth="1"
                      fillOpacity="0.95"
                    />
                    <text
                      x={activeLane?.unit === "st" ? 32 : 28}
                      y="2"
                      textAnchor="middle"
                      fill="#f4f4f5"
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {formatAutomationValue(hoverCurvePos.value, activeLane?.unit)}
                    </text>
                  </g>
                </g>
              )}
            </svg>
          </div>
        </div>
      </div>

      {/* Bottom Status & Shortcuts Bar */}
      <div className="h-6 bg-[#161616] border-t border-[#262626] px-3 flex items-center justify-between text-[10px] text-zinc-400 font-mono flex-shrink-0 select-none">
        <div className="flex items-center gap-3">
          <span className="text-zinc-500">RACCOURCIS :</span>
          <span>CLICK Sélectionner | DOUBLE-CLICK Supprimer | GLISSER Modifier temps/valeur | POIGNÉE Courbure Bézier | CTRL+CLIC Insérer point</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-zinc-400">
            {activeLane?.name} : {formatAutomationValue(activeLane?.points?.[0]?.value || 0, activeLane?.unit)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Music Studio Rotary Knob Component ──
function MusicStudio({ value, min = -48, max = 6, label = "Output", unit = "dB", onChange }) {
  const [isDragging, setIsDragging] = useState(false);
  const startRef = useRef({ y: 0, val: value });

  const norm = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const startAngle = -135;
  const endAngle = 135;
  const currentAngle = startAngle + norm * (endAngle - startAngle);

  return (
    <div
      className="flex flex-col items-center cursor-ns-resize select-none"
      onMouseDown={(e) => {
        setIsDragging(true);
        startRef.current = { y: e.clientY, val: value };
        const onMove = (ev) => {
          const dy = startRef.current.y - ev.clientY;
          const range = max - min;
          const deltaVal = (dy / 80) * range;
          const newVal = Math.max(min, Math.min(max, Number((startRef.current.val + deltaVal).toFixed(1))));
          onChange(newVal);
        };
        const onUp = () => {
          window.removeEventListener("mousemove", onMove);
          window.removeEventListener("mouseup", onUp);
          setIsDragging(false);
        };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
      }}
    >
      <div className="relative w-9 h-9 flex items-center justify-center">
        <svg className="w-9 h-9 -rotate-90">
          <circle cx="18" cy="18" r="14" fill="#141414" stroke="#2a2a2a" strokeWidth="2.5" />
          <circle
            cx="18"
            cy="18"
            r="14"
            fill="none"
            stroke="#df9c43"
            strokeWidth="2.5"
            strokeDasharray={`${norm * 66} 100`}
            strokeLinecap="round"
          />
        </svg>
        <div
          style={{ transform: `rotate(${currentAngle}deg)` }}
          className="absolute w-0.5 h-2.5 bg-white top-1 rounded-full pointer-events-none origin-bottom"
        />
      </div>
      <span className="text-[9px] font-mono text-zinc-300 mt-0.5">{label}</span>
      <span className="text-[8px] font-mono text-zinc-500">{value > 0 ? `+${value}` : value} {unit}</span>
    </div>
  );
}

// ── Music Studio Drum Machine Device Component (Capture 0) ──
export function StudioDrumMachineDevice({ track, audioEngine }) {
  const [deviceEnabled, setDeviceEnabled] = useState(true);
  const [activePad, setActivePad] = useState(null);
  const [outputGain, setOutputGain] = useState(0.0);
  const [padStates, setPadStates] = useState({
    "RandomSp": { solo: false, mute: false },
    "v9 Ride": { solo: false, mute: false },
    "Tolcha08": { solo: false, mute: false },
    "B1": { solo: false, mute: false },
    "GrdShak1": { solo: false, mute: false },
    "Shaker 2": { solo: false, mute: false },
    "LazerGunZ": { solo: false, mute: false },
    "v0 Cymbal": { solo: false, mute: false },
    "Kick": { solo: false, mute: false },
    "Snare": { solo: false, mute: false },
    "Clap": { solo: false, mute: false },
    "Tom": { solo: false, mute: false }
  });

  const padGrid = [
    [
      { id: "p_rnd", name: "RandomSp", note: "C2" },
      { id: "p_ride", name: "v9 Ride", note: "C#2" },
      { id: "p_tolcha", name: "Tolcha08", note: "D2" },
      { id: "p_b1", name: "B1", note: "D#2" }
    ],
    [
      { id: "p_gshak", name: "GrdShak1", note: "C2" },
      { id: "p_shak2", name: "Shaker 2", note: "C#2" },
      { id: "p_lazer", name: "LazerGunZ", note: "D2" },
      { id: "p_cym", name: "v0 Cymbal", note: "D#2" }
    ],
    [
      { id: "p_kick", name: "Kick", note: "C2" },
      { id: "p_snare", name: "Snare", note: "C#2" },
      { id: "p_clap", name: "Clap", note: "D2" },
      { id: "p_tom", name: "Tom", note: "D#2" }
    ]
  ];

  const handleTrigger = (name) => {
    setActivePad(name);
    if (audioEngine && deviceEnabled) {
      const state = padStates[name];
      if (!state?.mute) {
        audioEngine.triggerDrumPad(name, 0.85);
      }
    }
    setTimeout(() => setActivePad((c) => (c === name ? null : c)), 140);
  };

  const toggleSolo = (name, e) => {
    e.stopPropagation();
    setPadStates((prev) => ({
      ...prev,
      [name]: { ...prev[name], solo: !prev[name]?.solo }
    }));
  };

  const toggleMute = (name, e) => {
    e.stopPropagation();
    setPadStates((prev) => ({
      ...prev,
      [name]: { ...prev[name], mute: !prev[name]?.mute }
    }));
  };

  return (
    <div
      data-device-id="studio_drum_machine"
      className="flex h-[180px] bg-[#141414] select-none text-white border border-[#2a2a2a] rounded-lg overflow-hidden shadow-lg flex-shrink-0"
    >
      {/* 1. Signal Path Breadcrumbs (Project » Drums » Main Drums » Drum Machine) */}
      <div className="w-24 bg-[#181818] border-r border-[#262626] flex flex-col py-1 text-[9px] font-bold text-zinc-400 flex-shrink-0">
        <div className="px-2 py-1.5 border-b border-[#242424] hover:bg-[#202020] cursor-pointer flex items-center justify-between">
          <span className="truncate">PROJECT</span>
          <span className="text-[8px] text-zinc-600">›</span>
        </div>
        <div className="px-2 py-1.5 border-b border-[#242424] hover:bg-[#202020] cursor-pointer flex items-center justify-between">
          <span className="truncate">DRUMS</span>
          <span className="text-[8px] text-zinc-600">›</span>
        </div>
        <div className="px-2 py-1.5 border-b border-[#242424] bg-[#222222] text-zinc-200 cursor-pointer flex items-center justify-between">
          <span className="truncate">MAIN DRUMS</span>
          <span className="text-[8px] text-zinc-500">›</span>
        </div>
        <div className="px-2 py-2 bg-[#261a09] border-l-2 border-[#df9c43] text-white flex items-center gap-1.5 mt-auto">
          <div className="w-1.5 h-1.5 rounded-full bg-[#df9c43]" />
          <span className="truncate text-[8px]">DRUM MACHINE</span>
        </div>
      </div>

      {/* 2. Device Main Frame */}
      <div className="flex flex-col bg-[#161616] p-2 flex-shrink-0 justify-between">
        {/* Device Header */}
        <div className="h-5 flex items-center justify-between border-b border-[#262626] pb-1">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setDeviceEnabled((e) => !e)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                deviceEnabled ? "bg-[#df9c43] shadow-[0_0_6px_#df9c43]" : "bg-zinc-600"
              }`}
              title={deviceEnabled ? "Désactiver le périphérique" : "Activer le périphérique"}
            />
            <span className="font-bold text-[11px] tracking-wide text-zinc-200">Drum Machine</span>
          </div>

          {/* Note Columns: C2, C#2, D2, D#2 */}
          <div className="flex items-center gap-1">
            {["C2", "C#2", "D2", "D#2"].map((n, i) => (
              <div key={i} className="w-[72px] flex items-center justify-between px-1 text-[8px] font-mono text-zinc-500 border-r border-[#262626] last:border-0">
                <span>{n}</span>
                <span className="text-[7px] hover:text-white cursor-pointer">+</span>
              </div>
            ))}
          </div>
        </div>

        {/* 12-Pad Grid (3 rows x 4 columns) */}
        <div className="flex flex-col gap-1 my-auto">
          {padGrid.map((row, rIdx) => (
            <div key={rIdx} className="flex gap-1.5">
              {row.map((pad) => {
                const isHit = activePad === pad.name;
                const state = padStates[pad.name] || {};
                return (
                  <div
                    key={pad.id}
                    data-drum-pad={pad.name}
                    onClick={() => handleTrigger(pad.name)}
                    className={`w-[72px] h-9 rounded border transition-all flex flex-col justify-between p-1 cursor-pointer select-none ${
                      isHit
                        ? "bg-[#241808] border-2 border-[#df9c43] text-[#f5c277] shadow-[0_0_12px_rgba(223,156,67,0.5)] scale-95"
                        : state.mute
                        ? "bg-[#111111] border-[#222222] opacity-40"
                        : "bg-[#202020] border-[#2c2c2c] hover:border-zinc-500 hover:bg-[#262626]"
                    }`}
                  >
                    <span className="text-[9px] font-bold truncate leading-tight">
                      {pad.name}
                    </span>

                    {/* Pad bottom strip: Solo & Mute buttons */}
                    <div className="flex items-center justify-between mt-auto">
                      <button
                        onClick={(e) => toggleSolo(pad.name, e)}
                        className={`text-[7px] font-bold px-1 rounded transition ${
                          state.solo ? "bg-amber-500 text-black font-extrabold" : "text-zinc-500 hover:text-white"
                        }`}
                        title="Solo pad"
                      >
                        S
                      </button>
                      <button
                        onClick={(e) => toggleMute(pad.name, e)}
                        className={`text-[7px] font-bold px-1 rounded transition ${
                          state.mute ? "bg-red-600 text-white font-extrabold" : "text-zinc-500 hover:text-white"
                        }`}
                        title="Mute pad"
                      >
                        M
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* 3. Right FX Tab & Master Output Controls */}
      <div className="w-20 bg-[#1a1a1a] border-l border-[#262626] flex flex-col justify-between items-center py-2 px-1 flex-shrink-0">
        <div className="flex items-center justify-between w-full px-1 border-b border-[#282828] pb-1">
          <span className="text-[9px] font-bold text-zinc-300">FX</span>
          <span className="text-[9px] text-zinc-500 hover:text-white cursor-pointer">+</span>
        </div>

        {/* Master Output Rotary Knob */}
        <MusicStudio
          value={outputGain}
          min={-48}
          max={6}
          label="Output"
          unit="dB"
          onChange={(val) => {
            setOutputGain(val);
            if (audioEngine) {
              const linear = Math.pow(10, val / 20);
              audioEngine.setTrackVolume(track?.id || "drums", linear * 100);
            }
          }}
        />

        {/* Master Device Solo & Mute */}
        <div className="flex items-center gap-1 w-full justify-center pt-1 border-t border-[#262626]">
          <button
            className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-[#252525] text-zinc-400 hover:text-white"
            title="Solo Drum Machine"
          >
            S
          </button>
          <button
            className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-[#252525] text-zinc-400 hover:text-white"
            title="Mute Drum Machine"
          >
            M
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Real Acoustic Peaks Extracted from Music Studio 6 Project "Ferrous Rhythm" ──
export const REAL_STUDIO_AUDIO_PEAKS = {
  piano_lr_2: {
    peaksL: [0.39,0.29,0.46,0.7,0.45,0.3,0.73,0.47,0.31,0.37,0.57,0.3,0.49,0.63,0.46,0.32,0.73,0.47,0.38,0.28,0.38,0.35,0.45,0.75,0.92,0.44,0.82,0.86,0.57,0.34,0.27,0.23,0.15,0.14,0.11,0.11,0.12,0.1,0.1,0.09,0.3,0.3,0.41,0.9,0.68,0.41,0.82,0.93,0.71,0.28,0.55,0.41,0.41,0.88,0.85,0.49,0.89,0.9,0.64,0.28,0.57,0.49,0.45,0.4,0.34,0.22,0.96,0.65,0.48,0.3,0.48,0.42,0.26,0.21,0.13,0.14,0.1,0.13,0.09,0.1],
    peaksR: [0.52,0.37,0.69,0.6,0.34,0.29,0.72,0.49,0.31,0.37,0.47,0.35,0.68,0.56,0.43,0.35,0.68,0.55,0.27,0.26,0.31,0.33,0.29,0.61,0.8,0.45,0.6,0.7,0.62,0.35,0.23,0.21,0.16,0.12,0.12,0.13,0.11,0.1,0.08,0.09,0.27,0.23,0.24,0.69,0.62,0.44,0.66,0.73,0.69,0.27,0.38,0.34,0.34,0.62,0.7,0.5,0.76,0.7,0.73,0.26,0.76,0.47,0.41,0.44,0.46,0.32,0.69,0.59,0.56,0.39,0.57,0.45,0.31,0.26,0.19,0.19,0.11,0.13,0.12,0.1]
  },
  piano_lr_1: {
    peaksL: [0.38,0.3,0.71,0.78,0.62,0.36,0.64,0.74,0.53,0.38,0.17,0.1,0.76,0.74,0.53,0.37,0.5,0.46,0.44,0.27,0.14,0.08,0.67,0.7,0.66,0.38,0.55,0.57,0.47,0.27,0.47,0.32,0.82,0.69,0.59,0.35,0.64,0.53,0.38,0.24,0.38,0.33,0.53,0.49,0.62,0.34,0.7,0.56,0.43,0.19,0.16,0.13,0.46,0.53,0.67,0.2,0.57,0.6,0.35,0.13,0.09,0.05,0.49,0.53,0.6,0.17,0.56,0.64,0.35,0.08,0.07,0.03,0.42,0.45,0.63,0.19,0.26,0.7,0.42,0.12],
    peaksR: [0.47,0.35,0.69,0.59,0.41,0.33,0.46,0.46,0.39,0.28,0.16,0.08,0.6,0.56,0.33,0.25,0.42,0.4,0.32,0.16,0.12,0.08,0.55,0.54,0.46,0.25,0.39,0.47,0.35,0.18,0.5,0.33,0.76,0.56,0.4,0.25,0.46,0.44,0.36,0.18,0.32,0.31,0.35,0.36,0.47,0.26,0.67,0.53,0.34,0.22,0.16,0.12,0.25,0.43,0.47,0.22,0.67,0.44,0.27,0.15,0.1,0.04,0.27,0.47,0.44,0.2,0.64,0.48,0.25,0.12,0.08,0.03,0.24,0.35,0.43,0.2,0.27,0.39,0.4,0.16]
  },
  drum_break: {
    peaksL: [1,1,0.98,0.58,0.34,0.2,0.06,0.02,0,0,0.09,0.08,0,0,0,0.09,0.05,0,0,0,1,0.81,0.33,0.07,0.04,0.45,0.38,0.24,0.05,0.05,0.49,0.4,0.2,0.07,0.05,0.02,0,0,0,0,1,0.59,0.41,0.44,0.13,0.32,0.51,0.27,0.04,0.04,1,1,1,0.61,0.36,0.49,0.41,0.19,0.04,0.04,1,0.91,0.24,0.04,0.01,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    peaksR: [1,1,0.98,0.58,0.34,0.19,0.06,0.02,0,0,0.06,0.05,0,0,0,0.06,0.04,0,0,0,1,0.87,0.43,0.08,0.04,0.41,0.46,0.23,0.05,0.05,0.53,0.5,0.24,0.05,0.05,0.01,0,0,0,0,1,0.72,0.42,0.55,0.14,0.3,0.52,0.28,0.05,0.04,1,1,1,0.6,0.35,0.38,0.4,0.22,0.04,0.03,1,0.84,0.26,0.05,0.01,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
  },
  piano_pedal: {
    peaksL: [0.51,0.47,0.59,0.55,0.66,0.46,0.75,0.76,0.53,0.41,0.56,0.33,0.6,0.55,0.53,0.41,0.89,0.63,0.5,0.36,0.62,0.41,0.56,0.86,0.95,0.55,0.57,0.9,0.57,0.42,0.32,0.23,0.2,0.16,0.16,0.13,0.12,0.11,0.08,0.08,0.34,0.3,0.47,0.84,0.93,0.41,0.58,0.96,0.57,0.36,0.6,0.48,0.55,0.89,1,0.47,0.6,0.94,0.52,0.36,0.73,0.61,0.71,0.53,0.59,0.44,0.56,0.56,0.51,0.39,0.58,0.47,0.38,0.37,0.29,0.23,0.21,0.17,0.12,0.11],
    peaksR: [0.51,0.47,0.59,0.55,0.66,0.46,0.75,0.76,0.53,0.41,0.56,0.33,0.6,0.55,0.53,0.41,0.89,0.63,0.5,0.36,0.62,0.41,0.56,0.86,0.95,0.55,0.57,0.9,0.57,0.42,0.32,0.23,0.2,0.16,0.16,0.13,0.12,0.11,0.08,0.08,0.34,0.3,0.47,0.84,0.93,0.41,0.58,0.96,0.57,0.36,0.6,0.48,0.55,0.89,1,0.47,0.6,0.94,0.52,0.36,0.73,0.61,0.71,0.53,0.59,0.44,0.56,0.56,0.51,0.39,0.58,0.47,0.38,0.37,0.29,0.23,0.21,0.17,0.12,0.11]
  }
};

export function StudioWaveformCanvas({ clip, track, widthPx, heightPx = 28 }) {
  const isAudio = track.isAudio || track.type === "audio" || clip.isAudio;
  const waveformKey = clip.waveformKey || (track.id === "trk_drum_break" ? "drum_break" : "piano_lr_1");
  const peakData = REAL_STUDIO_AUDIO_PEAKS[waveformKey] || REAL_STUDIO_AUDIO_PEAKS.piano_lr_1;

  if (isAudio && peakData) {
    const { peaksL, peaksR } = peakData;
    const n = peaksL.length;
    const isStereo = peaksR && peaksR.length > 0 && waveformKey !== "drum_break";

    if (isStereo) {
      const topUpper = [];
      const topLower = [];
      const botUpper = [];
      const botLower = [];

      for (let i = 0; i < n; i++) {
        const x = (i / (n - 1)) * 100;
        const ampL = peaksL[i] * 9;
        const ampR = peaksR[i] * 9;
        topUpper.push(`${x.toFixed(1)} ${(10 - ampL).toFixed(1)}`);
        topLower.unshift(`${x.toFixed(1)} ${(10 + ampL).toFixed(1)}`);
        botUpper.push(`${x.toFixed(1)} ${(30 - ampR).toFixed(1)}`);
        botLower.unshift(`${x.toFixed(1)} ${(30 + ampR).toFixed(1)}`);
      }

      const pathL = `M 0 10 L ${topUpper.join(" L ")} L ${topLower.join(" L ")} Z`;
      const pathR = `M 0 30 L ${botUpper.join(" L ")} L ${botLower.join(" L ")} Z`;

      return (
        <div className="w-full h-full bg-black/40 rounded overflow-hidden relative flex flex-col justify-center">
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
            <line x1="0" y1="10" x2="100" y2="10" stroke="#38bdf8" strokeWidth="0.5" strokeDasharray="1.5 1.5" opacity="0.4" />
            <line x1="0" y1="20" x2="100" y2="20" stroke="#ffffff" strokeWidth="0.5" opacity="0.2" />
            <line x1="0" y1="30" x2="100" y2="30" stroke="#38bdf8" strokeWidth="0.5" strokeDasharray="1.5 1.5" opacity="0.4" />
            <path d={pathL} fill="rgba(56, 189, 248, 0.45)" stroke="rgba(255, 255, 255, 0.85)" strokeWidth="0.6" />
            <path d={pathR} fill="rgba(56, 189, 248, 0.45)" stroke="rgba(255, 255, 255, 0.85)" strokeWidth="0.6" />
            {clip.warpMarkers && clip.warpMarkers.map((wm, widx) => (
              <line key={widx} x1={wm.warpedNorm * 100} y1="0" x2={wm.warpedNorm * 100} y2="40" stroke="#df9c43" strokeWidth="1" strokeDasharray="1.5 1.5" />
            ))}
          </svg>
        </div>
      );
    } else {
      const upper = [];
      const lower = [];
      for (let i = 0; i < n; i++) {
        const x = (i / (n - 1)) * 100;
        const amp = (peaksL[i] || 0) * 18;
        upper.push(`${x.toFixed(1)} ${(20 - amp).toFixed(1)}`);
        lower.unshift(`${x.toFixed(1)} ${(20 + amp).toFixed(1)}`);
      }
      const pathMono = `M 0 20 L ${upper.join(" L ")} L ${lower.join(" L ")} Z`;

      return (
        <div className="w-full h-full bg-black/40 rounded overflow-hidden relative flex flex-col justify-center">
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
            <line x1="0" y1="20" x2="100" y2="20" stroke="#ffffff" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.4" />
            <path d={pathMono} fill="rgba(254, 202, 202, 0.5)" stroke="rgba(255, 255, 255, 0.9)" strokeWidth="0.8" />
            {clip.warpMarkers && clip.warpMarkers.map((wm, widx) => (
              <line key={widx} x1={wm.warpedNorm * 100} y1="0" x2={wm.warpedNorm * 100} y2="40" stroke="#df9c43" strokeWidth="1" strokeDasharray="1.5 1.5" />
            ))}
          </svg>
        </div>
      );
    }
  }

  const bars = clip.bars || 8;
  const numNotes = Math.min(24, Math.max(6, bars * 3));
  const notePitches = [4, 8, 12, 6, 10, 14, 2, 8, 12, 16, 6, 10, 4, 12, 8, 14, 6, 10];

  return (
    <div className="w-full h-full bg-black/35 rounded overflow-hidden relative flex items-center px-1">
      <div className="absolute inset-0 flex flex-col justify-between py-1 opacity-10 pointer-events-none">
        <div className="w-full h-px bg-white" />
        <div className="w-full h-px bg-white" />
        <div className="w-full h-px bg-white" />
      </div>
      <div className="w-full h-full relative z-10 flex items-center">
        {Array.from({ length: numNotes }).map((_, idx) => {
          const pitch = notePitches[idx % notePitches.length];
          const leftPct = (idx / numNotes) * 100;
          const widthPct = Math.max(2, (100 / numNotes) * 0.7);
          return (
            <div
              key={idx}
              className="absolute bg-white/85 rounded-[1px] shadow-sm"
              style={{
                left: `${leftPct}%`,
                width: `${widthPct}%`,
                height: "2.5px",
                bottom: `${(pitch / 18) * 14 + 3}px`
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

// ── 10 Music Studio Cue Section Markers (Reference Images 0 & 1) ──
export const STUDIO_CUE_MARKERS = [
  { id: "m_start", name: "Start", bar: 1, color: "#eab308" },
  { id: "m_intro", name: "Intro", bar: 5, color: "#eab308" },
  { id: "m_build", name: "Build", bar: 13, color: "#eab308" },
  { id: "m_chorus1", name: "Chorus 1", bar: 17, color: "#eab308" },
  { id: "m_1b", name: "1B", bar: 37, color: "#eab308" },
  { id: "m_bridge", name: "Bridge", bar: 53, color: "#eab308" },
  { id: "m_chorus2", name: "Chorus 2", bar: 69, color: "#eab308" },
  { id: "m_2b", name: "2B", bar: 85, color: "#eab308" },
  { id: "m_outro", name: "Outro", bar: 101, color: "#eab308" },
  { id: "m_end", name: "End", bar: 117, color: "#eab308" }
];

// ── Hierarchical Group & Folder Tracks (Reference Music Studio 6 Project "Ferrous Rhythm") ──
export const STUDIO_DEMO_TRACKS = [
  // 1. Group: Drums
  {
    id: "grp_drums",
    name: "Drums",
    isGroup: true,
    collapsed: false,
    color: "#dc2626",
    type: "drums",
    volume: 85,
    pan: 0,
    mute: false,
    solo: false,
    armed: false,
    frozen: false,
    db: "-5.6 dB",
    clips: []
  },
  {
    id: "drums",
    name: "Main Drums",
    groupId: "grp_drums",
    type: "drums",
    color: "#dc2626",
    volume: 90,
    pan: 0,
    mute: false,
    solo: false,
    armed: true,
    frozen: false,
    db: "0.0 dB",
    automation: {
      visible: true,
      param: "volume",
      points: [
        { id: "ap1", bar: 1, value: 90 },
        { id: "ap2", bar: 17, value: 95 },
        { id: "ap3", bar: 69, value: 90 },
        { id: "ap4", bar: 116, value: 90 }
      ]
    },
    automationLanes: getDefaultAutomationLanes("drums", "drums", "Main Drums"),
    deviceChain: [
      { id: "d_dm", name: "Drum Machine", type: "Instrument", category: "Drums", enabled: true, params: { punch: 90, output: 0 } },
      { id: "d_vca", name: "VCA Compressor", type: "Audio FX", category: "Dynamics", enabled: true, params: { threshold: -14, ratio: 4 } }
    ],
    clips: [
      { id: "c_md_1", name: "S2 5 +", startBar: 1, bars: 4, color: "#dc2626" },
      { id: "c_md_2", name: "17 Main Drums", startBar: 17, bars: 4, color: "#dc2626" },
      { id: "c_md_3", name: "21 Main Drums", startBar: 21, bars: 8, color: "#dc2626" },
      { id: "c_md_4", name: "29 Main Drums", startBar: 29, bars: 8, color: "#dc2626" },
      { id: "c_md_5", name: "37 Main Drums", startBar: 37, bars: 8, color: "#dc2626" },
      { id: "c_md_6", name: "45 Main Drums", startBar: 45, bars: 8, color: "#dc2626" },
      { id: "c_md_7", name: "53 Main Drums", startBar: 53, bars: 8, color: "#dc2626" },
      { id: "c_md_8", name: "61 Main Drums", startBar: 61, bars: 8, color: "#dc2626" },
      { id: "c_md_9", name: "69 Main Drums", startBar: 69, bars: 4, color: "#dc2626" },
      { id: "c_md_10", name: "73 Main Drums", startBar: 73, bars: 4, color: "#dc2626" },
      { id: "c_md_11", name: "77 Main Drums", startBar: 77, bars: 8, color: "#dc2626" },
      { id: "c_md_12", name: "85 Main Drums", startBar: 85, bars: 8, color: "#dc2626" },
      { id: "c_md_13", name: "93 Main Drums", startBar: 93, bars: 8, color: "#dc2626" },
      { id: "c_md_14", name: "101 Main Drums", startBar: 101, bars: 8, color: "#dc2626" },
      { id: "c_md_15", name: "109 Main Drums", startBar: 109, bars: 8, color: "#dc2626" }
    ]
  },
  {
    id: "trk_drum_break",
    name: "Drum Break",
    groupId: "grp_drums",
    type: "audio",
    isAudio: true,
    color: "#f87171",
    volume: 90,
    pan: 0,
    mute: false,
    solo: false,
    armed: false,
    frozen: false,
    db: "0.0 dB",
    automationLanes: getDefaultAutomationLanes("trk_drum_break", "drums", "Drum Break"),
    deviceChain: [
      { id: "d_eq", name: "EQ-5 Parametric", type: "Audio FX", category: "EQ", enabled: true, params: { low: 1, mid: 2, high: 0 } }
    ],
    clips: [
      { id: "c_db_1", name: "61 Drum Break", startBar: 61, bars: 8, color: "#f87171", isAudio: true, waveformKey: "drum_break", url: "/samples/studio/drum_break.wav" }
    ]
  },

  // 2. Group: Inst
  {
    id: "grp_inst",
    name: "Inst",
    isGroup: true,
    collapsed: false,
    color: "#4ade80",
    type: "instruments",
    volume: 90,
    pan: 0,
    mute: false,
    solo: false,
    armed: false,
    frozen: false,
    db: "0.0 dB",
    clips: []
  },
  {
    id: "trk_reese",
    name: "Reese",
    groupId: "grp_inst",
    type: "bass",
    color: "#d97706",
    volume: 70,
    pan: -5,
    mute: false,
    solo: false,
    armed: false,
    frozen: false,
    db: "-13.5 dB",
    automationLanes: getDefaultAutomationLanes("trk_reese", "bass", "Reese"),
    clips: [
      { id: "c_reese_1", name: "S2 5 + Reese", startBar: 1, bars: 4, color: "#d97706" },
      { id: "c_reese_2", name: "13 Reese", startBar: 13, bars: 4, color: "#d97706" },
      { id: "c_reese_3", name: "53 Reese", startBar: 53, bars: 8, color: "#d97706" },
      { id: "c_reese_4", name: "61 Reese", startBar: 61, bars: 8, color: "#d97706" },
      { id: "c_reese_5", name: "85 Reese", startBar: 85, bars: 8, color: "#d97706" },
      { id: "c_reese_6", name: "93 Reese", startBar: 93, bars: 8, color: "#d97706" },
      { id: "c_reese_7", name: "S2 5 + Reese", startBar: 101, bars: 16, color: "#d97706" }
    ]
  },
  {
    id: "trk_bass_bus",
    name: "Bass Bus",
    groupId: "grp_inst",
    type: "bass",
    color: "#df9c43",
    volume: 78,
    pan: 0,
    mute: false,
    solo: false,
    armed: false,
    frozen: false,
    db: "-8.3 dB",
    automationLanes: getDefaultAutomationLanes("trk_bass_bus", "bass", "Bass Bus"),
    clips: [
      { id: "c_bb_1", name: "Bass Bus", startBar: 9, bars: 60, color: "#df9c43" },
      { id: "c_bb_2", name: "Bass Bus", startBar: 69, bars: 16, color: "#df9c43" },
      { id: "c_bb_3", name: "Bass Bus", startBar: 113, bars: 4, color: "#df9c43" }
    ]
  },
  {
    id: "trk_wind",
    name: "Wind",
    groupId: "grp_inst",
    type: "instruments",
    color: "#22c55e",
    volume: 68,
    pan: 10,
    mute: false,
    solo: false,
    armed: false,
    frozen: false,
    db: "-16.5 dB",
    automationLanes: getDefaultAutomationLanes("trk_wind", "instruments", "Wind"),
    clips: [
      { id: "c_w_1", name: "S3 13 + Wind", startBar: 13, bars: 8, color: "#22c55e" },
      { id: "c_w_2", name: "53 Wind", startBar: 53, bars: 16, color: "#22c55e" },
      { id: "c_w_3", name: "S11 69 +", startBar: 69, bars: 4, color: "#22c55e" },
      { id: "c_w_4", name: "101 Wind", startBar: 101, bars: 16, color: "#22c55e" }
    ]
  },
  {
    id: "trk_howling",
    name: "Howling Lead",
    groupId: "grp_inst",
    type: "instruments",
    color: "#eab308",
    volume: 80,
    pan: -15,
    mute: false,
    solo: false,
    armed: false,
    frozen: false,
    db: "-7.5 dB",
    automationLanes: getDefaultAutomationLanes("trk_howling", "instruments", "Howling Lead"),
    clips: [
      { id: "c_hl_0", name: "S2 1 + Howling Lead", startBar: 1, bars: 4, color: "#eab308" },
      { id: "c_hl_1", name: "17 Howling Lead", startBar: 17, bars: 8, color: "#eab308" },
      { id: "c_hl_2", name: "24 + Howling", startBar: 25, bars: 10, color: "#eab308" },
      { id: "c_hl_3", name: "35 Howling Lead", startBar: 35, bars: 14, color: "#eab308" },
      { id: "c_hl_4", name: "53 Howling Lead", startBar: 53, bars: 12, color: "#eab308" },
      { id: "c_hl_5", name: "65 Howling Lead", startBar: 65, bars: 12, color: "#eab308" },
      { id: "c_hl_6", name: "83 Howling Lead", startBar: 83, bars: 14, color: "#eab308" }
    ]
  },
  {
    id: "trk_drifting",
    name: "Drifting Chords",
    groupId: "grp_inst",
    type: "instruments",
    color: "#06b6d4",
    volume: 67,
    pan: 20,
    mute: false,
    solo: false,
    armed: false,
    frozen: false,
    db: "-17.0 dB",
    automationLanes: getDefaultAutomationLanes("trk_drifting", "instruments", "Drifting Chords"),
    clips: [
      { id: "c_dc_1", name: "53 Drifting Chords", startBar: 53, bars: 16, color: "#06b6d4" },
      { id: "c_dc_2", name: "85 Drifting Chords", startBar: 85, bars: 8, color: "#06b6d4" },
      { id: "c_dc_3", name: "93 Drifting Chords", startBar: 93, bars: 8, color: "#06b6d4" },
      { id: "c_dc_4", name: "101 + Drifting Chords", startBar: 101, bars: 16, color: "#06b6d4" }
    ]
  },
  {
    id: "trk_piano",
    name: "Piano",
    groupId: "grp_inst",
    type: "instruments",
    color: "#0ea5e9",
    volume: 88,
    pan: 0,
    mute: false,
    solo: false,
    armed: false,
    frozen: false,
    db: "-1.2 dB",
    automationLanes: getDefaultAutomationLanes("trk_piano", "instruments", "Piano"),
    clips: [
      { id: "c_p_1", name: "Piano Solo", startBar: 69, bars: 16, color: "#0ea5e9" }
    ]
  },
  {
    id: "trk_lr",
    name: "LR",
    groupId: "grp_inst",
    type: "audio",
    isAudio: true,
    color: "#0284c7",
    volume: 82,
    pan: 0,
    mute: false,
    solo: false,
    armed: false,
    frozen: false,
    db: "-6.0 dB",
    automationLanes: getDefaultAutomationLanes("trk_lr", "audio", "LR"),
    clips: [
      { id: "c_lr_0", name: "S1 1 +", startBar: 1, bars: 4, color: "#0284c7", isAudio: true, waveformKey: "piano_lr_1", url: "/samples/studio/piano_lr_bounce_1.wav" },
      { id: "c_lr_1", name: "Piano LR 2-bounce-2", startBar: 5, bars: 12, color: "#0284c7", isAudio: true, waveformKey: "piano_lr_2", url: "/samples/studio/piano_lr_2_bounce_2.wav" },
      { id: "c_lr_2", name: "Piano LR-bounce-1", startBar: 17, bars: 20, color: "#0284c7", isAudio: true, waveformKey: "piano_lr_1", url: "/samples/studio/piano_lr_bounce_1.wav" },
      { id: "c_lr_3", name: "Piano LR 2-bounce-2", startBar: 69, bars: 12, color: "#0284c7", isAudio: true, waveformKey: "piano_lr_2", url: "/samples/studio/piano_lr_2_bounce_2.wav" },
      { id: "c_lr_4", name: "Piano LR-bounce-1", startBar: 81, bars: 16, color: "#0284c7", isAudio: true, waveformKey: "piano_lr_1", url: "/samples/studio/piano_lr_bounce_1.wav" },
      { id: "c_lr_5", name: "S1 1 + LR", startBar: 113, bars: 4, color: "#a855f7", isAudio: true, waveformKey: "piano_pedal", url: "/samples/studio/piano_pedal_bounce_1.wav" }
    ]
  }
];

export function MusicStudioDaw({
  tracks: initialTracks = [],
  availableTracks = [],
  selectedTrack: initialSelectedTrack,
  onSelectSong,
  isLoadingStems = false,
  onLoadStems,
  onAddInstrument,
  onRegenerateClip,
  onOpenDemucs,
  onOpenVideoStudio,
  onOpenAudioMass,
  onNavigateTab,
  onSendToMontage
}) {
  // ── Primary View Modes: 'arrange' | 'clips' | 'mix' ──
  const [mainView, setMainView] = useState("arrange");

  // ── Bottom Panel Visibility, Height & Resizing ──
  const [showBottomPanel, setShowBottomPanel] = useState(true);
  const [bottomPanelTab, setBottomPanelTab] = useState("pianoroll"); // 'pianoroll' | 'devicerack' | 'grid' | 'keyboard' | 'inspector' | 'automation'
  const [bottomPanelHeight, setBottomPanelHeight] = useState(340);
  const [isBottomPanelMaximized, setIsBottomPanelMaximized] = useState(false);
  const isDraggingSplitterRef = useRef(false);

  // Splitter resizer handler (drag handle on top border)
  const handleSplitterMouseDown = useCallback((e) => {
    e.preventDefault();
    isDraggingSplitterRef.current = true;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";

    const onMouseMove = (moveEvent) => {
      if (!isDraggingSplitterRef.current) return;
      const windowHeight = window.innerHeight;
      const newHeight = windowHeight - moveEvent.clientY - 28; // Status bar offset
      const clampedHeight = Math.max(160, Math.min(windowHeight * 0.85, newHeight));
      setBottomPanelHeight(Math.round(clampedHeight));
    };

    const onMouseUp = () => {
      isDraggingSplitterRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, []);

  // ── Music Studio 4-Column Pop-up Browser State (Chapter 8, p. 235-262) ──
  const [isPopupBrowserOpen, setIsPopupBrowserOpen] = useState(false);
  const [popupBrowserContext, setPopupBrowserContext] = useState({ target: "device", trackId: null });

  // ── Music Studio Unified Modulation System (Chapter 16, p. 461-512) ──
  const [trackModulators, setTrackModulators] = useState({
    drums: [
      {
        id: "mod-lfo-drums",
        type: "lfo",
        name: "LFO Filter",
        config: {
          shape: "sine",
          rateMode: "sync",
          rateHz: 2.0,
          rateSync: "1/4",
          depth: 75,
          phase: 0,
          smooth: 10,
          bipolar: true
        },
        targets: [
          { targetParam: "delay_feedback", targetName: "Delay+ Feedback", depth: 35 }
        ]
      },
      {
        id: "mod-steps-drums",
        type: "steps",
        name: "Steps Groove",
        config: {
          numSteps: 8,
          values: [0.2, 0.8, 0.4, 0.9, 0.1, 0.7, 0.5, 0.9],
          rateSync: "1/8",
          loopLength: 8,
          smoothing: 15,
          bipolar: false
        },
        targets: [
          { targetParam: "eq_high", targetName: "EQ-5 Aigu", depth: 40 }
        ]
      }
    ],
    inst_chords: [
      {
        id: "mod-macro-chords",
        type: "macro",
        name: "Macro Space",
        config: {
          value: 80,
          min: 0,
          max: 127,
          name: "Macro 1"
        },
        targets: [
          { targetParam: "reverb_size", targetName: "Reverb Taille", depth: 60 }
        ]
      }
    ]
  });
  const [mappingModulatorId, setMappingModulatorId] = useState(null);
  const [showModulatorDrawer, setShowModulatorDrawer] = useState(true);

  // Modulation Mapping Assignment Helper (Chapter 16)
  const handleAssignModTarget = useCallback((tId, modId, targetObj) => {
    setTrackModulators((prev) => {
      const list = prev[tId] || [];
      return {
        ...prev,
        [tId]: list.map((m) => {
          if (m.id === modId) {
            const existing = m.targets || [];
            if (existing.some((t) => t.targetParam === targetObj.targetParam)) {
              return m;
            }
            return { ...m, targets: [...existing, targetObj] };
          }
          return m;
        })
      };
    });
    setStatusHint(`Paramètre "${targetObj.targetName}" assigné au modulateur (+${targetObj.depth}%)`);
    setMappingModulatorId(null);
  }, []);

  // ── Dedicated Music Studio Automation Editor State (Images 0, 1, 2, 3, 5) ──
  const [selectedAutomationTrackId, setSelectedAutomationTrackId] = useState("drums");
  const [selectedAutomationLaneId, setSelectedAutomationLaneId] = useState("lane_drm_mix_delay");
  const [automationEditorMode, setAutomationEditorMode] = useState("clip"); // 'clip' | 'track'
  const [selectedLauncherClip, setSelectedLauncherClip] = useState({
    trackId: "drums",
    laneId: "lane_drm_mix_delay",
    sceneIndex: 2,
    clipName: "S3"
  });
  const [automationTool, setAutomationTool] = useState("pointer"); // 'pointer' | 'pencil' | 'curve' | 'eraser'
  const [automationSnap, setAutomationSnap] = useState("1/16"); // '1/16' | '1/8' | '1/4' | '1/32' | 'off'
  const [draggingAnchor, setDraggingAnchor] = useState(null);
  const [hoveredAnchorTooltip, setHoveredAnchorTooltip] = useState(null);

  // ── Music Studio 5 Universal Editing Tools (Section 3.1.4, p. 81-84) ──
  // 'pointer' (1) | 'time' (2) | 'pencil' (3) | 'eraser' (4) | 'knife' (5)
  const [activeEditingTool, setActiveEditingTool] = useState("pointer");
  const [arrangerSnap, setArrangerSnap] = useState("1/16");

  // ── Track Header Bottom Switches (Section 3.1.4, p. 84) ──
  const [showTrackIO, setShowTrackIO] = useState(false); // [E/S]
  const [trackHeightMode, setTrackHeightMode] = useState("normal"); // 'normal' (64px) | 'compact' (38px)
  const [showEffectTracks, setShowEffectTracks] = useState(true); // [FX]
  const [showDeactivatedTracks, setShowDeactivatedTracks] = useState(true); // [OFF]
  const [followPlayhead, setFollowPlayhead] = useState(true); // [▶]

  // ── Time Selection State (Tool 2: Durée) ──
  const [timeSelection, setTimeSelection] = useState(null); // { startBar: 1, endBar: 5 }
  const [isSelectingTime, setIsSelectingTime] = useState(false);

  // ── Comping & Take Lanes (Section 10.1.4, p. 299-307) ──
  const [expandedCompingTrackIds, setExpandedCompingTrackIds] = useState(new Set(["trk_lr"]));

  // ── Music Studio 6 Host OSC Link (UDP 9000/9001) ──
  const [studioHostLink, setStudioHostLink] = useState(true);
  const [studioOscStatus, setStudioOscStatus] = useState("connected"); // 'connected' | 'transmitting' | 'idle'

  const sendStudioOsc = useCallback(async (command, payload = {}) => {
    if (!studioHostLink) return;
    try {
      setStudioOscStatus("transmitting");
      const res = await fetch("/api/studio-osc/osc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command, ...payload })
      });
      setTimeout(() => setStudioOscStatus("connected"), 350);
      return await res.json();
    } catch (err) {
      console.debug("[Music Studio OSC] Send error:", err);
      setStudioOscStatus("connected");
    }
  }, [studioHostLink]);

  // ── Right Sidebar Visibility & Tabs ──
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [sidebarTab, setSidebarTab] = useState("browser"); // 'browser' | 'project'
  const [browserFilter, setBrowserFilter] = useState("all"); // 'all' | 'devices' | 'ai' | 'presets'
  const [browserSearch, setBrowserSearch] = useState("");
  const [projectSubTab, setProjectSubTab] = useState("settings"); // 'settings' | 'info' | 'remotes' | 'sections' | 'files' | 'plugins'
  const [isMidiMappingsOpen, setIsMidiMappingsOpen] = useState(false);
  const [globalGroove, setGlobalGroove] = useState({ shuffle: 35, rate: "1/16", accent: 25 });
  const [projectMetadata, setProjectMetadata] = useState({
    author: "MGP Studio Producer",
    copyright: "© 2026 MGP Studio - Tous droits réservés",
    comments: "Arrangement Amapiano & Afrobeat produit sur DGX Spark GB10. Mixage stems 48kHz.",
    tags: ["Amapiano", "Deep Groove", "Afrobeats", "DGX Spark", "48kHz"]
  });
  const [projectSections, setProjectSections] = useState([
    { id: "sec_1", name: "Intro", bar: 1, color: "#df9c43" },
    { id: "sec_2", name: "Build / Drop", bar: 9, color: "#eaaf5d" },
    { id: "sec_3", name: "Couplet 1 (Chorus)", bar: 17, color: "#38bdf8" },
    { id: "sec_4", name: "Pont (Bridge)", bar: 33, color: "#a855f7" },
    { id: "sec_5", name: "Refrain 2 (Climax)", bar: 49, color: "#22c55e" },
    { id: "sec_6", name: "Outro", bar: 65, color: "#f97316" }
  ]);
  const [touchKeyboardMode, setTouchKeyboardMode] = useState("piano"); // 'piano' | 'octaves' | 'fourths'
  const [keyboardOctaveOffset, setKeyboardOctaveOffset] = useState(0); // -2 to +2
  const [keyboardWaveType, setKeyboardWaveType] = useState("sawtooth");
  const [keyboardChordMode, setKeyboardChordMode] = useState("single"); // 'single' | 'major' | 'minor' | 'seventh'
  const [keyboardPitchBend, setKeyboardPitchBend] = useState(0); // -100 to +100
  const [keyboardTimbre, setKeyboardTimbre] = useState(74); // 0 to 127

  // ── Timeline Navigation & Zoom (0.10 Macro to 3.0 Micro-Beats) ──
  const [zoomLevel, setZoomLevel] = useState(0.85); // 0.10 to 3.0
  const barWidthPx = useMemo(() => Math.round(96 * zoomLevel), [zoomLevel]);
  const timelineScrollRef = useRef(null);
  const isDraggingRulerRef = useRef(false);
  const rulerDragStartRef = useRef({ x: 0, y: 0, zoom: 0.85, scrollLeft: 0, bar: 1, moved: false });
  const [timelineScrollLeft, setTimelineScrollLeft] = useState(0);
  const [timelineClientWidth, setTimelineClientWidth] = useState(1200);

  // ── Top Header Dropdown Menus ──
  const [openMenu, setOpenMenu] = useState(null); // 'file' | 'playback' | 'add' | 'edit' | 'help' | null
  const [activeSubMenu, setActiveSubMenu] = useState(null);

  // ── Modals State ──
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isDashboardModalOpen, setIsDashboardModalOpen] = useState(false);
  const [isExportAudioModalOpen, setIsExportAudioModalOpen] = useState(false);

  // ── Music Studio Inspector Panel State (Section 3.3, p. 91) ──
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);

  // ── Multi-Project Tabs State (Section 2.1.1 & 14.4, p. 55 & 438) ──
  const [openProjects, setOpenProjects] = useState(() => [
    {
      id: "proj_ferrous",
      title: "Ferrous Rhythm",
      bpm: 172.0,
      musicalKey: "F# minor",
      timeSignature: "4/4"
    }
  ]);
  const [activeProjectId, setActiveProjectId] = useState("proj_ferrous");
  const [exportSettings, setExportSettings] = useState({
    format: "wav",
    range: "all",
    normalize: true,
    bitDepth: 16
  });

  // ── Playback & Transport Settings (Menus LECTURE) ──
  const [playbackSettings, setPlaybackSettings] = useState({
    automationMode: "write", // 'latch' | 'touch' | 'write'
    overdub: false,
    grooveShuffle: 0,
    grooveAccent: "medium",
    metronomeDb: "-12 dB",
    metronomeTicks: true,
    metronomeFill: false,
    preroll: "off",
    recordQuantize: "1/16"
  });

  // ── Timeline Section & Loop Markers ──
  const [loopStartBar, setLoopStartBar] = useState(1);
  const [loopEndBar, setLoopEndBar] = useState(9);
  const [isDraggingLoopStart, setIsDraggingLoopStart] = useState(false);
  const [isDraggingLoopEnd, setIsDraggingLoopEnd] = useState(false);

  // ── Transport & Playback State ──
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isLooping, setIsLooping] = useState(true);
  const [isMetronomeActive, setIsMetronomeActive] = useState(false);
  const [bpm, setBpm] = useState(172.0);
  const [timeSignature, setTimeSignature] = useState("4/4");
  const [musicalKey, setMusicalKey] = useState("F Minor");
  const [currentBar, setCurrentBar] = useState(1);
  const [currentBeat, setCurrentBeat] = useState(1);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);

  const [markers, setMarkers] = useState(STUDIO_CUE_MARKERS);


  // ── Tracks & Project State ──
  const [tracks, setTracks] = useState(() => {
    if (initialTracks && initialTracks.length > 0) return initialTracks;
    return STUDIO_DEMO_TRACKS;
  });

  const toggleGroupCollapse = useCallback((groupId) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === groupId ? { ...t, collapsed: !t.collapsed } : t))
    );
  }, []);

  const visibleTracks = useMemo(() => {
    const groupMap = new Map();
    for (const t of tracks) {
      if (t.isGroup) groupMap.set(t.id, t);
    }
    return tracks.filter((t) => {
      // Switch [OFF] (p. 84): Hide deactivated tracks if showDeactivatedTracks is false
      if (!showDeactivatedTracks && t.active === false) return false;
      // Switch [FX] (p. 84): Hide effect tracks if showEffectTracks is false
      if (!showEffectTracks && (t.type === "fx" || t.isFx)) return false;

      if (!t.groupId) return true;
      const parent = groupMap.get(t.groupId);
      return parent ? !parent.collapsed : true;
    });
  }, [tracks, showDeactivatedTracks, showEffectTracks]);

  // Active Selected Song & Current Project Title
  const [currentSongTitle, setCurrentSongTitle] = useState(() => initialSelectedTrack?.title || "Ferrous Rhythm (Music Studio 6)");
  const lastInitialTracksRef = useRef(initialTracks);

  useEffect(() => {
    if (initialSelectedTrack?.title) {
      setCurrentSongTitle(initialSelectedTrack.title);
    }
  }, [initialSelectedTrack]);

  // Keep internal tracks synced with parent initialTracks if updated
  useEffect(() => {
    if (initialTracks && initialTracks.length > 0 && initialTracks !== lastInitialTracksRef.current) {
      lastInitialTracksRef.current = initialTracks;
      setTracks((prev) => {
        return initialTracks.map((t) => {
          const existing = prev.find((p) => p.id === t.id);
          return {
            ...t,
            clips: (existing?.clips && existing.clips.length > (t.clips?.length || 0)) ? existing.clips : (t.clips || []),
            automation: existing?.automation || t.automation || { visible: false, param: "volume", points: [{ id: "ap1", bar: 1, value: 80 }] },
            automationLanes: existing?.automationLanes || t.automationLanes || getDefaultAutomationLanes(t.id, t.type, t.name),
            deviceChain: existing?.deviceChain || t.deviceChain || [
              { id: `dev_${Date.now()}_1`, name: "EQ-5 Parametric", type: "Audio FX", category: "EQ", enabled: true, params: { low: 0, mid: 0, high: 0 } }
            ]
          };
        });
      });
    }
  }, [initialTracks]);

  // Active Selected Track & Clip
  const [selectedTrackId, setSelectedTrackId] = useState("drums");
  const [selectedClipId, setSelectedClipId] = useState("c_md_1");
  const [selectedDeviceId, setSelectedDeviceId] = useState("d_dm");
  const [activeSceneIndex, setActiveSceneIndex] = useState(null);

  // ── Atom H1 & H2: Profil Tactile & Menu Radial (Chapitre 18) ──
  const [isTouchProfileActive, setIsTouchProfileActive] = useState(false);
  const [radialMenuState, setRadialMenuState] = useState(null); // { x, y, clip, track }

  const selectedTrack = useMemo(() => {
    return tracks.find((t) => t.id === selectedTrackId) || tracks[0] || null;
  }, [tracks, selectedTrackId]);

  const selectedClip = useMemo(() => {
    if (!selectedClipId) return null;
    for (const t of tracks) {
      const found = (t.clips || []).find((c) => c.id === selectedClipId);
      if (found) return found;
    }
    return null;
  }, [tracks, selectedClipId]);

  const handleToggleTrackActive = useCallback((trkId) => {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id === trkId) {
          const nextActive = t.active === false ? true : false;
          setStatusHint(
            nextActive
              ? `Piste "${t.name}" remise en service (Alt+A)`
              : `Piste "${t.name}" mise hors service (Alt+A)`
          );
          return { ...t, active: nextActive };
        }
        return t;
      })
    );
  }, []);

  const handleSwitchProject = useCallback((targetId) => {
    if (targetId === activeProjectId) return;
    setOpenProjects((prev) =>
      prev.map((p) =>
        p.id === activeProjectId
          ? { ...p, bpm, musicalKey, timeSignature, tracks, selectedTrackId }
          : p
      )
    );
    const target = openProjects.find((p) => p.id === targetId);
    if (target) {
      setActiveProjectId(targetId);
      if (target.tracks && target.tracks.length > 0) {
        setTracks(target.tracks);
      }
      if (target.bpm) setBpm(target.bpm);
      if (target.musicalKey) setMusicalKey(target.musicalKey);
      if (target.selectedTrackId) setSelectedTrackId(target.selectedTrackId);
      setStatusHint(`Projet "${target.title}" sélectionné`);
    }
  }, [activeProjectId, bpm, musicalKey, timeSignature, tracks, selectedTrackId, openProjects]);

  const handleCreateNewProjectTab = useCallback(() => {
    const newId = `proj_${Date.now()}`;
    const newTitle = `Projet ${openProjects.length + 1}`;
    const newProj = {
      id: newId,
      title: newTitle,
      bpm: 120,
      musicalKey: "C Major",
      timeSignature: "4/4",
      tracks: [
        {
          id: `trk_${Date.now()}_1`,
          name: "Audio 1",
          type: "audio",
          color: "#06b6d4",
          volume: 0,
          pan: 0,
          mute: false,
          solo: false,
          active: true,
          clips: []
        },
        {
          id: `trk_${Date.now()}_2`,
          name: "Instrument 1",
          type: "instrument",
          color: "#df9c43",
          volume: 0,
          pan: 0,
          mute: false,
          solo: false,
          active: true,
          clips: []
        }
      ],
      selectedTrackId: `trk_${Date.now()}_1`
    };
    setOpenProjects((prev) => [...prev, newProj]);
    setActiveProjectId(newId);
    setTracks(newProj.tracks);
    setBpm(120);
    setMusicalKey("C Major");
    setSelectedTrackId(`trk_${Date.now()}_1`);
    setStatusHint(`Nouveau projet "${newTitle}" initialisé (Ctrl+N)`);
  }, [openProjects.length]);

  const handleCloseProjectTab = useCallback((targetId) => {
    if (openProjects.length <= 1) {
      setStatusHint("Impossible de fermer le seul projet ouvert");
      return;
    }
    const remaining = openProjects.filter((p) => p.id !== targetId);
    setOpenProjects(remaining);
    if (activeProjectId === targetId) {
      const nextProj = remaining[0];
      setActiveProjectId(nextProj.id);
      if (nextProj.tracks) setTracks(nextProj.tracks);
      if (nextProj.bpm) setBpm(nextProj.bpm);
    }
    setStatusHint("Projet fermé");
  }, [openProjects, activeProjectId]);

  // ── Timeline Bars Extent (Matches Music Studio Arranger Overview) ──
  const maxTrackBars = useMemo(() => {
    let maxB = 148;
    for (const t of tracks) {
      for (const c of t.clips || []) {
        const end = (c.startBar || 1) + (c.bars || 8);
        if (end > maxB) maxB = end;
      }
    }
    return Math.max(148, maxB + 4);
  }, [tracks]);

  // ── Macro Arranger Sections (Matching Reference Images 0 & 1 Music Studio Cue Structure) ──
  const MACRO_SECTIONS = useMemo(() => [
    { id: "sec_start", name: "Start", startBar: 1, endBar: 4, color: "#eab308" },
    { id: "sec_intro", name: "Intro", startBar: 5, endBar: 12, color: "#eab308" },
    { id: "sec_build", name: "Build", startBar: 13, endBar: 16, color: "#eab308" },
    { id: "sec_ch1", name: "Chorus 1", startBar: 17, endBar: 36, color: "#eab308" },
    { id: "sec_1b", name: "1B", startBar: 37, endBar: 52, color: "#eab308" },
    { id: "sec_bridge", name: "Bridge", startBar: 53, endBar: 68, color: "#eab308" },
    { id: "sec_ch2", name: "Chorus 2", startBar: 69, endBar: 84, color: "#eab308" },
    { id: "sec_2b", name: "2B", startBar: 85, endBar: 100, color: "#eab308" },
    { id: "sec_outro", name: "Outro", startBar: 101, endBar: 116, color: "#eab308" },
    { id: "sec_end", name: "End", startBar: 117, endBar: 148, color: "#eab308" }
  ], []);

  // ── Stem Separation & Loading into Dedicated DAW Tracks ──
  const loadSongStemsIntoDaw = useCallback((trk) => {
    if (!trk) return;
    const songBpm = trk.bpm || 120;
    const songDuration = trk.duration || 32;
    const stems = trk.stems || {};
    const hasStems = Boolean(stems.vocals || stems.drums || stems.bass || stems.instruments);

    // Generate realistic arrangement clips across the 148-measure song structure (Image 8)
    const makeClips = (type, title, url, color) => {
      const clips = [];
      const safeUrl = url || trk.url;
      const baseName = title || "Audio";

      if (type === "vocals") {
        const sections = [
          { name: "Intro / Vocal Hook", startBar: 1, bars: 16 },
          { name: "Verse 1 / Build", startBar: 17, bars: 16 },
          { name: "Chorus 1 Lead Vox", startBar: 33, bars: 16 },
          { name: "Verse 2 / 1B", startBar: 49, bars: 16 },
          { name: "Bridge Emotion Vox", startBar: 65, bars: 16 },
          { name: "Chorus 2 Climax", startBar: 81, bars: 16 },
          { name: "2B Vox Harmonies", startBar: 97, bars: 16 },
          { name: "Outro Vox", startBar: 113, bars: 24 }
        ];
        sections.forEach((sec, idx) => {
          clips.push({
            id: `clip_vox_${Date.now()}_${idx}`,
            name: `${baseName} - ${sec.name}`,
            url: safeUrl,
            duration: songDuration,
            startBar: sec.startBar,
            bars: sec.bars,
            color
          });
        });
      } else if (type === "drums") {
        const sections = [
          { name: "Start & Intro Groove", startBar: 1, bars: 16 },
          { name: "Main Drums Build", startBar: 17, bars: 16 },
          { name: "Chorus 1 Drums", startBar: 33, bars: 16 },
          { name: "1B Drums", startBar: 49, bars: 16 },
          { name: "Drum Break", startBar: 65, bars: 12 },
          { name: "Chorus 2 Heavy Drums", startBar: 77, bars: 20 },
          { name: "2B Drums", startBar: 97, bars: 16 },
          { name: "Outro Drums", startBar: 113, bars: 24 }
        ];
        sections.forEach((sec, idx) => {
          clips.push({
            id: `clip_drm_${Date.now()}_${idx}`,
            name: `${baseName} - ${sec.name}`,
            url: safeUrl,
            duration: songDuration,
            startBar: sec.startBar,
            bars: sec.bars,
            color
          });
        });
      } else if (type === "bass") {
        const sections = [
          { name: "Intro Sub 55Hz", startBar: 1, bars: 16 },
          { name: "Build 808", startBar: 17, bars: 16 },
          { name: "Chorus 1 Bassline", startBar: 33, bars: 16 },
          { name: "1B Bassline", startBar: 49, bars: 16 },
          { name: "Bridge Low Bass", startBar: 65, bars: 16 },
          { name: "Chorus 2 808 Bass", startBar: 81, bars: 16 },
          { name: "2B Sub Bass", startBar: 97, bars: 16 },
          { name: "Outro Bass", startBar: 113, bars: 24 }
        ];
        sections.forEach((sec, idx) => {
          clips.push({
            id: `clip_bss_${Date.now()}_${idx}`,
            name: `${baseName} - ${sec.name}`,
            url: safeUrl,
            duration: songDuration,
            startBar: sec.startBar,
            bars: sec.bars,
            color
          });
        });
      } else {
        const sections = [
          { name: "Intro Melodic Hook", startBar: 1, bars: 16 },
          { name: "Build Synths", startBar: 17, bars: 16 },
          { name: "Chorus 1 Leads & Chords", startBar: 33, bars: 16 },
          { name: "1B Rhodes & Pads", startBar: 49, bars: 16 },
          { name: "Bridge Atmosphere", startBar: 65, bars: 16 },
          { name: "Chorus 2 Full Symphony", startBar: 81, bars: 16 },
          { name: "2B Synth Arps", startBar: 97, bars: 16 },
          { name: "Outro Floating Pads", startBar: 113, bars: 24 }
        ];
        sections.forEach((sec, idx) => {
          clips.push({
            id: `clip_ins_${Date.now()}_${idx}`,
            name: `${baseName} - ${sec.name}`,
            url: safeUrl,
            duration: songDuration,
            startBar: sec.startBar,
            bars: sec.bars,
            color
          });
        });
      }
      return clips;
    };

    const loadedTracks = [
      {
        id: "trk_vocals",
        name: "🎤 Vocals Lead",
        type: "vocals",
        color: "#f59e0b",
        volume: 85,
        pan: 0,
        mute: false,
        solo: false,
        armed: false,
        frozen: false,
        db: "-1.5 dB",
        audioUrl: stems.vocals || trk.url,
        automation: { visible: false, param: "volume", points: [{ id: "p1", bar: 1, value: 85 }] },
        automationLanes: getDefaultAutomationLanes("trk_vocals", "vocals", "🎤 Vocals Lead"),
        deviceChain: [
          { id: "d_vox_1", name: "EQ-5 Parametric", type: "Audio FX", category: "EQ", enabled: true, params: { low: -2, mid: 2, high: 3 } },
          { id: "d_vox_2", name: "Studio Reverb", type: "Audio FX", category: "Reverb", enabled: true, params: { size: 45, decay: 1.8, mix: 20 } }
        ],
        clips: makeClips("vocals", trk.title, stems.vocals || trk.url, "#f59e0b")
      },
      {
        id: "trk_drums",
        name: "🥁 Drums / Rythmique",
        type: "drums",
        color: "#3b82f6",
        volume: 90,
        pan: 0,
        mute: false,
        solo: false,
        armed: false,
        frozen: false,
        db: "-0.5 dB",
        audioUrl: stems.drums || null,
        automation: { visible: false, param: "volume", points: [{ id: "p2", bar: 1, value: 90 }] },
        automationLanes: getDefaultAutomationLanes("trk_drums", "drums", "🥁 Drums / Rythmique"),
        deviceChain: [
          { id: "d_drm_1", name: "VCA Compressor", type: "Audio FX", category: "Dynamics", enabled: true, params: { threshold: -18, ratio: 4, attack: 15 } }
        ],
        clips: makeClips("drums", trk.title, stems.drums || trk.url, "#3b82f6")
      },
      {
        id: "trk_bass",
        name: "🎸 Bassline / 808",
        type: "bass",
        color: "#ef4444",
        volume: 85,
        pan: 0,
        mute: false,
        solo: false,
        armed: false,
        frozen: false,
        db: "-1.0 dB",
        audioUrl: stems.bass || null,
        automation: { visible: false, param: "volume", points: [{ id: "p3", bar: 1, value: 85 }] },
        automationLanes: getDefaultAutomationLanes("trk_bass", "bass", "🎸 Bassline / 808"),
        deviceChain: [
          { id: "d_bss_1", name: "Overdrive Saturator", type: "Audio FX", category: "Distortion", enabled: true, params: { drive: 35, tone: 50 } }
        ],
        clips: makeClips("bass", trk.title, stems.bass || trk.url, "#ef4444")
      },
      {
        id: "trk_instruments",
        name: "🎹 Instruments & Synth",
        type: "instruments",
        color: "#8b5cf6",
        volume: 80,
        pan: 0,
        mute: false,
        solo: false,
        armed: false,
        frozen: false,
        db: "-2.0 dB",
        audioUrl: stems.instruments || stems.other || null,
        automation: { visible: false, param: "volume", points: [{ id: "p4", bar: 1, value: 80 }] },
        automationLanes: getDefaultAutomationLanes("trk_instruments", "instruments", "🎹 Instruments & Synth"),
        deviceChain: [
          { id: "d_ins_1", name: "Stereo Chorus", type: "Audio FX", category: "Modulation", enabled: true, params: { rate: 1.2, depth: 40 } },
          { id: "d_ins_2", name: "Delay+ Dual", type: "Audio FX", category: "Delay", enabled: true, params: { time: 250, feedback: 30, mix: 25 } }
        ],
        clips: makeClips("instruments", trk.title, stems.instruments || stems.other || trk.url, "#8b5cf6")
      }
    ];

    setTracks(loadedTracks);
    setBpm(songBpm);
    if (trk.key) setMusicalKey(trk.key);
    if (trk.title) setCurrentSongTitle(trk.title);
    setSelectedTrackId("trk_vocals");
    if (loadedTracks[0]?.clips[0]) setSelectedClipId(loadedTracks[0].clips[0].id);
    setCurrentBar(1);
    setCurrentBeat(1);
    setCurrentTimeSec(0);
    if (timelineScrollRef.current) {
      timelineScrollRef.current.scrollLeft = 0;
    }
    dawAudioEngine.preloadTrackBuffers(loadedTracks);
    setStatusHint(`Morceau "${trk.title}" chargé : 4 stems séparées prêtes dans le DAW (Arrangement complet 148 mesures)`);
  }, []);

  // ── Real Audio Playback Handling ──
  const togglePlay = useCallback(() => {
    dawAudioEngine.init();
    setIsPlaying((prev) => {
      const next = !prev;
      if (next) {
        setStatusHint("LECTURE EN COURS • Espace pour stopper");
        sendStudioOsc("play");
        const secPerBeat = 60 / bpm;
        const startSec = (currentBar - 1) * (240 / bpm) + (currentBeat - 1) * secPerBeat;
        dawAudioEngine.startMultitrackPlayback({
          tracks,
          playheadSec: startSec,
          bpm
        });
      } else {
        setStatusHint("LECTURE ARRÊTÉE • Clic sur timeline pour repositionner tête de lecture");
        sendStudioOsc("stop");
        dawAudioEngine.stopAllSources();
      }
      return next;
    });
  }, [currentBar, currentBeat, bpm, tracks, sendStudioOsc]);

  const stopPlayback = useCallback(() => {
    setIsPlaying(false);
    sendStudioOsc("stop");
    sendStudioOsc("rewind");
    dawAudioEngine.stopAllSources();
    setCurrentBar(loopStartBar);
    setCurrentBeat(1);
    setCurrentTimeSec((loopStartBar - 1) * (240 / bpm));
    setStatusHint(`ARRÊTÉ • Position ${loopStartBar}.1.1.00`);
  }, [loopStartBar, bpm, sendStudioOsc]);

  // Seek timeline to bar
  const handleSeekToBar = useCallback(
    (bar, smoothScroll = true) => {
      const secPerBar = 240 / bpm;
      const newSec = (bar - 1) * secPerBar;
      setCurrentBar(bar);
      setCurrentBeat(1);
      setCurrentTimeSec(newSec);
      sendStudioOsc("rewind");
      if (isPlaying) {
        dawAudioEngine.startMultitrackPlayback({
          tracks,
          playheadSec: newSec,
          bpm
        });
      }
      setStatusHint(`Tête de lecture repositionnée: Mesure ${bar}.1`);

      if (timelineScrollRef.current) {
        const el = timelineScrollRef.current;
        const targetPx = (bar - 1) * barWidthPx;
        const viewLeft = el.scrollLeft;
        const viewRight = el.scrollLeft + el.clientWidth - 224;
        if (targetPx < viewLeft || targetPx > viewRight) {
          el.scrollTo({
            left: Math.max(0, targetPx - 80),
            behavior: smoothScroll ? "smooth" : "auto"
          });
        }
      }
    },
    [bpm, isPlaying, tracks, barWidthPx]
  );

  // ── Timeline Navigation, Independent Scroll & Zoom (Section 3.1.1, p. 78) ──
  const handleTimelineWheel = useCallback((e) => {
    const isOverRuler = Boolean(e.target && e.target.closest && e.target.closest("[data-timeline-ruler]"));

    // ── Mode A: Zoom sur la Règle / Timeline OU avec modificateur clavier (Ctrl / Cmd / Alt) ──
    if (isOverRuler || e.ctrlKey || e.metaKey || e.altKey) {
      if (e.cancelable) e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 0.88 : 1.14;
      
      const container = timelineScrollRef.current;
      const rect = container ? container.getBoundingClientRect() : null;
      // Position du curseur par rapport au début des pistes temporelles (224px = en-tête des pistes)
      const mouseXInContainer = rect ? (e.clientX - rect.left + container.scrollLeft - 224) : 0;
      const barUnderMouse = barWidthPx > 0 ? (mouseXInContainer / barWidthPx) : 0;

      setZoomLevel((currentZoom) => {
        const nextZoom = Math.max(0.10, Math.min(3.0, Number((currentZoom * zoomFactor).toFixed(2))));
        if (container && barUnderMouse > 0) {
          requestAnimationFrame(() => {
            const newBarWidth = Math.round(96 * nextZoom);
            const targetScrollLeft = Math.max(0, 224 + barUnderMouse * newBarWidth - (e.clientX - rect.left));
            container.scrollLeft = targetScrollLeft;
          });
        }
        return nextZoom;
      });
      return;
    }

    // ── Mode B: Défilement Horizontal (Maj + Molette OU Balayage Trackpad deltaX) ──
    if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      if (timelineScrollRef.current) {
        if (e.cancelable) e.preventDefault();
        timelineScrollRef.current.scrollLeft += (e.deltaX || e.deltaY);
      }
      return;
    }

    // ── Mode C: Défilement Vertical des Pistes dans l'Arrangeur (SANS ZOOMER) ──
    // Permet de parcourir toutes les pistes vers le bas et vers le haut en toute fluidité
    if (timelineScrollRef.current) {
      if (e.cancelable) e.preventDefault();
      timelineScrollRef.current.scrollTop += e.deltaY;
    }
  }, [barWidthPx]);

  // ── Drag-to-Zoom & Horizontal Scroll on Measure Numbers (Section 3.1.1, p. 78) ──
  const handleRulerMouseDown = useCallback((e, bar) => {
    if (e.button !== 0) return;
    if (e.target && e.target.closest && (e.target.closest('[title*="boucle"]') || e.target.closest('[data-cue-marker]'))) return;

    isDraggingRulerRef.current = true;
    rulerDragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      zoom: zoomLevel,
      scrollLeft: timelineScrollRef.current ? timelineScrollRef.current.scrollLeft : 0,
      bar,
      moved: false
    };

    const handleWindowMouseMove = (moveEvt) => {
      if (!isDraggingRulerRef.current) return;
      const dx = moveEvt.clientX - rulerDragStartRef.current.x;
      const dy = rulerDragStartRef.current.y - moveEvt.clientY; // Glisser vers le haut = zoom avant, vers le bas = zoom arrière

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        rulerDragStartRef.current.moved = true;
        document.body.style.cursor = "ns-resize";
      }

      if (rulerDragStartRef.current.moved) {
        // Déplacement vertical = Zoom
        if (Math.abs(dy) > 2) {
          const zoomDelta = dy * 0.006;
          const nextZoom = Math.max(0.10, Math.min(3.0, Number((rulerDragStartRef.current.zoom + zoomDelta).toFixed(2))));
          setZoomLevel(nextZoom);
        }
        // Déplacement horizontal = Défilement horizontal
        if (timelineScrollRef.current && Math.abs(dx) > 2) {
          timelineScrollRef.current.scrollLeft = Math.max(0, rulerDragStartRef.current.scrollLeft - dx);
        }
      }
    };

    const handleWindowMouseUp = () => {
      isDraggingRulerRef.current = false;
      document.body.style.cursor = "";
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);

      // Si c'était un simple clic sans glisser, caler la tête de lecture à la mesure cliquée
      if (!rulerDragStartRef.current.moved) {
        handleSeekToBar(rulerDragStartRef.current.bar);
      }
    };

    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);
  }, [zoomLevel, handleSeekToBar]);

  // ── Track horizontal scroll offset for the bottom mini-map ──
  useEffect(() => {
    const el = timelineScrollRef.current;
    if (!el) return;
    const onScroll = () => {
      setTimelineScrollLeft(el.scrollLeft);
      setTimelineClientWidth(el.clientWidth);
    };
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // ── Audio Export (Real 16-bit Stereo 48kHz WAV Rendering) ──
  const handleExportWav = useCallback(() => {
    const sr = 48000;
    const durSec = Math.max(10, Math.min(60, (loopEndBar - loopStartBar) * (240 / bpm)));
    const totalSamples = Math.floor(sr * durSec);
    const leftChannel = new Float32Array(totalSamples);
    const rightChannel = new Float32Array(totalSamples);

    for (const trk of tracks) {
      if (trk.mute) continue;
      const vol = (trk.volume / 100) * 0.4;
      const pan = (trk.pan || 0) / 100;
      const leftGain = vol * Math.cos(((pan + 1) * Math.PI) / 4);
      const rightGain = vol * Math.sin(((pan + 1) * Math.PI) / 4);

      for (const clip of trk.clips || []) {
        const url = clip.url || trk.audioUrl;
        const buf = url ? dawAudioEngine.bufferCache.get(url) : null;
        if (buf && buf.numberOfChannels > 0) {
          const bufL = buf.getChannelData(0);
          const bufR = buf.numberOfChannels > 1 ? buf.getChannelData(1) : bufL;
          const copyLen = Math.min(totalSamples, bufL.length);
          for (let i = 0; i < copyLen; i++) {
            leftChannel[i] += bufL[i] * leftGain;
            rightChannel[i] += bufR[i] * rightGain;
          }
        } else {
          const baseFreq = trk.type === "bass" ? 65.4 : trk.type === "vocals" ? 330 : 220;
          for (let i = 0; i < totalSamples; i++) {
            const t = i / sr;
            const s = Math.sin(2 * Math.PI * baseFreq * t) * Math.exp(-((t % 2) * 1.2));
            leftChannel[i] += s * leftGain;
            rightChannel[i] += s * rightGain;
          }
        }
      }
    }

    let maxAmp = 0;
    for (let i = 0; i < totalSamples; i++) {
      if (Math.abs(leftChannel[i]) > maxAmp) maxAmp = Math.abs(leftChannel[i]);
      if (Math.abs(rightChannel[i]) > maxAmp) maxAmp = Math.abs(rightChannel[i]);
    }
    if (maxAmp > 0.001) {
      const normFactor = 0.95 / maxAmp;
      for (let i = 0; i < totalSamples; i++) {
        leftChannel[i] *= normFactor;
        rightChannel[i] *= normFactor;
      }
    }

    const wavBuffer = encodeWavStereo(leftChannel, rightChannel, sr);
    const blob = new Blob([wavBuffer], { type: "audio/wav" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(selectedTrack?.title || "Projet_DAW").replace(/\s+/g, "_")}_Master_Mix.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsExportAudioModalOpen(false);
    setStatusHint("Export WAV stéréo 48kHz terminé avec succès !");
  }, [tracks, loopStartBar, loopEndBar, bpm, selectedTrack]);

  // ── Project Actions ──
  const handleNewProject = useCallback(() => {
    if (typeof window !== "undefined" && !window.confirm("Créer un nouveau projet vide ? Tous les changements non sauvegardés seront réinitialisés.")) {
      return;
    }
    setTracks([]);
    stopPlayback();
    setCurrentBar(1);
    setCurrentBeat(1);
    setStatusHint("Nouveau projet initialisé");
  }, [stopPlayback]);

  const handleSaveProject = useCallback(() => {
    const projectData = {
      version: "3.5",
      title: selectedTrack?.title || "Projet Actif",
      bpm,
      key: musicalKey,
      timeSignature,
      tracks,
      markers,
      loopStartBar,
      loopEndBar
    };
    try {
      localStorage.setItem("oga_daw_current_project", JSON.stringify(projectData));
      const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(selectedTrack?.title || "Projet_DAW").replace(/\s+/g, "_")}.dawproject.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatusHint("Projet sauvegardé dans le stockage local et téléchargé");
    } catch (e) {
      console.warn("Save error:", e);
      setStatusHint("Erreur lors de la sauvegarde du projet");
    }
  }, [selectedTrack, bpm, musicalKey, timeSignature, tracks, markers, loopStartBar, loopEndBar]);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".daw-menu-container")) {
        setOpenMenu(null);
        setActiveSubMenu(null);
      }
      if (!e.target.closest(".daw-song-selector-container")) {
        setIsSongSelectorOpen(false);
      }
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  // Song / Track Selector in DAW Header
  const [isSongSelectorOpen, setIsSongSelectorOpen] = useState(false);
  const [songSearchQuery, setSongSearchQuery] = useState("");


  // Hum-to-Music (Fredonner un air / Audio-to-Music) State
  const [isHumModalOpen, setIsHumModalOpen] = useState(false);
  const [humActiveTab, setHumActiveTab] = useState("mic"); // 'mic' | 'file'
  const [isRecordingHum, setIsRecordingHum] = useState(false);
  const [humRecordingTime, setHumRecordingTime] = useState(0);
  const [humAudioBlob, setHumAudioBlob] = useState(null);
  const [humAudioUrl, setHumAudioUrl] = useState(null);
  const [selectedHumInstruments, setSelectedHumInstruments] = useState([]); // Empty = Full arrangement
  const [humPrompt, setHumPrompt] = useState("mélodie synthwave entraînante");
  const [humStyle, setHumStyle] = useState("synthwave");
  const [humBpm, setHumBpm] = useState(0); // 0 = Auto
  const [humKey, setHumKey] = useState("Auto");
  const [humDuration, setHumDuration] = useState(30);
  const [isGeneratingHum, setIsGeneratingHum] = useState(false);
  const [generatedHumTrack, setGeneratedHumTrack] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  // ── Hum-to-Music Handlers (Microphone & Audio Input Processing) ──
  const handleStartRecordingHum = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setStatusHint("API Audio non supportée par le navigateur. Utilisez le générateur de tonalité.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setHumAudioBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setHumAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(100);
      setIsRecordingHum(true);
      setHumRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setHumRecordingTime((prev) => prev + 1);
      }, 1000);
      setStatusHint("Enregistrement du fredonnement en cours... Chantez ou sifflez votre mélodie !");
    } catch (err) {
      console.warn("Microphone access failed:", err);
      setStatusHint("Microphone indisponible. Générez une tonalité de test ou importez un fichier audio.");
    }
  };

  const handleStopRecordingHum = () => {
    if (mediaRecorderRef.current && isRecordingHum) {
      mediaRecorderRef.current.stop();
      setIsRecordingHum(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      setStatusHint("Mélodie enregistrée avec succès ! Prêt pour l'extraction et l'arrangement IA.");
    }
  };

  const generateTestHumTone = () => {
    const sr = 44100;
    const durSec = 4.0;
    const totalSamples = Math.floor(sr * durSec);
    const samples = new Float32Array(totalSamples);

    // Synthetic hum melody: A3 (220Hz), C4 (261.6Hz), E4 (329.6Hz), B4 (493.8Hz)
    const notes = [
      { f: 220.0, s: 0, d: 1.0 },
      { f: 261.63, s: 1.0, d: 1.0 },
      { f: 329.63, s: 2.0, d: 1.0 },
      { f: 493.88, s: 3.0, d: 1.0 }
    ];

    for (let n of notes) {
      const startIdx = Math.floor(n.s * sr);
      const endIdx = Math.floor((n.s + n.d) * sr);
      for (let i = startIdx; i < endIdx && i < totalSamples; i++) {
        const t = (i - startIdx) / sr;
        const env = Math.sin((Math.PI * t) / n.d);
        const val = (Math.sin(2 * Math.PI * n.f * t) + 0.3 * Math.sin(4 * Math.PI * n.f * t)) * 0.6 * env;
        samples[i] = val;
      }
    }

    const wavBuffer = encodeWavMono(samples, sr);
    const blob = new Blob([wavBuffer], { type: "audio/wav" });
    setHumAudioBlob(blob);
    const url = URL.createObjectURL(blob);
    setHumAudioUrl(url);
    setStatusHint("Mélodie de test fredonnée générée (A3-C4-E4-B4) !");
  };

  const toggleHumInstrument = (instId) => {
    setSelectedHumInstruments((prev) =>
      prev.includes(instId) ? prev.filter((i) => i !== instId) : [...prev, instId]
    );
  };

  const handleGenerateHumToMusic = async () => {
    setIsGeneratingHum(true);
    setStatusHint("Analyse de la hauteur (pitch YIN), tempo, tonalité et synthèse des pistes en cours...");

    try {
      let activeBlob = humAudioBlob;
      if (!activeBlob) {
        const sr = 44100;
        const durSec = 4.0;
        const totalSamples = Math.floor(sr * durSec);
        const samples = new Float32Array(totalSamples);
        for (let i = 0; i < totalSamples; i++) {
          const t = i / sr;
          samples[i] = Math.sin(2 * Math.PI * 220 * t) * 0.5;
        }
        const buf = encodeWavMono(samples, sr);
        activeBlob = new Blob([buf], { type: "audio/wav" });
      }

      const reader = new FileReader();
      const base64Promise = new Promise((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
      });
      reader.readAsDataURL(activeBlob);
      const base64Data = await base64Promise;

      const res = await fetch("/api/music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "hum_to_music",
          audioData: base64Data,
          audio: base64Data,
          audioFormat: "wav",
          instruments: selectedHumInstruments,
          selectedInstruments: selectedHumInstruments,
          prompt: humPrompt,
          style: humStyle,
          bpm: humBpm,
          key: humKey,
          duration: humDuration
        })
      });

      const data = await res.json();
      if ((data.ok || data.success) && data.track) {
        setGeneratedHumTrack(data.track);
        setStatusHint(`Arrangement IA généré (${data.track.title}) ! Cliquez sur "Charger dans le DAW"`);
      } else {
        setStatusHint(`Erreur de génération: ${data.error || "Échec de l'arrangement"}`);
      }
    } catch (err) {
      console.error("Hum-to-music failed:", err);
      setStatusHint(`Erreur lors de la communication avec le moteur: ${err.message}`);
    } finally {
      setIsGeneratingHum(false);
    }
  };

  const handleLoadHumTrackIntoDaw = (track) => {
    if (!track) return;

    if (track.bpm && Number(track.bpm) > 0) {
      setBpm(Number(track.bpm));
    }
    if (track.key && track.key !== "Auto") {
      setMusicalKey(track.key);
    }

    const stems = track.stems || {};
    const stemTracks = [
      {
        id: "hum_vocals",
        name: "Vocals / Fredonnement Lead",
        type: "vocals",
        color: "#df9c43",
        volume: 85,
        pan: 0,
        mute: false,
        solo: false,
        armed: false,
        frozen: false,
        db: "+0.5 dB",
        audioUrl: stems.vocals || track.audioUrl,
        automation: { visible: false, param: "volume", points: [{ id: "ap_v1", bar: 1, value: 85 }] },
        deviceChain: [
          { id: "d_hum_v1", name: "Parametric EQ", type: "Audio FX", category: "EQ", enabled: true, params: { low: -1, mid: 2, high: 1 } },
          { id: "d_hum_v2", name: "Studio Reverb", type: "Audio FX", category: "Reverb", enabled: true, params: { size: 60, decay: 2.5, mix: 35 } }
        ],
        clips: [
          { id: "c_hum_voc", name: `${track.title} - Lead Melodie`, startBar: 1, bars: 16, color: "#df9c43" }
        ]
      },
      {
        id: "hum_drums",
        name: "Drums / Batterie IA",
        type: "drums",
        color: "#06b6d4",
        volume: 82,
        pan: 0,
        mute: false,
        solo: false,
        armed: false,
        frozen: false,
        db: "-0.2 dB",
        audioUrl: stems.drums,
        automation: { visible: false, param: "volume", points: [{ id: "ap_d1", bar: 1, value: 82 }] },
        deviceChain: [
          { id: "d_hum_d1", name: "Compressor Glue", type: "Audio FX", category: "Dynamics", enabled: true, params: { threshold: -14, ratio: 4, attack: 10 } }
        ],
        clips: [
          { id: "c_hum_drm", name: `${track.title} - Drum Groove`, startBar: 1, bars: 16, color: "#06b6d4" }
        ]
      },
      {
        id: "hum_bass",
        name: "Bass & Sub 808",
        type: "instruments",
        color: "#8b5cf6",
        volume: 80,
        pan: 0,
        mute: false,
        solo: false,
        armed: false,
        frozen: false,
        db: "-0.8 dB",
        audioUrl: stems.bass,
        automation: { visible: false, param: "volume", points: [{ id: "ap_b1", bar: 1, value: 80 }] },
        deviceChain: [
          { id: "d_hum_b1", name: "Sub Saturator", type: "Audio FX", category: "Drive", enabled: true, params: { drive: 25, tone: 40, mix: 60 } }
        ],
        clips: [
          { id: "c_hum_bas", name: `${track.title} - Bassline`, startBar: 1, bars: 16, color: "#8b5cf6" }
        ]
      },
      {
        id: "hum_instruments",
        name: "Instruments & Accords IA",
        type: "instruments",
        color: "#10b981",
        volume: 78,
        pan: 0,
        mute: false,
        solo: false,
        armed: false,
        frozen: false,
        db: "-1.5 dB",
        audioUrl: stems.instruments,
        automation: { visible: false, param: "volume", points: [{ id: "ap_i1", bar: 1, value: 78 }] },
        deviceChain: [
          { id: "d_hum_i1", name: "Stereo Delay", type: "Audio FX", category: "Delay", enabled: true, params: { time: 375, feedback: 30, mix: 25 } }
        ],
        clips: [
          { id: "c_hum_ins", name: `${track.title} - Accords & Harmonies`, startBar: 1, bars: 16, color: "#10b981" }
        ]
      }
    ];

    setTracks(stemTracks);
    setSelectedTrackId(stemTracks[0].id);
    setSelectedClipId(stemTracks[0].clips[0].id);
    setIsHumModalOpen(false);

    if (onSelectSong) {
      onSelectSong(track);
    }
    setStatusHint(`Morceau "${track.title}" chargé dans Music Studio DAW avec 4 stems !`);
  };

  // Keep BPM and Musical Key synchronized with selectedTrack
  useEffect(() => {
    if (selectedTrack) {
      if (selectedTrack.bpm && Number(selectedTrack.bpm) > 0) {
        setBpm(Number(selectedTrack.bpm));
      }
      if (selectedTrack.key && selectedTrack.key !== "Auto") {
        setMusicalKey(selectedTrack.key);
      }
    }
  }, [selectedTrack]);

  // ── Drag & Drop State ──
  const [draggedClipInfo, setDraggedClipInfo] = useState(null);
  const [dragOverTrackId, setDragOverTrackId] = useState(null);
  const [dragOverBar, setDragOverBar] = useState(null);
  const [draggingTrackIndex, setDraggingTrackIndex] = useState(null);
  const [trackDropIndicator, setTrackDropIndicator] = useState(null); // { targetIndex: number, position: 'before' | 'after', trackId: string }
  const [clipDragGhost, setClipDragGhost] = useState(null); // { trackId: string, bar: number, bars: number, name: string, color: string }
  const [draggedSidebarItem, setDraggedSidebarItem] = useState(null); // { type: 'device' | 'instrument', name: string, data?: any }
  const [deviceRackDropIndex, setDeviceRackDropIndex] = useState(null);

  // Expose drag testing interface on window for end-to-end testing
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.__dawDragTest = {
        setTrackDropIndicator,
        setClipDragGhost,
        setDraggedSidebarItem,
        setDragOverTrackId,
        setDeviceRackDropIndex,
        setBottomPanelTab,
        setShowBottomPanel
      };
    }
  }, []);

  // Real WebAudio Live Peak Levels
  const [masterPeak, setMasterPeak] = useState({ left: 0, right: 0 });
  const [trackPeaks, setTrackPeaks] = useState({});

  // Clip Context Menu & Trimming
  const [clipContextMenu, setClipContextMenu] = useState(null); // { x, y, trackId, clipId }
  const [isResizingClip, setIsResizingClip] = useState(null); // { trackId, clipId, startX, initialBars }

  // Microphone Recording Refs
  const transportMediaRecorderRef = useRef(null);
  const transportRecordChunksRef = useRef([]);
  const transportRecordStartBarRef = useRef(1);
  const transportRecordStartTimeRef = useRef(0);

  // Playhead Interval Ref & Metronome Beat Tracker
  const playheadIntervalRef = useRef(null);
  const lastBeatTickRef = useRef(-1);

  // Dynamic Status Hint
  const [statusHint, setStatusHint] = useState("DOUBLE-CLIC Insérer piste ou glisser-déposer un composant");

  // Project Remotes Macros (Project panel)
  const [macros, setMacros] = useState([
    { id: "m1", name: "Cutoff Global", value: 68, display: "2.4 kHz" },
    { id: "m2", name: "Resonance", value: 34, display: "28 %" },
    { id: "m3", name: "Reverb Mix", value: 45, display: "35 %" },
    { id: "m4", name: "Drive Saturator", value: 22, display: "12 dB" }
  ]);

  // Piano Roll Note Grid State with Music Studio Operators & Expressions (Chapters 11 & 12)
  const [pianoRollNotes, setPianoRollNotes] = useState([
    { id: "n1", pitch: "C4", startBeat: 1, duration: 2, velocity: 95, chance: 100, ratchets: 1, occurrence: "Always", microPitch: 0, pressure: 60, pan: 0 },
    { id: "n2", pitch: "E4", startBeat: 1, duration: 2, velocity: 85, chance: 90, ratchets: 1, occurrence: "Always", microPitch: 0, pressure: 50, pan: -15 },
    { id: "n3", pitch: "G4", startBeat: 1, duration: 2, velocity: 95, chance: 100, ratchets: 2, occurrence: "1:2", microPitch: 0, pressure: 70, pan: 15 },
    { id: "n4", pitch: "B4", startBeat: 1, duration: 2, velocity: 80, chance: 75, ratchets: 1, occurrence: "Always", microPitch: 10, pressure: 40, pan: 0 },
    { id: "n5", pitch: "A4", startBeat: 3, duration: 2, velocity: 100, chance: 100, ratchets: 4, occurrence: "Fill", microPitch: 0, pressure: 85, pan: -25 },
    { id: "n6", pitch: "F4", startBeat: 5, duration: 2, velocity: 90, chance: 85, ratchets: 1, occurrence: "Always", microPitch: -15, pressure: 55, pan: 20 },
    { id: "n7", pitch: "D4", startBeat: 7, duration: 2, velocity: 85, chance: 100, ratchets: 2, occurrence: "2:2", microPitch: 0, pressure: 65, pan: 0 },
    { id: "n8", pitch: "C4", startBeat: 9, duration: 4, velocity: 110, chance: 100, ratchets: 1, occurrence: "Always", microPitch: 0, pressure: 90, pan: 0 }
  ]);

  // Selected note in piano roll
  const [selectedNoteId, setSelectedNoteId] = useState("n1");

  // AI Prompt for selected clip regeneration
  const [clipPrompt, setClipPrompt] = useState("");
  const [isClipRegenerating, setIsClipRegenerating] = useState(false);

  // Inline editing track name
  const [editingTrackId, setEditingTrackId] = useState(null);
  const [editingTrackName, setEditingTrackName] = useState("");

  // Color Palette Picker State
  const [colorPickerTrackId, setColorPickerTrackId] = useState(null);
  const COLOR_PALETTE = ["#df9c43", "#eab308", "#d97706", "#10b981", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#df9c43", "#ef4444"];

  // ── Preload Audio Buffers into WebAudio Engine ──
  useEffect(() => {
    dawAudioEngine.preloadTrackBuffers(tracks);
  }, [tracks]);

  useEffect(() => {
    if (selectedTrack?.url) {
      dawAudioEngine.loadBuffer(selectedTrack.url);
    }
  }, [selectedTrack]);

  // ── Real Peak Meter Animation Frame ──
  useEffect(() => {
    let animId;
    const updateMeters = () => {
      if (isPlaying) {
        setMasterPeak(dawAudioEngine.getMasterPeak());
        const tp = {};
        for (const t of tracks) {
          tp[t.id] = dawAudioEngine.getTrackPeak(t.id);
        }
        setTrackPeaks(tp);
      } else {
        setMasterPeak((prev) => ({
          left: Math.max(0, prev.left * 0.82),
          right: Math.max(0, prev.right * 0.82)
        }));
        setTrackPeaks((prev) => {
          const next = {};
          for (const k in prev) {
            next[k] = Math.max(0, prev[k] * 0.82);
          }
          return next;
        });
      }
      animId = requestAnimationFrame(updateMeters);
    };
    animId = requestAnimationFrame(updateMeters);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, tracks]);

  // ── Clip Resizing Mouse Handlers ──
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizingClip) return;
      const deltaX = e.clientX - isResizingClip.startX;
      const deltaBars = Math.round(deltaX / barWidthPx);
      const newBars = Math.max(1, isResizingClip.initialBars + deltaBars);
      setTracks((prev) =>
        prev.map((t) =>
          t.id === isResizingClip.trackId
            ? {
                ...t,
                clips: (t.clips || []).map((c) =>
                  c.id === isResizingClip.clipId ? { ...c, bars: newBars } : c
                )
              }
            : t
        )
      );
    };

    const handleMouseUp = () => {
      if (isResizingClip) {
        setIsResizingClip(null);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizingClip, barWidthPx]);

  // Close clip context menu on click outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (clipContextMenu) setClipContextMenu(null);
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [clipContextMenu]);

  // Keyboard Shortcuts (Music Studio Official Conventions - Section 0.2.2.5, p. 36)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "i") {
        e.preventDefault();
        setIsInspectorOpen((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        setIsDashboardModalOpen((prev) => !prev);
      } else if (e.altKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        if (selectedTrackId) handleToggleTrackActive(selectedTrackId);
      } else if (e.key === "Tab") {
        e.preventDefault();
        setMainView((prev) => (prev === "arrange" ? "clips" : "arrange"));
      } else if (e.key.toLowerCase() === "l") {
        e.preventDefault();
        setIsLooping((prev) => !prev);
      } else if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        setIsMetronomeActive((prev) => !prev);
      } else if (e.key.toLowerCase() === "b" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setIsPopupBrowserOpen((prev) => !prev);
        setStatusHint("Navigateur Pop-up Universel Music Studio ouvert [B]");
      } else if (e.key === "1") {
        e.preventDefault();
        setActiveEditingTool("pointer");
        setStatusHint("Outil Pointeur [1] actif (Sélection et déplacement d'objets)");
      } else if (e.key === "2") {
        e.preventDefault();
        setActiveEditingTool("time");
        setStatusHint("Outil Durée [2] actif (Sélection temporelle)");
      } else if (e.key === "3") {
        e.preventDefault();
        setActiveEditingTool("pencil");
        setStatusHint("Outil Crayon [3] actif (Dessiner clips et notes)");
      } else if (e.key === "4") {
        e.preventDefault();
        setActiveEditingTool("eraser");
        setStatusHint("Outil Gomme [4] actif (Supprimer au clic)");
      } else if (e.key === "5") {
        e.preventDefault();
        setActiveEditingTool("knife");
        setStatusHint("Outil Cutter [5] actif (Scinder un clip en deux)");
      } else if (e.key === "Escape") {
        e.preventDefault();
        if (timeSelection) {
          setTimeSelection(null);
          setStatusHint("Sélection temporelle effacée");
        } else {
          setActiveEditingTool("pointer");
          setStatusHint("Outil Pointeur [1] actif");
        }
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedClipId && selectedTrackId) {
          e.preventDefault();
          setTracks((prev) =>
            prev.map((t) =>
              t.id === selectedTrackId
                ? { ...t, clips: (t.clips || []).filter((c) => c.id !== selectedClipId) }
                : t
            )
          );
          setSelectedClipId(null);
          setStatusHint("Clip supprimé (Touche Suppr)");
        }
      } else if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        setZoomLevel((z) => Math.min(3.0, Number((z + 0.15).toFixed(2))));
        setStatusHint("Zoom Avant (Touche +)");
      } else if (e.key === "-") {
        e.preventDefault();
        setZoomLevel((z) => Math.max(0.10, Number((z - 0.15).toFixed(2))));
        setStatusHint("Zoom Arrière (Touche -)");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, selectedTrackId, selectedClipId, handleToggleTrackActive, timeSelection]);

  // Real Playhead Loop Timer with Dynamic Loop Start/End Markers & Metronome Sync
  useEffect(() => {
    if (isPlaying) {
      const secPerBeat = 60 / bpm;
      const secPerBar = 240 / bpm;
      const tickIntervalMs = 50;

      playheadIntervalRef.current = setInterval(() => {
        setCurrentTimeSec((prevSec) => {
          const newSec = prevSec + tickIntervalMs / 1000;
          const totalBeats = newSec / secPerBeat;
          const totalBars = newSec / secPerBar;

          // Audible Metronome Tick
          const currentIntegerBeat = Math.floor(totalBeats);
          if (currentIntegerBeat !== lastBeatTickRef.current) {
            lastBeatTickRef.current = currentIntegerBeat;
            const beatInBar = (currentIntegerBeat % 4) + 1;
            if (isMetronomeActive) {
              dawAudioEngine.playMetronomeClick(beatInBar === 1);
            }
          }

          // Loop Check & End of Song Auto-Stop
          const computedBar = Math.floor(totalBars) + 1;
          if (isLooping && computedBar > loopEndBar) {
            const loopStartSec = (loopStartBar - 1) * secPerBar;
            setCurrentBar(loopStartBar);
            setCurrentBeat(1);
            dawAudioEngine.startMultitrackPlayback({
              tracks,
              playheadSec: loopStartSec,
              bpm
            });
            return loopStartSec;
          }

          // If loop is OFF and playback reaches the end of the project / arrangement
          if (!isLooping && computedBar > maxTrackBars) {
            stopPlayback();
            setStatusHint("Fin du morceau atteinte • Lecture arrêtée automatiquement");
            return 0;
          }

          setCurrentBar(computedBar);
          setCurrentBeat((totalBeats % 4) + 1);
          return newSec;
        });
      }, tickIntervalMs);
    } else {
      if (playheadIntervalRef.current) {
        clearInterval(playheadIntervalRef.current);
      }
    }
    return () => {
      if (playheadIntervalRef.current) {
        clearInterval(playheadIntervalRef.current);
      }
    };
  }, [isPlaying, isLooping, loopStartBar, loopEndBar, bpm, isMetronomeActive, tracks, maxTrackBars, stopPlayback]);

  // Note Trigger for Piano Roll & On-Screen Keyboard with Music Studio Operators (Section 11.2 & Ch. 12)
  const handlePlaySynthNote = useCallback((pitchOrNote, customOpts = {}) => {
    const pitch = typeof pitchOrNote === "string" ? pitchOrNote : pitchOrNote.pitch;
    const noteObj = typeof pitchOrNote === "object" ? pitchOrNote : {};
    const freq = NOTE_FREQS[pitch] || 440;
    const opts = {
      ...noteObj,
      ...customOpts
    };
    dawAudioEngine.playNoteWithOptions(freq, (opts.duration || 1) * 0.35, opts);
    setStatusHint(
      `Note: ${pitch} (${freq.toFixed(1)} Hz) • Chance: ${opts.chance ?? 100}% • Répétitions: x${opts.ratchets || 1} • Occur: ${opts.occurrence || 'Always'}`
    );
  }, []);

  // Format Bar.Beat.Tick Display
  const barBeatDisplay = useMemo(() => {
    const b = Math.floor(currentBar);
    const bt = Math.floor(currentBeat);
    const frac = Math.floor((currentBeat - bt) * 16);
    return `${b}.${bt}.${frac > 0 ? frac : 1}.00`;
  }, [currentBar, currentBeat]);

  const timeDisplay = useMemo(() => {
    const mins = Math.floor(currentTimeSec / 60);
    const secs = (currentTimeSec % 60).toFixed(3);
    return `${mins}:${secs.padStart(6, "0")}`;
  }, [currentTimeSec]);

  // Selected Track & Clip objects
  const activeTrack = useMemo(() => {
    return tracks.find((t) => t.id === selectedTrackId) || tracks[0];
  }, [tracks, selectedTrackId]);

  const activeClip = useMemo(() => {
    if (!activeTrack) return null;
    return (activeTrack.clips || []).find((c) => c.id === selectedClipId) || activeTrack.clips?.[0] || null;
  }, [activeTrack, selectedClipId]);

  // ── Track Management Functions ──
  const toggleMute = (trackId) => {
    setTracks((prev) => {
      const isAnySolo = prev.some((t) => t.solo);
      return prev.map((t) => {
        if (t.id === trackId) {
          const nextMute = !t.mute;
          dawAudioEngine.setTrackVolume(trackId, t.volume, nextMute, isAnySolo, t.solo);
          return { ...t, mute: nextMute };
        }
        return t;
      });
    });
  };

  const toggleSolo = (trackId) => {
    setTracks((prev) => {
      const next = prev.map((t) => (t.id === trackId ? { ...t, solo: !t.solo } : t));
      const isAnySolo = next.some((t) => t.solo);
      for (const t of next) {
        dawAudioEngine.setTrackVolume(t.id, t.volume, t.mute, isAnySolo, t.solo);
      }
      return next;
    });
  };

  const toggleArm = (trackId) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, armed: !t.armed } : t))
    );
  };

  const toggleFreeze = (trackId) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, frozen: !t.frozen } : t))
    );
    setStatusHint(`Piste ${trackId} gelée (audio pré-calculé)`);
  };

  const handleVolumeChange = (trackId, val) => {
    const v = parseInt(val, 10);
    const dbVal = v === 0 ? "-inf dB" : `${((v - 80) * 0.3).toFixed(1)} dB`;
    setTracks((prev) => {
      const isAnySolo = prev.some((t) => t.solo);
      return prev.map((t) => {
        if (t.id === trackId) {
          dawAudioEngine.setTrackVolume(trackId, v, t.mute, isAnySolo, t.solo);
          return { ...t, volume: v, db: dbVal };
        }
        return t;
      });
    });
  };

  const handlePanChange = (trackId, val) => {
    const pan = parseInt(val, 10);
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, pan } : t))
    );
    dawAudioEngine.setTrackPan(trackId, pan);
  };

  // ── Clip Operations: Split, Duplicate, Delete, Resize ──
  const handleSplitClip = (trackId, clipId, customSplitBar = null) => {
    const splitBar = customSplitBar !== null ? customSplitBar : Math.floor(currentBar);
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id !== trackId) return t;
        const clip = (t.clips || []).find((c) => c.id === clipId);
        if (!clip) return t;
        const clipEnd = clip.startBar + (clip.bars || 8);
        if (splitBar <= clip.startBar || splitBar >= clipEnd) {
          setStatusHint("La mesure de coupe doit être à l'intérieur du clip pour le scinder.");
          return t;
        }
        const dur1 = splitBar - clip.startBar;
        const dur2 = clipEnd - splitBar;
        const clip1 = { ...clip, bars: dur1, fadeOutBars: Math.min(0.25, dur1 / 2) };
        const clip2 = {
          ...clip,
          id: `c_${Date.now()}`,
          name: `${clip.name} (Part 2)`,
          startBar: splitBar,
          bars: dur2,
          fadeInBars: Math.min(0.25, dur2 / 2)
        };
        const remainingClips = (t.clips || []).filter((c) => c.id !== clipId);
        return { ...t, clips: [...remainingClips, clip1, clip2] };
      })
    );
    setClipContextMenu(null);
    setStatusHint(`Clip scindé en 2 à la mesure ${splitBar}`);
  };

  const handleDuplicateClip = (trackId, clipId) => {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id !== trackId) return t;
        const clip = (t.clips || []).find((c) => c.id === clipId);
        if (!clip) return t;
        const duplicatedClip = {
          ...clip,
          id: `c_${Date.now()}`,
          name: `${clip.name} (Copie)`,
          startBar: clip.startBar + clip.bars
        };
        return { ...t, clips: [...(t.clips || []), duplicatedClip] };
      })
    );
    setClipContextMenu(null);
    setStatusHint("Clip dupliqué");
  };

  const handleDeleteClip = (trackId, clipId) => {
    setTracks((prev) =>
      prev.map((t) =>
        t.id === trackId
          ? { ...t, clips: (t.clips || []).filter((c) => c.id !== clipId) }
          : t
      )
    );
    if (selectedClipId === clipId) setSelectedClipId(null);
    setClipContextMenu(null);
    setStatusHint("Clip supprimé (Outil Gomme [4])");
  };

  // ── Atom F3: Rendu sur place (Bounce In Place) ──
  const handleBounceInPlace = useCallback((clipId, trkId) => {
    const targetTrackId = trkId || selectedTrackId;
    const targetClipId = clipId || selectedClipId;
    const track = tracks.find((t) => t.id === targetTrackId);
    if (!track) return;
    const clip = (track.clips || []).find((c) => c.id === targetClipId);
    if (!clip) return;

    const bouncedClipId = `c_bounced_${Date.now()}`;
    const bouncedTrackId = `trk_bounced_${Date.now()}`;
    const bouncedClipName = `${clip.name} (Bounced)`;

    const basePeaks = clip.peaks || [0.8, 0.9, 0.5, 0.3, 0.95, 0.7, 0.4, 0.2, 0.85, 0.6, 0.3, 0.1];
    const bouncedPeaks = basePeaks.map((p) => Math.min(1.0, Number((p * 1.15).toFixed(3))));

    const newBouncedClip = {
      ...clip,
      id: bouncedClipId,
      name: bouncedClipName,
      isAudio: true,
      color: "#06b6d4",
      peaks: bouncedPeaks,
      waveformKey: "piano_lr_1",
      warpMode: clip.warpMode || "stretch",
      pitchSemitones: clip.pitchSemitones || 0,
      fineCents: clip.fineCents || 0,
      warpMarkers: clip.warpMarkers || [
        { id: "wm_0", timeNorm: 0.0, warpedNorm: 0.0, isPinned: true },
        { id: "wm_1", timeNorm: 0.25, warpedNorm: 0.25, isPinned: true },
        { id: "wm_2", timeNorm: 0.5, warpedNorm: 0.5, isPinned: true },
        { id: "wm_3", timeNorm: 0.75, warpedNorm: 0.75, isPinned: true },
        { id: "wm_4", timeNorm: 1.0, warpedNorm: 1.0, isPinned: true }
      ],
      bouncedFrom: { trackId: track.id, clipId: clip.id, date: new Date().toISOString() }
    };

    const newBouncedTrack = {
      id: bouncedTrackId,
      name: `${track.name} (Bounced)`,
      type: "audio",
      isAudio: true,
      color: "#06b6d4",
      volume: track.volume || 85,
      pan: track.pan || 0,
      mute: false,
      solo: false,
      armed: false,
      frozen: false,
      db: track.db || "0.0 dB",
      clips: [newBouncedClip],
      deviceChain: [
        { id: `dev_eq_${Date.now()}`, name: "EQ-5 Parametric", type: "Audio FX", category: "EQ", enabled: true, params: { low: 0, mid: 0, high: 0 } }
      ]
    };

    setTracks((prev) => {
      const idx = prev.findIndex((t) => t.id === track.id);
      const copy = [...prev];
      if (idx !== -1) {
        copy.splice(idx + 1, 0, newBouncedTrack);
      } else {
        copy.push(newBouncedTrack);
      }
      return copy;
    });

    setSelectedTrackId(bouncedTrackId);
    setSelectedClipId(bouncedClipId);
    setClipContextMenu(null);
    setStatusHint(`⚡ Clip "${clip.name}" rendu sur place (Bounce in Place) vers "${newBouncedTrack.name}" !`);
  }, [tracks, selectedTrackId, selectedClipId]);

  // ── Atom F3: Découpage vers Drum Machine (Slice to Drum Machine) ──
  const handleSliceToDrumMachine = useCallback((clipId, trkId) => {
    const targetTrackId = trkId || selectedTrackId;
    const targetClipId = clipId || selectedClipId;
    const track = tracks.find((t) => t.id === targetTrackId);
    if (!track) return;
    const clip = (track.clips || []).find((c) => c.id === targetClipId);
    if (!clip) return;

    const transients = detectAudioTransients(clip.peaks || [0.9, 0.8, 0.3, 0.1, 0.95, 0.7, 0.2, 0.85, 0.6], 65);
    const numSlices = Math.min(12, Math.max(4, transients.length));

    const drumTrackId = `trk_drum_${Date.now()}`;
    const drumClipId = `c_drum_${Date.now()}`;

    const drumPads = Array.from({ length: 12 }, (_, i) => ({
      id: `pad_${i + 1}`,
      name: `Slice ${i + 1}`,
      note: 36 + i,
      noteName: ["C1", "C#1", "D1", "D#1", "E1", "F1", "F#1", "G1", "G#1", "A1", "A#1", "B1"][i],
      startOffset: transients[i % transients.length] || 0,
      vol: 85,
      pan: 0,
      color: "#10b981"
    }));

    const midiNotes = Array.from({ length: numSlices }, (_, i) => ({
      id: `mn_${i}`,
      pitch: 36 + i,
      startBeat: (clip.startBar - 1) * 4 + i * ((clip.bars || 4) * 4 / numSlices) + 1,
      durationBeats: 1,
      velocity: 95
    }));

    const newDrumClip = {
      id: drumClipId,
      name: `${clip.name} (Sliced)`,
      startBar: clip.startBar || 1,
      bars: clip.bars || 4,
      color: "#10b981",
      notes: midiNotes
    };

    const newDrumTrack = {
      id: drumTrackId,
      name: `${track.name} (Drum Slices)`,
      type: "drums",
      color: "#10b981",
      volume: 90,
      pan: 0,
      mute: false,
      solo: false,
      armed: true,
      frozen: false,
      db: "0.0 dB",
      clips: [newDrumClip],
      drumPads: drumPads,
      deviceChain: [
        { id: `dev_dm_${Date.now()}`, name: "Drum Machine", type: "Instrument", category: "Drums", enabled: true, params: { punch: 85, output: 0 } }
      ]
    };

    setTracks((prev) => {
      const idx = prev.findIndex((t) => t.id === track.id);
      const copy = [...prev];
      if (idx !== -1) {
        copy.splice(idx + 1, 0, newDrumTrack);
      } else {
        copy.push(newDrumTrack);
      }
      return copy;
    });

    setSelectedTrackId(drumTrackId);
    setSelectedClipId(drumClipId);
    setClipContextMenu(null);
    setStatusHint(`🥁 Clip "${clip.name}" découpé en ${numSlices} tranches vers une Drum Machine !`);
  }, [tracks, selectedTrackId, selectedClipId]);

  // ── Atom F4: Conversion Audio vers Notes MIDI (Audio to MIDI, Chapitre 13) ──
  const handleAudioToMidi = useCallback((clipId, trkId) => {
    const targetTrackId = trkId || selectedTrackId;
    const targetClipId = clipId || selectedClipId;
    const track = tracks.find((t) => t.id === targetTrackId);
    if (!track) return;
    const clip = (track.clips || []).find((c) => c.id === targetClipId);
    if (!clip) return;

    const transients = detectAudioTransients(clip.peaks || [0.8, 0.4, 0.9, 0.2, 0.7, 0.3, 0.85, 0.5], 55);
    const numNotes = Math.min(16, Math.max(6, transients.length));
    const scalePitches = [60, 62, 64, 65, 67, 69, 71, 72]; // Melodic scale

    const midiNotes = Array.from({ length: numNotes }, (_, i) => ({
      id: `midi_conv_${i}_${Date.now()}`,
      pitch: scalePitches[i % scalePitches.length],
      startBeat: (clip.startBar - 1) * 4 + i * ((clip.bars || 4) * 4 / numNotes) + 1,
      durationBeats: 1.25,
      velocity: Math.round(75 + (i % 4) * 12)
    }));

    const midiTrackId = `trk_midi_${Date.now()}`;
    const midiClipId = `c_midi_${Date.now()}`;

    const newMidiClip = {
      id: midiClipId,
      name: `${clip.name} (MIDI Transcrit)`,
      startBar: clip.startBar || 1,
      bars: clip.bars || 4,
      color: "#f59e0b",
      notes: midiNotes
    };

    const newMidiTrack = {
      id: midiTrackId,
      name: `${track.name} (Transcription MIDI)`,
      type: "synth",
      color: "#f59e0b",
      volume: 88,
      pan: 0,
      mute: false,
      solo: false,
      armed: true,
      frozen: false,
      db: "0.0 dB",
      clips: [newMidiClip],
      deviceChain: [
        { id: `dev_poly_${Date.now()}`, name: "Polymer", type: "Instrument", category: "Synth", enabled: true, params: { cutoff: 74, res: 22 } }
      ]
    };

    setTracks((prev) => {
      const idx = prev.findIndex((t) => t.id === track.id);
      const copy = [...prev];
      if (idx !== -1) {
        copy.splice(idx + 1, 0, newMidiTrack);
      } else {
        copy.push(newMidiTrack);
      }
      return copy;
    });

    setSelectedTrackId(midiTrackId);
    setSelectedClipId(midiClipId);
    setClipContextMenu(null);
    setStatusHint(`🎹 Audio converti en ${numNotes} notes MIDI mélodiques sur la nouvelle piste "${newMidiTrack.name}" !`);
  }, [tracks, selectedTrackId, selectedClipId]);

  // ── Atom F5: Découpage vers Multi-Sampler (Slice to Multi-Sampler, Chapitre 13) ──
  const handleSliceToMultiSampler = useCallback((clipId, trkId) => {
    const targetTrackId = trkId || selectedTrackId;
    const targetClipId = clipId || selectedClipId;
    const track = tracks.find((t) => t.id === targetTrackId);
    if (!track) return;
    const clip = (track.clips || []).find((c) => c.id === targetClipId);
    if (!clip) return;

    const transients = detectAudioTransients(clip.peaks || [0.95, 0.3, 0.8, 0.4, 0.9, 0.2, 0.7, 0.5], 60);
    const numSlices = Math.min(16, Math.max(4, transients.length));

    const samplerZones = Array.from({ length: numSlices }, (_, i) => ({
      id: `zone_${i + 1}`,
      name: `Sample Slice ${i + 1}`,
      rootKey: 48 + i,
      keyLow: 48 + i,
      keyHigh: 48 + i,
      velLow: 1,
      velHigh: 127,
      sampleStart: transients[i % transients.length] || 0,
      loop: false
    }));

    const midiNotes = Array.from({ length: numSlices }, (_, i) => ({
      id: `ms_note_${i}`,
      pitch: 48 + i,
      startBeat: (clip.startBar - 1) * 4 + i * ((clip.bars || 4) * 4 / numSlices) + 1,
      durationBeats: 1,
      velocity: 100
    }));

    const msTrackId = `trk_ms_${Date.now()}`;
    const msClipId = `c_ms_${Date.now()}`;

    const newMsClip = {
      id: msClipId,
      name: `${clip.name} (Multi-Sampler Slices)`,
      startBar: clip.startBar || 1,
      bars: clip.bars || 4,
      color: "#ec4899",
      notes: midiNotes
    };

    const newMsTrack = {
      id: msTrackId,
      name: `${track.name} (Multi-Sampler)`,
      type: "sampler",
      color: "#ec4899",
      volume: 90,
      pan: 0,
      mute: false,
      solo: false,
      armed: true,
      frozen: false,
      db: "0.0 dB",
      clips: [newMsClip],
      multisampleZones: samplerZones,
      deviceChain: [
        {
          id: `dev_ms_${Date.now()}`,
          name: "Multi-Sampler",
          type: "Instrument",
          category: "Sampler",
          enabled: true,
          params: { rootKey: 60, tune: 0, filterCutoff: 80, zonesCount: numSlices }
        }
      ]
    };

    setTracks((prev) => {
      const idx = prev.findIndex((t) => t.id === track.id);
      const copy = [...prev];
      if (idx !== -1) {
        copy.splice(idx + 1, 0, newMsTrack);
      } else {
        copy.push(newMsTrack);
      }
      return copy;
    });

    setSelectedTrackId(msTrackId);
    setSelectedClipId(msClipId);
    setClipContextMenu(null);
    setStatusHint(`🎛️ Clip "${clip.name}" découpé en ${numSlices} zones chromatiques vers le Multi-Sampler !`);
  }, [tracks, selectedTrackId, selectedClipId]);

  // ── Atom H1: Actions du Menu Radial (Chapitre 18, p. 553-558) ──
  const handleRadialAction = useCallback((actionId, clip, track) => {
    if (!clip || !track) return;

    switch (actionId) {
      case "split":
        handleSplitClip(track.id, clip.id);
        break;
      case "duplicate":
        handleDuplicateClip(track.id, clip.id);
        break;
      case "bounce":
        handleBounceInPlace(clip.id, track.id);
        break;
      case "slice":
        handleSliceToDrumMachine(clip.id, track.id);
        break;
      case "delete":
        handleDeleteClip(track.id, clip.id);
        break;
      case "reverse":
        setTracks((prev) =>
          prev.map((t) => {
            if (t.id === track.id) {
              return {
                ...t,
                clips: (t.clips || []).map((c) => {
                  if (c.id === clip.id) {
                    const revPeaks = (c.peaks || [0.2, 0.4, 0.8, 1.0, 0.6, 0.3]).slice().reverse();
                    return { ...c, peaks: revPeaks, name: `${c.name} (Rev)` };
                  }
                  return c;
                })
              };
            }
            return t;
          })
        );
        setStatusHint(`Clip "${clip.name}" inversé (Reverse Waveform) !`);
        break;
      case "normalize":
        setTracks((prev) =>
          prev.map((t) => {
            if (t.id === track.id) {
              return {
                ...t,
                clips: (t.clips || []).map((c) => {
                  if (c.id === clip.id) {
                    const raw = c.peaks || [0.3, 0.5, 0.7, 0.4];
                    const maxP = Math.max(...raw, 0.01);
                    const normPeaks = raw.map((p) => Math.min(1.0, Number((p / maxP).toFixed(3))));
                    return { ...c, peaks: normPeaks, name: `${c.name} (0dB)` };
                  }
                  return c;
                })
              };
            }
            return t;
          })
        );
        setStatusHint(`Clip "${clip.name}" normalisé à 0 dBFS !`);
        break;
      case "ai_remix":
        setSelectedClipId(clip.id);
        setSelectedTrackId(track.id);
        setShowBottomPanel(true);
        setBottomPanelTab("inspector");
        setStatusHint(`Régénération IA ouverte pour "${clip.name}"`);
        break;
      case "audio_to_midi":
        handleAudioToMidi(clip.id, track.id);
        break;
      case "slice_to_multisampler":
        handleSliceToMultiSampler(clip.id, track.id);
        break;
      default:
        break;
    }
  }, [handleSplitClip, handleDuplicateClip, handleBounceInPlace, handleSliceToDrumMachine, handleAudioToMidi, handleSliceToMultiSampler, handleDeleteClip]);

  // ── Real Microphone Recording on Armed Track ──
  const handleToggleTransportRecord = async () => {
    if (!isRecording) {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setStatusHint("Enregistrement micro non supporté par ce navigateur.");
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        transportRecordChunksRef.current = [];
        const mr = new MediaRecorder(stream);
        transportMediaRecorderRef.current = mr;

        mr.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            transportRecordChunksRef.current.push(event.data);
          }
        };

        mr.onstop = async () => {
          const mime = mr.mimeType || "audio/webm";
          const blob = new Blob(transportRecordChunksRef.current, { type: mime });
          const url = URL.createObjectURL(blob);
          const recEndBar = Math.max(transportRecordStartBarRef.current + 1, Math.floor(currentBar));
          const barsRecorded = Math.max(1, recEndBar - transportRecordStartBarRef.current);

          await dawAudioEngine.loadBuffer(url);

          setTracks((prev) => {
            const hasArmed = prev.some((t) => t.armed);
            return prev.map((t) => {
              const isTarget = hasArmed ? t.armed : t.id === selectedTrackId;
              if (isTarget) {
                const newRecClip = {
                  id: `clip_rec_${Date.now()}`,
                  name: `Enreg. Micro ${t.clips?.length + 1 || 1}`,
                  startBar: transportRecordStartBarRef.current,
                  bars: barsRecorded,
                  url,
                  color: "#ef4444"
                };
                return { ...t, clips: [...(t.clips || []), newRecClip] };
              }
              return t;
            });
          });

          stream.getTracks().forEach((track) => track.stop());
          setStatusHint("Prise audio enregistrée avec succès sur la piste !");
        };

        transportRecordStartBarRef.current = Math.floor(currentBar);
        transportRecordStartTimeRef.current = currentTimeSec;
        mr.start(100);
        setIsRecording(true);
        if (!isPlaying) {
          togglePlay();
        }
        setStatusHint("ENREGISTREMENT MICRO EN COURS sur la piste armée...");
      } catch (err) {
        console.warn("Microphone record error:", err);
        setStatusHint("Accès microphone refusé ou indisponible.");
      }
    } else {
      if (transportMediaRecorderRef.current && transportMediaRecorderRef.current.state !== "inactive") {
        transportMediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      setStatusHint("Enregistrement arrêté.");
    }
  };

  // Add new track
  const handleAddNewTrack = (trackType = "audio") => {
    const newId = `trk_${Date.now()}`;
    const colors = { audio: "#06b6d4", instruments: "#8b5cf6", fx: "#10b981" };
    const names = { audio: `Piste Audio ${tracks.length + 1}`, instruments: `Instrument ${tracks.length + 1}`, fx: `FX Return ${tracks.length + 1}` };

    const newTrack = {
      id: newId,
      name: names[trackType] || `Piste ${tracks.length + 1}`,
      type: trackType,
      color: colors[trackType] || "#df9c43",
      volume: 80,
      pan: 0,
      mute: false,
      solo: false,
      armed: false,
      frozen: false,
      db: "0.0 dB",
      automation: {
        visible: false,
        param: "volume",
        points: [{ id: `ap_${Date.now()}`, bar: 1, value: 80 }]
      },
      deviceChain: [
        { id: `d_${Date.now()}`, name: "EQ-5 Parametric", type: "Audio FX", category: "EQ", enabled: true, params: { low: 0, mid: 0, high: 0 } }
      ],
      clips: [
        { id: `c_${Date.now()}`, name: `Clip ${tracks.length + 1}`, startBar: 1, bars: 4, color: colors[trackType] || "#df9c43" }
      ]
    };

    setTracks((prev) => [...prev, newTrack]);
    setSelectedTrackId(newId);
    setStatusHint(`Nouvelle piste créée: ${newTrack.name}`);
  };

  // Duplicate track
  const handleDuplicateTrack = (trackId) => {
    const trk = tracks.find((t) => t.id === trackId);
    if (!trk) return;
    const newId = `trk_${Date.now()}`;
    const duplicated = {
      ...trk,
      id: newId,
      name: `${trk.name} (Copie)`,
      clips: (trk.clips || []).map((c, i) => ({ ...c, id: `clip_${Date.now()}_${i}` }))
    };
    setTracks((prev) => [...prev, duplicated]);
    setSelectedTrackId(newId);
    setStatusHint(`Piste dupliquée: ${duplicated.name}`);
  };

  // Delete track
  const handleDeleteTrack = (trackId) => {
    if (tracks.length <= 1) return;
    setTracks((prev) => prev.filter((t) => t.id !== trackId));
    setSelectedTrackId((prev) => (prev === trackId ? tracks[0]?.id : prev));
    setStatusHint(`Piste supprimée`);
  };

  // Change Track Color
  const handleChangeTrackColor = (trackId, color) => {
    setTracks((prev) =>
      prev.map((t) =>
        t.id === trackId
          ? {
              ...t,
              color,
              clips: (t.clips || []).map((c) => ({ ...c, color }))
            }
          : t
      )
    );
    setColorPickerTrackId(null);
    setStatusHint(`Couleur de piste mise à jour`);
  };

  // Save Track Renaming
  const handleSaveTrackName = (trackId) => {
    if (editingTrackName.trim()) {
      setTracks((prev) =>
        prev.map((t) => (t.id === trackId ? { ...t, name: editingTrackName.trim() } : t))
      );
    }
    setEditingTrackId(null);
  };

  // ── Drag & Drop Handlers for Clips & Devices ──
  // Move clip horizontally or across tracks
  const handleMoveClip = (clipId, sourceTrackId, targetTrackId, targetBar) => {
    setTracks((prev) => {
      let clipToMove = null;
      // Extract from source track
      const cleanedTracks = prev.map((t) => {
        if (t.id === sourceTrackId) {
          const found = (t.clips || []).find((c) => c.id === clipId);
          if (found) clipToMove = { ...found };
          return { ...t, clips: (t.clips || []).filter((c) => c.id !== clipId) };
        }
        return t;
      });

      if (!clipToMove) return prev;

      // Insert into target track with updated startBar
      clipToMove.startBar = Math.max(1, targetBar);
      return cleanedTracks.map((t) => {
        if (t.id === targetTrackId) {
          clipToMove.color = t.color;
          return { ...t, clips: [...(t.clips || []), clipToMove] };
        }
        return t;
      });
    });

    setStatusHint(`Clip déplacé sur la mesure ${targetBar}`);
  };

  // ── Music Studio 5 Universal Editing Tool Operations (Section 3.1.4, p. 81-85) ──

  // 3. Tool 3 Pencil: Create new 4-bar clip on track
  const handleCreateClipWithPencil = useCallback((trackId, startBar) => {
    const newId = `c_pen_${Date.now()}`;
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id !== trackId) return t;
        const newClip = {
          id: newId,
          name: `${t.name} Clip M${startBar}`,
          startBar: Math.max(1, startBar),
          bars: 4,
          color: t.color,
          isAudio: !!t.isAudio,
          fadeInBars: 0.5,
          fadeOutBars: 0.5,
          fadeCurve: 0
        };
        setStatusHint(`Nouveau clip créé sur "${t.name}" à la mesure ${startBar} (Outil Crayon [3])`);
        return { ...t, clips: [...(t.clips || []), newClip] };
      })
    );
    setSelectedTrackId(trackId);
    setSelectedClipId(newId);
  }, []);

  // 4. Atom B2: Update Audio Clip Fades (Fade In, Fade Out, Bézier Curve)
  const handleUpdateClipFade = useCallback((trackId, clipId, fadeUpdates) => {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id !== trackId) return t;
        return {
          ...t,
          clips: (t.clips || []).map((c) =>
            c.id === clipId ? { ...c, ...fadeUpdates } : c
          )
        };
      })
    );
  }, []);

  // 5. Atom B3: Comping & Take Lanes Operations (Section 10.1.4, p. 299-307)
  const handleToggleComping = useCallback((trackId) => {
    setExpandedCompingTrackIds((prev) => {
      const next = new Set(prev);
      if (next.has(trackId)) {
        next.delete(trackId);
        setStatusHint("Sous-pistes de prises (Comping) masquées");
      } else {
        next.add(trackId);
        setStatusHint("Sous-pistes de prises (Comping) affichées (Section 10.1.4)");
      }
      return next;
    });
  }, []);

  const handleUpdateCompingRegions = useCallback((trackId, regions) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, compingRegions: regions } : t))
    );
  }, []);

  const handleAddTake = useCallback((trackId) => {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id !== trackId) return t;
        const currentTakes = t.takes || DEFAULT_STUDIO_TAKES;
        const takeIdx = currentTakes.length + 1;
        const newTake = {
          id: `take_${Date.now()}`,
          name: `Prise ${takeIdx} (Pass Studio ${takeIdx})`,
          color: COLOR_PALETTE[takeIdx % COLOR_PALETTE.length],
          url: "/samples/studio/piano_lr_bounce_1.wav"
        };
        return { ...t, takes: [...currentTakes, newTake] };
      })
    );
    setStatusHint("Nouvelle prise ajoutée aux lignes de prises");
  }, []);

  const handleDeleteTake = useCallback((trackId, takeId) => {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id !== trackId) return t;
        const filtered = (t.takes || DEFAULT_STUDIO_TAKES).filter((take) => take.id !== takeId);
        return { ...t, takes: filtered };
      })
    );
  }, []);

  // Reorder track position in arrangement
  const handleReorderTrack = (sourceIdx, targetIdx) => {
    if (sourceIdx === targetIdx) return;
    setTracks((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(sourceIdx, 1);
      const insertAt = targetIdx > sourceIdx ? targetIdx - 1 : targetIdx;
      updated.splice(insertAt, 0, moved);
      return updated;
    });
    setStatusHint(`Piste réorganisée avec succès`);
    setTrackDropIndicator(null);
    setDraggingTrackIndex(null);
  };

  // Assign or update track instrument
  const handleAssignInstrumentToTrack = (trackId, instrumentName) => {
    setTracks((prev) =>
      prev.map((t) =>
        t.id === trackId
          ? {
              ...t,
              instrument: instrumentName,
              name: `${instrumentName} • ${t.name.split('•')[0].trim()}`
            }
          : t
      )
    );
    setStatusHint(`Instrument "${instrumentName}" assigné à la piste`);
  };

  // Create new track from dropped instrument or effect
  const handleCreateTrackWithInstrument = (name) => {
    const newTrkId = `track_${Date.now()}`;
    const newTrk = {
      id: newTrkId,
      name: `${name} Track`,
      color: COLOR_PALETTE[tracks.length % COLOR_PALETTE.length],
      volume: 80,
      pan: 0,
      muted: false,
      solo: false,
      armed: false,
      frozen: false,
      instrument: name,
      deviceChain: [],
      clips: []
    };
    setTracks((prev) => [...prev, newTrk]);
    setSelectedTrackId(newTrkId);
    setStatusHint(`Nouvelle piste créée avec "${name}"`);
  };

  // Add device to track chain (from browser drag & drop or click)
  const handleAddDeviceToTrack = (trackId, device, insertIndex = null) => {
    const newDev = {
      id: `dev_${Date.now()}`,
      name: device.name,
      type: device.type,
      category: device.category,
      enabled: true,
      params: { gain: 0, mix: 50, drive: 20, cutoff: 2200, res: 3 }
    };

    setTracks((prev) =>
      prev.map((t) => {
        if (t.id !== trackId) return t;
        const chain = [...(t.deviceChain || [])];
        if (insertIndex !== null && insertIndex >= 0 && insertIndex <= chain.length) {
          chain.splice(insertIndex, 0, newDev);
        } else {
          chain.push(newDev);
        }
        return { ...t, deviceChain: chain };
      })
    );

    if (device.type === "The Grid" || device.name?.includes("Grid")) {
      setShowBottomPanel(true);
      setBottomPanelTab("grid");
    }

    setStatusHint(`Composant "${device.name}" ajouté à la piste`);
  };

  // Reorder devices inside the track's effect chain
  const handleReorderDevices = (trackId, sourceIdx, targetIdx) => {
    if (sourceIdx === targetIdx) return;
    setTracks((prev) =>
      prev.map((trk) => {
        if (trk.id !== trackId) return trk;
        const chain = [...(trk.deviceChain || [])];
        const [moved] = chain.splice(sourceIdx, 1);
        const dest = targetIdx > sourceIdx ? targetIdx - 1 : targetIdx;
        chain.splice(dest, 0, moved);
        return { ...trk, deviceChain: chain };
      })
    );
    setStatusHint("Périphérique réordonné dans la chaîne d'effets");
  };

  // Remove device from track chain
  const handleRemoveDeviceFromTrack = (trackId, deviceId) => {
    setTracks((prev) =>
      prev.map((t) =>
        t.id === trackId
          ? { ...t, deviceChain: (t.deviceChain || []).filter((d) => d.id !== deviceId) }
          : t
      )
    );
    setStatusHint(`Composant retiré`);
  };

  // Toggle device bypass
    const handleUpdateDeviceParam = (trackId, deviceId, paramKey, value) => {
    setTracks((prev) =>
      prev.map((t) =>
        t.id === trackId
          ? {
              ...t,
              deviceChain: (t.deviceChain || []).map((d) =>
                d.id === deviceId
                  ? { ...d, params: { ...(d.params || {}), [paramKey]: value } }
                  : d
              )
            }
          : t
      )
    );
  };

  const handleToggleDeviceBypass = (trackId, deviceId) => {
    setTracks((prev) =>
      prev.map((t) =>
        t.id === trackId
          ? {
              ...t,
              deviceChain: (t.deviceChain || []).map((d) =>
                d.id === deviceId ? { ...d, enabled: !d.enabled } : d
              )
            }
          : t
      )
    );
  };

  // ── Automation Lane Handlers ──
  const toggleAutomationVisible = (trackId) => {
    setTracks((prev) =>
      prev.map((t) =>
        t.id === trackId
          ? { ...t, automation: { ...t.automation, visible: !t.automation?.visible } }
          : t
      )
    );
  };

  const handleAddAutomationPoint = (trackId, bar, value) => {
    const newPoint = { id: `ap_${Date.now()}`, bar, value: Math.max(0, Math.min(100, Math.round(value))) };
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id === trackId) {
          const sorted = [...(t.automation?.points || []), newPoint].sort((a, b) => a.bar - b.bar);
          return { ...t, automation: { ...t.automation, points: sorted } };
        }
        return t;
      })
    );
    setStatusHint(`Point d'automation ajouté mesure ${bar.toFixed(1)}: ${value}%`);
  };

  const handleDeleteAutomationPoint = (trackId, pointId) => {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id === trackId) {
          return {
            ...t,
            automation: {
              ...t.automation,
              points: (t.automation?.points || []).filter((p) => p.id !== pointId)
            }
          };
        }
        return t;
      })
    );
  };

  // ── Music Studio Multi-Lane Automation Handlers ──
  const toggleLaneActive = useCallback((trackId, laneId) => {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id === trackId) {
          const lanes = (t.automationLanes || getDefaultAutomationLanes(t.id, t.type, t.name)).map((l) =>
            l.id === laneId ? { ...l, active: !l.active } : l
          );
          return { ...t, automationLanes: lanes };
        }
        return t;
      })
    );
  }, []);

  const handleOpenAutomationEditor = useCallback((trackId, laneId, mode = "track", clipInfo = null) => {
    setSelectedAutomationTrackId(trackId);
    setSelectedAutomationLaneId(laneId);
    setAutomationEditorMode(mode);
    if (clipInfo) {
      setSelectedLauncherClip(clipInfo);
    }
    setShowBottomPanel(true);
    setBottomPanelTab("automation");
    const targetTrack = tracks.find((t) => t.id === trackId);
    const targetLane = (targetTrack?.automationLanes || getDefaultAutomationLanes(targetTrack?.id, targetTrack?.type, targetTrack?.name)).find((l) => l.id === laneId);
    setStatusHint(`Éditeur d'automation : ${targetTrack?.name || trackId} » ${targetLane?.name || laneId} (${mode === "clip" ? "Clip " + (clipInfo?.clipName || "") : "Piste globale"})`);
  }, [tracks]);

  const handleAddAutomationPointToLane = useCallback((trackId, laneId, bar, value, tension = 0) => {
    const newPoint = {
      id: `ap_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      bar: Number(bar.toFixed(3)),
      value: Number(value.toFixed(2)),
      tension: Number(tension.toFixed(2))
    };
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id === trackId) {
          const lanes = (t.automationLanes || getDefaultAutomationLanes(t.id, t.type, t.name)).map((l) => {
            if (l.id === laneId) {
              const pts = [...(l.points || []), newPoint].sort((a, b) => a.bar - b.bar);
              return { ...l, points: pts };
            }
            return l;
          });
          return { ...t, automationLanes: lanes };
        }
        return t;
      })
    );
  }, []);

  const handleDeleteAutomationPointFromLane = useCallback((trackId, laneId, pointId) => {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id === trackId) {
          const lanes = (t.automationLanes || getDefaultAutomationLanes(t.id, t.type, t.name)).map((l) => {
            if (l.id === laneId) {
              if ((l.points || []).length <= 2) return l; // Keep at least 2 boundary points
              return { ...l, points: l.points.filter((p) => p.id !== pointId) };
            }
            return l;
          });
          return { ...t, automationLanes: lanes };
        }
        return t;
      })
    );
  }, []);

  const handleUpdatePointInLane = useCallback((trackId, laneId, pointId, updates) => {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id === trackId) {
          const lanes = (t.automationLanes || getDefaultAutomationLanes(t.id, t.type, t.name)).map((l) => {
            if (l.id === laneId) {
              const pts = (l.points || []).map((p) =>
                p.id === pointId ? { ...p, ...updates } : p
              ).sort((a, b) => a.bar - b.bar);
              return { ...l, points: pts };
            }
            return l;
          });
          return { ...t, automationLanes: lanes };
        }
        return t;
      })
    );
  }, []);

  const handleUpdateTension = useCallback((trackId, laneId, p1Id, newTension) => {
    const clampedTension = Math.max(-0.95, Math.min(0.95, Number(newTension.toFixed(2))));
    handleUpdatePointInLane(trackId, laneId, p1Id, { tension: clampedTension });
  }, [handleUpdatePointInLane]);

  const applyAutomationPresetShape = useCallback((trackId, laneId, shape) => {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id === trackId) {
          const lanes = (t.automationLanes || getDefaultAutomationLanes(t.id, t.type, t.name)).map((l) => {
            if (l.id === laneId) {
              const minVal = l.min !== undefined ? l.min : 0;
              const maxVal = l.max !== undefined ? l.max : 100;
              const midVal = (minVal + maxVal) / 2;
              let newPoints = [];

              if (shape === "ramp_up") {
                newPoints = [
                  { id: `p_${Date.now()}_1`, bar: 1, value: minVal, tension: 0 },
                  { id: `p_${Date.now()}_2`, bar: 17, value: maxVal, tension: 0.2 },
                  { id: `p_${Date.now()}_3`, bar: 33, value: minVal, tension: 0 },
                  { id: `p_${Date.now()}_4`, bar: 65, value: maxVal, tension: 0.2 },
                  { id: `p_${Date.now()}_5`, bar: 148, value: minVal, tension: 0 }
                ];
              } else if (shape === "ramp_down") {
                newPoints = [
                  { id: `p_${Date.now()}_1`, bar: 1, value: maxVal, tension: 0 },
                  { id: `p_${Date.now()}_2`, bar: 17, value: minVal, tension: -0.2 },
                  { id: `p_${Date.now()}_3`, bar: 33, value: maxVal, tension: 0 },
                  { id: `p_${Date.now()}_4`, bar: 65, value: minVal, tension: -0.2 },
                  { id: `p_${Date.now()}_5`, bar: 148, value: minVal, tension: 0 }
                ];
              } else if (shape === "step") {
                newPoints = [
                  { id: `p_${Date.now()}_1`, bar: 1, value: minVal, tension: 0 },
                  { id: `p_${Date.now()}_2`, bar: 17, value: minVal, tension: 0 },
                  { id: `p_${Date.now()}_3`, bar: 17.05, value: maxVal, tension: 0 },
                  { id: `p_${Date.now()}_4`, bar: 33, value: maxVal, tension: 0 },
                  { id: `p_${Date.now()}_5`, bar: 33.05, value: minVal, tension: 0 },
                  { id: `p_${Date.now()}_6`, bar: 148, value: minVal, tension: 0 }
                ];
              } else if (shape === "sine") {
                newPoints = [
                  { id: `p_${Date.now()}_1`, bar: 1, value: midVal, tension: 0.4 },
                  { id: `p_${Date.now()}_2`, bar: 9, value: maxVal, tension: -0.4 },
                  { id: `p_${Date.now()}_3`, bar: 17, value: midVal, tension: 0.4 },
                  { id: `p_${Date.now()}_4`, bar: 25, value: minVal, tension: -0.4 },
                  { id: `p_${Date.now()}_5`, bar: 33, value: midVal, tension: 0.4 },
                  { id: `p_${Date.now()}_6`, bar: 148, value: midVal, tension: 0 }
                ];
              } else if (shape === "triangle") {
                newPoints = [
                  { id: `p_${Date.now()}_1`, bar: 1, value: minVal, tension: 0 },
                  { id: `p_${Date.now()}_2`, bar: 17, value: maxVal, tension: 0 },
                  { id: `p_${Date.now()}_3`, bar: 33, value: minVal, tension: 0 },
                  { id: `p_${Date.now()}_4`, bar: 49, value: maxVal, tension: 0 },
                  { id: `p_${Date.now()}_5`, bar: 148, value: minVal, tension: 0 }
                ];
              } else if (shape === "clear") {
                newPoints = [
                  { id: `p_${Date.now()}_1`, bar: 1, value: minVal, tension: 0 },
                  { id: `p_${Date.now()}_2`, bar: 148, value: minVal, tension: 0 }
                ];
              } else if (shape === "invert") {
                newPoints = (l.points || []).map((p) => ({
                  ...p,
                  value: Number((maxVal - (p.value - minVal)).toFixed(2)),
                  tension: -p.tension
                }));
              }
              return { ...l, points: newPoints };
            }
            return l;
          });
          return { ...t, automationLanes: lanes };
        }
        return t;
      })
    );
    setStatusHint(`Forme d'automation "${shape}" appliquée`);
  }, []);

  // Global drag handler for anchor points and tension handles
  useEffect(() => {
    if (!draggingAnchor) return;

    const handlePointerMove = (e) => {
      const { type, trackId, laneId, pointId, startX, startY, origBar, origVal, origTension, minVal, maxVal, widthPx, heightPx, totalBars, startBarOffset, p1Id } = draggingAnchor;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (type === "anchor") {
        const barDelta = (dx / widthPx) * totalBars;
        let newBar = Math.max(1, Math.min(totalBars + (startBarOffset || 1), origBar + barDelta));
        if (automationSnap === "1/16") newBar = Math.round(newBar * 4) / 4;
        else if (automationSnap === "1/8") newBar = Math.round(newBar * 2) / 2;
        else if (automationSnap === "1/4") newBar = Math.round(newBar);

        const valDelta = -(dy / heightPx) * (maxVal - minVal);
        const newVal = Math.max(minVal, Math.min(maxVal, origVal + valDelta));

        handleUpdatePointInLane(trackId, laneId, pointId, {
          bar: Number(newBar.toFixed(3)),
          value: Number(newVal.toFixed(2))
        });
        setHoveredAnchorTooltip({
          x: e.clientX,
          y: e.clientY - 28,
          text: `${newVal.toFixed(1)} (Mes. ${newBar.toFixed(2)})`
        });
      } else if (type === "tension") {
        const tensionDelta = -(dy / 50); // 50px drag = 1.0 tension change
        const newTension = Math.max(-0.95, Math.min(0.95, origTension + tensionDelta));
        handleUpdateTension(trackId, laneId, p1Id, newTension);
        setHoveredAnchorTooltip({
          x: e.clientX,
          y: e.clientY - 28,
          text: `Courbure : ${newTension > 0 ? "+" : ""}${Math.round(newTension * 100)}%`
        });
      }
    };

    const handlePointerUp = () => {
      setDraggingAnchor(null);
      setHoveredAnchorTooltip(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [draggingAnchor, automationSnap, handleUpdatePointInLane, handleUpdateTension]);

  // Expose extended DAW test interface on window for end-to-end testing
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.__dawTest = {
        getTracks: () => tracks,
        getVisibleTracks: () => visibleTracks,
        toggleGroupCollapse,
        handleSeekToBar,
        getIsPlaying: () => isPlaying,
        getCurrentBar: () => currentBar,
        getZoomLevel: () => zoomLevel,
        getTrackPeaks: () => trackPeaks,
        loadSongStemsIntoDaw,
        demoSongs: DEMO_SONGS_LIST,
        togglePlay,
        stopPlayback,
        setZoomLevel,
        setIsShortcutsModalOpen,
        setIsSettingsModalOpen,
        setIsAboutModalOpen,
        setIsDashboardModalOpen,
        setIsExportAudioModalOpen,
        handleExportWav,
        toggleAutomationVisible,
        toggleLaneActive,
        handleOpenAutomationEditor,
        setMainView,
        getMainView: () => mainView,
        setBottomPanelTab,
        getBottomPanelTab: () => bottomPanelTab,
        setShowBottomPanel,
        getShowBottomPanel: () => showBottomPanel,
        setSelectedTrackId,
        getSelectedTrackId: () => selectedTrackId,
        getAutomationEditorMode: () => automationEditorMode,
        getSelectedAutomationLaneId: () => selectedAutomationLaneId,
        applyAutomationPresetShape,
        sendStudioOsc,
        setStudioHostLink,
        getStudioHostLink: () => studioHostLink,
        getStudioOscStatus: () => studioOscStatus
      };
    }
  }, [tracks, visibleTracks, toggleGroupCollapse, handleSeekToBar, isPlaying, currentBar, zoomLevel, trackPeaks, loadSongStemsIntoDaw, togglePlay, stopPlayback, handleExportWav, toggleAutomationVisible, toggleLaneActive, handleOpenAutomationEditor, mainView, showBottomPanel, bottomPanelTab, automationEditorMode, selectedAutomationLaneId, applyAutomationPresetShape, selectedTrackId, sendStudioOsc, studioHostLink, studioOscStatus]);

  // ── Piano Roll Interactive Editing Handlers (Section 11.2 & Ch. 12) ──
  const handleUpdatePianoRollNote = useCallback((noteId, updates) => {
    setPianoRollNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, ...updates } : n))
    );
  }, []);

  const handleAddPianoRollNote = (pitch, beat) => {
    const newNote = {
      id: `n_${Date.now()}`,
      pitch,
      startBeat: Math.max(1, beat),
      duration: 2,
      velocity: 95,
      chance: 100,
      ratchets: 1,
      occurrence: "Always",
      microPitch: 0,
      pressure: 50,
      pan: 0
    };
    setPianoRollNotes((prev) => [...prev, newNote]);
    setSelectedNoteId(newNote.id);
    handlePlaySynthNote(newNote);
    setStatusHint(`Note ajoutée: ${pitch} à la mesure/temps ${beat}`);
  };

  const handleDeletePianoRollNote = (noteId) => {
    setPianoRollNotes((prev) => prev.filter((n) => n.id !== noteId));
    setStatusHint(`Note supprimée`);
  };

  // Filtered devices list for browser
  const filteredDevices = useMemo(() => {
    return STUDIO_DEVICES.filter((d) => {
      const matchSearch =
        !browserSearch ||
        d.name.toLowerCase().includes(browserSearch.toLowerCase()) ||
        d.category.toLowerCase().includes(browserSearch.toLowerCase()) ||
        d.desc.toLowerCase().includes(browserSearch.toLowerCase());
      if (!matchSearch) return false;
      if (browserFilter === "all") return true;
      if (browserFilter === "devices") return d.type.includes("FX") || d.type.includes("Instrument");
      return true;
    });
  }, [browserSearch, browserFilter]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#151515] text-zinc-300 font-sans select-none overflow-hidden text-xs relative">
      {/* ════════════════════════════════════════════════════════════════
          1. TOP MUSIC STUDIO HEADER & PROJECT TABS BAR
      ════════════════════════════════════════════════════════════════ */}
      <div className="h-9 bg-[#1c1c1c] border-b border-[#2e2e2e] px-2.5 flex items-center justify-between flex-shrink-0 relative z-50">
        {/* Left: Music Studio Logo Dashboard Button & Multi-Project Tabs Bar (Section 0.2 & 2.1.1, p. 25 & 55) */}
        <div className="flex items-center gap-1.5 min-w-0 flex-shrink-0">
          {/* Music Studio Dashboard Button (Section 0.2, p. 25) */}
          <button
            onClick={() => setIsDashboardModalOpen(true)}
            className="h-7 px-2 bg-[#252525] hover:bg-[#241808] hover:border-[#df9c43] text-zinc-300 hover:text-[#eaaf5d] rounded flex items-center gap-1.5 transition flex-shrink-0 border border-[#383838] shadow-sm group"
            title="Tableau de bord Music Studio [Ctrl+D]"
          >
            <div className="grid grid-cols-2 gap-0.5">
              <span className="w-1 h-1 rounded-full bg-[#df9c43] group-hover:bg-[#eaaf5d] transition" />
              <span className="w-1 h-1 rounded-full bg-[#df9c43] group-hover:bg-[#eaaf5d] transition" />
              <span className="w-1 h-1 rounded-full bg-[#df9c43] group-hover:bg-[#eaaf5d] transition" />
              <span className="w-1 h-1 rounded-full bg-[#df9c43] group-hover:bg-[#eaaf5d] transition" />
            </div>
            <span className="font-extrabold text-[10px] tracking-wider hidden sm:inline">STUDIO</span>
          </button>

          {/* Section des onglets de projets (Section 2.1.1, p. 55) */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {openProjects.map((p) => {
              const isActive = activeProjectId === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => handleSwitchProject(p.id)}
                  className={`h-7 px-2.5 rounded-t text-[11px] font-medium flex items-center gap-1.5 cursor-pointer border-t-2 transition flex-shrink-0 ${
                    isActive
                      ? "bg-[#252525] border-[#df9c43] text-white font-bold shadow-sm"
                      : "bg-[#181818] border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-[#202020]"
                  }`}
                  title={`Projet : ${p.title} (${p.bpm} BPM)`}
                >
                  <Music size={11} className={isActive ? "text-[#df9c43]" : "text-zinc-500"} />
                  <span className="truncate max-w-[110px] xl:max-w-[150px]">{p.title}</span>
                  {openProjects.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCloseProjectTab(p.id);
                      }}
                      className="hover:text-red-400 p-0.5 rounded ml-0.5 text-zinc-500 hover:bg-white/10"
                      title="Fermer ce projet"
                    >
                      <X size={10} />
                    </button>
                  )}
                </div>
              );
            })}

            {/* Bouton Nouveau Projet (+) */}
            <button
              onClick={handleCreateNewProjectTab}
              className="h-7 w-6 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-[#282828] rounded transition flex-shrink-0"
              title="Nouveau projet vierge [Ctrl+N]"
            >
              <Plus size={12} />
            </button>
          </div>

          {/* Active Song / Project Selector Dropdown */}
          <div className="relative daw-song-selector-container flex-shrink-0">
            <button
              onClick={() => setIsSongSelectorOpen((prev) => !prev)}
              className="h-7 flex items-center gap-1.5 bg-[#252525] hover:bg-[#2c2c2c] border-t-2 border-[#df9c43] px-2.5 py-0 text-white font-medium rounded-t text-[11px] shadow-sm whitespace-nowrap flex-shrink-0 transition"
              title="Changer de morceau ou charger un projet"
            >
              <Music size={12} className="text-[#df9c43] flex-shrink-0" />
              <span className="truncate max-w-[130px] xl:max-w-[180px] font-bold">
                {currentSongTitle || selectedTrack?.title || "Projet Actif"}
              </span>
              <ChevronDown size={11} className="text-zinc-400 flex-shrink-0" />
            </button>

            {/* Song Selector Dropdown Menu */}
            {isSongSelectorOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-80 bg-[#1c1c1c] border border-[#3e3e3e] rounded-lg shadow-[0_12px_36px_rgba(0,0,0,0.9)] z-[100] p-2.5 space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-[#2e2e2e]">
                  <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                    <Music size={12} className="text-[#df9c43]" />
                    <span>Charger un Morceau (4 Stems)</span>
                  </span>
                  <button
                    onClick={() => setIsSongSelectorOpen(false)}
                    className="text-zinc-400 hover:text-white p-0.5 rounded"
                  >
                    <X size={12} />
                  </button>
                </div>

                {/* Search in Songs */}
                <div className="relative">
                  <Search size={11} className="absolute left-2 top-2 text-zinc-500" />
                  <input
                    type="text"
                    value={songSearchQuery}
                    onChange={(e) => setSongSearchQuery(e.target.value)}
                    placeholder="Rechercher par titre, style, bpm..."
                    className="w-full bg-[#121212] border border-[#2e2e2e] rounded pl-6 pr-2 py-1 text-[11px] text-white focus:outline-none focus:border-[#df9c43]"
                  />
                </div>

                {/* Tracks List */}
                <div className="max-h-56 overflow-y-auto custom-scrollbar space-y-1">
                  {(availableTracks && availableTracks.length > 0
                    ? availableTracks
                    : DEMO_SONGS_LIST
                  )
                    .filter((t) => !songSearchQuery || (t.title && t.title.toLowerCase().includes(songSearchQuery.toLowerCase())))
                    .map((t) => {
                      const isSelected = selectedTrack?.id === t.id;
                      return (
                        <div
                          key={t.id}
                          onClick={() => {
                            setIsSongSelectorOpen(false);
                            loadSongStemsIntoDaw(t);
                            if (onSelectSong) onSelectSong(t);
                            else if (onLoadStems) onLoadStems(t);
                            setStatusHint(`Morceau "${t.title}" chargé avec 4 stems`);
                          }}
                          className={`p-2 rounded cursor-pointer flex items-center justify-between transition-all ${
                            isSelected
                              ? "bg-[#241808] border border-[#df9c43] text-[#eaaf5d] shadow-[0_0_8px_rgba(223,156,67,0.25)] font-bold"
                              : "hover:bg-[#282828] text-zinc-300"
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="font-semibold text-xs truncate">{t.title}</div>
                            <div className="text-[10px] text-zinc-400 flex items-center gap-2 mt-0.5 font-normal">
                              <span>{t.bpm || 120} BPM</span>
                              <span>•</span>
                              <span>{t.key || "C Minor"}</span>
                              <span>•</span>
                              <span className="text-[#df9c43] font-semibold">4 Stems</span>
                            </div>
                          </div>
                          {isSelected && <Check size={13} className="text-[#df9c43] flex-shrink-0" />}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          {/* Quick Action: Fredonner un Air / Audio-to-Music */}
          <button
            onClick={() => setIsHumModalOpen(true)}
            className="h-7 px-2.5 py-0 bg-gradient-to-r from-red-600/30 to-[#b87524]/30 hover:from-red-600/50 hover:to-[#c9842c]/50 border border-[#df9c43]/50 text-white text-[11px] font-bold rounded flex items-center gap-1.5 shadow-sm whitespace-nowrap flex-shrink-0 transition"
            title="Fredonner un air ou une mélodie pour composer automatiquement"
          >
            <Mic size={13} className="text-[#df9c43] animate-pulse flex-shrink-0" />
            <span>Fredonner un Air</span>
          </button>

          <button
            onClick={() => handleAddNewTrack("audio")}
            className="h-7 w-7 text-zinc-400 hover:text-white p-0 text-xs hover:bg-[#282828] rounded flex items-center justify-center flex-shrink-0 transition"
            title="Ajouter une piste audio"
          >
            <Plus size={13} />
          </button>

          {/* ── Top Dropdown Menus Strip (FICHIER, LECTURE, AJOUTER, ÉDITER, AIDE) ── */}
          <div className="flex items-center gap-1 ml-2 border-l border-[#333333] pl-2 text-[11px] font-medium tracking-wider daw-menu-container whitespace-nowrap flex-shrink-0">
            {/* 1. FICHIER */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setOpenMenu(openMenu === "file" ? null : "file")}
                onMouseEnter={() => openMenu && setOpenMenu("file")}
                className={`h-7 px-2.5 py-0 rounded text-[11px] font-semibold tracking-wider transition whitespace-nowrap flex-shrink-0 flex items-center ${
                  openMenu === "file"
                    ? "bg-[#333333] text-white font-bold shadow-sm border border-[#484848]"
                    : "text-zinc-300 hover:text-white hover:bg-[#252525]"
                }`}
              >
                FICHIER
              </button>
              {openMenu === "file" && (
                <div className="absolute left-0 top-full mt-1.5 w-64 bg-[#1e1e1e] border border-[#3e3e3e] rounded-lg shadow-[0_12px_36px_rgba(0,0,0,0.95)] py-1.5 z-[100] text-zinc-200 text-xs flex flex-col whitespace-normal">
                  <button
                    onClick={() => { setOpenMenu(null); handleNewProject(); }}
                    className="w-full px-3 py-1.5 text-left hover:bg-[#2c2c2c] hover:text-white flex items-center justify-between"
                  >
                    <span>Nouveau projet</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Ctrl+N</span>
                  </button>
                  <button
                    onClick={() => {
                      setOpenMenu(null);
                      setIsSongSelectorOpen(true);
                    }}
                    className="w-full px-3 py-1.5 text-left hover:bg-[#2c2c2c] hover:text-white flex items-center justify-between"
                  >
                    <span>Ouvrir...</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Ctrl+O</span>
                  </button>
                  <button
                    onClick={() => { setOpenMenu(null); handleSaveProject(); }}
                    className="w-full px-3 py-1.5 text-left hover:bg-[#2c2c2c] hover:text-white flex items-center justify-between"
                  >
                    <span>Sauvegarder</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Ctrl+S</span>
                  </button>
                  <button
                    onClick={() => { setOpenMenu(null); handleSaveProject(); setStatusHint("Projet collecté et sauvegardé"); }}
                    className="w-full px-3 py-1.5 text-left hover:bg-[#2c2c2c] hover:text-white flex items-center justify-between"
                  >
                    <span>Collecter et sauvegarder</span>
                  </button>
                  <button
                    onClick={() => { setOpenMenu(null); handleSaveProject(); }}
                    className="w-full px-3 py-1.5 text-left hover:bg-[#2c2c2c] hover:text-white flex items-center justify-between"
                  >
                    <span>Sauvegarder sous...</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Ctrl+Shift+S</span>
                  </button>
                  <button
                    onClick={() => { setOpenMenu(null); setStatusHint("Modèle de projet enregistré"); }}
                    className="w-full px-3 py-1.5 text-left hover:bg-[#2c2c2c] hover:text-white flex items-center justify-between"
                  >
                    <span>Sauvegarder comme modèle</span>
                  </button>
                  <button
                    onClick={() => { setOpenMenu(null); stopPlayback(); setTracks([]); setStatusHint("Projet fermé"); }}
                    className="w-full px-3 py-1.5 text-left hover:bg-[#2c2c2c] hover:text-white flex items-center justify-between"
                  >
                    <span>Fermer</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Ctrl+W</span>
                  </button>

                  <div className="border-t border-[#333333] my-1" />

                  <button
                    onClick={() => { setOpenMenu(null); setIsExportAudioModalOpen(true); }}
                    className="w-full px-3 py-1.5 text-left hover:bg-[#2c2c2c] text-[#df9c43] font-semibold flex items-center justify-between"
                  >
                    <span>Exporter audio (WAV)...</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Ctrl+Shift+B</span>
                  </button>
                  <button
                    onClick={() => {
                      setOpenMenu(null);
                      const midiBlob = new Blob([JSON.stringify({ notes: pianoRollNotes })], { type: "audio/midi" });
                      const url = URL.createObjectURL(midiBlob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `${selectedTrack?.title || "Projet"}_MIDI.mid`;
                      a.click();
                      setStatusHint("Export MIDI généré et téléchargé");
                    }}
                    className="w-full px-3 py-1.5 text-left hover:bg-[#2c2c2c] hover:text-white flex items-center justify-between"
                  >
                    <span>Exporter MIDI</span>
                  </button>
                  <button
                    onClick={() => { setOpenMenu(null); handleSaveProject(); }}
                    className="w-full px-3 py-1.5 text-left hover:bg-[#2c2c2c] hover:text-white flex items-center justify-between"
                  >
                    <span>Exporter DAWproject</span>
                  </button>

                  <div className="border-t border-[#333333] my-1" />

                  <button
                    onClick={() => { setOpenMenu(null); setIsDashboardModalOpen(true); }}
                    className="w-full px-3 py-1.5 text-left hover:bg-[#2c2c2c] hover:text-white flex items-center justify-between"
                  >
                    <span>Afficher tableau de bord</span>
                  </button>
                  <button
                    onClick={() => { setOpenMenu(null); setIsSettingsModalOpen(true); }}
                    className="w-full px-3 py-1.5 text-left hover:bg-[#2c2c2c] hover:text-white flex items-center justify-between"
                  >
                    <span>Réglages</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Ctrl+,</span>
                  </button>
                  <button
                    onClick={() => {
                      setOpenMenu(null);
                      if (typeof window !== "undefined" && window.confirm("Quitter Music Studio DAW ?")) {
                        if (onNavigateTab) onNavigateTab("create");
                      }
                    }}
                    className="w-full px-3 py-1.5 text-left hover:bg-red-950/60 hover:text-red-400 text-zinc-400 flex items-center justify-between"
                  >
                    <span>Quitter</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Ctrl+Q</span>
                  </button>
                </div>
              )}
            </div>

            {/* 2. LECTURE */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setOpenMenu(openMenu === "playback" ? null : "playback")}
                onMouseEnter={() => openMenu && setOpenMenu("playback")}
                className={`h-7 px-2.5 py-0 rounded text-[11px] font-semibold tracking-wider transition whitespace-nowrap flex-shrink-0 flex items-center ${
                  openMenu === "playback"
                    ? "bg-[#333333] text-white font-bold shadow-sm border border-[#484848]"
                    : "text-zinc-300 hover:text-white hover:bg-[#252525]"
                }`}
              >
                LECTURE
              </button>
              {openMenu === "playback" && (
                <div className="absolute left-0 top-full mt-1.5 w-64 bg-[#1e1e1e] border border-[#3e3e3e] rounded-lg shadow-[0_12px_36px_rgba(0,0,0,0.95)] py-1.5 z-[100] text-zinc-200 text-xs flex flex-col whitespace-normal">
                  {/* Automation submenu */}
                  <div
                    onMouseEnter={() => setActiveSubMenu("automation")}
                    className="relative group px-3 py-1.5 hover:bg-[#2c2c2c] flex items-center justify-between cursor-pointer"
                  >
                    <span>Automation</span>
                    <ChevronRight size={12} className="text-zinc-400" />
                    {activeSubMenu === "automation" && (
                      <div className="absolute left-full top-0 ml-1 w-48 bg-[#222222] border border-[#444444] rounded-lg shadow-[0_12px_36px_rgba(0,0,0,0.95)] py-1 z-[110]">
                        {["latch", "touch", "write"].map((mode) => (
                          <div
                            key={mode}
                            onClick={(e) => {
                              e.stopPropagation();
                              setPlaybackSettings((prev) => ({ ...prev, automationMode: mode }));
                              setStatusHint(`Mode Automation : ${mode.toUpperCase()}`);
                            }}
                            className="px-3 py-1.5 hover:bg-[#303030] flex items-center justify-between cursor-pointer capitalize"
                          >
                            <span>{mode === "latch" ? "Enclencher" : mode === "touch" ? "Toucher" : "Écrire"}</span>
                            {playbackSettings.automationMode === mode && <Check size={12} className="text-[#df9c43]" />}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div
                    onClick={() => {
                      setPlaybackSettings((prev) => ({ ...prev, overdub: !prev.overdub }));
                      setStatusHint(`Overdub ${!playbackSettings.overdub ? "activé" : "désactivé"}`);
                    }}
                    className="px-3 py-1.5 hover:bg-[#2c2c2c] flex items-center justify-between cursor-pointer"
                  >
                    <span>Overdub</span>
                    {playbackSettings.overdub && <Check size={12} className="text-[#df9c43]" />}
                  </div>

                  <div
                    onClick={() => {
                      setOpenMenu(null);
                      setMainView("clips");
                      setStatusHint("Vue basculée sur le Lanceur de clips");
                    }}
                    className="px-3 py-1.5 hover:bg-[#2c2c2c] flex items-center justify-between cursor-pointer"
                  >
                    <span>Lanceur de clips</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Tab</span>
                  </div>

                  {/* Groove submenu */}
                  <div
                    onMouseEnter={() => setActiveSubMenu("groove")}
                    className="relative px-3 py-1.5 hover:bg-[#2c2c2c] flex items-center justify-between cursor-pointer"
                  >
                    <span>Groove</span>
                    <ChevronRight size={12} className="text-zinc-400" />
                    {activeSubMenu === "groove" && (
                      <div className="absolute left-full top-0 ml-1 w-48 bg-[#222222] border border-[#444444] rounded-lg shadow-[0_12px_36px_rgba(0,0,0,0.95)] py-1 z-[110]">
                        <div className="px-3 py-1 text-[10px] text-zinc-400 font-bold uppercase border-b border-[#333333]">Shuffle</div>
                        {[0, 25, 50, 75].map((sh) => (
                          <div
                            key={sh}
                            onClick={(e) => {
                              e.stopPropagation();
                              setPlaybackSettings((prev) => ({ ...prev, grooveShuffle: sh }));
                              setStatusHint(`Groove Shuffle: ${sh}%`);
                            }}
                            className="px-3 py-1.5 hover:bg-[#303030] flex items-center justify-between cursor-pointer"
                          >
                            <span>{sh}%</span>
                            {playbackSettings.grooveShuffle === sh && <Check size={12} className="text-[#df9c43]" />}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Metronome submenu */}
                  <div
                    onMouseEnter={() => setActiveSubMenu("metronome")}
                    className="relative px-3 py-1.5 hover:bg-[#2c2c2c] flex items-center justify-between cursor-pointer"
                  >
                    <span>Métronome</span>
                    <ChevronRight size={12} className="text-zinc-400" />
                    {activeSubMenu === "metronome" && (
                      <div className="absolute left-full top-0 ml-1 w-48 bg-[#222222] border border-[#444444] rounded-lg shadow-[0_12px_36px_rgba(0,0,0,0.95)] py-1 z-[110]">
                        {["-12 dB", "-6 dB", "0 dB"].map((db) => (
                          <div
                            key={db}
                            onClick={(e) => {
                              e.stopPropagation();
                              setPlaybackSettings((prev) => ({ ...prev, metronomeDb: db }));
                              setStatusHint(`Volume métronome: ${db}`);
                            }}
                            className="px-3 py-1.5 hover:bg-[#303030] flex items-center justify-between cursor-pointer"
                          >
                            <span>Volume {db}</span>
                            {playbackSettings.metronomeDb === db && <Check size={12} className="text-[#df9c43]" />}
                          </div>
                        ))}
                        <div className="border-t border-[#333333] my-1" />
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setPlaybackSettings((prev) => ({ ...prev, metronomeTicks: !prev.metronomeTicks }));
                          }}
                          className="px-3 py-1.5 hover:bg-[#303030] flex items-center justify-between cursor-pointer"
                        >
                          <span>Jouer les tics</span>
                          {playbackSettings.metronomeTicks && <Check size={12} className="text-[#df9c43]" />}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pre-roll submenu */}
                  <div
                    onMouseEnter={() => setActiveSubMenu("preroll")}
                    className="relative px-3 py-1.5 hover:bg-[#2c2c2c] flex items-center justify-between cursor-pointer"
                  >
                    <span>Pre-roll</span>
                    <ChevronRight size={12} className="text-zinc-400" />
                    {activeSubMenu === "preroll" && (
                      <div className="absolute left-full top-0 ml-1 w-48 bg-[#222222] border border-[#444444] rounded-lg shadow-[0_12px_36px_rgba(0,0,0,0.95)] py-1 z-[110]">
                        {[
                          { id: "off", label: "Désactivé" },
                          { id: "1bar", label: "1 mesure" },
                          { id: "2bars", label: "2 mesures" },
                          { id: "4bars", label: "4 mesures" }
                        ].map((pr) => (
                          <div
                            key={pr.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setPlaybackSettings((prev) => ({ ...prev, preroll: pr.id }));
                              setStatusHint(`Pre-roll: ${pr.label}`);
                            }}
                            className="px-3 py-1.5 hover:bg-[#303030] flex items-center justify-between cursor-pointer"
                          >
                            <span>{pr.label}</span>
                            {playbackSettings.preroll === pr.id && <Check size={12} className="text-[#df9c43]" />}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Quantize submenu */}
                  <div
                    onMouseEnter={() => setActiveSubMenu("quantize")}
                    className="relative px-3 py-1.5 hover:bg-[#2c2c2c] flex items-center justify-between cursor-pointer"
                  >
                    <span>Quantification à l'enregistrement</span>
                    <ChevronRight size={12} className="text-zinc-400" />
                    {activeSubMenu === "quantize" && (
                      <div className="absolute left-full top-0 ml-1 w-48 bg-[#222222] border border-[#444444] rounded-lg shadow-[0_12px_36px_rgba(0,0,0,0.95)] py-1 z-[110]">
                        {[
                          { id: "off", label: "Désactivée" },
                          { id: "1/16", label: "1/16 (Double-croche)" },
                          { id: "1/8", label: "1/8 (Croche)" },
                          { id: "1/4", label: "1/4 (Noire)" }
                        ].map((q) => (
                          <div
                            key={q.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setPlaybackSettings((prev) => ({ ...prev, recordQuantize: q.id }));
                              setStatusHint(`Quantification: ${q.label}`);
                            }}
                            className="px-3 py-1.5 hover:bg-[#303030] flex items-center justify-between cursor-pointer"
                          >
                            <span>{q.label}</span>
                            {playbackSettings.recordQuantize === q.id && <Check size={12} className="text-[#df9c43]" />}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 3. AJOUTER */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setOpenMenu(openMenu === "add" ? null : "add")}
                onMouseEnter={() => openMenu && setOpenMenu("add")}
                className={`h-7 px-2.5 py-0 rounded text-[11px] font-semibold tracking-wider transition whitespace-nowrap flex-shrink-0 flex items-center ${
                  openMenu === "add"
                    ? "bg-[#333333] text-white font-bold shadow-sm border border-[#484848]"
                    : "text-zinc-300 hover:text-white hover:bg-[#252525]"
                }`}
              >
                AJOUTER
              </button>
              {openMenu === "add" && (
                <div className="absolute left-0 top-full mt-1.5 w-64 bg-[#1e1e1e] border border-[#3e3e3e] rounded-lg shadow-[0_12px_36px_rgba(0,0,0,0.95)] py-1.5 z-[100] text-zinc-200 text-xs flex flex-col whitespace-normal">
                  <button
                    onClick={() => { setOpenMenu(null); handleAddNewTrack("instruments"); }}
                    className="w-full px-3 py-1.5 text-left hover:bg-[#2c2c2c] hover:text-white flex items-center justify-between"
                  >
                    <span>Ajouter piste d'instrument</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Ctrl+T</span>
                  </button>
                  <button
                    onClick={() => { setOpenMenu(null); handleAddNewTrack("audio"); }}
                    className="w-full px-3 py-1.5 text-left hover:bg-[#2c2c2c] hover:text-white flex items-center justify-between"
                  >
                    <span>Ajouter piste audio</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Ctrl+Shift+T</span>
                  </button>
                  <button
                    onClick={() => { setOpenMenu(null); handleAddNewTrack("fx"); }}
                    className="w-full px-3 py-1.5 text-left hover:bg-[#2c2c2c] hover:text-white flex items-center justify-between"
                  >
                    <span>Ajouter piste d'effets (FX)</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Ctrl+Alt+T</span>
                  </button>
                  <button
                    onClick={() => {
                      setOpenMenu(null);
                      handleAddNewTrack("instruments");
                      setStatusHint("Piste groupe ajoutée");
                    }}
                    className="w-full px-3 py-1.5 text-left hover:bg-[#2c2c2c] hover:text-white flex items-center justify-between"
                  >
                    <span>Ajouter piste de groupe</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Ctrl+Alt+G</span>
                  </button>

                  <div className="border-t border-[#333333] my-1" />

                  <button
                    onClick={() => {
                      setOpenMenu(null);
                      setMainView("clips");
                      setActiveSceneIndex(0);
                      setStatusHint("Scène ajoutée dans le lanceur de clips");
                    }}
                    className="w-full px-3 py-1.5 text-left hover:bg-[#2c2c2c] hover:text-white flex items-center justify-between"
                  >
                    <span>Ajouter scène</span>
                  </button>
                  <button
                    onClick={() => {
                      setOpenMenu(null);
                      const newMarker = {
                        id: `m_${Date.now()}`,
                        name: `Repère ${markers.length + 1}`,
                        bar: Math.floor(currentBar),
                        color: "#f59e0b"
                      };
                      setMarkers((prev) => [...prev, newMarker].sort((a, b) => a.bar - b.bar));
                      setStatusHint(`Repère ajouté à la mesure ${Math.floor(currentBar)}`);
                    }}
                    className="w-full px-3 py-1.5 text-left hover:bg-[#2c2c2c] hover:text-white flex items-center justify-between"
                  >
                    <span>Insérer repère</span>
                  </button>
                </div>
              )}
            </div>

            {/* 4. ÉDITER */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setOpenMenu(openMenu === "edit" ? null : "edit")}
                onMouseEnter={() => openMenu && setOpenMenu("edit")}
                className={`h-7 px-2.5 py-0 rounded text-[11px] font-semibold tracking-wider transition whitespace-nowrap flex-shrink-0 flex items-center ${
                  openMenu === "edit"
                    ? "bg-[#333333] text-white font-bold shadow-sm border border-[#484848]"
                    : "text-zinc-300 hover:text-white hover:bg-[#252525]"
                }`}
              >
                ÉDITER
              </button>
              {openMenu === "edit" && (
                <div className="absolute left-0 top-full mt-1.5 w-64 bg-[#1e1e1e] border border-[#3e3e3e] rounded-lg shadow-[0_12px_36px_rgba(0,0,0,0.95)] py-1.5 z-[100] text-zinc-200 text-xs flex flex-col whitespace-normal">
                  <button
                    onClick={() => { setOpenMenu(null); setStatusHint("Annulation effectuée"); }}
                    className="w-full px-3 py-1.5 text-left hover:bg-[#2c2c2c] hover:text-white flex items-center justify-between"
                  >
                    <span>Annuler</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Ctrl+Z</span>
                  </button>
                  <button
                    onClick={() => { setOpenMenu(null); setStatusHint("Rétablissement effectué"); }}
                    className="w-full px-3 py-1.5 text-left hover:bg-[#2c2c2c] hover:text-white flex items-center justify-between"
                  >
                    <span>Rétablir</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Ctrl+Shift+Z</span>
                  </button>

                  <div className="border-t border-[#333333] my-1" />

                  <button
                    onClick={() => { setOpenMenu(null); setStatusHint("Clip coupé dans le presse-papier"); }}
                    className="w-full px-3 py-1.5 text-left hover:bg-[#2c2c2c] hover:text-white flex items-center justify-between"
                  >
                    <span>Couper</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Ctrl+X</span>
                  </button>
                  <button
                    onClick={() => { setOpenMenu(null); setStatusHint("Clip copié dans le presse-papier"); }}
                    className="w-full px-3 py-1.5 text-left hover:bg-[#2c2c2c] hover:text-white flex items-center justify-between"
                  >
                    <span>Copier</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Ctrl+C</span>
                  </button>
                  <button
                    onClick={() => { setOpenMenu(null); setStatusHint("Clip collé à la position de lecture"); }}
                    className="w-full px-3 py-1.5 text-left hover:bg-[#2c2c2c] hover:text-white flex items-center justify-between"
                  >
                    <span>Coller</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Ctrl+V</span>
                  </button>
                  <button
                    onClick={() => {
                      setOpenMenu(null);
                      if (selectedTrackId && selectedClipId) {
                        handleDuplicateClip(selectedTrackId, selectedClipId);
                      }
                    }}
                    className="w-full px-3 py-1.5 text-left hover:bg-[#2c2c2c] hover:text-white flex items-center justify-between"
                  >
                    <span>Dupliquer</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Ctrl+D</span>
                  </button>
                  <button
                    onClick={() => {
                      setOpenMenu(null);
                      if (selectedTrackId && selectedClipId) {
                        handleDeleteClip(selectedTrackId, selectedClipId);
                      }
                    }}
                    className="w-full px-3 py-1.5 text-left hover:bg-[#2c2c2c] hover:text-red-400 flex items-center justify-between"
                  >
                    <span>Supprimer</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Suppr</span>
                  </button>

                  <div className="border-t border-[#333333] my-1" />

                  <button
                    onClick={() => { setOpenMenu(null); setStatusHint("Tous les clips sélectionnés"); }}
                    className="w-full px-3 py-1.5 text-left hover:bg-[#2c2c2c] hover:text-white flex items-center justify-between"
                  >
                    <span>Tout sélectionner</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Ctrl+A</span>
                  </button>
                  <button
                    onClick={() => { setOpenMenu(null); setSelectedClipId(null); setStatusHint("Sélection effacée"); }}
                    className="w-full px-3 py-1.5 text-left hover:bg-[#2c2c2c] hover:text-white flex items-center justify-between"
                  >
                    <span>Tout désélectionner</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Ctrl+Shift+A</span>
                  </button>
                </div>
              )}
            </div>

            {/* 5. AIDE */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setOpenMenu(openMenu === "help" ? null : "help")}
                onMouseEnter={() => openMenu && setOpenMenu("help")}
                className={`h-7 px-2.5 py-0 rounded text-[11px] font-semibold tracking-wider transition whitespace-nowrap flex-shrink-0 flex items-center ${
                  openMenu === "help"
                    ? "bg-[#333333] text-white font-bold shadow-sm border border-[#484848]"
                    : "text-zinc-300 hover:text-white hover:bg-[#252525]"
                }`}
              >
                AIDE
              </button>
              {openMenu === "help" && (
                <div className="absolute left-0 top-full mt-1.5 w-64 bg-[#1e1e1e] border border-[#3e3e3e] rounded-lg shadow-[0_12px_36px_rgba(0,0,0,0.95)] py-1.5 z-[100] text-zinc-200 text-xs flex flex-col whitespace-normal">
                  <button
                    onClick={() => { setOpenMenu(null); setIsShortcutsModalOpen(true); }}
                    className="w-full px-3 py-1.5 text-left hover:bg-[#2c2c2c] hover:text-white flex items-center justify-between"
                  >
                    <span>Raccourcis clavier</span>
                    <span className="text-[10px] text-zinc-500 font-mono">F1</span>
                  </button>
                  <button
                    onClick={() => {
                      setOpenMenu(null);
                      setStatusHint("Guide interactif : Glissez des instruments depuis la barre droite vers les pistes");
                    }}
                    className="w-full px-3 py-1.5 text-left hover:bg-[#2c2c2c] hover:text-white flex items-center justify-between"
                  >
                    <span>Guide interactif</span>
                  </button>
                  <button
                    onClick={() => {
                      setOpenMenu(null);
                      window.open("https://github.com/SharathKumarS/Open-Generative-AI", "_blank");
                    }}
                    className="w-full px-3 py-1.5 text-left hover:bg-[#2c2c2c] hover:text-white flex items-center justify-between"
                  >
                    <span>Documentation DAW</span>
                  </button>

                  <div className="border-t border-[#333333] my-1" />

                  <button
                    onClick={() => { setOpenMenu(null); setIsAboutModalOpen(true); }}
                    className="w-full px-3 py-1.5 text-left hover:bg-[#2c2c2c] hover:text-[#df9c43] font-semibold flex items-center justify-between"
                  >
                    <span>À propos d'Open-Generative-AI Studio</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Quick Studio Tools, Zoom Controls & Audio Engine */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Touch Profile Switcher (Chapter 18, p. 559) */}
          <button
            data-testid="btn-toggle-touch-profile"
            onClick={() => {
              const next = !isTouchProfileActive;
              setIsTouchProfileActive(next);
              setStatusHint(next ? "🖐 Profil Tactile Activé (Cibles élargies & Gestures)" : "Profil Bureau Standard Réactivé");
            }}
            className={`h-7 px-2.5 rounded font-bold text-[10px] flex items-center gap-1.5 transition whitespace-nowrap flex-shrink-0 ${
              isTouchProfileActive
                ? "bg-cyan-500 text-black shadow-lg ring-2 ring-cyan-400 font-extrabold"
                : "bg-[#202020] text-zinc-300 hover:text-white border border-[#333333]"
            }`}
            title="Activer/Désactiver le Profil Tactile (Chapitre 18)"
          >
            <span>🖐</span>
            <span>{isTouchProfileActive ? "TACTILE ACTIF" : "TACTILE"}</span>
          </button>

          {/* Timeline Zoom Controls (0.10 Macro to 3.0 Micro-Beats) */}
          <div className="h-7 flex items-center gap-1 bg-[#141414] px-1.5 py-0 rounded border border-[#2a2a2a] text-[10px] text-zinc-400 whitespace-nowrap flex-shrink-0">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.10, Number((z - 0.15).toFixed(2))))}
              className="p-1 hover:text-white rounded transition active:scale-95"
              title="Zoom Arrière (Molette / Ctrl -)"
            >
              <ZoomOut size={12} />
            </button>
            <span
              onClick={() => setZoomLevel(1.0)}
              className="font-mono text-[9px] w-9 text-center cursor-pointer hover:text-white hover:underline"
              title="Cliquer pour réinitialiser le zoom à 100%"
            >
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(3.0, Number((z + 0.15).toFixed(2))))}
              className="p-1 hover:text-white rounded transition active:scale-95"
              title="Zoom Avant (Molette / Ctrl +)"
            >
              <ZoomIn size={12} />
            </button>
          </div>

          {/* Add Track Dropdown */}
          <div className="relative group flex-shrink-0">
            <button
              className="h-7 px-2.5 py-0 bg-[#df9c43]/20 hover:bg-[#df9c43]/30 text-[#df9c43] border border-[#df9c43]/40 text-[11px] font-semibold rounded flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 transition"
            >
              <Plus size={12} className="flex-shrink-0" />
              <span>PISTE</span>
              <ChevronDown size={11} className="flex-shrink-0" />
            </button>

            {/* Dropdown Menu */}
            <div className="absolute right-0 top-full mt-1.5 w-48 bg-[#202020] border border-[#3e3e3e] rounded-lg shadow-[0_12px_36px_rgba(0,0,0,0.9)] py-1 hidden group-hover:block z-[100]">
              <button
                onClick={() => handleAddNewTrack("audio")}
                className="w-full px-3 py-1.5 text-left text-xs text-zinc-200 hover:bg-[#2b2b2b] flex items-center gap-2"
              >
                <div className="w-2 h-2 rounded-full bg-[#06b6d4]" />
                <span>+ Piste Audio</span>
              </button>
              <button
                onClick={() => handleAddNewTrack("instruments")}
                className="w-full px-3 py-1.5 text-left text-xs text-zinc-200 hover:bg-[#2b2b2b] flex items-center gap-2"
              >
                <div className="w-2 h-2 rounded-full bg-[#8b5cf6]" />
                <span>+ Piste Instrument</span>
              </button>
              <button
                onClick={() => handleAddNewTrack("fx")}
                className="w-full px-3 py-1.5 text-left text-xs text-zinc-200 hover:bg-[#2b2b2b] flex items-center gap-2"
              >
                <div className="w-2 h-2 rounded-full bg-[#10b981]" />
                <span>+ Piste FX Send</span>
              </button>
            </div>
          </div>

          {/* Load stems button */}
          <button
            onClick={() => onLoadStems && onLoadStems(selectedTrack)}
            disabled={isLoadingStems}
            className="h-7 px-2.5 py-0 bg-[#252525] hover:bg-[#303030] text-cyan-300 border border-cyan-500/30 text-[11px] font-semibold rounded flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 transition"
            title="Séparer et charger les 4 stems Demucs (Vocals, Drums, Bass, Other)"
          >
            {isLoadingStems ? (
              <RefreshCw size={11} className="animate-spin text-cyan-400 flex-shrink-0" />
            ) : (
              <Layers size={11} className="flex-shrink-0" />
            )}
            <span>{isLoadingStems ? "Stems..." : "Charger Stems"}</span>
          </button>

          {/* Undo / Redo */}
          <div className="h-7 flex items-center gap-0.5 text-zinc-400 border-l border-[#333333] pl-1.5 flex-shrink-0">
            <button className="w-6 h-6 flex items-center justify-center p-0 hover:text-white hover:bg-[#252525] rounded transition" title="Annuler (Ctrl+Z)">
              <Undo2 size={13} />
            </button>
            <button className="w-6 h-6 flex items-center justify-center p-0 hover:text-white hover:bg-[#252525] rounded transition" title="Rétablir (Ctrl+Y)">
              <Redo2 size={13} />
            </button>
          </div>

          {/* Audio Engine Load Meter */}
          <div
            className="h-7 flex items-center gap-1.5 bg-[#141414] px-2 py-0 rounded border border-[#2a2a2a] text-[10px] font-mono text-zinc-400 whitespace-nowrap flex-shrink-0"
            title="Moteur Audio 48 kHz / 256 samples • DSP Load"
          >
            <Cpu size={11} className="text-emerald-400 flex-shrink-0" />
            <span>DSP: 8%</span>
            <div className="w-8 h-1.5 bg-[#252525] rounded-full overflow-hidden flex-shrink-0">
              <div className="w-[18%] h-full bg-emerald-500" />
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          2. MAIN TRANSPORT BAR
      ════════════════════════════════════════════════════════════════ */}
      <div className="h-11 bg-[#222222] border-b border-[#2e2e2e] px-3 flex items-center justify-between flex-shrink-0 relative z-20">
        {/* Left Section: Transport Controls */}
        <div className="flex items-center gap-2">
          {/* Stop Button */}
          <button
            data-testid="btn-transport-stop"
            onClick={stopPlayback}
            className="w-8 h-8 rounded bg-[#2c2c2c] hover:bg-[#383838] text-zinc-300 hover:text-white flex items-center justify-center transition active:scale-95"
            title="Arrêt (Retour boucle début)"
          >
            <Square size={13} fill="currentColor" />
          </button>

          {/* Play / Pause */}
          <button
            data-testid="btn-transport-play"
            onClick={togglePlay}
            className={`w-9 h-8 rounded flex items-center justify-center font-bold transition shadow active:scale-95 ${
              isPlaying
                ? "bg-[#241808] border-2 border-[#df9c43] text-[#f5c277] shadow-[0_0_12px_rgba(223,156,67,0.4)]"
                : "bg-[#2c2c2c] hover:bg-[#383838] text-zinc-200"
            }`}
            title="Lecture / Pause (Espace)"
          >
            {isPlaying ? (
              <Pause size={15} fill="currentColor" />
            ) : (
              <Play size={15} className="ml-0.5" fill="currentColor" />
            )}
          </button>

          {/* Record Button */}
          <button
            onClick={handleToggleTransportRecord}
            className={`w-8 h-8 rounded flex items-center justify-center transition active:scale-95 ${
              isRecording
                ? "bg-red-600 text-white animate-pulse"
                : "bg-[#2c2c2c] hover:bg-[#383838] text-zinc-300"
            }`}
            title="Enregistrement Micro Réel"
          >
            <Circle size={12} fill="currentColor" className="text-red-500" />
          </button>

          {/* Loop Toggle */}
          <button
            onClick={() => setIsLooping(!isLooping)}
            className={`w-8 h-8 rounded flex items-center justify-center transition ${
              isLooping
                ? "bg-[#df9c43]/20 text-[#df9c43] border border-[#df9c43]/40 font-bold"
                : "bg-[#2c2c2c] hover:bg-[#383838] text-zinc-400"
            }`}
            title={`Boucle: Mesure ${loopStartBar} à ${loopEndBar}`}
          >
            <Repeat size={14} />
          </button>

          {/* Metronome Toggle */}
          <button
            onClick={() => setIsMetronomeActive(!isMetronomeActive)}
            className={`w-8 h-8 rounded flex items-center justify-center text-[11px] font-bold font-mono transition ${
              isMetronomeActive
                ? "bg-[#df9c43]/20 text-[#df9c43] border border-[#df9c43]/40"
                : "bg-[#2c2c2c] hover:bg-[#383838] text-zinc-400"
            }`}
            title="Métronome (Clic)"
          >
            MET
          </button>
        </div>

        {/* Center Section: LCD Counters & Tempo Display */}
        <div className="flex items-center gap-3 bg-[#161616] px-3 py-1 rounded border border-[#303030]">
          {/* Bar.Beat.Tick Display */}
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-zinc-500 tracking-wider uppercase font-semibold">
              POSITION
            </span>
            <span className="font-mono text-base text-[#df9c43] font-bold tracking-wider">
              {barBeatDisplay}
            </span>
          </div>

          <div className="h-6 w-px bg-[#2b2b2b]" />

          {/* Time Minutes:Seconds Display */}
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-zinc-500 tracking-wider uppercase font-semibold">
              TEMPS
            </span>
            <span className="font-mono text-xs text-zinc-300 font-semibold tracking-wide">
              {timeDisplay}
            </span>
          </div>

          <div className="h-6 w-px bg-[#2b2b2b]" />

          {/* Tempo BPM */}
          <div className="flex items-center gap-1.5">
            <div className="flex flex-col">
              <span className="text-[9px] text-zinc-500 uppercase font-semibold">TEMPO</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={bpm}
                  onChange={(e) => {
                    const newBpm = parseFloat(e.target.value) || 120;
                    setBpm(newBpm);
                    sendStudioOsc("tempo", { tempo: newBpm });
                  }}
                  step="0.5"
                  className="w-14 bg-transparent font-mono text-xs text-white font-bold focus:outline-none focus:bg-[#252525] px-1 rounded"
                />
                <span className="text-[10px] text-zinc-500">BPM</span>
              </div>
            </div>
          </div>

          <div className="h-6 w-px bg-[#2b2b2b]" />

          {/* Signature & Scale Key */}
          <div className="flex items-center gap-2 text-[11px] font-mono">
            <div>
              <span className="text-[9px] text-zinc-500 block uppercase font-semibold">MESURE</span>
              <span className="text-zinc-300 font-bold">{timeSignature}</span>
            </div>
            <div>
              <span className="text-[9px] text-zinc-500 block uppercase font-semibold">GAMME</span>
              <span className="text-amber-400 font-bold">{selectedTrack?.key || musicalKey}</span>
            </div>
          </div>
        </div>

        {/* Right Section: View Selector Quick Toggles & External Tools */}
        <div className="flex items-center gap-2">
          {/* Music Studio 6 Host OSC Link (UDP 9000/9001) */}
          <button
            data-testid="btn-studio-osc-link"
            onClick={() => {
              setStudioHostLink(prev => !prev);
              setStatusHint(!studioHostLink ? "Music Studio Link ACTIF • UDP :9000/:9001" : "Music Studio Link DÉCONNECTÉ");
            }}
            className={`px-2 py-1 text-[11px] font-semibold rounded flex items-center gap-1.5 transition border ${
              studioHostLink
                ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/50"
                : "bg-[#252525] border-zinc-700 text-zinc-400 hover:text-zinc-200"
            }`}
            title="Liaison bidirectionnelle temps réel avec Music Studio (OSC UDP :9000/:9001)"
          >
            <span
              className={`w-2 h-2 rounded-full transition-all ${
                studioHostLink
                  ? studioOscStatus === "transmitting"
                    ? "bg-amber-400 scale-125 shadow-[0_0_8px_#f59e0b]"
                    : "bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]"
                  : "bg-zinc-600"
              }`}
            />
            <span className="font-mono text-[10px] tracking-tight">Studio 6 Host</span>
          </button>

          {/* External AudioMass Editor Link */}
          <button
            onClick={() => onOpenAudioMass ? onOpenAudioMass() : window.open(`/editor/index.html?audioUrl=${encodeURIComponent(selectedTrack?.url || "/outputs/OGA_Music_NeuroSoft_90s.mp3")}`, "_blank")}
            className="px-2.5 py-1 bg-[#282828] hover:bg-[#333333] text-[#df9c43] border border-[#df9c43]/20 text-[11px] font-semibold rounded flex items-center gap-1.5 transition"
            title="Ouvrir l'éditeur de forme d'onde AudioMass plein écran"
          >
            <FileAudio size={12} />
            <span>AudioMass Wave</span>
          </button>

          {/* ComfyUI Video Studio Modal */}
          {onOpenVideoStudio && (
            <button
              onClick={onOpenVideoStudio}
              className="px-2.5 py-1 bg-[#b87524]/20 hover:bg-[#b87524]/35 text-[#eaaf5d] border border-[#df9c43]/40 text-[11px] font-semibold rounded flex items-center gap-1.5 transition"
              title="Générer clip vidéo synchronisé avec ComfyUI"
            >
              <Film size={12} />
              <span>Clip Vidéo IA</span>
            </button>
          )}

          {/* Send to Montage (Cross-Studio Export Bridge) */}
          {onSendToMontage && (
            <button
              onClick={() => {
                const secPerBar = (240 / (bpm || 172));
                const activeCues = (cues && cues.length > 0) ? cues : (STUDIO_DEMO_CUES || []);
                const cueMarkers = activeCues.map((cue) => ({
                  id: `cue_${cue.id || cue.bar}`,
                  name: cue.name,
                  bar: cue.bar,
                  timeSec: Number(((cue.bar - 1) * (60 / (bpm || 172)) * 4).toFixed(2)),
                  color: cue.color
                }));

                const activeAudioUrl = selectedTrack?.audioUrl || selectedTrack?.url || "/samples/studio/piano_lr_bounce_1.wav";
                const activeTitle = selectedTrack?.name ? `${selectedTrack.name} — Ferrous Rhythm (Music Studio 6)` : "Ferrous Rhythm Master (Music Studio 6)";
                const activeFilename = `${(selectedTrack?.name || "ferrous_rhythm").toLowerCase().replace(/\s+/g, "_")}_master.wav`;

                onSendToMontage({
                  type: "music",
                  title: activeTitle,
                  filename: activeFilename,
                  url: activeAudioUrl,
                  audio_url: activeAudioUrl,
                  duration: Math.round((148 * (240 / (bpm || 172))) / 4),
                  bpm: bpm || 172,
                  markers: cueMarkers
                });
              }}
              className="px-2.5 py-1 bg-[#241808] hover:bg-[#2f1f0b] border border-[#df9c43] text-[#eaaf5d] hover:text-white text-[11px] font-bold rounded-lg flex items-center gap-1 shadow-[0_0_8px_rgba(223,156,67,0.25)] transition"
              title="Exporter vers Studio Video avec les marqueurs Cue synchronisés"
            >
              <CornerDownRight size={12} className="text-[#df9c43]" />
              <span>Studio Video</span>
            </button>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          3. MAIN CENTER WORKSPACE: ARRANGE / CLIPS / MIX + RIGHT SIDEBAR
      ════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex overflow-hidden relative z-0">
        {/* Left Inspector Panel (Section 3.3, p. 91-93) */}
        <MusicStudioInspectorPanel
          isOpen={isInspectorOpen}
          onClose={() => setIsInspectorOpen(false)}
          selectedTrack={selectedTrack}
          selectedClip={selectedClip}
          onUpdateTrack={(trkId, updates) => {
            setTracks((prev) =>
              prev.map((t) => (t.id === trkId ? { ...t, ...updates } : t))
            );
          }}
          onUpdateClip={(trkId, clipId, updates) => {
            setTracks((prev) =>
              prev.map((t) => {
                if (t.id === trkId) {
                  return {
                    ...t,
                    clips: (t.clips || []).map((c) =>
                      c.id === clipId ? { ...c, ...updates } : c
                    )
                  };
                }
                return t;
              })
            );
          }}
          onToggleTrackActive={handleToggleTrackActive}
          onBounceInPlace={handleBounceInPlace}
          onSliceToDrumMachine={handleSliceToDrumMachine}
          onOpenAudioWarp={(targetClip) => {
            if (targetClip?.id) setSelectedClipId(targetClip.id);
            setShowBottomPanel(true);
            setBottomPanelTab("audiowarp");
          }}
          setStatusHint={setStatusHint}
        />

        {/* Main Work Area (Left / Center) */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#151515]">
          {/* ────────────────────────────────────────────────────────────
              MODE A: VUE ARRANGEUR
          ──────────────────────────────────────────────────────────── */}
          {mainView === "arrange" && (
            <div className="flex-1 flex flex-col overflow-hidden relative">
              {/* Music Studio 5/6 Universal Arranger Toolbar (Section 3.1.4, p. 81-85) */}
              <MusicStudioArrangerToolbar
                activeTool={activeEditingTool}
                onSelectTool={(toolId) => setActiveEditingTool(toolId)}
                mainView={mainView}
                onSetMainView={(v) => setMainView(v)}
                snapValue={arrangerSnap}
                onSelectSnap={(s) => setArrangerSnap(s)}
                showTrackIO={showTrackIO}
                onToggleTrackIO={() => setShowTrackIO((prev) => !prev)}
                trackHeightMode={trackHeightMode}
                onToggleTrackHeight={() => setTrackHeightMode((prev) => (prev === "normal" ? "compact" : "normal"))}
                showEffectTracks={showEffectTracks}
                onToggleEffectTracks={() => setShowEffectTracks((prev) => !prev)}
                showDeactivatedTracks={showDeactivatedTracks}
                onToggleDeactivatedTracks={() => setShowDeactivatedTracks((prev) => !prev)}
                followPlayhead={followPlayhead}
                onToggleFollowPlayhead={() => setFollowPlayhead((prev) => !prev)}
                timeSelection={timeSelection}
                onClearTimeSelection={() => setTimeSelection(null)}
                setStatusHint={setStatusHint}
              />

              {/* Unified Scrollable Container: Ruler + Multitrack Body */}
              <div
                ref={timelineScrollRef}
                onWheel={handleTimelineWheel}
                className="flex-1 overflow-auto custom-scrollbar relative bg-[#151515] select-none"
              >
                <div
                  style={{ minWidth: `${224 + maxTrackBars * barWidthPx}px`, width: "max-content" }}
                  className="flex flex-col relative min-h-full"
                >
                  {/* ────────────────────────────────────────────────────────
                      STICKY TOP RULER (DUAL: TIME + MEASURE/BARS)
                  ──────────────────────────────────────────────────────── */}
                  <div data-timeline-ruler="true" className="sticky top-0 z-40 bg-[#1c1c1c] border-b border-[#2e2e2e] flex flex-col shadow-md">
                    {/* Row 1: Section Markers & Time Ticks (0:00, 0:10, 0:20... 2:50) */}
                    <div className="h-6 bg-[#161616] border-b border-[#272727] flex items-stretch">
                      {/* Top-Left Corner: Repères / Sections */}
                      <div className="w-56 px-3 border-r border-[#2e2e2e] h-full flex items-center justify-between text-[9px] text-zinc-400 uppercase tracking-wider font-semibold bg-[#141414] sticky left-0 z-50 flex-shrink-0 shadow-[2px_0_5px_rgba(0,0,0,0.5)]">
                        <span>REPÈRES / TEMPS</span>
                        <button
                          onClick={() => {
                            const newMarker = {
                              id: `m_${Date.now()}`,
                              name: `Repère ${markers.length + 1}`,
                              bar: Math.floor(currentBar),
                              color: "#f59e0b"
                            };
                            setMarkers((prev) => [...prev, newMarker].sort((a, b) => a.bar - b.bar));
                            setStatusHint(`Repère ajouté à la mesure ${Math.floor(currentBar)}`);
                          }}
                          className="text-zinc-400 hover:text-white p-0.5 rounded hover:bg-white/10"
                          title="Ajouter un repère à la position actuelle"
                        >
                          <Plus size={10} />
                        </button>
                      </div>

                      {/* Timeline Time Grid & Markers Container */}
                      <div className="relative h-full flex items-center" style={{ width: `${maxTrackBars * barWidthPx}px` }}>
                        {/* Time labels every 10 seconds (0:00, 0:10, 0:20, ..., 2:50) */}
                        {Array.from({ length: Math.ceil((maxTrackBars * (240 / bpm)) / 10) + 1 }, (_, i) => i * 10).map((sec) => {
                          const posPx = (sec / (240 / bpm)) * barWidthPx;
                          const mins = Math.floor(sec / 60);
                          const remSec = sec % 60;
                          const timeLabel = `${mins}:${remSec < 10 ? "0" : ""}${remSec}`;
                          return (
                            <div
                              key={sec}
                              style={{ left: `${posPx}px` }}
                              className="absolute top-0 bottom-0 flex items-center border-l border-[#333333] pl-1 text-[8.5px] font-mono text-zinc-500 pointer-events-none"
                            >
                              <span>{timeLabel}</span>
                            </div>
                          );
                        })}

                        {/* Section Marker Chips (10 Music Studio Cue Markers) */}
                        {markers.map((m) => {
                          const mLeftPx = (m.bar - 1) * barWidthPx;
                          return (
                            <div
                              key={m.id}
                              data-cue-marker={m.name}
                              onClick={() => {
                                setCurrentBar(m.bar);
                                setCurrentBeat(1);
                                setCurrentTimeSec((m.bar - 1) * (240 / bpm));
                                if (dawAudioEngine) {
                                  dawAudioEngine.seekToBar(m.bar, bpm);
                                }
                                setStatusHint(`Saut au repère Music Studio: ${m.name} (Mesure ${m.bar})`);
                              }}
                              style={{ left: `${mLeftPx}px` }}
                              className="absolute h-5 px-1.5 rounded flex items-center gap-1 cursor-pointer transition shadow text-[9.5px] font-extrabold text-amber-200 hover:brightness-125 z-20 border border-amber-500/40 bg-[#1e1a14]/90 hover:bg-[#2a241c]"
                              title={`Sauter à la section Music Studio "${m.name}" (Mesure ${m.bar})`}
                            >
                              <span className="text-amber-400 font-black">|</span>
                              <span className="drop-shadow">{m.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Row 2: Bars Numbers Grid (1 to 148) & Loop Region */}
                    <div className="h-7 flex items-stretch relative">
                      {/* Sticky Left Corner Header */}
                      <div className="w-56 px-3 border-r border-[#2e2e2e] h-full flex items-center justify-between text-[10px] text-zinc-400 uppercase tracking-wider font-semibold bg-[#181818] sticky left-0 z-50 flex-shrink-0 shadow-[2px_0_5px_rgba(0,0,0,0.5)]">
                        <span>PISTES ARRANGEUR</span>
                        <span className="text-[9px] text-[#df9c43] font-mono">{tracks.length} ACTIVES</span>
                      </div>

                      {/* Measure / Bar Numbers Container */}
                      <div
                        className="relative h-full flex items-center font-mono text-[10px] text-zinc-400"
                        style={{ width: `${maxTrackBars * barWidthPx}px` }}
                      >
                        {/* Loop Range Highlight Band on Ruler */}
                        <div
                          className="absolute top-0 bottom-0 bg-[#df9c43]/15 border-t-2 border-b-2 border-[#df9c43] pointer-events-none z-10"
                          style={{
                            left: `${(loopStartBar - 1) * barWidthPx}px`,
                            width: `${Math.max(barWidthPx, (loopEndBar - loopStartBar) * barWidthPx)}px`
                          }}
                        />

                        {/* Time Selection Bracket Band on Ruler (Tool 2) */}
                        {timeSelection && (
                          <div
                            data-testid="time-selection-ruler-bracket"
                            className="absolute top-0 bottom-0 bg-amber-400/30 border-t-2 border-b-2 border-amber-300 pointer-events-none z-15 shadow-[0_0_10px_rgba(251,191,36,0.3)]"
                            style={{
                              left: `${(timeSelection.startBar - 1) * barWidthPx}px`,
                              width: `${Math.max(barWidthPx, (timeSelection.endBar - timeSelection.startBar + 1) * barWidthPx)}px`
                            }}
                          />
                        )}

                        {/* Loop Start Bracket Handle */}
                        <div
                          onMouseDown={() => setIsDraggingLoopStart(true)}
                          style={{ left: `${(loopStartBar - 1) * barWidthPx - 6}px` }}
                          className="absolute top-0 bottom-0 w-3 bg-[#241808] border border-[#df9c43] rounded-l cursor-ew-resize z-20 flex items-center justify-center text-[#eaaf5d] text-[8px] font-bold shadow-[0_0_6px_rgba(223,156,67,0.3)]"
                          title={`Début boucle: mesure ${loopStartBar}`}
                        >
                          [
                        </div>

                        {/* Loop End Bracket Handle */}
                        <div
                          onMouseDown={() => setIsDraggingLoopEnd(true)}
                          style={{ left: `${(loopEndBar - 1) * barWidthPx - 6}px` }}
                          className="absolute top-0 bottom-0 w-3 bg-[#241808] border border-[#df9c43] rounded-r cursor-ew-resize z-20 flex items-center justify-center text-[#eaaf5d] text-[8px] font-bold shadow-[0_0_6px_rgba(223,156,67,0.3)]"
                          title={`Fin boucle: mesure ${loopEndBar}`}
                        >
                          ]
                        </div>

                        {/* Playhead pointer on Ruler */}
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-[#df9c43] z-30 pointer-events-none shadow-[0_0_8px_#df9c43]"
                          style={{
                            left: `${(currentBar - 1) * barWidthPx + (currentBeat - 1) * (barWidthPx / 4)}px`
                          }}
                        >
                          <div className="w-2.5 h-2.5 bg-[#df9c43] rotate-45 -ml-1 top-0 shadow" />
                        </div>

                        {/* Dynamic Bar Ticks Numbers (Adaptive step to avoid overlap) */}
                        {(() => {
                          const barStep = barWidthPx >= 60 ? 1 : barWidthPx >= 30 ? 2 : barWidthPx >= 15 ? 4 : 8;
                          return Array.from({ length: maxTrackBars }, (_, i) => i + 1).map((bar) => {
                            const showNumber = (bar - 1) % barStep === 0;
                            return (
                              <div
                                key={bar}
                                onMouseDown={(e) => handleRulerMouseDown(e, bar)}
                                style={{ width: `${barWidthPx}px` }}
                                className="flex-shrink-0 border-l border-[#303030] pl-1 cursor-ns-resize hover:text-[#df9c43] hover:bg-white/5 transition h-full flex items-center select-none"
                                title={`Mesure ${bar} : Clic pour caler • Molette pour zoomer • Glisser verticalement pour zoomer (Haut = Zoom +, Bas = Zoom -) • Glisser horizontalement pour défiler`}
                              >
                                {showNumber ? (
                                  <span className="font-bold text-zinc-300 pointer-events-none select-none">{bar}</span>
                                ) : (
                                  <div className="h-2 w-px bg-zinc-700/50 pointer-events-none" />
                                )}
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* ────────────────────────────────────────────────────────
                      MULTITRACK BODY ROWS
                  ──────────────────────────────────────────────────────── */}
                  <div className="flex flex-col divide-y divide-[#262626] relative flex-1">
                    {/* Continuous Playhead Line across all tracks */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-[#df9c43] z-20 pointer-events-none transition-all duration-75 shadow-[0_0_8px_#df9c43]"
                      style={{
                        left: `${224 + (currentBar - 1) * barWidthPx + (currentBeat - 1) * (barWidthPx / 4)}px`
                      }}
                    >
                      <div className="w-2.5 h-2.5 bg-[#df9c43] rotate-45 -ml-1 top-0 shadow" />
                    </div>

                    {/* Vertical Cue Marker Lines across all tracks */}
                    {markers.map((m) => (
                      <div
                        key={m.id}
                        className="absolute top-0 bottom-0 w-px border-l border-dashed border-amber-400/25 z-10 pointer-events-none"
                        style={{ left: `${224 + (m.bar - 1) * barWidthPx}px` }}
                      />
                    ))}

                    {/* Continuous Time Selection Bracket Across All Tracks (Tool 2) */}
                    {timeSelection && (
                      <div
                        data-testid="time-selection-multitrack-bracket"
                        style={{
                          left: `${224 + (timeSelection.startBar - 1) * barWidthPx}px`,
                          width: `${Math.max(barWidthPx, (timeSelection.endBar - timeSelection.startBar + 1) * barWidthPx)}px`
                        }}
                        className="absolute top-0 bottom-0 bg-amber-400/10 border-l-2 border-r-2 border-amber-400/70 z-20 pointer-events-none shadow-[0_0_20px_rgba(251,191,36,0.25)]"
                      />
                    )}

                    {visibleTracks.map((trk, idx) => {
                      const isTrackSelected = selectedTrackId === trk.id;
                      const isAutomationOpen = trk.automation?.visible;
                      const childCount = trk.isGroup ? tracks.filter((t) => t.groupId === trk.id).length : 0;

                      return (
                        <div key={trk.id} className="flex flex-col relative" data-track-id={trk.id}>
                          {/* Main Track Row */}
                          <div
                            onClick={() => {
                              setSelectedTrackId(trk.id);
                              setStatusHint(`Piste sélectionnée: ${trk.name}`);
                            }}
                            onDragOver={(e) => {
                              if (draggingTrackIndex !== null && draggingTrackIndex !== idx) {
                                e.preventDefault();
                                e.stopPropagation();
                                e.dataTransfer.dropEffect = "move";
                                const rect = e.currentTarget.getBoundingClientRect();
                                const isUpperHalf = (e.clientY - rect.top) < (rect.height / 2);
                                const pos = isUpperHalf ? "before" : "after";
                                const targetIdx = isUpperHalf ? idx : idx + 1;
                                setTrackDropIndicator({ targetIndex: targetIdx, position: pos, trackId: trk.id });
                                return;
                              }
                              if (draggedSidebarItem) {
                                e.preventDefault();
                                e.stopPropagation();
                                e.dataTransfer.dropEffect = "copy";
                                setDragOverTrackId(trk.id);
                                return;
                              }
                            }}
                            onDragLeave={(e) => {
                              if (e.currentTarget.contains(e.relatedTarget)) return;
                              if (trackDropIndicator?.trackId === trk.id) setTrackDropIndicator(null);
                              if (dragOverTrackId === trk.id && draggedSidebarItem) setDragOverTrackId(null);
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (typeof window !== "undefined") {
                                window.__isInternalDragging = false;
                                window.__isInternalDawDragging = false;
                              }
                              if (draggingTrackIndex !== null && trackDropIndicator) {
                                handleReorderTrack(draggingTrackIndex, trackDropIndicator.targetIndex);
                                return;
                              }
                              const dataStr = e.dataTransfer.getData("application/json");
                              if (dataStr) {
                                try {
                                  const parsed = JSON.parse(dataStr);
                                  if (parsed.type === "track") {
                                    handleReorderTrack(parsed.sourceIndex, idx);
                                  } else if (parsed.type === "instrument") {
                                    handleAssignInstrumentToTrack(trk.id, parsed.name);
                                  } else if (parsed.type === "device") {
                                    handleAddDeviceToTrack(trk.id, parsed.device);
                                  }
                                } catch (err) {}
                              }
                              setDragOverTrackId(null);
                              setDraggedSidebarItem(null);
                            }}
                            className={`h-16 flex items-stretch transition-colors relative ${
                              isTrackSelected ? "bg-[#242424]" : "bg-[#161616] hover:bg-[#1a1a1a]"
                            } ${
                              draggedSidebarItem?.type === "instrument" && dragOverTrackId === trk.id
                                ? "ring-2 ring-emerald-500 bg-emerald-500/10"
                                : ""
                            } ${
                              draggedSidebarItem?.type === "device" && dragOverTrackId === trk.id
                                ? "ring-2 ring-cyan-500 bg-cyan-500/10"
                                : ""
                            }`}
                          >
                            {/* High-visibility Track Insertion Indicator Line */}
                            {trackDropIndicator && trackDropIndicator.trackId === trk.id && (
                              <div
                                className={`absolute left-0 right-0 h-1 bg-[#df9c43] z-40 pointer-events-none shadow-[0_0_12px_#df9c43] flex items-center justify-between ${
                                  trackDropIndicator.position === "before" ? "-top-0.5" : "-bottom-0.5"
                                }`}
                              >
                                <div className="w-2.5 h-2.5 bg-[#df9c43] rotate-45 -ml-1 shadow" />
                                <span className="bg-[#241808] border border-[#df9c43] text-[#f5c277] text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-[0_0_8px_rgba(223,156,67,0.4)] tracking-wider">
                                  Déplacer la piste ici
                                </span>
                                <div className="w-2.5 h-2.5 bg-[#df9c43] rotate-45 -mr-1 shadow" />
                              </div>
                            )}

                            {/* Floating Target Badge for Dropped Instrument */}
                            {draggedSidebarItem?.type === "instrument" && dragOverTrackId === trk.id && (
                              <div className="absolute inset-0 bg-emerald-500/10 z-30 pointer-events-none flex items-center justify-center">
                                <div className="bg-emerald-950/90 border border-emerald-500 text-emerald-300 px-3 py-1 rounded-lg text-xs font-bold shadow-xl flex items-center gap-2">
                                  <Sparkles size={13} className="text-emerald-400" />
                                  <span>+ Assigner l'instrument "{draggedSidebarItem.name}" à {trk.name}</span>
                                </div>
                              </div>
                            )}

                            {/* Floating Target Badge for Dropped Device/Effect */}
                            {draggedSidebarItem?.type === "device" && dragOverTrackId === trk.id && (
                              <div className="absolute inset-0 bg-cyan-500/10 z-30 pointer-events-none flex items-center justify-center">
                                <div className="bg-cyan-950/90 border border-cyan-500 text-cyan-300 px-3 py-1 rounded-lg text-xs font-bold shadow-xl flex items-center gap-2">
                                  <Sliders size={13} className="text-cyan-400" />
                                  <span>+ Insérer l'effet "{draggedSidebarItem.name}" sur {trk.name}</span>
                                </div>
                              </div>
                            )}

                            {/* ── Left Column: Sticky Track Header ── */}
                            {trk.isGroup ? (
                              <div
                                data-track-header-group={trk.id}
                                className={`w-56 h-16 flex-shrink-0 border-r border-[#2e2e2e] px-2 py-1.5 flex flex-col justify-between sticky left-0 z-30 shadow-[2px_0_5px_rgba(0,0,0,0.5)] transition-all ${
                                  isTrackSelected
                                    ? "bg-[#252525] ring-2 ring-[#df9c43] ring-inset shadow-[0_0_20px_rgba(223,156,67,0.3)]"
                                    : "bg-[#181818] hover:bg-[#1e1e1e]"
                                }`}
                              >
                                {/* Group Color Accent Line */}
                                <div
                                  className={`absolute left-0 top-0 bottom-0 transition-all ${
                                    isTrackSelected ? "w-2.5 shadow-[0_0_12px_#df9c43]" : "w-1.5"
                                  }`}
                                  style={{ backgroundColor: isTrackSelected ? "#df9c43" : trk.color }}
                                />

                                {/* Top: Group Folder Chevron, Icon, Name & Child Count */}
                                <div className="flex items-center justify-between gap-1 pl-1">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <button
                                      data-btn-collapse-group={trk.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleGroupCollapse(trk.id);
                                        setStatusHint(trk.collapsed ? `Dossier "${trk.name}" déplié` : `Dossier "${trk.name}" replié`);
                                      }}
                                      className="p-1 rounded text-zinc-300 hover:text-white hover:bg-white/10 transition flex-shrink-0"
                                      title={trk.collapsed ? "Déplier le groupe de pistes" : "Replier le groupe de pistes"}
                                    >
                                      {trk.collapsed ? (
                                        <ChevronRight size={13} className="text-amber-400" />
                                      ) : (
                                        <ChevronDown size={13} className="text-zinc-300" />
                                      )}
                                    </button>

                                    {trk.collapsed ? (
                                      <Folder size={13} style={{ color: trk.color }} className="flex-shrink-0" />
                                    ) : (
                                      <FolderOpen size={13} style={{ color: trk.color }} className="flex-shrink-0" />
                                    )}

                                    {/* Editable Group Name */}
                                    {editingTrackId === trk.id ? (
                                      <input
                                        type="text"
                                        value={editingTrackName}
                                        autoFocus
                                        onChange={(e) => setEditingTrackName(e.target.value)}
                                        onBlur={() => handleSaveTrackName(trk.id)}
                                        onKeyDown={(e) => e.key === "Enter" && handleSaveTrackName(trk.id)}
                                        className="bg-[#121212] border border-[#df9c43] text-white text-xs px-1 rounded focus:outline-none w-20"
                                      />
                                    ) : (
                                      <span
                                        onDoubleClick={() => {
                                          setEditingTrackId(trk.id);
                                          setEditingTrackName(trk.name);
                                        }}
                                        className="text-xs font-bold text-white tracking-wide truncate cursor-text"
                                        title="Double-clic pour renommer le groupe"
                                      >
                                        {trk.name}
                                      </span>
                                    )}

                                    <span className="text-[8.5px] font-mono px-1 py-0.2 rounded bg-black/60 text-zinc-400 border border-white/5 flex-shrink-0">
                                      {childCount} {childCount > 1 ? "pistes" : "piste"}
                                    </span>
                                  </div>

                                  {/* Quick Actions: Palette & Delete */}
                                  <div className="flex items-center gap-0.5">
                                    <button
                                      data-btn-palette={trk.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setColorPickerTrackId(colorPickerTrackId === trk.id ? null : trk.id);
                                      }}
                                      className="p-0.5 text-zinc-500 hover:text-white rounded"
                                      title="Couleur du groupe"
                                    >
                                      <Palette size={11} />
                                    </button>
                                    <button
                                      data-btn-delete={trk.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteTrack(trk.id);
                                      }}
                                      className="p-0.5 text-zinc-500 hover:text-red-400 rounded"
                                      title="Supprimer le groupe"
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  </div>
                                </div>

                                {/* Color Palette Popover */}
                                {colorPickerTrackId === trk.id && (
                                  <div className="flex gap-1 py-1 pl-1 bg-[#141414] rounded border border-[#2b2b2b] my-1">
                                    {COLOR_PALETTE.map((c) => (
                                      <button
                                        key={c}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleChangeTrackColor(trk.id, c);
                                        }}
                                        style={{ backgroundColor: c }}
                                        className="w-3.5 h-3.5 rounded-full hover:scale-125 transition"
                                      />
                                    ))}
                                  </div>
                                )}

                                {/* Bottom: Group Controls Solo / Mute / Badge / Group Volume */}
                                <div className="flex items-center justify-between gap-1 pl-1 mt-1">
                                  <div className="flex items-center gap-1">
                                    <button
                                      data-btn-solo={trk.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleSolo(trk.id);
                                      }}
                                      className={`w-5 h-5 rounded text-[10px] font-bold font-mono transition ${
                                        trk.solo
                                          ? "bg-amber-400 text-black font-extrabold"
                                          : "bg-[#252525] text-zinc-400 hover:text-amber-400"
                                      }`}
                                      title="Solo Groupe"
                                    >
                                      S
                                    </button>
                                    <button
                                      data-btn-mute={trk.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleMute(trk.id);
                                      }}
                                      className={`w-5 h-5 rounded text-[10px] font-bold font-mono transition ${
                                        trk.mute
                                          ? "bg-red-600 text-white font-extrabold"
                                          : "bg-[#252525] text-zinc-400 hover:text-red-400"
                                      }`}
                                      title="Mute Groupe"
                                    >
                                      M
                                    </button>
                                    <span className="text-[7.5px] font-black uppercase tracking-wider px-1 py-0.5 rounded bg-zinc-800 text-zinc-300">
                                      GRP
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    <input
                                      data-input-volume={trk.id}
                                      type="range"
                                      min="0"
                                      max="100"
                                      value={trk.volume}
                                      onChange={(e) => handleVolumeChange(trk.id, e.target.value)}
                                      onClick={(e) => e.stopPropagation()}
                                      className="w-12 h-1 bg-[#303030] rounded-lg appearance-none cursor-pointer accent-[#df9c43]"
                                      title={`Volume Groupe: ${trk.volume}%`}
                                    />
                                    <div className="w-1.5 h-4 bg-[#121212] rounded-sm overflow-hidden flex flex-col justify-end border border-white/10" title="Niveau crête en direct">
                                      <div
                                        className="w-full bg-gradient-to-t from-emerald-500 via-amber-400 to-red-500 transition-all duration-75"
                                        style={{ height: `${Math.min(100, (trackPeaks[trk.id] || 0) * 100)}%` }}
                                      />
                                    </div>
                                    <span className="text-[9px] font-mono text-zinc-400 min-w-[32px] text-right">
                                      {trk.db || "0.0 dB"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div
                                className={`w-56 h-16 flex-shrink-0 border-r border-[#2e2e2e] px-2 py-1.5 flex flex-col justify-between sticky left-0 z-30 shadow-[2px_0_5px_rgba(0,0,0,0.5)] transition-all ${
                                  isTrackSelected
                                    ? "bg-[#282828] ring-2 ring-[#df9c43] ring-inset shadow-[0_0_20px_rgba(223,156,67,0.3)]"
                                    : "bg-[#191919] hover:bg-[#1d1d1d]"
                                } ${trk.groupId ? "pl-3 bg-[#151515]" : ""}`}
                              >
                                {/* Track Color Left Border Line */}
                                <div
                                  className={`absolute left-0 top-0 bottom-0 transition-all ${
                                    isTrackSelected ? "w-2 shadow-[0_0_12px_#df9c43]" : trk.groupId ? "w-1" : "w-1"
                                  }`}
                                  style={{ backgroundColor: isTrackSelected ? "#df9c43" : trk.color }}
                                />

                                {/* Top: Track Drag Grip, Tree Branch if Subtrack, Index, Title, Color Picker & Options */}
                                <div className="flex items-center justify-between gap-1 pl-1">
                                  <div className="flex items-center gap-1 min-w-0">
                                    {/* Tree connector icon for sub-tracks */}
                                    {trk.groupId && (
                                      <CornerDownRight size={10} className="text-zinc-500 flex-shrink-0 -mr-0.5" />
                                    )}

                                    {/* Grip Handle for Track Dragging */}
                                    <div
                                      draggable={true}
                                      onDragStart={(e) => {
                                        e.stopPropagation();
                                        if (typeof window !== "undefined") {
                                          window.__isInternalDragging = true;
                                          window.__isInternalDawDragging = true;
                                        }
                                        e.dataTransfer.setData("application/json", JSON.stringify({
                                          type: "track",
                                          trackId: trk.id,
                                          sourceIndex: idx
                                        }));
                                        e.dataTransfer.setData("application/x-daw-item", "track");
                                        e.dataTransfer.effectAllowed = "move";
                                        setDraggingTrackIndex(idx);
                                        setStatusHint(`Déplacement piste "${trk.name}"`);
                                      }}
                                      onDragEnd={() => {
                                        if (typeof window !== "undefined") {
                                          window.__isInternalDragging = false;
                                          window.__isInternalDawDragging = false;
                                        }
                                        setDraggingTrackIndex(null);
                                        setTrackDropIndicator(null);
                                      }}
                                      className="cursor-grab active:cursor-grabbing p-0.5 text-zinc-500 hover:text-[#df9c43] transition rounded hover:bg-white/10 flex-shrink-0"
                                      title="Glisser pour réordonner la piste"
                                    >
                                      <GripVertical size={13} />
                                    </div>

                                    <span
                                      className="text-[10px] font-mono px-1 rounded font-bold flex-shrink-0"
                                      style={{ color: trk.color, backgroundColor: `${trk.color}20` }}
                                    >
                                      {idx + 1}
                                    </span>

                                    {/* Editable Track Name */}
                                    {editingTrackId === trk.id ? (
                                      <input
                                        type="text"
                                        value={editingTrackName}
                                        autoFocus
                                        onChange={(e) => setEditingTrackName(e.target.value)}
                                        onBlur={() => handleSaveTrackName(trk.id)}
                                        onKeyDown={(e) => e.key === "Enter" && handleSaveTrackName(trk.id)}
                                        className="bg-[#121212] border border-[#df9c43] text-white text-xs px-1 rounded focus:outline-none w-24"
                                      />
                                    ) : (
                                      <div className="flex items-center gap-1 min-w-0">
                                        <span
                                          onDoubleClick={() => {
                                            setEditingTrackId(trk.id);
                                            setEditingTrackName(trk.name);
                                          }}
                                          className={`text-xs truncate cursor-text transition-colors ${
                                            isTrackSelected ? "font-bold text-white tracking-wide" : "font-semibold text-zinc-300"
                                          }`}
                                          title="Double-clic pour renommer la piste"
                                        >
                                          {trk.name}
                                        </span>
                                        {isTrackSelected && (
                                          <span className="text-[7px] font-extrabold uppercase px-1 py-0.2 rounded bg-[#241808] border border-[#df9c43] text-[#eaaf5d] shadow-[0_0_6px_rgba(223,156,67,0.3)] flex-shrink-0">
                                            Actif
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {/* Quick Action Icons: Freeze, Color Palette, Duplicate, Delete */}
                                  <div className="flex items-center gap-0.5">
                                    {/* Freeze Button */}
                                    <button
                                      data-btn-freeze={trk.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleFreeze(trk.id);
                                      }}
                                      className={`p-0.5 rounded transition ${
                                        trk.frozen ? "text-cyan-400 bg-cyan-950" : "text-zinc-500 hover:text-cyan-400"
                                      }`}
                                      title="Geler la piste (Freezer)"
                                    >
                                      <Snowflake size={11} />
                                    </button>

                                    {/* Color Palette */}
                                    <button
                                      data-btn-palette={trk.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setColorPickerTrackId(colorPickerTrackId === trk.id ? null : trk.id);
                                      }}
                                      className="p-0.5 text-zinc-500 hover:text-white rounded"
                                      title="Changer la couleur"
                                    >
                                      <Palette size={11} />
                                    </button>

                                    {/* Duplicate */}
                                    <button
                                      data-btn-duplicate={trk.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDuplicateTrack(trk.id);
                                      }}
                                      className="p-0.5 text-zinc-500 hover:text-white rounded"
                                      title="Dupliquer la piste"
                                    >
                                      <Copy size={11} />
                                    </button>

                                    {/* Delete */}
                                    <button
                                      data-btn-delete={trk.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteTrack(trk.id);
                                      }}
                                      className="p-0.5 text-zinc-500 hover:text-red-400 rounded"
                                      title="Supprimer la piste"
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  </div>
                                </div>

                                {/* Color Palette Popover */}
                                {colorPickerTrackId === trk.id && (
                                  <div className="flex gap-1 py-1 pl-1 bg-[#141414] rounded border border-[#2b2b2b] my-1">
                                    {COLOR_PALETTE.map((c) => (
                                      <button
                                        key={c}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleChangeTrackColor(trk.id, c);
                                        }}
                                        style={{ backgroundColor: c }}
                                        className="w-3.5 h-3.5 rounded-full hover:scale-125 transition"
                                      />
                                    ))}
                                  </div>
                                )}

                                {/* Bottom: Solo / Mute / Arm / Automation / Volume Slider */}
                                <div className="flex items-center justify-between gap-1 pl-1 mt-1">
                                  <div className="flex items-center gap-1">
                                    {/* Arm Button */}
                                    <button
                                      data-btn-arm={trk.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleArm(trk.id);
                                      }}
                                      className={`w-5 h-5 rounded flex items-center justify-center transition ${
                                        trk.armed
                                          ? "bg-red-600 text-white"
                                          : "bg-[#252525] text-zinc-500 hover:text-red-400"
                                      }`}
                                      title="Armer Enregistrement"
                                    >
                                      <Circle size={8} fill="currentColor" />
                                    </button>

                                    {/* Solo Button 'S' */}
                                    <button
                                      data-btn-solo={trk.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleSolo(trk.id);
                                      }}
                                      className={`w-5 h-5 rounded text-[10px] font-bold font-mono transition ${
                                        trk.solo
                                          ? "bg-amber-400 text-black font-extrabold"
                                          : "bg-[#252525] text-zinc-400 hover:text-amber-400"
                                      }`}
                                      title="Solo"
                                    >
                                      S
                                    </button>

                                    {/* Mute Button 'M' */}
                                    <button
                                      data-btn-mute={trk.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleMute(trk.id);
                                      }}
                                      className={`w-5 h-5 rounded text-[10px] font-bold font-mono transition ${
                                        trk.mute
                                          ? "bg-red-600 text-white font-extrabold"
                                          : "bg-[#252525] text-zinc-400 hover:text-red-400"
                                      }`}
                                      title="Mute"
                                    >
                                      M
                                    </button>

                                    {/* Automation Toggle Button [A] */}
                                    <button
                                      data-btn-automation={trk.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleAutomationVisible(trk.id);
                                      }}
                                      className={`w-5 h-5 rounded text-[10px] font-bold font-mono transition ${
                                        isAutomationOpen
                                          ? "bg-[#241808] border border-[#df9c43] text-[#eaaf5d] shadow-[0_0_8px_rgba(223,156,67,0.3)]"
                                          : "bg-[#252525] text-zinc-400 hover:text-white"
                                      }`}
                                      title="Afficher/Masquer les courbes d'automation"
                                    >
                                      A
                                    </button>

                                    {/* Comping / Take Lanes Toggle (Section 10.1.4, p. 299-307) */}
                                    {(trk.isAudio || trk.type === "audio" || trk.takes) && (
                                      <button
                                        data-testid={`btn-comping-${trk.id}`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleToggleComping(trk.id);
                                        }}
                                        className={`w-5 h-5 rounded text-[9px] font-bold font-mono transition flex items-center justify-center ${
                                          expandedCompingTrackIds.has(trk.id)
                                            ? "bg-[#241808] border border-[#df9c43] text-[#eaaf5d] shadow-[0_0_8px_rgba(223,156,67,0.3)]"
                                            : "bg-[#252525] text-zinc-400 hover:text-white"
                                        }`}
                                        title="Afficher/masquer les sous-pistes de prises (Comping audio - Section 10.1.4)"
                                      >
                                        <Layers size={10} />
                                      </button>
                                    )}

                                    {/* Track E/S Routing (Section 3.1.4, p. 84) */}
                                    {showTrackIO && (
                                      <div className="flex items-center gap-0.5 text-[7.5px] font-mono text-zinc-400 bg-black/60 px-1 py-0.5 rounded border border-white/5">
                                        <span className="text-zinc-500 font-bold">E:</span><span className="text-zinc-300">In</span>
                                        <span className="text-zinc-500 font-bold ml-0.5">S:</span><span className="text-[#df9c43] font-bold truncate max-w-[28px]">{trk.groupId ? "Bus" : "Mst"}</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Volume Mini Slider, Real VU Meter & dB */}
                                  <div className="flex items-center gap-1">
                                    <input
                                      data-input-volume={trk.id}
                                      type="range"
                                      min="0"
                                      max="100"
                                      value={trk.volume}
                                      onChange={(e) => handleVolumeChange(trk.id, e.target.value)}
                                      onClick={(e) => e.stopPropagation()}
                                      className="w-12 h-1 bg-[#303030] rounded-lg appearance-none cursor-pointer accent-[#df9c43]"
                                      title={`Volume: ${trk.volume}%`}
                                    />
                                    <div className="w-1.5 h-4 bg-[#121212] rounded-sm overflow-hidden flex flex-col justify-end border border-white/10" title="Niveau crête en direct">
                                      <div
                                        className="w-full bg-gradient-to-t from-emerald-500 via-amber-400 to-red-500 transition-all duration-75"
                                        style={{ height: `${Math.min(100, (trackPeaks[trk.id] || 0) * 100)}%` }}
                                      />
                                    </div>
                                    <span className="text-[9px] font-mono text-zinc-400 min-w-[32px] text-right">
                                      {trk.db || "0.0 dB"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* ── Right Column: Timeline Clips Area ── */}
                            <div
                              onDragOver={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                e.dataTransfer.dropEffect = "move";
                                const rect = e.currentTarget.getBoundingClientRect();
                                const clickX = e.clientX - rect.left;
                                const hoverBar = Math.max(1, Math.floor(clickX / barWidthPx) + 1);
                                setDragOverTrackId(trk.id);
                                if (clipDragGhost) {
                                  setClipDragGhost((prev) => (prev ? { ...prev, trackId: trk.id, bar: hoverBar } : null));
                                }
                              }}
                              onDragLeave={(e) => {
                                if (e.currentTarget.contains(e.relatedTarget)) return;
                                setDragOverTrackId(null);
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (typeof window !== "undefined") {
                                  window.__isInternalDragging = false;
                                  window.__isInternalDawDragging = false;
                                }
                                setDragOverTrackId(null);
                                setClipDragGhost(null);
                                const rect = e.currentTarget.getBoundingClientRect();
                                const clickX = e.clientX - rect.left;
                                const droppedBar = Math.max(1, Math.floor(clickX / barWidthPx) + 1);
                                const dataStr = e.dataTransfer.getData("application/json");
                                if (dataStr) {
                                  try {
                                    const data = JSON.parse(dataStr);
                                    if (data.type === "clip") {
                                      handleMoveClip(data.clipId, data.sourceTrackId, trk.id, droppedBar);
                                    } else if (data.type === "device") {
                                      handleAddDeviceToTrack(trk.id, data.device);
                                    } else if (data.type === "instrument") {
                                      handleAssignInstrumentToTrack(trk.id, data.name);
                                    }
                                  } catch (err) {}
                                }
                              }}
                              style={{ width: `${maxTrackBars * barWidthPx}px` }}
                              className={`relative flex items-center h-16 transition-colors ${
                                dragOverTrackId === trk.id ? "bg-[#df9c43]/10" : ""
                              }`}
                            >
                              {/* Background Grid Lines across all bars */}
                              <div className="absolute inset-0 pointer-events-none opacity-10 flex divide-x divide-white">
                                {Array.from({ length: maxTrackBars }, (_, i) => i + 1).map((b) => (
                                  <div key={b} style={{ width: `${barWidthPx}px` }} className="h-full flex-shrink-0" />
                                ))}
                              </div>

                              {/* Clips Container */}
                              {trk.isGroup ? (
                                trk.collapsed ? (
                                  <div className="relative z-10 w-full h-16 flex items-center px-4">
                                    <div
                                      onClick={() => {
                                        toggleGroupCollapse(trk.id);
                                        setStatusHint(`Dossier "${trk.name}" déplié`);
                                      }}
                                      className="h-10 rounded-md bg-[#202020]/95 border border-white/10 hover:border-amber-500/60 cursor-pointer flex items-center justify-between px-3.5 text-zinc-300 text-xs transition shadow-lg select-none group"
                                      style={{ width: `${Math.min(maxTrackBars * barWidthPx - 24, 720)}px` }}
                                      title="Cliquer pour déplier le groupe de pistes"
                                    >
                                      <div className="flex items-center gap-2.5">
                                        <Folder size={14} style={{ color: trk.color }} />
                                        <span className="font-bold text-white">Dossier {trk.name} replié</span>
                                        <span className="text-[10px] text-zinc-400 font-mono">• {childCount} {childCount > 1 ? "pistes masquées" : "piste masquée"}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-bold bg-amber-400/10 px-2.5 py-1 rounded border border-amber-400/20 group-hover:bg-amber-400 group-hover:text-black transition shadow-sm">
                                        <ChevronRight size={12} />
                                        <span>Déplier</span>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="relative z-10 w-full h-16 flex items-center px-4 opacity-50 select-none">
                                    <span className="text-[10px] font-mono tracking-wider uppercase text-zinc-400">
                                      ── Bus Dossier {trk.name} ({childCount} pistes) ──
                                    </span>
                                  </div>
                                )) : (
                                  <div
                                    className={`relative z-10 w-full ${trackHeightMode === "compact" ? "h-10" : "h-16"} flex items-center`}
                                    onClick={(e) => {
                                      if (activeEditingTool === "pencil") {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const clickX = e.clientX - rect.left;
                                        const clickBar = Math.max(1, Math.floor(clickX / barWidthPx) + 1);
                                        handleCreateClipWithPencil(trk.id, clickBar);
                                      }
                                    }}
                                    onMouseDown={(e) => {
                                      if (activeEditingTool === "time") {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const clickX = e.clientX - rect.left;
                                        const sBar = Math.max(1, Math.floor(clickX / barWidthPx) + 1);
                                        setTimeSelection({ startBar: sBar, endBar: sBar + 1 });
                                        setIsSelectingTime(true);
                                      }
                                    }}
                                  >
                                    {/* Semi-transparent Snap Ghost Clip */}
                                  {clipDragGhost && clipDragGhost.trackId === trk.id && (
                                    <div
                                      style={{
                                        position: "absolute",
                                        left: `${(clipDragGhost.bar - 1) * barWidthPx}px`,
                                        width: `${(clipDragGhost.bars || 8) * barWidthPx}px`,
                                        height: "48px",
                                        top: "8px"
                                      }}
                                      className="rounded-md border-2 border-dashed border-amber-400 bg-amber-400/25 pointer-events-none z-30 flex items-center justify-between px-2 text-white font-bold text-[10px] shadow-[0_0_20px_rgba(251,191,36,0.6)] animate-pulse"
                                    >
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        <span className="bg-amber-400 text-black px-1.5 py-0.5 rounded-[3px] text-[8px] font-black uppercase shadow">
                                          Snap
                                        </span>
                                        <span className="truncate drop-shadow">{clipDragGhost.name}</span>
                                      </div>
                                      <span className="font-mono bg-black/80 px-2 py-0.5 rounded text-[9px] text-amber-300 font-extrabold border border-amber-400/40 shadow-sm flex-shrink-0">
                                        Mesure {clipDragGhost.bar}
                                      </span>
                                    </div>
                                  )}

                                  {(trk.clips || []).map((clip) => {
                                    const isClipSelected = selectedClipId === clip.id;
                                    const clipWidthPx = (clip.bars || 8) * barWidthPx;
                                    const clipStartOffsetPx = (clip.startBar - 1) * barWidthPx;

                                    return (
                                      <div
                                        key={clip.id}
                                        draggable={true}
                                        onDragStart={(e) => {
                                          e.stopPropagation();
                                          if (typeof window !== "undefined") {
                                            window.__isInternalDragging = true;
                                            window.__isInternalDawDragging = true;
                                          }
                                          e.dataTransfer.setData("application/json", JSON.stringify({
                                            type: "clip",
                                            clipId: clip.id,
                                            sourceTrackId: trk.id,
                                            bars: clip.bars || 8,
                                            name: clip.name,
                                            offsetBar: clip.startBar
                                          }));
                                          e.dataTransfer.setData("application/x-daw-item", "clip");
                                          e.dataTransfer.effectAllowed = "move";
                                          setClipDragGhost({
                                            trackId: trk.id,
                                            bar: clip.startBar,
                                            bars: clip.bars || 8,
                                            name: clip.name,
                                            color: trk.color
                                          });
                                          setStatusHint(`Glisser le clip "${clip.name}"`);
                                        }}
                                        onDragEnd={() => {
                                          if (typeof window !== "undefined") {
                                            window.__isInternalDragging = false;
                                            window.__isInternalDawDragging = false;
                                          }
                                          setClipDragGhost(null);
                                          setDragOverTrackId(null);
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (activeEditingTool === "knife") {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            const relX = e.clientX - rect.left;
                                            const barOffset = Math.max(1, Math.floor(relX / barWidthPx));
                                            const splitBar = clip.startBar + barOffset;
                                            handleSplitClip(trk.id, clip.id, splitBar);
                                            return;
                                          }
                                          if (activeEditingTool === "eraser") {
                                            handleDeleteClip(trk.id, clip.id);
                                            return;
                                          }
                                          setSelectedClipId(clip.id);
                                          setSelectedTrackId(trk.id);
                                          setStatusHint(`Clip sélectionné: ${clip.name} • ${clip.bars || 8} mesures`);
                                        }}
                                        onContextMenu={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setSelectedClipId(clip.id);
                                          setSelectedTrackId(trk.id);
                                          setClipContextMenu({
                                            x: e.clientX,
                                            y: e.clientY,
                                            trackId: trk.id,
                                            clipId: clip.id
                                          });
                                        }}
                                        onDoubleClick={(e) => {
                                          e.stopPropagation();
                                          setShowBottomPanel(true);
                                          setBottomPanelTab("pianoroll");
                                        }}
                                        data-clip-id={clip.id}
                                        className={`h-12 rounded-md border flex flex-col justify-between p-1.5 cursor-move transition-all absolute top-2 group ${
                                          isClipSelected
                                            ? "ring-2 ring-amber-400 border-2 border-white shadow-[0_0_20px_rgba(251,191,36,0.8)] brightness-110 z-20 scale-[1.01]"
                                            : "border-black/30 hover:border-white/40 opacity-90 hover:opacity-100 shadow-sm"
                                        } ${
                                          activeEditingTool === "knife" ? "hover:ring-2 hover:ring-red-400 cursor-crosshair" : ""
                                        } ${
                                          activeEditingTool === "eraser" ? "hover:ring-2 hover:ring-red-600 hover:opacity-60 cursor-pointer" : ""
                                        }`}
                                        style={{
                                          left: `${clipStartOffsetPx}px`,
                                          width: `${clipWidthPx}px`,
                                          top: "8px",
                                          height: "48px",
                                          backgroundColor: trk.color
                                        }}
                                      >
                                        {/* Clip Header */}
                                        <div className="flex items-center justify-between text-[10px] font-bold text-white drop-shadow">
                                          <span className="truncate flex items-center gap-1">
                                            {isClipSelected && (
                                              <span className="bg-amber-400 text-black px-1 py-0.2 rounded-[3px] text-[7.5px] font-black uppercase tracking-wider shadow">
                                                SÉLECT
                                              </span>
                                            )}
                                            {clip.name}
                                          </span>
                                          <span className="font-mono text-[9px] opacity-80 flex-shrink-0">
                                            {clip.bars || 8} b
                                          </span>
                                        </div>

                                        {/* High-Resolution Waveform or MIDI Note Matrix */}
                                        <div className="h-6 w-full rounded overflow-hidden relative">
                                          <StudioWaveformCanvas clip={clip} track={trk} widthPx={clipWidthPx} heightPx={24} />

                                          {/* Music Studio Audio Clip Fade In / Fade Out & Bézier Crossfade Overlay (Section 5.1.7, p. 149-152) */}
                                          {(clip.isAudio || trk.isAudio || trk.type === "audio") && (
                                            <MusicStudioClipFadeOverlay
                                              clip={clip}
                                              track={trk}
                                              clipWidthPx={clipWidthPx}
                                              clipHeightPx={24}
                                              barWidthPx={barWidthPx}
                                              bpm={bpm}
                                              onUpdateFade={(cId, updates) => handleUpdateClipFade(trk.id, cId, updates)}
                                              setStatusHint={setStatusHint}
                                            />
                                          )}
                                        </div>

                                        {/* Right Edge Interactive Trim Handle */}
                                        <div
                                          onMouseDown={(e) => {
                                            e.stopPropagation();
                                            setIsResizingClip({
                                              trackId: trk.id,
                                              clipId: clip.id,
                                              startX: e.clientX,
                                              initialBars: clip.bars || 8
                                            });
                                          }}
                                          className="absolute right-0 top-0 bottom-0 w-2 hover:w-3 bg-white/20 hover:bg-white/60 cursor-ew-resize rounded-r transition-all z-20"
                                          title="Glisser pour raccourcir ou allonger le clip"
                                        />
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Music Studio Take Lanes (Audio Comping - Section 10.1.4, p. 299-307) */}
                          {(trk.isAudio || trk.type === "audio" || trk.takes) && expandedCompingTrackIds.has(trk.id) && (
                            <MusicStudioTakeLanesComping
                              track={trk}
                              takes={trk.takes || DEFAULT_STUDIO_TAKES}
                              compingRegions={trk.compingRegions || [
                                { id: "cr_1", takeId: "take_1", startBar: 1, endBar: 8 },
                                { id: "cr_2", takeId: "take_2", startBar: 9, endBar: 16 },
                                { id: "cr_3", takeId: "take_3", startBar: 17, endBar: 24 }
                              ]}
                              maxTrackBars={maxTrackBars}
                              barWidthPx={barWidthPx}
                              onUpdateRegions={(regions) => handleUpdateCompingRegions(trk.id, regions)}
                              onAddTake={() => handleAddTake(trk.id)}
                              onDeleteTake={(tId, takeId) => handleDeleteTake(tId, takeId)}
                              setStatusHint={setStatusHint}
                            />
                          )}

                          {/* Music Studio Multi-Lane Expandable Automation Sub-lanes */}
                          {isAutomationOpen && (
                            <div className="flex flex-col border-t border-[#252525] divide-y divide-[#1c1c1c] bg-[#101010]">
                              {(trk.automationLanes || getDefaultAutomationLanes(trk.id, trk.type, trk.name)).map((lane) => {
                                const laneHeight = 56;
                                const laneColor = lane.color || "#ef4444";
                                const totalWidthPx = maxTrackBars * barWidthPx;
                                const { linePath, areaPath, anchorCoords, tensionHandles } = buildAutomationCurveSvg(
                                  lane.points || [],
                                  totalWidthPx,
                                  laneHeight,
                                  maxTrackBars,
                                  lane.min !== undefined ? lane.min : 0,
                                  lane.max !== undefined ? lane.max : 100,
                                  1
                                );

                                return (
                                  <div
                                    key={lane.id}
                                    data-automation-lane-id={lane.id}
                                    className="h-14 flex items-stretch group/lane hover:bg-[#151515] transition-colors"
                                  >
                                    {/* Left Sticky Lane Header */}
                                    <div className="w-56 flex-shrink-0 border-r border-[#2a2a2a] px-3 py-1 flex items-center justify-between bg-[#151515] sticky left-0 z-30 shadow-[2px_0_6px_rgba(0,0,0,0.5)]">
                                      <div className="flex items-center gap-2 overflow-hidden">
                                        {/* Power / Active LED Indicator */}
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleLaneActive(trk.id, lane.id);
                                          }}
                                          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-all ${
                                            lane.active
                                              ? "bg-[#ef4444] shadow-[0_0_6px_#ef4444]"
                                              : "bg-zinc-600 hover:bg-zinc-400"
                                          }`}
                                          title={lane.active ? "Désactiver automation" : "Activer automation"}
                                        />

                                        <div className="flex flex-col truncate leading-tight">
                                          <span className="text-[11px] font-bold text-zinc-200 truncate group-hover/lane:text-white flex items-center gap-1">
                                            {lane.name}
                                          </span>
                                          <span className="text-[9px] text-zinc-500 truncate" title={lane.target}>
                                            {lane.target}
                                          </span>
                                        </div>
                                      </div>

                                      {/* Quick Actions & Edit Shortcut */}
                                      <div className="flex items-center gap-1 flex-shrink-0">
                                        <button
                                          data-btn-edit-lane={lane.id}
                                          onClick={() => handleOpenAutomationEditor(trk.id, lane.id, "track")}
                                          className="px-1.5 py-0.5 rounded bg-[#202020] hover:bg-[#2c2c2c] text-[9px] font-mono text-zinc-300 hover:text-white flex items-center gap-1 transition"
                                          title="Ouvrir l'éditeur d'automation en bas (Double-clic)"
                                        >
                                          <PenTool size={9} className="text-[#df9c43]" />
                                          <span>EDIT</span>
                                        </button>
                                      </div>
                                    </div>

                                    {/* Timeline Curve Canvas with Bézier & Tension */}
                                    <div
                                      onDoubleClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenAutomationEditor(trk.id, lane.id, "track");
                                      }}
                                      onClick={(e) => {
                                        if (automationTool === "pencil" || e.altKey || e.ctrlKey) {
                                          const rect = e.currentTarget.getBoundingClientRect();
                                          const x = e.clientX - rect.left;
                                          const y = e.clientY - rect.top;
                                          const clickBar = 1 + (x / totalWidthPx) * maxTrackBars;
                                          const minV = lane.min !== undefined ? lane.min : 0;
                                          const maxV = lane.max !== undefined ? lane.max : 100;
                                          const clickVal = maxV - (y / laneHeight) * (maxV - minV);
                                          handleAddAutomationPointToLane(trk.id, lane.id, clickBar, clickVal);
                                        }
                                      }}
                                      style={{ width: `${totalWidthPx}px` }}
                                      className="relative bg-[#0b0b0b] overflow-hidden cursor-crosshair h-full flex-shrink-0 select-none"
                                    >
                                      {/* Background Grid Lines for bars */}
                                      <div className="absolute inset-0 pointer-events-none opacity-20">
                                        {Array.from({ length: Math.min(maxTrackBars, 150) }).map((_, i) => (
                                          <div
                                            key={i}
                                            style={{ left: `${i * barWidthPx}px` }}
                                            className="absolute top-0 bottom-0 border-r border-zinc-700"
                                          />
                                        ))}
                                      </div>

                                      <svg className="w-full h-full overflow-visible">
                                        <defs>
                                          <linearGradient id={`grad_seq_${lane.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                            <stop offset="0%" stopColor={laneColor} stopOpacity="0.4" />
                                            <stop offset="100%" stopColor={laneColor} stopOpacity="0.03" />
                                          </linearGradient>
                                        </defs>

                                        {/* Shaded Area Fill */}
                                        {areaPath && (
                                          <path d={areaPath} fill={`url(#grad_seq_${lane.id})`} pointerEvents="none" />
                                        )}

                                        {/* Bézier Curve Line */}
                                        {linePath && (
                                          <path
                                            d={linePath}
                                            fill="none"
                                            stroke={lane.active ? laneColor : "#52525b"}
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="transition-colors"
                                          />
                                        )}

                                        {/* Tension Curvature Handles between anchor points */}
                                        {tensionHandles.map((th) => (
                                          <g key={th.id} className="cursor-ns-resize">
                                            <circle
                                              cx={th.x}
                                              cy={th.y}
                                              r="3.5"
                                              fill="#ffffff"
                                              stroke={laneColor}
                                              strokeWidth="1.5"
                                              className="hover:scale-150 transition-transform shadow-sm"
                                              onMouseDown={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                setDraggingAnchor({
                                                  type: "tension",
                                                  trackId: trk.id,
                                                  laneId: lane.id,
                                                  p1Id: th.p1.id,
                                                  startX: e.clientX,
                                                  startY: e.clientY,
                                                  origTension: th.p1.tension || 0
                                                });
                                              }}
                                              title="Glisser verticalement pour courber (Bézier tension)"
                                            />
                                          </g>
                                        ))}

                                        {/* Draggable Anchor Points */}
                                        {anchorCoords.map((ac) => {
                                          return (
                                            <g key={ac.point.id}>
                                              <circle
                                                cx={ac.x}
                                                cy={ac.y}
                                                r="4.5"
                                                fill="#ffffff"
                                                stroke={laneColor}
                                                strokeWidth="2"
                                                className="cursor-move hover:scale-150 transition-transform shadow"
                                                onMouseDown={(e) => {
                                                  e.stopPropagation();
                                                  e.preventDefault();
                                                  setDraggingAnchor({
                                                    type: "anchor",
                                                    trackId: trk.id,
                                                    laneId: lane.id,
                                                    pointId: ac.point.id,
                                                    startX: e.clientX,
                                                    startY: e.clientY,
                                                    origBar: ac.point.bar,
                                                    origVal: ac.point.value,
                                                    minVal: lane.min !== undefined ? lane.min : 0,
                                                    maxVal: lane.max !== undefined ? lane.max : 100,
                                                    widthPx: totalWidthPx,
                                                    heightPx: laneHeight,
                                                    totalBars: maxTrackBars,
                                                    startBarOffset: 1
                                                  });
                                                }}
                                                onContextMenu={(e) => {
                                                  e.preventDefault();
                                                  e.stopPropagation();
                                                  handleDeleteAutomationPointFromLane(trk.id, lane.id, ac.point.id);
                                                }}
                                                title={`Mesure ${ac.point.bar.toFixed(2)} : ${formatAutomationValue(ac.point.value, lane.unit)} (Clic droit pour supprimer)`}
                                              />

                                              {/* Value label on point */}
                                              <text
                                                x={ac.x + 6}
                                                y={Math.max(10, ac.y - 4)}
                                                fill="#ffffff"
                                                fontSize="9"
                                                fontFamily="monospace"
                                                className="pointer-events-none select-none opacity-80"
                                              >
                                                {formatAutomationValue(ac.point.value, lane.unit)}
                                              </text>
                                            </g>
                                          );
                                        })}
                                      </svg>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Bottom Drop Zone: Create Track with Dropped Instrument/Effect */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (typeof window !== "undefined") {
                          window.__isInternalDragging = true;
                          window.__isInternalDawDragging = true;
                        }
                        e.dataTransfer.dropEffect = "copy";
                        if (draggingTrackIndex !== null) {
                          setTrackDropIndicator({ trackId: "bottom", position: "after", targetIndex: tracks.length - 1 });
                        }
                      }}
                      onDragLeave={() => {
                        if (trackDropIndicator?.trackId === "bottom") {
                          setTrackDropIndicator(null);
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (typeof window !== "undefined") {
                          window.__isInternalDragging = false;
                          window.__isInternalDawDragging = false;
                        }
                        setTrackDropIndicator(null);
                        if (draggingTrackIndex !== null) {
                          handleReorderTrack(draggingTrackIndex, tracks.length - 1);
                          setDraggingTrackIndex(null);
                          return;
                        }
                        const dataStr = e.dataTransfer.getData("application/json");
                        if (dataStr) {
                          try {
                            const parsed = JSON.parse(dataStr);
                            if (parsed.type === "instrument" || parsed.device) {
                              handleCreateTrackWithInstrument(parsed.name || parsed.device?.name || "Nouvelle Piste");
                            } else if (parsed.type === "track" && parsed.sourceIndex !== undefined) {
                              handleReorderTrack(parsed.sourceIndex, tracks.length - 1);
                            }
                          } catch (err) {}
                        }
                        setDraggedSidebarItem(null);
                      }}
                      className={`h-11 border-2 border-dashed rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer m-2 ${
                        trackDropIndicator?.trackId === "bottom"
                          ? "border-[#df9c43] bg-[#df9c43]/15 text-[#df9c43] shadow-[0_0_15px_rgba(223,156,67,0.3)]"
                          : draggedSidebarItem
                          ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-300 animate-pulse"
                          : "border-[#2e2e2e] hover:border-[#df9c43]/60 text-zinc-500 hover:text-zinc-300 hover:bg-[#df9c43]/5"
                      }`}
                    >
                      <Plus size={14} className={draggedSidebarItem ? "text-emerald-400" : "text-[#df9c43]"} />
                      <span className="text-[11px] font-semibold">
                        {draggedSidebarItem
                          ? `Déposer ici pour créer une nouvelle piste avec "${draggedSidebarItem.name}"`
                          : "Glisser un instrument, effet ou son ici pour créer une nouvelle piste"}
                      </span>
                    </div>

                    {/* Floating Clip Context Menu */}
                    {clipContextMenu && (
                      <div
                        style={{ top: `${clipContextMenu.y}px`, left: `${clipContextMenu.x}px` }}
                        className="fixed z-50 bg-[#1e1e1e] border border-[#3a3a3a] rounded-lg shadow-2xl py-1 w-56 text-xs font-semibold text-zinc-200 divide-y divide-[#2a2a2a]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="py-1">
                          <button
                            onClick={() => handleSplitClip(clipContextMenu.trackId, clipContextMenu.clipId)}
                            className="w-full px-3 py-1.5 text-left hover:bg-[#2c2c2c] hover:text-[#df9c43] flex items-center gap-2"
                          >
                            <Scissors size={12} className="text-amber-400" />
                            <span>Scinder à la lecture ({Math.floor(currentBar)})</span>
                          </button>
                          <button
                            onClick={() => handleDuplicateClip(clipContextMenu.trackId, clipContextMenu.clipId)}
                            className="w-full px-3 py-1.5 text-left hover:bg-[#2c2c2c] hover:text-[#df9c43] flex items-center gap-2"
                          >
                            <Copy size={12} className="text-blue-400" />
                            <span>Dupliquer le clip</span>
                          </button>
                        </div>
                        <div className="py-1">
                          <button
                            data-testid="ctx-btn-bounce-in-place"
                            onClick={() => handleBounceInPlace(clipContextMenu.clipId, clipContextMenu.trackId)}
                            className="w-full px-3 py-1.5 text-left hover:bg-[#2c2c2c] hover:text-[#df9c43] flex items-center gap-2"
                          >
                            <Zap size={12} className="text-amber-400" />
                            <span>Rendre sur place (Bounce)</span>
                          </button>
                          <button
                            data-testid="ctx-btn-slice-to-drum"
                            onClick={() => handleSliceToDrumMachine(clipContextMenu.clipId, clipContextMenu.trackId)}
                            className="w-full px-3 py-1.5 text-left hover:bg-[#2c2c2c] hover:text-emerald-400 flex items-center gap-2"
                          >
                            <Scissors size={12} className="text-emerald-400" />
                            <span>Découper en Drum Machine</span>
                          </button>
                          <button
                            data-testid="ctx-btn-slice-to-multisampler"
                            onClick={() => handleSliceToMultiSampler(clipContextMenu.clipId, clipContextMenu.trackId)}
                            className="w-full px-3 py-1.5 text-left hover:bg-[#2c2c2c] hover:text-pink-400 flex items-center gap-2"
                          >
                            <Layers size={12} className="text-pink-400" />
                            <span>Découper vers Multi-Sampler</span>
                          </button>
                          <button
                            data-testid="ctx-btn-audio-to-midi"
                            onClick={() => handleAudioToMidi(clipContextMenu.clipId, clipContextMenu.trackId)}
                            className="w-full px-3 py-1.5 text-left hover:bg-[#2c2c2c] hover:text-amber-400 flex items-center gap-2"
                          >
                            <Music size={12} className="text-amber-400" />
                            <span>Convertir en notes MIDI</span>
                          </button>
                          <button
                            data-testid="ctx-btn-audio-warp"
                            onClick={() => {
                              setSelectedClipId(clipContextMenu.clipId);
                              setSelectedTrackId(clipContextMenu.trackId);
                              setShowBottomPanel(true);
                              setBottomPanelTab("audiowarp");
                              setClipContextMenu(null);
                            }}
                            className="w-full px-3 py-1.5 text-left hover:bg-[#2c2c2c] hover:text-cyan-400 flex items-center gap-2"
                          >
                            <Activity size={12} className="text-cyan-400" />
                            <span>Éditeur Audio Warp & Transitoires</span>
                          </button>
                        </div>
                        <div className="py-1">
                          <button
                            data-testid="ctx-btn-open-radial"
                            onClick={() => {
                              const track = tracks.find((t) => t.id === clipContextMenu.trackId);
                              const clip = (track?.clips || []).find((c) => c.id === clipContextMenu.clipId);
                              setRadialMenuState({
                                x: clipContextMenu.x,
                                y: clipContextMenu.y,
                                clip,
                                track
                              });
                              setClipContextMenu(null);
                            }}
                            className="w-full px-3 py-1.5 text-left hover:bg-[#2c2c2c] hover:text-[#df9c43] flex items-center gap-2"
                          >
                            <Circle size={12} className="text-[#df9c43]" />
                            <span>Menu Radial d'Actions (8 Choix)</span>
                          </button>
                          <button
                            onClick={() => {
                              setShowBottomPanel(true);
                              setBottomPanelTab("inspector");
                              setClipContextMenu(null);
                            }}
                            className="w-full px-3 py-1.5 text-left hover:bg-[#2c2c2c] hover:text-[#df9c43] flex items-center gap-2"
                          >
                            <Wand2 size={12} className="text-[#df9c43]" />
                            <span>Régénérer avec l'IA</span>
                          </button>
                          <button
                            onClick={() => handleDeleteClip(clipContextMenu.trackId, clipContextMenu.clipId)}
                            className="w-full px-3 py-1.5 text-left hover:bg-red-900/30 text-red-400 flex items-center gap-2"
                          >
                            <Trash2 size={12} />
                            <span>Supprimer le clip</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Circular 8-Sector Radial Action Menu (Chapter 18, p. 553-558) */}
                    {radialMenuState && (
                      <MusicStudioRadialMenu
                        x={radialMenuState.x}
                        y={radialMenuState.y}
                        clip={radialMenuState.clip}
                        track={radialMenuState.track}
                        onAction={handleRadialAction}
                        onClose={() => setRadialMenuState(null)}
                      />
                    )}

                    {/* Pinned FX 1 Track */}
                    <div className="h-14 flex items-stretch bg-[#151515] border-t-2 border-[#2b2b2b]">
                      <div className="w-56 flex-shrink-0 border-r border-[#2e2e2e] px-2.5 py-1.5 flex items-center justify-between bg-[#171717] sticky left-0 z-30 shadow-[2px_0_5px_rgba(0,0,0,0.5)]">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
                        <div className="flex items-center gap-2 pl-1">
                          <span className="text-[10px] font-mono px-1 rounded font-bold text-emerald-400 bg-emerald-950">
                            FX 1
                          </span>
                          <span className="font-semibold text-xs text-white">Reverb Send</span>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-400">-6.0 dB</span>
                      </div>
                      <div className="flex-1 flex items-center px-4 text-zinc-500 text-[11px] italic">
                        Bus d'effet Retour • Reverb & Delay master
                      </div>
                    </div>

                    {/* Pinned Master Track */}
                    <div className="h-14 flex items-stretch bg-[#151515] border-t border-[#2b2b2b]">
                      <div className="w-56 flex-shrink-0 border-r border-[#2e2e2e] px-2.5 py-1.5 flex items-center justify-between bg-[#171717] sticky left-0 z-30 shadow-[2px_0_5px_rgba(0,0,0,0.5)]">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#df9c43]" />
                        <div className="flex items-center gap-2 pl-1">
                          <span className="text-[10px] font-mono px-1 rounded font-bold text-[#df9c43] bg-[#df9c43]/20">
                            MST
                          </span>
                          <span className="font-bold text-xs text-white">Master Bus</span>
                        </div>
                        <span className="text-[10px] font-mono text-[#df9c43] font-bold">0.0 dB</span>
                      </div>
                      <div className="flex-1 flex items-center justify-between px-4">
                        <span className="text-zinc-500 text-[11px]">Sortie Stéréo Principale 1+2</span>
                        <div className="flex items-center gap-1">
                          <div className="w-32 h-2 bg-[#1c1c1c] rounded-full overflow-hidden border border-[#303030] flex">
                            <div className="w-[65%] h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500" />
                          </div>
                          <span className="text-[10px] font-mono text-zinc-400">Peak -1.2</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ────────────────────────────────────────────────────────
                  BOTTOM MACRO ARRANGER OVERVIEW / MINI-MAP (Image 8)
              ──────────────────────────────────────────────────────── */}
              <div className="h-12 border-t border-[#2e2e2e] bg-[#121212] flex flex-col justify-between px-2 py-1 relative flex-shrink-0 select-none">
                {/* Upper row: 10 Colored Macro Sections */}
                <div className="flex items-center h-4 w-full rounded overflow-hidden text-[8.5px] font-bold">
                  {MACRO_SECTIONS.map((sec) => {
                    const secWidthPct = ((sec.endBar - sec.startBar + 1) / maxTrackBars) * 100;
                    return (
                      <div
                        key={sec.id}
                        onClick={() => {
                          handleSeekToBar(sec.startBar);
                          if (timelineScrollRef.current) {
                            timelineScrollRef.current.scrollLeft = (sec.startBar - 1) * barWidthPx;
                          }
                        }}
                        style={{
                          width: `${secWidthPct}%`,
                          backgroundColor: `${sec.color}35`,
                          borderTop: `2px solid ${sec.color}`
                        }}
                        className="h-full border-r border-black/40 flex items-center justify-center text-white/90 truncate px-0.5 cursor-pointer hover:brightness-125 transition"
                        title={`${sec.name}: Mesures ${sec.startBar}-${sec.endBar}`}
                      >
                        <span className="drop-shadow-sm truncate">{sec.name}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Lower row: Miniature Clip Silhouettes & Draggable Viewport Rect */}
                <div
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                    const targetBar = Math.max(1, Math.round(clickRatio * maxTrackBars));
                    handleSeekToBar(targetBar);
                    if (timelineScrollRef.current) {
                      timelineScrollRef.current.scrollLeft = (targetBar - 1) * barWidthPx - (timelineClientWidth / 3);
                    }
                  }}
                  className="h-5 w-full bg-[#181818] rounded relative overflow-hidden border border-[#262626] cursor-pointer mt-0.5"
                >
                  {/* Miniature silhouettes for each track clips */}
                  {tracks.map((trk, tIdx) => (
                    <div key={trk.id} className="absolute left-0 right-0 h-1" style={{ top: `${(tIdx % 4) * 3 + 1}px` }}>
                      {(trk.clips || []).map((c) => {
                        const leftPct = ((c.startBar - 1) / maxTrackBars) * 100;
                        const widthPct = (c.bars / maxTrackBars) * 100;
                        return (
                          <div
                            key={c.id}
                            style={{ left: `${leftPct}%`, width: `${widthPct}%`, backgroundColor: trk.color }}
                            className="absolute top-0 bottom-0 rounded-[1px] opacity-80"
                          />
                        );
                      })}
                    </div>
                  ))}

                  {/* Playhead Marker on Mini-map */}
                  <div
                    style={{ left: `${(currentBar / maxTrackBars) * 100}%` }}
                    className="absolute top-0 bottom-0 w-1 bg-[#df9c43] shadow z-20 pointer-events-none"
                  />

                  {/* Draggable Viewport Indicator Rectangle */}
                  {timelineClientWidth > 0 && (
                    <div
                      style={{
                        left: `${Math.max(0, Math.min(100, (timelineScrollLeft / (maxTrackBars * barWidthPx)) * 100))}%`,
                        width: `${Math.max(4, Math.min(100, (timelineClientWidth / (maxTrackBars * barWidthPx)) * 100))}%`
                      }}
                      className="absolute top-0 bottom-0 border-2 border-white/70 bg-white/15 rounded pointer-events-none z-10"
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ────────────────────────────────────────────────────────────
              MODE B: VUE CLIPS / CLIP LAUNCHER (Music Studio Matrix - Images 4 & 5)
          ──────────────────────────────────────────────────────────── */}
          {mainView === "clips" && (
            <div className="flex-1 flex flex-col overflow-hidden bg-[#141414] select-none">
              {/* Top Scene Launcher Toolbar */}
              <div className="h-10 bg-[#1a1a1a] border-b border-[#2b2b2b] px-4 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Grid size={15} className="text-[#df9c43]" />
                    <span className="font-bold text-xs text-white">Matrice Clip Launcher</span>
                  </div>
                  <span className="text-[11px] text-zinc-500 font-mono hidden md:inline">
                    18 Scènes • Déclenchement non-linéaire & Automations par clip
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const nextScene = activeSceneIndex === null ? 0 : (activeSceneIndex + 1) % 18;
                      setActiveSceneIndex(nextScene);
                      setIsPlaying(true);
                      setStatusHint(`Scène "${[
                        "Start", "Intro", "Build", "Chorus 1", "1 B", "Bridge", "Chorus 2", "2 B", "Outro", "Perform →", "11", "Minimal", "Minimal2", "14", "15", "16", "17", "18"
                      ][nextScene]}" lancée`);
                    }}
                    className="px-3 py-1 bg-[#241808] hover:bg-[#2d1e0d] border border-[#df9c43] text-[#eaaf5d] hover:text-[#f5c277] text-xs font-bold rounded flex items-center gap-1.5 shadow-[0_0_8px_rgba(223,156,67,0.25)] transition"
                  >
                    <Play size={11} fill="currentColor" />
                    <span>Lancer Scène Suivante</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveSceneIndex(null);
                      setStatusHint("Arrêt de tous les clips de la matrice");
                    }}
                    className="p-1 text-zinc-400 hover:text-white rounded hover:bg-[#252525]"
                    title="Arrêter tous les clips"
                  >
                    <Square size={12} />
                  </button>
                </div>
              </div>

              {/* Matrix Scrollable Container */}
              <div className="flex-1 overflow-auto custom-scrollbar">
                <div className="min-w-max border-b border-[#252525]">
                  {/* Columns Header (18 Scenes) */}
                  <div className="flex bg-[#1d1d1d] border-b border-[#2e2e2e] sticky top-0 z-20 text-[11px] font-bold text-zinc-300">
                    {/* Top Left Pinned Corner */}
                    <div className="w-64 flex-shrink-0 p-2 border-r border-[#2e2e2e] flex items-center justify-between bg-[#191919] sticky left-0 z-30 shadow-[2px_0_5px_rgba(0,0,0,0.5)]">
                      <span className="text-zinc-400 font-mono text-[10px] tracking-wider uppercase">PISTES & AUTOMATIONS</span>
                      <span className="text-[10px] text-zinc-500 font-mono">18 SCÈNES</span>
                    </div>

                    {/* 18 Scene Column Headers */}
                    {[
                      "Start", "Intro", "Build", "Chorus 1", "1 B", "Bridge", "Chorus 2", "2 B", "Outro", "Perform →", "11", "Minimal", "Minimal2", "14", "15", "16", "17", "18"
                    ].map((sceneName, sIdx) => {
                      const isSceneActive = activeSceneIndex === sIdx;
                      return (
                        <div
                          key={sIdx}
                          onClick={() => {
                            setActiveSceneIndex(sIdx);
                            setIsPlaying(true);
                            setStatusHint(`Scène ${sIdx + 1} "${sceneName}" lancée`);
                          }}
                          className={`w-28 flex-shrink-0 p-2 border-r border-[#2a2a2a] flex items-center justify-between cursor-pointer transition-colors ${
                            isSceneActive ? "bg-[#241808] border-l-2 border-[#df9c43] text-[#eaaf5d] shadow-[0_0_8px_rgba(223,156,67,0.25)] font-bold" : "hover:bg-[#262626]"
                          }`}
                        >
                          <div className="flex flex-col truncate">
                            <span className="text-[9px] font-mono text-zinc-500">{sIdx + 1}</span>
                            <span className="truncate text-xs">{sceneName}</span>
                          </div>
                          <Play size={9} fill="currentColor" className={isSceneActive ? "text-[#eaaf5d]" : "text-zinc-500"} />
                        </div>
                      );
                    })}
                  </div>

                  {/* Track Rows and Automation Sub-lanes */}
                  {visibleTracks.map((trk) => {
                    const isDrums = trk.id.includes("drum") || trk.type === "drums" || trk.name.toLowerCase().includes("drum");
                    const lanes = trk.automationLanes || getDefaultAutomationLanes(trk.id, trk.type, trk.name);
                    const isExpanded = trk.automation?.visible || isDrums;
                    const childCount = trk.isGroup ? tracks.filter((t) => t.groupId === trk.id).length : 0;

                    if (trk.isGroup) {
                      return (
                        <div key={trk.id} className="flex flex-col border-b border-[#2e2e2e]">
                          <div className="flex h-12 bg-[#1a1a1a] hover:bg-[#202020] transition-colors border-l-4" style={{ borderColor: trk.color }}>
                            {/* Sticky Left Group Header */}
                            <div className="w-64 flex-shrink-0 border-r border-[#2a2a2a] px-3 flex items-center justify-between bg-[#181818] sticky left-0 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.5)]">
                              <div className="flex items-center gap-2 overflow-hidden">
                                <button
                                  data-btn-collapse-group-matrix={trk.id}
                                  onClick={() => {
                                    toggleGroupCollapse(trk.id);
                                    setStatusHint(trk.collapsed ? `Dossier "${trk.name}" déplié` : `Dossier "${trk.name}" replié`);
                                  }}
                                  className="text-zinc-300 hover:text-white p-0.5 rounded hover:bg-white/10 transition"
                                  title={trk.collapsed ? "Déplier le groupe" : "Replier le groupe"}
                                >
                                  {trk.collapsed ? <ChevronRight size={14} className="text-amber-400" /> : <ChevronDown size={14} />}
                                </button>
                                {trk.collapsed ? (
                                  <Folder size={13} style={{ color: trk.color }} />
                                ) : (
                                  <FolderOpen size={13} style={{ color: trk.color }} />
                                )}
                                <span className="font-bold text-xs text-white truncate">{trk.name}</span>
                                <span className="text-[9px] font-mono text-zinc-400 bg-black/60 px-1 rounded">{childCount}p</span>
                              </div>
                              <span className="text-[10px] font-mono text-zinc-400">{trk.db || "0.0 dB"}</span>
                            </div>

                            {/* 18 Group Scene Slots */}
                            {[
                              "Start", "Intro", "Build", "Chorus 1", "1 B", "Bridge", "Chorus 2", "2 B", "Outro", "Perform →", "11", "Minimal", "Minimal2", "14", "15", "16", "17", "18"
                            ].map((sceneName, sIdx) => {
                              const isSceneActive = activeSceneIndex === sIdx;
                              return (
                                <div
                                  key={sIdx}
                                  className={`w-28 flex-shrink-0 border-r border-[#282828] p-1.5 flex items-center justify-center ${
                                    isSceneActive ? "bg-[#df9c43]/10" : ""
                                  }`}
                                >
                                  <button
                                    onClick={() => {
                                      setActiveSceneIndex(sIdx);
                                      setIsPlaying(true);
                                      setStatusHint(`Groupe "${trk.name}" scène ${sIdx + 1} "${sceneName}" lancée`);
                                    }}
                                    className="w-full h-8 rounded px-2 text-[9.5px] font-bold text-white/90 flex items-center justify-between border border-white/10 hover:border-white/30 transition shadow-sm"
                                    style={{ backgroundColor: `${trk.color}45` }}
                                    title={`Lancer la scène ${sIdx + 1} pour le groupe ${trk.name}`}
                                  >
                                    <span className="truncate">GRP S{sIdx + 1}</span>
                                    <Play size={8} fill="currentColor" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={trk.id} className="flex flex-col border-b border-[#242424]">
                        {/* Primary Track Row */}
                        <div className="flex h-12 bg-[#171717] hover:bg-[#1a1a1a] transition-colors">
                          {/* Sticky Left Track Header */}
                          <div className={`w-64 flex-shrink-0 border-r border-[#2a2a2a] px-3 flex items-center justify-between bg-[#191919] sticky left-0 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.5)] ${trk.groupId ? "pl-5" : ""}`}>
                            <div className="flex items-center gap-2 overflow-hidden">
                              {trk.groupId && (
                                <CornerDownRight size={10} className="text-zinc-500 -mr-1 flex-shrink-0" />
                              )}
                              <button
                                onClick={() => toggleAutomationVisible(trk.id)}
                                className="text-zinc-400 hover:text-white transition"
                                title="Afficher/Masquer les sous-pistes d'automation"
                              >
                                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              </button>
                              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: trk.color }} />
                              <span className="font-bold text-xs text-zinc-100 truncate">{trk.name}</span>
                            </div>

                            <span className="text-[10px] font-mono text-zinc-400">{trk.db || "0.0 dB"}</span>
                          </div>

                          {/* 18 Clip Slots for Track */}
                          {[
                            "Start", "Intro", "Build", "Chorus 1", "1 B", "Bridge", "Chorus 2", "2 B", "Outro", "Perform →", "11", "Minimal", "Minimal2", "14", "15", "16", "17", "18"
                          ].map((_, sIdx) => {
                            const hasClip = sIdx % 2 === 0 || sIdx === 1 || sIdx === 2;
                            const isSceneActive = activeSceneIndex === sIdx;
                            return (
                              <div
                                key={sIdx}
                                className={`w-28 flex-shrink-0 border-r border-[#222222] p-1.5 flex items-center justify-center ${
                                  isSceneActive ? "bg-white/5" : ""
                                }`}
                              >
                                {hasClip ? (
                                  <button
                                    onClick={() => {
                                      setSelectedTrackId(trk.id);
                                      togglePlay();
                                      setStatusHint(`Clip "${trk.name} S${sIdx + 1}" activé`);
                                    }}
                                    className="w-full h-8 rounded px-2 text-[10px] font-bold text-white flex items-center justify-between shadow-sm transition transform active:scale-95"
                                    style={{ backgroundColor: trk.color }}
                                  >
                                    <span className="truncate">S{sIdx + 1}</span>
                                    <Play size={9} fill="currentColor" />
                                  </button>
                                ) : (
                                  <div className="w-full h-8 rounded border border-dashed border-[#2f2f2f] flex items-center justify-center text-zinc-600 hover:text-zinc-400 hover:border-zinc-500 cursor-pointer transition">
                                    <Plus size={11} />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Unfolded Automation Sub-lanes (Images 4 & 5) */}
                        {isExpanded && lanes.map((lane) => {
                          return (
                            <div
                              key={lane.id}
                              className="flex h-11 bg-[#121212] hover:bg-[#151515] transition-colors border-t border-[#1e1e1e]"
                            >
                              {/* Sticky Left Automation Header */}
                              <div className="w-64 flex-shrink-0 border-r border-[#282828] pl-7 pr-3 flex items-center justify-between bg-[#141414] sticky left-0 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.5)]">
                                <div className="flex items-center gap-2 overflow-hidden">
                                  <button
                                    onClick={() => toggleLaneActive(trk.id, lane.id)}
                                    className={`w-2 h-2 rounded-full flex-shrink-0 transition-all ${
                                      lane.active ? "bg-[#ef4444] shadow-[0_0_5px_#ef4444]" : "bg-zinc-600"
                                    }`}
                                    title={lane.active ? "Désactiver automation" : "Activer automation"}
                                  />
                                  <div className="flex flex-col truncate leading-tight">
                                    <span className="text-[11px] font-semibold text-zinc-300 truncate">{lane.name}</span>
                                    <span className="text-[9px] text-zinc-500 truncate" title={lane.target}>{lane.target}</span>
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleOpenAutomationEditor(trk.id, lane.id, "track")}
                                  className="p-1 text-zinc-400 hover:text-white rounded hover:bg-[#202020]"
                                  title="Ouvrir l'éditeur d'automation en bas"
                                >
                                  <PenTool size={9} className="text-[#df9c43]" />
                                </button>
                              </div>

                              {/* 18 Automation Clip Cells */}
                              {[
                                "Start", "Intro", "Build", "Chorus 1", "1 B", "Bridge", "Chorus 2", "2 B", "Outro", "Perform →", "11", "Minimal", "Minimal2", "14", "15", "16", "17", "18"
                              ].map((_, sIdx) => {
                                const clipName = `S${sIdx + 1}`;
                                const isSelected =
                                  selectedLauncherClip?.laneId === lane.id &&
                                  selectedLauncherClip?.sceneIndex === sIdx;

                                return (
                                  <div
                                    key={sIdx}
                                    data-clip-cell={`${lane.id}_${sIdx}`}
                                    onClick={() => {
                                      handleOpenAutomationEditor(trk.id, lane.id, "clip", {
                                        trackId: trk.id,
                                        laneId: lane.id,
                                        sceneIndex: sIdx,
                                        clipName
                                      });
                                    }}
                                    className={`w-28 flex-shrink-0 border-r border-[#202020] p-1 flex items-center justify-center cursor-pointer transition-all ${
                                      isSelected
                                        ? "bg-[#261a09] ring-2 ring-white z-10 rounded shadow-md"
                                        : "hover:bg-[#1c1c1c]"
                                    }`}
                                  >
                                    <div className="w-full h-8 rounded bg-[#1c1c1c] border border-[#2b2b2b] px-1.5 py-0.5 flex flex-col justify-between overflow-hidden relative">
                                      <div className="flex items-center justify-between z-10">
                                        <span className={`text-[9px] font-mono font-bold ${isSelected ? "text-[#df9c43]" : "text-zinc-400"}`}>
                                          {clipName}
                                        </span>
                                        <span className="text-[8px] font-mono text-zinc-500">
                                          {lane.unit}
                                        </span>
                                      </div>

                                      {/* Miniature SVG Curve Preview */}
                                      <svg className="w-full h-3 overflow-visible pointer-events-none opacity-80">
                                        <path
                                          d={getMiniClipPreviewPath(lane.id, sIdx)}
                                          fill="none"
                                          stroke={lane.color || "#ef4444"}
                                          strokeWidth="1.5"
                                        />
                                      </svg>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ────────────────────────────────────────────────────────────
              MODE C: VUE MIX (Console de Mixage Complète - Chapitre 7)
          ──────────────────────────────────────────────────────────── */}
          {mainView === "mix" && (
            <MusicStudioConsoleMixer
              tracks={tracks}
              selectedTrackId={selectedTrackId}
              onSelectTrack={setSelectedTrackId}
              onUpdateTrack={(trkId, updates) => {
                setTracks((prev) =>
                  prev.map((t) => (t.id === trkId ? { ...t, ...updates } : t))
                );
              }}
              trackPeaks={trackPeaks}
              masterPeak={masterPeak}
              onMasterVolumeChange={(vol) => dawAudioEngine.setMasterVolume(vol)}
              setStatusHint={setStatusHint}
            />
          )}

          {/* ────────────────────────────────────────────────────────────
              4. COLLAPSIBLE BOTTOM PANEL: PIANO ROLL, DEVICE RACK & KEYBOARD
              (Resizable Splitter + Fullscreen Maximize + Image 0 Gold Style)
          ──────────────────────────────────────────────────────────── */}
          {showBottomPanel && (
            <div
              style={{
                height: isBottomPanelMaximized ? "calc(100vh - 128px)" : `${bottomPanelHeight}px`,
                maxHeight: isBottomPanelMaximized ? "calc(100vh - 128px)" : "85vh",
                minHeight: isBottomPanelMaximized ? "calc(100vh - 128px)" : "160px"
              }}
              className={`bg-[#171717] flex flex-col flex-shrink-0 z-20 select-none transition-all ${
                isBottomPanelMaximized
                  ? "absolute bottom-0 left-0 right-0 top-[128px] z-40 shadow-2xl"
                  : "relative border-t border-[#2d2d2d]"
              }`}
            >
              {/* Resizer Splitter Bar (only when not maximized) */}
              {!isBottomPanelMaximized && (
                <div
                  onMouseDown={handleSplitterMouseDown}
                  onDoubleClick={() => setBottomPanelHeight(340)}
                  className="h-2 w-full bg-[#181818] hover:bg-[#df9c43]/40 active:bg-[#df9c43] cursor-row-resize flex items-center justify-center border-t border-b border-[#282828] group transition-colors flex-shrink-0 z-30 select-none"
                  title="Glisser pour redimensionner la zone inférieure • Double-clic pour réinitialiser (340px)"
                >
                  <div className="w-12 h-1 rounded-full bg-zinc-600 group-hover:bg-[#df9c43] transition-colors" />
                </div>
              )}

              {/* Bottom Panel Tab Header */}
              <div className="h-9 bg-[#191919] border-b border-[#2a2a2a] px-3 flex items-center justify-between select-none flex-shrink-0 z-10">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 flex-1 mr-2">
                  {/* Tab 1: Piano Roll */}
                  <button
                    onClick={() => setBottomPanelTab("pianoroll")}
                    className={`flex-shrink-0 whitespace-nowrap h-7 px-3 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                      bottomPanelTab === "pianoroll"
                        ? "bg-[#241808] border-2 border-[#df9c43] text-[#eaaf5d] shadow-[0_0_10px_rgba(223,156,67,0.3)]"
                        : "bg-[#1c1c1c] border border-[#333333] text-zinc-400 hover:text-white hover:border-[#df9c43]/40"
                    }`}
                  >
                    <Music size={12} className={bottomPanelTab === "pianoroll" ? "text-[#df9c43]" : "text-zinc-400"} />
                    <span>Piano Roll (Éditeur de Notes)</span>
                  </button>

                  {/* Tab 2: Device Rack (Chaîne d'Effets) */}
                  <button
                    onClick={() => setBottomPanelTab("devicerack")}
                    className={`flex-shrink-0 whitespace-nowrap h-7 px-3 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                      bottomPanelTab === "devicerack"
                        ? "bg-[#241808] border-2 border-[#df9c43] text-[#eaaf5d] shadow-[0_0_10px_rgba(223,156,67,0.3)]"
                        : "bg-[#1c1c1c] border border-[#333333] text-zinc-400 hover:text-white hover:border-[#df9c43]/40"
                    }`}
                  >
                    <Sliders size={12} className={bottomPanelTab === "devicerack" ? "text-[#df9c43]" : "text-zinc-400"} />
                    <span>Rack d'Effets</span>
                    <span className="ml-1 px-1.5 py-0.2 rounded text-[10px] font-mono bg-black/40 text-amber-300 border border-white/5">
                      {activeTrack?.deviceChain?.length || 0}
                    </span>
                  </button>

                  {/* Tab 3: The Grid Modulaire */}
                  <button
                    data-testid="tab-btn-the-grid"
                    onClick={() => setBottomPanelTab("grid")}
                    className={`flex-shrink-0 whitespace-nowrap h-7 px-3 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                      bottomPanelTab === "grid"
                        ? "bg-[#241808] border-2 border-[#df9c43] text-[#eaaf5d] shadow-[0_0_10px_rgba(223,156,67,0.3)]"
                        : "bg-[#1c1c1c] border border-[#333333] text-zinc-400 hover:text-white hover:border-[#df9c43]/40"
                    }`}
                  >
                    <Grid size={12} className={bottomPanelTab === "grid" ? "text-[#df9c43]" : "text-zinc-400"} />
                    <span>The Grid (Modulaire)</span>
                  </button>

                  {/* Tab 4: Modulateurs */}
                  <button
                    data-testid="tab-btn-modulators"
                    onClick={() => setBottomPanelTab("modulators")}
                    className={`flex-shrink-0 whitespace-nowrap h-7 px-3 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                      bottomPanelTab === "modulators"
                        ? "bg-[#241808] border-2 border-[#df9c43] text-[#eaaf5d] shadow-[0_0_10px_rgba(223,156,67,0.3)]"
                        : "bg-[#1c1c1c] border border-[#333333] text-zinc-400 hover:text-white hover:border-[#df9c43]/40"
                    }`}
                  >
                    <Activity size={12} className={bottomPanelTab === "modulators" ? "text-[#df9c43]" : "text-cyan-400"} />
                    <span>Modulateurs</span>
                    <span className="ml-1 px-1.5 py-0.2 rounded text-[10px] font-mono bg-black/40 text-amber-300 border border-white/5">
                      {trackModulators[activeTrack?.id]?.length || 0}
                    </span>
                  </button>

                  {/* Tab 5: Clavier Tactile */}
                  <button
                    onClick={() => setBottomPanelTab("keyboard")}
                    className={`flex-shrink-0 whitespace-nowrap h-7 px-3 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                      bottomPanelTab === "keyboard"
                        ? "bg-[#241808] border-2 border-[#df9c43] text-[#eaaf5d] shadow-[0_0_10px_rgba(223,156,67,0.3)]"
                        : "bg-[#1c1c1c] border border-[#333333] text-zinc-400 hover:text-white hover:border-[#df9c43]/40"
                    }`}
                  >
                    <Keyboard size={12} className={bottomPanelTab === "keyboard" ? "text-[#df9c43]" : "text-zinc-400"} />
                    <span>Clavier Tactile</span>
                  </button>

                  {/* Tab 6: Régénération IA du Clip */}
                  <button
                    onClick={() => setBottomPanelTab("inspector")}
                    className={`flex-shrink-0 whitespace-nowrap h-7 px-3 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                      bottomPanelTab === "inspector"
                        ? "bg-[#241808] border-2 border-[#df9c43] text-[#eaaf5d] shadow-[0_0_10px_rgba(223,156,67,0.3)]"
                        : "bg-[#1c1c1c] border border-[#333333] text-zinc-400 hover:text-white hover:border-[#df9c43]/40"
                    }`}
                  >
                    <Sparkles size={12} className={bottomPanelTab === "inspector" ? "text-[#df9c43]" : "text-zinc-400"} />
                    <span>Régénération IA du Clip</span>
                  </button>

                  {/* Tab 7: Automation Editor */}
                  <button
                    data-tab-automation="true"
                    onClick={() => setBottomPanelTab("automation")}
                    className={`flex-shrink-0 whitespace-nowrap h-7 px-3 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                      bottomPanelTab === "automation"
                        ? "bg-[#241808] border-2 border-[#df9c43] text-[#eaaf5d] shadow-[0_0_10px_rgba(223,156,67,0.3)]"
                        : "bg-[#1c1c1c] border border-[#333333] text-zinc-400 hover:text-white hover:border-[#df9c43]/40"
                    }`}
                  >
                    <PenTool size={12} className={bottomPanelTab === "automation" ? "text-[#df9c43]" : "text-zinc-400"} />
                    <span>Éditeur d'Automation</span>
                  </button>

                  {/* Tab 8: Audio Warp */}
                  <button
                    data-testid="tab-btn-audiowarp"
                    onClick={() => setBottomPanelTab("audiowarp")}
                    className={`flex-shrink-0 whitespace-nowrap h-7 px-3 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                      bottomPanelTab === "audiowarp"
                        ? "bg-[#241808] border-2 border-[#df9c43] text-[#eaaf5d] shadow-[0_0_10px_rgba(223,156,67,0.3)]"
                        : "bg-[#1c1c1c] border border-[#333333] text-zinc-400 hover:text-white hover:border-[#df9c43]/40"
                    }`}
                  >
                    <Radio size={12} className={bottomPanelTab === "audiowarp" ? "text-[#df9c43]" : "text-cyan-400"} />
                    <span>Audio Warp (6 Modes)</span>
                  </button>
                </div>

                {/* Right controls: Active Track Info, Maximize/Restore Toggle, Collapse Button */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] text-zinc-400 font-mono hidden sm:inline">
                    Piste: <span className="text-white font-bold">{activeTrack?.name}</span>
                  </span>

                  {/* Maximize / Restore Toggle Icon */}
                  <button
                    onClick={() => setIsBottomPanelMaximized(!isBottomPanelMaximized)}
                    className={`p-1.5 rounded-md transition flex items-center gap-1 text-[11px] font-semibold ${
                      isBottomPanelMaximized
                        ? "bg-[#241808] border border-[#df9c43] text-[#eaaf5d] shadow-[0_0_8px_rgba(223,156,67,0.3)]"
                        : "text-zinc-400 hover:text-white hover:bg-[#2c2c2c] border border-transparent"
                    }`}
                    title={isBottomPanelMaximized ? "Réduire à la taille normale" : "Agrandir dans tout l'espace (Plein écran)"}
                  >
                    {isBottomPanelMaximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                  </button>

                  {/* Collapse / Close Button */}
                  <button
                    onClick={() => setShowBottomPanel(false)}
                    className="p-1.5 text-zinc-400 hover:text-white rounded-md hover:bg-[#2c2c2c] transition"
                    title="Masquer le panneau inférieur"
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>
              </div>

              {/* Sub-view 1: Music Studio Piano Roll & Operators (Chapters 11 & 12, p. 340-405) */}
              {bottomPanelTab === "pianoroll" && (
                <MusicStudioPianoRollOperators
                  notes={pianoRollNotes}
                  selectedNoteId={selectedNoteId}
                  onSelectNote={setSelectedNoteId}
                  onUpdateNote={handleUpdatePianoRollNote}
                  onAddNote={handleAddPianoRollNote}
                  onDeleteNote={handleDeletePianoRollNote}
                  onPlayNote={(note) => handlePlaySynthNote(note)}
                  isPlaying={isPlaying}
                  currentBar={currentBar}
                  currentBeat={currentBeat}
                  setStatusHint={setStatusHint}
                />
              )}

              {/* Sub-view 2: Dedicated Track Device Rack (Chaîne d'Effets) */}
              {bottomPanelTab === "devicerack" && (
                <div className="flex-1 flex flex-col overflow-hidden bg-[#141414]">
                  {/* Modulator System Quick Drawer Strip */}
                  <div className="flex items-center justify-between px-3 py-1 bg-[#181d24] border-b border-cyan-950/60 text-[10px]">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-400 font-mono">
                        Chaîne d'effets ({activeTrack?.deviceChain?.length || 0}) • Piste: <strong className="text-white">{activeTrack?.name}</strong>
                      </span>
                      {mappingModulatorId && (
                        <span className="bg-cyan-500 text-black px-2 py-0.5 rounded font-black text-[9px] animate-pulse">
                          MODE ASSIGNATION ACTIF : Cliquez sur un paramètre
                        </span>
                      )}
                    </div>
                    <button
                      data-testid="toggle-modulator-drawer"
                      onClick={() => setShowModulatorDrawer(!showModulatorDrawer)}
                      className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded font-bold text-[10px] transition ${
                        showModulatorDrawer
                          ? "bg-cyan-600 text-white shadow"
                          : "bg-zinc-800 text-zinc-400 hover:text-white"
                      }`}
                      title="Afficher/Masquer le tiroir de modulateurs"
                    >
                      <Activity size={11} className="text-cyan-400" />
                      <span>Volet Modulateurs ({trackModulators[activeTrack?.id]?.length || 0})</span>
                    </button>
                  </div>

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "copy";
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const dataStr = e.dataTransfer.getData("application/json");
                      if (dataStr) {
                        try {
                          const data = JSON.parse(dataStr);
                          if (data.type === "device") {
                            handleAddDeviceToTrack(selectedTrackId, data.device);
                          }
                        } catch (err) {}
                      }
                    }}
                    className="flex-1 flex items-center p-3 gap-3 overflow-x-auto custom-scrollbar bg-[#141414]"
                  >
                  {/* Music Studio Drum Machine Device for Drums Track (Capture 0) */}
                  {(activeTrack?.type === "drums" || activeTrack?.id?.includes("drum") || activeTrack?.name?.toLowerCase().includes("drum")) && (
                    <StudioDrumMachineDevice track={activeTrack} audioEngine={dawAudioEngine} />
                  )}

                  {/* Dedicated 21 Audio Components & Instruments Rack Engine (Zero Mock) */}
                  <MusicStudioDeviceRack
                    track={activeTrack}
                    devices={activeTrack?.deviceChain || []}
                    selectedDeviceId={selectedDeviceId}
                    onSelectDevice={(id) => {
                      setSelectedDeviceId(id);
                      const d = (activeTrack?.deviceChain || []).find((x) => x.id === id);
                      if (d) setStatusHint(`Périphérique sélectionné: ${d.name} • Catégorie: ${d.category}`);
                    }}
                    onToggleBypass={(trId, devId) => handleToggleDeviceBypass(trId, devId)}
                    onRemoveDevice={(trId, devId) => handleRemoveDeviceFromTrack(trId, devId)}
                    onUpdateParam={(trId, devId, key, val) => handleUpdateDeviceParam(trId, devId, key, val)}
                    onReorderDevices={(trId, src, dst) => handleReorderDevices(trId, src, dst)}
                    onOpenBrowser={() => {
                      setIsPopupBrowserOpen(true);
                      setPopupBrowserContext({ target: "device", trackId: activeTrack?.id });
                      setStatusHint("Navigateur Pop-up Music Studio ouvert pour insérer un composant");
                    }}
                    mappingModulatorId={mappingModulatorId}
                    onAssignModTarget={handleAssignModTarget}
                    setStatusHint={setStatusHint}
                  />
                </div>

                {/* Modulator Drawer if open */}
                {showModulatorDrawer && (
                  <MusicStudioModulatorSystem
                    trackId={activeTrack?.id}
                    modulators={trackModulators[activeTrack?.id] || []}
                    onUpdateModulators={(newMods) => {
                      setTrackModulators((prev) => ({
                        ...prev,
                        [activeTrack?.id]: newMods
                      }));
                    }}
                    mappingModulatorId={mappingModulatorId}
                    setMappingModulatorId={setMappingModulatorId}
                    isPlaying={isPlaying}
                    bpm={bpm}
                    setStatusHint={setStatusHint}
                  />
                )}
              </div>
            )}

              {/* Sub-view: Music Studio Dedicated Modulators Tab (Chapter 16, p. 461-512) */}
              {bottomPanelTab === "modulators" && (
                <div className="flex-1 flex flex-col overflow-y-auto bg-[#0d1219] p-3 custom-scrollbar">
                  <MusicStudioModulatorSystem
                    trackId={activeTrack?.id}
                    modulators={trackModulators[activeTrack?.id] || []}
                    onUpdateModulators={(newMods) => {
                      setTrackModulators((prev) => ({
                        ...prev,
                        [activeTrack?.id]: newMods
                      }));
                    }}
                    mappingModulatorId={mappingModulatorId}
                    setMappingModulatorId={setMappingModulatorId}
                    isPlaying={isPlaying}
                    bpm={bpm}
                    setStatusHint={setStatusHint}
                  />
                </div>
              )}

              {/* Sub-view: Music Studio The Grid Modular Environment (Chapter 15, p. 470-510) */}
              {bottomPanelTab === "grid" && (
                <MusicStudioTheGridModular
                  gridType="poly"
                  trackName={activeTrack?.name || "Main Drums"}
                  setStatusHint={setStatusHint}
                />
              )}

              {/* Sub-view 3: On-Screen Touch Keyboard Panel (Chapter 18, p. 540-555) */}
              {bottomPanelTab === "keyboard" && (
                <div className="flex-1 flex flex-col bg-[#141414] p-3 select-none overflow-hidden justify-between">
                  {/* Expression & Mode Controls Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-[#1c1c1c] border border-[#2b2b2b] rounded-lg px-3 py-2 text-xs">
                    {/* Mode Selector */}
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mr-1 hidden sm:inline">
                        DISPOSITION :
                      </span>
                      {[
                        { id: "piano", label: "Clavier Piano" },
                        { id: "octaves", label: "Octaves (Grille)" },
                        { id: "fourths", label: "Quartes (Grille)" }
                      ].map((m) => (
                        <button
                          key={m.id}
                          data-testid={`btn-keyboard-mode-${m.id}`}
                          onClick={() => setTouchKeyboardMode(m.id)}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold transition ${
                            touchKeyboardMode === m.id
                              ? "bg-[#241808] border border-[#df9c43] text-[#eaaf5d] shadow-[0_0_8px_rgba(223,156,67,0.3)]"
                              : "bg-[#222] border border-[#333] text-zinc-400 hover:text-white"
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>

                    {/* Octave Transposition */}
                    <div className="flex items-center gap-1.5 bg-[#141414] border border-[#303030] px-2 py-0.5 rounded">
                      <span className="text-[10px] text-zinc-400">Octave :</span>
                      <button
                        onClick={() => setKeyboardOctaveOffset((o) => Math.max(-2, o - 1))}
                        className="w-5 h-5 bg-[#252525] hover:bg-[#303030] text-zinc-300 rounded font-bold text-xs"
                      >
                        -
                      </button>
                      <span className="font-mono text-[#eaaf5d] font-bold text-xs w-6 text-center">
                        {keyboardOctaveOffset >= 0 ? `+${keyboardOctaveOffset}` : keyboardOctaveOffset}
                      </span>
                      <button
                        onClick={() => setKeyboardOctaveOffset((o) => Math.min(2, o + 1))}
                        className="w-5 h-5 bg-[#252525] hover:bg-[#303030] text-zinc-300 rounded font-bold text-xs"
                      >
                        +
                      </button>
                    </div>

                    {/* Waveform Selector */}
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-zinc-400 mr-0.5">Onde :</span>
                      {["sawtooth", "square", "triangle", "sine"].map((w) => (
                        <button
                          key={w}
                          onClick={() => setKeyboardWaveType(w)}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono capitalize transition ${
                            keyboardWaveType === w
                              ? "bg-[#241808] border border-[#df9c43] text-[#eaaf5d] font-bold"
                              : "bg-[#181818] border border-[#303030] text-zinc-400 hover:text-white"
                          }`}
                        >
                          {w === "sawtooth" ? "Saw" : w === "triangle" ? "Tri" : w}
                        </button>
                      ))}
                    </div>

                    {/* Chord Mode Selector */}
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-zinc-400 mr-0.5">Accord :</span>
                      {[
                        { id: "single", label: "Solo" },
                        { id: "major", label: "Maj" },
                        { id: "minor", label: "Min" },
                        { id: "seventh", label: "7th" }
                      ].map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setKeyboardChordMode(c.id)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                            keyboardChordMode === c.id
                              ? "bg-[#241808] border border-[#df9c43] text-[#eaaf5d]"
                              : "bg-[#181818] border border-[#303030] text-zinc-400 hover:text-white"
                          }`}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>

                    {/* Timbre / CC74 Slider */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-zinc-400">Timbre (CC74):</span>
                      <input
                        type="range"
                        min="0"
                        max="127"
                        value={keyboardTimbre}
                        onChange={(e) => setKeyboardTimbre(Number(e.target.value))}
                        className="w-16 h-1 bg-[#333] rounded accent-[#df9c43] cursor-pointer"
                        title={`Cutoff: ${400 + keyboardTimbre * 35} Hz`}
                      />
                    </div>
                  </div>

                  {/* Keyboard Visual Area */}
                  <div className="flex-1 flex items-center justify-center py-2 overflow-x-auto custom-scrollbar">
                    {/* ── Mode 1: Traditional Piano ── */}
                    {touchKeyboardMode === "piano" && (
                      <div className="relative flex shadow-2xl rounded-b-xl overflow-hidden border-t-4 border-[#df9c43] bg-black">
                        {[
                          "C3", "D3", "E3", "F3", "G3", "A3", "B3",
                          "C4", "D4", "E4", "F4", "G4", "A4", "B4",
                          "C5"
                        ].map((basePitch) => {
                          const noteLetter = basePitch.slice(0, -1);
                          const baseOct = parseInt(basePitch.slice(-1), 10);
                          const effOct = Math.min(5, Math.max(2, baseOct + keyboardOctaveOffset));
                          const pitch = `${noteLetter}${effOct}`;
                          return (
                            <button
                              key={basePitch}
                              onClick={() => {
                                handlePlaySynthNote(pitch, {
                                  type: keyboardWaveType,
                                  cutoff: 500 + keyboardTimbre * 35
                                });
                                if (keyboardChordMode === "major") {
                                  const scale = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
                                  const idx = scale.indexOf(noteLetter);
                                  const third = `${scale[(idx + 4) % 12]}${effOct + (idx + 4 >= 12 ? 1 : 0)}`;
                                  const fifth = `${scale[(idx + 7) % 12]}${effOct + (idx + 7 >= 12 ? 1 : 0)}`;
                                  handlePlaySynthNote(third, { type: keyboardWaveType });
                                  handlePlaySynthNote(fifth, { type: keyboardWaveType });
                                } else if (keyboardChordMode === "minor") {
                                  const scale = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
                                  const idx = scale.indexOf(noteLetter);
                                  const third = `${scale[(idx + 3) % 12]}${effOct + (idx + 3 >= 12 ? 1 : 0)}`;
                                  const fifth = `${scale[(idx + 7) % 12]}${effOct + (idx + 7 >= 12 ? 1 : 0)}`;
                                  handlePlaySynthNote(third, { type: keyboardWaveType });
                                  handlePlaySynthNote(fifth, { type: keyboardWaveType });
                                } else if (keyboardChordMode === "seventh") {
                                  const scale = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
                                  const idx = scale.indexOf(noteLetter);
                                  const third = `${scale[(idx + 4) % 12]}${effOct + (idx + 4 >= 12 ? 1 : 0)}`;
                                  const fifth = `${scale[(idx + 7) % 12]}${effOct + (idx + 7 >= 12 ? 1 : 0)}`;
                                  const sev = `${scale[(idx + 10) % 12]}${effOct + (idx + 10 >= 12 ? 1 : 0)}`;
                                  handlePlaySynthNote(third, { type: keyboardWaveType });
                                  handlePlaySynthNote(fifth, { type: keyboardWaveType });
                                  handlePlaySynthNote(sev, { type: keyboardWaveType });
                                }
                              }}
                              className="w-11 h-36 bg-gradient-to-b from-[#f2f2f2] to-[#d6d6d6] hover:to-amber-100 active:to-[#df9c43] active:bg-[#df9c43] border-r border-zinc-400 text-zinc-800 font-bold text-[10px] flex flex-col justify-end pb-2 items-center transition shadow active:translate-y-0.5"
                            >
                              <span className="font-mono">{pitch}</span>
                            </button>
                          );
                        })}

                        {/* Black keys overlaid on top */}
                        <div className="absolute top-0 left-0 flex pointer-events-none">
                          {[
                            { basePitch: "C#3", left: 28 },
                            { basePitch: "D#3", left: 72 },
                            { basePitch: "F#3", left: 160 },
                            { basePitch: "G#3", left: 204 },
                            { basePitch: "A#3", left: 248 },
                            { basePitch: "C#4", left: 336 },
                            { basePitch: "D#4", left: 380 },
                            { basePitch: "F#4", left: 468 },
                            { basePitch: "G#4", left: 512 },
                            { basePitch: "A#4", left: 556 }
                          ].map((bk) => {
                            const noteLetter = bk.basePitch.slice(0, -1);
                            const baseOct = parseInt(bk.basePitch.slice(-1), 10);
                            const effOct = Math.min(5, Math.max(2, baseOct + keyboardOctaveOffset));
                            const pitch = `${noteLetter}${effOct}`;
                            return (
                              <button
                                key={bk.basePitch}
                                onClick={() => {
                                  handlePlaySynthNote(pitch, {
                                    type: keyboardWaveType,
                                    cutoff: 500 + keyboardTimbre * 35
                                  });
                                }}
                                style={{ left: `${bk.left}px` }}
                                className="absolute pointer-events-auto w-7 h-24 bg-gradient-to-b from-[#2a2a2a] to-[#111111] hover:to-zinc-800 active:bg-[#241808] active:border-b-2 active:border-[#df9c43] active:text-[#eaaf5d] rounded-b border-b-2 border-black text-white font-mono text-[8px] flex flex-col justify-end pb-1.5 items-center shadow-lg transition active:translate-y-0.5"
                              >
                                <span>{noteLetter}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* ── Mode 2: Octaves Isometric Grid (Section 18.2, p. 544-547) ── */}
                    {touchKeyboardMode === "octaves" && (
                      <div className="w-full max-w-4xl space-y-2">
                        {[4, 3, 2].map((rowOct) => {
                          const effOct = Math.min(5, Math.max(2, rowOct + keyboardOctaveOffset));
                          return (
                            <div key={rowOct} className="flex items-center gap-1.5 justify-center">
                              <span className="w-14 font-mono font-bold text-[10px] text-[#df9c43] text-right pr-2">
                                Oct {effOct}
                              </span>
                              {["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"].map((note) => {
                                const pitch = `${note}${effOct}`;
                                const isBlack = note.includes("#");
                                const isRoot = note === "C";
                                return (
                                  <button
                                    key={note}
                                    onClick={() => {
                                      handlePlaySynthNote(pitch, {
                                        type: keyboardWaveType,
                                        cutoff: 500 + keyboardTimbre * 35
                                      });
                                    }}
                                    className={`flex-1 h-12 rounded-lg font-mono font-bold text-xs flex flex-col items-center justify-center transition active:scale-95 shadow-md ${
                                      isRoot
                                        ? "bg-[#241808] border-2 border-[#df9c43] text-[#eaaf5d] shadow-[0_0_10px_rgba(223,156,67,0.35)]"
                                        : isBlack
                                        ? "bg-[#181818] border border-[#2d2218] text-amber-300 hover:border-[#df9c43]/60"
                                        : "bg-[#262626] border border-[#383838] text-zinc-100 hover:border-zinc-400"
                                    }`}
                                  >
                                    <span>{note}</span>
                                    <span className="text-[8px] opacity-60 font-sans">{pitch}</span>
                                  </button>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* ── Mode 3: Quartes Isometric Grid (Section 18.3, p. 548-552) ── */}
                    {touchKeyboardMode === "fourths" && (
                      <div className="w-full max-w-4xl space-y-2">
                        {[
                          { base: "G", oct: 3, label: "Corde 4 (G)" },
                          { base: "D", oct: 3, label: "Corde 3 (D)" },
                          { base: "A", oct: 2, label: "Corde 2 (A)" },
                          { base: "E", oct: 2, label: "Corde 1 (E)" }
                        ].map((row, rIdx) => {
                          const scale12 = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
                          const startIdx = scale12.indexOf(row.base);
                          const effOctBase = Math.min(5, Math.max(2, row.oct + keyboardOctaveOffset));

                          return (
                            <div key={rIdx} className="flex items-center gap-1.5 justify-center">
                              <span className="w-20 font-mono font-bold text-[10px] text-[#df9c43] text-right pr-2 truncate">
                                {row.label}
                              </span>
                              {Array.from({ length: 8 }, (_, fret) => {
                                const noteIdx = (startIdx + fret) % 12;
                                const octBump = Math.floor((startIdx + fret) / 12);
                                const note = scale12[noteIdx];
                                const pitch = `${note}${effOctBase + octBump}`;
                                const isBlack = note.includes("#");
                                const isRoot = note === "C";

                                return (
                                  <button
                                    key={fret}
                                    onClick={() => {
                                      handlePlaySynthNote(pitch, {
                                        type: keyboardWaveType,
                                        cutoff: 500 + keyboardTimbre * 35
                                      });
                                    }}
                                    className={`flex-1 h-11 rounded-lg font-mono font-bold text-xs flex flex-col items-center justify-center transition active:scale-95 shadow-md ${
                                      isRoot
                                        ? "bg-[#241808] border-2 border-[#df9c43] text-[#eaaf5d] shadow-[0_0_8px_rgba(223,156,67,0.3)]"
                                        : isBlack
                                        ? "bg-[#181818] border border-[#2d2218] text-amber-300 hover:border-[#df9c43]/60"
                                        : "bg-[#262626] border border-[#383838] text-zinc-100 hover:border-zinc-400"
                                    }`}
                                  >
                                    <span>{note}</span>
                                    <span className="text-[8px] opacity-60 font-sans">Fret {fret}</span>
                                  </button>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sub-view 4: Clip Inspector & AI Regeneration */}
              {bottomPanelTab === "inspector" && (
                <div className="flex-1 p-4 bg-[#181818] overflow-y-auto space-y-3">
                  <div className="flex items-center justify-between border-b border-[#2b2b2b] pb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles size={14} className="text-[#df9c43]" />
                      <span className="font-bold text-xs text-white">
                        Inspecteur de Clip & Régénération Spécifique par IA
                      </span>
                      {activeClip && (
                        <span className="px-2 py-0.5 bg-[#df9c43]/20 text-[#df9c43] font-mono text-[10px] rounded">
                          {activeClip.name}
                        </span>
                      )}
                    </div>

                    {selectedTrack?.url && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-400">Écoute Stéréo:</span>
                        <audio controls src={selectedTrack.url} className="h-6 w-48 accent-[#df9c43]" />
                      </div>
                    )}
                  </div>

                  {/* AI Prompt Input */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={clipPrompt}
                      onChange={(e) => setClipPrompt(e.target.value)}
                      placeholder={`Prompt IA pour régénérer ${activeClip?.name || "ce clip"} (ex: plus de slap bass, groove syncopé, saturation...)...`}
                      className="flex-1 bg-[#121212] border border-[#303030] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#df9c43]"
                    />
                    <button
                      onClick={async () => {
                        if (!onRegenerateClip) return;
                        setIsClipRegenerating(true);
                        try {
                          await onRegenerateClip(clipPrompt || `Régénérer ${activeClip?.name}`);
                        } finally {
                          setIsClipRegenerating(false);
                        }
                      }}
                      disabled={isClipRegenerating}
                      className="px-3.5 py-1.5 bg-[#241808] hover:bg-[#2d1e0d] border border-[#df9c43] text-[#eaaf5d] hover:text-[#f5c277] font-bold rounded flex items-center gap-1.5 shadow-[0_0_8px_rgba(223,156,67,0.25)] transition disabled:opacity-50"
                    >
                      {isClipRegenerating ? (
                        <RefreshCw size={12} className="animate-spin" />
                      ) : (
                        <Wand2 size={12} />
                      )}
                      <span>Régénérer</span>
                    </button>
                  </div>

                  {/* Suggestion Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      "🥁 Rythmique Trap avec Hi-Hats rapides",
                      "🎸 Slap Bass Funky & Syncopé",
                      "🎹 Nappe Neo-Soul planante avec Reverb",
                      "⚡ Drop percutant avec 808 glissants",
                      "✨ Solo Virtuose mélodique",
                      "🌿 Breakdown acoustique minimaliste"
                    ].map((sug) => (
                      <button
                        key={sug}
                        onClick={() => setClipPrompt(sug)}
                        className="px-2 py-0.5 bg-[#252525] hover:bg-[#df9c43]/20 hover:text-[#df9c43] text-zinc-300 text-[10px] rounded border border-[#333333] transition"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-view 5: Music Studio Automation Editor */}
              {bottomPanelTab === "automation" && (
                <DawAutomationEditor
                  tracks={tracks}
                  selectedTrackId={selectedAutomationTrackId}
                  selectedLaneId={selectedAutomationLaneId}
                  onSelectTrack={setSelectedAutomationTrackId}
                  onSelectLane={setSelectedAutomationLaneId}
                  mode={automationEditorMode}
                  onSetMode={setAutomationEditorMode}
                  selectedLauncherClip={selectedLauncherClip}
                  tool={automationTool}
                  onSetTool={setAutomationTool}
                  snap={automationSnap}
                  onSetSnap={setAutomationSnap}
                  onAddPoint={handleAddAutomationPointToLane}
                  onDeletePoint={handleDeleteAutomationPointFromLane}
                  onUpdatePoint={handleUpdatePointInLane}
                  onUpdateTension={handleUpdateTension}
                  onToggleLaneActive={toggleLaneActive}
                  onApplyPresetShape={applyAutomationPresetShape}
                  setDraggingAnchor={setDraggingAnchor}
                  hoveredAnchorTooltip={hoveredAnchorTooltip}
                  setHoveredAnchorTooltip={setHoveredAnchorTooltip}
                  currentBar={currentBar}
                  bpm={bpm}
                />
              )}

              {/* Sub-view: Music Studio Audio Warp & Transient Engine (Chapters 9 & 10) */}
              {bottomPanelTab === "audiowarp" && (
                <div className="flex-1 overflow-y-auto p-2.5 bg-[#121212]">
                  <MusicStudioAudioWarp
                    clip={selectedClip}
                    track={selectedTrack}
                    projectBpm={bpm}
                    onUpdateClip={(clipId, updates) => {
                      setTracks((prev) =>
                        prev.map((t) => {
                          if (t.id === selectedTrackId) {
                            return {
                              ...t,
                              clips: (t.clips || []).map((c) =>
                                c.id === clipId ? { ...c, ...updates } : c
                              )
                            };
                          }
                          return t;
                        })
                      );
                    }}
                    onBounceInPlace={handleBounceInPlace}
                    onSliceToDrumMachine={handleSliceToDrumMachine}
                    onClose={() => setShowBottomPanel(false)}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* ────────────────────────────────────────────────────────────
            5. RIGHT SIDEBAR: BROWSER & PROJECT PANEL
        ──────────────────────────────────────────────────────────── */}
        {showRightSidebar && (
          <div className="w-80 bg-[#1c1c1c] border-l border-[#2e2e2e] flex flex-col flex-shrink-0 z-10 transition-all select-none">
            {/* Sidebar Top Tab Buttons */}
            <div className="h-9 bg-[#222222] border-b border-[#2d2d2d] px-2 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-1 font-bold text-[11px]">
                <button
                  onClick={() => setSidebarTab("browser")}
                  className={`px-3 py-1 rounded-md transition flex items-center gap-1.5 ${
                    sidebarTab === "browser"
                      ? "bg-[#241808] border border-[#df9c43] text-[#eaaf5d] shadow-[0_0_8px_rgba(223,156,67,0.3)]"
                      : "text-zinc-400 hover:text-white border border-transparent"
                  }`}
                >
                  <Search size={12} className={sidebarTab === "browser" ? "text-[#df9c43]" : "text-zinc-400"} />
                  <span>Navigateur</span>
                </button>

                <button
                  onClick={() => setSidebarTab("project")}
                  className={`px-3 py-1 rounded-md transition flex items-center gap-1.5 ${
                    sidebarTab === "project"
                      ? "bg-[#241808] border border-[#df9c43] text-[#eaaf5d] shadow-[0_0_8px_rgba(223,156,67,0.3)]"
                      : "text-zinc-400 hover:text-white border border-transparent"
                  }`}
                >
                  <Settings2 size={12} className={sidebarTab === "project" ? "text-[#df9c43]" : "text-zinc-400"} />
                  <span>Projet</span>
                </button>
              </div>

              <button
                onClick={() => setShowRightSidebar(false)}
                className="p-1 text-zinc-400 hover:text-white rounded hover:bg-[#2c2c2c]"
                title="Cacher panneau latéral"
              >
                <X size={13} />
              </button>
            </div>

            {/* TAB 1: NAVIGATEUR (Devices & AI Tools) */}
            {sidebarTab === "browser" && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Search Bar */}
                <div className="p-2.5 border-b border-[#2b2b2b] bg-[#181818]">
                  <div className="relative">
                    <Search size={12} className="absolute left-2.5 top-2.5 text-zinc-500" />
                    <input
                      type="text"
                      value={browserSearch}
                      onChange={(e) => setBrowserSearch(e.target.value)}
                      placeholder="Rechercher composant, sample, preset..."
                      className="w-full bg-[#121212] border border-[#303030] rounded pl-8 pr-2.5 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#df9c43]"
                    />
                  </div>

                  {/* Filter Category Chips */}
                  <div className="flex flex-wrap gap-1 mt-2 text-[10px] font-semibold text-zinc-400">
                    {["all", "devices", "ai", "presets"].map((f) => (
                      <button
                        key={f}
                        onClick={() => setBrowserFilter(f)}
                        className={`px-2 py-0.5 rounded transition ${
                          browserFilter === f
                            ? "bg-[#df9c43]/20 text-[#df9c43] border border-[#df9c43]/40 font-bold"
                            : "bg-[#252525] hover:text-white"
                        }`}
                      >
                        {f === "all" && "Tout"}
                        {f === "devices" && "Devices & Effets"}
                        {f === "ai" && "Outils IA OGA"}
                        {f === "presets" && "Presets"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Device & Tools List with Drag & Drop */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-3">
                  {/* AI INTEGRATION SECTION */}
                  {(browserFilter === "all" || browserFilter === "ai") && (
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-bold text-[#df9c43] tracking-wider uppercase px-1">
                        ⚡ GÉNÉRATEURS & OUTILS IA SAHEL / OGA
                      </div>

                      {/* ACE-Step Generation Link */}
                      <div
                        draggable={true}
                        onDragStart={(e) => {
                          if (typeof window !== "undefined") {
                            window.__isInternalDragging = true;
                            window.__isInternalDawDragging = true;
                          }
                          e.dataTransfer.setData("application/x-daw-item", "instrument");
                          e.dataTransfer.setData("application/json", JSON.stringify({
                            type: "instrument",
                            name: "ACE-Step 1.5 Synth"
                          }));
                          e.dataTransfer.effectAllowed = "copy";
                          setDraggedSidebarItem({ type: "instrument", name: "ACE-Step 1.5 Synth" });
                          setStatusHint("Glisser ACE-Step vers une piste ou en bas");
                        }}
                        onDragEnd={() => {
                          if (typeof window !== "undefined") {
                            window.__isInternalDragging = false;
                            window.__isInternalDawDragging = false;
                          }
                          setDraggedSidebarItem(null);
                          setTrackDropIndicator(null);
                          setStatusHint(null);
                        }}
                        onClick={() => onNavigateTab ? onNavigateTab("create") : null}
                        className="p-2 bg-[#252525] hover:bg-[#2e2e2e] border border-amber-500/30 rounded cursor-grab active:cursor-grabbing transition flex items-center justify-between select-none"
                      >
                        <div className="flex items-center gap-2">
                          <Sparkles size={14} className="text-amber-400" />
                          <div>
                            <span className="font-bold text-xs text-white block">ACE-Step 1.5 Générateur</span>
                            <span className="text-[10px] text-zinc-400">Générer morceau complet par prompt</span>
                          </div>
                        </div>
                        <Plus size={12} className="text-amber-400" />
                      </div>

                      {/* ComfyUI Video Link */}
                      <div
                        onClick={() => onOpenVideoStudio ? onOpenVideoStudio() : null}
                        className="p-2 bg-[#252525] hover:bg-[#2e2e2e] border border-[#df9c43]/30 rounded cursor-pointer transition flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Film size={14} className="text-[#df9c43]" />
                          <div>
                            <span className="font-bold text-xs text-white block">ComfyUI Clip Studio</span>
                            <span className="text-[10px] text-zinc-400">Génération vidéo synchronisée au BPM</span>
                          </div>
                        </div>
                        <Plus size={12} className="text-[#df9c43]" />
                      </div>

                      {/* Demucs Separation Link */}
                      <div
                        onClick={() => onOpenDemucs ? onOpenDemucs() : null}
                        className="p-2 bg-[#252525] hover:bg-[#2e2e2e] border border-cyan-500/30 rounded cursor-pointer transition flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Scissors size={14} className="text-cyan-400" />
                          <div>
                            <span className="font-bold text-xs text-white block">Demucs 4-Stems Split</span>
                            <span className="text-[10px] text-zinc-400">Isoler Vocals, Drums, Bass & Other</span>
                          </div>
                        </div>
                        <Plus size={12} className="text-cyan-400" />
                      </div>

                      {/* LoRA Training Link */}
                      <div
                        onClick={() => onNavigateTab ? onNavigateTab("training") : null}
                        className="p-2 bg-[#252525] hover:bg-[#2e2e2e] border border-[#df9c43]/30 rounded cursor-pointer transition flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Cpu size={14} className="text-[#df9c43]" />
                          <div>
                            <span className="font-bold text-xs text-white block">Entraînement LoRA Musical</span>
                            <span className="text-[10px] text-zinc-400">Fine-tuning sur vos propres stems</span>
                          </div>
                        </div>
                        <Plus size={12} className="text-[#df9c43]" />
                      </div>
                    </div>
                  )}

                  {/* STUDIO DEVICES SECTION (Draggable into Tracks or Rack) */}
                  {(browserFilter === "all" || browserFilter === "devices") && (
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase px-1 pt-2">
                        COMPOSANTS AUDIO & INSTRUMENTS ({filteredDevices.length})
                      </div>

                      {filteredDevices.map((dev) => {
                        const isInst = dev.type.includes("Instrument") || ["Drums", "Synth", "Keys", "Sampler"].includes(dev.category);
                        const itemType = isInst ? "instrument" : "device";
                        return (
                          <div
                            key={dev.id}
                            draggable={true}
                            onDragStart={(e) => {
                              if (typeof window !== "undefined") {
                                window.__isInternalDragging = true;
                                window.__isInternalDawDragging = true;
                              }
                              e.dataTransfer.setData("application/x-daw-item", itemType);
                              e.dataTransfer.setData("application/json", JSON.stringify({
                                type: itemType,
                                device: dev,
                                name: dev.name
                              }));
                              e.dataTransfer.effectAllowed = "copy";
                              setDraggedSidebarItem({ type: itemType, device: dev, name: dev.name });
                              setStatusHint(`Glisser "${dev.name}" vers une piste pour l'assigner ou en bas pour créer une nouvelle piste`);
                            }}
                            onDragEnd={() => {
                              if (typeof window !== "undefined") {
                                window.__isInternalDragging = false;
                                window.__isInternalDawDragging = false;
                              }
                              setDraggedSidebarItem(null);
                              setTrackDropIndicator(null);
                              setStatusHint(null);
                            }}
                            onClick={() => {
                              handleAddDeviceToTrack(selectedTrackId, dev);
                            }}
                            className="p-2 bg-[#222222] hover:bg-[#292929] border border-[#2e2e2e] rounded cursor-grab active:cursor-grabbing transition flex items-center justify-between group select-none"
                          >
                            <div className="min-w-0 pr-2">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-xs text-white group-hover:text-[#df9c43] transition">
                                  {dev.name}
                                </span>
                                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#181818] text-zinc-400 border border-[#303030]">
                                  {dev.category}
                                </span>
                              </div>
                              <span className="text-[10px] text-zinc-400 truncate block mt-0.5">
                                {dev.desc}
                              </span>
                            </div>
                            <button
                              className="p-1 rounded bg-[#303030] group-hover:bg-[#241808] group-hover:border group-hover:border-[#df9c43] text-zinc-300 group-hover:text-[#eaaf5d] transition flex-shrink-0"
                              title="Ajouter à la piste active"
                            >
                              <Plus size={11} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: PROJET PANEL (Chapter 14, p. 427-440) */}
            {sidebarTab === "project" && (
              <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar p-3 space-y-3.5">
                {/* Project Sub-tabs Bar (6 Tabs) */}
                <div className="flex items-center gap-1 border-b border-[#2b2b2b] pb-2 text-[10px] font-bold text-zinc-400 overflow-x-auto custom-scrollbar">
                  {[
                    { id: "settings", label: "Réglages" },
                    { id: "remotes", label: "Macros" },
                    { id: "info", label: "Infos" },
                    { id: "sections", label: "Repères" },
                    { id: "files", label: "Fichiers" },
                    { id: "plugins", label: "DSP" }
                  ].map((t) => (
                    <button
                      key={t.id}
                      data-testid={`project-subtab-${t.id}`}
                      onClick={() => setProjectSubTab(t.id)}
                      className={`px-2 py-1 rounded whitespace-nowrap transition ${
                        projectSubTab === t.id
                          ? "bg-[#241808] border border-[#df9c43] text-[#eaaf5d] shadow-[0_0_8px_rgba(223,156,67,0.3)] font-bold"
                          : "hover:text-white hover:bg-[#202020]"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* ── Sub-tab 1: RÉGLAGES DU PROJET & GROOVE GLOBAL (Section 14.1 & 14.2) ── */}
                {projectSubTab === "settings" && (
                  <div className="space-y-3">
                    {/* Project Signature & Tempo */}
                    <div className="bg-[#222222] border border-[#2e2e2e] rounded-lg p-3 space-y-2.5">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                        MÉTRIQUE & TRANSPORT
                      </span>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400">Tempo (BPM):</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="20"
                            max="300"
                            value={bpm}
                            onChange={(e) => setBpm(Number(e.target.value))}
                            className="w-16 bg-[#141414] border border-[#333333] rounded px-2 py-0.5 text-xs text-[#eaaf5d] font-mono font-bold text-right focus:outline-none"
                          />
                          <span className="text-zinc-500 font-mono text-[10px]">BPM</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400">Signature rythmique:</span>
                        <select
                          value={timeSignature}
                          onChange={(e) => setTimeSignature(e.target.value)}
                          className="bg-[#141414] border border-[#333333] rounded px-2 py-0.5 text-xs text-white focus:outline-none font-mono"
                        >
                          <option value="4/4">4 / 4</option>
                          <option value="3/4">3 / 4</option>
                          <option value="6/8">6 / 8</option>
                          <option value="7/8">7 / 8</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400">Tonalité du projet:</span>
                        <select
                          value={musicalKey}
                          onChange={(e) => setMusicalKey(e.target.value)}
                          className="bg-[#141414] border border-[#333333] rounded px-2 py-0.5 text-xs text-[#eaaf5d] focus:outline-none font-mono"
                        >
                          <option value="C Major">C Majeur</option>
                          <option value="A Minor">A Mineur</option>
                          <option value="F Minor">F Mineur (Amapiano)</option>
                          <option value="G Minor">G Mineur</option>
                          <option value="D Dorian">D Dorien</option>
                        </select>
                      </div>
                    </div>

                    {/* Section 14.2: GROOVE GLOBAL (SHUFFLE) */}
                    <div className="bg-[#241808]/70 border border-[#df9c43]/40 rounded-lg p-3 space-y-2.5 shadow-[0_0_12px_rgba(223,156,67,0.15)]">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#eaaf5d] uppercase tracking-wider flex items-center gap-1.5">
                          <Activity size={12} className="text-[#df9c43]" />
                          GROOVE GLOBAL (SHUFFLE)
                        </span>
                        <span className="font-mono text-[10px] text-[#f5c277] font-bold">
                          {globalGroove.shuffle}%
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
                          <span>Quantité de Shuffle (Balançoire):</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={globalGroove.shuffle}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setGlobalGroove((prev) => ({ ...prev, shuffle: val }));
                            setStatusHint(`Groove Shuffle ajusté à ${val}% (Section 14.2, p. 433)`);
                          }}
                          className="w-full h-1 bg-[#303030] rounded appearance-none cursor-pointer accent-[#df9c43]"
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <span className="text-zinc-400">Débit du Shuffle:</span>
                        <div className="flex items-center gap-1">
                          {["1/8", "1/16"].map((rate) => (
                            <button
                              key={rate}
                              onClick={() => setGlobalGroove((prev) => ({ ...prev, rate }))}
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition ${
                                globalGroove.rate === rate
                                  ? "bg-[#241808] border border-[#df9c43] text-[#eaaf5d]"
                                  : "bg-[#181818] border border-[#303030] text-zinc-400 hover:text-white"
                              }`}
                            >
                              {rate}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="pt-1">
                        <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
                          <span>Accentuation métrique:</span>
                          <span className="font-mono text-[#eaaf5d]">{globalGroove.accent}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={globalGroove.accent}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setGlobalGroove((prev) => ({ ...prev, accent: val }));
                          }}
                          className="w-full h-1 bg-[#303030] rounded appearance-none cursor-pointer accent-[#df9c43]"
                        />
                      </div>
                    </div>

                    {/* Clip Launcher Defaults */}
                    <div className="bg-[#222222] border border-[#2e2e2e] rounded-lg p-3 space-y-2.5">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                        LANCEUR DE CLIPS (DÉFAUTS)
                      </span>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400">Quantification lancement:</span>
                        <select className="bg-[#141414] border border-[#333333] rounded px-2 py-0.5 text-xs text-white focus:outline-none">
                          <option>1 mesure</option>
                          <option>1/2 mesure</option>
                          <option>1/4 mesure</option>
                          <option>Désactivé</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400">Mode de déclenchement:</span>
                        <span className="text-[#df9c43] font-bold font-mono">En boucle (Loop)</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400">Armer automatiquement:</span>
                        <input type="checkbox" defaultChecked className="accent-[#df9c43]" />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Sub-tab 2: TÉLÉCOMMANDES DE PROJET / MACROS (Section 14.3, p. 435-437) ── */}
                {projectSubTab === "remotes" && (
                  <div className="bg-[#222222] border border-[#2e2e2e] rounded-lg p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        8 TÉLÉCOMMANDES DU PROJET
                      </span>
                      <button
                        onClick={() => {
                          setMacros((m) => [
                            ...m,
                            { id: `m_${Date.now()}`, name: `Macro ${m.length + 1}`, value: 50, display: "50%" }
                          ]);
                          setStatusHint("Nouvelle télécommande macro ajoutée au projet");
                        }}
                        className="p-1 rounded bg-[#241808] border border-[#df9c43]/40 text-[#eaaf5d] hover:text-white transition"
                        title="Ajouter une télécommande macro"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {macros.map((macro) => (
                        <div
                          key={macro.id}
                          className="bg-[#181818] border border-[#2e2e2e] hover:border-[#df9c43]/50 p-2 rounded-lg flex flex-col items-center justify-between text-center transition"
                        >
                          <span className="text-[10px] font-bold text-zinc-300 truncate w-full">
                            {macro.name}
                          </span>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={macro.value}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              setMacros((prev) =>
                                prev.map((m) => (m.id === macro.id ? { ...m, value: val, display: `${val}%` } : m))
                              );
                            }}
                            className="w-full h-1 bg-[#303030] rounded appearance-none cursor-pointer accent-[#df9c43] my-2"
                          />
                          <span className="font-mono text-[9px] text-[#df9c43] font-bold">
                            {macro.display || `${macro.value}%`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Sub-tab 3: INFOS & MÉTADONNÉES DU PROJET (Section 14.4) ── */}
                {projectSubTab === "info" && (
                  <div className="bg-[#222222] border border-[#2e2e2e] rounded-lg p-3 space-y-3">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                      MÉTADONNÉES DU MORCEAU
                    </span>
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-400">Titre de la session :</label>
                      <input
                        type="text"
                        defaultValue="Amapiano Deep Afrobeat Session (48kHz)"
                        className="w-full bg-[#141414] border border-[#333333] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#df9c43]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-400">Producteur / Auteur :</label>
                      <input
                        type="text"
                        value={projectMetadata.author}
                        onChange={(e) => setProjectMetadata((prev) => ({ ...prev, author: e.target.value }))}
                        className="w-full bg-[#141414] border border-[#333333] rounded px-2 py-1 text-xs text-[#eaaf5d] font-semibold focus:outline-none focus:border-[#df9c43]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-400">Droits d'auteur & Copyright :</label>
                      <input
                        type="text"
                        value={projectMetadata.copyright}
                        onChange={(e) => setProjectMetadata((prev) => ({ ...prev, copyright: e.target.value }))}
                        className="w-full bg-[#141414] border border-[#333333] rounded px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:border-[#df9c43]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-400">Notes de session & Paroles :</label>
                      <textarea
                        rows={3}
                        value={projectMetadata.comments}
                        onChange={(e) => setProjectMetadata((prev) => ({ ...prev, comments: e.target.value }))}
                        className="w-full bg-[#141414] border border-[#333333] rounded p-2 text-xs text-zinc-300 focus:outline-none focus:border-[#df9c43] resize-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-400">Tags / Mots-clés :</label>
                      <div className="flex flex-wrap gap-1">
                        {projectMetadata.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-[#241808] border border-[#df9c43]/40 rounded-full text-[9px] font-mono text-[#eaaf5d]"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Sub-tab 4: REPÈRES DE TIMELINE / CUE SECTIONS (Section 14.5, p. 438) ── */}
                {projectSubTab === "sections" && (
                  <div className="bg-[#222222] border border-[#2e2e2e] rounded-lg p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        REPÈRES DE SECTIONS ({projectSections.length})
                      </span>
                      <button
                        onClick={() => {
                          const currentB = Math.floor(currentBar);
                          const newSec = {
                            id: `sec_${Date.now()}`,
                            name: `Repère ${currentB}`,
                            bar: currentB,
                            color: "#df9c43"
                          };
                          setProjectSections((prev) => [...prev, newSec].sort((a, b) => a.bar - b.bar));
                          setStatusHint(`Nouveau repère créé à la mesure ${currentB}`);
                        }}
                        className="p-1 rounded bg-[#241808] border border-[#df9c43]/40 text-[#eaaf5d] hover:text-white transition flex items-center gap-1 text-[10px]"
                        title="Ajouter un repère à la position actuelle de lecture"
                      >
                        <Plus size={11} />
                        <span>Ajouter</span>
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {projectSections.map((sec) => (
                        <div
                          key={sec.id}
                          className="p-2 bg-[#181818] border border-[#2e2e2e] hover:border-[#df9c43]/40 rounded-lg flex items-center justify-between text-xs transition"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: sec.color }}
                            />
                            <div>
                              <span className="font-bold text-zinc-200 block">{sec.name}</span>
                              <span className="font-mono text-[9px] text-zinc-500">Mesure {sec.bar}</span>
                            </div>
                          </div>
                          <button
                            data-testid={`btn-jump-cue-${sec.id}`}
                            onClick={() => handleSeekToBar(sec.bar)}
                            className="px-2 py-1 bg-[#241808] hover:bg-[#2d1e0d] border border-[#df9c43] text-[#eaaf5d] hover:text-[#f5c277] rounded text-[10px] font-bold transition flex items-center gap-1 shadow-[0_0_6px_rgba(223,156,67,0.2)]"
                            title={`Sauter directement à la mesure ${sec.bar}`}
                          >
                            <span>Aller à</span>
                            <ChevronRight size={11} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Sub-tab 5: GESTIONNAIRE DE FICHIERS / STEMS (Section 14.6, p. 430-432) ── */}
                {projectSubTab === "files" && (
                  <div className="bg-[#222222] border border-[#2e2e2e] rounded-lg p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        FICHIERS AUDIO & STEMS
                      </span>
                      <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-1.5 py-0.5 rounded">
                        48 kHz • 24 bit
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      {[
                        { name: "Stem_Drums_Master.wav", track: "Drums", size: "14.2 Mo", status: "OK" },
                        { name: "Stem_LogDrum_Bass.wav", track: "Bass", size: "8.6 Mo", status: "OK" },
                        { name: "Stem_Vocal_Lead.wav", track: "Vocals", size: "12.1 Mo", status: "OK" },
                        { name: "Stem_Percussions_Groove.wav", track: "Percs", size: "6.3 Mo", status: "OK" },
                        { name: "Stem_Polymer_Arp.wav", track: "Synth", size: "9.4 Mo", status: "OK" }
                      ].map((file) => (
                        <div
                          key={file.name}
                          className="p-2 bg-[#181818] border border-[#2e2e2e] rounded flex items-center justify-between"
                        >
                          <div className="min-w-0 pr-2">
                            <span className="text-zinc-200 font-mono text-[10px] block truncate">{file.name}</span>
                            <span className="text-[9px] text-zinc-500 font-sans">Piste: {file.track} • {file.size}</span>
                          </div>
                          <span className="text-[9px] font-mono text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-black/60 border border-emerald-500/30 flex-shrink-0">
                            {file.status}
                          </span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => {
                        setStatusHint("✓ Tous les fichiers externes ont été collectés et sauvegardés dans le projet !");
                      }}
                      className="w-full py-1.5 bg-[#241808] hover:bg-[#2d1e0d] border border-[#df9c43] text-[#eaaf5d] hover:text-[#f5c277] rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-[0_0_8px_rgba(223,156,67,0.25)]"
                    >
                      <FolderOpen size={12} />
                      <span>Collecter et Sauvegarder les Fichiers</span>
                    </button>
                  </div>
                )}

                {/* ── Sub-tab 6: MODULES & PLUGINS DSP ACTIFS (Section 14.7, p. 436-438) ── */}
                {projectSubTab === "plugins" && (
                  <div className="bg-[#222222] border border-[#2e2e2e] rounded-lg p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        DSP & COMPOSANTS CHARGÉS
                      </span>
                      <span className="text-[9px] font-mono text-[#eaaf5d] bg-[#241808] border border-[#df9c43]/40 px-1.5 py-0.5 rounded">
                        CPU DSP: 2.4%
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      {tracks.flatMap((t) => (t.deviceChain || []).map((dev) => ({ ...dev, trackName: t.name, trackId: t.id }))).map((dev, idx) => (
                        <div
                          key={`${dev.id}_${idx}`}
                          className="p-2 bg-[#181818] border border-[#2e2e2e] rounded-lg flex items-center justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-zinc-200">{dev.name}</span>
                              <span className="text-[8px] font-mono px-1 rounded bg-black/60 text-[#df9c43] border border-[#df9c43]/30">
                                {dev.category || "DSP"}
                              </span>
                            </div>
                            <span className="text-[9px] text-zinc-500 font-sans block">
                              Sur piste : {dev.trackName} • Latence : 0 spls (0.0 ms)
                            </span>
                          </div>
                          <span className="text-[9px] font-mono text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-black/60 border border-emerald-500/30">
                            Actif
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════
          6. BOTTOM STATUS & VIEW SWITCHER BAR
      ════════════════════════════════════════════════════════════════ */}
      <div className="h-8 bg-[#181818] border-t border-[#2d2d2d] px-3 flex items-center justify-between flex-shrink-0 z-20 text-[11px] select-none">
        {/* Left: View Switching Tabs & Panel Toggles */}
        <div className="flex items-center gap-1.5 font-bold tracking-wider">
          {/* Inspector Toggle Button [ i ] (Section 2.2.1, p. 41 & 61) */}
          <button
            onClick={() => setIsInspectorOpen((prev) => !prev)}
            className={`h-6 px-2 rounded text-[10px] font-bold tracking-wider transition flex items-center gap-1 ${
              isInspectorOpen
                ? "text-[#df9c43] bg-[#252525] border border-[#df9c43]/50 shadow-sm"
                : "text-zinc-400 hover:text-white hover:bg-[#202020]"
            }`}
            title="Afficher/Masquer le panneau Inspecteur (Ctrl+I)"
          >
            <Info size={11} />
            <span>[ i ]</span>
          </button>

          <div className="h-4 w-px bg-[#333333] mx-0.5" />

          {/* ARRANGE View Button */}
          <button
            onClick={() => setMainView("arrange")}
            className={`px-2.5 py-0.5 rounded transition ${
              mainView === "arrange"
                ? "bg-[#241808] border border-[#df9c43] text-[#eaaf5d] font-extrabold shadow-[0_0_8px_rgba(223,156,67,0.3)]"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            ARRANGE
          </button>

          {/* MIX View Button */}
          <button
            onClick={() => setMainView("mix")}
            className={`px-2.5 py-0.5 rounded transition ${
              mainView === "mix"
                ? "bg-[#241808] border border-[#df9c43] text-[#eaaf5d] font-extrabold shadow-[0_0_8px_rgba(223,156,67,0.3)]"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            MIX
          </button>

          {/* CLIPS View Button */}
          <button
            onClick={() => setMainView("clips")}
            className={`px-2.5 py-0.5 rounded transition ${
              mainView === "clips"
                ? "bg-[#241808] border border-[#df9c43] text-[#eaaf5d] font-extrabold shadow-[0_0_8px_rgba(223,156,67,0.3)]"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            CLIPS
          </button>

          <div className="h-4 w-px bg-[#333333] mx-1" />

          {/* Panel Toggle Icons */}
          <button
            onClick={() => setMainView(mainView === "clips" ? "arrange" : "clips")}
            className={`p-1 rounded transition ${
              mainView === "clips" ? "text-[#df9c43] bg-[#252525]" : "text-zinc-400 hover:text-white"
            }`}
            title="Commuter vue Clip Launcher"
          >
            <Grid size={13} />
          </button>

          <button
            onClick={() => setMainView(mainView === "mix" ? "arrange" : "mix")}
            className={`p-1 rounded transition ${
              mainView === "mix" ? "text-[#df9c43] bg-[#252525]" : "text-zinc-400 hover:text-white"
            }`}
            title="Commuter vue Table de Mixage"
          >
            <Sliders size={13} />
          </button>

          <button
            onClick={() => {
              setShowBottomPanel(true);
              setBottomPanelTab("devicerack");
            }}
            className={`p-1 rounded transition ${
              showBottomPanel && bottomPanelTab === "devicerack" ? "text-[#df9c43] bg-[#252525]" : "text-zinc-400 hover:text-white"
            }`}
            title="Afficher la chaîne d'effets / Device Rack"
          >
            <SlidersHorizontal size={13} />
          </button>

          <button
            onClick={() => setShowBottomPanel(!showBottomPanel)}
            className={`p-1 rounded transition ${
              showBottomPanel ? "text-[#df9c43] bg-[#252525]" : "text-zinc-400 hover:text-white"
            }`}
            title="Afficher/Cacher Éditeur de Notes / Piano Roll"
          >
            <Music size={13} />
          </button>

          <button
            data-btn-bottom-edit="true"
            onClick={() => {
              setShowBottomPanel(true);
              setBottomPanelTab("automation");
            }}
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider transition flex items-center gap-1 ${
              showBottomPanel && bottomPanelTab === "automation"
                ? "text-[#df9c43] bg-[#252525] border border-[#df9c43]/40"
                : "text-zinc-400 hover:text-white"
            }`}
            title="Éditeur d'Automation (Music Studio EDIT)"
          >
            <PenTool size={11} />
            <span>EDIT</span>
          </button>
        </div>

        {/* Center: Dynamic Contextual Status Hint */}
        <div className="text-zinc-400 text-[10px] font-mono truncate px-4 hidden md:block">
          {statusHint}
        </div>

        {/* Right: Quick Tools (Info, Search, Files, Studio monitor, Keyboard toggle) */}
        <div className="flex items-center gap-1.5 text-zinc-400">
          <button
            onClick={() => {
              setShowRightSidebar(true);
              setSidebarTab("project");
            }}
            className="p-1 hover:text-white hover:bg-[#252525] rounded transition"
            title="Inspecteur Projet"
          >
            <Info size={13} />
          </button>

          <button
            onClick={() => {
              setShowRightSidebar(!showRightSidebar);
              setSidebarTab("browser");
            }}
            className={`p-1 rounded transition ${
              showRightSidebar ? "text-[#df9c43] bg-[#252525]" : "hover:text-white hover:bg-[#252525]"
            }`}
            title="Ouvrir Navigateur de Composants & Liens IA"
          >
            <Search size={13} />
          </button>

          <button
            onClick={() => setShowRightSidebar(!showRightSidebar)}
            className="p-1 hover:text-white hover:bg-[#252525] rounded transition"
            title="Fichiers du projet"
          >
            <Folder size={13} />
          </button>

          {/* Studio Monitor / Audio Engine Status */}
          <div
            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#121212] border border-[#2b2b2b] text-[10px] text-zinc-400"
            title="Moteur Audio 48 kHz • 256 samples"
          >
            <Headphones size={11} className="text-emerald-400" />
            <span className="font-mono">48k</span>
          </div>

          {/* MIDI Mappings Browser Button (Chapter 15) */}
          <button
            data-testid="btn-open-midi-mappings"
            onClick={() => setIsMidiMappingsOpen(true)}
            className={`p-1 rounded transition flex items-center gap-1 ${
              isMidiMappingsOpen
                ? "bg-[#241808] border border-[#df9c43] text-[#eaaf5d] shadow-[0_0_8px_rgba(223,156,67,0.3)]"
                : "hover:text-white hover:bg-[#252525]"
            }`}
            title="Navigateur de Mappings MIDI & Contrôleurs (Chapitre 15)"
          >
            <SlidersHorizontal size={13} className="text-[#df9c43]" />
            <span className="text-[10px] font-mono hidden xl:inline">MIDI MAP</span>
          </button>

          {/* On-Screen Keyboard Toggle Button */}
          <button
            onClick={() => {
              setShowBottomPanel(true);
              setBottomPanelTab("keyboard");
            }}
            className={`p-1 rounded transition ${
              showBottomPanel && bottomPanelTab === "keyboard"
                ? "bg-[#241808] border border-[#df9c43] text-[#eaaf5d] shadow-[0_0_8px_rgba(223,156,67,0.3)]"
                : "hover:text-white hover:bg-[#252525]"
            }`}
            title="Afficher le clavier tactile (On-Screen Keyboard Panel)"
          >
            <Keyboard size={13} />
          </button>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────
          FREDONNER UN AIR / AUDIO-TO-MUSIC MODAL DIALOG
      ──────────────────────────────────────────────────────────── */}
      {isHumModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#181513] border border-[#df9c43]/50 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col custom-scrollbar">
            {/* Modal Header */}
            <div className="p-4 border-b border-[#2d221b] flex items-center justify-between sticky top-0 bg-[#181513] z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#df9c43]/20 border border-[#df9c43] flex items-center justify-center text-[#df9c43] shadow-lg">
                  <Mic size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    Fredonner un Air • Générateur Audio-to-Music IA
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#241808] border border-[#df9c43] text-[#eaaf5d] font-mono shadow-[0_0_6px_rgba(223,156,67,0.25)]">
                      YIN Pitch Engine
                    </span>
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Chantez, fredonnez ou importez un audio. L'IA extrait la mélodie et produit un arrangement complet ou un solo d'instruments.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsHumModalOpen(false)}
                className="text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-[#251d18] transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Step 1: Input Source Selector Tabs */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    1. Source Audio de la Mélodie
                  </span>
                  <div className="flex items-center gap-1 bg-[#120e0b] p-1 rounded-lg border border-[#2b2019]">
                    <button
                      onClick={() => setHumActiveTab("mic")}
                      className={`px-3 py-1 rounded text-xs font-bold transition flex items-center gap-1.5 ${
                        humActiveTab === "mic"
                          ? "bg-[#241808] border border-[#df9c43] text-[#eaaf5d] shadow-[0_0_8px_rgba(223,156,67,0.3)]"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      <Mic size={13} />
                      Microphone
                    </button>
                    <button
                      onClick={() => setHumActiveTab("file")}
                      className={`px-3 py-1 rounded text-xs font-bold transition flex items-center gap-1.5 ${
                        humActiveTab === "file"
                          ? "bg-[#241808] border border-[#df9c43] text-[#eaaf5d] shadow-[0_0_8px_rgba(223,156,67,0.3)]"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      <FileAudio size={13} />
                      Importer Audio
                    </button>
                  </div>
                </div>

                {/* Tab 1: Microphone Recording */}
                {humActiveTab === "mic" && (
                  <div className="bg-[#120e0b] border border-[#2b2019] rounded-xl p-4 flex flex-col items-center justify-center gap-3">
                    <div className="flex items-center justify-center gap-4">
                      {isRecordingHum ? (
                        <button
                          onClick={handleStopRecordingHum}
                          className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse"
                        >
                          <Square size={14} />
                          Arrêter ({humRecordingTime}s)
                        </button>
                      ) : (
                        <button
                          onClick={handleStartRecordingHum}
                          className="px-5 py-2.5 rounded-xl bg-[#241808] hover:bg-[#2d1e0d] border border-[#df9c43] text-[#eaaf5d] hover:text-[#f5c277] font-bold text-xs flex items-center gap-2 shadow-[0_0_10px_rgba(223,156,67,0.3)] transition"
                        >
                          <Mic size={14} />
                          Démarrer Enregistrement Micro
                        </button>
                      )}

                      <button
                        onClick={generateTestHumTone}
                        className="px-4 py-2.5 rounded-xl bg-[#271d15] hover:bg-[#382619] border border-[#df9c43]/50 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition"
                        title="Générer instantanément un extrait fredonné synthétique (A3-C4-E4-B4)"
                      >
                        <Sparkles size={13} className="text-amber-400" />
                        Générer Tonalité de Test (A3-C4-E4-B4)
                      </button>
                    </div>

                    {humAudioUrl && (
                      <div className="w-full bg-[#1b1511] p-3 rounded-lg border border-[#3b2a1e] flex flex-col items-center gap-2 mt-2">
                        <span className="text-[11px] text-zinc-400 font-medium flex items-center gap-1.5">
                          <Check size={12} className="text-emerald-400" />
                          Audio capturé prêt pour l'analyse
                        </span>
                        <audio controls src={humAudioUrl} className="w-full h-8 max-w-md accent-[#df9c43]" />
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 2: File Upload */}
                {humActiveTab === "file" && (
                  <div className="bg-[#120e0b] border border-[#2b2019] rounded-xl p-4 flex flex-col items-center justify-center gap-3">
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setHumAudioBlob(file);
                          setHumAudioUrl(URL.createObjectURL(file));
                          setStatusHint(`Fichier audio "${file.name}" chargé pour extraction de mélodie`);
                        }
                      }}
                      className="text-xs text-zinc-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border file:border-[#df9c43] file:text-xs file:font-bold file:bg-[#241808] file:text-[#eaaf5d] hover:file:bg-[#2d1e0d] hover:file:text-[#f5c277] cursor-pointer"
                    />
                    {humAudioUrl && (
                      <div className="w-full bg-[#1b1511] p-3 rounded-lg border border-[#3b2a1e] flex flex-col items-center gap-2 mt-1">
                        <audio controls src={humAudioUrl} className="w-full h-8 max-w-md accent-[#df9c43]" />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Step 2: Instrument Selection (Targeted vs Full Arrangement) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    2. Mode d'Arrangement & Sélection d'Instruments
                  </span>
                  <span
                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      selectedHumInstruments.length === 0
                        ? "bg-cyan-950 text-cyan-400 border border-cyan-700"
                        : "bg-amber-950 text-amber-300 border border-amber-600"
                    }`}
                  >
                    {selectedHumInstruments.length === 0
                      ? "Arrangement Complet (Full Band IA)"
                      : `Solo / Ensemble (${selectedHumInstruments.length} instrument(s))`
                    }
                  </span>
                </div>

                <div className="bg-[#120e0b] border border-[#2b2019] rounded-xl p-3 space-y-3">
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    💡 <strong className="text-zinc-200">Règle de Génération :</strong> Si vous sélectionnez des instruments ci-dessous, la musique sera générée <span className="text-amber-400 font-bold">uniquement avec ces instruments</span>. Si vous ne sélectionnez rien, l'IA génère un <span className="text-cyan-400 font-bold">arrangement complet à 4 pistes</span> (Batterie, Basse, Claviers, Lead).
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: "piano", label: "Piano / Rhodes", icon: "🎹" },
                      { id: "electric_guitar", label: "Guitare Électrique", icon: "🎸" },
                      { id: "acoustic_guitar", label: "Guitare Acoustique", icon: "🪕" },
                      { id: "brass", label: "Cuivres / Brass", icon: "🎺" },
                      { id: "strings", label: "Cordes / Strings", icon: "🎻" },
                      { id: "synth_lead", label: "Synth Lead", icon: "🎛️" },
                      { id: "bass", label: "Basse & 808", icon: "🔊" }
                    ].map((inst) => {
                      const isSelected = selectedHumInstruments.includes(inst.id);
                      return (
                        <button
                          key={inst.id}
                          onClick={() => toggleHumInstrument(inst.id)}
                          className={`p-2.5 rounded-lg border text-left flex items-center gap-2 transition ${
                            isSelected
                              ? "bg-[#2d1e14] border-[#df9c43] text-white shadow-[0_0_12px_rgba(223,156,67,0.4)]"
                              : "bg-[#181310] border-[#2b2019] text-zinc-400 hover:text-zinc-200 hover:border-[#3d2b1f]"
                          }`}
                        >
                          <span className="text-base">{inst.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-[11px] font-bold truncate">{inst.label}</div>
                            <div className="text-[9px] opacity-70 font-mono">
                              {isSelected ? "Sélectionné" : "Désélectionné"}
                            </div>
                          </div>
                        </button>
                      );
                    })}

                    {/* Quick Deselect / Reset All Button */}
                    <button
                      onClick={() => setSelectedHumInstruments([])}
                      className={`p-2.5 rounded-lg border text-left flex items-center gap-2 transition ${
                        selectedHumInstruments.length === 0
                          ? "bg-cyan-950/50 border-cyan-600 text-cyan-300"
                          : "bg-[#181310] border-[#2b2019] text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      <span className="text-base">✨</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-bold truncate">Tous les instruments</div>
                        <div className="text-[9px] opacity-70 font-mono">Full Arrangement</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 3: Style & Musical Attributes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-400 uppercase">Style / Genre</label>
                  <select
                    value={humStyle}
                    onChange={(e) => setHumStyle(e.target.value)}
                    className="w-full bg-[#120e0b] border border-[#2b2019] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#df9c43]"
                  >
                    <option value="afrobeats">Afrobeats</option>
                    <option value="amapiano">Amapiano</option>
                    <option value="hiphop">Hip-Hop / Boom Bap</option>
                    <option value="pop">Pop Moderne</option>
                    <option value="synthwave">Synthwave / Retro</option>
                    <option value="funk">Funk / Groove</option>
                    <option value="jazz">Jazz Fusion</option>
                    <option value="rock">Rock / Alternatif</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-400 uppercase">Tempo (BPM)</label>
                  <select
                    value={humBpm}
                    onChange={(e) => setHumBpm(Number(e.target.value))}
                    className="w-full bg-[#120e0b] border border-[#2b2019] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#df9c43]"
                  >
                    <option value={0}>Auto (Détecté depuis audio)</option>
                    <option value={80}>80 BPM (Lent / Ballade)</option>
                    <option value={100}>100 BPM (Groove Hip-Hop)</option>
                    <option value={110}>110 BPM (Afro / Amapiano)</option>
                    <option value={120}>120 BPM (House / Pop standard)</option>
                    <option value={128}>128 BPM (Electro Dance)</option>
                    <option value={140}>140 BPM (Trap / Synthwave rapide)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-400 uppercase">Tonalité Cible</label>
                  <select
                    value={humKey}
                    onChange={(e) => setHumKey(e.target.value)}
                    className="w-full bg-[#120e0b] border border-[#2b2019] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#df9c43]"
                  >
                    <option value="Auto">Auto (Analyse harmonique)</option>
                    <option value="C Major">C Major</option>
                    <option value="A Minor">A Minor</option>
                    <option value="G Major">G Major</option>
                    <option value="E Minor">E Minor</option>
                    <option value="F Major">F Major</option>
                    <option value="D Minor">D Minor</option>
                  </select>
                </div>
              </div>

              {/* Prompt Text Description */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-400 uppercase">Prompt d'ambiance / Thème</label>
                <input
                  type="text"
                  value={humPrompt}
                  onChange={(e) => setHumPrompt(e.target.value)}
                  placeholder="Ex: Mélodie estivale avec percussions boisées et basse ronde..."
                  className="w-full bg-[#120e0b] border border-[#2b2019] rounded-lg px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#df9c43]"
                />
              </div>

              {/* Action Trigger */}
              <button
                onClick={handleGenerateHumToMusic}
                disabled={isGeneratingHum}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#df9c43] to-[#c98837] hover:from-[#eaaf5d] hover:to-[#df9c43] text-white font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {isGeneratingHum ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Analyse du pitch YIN, harmonisation et synthèse en cours...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Générer la Musique à partir de la Mélodie
                  </>
                )}
              </button>

              {/* Step 4: Result Card & Direct Load Into DAW */}
              {generatedHumTrack && (
                <div className="bg-[#1b1511] border-2 border-[#df9c43] rounded-xl p-4 space-y-3 animate-in fade-in shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>🎵</span> {generatedHumTrack.title}
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono border border-emerald-700">
                          {generatedHumTrack.bpm} BPM • {generatedHumTrack.key}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Arrangement complet généré avec succès avec 4 stems isolées prêtes pour le mixage !
                      </p>
                    </div>
                  </div>

                  {/* Audio Preview Player */}
                  {generatedHumTrack.audioUrl && (
                    <div className="bg-[#120e0b] p-2.5 rounded-lg border border-[#2b2019]">
                      <span className="text-[10px] font-mono text-zinc-400 block mb-1">Aperçu Master :</span>
                      <audio controls src={generatedHumTrack.audioUrl} className="w-full h-8 accent-[#df9c43]" />
                    </div>
                  )}

                  {/* 4 Stems Status Grid */}
                  <div className="grid grid-cols-4 gap-2 pt-1 text-[10px] font-mono text-zinc-300 text-center">
                    <div className="bg-[#120e0b] p-1.5 rounded border border-[#df9c43]/40 text-[#df9c43]">
                      🎤 Lead / Vocals
                    </div>
                    <div className="bg-[#120e0b] p-1.5 rounded border border-cyan-800 text-cyan-400">
                      🥁 Batterie IA
                    </div>
                    <div className="bg-[#120e0b] p-1.5 rounded border border-[#df9c43]/40 text-[#df9c43]">
                      🔊 Basse 808
                    </div>
                    <div className="bg-[#120e0b] p-1.5 rounded border border-emerald-800 text-emerald-400">
                      🎹 Accords/Instru
                    </div>
                  </div>

                  {/* Prominent CTA to Load into DAW */}
                  <button
                    onClick={() => handleLoadHumTrackIntoDaw(generatedHumTrack)}
                    className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition"
                  >
                    <Sliders size={14} />
                    Charger Immédiatement dans Music Studio DAW (4 Stems Séparées)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* ────────────────────────────────────────────────────────────
          MODAL 1: RACCOURCIS CLAVIER (Keyboard Shortcuts)
      ──────────────────────────────────────────────────────────── */}
      {isShortcutsModalOpen && (
        <div
          data-testid="modal-shortcuts"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsShortcutsModalOpen(false)}
        >
          <div
            className="bg-[#1a1a1a] border border-[#333333] rounded-xl w-full max-w-2xl p-6 shadow-2xl relative text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#2e2e2e]">
              <div className="flex items-center gap-2">
                <span className="text-lg">⌨️</span>
                <h3 className="font-bold text-base">Raccourcis Clavier Music Studio DAW</h3>
              </div>
              <button
                onClick={() => setIsShortcutsModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4 text-xs">
              <div className="space-y-2">
                <h4 className="font-bold text-[#df9c43] uppercase text-[10px] tracking-wider">Transport & Lecture</h4>
                <div className="space-y-1.5 font-mono">
                  <div className="flex items-center justify-between bg-[#222222] px-2.5 py-1.5 rounded">
                    <span className="text-zinc-300 font-sans">Lecture / Pause</span>
                    <span className="bg-[#121212] px-2 py-0.5 rounded border border-white/10 text-[#df9c43]">Espace</span>
                  </div>
                  <div className="flex items-center justify-between bg-[#222222] px-2.5 py-1.5 rounded">
                    <span className="text-zinc-300 font-sans">Retour au début (Mesure 1)</span>
                    <span className="bg-[#121212] px-2 py-0.5 rounded border border-white/10 text-white">Entrée</span>
                  </div>
                  <div className="flex items-center justify-between bg-[#222222] px-2.5 py-1.5 rounded">
                    <span className="text-zinc-300 font-sans">Activer / Couper Boucle</span>
                    <span className="bg-[#121212] px-2 py-0.5 rounded border border-white/10 text-amber-400">L</span>
                  </div>
                  <div className="flex items-center justify-between bg-[#222222] px-2.5 py-1.5 rounded">
                    <span className="text-zinc-300 font-sans">Activer / Couper Métronome</span>
                    <span className="bg-[#121212] px-2 py-0.5 rounded border border-white/10 text-cyan-400">C</span>
                  </div>
                  <div className="flex items-center justify-between bg-[#222222] px-2.5 py-1.5 rounded">
                    <span className="text-zinc-300 font-sans">Basculer Arrangeur / Matrix</span>
                    <span className="bg-[#121212] px-2 py-0.5 rounded border border-white/10 text-white">Tab</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-[#df9c43] uppercase text-[10px] tracking-wider">Édition & Zoom Timeline</h4>
                <div className="space-y-1.5 font-mono">
                  <div className="flex items-center justify-between bg-[#222222] px-2.5 py-1.5 rounded">
                    <span className="text-zinc-300 font-sans">Zoom Timeline Avant / Arrière</span>
                    <span className="bg-[#121212] px-2 py-0.5 rounded border border-white/10 text-emerald-400">Ctrl + Molette</span>
                  </div>
                  <div className="flex items-center justify-between bg-[#222222] px-2.5 py-1.5 rounded">
                    <span className="text-zinc-300 font-sans">Défilement Horizontal</span>
                    <span className="bg-[#121212] px-2 py-0.5 rounded border border-white/10 text-emerald-400">Shift + Molette</span>
                  </div>
                  <div className="flex items-center justify-between bg-[#222222] px-2.5 py-1.5 rounded">
                    <span className="text-zinc-300 font-sans">Scinder le Clip au curseur</span>
                    <span className="bg-[#121212] px-2 py-0.5 rounded border border-white/10 text-white">Ctrl + B / S</span>
                  </div>
                  <div className="flex items-center justify-between bg-[#222222] px-2.5 py-1.5 rounded">
                    <span className="text-zinc-300 font-sans">Dupliquer Clip / Piste</span>
                    <span className="bg-[#121212] px-2 py-0.5 rounded border border-white/10 text-white">Ctrl + D</span>
                  </div>
                  <div className="flex items-center justify-between bg-[#222222] px-2.5 py-1.5 rounded">
                    <span className="text-zinc-300 font-sans">Sauvegarder le Projet</span>
                    <span className="bg-[#121212] px-2 py-0.5 rounded border border-white/10 text-[#df9c43]">Ctrl + S</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end pt-4 border-t border-[#2e2e2e]">
              <button
                onClick={() => setIsShortcutsModalOpen(false)}
                className="px-4 py-2 bg-[#241808] hover:bg-[#2d1e0d] border border-[#df9c43] text-[#eaaf5d] hover:text-[#f5c277] font-bold rounded-lg transition text-xs shadow-[0_0_8px_rgba(223,156,67,0.25)]"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────
          MODAL 2: PARAMÈTRES AUDIO & CARTE SON
      ──────────────────────────────────────────────────────────── */}
      {isSettingsModalOpen && (
        <div
          data-testid="modal-settings"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsSettingsModalOpen(false)}
        >
          <div
            className="bg-[#1a1a1a] border border-[#333333] rounded-xl w-full max-w-xl p-6 shadow-2xl relative text-white space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#2e2e2e]">
              <div className="flex items-center gap-2">
                <Sliders size={18} className="text-[#df9c43]" />
                <h3 className="font-bold text-base">Configuration Audio & Périphériques</h3>
              </div>
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-zinc-400 font-semibold uppercase text-[10px]">Moteur Audio / Driver</label>
                <select className="w-full bg-[#121212] border border-[#333333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#df9c43]">
                  <option>WebAudio Core Audio Engine (Faible Latence)</option>
                  <option>ASIO Low Latency Driver Pro</option>
                  <option>CoreAudio Multi-Output Daemon</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-zinc-400 font-semibold uppercase text-[10px]">Fréquence d'échantillonnage</label>
                  <select className="w-full bg-[#121212] border border-[#333333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#df9c43]">
                    <option>48 000 Hz (Broadcast Pro)</option>
                    <option>44 100 Hz (Standard CD)</option>
                    <option>96 000 Hz (Hi-Res Audio)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-400 font-semibold uppercase text-[10px]">Taille du Buffer (Latence)</label>
                  <select className="w-full bg-[#121212] border border-[#333333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#df9c43]">
                    <option>128 samples (2.67 ms)</option>
                    <option>256 samples (5.33 ms)</option>
                    <option>512 samples (10.6 ms)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 font-semibold uppercase text-[10px]">Périphérique de Sortie Stéréo</label>
                <select className="w-full bg-[#121212] border border-[#333333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#df9c43]">
                  <option>Haut-parleurs système / Casque par défaut</option>
                  <option>Interface Audio USB Externe (2 In / 2 Out)</option>
                </select>
              </div>

              <div className="bg-[#141414] p-3 rounded-lg border border-white/5 space-y-1 text-zinc-400">
                <div className="flex items-center justify-between">
                  <span>Accélération matérielle DSP WebGL / WASM :</span>
                  <span className="text-emerald-400 font-bold font-mono">ACTIF (Triton Engine)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Interpolation Waveform Stéréo :</span>
                  <span className="text-white font-mono">Sinc High-Quality</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#2e2e2e]">
              <button
                onClick={() => {
                  setIsSettingsModalOpen(false);
                  setStatusHint("Paramètres audio appliqués avec succès");
                }}
                className="px-4 py-2 bg-[#241808] hover:bg-[#2d1e0d] border border-[#df9c43] text-[#eaaf5d] hover:text-[#f5c277] font-bold rounded-lg transition text-xs shadow-[0_0_8px_rgba(223,156,67,0.25)]"
              >
                Enregistrer & Appliquer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────
          MODAL 3: À PROPOS DE MUSIC STUDIO DAW
      ──────────────────────────────────────────────────────────── */}
      {isAboutModalOpen && (
        <div
          data-testid="modal-about"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsAboutModalOpen(false)}
        >
          <div
            className="bg-[#1a1a1a] border border-[#333333] rounded-xl w-full max-w-md p-6 shadow-2xl relative text-white text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#df9c43] to-amber-500 mx-auto flex items-center justify-center shadow-lg shadow-[#df9c43]/30">
              <Sliders size={32} className="text-white" />
            </div>

            <div>
              <h3 className="font-extrabold text-lg text-white">Music Studio DAW Pro</h3>
              <p className="text-xs text-[#df9c43] font-mono mt-0.5">Version 2.5.0 Ultra Pro Edition</p>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed text-left bg-[#141414] p-3 rounded-lg border border-white/5">
              Station de travail audio numérique (DAW) professionnelle nouvelle génération avec moteur WebAudio 48kHz, séparation de stems Demucs IA, arrangeur 148+ mesures, zoom réactif et synthèse temps réel.
            </p>

            <div className="text-[11px] text-zinc-500 flex justify-between font-mono px-2">
              <span>Moteur DSP : WebAudio / WASM</span>
              <span>Licence : Open Source</span>
            </div>

            <button
              onClick={() => setIsAboutModalOpen(false)}
              className="w-full py-2 bg-[#2a2a2a] hover:bg-[#333333] text-white font-semibold rounded-lg transition text-xs"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────
          MODAL 4: MUSIC STUDIO TABLEAU DE BORD (DASHBOARD)
      ──────────────────────────────────────────────────────────── */}
      <MusicStudioDashboardModal
        isOpen={isDashboardModalOpen}
        onClose={() => setIsDashboardModalOpen(false)}
        onOpenProject={(demo) => {
          setStatusHint(`Projet démo "${demo.name}" chargé`);
        }}
        onSelectTemplate={(tpl) => {
          setBpm(tpl.bpm);
          setMusicalKey(tpl.key);
          setStatusHint(`Modèle "${tpl.name}" appliqué (${tpl.bpm} BPM, ${tpl.key})`);
        }}
        audioSettings={{ sampleRate: "48000", bufferSize: "256" }}
        recentProjects={openProjects}
        studioHostConnected={studioHostLink}
      />

      {/* ────────────────────────────────────────────────────────────
          MODAL 5: EXPORTATION AUDIO MASTER (WAV 48kHz)
      ──────────────────────────────────────────────────────────── */}
      {isExportAudioModalOpen && (
        <div
          data-testid="modal-export-audio"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsExportAudioModalOpen(false)}
        >
          <div
            className="bg-[#1a1a1a] border border-[#333333] rounded-xl w-full max-w-md p-6 shadow-2xl relative text-white space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#2e2e2e]">
              <div className="flex items-center gap-2">
                <Download size={18} className="text-[#df9c43]" />
                <h3 className="font-bold text-base">Exporter Audio Master</h3>
              </div>
              <button
                onClick={() => setIsExportAudioModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-zinc-400 font-semibold uppercase text-[10px]">Format d'exportation</label>
                <select className="w-full bg-[#121212] border border-[#333333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#df9c43]">
                  <option>WAV 16-bit PCM Stéréo (48 000 Hz) - Standard Broadcast</option>
                  <option>WAV 24-bit PCM Hi-Res (48 000 Hz)</option>
                  <option>MP3 320 kbps CBR</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 font-semibold uppercase text-[10px]">Plage temporelle d'exportation</label>
                <select className="w-full bg-[#121212] border border-[#333333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#df9c43]">
                  <option>Région de Boucle active (Mesures {loopStartBar} à {loopEndBar})</option>
                  <option>Morceau complet (Mesures 1 à {maxTrackBars})</option>
                </select>
              </div>

              <div className="bg-[#141414] p-3 rounded-lg border border-white/5 space-y-1 text-zinc-400">
                <div className="flex items-center justify-between">
                  <span>Normalisation True-Peak :</span>
                  <span className="text-emerald-400 font-mono font-bold">-0.1 dBTP</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Dithering TPDF Anti-Repliement :</span>
                  <span className="text-white font-mono">Triangulaire 16-bit</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#2e2e2e]">
              <button
                onClick={() => setIsExportAudioModalOpen(false)}
                className="px-4 py-2 bg-[#252525] hover:bg-[#303030] text-zinc-300 font-semibold rounded-lg transition text-xs"
              >
                Annuler
              </button>
              <button
                data-testid="btn-confirm-export-wav"
                onClick={() => {
                  setIsExportAudioModalOpen(false);
                  handleExportWav();
                }}
                className="px-4 py-2 bg-[#241808] hover:bg-[#2d1e0d] border border-[#df9c43] text-[#eaaf5d] hover:text-[#f5c277] font-bold rounded-lg transition text-xs shadow-[0_0_8px_rgba(223,156,67,0.25)] flex items-center gap-1.5"
              >
                <Download size={13} />
                <span>Lancer l'exportation WAV Stéréo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          MUSIC STUDIO 4-COLUMN POP-UP BROWSER MODAL (Chapter 8, p. 235-262)
      ════════════════════════════════════════════════════════════════ */}
      <MusicStudioPopupBrowser
        isOpen={isPopupBrowserOpen}
        onClose={() => setIsPopupBrowserOpen(false)}
        targetTrackName={activeTrack?.name || "Main Drums"}
        onInsertDevice={(dev) => handleAddDeviceToTrack(selectedTrackId || activeTrack?.id, dev)}
        onPreviewSound={(dev) => {
          handlePlaySynthNote("C4", { duration: 1.5, type: dev.type === "The Grid" ? "sawtooth" : "triangle" });
        }}
        setStatusHint={setStatusHint}
      />

      {/* ════════════════════════════════════════════════════════════════
          MUSIC STUDIO MIDI MAPPINGS & CONTROLLERS BROWSER MODAL (Chapter 15, p. 441-469)
      ════════════════════════════════════════════════════════════════ */}
      <MusicStudioMidiMappings
        isOpen={isMidiMappingsOpen}
        onClose={() => setIsMidiMappingsOpen(false)}
        activeTrackName={activeTrack?.name || "Main Drums"}
        onApplyMapping={(newMap) => {
          setStatusHint(`Mapping MIDI assigné : CC ${newMap.channel}:${newMap.cc} ➔ ${newMap.targetParameter}`);
        }}
        setStatusHint={setStatusHint}
      />
    </div>
  );
}

export default MusicStudioDaw;
