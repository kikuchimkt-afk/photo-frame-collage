import { useEffect, useMemo, useRef, useState } from "react";
import { FrameLibrary } from "./components/FrameLibrary";
import { ASPECT_PRESETS } from "./aspects";
import { downloadCanvas, loadImage, renderCollage } from "./exportCanvas";
import { DEFAULT_FRAMES } from "./frames";
import { loadFrames, resetFramesToDefault, saveFrames } from "./frameStorage";
import type { AspectPreset, FrameStyle, PhotoTransform } from "./types";
import "./App.css";

const DEFAULT_TRANSFORM: PhotoTransform = {
  scale: 1,
  offsetX: 0,
  offsetY: 0,
};

export default function App() {
  const [frames, setFrames] = useState<FrameStyle[]>(() => DEFAULT_FRAMES);
  const [ready, setReady] = useState(false);
  const [frame, setFrame] = useState<FrameStyle>(DEFAULT_FRAMES[0]);
  const [aspect, setAspect] = useState<AspectPreset>(ASPECT_PRESETS[0]);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [overlayImage, setOverlayImage] = useState<HTMLImageElement | null>(null);
  const [transform, setTransform] = useState<PhotoTransform>(DEFAULT_TRANSFORM);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loaded = loadFrames();
    setFrames(loaded);
    setFrame(loaded[0] ?? DEFAULT_FRAMES[0]);
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
    if (frame.kind !== "overlay" || !frame.overlaySrc) {
      setOverlayImage(null);
      return;
    }
    void loadImage(frame.overlaySrc)
      .then((img) => {
        if (!cancelled) setOverlayImage(img);
      })
      .catch(() => {
        if (!cancelled) setOverlayImage(null);
      });
    return () => {
      cancelled = true;
    };
  }, [frame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderCollage(canvas, image, frame, aspect, transform, overlayImage);
  }, [image, frame, aspect, transform, overlayImage]);

  const previewStyle = useMemo(() => {
    const maxW = 360;
    const scale = maxW / aspect.width;
    return {
      width: `${aspect.width * scale}px`,
      height: `${aspect.height * scale}px`,
    };
  }, [aspect]);

  const persistFrames = (next: FrameStyle[]) => {
    setFrames(next);
    saveFrames(next);
    if (!next.some((f) => f.id === frame.id)) {
      setFrame(next[0] ?? DEFAULT_FRAMES[0]);
    }
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
    if (frame.kind === "overlay" && !overlayImage) {
      window.alert("額縁画像の読み込み中です。少し待ってから再度お試しください。");
      return;
    }
    const canvas = document.createElement("canvas");
    renderCollage(canvas, image, frame, aspect, transform, overlayImage);
    downloadCanvas(
      canvas,
      `collage-${frame.id}-${aspect.ratioLabel.replace(":", "x")}.png`,
    );
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
          額縁は追加・削除でき、この端末のローカルストレージに保存されます。Instagram向け比率でPNG書き出しできます。
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
              className="preview-canvas"
              style={previewStyle}
              aria-label="コラージュプレビュー"
            />
          </div>
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

          <FrameLibrary
            frames={frames}
            selectedId={frame.id}
            onSelect={setFrame}
            onChange={persistFrames}
            onResetDefaults={() => {
              const next = resetFramesToDefault();
              setFrames(next);
              setFrame(next[0]);
            }}
          />

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
