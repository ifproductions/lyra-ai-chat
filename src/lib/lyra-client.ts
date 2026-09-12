import type { ChatMessage } from "./lyra-store";

export type StreamArgs = {
  model: string;
  messages: ChatMessage[];
  signal?: AbortSignal;
  onDelta: (chunk: string) => void;
};

/** Conversa com a Lyra através do servidor da IF (chave protegida no backend). */
export async function streamLyra({ model, messages, signal, onDelta }: StreamArgs) {
  const response = await fetch("/api/chat", {
    method: "POST",
    signal: signal ?? null,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      localTime: new Date().toLocaleString(),
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  if (!response.ok || !response.body) {
    let message = `Falha na resposta (${response.status}).`;
    try {
      const data = (await response.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      /* corpo não é JSON */
    }
    throw new Error(message);
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
