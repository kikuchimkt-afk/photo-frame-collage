import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ASPECT_PRESETS } from "./aspects";
import { downloadCanvas, renderCollage } from "./exportCanvas";
import { FRAMES } from "./frames";
import type { AspectPreset, FrameStyle, PhotoTransform } from "./types";
import "./App.css";

const DEFAULT_TRANSFORM: PhotoTransform = {
  scale: 1,
  offsetX: 0,
  offsetY: 0,
};

export default function App() {
  const [frame, setFrame] = useState<FrameStyle>(FRAMES[0]);
  const [aspect, setAspect] = useState<AspectPreset>(ASPECT_PRESETS[0]);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [transform, setTransform] = useState<PhotoTransform>(DEFAULT_TRANSFORM);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderCollage(canvas, image, frame, aspect, transform);
  }, [image, frame, aspect, transform]);

  const previewStyle = useMemo(() => {
    const maxW = 360;
    const scale = maxW / aspect.width;
    return {
      width: `${aspect.width * scale}px`,
      height: `${aspect.height * scale}px`,
    };
  }, [aspect]);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    const url = URL.createObjectURL(file);
    setPhotoUrl(url);
    setTransform(DEFAULT_TRANSFORM);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!image) {
      window.alert("先に写真を選んでください。");
      return;
    }
    downloadCanvas(
      canvas,
      `collage-${frame.id}-${aspect.ratioLabel.replace(":", "x")}.png`,
    );
  };

  return (
    <div className="app">
      <header className="hero">
        <p className="brand">Photo Frame Collage</p>
        <h1>額縁に1枚入れて、Instagram向けに書き出す</h1>
        <p className="subtitle">
          登録済みの額縁10種から選び、写真をはめ込みます。フィード推奨の4:5など、投稿先に合わせた比率でPNG保存できます。
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

          <section className="panel">
            <h2>額縁（10種）</h2>
            <div className="frame-grid">
              {FRAMES.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={`frame-card${frame.id === f.id ? " active" : ""}`}
                  onClick={() => setFrame(f)}
                  style={
                    {
                      "--outer": f.outer,
                      "--mat": f.mat,
                    } as CSSProperties
                  }
                >
                  <span className="frame-swatch" aria-hidden />
                  <span className="frame-name">{f.name}</span>
                  <small>{f.mood}</small>
                </button>
              ))}
            </div>
          </section>

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
        <p>まずは1枚はめ込みの仕様です。書き出しは端末内で完結します。</p>
      </footer>
    </div>
  );
}
