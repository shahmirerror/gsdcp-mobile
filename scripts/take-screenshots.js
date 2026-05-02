const { chromium } = require("playwright-core");
const path = require("path");
const fs = require("fs");

const CHROME_PATH =
  "/nix/store/d7y5039fgn5432kgkn0cv09hda4a7nxz-playwright-chromium-cjk-1.55.0-1187/chrome-linux/chrome";
const APP_URL = `https://${process.env.REPLIT_DEV_DOMAIN || "3dc63906-57df-4612-abb2-bfeff133f9df-00-2w3cs9uijb27x.janeway.replit.dev"}`;

const OUT_DIR = path.join(__dirname, "../screenshots");

const VIEWPORTS = {
  phone:    { width: 390,  height: 844  },
  tablet7:  { width: 800,  height: 1280 },
  tablet10: { width: 1200, height: 1920 },
};

async function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function snap(page, label, folder) {
  const dir = path.join(OUT_DIR, folder);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${label}.jpg`);
  await page.screenshot({ path: file, type: "jpeg", quality: 92 });
  console.log(`  ✓ ${folder}/${label}.jpg`);
}

async function clickTab(page, text) {
  try {
    // try by exact text
    const el = page.getByText(text, { exact: true }).first();
    await el.click({ timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

async function takeForViewport(vpName, vp) {
  console.log(`\n── ${vpName} (${vp.width}×${vp.height}) ──`);

  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  const ctx = await browser.newContext({
    viewport: vp,
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();

  try {
    // ── 1. Splash ──────────────────────────────────────────
    await page.goto(APP_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
    await wait(2500);
    await snap(page, "01-splash", vpName);

    // ── 2. Home / Dashboard ────────────────────────────────
    await wait(5000); // let splash animation finish
    await snap(page, "02-home", vpName);

    // ── 3. Dogs tab ────────────────────────────────────────
    await clickTab(page, "Dogs");
    await wait(3000);
    await snap(page, "03-dogs", vpName);

    // ── 4. Breeders tab ────────────────────────────────────
    await clickTab(page, "Breeders");
    await wait(3000);
    await snap(page, "04-breeders", vpName);

    // ── 5. Shows tab ───────────────────────────────────────
    await clickTab(page, "Shows");
    await wait(3000);
    await snap(page, "05-shows", vpName);

    // ── 6. Profile tab (may show login) ────────────────────
    await clickTab(page, "Profile");
    await wait(3000);
    await snap(page, "06-profile", vpName);

    // ── 7. Back to Dogs, scroll down a bit for dog cards ──
    await clickTab(page, "Dogs");
    await wait(2000);
    // scroll down to show more content
    await page.evaluate(() => window.scrollBy(0, 200));
    await wait(1500);
    await snap(page, "07-dogs-list", vpName);

  } catch (err) {
    console.error("  Error:", err.message);
  } finally {
    await browser.close();
  }
}

(async () => {
  for (const [name, vp] of Object.entries(VIEWPORTS)) {
    await takeForViewport(name, vp);
  }
  console.log("\nDone. Screenshots in screenshots/phone/, tablet7/, tablet10/");
})();
