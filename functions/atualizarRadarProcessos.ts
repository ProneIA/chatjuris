import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Simular coleta de dados públicos de processos usando IA
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é um sistema de coleta de dados processuais públicos brasileiros.

Gere dados SIMULADOS (para demonstração) de 15 processos públicos recentes distribuídos em tribunais brasileiros.

IMPORTANTE: Dados totalmente fictícios para demonstração do sistema.

Para cada processo, gere:
- Número processo (formato CNJ simulado)
- Classe processual (ex: "Ação de Revisão Contratual", "Reclamação Trabalhista", etc)
- Área jurídica (consumidor, trabalhista, previdenciario, familia, empresarial, tributario, saude, imobiliario)
- Tribunal (TJPI, TJSP, TRT, etc)
- Comarca
- Município
- Estado (UF)
- Valor causa (entre 5000 e 100000)
- Data distribuição (últimos 30 dias)
- Evento tipo (distribuicao, citacao, execucao)
- Assunto principal
- Risco jurídico (baixo, medio, alto)

Retorne array de 15 processos.`,
      response_json_schema: {
        type: "object",
        properties: {
          processos: {
            type: "array",
            items: {
              type: "object",
              properties: {
                numero_processo: { type: "string" },
                classe: { type: "string" },
                area_juridica: { type: "string" },
                tribunal: { type: "string" },
                comarca: { type: "string" },
                municipio: { type: "string" },
                estado: { type: "string" },
                valor_causa: { type: "number" },
                data_distribuicao: { type: "string" },
                evento_tipo: { type: "string" },
                assunto_principal: { type: "string" },
                risco_juridico: { type: "string" }
              }
            }
          }
        }
      }
    });

    // Inserir casos públicos no banco
    const casosInseridos = [];
    for (const processo of response.processos) {
      const caso = await base44.entities.CasoPublico.create({
        numero_processo: processo.numero_processo,
        classe: processo.classe,
        area_juridica: processo.area_juridica,
        tribunal: processo.tribunal,
        comarca: processo.comarca,
        municipio: processo.municipio,
        estado: processo.estado,
        valor_causa: processo.valor_causa,
        data_distribuicao: processo.data_distribuicao,
        evento_tipo: processo.evento_tipo,
        assunto_principal: processo.assunto_principal,
        risco_juridico: processo.risco_juridico,
        fonte: 'Sistema Simulado - Dados Públicos'
      });
      casosInseridos.push(caso);
    }

    // Gerar insights agregados por área
    const insightResponse = await base44.integrations.Core.InvokeLLM({
      prompt: `Analise os seguintes casos processuais e gere 3 insights estratégicos agregados.

Dados: ${JSON.stringify(response.processos)}

Para cada insight, forneça:
- Título técnico
- Área jurídica predominante
- Região (estado)
- Volume de casos identificados
- Ticket médio estimado
- Tendência (alta, estavel, queda)
- Descrição técnica do padrão identificado
- Estratégia informativa sugerida (SEM sugerir contato direto com partes)

Formato: análise técnica, objetiva, informativa.`,
      response_json_schema: {
        type: "object",
        properties: {
          insights: {
            type: "array",
            items: {
              type: "object",
              properties: {
                titulo: { type: "string" },
                area_juridica: { type: "string" },
                regiao: { type: "string" },
                volume_casos: { type: "number" },
                ticket_medio: { type: "number" },
                tendencia: { type: "string" },
                descricao: { type: "string" },
                estrategia_sugerida: { type: "string" },
                relevancia: { type: "string" }
              }
            }
          }
        }
      }
    });

    // Inserir insights no banco
    const insightsInseridos = [];
    const hoje = new Date().toISOString().split('T')[0];
    const quinzeDiasAtras = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    for (const insight of insightResponse.insights) {
      const insightCriado = await base44.entities.InsightJuridico.create({
        titulo: insight.titulo,
        area_juridica: insight.area_juridica,
        regiao: insight.regiao,
        volume_casos: insight.volume_casos,
        ticket_medio: insight.ticket_medio,
        tendencia: insight.tendencia,
        periodo_analise_inicio: quinzeDiasAtras,
        periodo_analise_fim: hoje,
        descricao: insight.descricao,
        estrategia_sugerida: insight.estrategia_sugerida,
        relevancia: insight.relevancia || 'media'
      });
      insightsInseridos.push(insightCriado);
    }

    return Response.json({
      success: true,
      casos_inseridos: casosInseridos.length,
      insights_gerados: insightsInseridos.length,
      mensagem: `Radar atualizado com sucesso! ${casosInseridos.length} casos e ${insightsInseridos.length} insights gerados.`
    });

  } catch (error) {
    console.error('Erro ao atualizar radar:', error);
    return Response.json({ 
      error: error.message,
      details: 'Erro ao processar dados do radar'
    }, { status: 500 });
  }
});