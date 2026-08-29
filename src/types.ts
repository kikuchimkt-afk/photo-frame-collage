export type AspectPreset = {
  id: "feed-4x5" | "square-1x1" | "story-9x16";
  label: string;
  description: string;
  width: number;
  height: number;
  ratioLabel: string;
};

export type FrameStyle = {
  id: string;
  name: string;
  mood: string;
  kind: "solid" | "overlay";
  /** solid 用 */
  outer?: string;
  mat?: string;
  accent?: string;
  outerRatio?: number;
  matRatio?: number;
  photoRadiusRatio?: number;
  /** overlay 用（イラスト額縁） */
  overlaySrc?: string;
  thumbSrc?: string;
  cream?: string;
  /** 写真領域の上端・下端（キャンバス高さに対する比率） */
  photoTopRatio?: number;
  photoBottomRatio?: number;
};

export type PhotoTransform = {
  scale: number;
  offsetX: number;
  offsetY: number;
};
