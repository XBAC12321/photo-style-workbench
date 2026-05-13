export const stylePresets = [
  {
    id: "shonen-jump",
    name: "经典少年 Jump 风",
    shortName: "少年",
    summary: "强线条、速度线、热血分镜，适合旅行、运动、街头和高能瞬间。",
    prompt:
      "Create a polished Japanese shonen manga page style: bold black ink linework, dynamic panel energy, speed lines, expressive faces, dramatic but readable composition, Weekly Shonen Jump inspired action mood.",
    referenceDirection:
      "Treat the uploaded photo as source material for a manga page. Preserve the person, place, pose and recognizable details, then translate them into confident shonen manga line art with cinematic framing.",
    swatch: "linear-gradient(135deg,#f8f8ff 0%,#ffffff 36%,#111111 37%,#f6f6f6 62%,#6c63ff 63%,#19192d 100%)",
    icon: "bolt",
    defaults: {
      strength: 82,
      preserveIdentity: 82,
      size: "1024x1536",
      quality: "high"
    },
    referenceImages: [
      { src: "/references/jp-film-01.svg", alt: "少年漫画线条参考" },
      { src: "/references/jp-film-02.svg", alt: "少年漫画构图参考" }
    ]
  },
  {
    id: "slice-of-life",
    name: "日常治愈风",
    shortName: "治愈",
    summary: "柔和线条、温暖光影、生活感构图，适合咖啡馆、家人、宠物和日常记录。",
    prompt:
      "Create a warm slice-of-life Japanese manga/anime illustration: gentle ink lines, soft daylight, cozy atmosphere, quiet emotional storytelling, clean backgrounds, expressive but natural character acting.",
    referenceDirection:
      "Keep the real-life scene and mood, then render it as a calm healing manga moment with soft contrast and warm everyday details.",
    swatch: "linear-gradient(135deg,#ffe7ef,#fff7d6 42%,#b8e0ca)",
    icon: "leaf",
    defaults: {
      strength: 72,
      preserveIdentity: 86,
      size: "1024x1536",
      quality: "medium"
    },
    referenceImages: [
      { src: "/references/kr-clean-01.svg", alt: "治愈漫画色彩参考" },
      { src: "/references/kr-clean-02.svg", alt: "治愈漫画光影参考" }
    ]
  },
  {
    id: "dark-drama",
    name: "暗黑剧情风",
    shortName: "暗黑",
    summary: "重阴影、强对比、压迫感镜头，适合夜景、情绪照和剧情感照片。",
    prompt:
      "Create a dark seinen manga drama style: heavy black shadows, tense cinematic framing, expressive close-ups, rain or night mood when suitable, sharp ink texture, mature suspense atmosphere.",
    referenceDirection:
      "Use the uploaded photo as a grounded scene, preserve identity and layout, and add dramatic manga shadows, tension, and noir-like emotional weight.",
    swatch: "linear-gradient(135deg,#050505,#222236 45%,#9a90ff)",
    icon: "mask",
    defaults: {
      strength: 84,
      preserveIdentity: 78,
      size: "1024x1536",
      quality: "high"
    },
    referenceImages: [
      { src: "/references/cyber-01.svg", alt: "暗黑漫画氛围参考" },
      { src: "/references/cyber-02.svg", alt: "暗黑漫画光影参考" }
    ]
  },
  {
    id: "gekiga",
    name: "复古剧画风",
    shortName: "剧画",
    summary: "昭和感网点纸纹、粗粝笔触、纪实感人物，适合街拍和人物故事。",
    prompt:
      "Create a retro gekiga manga style: gritty ink hatching, Showa-era manga texture, halftone paper grain, realistic adult proportions, documentary street mood, restrained dramatic composition.",
    referenceDirection:
      "Preserve the real subject and environment, then render them as a vintage Japanese gekiga panel with tactile paper texture and mature realism.",
    swatch: "linear-gradient(135deg,#efe4c5,#8b6f47 48%,#171717)",
    icon: "book",
    defaults: {
      strength: 80,
      preserveIdentity: 82,
      size: "1024x1536",
      quality: "medium"
    },
    referenceImages: [
      { src: "/references/editorial-01.svg", alt: "复古剧画构图参考" },
      { src: "/references/editorial-02.svg", alt: "复古剧画质感参考" }
    ]
  },
  {
    id: "chibi-yonkoma",
    name: "萌系四格风",
    shortName: "萌系",
    summary: "可爱比例、轻松表情、四格漫画感，适合自拍、朋友合照和趣味内容。",
    prompt:
      "Create a cute yonkoma manga style: charming chibi-inspired proportions without making adults look like children, clean rounded linework, playful facial expressions, simple readable manga storytelling, bright friendly palette.",
    referenceDirection:
      "Turn the uploaded photo into a playful cute manga moment while keeping the person recognizable and adult. Use simple shapes, friendly expressions, and clear composition.",
    swatch: "linear-gradient(135deg,#ffd7e8,#f8f4ff 48%,#9ed7ff)",
    icon: "smile",
    defaults: {
      strength: 86,
      preserveIdentity: 72,
      size: "1024x1024",
      quality: "medium"
    },
    referenceImages: [
      { src: "/references/oil-01.svg", alt: "萌系漫画人物参考" },
      { src: "/references/oil-02.svg", alt: "萌系漫画表情参考" }
    ]
  },
  {
    id: "sci-fi-mecha",
    name: "科幻机甲风",
    shortName: "机甲",
    summary: "冷色霓虹、未来机械细节、电影感构图，适合城市、夜景和概念照。",
    prompt:
      "Create a sci-fi mecha manga/anime style: futuristic city mood, crisp ink and cel shading, subtle mechanical design accents, neon blue-violet lighting, cinematic depth, high-detail but readable composition.",
    referenceDirection:
      "Preserve the uploaded person and setting, then reinterpret the scene as a futuristic manga frame with restrained mecha details and luminous cyber atmosphere.",
    swatch: "linear-gradient(135deg,#0b1021,#5865ff 50%,#00d7ff)",
    icon: "paperplane",
    defaults: {
      strength: 84,
      preserveIdentity: 76,
      size: "1024x1536",
      quality: "high"
    },
    referenceImages: [
      { src: "/references/cyber-01.svg", alt: "科幻机甲色彩参考" },
      { src: "/references/cyber-02.svg", alt: "科幻机甲光效参考" }
    ]
  }
];

export function getStylePreset(styleId) {
  return stylePresets.find((style) => style.id === styleId) || null;
}

export const allowedSizes = ["1024x1024", "1024x1536", "1536x1024", "auto"];
export const allowedQualities = ["low", "medium", "high", "auto"];
