export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

export type Conversation = {
  id: string;
  title: string;
  createdAt: number;
  messages: ChatMessage[];
};

export type LyraSettings = {
  apiKey: string;
  model: string;
};

export const DEFAULT_MODEL = "google/gemini-2.0-flash-exp:free";

export const MODEL_OPTIONS = [
  { id: "google/gemini-2.0-flash-exp:free", label: "Gemini 2.0 Flash (grátis) — padrão" },
  { id: "google/gemini-flash-1.5", label: "Gemini Flash 1.5 — rápido e estável" },
  { id: "google/gemini-flash-1.5-8b", label: "Gemini Flash 1.5 8B — mais barato" },
  { id: "google/gemini-2.0-flash-001", label: "Gemini 2.0 Flash — produção" },
  { id: "google/gemini-pro-1.5", label: "Gemini Pro 1.5 — respostas mais profundas" },
];

const CONVERSATIONS_KEY = "if-ai:conversations";
const SETTINGS_KEY = "if-ai:settings";

export function newId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function loadConversations(): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CONVERSATIONS_KEY);
    const parsed = raw ? (JSON.parse(raw) as Conversation[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveConversations(conversations: Conversation[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
  } catch {
    /* storage cheio ou indisponível */
  }
}

export function loadSettings(): LyraSettings {
  if (typeof window === "undefined") return { apiKey: "", model: DEFAULT_MODEL };
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<LyraSettings>) : {};
    return { apiKey: parsed.apiKey ?? "", model: parsed.model || DEFAULT_MODEL };
  } catch {
    return { apiKey: "", model: DEFAULT_MODEL };
  }
}

export function saveSettings(settings: LyraSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function titleFrom(text: string) {
  const clean = text.trim().replace(/\s+/g, " ");
  return clean.length > 42 ? `${clean.slice(0, 42)}…` : clean || "Nova conversa";
}
