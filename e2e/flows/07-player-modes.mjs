import { BASE, launchPage, loginDemo, SHOTS } from "../helpers.mjs";

const { browser, page } = await launchPage();

await loginDemo(page);

// 1. "Made for you" recommendations shelf
await page.getByText("Made for you").waitFor({ timeout: 15000 });
console.log("recommendations shelf OK");

// 2. start playback
await page.goto(BASE + "/album/luna-reyes-saudade", { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Play album" }).click();
await page.getByRole("region", { name: "Player", exact: true }).waitFor({ timeout: 10000 });

// 3. full screen via button
await page.getByRole("button", { name: "Full screen player", exact: true }).click();
await page.getByRole("dialog", { name: /full screen/i }).waitFor({ timeout: 5000 });
await page.waitForTimeout(1200);
await page.screenshot({ path: `${SHOTS}60-fullscreen.png` });
console.log("full screen player OK");

// controls work inside full screen
await page.getByRole("dialog").getByRole("button", { name: "Next track" }).click();
await page.waitForTimeout(600);
const fsTitle = await page.getByRole("dialog").locator("h2").textContent();
console.log(`full screen next OK (now: ${fsTitle})`);

// 4. Esc closes
await page.keyboard.press("Escape");
await page.getByRole("region", { name: "Player", exact: true }).waitFor({ timeout: 5000 });
console.log("esc closes full screen OK");

// 5. F reopens, F closes
await page.keyboard.press("f");
await page.getByRole("dialog", { name: /full screen/i }).waitFor({ timeout: 5000 });
await page.keyboard.press("f");
await page.getByRole("region", { name: "Player", exact: true }).waitFor({ timeout: 5000 });
console.log("F shortcut toggles full screen OK");

// 6. mini player
await page.getByRole("button", { name: "Minimize player" }).click();
await page.getByRole("region", { name: "Mini player" }).waitFor({ timeout: 5000 });
await page.waitForTimeout(800);
await page.screenshot({ path: `${SHOTS}61-mini-player.png` });
// playback continues in mini: toggle pause/play works
await page.getByRole("region", { name: "Mini player" }).getByRole("button", { name: "Pause" }).click();
await page.getByRole("region", { name: "Mini player" }).getByRole("button", { name: "Play", exact: true }).waitFor({ timeout: 5000 });
console.log("mini player OK");

// expand back to bar
await page.getByRole("button", { name: "Expand player bar" }).click();
await page.getByRole("region", { name: "Player", exact: true }).waitFor({ timeout: 5000 });
console.log("mini → bar restore OK");

// 7. quick regression: search, library, liked, playlist page all load
for (const [path, marker] of [
  ["/search", "Recent searches|Search DoReMi"],
  ["/library", "Library"],
  ["/liked", "Liked Songs"],
  ["/profile", "Your account"],
  ["/settings", "Settings"],
]) {
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  await page.getByText(new RegExp(marker)).first().waitFor({ timeout: 10000 });
}
console.log("regression: all pages load OK");

await browser.close();
console.log("ALL FEATURE-8 E2E CHECKS PASSED");
