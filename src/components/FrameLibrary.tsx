import { useId, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { createFrameId } from "../frames";
import { imageFileToDataUrl } from "../frameStorage";
import type { FrameStyle } from "../types";

type Props = {
  frames: FrameStyle[];
  selectedId: string;
  onSelect: (frame: FrameStyle) => void;
  onChange: (frames: FrameStyle[]) => void;
  onResetDefaults: () => void;
};

type AddMode = "closed" | "solid" | "overlay";

export function FrameLibrary({
  frames,
  selectedId,
  onSelect,
  onChange,
  onResetDefaults,
}: Props) {
  const [mode, setMode] = useState<AddMode>("closed");
  const [name, setName] = useState("");
  const [mood, setMood] = useState("");
  const [outer, setOuter] = useState("#6b3f22");
  const [mat, setMat] = useState("#f4efe6");
  const [cream, setCream] = useState("#fdf5e0");
  const [photoTopRatio, setPhotoTopRatio] = useState(0.12);
  const [photoBottomRatio, setPhotoBottomRatio] = useState(0.9);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const overlayRef = useRef<HTMLInputElement>(null);
  const formId = useId();

  const resetForm = () => {
    setName("");
    setMood("");
    setOuter("#6b3f22");
    setMat("#f4efe6");
    setCream("#fdf5e0");
    setPhotoTopRatio(0.12);
    setPhotoBottomRatio(0.9);
    setError(null);
  };

  const handleDelete = (id: string) => {
    if (frames.length <= 1) {
      window.alert("額縁は最低1つ必要です。");
      return;
    }
    const target = frames.find((f) => f.id === id);
    if (!target) return;
    if (!window.confirm(`「${target.name}」を削除しますか？`)) return;
    const next = frames.filter((f) => f.id !== id);
    onChange(next);
  };

  const handleAddSolid = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("名前を入力してください。");
      return;
    }
    const frame: FrameStyle = {
      id: createFrameId(),
      name: trimmed,
      mood: mood.trim() || "追加した色枠",
      kind: "solid",
      outer,
      mat,
      accent: outer,
      outerRatio: 0.045,
      matRatio: 0.05,
    };
    onChange([...frames, frame]);
    onSelect(frame);
    resetForm();
    setMode("closed");
  };

  const handleAddOverlay = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    const file = overlayRef.current?.files?.[0];
    if (!trimmed) {
      setError("名前を入力してください。");
      return;
    }
    if (!file) {
      setError("イラスト枠の画像を選んでください。");
      return;
    }
    if (photoTopRatio >= photoBottomRatio - 0.05) {
      setError("写真領域の上端・下端のバランスを見直してください。");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const dataUrl = await imageFileToDataUrl(file);
      const frame: FrameStyle = {
        id: createFrameId(),
        name: trimmed,
        mood: mood.trim() || "追加したイラスト枠",
        kind: "overlay",
        overlaySrc: dataUrl,
        thumbSrc: dataUrl,
        cream,
        photoTopRatio,
        photoBottomRatio,
      };
      onChange([...frames, frame]);
      onSelect(frame);
      resetForm();
      if (overlayRef.current) overlayRef.current.value = "";
      setMode("closed");
    } catch {
      setError("画像の読み込みに失敗しました。");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>額縁（{frames.length}種）</h2>
        <div className="panel-head-actions">
          <button type="button" className="btn-ghost compact" onClick={() => setMode("solid")}>
            色枠を追加
          </button>
          <button
            type="button"
            className="btn-ghost compact"
            onClick={() => setMode("overlay")}
          >
            イラスト枠を追加
          </button>
        </div>
      </div>

      <div className="frame-grid">
        {frames.map((f) => (
          <div
            key={f.id}
            className={`frame-card-wrap${selectedId === f.id ? " active" : ""}`}
          >
            <button
              type="button"
              className={`frame-card${selectedId === f.id ? " active" : ""}`}
              onClick={() => onSelect(f)}
              style={
                f.kind === "solid"
                  ? ({
                      "--outer": f.outer,
                      "--mat": f.mat,
                    } as CSSProperties)
                  : undefined
              }
            >
              {f.kind === "overlay" && f.thumbSrc ? (
                <img className="frame-thumb" src={f.thumbSrc} alt="" />
              ) : (
                <span className="frame-swatch" aria-hidden />
              )}
              <span className="frame-name">{f.name}</span>
              <small>{f.mood}</small>
            </button>
            <button
              type="button"
              className="btn-ghost danger compact frame-delete"
              onClick={() => handleDelete(f.id)}
            >
              削除
            </button>
          </div>
        ))}
      </div>

      {mode !== "closed" ? (
        <form
          className="frame-add-form"
          onSubmit={mode === "solid" ? handleAddSolid : (e) => void handleAddOverlay(e)}
        >
          <h3>{mode === "solid" ? "色の額縁を追加" : "イラスト額縁を追加"}</h3>
          <label className="field" htmlFor={`${formId}-name`}>
            <span>名前</span>
            <input
              id={`${formId}-name`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 春の額縁"
              required
            />
          </label>
          <label className="field" htmlFor={`${formId}-mood`}>
            <span>メモ（任意）</span>
            <input
              id={`${formId}-mood`}
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              placeholder="短い説明"
            />
          </label>

          {mode === "solid" ? (
            <div className="color-row">
              <label className="field">
                <span>外枠色</span>
                <input type="color" value={outer} onChange={(e) => setOuter(e.target.value)} />
              </label>
              <label className="field">
                <span>マット色</span>
                <input type="color" value={mat} onChange={(e) => setMat(e.target.value)} />
              </label>
            </div>
          ) : (
            <>
              <label className="field">
                <span>枠画像（透過PNG推奨）</span>
                <input ref={overlayRef} type="file" accept="image/*" required />
              </label>
              <p className="lead">
                中央が透明な枠画像を推奨します。写真領域の位置は下のスライダーで調整できます。
              </p>
              <label className="field">
                <span>背景色（写真の裏）</span>
                <input type="color" value={cream} onChange={(e) => setCream(e.target.value)} />
              </label>
              <label className="slider">
                <span>写真領域の上端 {photoTopRatio.toFixed(2)}</span>
                <input
                  type="range"
                  min={0.05}
                  max={0.4}
                  step={0.01}
                  value={photoTopRatio}
                  onChange={(e) => setPhotoTopRatio(Number(e.target.value))}
                />
              </label>
              <label className="slider">
                <span>写真領域の下端 {photoBottomRatio.toFixed(2)}</span>
                <input
                  type="range"
                  min={0.6}
                  max={0.98}
                  step={0.01}
                  value={photoBottomRatio}
                  onChange={(e) => setPhotoBottomRatio(Number(e.target.value))}
                />
              </label>
            </>
          )}

          {error ? <p className="error">{error}</p> : null}

          <div className="form-actions">
            <button
              type="button"
              className="btn-ghost"
              disabled={busy}
              onClick={() => {
                resetForm();
                setMode("closed");
              }}
            >
              キャンセル
            </button>
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? "追加中…" : "追加する"}
            </button>
          </div>
        </form>
      ) : null}

      <button
        type="button"
        className="btn-ghost compact reset-frames"
        onClick={() => {
          if (
            window.confirm(
              "額縁一覧を初期状態（標準10種）に戻します。追加した枠は消えます。よろしいですか？",
            )
          ) {
            onResetDefaults();
            setMode("closed");
            resetForm();
          }
        }}
      >
        標準の額縁に戻す
      </button>
    </section>
  );
}
