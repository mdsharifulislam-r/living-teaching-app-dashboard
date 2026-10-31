import { useState, type FormEvent } from "react";
import { Provider } from "react-redux";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { Admin } from "./admin/Admin";
import { StoreProvider } from "./store";
import { adminApi, useLoginAdminMutation, useLogoutAdminMutation } from "./api-client";
import { clearAuthToken, getAuthToken, setAuthToken, setStoredAdminProfile } from "./config";
import { store } from "./reduxStore";
import { type AdminRecord } from "./api-client";

function messageFrom(error: unknown, fallback: string) {
  if (!error || typeof error !== "object") return fallback;
  if ("data" in error && error.data && typeof error.data === "object" && "message" in error.data && typeof error.data.message === "string") {
    return error.data.message;
  }
  if ("message" in error && typeof error.message === "string") return error.message;
  return fallback;
}

function asAdminProfile(value: unknown): AdminRecord | undefined {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  if (typeof record.email !== "string" && typeof record.role !== "string" && typeof record.subrole !== "string") return undefined;
  return {
    ...record,
    _id: typeof record._id === "string" ? record._id : undefined,
    id: typeof record.id === "string" ? record.id : typeof record.sub === "string" ? record.sub : undefined,
    email: typeof record.email === "string" ? record.email : undefined,
    name: typeof record.name === "string" ? record.name : undefined,
    role: typeof record.role === "string" ? record.role : undefined,
    subrole: typeof record.subrole === "string" ? record.subrole : undefined,
    permissions: Array.isArray(record.permissions) ? record.permissions.filter((permission): permission is string => typeof permission === "string") : [],
  };
}

function findAdminProfile(value: unknown, depth = 0): AdminRecord | undefined {
  const profile = asAdminProfile(value);
  if (profile || depth >= 3 || !value || typeof value !== "object") return profile;
  const record = value as Record<string, unknown>;
  for (const key of ["admin", "user", "profile", "adminInfo", "userInfo", "currentUser", "data"]) {
    const nested = findAdminProfile(record[key], depth + 1);
    if (nested) return nested;
  }
  return undefined;
}

function profileFromToken(token: string): AdminRecord | undefined {
  try {
    const payload = token.split(".")[1];
    if (!payload) return undefined;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="));
    const claims: unknown = JSON.parse(decoded);
    if (!claims || typeof claims !== "object") return undefined;
    return findAdminProfile(claims);
  } catch {
    return undefined;
  }
}

function LoginPage({ onLogin, error, busy }: {
  onLogin: (email: string, password: string) => Promise<void>;
  error: string;
  busy: boolean;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onLogin(email.trim(), password);
  };

  return (
    <main className="grid min-h-dvh place-items-center bg-[#f1f5f3] px-4 py-10">
      <section className="w-full max-w-md rounded-[28px] bg-white p-7 shadow-lift sm:p-9">
        <div className="mb-8">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-700 text-white shadow-soft">
            <LockKeyhole size={25} />
          </div>
          <h1 className="mt-5 text-[27px] font-extrabold tracking-tight text-brand-900">Admin sign in</h1>
          <p className="mt-1 text-[14.5px] text-mute">Sign in with your admin account to open the dashboard.</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-[13.5px] font-bold">Email address</span>
            <span className="relative block">
              <Mail size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brand-500" />
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@example.com"
                className="w-full rounded-2xl border border-line bg-white py-3.5 pl-11 pr-4 text-[14.5px] outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </span>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13.5px] font-bold">Password</span>
            <span className="relative block">
              <LockKeyhole size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brand-500" />
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-2xl border border-line bg-white py-3.5 pl-11 pr-12 text-[14.5px] outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
              <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-mute hover:bg-paper">
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </span>
          </label>
          {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-[13px] font-medium text-red-700">{error}</p>}
          <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-700 py-3.5 text-[15px] font-bold text-white shadow-soft transition hover:bg-brand-800 disabled:cursor-wait disabled:opacity-60">
            {busy ? "Signing in…" : "Sign in"} {!busy && <ArrowRight size={17} />}
          </button>
        </form>
      </section>
    </main>
  );
}

function AppContent() {
  const [authenticated, setAuthenticated] = useState(() => !!getAuthToken());
  const [authError, setAuthError] = useState("");
  const [loginAdmin, loginState] = useLoginAdminMutation();
  const [logoutAdmin] = useLogoutAdminMutation();

  const login = async (email: string, password: string) => {
    setAuthError("");
    try {
      const response = await loginAdmin({ email, password }).unwrap();
      const token = response.token ?? response.accessToken ?? response.access_token ?? response.data?.token ?? response.data?.accessToken ?? response.data?.access_token;
      if (!token) {
        setAuthError("The login response did not include an access token. Please contact your administrator.");
        return;
      }
      const profile = findAdminProfile(response)
        ?? profileFromToken(token);
      if (!profile) {
        setAuthError("Login succeeded, but no admin profile or role was returned. Ask the backend administrator to include admin details in the login response or token.");
        return;
      }
      setAuthToken(token);
      setStoredAdminProfile(profile);
      store.dispatch(adminApi.util.resetApiState());
      setAuthenticated(true);
    } catch (error) {
      setAuthError(messageFrom(error, "Sign in failed. Check your email and password, then try again."));
    }
  };

  const logout = async () => {
    const request = logoutAdmin().unwrap();
    clearAuthToken();
    setAuthError("");
    setAuthenticated(false);
    try {
      await request;
    } catch (error) {
      setAuthError(`Signed out on this device. The server logout request failed: ${messageFrom(error, "Please try again later.")}`);
    } finally {
      store.dispatch(adminApi.util.resetApiState());
    }
  };

  return authenticated ? (
    <StoreProvider>
      <Admin onLogout={logout} />
    </StoreProvider>
  ) : (
    <LoginPage onLogin={login} error={authError} busy={loginState.isLoading} />
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}
