import type { ApiErrorPayload } from "@/types";

/** Error thrown for non-2xx API responses, carrying the server's error code. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly issues?: { path: string; message: string }[];

  constructor(status: number, payload: ApiErrorPayload["error"]) {
    super(payload.message);
    this.status = status;
    this.code = payload.code;
    this.issues = payload.issues;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
  /** Skip the automatic refresh-and-retry on 401. Used by auth endpoints themselves. */
  skipRefresh?: boolean;
}

async function rawRequest(path: string, options: RequestOptions): Promise<Response> {
  return fetch(path, {
    method: options.method ?? "GET",
    credentials: "include",
    signal: options.signal,
    headers: options.body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
}

let refreshPromise: Promise<boolean> | null = null;

/** Attempts a token refresh, deduplicating concurrent callers. */
async function tryRefresh(): Promise<boolean> {
  refreshPromise ??= rawRequest("/api/auth/refresh", { method: "POST", skipRefresh: true })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      setTimeout(() => (refreshPromise = null), 0);
    });
  return refreshPromise;
}

/**
 * Typed API client. On a 401 it transparently refreshes the session once and
 * retries, so expired access tokens never surface to feature code.
 */
export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let res = await rawRequest(path, options);

  if (res.status === 401 && !options.skipRefresh && (await tryRefresh())) {
    res = await rawRequest(path, options);
  }

  if (!res.ok) {
    let payload: ApiErrorPayload["error"] = { code: "unknown", message: "Something went wrong" };
    try {
      payload = ((await res.json()) as ApiErrorPayload).error ?? payload;
    } catch {
      // non-JSON error body — keep the fallback
    }
    throw new ApiError(res.status, payload);
  }

  return (await res.json()) as T;
}
