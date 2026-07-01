"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, X, Film, Image as ImageIcon } from "lucide-react";
import { uploadFile, type UploadKind } from "@/lib/upload";

/** Admin görsel/video yükleyici — R2'ye presigned PUT, ilerleme + önizleme. */
export function MediaUpload({
  kind,
  folder,
  value,
  onChange,
  buttonLabel,
}: {
  kind: UploadKind;
  folder: string;
  value?: string;
  onChange: (url: string) => void;
  buttonLabel?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [err, setErr] = useState("");

  const accept = kind === "video" ? "video/*" : "image/*";
  const Icon = kind === "video" ? Film : ImageIcon;

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setErr("");
    setBusy(true);
    setPct(0);
    try {
      const url = await uploadFile(file, folder, kind, setPct);
      onChange(url);
    } catch (e: any) {
      setErr(e?.message || "Yükleme başarısız.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <input ref={ref} type="file" accept={accept} className="hidden" onChange={onPick} />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground transition hover:border-[#8B5CF6]/50 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {busy ? `Yükleniyor… %${pct}` : buttonLabel || (kind === "video" ? "Video yükle (R2)" : "Görsel yükle (R2)")}
        </button>
        {value && !busy && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
          >
            <X className="h-3.5 w-3.5" /> kaldır
          </button>
        )}
      </div>

      {busy && (
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-border">
          <div className="h-full bg-[#8B5CF6] transition-all" style={{ width: `${pct}%` }} />
        </div>
      )}

      {value && !busy && (
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
          {kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt=""
              className="h-12 w-12 rounded border border-border object-cover"
            />
          ) : (
            <span className="max-w-[260px] truncate">{value}</span>
          )}
        </div>
      )}

      {err && <p className="mt-1 text-xs text-destructive">{err}</p>}
    </div>
  );
}
