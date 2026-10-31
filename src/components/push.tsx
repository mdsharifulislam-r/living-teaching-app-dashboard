import { LogoMark } from "./ui";
import { cn } from "../utils/cn";
import { useStore } from "../store";

interface PushData {
  title: string;
  body: string;
  image?: string;
}

/** A realistic rich push notification (as it appears on a phone). */
export function PushCard({ n, time = "now", className }: { n: PushData; time?: string; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-[22px] bg-white/95 p-3 shadow-lift ring-1 ring-black/5 backdrop-blur-xl", className)}>
      <div className="flex items-start gap-2.5">
        <LogoMark size={36} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-mute">
            <span>Living Teaching</span>
            <span className="normal-case">{time}</span>
          </div>
          <p className="mt-0.5 line-clamp-2 text-[14.5px] font-bold leading-snug text-ink">{n.title || "Notification title"}</p>
          <p className="mt-0.5 line-clamp-3 text-[13.5px] leading-snug text-ink/75">{n.body || "Your message will appear here."}</p>
        </div>
      </div>
      {n.image && (
        <img src={n.image} alt="" className="mt-2.5 h-[132px] w-full rounded-2xl object-cover" draggable={false} />
      )}
    </div>
  );
}

/** Wallpaper-style frame so the preview looks like a lock screen. */
export function PushPreview({ n }: { n: PushData }) {
  return (
    <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 p-4 pt-8 ring-1 ring-black/5">
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gold-400/20 blur-2xl" />
      <p className="text-center text-[34px] font-light leading-none tracking-tight text-white/90">9:41</p>
      <p className="mb-5 mt-1 text-center text-[12px] font-medium text-white/60">Preview on a phone</p>
      <PushCard n={n} />
    </div>
  );
}

/** Banner shown when a test notification is sent from the dashboard. */
export function PushBanner({ className }: { className?: string }) {
  const { banner, dismissBanner } = useStore();
  if (!banner) return null;
  return (
    <div className={cn("anim-slide-down z-[90]", className)}>
      <button onClick={dismissBanner} aria-label={`Notification: ${banner.title}`} className="block w-full text-left">
        <PushCard n={banner} />
      </button>
    </div>
  );
}
