import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AUTHORIZE_URL = "https://gsdcp.org/api/mobile/authorize";
const STORAGE_KEY = "gsdcp_auth_user";

export type AuthUser = {
  id: number;
  member_id: string;
  username: string;
  first_name: string;
  last_name: string;
  name: string;
  membership_no: string | null;
  membership_type: string | null;
  photo: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  city_id: number | null;
  country: string | null;
  role: string | null;
  role_id: string | null;
  myDogs: any[];
  myKennel: any | null;
  token: string | null;
};

type AuthContextType = {
  user: AuthUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (identifier: string, credential: string, mode?: "membership" | "username" | "otp") => Promise<void>;
  logout: () => void;
  updateUser: (patch: Partial<AuthUser>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on app start
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          try { setUser(JSON.parse(raw)); } catch { /* ignore corrupt data */ }
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (
    identifier: string,
    credential: string,
    mode: "membership" | "username" | "otp" = "username",
  ): Promise<void> => {
    let body: Record<string, string>;

    if (mode === "otp") {
      body = { login_type: "otp", phone: identifier, otp: credential };
    } else if (mode === "membership") {
      body = { login_type: "membership", membership_no: identifier, password: credential };
    } else {
      body = { login_type: "username", username: identifier, password: credential };
    }

    const res = await fetch(AUTHORIZE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });

    let json: any;
    try {
      const raw = await res.text();
      json = raw ? JSON.parse(raw) : null;
    } catch {
      throw new Error("Unexpected server response. Please try again.");
    }

    if (!res.ok || json?.success === false) {
      throw new Error(
        json?.error?.message ?? json?.message ?? "Sign in failed. Please check your credentials.",
      );
    }

    const p = json.data?.myProfile ?? {};

    const authUser: AuthUser = {
      id:              p.id,
      member_id:       String(p.id ?? ""),
      username:        p.username ?? identifier,
      first_name:      p.first_name ?? "",
      last_name:       p.last_name ?? "",
      name:            [p.first_name, p.last_name].filter(Boolean).join(" "),
      membership_no:   p.membership_no ?? null,
      membership_type: p.membership_type ?? null,
      photo:           p.photo ?? null,
      email:           p.email ?? null,
      phone:           p.phone ?? null,
      city:            p.city ?? p.user_city?.city ?? null,
      city_id:         p.user_city?.id ?? null,
      country:         p.country ?? p.user_city?.country ?? null,
      role:            p.role ?? p.user_role?.name ?? null,
      role_id:         p.role_id ?? null,
      myDogs:          json.data?.myDogs ?? [],
      myKennel:        json.data?.myKennel ?? null,
      token:           json.data?.token ?? json.data?.access_token ?? json.token ?? json.access_token ?? null,
    };

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
    setUser(authUser);
  };

  const logout = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  const updateUser = async (patch: Partial<AuthUser>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...patch };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
