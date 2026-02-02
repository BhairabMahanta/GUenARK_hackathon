import apiClient from "./client";
import * as SecureStore from "expo-secure-store";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  accessToken?: string;
  refreshToken?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>("/auth/login", payload);
    console.log("Login response data:", data);

    if (data.accessToken) {
      console.log("Storing access token");
      await SecureStore.setItemAsync("accessToken", data.accessToken);
    }
    if (data.refreshToken) {
      console.log("Storing refresh token");
      await SecureStore.setItemAsync("refreshToken", data.refreshToken);
    }
    return data;
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { name, ...rest } = payload;
    const { data } = await apiClient.post<AuthResponse>("/auth/register", {
      username: name,
      ...rest,
    });
    return data;
  },

  async logout(): Promise<void> {
    try {
      console.log("Logging out user");
      const refreshToken = await SecureStore.getItemAsync("refreshToken");

      if (refreshToken) {
        await apiClient.post("/auth/logout", { refreshToken });
      } else {
        console.warn("No refresh token found, skipping backend logout");
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Always clean up local storage
      await SecureStore.deleteItemAsync("accessToken");
      await SecureStore.deleteItemAsync("refreshToken");
      console.log("Tokens cleared from local storage");
    }
  },

  async getProfile(): Promise<AuthResponse["user"]> {
    const { data } = await apiClient.get("/auth/profile");
    return data.user;
  },

  async isAuthenticated(): Promise<boolean> {
    const token = await SecureStore.getItemAsync("accessToken");
    return !!token;
  },

  async verifyEmail(email: string, otp: string): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>("/auth/verify-email", {
      email,
      otp,
    });

    // store tokens on successful verification
    if (data.accessToken) {
      await SecureStore.setItemAsync("accessToken", data.accessToken);
    }
    if (data.refreshToken) {
      await SecureStore.setItemAsync("refreshToken", data.refreshToken);
    }
    return data;
  },

  async resendVerification(email: string): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>(
      "/auth/resend-verification",
      { email },
    );
    return data;
  },
};
