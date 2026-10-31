import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { type Notif } from "./data/content";
import { roleCan, seedTeam, type Perm, type TeamMember } from "./data/team";
import { getAuthToken, getStoredAdminProfile, setStoredAdminProfile } from "./config";
import { type AdminRecord, useGetCurrentAdminQuery } from "./api-client";

// ---- helpers ---------------------------------------------------------------
function usePersistent<T>(key: string, init: () => T): [T, (v: T | ((p: T) => T)) => void] {
  const [val, setVal] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw) as T;
    } catch {
      /* ignore */
    }
    return init();
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch {
      /* storage full or unavailable */
    }
  }, [key, val]);
  return [val, setVal];
}

export const uid = () => Math.random().toString(36).slice(2, 9);
const normalizePermission = (value: string) => value.trim().toUpperCase().replace(/[\s.-]+/g, "_");

// ---- store -----------------------------------------------------------------
interface Store {
  // push notifications
  testPush: (n: Notif) => void;
  banner: Notif | null;
  dismissBanner: () => void;
  requestPush: () => Promise<NotificationPermission | "unsupported">;
  // team, profile & permissions
  team: TeamMember[];
  me: TeamMember;
  can: (perm: Perm) => boolean;
  canAccessSection: (section: string) => boolean;
  hasBackendAdmin: boolean;
  isBackendAdminLoading: boolean;
  backendAdminError: boolean;
  backendAdminErrorMessage: string;
  backendAdminPermissionWarning: string | null;
  addMember: (m: TeamMember) => void;
  updateMember: (id: string, patch: Partial<TeamMember>) => void;
  removeMember: (id: string) => void;
  switchAccount: (id: string) => void;
  // toast
  toast: string | null;
  showToast: (m: string) => void;
}

const Ctx = createContext<Store | null>(null);
export const useStore = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("Store missing");
  return c;
};

export function StoreProvider({ children }: { children: ReactNode }) {
  const hasToken = !!getAuthToken();
  const storedAdmin = hasToken ? getStoredAdminProfile() : undefined;
  const { data: currentAdmin, isLoading: isAdminQueryLoading, isError: isAdminQueryError } = useGetCurrentAdminQuery(undefined, { skip: !hasToken });
  const backendAdmin = currentAdmin ?? storedAdmin;
  const isBackendAdminLoading = hasToken && isAdminQueryLoading;
  const backendAdminPermissionWarning = hasToken && backendAdmin && !backendAdmin.permissions?.length && !isAdminQueryLoading
    ? isAdminQueryError
      ? "The admin profile and permissions could not be refreshed from /user/profile. Check the API response and your account access."
      : "The /user/profile response did not include permissions. Ask the backend administrator to include the assigned permissions in that response."
    : null;
  const backendAdminError = hasToken && !backendAdmin;
  const backendAdminErrorMessage = "Your admin profile was not included in the login response. Please sign in again or contact your administrator.";
  useEffect(() => {
    if (currentAdmin) setStoredAdminProfile(currentAdmin);
  }, [currentAdmin]);
  // ---- team & permissions
  const [team, setTeam] = usePersistent<TeamMember[]>("lt_team_v1", seedTeam);
  const [meId, setMeId] = usePersistent<string>("lt_me_v1", () => "t1");
  const backendPermissions = (backendAdmin?.permissions ?? []).map(normalizePermission);
  const backendSubrole = backendAdmin?.subrole?.trim().toLowerCase();
  const backendRole = backendAdmin?.role?.trim().toUpperCase();
  const backendIsSuperAdmin = !!backendAdmin && (
    backendAdmin.isSuperAdmin === true || backendAdmin.superAdmin === true || backendRole === "SUPER_ADMIN" || backendRole === "SUPERADMIN" || backendRole === "SUPER ADMIN" || backendSubrole === "super admin" || backendSubrole === "superadmin" || backendPermissions.includes("SUPER_ADMIN") || backendPermissions.includes("*")
  );
  const backendMe = backendAdmin ? {
    id: backendAdmin._id ?? backendAdmin.id ?? "backend-admin",
    name: backendAdmin.name ?? "Admin",
    email: backendAdmin.email ?? "",
    role: backendSubrole === "editor" ? "editor" as const : backendSubrole === "moderator" ? "moderator" as const : "admin" as const,
    status: "active" as const,
    title: backendAdmin.subrole,
    avatar: backendAdmin.image,
    addedAt: backendAdmin.createdAt?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    permissions: backendPermissions,
    superAdmin: backendIsSuperAdmin,
  } : undefined;
  const me = useMemo(
    () => backendMe ?? team.find((m) => m.id === meId && m.status === "active") ?? team.find((m) => m.role === "admin" && m.status === "active") ?? team[0],
    [backendMe, team, meId]
  );
  const can = useCallback((perm: Perm) => {
    if (!me) return false;
    if (hasToken && !backendAdmin) return false;
    if (me.superAdmin) return true;
    if (!backendAdmin) return roleCan(me.role, perm);

    const permissions = new Set(backendPermissions);
    const direct: Record<Perm, string[]> = {
      "content.edit": ["CONTENT_EDIT", "CONTENT_CREATE", "CONTENT_UPDATE", "CONTENT_DELETE"],
      "content.publish": ["CONTENT_PUBLISH"],
      "push.send": ["PUSH_SEND", "NOTIFICATION_CREATE"],
      "users.view": ["USER_READ"],
      "users.manage": ["USER_CREATE", "USER_UPDATE"],
      "users.delete": ["USER_DELETE"],
      "team.manage": ["TEAM_MANAGE", "ADMIN_CREATE", "ADMIN_UPDATE", "ADMIN_DELETE"],
    };
    if (direct[perm].some((code) => permissions.has(code))) return true;
    if (perm === "content.edit") return [...permissions].some((code) => /^(PRAYER|AUDIO|TEACHING|VERSE|IMAGE|ENCOURAGEMENT|SOCIAL)_((CREATE)|(UPDATE)|(DELETE))$/.test(code));
    if (perm === "content.publish") return [...permissions].some((code) => /^(PRAYER|AUDIO|TEACHING|VERSE|IMAGE|ENCOURAGEMENT|SOCIAL)_PUBLISH$/.test(code));
    return false;
  }, [me, hasToken, backendAdmin, backendPermissions]);
  const canAccessSection = useCallback((section: string) => {
    if (section === "profile") return true;
    if (hasToken && !backendAdmin) return section === "dashboard" && isBackendAdminLoading;
    if (!backendAdmin) {
      if (section === "dashboard") return true;
      if (section === "notifications") return roleCan(me.role, "push.send");
      if (section === "users" || section === "comments") return roleCan(me.role, "users.view");
      if (section === "team") return roleCan(me.role, "team.manage");
      return true;
    }
    if (backendIsSuperAdmin) return true;
    const permissions = new Set(backendPermissions);
    const routeCodes: Record<string, string[]> = {
      dashboard: ["DASHBOARD_READ"],
      prayers: ["PRAYER_READ", "PRAYERS_READ", "PRAYER_CREATE", "PRAYER_UPDATE", "PRAYER_DELETE", "PRAYER_PUBLISH", "CONTENT_EDIT", "CONTENT_PUBLISH"],
      audio: ["AUDIO_READ", "AUDIO_CREATE", "AUDIO_UPDATE", "AUDIO_DELETE", "AUDIO_PUBLISH", "CONTENT_EDIT", "CONTENT_PUBLISH"],
      encouragements: ["ENCOURAGEMENT_READ", "ENCOURAGEMENTS_READ", "ENCOURAGEMENT_CREATE", "ENCOURAGEMENT_UPDATE", "ENCOURAGEMENT_DELETE", "ENCOURAGEMENT_PUBLISH", "CONTENT_EDIT", "CONTENT_PUBLISH"],
      teachings: ["TEACHING_READ", "TEACHINGS_READ", "TEACHING_CREATE", "TEACHING_UPDATE", "TEACHING_DELETE", "TEACHING_PUBLISH", "CONTENT_EDIT", "CONTENT_PUBLISH"],
      verses: ["VERSE_READ", "VERSES_READ", "VERSE_CREATE", "VERSE_UPDATE", "VERSE_DELETE", "VERSE_PUBLISH", "CONTENT_EDIT", "CONTENT_PUBLISH"],
      images: ["IMAGE_READ", "IMAGES_READ", "IMAGE_CREATE", "IMAGE_UPDATE", "IMAGE_DELETE", "IMAGE_PUBLISH", "CONTENT_EDIT", "CONTENT_PUBLISH"],
      socials: ["SOCIAL_READ", "SOCIAL_LINKS_READ", "SOCIAL_CREATE", "SOCIAL_UPDATE", "SOCIAL_DELETE", "CONTENT_EDIT"],
      notifications: ["NOTIFICATION_READ", "NOTIFICATION_CREATE", "PUSH_SEND"],
      users: ["USER_READ", "USER_CREATE", "USER_UPDATE", "USER_DELETE"],
      comments: ["COMMENT_READ", "COMMENT_UPDATE"],
      team: ["TEAM_MANAGE", "ADMIN_READ", "ADMIN_CREATE", "ADMIN_UPDATE", "ADMIN_DELETE"],
    };
    return (routeCodes[section] ?? []).some((code) => permissions.has(code));
  }, [backendAdmin, backendIsSuperAdmin, backendPermissions, hasToken, isBackendAdminLoading, me]);
  const addMember = useCallback((m: TeamMember) => setTeam((l) => [m, ...l]), [setTeam]);
  const updateMember = useCallback((id: string, patch: Partial<TeamMember>) => setTeam((l) => l.map((m) => (m.id === id ? { ...m, ...patch } : m))), [setTeam]);
  const removeMember = useCallback((id: string) => setTeam((l) => l.filter((m) => m.id !== id)), [setTeam]);
  const switchAccount = useCallback((id: string) => setMeId(id), [setMeId]);

  // ---- toast
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const showToast = useCallback((m: string) => {
    setToast(m);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2400);
  }, []);

  // ---- push notifications
  const [banner, setBanner] = useState<Notif | null>(null);
  const bannerTimer = useRef<number | undefined>(undefined);
  const dismissBanner = useCallback(() => setBanner(null), []);
  const fireBanner = useCallback((n: Notif) => {
    setBanner(n);
    window.clearTimeout(bannerTimer.current);
    bannerTimer.current = window.setTimeout(() => setBanner(null), 7000);
    try {
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(n.title, { body: n.body, icon: n.image });
      }
    } catch {
      /* system notifications unavailable */
    }
  }, []);
  const requestPush = useCallback(async () => {
    if (!("Notification" in window)) return "unsupported" as const;
    try {
      return await Notification.requestPermission();
    } catch {
      return "unsupported" as const;
    }
  }, []);
  const testPush = useCallback((n: Notif) => fireBanner({ ...n, id: "test" }), [fireBanner]);

  const value = useMemo<Store>(
    () => ({
      testPush, banner, dismissBanner, requestPush,
      team, me, can, canAccessSection, hasBackendAdmin: !!backendAdmin, isBackendAdminLoading, backendAdminError, backendAdminErrorMessage, backendAdminPermissionWarning, addMember, updateMember, removeMember, switchAccount,
      toast, showToast,
    }),
    [testPush, banner, dismissBanner, requestPush, team, me, can, canAccessSection, backendAdmin, isBackendAdminLoading, backendAdminError, backendAdminErrorMessage, backendAdminPermissionWarning, addMember, updateMember, removeMember, switchAccount, toast, showToast]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
