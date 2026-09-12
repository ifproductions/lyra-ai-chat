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

export type Theme = "dark" | "light";

export type LyraSettings = {
  model: string;
  theme: Theme;
};

export const DEFAULT_MODEL = "openai/gpt-4o-mini";

export const MODEL_OPTIONS = [
  { id: "openai/gpt-4o-mini", label: "GPT-4o Mini (Padrão, rápido)" },
  { id: "openai/gpt-4o", label: "GPT-4o (Máxima qualidade)" },
];

const VALID_MODEL_IDS = new Set(MODEL_OPTIONS.map((m) => m.id));

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

export const DEFAULT_SETTINGS: LyraSettings = { model: DEFAULT_MODEL, theme: "dark" };

export function loadSettings(): LyraSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<LyraSettings>) : {};
    const savedModel = parsed.model || DEFAULT_MODEL;
    return {
      model: VALID_MODEL_IDS.has(savedModel) ? savedModel : DEFAULT_MODEL,
      theme: parsed.theme === "light" ? "light" : "dark",
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: LyraSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.classList.toggle("light", theme === "light");
}

export function titleFrom(text: string) {
  const clean = text.trim().replace(/\s+/g, " ");
  return clean.length > 42 ? `${clean.slice(0, 42)}…` : clean || "Nova conversa";
}
