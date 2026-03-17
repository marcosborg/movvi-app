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
  const { token, headers, ...rest } = options;
  const isFormData = typeof FormData !== 'undefined' && rest.body instanceof FormData;

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      headers: {
        Accept: 'application/json',
        ...(!isFormData && rest.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
  } catch (error) {
    throw new ApiError(
      `Nao foi possivel ligar a API em ${API_BASE_URL}. Verifica o host configurado para este dispositivo.`,
      0,
      error,
    );
  }

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
}
