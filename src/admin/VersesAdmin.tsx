import { useEffect, useState, type FormEvent } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Pencil, Plus, Quote, Search, Star, Trash2 } from "lucide-react";
import {
  type VersePayload,
  type VerseRecord,
  type VerseStatus,
  useCreateVerseMutation,
  useDeleteVerseMutation,
  useGetVersesQuery,
  useSetVerseOfDayMutation,
  useUpdateVerseMutation,
} from "../api-client";
import { today } from "../data/content";
import { ROLES } from "../data/team";
import { useStore } from "../store";
import { cn } from "../utils/cn";
import { ConfirmDelete, Modal, inputCls } from "./shared";

const PAGE_SIZE = 10;
const STATUSES: (VerseStatus | "all")[] = ["all", "published", "draft", "scheduled"];

function recordId(verse: VerseRecord) {
  return verse._id ?? verse.id;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (!error || typeof error !== "object") return fallback;
  const data = "data" in error ? error.data : undefined;
  if (data && typeof data === "object" && "message" in data && typeof data.message === "string") return data.message;
  if ("message" in error && typeof error.message === "string") return error.message;
  return fallback;
}

function displayDate(value?: string | null) {
  if (!value) return "Not set";
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function VersesManager({ addSignal }: { addSignal: number }) {
  const { can, me, showToast } = useStore();
  const canEdit = can("content.edit");
  const canSetVerseDay = can("content.publish");
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<VerseStatus | "all">("all");
  const [editing, setEditing] = useState<VerseRecord | null>(null);
  const [deleting, setDeleting] = useState<VerseRecord | null>(null);
  const [settingDay, setSettingDay] = useState<VerseRecord | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  const { data, isLoading, isFetching, isError, refetch } = useGetVersesQuery({
    page,
    limit: PAGE_SIZE,
    ...(search ? { search } : {}),
    ...(status !== "all" ? { status } : {}),
  });
  const [createVerse, createState] = useCreateVerseMutation();
  const [updateVerse, updateState] = useUpdateVerseMutation();
  const [deleteVerse] = useDeleteVerseMutation();
  const [setVerseOfDay, setVerseOfDayState] = useSetVerseOfDayMutation();

  useEffect(() => {
    if (addSignal > 0 && canEdit) setEditing({ content: "", reference: "", status: "published" });
  }, [addSignal, canEdit]);

  const verses = data?.data ?? [];
  const total = data?.pagination?.total;
  const totalPages = Math.max(1, data?.pagination?.totalPage ?? (total !== undefined ? Math.ceil(total / PAGE_SIZE) : 1));
  const busy = createState.isLoading || updateState.isLoading;

  const saveVerse = async (payload: VersePayload, verse?: VerseRecord) => {
    const id = verse && recordId(verse);
    try {
      if (id) await updateVerse({ id, body: payload }).unwrap();
      else await createVerse(payload).unwrap();
      setEditing(null);
      showToast(id ? "Verse updated" : "Verse created");
    } catch (error) {
      showToast(getErrorMessage(error, id ? "Failed to update verse" : "Failed to create verse"));
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-[26px] font-bold tracking-tight">Verses</h2>
          <p className="mt-1 max-w-2xl text-[15px] text-mute">Manage Bible verses, their publishing status, and which dates they are assigned to. Multiple verses may share a date.</p>
        </div>
        {canEdit && (
          <button type="button" onClick={() => setEditing({ content: "", reference: "", status: "published" })} className="flex items-center gap-2 rounded-full bg-brand-700 px-6 py-3.5 text-[15px] font-bold text-white shadow-lift transition hover:bg-brand-800 active:scale-95">
            <Plus size={19} /> Add new verse
          </button>
        )}
      </div>
      {!canEdit && (
        <p className="mt-4 rounded-2xl bg-sky-50 p-4 text-[14px] text-sky-800">
          As a <b>{ROLES[me.role].label}</b> you can {canSetVerseDay ? "set a Verse of the Day, but cannot add, edit, or delete verses." : "view verses, but cannot add, edit, or delete them."}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex min-w-[220px] flex-1 items-center gap-2.5 rounded-full bg-white px-4 ring-1 ring-line focus-within:ring-2 focus-within:ring-brand-500">
          <Search size={18} className="text-brand-500" />
          <input aria-label="Search verses" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search verses or references" className="w-full bg-transparent py-3 text-[15px] outline-none" />
        </div>
        <div role="group" aria-label="Filter by status" className="flex max-w-full gap-1.5 overflow-x-auto rounded-full bg-white p-1 ring-1 ring-line">
          {STATUSES.map((value) => (
            <button type="button" key={value} aria-pressed={status === value} onClick={() => setStatus(value)} className={cn("rounded-full px-3.5 py-2 text-[13px] font-bold capitalize", status === value ? "bg-brand-700 text-white" : "text-mute")}>
              {value}
            </button>
          ))}
        </div>
      </div>

      {isError ? (
        <div role="alert" className="mt-5 rounded-3xl bg-white p-10 text-center shadow-soft">
          <p className="text-[16px] font-semibold">Verses could not be loaded</p>
          <p className="mt-1 text-[14px] text-mute">Check your connection and admin access, then try again.</p>
          <button type="button" onClick={() => void refetch()} className="mt-4 rounded-full bg-brand-700 px-5 py-2.5 font-bold text-white">Retry</button>
        </div>
      ) : isLoading ? (
        <p role="status" className="mt-8 rounded-3xl bg-white p-10 text-center text-[15px] text-mute shadow-soft">Loading verses…</p>
      ) : verses.length === 0 ? (
        <div className="mt-5 rounded-3xl bg-white p-12 text-center shadow-soft">
          <Quote size={30} className="mx-auto text-brand-300" />
          <p className="mt-3 text-[16px] font-semibold">{search || status !== "all" ? "No matching verses" : "No verses yet"}</p>
          <p className="mt-1 text-[14px] text-mute">{canEdit ? "Add a verse to start building your collection." : "No verses have been added yet."}</p>
        </div>
      ) : (
        <>
          <div className={cn("mt-5 space-y-3", isFetching && "opacity-60")} aria-busy={isFetching}>
            {verses.map((verse) => {
              const id = recordId(verse);
              return (
                <article key={id ?? `${verse.reference}-${verse.content}`} className="flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-soft sm:flex-row sm:items-center">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600"><Quote size={23} /></div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-3 whitespace-pre-wrap text-[15.5px] font-semibold leading-relaxed">{verse.content}</p>
                    <p className="mt-1 text-[13.5px] font-bold text-brand-700">{verse.reference}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[12px] font-bold capitalize", verse.status === "published" ? "bg-emerald-50 text-emerald-700" : verse.status === "scheduled" ? "bg-gold-50 text-gold-700" : "bg-slate-100 text-slate-600")}>
                        {verse.status}{verse.status === "scheduled" && verse.scheduled_date ? ` · ${displayDate(verse.scheduled_date)}` : ""}
                      </span>
                      <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-bold", verse.isVerseOfDay ? "bg-brand-50 text-brand-700" : "bg-slate-50 text-slate-600")}>
                          <Star size={13} fill={verse.isVerseOfDay ? "currentColor" : "none"} /> {verse.isVerseOfDay ? "Verse of the Day" : "Not Verse of the Day"}
                          {verse.verseOfDayDate && ` · ${displayDate(verse.verseOfDayDate)}`}
                        </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2 self-end sm:self-center">
                    {canSetVerseDay && id && (
                      <button type="button" onClick={() => setSettingDay(verse)} aria-label={`Set ${verse.reference} as Verse of the Day`} className="flex items-center gap-1.5 rounded-full bg-gold-50 px-3.5 py-2.5 text-[13px] font-bold text-gold-700 hover:bg-gold-100">
                        <CalendarDays size={16} /> Set day
                      </button>
                    )}
                    {canEdit && id && (
                      <>
                        <button type="button" onClick={() => setEditing(verse)} aria-label={`Edit ${verse.reference}`} className="grid h-10 w-10 place-items-center rounded-full bg-brand-50 text-brand-700 transition hover:bg-brand-100"><Pencil size={17} /></button>
                        <button type="button" onClick={() => setDeleting(verse)} aria-label={`Delete ${verse.reference}`} className="grid h-10 w-10 place-items-center rounded-full bg-red-50 text-red-600 transition hover:bg-red-100"><Trash2 size={17} /></button>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-soft">
            <p className="text-[13.5px] text-mute" aria-live="polite">
              {total === undefined ? `Page ${page} of ${totalPages}` : `${total} ${total === 1 ? "verse" : "verses"} · Page ${page} of ${totalPages}`}
            </p>
            <div className="flex items-center gap-2">
              <button type="button" aria-label="Previous page" disabled={page <= 1 || isFetching} onClick={() => setPage((current) => Math.max(1, current - 1))} className="grid h-10 w-10 place-items-center rounded-full bg-brand-50 text-brand-700 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft size={18} /></button>
              <button type="button" aria-label="Next page" disabled={page >= totalPages || isFetching} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} className="grid h-10 w-10 place-items-center rounded-full bg-brand-50 text-brand-700 disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight size={18} /></button>
            </div>
          </div>
        </>
      )}

      {editing && <VerseEditor initial={editing} busy={busy} onClose={() => setEditing(null)} onSave={(payload) => void saveVerse(payload, recordId(editing) ? editing : undefined)} />}
      {deleting && (
        <ConfirmDelete
          what={deleting.reference}
          onCancel={() => setDeleting(null)}
          onConfirm={() => {
            const id = recordId(deleting);
            if (!id) return showToast("This verse cannot be deleted because it has no ID");
            void deleteVerse({ id }).unwrap().then(() => {
              setDeleting(null);
              showToast("Verse deleted");
            }).catch((error: unknown) => showToast(getErrorMessage(error, "Failed to delete verse")));
          }}
        />
      )}
      {settingDay && <SetVerseOfDayModal verse={settingDay} busy={setVerseOfDayState.isLoading} onClose={() => setSettingDay(null)} onSave={(date) => {
        const id = recordId(settingDay);
        if (!id) return showToast("This verse cannot be assigned because it has no ID");
        void setVerseOfDay({ id, date }).unwrap().then(() => {
          setSettingDay(null);
          showToast("Verse of the Day updated");
        }).catch((error: unknown) => showToast(getErrorMessage(error, "Failed to set Verse of the Day")));
      }} />}
    </div>
  );
}

function VerseEditor({ initial, busy, onClose, onSave }: { initial: VerseRecord; busy: boolean; onClose: () => void; onSave: (payload: VersePayload) => void }) {
  const [content, setContent] = useState(initial.content);
  const [reference, setReference] = useState(initial.reference);
  const [status, setStatus] = useState<VerseStatus>(initial.status);
  const [scheduledDate, setScheduledDate] = useState(initial.scheduled_date ?? "");
  const [scheduledTime, setScheduledTime] = useState(initial.scheduled_time ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isEditing = Boolean(recordId(initial));

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!content.trim()) nextErrors.content = "Please enter the verse text";
    if (!reference.trim()) nextErrors.reference = "Please enter the Bible reference";
    if (status === "scheduled" && !scheduledDate) nextErrors.scheduledDate = "Choose a scheduled date";
    if (status === "scheduled" && !scheduledTime) nextErrors.scheduledTime = "Choose a scheduled time";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    onSave({
      content: content.trim(),
      reference: reference.trim(),
      status,
      ...(status === "scheduled" ? { scheduled_date: scheduledDate, scheduled_time: scheduledTime } : {}),
    });
  };

  return (
    <Modal title={`${isEditing ? "Edit" : "Add"} verse`} onClose={onClose} wide>
      <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
        <div className="thin-scroll flex-1 space-y-5 overflow-y-auto p-6">
          <label className="block">
            <span className="mb-1.5 block text-[13.5px] font-bold">Verse text <span className="text-gold-600">*</span></span>
            <textarea rows={5} required value={content} onChange={(event) => setContent(event.target.value)} aria-invalid={Boolean(errors.content)} aria-describedby={errors.content ? "verse-content-error" : undefined} className={cn(inputCls, "resize-y leading-relaxed")} />
            {errors.content && <span id="verse-content-error" className="mt-1 block text-[12.5px] font-semibold text-red-600">{errors.content}</span>}
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13.5px] font-bold">Reference <span className="text-gold-600">*</span></span>
            <input required value={reference} onChange={(event) => setReference(event.target.value)} placeholder="e.g. John 3:16" aria-invalid={Boolean(errors.reference)} aria-describedby={errors.reference ? "verse-reference-error" : undefined} className={inputCls} />
            {errors.reference && <span id="verse-reference-error" className="mt-1 block text-[12.5px] font-semibold text-red-600">{errors.reference}</span>}
          </label>
          <fieldset className="rounded-2xl bg-white p-4 ring-1 ring-line">
            <legend className="px-1 text-[13.5px] font-bold">Status</legend>
            <div className="mt-1 grid gap-2 sm:grid-cols-3">
              {(["published", "draft", "scheduled"] as const).map((value) => (
                <button type="button" key={value} aria-pressed={status === value} onClick={() => setStatus(value)} className={cn("rounded-xl px-3 py-3 text-[14px] font-bold capitalize transition", status === value ? "bg-brand-700 text-white" : "bg-paper text-mute hover:bg-brand-50")}>
                  {value === "published" ? "Publish now" : value === "scheduled" ? "Schedule" : "Save as draft"}
                </button>
              ))}
            </div>
            {status === "scheduled" && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-semibold">Scheduled date</span>
                  <input type="date" required value={scheduledDate} onChange={(event) => setScheduledDate(event.target.value)} aria-invalid={Boolean(errors.scheduledDate)} className={inputCls} />
                  {errors.scheduledDate && <span className="mt-1 block text-[12px] font-semibold text-red-600">{errors.scheduledDate}</span>}
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-semibold">Scheduled time</span>
                  <input type="time" required value={scheduledTime} onChange={(event) => setScheduledTime(event.target.value)} aria-invalid={Boolean(errors.scheduledTime)} className={inputCls} />
                  {errors.scheduledTime && <span className="mt-1 block text-[12px] font-semibold text-red-600">{errors.scheduledTime}</span>}
                </label>
              </div>
            )}
          </fieldset>
          <div className="rounded-2xl bg-paper p-4 text-[13px] text-mute">
            <p><b className="text-ink">Verse of the Day:</b> {initial.isVerseOfDay ? "Yes" : "No"}</p>
            <p className="mt-1"><b className="text-ink">Verse of the Day date:</b> {displayDate(initial.verseOfDayDate)}</p>
            <p className="mt-1">This state is read-only here. Use “Set day” on a verse to assign a date.</p>
          </div>
        </div>
        <div className="flex gap-3 border-t border-line bg-white px-6 py-4">
          <button type="button" onClick={onClose} disabled={busy} className="rounded-full bg-paper px-6 py-3.5 font-bold text-ink ring-1 ring-line disabled:opacity-50">Cancel</button>
          <button type="submit" disabled={busy} className="flex-1 rounded-full bg-brand-700 py-3.5 text-[15px] font-bold text-white shadow-soft transition hover:bg-brand-800 disabled:opacity-50">
            {busy ? "Saving…" : status === "published" ? "Save & publish" : status === "scheduled" ? "Save & schedule" : "Save draft"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function SetVerseOfDayModal({ verse, busy, onClose, onSave }: { verse: VerseRecord; busy: boolean; onClose: () => void; onSave: (date: string) => void }) {
  const [date, setDate] = useState(verse.verseOfDayDate?.slice(0, 10) ?? today());
  const [error, setError] = useState("");
  return (
    <Modal title="Set as Verse of the Day" onClose={onClose}>
      <form onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!date) {
          setError("Choose a date");
          return;
        }
        onSave(date);
      }} className="p-6">
        <p className="mb-4 line-clamp-3 text-[14px] text-mute">{verse.reference}: {verse.content}</p>
        <label className="block">
          <span className="mb-1.5 block text-[13.5px] font-bold">Date</span>
          <input type="date" required value={date} onChange={(event) => { setDate(event.target.value); setError(""); }} aria-invalid={Boolean(error)} className={inputCls} />
          {error && <span className="mt-1 block text-[12.5px] font-semibold text-red-600">{error}</span>}
        </label>
        <p className="mt-2 text-[12.5px] text-mute">Other verses already assigned to this date will remain assigned.</p>
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onClose} disabled={busy} className="flex-1 rounded-full bg-paper py-3.5 font-bold text-ink ring-1 ring-line">Cancel</button>
          <button type="submit" disabled={busy} className="flex-1 rounded-full bg-brand-700 py-3.5 font-bold text-white disabled:opacity-50">{busy ? "Saving…" : "Set date"}</button>
        </div>
      </form>
    </Modal>
  );
}
