import { BASE, launchPage, loginDemo, SHOTS } from "../helpers.mjs";

const { browser, page } = await launchPage();

async function shot(name) {
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${SHOTS}${name}.png` });
  console.log(`shot: ${name}`);
}

await loginDemo(page);

// 1. Home with shelves
await page.getByText("Trending now").waitFor({ timeout: 15000 });
await page.getByText("Popular artists").waitFor();
await shot("10-home");
console.log("home shelves OK");

// 2. Artist page via popular artists card
await page.locator(String.raw`a[href="/artist/luna-reyes"]`).first().click();
await page.waitForURL("**/artist/**");
await page.getByRole("heading", { name: "Luna Reyes", level: 1 }).waitFor({ timeout: 10000 });
await page.getByText("Popular", { exact: true }).waitFor();
await page.getByText("Discography").waitFor();
await shot("11-artist");
console.log("artist page OK");

// 3. Album page from discography
await page.getByRole("link", { name: /Saudade/ }).first().click();
await page.waitForURL("**/album/**");
await page.getByRole("heading", { level: 1, name: "Saudade" }).waitFor({ timeout: 10000 });
await shot("12-album");
console.log("album page OK");

// 4. Library with infinite scroll
await page.getByRole("link", { name: "Library" }).click();
await page.waitForURL("**/library");
await page.getByRole("tab", { name: "Songs" }).waitFor();
await shot("13-library-songs");
const rowsBefore = await page.locator('[role="list"][aria-label="Songs"] > div').count();
await page.locator("main").evaluate((el) => el.scrollTo(0, el.scrollHeight));
await page.waitForTimeout(1500);
await page.locator("main").evaluate((el) => el.scrollTo(0, el.scrollHeight));
await page.waitForTimeout(1500);
const rowsAfter = await page.locator('[role="list"][aria-label="Songs"] > div').count();
console.log(`infinite scroll: ${rowsBefore} -> ${rowsAfter} rows`);
if (rowsAfter <= rowsBefore) throw new Error("infinite scroll did not load more rows");

// 5. Genre filter
await page.getByRole("button", { name: "Jazz" }).click();
await page.waitForTimeout(1200);
await shot("14-library-jazz");
const firstArtist = await page
  .locator('[role="list"][aria-label="Songs"] a[href^="/artist/"]')
  .first()
  .textContent();
console.log("jazz filter first artist:", firstArtist);

// 6. Albums tab
await page.getByRole("tab", { name: "Albums" }).click();
await page.getByRole("link", { name: /Album|·/ }).first().waitFor({ timeout: 10000 });
await shot("15-library-albums");

// 7. Search: history + instant results
await page.getByRole("link", { name: "Search" }).click();
await page.waitForURL("**/search");
await page.getByPlaceholder("What do you want to listen to?").fill("neon");
await page.getByText("Top result").waitFor({ timeout: 10000 });
await shot("16-search-results");
console.log("instant search OK");

// wait so the query is recorded, then clear input and check history chip
await page.waitForTimeout(2200);
await page.getByLabel("Clear search").click();
await page.getByText("Recent searches").waitFor({ timeout: 10000 });
await page.getByRole("button", { name: /neon/ }).first().waitFor();
await shot("17-search-history");
console.log("search history OK");

// 8. 404 page
await page.goto(BASE + "/album/does-not-exist", { waitUntil: "networkidle" });
await page.getByText("404").waitFor({ timeout: 10000 });
await shot("18-404");
console.log("404 page OK");

// 9. keyboard shortcut "/" focuses search
await page.goto(BASE + "/home", { waitUntil: "networkidle" });
await page.keyboard.press("/");
await page.waitForURL("**/search", { timeout: 10000 });
console.log("keyboard shortcut OK");

// 10. mobile layout
await page.setViewportSize({ width: 390, height: 844 });
const mobile = page;
await mobile.goto(BASE + "/home", { waitUntil: "networkidle" });
await mobile.getByLabel("Open menu").click();
await mobile.getByRole("navigation", { name: "Primary" }).waitFor({ timeout: 5000 });
await mobile.waitForTimeout(600);
await mobile.screenshot({ path: `${SHOTS}19-mobile-drawer.png` });
console.log("mobile drawer OK");

await browser.close();
console.log("ALL FEATURE-3 E2E CHECKS PASSED");
