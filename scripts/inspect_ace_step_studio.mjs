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
            this.ws.on('message', data => {
                const msg = JSON.parse(data.toString());
                if (msg.id && this.callbacks.has(msg.id)) {
                    const cb = this.callbacks.get(msg.id);
                    this.callbacks.delete(msg.id);
                    if (msg.error) cb.reject(msg.error);
                    else cb.resolve(msg.result);
                }
            });
        });
    }

    send(method, params = {}) {
        return new Promise((resolve, reject) => {
            const id = this.msgId++;
            this.callbacks.set(id, { resolve, reject });
            this.ws.send(JSON.stringify({ id, method, params }));
        });
    }

    async screenshot(filepath) {
        const { data } = await this.send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(filepath, Buffer.from(data, 'base64'));
        console.log(`[Screenshot saved] ${filepath}`);
    }

    async eval(expr) {
        const res = await this.send('Runtime.evaluate', {
            expression: expr,
            awaitPromise: true,
            returnByValue: true
        });
        if (res.exceptionDetails) {
            console.warn(`[Eval Exception]:`, res.exceptionDetails);
        }
        return res.result?.value;
    }

    close() {
        this.ws.close();
    }
}

async function main() {
    console.log('[1] Fetching targets from Chrome port 9222...');
    const targets = await getJson('http://127.0.0.1:9222/json');
    let pageTarget = targets.find(t => t.type === 'page');
    if (!pageTarget) {
        console.error('No page target found on port 9222');
        process.exit(1);
    }

    const cdp = new CDP(pageTarget.webSocketDebuggerUrl);
    await cdp.init();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('DOM.enable');

    console.log('[2] Navigating to http://localhost:3010/ ...');
    await cdp.send('Page.navigate', { url: 'http://localhost:3010/' });
    await sleep(2000);

    // Setup user in localStorage to bypass username modal
    await cdp.eval(`
        localStorage.setItem('acestep_token', 'local_dev_token');
        localStorage.setItem('acestep_user', JSON.stringify({
            id: 'user_1',
            username: 'laye',
            isAdmin: true
        }));
    `);
    // Reload to apply localStorage auth
    await cdp.send('Page.navigate', { url: 'http://localhost:3010/' });
    await sleep(2500);

    // Dismiss any modal overlays and switch to dark mode
    await cdp.eval(`(() => {
        document.querySelectorAll('.fixed.inset-0').forEach(el => el.remove());
        document.documentElement.classList.add('dark');
    })()`);
    await sleep(500);

    // 1. Capture Create Panel (Simple Mode)
    await cdp.screenshot(`${ARTIFACTS_DIR}/ace_3002_01_create_simple.png`);

    // 2. Click Custom Mode Tab
    await cdp.eval(`(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const customBtn = btns.find(b => b.textContent.trim() === 'Custom');
        if (customBtn) customBtn.click();
    })()`);
    await sleep(1000);
    await cdp.eval(`(() => {
        document.querySelectorAll('.fixed.inset-0').forEach(el => el.remove());
    })()`);
    await cdp.screenshot(`${ARTIFACTS_DIR}/ace_3002_02_create_custom.png`);

    // 3. Expand Advanced Settings
    await cdp.eval(`(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const advBtn = btns.find(b => b.textContent.includes('Advanced Settings') || b.textContent.includes('Advanced'));
        if (advBtn) advBtn.click();
    })()`);
    await sleep(1000);
    await cdp.eval(`(() => {
        document.querySelectorAll('.fixed.inset-0').forEach(el => el.remove());
    })()`);
    await cdp.screenshot(`${ARTIFACTS_DIR}/ace_3002_03_create_advanced.png`);

    // 4. Navigate to Library
    await cdp.send('Page.navigate', { url: 'http://localhost:3010/library' });
    await sleep(2000);
    await cdp.eval(`(() => {
        document.querySelectorAll('.fixed.inset-0').forEach(el => el.remove());
        document.documentElement.classList.add('dark');
    })()`);
    await cdp.screenshot(`${ARTIFACTS_DIR}/ace_3002_04_library.png`);

    // 5. Navigate to Search
    await cdp.send('Page.navigate', { url: 'http://localhost:3010/search' });
    await sleep(2000);
    await cdp.eval(`(() => {
        document.querySelectorAll('.fixed.inset-0').forEach(el => el.remove());
        document.documentElement.classList.add('dark');
    })()`);
    await cdp.screenshot(`${ARTIFACTS_DIR}/ace_3002_05_search.png`);

    // 6. Navigate to Tools
    await cdp.send('Page.navigate', { url: 'http://localhost:3010/tools' });
    await sleep(2000);
    await cdp.eval(`(() => {
        document.querySelectorAll('.fixed.inset-0').forEach(el => el.remove());
        document.documentElement.classList.add('dark');
    })()`);
    await cdp.screenshot(`${ARTIFACTS_DIR}/ace_3002_06_tools.png`);

    // 7. Navigate to Training
    await cdp.send('Page.navigate', { url: 'http://localhost:3010/training' });
    await sleep(2000);
    await cdp.eval(`(() => {
        document.querySelectorAll('.fixed.inset-0').forEach(el => el.remove());
        document.documentElement.classList.add('dark');
    })()`);
    await cdp.screenshot(`${ARTIFACTS_DIR}/ace_3002_07_training.png`);

    // 8. Navigate to News
    await cdp.send('Page.navigate', { url: 'http://localhost:3010/news' });
    await sleep(2000);
    await cdp.eval(`(() => {
        document.querySelectorAll('.fixed.inset-0').forEach(el => el.remove());
        document.documentElement.classList.add('dark');
    })()`);
    await cdp.screenshot(`${ARTIFACTS_DIR}/ace_3002_08_news.png`);

    cdp.close();
    console.log('[Done] All screenshots captured successfully.');
}

main().catch(console.error);
