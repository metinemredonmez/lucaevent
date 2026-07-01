// Admin dosya yükleme: presign (JWT'li) → doğrudan R2/S3'e ham PUT (ilerlemeli).
// lib/api.ts KULLANILMAZ (o Content-Type'ı JSON'a sabitler); asıl PUT düz XHR ile.
import { api } from "@/lib/api";

export type UploadKind = "image" | "video";

const EXT_TYPE: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  m3u8: "application/x-mpegurl",
};

/** Tarayıcı file.type boşsa uzantıdan çıkar. */
function resolveType(file: File, kind: UploadKind): string {
  if (file.type) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase();
  return (ext && EXT_TYPE[ext]) || (kind === "video" ? "video/mp4" : "image/jpeg");
}

type PresignRes = {
  uploadUrl: string;
  publicUrl: string;
  contentType: string;
  maxBytes: number;
};

/** Dosyayı yükler, herkese açık URL'i döner. onProgress: 0-100. */
export async function uploadFile(
  file: File,
  folder: string,
  kind: UploadKind,
  onProgress?: (pct: number) => void,
): Promise<string> {
  const contentType = resolveType(file, kind);
  const pres = await api<PresignRes>("/admin/uploads/presign", {
    method: "POST",
    body: JSON.stringify({ filename: file.name, contentType, folder, size: file.size }),
  });
  // İmzalanan Content-Type ile birebir aynı header ile PUT et (imza content-type'a bağlı).
  await putWithProgress(pres.uploadUrl, file, pres.contentType || contentType, onProgress);
  return pres.publicUrl;
}

function putWithProgress(
  url: string,
  file: File,
  contentType: string,
  onProgress?: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Yükleme başarısız (${xhr.status}). Bucket CORS'u site origin'ine açık mı?`));
    xhr.onerror = () => reject(new Error("Yükleme başarısız (ağ/CORS)."));
    xhr.send(file);
  });
}
