import { useId, useMemo, useRef, useState, type FormEvent } from "react";
import { createFrameId, DEFAULT_MASCOT } from "../frames";
import { imageFileToDataUrl } from "../frameStorage";
import type { FramePartDraft, FrameStyle, MascotPlacement } from "../types";

type Props = {
  onSave: (frame: FrameStyle) => void;
  onCancel: () => void;
};

type Step = 1 | 2 | 3 | 4;

async function cropDataUrl(
  sourceUrl: string,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
): Promise<string> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("load failed"));
    el.src = sourceUrl;
  });
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(sw));
  canvas.height = Math.max(1, Math.round(sh));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}

async function buildThumb(draft: {
  cream: string;
  topBandDataUrl: string;
  bottomBandDataUrl: string;
  mascotDataUrl: string | null;
  photoTopRatio: number;
  photoBottomRatio: number;
  mascotDefault: MascotPlacement;
}): Promise<string> {
  const W = 360;
  const H = 640;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");

  ctx.fillStyle = draft.cream;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#cfd8df";
  const topH = H * draft.photoTopRatio;
  const bottomH = H * (1 - draft.photoBottomRatio);
  ctx.fillRect(0, topH, W, H - topH - bottomH);

  const load = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("img"));
      img.src = src;
    });

  const top = await load(draft.topBandDataUrl);
  const bottom = await load(draft.bottomBandDataUrl);
  ctx.drawImage(top, 0, 0, W, topH);
  ctx.drawImage(bottom, 0, H - bottomH, W, bottomH);

  if (draft.mascotDataUrl && draft.mascotDefault.visible) {
    const mascot = await load(draft.mascotDataUrl);
    const mw = W * draft.mascotDefault.scale;
    const mh = (mw * mascot.naturalHeight) / Math.max(1, mascot.naturalWidth);
    ctx.drawImage(
      mascot,
      draft.mascotDefault.x * W,
      draft.mascotDefault.y * H,
      mw,
      mh,
    );
  }

  return canvas.toDataURL("image/png");
}

export function FramePartsStudio({ onSave, onCancel }: Props) {
  const formId = useId();
  const sourceRef = useRef<HTMLInputElement>(null);
  const mascotRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [sourceSize, setSourceSize] = useState<{ w: number; h: number } | null>(null);
  const [name, setName] = useState("");
  const [mood, setMood] = useState("上下帯固定＋マスコット別配置");
  const [cream, setCream] = useState("#fdf5e0");
  const [topEndRatio, setTopEndRatio] = useState(0.12);
  const [bottomStartRatio, setBottomStartRatio] = useState(0.92);
  const [topBandDataUrl, setTopBandDataUrl] = useState<string | null>(null);
  const [bottomBandDataUrl, setBottomBandDataUrl] = useState<string | null>(null);
  const [mascotDataUrl, setMascotDataUrl] = useState<string | null>(null);
  const [mascot, setMascot] = useState<MascotPlacement>({ ...DEFAULT_MASCOT });

  const canNextFrom1 = Boolean(sourceUrl && sourceSize);
  const canNextFrom2 = Boolean(topBandDataUrl && bottomBandDataUrl);

  const previewBands = useMemo(() => {
    if (!sourceUrl || !sourceSize) return null;
    return { topEndRatio, bottomStartRatio };
  }, [sourceUrl, sourceSize, topEndRatio, bottomStartRatio]);

  const handleSource = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const url = await imageFileToDataUrl(file, 1200);
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error("load"));
        el.src = url;
      });
      setSourceUrl(url);
      setSourceSize({ w: img.naturalWidth, h: img.naturalHeight });
      setTopBandDataUrl(null);
      setBottomBandDataUrl(null);
      if (!name.trim()) setName(file.name.replace(/\.[^.]+$/, ""));
    } catch {
      setError("画像の読み込みに失敗しました。");
    } finally {
      setBusy(false);
    }
  };

  const cutBands = async () => {
    if (!sourceUrl || !sourceSize) return;
    if (topEndRatio >= bottomStartRatio - 0.05) {
      setError("上部帯と下部帯が重ならないように調整してください。");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { w, h } = sourceSize;
      const topH = h * topEndRatio;
      const bottomY = h * bottomStartRatio;
      const bottomH = h - bottomY;
      const top = await cropDataUrl(sourceUrl, 0, 0, w, topH);
      const bottom = await cropDataUrl(sourceUrl, 0, bottomY, w, bottomH);
      setTopBandDataUrl(top);
      setBottomBandDataUrl(bottom);
      setStep(3);
    } catch {
      setError("帯の切り出しに失敗しました。");
    } finally {
      setBusy(false);
    }
  };

  const handleMascotFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const url = await imageFileToDataUrl(file, 800);
      setMascotDataUrl(url);
      setMascot((m) => ({ ...m, visible: true }));
    } catch {
      setError("マスコット画像の読み込みに失敗しました。");
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!topBandDataUrl || !bottomBandDataUrl) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setError("名前を入力してください。");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const draft: FramePartDraft = {
        name: trimmed,
        mood: mood.trim() || "パーツ作成の額縁",
        cream,
        topBandDataUrl,
        bottomBandDataUrl,
        mascotDataUrl,
        photoTopRatio: topEndRatio,
        photoBottomRatio: bottomStartRatio,
        mascotDefault: { ...mascot, visible: Boolean(mascotDataUrl) && mascot.visible },
        thumbDataUrl: "",
      };
      draft.thumbDataUrl = await buildThumb(draft);
      const frame: FrameStyle = {
        id: createFrameId(),
        name: draft.name,
        mood: draft.mood,
        kind: "banded",
        cream: draft.cream,
        photoTopRatio: draft.photoTopRatio,
        photoBottomRatio: draft.photoBottomRatio,
        topBandSrc: draft.topBandDataUrl,
        bottomBandSrc: draft.bottomBandDataUrl,
        mascotSrc: draft.mascotDataUrl ?? undefined,
        mascotDefault: draft.mascotDefault,
        thumbSrc: draft.thumbDataUrl,
      };
      onSave(frame);
    } catch {
      setError("額縁の保存に失敗しました。");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel parts-studio">
      <div className="panel-head">
        <h2>フレームパーツ作成</h2>
        <button type="button" className="btn-ghost compact" onClick={onCancel}>
          閉じる
        </button>
      </div>
      <p className="lead">
        上下の帯は固定パーツ、犬などのマスコットは別レイヤーとして登録します。
      </p>

      <ol className="steps">
        <li className={step === 1 ? "active" : ""}>1. 元画像</li>
        <li className={step === 2 ? "active" : ""}>2. 上下帯</li>
        <li className={step === 3 ? "active" : ""}>3. マスコット</li>
        <li className={step === 4 ? "active" : ""}>4. 確認</li>
      </ol>

      {step === 1 ? (
        <div className="studio-block">
          <input
            ref={sourceRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              void handleSource(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            className="btn-primary"
            disabled={busy}
            onClick={() => sourceRef.current?.click()}
          >
            テンプレ画像を選ぶ
          </button>
          {sourceUrl ? (
            <img className="studio-preview" src={sourceUrl} alt="元画像" />
          ) : null}
          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              disabled={!canNextFrom1}
              onClick={() => setStep(2)}
            >
              次へ：上下帯を切る
            </button>
          </div>
        </div>
      ) : null}

      {step === 2 && sourceUrl && sourceSize ? (
        <div className="studio-block">
          <p className="lead">
            上部帯の下端・下部帯の上端を指定します。中央は写真領域になります。
          </p>
          <div className="band-preview-wrap">
            <img className="studio-preview" src={sourceUrl} alt="切り出しガイド" />
            {previewBands ? (
              <>
                <div
                  className="band-guide top"
                  style={{ height: `${topEndRatio * 100}%` }}
                />
                <div
                  className="band-guide bottom"
                  style={{ height: `${(1 - bottomStartRatio) * 100}%` }}
                />
              </>
            ) : null}
          </div>
          <label className="slider">
            <span>上部帯の下端 {topEndRatio.toFixed(2)}</span>
            <input
              type="range"
              min={0.06}
              max={0.35}
              step={0.01}
              value={topEndRatio}
              onChange={(e) => setTopEndRatio(Number(e.target.value))}
            />
          </label>
          <label className="slider">
            <span>下部帯の上端 {bottomStartRatio.toFixed(2)}</span>
            <input
              type="range"
              min={0.65}
              max={0.96}
              step={0.01}
              value={bottomStartRatio}
              onChange={(e) => setBottomStartRatio(Number(e.target.value))}
            />
          </label>
          <label className="field">
            <span>帯の内側の背景色</span>
            <input type="color" value={cream} onChange={(e) => setCream(e.target.value)} />
          </label>
          <div className="form-actions">
            <button type="button" className="btn-ghost" onClick={() => setStep(1)}>
              戻る
            </button>
            <button type="button" className="btn-primary" disabled={busy} onClick={() => void cutBands()}>
              帯を切り出して次へ
            </button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="studio-block">
          <p className="lead">
            マスコットは透過PNG推奨です。後から位置・大きさを変えられます。なしでも登録できます。
          </p>
          <input
            ref={mascotRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              void handleMascotFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              disabled={busy}
              onClick={() => mascotRef.current?.click()}
            >
              マスコット画像を選ぶ
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setMascotDataUrl(null);
                setMascot((m) => ({ ...m, visible: false }));
              }}
            >
              マスコットなし
            </button>
          </div>
          {mascotDataUrl ? (
            <img className="studio-mascot" src={mascotDataUrl} alt="マスコット" />
          ) : null}
          {topBandDataUrl && bottomBandDataUrl ? (
            <div className="parts-strip">
              <figure>
                <img src={topBandDataUrl} alt="上部帯" />
                <figcaption>上部帯（固定）</figcaption>
              </figure>
              <figure>
                <img src={bottomBandDataUrl} alt="下部帯" />
                <figcaption>下部帯（固定）</figcaption>
              </figure>
            </div>
          ) : null}
          <div className="form-actions">
            <button type="button" className="btn-ghost" onClick={() => setStep(2)}>
              戻る
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={!canNextFrom2}
              onClick={() => setStep(4)}
            >
              次へ：確認して保存
            </button>
          </div>
        </div>
      ) : null}

      {step === 4 ? (
        <form className="studio-block" onSubmit={(e) => void handleSave(e)}>
          <label className="field" htmlFor={`${formId}-name`}>
            <span>額縁名</span>
            <input
              id={`${formId}-name`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label className="field" htmlFor={`${formId}-mood`}>
            <span>メモ</span>
            <input
              id={`${formId}-mood`}
              value={mood}
              onChange={(e) => setMood(e.target.value)}
            />
          </label>
          {mascotDataUrl ? (
            <>
              <p className="lead">初期のマスコット位置（保存後も調整できます）</p>
              <label className="slider">
                <span>左右 {mascot.x.toFixed(2)}</span>
                <input
                  type="range"
                  min={0}
                  max={0.7}
                  step={0.01}
                  value={mascot.x}
                  onChange={(e) => setMascot((m) => ({ ...m, x: Number(e.target.value) }))}
                />
              </label>
              <label className="slider">
                <span>上下 {mascot.y.toFixed(2)}</span>
                <input
                  type="range"
                  min={0.4}
                  max={0.9}
                  step={0.01}
                  value={mascot.y}
                  onChange={(e) => setMascot((m) => ({ ...m, y: Number(e.target.value) }))}
                />
              </label>
              <label className="slider">
                <span>大きさ {mascot.scale.toFixed(2)}</span>
                <input
                  type="range"
                  min={0.15}
                  max={0.7}
                  step={0.01}
                  value={mascot.scale}
                  onChange={(e) =>
                    setMascot((m) => ({ ...m, scale: Number(e.target.value) }))
                  }
                />
              </label>
            </>
          ) : null}
          <div className="form-actions">
            <button type="button" className="btn-ghost" onClick={() => setStep(3)}>
              戻る
            </button>
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? "保存中…" : "額縁として登録"}
            </button>
          </div>
        </form>
      ) : null}

      {error ? <p className="error">{error}</p> : null}
    </section>
  );
}
