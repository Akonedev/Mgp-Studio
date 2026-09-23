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
  console.log('[SPAWN] Starting Electron on DISPLAY=:0 with remote-debugging-port 9222...');
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

  // Wait for 9222
  let target = null;
  for (let i = 0; i < 30; i++) {
    await sleep(1000);
    try {
      const targets = await getJson('http://127.0.0.1:9222/json');
      target = targets.find(t => t.type === 'page');
      if (target) {
        console.log('[CDP] Found page target:', target.title || target.url);
        break;
      }
    } catch (e) {
      // connecting...
    }
  }

  if (!target) {
    console.error('[CDP] Failed to connect to Electron page target.');
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

  console.log('[CDP] Navigating to http://localhost:3000/studio/music ...');
  await cdp.send('Page.navigate', { url: 'http://localhost:3000/studio/music' });
  await sleep(4000);

  // 1. Simple Mode
  console.log('[CDP] 1. Simple Mode screenshot');
  await cdp.captureScreenshot('clean_01_simple_mode.png');

  // 2. Custom Mode
  console.log('[CDP] 2. Switching to Custom Mode');
  await cdp.eval(`
    (() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const customBtn = btns.find(b => b.textContent.trim() === 'Custom');
      if (customBtn) customBtn.click();
    })()
  `);
  await sleep(800);
  await cdp.captureScreenshot('clean_03_custom_mode_homogeneous.png');

  // 3. Scroll to STYLE OF MUSIC card
  console.log('[CDP] 3. Scrolling create panel down to STYLE OF MUSIC card');
  await cdp.eval(`
    (() => {
      const panel = document.querySelector('[data-testid="music-create-panel"]');
      if (panel) panel.scrollTop = 520;
    })()
  `);
  await sleep(800);
  await cdp.captureScreenshot('clean_03_custom_style_card_scrolled.png');

  // 4. Click Dices in STYLE OF MUSIC
  console.log('[CDP] 4. Clicking Dices (Style aléatoire)');
  await cdp.eval(`
    (() => {
      const btn = document.querySelector('button[title*="Style aléatoire"]');
      if (btn) btn.click();
    })()
  `);
  await sleep(800);
  await cdp.captureScreenshot('clean_04_custom_style_dices.png');

  // 5. Click a pill tag
  console.log('[CDP] 5. Clicking a tag pill');
  await cdp.eval(`
    (() => {
      const panel = document.querySelector('[data-testid="music-create-panel"]');
      const pills = Array.from(panel.querySelectorAll('button')).filter(b => b.className.includes('rounded-full') && b.className.includes('text-[10px]'));
      if (pills.length > 0) pills[0].click();
    })()
  `);
  await sleep(800);
  await cdp.captureScreenshot('clean_05_custom_pill_clicked.png');

  // 6. Select Turbo NVFP4 in model selector
  console.log('[CDP] 6. Selecting Turbo NVFP4');
  await cdp.eval(`
    (() => {
      const panel = document.querySelector('[data-testid="music-create-panel"]');
      if (panel) panel.scrollTop = 0;
      const select = panel.querySelector('select');
      if (select) {
        select.value = 'acestep-turbo-nvfp4';
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()
  `);
  await sleep(800);
  await cdp.captureScreenshot('clean_06_model_turbo_nvfp4.png');

  // 7. Open ComfyUI Graph Modal from create panel
  console.log('[CDP] 7. Opening ComfyUI Graph modal');
  await cdp.eval(`
    (() => {
      const panel = document.querySelector('[data-testid="music-create-panel"]');
      const grapheBtn = panel.querySelector('button[title*="Voir le graphe"]');
      if (grapheBtn) grapheBtn.click();
    })()
  `);
  await sleep(1000);
  await cdp.captureScreenshot('clean_07_graph_modal_turbo.png');

  // Close modal
  await cdp.eval(`
    (() => {
      const closeBtn = document.querySelector('.fixed button');
      if (closeBtn) closeBtn.click();
    })()
  `);
  await sleep(600);

  // 8. Open Advanced Settings
  console.log('[CDP] 8. Opening Advanced Settings');
  await cdp.eval(`
    (() => {
      const panel = document.querySelector('[data-testid="music-create-panel"]');
      const btns = Array.from(panel.querySelectorAll('button'));
      const advBtn = btns.find(b => b.textContent.includes('Advanced Settings'));
      if (advBtn) advBtn.click();
      panel.scrollTop = 1200;
    })()
  `);
  await sleep(1000);
  await cdp.captureScreenshot('clean_08_advanced_settings_open.png');

  // 9. Select BF16 Studio Full in Advanced Settings
  console.log('[CDP] 9. Selecting BF16 Studio Full in Advanced Settings');
  await cdp.eval(`
    (() => {
      const panel = document.querySelector('[data-testid="music-create-panel"]');
      const selects = Array.from(panel.querySelectorAll('select'));
      const modelSelect = selects.find(s => Array.from(s.options).some(o => o.value === 'ace-step-v35'));
      if (modelSelect) {
        modelSelect.value = 'ace-step-v35';
        modelSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()
  `);
  await sleep(1000);
  await cdp.captureScreenshot('clean_09_advanced_settings_bf16_full.png');

  console.log('[CDP] All done! Closing electron...');
  electronProcess.kill('SIGKILL');
  process.exit(0);
}

main().catch(err => {
  console.error('[CDP] Fatal error:', err);
  process.exit(1);
});
