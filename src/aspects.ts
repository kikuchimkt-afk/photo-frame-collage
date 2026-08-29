import type { AspectPreset } from "./types";

/** Instagram投稿向けの書き出しサイズ（長辺基準 1080px） */
export const ASPECT_PRESETS: AspectPreset[] = [
  {
    id: "feed-4x5",
    label: "フィード（推奨）",
    description: "縦長フィード投稿向け",
    width: 1080,
    height: 1350,
    ratioLabel: "4:5",
  },
  {
    id: "square-1x1",
    label: "正方形",
    description: "クラシックな正方形投稿",
    width: 1080,
    height: 1080,
    ratioLabel: "1:1",
  },
  {
    id: "story-9x16",
    label: "ストーリーズ",
    description: "ストーリーズ / リール表紙向け",
    width: 1080,
    height: 1920,
    ratioLabel: "9:16",
  },
];
