import http from 'http';
import fs from 'fs';
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

async function run() {
  console.log('[CDP] Connecting to headless Chrome on port 9222...');
  const targets = await getJson('http://127.0.0.1:9222/json');
  let target = targets.find(t => t.type === 'page');
  if (!target) {
    const newTab = await getJson('http://127.0.0.1:9222/json/new');
    target = newTab;
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
  await sleep(3500);

  // 1. Capture Simple Mode (Clean layout without the removed carousel)
  console.log('[CDP] Step 1: Simple Mode Layout');
  await cdp.captureScreenshot('clean_01_simple_mode.png');

  // Test Simple Mode Dices
  console.log('[CDP] Step 2: Testing Dices in Simple Mode');
  await cdp.eval(`
    (() => {
      const btn = document.querySelector('button[title*="description aléatoire"]');
      if (btn) btn.click();
    })()
  `);
  await sleep(800);
  await cdp.captureScreenshot('clean_02_simple_dices_clicked.png');

  // 2. Switch to Custom Mode
  console.log('[CDP] Step 3: Switching to Custom Mode');
  await cdp.eval(`
    (() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const customBtn = btns.find(b => b.textContent.trim() === 'Custom');
      if (customBtn) customBtn.click();
    })()
  `);
  await sleep(800);

  // Scroll down to show STYLE OF MUSIC card and tag pills
  console.log('[CDP] Scrolling create panel to STYLE OF MUSIC card...');
  await cdp.eval(`
    (() => {
      const panel = document.querySelector('[data-testid="music-create-panel"]');
      if (panel) panel.scrollTop = 450;
    })()
  `);
  await sleep(600);
  await cdp.captureScreenshot('clean_03_custom_style_card_scrolled.png');

  // 3. Test STYLE OF MUSIC card in Custom Mode
  console.log('[CDP] Step 4: Testing Dices & Tag Cloud in STYLE OF MUSIC');
  await cdp.eval(`
    (() => {
      const btn = document.querySelector('button[title*="Style aléatoire"]');
      if (btn) btn.click();
    })()
  `);
  await sleep(800);
  await cdp.captureScreenshot('clean_04_custom_style_dices.png');

  // Click a pill tag
  console.log('[CDP] Step 5: Clicking a Style Tag Pill');
  await cdp.eval(`
    (() => {
      const pills = Array.from(document.querySelectorAll('button')).filter(b => b.className.includes('rounded-full') && b.className.includes('text-[10px]'));
      if (pills.length > 0) pills[0].click();
    })()
  `);
  await sleep(800);
  await cdp.captureScreenshot('clean_05_custom_pill_clicked.png');

  // 4. Test Model Selection: Choose Turbo NVFP4
  console.log('[CDP] Step 6: Testing Model Selector -> Turbo NVFP4');
  await cdp.eval(`
    (() => {
      const panel = document.querySelector('[data-testid="music-create-panel"]');
      if (panel) panel.scrollTop = 0;
      const select = document.querySelector('select');
      if (select) {
        select.value = 'acestep-turbo-nvfp4';
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()
  `);
  await sleep(1000);
  await cdp.captureScreenshot('clean_06_model_turbo_nvfp4.png');

  // Open Graph Inspection Modal with precise selector
  console.log('[CDP] Step 7: Opening Graph Inspection Modal for Turbo NVFP4');
  await cdp.eval(`
    (() => {
      const grapheBtn = document.querySelector('button[title*="Voir le graphe"]');
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

  // 5. Open Advanced Settings & Check Studio BF16 Full
  console.log('[CDP] Step 8: Opening Advanced Settings');
  await cdp.eval(`
    (() => {
      const panel = document.querySelector('[data-testid="music-create-panel"]');
      if (panel) panel.scrollTop = 800;
      const btns = Array.from(document.querySelectorAll('button'));
      const advBtn = btns.find(b => b.textContent.includes('Advanced Settings'));
      if (advBtn) advBtn.click();
    })()
  `);
  await sleep(1000);

  await cdp.eval(`
    (() => {
      const panel = document.querySelector('[data-testid="music-create-panel"]');
      if (panel) panel.scrollTop = 1200;
    })()
  `);
  await sleep(600);
  await cdp.captureScreenshot('clean_08_advanced_settings_open.png');

  // Select BF16 Studio Full in Advanced Settings
  console.log('[CDP] Step 9: Selecting ACE-Step v1.5 Studio (BF16 Full) in Advanced Settings');
  await cdp.eval(`
    (() => {
      const selects = Array.from(document.querySelectorAll('select'));
      const modelSelect = selects.find(s => Array.from(s.options).some(o => o.value === 'ace-step-v35'));
      if (modelSelect) {
        modelSelect.value = 'ace-step-v35';
        modelSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()
  `);
  await sleep(1000);
  await cdp.captureScreenshot('clean_09_advanced_settings_bf16_full.png');

  console.log('[CDP] All verification steps completed successfully!');
  process.exit(0);
}

run().catch(err => {
  console.error('[CDP] Error:', err);
  process.exit(1);
});
