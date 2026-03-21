import { createContext, useContext, useState, ReactNode } from "react";

const AUTHORIZE_URL = "https://gsdcp.org/api/mobile/authorize";

export type AuthUser = {
  member_id: string;
  name: string;
  membership_no: string;
};

type AuthContextType = {
  user: AuthUser | null;
  isLoggedIn: boolean;
  login: (identifier: string, credential: string, mode?: "membership" | "username" | "otp") => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const login = async (
    identifier: string,
    credential: string,
    mode: "membership" | "username" | "otp" = "username",
  ): Promise<void> => {
    let body: Record<string, string>;

    if (mode === "otp") {
      body = { phone: identifier, otp: credential };
    } else {
      // membership_no and username both go in as "username"; backend can resolve either
      body = { username: identifier, password: credential };
    }

    const res = await fetch(AUTHORIZE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    let json: any;
    try {
      json = await res.json();
    } catch {
      throw new Error("Unexpected server response. Please try again.");
    }

    if (!res.ok || json?.success === false) {
      // Surface the server's own message when available
      throw new Error(
        json?.message ?? json?.error ?? "Sign in failed. Please check your credentials.",
      );
    }

    // Expect: { success: true, data: { member_id, name, membership_no, ... } }
    const userData: AuthUser = {
      member_id:    json.data?.member_id    ?? json.data?.id ?? "",
      name:         json.data?.name         ?? "",
      membership_no: json.data?.membership_no ?? identifier,
    };

    setUser(userData);
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
