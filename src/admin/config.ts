import {
  AUDIO_CATEGORIES, IMAGE_CATEGORIES, NETWORKS, fmtTime, isoDay, prettyDate, today,
  type Base, type ContentKind,
} from "../data/content";

export type FieldType = "text" | "textarea" | "select" | "image" | "audio" | "number" | "date";
export interface Field {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  help?: string;
  required?: boolean;
  placeholder?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Item = Base & Record<string, any>;

export interface KindConfig {
  label: string;
  singular: string;
  hint: string;
  title: (i: Item) => string;
  sub: (i: Item) => string;
  thumb: (i: Item) => string | undefined;
  fields: Field[];
  blank: () => Record<string, unknown>;
}

export const CONFIG: Record<ContentKind, KindConfig> = {
  prayers: {
    label: "Prayers", singular: "Prayer", hint: "Written and audio prayers shown in the Prayers tab.",
    title: (i) => i.title, sub: (i) => [i.duration ? fmtTime(i.duration) : "", i.desc].filter(Boolean).join(" · "), thumb: (i) => i.image,
    fields: [
      { key: "title", label: "Prayer title", type: "text", required: true, placeholder: "e.g. Morning Prayer" },
      { key: "desc", label: "Short description", type: "text", required: true, placeholder: "One short sentence" },
      { key: "text", label: "Prayer text", type: "textarea", required: true, help: "Leave a blank line between paragraphs." },
      { key: "image", label: "Cover image", type: "image", required: true },
      { key: "audio", label: "Prayer audio (optional)", type: "audio", help: "Audio is uploaded to the server in chunks." },
    ],
    blank: () => ({ title: "", desc: "", text: "", image: "", duration: 300 }),
  },
  audio: {
    label: "Audio", singular: "Audio", hint: "Worship, sermons and spiritual messages.",
    title: (i) => i.title, sub: (i) => [i.category, i.duration ? fmtTime(i.duration) : ""].filter(Boolean).join(" · "), thumb: (i) => i.image,
    fields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "desc", label: "Short description", type: "text", required: true },
      { key: "category", label: "Category", type: "select", options: AUDIO_CATEGORIES },
      { key: "image", label: "Artwork", type: "image", required: true },
      { key: "audio", label: "Audio file", type: "audio", help: "Audio is uploaded to the server in chunks." },
    ],
    blank: () => ({ title: "", desc: "", category: AUDIO_CATEGORIES[0], image: "", duration: 600 }),
  },
  encouragements: {
    label: "Encouragements", singular: "Encouragement", hint: "Short, uplifting words with a beautiful photo.",
    title: (i) => `“${i.quote}”`, sub: (i) => `${i.author} · ${prettyDate(i.date)}`, thumb: (i) => i.image,
    fields: [
      { key: "quote", label: "Message", type: "textarea", required: true, placeholder: "Keep it short and encouraging" },
      { key: "author", label: "Author", type: "text", required: true },
      { key: "date", label: "Date", type: "date" },
      { key: "image", label: "Photo", type: "image", required: true },
    ],
    blank: () => ({ quote: "", author: "Living Teaching", date: today(), image: "" }),
  },
  teachings: {
    label: "Teachings", singular: "Teaching", hint: "Manage teaching messages, audio, and publishing status.",
    title: (i) => i.title, sub: (i) => i.audioName ? "Audio teaching" : "Written teaching", thumb: (i) => i.image,
    fields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "body", label: "Full teaching", type: "textarea", required: true, help: "Leave a blank line between paragraphs." },
      { key: "audio", label: "Teaching audio (optional)", type: "audio", help: "Audio is uploaded to the server in chunks." },
      { key: "image", label: "Cover image", type: "image", required: true },
    ],
    blank: () => ({ title: "", body: "", image: "" }),
  },
  verses: {
    label: "Verse of the Day", singular: "Verse", hint: "The verse shown on Home. The latest verse dated today or earlier is displayed.",
    title: (i) => `“${i.text}”`, sub: (i) => `${i.ref} · shows on ${prettyDate(i.date)}`, thumb: (i) => i.image,
    fields: [
      { key: "text", label: "Verse text", type: "textarea", required: true },
      { key: "ref", label: "Reference", type: "text", required: true, placeholder: "e.g. Psalm 119:105" },
      { key: "date", label: "Show on date", type: "date", help: "Pick a future date to schedule the verse." },
      { key: "image", label: "Background image", type: "image", required: true, help: "Tall photos work best." },
    ],
    blank: () => ({ text: "", ref: "", date: isoDay(1), image: "" }),
  },
  images: {
    label: "Images", singular: "Image", hint: "Photos for the inspiration gallery.",
    title: (i) => i.title, sub: (i) => i.category, thumb: (i) => i.image,
    fields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "category", label: "Category", type: "select", options: IMAGE_CATEGORIES },
      { key: "caption", label: "Caption (optional)", type: "text" },
      { key: "image", label: "Image", type: "image", required: true },
    ],
    blank: () => ({ title: "", category: IMAGE_CATEGORIES[0], caption: "", image: "" }),
  },
  socials: {
    label: "Social Links", singular: "Social link", hint: "Shown on the Profile screen of the app.",
    title: (i) => i.network, sub: (i) => `${i.label} · ${i.url}`, thumb: () => undefined,
    fields: [
      { key: "network", label: "Network", type: "select", options: NETWORKS },
      { key: "label", label: "Display name", type: "text", required: true, placeholder: "@livingteaching" },
      { key: "url", label: "Link (URL)", type: "text", required: true, placeholder: "https://…" },
    ],
    blank: () => ({ network: NETWORKS[0], label: "", url: "" }),
  },
};
