const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export type ApiError = {
  error: { code: string; message: string; details?: Record<string, unknown> };
};

export type ApiSuccess<T> = { data: T; meta?: Record<string, unknown> };

export class ApiRequestError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit & { accessToken?: string | null },
): Promise<T> {
  const { accessToken, ...rest } = init ?? {};
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(rest.headers as Record<string, string> | undefined),
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const res = await fetch(`${API_BASE}/api/v1${path}`, {
    ...rest,
    credentials: 'include',
    headers,
  });

  const json = (await res.json().catch(() => ({}))) as ApiSuccess<T> | ApiError;

  if (!res.ok) {
    const err = json as ApiError;
    throw new ApiRequestError(
      err.error?.code ?? 'UNKNOWN',
      err.error?.message ?? 'Đã xảy ra lỗi. Thử lại sau.',
      res.status,
      err.error?.details,
    );
  }

  return json as T;
}
