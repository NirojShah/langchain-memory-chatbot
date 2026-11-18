const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

export interface RegisterPayload {
  userName: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UpdateUserPayload {
  userName?: string;
  email?: string;
}

export interface ApiError extends Error {
  status: number;
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const accessToken = localStorage.getItem('accessToken');
  const headers = new Headers(options.headers);

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  let data: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const errorMessage =
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      typeof data.message === 'string'
        ? data.message
        : `Request failed with status ${response.status}`;
    const error = new Error(errorMessage) as ApiError;
    error.status = response.status;
    throw error;
  }

  return data as T;
}

export async function register(payload: RegisterPayload) {
  return apiRequest('/users/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function login(payload: LoginPayload) {
  const result = await apiRequest<{
    accessToken: string;
    refreshToken: string;
    user: { id: string; userName: string; email: string };
  }>('/users/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  localStorage.setItem('accessToken', result.accessToken);
  localStorage.setItem('refreshToken', result.refreshToken);
  localStorage.setItem('user', JSON.stringify(result.user));
  return result;
}

export async function getMe() {
  return apiRequest('/users/me');
}

export async function updateMe(payload: UpdateUserPayload) {
  return apiRequest('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deactivateMe() {
  return apiRequest('/users/me', {
    method: 'DELETE',
  });
}

export async function logout() {
  const result = await apiRequest('/users/logout', {
    method: 'POST',
  });
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  return result;
}
