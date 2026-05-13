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
  const [status, setStatus] = useState("选择素材图片");
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("create");
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
      setActiveTab("create");
      setStatus("素材已加入，可以开始生成漫画");
    } catch {
      setError("图片读取失败，请换一张图片重试。");
    }
  }

  function clearInputImage() {
    setFile(null);
    setPreviewUrl("");
    setResultUrl("");
    setSplit(54);
    setStatus("选择素材图片");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function generateImage() {
    if (!file || isGenerating) return;
    setIsGenerating(true);
    setError("");
    setStatus("正在提交漫画生成任务");

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
    link.download = `lifemanga-${styleId}-${Date.now()}.png`;
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
    setActiveTab("create");
    if (item.styleId) setStyleId(item.styleId);
    setStatus(`已载入历史：${item.styleName}`);
  }

  return (
    <main className="appShell">
      <header className="mobileTopbar">
        <button className="circleButton" aria-label="返回">
          <IconChevronLeft />
        </button>
        <div>
          <h1>我的第一个漫画</h1>
          <span data-testid="status">{status}</span>
        </div>
        <button className="circleButton accent" aria-label="刷新状态" onClick={() => fetchHealth().then(setApiHealth)}>
          <IconRefresh />
        </button>
      </header>

      <div className="segmentedTabs" role="tablist" aria-label="工作区">
        <button className={activeTab === "create" ? "active" : ""} onClick={() => setActiveTab("create")}>
          创作
        </button>
        <button className={activeTab === "history" ? "active" : ""} onClick={() => setActiveTab("history")}>
          历史
        </button>
      </div>

      {activeTab === "create" ? (
        <>
          <section className="mangaPanel materialPanel">
            <input
              data-testid="file-input"
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              hidden
              onChange={(event) => pickFile(event.target.files[0])}
            />
            <StepTitle number="1" title="选择素材图片" />
            <div
              className={`materialStrip ${previewUrl ? "hasImage" : ""}`}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                pickFile(event.dataTransfer.files[0]);
              }}
            >
              {previewUrl ? (
                <div className="inputThumb">
                  <img src={previewUrl} alt="素材图片" />
                  <button onClick={clearInputImage} aria-label="移除素材">
                    <IconX />
                  </button>
                </div>
              ) : (
                <button className="emptyThumb" onClick={() => fileInputRef.current?.click()}>
                  <IconImage />
                  <span>还没有素材</span>
                </button>
              )}
            </div>
            <div className="materialActions">
              <button className="primaryButton" onClick={() => fileInputRef.current?.click()}>
                <IconCamera />
                拍照
              </button>
              <button className="secondaryButton" onClick={() => fileInputRef.current?.click()}>
                <IconPhotos />
                从相册选
              </button>
            </div>
          </section>

          <section className="mangaPanel">
            <StepTitle number="2" title="选择漫画风格" />
            <div className="styleRail">
              {styleOptions.map((style) => (
                <button
                  key={style.id}
                  data-style-id={style.id}
                  className={`mangaStyleCard ${style.id === styleId ? "active" : ""}`}
                  onClick={() => applyStyle(style)}
                >
                  <span className="styleIcon" style={{ background: style.swatch }}>
                    <StyleGlyph icon={style.icon} />
                  </span>
                  <strong>{style.name}</strong>
                </button>
              ))}
            </div>
          </section>

          <section className="mangaPanel">
            <StepTitle number="3" title="色彩与参数" />
            <div className="styleDetail">
              <div>
                <span className="panelEyebrow">{selectedStyle.shortName}</span>
                <h2>{selectedStyle.name}</h2>
                <p>{selectedStyle.summary}</p>
              </div>
              <HealthPill health={apiHealth} />
            </div>
            <div className="controlStack">
              <RangeField label="漫画化强度" value={strength} onChange={setStrength} />
              <RangeField label="人物保真" value={preserveIdentity} onChange={setPreserveIdentity} />
            </div>
            <div className="selectGrid">
              <label>
                分辨率
                <select value={size} onChange={(event) => setSize(event.target.value)}>
                  <option value="1024x1536">2:3 漫画页</option>
                  <option value="1024x1024">1:1 方图</option>
                  <option value="1536x1024">3:2 横图</option>
                  <option value="auto">Auto</option>
                </select>
              </label>
              <label>
                画质
                <select value={quality} onChange={(event) => setQuality(event.target.value)}>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="low">Low</option>
                  <option value="auto">Auto</option>
                </select>
              </label>
            </div>
            <label className="promptBox">
              补充 prompt
              <textarea
                value={customPrompt}
                onChange={(event) => setCustomPrompt(event.target.value)}
                placeholder="例如：下雨场景、主角戴墨镜、保留办公室背景、画面更热血"
              />
            </label>
          </section>

          <section className="resultStage">
            <div className="stageHeader">
              <div>
                <span className="panelEyebrow">生成结果</span>
                <h2>{resultUrl ? "漫画页已生成" : "等待生成漫画"}</h2>
              </div>
              <button className="secondaryButton compact" disabled={!resultUrl} onClick={downloadResult}>
                <IconDownload />
                保存
              </button>
            </div>
            <ImageCompare
              previewUrl={previewUrl}
              resultUrl={resultUrl}
              split={split}
              setSplit={setSplit}
              isGenerating={isGenerating}
            />
            <button data-testid="generate-button" className="generateButton" disabled={!file || isGenerating} onClick={generateImage}>
              {isGenerating ? "生成中..." : "生成漫画"}
            </button>
            {error ? <div data-testid="error-box" className="errorBox">{error}</div> : null}
          </section>
        </>
      ) : (
        <HistoryPanel history={history} onLoad={loadHistoryItem} onClear={removeHistory} />
      )}

      <nav className="bottomNav" aria-label="主导航">
        <button className="active" onClick={() => setActiveTab("create")}>
          <IconBooks />
          工程
        </button>
        <button onClick={() => setActiveTab("history")}>
          <IconCharacter />
          角色库
        </button>
        <button disabled>
          <IconSend />
          发布
        </button>
      </nav>
    </main>
  );
}

function StepTitle({ number, title }) {
  return (
    <div className="stepTitle">
      <span>{number}.</span>
      <h2>{title}</h2>
    </div>
  );
}

function ImageCompare({ previewUrl, resultUrl, split, setSplit, isGenerating }) {
  if (!previewUrl) {
    return (
      <div className="emptyResult">
        <IconImage />
        <strong>先选择一张照片</strong>
        <span>生成后这里会显示漫画结果，并支持原图/结果对比。</span>
      </div>
    );
  }

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
        <div className="emptyHint">{isGenerating ? "生成中，请稍等" : "选好风格后开始生成"}</div>
      )}
      {isGenerating ? (
        <div className="loadingVeil">
          <span />
          <strong>正在生成漫画</strong>
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

function HistoryPanel({ history, onLoad, onClear }) {
  return (
    <section className="mangaPanel historyPanel">
      <div className="stageHeader">
        <div>
          <span className="panelEyebrow">History</span>
          <h2>本地历史</h2>
        </div>
        <button className="textButton" onClick={onClear}>
          清空
        </button>
      </div>
      {history.length ? (
        <div className="historyGrid">
          {history.map((item) => (
            <button key={item.id} className="historyItem" onClick={() => onLoad(item)}>
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

function StyleGlyph({ icon }) {
  const icons = {
    bolt: <path d="M13 2 4 13h7l-1 9 9-12h-7l1-8Z" />,
    leaf: <path d="M20 4c-8 0-13 4-13 11 0 3 2 5 5 5 7 0 8-9 8-16ZM4 20c3-6 7-9 14-12" />,
    mask: <path d="M4 8c4-2 12-2 16 0v4c0 5-4 8-8 8s-8-3-8-8V8Zm4 5h3m2 0h3" />,
    book: <path d="M5 4h10a4 4 0 0 1 4 4v12H9a4 4 0 0 0-4-4V4Zm4 0v12" />,
    smile: <path d="M8 9h.01M16 9h.01M8 14c2 2 6 2 8 0M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" />,
    paperplane: <path d="m22 2-7 20-4-9-9-4 20-7Z" />
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{icons[icon] || icons.bolt}</svg>;
}

function IconChevronLeft() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>;
}
function IconRefresh() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3-6.7M21 4v6h-6" /></svg>;
}
function IconCamera() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h4l2-3h4l2 3h4v11H4V8Zm8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" /></svg>;
}
function IconPhotos() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h13v13H7V7Zm-3 9V4h12M9 16l3-3 2 2 2-2 2 3" /></svg>;
}
function IconImage() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="14" rx="3" /><path d="m7 16 4-4 3 3 2-2 3 3M8 9h.01" /></svg>;
}
function IconX() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>;
}
function IconDownload() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11m0 0 4-4m-4 4-4-4M5 20h14" /></svg>;
}
function IconBooks() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4v16H5V4Zm6 0h3v16h-3V4Zm5 3h3v13h-3V7Z" /></svg>;
}
function IconCharacter() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 20v-2a5 5 0 0 1 10 0v2M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 22h16" /></svg>;
}
function IconSend() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4 20-7Z" /></svg>;
}
