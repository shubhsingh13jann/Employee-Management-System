import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const getDefaultRouteForRole = (role) => {
    switch (role) {
      case "admin":
        return "/admin/dashboard";
      case "manager":
        return "/manager/dashboard";
      case "supervisor":
        return "/supervisor/dashboard";
      case "employee":
        return "/employee/dashboard";
      default:
        return "/login";
    }
  };

  const verifySession = async () => {
    try {
      const res = await api.get("/api/auth/me");
      if (res.data.status && res.data.user) {
        setUser(res.data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verifySession();
  }, []);

  const login = async (email, password, role) => {
    const res = await api.post("/api/auth/login", { email, password, role });
    if (res.data.status && res.data.user) {
      setUser(res.data.user);
      return res.data;
    }
    throw new Error(res.data.error || "Login failed");
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
        refreshUser: verifySession,
        getDefaultRouteForRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
