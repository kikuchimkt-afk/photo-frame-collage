export type AspectPreset = {
  id: "feed-4x5" | "square-1x1" | "story-9x16";
  label: string;
  description: string;
  width: number;
  height: number;
  ratioLabel: string;
};

/** マスコット位置（キャンバス相対 0–1。scale は幅に対する比率） */
export type MascotPlacement = {
  x: number;
  y: number;
  scale: number;
  visible: boolean;
};

export type FrameStyle = {
  id: string;
  name: string;
  mood: string;
  kind: "solid" | "overlay" | "banded";
  /** solid 用 */
  outer?: string;
  mat?: string;
  accent?: string;
  outerRatio?: number;
  matRatio?: number;
  photoRadiusRatio?: number;
  /** overlay 用（一枚絵） */
  overlaySrc?: string;
  thumbSrc?: string;
  cream?: string;
  photoTopRatio?: number;
  photoBottomRatio?: number;
  /** banded 用（上下帯は固定、マスコットは別配置） */
  topBandSrc?: string;
  bottomBandSrc?: string;
  mascotSrc?: string;
  mascotDefault?: MascotPlacement;
};

export type PhotoTransform = {
  scale: number;
  offsetX: number;
  offsetY: number;
};

export type FramePartDraft = {
  name: string;
  mood: string;
  cream: string;
  topBandDataUrl: string;
  bottomBandDataUrl: string;
  mascotDataUrl: string | null;
  photoTopRatio: number;
  photoBottomRatio: number;
  mascotDefault: MascotPlacement;
  thumbDataUrl: string;
};
