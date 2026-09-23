import puppeteer from "/home/akone/.nvm/versions/node/v24.15.0/lib/node_modules/@agent-tars/cli/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";

process.env.http_proxy = "";
process.env.https_proxy = "";
process.env.HTTP_PROXY = "";
process.env.HTTPS_PROXY = "";
process.env.no_proxy = "*";
process.env.NO_PROXY = "*";

const CHROME_PATH = "/home/akone/Documents/Dev/01_Dev/03_Multimedia/Open-Generative-AI/chrome/linux-153.0.8010.36/chrome-linux64/chrome";
const ARTIFACT_DIR = "/home/akone/.gemini/antigravity-cli/brain/ec4d3b75-9be6-4e34-9495-139f6d9ad437";
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function captureDawUnfolded() {
  console.log("=== Capturing Full Arranger Waveforms & Clip Launcher Matrix ===");

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-proxy-server",
      "--window-size=1680,1050"
    ],
    defaultViewport: { width: 1680, height: 1050 }
  });

  try {
    const page = await browser.newPage();

    console.log("1. Navigating to http://127.0.0.1:58101/studio/music...");
    await page.goto("http://127.0.0.1:58101/studio/music", { waitUntil: "networkidle0", timeout: 35000 });

    // Open DAW tab
    console.log("2. Activating DAW / AudioMass workspace tab...");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const dawBtn = buttons.find((b) => b.textContent.includes("DAW / AudioMass") || b.textContent.trim() === "DAW");
      if (dawBtn) dawBtn.click();
    });

    await page.waitForFunction(() => !!window.__dawTest, { timeout: 15000 });
    console.log("DAW ready.");

    // 1. Full Arranger View with Audio Waveforms & All Groups Unfolded
    console.log("3. Preparing Full Arranger View...");
    await page.evaluate(() => {
      window.__dawTest.setMainView("arrange");
      window.__dawTest.setShowBottomPanel(false); // maximize arranger multitrack
      const tracks = window.__dawTest.getTracks();
      tracks.forEach(t => {
        if (t.isGroup && t.collapsed) {
          window.__dawTest.toggleGroupCollapse(t.id);
        }
      });
    });
    await delay(1200);

    await page.screenshot({ path: `${ARTIFACT_DIR}/daw_16_audio_waveforms_unfolded.png` });
    console.log(`Saved: daw_16_audio_waveforms_unfolded.png`);

    // 2. Full Clip Launcher Matrix View with 18 Scenes and Hierarchical Group Rows
    console.log("4. Preparing Clip Launcher Matrix View...");
    await page.evaluate(() => {
      window.__dawTest.setMainView("clips");
      window.__dawTest.setShowBottomPanel(false);
    });
    await delay(1200);

    await page.screenshot({ path: `${ARTIFACT_DIR}/daw_17_clip_launcher_matrix_groups.png` });
    console.log(`Saved: daw_17_clip_launcher_matrix_groups.png`);

    // 3. Combined Arranger + Device Rack view
    console.log("5. Preparing Combined Arranger + Device Rack View...");
    await page.evaluate(() => {
      window.__dawTest.setMainView("arrange");
      window.__dawTest.setShowBottomPanel(true);
      window.__dawTest.setSelectedTrackId("drums");
      window.__dawTest.setBottomPanelTab("devicerack");
    });
    await delay(1200);

    await page.screenshot({ path: `${ARTIFACT_DIR}/daw_18_drum_machine_with_groups.png` });
    console.log(`Saved: daw_18_drum_machine_with_groups.png`);

    console.log("=== All 3 Artifact Screenshots Captured Successfully! ===");
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

captureDawUnfolded();
