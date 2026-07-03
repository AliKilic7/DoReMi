import { BASE, launchPage, loginDemo, SHOTS } from "../helpers.mjs";

const { browser, page } = await launchPage();

await loginDemo(page);

// 1. play an album, open queue
await page.goto(BASE + "/album/neon-harbor-midnight-arcade", { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Play album" }).click();
await page.getByRole("region", { name: "Player" }).waitFor({ timeout: 10000 });
await page.getByRole("button", { name: "Open queue" }).click();
await page.getByRole("region", { name: "Queue" }).waitFor({ timeout: 5000 });
const upNext = () => page.locator('[role="region"][aria-label="Queue"] ul li');
const countBefore = await upNext().count();
console.log(`queue open OK — upcoming: ${countBefore}`);
if (countBefore < 3) throw new Error("expected several upcoming songs");
await page.waitForTimeout(700);
await page.screenshot({ path: `${SHOTS}30-queue-panel.png` });

// 2. drag & drop: move first upcoming item below the second
const firstTitle = await upNext().nth(0).locator("p").first().textContent();
const secondTitle = await upNext().nth(1).locator("p").first().textContent();
const src = upNext().nth(0);
const dst = upNext().nth(1);
const srcBox = await src.boundingBox();
const dstBox = await dst.boundingBox();
await page.mouse.move(srcBox.x + srcBox.width / 2, srcBox.y + srcBox.height / 2);
await page.mouse.down();
await page.mouse.move(dstBox.x + dstBox.width / 2, dstBox.y + dstBox.height / 2 + 14, { steps: 12 });
await page.waitForTimeout(300);
await page.mouse.up();
await page.waitForTimeout(600);
const newFirst = await upNext().nth(0).locator("p").first().textContent();
const newSecond = await upNext().nth(1).locator("p").first().textContent();
if (newFirst !== secondTitle || newSecond !== firstTitle)
  throw new Error(`drag reorder failed: [${firstTitle},${secondTitle}] -> [${newFirst},${newSecond}]`);
console.log(`drag & drop reorder OK (${firstTitle} <-> ${secondTitle})`);

// 3. remove a song from the queue
const removeTarget = await upNext().nth(0).locator("p").first().textContent();
await upNext().nth(0).hover();
await page.getByRole("button", { name: `Remove ${removeTarget} from queue` }).click();
await page.waitForTimeout(500);
const countAfterRemove = await upNext().count();
if (countAfterRemove !== countBefore - 1) throw new Error("remove from queue failed");
console.log(`remove from queue OK (${countBefore} -> ${countAfterRemove})`);

// 4. add to queue from library dots menu (close panel first — it overlays the rows)
await page.getByRole("button", { name: "Close queue" }).first().click();
await page.waitForTimeout(400);
await page.getByRole("link", { name: "Library" }).click();
await page.waitForURL("**/library");
await page.locator('[role="list"][aria-label="Songs"] > div').first().waitFor();
const rows = page.locator('[role="list"][aria-label="Songs"] > div');
// find a row not already queued: use the 15th row
const row = rows.nth(14);
await row.hover();
await row.getByRole("button", { name: /More options/ }).click();
await page.getByRole("menuitem", { name: "Add to queue" }).click();
await page.waitForTimeout(500);
await page.getByRole("button", { name: "Open queue" }).click();
await page.getByRole("region", { name: "Queue" }).waitFor({ timeout: 5000 });
await page.waitForTimeout(400);
const countAfterAdd = await upNext().count();
if (countAfterAdd !== countAfterRemove + 1) throw new Error(`add to queue failed (${countAfterRemove} -> ${countAfterAdd})`);
console.log(`add to queue OK (${countAfterRemove} -> ${countAfterAdd})`);
await page.getByRole("button", { name: "Close queue" }).first().click();
await page.waitForTimeout(400);

// 5. like the current song from the player bar
const likeBtn = page.locator('[role="region"][aria-label="Player"] [aria-label="Add to Liked Songs"]');
const unlikeBtn = page.locator('[role="region"][aria-label="Player"] [aria-label="Remove from Liked Songs"]');
const wasLiked = (await unlikeBtn.count()) > 0;
if (wasLiked) {
  await unlikeBtn.click();
  await likeBtn.waitFor({ timeout: 5000 });
}
const songTitle = await page.locator('[role="region"][aria-label="Player"] a').first().textContent();
await likeBtn.click();
await unlikeBtn.waitFor({ timeout: 5000 });
console.log(`liked "${songTitle}" from player bar OK`);

// 6. liked songs page shows it first
await page.getByRole("link", { name: "Liked Songs" }).click();
await page.waitForURL("**/liked");
await page.getByRole("heading", { name: "Liked Songs" }).waitFor();
await page.locator('[role="list"][aria-label="Liked songs"] > div').first().waitFor({ timeout: 10000 });
const firstLiked = await page
  .locator('[role="list"][aria-label="Liked songs"] p')
  .first()
  .textContent();
if (firstLiked !== songTitle) throw new Error(`expected "${songTitle}" first in liked, got "${firstLiked}"`);
console.log("liked songs page shows newest like first OK");
await page.waitForTimeout(700);
await page.screenshot({ path: `${SHOTS}31-liked-songs.png` });

// 7. unlike from the row -> disappears
await page.locator('[role="list"][aria-label="Liked songs"] > div').first().hover();
await page
  .locator('[role="list"][aria-label="Liked songs"] > div')
  .first()
  .getByRole("button", { name: "Remove from Liked Songs" })
  .click();
await page.waitForTimeout(1200);
const nowFirst = await page
  .locator('[role="list"][aria-label="Liked songs"] p')
  .first()
  .textContent();
if (nowFirst === songTitle) throw new Error("unlike did not remove the song from the list");
console.log("unlike removes from liked list OK");

// 8. clear queue
await page.getByRole("button", { name: "Open queue" }).click();
await page.getByRole("region", { name: "Queue" }).waitFor({ timeout: 5000 });
await page.getByRole("region", { name: "Queue" }).getByRole("button", { name: "Clear" }).click();
await page.getByText("Nothing queued").waitFor({ timeout: 5000 });
console.log("clear queue OK");

await browser.close();
console.log("ALL FEATURE-5 E2E CHECKS PASSED");
