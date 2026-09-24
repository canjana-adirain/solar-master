import { useCallback, useState } from 'react';
import { AUTH_KEY, USERS } from '../constants.js';
import { sha256 } from '../utils/format.js';

function readSession() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(AUTH_KEY) || 'null');
    return saved && USERS[saved.user] ? saved : null;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [session, setSession] = useState(readSession);

  const login = useCallback(async (rawUser, password) => {
    const user = rawUser.trim().toLowerCase();
    const account = USERS[user];
    if (!account || await sha256(password) !== account.hash) return false;
    const next = { user, role: account.role };
    sessionStorage.setItem(AUTH_KEY, JSON.stringify(next));
    setSession(next);
    return true;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(AUTH_KEY);
    setSession(null);
  }, []);

  return { session, login, logout };
}
