#!/usr/bin/env node
/**
 * Music Studio Studio 6.0 OSC UDP 9001 Feedback Receiver & HTTP Relayer
 * Listens for OSC datagrams sent by Music Studio Studio on UDP port 9001
 * and provides an HTTP/SSE stream on port 58106.
 */

import dgram from "node:dgram";
import http from "node:http";
import { decodeOscMessage } from "./test_osc_codec.mjs";

const UDP_PORT = 9001;
const HTTP_PORT = 58106;

const state = {
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

const clients = new Set();

// Create UDP Server
const udpServer = dgram.createSocket({ type: "udp4", reuseAddr: true });

udpServer.on("message", (msg) => {
  const decoded = decodeOscMessage(msg);
  if (!decoded) return;

  state.connected = true;
  state.lastReceivedAt = new Date().toISOString();

  const { address, args } = decoded;
  if (address === "/transport/playing") {
    state.isPlaying = Number(args[0]) === 1;
  } else if (address === "/transport/recording") {
    state.isRecording = Number(args[0]) === 1;
  } else if (address === "/transport/loop") {
    state.isLoop = Number(args[0]) === 1;
  } else if (address === "/transport/tempo") {
    state.tempo = Number(args[0]);
  } else if (address === "/transport/position") {
    state.position = Number(args[0]);
  } else if (address === "/master/volume") {
    state.masterVolume = Number(args[0]);
  } else if (address.startsWith("/track/")) {
    const parts = address.split("/");
    const tIdx = parseInt(parts[2], 10);
    const field = parts[3];
    if (!isNaN(tIdx) && field) {
      if (!state.tracks[tIdx]) state.tracks[tIdx] = {};
      state.tracks[tIdx][field] = args[0];
    }
  }

  // Broadcast to SSE clients
  const payload = `data: ${JSON.stringify({ address, args, state })}\n\n`;
  for (const client of clients) {
    try {
      client.write(payload);
    } catch {
      clients.delete(client);
    }
  }
});

udpServer.on("error", (err) => {
  console.error(`[studio_osc_receiver] UDP error: ${err.message}`);
});

udpServer.bind(UDP_PORT, "0.0.0.0", () => {
  console.log(`[studio_osc_receiver] Listening for Music Studio OSC on UDP ${UDP_PORT}`);
});

// Create HTTP / SSE Server
const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === "/sse") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive"
    });
    clients.add(res);
    res.write(`data: ${JSON.stringify({ type: "init", state })}\n\n`);
    req.on("close", () => clients.delete(res));
    return;
  }

  if (req.url === "/state" || req.url === "/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", state }, null, 2));
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(HTTP_PORT, "0.0.0.0", () => {
  console.log(`[studio_osc_receiver] HTTP/SSE relay listening on http://0.0.0.0:${HTTP_PORT}`);
});
