const AUTH_KEY = 'foody_admin_auth';

export type AdminUser = {
  id: number;
  name: string;
  phone: string;
  role: string;
};

export type AuthSession = {
  token: string;
  user: AdminUser;
};

export const DEMO_LOGIN = {
  phone: '99001122',
  password: 'admin123',
};

export function saveAuth(session: AuthSession) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(session));
}

export function getAuth(): AuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

export function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
}

export function isAuthenticated() {
  return getAuth()?.token === 'demo-admin-token';
}
