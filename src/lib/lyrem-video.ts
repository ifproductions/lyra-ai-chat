/** Deteção e montagem de "vídeos" animados gerados com o Pollinations AI. */

import { randomSeed } from "./lyrem-image";

const VIDEO_INTENT_RE =
  /^\s*(?:por\s+favor,?\s*)?(?:me\s+)?(?:gera|gere|gerar|cria|crie|criar|faz|faça|fazer|anima|anime|animar|generate|create|make|animate)\b/i;

const VIDEO_WORD_RE = /\b(v[íi]deo|videos|v[íi]deos|anima[çc][ãa]o|animacao|gif|clipe|clip|video|movie|reel)\b/i;

const CLEAN_RE =
  /^\s*(?:por\s+favor,?\s*)?(?:me\s+)?(?:gera|gere|gerar|cria|crie|criar|faz|faça|fazer|anima|anime|animar|generate|create|make|animate)\s*(?:-?me)?\s*(?:uma?|um|the|a|an)?\s*(?:v[íi]deo|v[íi]deos|anima[çc][ãa]o|animacao|gif|clipe|clip|video|movie|reel)?\s*(?:de|do|da|dos|das|sobre|com|of|about|with|que mostre|mostrando)?\s*[:,-]?\s*/i;

export const LYREM_VIDEO_SCHEME = "lyrem-video:";

/** Devolve o prompt limpo quando o texto pede um vídeo; caso contrário null. */
export function detectVideoPrompt(text: string): string | null {
  const t = text.trim();
  if (!t) return null;
  if (!VIDEO_INTENT_RE.test(t)) return null;
  if (!VIDEO_WORD_RE.test(t)) return null;
  const cleaned = t.replace(CLEAN_RE, "").trim();
  return cleaned.length >= 2 ? cleaned : t;
}

export function videoMarkdownSrc(prompt: string) {
  return `${LYREM_VIDEO_SCHEME}${encodeURIComponent(prompt)}`;
}

export function isVideoSrc(src: string) {
  return src.startsWith(LYREM_VIDEO_SCHEME);
}

export function promptFromVideoSrc(src: string) {
  try {
    return decodeURIComponent(src.slice(LYREM_VIDEO_SCHEME.length));
  } catch {
    return src.slice(LYREM_VIDEO_SCHEME.length);
  }
}

export const VIDEO_FRAME_COUNT = 8;

/** Frames de alta qualidade que compõem a animação. */
export function videoFrameUrls(prompt: string, baseSeed = randomSeed()) {
  return Array.from({ length: VIDEO_FRAME_COUNT }, (_, i) => {
    const shot = `${prompt}, cinematic frame ${i + 1} of ${VIDEO_FRAME_COUNT}, smooth motion sequence, high detail, 4k`;
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(
      shot,
    )}?width=1280&height=720&nologo=true&enhance=true&seed=${baseSeed + i}`;
  });
}
