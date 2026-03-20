import { createContext, useContext, useState, ReactNode } from "react";

export type AuthUser = {
  member_id: string;
  name: string;
  membership_no: string;
};

type AuthContextType = {
  user: AuthUser | null;
  isLoggedIn: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const login = async (identifier: string, password: string): Promise<void> => {
    throw new Error("Login is not available yet. Coming soon!");
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
