import type { FrameStyle } from "./types";

/** 初期登録の額縁（localStorage 未設定時の初期値） */
export const DEFAULT_FRAMES: FrameStyle[] = [
  {
    id: "ecc-daigakumae",
    name: "ECCジュニア大学前教室",
    mood: "上下イラスト枠（公式テンプレ）",
    kind: "overlay",
    overlaySrc: "/frames/ecc-daigakumae-overlay.png",
    thumbSrc: "/frames/ecc-daigakumae-thumb.png",
    cream: "#fdf5e0",
    photoTopRatio: 118 / 1024,
    photoBottomRatio: 946 / 1024,
  },
  {
    id: "classic-oak",
    name: "クラシックオーク",
    kind: "solid",
    outer: "#6b3f22",
    mat: "#f4efe6",
    accent: "#3f2414",
    outerRatio: 0.055,
    matRatio: 0.045,
    mood: "木目の落ち着いた額",
  },
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
    id: "matte-black",
    name: "マットブラック",
    kind: "solid",
    outer: "#1a1a1a",
    mat: "#f2f2f2",
    accent: "#444",
    outerRatio: 0.04,
    matRatio: 0.05,
    mood: "引き締まった黒",
  },
  {
    id: "ivory-slim",
    name: "アイボリースリム",
    kind: "solid",
    outer: "#e8dfd0",
    mat: "#ffffff",
    accent: "#cfc3ae",
    outerRatio: 0.028,
    matRatio: 0.07,
    mood: "明るい余白多め",
  },
  {
    id: "navy-museum",
    name: "ネイビーミュージアム",
    kind: "solid",
    outer: "#1c2f4a",
    mat: "#eef2f7",
    accent: "#0f1b2c",
    outerRatio: 0.05,
    matRatio: 0.048,
    mood: "落ち着いた紺",
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
  {
    id: "silver-modern",
    name: "シルバーモダン",
    kind: "solid",
    outer: "#9aa3ad",
    mat: "#f7f8fa",
    accent: "#6d767f",
    outerRatio: 0.035,
    matRatio: 0.04,
    mood: "すっきり銀枠",
  },
  {
    id: "walnut-deep",
    name: "ディープウォルナット",
    kind: "solid",
    outer: "#3b2418",
    mat: "#efe6d8",
    accent: "#22140d",
    outerRatio: 0.06,
    matRatio: 0.04,
    mood: "重厚な木枠",
  },
  {
    id: "mint-fresh",
    name: "ミントフレッシュ",
    kind: "solid",
    outer: "#5f9e90",
    mat: "#f3fbf8",
    accent: "#3f7267",
    outerRatio: 0.04,
    matRatio: 0.05,
    mood: "爽やかな緑",
  },
];

export function getInsets(frame: FrameStyle, width: number, height: number) {
  if (frame.kind === "overlay") {
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
