import axios from 'axios';

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.NEXT_PUBLIC_BACK_URI ??
  'http://localhost:8000';

let accessToken: string | undefined;
let onUnauthorized: (() => void) | undefined;

/** Called by <AuthSync> whenever the NextAuth session changes. */
export const setAccessToken = (token?: string) => {
  accessToken = token;
};

export const setUnauthorizedHandler = (handler: () => void) => {
  onUnauthorized = handler;
};

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Expired or revoked token: end the session instead of showing broken pages.
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      accessToken
    ) {
      onUnauthorized?.();
    }
    return Promise.reject(error);
  }
);

export const fetcher = <T>(url: string) => api.get<T>(url).then((r) => r.data);

/** Human-readable message from an API (NestJS) or network error. */
export function getErrorMessage(
  error: unknown,
  fallback = 'Something went wrong'
): string {
  if (axios.isAxiosError(error)) {
    const message = (
      error.response?.data as { message?: string | string[] } | undefined
    )?.message;
    if (Array.isArray(message)) return message.join('\n');
    if (typeof message === 'string') return message;
    if (!error.response)
      return 'Cannot reach the server, please try again later';
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
