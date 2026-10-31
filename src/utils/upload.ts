import { API_BASE_URL, getAuthToken } from "../config";

export interface ChunkUploadOptions {
  endpoint?: string;
  chunkSize?: number;
  fieldName?: string;
  originalName?: string;
  onProgress?: (progress: number) => void;
}

export async function uploadFileInChunks(file: File, options: ChunkUploadOptions = {}) {
  const endpoint = options.endpoint ?? "/upload/chunk";
  const chunkSize = options.chunkSize ?? 1024 * 1024;
  const fieldName = options.fieldName ?? "chunk";
  const extension = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : "";
  const baseName = file.name.includes(".") ? file.name.slice(0, file.name.lastIndexOf(".")) : file.name;
  const originalName = options.originalName ?? `${baseName}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${extension}`;
  const totalChunks = Math.max(1, Math.ceil(file.size / chunkSize));

  if (!file.name.trim()) {
    throw new Error("The selected file must have a name.");
  }
  if (file.size === 0) {
    throw new Error("The selected file is empty.");
  }
  if (!Number.isInteger(chunkSize) || chunkSize <= 0) {
    throw new Error("The chunk size must be a positive integer.");
  }

  const token = getAuthToken();
  let uploadedPath = "";

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex += 1) {
    const start = chunkIndex * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);

    const formData = new FormData();
    formData.append(fieldName, chunk, originalName);
    formData.append("originalname", originalName);
    formData.append("chunkIndex", String(chunkIndex));
    formData.append("totalChunks", String(totalChunks));

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `Chunk upload failed for ${file.name} (HTTP ${response.status}).`);
    }

    const payload: unknown = await response.json().catch(() => undefined);
    if (typeof payload === "string") {
      uploadedPath = payload;
    } else if (payload && typeof payload === "object") {
      const responseBody = payload as { path?: unknown; filePath?: unknown; url?: unknown; message?: unknown };
      const maybePath = typeof responseBody.path === "string" ? responseBody.path
        : typeof responseBody.filePath === "string" ? responseBody.filePath
        : typeof responseBody.url === "string" ? responseBody.url
        : undefined;
      if (maybePath) uploadedPath = maybePath;
    }

    options.onProgress?.(Math.round(((chunkIndex + 1) / totalChunks) * 100));
  }

  if (!uploadedPath) {
    throw new Error("The upload finished, but the server did not return the uploaded file path.");
  }
  return uploadedPath;
}

export function isImageFile(file: File) {
  return file.type.startsWith("image/");
}
