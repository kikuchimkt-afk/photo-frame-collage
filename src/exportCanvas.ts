import { getInsets } from "./frames";
import type { AspectPreset, FrameStyle, PhotoTransform } from "./types";

function coverDraw(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  transform: PhotoTransform,
) {
  const scaleFit = Math.max(w / img.naturalWidth, h / img.naturalHeight) * transform.scale;
  const dw = img.naturalWidth * scaleFit;
  const dh = img.naturalHeight * scaleFit;
  const maxOx = Math.max(0, (dw - w) / 2);
  const maxOy = Math.max(0, (dh - h) / 2);
  const dx = x + (w - dw) / 2 + transform.offsetX * maxOx;
  const dy = y + (h - dh) / 2 + transform.offsetY * maxOy;

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export function renderCollage(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement | null,
  frame: FrameStyle,
  aspect: AspectPreset,
  transform: PhotoTransform,
  overlayImage: HTMLImageElement | null = null,
) {
  const { width, height } = aspect;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const insets = getInsets(frame, width, height);
  const photoX = insets.left;
  const photoY = insets.top;
  const photoW = width - insets.left - insets.right;
  const photoH = height - insets.top - insets.bottom;

  if (frame.kind === "overlay") {
    ctx.fillStyle = frame.cream ?? "#fdf5e0";
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "#d9dee3";
    ctx.fillRect(photoX, photoY, photoW, photoH);

    if (img) {
      coverDraw(ctx, img, photoX, photoY, photoW, photoH, transform);
    } else {
      ctx.fillStyle = "#6b7c89";
      ctx.font = `${Math.floor(Math.min(photoW, photoH) * 0.05)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("写真を選択", photoX + photoW / 2, photoY + photoH / 2);
    }

    if (overlayImage) {
      ctx.drawImage(overlayImage, 0, 0, width, height);
    }
    return;
  }

  ctx.fillStyle = frame.outer ?? "#333";
  ctx.fillRect(0, 0, width, height);

  if (frame.accent) {
    ctx.strokeStyle = frame.accent;
    ctx.lineWidth = Math.max(2, insets.outer * 0.18);
    ctx.strokeRect(
      insets.outer * 0.35,
      insets.outer * 0.35,
      width - insets.outer * 0.7,
      height - insets.outer * 0.7,
    );
  }

  ctx.fillStyle = frame.mat ?? "#fff";
  ctx.fillRect(
    insets.outer,
    insets.outer,
    width - insets.outer * 2,
    height - insets.outer * 2,
  );

  ctx.fillStyle = "#d9dee3";
  if (insets.radius > 0) {
    roundRect(ctx, photoX, photoY, photoW, photoH, insets.radius);
    ctx.fill();
  } else {
    ctx.fillRect(photoX, photoY, photoW, photoH);
  }

  if (img) {
    ctx.save();
    if (insets.radius > 0) {
      roundRect(ctx, photoX, photoY, photoW, photoH, insets.radius);
      ctx.clip();
    }
    coverDraw(ctx, img, photoX, photoY, photoW, photoH, transform);
    ctx.restore();
  } else {
    ctx.fillStyle = "#6b7c89";
    ctx.font = `${Math.floor(Math.min(photoW, photoH) * 0.06)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("写真を選択", photoX + photoW / 2, photoY + photoH / 2);
  }

  ctx.strokeStyle = "rgba(0,0,0,0.18)";
  ctx.lineWidth = Math.max(1, Math.min(width, height) * 0.002);
  ctx.strokeRect(photoX, photoY, photoW, photoH);
}

export function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`failed to load ${src}`));
    img.src = src;
  });
}
