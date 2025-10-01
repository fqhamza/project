import { useEffect, useState } from 'react';
import { mockDb, MockUser } from '../lib/mockDb';

export const useAuth = () => {
  const [user, setUser] = useState<MockUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem('mock-auth-email');
    if (raw) {
      const ensured = mockDb.ensureUser(raw);
      setUser(ensured);
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, _password: string) => {
    try {
      const ensured = mockDb.ensureUser(email);
      localStorage.setItem('mock-auth-email', email);
      setUser(ensured);
      return { error: null as unknown as Error | null };
    } catch (e) {
      return { error: e as Error };
    }
  };

  const signUp = async (email: string, _password: string) => {
    try {
      const ensured = mockDb.ensureUser(email);
      localStorage.setItem('mock-auth-email', email);
      setUser(ensured);
      return { error: null as unknown as Error | null };
    } catch (e) {
      return { error: e as Error };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('mock-auth-email');
    setUser(null);
    return { error: null as unknown as Error | null };
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };
};