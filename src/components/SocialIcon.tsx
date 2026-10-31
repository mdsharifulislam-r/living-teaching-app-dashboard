import { Globe } from "lucide-react";

export function SocialIcon({ network, size = 22 }: { network: string; size?: number }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (network) {
    case "Facebook":
      return <svg {...p}><path d="M15 3.5h-2.2A3.8 3.8 0 009 7.3V10H6.5v3.4H9V21h3.4v-7.6h2.6l.5-3.4h-3.1V7.8c0-.5.4-.9.9-.9H15z" fill="currentColor" stroke="none" /></svg>;
    case "Instagram":
      return <svg {...p}><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="3.8" /><circle cx="17.2" cy="6.8" r="0.8" fill="currentColor" /></svg>;
    case "YouTube":
      return <svg {...p}><rect x="2.5" y="5.5" width="19" height="13" rx="4" /><path d="M10 9.5v5l4.5-2.5z" fill="currentColor" /></svg>;
    case "WhatsApp":
      return <svg {...p}><path d="M3.5 20.5l1.4-4.3A8.5 8.5 0 1112 20.5a8.4 8.4 0 01-4.2-1.1z" /><path d="M9 8.5c-.3 2.6 2.8 5.9 6 6.3l1.2-1.4-2-1-.9.8c-.9-.4-1.7-1.2-2-2.1l.8-.9-1-2z" fill="currentColor" stroke="none" /></svg>;
    case "TikTok":
      return <svg {...p}><path d="M14 3.5v11a3.6 3.6 0 11-3.6-3.6" /><path d="M14 3.5c.3 2.3 1.9 3.8 4.5 4" /></svg>;
    case "X":
      return <svg {...p}><path d="M4.5 4l15 16M19.5 4l-15 16" /></svg>;
    case "Telegram":
      return <svg {...p}><path d="M21 4L3 11l6 2.2L11 19l3.2-4L19 18.5z" /><path d="M9 13.2L21 4" /></svg>;
    default:
      return <Globe size={size} />;
  }
}

