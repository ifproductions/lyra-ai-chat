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

export const DEFAULT_MODEL = "google/gemini-2.0-flash-lite-001:free";

export const MODEL_OPTIONS = [
  { id: "google/gemini-2.0-flash-lite-001:free", label: "Gemini Flash Grátis (Padrão)" },
  { id: "openai/gpt-4o-mini", label: "GPT-4o Mini" },
  { id: "meta-llama/llama-3.3-70b-instruct:free", label: "Meta Llama 3.3 Grátis" },
  { id: "deepseek/deepseek-r1:free", label: "DeepSeek R1 Grátis" },
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

export function loadSettings(): LyraSettings {
  if (typeof window === "undefined") return { apiKey: "", model: DEFAULT_MODEL };
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<LyraSettings>) : {};
    const savedModel = parsed.model || DEFAULT_MODEL;
    const model = VALID_MODEL_IDS.has(savedModel) ? savedModel : DEFAULT_MODEL;
    return { apiKey: parsed.apiKey ?? "", model };
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
