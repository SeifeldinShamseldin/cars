type ApiErrorPayload = {
  code?: string;
  message?: string;
  lockedUntil?: string;
};

export class ApiRequestError extends Error {
  public readonly code?: string;
  public readonly status: number;
  public readonly lockedUntil?: string;

  public constructor({
    message,
    code,
    status,
    lockedUntil,
  }: {
    message: string;
    code?: string;
    status: number;
    lockedUntil?: string;
  }) {
    super(message);
    this.name = "ApiRequestError";
    this.code = code;
    this.status = status;
    this.lockedUntil = lockedUntil;
  }
}

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL ?? "http://localhost:3001";
export const API_BASE_URL = SOCKET_URL.replace(/\/+$/, "");

const isPrivateHost = (hostname: string): boolean =>
  hostname === "localhost" ||
  hostname === "127.0.0.1" ||
  hostname.startsWith("10.") ||
  hostname.startsWith("192.168.") ||
  /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname);

const assertSensitiveRequestIsSecure = (): void => {
  const parsedUrl = new URL(API_BASE_URL);
  if (parsedUrl.protocol === "https:" || isPrivateHost(parsedUrl.hostname)) {
    return;
  }

  throw new Error("Seller access requires HTTPS outside local development.");
};

const buildHeaders = (headers?: HeadersInit): HeadersInit => ({
  Accept: "application/json",
  ...(headers ?? {}),
});

const readErrorPayload = async (response: Response): Promise<ApiErrorPayload> => {
  try {
    return (await response.json()) as ApiErrorPayload;
  } catch {
    return {};
  }
};

const requestJson = async <T>(
  path: string,
  init?: RequestInit,
  options?: { requireSecure?: boolean },
): Promise<T> => {
  if (options?.requireSecure) {
    assertSensitiveRequestIsSecure();
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: buildHeaders(init?.headers),
  });

  if (!response.ok) {
    const errorPayload = await readErrorPayload(response);
    throw new ApiRequestError({
      message: errorPayload.message ?? `Failed request ${path} (${response.status})`,
      code: errorPayload.code,
      status: response.status,
      lockedUntil: errorPayload.lockedUntil,
    });
  }

  return (await response.json()) as T;
};

export const fetchJson = async <T>(
  path: string,
  init?: RequestInit,
  options?: { requireSecure?: boolean },
): Promise<T> => requestJson<T>(path, init, options);

export const postJson = async <T>(
  path: string,
  body: unknown,
  init?: RequestInit,
  options?: { requireSecure?: boolean },
): Promise<T> =>
  requestJson<T>(
    path,
    {
      method: "POST",
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      body: JSON.stringify(body),
    },
    options,
  );

export const postMultipart = async <T>(
  path: string,
  body: FormData,
  init?: RequestInit,
  options?: { requireSecure?: boolean },
): Promise<T> =>
  requestJson<T>(
    path,
    {
      method: "POST",
      ...init,
      headers: {
        ...(init?.headers ?? {}),
      },
      body,
    },
    options,
  );

export const patchMultipart = async <T>(
  path: string,
  body: FormData,
  init?: RequestInit,
  options?: { requireSecure?: boolean },
): Promise<T> =>
  requestJson<T>(
    path,
    {
      method: "PATCH",
      ...init,
      headers: {
        ...(init?.headers ?? {}),
      },
      body,
    },
    options,
  );
