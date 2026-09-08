import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, saveToken, clearToken } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem("ku_token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { user } = await api.me();
      setUser(user);
    } catch {
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  async function login(email, password) {
    const { token, user } = await api.login({ email, password });
    saveToken(token);
    setUser(user);
  }

  async function signup(payload) {
    const { token, user } = await api.signup(payload);
    saveToken(token);
    setUser(user);
  }

  async function loginWithGoogle(credential) {
    const { token, user } = await api.googleAuth(credential);
    saveToken(token);
    setUser(user);
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  const isPremium =
    user?.subscriptionTier === "premium" &&
    user?.subscriptionExpiresAt &&
    new Date(user.subscriptionExpiresAt) > new Date();

  return (
    <AuthContext.Provider
      value={{ user, setUser, loading, login, signup, loginWithGoogle, logout, refreshUser, isPremium }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
