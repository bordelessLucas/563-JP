import { User } from "firebase/auth";
import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  logout,
  observeAuthState,
  registerWithEmail,
  requestPasswordReset,
  signInWithEmail,
} from "@/src/services/auth.service";
import {
  createClientProfile,
  getUserProfile,
  UserProfile,
  UserRole,
} from "@/src/services/user.service";

type AuthContextValue = {
  user: User | null;
  profile: UserProfile | null;
  role: UserRole | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  homeRoute: "/(tabs)" | "/admin";
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tokenAdmin, setTokenAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(
    () =>
      observeAuthState((nextUser) => {
        setUser(nextUser);
        if (!nextUser) {
          setProfile(null);
          setTokenAdmin(false);
          setLoading(false);
          return;
        }

        setLoading(true);
        void Promise.all([
          getUserProfile(nextUser.uid),
          nextUser.getIdTokenResult().then((result) => result.claims.admin === true),
        ])
          .then(([nextProfile, adminClaim]) => {
            setProfile(nextProfile);
            setTokenAdmin(adminClaim);
          })
          .finally(() => {
            setLoading(false);
          });
      }),
    [],
  );

  const role = profile?.role ?? null;
  // Prefer Auth custom claim; Firestore role remains fallback until token refresh.
  const isAdmin = tokenAdmin || role === "admin";
  const homeRoute = isAdmin ? "/admin" : "/(tabs)";

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      role,
      loading,
      isAuthenticated: user !== null,
      isAdmin,
      homeRoute,
      login: async (email, password) => {
        const credential = await signInWithEmail(email, password);
        await credential.user.getIdToken(true);
        const [nextProfile, token] = await Promise.all([
          getUserProfile(credential.user.uid),
          credential.user.getIdTokenResult(),
        ]);
        setUser(credential.user);
        setProfile(nextProfile);
        setTokenAdmin(token.claims.admin === true);
      },
      register: async (name, email, password) => {
        const credential = await registerWithEmail(name, email, password);
        await createClientProfile(credential.user.uid, name, email);
        const nextProfile = await getUserProfile(credential.user.uid);
        setUser(credential.user);
        setProfile(nextProfile);
        setTokenAdmin(false);
      },
      logout,
      requestPasswordReset,
    }),
    [homeRoute, isAdmin, loading, profile, role, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
