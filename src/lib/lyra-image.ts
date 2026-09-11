/** Geração de imagens via Pollinations AI. */

const INTENT_RE =
  /^\s*(?:por\s+favor,?\s*)?(?:me\s+)?(?:gera|gere|gerar|cria|crie|criar|desenha|desenhe|desenhar|faz|faça|fazer|ilustra|ilustre|ilustrar|imagina|imagine|generate|create|draw|make)\b/i;

const IMAGE_WORD_RE =
  /\b(imagem|imagens|foto|fotografia|ilustração|ilustracao|desenho|arte|wallpaper|logo|poster|picture|image|photo|artwork)\b/i;

const CLEAN_RE =
  /^\s*(?:por\s+favor,?\s*)?(?:me\s+)?(?:gera|gere|gerar|cria|crie|criar|desenha|desenhe|desenhar|faz|faça|fazer|ilustra|ilustre|ilustrar|imagina|imagine|generate|create|draw|make)\s*(?:-?me)?\s*(?:uma?|um|the|a|an)?\s*(?:imagem|imagens|foto|fotografia|ilustração|ilustracao|desenho|arte|wallpaper|poster|picture|image|photo|artwork)?\s*(?:de|do|da|dos|das|sobre|com|of|about|with|que mostre|mostrando)?\s*[:,-]?\s*/i;

/** Devolve o prompt limpo quando o texto pede uma imagem; caso contrário null. */
export function detectImagePrompt(text: string): string | null {
  const t = text.trim();
  if (!t) return null;
  const isDraw = /^\s*(desenha|desenhe|desenhar|draw)\b/i.test(t);
  if (!INTENT_RE.test(t)) return null;
  if (!isDraw && !IMAGE_WORD_RE.test(t)) return null;

  const cleaned = t.replace(CLEAN_RE, "").trim();
  return cleaned.length >= 2 ? cleaned : t;
}

export function randomSeed() {
  return Math.floor(Math.random() * 100000);
}

export function pollinationsUrl(prompt: string, seed = randomSeed()) {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(
    prompt,
  )}?width=1024&height=1024&nologo=true&seed=${seed}`;
}

/** Extrai o prompt original de um URL da Pollinations (para regenerar). */
export function promptFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("pollinations.ai")) return null;
    const raw = u.pathname.replace(/^\/prompt\//, "");
    return decodeURIComponent(raw);
  } catch {
    return null;
  }
}
