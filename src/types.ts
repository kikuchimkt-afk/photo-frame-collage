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
  /** 外側の額縁色 */
  outer: string;
  /** 内側マット色 */
  mat: string;
  /** アクセント線 */
  accent?: string;
  /** 外枠の太さ（短辺に対する割合） */
  outerRatio: number;
  /** マットの太さ（短辺に対する割合） */
  matRatio: number;
  /** 写真の角丸（短辺に対する割合） */
  photoRadiusRatio?: number;
  mood: string;
};

export type PhotoTransform = {
  scale: number;
  offsetX: number; // -1..1 relative to photo area
  offsetY: number;
};
