import { useMemo, useState } from "react";
import { Bell, BellRing, Calendar, Copy, Pencil, Plus, Search, Send, Trash2, Users } from "lucide-react";
import { Img } from "../components/ui";
import { PushPreview } from "../components/push";
import { type NotificationRecord, type NotificationType, useGetNotificationsQuery, useGetUsersQuery, useMarkNotificationReadMutation, useResendNotificationMutation, useSendNotificationMutation } from "../api-client";
import { resolveFileUrl } from "../config";
import { NOTIF_KINDS, prettyDateTime, timeAgo, toLocalInput, type Notif, type NotifKind, type NotifStatus } from "../data/content";
import { uid, useStore } from "../store";
import { cn } from "../utils/cn";
import { ConfirmDelete, ImagePicker, Modal, inputCls } from "./shared";

const TITLE_MAX = 65;
const BODY_MAX = 178;

function toApiNotificationType(kind: NotifKind): NotificationType {
  switch (kind) {
    case "prayer":
    case "audio":
    case "teaching":
    case "encouragement":
    case "image":
      return kind;
    case "verse":
    case "announcement":
      return "other";
  }
}

function toNotifKind(type?: NotificationType): NotifKind {
  switch (type) {
    case "prayer":
    case "audio":
    case "teaching":
    case "encouragement":
    case "image":
      return type;
    case "other":
    default:
      return "announcement";
  }
}

function getScheduledAt(n: NotificationRecord): string | undefined {
  if (!n.is_scheduled || !n.scheduled_date) return undefined;
  const dateValue = n.scheduled_date.includes("T")
    ? n.scheduled_date
    : `${n.scheduled_date}T${n.scheduled_time || "00:00:00"}`;
  const date = new Date(dateValue);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function StatusBadge({ n }: { n: Notif }) {
  const map: Record<NotifStatus, string> = {
    sent: "bg-emerald-50 text-emerald-700",
    draft: "bg-slate-100 text-slate-600",
    scheduled: "bg-gold-50 text-gold-600",
  };
  const label = n.status === "sent"
    ? `Sent · ${timeAgo(n.sentAt)}`
    : n.status === "scheduled"
      ? n.scheduleAt ? `Scheduled · ${prettyDateTime(n.scheduleAt)}` : "Scheduled"
      : "Draft";
  return <span className={cn("inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-bold", map[n.status])}>{label}</span>;
}

const blank = (): Notif => ({ id: "", kind: "announcement", title: "", body: "", status: "sent", read: false });

const toNotif = (n: NotificationRecord): Notif => ({
  id: n._id,
  kind: toNotifKind(n.type),
  title: n.title || "Untitled notification",
  body: n.message || "",
  image: n.image ? resolveFileUrl(n.image) : undefined,
  status: n.is_scheduled ? "scheduled" : "sent",
  sentAt: n.createdAt,
  scheduleAt: getScheduledAt(n),
  read: Boolean(n.isRead),
});

export function NotificationsManager({ addSignal }: { addSignal: number }) {
  const { showToast } = useStore();
  const { data, isLoading, isError } = useGetNotificationsQuery({ page: 1, limit: 50 });
  const { data: usersData, isLoading: isLoadingUsers, isError: isUsersError } = useGetUsersQuery({ page: 1, limit: 100 });
  const [sendNotification] = useSendNotificationMutation();
  const [resendNotification] = useResendNotificationMutation();
  const [markNotificationRead] = useMarkNotificationReadMutation();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"All" | NotifStatus>("All");
  const [editing, setEditing] = useState<Notif | null>(() => (addSignal > 0 ? blank() : null));
  const [deleting, setDeleting] = useState<Notif | null>(null);
  const users = Array.isArray(usersData?.data)
    ? usersData.data
    : usersData?.data?.items ?? usersData?.data?.data ?? [];
  const audience = users.filter((user) => user.status === "active").length;

  const notifs = useMemo(() => {
    const items = data?.data?.data ?? [];
    return items.map((item) => toNotif(item));
  }, [data]);

  const list = useMemo(
    () =>
      notifs.filter(
        (n) => (filter === "All" || n.status === filter) && (q.trim() === "" || (n.title + " " + n.body).toLowerCase().includes(q.trim().toLowerCase()))
      ),
    [notifs, q, filter]
  );

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-[26px] font-bold tracking-tight">Push Notifications</h2>
          <p className="mt-1 max-w-xl text-[15px] text-mute">Write a message with a photo and send it to everyone, or schedule it for later. You can edit the text and replace the image at any time.</p>
        </div>
        <button onClick={() => setEditing(blank())} className="flex items-center gap-2 rounded-full bg-brand-700 px-6 py-3.5 text-[15px] font-bold text-white shadow-lift transition hover:bg-brand-800 active:scale-95">
          <Plus size={19} /> New notification
        </button>
      </div>

      <div className="mt-5 flex items-center gap-3 rounded-2xl bg-white p-4 shadow-soft">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><Users size={21} /></span>
        <p className="text-[14.5px] text-ink/85">
          Notifications go to all <b>{isLoadingUsers || isUsersError ? "—" : audience}</b> active members who have notifications turned on.
        </p>
      </div>
      {isUsersError && <p role="alert" className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-[13.5px] text-amber-800">The live active-member count could not be loaded.</p>}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="flex min-w-[220px] flex-1 items-center gap-2.5 rounded-full bg-white px-4 ring-1 ring-line focus-within:ring-2 focus-within:ring-brand-500">
          <Search size={18} className="text-brand-500" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search notifications" className="w-full bg-transparent py-3 text-[15px] outline-none" />
        </div>
        <div className="flex gap-1.5 rounded-full bg-white p-1 ring-1 ring-line">
          {(["All", "sent", "scheduled"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={cn("rounded-full px-3.5 py-2 text-[13px] font-bold capitalize", filter === f ? "bg-brand-700 text-white" : "text-mute")}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {isError ? (
        <div role="alert" className="mt-5 rounded-3xl bg-white p-10 text-center shadow-soft">
          <p className="text-[16px] font-semibold">Notifications could not be loaded</p>
          <p className="mt-1 text-[14px] text-mute">Check your connection and admin access, then try again.</p>
        </div>
      ) : isLoading ? (
        <p role="status" className="mt-8 rounded-3xl bg-white p-10 text-center text-[15px] text-mute shadow-soft">Loading notifications…</p>
      ) : <div className="mt-5 space-y-3">
        {list.length === 0 && (
          <div className="rounded-3xl bg-white p-12 text-center shadow-soft">
            <BellRing size={30} className="mx-auto text-brand-300" />
            <p className="mt-3 text-[16px] font-semibold">No notifications here</p>
            <p className="mt-1 text-[14px] text-mute">Press “New notification” to write your first one.</p>
          </div>
        )}
        {list.map((n) => (
          <div key={n.id} className="flex flex-col gap-4 rounded-3xl bg-white p-3.5 shadow-soft lg:flex-row lg:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-4">
              {n.image ? (
                <Img src={n.image} className="h-[76px] w-[96px] shrink-0 rounded-2xl" />
              ) : (
                <span className="grid h-[76px] w-[96px] shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-400"><Bell size={26} /></span>
              )}
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gold-600">{NOTIF_KINDS[n.kind]}</p>
                <h3 className="line-clamp-1 text-[15.5px] font-bold leading-snug">{n.title}</h3>
                <p className="line-clamp-2 text-[13px] leading-snug text-mute">{n.body}</p>
                <div className="mt-1.5"><StatusBadge n={n} /></div>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2 self-end lg:self-center">
              <button
                onClick={() => {
                  if (n.status === "sent") {
                    void resendNotification({ id: n.id })
                      .unwrap()
                      .then(() => showToast(`Sent again to ${audience} members`))
                      .catch(() => showToast("Failed to resend notification"));
                    return;
                  }

                  const payload = new FormData();
                  payload.set("title", n.title);
                  payload.set("message", n.body);
                  payload.set("type", toApiNotificationType(n.kind));
                  if (n.image && n.image.startsWith("data:")) {
                    void fetch(n.image)
                      .then((response) => response.blob())
                      .then((blob) => {
                        payload.set("image", blob, "notification-image");
                        return sendNotification(payload).unwrap();
                      })
                      .then(() => showToast(`Sent to ${audience} members`))
                      .catch(() => showToast("Failed to send notification"));
                  } else {
                    if (n.image) payload.set("image", n.image);
                    void sendNotification(payload)
                      .unwrap()
                      .then(() => showToast(`Sent to ${audience} members`))
                      .catch(() => showToast("Failed to send notification"));
                  }
                }}
                className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-4 py-2.5 text-[13.5px] font-bold text-emerald-700 transition hover:bg-emerald-100"
              >
                <Send size={15} /> {n.status === "sent" ? "Resend" : "Send now"}
              </button>
              <button onClick={() => setEditing({ ...n })} aria-label="Edit" className="grid h-10 w-10 place-items-center rounded-full bg-brand-50 text-brand-700 transition hover:bg-brand-100"><Pencil size={17} /></button>
              <button
                onClick={() => setEditing({ ...n, id: "", title: n.title + " (copy)" })}
                aria-label="Duplicate"
                className="grid h-10 w-10 place-items-center rounded-full bg-brand-50 text-brand-700 transition hover:bg-brand-100"
              ><Copy size={17} /></button>
              <button onClick={() => setDeleting(n)} aria-label="Mark as read" className="grid h-10 w-10 place-items-center rounded-full bg-red-50 text-red-600 transition hover:bg-red-100"><Trash2 size={17} /></button>
            </div>
          </div>
        ))}
      </div>}

      {editing && <Editor initial={editing} audience={audience} onClose={() => setEditing(null)} />}
      {deleting && (
        <ConfirmDelete
          what={deleting.title}
          onCancel={() => setDeleting(null)}
          onConfirm={() => {
            void markNotificationRead({ id: deleting.id })
              .unwrap()
              .then(() => {
                setDeleting(null);
                showToast("Marked as read");
              })
              .catch(() => showToast("Failed to mark notification as read"));
          }}
        />
      )}
    </div>
  );
}

type Delivery = "now" | "schedule";

function Editor({ initial, audience, onClose }: { initial: Notif; audience: number; onClose: () => void }) {
  const { testPush, requestPush, showToast } = useStore();
  const [sendNotification] = useSendNotificationMutation();
  const [resendNotification] = useResendNotificationMutation();
  const isNew = !initial.id;
  const wasSent = !isNew && initial.status === "sent";
  const [n, setN] = useState<Notif>(initial);
  const [delivery, setDelivery] = useState<Delivery>(wasSent ? "now" : initial.status === "scheduled" ? "schedule" : "now");
  const [when, setWhen] = useState(() => {
    if (initial.scheduleAt) return toLocalInput(new Date(initial.scheduleAt));
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(8, 0, 0, 0);
    return toLocalInput(d);
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (p: Partial<Notif>) => setN((x) => ({ ...x, ...p }));

  const save = async () => {
    const e: Record<string, string> = {};
    if (!n.title.trim()) e.title = "Please add a title";
    if (!n.body.trim()) e.body = "Please write a message";
    if (delivery === "schedule" && (!when || new Date(when).getTime() <= Date.now())) e.when = "Please choose a time in the future";
    setErrors(e);
    if (Object.keys(e).length) return;

    const base = { ...n, id: n.id || uid(), title: n.title.trim(), body: n.body.trim() };

    const buildPayload = async (scheduled = false) => {
      const form = new FormData();
      form.set("title", base.title);
      form.set("message", base.body);
      form.set("type", toApiNotificationType(base.kind));
      if (scheduled) {
        form.set("is_scheduled", "true");
        form.set("scheduled_date", when.slice(0, 10));
        form.set("scheduled_time", when.slice(11, 16));
      }
      if (base.image && base.image.startsWith("data:")) {
        const blob = await fetch(base.image).then((response) => response.blob());
        form.set("image", blob, "notification-image");
      } else if (base.image) {
        form.set("image", base.image);
      }
      return form;
    };

    try {
      if (wasSent && delivery === "now") {
        await resendNotification({ id: initial.id }).unwrap();
        showToast("Changes saved — notification resent");
      } else if (delivery === "now") {
        await sendNotification(await buildPayload()).unwrap();
        showToast(`Sent to ${audience} members`);
      } else if (delivery === "schedule") {
        await sendNotification(await buildPayload(true)).unwrap();
        showToast("Scheduled successfully");
      }
      onClose();
    } catch {
      showToast("Failed to save notification");
    }
  };

  const test = async () => {
    if (!n.title.trim() && !n.body.trim()) return setErrors({ title: "Add a title or message to test" });
    if ("Notification" in window && Notification.permission === "default") await requestPush();
    testPush(n);
    showToast("Test notification sent to this device");
  };

  const primary = wasSent && delivery === "now" ? "Save changes" : delivery === "now" ? `Send to ${audience} members` : "Schedule notification";
  const options: [Delivery, string][] = wasSent ? [["now", "Keep as sent"], ["schedule", "Reschedule"]] : [["now", "Send now"], ["schedule", "Schedule"]];

  return (
    <Modal title={isNew ? "New push notification" : "Edit push notification"} onClose={onClose} className="max-w-4xl">
      <div className="thin-scroll grid flex-1 gap-6 overflow-y-auto p-6 md:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <label className="block">
            <span className="mb-1.5 flex justify-between text-[13.5px] font-bold">Title <span className="font-medium text-mute">{n.title.length}/{TITLE_MAX}</span></span>
            <input maxLength={TITLE_MAX} value={n.title} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. New Teaching Available" className={inputCls} />
            {errors.title && <span className="mt-1 block text-[12.5px] font-semibold text-red-600">{errors.title}</span>}
          </label>

          <label className="block">
            <span className="mb-1.5 flex justify-between text-[13.5px] font-bold">Message <span className="font-medium text-mute">{n.body.length}/{BODY_MAX}</span></span>
            <textarea maxLength={BODY_MAX} rows={4} value={n.body} onChange={(e) => set({ body: e.target.value })} placeholder="Keep it short, warm and encouraging." className={cn(inputCls, "resize-none leading-relaxed")} />
            {errors.body && <span className="mt-1 block text-[12.5px] font-semibold text-red-600">{errors.body}</span>}
          </label>

          <ImagePicker label="Notification image (optional)" value={n.image} onChange={(image) => set({ image })} help="Wide photos (like 16:9) look best. You can replace or remove the image at any time." />

          <label className="block">
            <span className="mb-1.5 block text-[13.5px] font-bold">When someone taps it, open…</span>
            <select value={n.kind} onChange={(e) => set({ kind: e.target.value as NotifKind })} className={inputCls}>
              {(Object.keys(NOTIF_KINDS) as NotifKind[]).map((k) => (
                <option key={k} value={k}>{NOTIF_KINDS[k]}</option>
              ))}
            </select>
            <span className="mt-1 block text-[12.5px] text-mute">Also sets the icon shown in the app's Notifications list.</span>
          </label>

          <fieldset className="rounded-2xl bg-white p-4 ring-1 ring-line">
            <legend className="px-1 text-[13px] font-bold">Delivery</legend>
            <div className="mt-1 grid gap-2 sm:grid-cols-3">
              {options.map(([v, l]) => (
                <button key={v} type="button" onClick={() => setDelivery(v)} className={cn("flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-[14px] font-bold transition", delivery === v ? "bg-brand-700 text-white" : "bg-paper text-mute hover:bg-brand-50")}>
                  {v === "schedule" && <Calendar size={16} />} {v === "now" && !wasSent && <Send size={15} />} {l}
                </button>
              ))}
            </div>
            {delivery === "schedule" && (
              <label className="mt-3 block">
                <span className="mb-1.5 block text-[13px] font-semibold">Send on</span>
                <input type="datetime-local" value={when} min={toLocalInput(new Date())} onChange={(e) => setWhen(e.target.value)} className={inputCls} />
                {errors.when && <span className="mt-1 block text-[12.5px] font-semibold text-red-600">{errors.when}</span>}
              </label>
            )}
            {wasSent && (
              <p className="mt-3 rounded-xl bg-gold-50 p-3 text-[12.5px] leading-snug text-gold-600">
                This was already delivered. Saving updates the copy in the app's inbox. To alert members again, use <b>Resend</b> on the list.
              </p>
            )}
          </fieldset>
        </div>

        <aside className="md:sticky md:top-0 md:self-start">
          <p className="mb-2 text-[13px] font-bold uppercase tracking-wider text-mute">Live preview</p>
          <PushPreview n={n} />
          <button type="button" onClick={test} className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-brand-50 py-3 text-[14px] font-bold text-brand-700 transition hover:bg-brand-100">
            <BellRing size={16} /> Send a test to this device
          </button>
        </aside>
      </div>
      <div className="flex gap-3 border-t border-line bg-white px-6 py-4">
        <button onClick={onClose} className="rounded-full bg-paper px-6 py-3.5 font-bold text-ink ring-1 ring-line">Cancel</button>
        <button onClick={save} className="flex-1 rounded-full bg-brand-700 py-3.5 text-[15px] font-bold text-white shadow-soft transition hover:bg-brand-800">{primary}</button>
      </div>
    </Modal>
  );
}
