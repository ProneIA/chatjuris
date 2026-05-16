import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Copy, Download, FileText, ArrowLeft, Loader2, Scale, Gavel, Briefcase, Building2, ShoppingCart, Heart, Shield, Globe, Landmark, Leaf, Vote, Flag, BookOpen, Home, Cpu, Banknote, ChevronRight } from "lucide-react";

// ─── DADOS ────────────────────────────────────────────────────────────────────

const AREAS_JURIDICAS = [
  { id: "civil", label: "Direito Civil", icon: Scale },
  { id: "penal", label: "Direito Penal", icon: Gavel },
  { id: "trabalhista", label: "Direito Trabalhista", icon: Briefcase },
  { id: "tributario", label: "Direito Tributário", icon: Building2 },
  { id: "empresarial", label: "Direito Empresarial", icon: Briefcase },
  { id: "consumidor", label: "Direito do Consumidor", icon: ShoppingCart },
  { id: "familia", label: "Direito de Família", icon: Heart },
  { id: "previdenciario", label: "Direito Previdenciário", icon: Shield },
  { id: "constitucional", label: "Direito Constitucional", icon: BookOpen },
  { id: "administrativo", label: "Direito Administrativo", icon: Landmark },
  { id: "ambiental", label: "Direito Ambiental", icon: Leaf },
  { id: "eleitoral", label: "Direito Eleitoral", icon: Vote },
  { id: "internacional", label: "Direito Internacional", icon: Globe },
  { id: "processoCivil", label: "Processo Civil", icon: Scale },
  { id: "processoPenal", label: "Processo Penal", icon: Gavel },
  { id: "imobiliario", label: "Direito Imobiliário", icon: Home },
  { id: "digital", label: "Direito Digital", icon: Cpu },
  { id: "bancario", label: "Direito Bancário", icon: Banknote },
];

const TIPOS_DOCUMENTO = {
  civil: [
    { id: "peticao_inicial", label: "Petição Inicial", campos: ["tribunal","autor","reu","valor_causa","fatos","pedidos"] },
    { id: "contestacao", label: "Contestação", campos: ["tribunal","processo","reu","fatos_defesa","argumentos","pedidos"] },
    { id: "contrato", label: "Contrato Civil", campos: ["contratante","contratado","objeto","valor","prazo","condicoes"] },
    { id: "recurso", label: "Recurso/Apelação", campos: ["tribunal","processo","recorrente","recorrido","razoes","pedidos"] },
    { id: "parecer", label: "Parecer Jurídico", campos: ["consulente","materia","fatos","questao_juridica"] },
    { id: "notificacao", label: "Notificação Extrajudicial", campos: ["notificante","notificado","motivo","prazo","exigencia"] },
  ],
  penal: [
    { id: "denuncia", label: "Denúncia", campos: ["juizo","acusado","vitima","fatos","tipificacao","pedidos"] },
    { id: "defesa_preliminar", label: "Defesa Preliminar", campos: ["juizo","processo","acusado","fatos_defesa","argumentos"] },
    { id: "alegacoes_finais", label: "Alegações Finais", campos: ["juizo","processo","acusado","fatos","teses_defesa","pedidos"] },
    { id: "habeas_corpus", label: "Habeas Corpus", campos: ["tribunal","paciente","autoridade_coatora","fundamentos","pedidos"] },
    { id: "recurso_penal", label: "Recurso em Sentido Estrito", campos: ["tribunal","processo","recorrente","decisao_recorrida","razoes"] },
  ],
  trabalhista: [
    { id: "reclamacao_trabalhista", label: "Reclamação Trabalhista", campos: ["vara","reclamante","reclamado","data_admissao","data_demissao","verbas","fatos","pedidos"] },
    { id: "contestacao_trabalhista", label: "Contestação Trabalhista", campos: ["vara","processo","reclamado","fatos_defesa","argumentos","pedidos"] },
    { id: "recurso_ordinario", label: "Recurso Ordinário", campos: ["trt","processo","recorrente","decisao","razoes","pedidos"] },
    { id: "acordo_trabalhista", label: "Acordo Extrajudicial", campos: ["trabalhador","empregador","verbas","valor_acordo","condicoes"] },
  ],
  tributario: [
    { id: "impugnacao_auto", label: "Impugnação de Auto de Infração", campos: ["contribuinte","auto_infracao","fatos","fundamentos_juridicos","pedidos"] },
    { id: "mandado_seguranca_tributario", label: "Mandado de Segurança Tributário", campos: ["tribunal","impetrante","autoridade","direito_liquido","pedidos"] },
    { id: "consulta_tributaria", label: "Consulta Tributária", campos: ["consulente","tributo","fatos","duvida_juridica"] },
    { id: "recurso_administrativo", label: "Recurso Administrativo Fiscal", campos: ["orgao","contribuinte","processo","decisao","razoes","pedidos"] },
  ],
  empresarial: [
    { id: "contrato_social", label: "Contrato Social", campos: ["socios","razao_social","objeto_social","capital_social","sede","administracao"] },
    { id: "contrato_prestacao", label: "Contrato de Prestação de Serviços", campos: ["contratante","contratado","objeto","valor","prazo","obrigacoes"] },
    { id: "NDA", label: "Acordo de Confidencialidade (NDA)", campos: ["parte_a","parte_b","objeto","prazo","penalidades"] },
    { id: "distrato", label: "Distrato Societário", campos: ["socios","empresa","motivo","liquidacao","partilha"] },
  ],
  consumidor: [
    { id: "peticao_consumidor", label: "Petição Inicial (CDC)", campos: ["juizado","consumidor","fornecedor","produto_servico","fatos","dano","pedidos"] },
    { id: "notificacao_consumidor", label: "Notificação ao Fornecedor", campos: ["consumidor","fornecedor","produto","problema","exigencia","prazo"] },
    { id: "recurso_jec", label: "Recurso (JEC)", campos: ["turma_recursal","processo","recorrente","decisao","razoes","pedidos"] },
  ],
  familia: [
    { id: "divorcio", label: "Petição de Divórcio", campos: ["vara","requerente","requerido","data_casamento","bens","filhos","pedidos"] },
    { id: "guarda", label: "Ação de Guarda", campos: ["vara","requerente","requerido","crianca","situacao_atual","fatos","pedidos"] },
    { id: "alimentos", label: "Ação de Alimentos", campos: ["vara","alimentando","alimentante","necessidade","capacidade","pedidos"] },
    { id: "inventario", label: "Petição de Inventário", campos: ["juizo","falecido","data_obito","herdeiros","bens","pedidos"] },
  ],
  previdenciario: [
    { id: "aposentadoria", label: "Ação de Aposentadoria", campos: ["juizo","autor","reu_inss","tempo_contribuicao","fatos","pedidos"] },
    { id: "beneficio_negado", label: "Ação de Concessão de Benefício", campos: ["juizo","autor","beneficio_pleiteado","motivo_negativa","fatos","pedidos"] },
    { id: "revisao_beneficio", label: "Ação de Revisão de Benefício", campos: ["juizo","autor","beneficio","calculo_correto","diferenca","pedidos"] },
  ],
  constitucional: [
    { id: "mandado_seguranca", label: "Mandado de Segurança", campos: ["tribunal","impetrante","autoridade_coatora","ato_impugnado","direito_liquido","pedidos"] },
    { id: "acao_popular", label: "Ação Popular", campos: ["juizo","autor_popular","reu","ato_lesivo","fundamentos","pedidos"] },
    { id: "acao_civil_publica", label: "Ação Civil Pública", campos: ["juizo","legitimado_ativo","reu","dano_coletivo","fundamentos","pedidos"] },
  ],
  administrativo: [
    { id: "mandado_seguranca_adm", label: "MS Administrativo", campos: ["tribunal","impetrante","autoridade","ato_impugnado","fundamentos","pedidos"] },
    { id: "recurso_administrativo_adm", label: "Recurso Administrativo", campos: ["orgao","recorrente","processo","decisao","razoes","pedidos"] },
    { id: "impugnacao_edital", label: "Impugnação de Edital (Licitação)", campos: ["orgao","impugnante","edital","clausulas_ilegais","fundamentos","pedidos"] },
  ],
  ambiental: [
    { id: "acp_ambiental", label: "Ação Civil Pública Ambiental", campos: ["juizo","legitimado","reu","dano_ambiental","fundamentos","pedidos"] },
    { id: "defesa_auto_ambiental", label: "Defesa de Auto de Infração Ambiental", campos: ["orgao","autuado","auto","fatos","fundamentos","pedidos"] },
  ],
  eleitoral: [
    { id: "representacao_eleitoral", label: "Representação Eleitoral", campos: ["tse_tre","representante","representado","conduta","fundamentos","pedidos"] },
    { id: "recurso_eleitoral", label: "Recurso Eleitoral", campos: ["tribunal","processo","recorrente","decisao","razoes","pedidos"] },
  ],
  internacional: [
    { id: "contrato_internacional", label: "Contrato Internacional", campos: ["parte_a_pais","parte_b_pais","objeto","lei_aplicavel","foro","condicoes"] },
    { id: "carta_rogatoria", label: "Carta Rogatória", campos: ["juizo_rogante","juizo_rogado","processo","diligencia","fundamentos"] },
  ],
  processoCivil: [
    { id: "peticao_inicial_cpc", label: "Petição Inicial (CPC/2015)", campos: ["juizo","autor","reu","valor_causa","fatos","fundamentos","pedidos"] },
    { id: "contestacao_cpc", label: "Contestação (CPC/2015)", campos: ["juizo","processo","reu","preliminares","merito","pedidos"] },
    { id: "agravo_instrumento", label: "Agravo de Instrumento", campos: ["tribunal","processo","agravante","agravado","decisao","razoes","pedidos"] },
    { id: "embargos_declaracao", label: "Embargos de Declaração", campos: ["juizo","processo","embargante","decisao","omissao_contradição","pedidos"] },
  ],
  processoPenal: [
    { id: "hc", label: "Habeas Corpus", campos: ["tribunal","paciente","autoridade_coatora","constrangimento","fundamentos","pedidos"] },
    { id: "rese", label: "Recurso em Sentido Estrito", campos: ["tribunal","processo","recorrente","decisao_impugnada","razoes","pedidos"] },
    { id: "apelacao_penal", label: "Apelação Criminal", campos: ["tribunal","processo","apelante","decisao","razoes","pedidos"] },
  ],
  imobiliario: [
    { id: "acao_despejo", label: "Ação de Despejo", campos: ["juizo","locador","locatario","imovel","motivo","fatos","pedidos"] },
    { id: "acao_posse", label: "Ação Possessória", campos: ["juizo","autor","reu","imovel","tipo_turbacao","fatos","pedidos"] },
    { id: "usucapiao", label: "Ação de Usucapião", campos: ["juizo","autor","imovel","tempo_posse","caracteristicas_posse","pedidos"] },
  ],
  digital: [
    { id: "peticao_digital", label: "Petição LGPD/Marco Civil", campos: ["juizo","autor","reu","violacao","dados_afetados","fatos","pedidos"] },
    { id: "notificacao_lgpd", label: "Notificação LGPD", campos: ["controlador","titular","dado_violado","exigencia","prazo"] },
  ],
  bancario: [
    { id: "acao_bancaria", label: "Ação contra Instituição Financeira", campos: ["juizo","autor","banco","produto_financeiro","abusividade","fatos","pedidos"] },
    { id: "revisional", label: "Ação Revisional de Contrato Bancário", campos: ["juizo","autor","banco","contrato","clausulas_abusivas","pedidos"] },
  ],
};

const CAMPOS_TEXTAREA = new Set([
  "fatos","pedidos","fundamentos","fatos_defesa","argumentos","teses_defesa","razoes",
  "condicoes","questao_juridica","merito","preliminares","duvida_juridica","direito_liquido",
  "ato_lesivo","dano_coletivo","clausulas_ilegais","clausulas_abusivas","abusividade",
  "constrangimento","omissao_contradição","caracteristicas_posse","dados_afetados","obrigacoes",
  "penalidades","socios","herdeiros","filhos","verbas","objeto_social","necessidade","capacidade",
  "tipificacao","dano","problema","fundamentos_juridicos","dano_ambiental","conduta",
]);

const CAMPO_LABELS = {
  tribunal:"Tribunal/Vara", juizo:"Juízo Competente", vara:"Vara do Trabalho", trt:"Tribunal Regional do Trabalho",
  autor:"Nome do Autor", reu:"Nome do Réu", reclamante:"Nome do Reclamante", reclamado:"Nome do Reclamado",
  paciente:"Nome do Paciente", impetrante:"Nome do Impetrante", valor_causa:"Valor da Causa",
  fatos:"Narração dos Fatos", pedidos:"Pedidos", objeto:"Objeto do Contrato/Ação",
  contratante:"Contratante", contratado:"Contratado", valor:"Valor", prazo:"Prazo",
  condicoes:"Condições Gerais", processo:"Número do Processo", autoridade_coatora:"Autoridade Coatora",
  ato_impugnado:"Ato Impugnado", direito_liquido:"Direito Líquido e Certo Violado",
  acusado:"Nome do Acusado", vitima:"Nome da Vítima", tipificacao:"Tipificação Penal",
  razoes:"Razões Recursais", recorrente:"Recorrente", recorrido:"Recorrido", decisao:"Decisão Recorrida",
  data_admissao:"Data de Admissão", data_demissao:"Data de Demissão/Dispensa", verbas:"Verbas Trabalhistas Devidas",
  fundamentos:"Fundamentos Jurídicos", fundamentos_juridicos:"Fundamentos Jurídicos",
  argumentos:"Argumentos de Defesa", teses_defesa:"Teses de Defesa", fatos_defesa:"Fatos Narrados pela Defesa",
  preliminares:"Preliminares (se houver)", merito:"Mérito — Argumentos", consulente:"Consulente",
  materia:"Matéria a ser Analisada", questao_juridica:"Questão Jurídica", notificante:"Notificante",
  notificado:"Notificado", motivo:"Motivo da Notificação", exigencia:"Exigência",
  auto_infracao:"Número do Auto de Infração", tributo:"Tributo em Questão", orgao:"Órgão/Repartição",
  socios:"Sócios (nome, CPF, quota %)", razao_social:"Razão Social", objeto_social:"Objeto Social",
  capital_social:"Capital Social", sede:"Endereço da Sede", administracao:"Forma de Administração",
  parte_a:"Parte A", parte_b:"Parte B", penalidades:"Penalidades por Violação",
  produto_servico:"Produto ou Serviço", produto:"Produto", problema:"Problema/Vício", dano:"Dano Sofrido",
  requerente:"Requerente", requerido:"Requerido", data_casamento:"Data do Casamento",
  bens:"Bens a Partilhar", filhos:"Filhos (nomes e idades)", crianca:"Nome da Criança",
  situacao_atual:"Situação Atual da Guarda", alimentando:"Alimentando", alimentante:"Alimentante",
  necessidade:"Necessidade do Alimentando", capacidade:"Capacidade do Alimentante",
  falecido:"Nome do Falecido", data_obito:"Data do Óbito", herdeiros:"Herdeiros",
  tempo_contribuicao:"Tempo de Contribuição", beneficio_pleiteado:"Benefício Pleiteado",
  motivo_negativa:"Motivo da Negativa do INSS", reu_inss:"Réu (INSS/RGPS)",
  beneficio:"Benefício a Revisar", calculo_correto:"Cálculo Correto Pretendido", diferenca:"Diferença a Receber",
  ato_lesivo:"Ato Lesivo ao Patrimônio Público", dano_coletivo:"Dano ao Interesse Coletivo",
  clausulas_ilegais:"Cláusulas/Itens Ilegais do Edital", edital:"Número do Edital", impugnante:"Impugnante",
  dano_ambiental:"Descrição do Dano Ambiental", auto:"Número do Auto de Infração",
  tse_tre:"TSE/TRE Competente", representante:"Representante", representado:"Representado",
  conduta:"Conduta Ilícita Eleitoral", parte_a_pais:"Parte A (nome e país)", parte_b_pais:"Parte B (nome e país)",
  lei_aplicavel:"Lei Aplicável", foro:"Foro de Eleição", juizo_rogante:"Juízo Rogante",
  juizo_rogado:"Juízo Rogado", diligencia:"Diligência Solicitada", agravante:"Agravante", agravado:"Agravado",
  omissao_contradição:"Omissão/Contradição/Obscuridade", embargante:"Embargante",
  constrangimento:"Constrangimento Ilegal", apelante:"Apelante", locador:"Locador", locatario:"Locatário",
  imovel:"Identificação do Imóvel", tipo_turbacao:"Tipo de Turbação/Esbulho", tempo_posse:"Tempo de Posse",
  caracteristicas_posse:"Características da Posse", violacao:"Violação (LGPD/Marco Civil)",
  dados_afetados:"Dados Pessoais Afetados", banco:"Instituição Financeira", produto_financeiro:"Produto Financeiro",
  abusividade:"Abusividade Identificada", contrato:"Número/Tipo do Contrato",
  clausulas_abusivas:"Cláusulas Abusivas", legitimado:"Legitimado Ativo", legitimado_ativo:"Legitimado Ativo",
  autor_popular:"Autor Popular (Cidadão)", trabalhador:"Trabalhador", empregador:"Empregador",
  valor_acordo:"Valor Total do Acordo", obrigacoes:"Obrigações das Partes", turma_recursal:"Turma Recursal",
  juizado:"Juizado Especial", consumidor:"Nome do Consumidor", fornecedor:"Nome do Fornecedor",
  autuado:"Autuado", dado_violado:"Dado Pessoal Violado", controlador:"Controlador (empresa)",
  titular:"Titular dos Dados", autoridade:"Autoridade Coatora", contribuinte:"Contribuinte",
  decisao_recorrida:"Decisão Recorrida", decisao_impugnada:"Decisão Impugnada",
  empresa:"Nome da Empresa", motivo:"Motivo", liquidacao:"Forma de Liquidação", partilha:"Partilha de Bens",
};

// Campos opcionais (não bloqueiam o botão Gerar)
const CAMPOS_OPCIONAIS = new Set(["preliminares"]);

// ─── PROMPT ENGINE ─────────────────────────────────────────────────────────────

function buildPrompt(areaLabel, tipoLabel, dadosDoFormulario) {
  const dadosFormatados = Object.entries(dadosDoFormulario)
    .filter(([, v]) => v && v.trim())
    .map(([k, v]) => `• ${CAMPO_LABELS[k] || k}: ${v}`)
    .join("\n");

  return `Você é um advogado brasileiro sênior com 20 anos de experiência em ${areaLabel}, redator técnico-jurídico de alto nível. Sua missão é redigir uma ${tipoLabel} completa, tecnicamente impecável e pronta para uso em juízo ou em negociação.

═══════════════════════════════════════════════════
DADOS FORNECIDOS PELO USUÁRIO:
${dadosFormatados}
═══════════════════════════════════════════════════

INSTRUÇÕES OBRIGATÓRIAS DE QUALIDADE:

1. ESTRUTURA FORMAL COMPLETA
   - Cabeçalho com endereçamento correto ao juízo/autoridade
   - Qualificação completa das partes (preencha com dados fornecidos)
   - Corpo do documento com seções numeradas e bem delineadas
   - Pedidos ou disposições finais organizados em alíneas
   - Fechamento com local, data e espaço para assinatura do advogado
   - Ao final: "Termos em que pede deferimento." (para peças processuais)

2. FUNDAMENTAÇÃO JURÍDICA PROFUNDA
   - Cite artigos de lei específicos e atualizados (Código Civil, CPC/2015, CLT, CDC, CP, CPP, CF/88 etc., conforme a área)
   - Mencione súmulas do STJ, STF e tribunais superiores aplicáveis
   - Cite doutrina de referência quando enriquecer o argumento
   - Use jurisprudência consolidada para reforçar os pedidos

3. LINGUAGEM TÉCNICO-JURÍDICA BRASILEIRA
   - Redação formal, objetiva e fluente
   - Use termos técnicos corretos da área jurídica
   - Parágrafo introdutório que situa o leitor no contexto da ação
   - Transição lógica entre seções

4. DOS FATOS (para peças processuais)
   - Narre os fatos em ordem cronológica e lógica
   - Destaque os elementos que configuram o direito pleiteado
   - Conecte os fatos à fundamentação jurídica

5. DO DIREITO / FUNDAMENTAÇÃO (para peças processuais)
   - Desenvolva os argumentos jurídicos com profundidade
   - Estruture teses em ordem de prioridade (principal → subsidiária)
   - Para contestações: enfrente cada pedido do autor separadamente

6. DOS PEDIDOS (para peças processuais)
   - Liste todos os pedidos em alíneas (a, b, c...)
   - Inclua pedido de tutela provisória/antecipada se cabível
   - Inclua condenação em custas e honorários advocatícios
   - Requer-se produção de provas (testemunhal, documental, pericial)

7. PARA CONTRATOS E DOCUMENTOS EXTRAJUDICIAIS
   - Cláusulas numeradas e completas
   - Disposições sobre rescisão, multa e foro de eleição
   - Espaço para testemunhas (2 testemunhas)

8. COMPLETUDE: Entregue o documento COMPLETO, sem resumir, sem usar "[...]" ou "continua". O documento deve estar 100% pronto para uso.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AGORA REDIJA A ${tipoLabel.toUpperCase()} COMPLETA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}

// ─── STEPPER ──────────────────────────────────────────────────────────────────

function Stepper({ step }) {
  const steps = ["Área Jurídica", "Tipo de Documento", "Preencher Dados", "Documento Gerado"];
  return (
    <div className="flex items-center justify-center gap-0 mb-8 flex-wrap gap-y-2">
      {steps.map((label, i) => {
        const idx = i + 1;
        const done = step > idx;
        const active = step === idx;
        return (
          <React.Fragment key={idx}>
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                ${done ? "bg-indigo-600 text-white" : active ? "bg-indigo-600 text-white ring-4 ring-indigo-200" : "bg-gray-200 text-gray-500"}`}>
                {done ? <Check className="w-4 h-4" /> : idx}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${active ? "text-indigo-600" : done ? "text-indigo-400" : "text-gray-400"}`}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 w-8 sm:w-12 mx-1 mb-4 transition-all ${step > idx ? "bg-indigo-500" : "bg-gray-200"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── PÁGINA PRINCIPAL ─────────────────────────────────────────────────────────

export default function DocumentGenerator() {
  const [step, setStep] = useState(1);
  const [areaSelecionada, setAreaSelecionada] = useState(null);
  const [tipoSelecionado, setTipoSelecionado] = useState(null);
  const [campos, setCampos] = useState({});
  const [documentoGerado, setDocumentoGerado] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const areaLabel = areaSelecionada ? AREAS_JURIDICAS.find(a => a.id === areaSelecionada)?.label : "";
  const tipoLabel = tipoSelecionado?.label || "";

  function selecionarArea(id) {
    setAreaSelecionada(id);
    setTipoSelecionado(null);
    setCampos({});
    setStep(2);
  }

  function selecionarTipo(tipo) {
    setTipoSelecionado(tipo);
    setCampos({});
    setStep(3);
  }

  function handleCampo(campo, valor) {
    setCampos(prev => ({ ...prev, [campo]: valor }));
  }

  const camposObrigatorios = tipoSelecionado?.campos.filter(c => !CAMPOS_OPCIONAIS.has(c)) || [];
  const formularioValido = camposObrigatorios.every(c => campos[c] && campos[c].trim());

  async function gerarDocumento() {
    setLoading(true);
    setDocumentoGerado("");
    const prompt = buildPrompt(areaLabel, tipoLabel, campos);
    const resultado = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: false,
      model: "claude_sonnet_4_6",
    });
    setDocumentoGerado(resultado);
    setLoading(false);
    setStep(4);
  }

  function copiarDocumento() {
    navigator.clipboard.writeText(documentoGerado);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  function baixarDocumento() {
    const blob = new Blob([documentoGerado], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tipoLabel.replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function novoDocumento() {
    setStep(1);
    setAreaSelecionada(null);
    setTipoSelecionado(null);
    setCampos({});
    setDocumentoGerado("");
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-2">
            <div style={{ width: 8, height: 8, background: "var(--primary)" }} />
            <span style={{ fontFamily: "'Oswald',sans-serif", fontSize: ".7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--text-muted)" }}>Gerador de Peças</span>
          </div>
          <h1 style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: "1.8rem", textTransform: "uppercase", letterSpacing: "-0.01em", color: "var(--text)" }}>
            Máquina de Peças Jurídicas
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: ".9rem", marginTop: ".5rem" }}>
            Redação profissional com fundamentação jurídica completa — nível advogado sênior
          </p>
        </div>

        <Stepper step={step} />

        {/* ── STEP 1: ÁREAS ── */}
        {step === 1 && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="section-header">
              <h2 className="section-title">Selecione a Área Jurídica</h2>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-px" style={{ borderTop: "1px solid var(--border)" }}>
              {AREAS_JURIDICAS.map(area => {
                const Icon = area.icon;
                return (
                  <button
                    key={area.id}
                    onClick={() => selecionarArea(area.id)}
                    className="flex flex-col items-center gap-2 p-4 transition-all hover:bg-indigo-50 group"
                    style={{ border: "none", background: "var(--surface)", borderRight: "1px solid var(--border)", borderBottom: "1px solid var(--border)", cursor: "pointer" }}
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center transition-all group-hover:bg-indigo-100" style={{ background: "var(--surface-2)" }}>
                      <Icon className="w-5 h-5 group-hover:text-indigo-600 transition-colors" style={{ color: "var(--text-muted)" }} />
                    </div>
                    <span style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 600, fontSize: ".65rem", textTransform: "uppercase", letterSpacing: ".06em", color: "var(--text-muted)", textAlign: "center", lineHeight: 1.3 }} className="group-hover:text-indigo-600 transition-colors">
                      {area.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STEP 2: TIPOS ── */}
        {step === 2 && areaSelecionada && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="section-header">
              <h2 className="section-title">Tipo de Documento</h2>
              <span style={{ background: "var(--primary)", color: "#fff", fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: ".65rem", textTransform: "uppercase", letterSpacing: ".08em", padding: "3px 10px" }}>
                {areaLabel}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px" style={{ borderTop: "1px solid var(--border)" }}>
              {(TIPOS_DOCUMENTO[areaSelecionada] || []).map(tipo => (
                <button
                  key={tipo.id}
                  onClick={() => selecionarTipo(tipo)}
                  className="flex items-center gap-4 p-5 text-left transition-all hover:bg-indigo-50 group"
                  style={{ border: "none", background: "var(--surface)", borderRight: "1px solid var(--border)", borderBottom: "1px solid var(--border)", cursor: "pointer" }}
                >
                  <div className="w-10 h-10 flex items-center justify-center flex-shrink-0" style={{ background: "var(--primary-light)" }}>
                    <FileText className="w-5 h-5" style={{ color: "var(--primary)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 600, fontSize: ".85rem", textTransform: "uppercase", letterSpacing: ".04em", color: "var(--text)" }} className="group-hover:text-indigo-600 transition-colors">
                      {tipo.label}
                    </p>
                    <p style={{ fontSize: ".72rem", color: "var(--text-muted)", marginTop: "2px" }}>{tipo.campos.length} campos</p>
                  </div>
                  <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                </button>
              ))}
            </div>
            <div className="p-4" style={{ borderTop: "1px solid var(--border)" }}>
              <button onClick={() => setStep(1)} className="btn-ghost" style={{ fontSize: ".75rem" }}>
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: FORMULÁRIO ── */}
        {step === 3 && tipoSelecionado && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="section-header">
              <h2 className="section-title">{tipoLabel}</h2>
              <span style={{ background: "var(--primary)", color: "#fff", fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: ".65rem", textTransform: "uppercase", letterSpacing: ".08em", padding: "3px 10px" }}>
                {areaLabel}
              </span>
            </div>
            <div className="p-6 space-y-5">
              {tipoSelecionado.campos.map(campo => {
                const label = CAMPO_LABELS[campo] || campo;
                const isTextarea = CAMPOS_TEXTAREA.has(campo);
                const isOpcional = CAMPOS_OPCIONAIS.has(campo);
                return (
                  <div key={campo}>
                    <label style={{ display: "block", fontFamily: "'Oswald',sans-serif", fontWeight: 600, fontSize: ".72rem", textTransform: "uppercase", letterSpacing: ".08em", color: "var(--text-muted)", marginBottom: "6px" }}>
                      {label}
                      {isOpcional && <span style={{ fontWeight: 400, marginLeft: 6, textTransform: "none", letterSpacing: 0, fontSize: ".7rem" }}>(opcional)</span>}
                    </label>
                    {isTextarea ? (
                      <Textarea
                        placeholder={`Descreva ${label.toLowerCase()}...`}
                        value={campos[campo] || ""}
                        onChange={e => handleCampo(campo, e.target.value)}
                        className="w-full resize-y"
                        style={{ minHeight: 100, borderRadius: 0 }}
                      />
                    ) : (
                      <Input
                        placeholder={label}
                        value={campos[campo] || ""}
                        onChange={e => handleCampo(campo, e.target.value)}
                        className="w-full"
                        style={{ borderRadius: 0 }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="p-4 flex items-center justify-between gap-4" style={{ borderTop: "1px solid var(--border)" }}>
              <button onClick={() => setStep(2)} className="btn-ghost" style={{ fontSize: ".75rem" }}>
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>
              <button
                onClick={gerarDocumento}
                disabled={!formularioValido || loading}
                className="btn-primary"
                style={{ opacity: (!formularioValido || loading) ? 0.5 : 1 }}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scale className="w-4 h-4" />}
                {loading ? "Gerando..." : "Gerar com IA"}
              </button>
            </div>
          </div>
        )}

        {/* ── LOADING ── */}
        {loading && (
          <div className="mt-6 p-8 flex flex-col items-center gap-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <Loader2 className="w-10 h-10 animate-spin" style={{ color: "var(--primary)" }} />
            <div className="text-center">
              <p style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: ".9rem", textTransform: "uppercase", letterSpacing: ".08em", color: "var(--text)" }}>
                Redigindo sua peça...
              </p>
              <p style={{ fontSize: ".8rem", color: "var(--text-muted)", marginTop: 4 }}>
                A IA está redigindo com fundamentação jurídica completa
              </p>
            </div>
          </div>
        )}

        {/* ── STEP 4: RESULTADO ── */}
        {step === 4 && documentoGerado && !loading && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="section-header">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                <h2 className="section-title">{tipoLabel} — Gerado</h2>
              </div>
              <span style={{ background: "var(--primary)", color: "#fff", fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: ".65rem", textTransform: "uppercase", letterSpacing: ".08em", padding: "3px 10px" }}>
                {areaLabel}
              </span>
            </div>

            {/* Botões de ação */}
            <div className="flex flex-wrap gap-2 p-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <button onClick={copiarDocumento} className="btn-primary" style={{ fontSize: ".75rem" }}>
                {copiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiado ? "Copiado!" : "Copiar"}
              </button>
              <button onClick={baixarDocumento} className="btn-ghost" style={{ fontSize: ".75rem" }}>
                <Download className="w-4 h-4" /> Baixar (.txt)
              </button>
              <button onClick={novoDocumento} className="btn-ghost" style={{ fontSize: ".75rem" }}>
                <FileText className="w-4 h-4" /> Novo Documento
              </button>
            </div>

            {/* Documento */}
            <ScrollArea className="h-[600px]">
              <pre className="p-6 text-sm leading-relaxed whitespace-pre-wrap font-mono" style={{ color: "var(--text)", background: "var(--surface)" }}>
                {documentoGerado}
              </pre>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}