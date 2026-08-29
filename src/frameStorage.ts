import { DEFAULT_FRAMES } from "./frames";
import type { FrameStyle } from "./types";

const STORAGE_KEY = "photo-frame-collage-frames-v1";

function cloneDefaults(): FrameStyle[] {
  return DEFAULT_FRAMES.map((f) => ({ ...f }));
}

export function loadFrames(): FrameStyle[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return cloneDefaults();
    const parsed = JSON.parse(raw) as FrameStyle[];
    if (!Array.isArray(parsed) || parsed.length === 0) return cloneDefaults();
    return parsed;
  } catch {
    return cloneDefaults();
  }
}

export function saveFrames(frames: FrameStyle[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(frames));
}

export function resetFramesToDefault(): FrameStyle[] {
  const next = cloneDefaults();
  saveFrames(next);
  return next;
}

/** 画像を縮小して data URL 化（localStorage 容量対策） */
export async function imageFileToDataUrl(
  file: File,
  maxWidth = 1080,
): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width);
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  // PNG で透過を残す（イラスト枠向け）
  return canvas.toDataURL("image/png");
}
