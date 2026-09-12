import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const BodySchema = z.object({
  model: z.string().min(1).max(120).optional(),
  localTime: z.string().max(120).optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(24000),
      }),
    )
    .min(1)
    .max(60),
});

const DEFAULT_MODEL = "openai/gpt-4o-mini";
const ALLOWED_MODELS = new Set(["openai/gpt-4o-mini", "openai/gpt-4o"]);

function systemPrompt(localTime: string) {
  return `Você é a Lyra AI, a assistente inteligente da IF Productions ("IF AI").
Seu lema é "O Mundo Precisa de ti". Você é calorosa, direta, criativa e confiável.
Responda sempre no idioma do usuário (por padrão, português).
Use Markdown: títulos, listas, tabelas e blocos de código com a linguagem indicada.

DATA E HORA ATUAL DO USUÁRIO: ${localTime}. Use esta informação sempre que a pergunta envolver tempo, datas ou prazos.
Você tem acesso a pesquisa web em tempo real: cite fontes com links quando usar informação recente.

GERAÇÃO DE IMAGENS: você consegue criar imagens. Quando o usuário pedir para gerar, criar, desenhar ou ilustrar algo,
responda de forma amigável e inclua a imagem em Markdown usando exatamente esta sintaxe:
![descrição curta](https://image.pollinations.ai/prompt/PROMPT_EM_INGLES_CODIFICADO_EM_URL?width=1280&height=1280&nologo=true&enhance=true&seed=NUMERO)

GERAÇÃO DE VÍDEO: quando o usuário pedir um vídeo ou animação, responda de forma amigável e inclua:
![descrição curta](lyra-video:PROMPT_EM_INGLES_CODIFICADO_EM_URL)
Nunca invente outros domínios de mídia.`;
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["OPENROUTER_API_KEY"];
        if (!apiKey) {
          return Response.json(
            { error: "O serviço de conversa não está configurado." },
            { status: 500 },
          );
        }

        let body: z.infer<typeof BodySchema>;
        try {
          body = BodySchema.parse(await request.json());
        } catch {
          return Response.json({ error: "Pedido inválido." }, { status: 400 });
        }

        const model =
          body.model && ALLOWED_MODELS.has(body.model) ? body.model : DEFAULT_MODEL;
        const localTime = body.localTime ?? new Date().toISOString();

        const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey.trim()}`,
            "HTTP-Referer": "https://israelfranco-ai.com",
            "X-Title": "IF AI",
          },
          body: JSON.stringify({
            model,
            stream: true,
            plugins: [{ id: "web" }],
            messages: [
              { role: "system", content: systemPrompt(localTime) },
              ...body.messages,
            ],
          }),
        });

        if (!upstream.ok || !upstream.body) {
          const text = await upstream.text().catch(() => "");
          let message = "Não foi possível obter a resposta agora.";
          if (upstream.status === 401) message = "A chave do serviço de conversa é inválida.";
          if (upstream.status === 402) message = "Sem créditos disponíveis para este modelo.";
          if (upstream.status === 429)
            message = "Muitos pedidos seguidos. Espere alguns segundos e tente de novo.";
          console.error("OpenRouter error", upstream.status, text.slice(0, 500));
          return Response.json({ error: message }, { status: upstream.status });
        }

        return new Response(upstream.body, {
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-store",
            Connection: "keep-alive",
          },
        });
      },
    },
  },
});
