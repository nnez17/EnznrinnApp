// Thin fetch wrapper: base URL, headers, JSON, timeouts, error envelope parsing.
// Backend errors arrive as {"error":{"code","message"}} (PRD §28).

import { API_URL } from '@/config/env';

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

const BASE_URL = API_URL.replace(/\/$/, '');
const TIMEOUT_MS = 15000;

async function request<T>(path: string, options: { method?: string; headers?: Record<string, string>; body?: string } = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE_URL}/api/v1${path}`, {
      headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
      ...options,
      signal: controller.signal,
    });
    const text = await res.text();
    const body = text ? JSON.parse(text) : null;
    if (!res.ok) {
      const err = body?.error;
      throw new ApiError(err?.code ?? 'INTERNAL_ERROR', err?.message ?? 'Terjadi kesalahan pada server.', res.status);
    }
    return body as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError('INTERNAL_ERROR', 'Tidak dapat terhubung ke server.', 0);
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
