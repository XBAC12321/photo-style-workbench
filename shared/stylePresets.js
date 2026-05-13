export const stylePresets = [
  {
    id: "jp-film",
    name: "日系胶片",
    shortName: "胶片",
    summary: "温柔肤色、低对比和 35mm 颗粒，适合日常人像与生活记录。",
    prompt:
      "Japanese film photo retouching: soft natural contrast, warm highlights, gentle green shadows, subtle 35mm grain, slightly faded blacks, quiet lifestyle atmosphere, realistic skin texture.",
    referenceDirection:
      "Use a quiet Japanese street-photo mood, warm daylight, soft contrast, natural skin tone, and restrained film grain.",
    swatch: "linear-gradient(135deg,#f3d7a2,#82b7a8,#f8f1df)",
    defaults: {
      strength: 66,
      preserveIdentity: 86,
      size: "1024x1536",
      quality: "medium"
    },
    referenceImages: [
      { src: "/references/jp-film-01.svg", alt: "日系胶片参考图一" },
      { src: "/references/jp-film-02.svg", alt: "日系胶片参考图二" }
    ]
  },
  {
    id: "kr-clean",
    name: "韩系清透",
    shortName: "清透",
    summary: "干净空气感、亮肤和柔和阴影，适合头像、自拍和轻商业照。",
    prompt:
      "Clean Korean portrait retouching: bright airy skin tones, translucent lighting, clean background feel, soft shadows, polished but natural beauty finish, refined facial detail.",
    referenceDirection:
      "Use a clean studio-meets-window-light mood, bright skin tone, soft white balance, and minimal visual clutter.",
    swatch: "linear-gradient(135deg,#fde2ef,#dbeafe,#ffffff)",
    defaults: {
      strength: 58,
      preserveIdentity: 90,
      size: "1024x1536",
      quality: "medium"
    },
    referenceImages: [
      { src: "/references/kr-clean-01.svg", alt: "韩系清透参考图一" },
      { src: "/references/kr-clean-02.svg", alt: "韩系清透参考图二" }
    ]
  },
  {
    id: "editorial",
    name: "杂志大片",
    shortName: "大片",
    summary: "高端光影、明确主体和精修质感，适合个人品牌与商业肖像。",
    prompt:
      "High-end magazine editorial photography: premium directional lighting, confident contrast, controlled shadows, refined composition, fashion-grade color grading, polished realistic subject detail.",
    referenceDirection:
      "Use a premium editorial portrait mood with confident shadows, clean subject separation, and magazine cover-level polish.",
    swatch: "linear-gradient(135deg,#0f172a,#64748b,#f8fafc)",
    defaults: {
      strength: 74,
      preserveIdentity: 82,
      size: "1024x1536",
      quality: "high"
    },
    referenceImages: [
      { src: "/references/editorial-01.svg", alt: "杂志大片参考图一" },
      { src: "/references/editorial-02.svg", alt: "杂志大片参考图二" }
    ]
  },
  {
    id: "ccd",
    name: "复古 CCD",
    shortName: "CCD",
    summary: "闪光灯、旧相机色偏和轻微过曝，适合派对、夜晚和随手拍。",
    prompt:
      "Retro CCD compact camera look: flash-lit nostalgia, slightly playful color shift, crisp highlights, mild overexposure, casual late-2000s snapshot energy, realistic facial features.",
    referenceDirection:
      "Use an early digital compact camera mood with direct flash, saturated highlights, and playful late-night snapshot color.",
    swatch: "linear-gradient(135deg,#fb7185,#facc15,#60a5fa)",
    defaults: {
      strength: 78,
      preserveIdentity: 80,
      size: "1024x1024",
      quality: "medium"
    },
    referenceImages: [
      { src: "/references/ccd-01.svg", alt: "复古 CCD 参考图一" },
      { src: "/references/ccd-02.svg", alt: "复古 CCD 参考图二" }
    ]
  },
  {
    id: "cyber",
    name: "赛博夜景",
    shortName: "夜景",
    summary: "蓝紫霓虹、湿润高光和电影感，适合城市夜景与潮流人像。",
    prompt:
      "Cinematic cyber night photo styling: neon blue and magenta lighting, glossy wet-night atmosphere, dramatic but tasteful contrast, realistic subject detail, urban cinematic depth.",
    referenceDirection:
      "Use a blue-magenta city night palette, glossy highlights, practical neon light, and cinematic realism.",
    swatch: "linear-gradient(135deg,#111827,#7c3aed,#06b6d4)",
    defaults: {
      strength: 82,
      preserveIdentity: 78,
      size: "1024x1536",
      quality: "high"
    },
    referenceImages: [
      { src: "/references/cyber-01.svg", alt: "赛博夜景参考图一" },
      { src: "/references/cyber-02.svg", alt: "赛博夜景参考图二" }
    ]
  },
  {
    id: "oil",
    name: "油画质感",
    shortName: "油画",
    summary: "柔和笔触、厚涂色块和古典光感，适合更艺术化的头像和纪念照。",
    prompt:
      "Painterly oil portrait treatment: soft brush texture, rich color blocks, warm classical lighting, refined hand-painted finish, preserve recognizable face, pose, outfit, and composition.",
    referenceDirection:
      "Use a refined oil portrait mood with visible brush texture, warm museum lighting, and painterly color blocks.",
    swatch: "linear-gradient(135deg,#78350f,#f59e0b,#14532d)",
    defaults: {
      strength: 86,
      preserveIdentity: 72,
      size: "1024x1536",
      quality: "high"
    },
    referenceImages: [
      { src: "/references/oil-01.svg", alt: "油画质感参考图一" },
      { src: "/references/oil-02.svg", alt: "油画质感参考图二" }
    ]
  }
];

export function getStylePreset(styleId) {
  return stylePresets.find((style) => style.id === styleId) || null;
}

export const allowedSizes = ["1024x1024", "1024x1536", "1536x1024", "auto"];
export const allowedQualities = ["low", "medium", "high", "auto"];
