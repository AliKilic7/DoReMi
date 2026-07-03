import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { chromium } from "playwright-core";

export const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
export const SHOTS = new URL("./.artifacts/", import.meta.url).pathname;

/** Demo account created by `npm run db:seed`. */
export const DEMO = { email: "demo@doremi.dev", password: "demo1234" };

function chromiumPath() {
  if (process.env.PW_CHROMIUM_PATH) return process.env.PW_CHROMIUM_PATH;
  // Playwright-managed browsers (e.g. preinstalled in CI images)
  const roots = ["/opt/pw-browsers", `${process.env.HOME}/.cache/ms-playwright`];
  for (const root of roots) {
    if (!existsSync(root)) continue;
    for (const dir of readdirSync(root)) {
      const candidate = `${root}/${dir}/chrome-linux/chrome`;
      if (dir.startsWith("chromium-") && existsSync(candidate)) return candidate;
    }
  }
  return undefined; // let playwright-core resolve its default
}

export async function launchPage() {
  mkdirSync(SHOTS, { recursive: true });
  const browser = await chromium.launch({
    executablePath: chromiumPath(),
    args: ["--autoplay-policy=no-user-gesture-required"],
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  return { browser, page };
}

export async function loginDemo(page) {
  await page.goto(BASE + "/login", { waitUntil: "networkidle" });
  await page.fill("#email", DEMO.email);
  await page.fill("#password", DEMO.password);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL("**/home", { timeout: 15000 });
}
