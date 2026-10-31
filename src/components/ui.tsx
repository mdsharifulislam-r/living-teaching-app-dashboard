import { useId, useState, type ComponentType, type ReactNode } from "react";
import { cn } from "../utils/cn";
import { useStore } from "../store";

// ---------------------------------------------------------------------------
// Living Teaching logo — an open book (the Word) beneath a gold cross.
// ---------------------------------------------------------------------------
export function LogoMark({ size = 40, className }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} role="img" aria-label="Living Teaching logo">
      <defs>
        <linearGradient id={`bg${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2b918f" />
          <stop offset="0.55" stopColor="#135a5e" />
          <stop offset="1" stopColor="#0a3639" />
        </linearGradient>
        <linearGradient id={`gd${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f0dc9f" />
          <stop offset="1" stopColor="#c49a3c" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="19" fill={`url(#bg${id})`} />
      <circle cx="32" cy="22" r="15" fill="#fff" opacity="0.07" />
      <rect x="29" y="9" width="6" height="27" rx="2.2" fill={`url(#gd${id})`} />
      <rect x="21.5" y="16.5" width="21" height="6" rx="2.2" fill={`url(#gd${id})`} />
      <path d="M9 41c8-3.6 17-3 23 2v12c-6-4.8-15-5.4-23-2z" fill="#fff" opacity="0.97" />
      <path d="M55 41c-8-3.6-17-3-23 2v12c6-4.8 15-5.4 23-2z" fill="#d6ede9" />
      <path d="M32 43v12" stroke="#c49a3c" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({
  size = 38, light = false, text = true, stacked = false, className,
}: { size?: number; light?: boolean; text?: boolean; stacked?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", stacked && "flex-col gap-3", className)}>
      <LogoMark size={size} />
      {text && (
        <div className={cn("leading-none", stacked && "text-center")}>
          <div
            className={cn("font-extrabold tracking-tight", light ? "text-white" : "text-brand-800")}
            style={{ fontSize: size * (stacked ? 0.52 : 0.44) }}
          >
            Living <span className={light ? "text-gold-300" : "text-gold-500"}>Teaching</span>
          </div>
          {stacked && (
            <div className={cn("mt-1.5 text-[11px] font-semibold uppercase tracking-[0.28em]", light ? "text-white/70" : "text-mute")}>
              Ministry
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
export function Img({ src, alt = "", className, children }: { src: string; alt?: string; className?: string; children?: ReactNode }) {
  const [state, setState] = useState<"loading" | "ok" | "err">("loading");
  return (
    <div className={cn("relative overflow-hidden bg-gradient-to-br from-brand-600 to-brand-900", className)}>
      {state !== "err" && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          draggable={false}
          onLoad={() => setState("ok")}
          onError={() => setState("err")}
          className={cn("absolute inset-0 h-full w-full object-cover transition-opacity duration-500", state === "ok" ? "opacity-100" : "opacity-0")}
        />
      )}
      {children}
    </div>
  );
}

export function GoldBadge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full bg-gold-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-gold-600", className)}>
      {children}
    </span>
  );
}

export function Toast() {
  const { toast } = useStore();
  if (!toast) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-8 z-[200] flex justify-center px-6">
      <div className="anim-slide-up rounded-full bg-brand-950/95 px-5 py-3 text-sm font-semibold text-white shadow-lift backdrop-blur">
        {toast}
      </div>
    </div>
  );
}

export type IconC = ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;

/** Line-style praying hands, drawn to match the Lucide stroke set. */
export const PrayingHands: IconC = ({ size = 24, strokeWidth = 1.8, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M12 2.5v4M10 4.5h4" />
    <path d="M12 9.5c-2.2 1.6-3.8 4-4.3 7l-.6 4.5h9.8l-.6-4.5c-.5-3-2.1-5.4-4.3-7z" />
    <path d="M12 9.5v11.5" />
  </svg>
);
