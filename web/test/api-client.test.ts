import { afterEach, describe, expect, it, vi } from "vitest";
import { api, ApiError } from "@/lib/api";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => vi.restoreAllMocks());

describe("api client", () => {
  it("returns parsed JSON on success", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(200, { ok: true })));
    await expect(api("/api/thing")).resolves.toEqual({ ok: true });
  });

  it("throws a typed ApiError with the server's code and message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(404, { error: { code: "not_found", message: "Missing" } }),
      ),
    );
    const error = await api("/api/none").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(404);
    expect((error as ApiError).code).toBe("not_found");
  });

  it("transparently refreshes once on 401 and retries the request", async () => {
    const fetchMock = vi
      .fn()
      // original request → 401
      .mockResolvedValueOnce(jsonResponse(401, { error: { code: "token_expired", message: "x" } }))
      // refresh → ok
      .mockResolvedValueOnce(jsonResponse(200, { user: {} }))
      // retried request → ok
      .mockResolvedValueOnce(jsonResponse(200, { data: 42 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(api("/api/private")).resolves.toEqual({ data: 42 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1]![0]).toBe("/api/auth/refresh");
  });

  it("does not attempt refresh when skipRefresh is set", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(401, { error: { code: "unauthorized", message: "no" } }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(api("/api/auth/me", { skipRefresh: true })).rejects.toBeInstanceOf(ApiError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("surfaces the original error when the refresh itself fails", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, { error: { code: "token_expired", message: "x" } }))
      .mockResolvedValueOnce(jsonResponse(401, { error: { code: "refresh_expired", message: "y" } }));
    vi.stubGlobal("fetch", fetchMock);

    const error = await api("/api/private2").catch((e: unknown) => e);
    expect((error as ApiError).status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(2); // no retry after failed refresh
  });
});
