import { NextResponse } from "next/server";
import dgram from "dgram";

/**
 * Standard OSC 1.0 Message Encoder
 */
function encodeOscMessage(address, typeTags = "", args = []) {
  const buffers = [];

  // 1. Address null-padded to 4 bytes
  const addrBuf = Buffer.from(address, "utf-8");
  let addrPad = 4 - (addrBuf.length % 4);
  if (addrPad === 0) addrPad = 4;
  buffers.push(addrBuf, Buffer.alloc(addrPad, 0));

  // 2. Type tags string starting with comma
  const tagsStr = typeTags ? (typeTags.startsWith(",") ? typeTags : `,${typeTags}`) : ",";
  const tagBuf = Buffer.from(tagsStr, "utf-8");
  let tagPad = 4 - (tagBuf.length % 4);
  if (tagPad === 0) tagPad = 4;
  buffers.push(tagBuf, Buffer.alloc(tagPad, 0));

  // 3. Arguments
  const cleanTags = tagsStr.startsWith(",") ? tagsStr.slice(1) : tagsStr;
  for (let i = 0; i < cleanTags.length; i++) {
    const t = cleanTags[i];
    const val = args[i];
    if (t === "f") {
      const b = Buffer.alloc(4);
      b.writeFloatBE(Number(val), 0);
      buffers.push(b);
    } else if (t === "i") {
      const b = Buffer.alloc(4);
      b.writeInt32BE(Number(val), 0);
      buffers.push(b);
    } else if (t === "s") {
      const strBuf = Buffer.from(String(val), "utf-8");
      let strPad = 4 - (strBuf.length % 4);
      if (strPad === 0) strPad = 4;
      buffers.push(strBuf, Buffer.alloc(strPad, 0));
    }
  }

  return Buffer.concat(buffers);
}

/**
 * Standard OSC 1.0 Message Decoder
 */
function decodeOscMessage(buf) {
  if (!buf || buf.length < 4) return null;
  let addrEnd = 0;
  while (addrEnd < buf.length && buf[addrEnd] !== 0) addrEnd++;
  const address = buf.subarray(0, addrEnd).toString("utf-8");
  let offset = Math.ceil((addrEnd + 1) / 4) * 4;
  if (offset >= buf.length) return { address, args: [] };

  let tagEnd = offset;
  while (tagEnd < buf.length && buf[tagEnd] !== 0) tagEnd++;
  const tagsStr = buf.subarray(offset, tagEnd).toString("utf-8");
  offset = Math.ceil((tagEnd + 1) / 4) * 4;

  const args = [];
  if (tagsStr.startsWith(",")) {
    for (let i = 1; i < tagsStr.length; i++) {
      const t = tagsStr[i];
      if (t === "f" && offset + 4 <= buf.length) {
        args.push(Number(buf.readFloatBE(offset).toFixed(4)));
        offset += 4;
      } else if (t === "i" && offset + 4 <= buf.length) {
        args.push(buf.readInt32BE(offset));
        offset += 4;
      } else if (t === "s") {
        let strEnd = offset;
        while (strEnd < buf.length && buf[strEnd] !== 0) strEnd++;
        args.push(buf.subarray(offset, strEnd).toString("utf-8"));
        offset = Math.ceil((strEnd + 1) / 4) * 4;
      }
    }
  }
  return { address, args };
}

// Global cache for OSC state
let lastSentCommand = null;
let lastSentTimestamp = null;
let udpSocket = null;
if (!globalThis.__studioOscState) {
  globalThis.__studioOscState = {
    connected: false,
    lastReceivedAt: null,
    isPlaying: false,
    isRecording: false,
    isLoop: false,
    tempo: 172.0,
    position: 0,
    masterVolume: 0.85,
    tracks: {}
  };
}
const studioState = globalThis.__studioOscState;

function ensureUdpReceiver() {
  if (!globalThis.__studioReceiverSocket) {
    try {
      const sock = dgram.createSocket({ type: "udp4", reuseAddr: true });
      sock.on("message", (msg) => {
        try {
          const decoded = decodeOscMessage(msg);
          if (!decoded) return;
          studioState.connected = true;
          studioState.lastReceivedAt = new Date().toISOString();
          const { address, args } = decoded;
          if (address === "/transport/playing") {
            studioState.isPlaying = Number(args[0]) === 1;
          } else if (address === "/transport/recording") {
            studioState.isRecording = Number(args[0]) === 1;
          } else if (address === "/transport/loop") {
            studioState.isLoop = Number(args[0]) === 1;
          } else if (address === "/transport/tempo") {
            studioState.tempo = Number(args[0]);
          } else if (address === "/transport/position") {
            studioState.position = Number(args[0]);
          } else if (address === "/master/volume") {
            studioState.masterVolume = Number(args[0]);
          } else if (address.startsWith("/track/")) {
            const parts = address.split("/");
            const tIdx = parseInt(parts[2], 10);
            const field = parts[3];
            if (!isNaN(tIdx) && field) {
              if (!studioState.tracks[tIdx]) studioState.tracks[tIdx] = {};
              studioState.tracks[tIdx][field] = args[0];
            }
          }
        } catch (e) {
          console.warn("[studioOscRoute] Error parsing OSC message:", e);
        }
      });
      sock.on("error", (err) => {
        console.warn("[studioOscRoute] UDP receiver error:", err.message);
      });
      sock.bind(9001, "0.0.0.0", () => {
        console.log("[studioOscRoute] UDP 9001 receiver active for studio feedback");
      });
      globalThis.__studioReceiverSocket = sock;
    } catch (err) {
      console.warn("[studioOscRoute] Failed to bind UDP 9001:", err.message);
    }
  }
}

function getUdpSocket() {
  if (!udpSocket) {
    udpSocket = dgram.createSocket("udp4");
    udpSocket.on("error", (err) => {
      console.warn("[studioOscRoute] UDP Socket warning:", err);
    });
  }
  return udpSocket;
}

export async function GET() {
  ensureUdpReceiver();
  return NextResponse.json({
    status: "ok",
    bridge: "studio Studio OSC Bridge",
    target: "127.0.0.1:9000",
    feedbackPort: 9001,
    lastSentCommand,
    lastSentTimestamp,
    studioState
  });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      command,
      address: rawAddress,
      typeTags: rawTypeTags = "",
      args: rawArgs = [],
      targetHost = "127.0.0.1",
      targetPort = 9000
    } = body;

    let address = rawAddress;
    let typeTags = rawTypeTags;
    let args = rawArgs;

    // Map convenient command presets to studio JARVIS OSC endpoints
    if (command === "play") {
      address = "/transport/play";
      typeTags = "";
      args = [];
    } else if (command === "stop") {
      address = "/transport/stop";
      typeTags = "";
      args = [];
    } else if (command === "toggle_play") {
      address = "/transport/toggle_play";
      typeTags = "";
      args = [];
    } else if (command === "record") {
      address = "/transport/record";
      typeTags = "";
      args = [];
    } else if (command === "rewind") {
      address = "/transport/rewind";
      typeTags = "";
      args = [];
    } else if (command === "tempo") {
      address = "/transport/tempo";
      typeTags = "f";
      args = [Number(body.tempo || 172.0)];
    } else if (command === "track_volume") {
      const idx = body.trackIndex !== undefined ? body.trackIndex : 0;
      address = `/track/${idx}/volume`;
      typeTags = "f";
      args = [Math.max(0, Math.min(1, Number(body.volume !== undefined ? body.volume : 0.8)))];
    } else if (command === "track_mute") {
      const idx = body.trackIndex !== undefined ? body.trackIndex : 0;
      address = `/track/${idx}/mute`;
      typeTags = "i";
      args = [body.mute ? 1 : 0];
    } else if (command === "track_solo") {
      const idx = body.trackIndex !== undefined ? body.trackIndex : 0;
      address = `/track/${idx}/solo`;
      typeTags = "i";
      args = [body.solo ? 1 : 0];
    } else if (command === "scene_launch") {
      const idx = body.sceneIndex !== undefined ? body.sceneIndex : 0;
      address = `/scene/${idx}/launch`;
      typeTags = "";
      args = [];
    } else if (command === "master_volume") {
      address = "/master/volume";
      typeTags = "f";
      args = [Math.max(0, Math.min(1, Number(body.volume !== undefined ? body.volume : 0.85)))];
    }

    if (!address) {
      return NextResponse.json({ error: "No OSC address specified" }, { status: 400 });
    }

    const oscBuffer = encodeOscMessage(address, typeTags, args);
    const client = getUdpSocket();

    await new Promise((resolve, reject) => {
      client.send(oscBuffer, targetPort, targetHost, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    lastSentCommand = { address, typeTags, args };
    lastSentTimestamp = new Date().toISOString();

    return NextResponse.json({
      success: true,
      address,
      typeTags,
      args,
      bytes: oscBuffer.length,
      target: `${targetHost}:${targetPort}`,
      sentAt: lastSentTimestamp
    });
  } catch (err) {
    console.error("[studioOscRoute] Error sending OSC:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
