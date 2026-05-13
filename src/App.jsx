import { useEffect, useMemo, useRef, useState } from "react";
import { clearHistory, loadHistory, saveHistoryItem } from "./historyStore.js";
import { styleOptions } from "./styleOptions.js";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const firstStyle = styleOptions[0];

export default function App() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const [styleId, setStyleId] = useState(firstStyle.id);
  const [strength, setStrength] = useState(firstStyle.defaults.strength);
  const [preserveIdentity, setPreserveIdentity] = useState(firstStyle.defaults.preserveIdentity);
  const [size, setSize] = useState(firstStyle.defaults.size);
  const [quality, setQuality] = useState(firstStyle.defaults.quality);
  const [customPrompt, setCustomPrompt] = useState("");
  const [split, setSplit] = useState(54);
  const [status, setStatus] = useState("等待上传图片");
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState([]);
  const [apiHealth, setApiHealth] = useState({ state: "checking", label: "检查服务中" });
  const fileInputRef = useRef(null);

  const selectedStyle = useMemo(
    () => styleOptions.find((style) => style.id === styleId) || firstStyle,
    [styleId]
  );

  useEffect(() => {
    let isMounted = true;

    Promise.all([loadHistory(), fetchHealth()])
      .then(([items, health]) => {
        if (!isMounted) return;
        setHistory(items);
        setApiHealth(health);
      })
      .catch(() => {
        if (!isMounted) return;
        setError("启动信息读取失败，但你仍然可以继续操作。");
        setApiHealth({ state: "offline", label: "服务未连接" });
      });

    return () => {
      isMounted = false;
    };
  }, []);

  function applyStyle(style) {
    setStyleId(style.id);
    setStrength(style.defaults.strength);
    setPreserveIdentity(style.defaults.preserveIdentity);
    setSize(style.defaults.size);
    setQuality(style.defaults.quality);
    setStatus(`已选择：${style.name}`);
  }

  async function pickFile(nextFile) {
    if (!nextFile) return;
    if (!nextFile.type.startsWith("image/")) {
      setError("请选择 JPG、PNG 或 WebP 图片。");
      return;
    }
    if (nextFile.size > MAX_FILE_SIZE) {
      setError("图片不能超过 50MB。");
      return;
    }

    try {
      const compressed = await compressImage(nextFile);
      setFile(compressed);
      setPreviewUrl(URL.createObjectURL(compressed));
      setResultUrl("");
      setError("");
      setSplit(54);
      setStatus("图片已加载，可以开始生成");
    } catch {
      setError("图片读取失败，请换一张图片重试。");
    }
  }

  async function generateImage() {
    if (!file || isGenerating) return;
    setIsGenerating(true);
    setError("");
    setStatus("正在提交生成任务");

    const form = new FormData();
    form.append("image", file, file.name || "photo.jpg");
    form.append("styleId", styleId);
    form.append("strength", String(strength));
    form.append("preserveIdentity", String(preserveIdentity));
    form.append("size", size);
    form.append("quality", quality);
    form.append("customPrompt", customPrompt);

    try {
      const response = await fetch("/api/style-image", { method: "POST", body: form });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "生成失败");

      const nextResult = payload.dataUrl || payload.imageUrl;
      if (!nextResult) throw new Error("服务端没有返回可用图片。");

      setResultUrl(nextResult);
      setStatus(`${payload.styleName || selectedStyle.name} 生成完成`);

      try {
        const savedItem = await saveHistoryItem({
          id: crypto.randomUUID(),
          styleId,
          styleName: payload.styleName || selectedStyle.name,
          resultUrl: nextResult,
          previewUrl,
          createdAt: new Date().toISOString()
        });
        setHistory((items) => [savedItem, ...items].slice(0, 8));
      } catch {
        setError("图片已生成，但本地历史保存失败。你仍然可以下载当前结果。");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失败");
      setStatus("生成失败");
    } finally {
      setIsGenerating(false);
    }
  }

  function downloadResult() {
    if (!resultUrl) return;
    const link = document.createElement("a");
    link.href = resultUrl;
    link.download = `photo-style-${styleId}-${Date.now()}.png`;
    link.click();
  }

  async function removeHistory() {
    await clearHistory();
    setHistory([]);
    setStatus("本地历史已清空");
  }

  function loadHistoryItem(item) {
    setPreviewUrl(item.previewUrl);
    setResultUrl(item.resultUrl);
    setFile(null);
    setSplit(54);
    if (item.styleId) setStyleId(item.styleId);
    setStatus(`已载入历史：${item.styleName}`);
  }

  return (
    <main className="appShell">
      <header className="topbar">
        <div className="brand">
          <div className="brandMark">PS</div>
          <div>
            <strong>照片风格工作台</strong>
            <span data-testid="status">{status}</span>
          </div>
        </div>
        <div className="topActions">
          <HealthPill health={apiHealth} />
          <button className="outlineButton" onClick={() => fileInputRef.current?.click()}>
            <IconUpload />
            选择照片
          </button>
        </div>
      </header>

      <section className="heroBand">
        <div>
          <h1>固定风格，一张图跑完整个创作闭环。</h1>
          <p>先用预置风格和参考图稳定出片，后续再把表现好的风格扩成产品线。</p>
        </div>
        <div className="pwaBadge">
          <span>iPhone PWA</span>
          <strong>主屏试用版</strong>
        </div>
      </section>

      <section className="workspace">
        <section className="previewPanel">
          <input
            data-testid="file-input"
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            hidden
            onChange={(event) => pickFile(event.target.files[0])}
          />

          <div
            className="dropSurface"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              pickFile(event.dataTransfer.files[0]);
            }}
          >
            {!previewUrl ? (
              <button className="uploadEmpty" onClick={() => fileInputRef.current?.click()}>
                <IconImage />
                <strong>上传一张照片</strong>
                <span>JPG、PNG、WebP，最大 50MB</span>
              </button>
            ) : (
              <ImageCompare
                previewUrl={previewUrl}
                resultUrl={resultUrl}
                split={split}
                setSplit={setSplit}
                isGenerating={isGenerating}
              />
            )}
          </div>

          <div className="resultBar">
            <div>
              <span className="eyebrow">当前风格</span>
              <strong>{selectedStyle.name}</strong>
            </div>
            <button className="secondaryButton compact" disabled={!resultUrl} onClick={downloadResult}>
              <IconDownload />
              下载结果
            </button>
          </div>
        </section>

        <aside className="settingsPanel">
          <section className="panelSection">
            <div className="sectionHead">
              <div>
                <span className="eyebrow">01</span>
                <h2>选择固定风格</h2>
              </div>
              <span>{styleOptions.length} 套</span>
            </div>
            <div className="styleGrid">
              {styleOptions.map((style) => (
                <button
                key={style.id}
                data-style-id={style.id}
                className={`styleCard ${style.id === styleId ? "active" : ""}`}
                  onClick={() => applyStyle(style)}
                >
                  <span className="styleSwatch" style={{ background: style.swatch }} />
                  <span>
                    <strong>{style.name}</strong>
                    <small>{style.summary}</small>
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="panelSection selectedStylePanel">
            <div className="sectionHead">
              <div>
                <span className="eyebrow">02</span>
                <h2>参考方向</h2>
              </div>
              <span>{selectedStyle.shortName}</span>
            </div>
            <div className="referenceGrid">
              {selectedStyle.referenceImages.map((image) => (
                <img key={image.src} src={image.src} alt={image.alt} />
              ))}
            </div>
            <p className="styleSummary">{selectedStyle.summary}</p>
          </section>

          <section className="panelSection">
            <div className="sectionHead">
              <div>
                <span className="eyebrow">03</span>
                <h2>微调参数</h2>
              </div>
            </div>
            <div className="controlGroup">
              <RangeField label="风格强度" value={strength} onChange={setStrength} />
              <RangeField label="身份保真" value={preserveIdentity} onChange={setPreserveIdentity} />
            </div>
            <div className="selectGrid">
              <label>
                尺寸
                <select value={size} onChange={(event) => setSize(event.target.value)}>
                  <option value="1024x1024">1:1 方图</option>
                  <option value="1024x1536">2:3 竖图</option>
                  <option value="1536x1024">3:2 横图</option>
                  <option value="auto">Auto</option>
                </select>
              </label>
              <label>
                画质
                <select value={quality} onChange={(event) => setQuality(event.target.value)}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="auto">Auto</option>
                </select>
              </label>
            </div>
            <label className="promptBox">
              补充描述
              <textarea
                value={customPrompt}
                onChange={(event) => setCustomPrompt(event.target.value)}
                placeholder="例如：保留五官，增强夕阳光感，背景更干净"
              />
            </label>
          </section>

          <div className="actionRow">
            <button data-testid="generate-button" className="primaryButton" disabled={!file || isGenerating} onClick={generateImage}>
              {isGenerating ? "生成中..." : "生成风格化照片"}
            </button>
            <button className="secondaryButton" onClick={() => applyStyle(selectedStyle)}>
              恢复默认
            </button>
          </div>

          {error ? <div data-testid="error-box" className="errorBox">{error}</div> : null}
        </aside>
      </section>

      <section className="historyPanel">
        <div className="sectionHead">
          <div>
            <span className="eyebrow">Library</span>
            <h2>本地历史</h2>
          </div>
          <button className="textButton" onClick={removeHistory}>
            清空
          </button>
        </div>
        {history.length ? (
          <div className="historyGrid">
            {history.map((item) => (
              <button key={item.id} className="historyItem" onClick={() => loadHistoryItem(item)}>
                <img src={item.resultUrl} alt={item.styleName} />
                <span>{item.styleName}</span>
                <small>{formatDate(item.createdAt)}</small>
              </button>
            ))}
          </div>
        ) : (
          <p className="muted">生成成功后会保存最近 8 条记录，刷新页面后仍可继续载入。</p>
        )}
      </section>
    </main>
  );
}

function ImageCompare({ previewUrl, resultUrl, split, setSplit, isGenerating }) {
  return (
    <div className="imageCompare" style={{ "--split": `${resultUrl ? split : 0}%` }}>
      <img src={previewUrl} alt="原图" />
      {resultUrl ? <img className="resultImage" src={resultUrl} alt="生成结果" /> : null}
      {resultUrl ? (
        <>
          <div className="splitLine" />
          <input
            className="splitSlider"
            type="range"
            min="0"
            max="100"
            value={split}
            onChange={(event) => setSplit(event.target.value)}
            aria-label="原图和结果对比"
          />
        </>
      ) : (
        <div className="emptyHint">{isGenerating ? "生成中，请稍等" : "选择风格后开始生成"}</div>
      )}
      {isGenerating ? (
        <div className="loadingVeil">
          <span />
          <strong>正在生成</strong>
        </div>
      ) : null}
    </div>
  );
}

function RangeField({ label, value, onChange }) {
  return (
    <label className="rangeField">
      <span>
        {label} <b>{value}</b>
      </span>
      <input type="range" min="0" max="100" value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function HealthPill({ health }) {
  return <span className={`healthPill ${health.state}`}>{health.label}</span>;
}

async function fetchHealth() {
  try {
    const response = await fetch("/api/health");
    const payload = await response.json();
    if (!response.ok || !payload.ok) return { state: "offline", label: "服务异常" };
    return payload.hasApiKey
      ? { state: "ready", label: "生成服务就绪" }
      : { state: "warning", label: "缺少 API Key" };
  } catch {
    return { state: "offline", label: "服务未连接" };
  }
}

async function compressImage(file) {
  const bitmap = await createImageBitmap(file);
  const maxEdge = 1800;
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.88));
  if (!blob) throw new Error("compress failed");
  return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
}

function formatDate(value) {
  try {
    return new Intl.DateTimeFormat("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(value));
  } catch {
    return "";
  }
}

function IconUpload() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 16V5m0 0 4 4m-4-4-4 4M5 19h14" />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4v11m0 0 4-4m-4 4-4-4M5 20h14" />
    </svg>
  );
}

function IconImage() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="5" width="16" height="14" rx="3" />
      <path d="m7 16 4-4 3 3 2-2 3 3M8 9h.01" />
    </svg>
  );
}
