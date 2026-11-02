import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Calendar, Eye, EyeOff, FileAudio, Headphones, Image as ImageIcon, LayoutDashboard, Lightbulb, Link2, Lock, Pencil,
  Plus, Quote, Search, BellRing, LogOut, Trash2, Upload, Users as UsersIcon, BookOpen, Sparkles, ShieldCheck, UserRound, ChevronDown, Check, Info, MessageSquareText,
} from "lucide-react";
import { Img, Logo, PrayingHands, Toast, type IconC } from "../components/ui";
import { SocialIcon } from "../components/SocialIcon";
import { FEATURES, prettyDate, today, type Base, type ContentKind, type Status } from "../data/content";
import { useStore } from "../store";
import { cn } from "../utils/cn";
import { CONFIG, type Field } from "./config";
import { Avatar, ConfirmDelete, Modal, inputCls, resizeImage } from "./shared";
import { ProfileManager } from "./ProfileAdmin";
import { RoleBadge, TeamManager } from "./TeamAdmin";
import { ROLES } from "../data/team";
import { NotificationsManager } from "./NotificationsAdmin";
import { CommentsManager } from "./CommentsAdmin";
import { UsersManager } from "./UsersAdmin";
import { VersesManager } from "./VersesAdmin";
import { PushBanner } from "../components/push";
import {
  type ManagedContentRecord,
  type ManagedContentResource,
  useCreateManagedContentMutation,
  useDeleteManagedContentMutation,
  useGetManagedContentQuery,
  useGetUsersQuery,
  useGetVersesQuery,
  useUpdateManagedContentMutation,
} from "../api-client";
import { resolveFileUrl } from "../config";
import { resolveAudioUrl } from "../config";
import { uploadFileInChunks } from "../utils/upload";
import { LanguageSwitcher } from "../i18n";

type SectionId = "dashboard" | ContentKind | "notifications" | "users" | "comments" | "team" | "profile";

interface SectionDef {
  id: SectionId;
  label: string;
  icon: IconC;
  hidden?: boolean; // reachable but not listed in the menu
}

const SECTIONS: SectionDef[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "prayers", label: "Prayers", icon: PrayingHands },
  { id: "audio", label: "Audio", icon: Headphones },
  { id: "encouragements", label: "Encouragements", icon: Lightbulb },
  { id: "teachings", label: "Teachings", icon: BookOpen },
  { id: "verses", label: "Verses", icon: Quote },
  { id: "images", label: "Images", icon: ImageIcon },
  { id: "socials", label: "Social Links", icon: Link2 },
  { id: "notifications", label: "Push Notifications", icon: BellRing },
  { id: "users", label: "Users", icon: UsersIcon },
  { id: "comments", label: "Comments", icon: MessageSquareText },
  { id: "team", label: "Team & Roles", icon: ShieldCheck },
  { id: "profile", label: "My Profile", icon: UserRound, hidden: true },
];

/** Account menu showing the signed-in admin's profile, profile link, and logout action. */
function AccountMenu({ onProfile, onLogout }: { onProfile: () => void; onLogout: () => Promise<void> }) {
  const { me, team, switchAccount, showToast, hasBackendAdmin } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);
  const others = hasBackendAdmin ? [] : team.filter((m) => m.status === "active");

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex items-center gap-3 rounded-full py-1 pl-3 pr-1.5 transition hover:bg-paper"
      >
        <span className="hidden text-right sm:block">
          <span className="block text-[14px] font-bold leading-tight">{me.name}</span>
          <span className="block text-[12px] text-mute">{me.superAdmin ? "Super Admin" : ROLES[me.role].label}</span>
        </span>
        <Avatar name={me.name} src={resolveFileUrl(me.avatar)} size={40} ring />
        <ChevronDown size={16} className={cn("hidden text-mute transition sm:block", open && "rotate-180")} />
      </button>
      {open && (
        <div role="menu" className="anim-fade absolute right-0 top-[calc(100%+8px)] z-[70] w-[310px] overflow-hidden rounded-3xl bg-white shadow-lift ring-1 ring-black/5">
          <div className="flex items-center gap-3 border-b border-line p-4">
            <Avatar name={me.name} src={resolveFileUrl(me.avatar)} size={48} ring />
            <div className="min-w-0">
              <p className="truncate text-[15px] font-bold">{me.name}</p>
              <p className="truncate text-[12.5px] text-mute">{me.email}</p>
              {me.superAdmin ? <span className="mt-1 inline-flex rounded-full bg-gold-50 px-2.5 py-1 text-[12px] font-bold text-gold-700">Super Admin</span> : <RoleBadge role={me.role} className="mt-1" />}
            </div>
          </div>
          <button
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onProfile();
            }}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-[14.5px] font-semibold transition hover:bg-paper"
          >
            <UserRound size={18} className="text-brand-600" /> My Profile
          </button>
          {hasBackendAdmin && <button
            role="menuitem"
            onClick={() => {
              setOpen(false);
              void onLogout();
            }}
            className="flex w-full items-center gap-3 border-t border-line px-4 py-3.5 text-left text-[14.5px] font-semibold text-red-600 transition hover:bg-red-50"
          >
            <LogOut size={18} /> Log out
          </button>}
          {!hasBackendAdmin && <div className="border-t border-line bg-paper/60 p-2">
            <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-[0.16em] text-mute">Switch account · demo</p>
            {others.map((m) => (
              <button
                key={m.id}
                role="menuitem"
                onClick={() => {
                  switchAccount(m.id);
                  setOpen(false);
                  showToast(`Now viewing as ${m.name} (${ROLES[m.role].label})`);
                }}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition hover:bg-white"
              >
                <Avatar name={m.name} src={m.avatar} size={32} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-semibold">{m.name}</span>
                  <span className="block text-[12px] text-mute">{ROLES[m.role].label}</span>
                </span>
                {m.id === me.id && <Check size={16} className="text-gold-500" />}
              </button>
            ))}
            <p className="px-3 pb-2 pt-1.5 text-[11.5px] leading-snug text-mute">Try each role to see what it can access. Real sign-in comes with the backend.</p>
          </div>}
        </div>
      )}
    </div>
  );
}

export function Admin({ onLogout }: { onLogout: () => Promise<void> }) {
  const { me, canAccessSection, showToast, isBackendAdminLoading, backendAdminError, backendAdminErrorMessage, backendAdminPermissionWarning } = useStore();
  const [sectionState, setSection] = useState<SectionId>("dashboard");
  const [addSignal, setAddSignal] = useState(0);

  const allowed = SECTIONS.filter((s) => canAccessSection(s.id));
  const fallback = SECTIONS[0];
  const menu = allowed.filter((s) => !s.hidden);
  // if the signed-in role loses access to the open section (e.g. account switch), fall back to the dashboard
  const current = allowed.find((s) => s.id === sectionState) ?? allowed[0] ?? fallback;
  const section = current.id;

  const go = (id: SectionId, add = false) => {
    if (!allowed.some((s) => s.id === id)) return showToast("Your permissions don't include that section");
    setSection(id);
    if (add) setAddSignal((n) => n + 1);
  };

  if (isBackendAdminLoading) {
    return <div role="status" className="grid h-dvh place-items-center bg-[#f1f5f3] text-[15px] font-semibold text-mute">Loading admin permissions…</div>;
  }
  if (backendAdminError) {
    return <div role="alert" className="grid h-dvh place-items-center bg-[#f1f5f3] p-6 text-center">
      <div className="rounded-3xl bg-white p-8 shadow-soft">
        <p className="font-bold">Could not verify admin permissions</p>
        <p className="mt-2 text-sm text-mute">{backendAdminErrorMessage}</p>
        <button type="button" onClick={() => void onLogout()} className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-700 px-5 py-2.5 text-sm font-bold text-white">
          <LogOut size={16} /> Back to login
        </button>
      </div>
    </div>;
  }

  return (
    <div className="relative flex h-dvh bg-[#f1f5f3] text-ink">
      {/* sidebar */}
      <aside className="hidden w-[270px] shrink-0 flex-col bg-gradient-to-b from-brand-800 to-brand-950 p-5 text-white lg:flex">
        <Logo size={42} light className="px-2 pt-2" />
        <p className="mt-1 px-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-gold-300">Admin Panel</p>
        <nav className="thin-scroll mt-7 flex-1 space-y-1 overflow-y-auto">
          {menu.map((s) => (
            <button
              key={s.id}
              onClick={() => go(s.id)}
              aria-current={section === s.id ? "page" : undefined}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-[15px] font-semibold transition",
                section === s.id ? "bg-white text-brand-800 shadow-soft" : "text-white/80 hover:bg-white/10"
              )}
            >
              <s.icon size={19} /> {s.label}
            </button>
          ))}
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-dashed border-white/25 px-4 py-3 text-[14px] font-semibold text-white/55" title="Planned for Phase 2">
            <Lock size={17} /> {FEATURES.bible.label}
            <span className="ml-auto rounded-full bg-gold-400/90 px-2 py-0.5 text-[10px] font-extrabold uppercase text-brand-950">Phase {FEATURES.bible.phase}</span>
          </div>
        </nav>
        <button
          onClick={() => go("profile")}
          className={cn("mt-3 flex items-center gap-3 rounded-2xl p-3 text-left transition", section === "profile" ? "bg-white text-brand-800" : "bg-white/10 hover:bg-white/15")}
        >
          <Avatar name={me.name} src={me.avatar} size={40} ring />
          <span className="min-w-0">
            <span className="block truncate text-[14px] font-bold leading-tight">{me.name}</span>
            <span className={cn("block text-[12px]", section === "profile" ? "text-mute" : "text-white/65")}>{me.superAdmin ? "Super Admin" : ROLES[me.role].label} · Edit profile</span>
          </span>
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* top bar */}
        <header className="relative z-20 flex items-center justify-between gap-3 border-b border-line bg-white px-5 py-2.5 lg:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <Logo size={32} />
          </div>
          <h1 className="hidden text-[20px] font-bold tracking-tight lg:block">{current.label}</h1>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <AccountMenu onProfile={() => go("profile")} onLogout={onLogout} />
          </div>
        </header>

        {/* mobile section nav */}
        <div className="no-scrollbar flex gap-2 overflow-x-auto border-b border-line bg-white px-4 py-2.5 lg:hidden">
          {menu.map((s) => (
            <button
              key={s.id}
              onClick={() => go(s.id)}
              className={cn("flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[13.5px] font-semibold", section === s.id ? "bg-brand-700 text-white" : "bg-brand-50 text-brand-800")}
            >
              <s.icon size={16} /> {s.label}
            </button>
          ))}
        </div>

        <main className="thin-scroll flex-1 overflow-y-auto px-5 py-6 lg:px-8 lg:py-8">
          {backendAdminPermissionWarning && (
            <p role="alert" className="mx-auto mb-5 max-w-5xl rounded-2xl bg-amber-50 px-4 py-3 text-[13.5px] text-amber-800">
              {backendAdminPermissionWarning}
            </p>
          )}
          {section === "dashboard" && <Dashboard go={go} />}
          {section === "users" && <UsersManager />}
          {section === "comments" && <CommentsManager />}
          {section === "notifications" && <NotificationsManager addSignal={addSignal} />}
          {section === "verses" && <VersesManager addSignal={addSignal} />}
          {section === "team" && <TeamManager />}
          {section === "profile" && <ProfileManager key={me.id} />}
          {section !== "dashboard" && section !== "users" && section !== "comments" && section !== "notifications" && section !== "verses" && section !== "team" && section !== "profile" && (
            <ContentManager key={section} kind={section} addSignal={addSignal} />
          )}
        </main>
      </div>
      <PushBanner className="!fixed !left-auto !right-5 !top-20 !inset-x-auto w-[360px] max-w-[calc(100vw-40px)]" />
      <Toast />
    </div>
  );
}

// ---- Dashboard -------------------------------------------------------------
function Dashboard({ go }: { go: (id: SectionId, add?: boolean) => void }) {
  const { me, can, canAccessSection } = useStore();
  const usersQuery = useGetUsersQuery({ page: 1, limit: 100 }, { skip: !canAccessSection("users") });
  const prayerQuery = useGetManagedContentQuery("prayer", { skip: !canAccessSection("prayers") });
  const audioQuery = useGetManagedContentQuery("audio", { skip: !canAccessSection("audio") });
  const encouragementQuery = useGetManagedContentQuery("encouragement", { skip: !canAccessSection("encouragements") });
  const teachingQuery = useGetManagedContentQuery("teaching", { skip: !canAccessSection("teachings") });
  const imageQuery = useGetManagedContentQuery("image", { skip: !canAccessSection("images") });
  const socialQuery = useGetManagedContentQuery("social-links", { skip: !canAccessSection("socials") });
  const verseQuery = useGetVersesQuery({ page: 1, limit: 100 }, { skip: !canAccessSection("verses") });
  const managedQueries = [prayerQuery, audioQuery, encouragementQuery, teachingQuery, imageQuery, socialQuery];
  const allContent = managedQueries.flatMap((query) => query.data?.data ?? []);
  const users = Array.isArray(usersQuery.data?.data)
    ? usersQuery.data.data
    : usersQuery.data?.data?.items ?? usersQuery.data?.data?.data ?? [];
  const userTotal = usersQuery.data?.pagination?.total ?? (Array.isArray(usersQuery.data?.data) ? usersQuery.data.data.length : undefined);
  const totalFor = (query: (typeof managedQueries)[number]) => query.data?.pagination?.total ?? query.data?.data.length;
  const drafts = [...allContent, ...(verseQuery.data?.data ?? [])].filter((item) => item.status === "draft").length;
  const scheduled = [...allContent, ...(verseQuery.data?.data ?? [])].filter((item) => item.status === "scheduled").length;
  const hasDashboardError = usersQuery.isError || verseQuery.isError || managedQueries.some((query) => query.isError);
  const allStats = [
    { label: "Total Users", value: userTotal, icon: UsersIcon, to: "users" as SectionId },
    { label: "Total Prayers", value: totalFor(prayerQuery), icon: PrayingHands, to: "prayers" as SectionId },
    { label: "Total Audio", value: totalFor(audioQuery), icon: Headphones, to: "audio" as SectionId },
    { label: "Total Teachings", value: totalFor(teachingQuery), icon: BookOpen, to: "teachings" as SectionId },
    { label: "Total Images", value: totalFor(imageQuery), icon: ImageIcon, to: "images" as SectionId },
  ];
  const stats = allStats.filter((s) => canAccessSection(s.to));
  const allQuick: { label: string; kind: ContentKind | "notifications"; icon: IconC }[] = [
    { label: "Add a prayer", kind: "prayers", icon: PrayingHands },
    { label: "Upload audio", kind: "audio", icon: FileAudio },
    { label: "Post an encouragement", kind: "encouragements", icon: Lightbulb },
    { label: "Add a teaching", kind: "teachings", icon: BookOpen },
    { label: "Add a verse", kind: "verses", icon: Quote },
    { label: "Upload an image", kind: "images", icon: ImageIcon },
    { label: "Send a push notification", kind: "notifications", icon: BellRing },
  ];
  const quick = allQuick.filter((q) => canAccessSection(q.kind) && (q.kind === "notifications" ? can("push.send") : can("content.edit")));
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h2 className="text-[26px] font-bold tracking-tight">Welcome back, {me.name.replace(/^(Pastor|Dr\.?|Rev\.?)\s+/i, "").split(" ")[0]} 👋</h2>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-[15px] text-mute">Here's a quick look at what's in the Living Teaching app today. {me.superAdmin ? <span className="rounded-full bg-gold-50 px-2.5 py-1 text-[12px] font-bold text-gold-700">Super Admin</span> : <RoleBadge role={me.role} />}</p>
      </div>

      <div className={cn("grid grid-cols-2 gap-4 md:grid-cols-3", stats.length >= 5 ? "xl:grid-cols-5" : "xl:grid-cols-4")}>
        {stats.map((s) => (
          <button key={s.label} onClick={() => go(s.to)} className="rounded-3xl bg-white p-5 text-left shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-brand-600"><s.icon size={22} /></span>
            <p className="mt-4 text-[32px] font-extrabold leading-none tracking-tight text-brand-800">{s.value ?? "—"}</p>
            <p className="mt-1.5 text-[13.5px] font-medium text-mute">{s.label}</p>
          </button>
        ))}
      </div>
      {hasDashboardError && <p role="alert" className="rounded-2xl bg-amber-50 px-4 py-3 text-[13.5px] text-amber-800">Some live dashboard totals could not be loaded. Check your connection and permissions.</p>}

      {quick.length > 0 && (
      <section>
        <h3 className="mb-3 text-[17px] font-bold">Quick actions</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {quick.map((q) => (
            <button key={q.label} onClick={() => go(q.kind, true)} className="flex items-center gap-3 rounded-2xl bg-white p-4 text-left text-[15px] font-semibold shadow-soft transition hover:ring-2 hover:ring-brand-300">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold-50 text-gold-600"><q.icon size={20} /></span>
              {q.label}
              <Plus size={18} className="ml-auto text-brand-500" />
            </button>
          ))}
        </div>
      </section>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow-soft">
          <h3 className="flex items-center gap-2 text-[17px] font-bold"><Sparkles size={18} className="text-gold-500" /> Needs your attention</h3>
          <div className="mt-4 space-y-3 text-[15px]">
            <div className="flex items-center justify-between rounded-2xl bg-paper px-4 py-3"><span>Drafts waiting to be published</span><b className="text-brand-700">{drafts}</b></div>
            <div className="flex items-center justify-between rounded-2xl bg-paper px-4 py-3"><span>Scheduled to go live</span><b className="text-gold-600">{scheduled}</b></div>
            {can("users.view") && <div className="flex items-center justify-between rounded-2xl bg-paper px-4 py-3"><span>Suspended accounts</span><b className="text-mute">{users.filter((u) => u.status === "suspended").length}</b></div>}
          </div>
        </div>
        <div className="rounded-3xl bg-gradient-to-br from-brand-700 to-brand-900 p-6 text-white shadow-soft">
          <h3 className="text-[17px] font-bold">Updating the app is easy</h3>
          <ol className="mt-4 space-y-3 text-[15px] text-white/90">
            {["Choose a section on the left.", "Press “Add new” and fill in the form.", "Upload a photo or audio file.", "Publish now — or pick a date to schedule."].map((t, i) => (
              <li key={t} className="flex items-center gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gold-400 text-[13px] font-extrabold text-brand-950">{i + 1}</span>{t}</li>
            ))}
          </ol>
          <p className="mt-5 rounded-2xl bg-white/10 p-3 text-[13px] text-white/75">Content is loaded from and saved to the backend.</p>
        </div>
      </div>
    </div>
  );
}

// ---- helpers ---------------------------------------------------------------
function StatusBadge({ item }: { item: Base }) {
  const map: Record<Status, string> = {
    published: "bg-emerald-50 text-emerald-700",
    draft: "bg-slate-100 text-slate-600",
    scheduled: "bg-gold-50 text-gold-600",
  };
  const label = item.status === "scheduled" ? `Scheduled · ${prettyDate(item.publishAt ?? today())}` : item.status[0].toUpperCase() + item.status.slice(1);
  return <span className={cn("inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-bold", map[item.status])}>{label}</span>;
}

// ---- content manager -------------------------------------------------------
type Form = Record<string, unknown> & Partial<Base>;
type ContentEntry = Form & { id: string; status: Status };

const CONTENT_RESOURCE: Record<Exclude<ContentKind, "verses">, ManagedContentResource> = {
  prayers: "prayer",
  audio: "audio",
  encouragements: "encouragement",
  teachings: "teaching",
  images: "image",
  socials: "social-links",
};

function contentResource(kind: ContentKind): ManagedContentResource {
  return kind === "verses" ? "prayer" : CONTENT_RESOURCE[kind];
}

function textValue(record: ManagedContentRecord, key: string) {
  const value = record[key];
  return typeof value === "string" ? value : "";
}

function normalizeContent(kind: ContentKind, record: ManagedContentRecord): ContentEntry {
  const scheduledDate = textValue(record, "scheduled_date") || textValue(record, "date");
  const status: Status = record.status === "draft" || record.status === "scheduled" ? record.status : "published";
  const common = {
    id: String(record._id ?? record.id ?? ""),
    status,
    publishAt: scheduledDate.slice(0, 10),
  };
  switch (kind) {
    case "prayers":
      return {
        ...common,
        title: textValue(record, "title"),
        desc: textValue(record, "description"),
        text: textValue(record, "prayer"),
        image: textValue(record, "coverImage"),
        audio: textValue(record, "audio"),
        audioName: textValue(record, "audio"),
        duration: Number(record.duration) || 0,
      };
    case "audio":
      return {
        ...common,
        title: textValue(record, "title"),
        desc: textValue(record, "description"),
        category: textValue(record, "category"),
        image: textValue(record, "coverImage"),
        audio: textValue(record, "audio"),
        audioName: textValue(record, "audio"),
        duration: Number(record.duration) || 0,
      };
    case "teachings":
      return {
        ...common,
        title: textValue(record, "name"),
        body: textValue(record, "prayer"),
        image: textValue(record, "coverImage"),
        audio: textValue(record, "audio"),
        audioName: textValue(record, "audio"),
      };
    case "encouragements":
      return {
        ...common,
        quote: textValue(record, "message"),
        author: textValue(record, "author"),
        date: (textValue(record, "date") || scheduledDate).slice(0, 10),
        image: textValue(record, "photo"),
      };
    case "images":
      return {
        ...common,
        title: textValue(record, "title"),
        category: textValue(record, "category"),
        caption: textValue(record, "caption"),
        image: textValue(record, "image"),
      };
    case "socials":
      return {
        id: String(record._id ?? record.id ?? ""),
        status: "published",
        network: textValue(record, "network"),
        label: textValue(record, "displayName"),
        url: textValue(record, "url"),
      };
    case "verses":
      return { id: "", status: "draft" };
  }
}

function contentPayload(kind: ContentKind, item: Form): FormData | Record<string, string> {
  if (kind === "socials") {
    return {
      network: String(item.network ?? ""),
      displayName: String(item.label ?? ""),
      url: String(item.url ?? ""),
    };
  }

  const fields: Record<Exclude<ContentKind, "verses" | "socials">, Record<string, string>> = {
    prayers: { title: "title", desc: "description", text: "prayer", audio: "audio" },
    audio: { title: "title", desc: "description", category: "category", audio: "audio" },
    teachings: { title: "name", body: "prayer", audio: "audio" },
    encouragements: { author: "author", quote: "message" },
    images: { title: "title", category: "category", caption: "caption" },
  };
  const body = new FormData();
  for (const [formKey, apiKey] of Object.entries(fields[kind as keyof typeof fields])) {
    const value = item[formKey];
    if (value !== undefined && value !== null && String(value) !== "") body.append(apiKey, String(value));
  }

  const status = String(item.status ?? "published");
  body.append("status", status);
  if (kind === "encouragements") {
    const date = status === "scheduled" ? item.publishAt : item.date;
    if (date) body.append("scheduled_date", String(date));
    if (status === "scheduled") body.append("scheduled_time", String(item.scheduledTime ?? "09:00"));
  } else if (status === "scheduled") {
    if (item.publishAt) body.append("scheduled_date", String(item.publishAt));
    body.append("scheduled_time", String(item.scheduledTime ?? "09:00"));
  }

  const imageFile = item.imageUpload;
  if (imageFile instanceof File) body.append("image", imageFile);
  else if (item.image && !String(item.image).startsWith("data:")) body.append("image", String(item.image));

  return body;
}

function ContentManager({ kind, addSignal }: { kind: ContentKind; addSignal: number }) {
  const { showToast, can, me } = useStore();
  const canEdit = can("content.edit");
  const canPublish = can("content.publish");
  const cfg = CONFIG[kind];
  const resource = contentResource(kind);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"All" | Status>("All");
  const [editing, setEditing] = useState<Form | null>(() => (addSignal > 0 && can("content.edit") ? { ...cfg.blank(), status: "published" } : null));
  const [viewing, setViewing] = useState<ContentEntry | null>(null);
  const [deleting, setDeleting] = useState<{ id: string; title: string } | null>(null);
  const { data, isLoading, isFetching, isError, refetch } = useGetManagedContentQuery(resource, { skip: kind === "verses" });
  const [createContent] = useCreateManagedContentMutation();
  const [updateContent] = useUpdateManagedContentMutation();
  const [deleteContent] = useDeleteManagedContentMutation();
  const items: ContentEntry[] = (data?.data ?? []).map((record) => normalizeContent(kind, record));
  const list = useMemo(
    () =>
      items.filter(
        (i) =>
          (filter === "All" || i.status === filter) &&
          (q.trim() === "" || (cfg.title(i) + " " + cfg.sub(i)).toLowerCase().includes(q.trim().toLowerCase()))
      ),
    [items, q, filter, cfg]
  );
  const saveItem = async (item: Form) => {
    const id = item.id;
    const body = contentPayload(kind, item);
    try {
      if (id) await updateContent({ resource, id, body }).unwrap();
      else await createContent({ resource, body }).unwrap();
      setEditing(null);
      showToast(id ? "Content updated" : "Content created");
    } catch (error) {
      showToast(getContentError(error, id ? "Could not update content" : "Could not create content"));
    }
  };
  const deleteItem = async () => {
    if (!deleting) return;
    try {
      await deleteContent({ resource, id: deleting.id }).unwrap();
      setDeleting(null);
      showToast("Deleted");
    } catch (error) {
      showToast(getContentError(error, "Could not delete content"));
    }
  };
  const togglePublished = async (item: Form) => {
    try {
      await updateContent({
        resource,
        id: String(item.id),
        body: contentPayload(kind, { ...item, status: item.status === "published" ? "draft" : "published" }),
      }).unwrap();
      showToast(item.status === "published" ? "Unpublished — hidden from the app" : "Published — now live in the app");
    } catch (error) {
      showToast(getContentError(error, "Could not update publishing status"));
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-[26px] font-bold tracking-tight">{cfg.label}</h2>
          <p className="mt-1 text-[15px] text-mute">{cfg.hint}</p>
        </div>
        {canEdit && (
          <button onClick={() => setEditing({ ...cfg.blank(), status: "published" })} className="flex items-center gap-2 rounded-full bg-brand-700 px-6 py-3.5 text-[15px] font-bold text-white shadow-lift transition hover:bg-brand-800 active:scale-95">
            <Plus size={19} /> Add new {cfg.singular.toLowerCase()}
          </button>
        )}
      </div>
      {!canEdit && (
        <p className="mt-4 flex items-start gap-3 rounded-2xl bg-sky-50 p-4 text-[14px] text-sky-800">
          <Info size={18} className="mt-0.5 shrink-0" />
          <span>
            As a <b>{ROLES[me.role].label}</b> you can {canPublish ? "publish or unpublish content, but not add, edit or delete it." : "view this content."}
          </span>
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex min-w-[220px] flex-1 items-center gap-2.5 rounded-full bg-white px-4 ring-1 ring-line focus-within:ring-2 focus-within:ring-brand-500">
          <Search size={18} className="text-brand-500" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${cfg.label.toLowerCase()}`} className="w-full bg-transparent py-3 text-[15px] outline-none" />
        </div>
        {kind !== "socials" && <div className="flex gap-1.5 rounded-full bg-white p-1 ring-1 ring-line">
          {(["All", "published", "draft", "scheduled"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={cn("rounded-full px-3.5 py-2 text-[13px] font-bold capitalize", filter === f ? "bg-brand-700 text-white" : "text-mute")}>
              {f}
            </button>
          ))}
        </div>}
      </div>

      {isError ? (
        <div role="alert" className="mt-5 rounded-3xl bg-white p-10 text-center shadow-soft">
          <p className="text-[16px] font-semibold">{cfg.label} could not be loaded</p>
          <p className="mt-1 text-[14px] text-mute">Check your connection and admin access, then try again.</p>
          <button type="button" onClick={() => void refetch()} className="mt-4 rounded-full bg-brand-700 px-5 py-2.5 font-bold text-white">Retry</button>
        </div>
      ) : isLoading ? (
        <p role="status" className="mt-8 rounded-3xl bg-white p-10 text-center text-[15px] text-mute shadow-soft">Loading {cfg.label.toLowerCase()}…</p>
      ) : <div className={cn("mt-5 space-y-3", isFetching && "opacity-60")} aria-busy={isFetching}>
        {list.length === 0 && (
          <div className="rounded-3xl bg-white p-12 text-center shadow-soft">
            <p className="text-[16px] font-semibold">Nothing here yet</p>
            <p className="mt-1 text-[14px] text-mute">{canEdit ? `Press “Add new ${cfg.singular.toLowerCase()}” to create your first one.` : "Nothing has been added yet."}</p>
          </div>
        )}
        {list.map((i) => {
          const thumb = cfg.thumb(i);
          const on = i.status === "published";
          return (
            <div key={i.id} className="flex flex-col gap-4 rounded-3xl bg-white p-3.5 shadow-soft sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-4">
                {thumb && kind === "images" ? (
                  <button
                    type="button"
                    onClick={() => setViewing(i)}
                    aria-label={`View image ${cfg.title(i)}`}
                    className="shrink-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <Img src={resolveFileUrl(thumb)} className="h-[68px] w-[68px] rounded-2xl" />
                  </button>
                ) : thumb ? (
                  <Img src={resolveFileUrl(thumb)} className="h-[68px] w-[68px] shrink-0 rounded-2xl" />
                ) : (
                  <span className="grid h-[68px] w-[68px] shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-800 text-white"><SocialIcon network={String(i.network ?? "")} size={28} /></span>
                )}
                <div className="min-w-0">
                  <h3 className="line-clamp-2 text-[15.5px] font-bold leading-snug">{cfg.title(i)}</h3>
                  <p className="mt-0.5 truncate text-[13px] text-mute">{cfg.sub(i)}</p>
                  <div className="mt-1.5"><StatusBadge item={i} /></div>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => setViewing(i)}
                  aria-label={`View details for ${cfg.title(i)}`}
                  className="flex items-center gap-1.5 rounded-full bg-brand-50 px-3.5 py-2.5 text-[13px] font-bold text-brand-700 transition hover:bg-brand-100"
                >
                  <Eye size={16} /> Details
                </button>
                {canPublish && kind !== "socials" && <button
                  onClick={() => void togglePublished(i)}
                  className={cn("flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[13.5px] font-bold transition", on ? "bg-slate-100 text-slate-700 hover:bg-slate-200" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100")}
                >
                  {on ? <EyeOff size={16} /> : <Eye size={16} />} {on ? "Unpublish" : "Publish"}
                </button>}
                {canEdit && <button onClick={() => setEditing({ ...i })} aria-label="Edit" className="grid h-10 w-10 place-items-center rounded-full bg-brand-50 text-brand-700 transition hover:bg-brand-100"><Pencil size={17} /></button>}
                {canEdit && <button onClick={() => setDeleting({ id: i.id, title: cfg.title(i) })} aria-label="Delete" className="grid h-10 w-10 place-items-center rounded-full bg-red-50 text-red-600 transition hover:bg-red-100"><Trash2 size={17} /></button>}
              </div>
            </div>
          );
        })}
      </div>}

      {editing && (
        <Editor
          kind={kind}
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={saveItem}
        />
      )}
      {viewing && (
        <ContentDetails
          kind={kind}
          item={viewing}
          onClose={() => setViewing(null)}
          onEdit={canEdit ? () => {
            setEditing({ ...viewing });
            setViewing(null);
          } : undefined}
        />
      )}
      {deleting && (
        <ConfirmDelete
          what={deleting.title}
          onCancel={() => setDeleting(null)}
          onConfirm={() => void deleteItem()}
        />
      )}
    </div>
  );
}

function ContentDetails({
  kind,
  item,
  onClose,
  onEdit,
}: {
  kind: ContentKind;
  item: ContentEntry;
  onClose: () => void;
  onEdit?: () => void;
}) {
  const cfg = CONFIG[kind];
  const image = cfg.thumb(item);
  const audio = typeof item.audio === "string" ? item.audio : "";
  const audioUrl = resolveAudioUrl(audio);
  const bodyKeys: Partial<Record<ContentKind, string[]>> = {
    prayers: ["desc", "text"],
    audio: ["desc", "category"],
    encouragements: ["author", "date", "quote"],
    teachings: ["body"],
    images: ["category", "caption"],
    socials: ["network", "label", "url"],
  };
  const fields = bodyKeys[kind] ?? [];
  const labels: Record<string, string> = {
    desc: "Description",
    text: "Prayer",
    category: "Category",
    author: "Author",
    date: "Date",
    quote: "Message",
    body: "Teaching",
    caption: "Caption",
    network: "Network",
    label: "Display name",
    url: "Link",
  };

  return (
    <Modal title={cfg.title(item)} onClose={onClose} wide className="max-w-3xl">
      <div className="thin-scroll space-y-5 overflow-y-auto p-5 sm:p-6">
        {image && (
          <div className="overflow-hidden rounded-2xl bg-brand-950">
            <img
              src={resolveFileUrl(image)}
              alt={cfg.title(item)}
              className="mx-auto max-h-[60vh] w-full object-contain"
            />
          </div>
        )}
        {audioUrl && (
          <div className="rounded-2xl bg-white p-4 ring-1 ring-line">
            <p className="mb-2 flex items-center gap-2 text-[13px] font-bold text-ink">
              <Headphones size={17} className="text-brand-600" /> Audio preview
            </p>
            <audio controls preload="metadata" src={audioUrl} className="w-full">
              Your browser does not support audio playback.
            </audio>
          </div>
        )}
        {fields.map((key) => {
          const value = item[key];
          if (value === undefined || value === null || String(value).trim() === "") return null;
          return (
            <section key={key}>
              <h3 className="mb-1 text-[12px] font-bold uppercase tracking-wider text-mute">{labels[key] ?? key}</h3>
              {key === "url" ? (
                <a href={String(value)} target="_blank" rel="noreferrer" className="break-all text-[14px] font-semibold text-brand-700 underline">
                  {String(value)}
                </a>
              ) : (
                <p className="whitespace-pre-wrap text-[14.5px] leading-relaxed text-ink/90">{String(value)}</p>
              )}
            </section>
          );
        })}
        <div className="border-t border-line pt-4">
          <StatusBadge item={item} />
        </div>
      </div>
      <div className="flex justify-end gap-3 border-t border-line bg-white px-5 py-4 sm:px-6">
        <button type="button" onClick={onClose} className="rounded-full bg-paper px-6 py-3 font-bold text-ink ring-1 ring-line">Close</button>
        {onEdit && <button type="button" onClick={onEdit} className="flex items-center gap-2 rounded-full bg-brand-700 px-6 py-3 font-bold text-white"><Pencil size={16} /> Edit</button>}
      </div>
    </Modal>
  );
}

function getContentError(error: unknown, fallback: string) {
  if (!error || typeof error !== "object") return fallback;
  const data = "data" in error ? error.data : undefined;
  if (data && typeof data === "object" && "message" in data && typeof data.message === "string") return data.message;
  if ("message" in error && typeof error.message === "string") return error.message;
  return fallback;
}

function Editor({ kind, initial, onClose, onSave }: { kind: ContentKind; initial: Form; onClose: () => void; onSave: (i: Form & Base) => void }) {
  const cfg = CONFIG[kind];
  const isNew = !initial.id;
  const [form, setForm] = useState<Form>(initial);
  const [status, setStatus] = useState<Status>((initial.status as Status) ?? "published");
  const [publishAt, setPublishAt] = useState<string>((initial.publishAt as string) ?? today());
  const [scheduledTime, setScheduledTime] = useState<string>(String(initial.scheduledTime ?? "09:00"));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [audioUploading, setAudioUploading] = useState(false);
  const set = (patch: Form) => setForm((f) => ({ ...f, ...patch }));

  const submit = async () => {
    const e: Record<string, string> = {};
    cfg.fields.forEach((f) => {
      if (f.required && !String(form[f.key] ?? "").trim()) e[f.key] = f.type === "image" ? "Please add an image" : "This field is needed";
    });
    setErrors(e);
    if (Object.keys(e).length || audioUploading) return;
    setSaving(true);
    try {
      await onSave({
        ...form,
        status: kind === "socials" ? "published" : status,
        publishAt: status === "scheduled" ? publishAt : undefined,
        scheduledTime,
      } as Form & Base);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={`${isNew ? "Add" : "Edit"} ${cfg.singular.toLowerCase()}`} onClose={onClose} wide>
      <div className="thin-scroll flex-1 space-y-5 overflow-y-auto p-6">
        {cfg.fields.map((f) => (
          <FieldInput
            key={f.key}
            f={f}
            form={form}
            set={set}
            error={errors[f.key]}
            onBusyChange={f.type === "audio" ? setAudioUploading : undefined}
          />
        ))}

        {kind !== "socials" && <fieldset className="rounded-2xl bg-white p-4 ring-1 ring-line">
          <legend className="px-1 text-[13px] font-bold text-ink">When should it appear in the app?</legend>
          <div className="mt-1 grid gap-2 sm:grid-cols-3">
            {([["published", "Publish now"], ["draft", "Save as draft"], ["scheduled", "Schedule"]] as const).map(([v, l]) => (
              <button key={v} type="button" onClick={() => setStatus(v)} className={cn("flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-[14px] font-bold transition", status === v ? "bg-brand-700 text-white" : "bg-paper text-mute hover:bg-brand-50")}>
                {v === "scheduled" && <Calendar size={16} />} {l}
              </button>
            ))}
          </div>
          {status === "scheduled" && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label>
                <span className="mb-1.5 block text-[13px] font-semibold">Go live on</span>
                <input type="date" value={publishAt} min={today()} onChange={(e) => setPublishAt(e.target.value)} className={inputCls} />
              </label>
              <label>
                <span className="mb-1.5 block text-[13px] font-semibold">Go live at</span>
                <input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} className={inputCls} />
              </label>
            </div>
          )}
        </fieldset>}
      </div>
      <div className="flex gap-3 border-t border-line bg-white px-6 py-4">
        <button onClick={onClose} className="rounded-full bg-paper px-6 py-3.5 font-bold text-ink ring-1 ring-line">Cancel</button>
        <button disabled={saving || audioUploading} onClick={() => void submit()} className="flex-1 rounded-full bg-brand-700 py-3.5 text-[15px] font-bold text-white shadow-soft transition hover:bg-brand-800 disabled:cursor-wait disabled:opacity-60">
          {audioUploading ? "Uploading audio…" : saving ? "Saving…" : status === "published" ? "Save & publish" : status === "scheduled" ? "Save & schedule" : "Save draft"}
        </button>
      </div>
    </Modal>
  );
}

function FieldInput({ f, form, set, error, onBusyChange }: { f: Field; form: Form; set: (p: Form) => void; error?: string; onBusyChange?: (busy: boolean) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const { showToast } = useStore();
  const val = form[f.key];

  let control: ReactNode = null;
  switch (f.type) {
    case "text":
      control = <input value={String(val ?? "")} onChange={(e) => set({ [f.key]: e.target.value })} placeholder={f.placeholder} className={inputCls} />;
      break;
    case "textarea":
      control = <textarea rows={f.key === "body" || f.key === "text" ? 7 : 3} value={String(val ?? "")} onChange={(e) => set({ [f.key]: e.target.value })} placeholder={f.placeholder} className={cn(inputCls, "resize-y leading-relaxed")} />;
      break;
    case "select":
      control = (
        <select value={String(val ?? "")} onChange={(e) => set({ [f.key]: e.target.value })} className={inputCls}>
          {f.options?.map((o) => <option key={o}>{o}</option>)}
        </select>
      );
      break;
    case "number":
      control = <input type="number" min={1} value={Number(val ?? 0)} onChange={(e) => set({ [f.key]: Number(e.target.value) })} className={inputCls} />;
      break;
    case "date":
      control = <input type="date" value={String(val ?? "")} onChange={(e) => set({ [f.key]: e.target.value })} className={inputCls} />;
      break;
    case "image":
      control = (
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="grid h-28 w-full shrink-0 place-items-center overflow-hidden rounded-2xl bg-white ring-1 ring-line sm:w-40">
            {val ? <Img src={String(val).startsWith("data:") || String(val).startsWith("blob:") ? String(val) : resolveFileUrl(String(val))} className="h-full w-full" /> : <ImageIcon size={30} className="text-brand-300" />}
          </div>
          <div className="flex-1 space-y-2">
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setBusy(true);
              try {
                set({ [f.key]: await resizeImage(file), imageUpload: file });
              } catch {
                showToast("The selected image could not be read");
              } finally {
                setBusy(false);
              }
            }} />
            <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-2 rounded-full bg-brand-50 px-5 py-3 text-[14px] font-bold text-brand-700 transition hover:bg-brand-100">
              <Upload size={17} /> {busy ? "Preparing…" : val ? "Replace image" : "Upload image"}
            </button>
            <input value={String(val ?? "").startsWith("data:") ? "" : String(val ?? "")} onChange={(e) => set({ [f.key]: e.target.value, imageUpload: undefined })} placeholder="…or paste an image link" className={cn(inputCls, "py-2.5 text-[13.5px]")} />
          </div>
        </div>
      );
      break;
    case "audio": {
      const audioPath = typeof val === "string" ? val : "";
      const audioUrl = resolveAudioUrl(audioPath);
      control = (
        <div className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-line">
          {audioUrl && (
            <audio controls preload="metadata" src={audioUrl} className="w-full">
              Your browser does not support audio playback.
            </audio>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={fileRef}
              type="file"
              accept="audio/*,.mp3,.m4a,.wav"
              hidden
              onChange={async (event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file) return;
                setBusy(true);
                onBusyChange?.(true);
                setProgress(0);
                setUploadError("");
                try {
                  const path = await uploadFileInChunks(file, {
                    onProgress: setProgress,
                  });
                  set({ audio: path, audioName: file.name });
                } catch (uploadFailure) {
                  const message = uploadFailure instanceof Error ? uploadFailure.message : "Audio upload failed.";
                  setUploadError(message);
                  showToast(message);
                } finally {
                  setBusy(false);
                  onBusyChange?.(false);
                }
              }}
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 rounded-full bg-brand-50 px-5 py-3 text-[14px] font-bold text-brand-700 transition hover:bg-brand-100 disabled:cursor-wait disabled:opacity-60"
            >
              <Upload size={17} /> {busy ? `Uploading… ${progress}%` : audioPath ? "Replace audio" : "Upload audio"}
            </button>
            <span className="min-w-0 truncate text-[13px] text-mute">
              {busy ? "Uploading file in chunks…" : audioPath ? String(form.audioName ?? audioPath.split("/").pop()) : "No audio selected"}
            </span>
          </div>
          {busy && (
            <div className="h-2 overflow-hidden rounded-full bg-paper" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
          {uploadError && <p role="alert" className="text-[12.5px] font-semibold text-red-600">{uploadError}</p>}
        </div>
      );
      break;
    }
  }
  return (
    <div>
      <span className="mb-1.5 block text-[13.5px] font-bold text-ink">
        {f.label} {f.required && <span className="text-gold-600">*</span>}
      </span>
      {control}
      {f.help && !error && <span className="mt-1 block text-[12.5px] text-mute">{f.help}</span>}
      {error && <span className="mt-1 block text-[12.5px] font-semibold text-red-600">{error}</span>}
    </div>
  );
}
