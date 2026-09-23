import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'url';
import path from 'path';

const artifactsDir = '/home/akone/.gemini/antigravity-cli/brain/ec4d3b75-9be6-4e34-9495-139f6d9ad437';

async function run() {
  console.log('Connecting to browser on 9222...');
  const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Navigating to http://127.0.0.1:3010/ ...');
  await page.goto('http://127.0.0.1:3010/', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  // 1. Capture Create tab (default view)
  await page.screenshot({ path: path.join(artifactsDir, 'original_3002_create_simple.png') });
  console.log('Saved original_3002_create_simple.png');

  // Switch to Custom mode
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text?.trim() === 'Custom') {
      await b.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(artifactsDir, 'original_3002_create_custom.png') });
  console.log('Saved original_3002_create_custom.png');

  // Click Library
  await page.evaluate(() => {
    const navs = Array.from(document.querySelectorAll('button, a, div'));
    const libBtn = navs.find(el => el.textContent?.trim() === 'Library');
    if (libBtn) libBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(artifactsDir, 'original_3002_library.png') });
  console.log('Saved original_3002_library.png');

  // Click Search
  await page.evaluate(() => {
    const navs = Array.from(document.querySelectorAll('button, a, div'));
    const searchBtn = navs.find(el => el.textContent?.trim() === 'Search');
    if (searchBtn) searchBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(artifactsDir, 'original_3002_search.png') });
  console.log('Saved original_3002_search.png');

  // Click Tools
  await page.evaluate(() => {
    const navs = Array.from(document.querySelectorAll('button, a, div'));
    const toolsBtn = navs.find(el => el.textContent?.trim() === 'Tools');
    if (toolsBtn) toolsBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(artifactsDir, 'original_3002_tools.png') });
  console.log('Saved original_3002_tools.png');

  // Click Training
  await page.evaluate(() => {
    const navs = Array.from(document.querySelectorAll('button, a, div'));
    const trainBtn = navs.find(el => el.textContent?.trim() === 'Training');
    if (trainBtn) trainBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(artifactsDir, 'original_3002_training.png') });
  console.log('Saved original_3002_training.png');

  await page.close();
  console.log('Done!');
}

run().catch(console.error);
