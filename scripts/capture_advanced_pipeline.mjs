import http from 'http';
import fs from 'fs';
import { spawn } from 'child_process';
import WebSocket from 'ws';

const sleep = ms => new Promise(r => setTimeout(r, ms));
const ARTIFACTS_DIR = '/home/akone/.gemini/antigravity-cli/brain/ec4d3b75-9be6-4e34-9495-139f6d9ad437';

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

class CDP {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.msgId = 1;
    this.callbacks = new Map();
  }

  async init() {
    await new Promise((res, rej) => {
      this.ws.on('open', res);
      this.ws.on('error', rej);
    });
    this.ws.on('message', data => {
      const msg = JSON.parse(data);
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.msgId++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async captureScreenshot(filename) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    fs.writeFileSync(`${ARTIFACTS_DIR}/${filename}`, buffer);
    console.log(`[CDP] Saved: ${filename}`);
  }

  async eval(expr) {
    const res = await this.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    return res.result?.value;
  }
}

async function main() {
  const electronProcess = spawn('npx', [
    'electron',
    '--no-sandbox',
    '--disable-gpu-sandbox',
    '--remote-debugging-port=9222',
    'electron/main.js'
  ], {
    env: {
      ...process.env,
      DISPLAY: ':0',
      WAYLAND_DISPLAY: 'wayland-0',
      ELECTRON_START_URL: 'http://localhost:3000/studio/music'
    },
    stdio: 'ignore'
  });

  let target = null;
  for (let i = 0; i < 30; i++) {
    await sleep(1000);
    try {
      const targets = await getJson('http://127.0.0.1:9222/json');
      target = targets.find(t => t.type === 'page');
      if (target) break;
    } catch (e) {}
  }

  if (!target) {
    electronProcess.kill('SIGKILL');
    process.exit(1);
  }

  const cdp = new CDP(target.webSocketDebuggerUrl);
  await cdp.init();

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('DOM.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  await cdp.send('Page.navigate', { url: 'http://localhost:3000/studio/music' });
  await sleep(3500);

  // Switch to Custom
  await cdp.eval(`
    (() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const customBtn = btns.find(b => b.textContent.trim() === 'Custom');
      if (customBtn) customBtn.click();
    })()
  `);
  await sleep(800);

  // Open Advanced Settings and scroll to bottom
  await cdp.eval(`
    (() => {
      const panel = document.querySelector('[data-testid="music-create-panel"]');
      const btns = Array.from(panel.querySelectorAll('button'));
      const advBtn = btns.find(b => b.textContent.includes('Advanced Settings'));
      if (advBtn) advBtn.click();
    })()
  `);
  await sleep(1000);

  await cdp.eval(`
    (() => {
      const panel = document.querySelector('[data-testid="music-create-panel"]');
      if (panel) panel.scrollTop = 1650;
    })()
  `);
  await sleep(1000);

  await cdp.captureScreenshot('clean_10_advanced_pipeline_bf16.png');
  console.log('Capture clean_10 done!');
  electronProcess.kill('SIGKILL');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
