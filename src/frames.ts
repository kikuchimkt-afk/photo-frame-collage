import type { FrameStyle, MascotPlacement } from "./types";

export const DEFAULT_MASCOT: MascotPlacement = {
  x: 0.02,
  y: 0.7,
  scale: 0.44,
  visible: true,
};

/** 初期登録の額縁（シンプルな2種） */
export const DEFAULT_FRAMES: FrameStyle[] = [
  {
    id: "gold-gallery",
    name: "ゴールドギャラリー",
    kind: "solid",
    outer: "#c9a227",
    mat: "#fffaf0",
    accent: "#8a6a12",
    outerRatio: 0.048,
    matRatio: 0.055,
    mood: "華やかな金縁",
  },
  {
    id: "rose-soft",
    name: "ローズソフト",
    kind: "solid",
    outer: "#c4878a",
    mat: "#fff5f5",
    accent: "#9a5d61",
    outerRatio: 0.042,
    matRatio: 0.052,
    mood: "やさしいピンク",
  },
];

export function getInsets(frame: FrameStyle, width: number, height: number) {
  if (frame.kind === "overlay" || frame.kind === "banded") {
    const top = height * (frame.photoTopRatio ?? 0.12);
    const bottomEdge = height * (frame.photoBottomRatio ?? 0.9);
    return {
      outer: 0,
      left: 0,
      right: 0,
      top,
      bottom: height - bottomEdge,
      radius: 0,
    };
  }

  const short = Math.min(width, height);
  const outer = short * (frame.outerRatio ?? 0.04);
  const mat = short * (frame.matRatio ?? 0.05);

  return {
    outer,
    left: outer + mat,
    right: outer + mat,
    top: outer + mat,
    bottom: outer + mat,
    radius: short * (frame.photoRadiusRatio ?? 0),
  };
}

export function createFrameId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `frame-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function resolveMascotPlacement(frame: FrameStyle): MascotPlacement {
  return {
    ...DEFAULT_MASCOT,
    ...(frame.mascotDefault ?? {}),
    visible: frame.mascotDefault?.visible ?? Boolean(frame.mascotSrc),
  };
}
