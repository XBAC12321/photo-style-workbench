# Photo Style Workbench

照片 AI 风格化 MVP。当前版本优先交付 iPhone 可试用的 PWA：打开网页后可添加到主屏幕，所有图片生成请求都通过服务端代理，浏览器不会接触 `OPENAI_API_KEY`。

## 运行

```bash
npm install
cp .env.example .env
# 编辑 .env，填入 OPENAI_API_KEY
npm run dev
```

前端：http://127.0.0.1:5280 或同局域网下的电脑 IP:5280
后端：http://127.0.0.1:8888

## MVP 功能

- 单图上传、浏览器端压缩和预览
- 6 套固定风格工作流，每套包含提示词、默认参数和参考图
- 风格强度、身份保真、尺寸、画质和补充描述
- 服务端代理 OpenAI 图片编辑接口
- 生成中状态、清晰错误提示、原图/结果滑杆对比
- 下载结果
- 最近 8 条本地历史记录，使用 IndexedDB 保存原图和结果
- PWA manifest、Service Worker、iPhone 主屏幕元信息和离线壳

## 风格配置

风格统一维护在 `shared/stylePresets.js`，前端和后端共用同一份配置。

每套风格包含：

- `id`
- `name`
- `summary`
- `prompt`
- `referenceDirection`
- `referenceImages`
- `defaults`
- `swatch`

初期不开放用户自定义风格编辑器。要扩展产品线时，先在这里新增固定风格和参考图。

## API

### `GET /api/health`

返回：

- `ok`
- `app`
- `model`
- `hasApiKey`

### `POST /api/style-image`

字段：

- `image`: 图片文件，JPG / PNG / WebP，最大 50MB
- `styleId`: `jp-film` / `kr-clean` / `editorial` / `ccd` / `cyber` / `oil`
- `strength`: 0-100
- `preserveIdentity`: 0-100
- `customPrompt`: 可选
- `size`: `1024x1024` / `1024x1536` / `1536x1024` / `auto`
- `quality`: `low` / `medium` / `high` / `auto`

返回：

- `ok`
- `styleId`
- `styleName`
- `model`
- `dataUrl` 或 `imageUrl`

## iPhone 试用

开发机和 iPhone 需要在同一网络下。运行 `npm run dev` 后，用 Safari 打开 `http://电脑局域网IP:5280`；如果要获得完整 PWA 安装体验，建议部署到 HTTPS 环境。

商业化内测前建议补充：鉴权、额度、限流、日志、成本统计和用户作品云端存储。
