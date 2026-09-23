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
    const targets = await getJson('http://127.0.0.1:9222/json');
    let pageTarget = targets.find(t => t.type === 'page');
    if (!pageTarget) process.exit(1);

    const cdp = new CDP(pageTarget.webSocketDebuggerUrl);
    await cdp.init();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('DOM.enable');

    await cdp.send('Page.navigate', { url: 'http://localhost:3010/' });
    await sleep(2000);

    // Remove modals & enable dark mode
    await cdp.eval(`(() => {
        document.querySelectorAll('.fixed.inset-0').forEach(el => el.remove());
        document.documentElement.classList.add('dark');
    })()`);
    await sleep(500);

    // Click Tools button in sidebar
    await cdp.eval(`(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const toolsBtn = btns.find(b => b.textContent.trim() === 'Tools');
        if (toolsBtn) toolsBtn.click();
    })()`);
    await sleep(1000);
    await cdp.screenshot(`${ARTIFACTS_DIR}/ace_3002_06_tools_actual.png`);

    // Click Training button in sidebar
    await cdp.eval(`(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const trnBtn = btns.find(b => b.textContent.trim() === 'Training');
        if (trnBtn) trnBtn.click();
    })()`);
    await sleep(1000);
    await cdp.screenshot(`${ARTIFACTS_DIR}/ace_3002_07_training_actual.png`);

    // Click News button in sidebar
    await cdp.eval(`(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const newsBtn = btns.find(b => b.textContent.trim() === 'News');
        if (newsBtn) newsBtn.click();
    })()`);
    await sleep(1000);
    await cdp.screenshot(`${ARTIFACTS_DIR}/ace_3002_08_news_actual.png`);

    cdp.close();
    console.log('[Done] Click-navigation screenshots captured.');
}

main().catch(console.error);
