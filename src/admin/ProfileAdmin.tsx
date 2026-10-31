import { useRef, useState, type ReactNode } from "react";
import { Camera, Check, Eye, EyeOff, KeyRound, Lock, Mail, Phone, ShieldCheck, Trash2, UserRound, X } from "lucide-react";
import { CAPABILITIES, ROLES, roleCan } from "../data/team";
import { prettyDate } from "../data/content";
import { useStore } from "../store";
import { cn } from "../utils/cn";
import { Avatar, cropSquare, inputCls } from "./shared";

const emailOk = (e: string) => /^\S+@\S+\.\S+$/.test(e);

function Card({ title, icon, children, sub }: { title: string; icon: ReactNode; children: ReactNode; sub?: string }) {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-soft sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">{icon}</span>
        <div>
          <h3 className="text-[17px] font-bold leading-tight">{title}</h3>
          {sub && <p className="text-[13px] text-mute">{sub}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function Field({ label, error, children, hint }: { label: string; error?: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13.5px] font-bold text-ink">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-[12.5px] text-mute">{hint}</span>}
      {error && <span className="mt-1 block text-[12.5px] font-semibold text-red-600">{error}</span>}
    </label>
  );
}

export function ProfileManager() {
  const { me, team, updateMember, showToast, can, canAccessSection, hasBackendAdmin } = useStore();
  const [f, setF] = useState({ name: me.name, email: me.email, phone: me.phone ?? "", title: me.title ?? "", bio: me.bio ?? "", avatar: me.avatar });
  const [err, setErr] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const dirty =
    f.name !== me.name || f.email !== me.email || f.phone !== (me.phone ?? "") || f.title !== (me.title ?? "") || f.bio !== (me.bio ?? "") || f.avatar !== me.avatar;
  const role = ROLES[me.role];
  const set = (p: Partial<typeof f>) => setF((x) => ({ ...x, ...p }));

  const save = () => {
    const e: Record<string, string> = {};
    if (f.name.trim().length < 2) e.name = "Please enter your name";
    if (!emailOk(f.email.trim())) e.email = "Please enter a valid email";
    else if (team.some((m) => m.id !== me.id && m.email.toLowerCase() === f.email.trim().toLowerCase())) e.email = "Another team member already uses this email";
    setErr(e);
    if (Object.keys(e).length) return;
    updateMember(me.id, { name: f.name.trim(), email: f.email.trim(), phone: f.phone.trim() || undefined, title: f.title.trim() || undefined, bio: f.bio.trim() || undefined, avatar: f.avatar });
    showToast("Profile updated");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-[26px] font-bold tracking-tight">My Profile</h2>
        <p className="mt-1 text-[15px] text-mute">Update your personal details, photo and password.</p>
      </div>

      {/* identity banner */}
      <div className="flex flex-wrap items-center gap-5 rounded-[28px] bg-gradient-to-br from-brand-700 to-brand-900 p-5 text-white shadow-lift sm:p-6">
        <div className="relative">
          <Avatar name={f.name || me.name} src={f.avatar} size={92} className="!ring-[3px] !ring-gold-300" />
          <button
            onClick={() => fileRef.current?.click()}
            aria-label="Change photo"
            className="absolute -bottom-1 -right-1 grid h-9 w-9 place-items-center rounded-full bg-gold-400 text-brand-950 shadow-lift transition hover:bg-gold-300"
          >
            <Camera size={17} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              setBusy(true);
              try {
                set({ avatar: await cropSquare(file) });
              } catch {
                showToast("That photo couldn't be read — try a JPG or PNG");
              } finally {
                setBusy(false);
              }
            }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[22px] font-bold leading-tight">{f.name || me.name}</h3>
          <p className="truncate text-[14.5px] text-white/75">{f.title || role.label} · {f.email || me.email}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-gold-400 px-3 py-1 text-[12px] font-extrabold uppercase tracking-wider text-brand-950">{role.label}</span>
            <span className="text-[12.5px] text-white/65">Team member since {prettyDate(me.addedAt)}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => fileRef.current?.click()} className="rounded-full bg-white/15 px-4 py-2.5 text-[13.5px] font-bold backdrop-blur transition hover:bg-white/25">
            {busy ? "Preparing…" : f.avatar ? "Replace photo" : "Upload photo"}
          </button>
          {f.avatar && (
            <button onClick={() => set({ avatar: undefined })} aria-label="Remove photo" className="grid h-10 w-10 place-items-center rounded-full bg-white/15 transition hover:bg-red-500/70">
              <Trash2 size={17} />
            </button>
          )}
        </div>
      </div>

      <Card title="Personal information" icon={<UserRound size={20} />}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" error={err.name}>
            <input value={f.name} onChange={(e) => set({ name: e.target.value })} className={inputCls} autoComplete="name" />
          </Field>
          <Field label="Job title" hint="Shown to your team, e.g. Content Editor">
            <input value={f.title} onChange={(e) => set({ title: e.target.value })} className={inputCls} placeholder="e.g. Content Editor" />
          </Field>
          <Field label="Email" error={err.email}>
            <div className="relative">
              <Mail size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brand-500" />
              <input type="email" value={f.email} onChange={(e) => set({ email: e.target.value })} className={cn(inputCls, "pl-11")} autoComplete="email" />
            </div>
          </Field>
          <Field label="Phone (optional)">
            <div className="relative">
              <Phone size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brand-500" />
              <input type="tel" value={f.phone} onChange={(e) => set({ phone: e.target.value })} className={cn(inputCls, "pl-11")} placeholder="+1 555 123 4567" autoComplete="tel" />
            </div>
          </Field>
          <div className="sm:col-span-2">
            <Field label="About you (optional)">
              <textarea rows={3} maxLength={240} value={f.bio} onChange={(e) => set({ bio: e.target.value })} className={cn(inputCls, "resize-none leading-relaxed")} placeholder="A short line about your role in the ministry." />
            </Field>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
          {dirty && (
            <button
              onClick={() => {
                setF({ name: me.name, email: me.email, phone: me.phone ?? "", title: me.title ?? "", bio: me.bio ?? "", avatar: me.avatar });
                setErr({});
              }}
              className="rounded-full bg-paper px-5 py-3 text-[14.5px] font-bold ring-1 ring-line"
            >
              Discard changes
            </button>
          )}
          <button
            onClick={save}
            disabled={!dirty}
            className="flex items-center gap-2 rounded-full bg-brand-700 px-7 py-3 text-[14.5px] font-bold text-white shadow-soft transition enabled:hover:bg-brand-800 enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Check size={17} /> Save changes
          </button>
        </div>
      </Card>

      <PasswordCard />

      <Card
        title="Your role & permissions"
        icon={<ShieldCheck size={20} />}
        sub={hasBackendAdmin
          ? me.superAdmin ? "Super admins can access every dashboard section." : "Access is based on permissions assigned to your admin account."
          : role.desc}
      >
        <ul className="grid gap-2 sm:grid-cols-2">
          {CAPABILITIES.map((c) => {
            const yes = hasBackendAdmin
              ? c.perm === "view"
                ? ["dashboard", "prayers", "audio", "encouragements", "teachings", "verses", "images", "socials"].some(canAccessSection)
                : can(c.perm)
              : roleCan(me.role, c.perm);
            return (
              <li key={c.label} className={cn("flex items-center gap-3 rounded-2xl px-4 py-3 text-[14px]", yes ? "bg-emerald-50/70 font-semibold text-ink" : "bg-paper text-mute")}>
                <span className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-full", yes ? "bg-emerald-500 text-white" : "bg-line text-mute")}>
                  {yes ? <Check size={14} strokeWidth={3} /> : <X size={13} strokeWidth={3} />}
                </span>
                {c.label}
              </li>
            );
          })}
        </ul>
        <p className="mt-4 text-[13px] text-mute">Your role is set by an Admin. To request different access, ask your ministry administrator.</p>
      </Card>
    </div>
  );
}

function PasswordCard() {
  const { showToast } = useStore();
  const [f, setF] = useState({ cur: "", next: "", again: "" });
  const [show, setShow] = useState(false);
  const [err, setErr] = useState<Record<string, string>>({});

  const strength = (() => {
    const p = f.next;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
    if (/\d/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p) || p.length >= 12) s++;
    return p ? Math.max(1, s) : 0;
  })();
  const sLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];

  const submit = () => {
    const e: Record<string, string> = {};
    if (!f.cur) e.cur = "Please enter your current password";
    if (f.next.length < 8) e.next = "Use at least 8 characters";
    if (f.again !== f.next) e.again = "Passwords do not match";
    setErr(e);
    if (Object.keys(e).length) return;
    setF({ cur: "", next: "", again: "" });
    showToast("Password changed");
  };

  const pw = (k: keyof typeof f, label: string, auto: string) => (
    <Field label={label} error={err[k]}>
      <div className="relative">
        <Lock size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brand-500" />
        <input type={show ? "text" : "password"} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} autoComplete={auto} className={cn(inputCls, "pl-11")} />
      </div>
    </Field>
  );

  return (
    <Card title="Password" icon={<KeyRound size={20} />} sub="Choose a strong password you don't use anywhere else.">
      <div className="grid gap-4 sm:grid-cols-3">
        {pw("cur", "Current password", "current-password")}
        {pw("next", "New password", "new-password")}
        {pw("again", "Confirm new password", "new-password")}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex gap-1" aria-hidden>
            {[1, 2, 3, 4].map((i) => (
              <span key={i} className={cn("h-1.5 w-9 rounded-full", i <= strength ? (strength <= 1 ? "bg-red-400" : strength === 2 ? "bg-gold-400" : "bg-emerald-500") : "bg-line")} />
            ))}
          </div>
          <span className="text-[12.5px] font-semibold text-mute">{sLabel}</span>
        </div>
        <button type="button" onClick={() => setShow((s) => !s)} className="flex items-center gap-1.5 text-[13px] font-semibold text-brand-600">
          {show ? <EyeOff size={16} /> : <Eye size={16} />} {show ? "Hide" : "Show"} passwords
        </button>
      </div>
      <div className="mt-4 flex justify-end">
        <button onClick={submit} className="rounded-full bg-brand-700 px-7 py-3 text-[14.5px] font-bold text-white shadow-soft transition hover:bg-brand-800 active:scale-95">
          Update password
        </button>
      </div>
    </Card>
  );
}
