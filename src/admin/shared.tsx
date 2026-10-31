import { useId, useRef, useState, type ReactNode } from "react";
import { Image as ImageIcon, Upload, X, Trash2 } from "lucide-react";
import { Img } from "../components/ui";
import { cn } from "../utils/cn";
import { useGetManagedContentQuery } from "../api-client";
import { resolveFileUrl } from "../config";

export const inputCls = "w-full rounded-xl bg-white px-4 py-3 text-[15px] text-ink outline-none ring-1 ring-line transition placeholder:text-mute/60 focus:ring-2 focus:ring-brand-500";

export function Modal({ title, onClose, children, wide, className }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean; className?: string }) {
  const titleId = useId();
  return (
    <div className="anim-fade fixed inset-0 z-[60] flex items-end justify-center bg-brand-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className={cn("anim-slide-up flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-[28px] bg-paper shadow-2xl sm:rounded-[28px]", wide ? "max-w-2xl" : "max-w-md", className)}>
        <div className="flex items-center justify-between border-b border-line bg-white px-6 py-4">
          <h2 id={titleId} className="text-[18px] font-bold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full bg-paper text-mute"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDelete({ what, onCancel, onConfirm }: { what: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <Modal title="Delete this item?" onClose={onCancel}>
      <div className="p-6">
        <p className="text-[15.5px] leading-relaxed text-ink/85">
          “{what}” will be removed from the app permanently. If you only want to hide it for now, use <b>Unpublish</b> instead.
        </p>
        <div className="mt-6 flex gap-3">
          <button onClick={onCancel} className="flex-1 rounded-full bg-white py-3.5 font-bold text-ink ring-1 ring-line">Keep it</button>
          <button onClick={onConfirm} className="flex-1 rounded-full bg-red-600 py-3.5 font-bold text-white">Yes, delete</button>
        </div>
      </div>
    </Modal>
  );
}

export async function resizeImage(file: File, max = 1200): Promise<string> {
  const url = URL.createObjectURL(file);
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = url;
  });
  const s = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * s);
  c.height = Math.round(img.height * s);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  URL.revokeObjectURL(url);
  return c.toDataURL("image/jpeg", 0.82);
}


/** Image picker: upload, replace, remove, paste a link, or choose from the app's image library. */
export function ImagePicker({ value, onChange, label = "Image", help }: { value?: string; onChange: (v: string | undefined) => void; label?: string; help?: string }) {
  const { data: imageData, isLoading: isLoadingImages, isError: imageLoadError } = useGetManagedContentQuery("image");
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [showLib, setShowLib] = useState(false);
  const [err, setErr] = useState("");

  return (
    <div>
      <span className="mb-1.5 block text-[13.5px] font-bold text-ink">{label}</span>
      <div className="rounded-2xl bg-white p-3 ring-1 ring-line">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative grid h-[120px] w-full shrink-0 place-items-center overflow-hidden rounded-xl bg-paper sm:w-[190px]">
            {value ? (
              <Img src={value.startsWith("data:") ? value : resolveFileUrl(value)} className="h-full w-full" />
            ) : (
              <div className="text-center text-mute">
                <ImageIcon size={30} className="mx-auto text-brand-300" />
                <p className="mt-1 text-[12px] font-medium">No image</p>
              </div>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <input
              ref={ref}
              type="file"
              accept="image/*"
              hidden
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                setBusy(true);
                setErr("");
                try {
                  onChange(await resizeImage(file, 1000));
                } catch {
                  setErr("That file couldn't be read. Please choose a JPG or PNG photo.");
                } finally {
                  setBusy(false);
                }
              }}
            />
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => ref.current?.click()} className="flex items-center gap-2 rounded-full bg-brand-700 px-4 py-2.5 text-[13.5px] font-bold text-white transition hover:bg-brand-800">
                <Upload size={16} /> {busy ? "Preparing…" : value ? "Replace image" : "Upload image"}
              </button>
              <button type="button" onClick={() => setShowLib((v) => !v)} className="flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2.5 text-[13.5px] font-bold text-brand-700 transition hover:bg-brand-100">
                <ImageIcon size={16} /> Choose from library
              </button>
              {value && (
                <button type="button" onClick={() => onChange(undefined)} className="flex items-center gap-2 rounded-full bg-red-50 px-4 py-2.5 text-[13.5px] font-bold text-red-600 transition hover:bg-red-100">
                  <Trash2 size={16} /> Remove
                </button>
              )}
            </div>
            <input
              value={value && !value.startsWith("data:") ? value : ""}
              onChange={(e) => onChange(e.target.value.trim() || undefined)}
              placeholder="…or paste an image link (https://…)"
              className={cn(inputCls, "py-2.5 text-[13.5px]")}
            />
          </div>
        </div>
        {showLib && (
          <div className="anim-fade mt-3 border-t border-line pt-3">
            <p className="mb-2 text-[12.5px] font-semibold text-mute">Tap a photo from the app's image library</p>
            {isLoadingImages ? (
              <p role="status" className="py-4 text-center text-[13px] text-mute">Loading images…</p>
            ) : imageLoadError ? (
              <p role="alert" className="py-4 text-center text-[13px] text-red-600">Could not load the image library. Try again after checking your connection.</p>
            ) : (
            <div className="thin-scroll grid max-h-[150px] grid-cols-4 gap-2 overflow-y-auto sm:grid-cols-6">
              {(imageData?.data ?? []).map((image) => {
                const imageUrl = typeof image.image === "string" ? image.image : "";
                const imageId = String(image._id ?? image.id ?? imageUrl);
                const title = typeof image.title === "string" ? image.title : "Gallery image";
                return (
                <button
                  key={imageId}
                  type="button"
                  onClick={() => {
                    onChange(imageUrl);
                    setShowLib(false);
                  }}
                  aria-label={`Use ${title}`}
                  className={cn("overflow-hidden rounded-xl ring-2 transition", value === imageUrl ? "ring-gold-500" : "ring-transparent hover:ring-brand-300")}
                >
                  <img src={resolveFileUrl(imageUrl)} alt="" className="aspect-square w-full object-cover" />
                </button>
                );
              })}
            </div>
            )}
          </div>
        )}
      </div>
      {err ? <span className="mt-1 block text-[12.5px] font-semibold text-red-600">{err}</span> : help && <span className="mt-1 block text-[12.5px] text-mute">{help}</span>}
    </div>
  );
}

/** Round avatar: shows the photo, or the person's initials. */
export function Avatar({ name, src, size = 40, ring = false, className }: { name: string; src?: string; size?: number; ring?: boolean; className?: string }) {
  const initials = name.replace(/^(Pastor|Dr\.?|Rev\.?)\s+/i, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
  return (
    <span
      className={cn("relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-brand-500 to-brand-800 font-bold text-white", ring && "ring-2 ring-gold-300", className)}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {src ? <img src={src} alt="" className="h-full w-full object-cover" draggable={false} /> : initials || "?"}
    </span>
  );
}

/** Centre-crops a photo to a small square (for profile pictures). */
export async function cropSquare(file: File, size = 320): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    const side = Math.min(img.width, img.height);
    const c = document.createElement("canvas");
    c.width = c.height = size;
    c.getContext("2d")!.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
    return c.toDataURL("image/jpeg", 0.86);
  } finally {
    URL.revokeObjectURL(url);
  }
}
