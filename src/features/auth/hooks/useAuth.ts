"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { message } from "antd";
import { getFirstAllowedRoute } from "@/access-control";
import { useAuthStore } from "@/stores/auth.store";
import * as authApi from "../api/auth.api";
import type { LoginCredentials } from "../types/auth.types";

export function useAuth() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.logout);

  const handleLogin = useCallback(
    async (credentials: LoginCredentials, redirectOnSuccess: boolean = true) => {
      setLoading(true);
      try {
        const response = await authApi.login(credentials);
        const { user: responseUser, tokens } = response.data;
        const authUser = authApi.toAuthUser(
          responseUser,
          responseUser.permissions ?? [],
        );

        setAuth(authUser, tokens.accessToken);
        message.success(response.message || `Chao mung ${authUser.name}!`);

        if (redirectOnSuccess) {
          router.push(getFirstAllowedRoute(authUser.permissions));
        }

        return response.data;
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Dang nhap that bai. Vui long kiem tra lai tai khoan hoac mat khau.";
        message.error(errorMessage);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [router, setAuth],
  );

  const handleLogout = useCallback(async () => {
    setLoading(true);
    try {
      clearAuth();
      await authApi.logout();
    } catch (error) {
      console.error("Loi khi dang xuat:", error);
    } finally {
      setLoading(false);
    }
  }, [clearAuth]);

  const handleQuickLogin = useCallback(
    async (username: string, password: string = "123456") => {
      return handleLogin({ username, password, rememberMe: true });
    },
    [handleLogin],
  );

  return {
    accessToken,
    currentUser: user,
    isAuthenticated: Boolean(user) || authApi.isAuthenticated(),
    loading,
    login: handleLogin,
    logout: handleLogout,
    quickLogin: handleQuickLogin,
    user,
  };
}
