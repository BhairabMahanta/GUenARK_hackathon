import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  authService,
  LoginPayload,
  RegisterPayload,
  AuthResponse,
} from "@/api/auth.service";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  profileImage?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  pendingVerificationEmail: string | null;
  profileImage: string | null;
  login: (payload: LoginPayload) => Promise<AuthResponse>;
  register: (payload: RegisterPayload) => Promise<AuthResponse>;
  verifyEmail: (email: string, otp: string) => Promise<AuthResponse>;
  resendVerification: (email: string) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  setPendingVerificationEmail: (email: string | null) => void;
  setProfileImage: (uri: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileImage, setProfileImageState] = useState<string | null>(null);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<
    string | null
  >(null);

  // load profile image from local storage
  useEffect(() => {
    const loadProfileImage = async () => {
      const saved = await AsyncStorage.getItem("profileImage");
      if (saved) setProfileImageState(saved);
    };
    loadProfileImage();
  }, []);

  // check session on mount
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    setIsLoading(true);
    try {
      const isAuth = await authService.isAuthenticated();
      if (isAuth) {
        const profile = await authService.getProfile();
        if (profile) setUser(profile as User);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (payload: LoginPayload) => {
    const res = await authService.login(payload);
    if (res.user) setUser(res.user as User);
    return res;
  };

  const register = async (payload: RegisterPayload) => {
    const res = await authService.register(payload);
    // store email for OTP verification
    if (res.success) {
      setPendingVerificationEmail(payload.email);
    }
    return res;
  };

  const verifyEmail = async (email: string, otp: string) => {
    const res = await authService.verifyEmail(email, otp);
    if (res.success && res.user) {
      setUser(res.user as User);
      setPendingVerificationEmail(null);
    }
    return res;
  };

  const resendVerification = async (email: string) => {
    return authService.resendVerification(email);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setPendingVerificationEmail(null);
    // clear profile image on logout
    await AsyncStorage.removeItem("profileImage");
    setProfileImageState(null);
  };

  // save profile image locally
  const setProfileImage = async (uri: string) => {
    await AsyncStorage.setItem("profileImage", uri);
    setProfileImageState(uri);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        pendingVerificationEmail,
        profileImage,
        login,
        register,
        verifyEmail,
        resendVerification,
        logout,
        checkSession,
        setPendingVerificationEmail,
        setProfileImage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
