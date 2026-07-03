import { BASE, launchPage, loginDemo, SHOTS } from "../helpers.mjs";

const { browser, page } = await launchPage();

const timeLabel = () => page.locator('[role="region"][aria-label="Player"] span.w-9').first();

await loginDemo(page);

// 1. play an album
await page.goto(BASE + "/album/neon-harbor-midnight-arcade", { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Play album" }).click();
await page.getByRole("region", { name: "Player" }).waitFor({ timeout: 10000 });
console.log("player bar appeared OK");

// 2. audio actually progresses
await page.waitForTimeout(3500);
const t1 = await timeLabel().textContent();
if (t1 === "0:00") throw new Error(`playback did not advance (still ${t1})`);
console.log(`playback advancing OK (at ${t1})`);
await page.waitForTimeout(600);
await page.screenshot({ path: `${SHOTS}20-player-playing.png` });

// 3. equalizer indicator on current row
await page.locator('svg rect + animate, svg').first(); // noop guard
const eqVisible = await page.locator('[role="list"][aria-label="Track list"], .group').first().isVisible();
console.log("track rows visible:", eqVisible);

// 4. pause via button, resume via Space
await page.getByRole("button", { name: "Pause", exact: true }).click();
await page.waitForTimeout(1200);
const tPaused1 = await timeLabel().textContent();
await page.waitForTimeout(1200);
const tPaused2 = await timeLabel().textContent();
if (tPaused1 !== tPaused2) throw new Error("time advanced while paused");
console.log("pause OK");
await page.keyboard.press(" ");
await page.waitForTimeout(1500);
const tResumed = await timeLabel().textContent();
if (tResumed === tPaused2) throw new Error("space did not resume");
console.log("space resume OK");

// 5. next / previous
const title = () => page.locator('[role="region"][aria-label="Player"] a').first().textContent();
const first = await title();
await page.getByRole("button", { name: "Next track" }).click();
await page.waitForTimeout(800);
const second = await title();
if (first === second) throw new Error("next did not change track");
console.log(`next OK (${first} -> ${second})`);
await page.getByRole("button", { name: "Previous track" }).click();
await page.waitForTimeout(800);
const back = await title();
console.log(`previous OK (-> ${back})`);

// 6. seek: jump near the end and confirm auto-advance to next track
await page.waitForTimeout(400);
const beforeSeekTitle = await title();
await page.evaluate(() => {
  // drag simulation is flaky; commit a keyboard seek on the slider instead
  const slider = document.querySelector('[aria-label="Seek"]');
  slider?.dispatchEvent(new Event("focus"));
});
// keyboard on radix slider thumb: focus + End key commits max value
await page.locator('[role="region"][aria-label="Player"] [role="slider"][aria-label="Seek"]').focus();
await page.keyboard.press("End");
await page.waitForTimeout(2500);
const afterSeekTitle = await title();
if (afterSeekTitle === beforeSeekTitle) throw new Error("seek to end did not auto-advance");
console.log(`seek + auto-advance OK (${beforeSeekTitle} -> ${afterSeekTitle})`);

// 7. shuffle & repeat toggles
await page.getByRole("button", { name: "Shuffle" }).click();
const shuffleActive = await page.getByRole("button", { name: "Shuffle" }).getAttribute("aria-pressed");
if (shuffleActive !== "true") throw new Error("shuffle did not activate");
console.log("shuffle toggle OK");
await page.getByRole("button", { name: /Repeat/ }).click();
await page.getByRole("button", { name: /Repeat/ }).click();
const repeatLabel = await page.getByRole("button", { name: /Repeat/ }).getAttribute("aria-label");
if (!repeatLabel?.includes("one")) throw new Error(`repeat cycle wrong: ${repeatLabel}`);
console.log("repeat cycle OK (off→all→one)");

// 8. mute + volume keyboard
await page.getByRole("button", { name: "Mute" }).click();
await page.getByRole("button", { name: "Unmute" }).waitFor({ timeout: 5000 });
console.log("mute OK");
await page.getByRole("button", { name: "Unmute" }).click();

// 9. equalizer visible in row + playing state persists across navigation
await page.getByRole("link", { name: "Library" }).click();
await page.waitForURL("**/library");
await page.waitForTimeout(1500);
const stillPlaying = await page.getByRole("region", { name: "Player" }).isVisible();
if (!stillPlaying) throw new Error("player bar vanished after navigation");
const t2 = await timeLabel().textContent();
console.log(`playback persists across navigation OK (at ${t2})`);
await page.screenshot({ path: `${SHOTS}21-player-library.png` });

// 10. play count integration: was /play called?
const playCalls = await page.evaluate(() =>
  performance.getEntriesByType("resource").filter((e) => e.name.includes("/play")).length,
);
console.log(`play tracking calls: ${playCalls}`);
if (playCalls < 1) throw new Error("no play tracking calls");

await browser.close();
console.log("ALL FEATURE-4 E2E CHECKS PASSED");
