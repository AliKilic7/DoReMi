import { BASE, launchPage, loginDemo, SHOTS } from "../helpers.mjs";

const email = `e2e${Date.now()}@doremi.dev`;
const { browser, page } = await launchPage();

async function shot(name) {
  await page.waitForTimeout(700); // let animations settle
  await page.screenshot({ path: `${SHOTS}${name}.png` });
  console.log(`shot: ${name}`);
}

// 1. Landing
await page.goto(BASE, { waitUntil: "networkidle" });
await shot("01-landing");

// 2. Register
await page.getByRole("link", { name: "Get started" }).click();
await page.waitForURL("**/register");
await shot("02-register-empty");
await page.fill("#displayName", "Ada Lovelace");
await page.fill("#email", email);
await page.fill("#password", "SuperSecret1");
await shot("03-register-filled");
await page.getByRole("button", { name: "Create account" }).click();
await page.waitForURL("**/home", { timeout: 15000 });
await page.getByRole("heading", { name: /, Ada$/ }).waitFor({ timeout: 10000 });
await shot("04-home-after-register");
console.log("register → /home OK");

// 3. Logout via the avatar menu
await page.locator("header button").last().click();
await page.getByRole("menuitem", { name: "Sign out" }).click();
await page.waitForURL(BASE + "/", { timeout: 15000 });
console.log("logout OK");

// 4. Login with wrong password → inline error
await page.goto(BASE + "/login", { waitUntil: "networkidle" });
await page.fill("#email", email);
await page.fill("#password", "wrong-password");
await page.getByRole("button", { name: "Log in" }).click();
await page.getByRole("alert").waitFor({ timeout: 10000 });
await shot("05-login-error");
console.log("wrong password error OK");

// 5. Login correctly
await page.fill("#password", "SuperSecret1");
await page.getByRole("button", { name: "Log in" }).click();
await page.waitForURL("**/home", { timeout: 15000 });
console.log("login → /home OK");

// 6. Session persists across reload
await page.reload({ waitUntil: "networkidle" });
await page.getByRole("heading", { name: /, Ada$/ }).waitFor({ timeout: 10000 });
console.log("session persists after reload OK");

// 7. Guest hitting /home is redirected to /login
const guest = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await guest.goto(BASE + "/home");
await guest.waitForURL("**/login", { timeout: 10000 });
console.log("guest redirect OK");

await browser.close();
console.log("ALL E2E CHECKS PASSED");
