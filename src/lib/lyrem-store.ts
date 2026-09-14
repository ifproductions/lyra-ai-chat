import type { Locale } from "./lyrem-i18n";

export type ChatRole = "user" | "assistant";
export type ChatAttachment = { id: string; name: string; type: string; size: number; dataUrl?: string; text?: string };
export type ChatMessage = { id: string; role: ChatRole; content: string; attachments?: ChatAttachment[]; failed?: boolean };
export type Conversation = { id: string; title: string; createdAt: number; messages: ChatMessage[] };
export type Theme = "dark" | "light" | "system";
export type LyremSettings = { theme: Theme; locale: Locale; performanceMode: boolean; historyEnabled: boolean; privacyAnalytics: boolean; voice: "female-natural"|"male-natural"|"female-soft"|"male-expressive" };
const CONVERSATIONS_KEY="lyrem-ai:conversations"; const SETTINGS_KEY="lyrem-ai:settings";
export const DEFAULT_SETTINGS: LyremSettings={ theme:"dark", locale:"pt", performanceMode:false, historyEnabled:true, privacyAnalytics:false, voice:"female-natural" };
export function newId(){ return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)+Date.now().toString(36); }
export function loadConversations():Conversation[]{ if(typeof window==="undefined")return[]; try{const p=JSON.parse(localStorage.getItem(CONVERSATIONS_KEY)??"[]"); return Array.isArray(p)?p:[];}catch{return[];} }
export function saveConversations(items:Conversation[],enabled=true){if(typeof window==="undefined")return; if(!enabled){localStorage.removeItem(CONVERSATIONS_KEY);return;} try{localStorage.setItem(CONVERSATIONS_KEY,JSON.stringify(items));}catch{/* quota */}}
export function clearConversations(){if(typeof window!=="undefined")localStorage.removeItem(CONVERSATIONS_KEY);}
export function loadSettings():LyremSettings{if(typeof window==="undefined")return DEFAULT_SETTINGS;try{const p=JSON.parse(localStorage.getItem(SETTINGS_KEY)??"{}");return{...DEFAULT_SETTINGS,...p,theme:["dark","light","system"].includes(p.theme)?p.theme:"dark",locale:["pt","en","es","fr","de"].includes(p.locale)?p.locale:"pt"};}catch{return DEFAULT_SETTINGS;}}
export function saveSettings(s:LyremSettings){if(typeof window!=="undefined")localStorage.setItem(SETTINGS_KEY,JSON.stringify(s));}
export function applyTheme(theme:Theme,performance=false){if(typeof document==="undefined")return;const dark=theme==="dark"||(theme==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",dark);document.documentElement.classList.toggle("light",!dark);document.documentElement.classList.toggle("performance-mode",performance);}
export function titleFrom(text:string, fallback="New conversation"){const clean=text.trim().replace(/\s+/g," ");if(/^(ol[aá]|oi|bom dia|boa tarde|boa noite|hello|hi|hey|hola|bonjour|salut|hallo)\b/i.test(clean))return fallback;return clean.length>46?`${clean.slice(0,46)}…`:clean||fallback;}
