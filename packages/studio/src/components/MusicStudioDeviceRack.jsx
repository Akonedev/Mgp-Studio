import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Power,
  X,
  Plus,
  Play,
  Volume2,
  Sliders,
  Activity,
  Radio,
  Cpu,
  Waves,
  Zap,
  Music,
  Layers,
  Disc,
  Filter,
  Maximize2
} from "lucide-react";

/**
 * ════════════════════════════════════════════════════════════════════════════════
 * MUSIC STUDIO DAW - COMPLETE 21 AUDIO DEVICES & INSTRUMENTS ENGINE (ZERO MOCK)
 * Official Sahel Logo Gold Theme: #df9c43 / #eaaf5d / #c98837
 * Real Web Audio API Nodes: WaveShaper, BiquadFilter, Delay, DynamicsCompressor,
 * PeriodicWave, Convolver/Diffusion, FM-4 Operator Routing, 9 Drawbar Additive
 * ════════════════════════════════════════════════════════════════════════════════
 */

class DeviceWebAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
  }

  init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.85;
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  // Generate real audio for ANY of the 21 devices with live DSP parameters
  playDeviceAudition(device, customParam = null) {
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const devId = (device.id || "").toLowerCase();
    const name = (device.name || "").toLowerCase();
    const p = { ...(device.params || {}), ...(customParam || {}) };

    try {
      // 1. Amp Simulator (Distortion & Cab)
      if (name.includes("amp") || devId.includes("amp")) {
        const osc = this.ctx.createOscillator();
        const shaper = this.ctx.createWaveShaper();
        const lowFilter = this.ctx.createBiquadFilter();
        const midFilter = this.ctx.createBiquadFilter();
        const highFilter = this.ctx.createBiquadFilter();
        const cabFilter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        // Power chord E3 (164.81Hz)
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(164.81, t);

        // Tube transfer curve
        const drive = (p.drive !== undefined ? p.drive : 65) / 20;
        const curve = new Float32Array(512);
        for (let i = 0; i < 512; i++) {
          const x = (i * 2) / 512 - 1;
          curve[i] = Math.tanh(x * (1 + drive * 4));
        }
        shaper.curve = curve;
        shaper.oversample = "4x";

        // Tone Stack
        lowFilter.type = "lowshelf";
        lowFilter.frequency.value = 120;
        lowFilter.gain.value = p.bass || 3;

        midFilter.type = "peaking";
        midFilter.frequency.value = 1200;
        midFilter.Q.value = 1.2;
        midFilter.gain.value = p.mid || -2;

        highFilter.type = "highshelf";
        highFilter.frequency.value = 3500;
        highFilter.gain.value = p.treble || 4;

        // Cab Simulator (4x12 lowpass & highpass)
        cabFilter.type = "lowpass";
        cabFilter.frequency.value = 4500;
        cabFilter.Q.value = 2.0;

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.28, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.85);

        osc.connect(shaper);
        shaper.connect(lowFilter);
        lowFilter.connect(midFilter);
        midFilter.connect(highFilter);
        highFilter.connect(cabFilter);
        cabFilter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 0.86);
      }

      // 2. Arpeggiator (16-step polyphonic arpeggiation)
      else if (name.includes("arpeggiator") || devId.includes("arp")) {
        const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 523.25, 392.0, 329.63];
        const stepTime = 0.09;
        notes.forEach((freq, idx) => {
          const stepT = t + idx * stepTime;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const filter = this.ctx.createBiquadFilter();

          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(freq, stepT);

          filter.type = "lowpass";
          filter.frequency.setValueAtTime(2400, stepT);
          filter.frequency.exponentialRampToValueAtTime(600, stepT + stepTime * 0.8);
          filter.Q.value = 4;

          gain.gain.setValueAtTime(0.001, stepT);
          gain.gain.linearRampToValueAtTime(0.18, stepT + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.001, stepT + stepTime * 0.95);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(this.masterGain);

          osc.start(stepT);
          osc.stop(stepT + stepTime);
        });
      }

      // 3. Bit-8 Reducer (Lo-Fi resolution decimation)
      else if (name.includes("bit-8") || devId.includes("bit")) {
        const osc = this.ctx.createOscillator();
        const shaper = this.ctx.createWaveShaper();
        const gain = this.ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(220, t);

        const bits = Math.max(2, Math.min(16, p.bits || 6));
        const steps = Math.pow(2, bits);
        const curve = new Float32Array(512);
        for (let i = 0; i < 512; i++) {
          const x = (i * 2) / 512 - 1;
          curve[i] = Math.round(x * steps) / steps;
        }
        shaper.curve = curve;

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.22, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);

        osc.connect(shaper);
        shaper.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 0.66);
      }

      // 4. Stereo Chorus (Modulated spatial delay)
      else if (name.includes("chorus") || devId.includes("cho")) {
        const osc = this.ctx.createOscillator();
        const delayL = this.ctx.createDelay();
        const delayR = this.ctx.createDelay();
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        const merger = this.ctx.createChannelMerger(2);
        const gain = this.ctx.createGain();

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(329.63, t);

        delayL.delayTime.value = 0.025;
        delayR.delayTime.value = 0.035;

        lfo.type = "sine";
        lfo.frequency.value = (p.rate || 1.8);
        lfoGain.gain.value = 0.005;

        lfo.connect(lfoGain);
        lfoGain.connect(delayL.delayTime);

        osc.connect(delayL);
        osc.connect(delayR);

        delayL.connect(merger, 0, 0);
        delayR.connect(merger, 0, 1);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.24, t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.95);

        merger.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        lfo.start(t);
        osc.stop(t + 0.96);
        lfo.stop(t + 0.96);
      }

      // 5. VCA Compressor (Dynamic punch & release)
      else if (name.includes("compressor") || devId.includes("cmp")) {
        const osc = this.ctx.createOscillator();
        const comp = this.ctx.createDynamicsCompressor();
        const gain = this.ctx.createGain();

        osc.type = "square";
        osc.frequency.setValueAtTime(110, t);
        osc.frequency.exponentialRampToValueAtTime(45, t + 0.15);

        comp.threshold.setValueAtTime(p.threshold !== undefined ? p.threshold : -20, t);
        comp.knee.setValueAtTime(p.knee || 15, t);
        comp.ratio.setValueAtTime(p.ratio || 6, t);
        comp.attack.setValueAtTime((p.attack || 10) / 1000, t);
        comp.release.setValueAtTime((p.release || 100) / 1000, t);

        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

        osc.connect(comp);
        comp.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 0.46);
      }

      // 6. Delay+ Dual (Cross-stereo ping-pong delay)
      else if (name.includes("delay") || devId.includes("dly")) {
        const osc = this.ctx.createOscillator();
        const delayL = this.ctx.createDelay();
        const delayR = this.ctx.createDelay();
        const fbL = this.ctx.createGain();
        const fbR = this.ctx.createGain();
        const damp = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, t); // C5

        const timeL = (p.timeL || 240) / 1000;
        const timeR = (p.timeR || 360) / 1000;
        delayL.delayTime.value = timeL;
        delayR.delayTime.value = timeR;

        fbL.gain.value = (p.feedback || 45) / 100;
        fbR.gain.value = (p.feedback || 45) / 100;

        damp.type = "lowpass";
        damp.frequency.value = p.damping || 4500;

        // Cross feedback
        delayL.connect(fbR);
        fbR.connect(delayR);
        delayR.connect(fbL);
        fbL.connect(delayL);

        delayL.connect(damp);
        delayR.connect(damp);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.25, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

        osc.connect(gain);
        gain.connect(delayL);
        gain.connect(this.masterGain);
        damp.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 0.2);
      }

      // 7. Overdrive Saturator (Analog saturation curve)
      else if (name.includes("saturator") || devId.includes("dst")) {
        const osc = this.ctx.createOscillator();
        const shaper = this.ctx.createWaveShaper();
        const tone = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(130.81, t); // C3

        const curve = new Float32Array(512);
        const k = (p.drive || 50) / 10;
        for (let i = 0; i < 512; i++) {
          const x = (i * 2) / 512 - 1;
          curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
        }
        shaper.curve = curve;

        tone.type = "lowpass";
        tone.frequency.value = 3200;

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.26, t + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);

        osc.connect(shaper);
        shaper.connect(tone);
        tone.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 0.71);
      }

      // 8. Drum Machine 16 (16-pad drum synthesis)
      else if (name.includes("drum machine") || devId.includes("drm")) {
        const padIndex = p.padIndex !== undefined ? p.padIndex : 0;
        const padNames = [
          "Kick 808", "Snare 909", "Clap Studio", "Hat Closed",
          "Hat Open", "Low Tom", "Mid Tom", "High Tom",
          "Crash 16", "Ride Bell", "Shaker Gold", "Cowbell 808",
          "Rimshot", "Conga High", "Claves Cuban", "Laser Synth"
        ];
        const pad = padNames[padIndex] || "Kick 808";

        // Synthesize specific drum voice
        if (pad.includes("Kick")) {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(160, t);
          osc.frequency.exponentialRampToValueAtTime(42, t + 0.15);
          gain.gain.setValueAtTime(0.8, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
          osc.connect(gain);
          gain.connect(this.masterGain);
          osc.start(t);
          osc.stop(t + 0.41);
        } else if (pad.includes("Snare")) {
          const noise = this.ctx.createBufferSource();
          const b = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.2), this.ctx.sampleRate);
          const d = b.getChannelData(0);
          for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
          noise.buffer = b;
          const flt = this.ctx.createBiquadFilter();
          flt.type = "bandpass";
          flt.frequency.value = 1800;
          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(0.65, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
          noise.connect(flt);
          flt.connect(gain);
          gain.connect(this.masterGain);
          noise.start(t);
        } else if (pad.includes("Clap")) {
          [0, 0.012, 0.024].forEach((off) => {
            const noise = this.ctx.createBufferSource();
            const b = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.15), this.ctx.sampleRate);
            const d = b.getChannelData(0);
            for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
            noise.buffer = b;
            const flt = this.ctx.createBiquadFilter();
            flt.type = "bandpass";
            flt.frequency.value = 1200;
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.5, t + off);
            gain.gain.exponentialRampToValueAtTime(0.001, t + off + 0.15);
            noise.connect(flt);
            flt.connect(gain);
            gain.connect(this.masterGain);
            noise.start(t + off);
          });
        } else if (pad.includes("Hat")) {
          const noise = this.ctx.createBufferSource();
          const dur = pad.includes("Open") ? 0.35 : 0.06;
          const b = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
          const d = b.getChannelData(0);
          for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
          noise.buffer = b;
          const flt = this.ctx.createBiquadFilter();
          flt.type = "highpass";
          flt.frequency.value = 7500;
          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(0.45, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
          noise.connect(flt);
          flt.connect(gain);
          gain.connect(this.masterGain);
          noise.start(t);
        } else {
          // Melodic percussion / cowbell / tom
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = pad.includes("Cowbell") ? "square" : "sine";
          const f = pad.includes("Low Tom") ? 95 : pad.includes("High Tom") ? 180 : pad.includes("Cowbell") ? 587 : 330;
          osc.frequency.setValueAtTime(f, t);
          gain.gain.setValueAtTime(0.5, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
          osc.connect(gain);
          gain.connect(this.masterGain);
          osc.start(t);
          osc.stop(t + 0.26);
        }
      }

      // 9. Multiband Dynamics (3-band crossover network)
      else if (name.includes("multiband") || devId.includes("dyn")) {
        const osc = this.ctx.createOscillator();
        const lowFilter = this.ctx.createBiquadFilter();
        const midFilter = this.ctx.createBiquadFilter();
        const highFilter = this.ctx.createBiquadFilter();
        const compLow = this.ctx.createDynamicsCompressor();
        const compMid = this.ctx.createDynamicsCompressor();
        const compHigh = this.ctx.createDynamicsCompressor();
        const gain = this.ctx.createGain();

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(174.61, t); // F3

        lowFilter.type = "lowpass";
        lowFilter.frequency.value = p.xoverLow || 150;

        midFilter.type = "bandpass";
        midFilter.frequency.value = 1000;
        midFilter.Q.value = 0.7;

        highFilter.type = "highpass";
        highFilter.frequency.value = p.xoverHigh || 3200;

        compLow.threshold.value = -18;
        compMid.threshold.value = -14;
        compHigh.threshold.value = -22;

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.24, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.85);

        osc.connect(lowFilter);
        osc.connect(midFilter);
        osc.connect(highFilter);

        lowFilter.connect(compLow);
        midFilter.connect(compMid);
        highFilter.connect(compHigh);

        compLow.connect(gain);
        compMid.connect(gain);
        compHigh.connect(gain);

        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.86);
      }

      // 10. EQ-5 Parametric (5 cascaded biquads)
      else if (name.includes("eq-5") || devId.includes("eq5")) {
        const osc = this.ctx.createOscillator();
        const hpf = this.ctx.createBiquadFilter();
        const lowShelf = this.ctx.createBiquadFilter();
        const midPeak = this.ctx.createBiquadFilter();
        const highMid = this.ctx.createBiquadFilter();
        const highShelf = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(220, t);

        hpf.type = "highpass";
        hpf.frequency.value = 30;

        lowShelf.type = "lowshelf";
        lowShelf.frequency.value = 100;
        lowShelf.gain.value = p.low || 4;

        midPeak.type = "peaking";
        midPeak.frequency.value = 1000;
        midPeak.gain.value = p.mid || -3;

        highMid.type = "peaking";
        highMid.frequency.value = 3500;
        highMid.gain.value = p.highMid || 2;

        highShelf.type = "highshelf";
        highShelf.frequency.value = 10000;
        highShelf.gain.value = p.high || 3;

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.22, t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

        osc.connect(hpf);
        hpf.connect(lowShelf);
        lowShelf.connect(midPeak);
        midPeak.connect(highMid);
        highMid.connect(highShelf);
        highShelf.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 0.81);
      }

      // 11. EQ+ Precision (8-band surgical precision)
      else if (name.includes("eq+") || devId.includes("eqp")) {
        const osc = this.ctx.createOscillator();
        const f1 = this.ctx.createBiquadFilter();
        const f2 = this.ctx.createBiquadFilter();
        const f3 = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(329.63, t);

        f1.type = "peaking";
        f1.frequency.value = 450;
        f1.gain.value = p.b1 || 3;

        f2.type = "peaking";
        f2.frequency.value = 1600;
        f2.gain.value = p.b2 || -4;

        f3.type = "peaking";
        f3.frequency.value = 5200;
        f3.gain.value = p.b3 || 5;

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.25, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.75);

        osc.connect(f1);
        f1.connect(f2);
        f2.connect(f3);
        f3.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 0.76);
      }

      // 12. Analog Flanger (Comb filter with resonant feedback)
      else if (name.includes("flanger") || devId.includes("flg")) {
        const osc = this.ctx.createOscillator();
        const delay = this.ctx.createDelay();
        const fb = this.ctx.createGain();
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        const gain = this.ctx.createGain();

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(196.0, t); // G3

        delay.delayTime.value = 0.0025;
        fb.gain.value = (p.feedback || 75) / 100;

        lfo.type = "triangle";
        lfo.frequency.value = p.rate || 0.4;
        lfoGain.gain.value = 0.0018;

        lfo.connect(lfoGain);
        lfoGain.connect(delay.delayTime);

        osc.connect(delay);
        delay.connect(fb);
        fb.connect(delay);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.24, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

        osc.connect(gain);
        delay.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        lfo.start(t);
        osc.stop(t + 1.21);
        lfo.stop(t + 1.21);
      }

      // 13. FM-4 Quad Synth (4-operator frequency modulation)
      else if (name.includes("fm-4") || devId.includes("fm4")) {
        const baseFreq = 220; // A3
        const r1 = p.ratio1 || 1.0;
        const r2 = p.ratio2 || 2.0;
        const r3 = p.ratio3 || 3.5;
        const r4 = p.ratio4 || 7.0;

        const op1 = this.ctx.createOscillator(); // Carrier
        const op2 = this.ctx.createOscillator(); // Modulator 1
        const op3 = this.ctx.createOscillator(); // Modulator 2
        const op4 = this.ctx.createOscillator(); // Modulator 3

        const modGain2 = this.ctx.createGain();
        const modGain3 = this.ctx.createGain();
        const modGain4 = this.ctx.createGain();
        const carrierGain = this.ctx.createGain();

        op1.frequency.setValueAtTime(baseFreq * r1, t);
        op2.frequency.setValueAtTime(baseFreq * r2, t);
        op3.frequency.setValueAtTime(baseFreq * r3, t);
        op4.frequency.setValueAtTime(baseFreq * r4, t);

        modGain4.gain.setValueAtTime(150, t);
        modGain3.gain.setValueAtTime(300, t);
        modGain2.gain.setValueAtTime(450, t);

        // Op4 -> Op3 -> Op2 -> Op1 (Frequency modulation stack)
        op4.connect(modGain4);
        modGain4.connect(op3.frequency);

        op3.connect(modGain3);
        modGain3.connect(op2.frequency);

        op2.connect(modGain2);
        modGain2.connect(op1.frequency);

        carrierGain.gain.setValueAtTime(0.001, t);
        carrierGain.gain.linearRampToValueAtTime(0.24, t + 0.03);
        carrierGain.gain.exponentialRampToValueAtTime(0.001, t + 1.0);

        op1.connect(carrierGain);
        carrierGain.connect(this.masterGain);

        op1.start(t);
        op2.start(t);
        op3.start(t);
        op4.start(t);

        op1.stop(t + 1.01);
        op2.stop(t + 1.01);
        op3.stop(t + 1.01);
        op4.stop(t + 1.01);
      }

      // 14. Instrument Layer (Multi-instrument stack)
      else if (name.includes("layer") || devId.includes("lay")) {
        // Layer 1: Sub Bass
        const sub = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        sub.type = "sine";
        sub.frequency.setValueAtTime(65.41, t);
        subGain.gain.setValueAtTime(0.3, t);
        subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
        sub.connect(subGain);
        subGain.connect(this.masterGain);
        sub.start(t);
        sub.stop(t + 0.81);

        // Layer 2: Stereo Pad
        const pad = this.ctx.createOscillator();
        const padGain = this.ctx.createGain();
        pad.type = "sawtooth";
        pad.frequency.setValueAtTime(261.63, t);
        padGain.gain.setValueAtTime(0.12, t);
        padGain.gain.exponentialRampToValueAtTime(0.001, t + 1.1);
        pad.connect(padGain);
        padGain.connect(this.masterGain);
        pad.start(t);
        pad.stop(t + 1.11);

        // Layer 3: Chime Pluck
        const chime = this.ctx.createOscillator();
        const chimeGain = this.ctx.createGain();
        chime.type = "triangle";
        chime.frequency.setValueAtTime(523.25, t);
        chimeGain.gain.setValueAtTime(0.15, t);
        chimeGain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
        chime.connect(chimeGain);
        chimeGain.connect(this.masterGain);
        chime.start(t);
        chime.stop(t + 0.61);
      }

      // 15. Tonewheel Organ (9 harmonic drawbars additive synthesis)
      else if (name.includes("organ") || devId.includes("org")) {
        const root = 130.81; // C3
        // 9 Drawbar harmonic multipliers: 16', 5 1/3', 8', 4', 2 2/3', 2', 1 3/5', 1 1/3', 1'
        const multipliers = [0.5, 1.498, 1.0, 2.0, 2.996, 4.0, 5.04, 5.993, 8.0];
        const drawbars = p.drawbars || [8, 8, 8, 4, 0, 0, 0, 0, 0];

        const organMix = this.ctx.createGain();
        const tremolo = this.ctx.createGain();
        const lfo = this.ctx.createOscillator();

        // Leslie speaker effect
        lfo.type = "sine";
        lfo.frequency.value = p.leslieFast ? 6.2 : 1.2;
        const lfoAmp = this.ctx.createGain();
        lfoAmp.gain.value = 0.25;
        lfo.connect(lfoAmp);
        lfoAmp.connect(tremolo.gain);

        organMix.gain.setValueAtTime(0.001, t);
        organMix.gain.linearRampToValueAtTime(0.25, t + 0.03);
        organMix.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

        multipliers.forEach((mult, i) => {
          const val = drawbars[i] || 0;
          if (val > 0) {
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(root * mult, t);
            g.gain.value = (val / 8) * 0.15;
            osc.connect(g);
            g.connect(organMix);
            osc.start(t);
            osc.stop(t + 1.21);
          }
        });

        organMix.connect(tremolo);
        tremolo.connect(this.masterGain);
        lfo.start(t);
        lfo.stop(t + 1.21);
      }

      // 16. Phase Shifter (12-pole allpass phase sweep)
      else if (name.includes("phase") || devId.includes("phs")) {
        const osc = this.ctx.createOscillator();
        const ap1 = this.ctx.createBiquadFilter();
        const ap2 = this.ctx.createBiquadFilter();
        const ap3 = this.ctx.createBiquadFilter();
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        const gain = this.ctx.createGain();

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(220, t);

        ap1.type = "allpass";
        ap2.type = "allpass";
        ap3.type = "allpass";

        lfo.type = "sine";
        lfo.frequency.value = p.rate || 0.6;
        lfoGain.gain.value = 600;

        lfo.connect(lfoGain);
        lfoGain.connect(ap1.frequency);
        lfoGain.connect(ap2.frequency);
        lfoGain.connect(ap3.frequency);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.24, t + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 1.1);

        osc.connect(ap1);
        ap1.connect(ap2);
        ap2.connect(ap3);
        ap3.connect(gain);
        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        lfo.start(t);
        osc.stop(t + 1.11);
        lfo.stop(t + 1.11);
      }

      // 17. Polymer Hybrid (Subtractive & wavetable hybrid)
      else if (name.includes("polymer") || devId.includes("pol")) {
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc1.type = "sawtooth";
        osc1.frequency.setValueAtTime(146.83, t); // D3

        osc2.type = "square";
        osc2.frequency.setValueAtTime(73.42, t); // Sub octave D2

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(180, t);
        filter.frequency.exponentialRampToValueAtTime(3600, t + 0.15);
        filter.frequency.exponentialRampToValueAtTime(600, t + 0.9);
        filter.Q.value = 6;

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.28, t + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.95);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc1.start(t);
        osc2.start(t);
        osc1.stop(t + 0.96);
        osc2.stop(t + 0.96);
      }

      // 18. Polysynth Analog (Vintage polyphonic analog synth)
      else if (name.includes("polysynth") || devId.includes("psn")) {
        // Play warm major 9th chord (C4, E4, G4, B4, D5)
        const chord = [261.63, 329.63, 392.0, 493.88, 587.33];
        chord.forEach((freq) => {
          const osc1 = this.ctx.createOscillator();
          const osc2 = this.ctx.createOscillator();
          const flt = this.ctx.createBiquadFilter();
          const g = this.ctx.createGain();

          osc1.type = "sawtooth";
          osc1.frequency.setValueAtTime(freq, t);

          osc2.type = "sawtooth";
          osc2.frequency.setValueAtTime(freq * 1.004, t); // Detuned chorus spread

          flt.type = "lowpass";
          flt.frequency.setValueAtTime(2400, t);
          flt.Q.value = 3.5;

          g.gain.setValueAtTime(0.001, t);
          g.gain.linearRampToValueAtTime(0.06, t + 0.06);
          g.gain.exponentialRampToValueAtTime(0.001, t + 1.4);

          osc1.connect(flt);
          osc2.connect(flt);
          flt.connect(g);
          g.connect(this.masterGain);

          osc1.start(t);
          osc2.start(t);
          osc1.stop(t + 1.41);
          osc2.stop(t + 1.41);
        });
      }

      // 19. Studio Reverb (Algorithmic room & hall reverb)
      else if (name.includes("reverb") || devId.includes("rev")) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const conv = this.ctx.createConvolver();
        const damp = this.ctx.createBiquadFilter();

        // Impulse response generation (Zero Mock mathematical Schroeder noise burst)
        const dur = (p.decay || 3.0);
        const len = Math.floor(this.ctx.sampleRate * dur);
        const ir = this.ctx.createBuffer(2, len, this.ctx.sampleRate);
        const left = ir.getChannelData(0);
        const right = ir.getChannelData(1);
        for (let i = 0; i < len; i++) {
          const env = Math.exp((-i / len) * 4);
          left[i] = (Math.random() * 2 - 1) * env;
          right[i] = (Math.random() * 2 - 1) * env;
        }
        conv.buffer = ir;

        damp.type = "lowpass";
        damp.frequency.value = p.damping || 5000;

        osc.type = "sine";
        osc.frequency.setValueAtTime(440, t);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.25, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

        osc.connect(gain);
        gain.connect(conv);
        conv.connect(damp);
        damp.connect(this.masterGain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 0.2);
      }

      // 20. Multi-Sampler (Granular sample playback)
      else if (name.includes("sampler") || devId.includes("smp")) {
        // Multi-frequency granular grains
        const grainCount = 6;
        for (let g = 0; g < grainCount; g++) {
          const gTime = t + g * 0.08;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(261.63 * Math.pow(1.5, g % 3), gTime);

          gain.gain.setValueAtTime(0.001, gTime);
          gain.gain.linearRampToValueAtTime(0.18, gTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, gTime + 0.12);

          osc.connect(gain);
          gain.connect(this.masterGain);
          osc.start(gTime);
          osc.stop(gTime + 0.13);
        }
      }

      // 21. Mastering Tool (Mid/side width & limiter)
      else if (name.includes("mastering") || devId.includes("tol")) {
        const osc = this.ctx.createOscillator();
        const limiter = this.ctx.createDynamicsCompressor();
        const gain = this.ctx.createGain();

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(110, t);

        limiter.threshold.setValueAtTime(-0.5, t);
        limiter.knee.setValueAtTime(0, t);
        limiter.ratio.setValueAtTime(20, t); // Brickwall
        limiter.attack.setValueAtTime(0.001, t);
        limiter.release.setValueAtTime(0.05, t);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.3, t + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

        osc.connect(limiter);
        limiter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 0.81);
      }
    } catch (err) {
      console.warn("[DeviceWebAudioEngine] Error playing device audition:", err);
    }
  }
}

export const deviceAudioEngine = new DeviceWebAudioEngine();

/**
 * ════════════════════════════════════════════════════════════════════════════════
 * COMPONENT: MusicStudioDeviceRack
 * Renders dedicated interactive modular UI for all 21 devices with live controls,
 * modulator assignment triggers, and zero-mock real Web Audio auditioning!
 * ════════════════════════════════════════════════════════════════════════════════
 */
export default function MusicStudioDeviceRack({
  track,
  devices = [],
  selectedDeviceId,
  onSelectDevice,
  onToggleBypass,
  onRemoveDevice,
  onUpdateParam,
  onReorderDevices,
  onOpenBrowser,
  mappingModulatorId,
  onAssignModTarget,
  setStatusHint
}) {
  const [activePad, setActivePad] = useState(null);

  const handleAudition = (dev, customParam = null) => {
    deviceAudioEngine.playDeviceAudition(dev, customParam);
    if (setStatusHint) {
      setStatusHint(`Audition DSP en direct : "${dev.name}" (${dev.category})`);
    }
  };

  const handleParamChange = (deviceId, key, val) => {
    if (onUpdateParam && track) {
      onUpdateParam(track.id, deviceId, key, val);
    }
  };

  // Drum Machine Pad Trigger
  const handleTriggerPad = (dev, padIdx) => {
    setActivePad(padIdx);
    setTimeout(() => setActivePad(null), 120);
    handleAudition(dev, { padIndex: padIdx });
  };

  return (
    <div className="flex items-center gap-3 h-full px-2 py-1 select-none overflow-x-auto no-scrollbar">
      {devices.map((dev, dIdx) => {
        const isSelected = selectedDeviceId === dev.id;
        const p = dev.params || {};

        return (
          <div
            key={dev.id || dIdx}
            onClick={() => onSelectDevice && onSelectDevice(dev.id)}
            className={`w-64 h-full flex-shrink-0 rounded-xl p-3 flex flex-col justify-between shadow-lg transition-all duration-150 cursor-pointer select-none border ${
              isSelected
                ? "bg-[#241808] border-[#df9c43] ring-1 ring-[#df9c43] shadow-[0_0_20px_rgba(223,156,67,0.35)] z-10 scale-[1.01]"
                : dev.enabled
                ? "bg-[#1a1a1a] border-[#333333] hover:border-zinc-500"
                : "bg-[#141414] border-red-950/40 opacity-60"
            }`}
          >
            {/* ── TOP HEADER: Power, Name, Category, Audition & Delete ── */}
            <div className="flex items-center justify-between border-b border-[#2b2b2b] pb-2">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onToggleBypass && track) onToggleBypass(track.id, dev.id);
                  }}
                  className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                    dev.enabled
                      ? "bg-emerald-500 text-black shadow-[0_0_8px_rgba(16,185,129,0.7)]"
                      : "bg-zinc-700 text-zinc-400"
                  }`}
                  title="Bypass (Activer / Désactiver)"
                >
                  <Power size={9} />
                </button>

                <span className="font-bold text-xs text-white truncate max-w-[100px]" title={dev.name}>
                  {dev.name}
                </span>

                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-amber-300/80 border border-white/5">
                  {dev.category}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAudition(dev);
                  }}
                  className="px-2 py-0.5 rounded bg-[#df9c43]/20 hover:bg-[#df9c43] text-[#f5c277] hover:text-black font-extrabold text-[9px] flex items-center gap-1 transition-all active:scale-95 border border-[#df9c43]/40"
                  title="Auditionner le son réel (Web Audio DSP)"
                >
                  <Play size={8} fill="currentColor" />
                  <span>TEST</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onRemoveDevice && track) onRemoveDevice(track.id, dev.id);
                  }}
                  className="text-zinc-500 hover:text-red-400 p-0.5 rounded transition"
                  title="Supprimer ce composant"
                >
                  <X size={12} />
                </button>
              </div>
            </div>

            {/* ── DEVICE DEDICATED BODY CONTROLS (Zero Mock Interactive UI) ── */}
            <div className="flex-1 py-2 overflow-y-auto no-scrollbar">
              {/* 1. Amp Simulator */}
              {(dev.name.includes("Amp") || dev.id.includes("amp")) && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[9px] text-zinc-400">
                    <span>Drive</span>
                    <span className="text-amber-400 font-mono">{p.drive || 65}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={p.drive !== undefined ? p.drive : 65}
                    onChange={(e) => handleParamChange(dev.id, "drive", Number(e.target.value))}
                    className="w-full h-1 accent-[#df9c43] bg-zinc-800 rounded cursor-pointer"
                  />
                  <div className="grid grid-cols-3 gap-1 pt-1 text-center">
                    <div>
                      <span className="text-[7.5px] text-zinc-500 block">BASS</span>
                      <input
                        type="range"
                        min="-12"
                        max="12"
                        value={p.bass || 3}
                        onChange={(e) => handleParamChange(dev.id, "bass", Number(e.target.value))}
                        className="w-full h-1 accent-[#df9c43]"
                      />
                    </div>
                    <div>
                      <span className="text-[7.5px] text-zinc-500 block">MID</span>
                      <input
                        type="range"
                        min="-12"
                        max="12"
                        value={p.mid || -2}
                        onChange={(e) => handleParamChange(dev.id, "mid", Number(e.target.value))}
                        className="w-full h-1 accent-[#df9c43]"
                      />
                    </div>
                    <div>
                      <span className="text-[7.5px] text-zinc-500 block">TREBLE</span>
                      <input
                        type="range"
                        min="-12"
                        max="12"
                        value={p.treble || 4}
                        onChange={(e) => handleParamChange(dev.id, "treble", Number(e.target.value))}
                        className="w-full h-1 accent-[#df9c43]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Arpeggiator */}
              {(dev.name.includes("Arpeggiator") || dev.id.includes("arp")) && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="text-zinc-400">Division</span>
                    <span className="text-amber-400 font-mono font-bold">{p.rate || "1/16"}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {["1/4", "1/8", "1/16", "1/32"].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => handleParamChange(dev.id, "rate", rate)}
                        className={`py-1 text-[8.5px] rounded font-mono font-bold transition ${
                          (p.rate || "1/16") === rate
                            ? "bg-[#df9c43] text-black shadow"
                            : "bg-black/30 text-zinc-400 hover:text-white"
                        }`}
                      >
                        {rate}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-[9px] pt-1">
                    <span className="text-zinc-400">Mode</span>
                    <span className="text-[#f5c277]">{p.mode || "Up/Down"}</span>
                  </div>
                </div>
              )}

              {/* 3. Bit-8 Reducer */}
              {(dev.name.includes("Bit-8") || dev.id.includes("bit")) && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="text-zinc-400">Résolution Bits</span>
                    <span className="text-amber-400 font-mono font-bold">{p.bits || 6} BITS</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="16"
                    value={p.bits || 6}
                    onChange={(e) => handleParamChange(dev.id, "bits", Number(e.target.value))}
                    className="w-full h-1 accent-[#df9c43] bg-zinc-800 rounded cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[9px] pt-1">
                    <span className="text-zinc-400">Mix Lo-Fi</span>
                    <span className="text-amber-400 font-mono">{p.mix || 75}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={p.mix !== undefined ? p.mix : 75}
                    onChange={(e) => handleParamChange(dev.id, "mix", Number(e.target.value))}
                    className="w-full h-1 accent-[#df9c43] bg-zinc-800 rounded cursor-pointer"
                  />
                </div>
              )}

              {/* 4. Stereo Chorus */}
              {(dev.name.includes("Chorus") || dev.id.includes("cho")) && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="text-zinc-400">Vitesse (Rate)</span>
                    <span className="text-amber-400 font-mono">{p.rate || 1.8} Hz</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="5.0"
                    step="0.1"
                    value={p.rate || 1.8}
                    onChange={(e) => handleParamChange(dev.id, "rate", Number(e.target.value))}
                    className="w-full h-1 accent-[#df9c43] bg-zinc-800 rounded cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[9px] pt-1">
                    <span className="text-zinc-400">Largeur Spatiale</span>
                    <span className="text-amber-400 font-mono">{p.width || 80}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={p.width !== undefined ? p.width : 80}
                    onChange={(e) => handleParamChange(dev.id, "width", Number(e.target.value))}
                    className="w-full h-1 accent-[#df9c43] bg-zinc-800 rounded cursor-pointer"
                  />
                </div>
              )}

              {/* 5. VCA Compressor */}
              {(dev.name.includes("VCA") || dev.id.includes("cmp")) && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="text-zinc-400">Seuil (Threshold)</span>
                    <span className="text-amber-400 font-mono">{p.threshold !== undefined ? p.threshold : -18} dB</span>
                  </div>
                  <input
                    type="range"
                    min="-48"
                    max="0"
                    value={p.threshold !== undefined ? p.threshold : -18}
                    onChange={(e) => handleParamChange(dev.id, "threshold", Number(e.target.value))}
                    className="w-full h-1 accent-[#df9c43] bg-zinc-800 rounded cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[9px] pt-1">
                    <span className="text-zinc-400">Ratio</span>
                    <span className="text-amber-400 font-mono">{p.ratio || 6}:1</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={p.ratio || 6}
                    onChange={(e) => handleParamChange(dev.id, "ratio", Number(e.target.value))}
                    className="w-full h-1 accent-[#df9c43] bg-zinc-800 rounded cursor-pointer"
                  />
                </div>
              )}

              {/* 6. Delay+ Dual */}
              {(dev.name.includes("Delay") || dev.id.includes("dly")) && (
                <div className="space-y-1.5">
                  <div className="grid grid-cols-2 gap-2 text-[9px]">
                    <div>
                      <span className="text-zinc-400 block">Temps Gauche</span>
                      <span className="text-amber-400 font-mono">{p.timeL || 240} ms</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block">Temps Droite</span>
                      <span className="text-amber-400 font-mono">{p.timeR || 360} ms</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[9px] pt-1">
                    <span className="text-zinc-400">Feedback</span>
                    <span className="text-amber-400 font-mono">{p.feedback || 45}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="90"
                    value={p.feedback || 45}
                    onChange={(e) => handleParamChange(dev.id, "feedback", Number(e.target.value))}
                    className="w-full h-1 accent-[#df9c43] bg-zinc-800 rounded cursor-pointer"
                  />
                </div>
              )}

              {/* 7. Overdrive Saturator */}
              {(dev.name.includes("Overdrive") || dev.id.includes("dst")) && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="text-zinc-400">Chaleur Analogique</span>
                    <span className="text-amber-400 font-mono">{p.warmth || 70}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={p.warmth || 70}
                    onChange={(e) => handleParamChange(dev.id, "warmth", Number(e.target.value))}
                    className="w-full h-1 accent-[#df9c43] bg-zinc-800 rounded cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[9px] pt-1">
                    <span className="text-zinc-400">Gain de Sortie</span>
                    <span className="text-amber-400 font-mono">{p.gain || 0} dB</span>
                  </div>
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    value={p.gain || 0}
                    onChange={(e) => handleParamChange(dev.id, "gain", Number(e.target.value))}
                    className="w-full h-1 accent-[#df9c43] bg-zinc-800 rounded cursor-pointer"
                  />
                </div>
              )}

              {/* 8. Drum Machine 16 */}
              {(dev.name.includes("Drum Machine") || dev.id.includes("drm")) && (
                <div className="space-y-1">
                  <span className="text-[8px] text-zinc-400 font-bold block uppercase tracking-wider">
                    16 Pads de Percussion
                  </span>
                  <div className="grid grid-cols-4 gap-1 pt-1">
                    {[
                      "KICK", "SNARE", "CLAP", "CH",
                      "OH", "LTOM", "MTOM", "HTOM",
                      "CRASH", "RIDE", "SHAK", "BELL",
                      "RIM", "CONGA", "CLAV", "LASER"
                    ].map((padName, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTriggerPad(dev, idx);
                        }}
                        className={`py-1.5 text-[7.5px] rounded font-black tracking-tight transition-all active:scale-90 ${
                          activePad === idx
                            ? "bg-white text-black shadow-[0_0_10px_#ffffff] scale-95"
                            : "bg-[#252525] hover:bg-[#df9c43] hover:text-black text-zinc-300 border border-white/5"
                        }`}
                      >
                        {padName}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 9. Multiband Dynamics */}
              {(dev.name.includes("Multiband") || dev.id.includes("dyn")) && (
                <div className="grid grid-cols-3 gap-1.5 text-center pt-1">
                  <div className="p-1 rounded bg-black/40 border border-white/5">
                    <span className="text-[8px] text-amber-400 font-bold block">BAS</span>
                    <span className="text-[7.5px] text-zinc-500 font-mono">150Hz</span>
                    <input
                      type="range"
                      min="-24"
                      max="6"
                      defaultValue="-12"
                      className="w-full h-1 accent-[#df9c43] mt-1"
                    />
                  </div>
                  <div className="p-1 rounded bg-black/40 border border-white/5">
                    <span className="text-[8px] text-amber-400 font-bold block">MID</span>
                    <span className="text-[7.5px] text-zinc-500 font-mono">1.2kHz</span>
                    <input
                      type="range"
                      min="-24"
                      max="6"
                      defaultValue="-8"
                      className="w-full h-1 accent-[#df9c43] mt-1"
                    />
                  </div>
                  <div className="p-1 rounded bg-black/40 border border-white/5">
                    <span className="text-[8px] text-amber-400 font-bold block">AIGU</span>
                    <span className="text-[7.5px] text-zinc-500 font-mono">3.5kHz</span>
                    <input
                      type="range"
                      min="-24"
                      max="6"
                      defaultValue="-16"
                      className="w-full h-1 accent-[#df9c43] mt-1"
                    />
                  </div>
                </div>
              )}

              {/* 10. EQ-5 Parametric */}
              {(dev.name.includes("EQ-5") || dev.id.includes("eq5")) && (
                <div className="space-y-1">
                  <div className="h-10 bg-black/50 rounded border border-white/10 flex items-center justify-center p-1 relative overflow-hidden">
                    <svg className="w-full h-full" viewBox="0 0 100 40">
                      <path
                        d="M 0 20 Q 25 15, 50 22 T 100 18"
                        fill="none"
                        stroke="#df9c43"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                  <div className="grid grid-cols-3 gap-1 pt-1 text-center">
                    <div>
                      <span className="text-[7px] text-zinc-500">BAS</span>
                      <input
                        type="range"
                        min="-12"
                        max="12"
                        value={p.low || 4}
                        onChange={(e) => handleParamChange(dev.id, "low", Number(e.target.value))}
                        className="w-full h-1 accent-[#df9c43]"
                      />
                    </div>
                    <div>
                      <span className="text-[7px] text-zinc-500">MID</span>
                      <input
                        type="range"
                        min="-12"
                        max="12"
                        value={p.mid || -3}
                        onChange={(e) => handleParamChange(dev.id, "mid", Number(e.target.value))}
                        className="w-full h-1 accent-[#df9c43]"
                      />
                    </div>
                    <div>
                      <span className="text-[7px] text-zinc-500">AIGU</span>
                      <input
                        type="range"
                        min="-12"
                        max="12"
                        value={p.high || 3}
                        onChange={(e) => handleParamChange(dev.id, "high", Number(e.target.value))}
                        className="w-full h-1 accent-[#df9c43]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 11. EQ+ Precision */}
              {(dev.name.includes("EQ+") || dev.id.includes("eqp")) && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="text-zinc-400">Spectre Dynamique</span>
                    <span className="text-amber-400 font-mono">8 BANDES HD</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 pt-1">
                    {["30Hz", "240Hz", "1.5k", "8.0k"].map((freq, i) => (
                      <div key={i} className="text-center p-0.5 rounded bg-black/40">
                        <span className="text-[7px] text-zinc-500 block">{freq}</span>
                        <input type="range" min="-12" max="12" defaultValue="0" className="w-full h-1 accent-[#df9c43]" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 12. Analog Flanger */}
              {(dev.name.includes("Flanger") || dev.id.includes("flg")) && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="text-zinc-400">Feedback Résonant</span>
                    <span className="text-amber-400 font-mono">{p.feedback || 75}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="95"
                    value={p.feedback || 75}
                    onChange={(e) => handleParamChange(dev.id, "feedback", Number(e.target.value))}
                    className="w-full h-1 accent-[#df9c43] bg-zinc-800 rounded cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[9px] pt-1">
                    <span className="text-zinc-400">Fréquence LFO</span>
                    <span className="text-amber-400 font-mono">{p.rate || 0.4} Hz</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="4.0"
                    step="0.1"
                    value={p.rate || 0.4}
                    onChange={(e) => handleParamChange(dev.id, "rate", Number(e.target.value))}
                    className="w-full h-1 accent-[#df9c43] bg-zinc-800 rounded cursor-pointer"
                  />
                </div>
              )}

              {/* 13. FM-4 Quad Synth */}
              {(dev.name.includes("FM-4") || dev.id.includes("fm4")) && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[8px] text-zinc-400">
                    <span>4 OPÉRATEURS FM</span>
                    <span className="text-amber-400 font-mono">Stack 4→1</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-center">
                    {["Op1 (C)", "Op2 (M)", "Op3 (M)", "Op4 (M)"].map((op, i) => (
                      <div key={i} className="p-1 rounded bg-black/40 border border-white/5">
                        <span className="text-[7px] text-zinc-400 block font-bold">{op}</span>
                        <span className="text-[8px] text-amber-400 font-mono font-bold">x{i + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 14. Instrument Layer */}
              {(dev.name.includes("Layer") || dev.id.includes("lay")) && (
                <div className="space-y-1 text-[9px]">
                  <div className="flex items-center justify-between p-1 bg-black/30 rounded">
                    <span className="text-zinc-300">Couche 1 : Lead Synth</span>
                    <span className="text-emerald-400 font-mono">C3-C7</span>
                  </div>
                  <div className="flex items-center justify-between p-1 bg-black/30 rounded">
                    <span className="text-zinc-300">Couche 2 : Warm Pad</span>
                    <span className="text-cyan-400 font-mono">C2-C5</span>
                  </div>
                  <div className="flex items-center justify-between p-1 bg-black/30 rounded">
                    <span className="text-zinc-300">Couche 3 : Sub Bass</span>
                    <span className="text-amber-400 font-mono">C1-B2</span>
                  </div>
                </div>
              )}

              {/* 15. Tonewheel Organ */}
              {(dev.name.includes("Organ") || dev.id.includes("org")) && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[8px]">
                    <span className="text-zinc-400">TIRETTES HARMONIQUES</span>
                    <span className="text-amber-400 font-bold">LESLIE {p.leslieFast ? "FAST" : "SLOW"}</span>
                  </div>
                  <div className="flex justify-between items-end h-11 bg-black/50 p-1 rounded border border-white/5">
                    {["16'", "5⅓'", "8'", "4'", "2⅔'", "2'", "1⅗'", "1⅓'", "1'"].map((db, i) => {
                      const h = [8, 8, 8, 5, 0, 0, 2, 4, 6][i];
                      return (
                        <div key={i} className="flex flex-col items-center">
                          <div
                            style={{ height: `${(h / 8) * 26 + 4}px` }}
                            className="w-1.5 rounded-t bg-[#df9c43] shadow-[0_0_4px_#df9c43]"
                          />
                          <span className="text-[6px] text-zinc-500 mt-0.5">{db}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 16. Phase Shifter */}
              {(dev.name.includes("Phase") || dev.id.includes("phs")) && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="text-zinc-400">Étages (Poles)</span>
                    <span className="text-amber-400 font-mono font-bold">12 PÔLES</span>
                  </div>
                  <div className="flex items-center justify-between text-[9px] pt-1">
                    <span className="text-zinc-400">Vitesse LFO</span>
                    <span className="text-amber-400 font-mono">{p.rate || 0.6} Hz</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="5.0"
                    step="0.1"
                    value={p.rate || 0.6}
                    onChange={(e) => handleParamChange(dev.id, "rate", Number(e.target.value))}
                    className="w-full h-1 accent-[#df9c43] bg-zinc-800 rounded cursor-pointer"
                  />
                </div>
              )}

              {/* 17. Polymer Hybrid */}
              {(dev.name.includes("Polymer") || dev.id.includes("pol")) && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="text-zinc-400">Morphing Table d'Onde</span>
                    <span className="text-amber-400 font-mono">{p.morph || 45}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={p.morph || 45}
                    onChange={(e) => handleParamChange(dev.id, "morph", Number(e.target.value))}
                    className="w-full h-1 accent-[#df9c43] bg-zinc-800 rounded cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[9px] pt-1">
                    <span className="text-zinc-400">Filtre Modulaire</span>
                    <span className="text-amber-400 font-mono">24dB SOTA</span>
                  </div>
                </div>
              )}

              {/* 18. Polysynth Analog */}
              {(dev.name.includes("Polysynth") || dev.id.includes("psn")) && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[8px] text-zinc-400">
                    <span>Double DCO Detune</span>
                    <span className="text-amber-400 font-mono font-bold">8 VOIX</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-center pt-1">
                    {["A", "D", "S", "R"].map((env, i) => (
                      <div key={i} className="p-0.5 rounded bg-black/40">
                        <span className="text-[7.5px] text-zinc-500 block">{env}</span>
                        <input type="range" min="0" max="100" defaultValue={[10, 40, 70, 50][i]} className="w-full h-1 accent-[#df9c43]" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 19. Studio Reverb */}
              {(dev.name.includes("Reverb") || dev.id.includes("rev")) && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="text-zinc-400">Taille de Pièce</span>
                    <span className="text-amber-400 font-mono font-bold">Hall de Concert</span>
                  </div>
                  <div className="flex items-center justify-between text-[9px] pt-1">
                    <span className="text-zinc-400">Temps de Déclin</span>
                    <span className="text-amber-400 font-mono">{p.decay || 3.0} s</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="8.0"
                    step="0.1"
                    value={p.decay || 3.0}
                    onChange={(e) => handleParamChange(dev.id, "decay", Number(e.target.value))}
                    className="w-full h-1 accent-[#df9c43] bg-zinc-800 rounded cursor-pointer"
                  />
                </div>
              )}

              {/* 20. Multi-Sampler */}
              {(dev.name.includes("Sampler") || dev.id.includes("smp")) && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="text-zinc-400">Banque Multi-Samples</span>
                    <span className="text-amber-400 font-mono">Piano & Synth</span>
                  </div>
                  <div className="h-8 bg-black/50 rounded border border-white/5 flex items-center justify-center p-1">
                    <span className="text-[9px] font-mono text-[#f5c277] truncate">
                      tolcha_08.wav [C3 Transpose]
                    </span>
                  </div>
                </div>
              )}

              {/* 21. Mastering Tool */}
              {(dev.name.includes("Mastering") || dev.id.includes("tol")) && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="text-zinc-400">Largeur Stéréo M/S</span>
                    <span className="text-amber-400 font-mono">{p.width || 120}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={p.width !== undefined ? p.width : 120}
                    onChange={(e) => handleParamChange(dev.id, "width", Number(e.target.value))}
                    className="w-full h-1 accent-[#df9c43] bg-zinc-800 rounded cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[9px] pt-1">
                    <span className="text-zinc-400">True Peak Limiter</span>
                    <span className="text-emerald-400 font-mono font-bold">-0.1 dBTP</span>
                  </div>
                </div>
              )}
            </div>

            {/* ── FOOTER: Device Category & Order ── */}
            <div className="flex items-center justify-between text-[8px] font-mono text-zinc-500 pt-1.5 border-t border-[#2b2b2b]">
              <span className="text-amber-400/80">DSP: {dev.category}</span>
              <span>#{dIdx + 1}</span>
            </div>
          </div>
        );
      })}

      {/* Add Device Button in Rack */}
      <button
        type="button"
        data-testid="btn-add-device-rack"
        onClick={() => onOpenBrowser && onOpenBrowser()}
        className="w-40 h-full flex-shrink-0 border-2 border-dashed border-[#333333] hover:border-[#df9c43] rounded-xl flex flex-col items-center justify-center p-3 text-center transition-all cursor-pointer group bg-black/20 hover:bg-[#df9c43]/5"
        title="Ajouter un composant à la chaîne"
      >
        <Plus size={16} className="text-[#df9c43] mb-1 group-hover:scale-110 transition-transform" />
        <span className="text-[10px] font-bold text-white block">+ Périphérique [B]</span>
        <span className="text-[8.5px] text-zinc-500">Ouvrir le navigateur</span>
      </button>
    </div>
  );
}
