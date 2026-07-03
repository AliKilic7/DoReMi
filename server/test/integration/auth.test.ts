import { describe, expect, it } from "vitest";
import request from "supertest";
import { makeApp, registeredAgent } from "./helpers.js";

const app = makeApp();

describe("auth API", () => {
  it("register → me → logout → me(401)", async () => {
    const { agent, email } = await registeredAgent(app);

    const me = await agent.get("/api/auth/me");
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe(email);
    expect(me.body.user.passwordHash).toBeUndefined();
    expect(me.body.user.tokenVersion).toBeUndefined();

    await agent.post("/api/auth/logout").expect(200);
    await agent.get("/api/auth/me").expect(401);
  });

  it("rejects duplicate registration with 409", async () => {
    const { email, password } = await registeredAgent(app);
    const res = await request(app)
      .post("/api/auth/register")
      .send({ displayName: "Dup", email, password });
    expect(res.status).toBe(409);
  });

  it("rejects wrong password and unknown email identically", async () => {
    const { email } = await registeredAgent(app);
    const wrongPw = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "not-the-password" });
    const unknown = await request(app)
      .post("/api/auth/login")
      .send({ email: "ghost@test.doremi.dev", password: "whatever1" });
    expect(wrongPw.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrongPw.body.error.message).toBe(unknown.body.error.message);
  });

  it("validates input with field-level errors", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ displayName: "A", email: "nope", password: "123" });
    expect(res.status).toBe(422);
    const paths = res.body.error.issues.map((i: { path: string }) => i.path);
    expect(paths).toEqual(expect.arrayContaining(["displayName", "email", "password"]));
  });

  it("refresh rotates the session; password change revokes other sessions", async () => {
    const { agent, email, password } = await registeredAgent(app);

    // a second, independent session
    const other = request.agent(app);
    await other.post("/api/auth/login").send({ email, password }).expect(200);

    await agent.post("/api/auth/refresh").expect(200);

    // change password from the first session
    await agent
      .put("/api/me/password")
      .send({ currentPassword: password, newPassword: "brand-new-pass1" })
      .expect(200);

    // first session keeps working, second session's refresh is revoked
    await agent.get("/api/auth/me").expect(200);
    await other.post("/api/auth/refresh").expect(401);
  });

  it("auth cookies are httpOnly", async () => {
    const { email, password } = await registeredAgent(app);
    const res = await request(app).post("/api/auth/login").send({ email, password });
    const cookies = res.headers["set-cookie"] as unknown as string[];
    expect(cookies.length).toBeGreaterThanOrEqual(2);
    for (const cookie of cookies) expect(cookie.toLowerCase()).toContain("httponly");
  });
});
