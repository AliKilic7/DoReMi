import { BASE, launchPage, loginDemo, SHOTS } from "../helpers.mjs";

const { browser, page } = await launchPage();

await loginDemo(page);

// 1. personalized home (demo user has seeded play history)
await page.getByText("Recently played").waitFor({ timeout: 15000 });
await page.getByText("Continue listening").waitFor();
console.log("personal home shelves OK");
await page.waitForTimeout(800);
await page.screenshot({ path: `${SHOTS}50-personal-home.png` });

// 2. follow an artist
await page.goto(BASE + "/artist/the-marlowe-quartet", { waitUntil: "networkidle" });
const followBtn = page.getByRole("button", { name: "Follow", exact: true });
const unfollowBtn = page.getByRole("button", { name: /Following/ });
if (await unfollowBtn.count()) {
  await unfollowBtn.click();
  await followBtn.waitFor({ timeout: 5000 });
}
await followBtn.click();
await unfollowBtn.waitFor({ timeout: 5000 });
console.log("follow artist OK");

// home now shows "Your artists"
await page.goto(BASE + "/home", { waitUntil: "networkidle" });
await page.getByText("Your artists").waitFor({ timeout: 10000 });
console.log("followed artists shelf OK");

// 3. profile: edit bio + display name
await page.goto(BASE + "/profile", { waitUntil: "networkidle" });
await page.getByRole("heading", { name: "Your account" }).waitFor();
await page.fill("#bio", "Vinyl over everything.");
await page.getByRole("button", { name: "Save changes" }).click();
await page.getByText("Profile updated").waitFor({ timeout: 10000 });
console.log("profile update OK");

// 4. avatar upload
const png = Buffer.from("89504e470d0a1a0a0000000d49484452000000040000000408020000002693094900000012494441547801636064f8ffbf0c23ec33430c000fb703fd0b0e40cc0000000049454e44ae426082", "hex");
await page.locator('input[type="file"]').setInputFiles({ name: "a.png", mimeType: "image/png", buffer: png });
await page.getByText("Avatar updated").waitFor({ timeout: 10000 });
console.log("avatar upload OK");
await page.waitForTimeout(600);
await page.screenshot({ path: `${SHOTS}51-profile.png` });

// 5. settings: toggles + quality persist across reload
await page.goto(BASE + "/settings", { waitUntil: "networkidle" });
await page.getByRole("heading", { name: "Settings" }).waitFor();
await page.getByRole("radio", { name: /Lossless/ }).click();
await page.getByRole("radio", { name: "Türkçe" }).click();
const productToggle = page.getByRole("switch").nth(2);
const before = await productToggle.getAttribute("data-state");
await productToggle.click();
await page.waitForTimeout(800);
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(1000);
const lossless = await page.getByRole("radio", { name: /Lossless/ }).getAttribute("aria-checked");
const turkish = await page.getByRole("radio", { name: "Türkçe" }).getAttribute("aria-checked");
const after = await page.getByRole("switch").nth(2).getAttribute("data-state");
if (lossless !== "true" || turkish !== "true") throw new Error("settings did not persist");
if (after === before) throw new Error("toggle did not persist");
console.log("settings persist across reload OK");
await page.waitForTimeout(500);
await page.screenshot({ path: `${SHOTS}52-settings.png` });

// 6. password change flow (fresh user to keep demo intact)
await page.goto(BASE + "/register", { waitUntil: "networkidle" });
const email = `pw${Date.now()}@doremi.dev`;
await page.fill("#displayName", "Pass Tester");
await page.fill("#email", email);
await page.fill("#password", "firstpass1");
await page.getByRole("button", { name: "Create account" }).click();
await page.waitForURL("**/home", { timeout: 15000 });
await page.goto(BASE + "/profile", { waitUntil: "networkidle" });
await page.fill("#currentPassword", "firstpass1");
await page.fill("#newPassword", "secondpass2");
await page.getByRole("button", { name: "Change password" }).click();
await page.getByText(/Password changed/).waitFor({ timeout: 10000 });
console.log("password change OK");

await browser.close();
console.log("ALL FEATURE-7 E2E CHECKS PASSED");
