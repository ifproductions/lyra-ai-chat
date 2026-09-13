# Lyra AI — overhaul premium

## Objetivo
Reformular integralmente a experiência para uma identidade própria “Lyra AI”, com interface premium, conversa resiliente, anexos, voz, conta, idiomas e animações fluidas, preservando autenticação, geração de imagens e histórico existentes.

## 1. Identidade e navegação
- Substituir todas as referências visíveis a “IF AI”, IF Productions e ao slogan por “Lyra AI”.
- Importar o logótipo enviado como ativo oficial e reutilizá-lo no estado inicial, barra lateral, autenticação, avatar da assistente e favicon.
- Fixar título, descrições sociais e metadados das páginas em torno de “Lyra AI”.
- Mostrar no cabeçalho apenas “Lyra AI” e o tópico/título da conversa atual; para conversas vazias usar uma tradução contextual de “Saudações”.
- Remover o indicador técnico do modelo e a engrenagem duplicada do cabeçalho.
- Iniciar a barra lateral compacta; retirar ícones redundantes do histórico e manter a única entrada de definições no rodapé.

## 2. Nova base visual e experiência de chat
- Reorganizar a tela principal em componentes menores: cabeçalho, estado inicial, lista de mensagens, compositor, anexos e estados de geração.
- Instalar e compor os elementos oficiais de conversa, mensagem, campo de prompt, anexos, shimmer e raciocínio, preservando a aparência própria da Lyra.
- Criar um sistema visual escuro/claro coerente com o logótipo: superfícies grafite, roxo-violeta e magenta como acentos, tipografia geométrica e contraste acessível.
- Substituir os três pontos por um indicador Lyra com anel luminoso e shimmer; no modo desempenho usar uma versão simples sem filtros pesados.
- Adicionar animações com Motion: entrada elástica de mensagens, troca lateral de conversa, recolha escalonada ao criar novo chat e expansão do estado inicial.
- Respeitar `prefers-reduced-motion` e impedir que animações alterem o tamanho/layout do chat.

## 3. Conversa e fallback resiliente
- Migrar a chamada principal para Lovable AI com `openai/gpt-6-astra`, streaming obrigatório e raciocínio resumido, mantendo prompts e chaves exclusivamente no servidor.
- Identificar a assistente no prompt como “Lyra 4 Pro”, responder no idioma selecionado e nunca expor nomes de fornecedores/modelos internos.
- Usar a integração OpenRouter já configurada como fallback server-side após falha terminal ou esgotamento da tentativa principal; aplicar backoff limitado somente a 429/5xx.
- Preservar o pedido, continuar silenciosamente no fallback e eliminar banners vermelhos/técnicos. Se todos os caminhos falharem, mostrar um estado neutro, localizado e acionável dentro da mensagem, sem perder o texto do utilizador.
- Propagar corretamente o identificador de execução, suportar cancelamento pelo utilizador e validar a rota com uma chamada real antes de concluir.

## 4. Anexos e ficheiros gerados
- Adicionar clipe no compositor, seleção múltipla, pré-visualização, remoção e validação de tamanho/tipo para imagens, áudio, vídeo, PDF, documentos e ficheiros de texto/código.
- Enviar imagens/PDFs ao modelo, transcrever MP3/áudio no servidor e extrair texto dos formatos textuais suportados; MP4 e formatos não interpretáveis permanecem anexados e claramente identificados, sem fingir análise do conteúdo.
- Introduzir um protocolo de artefactos para pedidos de ficheiro: durante o stream mostrar “A criar arquivo…”, detetar nome/extensão e renderizar um bloco final com pré-visualização e download por Blob.
- Permitir downloads seguros de HTML, CSS, JS, JSON, TXT, Markdown e outros formatos textuais. Pedidos de `.exe` não fabricarão binários executáveis; a Lyra entregará o código-fonte/ficheiros de compilação descarregáveis.

## 5. Voz e modo chamada
- Adicionar microfone ao campo de mensagem com permissão, gravação PCM/WAV, transcrição streaming e inserção do texto reconhecido no campo.
- Criar “Modo Chamada” em overlay: ciclos de ouvir → transcrever → responder → reproduzir, botão terminar/silenciar, transcrição visível e recuperação clara de erros.
- Usar voz sintetizada server-side e oferecer quatro perfis de apresentação: Feminina Natural, Masculina Natural, Feminina Suave e Masculina Expressiva.
- Manter o modo por turnos, evitando prometer telefonia duplex contínua onde o navegador não a suporta de forma confiável.

## 6. Definições, perfil e privacidade
- Ampliar o modal de definições e organizá-lo por Aparência, Idioma e Desempenho; remover totalmente o seletor “Inteligência”.
- Adicionar Escuro, Claro e Sistema, com atualização automática quando o tema do sistema mudar.
- Adicionar “Modo de Desempenho” persistente, removendo blur, backdrop-filter, sombras atmosféricas e animações complexas.
- Expandir o menu do utilizador para “Configurações da Conta” e “Sair”; usar a foto oficial da conta Google quando disponível.
- Criar modal de conta com foto personalizada, guardar histórico, limpar histórico e preferências de privacidade.
- Guardar preferências locais para visitantes e sincronizar perfil/preferências na Lovable Cloud para utilizadores autenticados, com políticas de acesso apenas ao próprio utilizador e armazenamento privado para avatares.

## 7. Idiomas
- Criar uma camada única de traduções para Português, English, Español, Français e Deutsch.
- Traduzir dinamicamente navegação, botões, estados, menus, autenticação, definições, anexos, voz, erros e textos vazios.
- Persistir o idioma, atualizar `lang` do documento e enviar idioma/data/hora local ao prompt da Lyra em cada conversa.

## 8. Persistência e tópicos
- Manter conversas locais como padrão e respeitar a opção de desativar histórico; quando desativada, não escrever novas conversas no navegador.
- Limpar histórico somente após confirmação e remover os dados correspondentes.
- Gerar o tópico do cabeçalho a partir da primeira mensagem com regras locais rápidas (incluindo “Saudações” para cumprimentos), evitando uma chamada extra de IA.

## 9. Validação final
- Verificar chat, fallback, interrupção, anexos, download de artefactos, microfone, chamada, temas, desempenho, cinco idiomas, login Google/email, avatar, privacidade e limpeza de histórico.
- Testar desktop e mobile, foco por teclado, contraste, leitores de tela, movimento reduzido e ausência de sobreposição no compositor.
- Executar lint, verificação de tipos/testes do projeto e testes reais no navegador; confirmar também metadados únicos das páginas e favicon Lyra.

## Decisões técnicas
- A interface não exibirá nem permitirá escolher fornecedores/modelos; “Lyra 4 Pro” é a identidade pública estável.
- O fallback reduz interrupções, mas uma indisponibilidade simultânea de todos os serviços ainda produzirá uma mensagem neutra com opção de tentar novamente, nunca uma falsa resposta.
- Áudio funciona por turnos com transcrição e síntese; MP4 pode ser anexado/baixado, mas não será alegado como compreendido sem uma etapa de processamento compatível.
