import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
import {
  CalendarDays, ChevronLeft, ChevronRight, Download, Eye, Search, TrendingUp, UserCheck, UserPlus, UserX, Users as UsersIcon,
} from "lucide-react";
import { prettyDate, today, type AppUser } from "../data/content";
import { type UserRecord, useCreateAdminMutation, useGetUserStatisticsQuery, useGetUsersQuery, useToggleUserStatusMutation } from "../api-client";
import { useStore } from "../store";
import { cn } from "../utils/cn";
import { Modal, inputCls } from "./shared";

// ---------------------------------------------------------------------------
// date helpers (all dates are yyyy-mm-dd strings)
// ---------------------------------------------------------------------------
const DAY = 86400000;
const toDate = (iso: string) => new Date(iso + "T12:00:00Z");
const diffDays = (a: string, b: string) => Math.round((toDate(b).getTime() - toDate(a).getTime()) / DAY);
const shortDate = (iso: string) => toDate(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const longDate = (iso: string) => toDate(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const monthShort = (iso: string) => toDate(iso).toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
const monthLong = (iso: string) => toDate(iso).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
const ago = (iso: string) => {
  const n = diffDays(iso, today());
  if (n <= 0) return "Today";
  if (n === 1) return "Yesterday";
  if (n < 14) return `${n} days ago`;
  if (n < 60) return `${Math.floor(n / 7)} weeks ago`;
  if (n < 730) return `${Math.floor(n / 30)} months ago`;
  return `${Math.floor(n / 365)} years ago`;
};

// ---------------------------------------------------------------------------
// growth buckets
// ---------------------------------------------------------------------------
type Range = "7D" | "30D" | "90D" | "12M";
const RANGES: { id: Range; label: string; long: string; apiRange: string }[] = [
  { id: "7D", label: "7 days", long: "the last 7 days", apiRange: "7days" },
  { id: "30D", label: "30 days", long: "the last 30 days", apiRange: "30days" },
  { id: "90D", label: "3 months", long: "the last 3 months", apiRange: "90days" },
  { id: "12M", label: "12 months", long: "the last 12 months", apiRange: "12months" },
];

const toAppUser = (user: UserRecord): AppUser => ({
  id: user._id ?? user.id ?? `user-${user.email ?? "unknown"}`,
  name: user.name ?? "Unnamed member",
  email: user.email ?? "",
  joined: user.createdAt ? user.createdAt.slice(0, 10) : today(),
  status: user.status === "active" ? "active" : "suspended",
  country: "—",
});

interface Bucket {
  label: string;
  full: string;
  added: number;
  total: number;
}

// ---------------------------------------------------------------------------
// small UI pieces
// ---------------------------------------------------------------------------
function StatCard({ icon, label, value, children, tone = "brand" }: { icon: ReactNode; label: string; value: ReactNode; children?: ReactNode; tone?: "brand" | "gold" }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-soft">
      <span className={cn("grid h-11 w-11 place-items-center rounded-2xl", tone === "gold" ? "bg-gold-50 text-gold-600" : "bg-brand-50 text-brand-600")}>{icon}</span>
      <p className="mt-4 text-[32px] font-extrabold leading-none tracking-tight text-brand-800">{value}</p>
      <p className="mt-1.5 text-[13.5px] font-medium text-mute">{label}</p>
      <div className="mt-2 min-h-[20px]">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// charts (plain SVG, no libraries)
// ---------------------------------------------------------------------------
const W = 640;
const L = 40;
const R = 14;
const T = 14;
const B = 28;

function xLabels(buckets: Bucket[], xAt: (i: number) => number, H: number) {
  const n = buckets.length;
  const k = Math.max(1, Math.ceil(n / 7));
  return buckets.map((b, i) =>
    (n - 1 - i) % k === 0 ? (
      <text key={i} x={xAt(i)} y={H - 8} textAnchor="middle" className="fill-mute text-[11px] font-medium">
        {b.label}
      </text>
    ) : null
  );
}

function GrowthLine({ buckets, hover, setHover }: { buckets: Bucket[]; hover: number | null; setHover: (i: number | null) => void }) {
  const gid = useId().replace(/:/g, "");
  const H = 230;
  const n = buckets.length;
  const totals = buckets.map((b) => b.total);
  const min = Math.min(...totals);
  const max = Math.max(...totals);
  const span = Math.max(1, max - min);
  const lo = Math.max(0, Math.floor(min - span * 0.3));
  const hi = Math.ceil(max + span * 0.12);
  const innerW = W - L - R;
  const innerH = H - T - B;
  const xAt = (i: number) => L + (n === 1 ? innerW / 2 : (i * innerW) / (n - 1));
  const yAt = (v: number) => T + innerH - ((v - lo) / (hi - lo || 1)) * innerH;
  const ticks = [0, 1, 2, 3].map((t) => Math.round(lo + ((hi - lo) * t) / 3));
  const line = buckets.map((b, i) => `${i ? "L" : "M"}${xAt(i).toFixed(1)} ${yAt(b.total).toFixed(1)}`).join(" ");
  const area = `${line} L${xAt(n - 1).toFixed(1)} ${T + innerH} L${xAt(0).toFixed(1)} ${T + innerH} Z`;

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const vx = ((e.clientX - r.left) / r.width) * W;
    setHover(Math.max(0, Math.min(n - 1, Math.round(((vx - L) / innerW) * (n - 1)))));
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full touch-pan-y select-none" onPointerMove={onMove} onPointerLeave={() => setHover(null)} role="img" aria-label="Line chart of total registered members over time">
      <defs>
        <linearGradient id={`g${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2b918f" stopOpacity="0.32" />
          <stop offset="1" stopColor="#2b918f" stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={yAt(t)} y2={yAt(t)} stroke="#e7ecea" strokeDasharray="4 5" />
          <text x={L - 8} y={yAt(t) + 4} textAnchor="end" className="fill-mute text-[11px] font-medium">{t}</text>
        </g>
      ))}
      <path d={area} fill={`url(#g${gid})`} />
      <path d={line} fill="none" stroke="#135a5e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {n <= 14 && buckets.map((b, i) => <circle key={i} cx={xAt(i)} cy={yAt(b.total)} r="3.5" fill="#fff" stroke="#135a5e" strokeWidth="2" />)}
      {hover !== null && (
        <g>
          <line x1={xAt(hover)} x2={xAt(hover)} y1={T} y2={T + innerH} stroke="#c49a3c" strokeWidth="1.5" strokeDasharray="4 4" />
          <circle cx={xAt(hover)} cy={yAt(buckets[hover].total)} r="6.5" fill="#c49a3c" stroke="#fff" strokeWidth="3" />
        </g>
      )}
      {xLabels(buckets, xAt, H)}
    </svg>
  );
}

function SignupBars({ buckets, hover, setHover }: { buckets: Bucket[]; hover: number | null; setHover: (i: number | null) => void }) {
  const H = 190;
  const n = buckets.length;
  const max = Math.max(2, Math.ceil(Math.max(...buckets.map((b) => b.added)) / 2) * 2);
  const innerW = W - L - R;
  const innerH = H - T - B;
  const slot = innerW / n;
  const xAt = (i: number) => L + slot * i + slot / 2;
  const yAt = (v: number) => T + innerH - (v / max) * innerH;
  const ticks = [0, max / 2, max];

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const vx = ((e.clientX - r.left) / r.width) * W;
    setHover(Math.max(0, Math.min(n - 1, Math.floor((vx - L) / slot))));
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full touch-pan-y select-none" onPointerMove={onMove} onPointerLeave={() => setHover(null)} role="img" aria-label="Bar chart of new registrations over time">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={yAt(t)} y2={yAt(t)} stroke="#e7ecea" strokeDasharray={t === 0 ? undefined : "4 5"} />
          <text x={L - 8} y={yAt(t) + 4} textAnchor="end" className="fill-mute text-[11px] font-medium">{t}</text>
        </g>
      ))}
      {buckets.map((b, i) => {
        const h = Math.max(b.added > 0 ? 3 : 0, T + innerH - yAt(b.added));
        const bw = Math.min(34, slot * 0.66);
        return (
          <rect key={i} x={xAt(i) - bw / 2} y={T + innerH - h} width={bw} height={h} rx={Math.min(6, bw / 2.5)} fill={hover === i ? "#c49a3c" : "#2b918f"} opacity={hover === null || hover === i ? 1 : 0.55} />
        );
      })}
      {xLabels(buckets, xAt, H)}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// overview
// ---------------------------------------------------------------------------
function Overview({ openMembers }: { openMembers: () => void }) {
  const [range, setRange] = useState<Range>("7D");
  const [hover, setHover] = useState<number | null>(null);
  const rangeConfig = RANGES.find((r) => r.id === range)!;
  const { currentData: statisticsResponse, isLoading: isLoadingStatistics, isFetching: isFetchingStatistics, isError: isStatisticsError } =
    useGetUserStatisticsQuery({ range: rangeConfig.apiRange });
  const statistics = statisticsResponse?.data.statistics;
  const graph = statisticsResponse?.data.graph;
  const buckets = useMemo(() => {
    const newRegistrations = new Map((graph?.newRegistrations ?? []).map(({ date, members }) => [date, members]));
    return (graph?.totalMembers ?? []).map(({ date, newMembers, totalMembers }) => ({
      label: range === "12M" ? monthShort(date) : shortDate(date),
      full: range === "12M" ? monthLong(date) : longDate(date),
      added: newRegistrations.get(date) ?? newMembers,
      total: totalMembers,
    }));
  }, [graph, range]);
  const cfg = rangeConfig;
  const added = buckets.reduce((s, b) => s + b.added, 0);
  const firstBucket = buckets[0];
  const startTotal = firstBucket ? firstBucket.total - firstBucket.added : 0;
  const rangeGrowth = startTotal > 0 ? (added / startTotal) * 100 : null;
  const hb = hover !== null ? buckets[hover] : null;
  const isPendingStatistics = isLoadingStatistics || isFetchingStatistics;
  const periodUnit = range === "12M" ? "month" : range === "90D" && buckets.length <= 14 ? "week" : "day";

  const peakBucket = buckets.reduce<Bucket | undefined>(
    (peak, bucket) => !peak || bucket.added > peak.added ? bucket : peak,
    undefined,
  );
  const bucketMax = Math.max(1, ...buckets.map((bucket) => bucket.added));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard icon={<UsersIcon size={22} />} label="Registered members" value={isPendingStatistics ? "…" : statistics?.registeredMembers ?? "—"}>
          <span className="text-[12.5px] text-mute">
            <b className="text-emerald-600">{statistics?.activeMembers ?? "—"}</b> active · <b className="text-red-500">{statistics?.suspendedMembers ?? "—"}</b> suspended
          </span>
        </StatCard>
        <StatCard icon={<UserPlus size={22} />} label="New this week" value={isPendingStatistics ? "…" : statistics?.newThisWeek ?? "—"}>
          <span className="text-[12.5px] text-mute">Registrations in the last 7 days</span>
        </StatCard>
        <StatCard icon={<CalendarDays size={22} />} label="New in 30 days" value={isPendingStatistics ? "…" : statistics?.newLast30Days ?? "—"} tone="gold">
          <span className="text-[12.5px] text-mute">Registrations in the last 30 days</span>
        </StatCard>
        <StatCard
          icon={<TrendingUp size={22} />}
          label="Growth (30 days)"
          value={isPendingStatistics ? "…" : statistics?.growth30Days.percentage == null ? "—" : `${statistics.growth30Days.percentage.toFixed(1)}%`}
          tone="gold"
        >
          <span className="text-[12.5px] text-mute">
            {statistics ? `${statistics.growth30Days.previous} → ${statistics.growth30Days.current} members` : "Compared with previous 30 days"}
          </span>
        </StatCard>
      </div>

      {isStatisticsError && (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700">
          Could not load user statistics from the backend. Confirm the admin token or API is reachable.
        </div>
      )}

      <section className="rounded-3xl bg-white p-5 shadow-soft sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-[18px] font-bold">User growth</h3>
            <p className="mt-0.5 text-[14px] text-mute">
              <b className="text-ink">+{added}</b> new members in {cfg.long}
              {rangeGrowth !== null && (
                <>
                  {" "}· <b className="text-emerald-600">+{rangeGrowth.toFixed(1)}%</b> growth
                </>
              )}
            </p>
          </div>
          <div className="flex gap-1 rounded-full bg-paper p-1 ring-1 ring-line" role="tablist" aria-label="Chart period">
            {RANGES.map((r) => (
              <button
                key={r.id}
                role="tab"
                aria-selected={range === r.id}
                onClick={() => {
                  setRange(r.id);
                  setHover(null);
                }}
                className={cn("rounded-full px-3.5 py-2 text-[13px] font-bold transition", range === r.id ? "bg-brand-700 text-white shadow-soft" : "text-mute hover:text-brand-700")}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex min-h-[46px] items-center justify-between gap-3 rounded-2xl bg-paper px-4 py-2.5 text-[14px]" aria-live="polite">
          {hb ? (
            <>
              <span className="font-bold text-ink">{hb.full}</span>
              <span className="text-mute">
                <b className="text-brand-700">{hb.total}</b> members · <b className="text-gold-600">+{hb.added}</b> new
              </span>
            </>
          ) : (
            <span className="text-mute">Move over the chart to see the numbers for each {periodUnit}.</span>
          )}
        </div>

        <p className="mb-1 mt-5 text-[12.5px] font-bold uppercase tracking-wider text-mute">Total members</p>
        {buckets.length ? (
          <GrowthLine buckets={buckets} hover={hover} setHover={setHover} />
        ) : (
          <p className="rounded-xl bg-paper px-4 py-8 text-center text-sm text-mute">
            {isPendingStatistics ? "Loading registration data…" : "No registration data is available for this period."}
          </p>
        )}
        <p className="mb-1 mt-4 text-[12.5px] font-bold uppercase tracking-wider text-mute">New registrations per {periodUnit}</p>
        {buckets.length > 0 && <SignupBars buckets={buckets} hover={hover} setHover={setHover} />}
      </section>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.15fr]">
        <section className="rounded-3xl bg-white p-5 shadow-soft sm:p-6">
          <h3 className="text-[18px] font-bold">Registration highlights</h3>
          <dl className="mt-4 space-y-3 text-[14.5px]">
            {[
              ["Registered members", statistics?.registeredMembers ?? "—"],
              ["Active members", statistics?.activeMembers ?? "—"],
              ["Suspended members", statistics?.suspendedMembers ?? "—"],
              ["Peak registrations", peakBucket?.added ? `${peakBucket.full} · ${peakBucket.added} sign-ups` : "—"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-start justify-between gap-4 rounded-2xl bg-paper px-4 py-3">
                <dt className="text-mute">{k}</dt>
                <dd className="text-right font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
          <button onClick={openMembers} className="mt-4 w-full rounded-full bg-brand-50 py-3 text-[14px] font-bold text-brand-700 transition hover:bg-brand-100">
            See every member and joining date
          </button>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-soft sm:p-6">
          <h3 className="text-[18px] font-bold">Registrations by {periodUnit}</h3>
          <div className="thin-scroll mt-3 max-h-[330px] overflow-y-auto pr-1">
            <table className="w-full text-left text-[14px]">
              <thead className="sticky top-0 bg-white text-[12px] font-bold uppercase tracking-wider text-mute">
                <tr>
                  <th className="py-2 font-bold">Period</th>
                  <th className="py-2 font-bold">New</th>
                  <th className="py-2 pl-3 font-bold">&nbsp;</th>
                  <th className="py-2 text-right font-bold">Total</th>
                </tr>
              </thead>
              <tbody>
                {buckets.map((bucket) => (
                  <tr key={bucket.full} className="border-t border-line">
                    <td className="py-2.5 font-semibold">{bucket.full}</td>
                    <td className="py-2.5 font-bold text-brand-700">+{bucket.added}</td>
                    <td className="w-[34%] py-2.5 pl-3">
                      <span className="block h-2 rounded-full bg-paper">
                        <span className="block h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600" style={{ width: `${(bucket.added / bucketMax) * 100}%` }} />
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-mute">{bucket.total}</td>
                  </tr>
                ))}
              </tbody>
              {!buckets.length && (
                <tbody>
                  <tr><td colSpan={4} className="py-6 text-center text-mute">{isPendingStatistics ? "Loading…" : "No data for this period."}</td></tr>
                </tbody>
              )}
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// members list
// ---------------------------------------------------------------------------
const PAGE = 10;

function exportCsv(list: AppUser[]) {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const rows = [["Name", "Email", "Country", "Registered", "Status"], ...list.map((u) => [u.name, u.email, u.country, u.joined, u.status])];
  const blob = new Blob([rows.map((r) => r.map(esc).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `living-teaching-members-${today()}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function Members() {
  const { showToast, can } = useStore();
  const [toggleUserStatus, { isLoading: isTogglingUserStatus }] = useToggleUserStatusMutation();
  const [createAdmin] = useCreateAdminMutation();
  const canManage = can("users.manage");
  const [q, setQ] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [view, setView] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchTerm(q.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [q]);

  const { data, isLoading, isFetching, isError, refetch } = useGetUsersQuery({
    page,
    limit: PAGE,
    ...(searchTerm ? { searchTerm } : {}),
  });
  const responseUsers = Array.isArray(data?.data)
    ? data.data
    : data?.data.items ?? data?.data.data ?? [];
  const users = responseUsers.map(toAppUser);
  const total = data?.pagination?.total ?? (!Array.isArray(data?.data) ? data?.data.total : undefined) ?? users.length;
  const totalPages = Math.max(1, data?.pagination?.totalPage ?? (!Array.isArray(data?.data) ? data?.data.pages : undefined) ?? Math.ceil(total / PAGE));

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return users.filter((u) => !needle || (u.name + u.email + u.country).toLowerCase().includes(needle));
  }, [users, q]);

  const viewing = users.find((u) => u.id === view);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-[220px] flex-1 items-center gap-2.5 rounded-full bg-white px-4 ring-1 ring-line focus-within:ring-2 focus-within:ring-brand-500">
          <Search size={18} className="text-brand-500" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
            }}
            placeholder="Search by name, email or country"
            aria-label="Search members"
            className="w-full bg-transparent py-3 text-[15px] outline-none"
          />
        </div>
        {canManage && <button onClick={() => setAdding(true)} className="flex items-center gap-2 rounded-full bg-brand-700 px-5 py-3 text-[14.5px] font-bold text-white shadow-soft transition hover:bg-brand-800 active:scale-95">
          <UserPlus size={17} /> Add member
        </button>}
        <button
          onClick={() => {
            exportCsv(list);
            showToast(`Exported ${list.length} members`);
          }}
          className="flex items-center gap-2 rounded-full bg-white px-5 py-3 text-[14.5px] font-bold text-brand-700 ring-1 ring-line transition hover:bg-brand-50"
        >
          <Download size={17} /> Export
        </button>
      </div>

      <p className="mb-2 mt-4 text-[13.5px] text-mute">
        Showing <b className="text-ink">{list.length}</b> members on this page · <b className="text-ink">{total}</b> total members
      </p>

      {isError ? (
        <div role="alert" className="rounded-3xl bg-white p-10 text-center shadow-soft">
          <p className="text-[16px] font-semibold">Members could not be loaded</p>
          <p className="mt-1 text-[14px] text-mute">Check your connection and admin access, then try again.</p>
          <button type="button" onClick={() => void refetch()} className="mt-4 rounded-full bg-brand-700 px-5 py-2.5 font-bold text-white">Retry</button>
        </div>
      ) : isLoading ? (
        <p role="status" className="rounded-3xl bg-white p-10 text-center text-[15px] text-mute shadow-soft">Loading members…</p>
      ) : (
      <div className={cn("overflow-hidden rounded-3xl bg-white shadow-soft", isFetching && "opacity-60")} aria-busy={isFetching}>
        <div className="hidden grid-cols-[2fr_2.2fr_1.4fr_1fr_auto] gap-4 border-b border-line bg-paper px-5 py-3 text-[12px] font-bold uppercase tracking-wider text-mute md:grid">
          <span>Name</span>
          <span>Email</span>
          <span>Registered</span>
          <span>Status</span>
          <span className="w-[132px]">Actions</span>
        </div>
        {list.length === 0 && <p className="p-10 text-center text-mute">{total === 0 ? "No members found." : "No members on this page match your filters."}</p>}
        {list.map((u) => (
          <div key={u.id} className="grid items-center gap-3 border-b border-line px-5 py-3.5 last:border-0 md:grid-cols-[2fr_2.2fr_1.4fr_1fr_auto] md:gap-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-800 font-bold text-white">{u.name[0]}</span>
              <div className="min-w-0">
                <p className="truncate text-[15px] font-bold">{u.name}</p>
                <p className="truncate text-[12.5px] text-mute md:hidden">
                  {u.email} · {ago(u.joined)}
                </p>
              </div>
            </div>
            <p className="hidden truncate text-[14px] text-ink/80 md:block">{u.email}</p>
            <div className="hidden md:block">
              <p className="text-[14px] font-semibold">{prettyDate(u.joined)}</p>
              <p className="text-[12.5px] text-mute">{ago(u.joined)}</p>
            </div>
            <span className={cn("inline-flex w-fit rounded-full px-2.5 py-1 text-[12px] font-bold", u.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600")}>{u.status === "active" ? "Active" : "Suspended"}</span>
            <div className="flex w-[132px] items-center gap-2">
              <button onClick={() => setView(u.id)} aria-label={`View ${u.name}`} className="grid h-10 w-10 place-items-center rounded-full bg-brand-50 text-brand-700"><Eye size={17} /></button>
              {canManage && <button
                onClick={() => {
                  void toggleUserStatus({ id: u.id })
                    .unwrap()
                    .then(() => showToast(u.status === "active" ? "Account suspended" : "Account re-activated"))
                    .catch(() => showToast("Failed to update account status"));
                }}
                aria-label={u.status === "active" ? `Suspend ${u.name}` : `Activate ${u.name}`}
                className="grid h-10 w-10 place-items-center rounded-full bg-gold-50 text-gold-600"
                disabled={isTogglingUserStatus}
              >
                {u.status === "active" ? <UserX size={17} /> : <UserCheck size={17} />}
              </button>}
            </div>
          </div>
        ))}
      </div>
      )}
      {totalPages > 1 && !isError && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1 || isFetching} className="flex items-center gap-1 rounded-full bg-white px-4 py-2.5 text-[14px] font-bold text-brand-700 shadow-soft ring-1 ring-line disabled:cursor-not-allowed disabled:opacity-50">
            <ChevronLeft size={17} /> Previous
          </button>
          <span className="text-[14px] font-semibold text-mute">Page {page} of {totalPages}</span>
          <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages || isFetching} className="flex items-center gap-1 rounded-full bg-white px-4 py-2.5 text-[14px] font-bold text-brand-700 shadow-soft ring-1 ring-line disabled:cursor-not-allowed disabled:opacity-50">
            Next <ChevronRight size={17} />
          </button>
        </div>
      )}

      {viewing && (
        <Modal title="Member details" onClose={() => setView(null)}>
          <div className="p-6">
            <div className="flex items-center gap-4">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-800 text-2xl font-bold text-white ring-2 ring-gold-300">{viewing.name[0]}</span>
              <div>
                <p className="text-[19px] font-bold">{viewing.name}</p>
                <p className="text-[14px] text-mute">{viewing.email}</p>
              </div>
            </div>
            <dl className="mt-5 divide-y divide-line rounded-2xl bg-white ring-1 ring-line">
              {[
                ["Registered", prettyDate(viewing.joined)],
                ["Member for", ago(viewing.joined) === "Today" ? "Joined today" : ago(viewing.joined).replace(" ago", "")],
                ["Country", viewing.country],
                ["Status", viewing.status === "active" ? "Active" : "Suspended"],
                ["Member ID", viewing.id.toUpperCase()],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between px-4 py-3 text-[14.5px]">
                  <dt className="text-mute">{k}</dt>
                  <dd className="font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Modal>
      )}
      {adding && (
        <AddMember
          existing={users.map((u) => u.email.toLowerCase())}
          onClose={() => setAdding(false)}
          onAdd={(u) => {
            void createAdmin({
              name: u.name,
              email: u.email,
              status: "active",
              role: "ADMIN",
              subrole: "Admin",
              permissions: ["USER_READ", "USER_CREATE", "USER_UPDATE"],
            })
            .unwrap()
            .then(() => {
              setAdding(false);
              showToast("Member added — statistics updated");
            })
              .catch(() => showToast("Failed to add member"));
          }}
        />
      )}
    </div>
  );
}

function AddMember({ existing, onClose, onAdd }: { existing: string[]; onClose: () => void; onAdd: (u: { name: string; email: string; country: string }) => void }) {
  const [f, setF] = useState({ name: "", email: "", country: "" });
  const [err, setErr] = useState<Record<string, string>>({});
  const submit = () => {
    const e: Record<string, string> = {};
    if (f.name.trim().length < 2) e.name = "Please enter a name";
    if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = "Please enter a valid email";
    else if (existing.includes(f.email.trim().toLowerCase())) e.email = "This email is already registered";
    setErr(e);
    if (!Object.keys(e).length) onAdd({ name: f.name.trim(), email: f.email.trim(), country: f.country.trim() || "—" });
  };
  const field = (k: keyof typeof f, label: string, ph: string, type = "text") => (
    <label className="block">
      <span className="mb-1.5 block text-[13.5px] font-bold">{label}</span>
      <input type={type} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} placeholder={ph} className={inputCls} />
      {err[k] && <span className="mt-1 block text-[12.5px] font-semibold text-red-600">{err[k]}</span>}
    </label>
  );
  return (
    <Modal title="Add a member" onClose={onClose}>
      <div className="space-y-4 p-6">
        {field("name", "Full name", "e.g. Grace Thompson")}
        {field("email", "Email", "name@example.com", "email")}
        {field("country", "Country (optional)", "e.g. Kenya")}
        <p className="rounded-xl bg-paper p-3 text-[12.5px] text-mute">The registration date is set to today and counts toward the growth statistics.</p>
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="rounded-full bg-white px-6 py-3.5 font-bold ring-1 ring-line">Cancel</button>
          <button onClick={submit} className="flex-1 rounded-full bg-brand-700 py-3.5 font-bold text-white">Add member</button>
        </div>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
export function UsersManager() {
  const { data: statsData, isLoading: isLoadingStats } = useGetUserStatisticsQuery({ range: "7days" });
  const [tab, setTab] = useState<"stats" | "members">("stats");

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-[26px] font-bold tracking-tight">Users</h2>
          <p className="mt-1 text-[15px] text-mute">
            <b className="text-ink">{isLoadingStats ? "…" : statsData?.data.statistics.registeredMembers ?? "—"}</b> registered members. See how the community is growing and manage accounts.
          </p>
        </div>
        <div className="flex gap-1 rounded-full bg-white p-1 ring-1 ring-line" role="tablist">
          {(["stats", "members"] as const).map((id) => (
            <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={cn("rounded-full px-5 py-2.5 text-[14px] font-bold transition", tab === id ? "bg-brand-700 text-white shadow-soft" : "text-mute hover:text-brand-700")}>
              {id === "stats" ? "Statistics" : "All members"}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-6">{tab === "stats" ? <Overview openMembers={() => setTab("members")} /> : <Members />}</div>
    </div>
  );
}
