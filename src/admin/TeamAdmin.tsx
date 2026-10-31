import { useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Pencil, Search, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { type AdminRecord, useCreateAdminMutation, useDeleteAdminMutation, useGetAdminsQuery, useUpdateAdminMutation } from "../api-client";
import { prettyDate } from "../data/content";
import { ROLES, type Role } from "../data/team";
import { useStore } from "../store";
import { cn } from "../utils/cn";
import { Avatar, ConfirmDelete, Modal, inputCls } from "./shared";

const PAGE_SIZE = 10;
const SUBROLES = ["Admin", "Editor", "Moderator"] as const;
const PERMISSIONS = [
  { code: "DASHBOARD_READ", label: "Dashboard" },
  { code: "PRAYER_READ", label: "Prayers" },
  { code: "AUDIO_READ", label: "Audio" },
  { code: "ENCOURAGEMENT_READ", label: "Encouragements" },
  { code: "TEACHING_READ", label: "Teachings" },
  { code: "VERSE_READ", label: "Verses" },
  { code: "IMAGE_READ", label: "Images" },
  { code: "SOCIAL_READ", label: "Social links" },
  { code: "NOTIFICATION_READ", label: "Push notifications" },
  { code: "USER_READ", label: "Users" },
  { code: "COMMENT_READ", label: "Comments" },
  { code: "ADMIN_READ", label: "Team & roles" },
  { code: "USER_CREATE", label: "Add and manage users" },
  { code: "USER_UPDATE", label: "Update user accounts" },
  { code: "USER_DELETE", label: "Delete user accounts" },
  { code: "NOTIFICATION_CREATE", label: "Send notifications" },
  { code: "CONTENT_EDIT", label: "Create and edit content" },
  { code: "CONTENT_PUBLISH", label: "Publish content" },
  { code: "ADMIN_CREATE", label: "Create admins" },
  { code: "ADMIN_UPDATE", label: "Update admins" },
  { code: "ADMIN_DELETE", label: "Delete admins" },
] as const;

type AdminFormData = {
  name: string;
  email: string;
  password: string;
  subrole: string;
  status: string;
  permissions: string[];
};

const recordId = (admin: AdminRecord) => admin._id ?? admin.id ?? "";
const adminRole = (admin: AdminRecord): Role => {
  const subrole = admin.subrole?.toLowerCase();
  return subrole === "editor" || subrole === "moderator" ? subrole : "admin";
};

function getErrorMessage(error: unknown, fallback: string) {
  if (!error || typeof error !== "object") return fallback;
  if ("data" in error && error.data && typeof error.data === "object" && "message" in error.data && typeof error.data.message === "string") {
    return error.data.message;
  }
  if ("message" in error && typeof error.message === "string") return error.message;
  return fallback;
}

export function RoleBadge({ role, className }: { role: Role; className?: string }) {
  return <span className={cn("inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-bold", ROLES[role].badge, className)}>{ROLES[role].label}</span>;
}

export function TeamManager() {
  const { me, can, showToast } = useStore();
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<AdminRecord | "new" | null>(null);
  const [deleting, setDeleting] = useState<AdminRecord | null>(null);
  const { data, isLoading, isFetching, isError, refetch } = useGetAdminsQuery({ page, limit: PAGE_SIZE });
  const [createAdmin, createState] = useCreateAdminMutation();
  const [updateAdmin, updateState] = useUpdateAdminMutation();
  const [deleteAdmin, deleteState] = useDeleteAdminMutation();

  const admins = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (data?.data ?? []).filter((admin) => `${admin.name ?? ""} ${admin.email ?? ""} ${admin.subrole ?? ""}`.toLowerCase().includes(needle));
  }, [data, query]);
  const total = data?.pagination?.total ?? admins.length;
  const totalPages = Math.max(1, data?.pagination?.totalPage ?? Math.ceil(total / PAGE_SIZE));
  const selectedId = editing && editing !== "new" ? recordId(editing) : "";
  const canCreate = can("team.manage") && (me.superAdmin || me.permissions?.includes("ADMIN_CREATE") === true);
  const canEdit = can("team.manage") && (me.superAdmin || me.permissions?.includes("ADMIN_UPDATE") === true);
  const canDelete = can("team.manage") && (me.superAdmin || me.permissions?.includes("ADMIN_DELETE") === true);

  const save = async (form: AdminFormData) => {
    const body = {
      name: form.name.trim(),
      email: form.email.trim(),
      role: "ADMIN",
      subrole: form.subrole,
      status: form.status,
      permissions: form.permissions,
    };
    try {
      if (editing === "new") {
        await createAdmin({ ...body, password: form.password }).unwrap();
        showToast("Admin created successfully");
      } else if (editing) {
        const id = recordId(editing);
        if (!id) throw new Error("Admin ID is missing");
        await updateAdmin({ id, body }).unwrap();
        showToast("Admin updated successfully");
      }
      setEditing(null);
    } catch (error) {
      showToast(getErrorMessage(error, "Could not save admin"));
    }
  };

  const remove = async () => {
    if (!deleting) return;
    const id = recordId(deleting);
    if (!id) {
      showToast("Admin ID is missing");
      return;
    }
    try {
      await deleteAdmin({ id }).unwrap();
      setDeleting(null);
      showToast("Admin deleted successfully");
    } catch (error) {
      showToast(getErrorMessage(error, "Could not delete admin"));
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-[26px] font-bold tracking-tight">Team & Roles</h2>
          <p className="mt-1 max-w-2xl text-[15px] text-mute">Manage admin accounts and choose which dashboard sections each admin can access. Super admins have access to everything.</p>
        </div>
        {canCreate && <button type="button" onClick={() => setEditing("new")} className="flex items-center gap-2 rounded-full bg-brand-700 px-6 py-3.5 text-[15px] font-bold text-white shadow-lift transition hover:bg-brand-800">
          <UserPlus size={19} /> Add admin
        </button>}
      </div>

      <div className="flex items-center gap-2 rounded-full bg-white px-4 ring-1 ring-line focus-within:ring-2 focus-within:ring-brand-500">
        <Search size={18} className="text-brand-500" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search admins by name, email or role" aria-label="Search admins" className="w-full bg-transparent py-3 text-[15px] outline-none" />
      </div>

      {isError ? (
        <div role="alert" className="rounded-3xl bg-white p-10 text-center shadow-soft">
          <p className="font-semibold">Admins could not be loaded</p>
          <button type="button" onClick={() => void refetch()} className="mt-4 rounded-full bg-brand-700 px-5 py-2.5 font-bold text-white">Retry</button>
        </div>
      ) : isLoading ? (
        <p role="status" className="rounded-3xl bg-white p-10 text-center text-mute shadow-soft">Loading admins…</p>
      ) : (
        <div className={cn("space-y-3", isFetching && "opacity-60")} aria-busy={isFetching}>
          {admins.length === 0 ? (
            <p className="rounded-3xl bg-white p-10 text-center text-mute shadow-soft">No admins match your search.</p>
          ) : admins.map((admin) => {
            const id = recordId(admin);
            const isSelf = id === me.id;
            const roleName = admin.role?.trim().toUpperCase();
            const subroleName = admin.subrole?.trim().toLowerCase();
            const isSuperAdmin = admin.isSuperAdmin || admin.superAdmin || roleName === "SUPER_ADMIN" || roleName === "SUPERADMIN" || roleName === "SUPER ADMIN" || subroleName === "super admin" || subroleName === "superadmin" || admin.permissions?.includes("SUPER_ADMIN") || admin.permissions?.includes("*");
            return (
              <article key={id || admin.email} className="flex flex-col gap-4 rounded-3xl bg-white p-4 shadow-soft sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <Avatar name={admin.name ?? "Admin"} src={admin.image} size={52} ring />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-[16px] font-bold">{admin.name ?? "Unnamed admin"}</h3>
                      {isSelf && <span className="rounded-full bg-brand-700 px-2 py-0.5 text-[11px] font-bold text-white">You</span>}
                    </div>
                    <p className="truncate text-[13.5px] text-mute">{admin.email ?? ""}</p>
                    <p className="mt-0.5 text-[12.5px] text-mute">{admin.createdAt ? `Added ${prettyDate(admin.createdAt.slice(0, 10))}` : "Admin account"}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                  {isSuperAdmin ? (
                    <span className="rounded-full bg-gold-50 px-2.5 py-1 text-[12px] font-bold text-gold-700">Super Admin</span>
                  ) : <RoleBadge role={adminRole(admin)} />}
                  {canEdit && <button type="button" onClick={() => setEditing(admin)} disabled={isSelf} aria-label={`Edit ${admin.name ?? "admin"}`} className="grid h-10 w-10 place-items-center rounded-full bg-brand-50 text-brand-700 disabled:opacity-40">
                    <Pencil size={17} />
                  </button>}
                  {canDelete && <button type="button" onClick={() => setDeleting(admin)} disabled={isSelf || deleteState.isLoading} aria-label={`Delete ${admin.name ?? "admin"}`} className="grid h-10 w-10 place-items-center rounded-full bg-red-50 text-red-600 disabled:opacity-40">
                    <Trash2 size={17} />
                  </button>}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {totalPages > 1 && !isError && (
        <div className="flex items-center justify-center gap-3">
          <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1 || isFetching} className="flex items-center gap-1 rounded-full bg-white px-4 py-2.5 font-bold text-brand-700 ring-1 ring-line disabled:opacity-50">
            <ChevronLeft size={17} /> Previous
          </button>
          <span className="text-sm font-semibold text-mute">Page {page} of {totalPages}</span>
          <button type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page >= totalPages || isFetching} className="flex items-center gap-1 rounded-full bg-white px-4 py-2.5 font-bold text-brand-700 ring-1 ring-line disabled:opacity-50">
            Next <ChevronRight size={17} />
          </button>
        </div>
      )}

      <section className="rounded-3xl bg-white p-5 shadow-soft sm:p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gold-50 text-gold-600"><ShieldCheck size={20} /></span>
          <div>
            <h3 className="text-[17px] font-bold">Admin permissions</h3>
            <p className="text-[13px] text-mute">Sidebar sections are shown only when the admin has the matching permission.</p>
          </div>
        </div>
      </section>

      {editing && (
        <AdminModal
          key={selectedId || "new"}
          admin={editing === "new" ? null : editing}
          existing={(data?.data ?? []).filter((admin) => recordId(admin) !== selectedId).map((admin) => admin.email?.toLowerCase() ?? "")}
          busy={createState.isLoading || updateState.isLoading}
          onClose={() => setEditing(null)}
          onSave={(form) => void save(form)}
        />
      )}
      {deleting && (
        <ConfirmDelete
          what={deleting.name ?? deleting.email ?? "admin"}
          onCancel={() => setDeleting(null)}
          onConfirm={() => void remove()}
        />
      )}
    </div>
  );
}

function AdminModal({ admin, existing, busy, onClose, onSave }: {
  admin: AdminRecord | null;
  existing: string[];
  busy: boolean;
  onClose: () => void;
  onSave: (form: AdminFormData) => void;
}) {
  const [form, setForm] = useState<AdminFormData>({
    name: admin?.name ?? "",
    email: admin?.email ?? "",
    password: "",
    subrole: admin?.subrole ?? "Editor",
    status: admin?.status ?? "active",
    permissions: admin?.permissions ?? [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (patch: Partial<AdminFormData>) => setForm((value) => ({ ...value, ...patch }));
  const togglePermission = (code: string) => {
    set({ permissions: form.permissions.includes(code) ? form.permissions.filter((item) => item !== code) : [...form.permissions, code] });
  };

  const submit = () => {
    const next: Record<string, string> = {};
    if (form.name.trim().length < 2) next.name = "Enter the admin's name.";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = "Enter a valid email address.";
    else if (!admin && existing.includes(form.email.trim().toLowerCase())) next.email = "This email is already registered.";
    if (!admin && form.password.length < 8) next.password = "Use a password with at least 8 characters.";
    if (!form.permissions.length) next.permissions = "Select at least one permission.";
    setErrors(next);
    if (Object.keys(next).length) return;
    onSave({ ...form, name: form.name.trim(), email: form.email.trim() });
  };

  return (
    <Modal title={admin ? "Edit admin" : "Create admin"} onClose={onClose} wide>
      <div className="thin-scroll flex-1 space-y-5 overflow-y-auto p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-[13.5px] font-bold">Name</span>
            <input value={form.name} onChange={(event) => set({ name: event.target.value })} className={inputCls} autoFocus />
            {errors.name && <span className="mt-1 block text-xs font-semibold text-red-600">{errors.name}</span>}
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13.5px] font-bold">Email</span>
            <input type="email" value={form.email} onChange={(event) => set({ email: event.target.value })} className={inputCls} />
            {errors.email && <span className="mt-1 block text-xs font-semibold text-red-600">{errors.email}</span>}
          </label>
          {!admin && (
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-[13.5px] font-bold">Password</span>
              <input type="password" value={form.password} onChange={(event) => set({ password: event.target.value })} className={inputCls} autoComplete="new-password" />
              {errors.password && <span className="mt-1 block text-xs font-semibold text-red-600">{errors.password}</span>}
            </label>
          )}
          <label className="block">
            <span className="mb-1.5 block text-[13.5px] font-bold">Subrole</span>
            <select value={form.subrole} onChange={(event) => set({ subrole: event.target.value })} className={inputCls}>
              {SUBROLES.map((subrole) => <option key={subrole} value={subrole}>{subrole}</option>)}
            </select>
          </label>
          {admin && (
            <label className="block">
              <span className="mb-1.5 block text-[13.5px] font-bold">Status</span>
              <select value={form.status} onChange={(event) => set({ status: event.target.value })} className={inputCls}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </label>
          )}
        </div>
        <fieldset>
          <legend className="mb-2 text-[13.5px] font-bold">Permissions</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {PERMISSIONS.map(({ code, label }) => {
              const checked = form.permissions.includes(code);
              return (
                <label key={code} className={cn("flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-[13px] font-medium", checked ? "border-brand-300 bg-brand-50 text-brand-800" : "border-line")}>
                  <input type="checkbox" checked={checked} onChange={() => togglePermission(code)} className="sr-only" />
                  <span className={cn("grid h-5 w-5 place-items-center rounded border", checked ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300")}>{checked && <Check size={13} strokeWidth={3} />}</span>
                  {label} <span className="ml-auto text-[10px] text-mute">{code}</span>
                </label>
              );
            })}
          </div>
          {errors.permissions && <span className="mt-1 block text-xs font-semibold text-red-600">{errors.permissions}</span>}
        </fieldset>
      </div>
      <div className="flex gap-3 border-t border-line bg-white px-6 py-4">
        <button type="button" onClick={onClose} disabled={busy} className="rounded-full bg-paper px-6 py-3.5 font-bold ring-1 ring-line disabled:opacity-50">Cancel</button>
        <button type="button" onClick={submit} disabled={busy} className="flex-1 rounded-full bg-brand-700 py-3.5 text-[15px] font-bold text-white shadow-soft disabled:opacity-50">
          {busy ? "Saving…" : admin ? "Save changes" : "Create admin"}
        </button>
      </div>
    </Modal>
  );
}
