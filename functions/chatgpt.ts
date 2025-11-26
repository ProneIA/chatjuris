import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import OpenAI from 'npm:openai@4.68.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const apiKey = Deno.env.get("OPENAI_API_KEY");
        if (!apiKey) {
            return Response.json({ error: 'OpenAI API key not configured' }, { status: 500 });
        }

        const openai = new OpenAI({ apiKey });

        const { messages, mode } = await req.json();
        
        if (!messages || !Array.isArray(messages)) {
            return Response.json({ error: 'Messages array is required' }, { status: 400 });
        }

        const systemPrompts = {
            assistant: `Você é JURIS, um assistente jurídico inteligente e especializado em direito brasileiro. 
Você ajuda advogados com:
- Análise de casos e processos
- Pesquisa de jurisprudência
- Redação de petições e documentos
- Orientações sobre prazos processuais
- Interpretação de leis e normas

Seja preciso, profissional e cite fontes quando relevante. Responda sempre em português brasileiro.`,
            
            legal_document_generator: `Você é um especialista em redação jurídica brasileira.
Gere documentos legais completos, bem estruturados e tecnicamente corretos.
Use linguagem formal e técnica apropriada. Inclua todos os elementos necessários do documento solicitado.`,
            
            document_analyzer: `Você é um especialista em análise de documentos jurídicos.
Analise documentos legais identificando pontos importantes, riscos, cláusulas relevantes e sugestões de melhoria.`
        };

        const systemMessage = systemPrompts[mode] || systemPrompts.assistant;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemMessage },
                ...messages.map(m => ({
                    role: m.role,
                    content: m.content
                }))
            ],
            temperature: 0.7,
            max_tokens: 4000,
        });

        return Response.json({ 
            content: response.choices[0].message.content,
            usage: response.usage
        });
    } catch (error) {
        console.error('ChatGPT Error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});