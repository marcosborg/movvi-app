import { Capacitor } from '@capacitor/core';

const PRODUCTION_SITE_URL = 'https://movvi.com.pt';
const LOCAL_API_URL = 'http://127.0.0.1:8000';
const LOCAL_ANDROID_EMULATOR_API_URL = 'http://10.0.2.2:8000';

const runtimeHost = typeof window !== 'undefined' ? window.location.hostname : '';
const isLocalRuntime = runtimeHost === 'localhost' || runtimeHost === '127.0.0.1';
const runtimePlatform = Capacitor.getPlatform();
const isNativePlatform = runtimePlatform === 'android' || runtimePlatform === 'ios';

function resolveNativeApiBaseUrl() {
  if (runtimePlatform === 'android') {
    return (
      import.meta.env.VITE_ANDROID_API_BASE_URL?.replace(/\/$/, '') ||
      PRODUCTION_SITE_URL
    );
  }

  if (runtimePlatform === 'ios') {
    return import.meta.env.VITE_IOS_API_BASE_URL?.replace(/\/$/, '') || PRODUCTION_SITE_URL;
  }

  return PRODUCTION_SITE_URL;
}

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ||
  (isNativePlatform
    ? resolveNativeApiBaseUrl()
    : (isLocalRuntime ? LOCAL_API_URL : PRODUCTION_SITE_URL));

export const PUBLIC_SITE_URL =
  import.meta.env.VITE_PUBLIC_SITE_URL?.replace(/\/$/, '') || PRODUCTION_SITE_URL;

const API_ACTIVITY_EVENT = 'movvi:api-activity';
const API_REQUEST_TIMEOUT_MS = 20000;
let activeApiRequests = 0;

function notifyApiActivity() {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent(API_ACTIVITY_EVENT, {
    detail: {
      activeRequests: activeApiRequests,
    },
  }));
}

function beginApiActivity() {
  activeApiRequests += 1;
  notifyApiActivity();
}

function endApiActivity() {
  activeApiRequests = Math.max(0, activeApiRequests - 1);
  notifyApiActivity();
}

export function getActiveApiRequests() {
  return activeApiRequests;
}

export function subscribeToApiActivity(listener: (activeRequests: number) => void) {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handler = (event: Event) => {
    const activeRequests = event instanceof CustomEvent
      && event.detail
      && typeof event.detail.activeRequests === 'number'
      ? event.detail.activeRequests
      : 0;

    listener(activeRequests);
  };

  window.addEventListener(API_ACTIVITY_EVENT, handler);

  return () => window.removeEventListener(API_ACTIVITY_EVENT, handler);
}

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

type ApiRequestOptions = RequestInit & {
  token?: string | null;
};

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { token, headers, signal, ...rest } = options;
  const isFormData = typeof FormData !== 'undefined' && rest.body instanceof FormData;
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), API_REQUEST_TIMEOUT_MS);

  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener('abort', () => controller.abort(), { once: true });
    }
  }

  let response: Response;
  beginApiActivity();

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      headers: {
        Accept: 'application/json',
        ...(!isFormData && rest.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      signal: controller.signal,
    });
  } catch (error) {
    endApiActivity();
    throw new ApiError(
      error instanceof Error && error.name === 'AbortError'
        ? `A API em ${API_BASE_URL} demorou demasiado a responder. Verifica se o backend local esta ativo.`
        : `Nao foi possivel ligar a API em ${API_BASE_URL}. Verifica o host configurado para este dispositivo.`,
      0,
      error,
    );
  } finally {
    globalThis.clearTimeout(timeout);
  }

  try {
    const text = await response.text();
    const payload = text ? JSON.parse(text) : null;

    if (!response.ok) {
      const fallbackMessage = response.status === 401
        ? 'Sessao invalida. Volta a iniciar sessao.'
        : 'Nao foi possivel concluir o pedido.';

      const message =
        (payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string'
          ? payload.message
          : null) ||
        (payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
          ? payload.error
          : null) ||
        fallbackMessage;

      throw new ApiError(message, response.status, payload);
    }

    return payload as T;
  } finally {
    endApiActivity();
  }
}
