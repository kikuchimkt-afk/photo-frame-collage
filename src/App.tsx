import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { FrameLibrary } from "./components/FrameLibrary";
import { FramePartsStudio } from "./components/FramePartsStudio";
import { ASPECT_PRESETS } from "./aspects";
import { downloadCanvas, loadImage, renderCollage, type LayerImages } from "./exportCanvas";
import { DEFAULT_FRAMES, resolveMascotPlacement } from "./frames";
import { loadFrames, resetFramesToDefault, saveFrames } from "./frameStorage";
import type {
  AspectPreset,
  FrameStyle,
  MascotPlacement,
  PhotoTransform,
} from "./types";
import "./App.css";

const DEFAULT_TRANSFORM: PhotoTransform = {
  scale: 1,
  offsetX: 0,
  offsetY: 0,
};

type DragState = {
  pointerId: number;
  offsetX: number; // canvas px from mascot top-left to pointer
  offsetY: number;
};

function mascotSize(
  placement: MascotPlacement,
  mascot: HTMLImageElement,
  canvasW: number,
) {
  const w = canvasW * placement.scale;
  const h = (w * mascot.naturalHeight) / Math.max(1, mascot.naturalWidth);
  return { w, h };
}

export default function App() {
  const [frames, setFrames] = useState<FrameStyle[]>(() => DEFAULT_FRAMES);
  const [ready, setReady] = useState(false);
  const [frame, setFrame] = useState<FrameStyle>(DEFAULT_FRAMES[0]);
  const [aspect, setAspect] = useState<AspectPreset>(ASPECT_PRESETS[0]);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [layers, setLayers] = useState<LayerImages>({});
  const [mascot, setMascot] = useState<MascotPlacement>(() =>
    resolveMascotPlacement(DEFAULT_FRAMES[0]),
  );
  const [transform, setTransform] = useState<PhotoTransform>(DEFAULT_TRANSFORM);
  const [partsOpen, setPartsOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<DragState | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loaded = loadFrames();
    setFrames(loaded);
    const first = loaded[0] ?? DEFAULT_FRAMES[0];
    setFrame(first);
    setMascot(resolveMascotPlacement(first));
    setReady(true);
  }, []);

  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);

  useEffect(() => {
    if (!photoUrl) {
      setImage(null);
      return;
    }
    const img = new Image();
    img.onload = () => setImage(img);
    img.src = photoUrl;
  }, [photoUrl]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const next: LayerImages = {};
      try {
        if (frame.kind === "overlay" && frame.overlaySrc) {
          next.overlay = await loadImage(frame.overlaySrc);
        }
        if (frame.kind === "banded") {
          if (frame.topBandSrc) next.topBand = await loadImage(frame.topBandSrc);
          if (frame.bottomBandSrc) next.bottomBand = await loadImage(frame.bottomBandSrc);
          if (frame.mascotSrc) next.mascot = await loadImage(frame.mascotSrc);
        }
        if (!cancelled) setLayers(next);
      } catch {
        if (!cancelled) setLayers({});
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [frame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderCollage(canvas, image, frame, aspect, transform, layers, mascot);
  }, [image, frame, aspect, transform, layers, mascot]);

  const previewStyle = useMemo(() => {
    const maxW = 360;
    const scale = maxW / aspect.width;
    return {
      width: `${aspect.width * scale}px`,
      height: `${aspect.height * scale}px`,
    };
  }, [aspect]);

  const canDragMascot =
    frame.kind === "banded" && Boolean(frame.mascotSrc) && mascot.visible && Boolean(layers.mascot);

  const persistFrames = (next: FrameStyle[]) => {
    setFrames(next);
    saveFrames(next);
    if (!next.some((f) => f.id === frame.id)) {
      const fallback = next[0] ?? DEFAULT_FRAMES[0];
      setFrame(fallback);
      setMascot(resolveMascotPlacement(fallback));
    }
  };

  const selectFrame = (next: FrameStyle) => {
    setFrame(next);
    setMascot(resolveMascotPlacement(next));
  };

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    const url = URL.createObjectURL(file);
    setPhotoUrl(url);
    setTransform(DEFAULT_TRANSFORM);
  };

  const handleDownload = () => {
    if (!image) {
      window.alert("先に写真を選んでください。");
      return;
    }
    if (frame.kind === "overlay" && !layers.overlay) {
      window.alert("額縁画像の読み込み中です。少し待ってから再度お試しください。");
      return;
    }
    if (frame.kind === "banded" && (!layers.topBand || !layers.bottomBand)) {
      window.alert("額縁パーツの読み込み中です。少し待ってから再度お試しください。");
      return;
    }
    const canvas = document.createElement("canvas");
    renderCollage(canvas, image, frame, aspect, transform, layers, mascot);
    downloadCanvas(
      canvas,
      `collage-${frame.id}-${aspect.ratioLabel.replace(":", "x")}.png`,
    );
  };

  const clientToCanvas = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    return {
      x: ((clientX - rect.left) / rect.width) * aspect.width,
      y: ((clientY - rect.top) / rect.height) * aspect.height,
    };
  };

  const hitMascot = (cx: number, cy: number) => {
    const mascotImg = layers.mascot;
    if (!mascotImg || !mascot.visible) return false;
    const { w, h } = mascotSize(mascot, mascotImg, aspect.width);
    const left = mascot.x * aspect.width;
    const top = mascot.y * aspect.height;
    return cx >= left && cx <= left + w && cy >= top && cy <= top + h;
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!canDragMascot || !layers.mascot) return;
    const pt = clientToCanvas(e.clientX, e.clientY);
    if (!pt || !hitMascot(pt.x, pt.y)) return;
    const left = mascot.x * aspect.width;
    const top = mascot.y * aspect.height;
    dragRef.current = {
      pointerId: e.pointerId,
      offsetX: pt.x - left,
      offsetY: pt.y - top,
    };
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId || !layers.mascot) return;
    const pt = clientToCanvas(e.clientX, e.clientY);
    if (!pt) return;
    const { w, h } = mascotSize(mascot, layers.mascot, aspect.width);
    const left = Math.min(Math.max(0, pt.x - drag.offsetX), aspect.width - w);
    const top = Math.min(Math.max(0, pt.y - drag.offsetY), aspect.height - h);
    setMascot((m) => ({
      ...m,
      x: left / aspect.width,
      y: top / aspect.height,
    }));
  };

  const endDrag = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    dragRef.current = null;
    setDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  };

  if (!ready) {
    return (
      <div className="app">
        <p className="lead">読み込み中…</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="hero">
        <p className="brand">Photo Frame Collage</p>
        <h1>額縁に1枚入れて、Instagram向けに書き出す</h1>
        <p className="subtitle">
          上下帯は固定、マスコットはドラッグで好きな位置に置けます。額縁パーツも作成できます。
        </p>
      </header>

      <main className="layout">
        <section className="panel preview-panel">
          <div className="preview-meta">
            <h2>プレビュー</h2>
            <p>
              {aspect.label} · {aspect.ratioLabel} · {aspect.width}×{aspect.height}
            </p>
          </div>
          <div className="preview-stage">
            <canvas
              ref={canvasRef}
              className={`preview-canvas${canDragMascot ? " mascot-draggable" : ""}${dragging ? " dragging" : ""}`}
              style={previewStyle}
              aria-label="コラージュプレビュー"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
            />
          </div>
          {canDragMascot ? (
            <p className="drag-hint">マスコットをドラッグして位置を変えられます</p>
          ) : null}
          <div className="preview-actions">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                handleFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              className="btn-primary"
              onClick={() => fileRef.current?.click()}
            >
              写真を選ぶ（1枚）
            </button>
            <button type="button" className="btn-secondary" onClick={handleDownload}>
              PNGで書き出し
            </button>
          </div>
        </section>

        <div className="side">
          <section className="panel">
            <h2>Instagram比率</h2>
            <div className="option-grid">
              {ASPECT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={`option-card${aspect.id === preset.id ? " active" : ""}`}
                  onClick={() => setAspect(preset)}
                >
                  <strong>{preset.label}</strong>
                  <span>{preset.ratioLabel}</span>
                  <small>{preset.description}</small>
                </button>
              ))}
            </div>
          </section>

          {partsOpen ? (
            <FramePartsStudio
              onCancel={() => setPartsOpen(false)}
              onSave={(created) => {
                const next = [...frames, created];
                persistFrames(next);
                selectFrame(created);
                setPartsOpen(false);
              }}
            />
          ) : (
            <FrameLibrary
              frames={frames}
              selectedId={frame.id}
              onSelect={selectFrame}
              onChange={persistFrames}
              onOpenPartsStudio={() => setPartsOpen(true)}
              onResetDefaults={() => {
                const next = resetFramesToDefault();
                setFrames(next);
                selectFrame(next[0]);
              }}
            />
          )}

          {frame.kind === "banded" && frame.mascotSrc ? (
            <section className="panel">
              <h2>マスコット</h2>
              <p className="lead">プレビュー上でドラッグして配置できます。大きさも調整できます。</p>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={mascot.visible}
                  onChange={(e) =>
                    setMascot((m) => ({ ...m, visible: e.target.checked }))
                  }
                />
                <span>マスコットを表示</span>
              </label>
              <label className="slider">
                <span>大きさ {mascot.scale.toFixed(2)}</span>
                <input
                  type="range"
                  min={0.15}
                  max={0.7}
                  step={0.01}
                  value={mascot.scale}
                  disabled={!mascot.visible}
                  onChange={(e) =>
                    setMascot((m) => ({ ...m, scale: Number(e.target.value) }))
                  }
                />
              </label>
              <button
                type="button"
                className="btn-ghost"
                disabled={!mascot.visible}
                onClick={() => setMascot(resolveMascotPlacement(frame))}
              >
                位置をリセット
              </button>
            </section>
          ) : null}

          <section className="panel">
            <h2>写真の位置・大きさ</h2>
            <p className="lead">額縁の内側で、拡大と位置を調整できます。</p>
            <label className="slider">
              <span>拡大 {transform.scale.toFixed(2)}</span>
              <input
                type="range"
                min={1}
                max={2.5}
                step={0.01}
                value={transform.scale}
                disabled={!image}
                onChange={(e) =>
                  setTransform((t) => ({ ...t, scale: Number(e.target.value) }))
                }
              />
            </label>
            <label className="slider">
              <span>左右 {transform.offsetX.toFixed(2)}</span>
              <input
                type="range"
                min={-1}
                max={1}
                step={0.01}
                value={transform.offsetX}
                disabled={!image}
                onChange={(e) =>
                  setTransform((t) => ({ ...t, offsetX: Number(e.target.value) }))
                }
              />
            </label>
            <label className="slider">
              <span>上下 {transform.offsetY.toFixed(2)}</span>
              <input
                type="range"
                min={-1}
                max={1}
                step={0.01}
                value={transform.offsetY}
                disabled={!image}
                onChange={(e) =>
                  setTransform((t) => ({ ...t, offsetY: Number(e.target.value) }))
                }
              />
            </label>
            <button
              type="button"
              className="btn-ghost"
              disabled={!image}
              onClick={() => setTransform(DEFAULT_TRANSFORM)}
            >
              位置をリセット
            </button>
          </section>
        </div>
      </main>

      <footer className="footer">
        <p>額縁データはこの端末に保存されます。書き出しも端末内で完結します。</p>
      </footer>
    </div>
  );
}
