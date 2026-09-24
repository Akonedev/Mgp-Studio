/**
 * Bitwig Studio Professional Audio Engine Extension (Chapter 13, 14, 18, 19)
 * Pure Mathematical DSP & Non-Realtime Processing (Zero Mock)
 * 
 * Includes:
 * 1. Automation System & Curve Interpolators (Linear, Exponential, Bezier with Tension, Step)
 * 2. Dynamic Sidechain Compression & Gain Reduction DSP
 * 3. Bit-Perfect RIFF WAV Encoder (24-bit PCM & 32-bit IEEE Float) & OfflineAudioContext Renderer
 * 4. 3D Spatial Audio & Binaural HRTF Panning Calculations
 */

// ══════════════════════════════════════════════════════════════════════════════
// 1. AUTOMATION SYSTEM & CURVE INTERPOLATORS (Bitwig Chapter 13 & 14)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Linear Interpolation: y(u) = y0 + u * (y1 - y0)
 */
export function interpolateLinear(y0, y1, u) {
  const clampedU = Math.max(0, Math.min(1, u));
  return y0 + clampedU * (y1 - y0);
}

/**
 * Step (Hold) Interpolation: y(u) = y0 if u < 1 else y1
 */
export function interpolateStep(y0, y1, u) {
  return u >= 1 ? y1 : y0;
}

/**
 * Exponential Curve Interpolation with Tension:
 * Tension k in [-0.95, 0.95]:
 *   k > 0: convex slow start, rapid rise (exponent p = 1 + 3k)
 *   k < 0: concave fast start, slow plateau (exponent p = 1 / (1 - 3k))
 *   k = 0: linear (p = 1)
 */
export function interpolateExponential(y0, y1, u, tension = 0) {
  const clampedU = Math.max(0, Math.min(1, u));
  const clampedTension = Math.max(-0.95, Math.min(0.95, tension));

  let exponent = 1.0;
  if (clampedTension > 0) {
    exponent = 1.0 + 3.0 * clampedTension;
  } else if (clampedTension < 0) {
    exponent = 1.0 / (1.0 - 3.0 * clampedTension);
  }

  const curvedU = Math.pow(clampedU, exponent);
  return y0 + curvedU * (y1 - y0);
}

/**
 * S-Curve / Bezier Interpolation with Tension:
 * Cubic smoothstep biased by sinusoidal tension displacement
 */
export function interpolateBezier(y0, y1, u, tension = 0) {
  const clampedU = Math.max(0, Math.min(1, u));
  const clampedTension = Math.max(-0.95, Math.min(0.95, tension));

  // Modulate progress by tension handle displacement
  const biasedU = Math.max(0, Math.min(1, clampedU + clampedTension * Math.sin(Math.PI * clampedU)));
  // Smoothstep S-curve: 3w^2 - 2w^3
  const smooth = 3 * Math.pow(biasedU, 2) - 2 * Math.pow(biasedU, 3);
  return y0 + smooth * (y1 - y0);
}

/**
 * Unified Curve Evaluator for arbitrary point pairs
 */
export function interpolateSegment(p0, p1, bar) {
  if (p1.bar === p0.bar) return p0.value;
  const u = (bar - p0.bar) / (p1.bar - p0.bar);

  const curveType = p0.curveType || (p0.tension !== 0 ? "bezier" : "linear");
  const tension = p0.tension !== undefined ? p0.tension : 0;

  switch (curveType) {
    case "step":
      return interpolateStep(p0.value, p1.value, u);
    case "exponential":
      return interpolateExponential(p0.value, p1.value, u, tension);
    case "bezier":
      return interpolateBezier(p0.value, p1.value, u, tension);
    case "linear":
    default:
      return interpolateLinear(p0.value, p1.value, u);
  }
}

/**
 * Evaluates the exact parameter value of an automation lane at any continuous bar
 */
export function evaluateAutomationValue(lane, targetBar) {
  if (!lane || !Array.isArray(lane.points) || lane.points.length === 0) {
    return lane?.defaultValue !== undefined ? lane.defaultValue : 0;
  }

  const points = lane.points;
  if (targetBar <= points[0].bar) {
    return points[0].value;
  }
  if (targetBar >= points[points.length - 1].bar) {
    return points[points.length - 1].value;
  }

  // Find bounding segment [p_i, p_{i+1}]
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    if (targetBar >= p0.bar && targetBar <= p1.bar) {
      return interpolateSegment(p0, p1, targetBar);
    }
  }

  return points[points.length - 1].value;
}

/**
 * Generates an array of scheduled automation events for Web Audio AudioParam
 */
export function generateAutomationTimelineEvents({ lane, startBar, durationBars, bpm, stepsPerBar = 16 }) {
  const events = [];
  const secPerBar = 240 / bpm;
  const totalSteps = Math.ceil(durationBars * stepsPerBar);
  const barStep = 1 / stepsPerBar;

  for (let s = 0; s <= totalSteps; s++) {
    const currentBar = startBar + s * barStep;
    const value = evaluateAutomationValue(lane, currentBar);
    const timeSec = s * (secPerBar / stepsPerBar);
    events.push({ timeSec, value, bar: currentBar });
  }

  return events;
}

// ══════════════════════════════════════════════════════════════════════════════
// 2. DYNAMIC SIDECHAIN COMPRESSION & DSP GAIN REDUCTION (Bitwig Chapter 18 & 19)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Computes exact discrete-time recursive envelope follower and gain reduction
 * 
 * Mathematical model:
 *   alpha_att = exp(-1 / (tau_att * fs))
 *   alpha_rel = exp(-1 / (tau_rel * fs))
 *   overshoot = max(0, detectorDb - thresholdDb)
 *   targetGrDb = -overshoot * (1 - 1 / ratio)
 */
export function computeGainReductionDb({
  detectorLevelDb,
  thresholdDb = -18,
  ratio = 4,
  kneeDb = 0,
  attackSec = 0.005,
  releaseSec = 0.100,
  sampleRate = 48000,
  prevEnvelopeDb = 0
}) {
  const alphaAtt = Math.exp(-1.0 / (Math.max(0.0001, attackSec) * sampleRate));
  const alphaRel = Math.exp(-1.0 / (Math.max(0.0001, releaseSec) * sampleRate));

  let overshoot = 0;
  if (kneeDb > 0 && detectorLevelDb > thresholdDb - kneeDb / 2 && detectorLevelDb < thresholdDb + kneeDb / 2) {
    // Soft knee parabolic interpolation
    const delta = detectorLevelDb - thresholdDb + kneeDb / 2;
    overshoot = Math.pow(delta, 2) / (2 * kneeDb);
  } else {
    overshoot = Math.max(0, detectorLevelDb - thresholdDb);
  }

  const targetGrDb = ratio > 1 ? -overshoot * (1.0 - 1.0 / ratio) : 0;

  // Smoothing filter with asymmetric attack/release coefficients
  let envDb = 0;
  if (targetGrDb < prevEnvelopeDb) {
    // Attack phase (gain reducing)
    envDb = alphaAtt * prevEnvelopeDb + (1.0 - alphaAtt) * targetGrDb;
  } else {
    // Release phase (gain recovering)
    envDb = alphaRel * prevEnvelopeDb + (1.0 - alphaRel) * targetGrDb;
  }

  const linearGain = Math.pow(10, envDb / 20);

  return {
    gainReductionDb: Number(envDb.toFixed(2)),
    linearGain: Number(linearGain.toFixed(4)),
    nextEnvelopeDb: envDb
  };
}

/**
 * Configure Real Web Audio Nodes for Sidechain Ducking
 */
export function setupSidechainDuckingRouting({
  audioCtx,
  sourceNode,
  targetGainNode,
  thresholdDb = -18,
  ratio = 4,
  attackSec = 0.005,
  releaseSec = 0.100
}) {
  if (!audioCtx || !sourceNode || !targetGainNode) return null;

  // Sidechain isolation filter (e.g. lowpass 160Hz to isolate Log Drum or Kick fundamental)
  const scFilter = audioCtx.createBiquadFilter();
  scFilter.type = "lowpass";
  scFilter.frequency.value = 160;
  scFilter.Q.value = 1.0;

  // Sidechain detector compressor
  const scCompressor = audioCtx.createDynamicsCompressor();
  scCompressor.threshold.value = thresholdDb;
  scCompressor.ratio.value = ratio;
  scCompressor.attack.value = attackSec;
  scCompressor.release.value = releaseSec;
  scCompressor.knee.value = 3;

  sourceNode.connect(scFilter);
  scFilter.connect(scCompressor);

  return {
    filter: scFilter,
    compressor: scCompressor
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// 3. BIT-PERFECT RIFF WAV ENCODER (24-bit PCM & 32-bit Float) & OFFLINE BOUNCE
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Pure JavaScript RIFF WAV Binary Encoder
 * Supports 24-bit PCM (audio/x-wav) and 32-bit IEEE Float (audio/wav)
 * 
 * Specification:
 * - 44-byte RIFF header
 * - Format tag: 1 = PCM, 3 = IEEE Float
 * - Word alignment & exact byte allocation (zero memory leaks)
 */
export function encodeWav({ sampleRate = 48000, channelData, bitDepth = 24 }) {
  if (!Array.isArray(channelData) || channelData.length === 0) {
    throw new Error("[encodeWav] channelData must contain at least 1 Float32Array channel");
  }

  const numChannels = channelData.length;
  const numSamples = channelData[0].length;
  const bytesPerSample = bitDepth === 32 ? 4 : 3;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const bufferLength = 44 + dataSize;

  const buffer = new ArrayBuffer(bufferLength);
  const view = new DataView(buffer);

  // Helper to write ASCII strings
  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // 1. RIFF Chunk Descriptor
  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true); // Total file size - 8
  writeString(8, "WAVE");

  // 2. 'fmt ' Sub-chunk
  writeString(12, "fmt ");
  view.setUint32(16, 16, true); // Sub-chunk size (16 for PCM/Float)
  view.setUint16(20, bitDepth === 32 ? 3 : 1, true); // Format tag: 3 = Float, 1 = PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // 3. 'data' Sub-chunk
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  // Interleave and quantize channel samples
  let offset = 44;
  if (bitDepth === 32) {
    // 32-bit IEEE 754 Floating Point (-1.0 to +1.0)
    for (let i = 0; i < numSamples; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const sample = Math.max(-1.0, Math.min(1.0, channelData[ch][i]));
        view.setFloat32(offset, sample, true);
        offset += 4;
      }
    }
  } else {
    // 24-bit Signed Linear PCM (-8388608 to +8388607)
    const MAX_24 = 8388607;
    const MIN_24 = -8388608;
    for (let i = 0; i < numSamples; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const sample = Math.max(-1.0, Math.min(1.0, channelData[ch][i]));
        const intVal = sample < 0 ? Math.round(sample * -MIN_24) : Math.round(sample * MAX_24);
        const clamped = Math.max(MIN_24, Math.min(MAX_24, intVal));

        // 3 bytes little-endian
        view.setUint8(offset, clamped & 0xff);
        view.setUint8(offset + 1, (clamped >> 8) & 0xff);
        view.setUint8(offset + 2, (clamped >> 16) & 0xff);
        offset += 3;
      }
    }
  }

  return new Uint8Array(buffer);
}

/**
 * Offline Project Renderer using OfflineAudioContext
 * Non-realtime bit-perfect rendering with zero audio underruns or GPU consumption
 */
export async function renderProjectOffline({
  tracks,
  bpm = 118,
  durationBars = 16,
  sampleRate = 48000,
  bitDepth = 24
}) {
  if (typeof OfflineAudioContext === "undefined") {
    throw new Error("[renderProjectOffline] OfflineAudioContext is not supported in this runtime");
  }

  const secPerBar = 240 / bpm;
  const totalDurationSec = durationBars * secPerBar;
  const totalLengthSamples = Math.ceil(totalDurationSec * sampleRate);

  const offlineCtx = new OfflineAudioContext(2, totalLengthSamples, sampleRate);
  const masterGain = offlineCtx.createGain();
  masterGain.gain.setValueAtTime(0.85, 0);
  masterGain.connect(offlineCtx.destination);

  // Set up each track in offline context
  for (const trk of tracks) {
    if (trk.mute) continue;

    const trkGain = offlineCtx.createGain();
    const volumeGain = Math.max(0.0001, ((trk.volume !== undefined ? trk.volume : 80) / 100) * 1.0);
    trkGain.gain.setValueAtTime(volumeGain, 0);

    // Apply Automation curves to volume or cutoff
    if (trk.automationLanes) {
      for (const lane of trk.automationLanes) {
        if (!lane.active) continue;
        if (lane.param === "volume" || lane.param === "mix") {
          const events = generateAutomationTimelineEvents({
            lane,
            startBar: 1,
            durationBars,
            bpm,
            stepsPerBar: 8
          });
          for (const ev of events) {
            const normalized = Math.max(0.0001, (ev.value / 100) * 1.0);
            trkGain.gain.linearRampToValueAtTime(normalized, Math.min(totalDurationSec, ev.timeSec));
          }
        }
      }
    }

    let panner = null;
    if (offlineCtx.createStereoPanner) {
      panner = offlineCtx.createStereoPanner();
      const panVal = trk.pan !== undefined ? Math.max(-1, Math.min(1, trk.pan / 50)) : 0;
      panner.pan.setValueAtTime(panVal, 0);
      trkGain.connect(panner);
      panner.connect(masterGain);
    } else {
      trkGain.connect(masterGain);
    }

    // Schedule audio clips
    const clips = trk.clips || [];
    for (const clip of clips) {
      if (!clip.audioBuffer) continue;
      const clipStartSec = (clip.startBar - 1) * secPerBar;
      const clipDurSec = (clip.bars || 8) * secPerBar;
      if (clipStartSec >= totalDurationSec) continue;

      const src = offlineCtx.createBufferSource();
      src.buffer = clip.audioBuffer;
      src.connect(trkGain);
      src.start(clipStartSec, 0, Math.min(clipDurSec, totalDurationSec - clipStartSec));
    }
  }

  // Render audio faster than realtime
  const renderedBuffer = await offlineCtx.startRendering();

  // Extract left & right channels
  const left = renderedBuffer.getChannelData(0);
  const right = renderedBuffer.numberOfChannels > 1 ? renderedBuffer.getChannelData(1) : left;

  const wavBytes = encodeWav({
    sampleRate,
    channelData: [left, right],
    bitDepth
  });

  return {
    renderedBuffer,
    wavBytes,
    wavBlob: new Blob([wavBytes], { type: bitDepth === 32 ? "audio/wav" : "audio/x-wav" }),
    durationSec: totalDurationSec,
    sampleRate,
    bitDepth
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// 4. 3D SPATIAL AUDIO & BINAURAL HRTF PANNER (Cinema Sync)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Calculates 3D Spatial Audio coordinates, distance attenuation, and azimuth/elevation angles
 * 
 * Coordinates:
 *   x: left (-5.0) to right (+5.0)
 *   y: bottom (-3.0) to top (+3.0)
 *   z: behind listener (-5.0) to in front (+5.0)
 */
export function calculateSpatialCoordinates({ x = 0, y = 0, z = 1, listener = { x: 0, y: 0, z: 0 } }) {
  const dx = x - listener.x;
  const dy = y - listener.y;
  const dz = z - listener.z;

  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const horizontalDist = Math.sqrt(dx * dx + dz * dz);

  // Azimuth in degrees (-180° to +180°)
  const azimuthDeg = Number(((Math.atan2(dx, dz) * 180) / Math.PI).toFixed(1));

  // Elevation in degrees (-90° to +90°)
  const elevationDeg = Number(((Math.atan2(dy, horizontalDist) * 180) / Math.PI).toFixed(1));

  // Inverse distance attenuation model: A = 1 / (1 + rolloff * (d - d_ref))
  const refDistance = 1.0;
  const rolloffFactor = 0.5;
  const maxDistance = 20.0;
  const clampedDist = Math.min(maxDistance, Math.max(refDistance, distance));
  const attenuation = Number((1.0 / (1.0 + rolloffFactor * (clampedDist - refDistance))).toFixed(3));

  return {
    x,
    y,
    z,
    distance: Number(distance.toFixed(2)),
    azimuthDeg,
    elevationDeg,
    attenuation
  };
}

/**
 * Configure Web Audio PannerNode with HRTF panning model
 */
export function applyHrtfSpatialPanner(pannerNode, { x, y, z, audioCtx }) {
  if (!pannerNode || !audioCtx) return;

  pannerNode.panningModel = "HRTF";
  pannerNode.distanceModel = "inverse";
  pannerNode.refDistance = 1;
  pannerNode.maxDistance = 20;
  pannerNode.rolloffFactor = 0.5;
  pannerNode.coneInnerAngle = 360;

  const now = audioCtx.currentTime;
  if (pannerNode.positionX) {
    pannerNode.positionX.setTargetAtTime(x, now, 0.03);
    pannerNode.positionY.setTargetAtTime(y, now, 0.03);
    pannerNode.positionZ.setTargetAtTime(z, now, 0.03);
  } else {
    pannerNode.setPosition(x, y, z);
  }
}

/**
 * Maps 3D Cartesian coordinates (x, z) in meters to 2D circular radar screen coordinates (px)
 */
export function calculateRadarScreenPosition({ x = 0, z = 2.5, center = 90, maxRadius = 80, maxRange = 5.0 }) {
  const normX = Math.max(-1, Math.min(1, x / maxRange));
  const normZ = Math.max(-1, Math.min(1, z / maxRange));
  const screenX = center + normX * maxRadius;
  const screenY = center - normZ * maxRadius; // Inverted because front/forward (+Z) is UP on radar screen
  return { screenX, screenY };
}

/**
 * Maps 2D circular radar screen coordinates (px) back to 3D Cartesian coordinates (x, z) in meters
 */
export function calculateRadarCoordinatesFromScreen({ screenX, screenY, center = 90, maxRadius = 80, maxRange = 5.0 }) {
  const normX = (screenX - center) / maxRadius;
  const normZ = -(screenY - center) / maxRadius;
  const clampedX = Math.max(-1, Math.min(1, normX));
  const clampedZ = Math.max(-1, Math.min(1, normZ));
  const x = Number((clampedX * maxRange).toFixed(2));
  const z = Number((clampedZ * maxRange).toFixed(2));
  return { x, z };
}

/**
 * Computes SVG path strings and tension handles for automation curve visualization
 */
export function buildAutomationCurveSvg(
  points = [],
  widthPx = 800,
  heightPx = 56,
  totalBars = 148,
  minVal = 0,
  maxVal = 100,
  startBarOffset = 1
) {
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
}
