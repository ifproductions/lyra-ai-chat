import type { ChatMessage } from "./lyra-store";

export const LYRA_SYSTEM_PROMPT = `Você é a Lyra AI, a assistente inteligente da IF Productions ("IF AI").
Seu lema é "O Mundo Precisa de ti". Você é calorosa, direta e criativa.
Responda sempre no idioma do usuário (por padrão, português).
Use Markdown: títulos, listas, tabelas e blocos de código com a linguagem indicada.

GERAÇÃO DE IMAGENS: você consegue criar imagens. Quando o usuário pedir para gerar, criar, desenhar ou ilustrar algo,
responda de forma amigável e inclua a imagem em Markdown usando exatamente esta sintaxe:
![descrição curta](https://image.pollinations.ai/prompt/PROMPT_EM_INGLES_CODIFICADO_EM_URL?width=1024&height=1024&nologo=true&seed=NUMERO)
Onde PROMPT_EM_INGLES_CODIFICADO_EM_URL é uma descrição visual rica em inglês, codificada para URL (espaços como %20),
e NUMERO é um inteiro aleatório. Nunca invente outros domínios de imagem.`;


export type StreamArgs = {
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  signal?: AbortSignal;
  onDelta: (chunk: string) => void;
};

/** Resposta simulada usada quando nenhuma chave da OpenRouter foi configurada. */
export async function streamDemo({
  messages,
  onDelta,
  signal,
}: Pick<StreamArgs, "messages" | "onDelta" | "signal">) {
  const last = messages[messages.length - 1]?.content ?? "";
  const reply = `Olá! Eu sou a **Lyra AI** 💜

Estou no **modo demonstração**, porque ainda não há uma chave da OpenRouter configurada.

Você perguntou:

> ${last.slice(0, 300)}

Para respostas reais, abra **Configurações** (ícone de engrenagem), cole a sua chave da OpenRouter e escolha um modelo.

\`\`\`ts
// depois disso, é só conversar
const lyra = "pronta";
\`\`\`

*O Mundo Precisa de ti.*`;

  for (const token of reply.split(/(\s+)/)) {
    if (signal?.aborted) return;
    onDelta(token);
    await new Promise((r) => setTimeout(r, 14));
  }
}

export async function streamOpenRouter({
  apiKey,
  model,
  messages,
  signal,
  onDelta,
}: StreamArgs) {
  const trimmedKey = (apiKey ?? "").trim();
  if (!trimmedKey) {
    throw new Error("Chave da API em falta. Configura-a nas definições.");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${trimmedKey}`,
    "HTTP-Referer": "https://israelfranco-ai.com",
    "X-Title": "IF AI",
  };

  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined || value === null) {
      throw new Error(`Cabeçalho inválido: ${key} está indefinido.`);
    }
    if (/[^\x00-\x7F]/.test(value)) {
      throw new Error(`Cabeçalho ${key} contém caracteres não-ASCII.`);
    }
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    signal: signal ?? null,
    headers,
    body: JSON.stringify({
      model,
      stream: true,
      messages: [
        { role: "system", content: LYRA_SYSTEM_PROMPT },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    }),
  });

  if (!response.ok || !response.body) {
    const text = await response.text().catch(() => "");
    let message = text;
    try {
      message = (JSON.parse(text) as { error?: { message?: string } }).error?.message ?? text;
    } catch {
      /* corpo não é JSON */
    }
    if (response.status === 401) {
      throw new Error("Chave da OpenRouter inválida. Verifique em Configurações.");
    }
    if (response.status === 402) {
      throw new Error("Sem créditos na sua conta OpenRouter para este modelo.");
    }
    if (response.status === 429) {
      throw new Error("Muitos pedidos seguidos. Espere alguns segundos e tente de novo.");
    }
    throw new Error(message || `Falha na resposta (${response.status}).`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const parsed = JSON.parse(data) as {
          choices?: { delta?: { content?: string } }[];
        };
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) onDelta(delta);
      } catch {
        /* keep-alive ou fragmento incompleto */
      }
    }
  }
}
