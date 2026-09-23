import puppeteer from '/home/akone/.nvm/versions/node/v24.15.0/lib/node_modules/@agent-tars/cli/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
import path from 'path';

process.env.no_proxy = '*';
process.env.NO_PROXY = '*';

const ARTIFACT_DIR = '/home/akone/.gemini/antigravity-cli/brain/ec4d3b75-9be6-4e34-9495-139f6d9ad437';
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function run() {
    const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
    const pages = await browser.pages();
    const page = pages[0] || (await browser.newPage());

    await page.setViewport({ width: 1680, height: 1050 });
    await page.goto('http://localhost:58101/studio/music', { waitUntil: 'networkidle2', timeout: 35000 });
    await sleep(2000);

    // Click Advanced Settings button
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const advBtn = btns.find(b => b.textContent.includes('Advanced Settings'));
        if (advBtn) {
            advBtn.scrollIntoView({ behavior: 'instant', block: 'center' });
            advBtn.click();
        }
    });
    await sleep(1000);

    // Scroll to show Negative Prompt and Audio Format
    await page.evaluate(() => {
        const scrollable = document.querySelector('.overflow-y-auto');
        if (scrollable) scrollable.scrollTop = 550;
    });
    await sleep(800);

    const shot = path.join(ARTIFACT_DIR, 'verification_negative_prompt_and_formats.png');
    await page.screenshot({ path: shot });
    console.log(`✓ Screenshot saved: verification_negative_prompt_and_formats.png`);

    await browser.disconnect();
}

run().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
