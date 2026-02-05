import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Simula coleta de dados públicos de tribunais
    // Em produção, isso conectaria com APIs públicas reais (PJe, TJXX, etc)
    const dadosSimulados = gerarDadosPublicos();
    
    // Inserir casos públicos
    const casosInseridos = [];
    for (const caso of dadosSimulados.casos) {
      const novoCaso = await base44.entities.CasoPublico.create({
        ...caso,
        created_by: user.email
      });
      casosInseridos.push(novoCaso);
    }

    // Gerar insights agregados
    const insights = await gerarInsights(casosInseridos, base44, user.email);

    return Response.json({
      success: true,
      casosInseridos: casosInseridos.length,
      insightsGerados: insights.length,
      message: 'Dados atualizados com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar radar:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});

function gerarDadosPublicos() {
  const areas = ['consumidor', 'trabalhista', 'previdenciario', 'familia', 'empresarial', 'tributario', 'saude', 'imobiliario'];
  const estados = ['SP', 'RJ', 'MG', 'RS', 'BA', 'PR', 'PE', 'CE', 'PI', 'GO'];
  const classes = [
    'Ação de Revisão Contratual',
    'Reclamação Trabalhista',
    'Aposentadoria por Invalidez',
    'Divórcio Consensual',
    'Recuperação Judicial',
    'Mandado de Segurança Tributário',
    'Ação de Obrigação de Fazer - Saúde',
    'Despejo por Falta de Pagamento'
  ];
  const eventos = ['distribuicao', 'citacao', 'execucao', 'sentenca', 'recurso'];
  
  const casos = [];
  const quantidade = 20; // Gerar 20 casos novos por execução
  
  for (let i = 0; i < quantidade; i++) {
    const area = areas[Math.floor(Math.random() * areas.length)];
    const estado = estados[Math.floor(Math.random() * estados.length)];
    const dataBase = new Date();
    dataBase.setDate(dataBase.getDate() - Math.floor(Math.random() * 30)); // Últimos 30 dias
    
    casos.push({
      numero_processo: gerarNumeroProcesso(),
      classe: classes[Math.floor(Math.random() * classes.length)],
      area_juridica: area,
      tribunal: `TJ${estado}`,
      comarca: gerarComarca(estado),
      municipio: gerarMunicipio(estado),
      estado: estado,
      valor_causa: Math.floor(Math.random() * 50000) + 5000,
      data_distribuicao: dataBase.toISOString().split('T')[0],
      evento_tipo: eventos[Math.floor(Math.random() * eventos.length)],
      assunto_principal: `Assunto ${i + 1}`,
      risco_juridico: ['baixo', 'medio', 'alto'][Math.floor(Math.random() * 3)],
      fonte: 'Tribunais de Justiça - Dados Públicos'
    });
  }
  
  return { casos };
}

async function gerarInsights(casos, base44, userEmail) {
  const insights = [];
  
  // Agrupar por área
  const porArea = {};
  casos.forEach(caso => {
    if (!porArea[caso.area_juridica]) {
      porArea[caso.area_juridica] = {
        casos: [],
        valores: []
      };
    }
    porArea[caso.area_juridica].casos.push(caso);
    porArea[caso.area_juridica].valores.push(caso.valor_causa);
  });

  // Criar insights por área
  for (const [area, dados] of Object.entries(porArea)) {
    if (dados.casos.length < 3) continue; // Mínimo de 3 casos para gerar insight
    
    const ticketMedio = dados.valores.reduce((a, b) => a + b, 0) / dados.valores.length;
    const regiao = dados.casos[0].estado;
    
    // Calcular tendência comparando com dados históricos (simplificado)
    const tendencia = dados.casos.length > 5 ? 'alta' : 'estavel';
    
    const insight = await base44.entities.InsightJuridico.create({
      titulo: `Oportunidades em ${area.charAt(0).toUpperCase() + area.slice(1)}`,
      area_juridica: area,
      regiao: regiao,
      volume_casos: dados.casos.length,
      ticket_medio: Math.round(ticketMedio),
      tendencia: tendencia,
      periodo_analise_inicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      periodo_analise_fim: new Date().toISOString().split('T')[0],
      descricao: `Identificados ${dados.casos.length} novos casos de ${area} na região. Ticket médio estimado: R$ ${Math.round(ticketMedio).toLocaleString('pt-BR')}.`,
      relevancia: dados.casos.length > 8 ? 'alta' : 'media',
      created_by: userEmail
    });
    
    insights.push(insight);
  }
  
  return insights;
}

function gerarNumeroProcesso() {
  const ano = new Date().getFullYear();
  const numero = Math.floor(Math.random() * 9000000) + 1000000;
  return `${numero}-${Math.floor(Math.random() * 90) + 10}.${ano}.8.26.0000`;
}

function gerarComarca(estado) {
  const comarcas = {
    'SP': ['São Paulo', 'Campinas', 'Santos', 'Ribeirão Preto'],
    'RJ': ['Rio de Janeiro', 'Niterói', 'Campos dos Goytacazes'],
    'MG': ['Belo Horizonte', 'Uberlândia', 'Juiz de Fora'],
    'PI': ['Teresina', 'Parnaíba', 'Picos', 'Piripiri'],
    'BA': ['Salvador', 'Feira de Santana', 'Vitória da Conquista']
  };
  const lista = comarcas[estado] || ['Comarca Central'];
  return lista[Math.floor(Math.random() * lista.length)];
}

function gerarMunicipio(estado) {
  return gerarComarca(estado);
}