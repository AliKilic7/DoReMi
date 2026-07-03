import { BASE, launchPage, loginDemo, SHOTS } from "../helpers.mjs";

const { browser, page } = await launchPage();

await loginDemo(page);

// 1. sidebar shows seeded playlists (pinned first)
const rail = page.locator("aside").first();
await rail.getByText("Late Night Coding").waitFor({ timeout: 10000 });
console.log("sidebar playlist rail OK");

// 2. create a playlist from the sidebar +
await rail.getByRole("button", { name: "Create playlist" }).click();
await page.waitForURL("**/playlist/**", { timeout: 15000 });
await page.getByRole("heading", { name: /My Playlist/ }).waitFor({ timeout: 10000 });
const playlistName = (await page.getByRole("heading", { name: /My Playlist/ }).textContent()).trim();
console.log(`create playlist → detail page OK (${playlistName})`);
const playlistUrl = page.url();

// 3. add songs via library ⋯ menu
await page.getByRole("link", { name: "Library", exact: true }).click();
await page.waitForURL("**/library");
const rows = page.locator('[role="list"][aria-label="Songs"] > div');
await rows.first().waitFor();
for (const i of [0, 1, 2]) {
  const row = rows.nth(i);
  await row.hover();
  await row.getByRole("button", { name: /More options/ }).click();
  // keyboard-open the submenu so it stays anchored, then click the target
  await page.waitForTimeout(300);
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(200);
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(200);
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(300);
  const target = page.getByRole("menuitem", { name: playlistName });
  await target.waitFor({ timeout: 5000 });
  await target.click();
  await page.getByText(/Added .* to/).first().waitFor({ timeout: 5000 });
  await page.waitForTimeout(1000);
}
console.log("added 3 songs via context menu OK");

// 4. playlist page shows them; reorder via drag
await page.goto(playlistUrl, { waitUntil: "networkidle" });
const items = page.locator('[role="list"][aria-label="Playlist songs"] li');
await items.first().waitFor({ timeout: 10000 });
const count = await items.count();
if (count !== 3) throw new Error(`expected 3 songs, got ${count}`);
const t1 = await items.nth(0).locator("p").first().textContent();
const t2 = await items.nth(1).locator("p").first().textContent();
const b1 = await items.nth(0).boundingBox();
const b2 = await items.nth(1).boundingBox();
await page.mouse.move(b1.x + b1.width / 2, b1.y + b1.height / 2);
await page.mouse.down();
await page.mouse.move(b2.x + b2.width / 2, b2.y + b2.height / 2 + 14, { steps: 12 });
await page.waitForTimeout(300);
await page.mouse.up();
await page.waitForTimeout(1000);
const n1 = await items.nth(0).locator("p").first().textContent();
if (n1 !== t2) throw new Error(`reorder failed: expected ${t2} first, got ${n1}`);
// reload → order persisted server-side
await page.reload({ waitUntil: "networkidle" });
await items.first().waitFor({ timeout: 10000 });
const p1 = await items.nth(0).locator("p").first().textContent();
if (p1 !== t2) throw new Error(`reorder not persisted: got ${p1}`);
console.log(`drag reorder persisted OK (${t1} -> ${t2} first)`);

// 5. rename via dialog
await page.getByRole("button", { name: "Rename playlist" }).click();
await page.locator("#playlist-name").fill("Road Trip Mix");
await page.locator("#playlist-description").fill("Windows down.");
await page.getByRole("button", { name: "Save" }).click();
await page.getByRole("heading", { name: "Road Trip Mix" }).waitFor({ timeout: 10000 });
console.log("rename OK");

// 6. favorite + pin
await page.getByRole("button", { name: "Add to favorites" }).click();
await page.getByRole("button", { name: "Remove from favorites" }).waitFor({ timeout: 5000 });
await page.getByRole("button", { name: "Playlist options" }).click();
await page.getByRole("menuitem", { name: "Pin to sidebar" }).click();
await page.getByText("Pinned playlist").waitFor({ timeout: 5000 });
console.log("favorite + pin OK");

// 7. cover upload via hidden input
const png = Buffer.from("89504e470d0a1a0a0000000d49484452000000040000000408020000002693094900000012494441547801636064f8ffbf0c23ec33430c000fb703fd0b0e40cc0000000049454e44ae426082", "hex");
await page.locator('input[type="file"]').setInputFiles({ name: "c.png", mimeType: "image/png", buffer: png });
await page.getByText("Cover updated").waitFor({ timeout: 10000 });
console.log("cover upload OK");
await page.waitForTimeout(700);
await page.screenshot({ path: `${SHOTS}40-playlist-detail.png` });

// 8. remove a song
const removeTitle = await items.nth(0).locator("p").first().textContent();
await items.nth(0).hover();
await page.getByRole("button", { name: `Remove ${removeTitle} from playlist` }).click();
await page.waitForTimeout(1000);
if ((await items.count()) !== 2) throw new Error("remove song failed");
console.log("remove song OK");

// 9. library playlists tab
await page.getByRole("link", { name: "Library", exact: true }).click();
await page.waitForURL("**/library");
await page.getByRole("tab", { name: "Playlists" }).click();
await page.getByText("Road Trip Mix").first().waitFor({ timeout: 10000 });
await page.waitForTimeout(600);
await page.screenshot({ path: `${SHOTS}41-library-playlists.png` });
console.log("library playlists tab OK");

// 10. delete with confirmation
await page.goto(playlistUrl, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Playlist options" }).click();
await page.getByRole("menuitem", { name: "Delete playlist" }).click();
await page.getByRole("button", { name: "Delete", exact: true }).click();
await page.waitForURL("**/library**", { timeout: 10000 });
await page.getByText("Playlist deleted").waitFor({ timeout: 5000 });
console.log("delete with confirm OK");

await browser.close();
console.log("ALL FEATURE-6 E2E CHECKS PASSED");
