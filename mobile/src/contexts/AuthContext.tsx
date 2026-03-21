import { createContext, useContext, useState, ReactNode } from "react";

const AUTHORIZE_URL = "https://gsdcp.org/api/mobile/authorize";

export type AuthUser = {
  id: number;
  member_id: string;       // string version of id for compatibility
  username: string;
  first_name: string;
  last_name: string;
  name: string;            // first_name + last_name
  membership_no: string | null;
  membership_type: string | null;
  photo: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  country: string | null;
  role: string | null;
  role_id: string | null;
  myDogs: any[];
  myKennel: any | null;
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
      body = { login_type: "otp", phone: identifier, otp: credential };
    } else if (mode === "membership") {
      body = { login_type: "membership", membership_no: identifier, password: credential };
    } else {
      body = { login_type: "username", username: identifier, password: credential };
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
      country:         p.country ?? p.user_city?.country ?? null,
      role:            p.role ?? p.user_role?.name ?? null,
      role_id:         p.role_id ?? null,
      myDogs:          json.data?.myDogs ?? [],
      myKennel:        json.data?.myKennel ?? null,
    };

    setUser(authUser);
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
