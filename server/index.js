import "dotenv/config";
import express from "express";
import multer from "multer";
import { allowedQualities, allowedSizes, getStylePreset } from "../shared/stylePresets.js";

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

const PORT = Number(process.env.PORT || 8888);
const OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1.5";
const allowedSizeSet = new Set(allowedSizes);
const allowedQualitySet = new Set(allowedQualities);
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    app: "photo-style-workbench",
    model: OPENAI_IMAGE_MODEL,
    hasApiKey: Boolean(process.env.OPENAI_API_KEY)
  });
});

app.post("/api/style-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "请上传 image 文件。" });
    }

    if (!allowedMimeTypes.has(req.file.mimetype)) {
      return res.status(400).json({ error: "只支持 JPG、PNG、WebP 图片。" });
    }

    const styleId = String(req.body.styleId || "shonen-jump");
    const style = getStylePreset(styleId);
    if (!style) {
      return res.status(400).json({ error: `未知风格：${styleId}` });
    }

    const strength = clamp(req.body.strength, 0, 100, style.defaults.strength);
    const preserveIdentity = clamp(req.body.preserveIdentity, 0, 100, style.defaults.preserveIdentity);
    const size = allowedSizeSet.has(req.body.size) ? req.body.size : style.defaults.size;
    const quality = allowedQualitySet.has(req.body.quality) ? req.body.quality : style.defaults.quality;
    const customPrompt = String(req.body.customPrompt || "").trim().slice(0, 700);

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "服务端缺少 OPENAI_API_KEY。请在 photo-style-workbench/.env 中配置后重启。"
      });
    }

    const prompt = buildPrompt({ style, strength, preserveIdentity, customPrompt });
    const form = new FormData();
    form.append("model", OPENAI_IMAGE_MODEL);
    form.append("image", new Blob([req.file.buffer], { type: req.file.mimetype }), req.file.originalname || "photo.jpg");
    form.append("prompt", prompt);
    form.append("size", size);
    form.append("quality", quality);
    form.append("n", "1");
    if (OPENAI_IMAGE_MODEL === "gpt-image-1.5" || OPENAI_IMAGE_MODEL === "chatgpt-image-latest") {
      form.append("action", "edit");
    }

    const openaiResponse = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: form
    });

    const raw = await openaiResponse.text();
    const payload = safeJson(raw);
    if (!openaiResponse.ok) {
      return res.status(openaiResponse.status).json({
        error: payload?.error?.message || `OpenAI 请求失败：HTTP ${openaiResponse.status}`,
        details: payload
      });
    }

    const image = payload?.data?.[0];
    if (!image?.b64_json && !image?.url) {
      return res.status(502).json({ error: "OpenAI 没有返回可用图片。", details: payload });
    }

    res.json({
      ok: true,
      styleId,
      styleName: style.name,
      model: OPENAI_IMAGE_MODEL,
      imageBase64: image.b64_json || null,
      imageUrl: image.url || null,
      dataUrl: image.b64_json ? `data:image/png;base64,${image.b64_json}` : null
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "未知服务端错误" });
  }
});

app.use((error, _req, res, _next) => {
  if (error?.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "图片不能超过 50MB。" });
  }
  res.status(500).json({ error: error?.message || "未知服务端错误" });
});

app.listen(PORT, () => {
  console.log(`Photo Style Workbench API: http://127.0.0.1:${PORT}`);
});

function buildPrompt({ style, strength, preserveIdentity, customPrompt }) {
  const styleIntensity = strength >= 75 ? "strong" : strength >= 45 ? "balanced" : "subtle";
  const preserveRule =
    preserveIdentity >= 75
      ? "Strictly preserve identity, face, pose, outfit, clothing, composition, camera angle, and scene layout."
      : preserveIdentity >= 45
        ? "Preserve identity and main composition while allowing moderate manga stylization."
        : "Preserve the main subject and recognizable identity while allowing a stronger manga transformation.";

  return [
    "Edit the uploaded photo into a polished Japanese manga / anime-style image for a fixed LifeManga-like workflow.",
    preserveRule,
    `Selected style: ${style.name}.`,
    `Apply this style with ${styleIntensity} intensity: ${style.prompt}`,
    `Reference direction: ${style.referenceDirection}`,
    "The result should feel like a finished manga page or manga key visual, not a generic photo filter.",
    "Keep the subject recognizable. Do not add watermark, logo, unrelated objects, extra people, or a different face.",
    customPrompt ? `User extra direction: ${customPrompt}` : ""
  ]
    .filter(Boolean)
    .join("\n");
}

function clamp(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function safeJson(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return { raw };
  }
}
