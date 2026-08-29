import type { FrameStyle } from "./types";

/** あらかじめ登録した額縁10種 */
export const FRAMES: FrameStyle[] = [
  {
    id: "classic-oak",
    name: "クラシックオーク",
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
    outer: "#5f9e90",
    mat: "#f3fbf8",
    accent: "#3f7267",
    outerRatio: 0.04,
    matRatio: 0.05,
    mood: "爽やかな緑",
  },
  {
    id: "round-polaroid",
    name: "ポラロイド風",
    outer: "#f5f5f5",
    mat: "#ffffff",
    accent: "#d8d8d8",
    outerRatio: 0.02,
    matRatio: 0.12,
    photoRadiusRatio: 0.01,
    mood: "下余白のある写真風",
  },
];

/** ポラロイド風は下マットを厚くする */
export function getInsets(frame: FrameStyle, width: number, height: number) {
  const short = Math.min(width, height);
  const outer = short * frame.outerRatio;
  const mat = short * frame.matRatio;

  if (frame.id === "round-polaroid") {
    return {
      outer,
      left: outer + mat * 0.55,
      right: outer + mat * 0.55,
      top: outer + mat * 0.45,
      bottom: outer + mat * 1.55,
      radius: short * (frame.photoRadiusRatio ?? 0),
    };
  }

  return {
    outer,
    left: outer + mat,
    right: outer + mat,
    top: outer + mat,
    bottom: outer + mat,
    radius: short * (frame.photoRadiusRatio ?? 0),
  };
}
