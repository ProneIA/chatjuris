import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Shield, AlertTriangle, CheckCircle, XCircle, Info,
  ChevronDown, ChevronRight, ArrowLeft, FileText,
  Lock, Database, Users, Globe, Eye, Settings,
  AlertCircle, Clock, TrendingUp, Zap, Award,
  Building, Scale, Key, Server, RefreshCw, Download
} from "lucide-react";

const SCORE = 58;

const riskColor = (level) => {
  if (level === "CRÍTICO") return "bg-red-100 text-red-700 border-red-300";
  if (level === "ALTO") return "bg-orange-100 text-orange-700 border-orange-300";
  if (level === "MÉDIO") return "bg-yellow-100 text-yellow-700 border-yellow-300";
  if (level === "BAIXO") return "bg-green-100 text-green-700 border-green-300";
  return "bg-gray-100 text-gray-700 border-gray-300";
};

const statusIcon = (status) => {
  if (status === "OK") return <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />;
  if (status === "PARCIAL") return <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />;
  if (status === "FALHA") return <XCircle className="w-4 h-4 text-red-500 shrink-0" />;
  return <Info className="w-4 h-4 text-blue-500 shrink-0" />;
};

const Section = ({ id, icon: Icon, title, color, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 bg-white hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <span className="font-semibold text-gray-900">{title}</span>
        </div>
        {open ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
      </button>
      {open && <div className="p-5 border-t border-gray-100 bg-gray-50/50">{children}</div>}
    </div>
  );
};

const CheckItem = ({ status, label, detail }) => (
  <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 last:border-0">
    {statusIcon(status)}
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-800">{label}</p>
      {detail && <p className="text-xs text-gray-500 mt-0.5">{detail}</p>}
    </div>
    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${riskColor(
      status === "FALHA" ? "CRÍTICO" : status === "PARCIAL" ? "MÉDIO" : "BAIXO"
    )}`}>
      {status}
    </span>
  </div>
);

const RiskItem = ({ level, title, detail, impact }) => (
  <div className={`p-4 rounded-lg border mb-3 ${riskColor(level)}`}>
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1">
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-xs mt-1 opacity-80">{detail}</p>
        {impact && <p className="text-xs mt-1 font-medium opacity-90">⚠ Impacto: {impact}</p>}
      </div>
      <span className="text-xs font-bold border px-2 py-0.5 rounded whitespace-nowrap">{level}</span>
    </div>
  </div>
);

const ActionItem = ({ priority, title, detail, deadline }) => {
  const c = priority === 1 ? "border-l-red-500 bg-red-50" :
            priority === 2 ? "border-l-orange-500 bg-orange-50" :
            "border-l-blue-500 bg-blue-50";
  return (
    <div className={`border-l-4 p-4 rounded-r-lg mb-3 ${c}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-xs font-bold uppercase tracking-wide opacity-60">Prioridade {priority}</span>
          <p className="font-semibold text-sm text-gray-900 mt-0.5">{title}</p>
          <p className="text-xs text-gray-600 mt-1">{detail}</p>
        </div>
        {deadline && (
          <span className="text-xs bg-white border border-gray-200 px-2 py-1 rounded whitespace-nowrap text-gray-600 flex items-center gap-1">
            <Clock className="w-3 h-3" />{deadline}
          </span>
        )}
      </div>
    </div>
  );
};

export default function LGPDAudit({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const scoreColor = SCORE >= 70 ? "text-green-600" : SCORE >= 50 ? "text-yellow-600" : "text-red-600";
  const scoreLabel = SCORE >= 70 ? "Intermediário-Avançado" : SCORE >= 50 ? "Intermediário" : "Inicial-Intermediário";
  const scoreGradient = SCORE >= 70 ? "from-green-500 to-emerald-400" : SCORE >= 50 ? "from-yellow-500 to-orange-400" : "from-red-500 to-orange-500";

  return (
    <div className={`min-h-screen ${isDark ? 'bg-neutral-950' : 'bg-slate-50'}`}>
      <div className="max-w-5xl mx-auto p-6 md:p-8 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link to={createPageUrl("Dashboard")} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" /> Dashboard
              </Link>
            </div>
            <h1 className={`text-2xl md:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Auditoria LGPD — Juris SaaS Jurídico
            </h1>
            <p className={`mt-1 text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
              Lei nº 13.709/2018 · Relatório gerado em {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })} · Plataforma SaaS Multi-tenant Jurídico
            </p>
          </div>
          <div className="shrink-0 hidden md:flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
            <Shield className="w-5 h-5 text-amber-600" />
            <span className="text-sm font-semibold text-amber-700">Auditoria Interna</span>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="grid md:grid-cols-4 gap-4">
          <div className="md:col-span-1 bg-white border border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-center">
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Score LGPD</p>
            <div className={`text-6xl font-bold ${scoreColor}`}>{SCORE}</div>
            <div className="text-xs text-gray-400 mt-1">/ 100</div>
            <div className="w-full mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full bg-gradient-to-r ${scoreGradient}`} style={{ width: `${SCORE}%` }} />
            </div>
            <p className={`text-xs font-semibold mt-2 ${scoreColor}`}>{scoreLabel}</p>
          </div>
          <div className="md:col-span-3 bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" /> Sumário Executivo
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed mb-3">
              O <strong>Juris</strong> é uma plataforma SaaS jurídica multi-tenant que trata categorias diversas de dados pessoais — incluindo <strong>dados potencialmente sensíveis</strong> de clientes e partes processuais — com relevante risco de violação ao sigilo profissional da advocacia (Estatuto da OAB, Lei 8.906/94).
            </p>
            <p className="text-sm text-gray-700 leading-relaxed mb-3">
              A auditoria identificou <strong>avanços significativos</strong>: política de privacidade publicada, termos de uso presentes, modal de consentimento LGPD implementado, trilha de auditoria (AuditLog) funcional, sistema de exclusão de dados do titular (Art. 18º, VI) e portabilidade (Art. 18º, V) operacionais.
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">
              Por outro lado, foram detectadas <strong>vulnerabilidades críticas</strong>: CPF/CNPJ criptografado apenas com Base64 (sem criptografia real), ausência de MFA/2FA, ROPA não formalizado, ausência de Plano de Resposta a Incidentes documentado, transmissão de dados não anonimizados à OpenAI sem DPA explícito, e ausência de controle de enumeração de IDs (risco de scraping entre tenants).
            </p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { label: "Itens Conformes", value: "22", color: "text-green-600 bg-green-50" },
                { label: "Parcialmente Conformes", value: "15", color: "text-yellow-600 bg-yellow-50" },
                { label: "Não Conformes", value: "11", color: "text-red-600 bg-red-50" },
              ].map((s, i) => (
                <div key={i} className={`rounded-lg p-3 text-center ${s.color}`}>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs font-medium mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 1. Mapeamento de Dados */}
        <Section id="mapeamento" icon={Database} title="1. Mapeamento de Dados (Data Map)" color="bg-blue-100 text-blue-600" defaultOpen={true}>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2 text-sm uppercase tracking-wide">Pontos de Coleta Identificados</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left p-2 border border-gray-200 font-semibold">Origem / Ponto de Coleta</th>
                      <th className="text-left p-2 border border-gray-200 font-semibold">Dado Coletado</th>
                      <th className="text-left p-2 border border-gray-200 font-semibold">Classificação</th>
                      <th className="text-left p-2 border border-gray-200 font-semibold">Armazenamento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Cadastro / Login (OAuth)", "Nome, e-mail, foto de perfil", "Pessoal — Identificação", "Base44 DB / Auth"],
                      ["Cadastro de Cliente (Client entity)", "Nome, CPF/CNPJ, e-mail, telefone, endereço", "Pessoal + Financeiro", "Base44 DB"],
                      ["Processo Judicial (Case entity)", "Nº processo, partes, tribunal, valor, estratégia", "Processual + Sigiloso", "Base44 DB"],
                      ["Documentos (LegalDocument)", "Petições, contratos, pareceres, arquivos PDF/DOCX", "Processual + Sensível", "Base44 Storage + DB"],
                      ["Conversas com IA (Conversation)", "Prompts, histórico, estratégias jurídicas", "Sigiloso / Estratégico", "Base44 DB + OpenAI API"],
                      ["Honorários / Despesas (ClientPayment, Despesa)", "Valores, datas, formas de pagamento", "Financeiro", "Base44 DB"],
                      ["Calendário / Eventos (CalendarEvent)", "Datas, locais, participantes, processo relacionado", "Pessoal + Processual", "Base44 DB"],
                      ["Portal do Cliente (ClientPortalAccess)", "Token de acesso, histórico de visualização", "Pessoal + Acesso", "Base44 DB"],
                      ["Afiliados (Affiliate)", "Nome, CPF/dados bancários para comissão", "Pessoal + Financeiro", "Base44 DB"],
                      ["Logs de Auditoria (AuditLog)", "E-mail, IP, ação, timestamp", "Pessoal + Comportamental", "Base44 DB"],
                      ["Pagamentos (HotmartTransaction, MP)", "Dados de pagamento, plano, valor", "Financeiro", "Hotmart / MercadoPago / Cakto"],
                      ["Pesquisa Jurídica (LegalResearch)", "Termos de busca, jurisprudências salvas", "Processual / Comportamental", "Base44 DB"],
                      ["Monitoramento de Diário (DiaryMonitoring)", "Nomes de partes, nº de processos para monitorar", "Processual", "Base44 DB + API Externa"],
                      ["WhatsApp Bot (WhatsAppAgentConfig)", "Configuração do agente, mensagens de clientes", "Pessoal + Sigiloso", "Base44 DB + Agente IA"],
                    ].map(([origem, dado, classif, armazen], i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="p-2 border border-gray-200">{origem}</td>
                        <td className="p-2 border border-gray-200">{dado}</td>
                        <td className="p-2 border border-gray-200">
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                            classif.includes("Sensível") || classif.includes("Sigiloso") ? "bg-red-100 text-red-700" :
                            classif.includes("Processual") ? "bg-purple-100 text-purple-700" :
                            classif.includes("Financeiro") ? "bg-orange-100 text-orange-700" :
                            "bg-blue-100 text-blue-700"
                          }`}>{classif}</span>
                        </td>
                        <td className="p-2 border border-gray-200 text-gray-600">{armazen}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2 text-sm uppercase tracking-wide">Fluxo de Dados (Data Flow)</h3>
              <div className="bg-white border border-gray-200 rounded-lg p-4 text-xs text-gray-700 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">Advogado (Usuário)</span>
                  <span>→ insere dados →</span>
                  <span className="bg-gray-100 px-2 py-1 rounded">Base44 Frontend (React)</span>
                  <span>→ API calls →</span>
                  <span className="bg-gray-100 px-2 py-1 rounded">Base44 Backend (DB + Functions)</span>
                  <span>→ processamento →</span>
                  <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded font-medium">OpenAI API (EUA) 🌍</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">Advogado (Usuário)</span>
                  <span>→ pagamento →</span>
                  <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded font-medium">Hotmart / MercadoPago / Cakto</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded font-medium">Cliente Final (Parte)</span>
                  <span>→ seus dados inseridos pelo advogado →</span>
                  <span className="bg-gray-100 px-2 py-1 rounded">Base44 DB (sem ciência direta)</span>
                  <span className="text-red-600 font-semibold">⚠ Sem consentimento próprio</span>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2 text-sm uppercase tracking-wide">Categorias de Dados Tratados</h3>
                <div className="space-y-1">
                  {[
                    ["Dados pessoais de identificação", "PESSOAL", true],
                    ["Dados de saúde/biométricos", "SENSÍVEL (art. 11)", false],
                    ["Dados de crianças/adolescentes", "ESPECIAL ATENÇÃO", null],
                    ["CPF/CNPJ de partes processuais", "PESSOAL + FINANCEIRO", true],
                    ["Dados processuais e estratégias", "SIGILOSO (OAB)", true],
                    ["Histórico financeiro/honorários", "FINANCEIRO", true],
                    ["Dados de acesso e comportamento", "COMPORTAMENTAL", true],
                    ["Dados de afiliados (comissões)", "FINANCEIRO", true],
                  ].map(([label, tag, present], i) => (
                    <div key={i} className="flex items-center gap-2 text-xs py-1.5 border-b border-gray-100">
                      {present === true ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> :
                       present === false ? <AlertTriangle className="w-3.5 h-3.5 text-gray-300" title="Potencialmente presente" /> :
                       <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />}
                      <span className="flex-1 text-gray-700">{label}</span>
                      <span className={`px-1.5 py-0.5 rounded font-medium ${
                        tag.includes("SENSÍVEL") ? "bg-red-100 text-red-700" :
                        tag.includes("SIGILOSO") ? "bg-purple-100 text-purple-700" :
                        tag.includes("ESPECIAL") ? "bg-orange-100 text-orange-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>{tag}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2 text-sm uppercase tracking-wide">Locais de Armazenamento</h3>
                <div className="space-y-2">
                  {[
                    { local: "Base44 Database", tipo: "Principal", nivel: "OK", detalhe: "Multi-tenant, RLS configurado por usuário" },
                    { local: "Base44 Storage (arquivos)", tipo: "Documentos", nivel: "PARCIAL", detalhe: "Upload de PDFs/docs — política de acesso a verificar" },
                    { local: "OpenAI API (EUA)", tipo: "Processamento IA", nivel: "FALHA", detalhe: "Transferência internacional sem DPA explícito na PP" },
                    { local: "Hotmart / MercadoPago / Cakto", tipo: "Pagamentos", nivel: "PARCIAL", detalhe: "Terceiros com seus próprios termos — DPA não mencionado" },
                    { local: "Logs de Auditoria (AuditLog)", tipo: "Auditoria", nivel: "OK", detalhe: "Registro funcional de ações dos usuários" },
                    { local: "LocalStorage (browser)", tipo: "Cache local", nivel: "PARCIAL", detalhe: "Tema, consentimento, flags — sem dados pessoais sensíveis" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 border border-gray-200 rounded bg-white text-xs">
                      {statusIcon(item.nivel)}
                      <div className="flex-1">
                        <span className="font-semibold text-gray-800">{item.local}</span>
                        <span className="ml-1 text-gray-400">({item.tipo})</span>
                        <p className="text-gray-500 mt-0.5">{item.detalhe}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* 2. Bases Legais */}
        <Section id="bases" icon={Scale} title="2. Bases Legais (Art. 7º e 11 LGPD)" color="bg-purple-100 text-purple-600">
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
              <strong>⚠ Atenção:</strong> A plataforma trata dados de <strong>terceiros (partes processuais)</strong> que nunca deram consentimento diretamente ao Juris. A base legal deve ser <strong>execução de contrato</strong> (entre advogado e cliente) ou <strong>legítimo interesse</strong> do advogado, não consentimento do titular.
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left p-2 border border-gray-200">Operação de Tratamento</th>
                    <th className="text-left p-2 border border-gray-200">Base Legal Declarada</th>
                    <th className="text-left p-2 border border-gray-200">Base Legal Adequada</th>
                    <th className="text-left p-2 border border-gray-200">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Cadastro e autenticação do advogado", "Consentimento", "Execução de contrato (Art. 7º, V)", "PARCIAL"],
                    ["Gestão de processos e clientes", "Consentimento", "Execução de contrato + Legítimo Interesse (Art. 7º, V e IX)", "PARCIAL"],
                    ["Dados de partes processuais (3ºs)", "Não mapeado", "Exercício regular de direitos (Art. 7º, VI) + Legítimo Interesse", "FALHA"],
                    ["Envio de dados à OpenAI para IA", "Não declarado", "Legítimo interesse + cláusula contratual + DPA obrigatório", "FALHA"],
                    ["Processamento de pagamentos", "Execução de contrato", "Execução de contrato (Art. 7º, V)", "OK"],
                    ["Logs e trilhas de auditoria", "Não declarado", "Cumprimento de obrigação legal (Art. 7º, II) + Legítimo Interesse", "PARCIAL"],
                    ["Cookies e localStorage", "Consentimento implícito", "Consentimento expresso para não-essenciais (Art. 7º, I)", "PARCIAL"],
                    ["Envio de e-mails/notificações", "Consentimento", "Execução de contrato + Consentimento para marketing", "OK"],
                    ["Monitoramento de Diário Oficial", "Não declarado", "Exercício regular de direitos (Art. 7º, VI)", "FALHA"],
                    ["Programa de Afiliados", "Contrato", "Execução de contrato (Art. 7º, V)", "OK"],
                    ["Dados biométricos/saúde (potencial)", "—", "Consentimento expresso específico (Art. 11, I)", "INFO"],
                  ].map(([op, declarada, adequada, status], i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="p-2 border border-gray-200 font-medium">{op}</td>
                      <td className="p-2 border border-gray-200 text-gray-600">{declarada}</td>
                      <td className="p-2 border border-gray-200 text-gray-600">{adequada}</td>
                      <td className="p-2 border border-gray-200">{statusIcon(status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <strong>💡 Recomendação estratégica:</strong> Incluir nos Termos de Uso cláusula explícita sobre o papel do advogado como <strong>Controlador</strong> dos dados de seus clientes e o Juris como <strong>Operador</strong> (Art. 5º, VI e VII LGPD), formalizando um DPA (Data Processing Agreement) embutido nos termos.
            </div>
          </div>
        </Section>

        {/* 3. Documentação e Governança */}
        <Section id="governanca" icon={FileText} title="3. Documentação e Governança" color="bg-indigo-100 text-indigo-600">
          <div className="space-y-3">
            <CheckItem status="OK" label="Política de Privacidade publicada" detail="Disponível em /PrivacyPolicy — cobre Art. 18º, dados coletados, finalidades e DPO. Necessita revisão técnica." />
            <CheckItem status="OK" label="Termos de Uso publicados" detail="Disponível em /TermsOfService — cobre uso, pagamentos, responsabilidades. Falta cláusula de DPA Controlador/Operador." />
            <CheckItem status="OK" label="Modal de Consentimento LGPD (UserConsent)" detail="Implementado no Layout com registro em banco de dados (termos_de_uso + política_de_privacidade). Funcional." />
            <CheckItem status="OK" label="Encarregado de Dados (DPO) identificado" detail="E-mail dpo@juris.app declarado na PP. Necessita: nomeação formal documentada, publicação no site e notificação à ANPD." />
            <CheckItem status="FALHA" label="ROPA — Registro de Operações de Tratamento" detail="Não identificado nenhum documento formal de mapeamento de operações (exigido pelo art. 37 LGPD). Crie um documento interno." />
            <CheckItem status="FALHA" label="RIPD — Relatório de Impacto à Proteção de Dados" detail="Plataforma trata dados em larga escala com perfil de risco elevado (dados sigilosos, art. 38 LGPD). RIPD é fortemente recomendado." />
            <CheckItem status="FALHA" label="Plano de Resposta a Incidentes (PRI)" detail="Não identificado. A LGPD exige comunicação à ANPD e titulares em até 72h (art. 48). Crie o PRI urgentemente." />
            <CheckItem status="FALHA" label="Política de Segurança da Informação (PSI)" detail="Não identificada documentação interna. Essencial para governance e devido cuidado (due diligence)." />
            <CheckItem status="PARCIAL" label="Política de Retenção de Dados" detail="PP menciona '5 anos para processos jurídicos'. Falta tabela de retenção por categoria e processo de descarte seguro." />
            <CheckItem status="PARCIAL" label="Treinamento de equipe em LGPD" detail="Não verificável pelo código — avaliar internamente. Fundamental para conformidade organizacional." />
            <CheckItem status="FALHA" label="DPA com terceiros (OpenAI, Hotmart, MercadoPago, Cakto)" detail="Não há evidência de contratos de proteção de dados com operadores terceiros que processam dados pessoais dos usuários." />
          </div>
        </Section>

        {/* 4. Segurança da Informação */}
        <Section id="seguranca" icon={Lock} title="4. Segurança da Informação" color="bg-red-100 text-red-600">
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2 text-sm">Controles Técnicos</h3>
                <CheckItem status="PARCIAL" label="Criptografia em trânsito (HTTPS/TLS)" detail="Assumida via Base44/Deno deploy. Verificar certificado e HSTS." />
                <CheckItem status="FALHA" label="Criptografia em repouso — CPF/CNPJ" detail="CRÍTICO: encryptCPF usa apenas Base64 — isso NÃO é criptografia. Usar AES-256-GCM com chave derivada (PBKDF2/HKDF)." />
                <CheckItem status="FALHA" label="MFA / 2FA para usuários" detail="Não implementado. Para plataforma com dados sigilosos de advocacia, MFA é fortemente recomendado." />
                <CheckItem status="OK" label="RBAC — Controle de Acesso por Role" detail="Implementado: roles admin/user. RLS (Row Level Security) nas entidades por created_by/user_id." />
                <CheckItem status="OK" label="Isolamento de dados entre tenants (RLS)" detail="Entidades usam created_by: {{user.email}} — segregação básica implementada. Ver análise multi-tenant." />
                <CheckItem status="OK" label="Trilha de Auditoria (AuditLog)" detail="Entidade AuditLog funcional com user_email, action, entity_type, IP. Bem implementado." />
                <CheckItem status="PARCIAL" label="Rate limiting / proteção contra brute force" detail="Não verificado no código. Depende da infraestrutura Base44. Validar." />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2 text-sm">Gestão e Processos</h3>
                <CheckItem status="FALHA" label="Segregação de ambientes (dev/staging/prod)" detail="Não verificada. Risco de dados de produção usados em testes." />
                <CheckItem status="PARCIAL" label="Política de backup e recuperação" detail="Depende da plataforma Base44. Verificar SLA e RPO/RTO documentados." />
                <CheckItem status="FALHA" label="Gestão de vulnerabilidades / Pentest" detail="Não evidenciado. Recomendado pentest anual e SAST no pipeline de desenvolvimento." />
                <CheckItem status="FALHA" label="Proteção contra enumeração de IDs" detail="IDs de entidades potencialmente sequenciais/UUIDs — risco de scraping entre tenants via força bruta." />
                <CheckItem status="PARCIAL" label="Segredos (Secrets) gerenciados" detail="API keys via Secrets do Base44 (OPENAI, STRIPE, MP etc.) — boa prática. Verificar rotação periódica." />
                <CheckItem status="FALHA" label="Headers de segurança HTTP" detail="CSP, X-Frame-Options, HSTS, Referrer-Policy — não verificáveis pelo código front-end. Validar no servidor." />
                <CheckItem status="PARCIAL" label="Validação e sanitização de inputs" detail="Validações básicas presentes. Avaliar proteção contra XSS/injection em campos de texto livre (documentos, IA)." />
              </div>
            </div>
            <RiskItem level="CRÍTICO" title="CPF/CNPJ protegido apenas com Base64" detail="A função encryptCPF.js usa btoa() — codificação simples, facilmente reversível. Não atende ao art. 46 LGPD (medidas técnicas adequadas). Qualquer acesso ao banco expõe todos os CPFs." impact="Multa ANPD + responsabilidade civil" />
            <RiskItem level="CRÍTICO" title="Ausência de MFA em plataforma com dados sigilosos" detail="Advogados armazenam estratégias processuais, documentos confidenciais e dados de partes. Uma senha comprometida expõe todos os dados do escritório." impact="Violação de sigilo profissional + LGPD art. 46" />
            <RiskItem level="ALTO" title="Risco de enumeração de IDs / Cross-tenant scraping" detail="Se IDs de entidades forem previsíveis, um usuário malicioso pode tentar acessar registros de outros tenants via manipulação de API. RLS mitiga mas não elimina completamente." impact="Vazamento entre tenants + violação grave LGPD" />
          </div>
        </Section>

        {/* 5. Dados Sensíveis e Sigilo */}
        <Section id="sensiveis" icon={Eye} title="5. Dados Sensíveis e Sigilo Profissional" color="bg-orange-100 text-orange-600">
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Risco Especial: Sigilo Profissional da Advocacia
              </h3>
              <p className="text-sm text-red-700">
                O art. 7º do Estatuto da OAB (Lei 8.906/94) e o Código de Ética da OAB estabelecem sigilo absoluto sobre tudo que o advogado toma conhecimento no exercício da profissão. 
                A plataforma armazena estratégias jurídicas, teses, vulnerabilidades de processos e informações confidenciais de clientes. <strong>Um vazamento não é apenas infração LGPD — é infração ética grave com risco de suspensão da OAB.</strong>
              </p>
            </div>
            <div className="space-y-3">
              <CheckItem status="PARCIAL" label="Dados pessoais sensíveis (art. 11 LGPD)" detail="CPF/CNPJ presentes. Saúde, biometria, religião: potencialmente em documentos livres de texto — sem controle automatizado." />
              <CheckItem status="FALHA" label="Dados enviados à OpenAI sem anonimização" detail="Conversas completas (histórico de caso + estratégia) são enviadas à API da OpenAI sem filtro de PII. Risco de exposição de dados sigilosos a terceiro internacional." />
              <CheckItem status="OK" label="Isolamento básico entre tenants (RLS)" detail="created_by garante que usuário A não acessa dados do usuário B via interface normal. Implementado corretamente." />
              <CheckItem status="FALHA" label="Acesso admin pode ver dados de todos os tenants" detail="Service role (asServiceRole) e role=admin têm acesso irrestrito ao banco. Sem log de acesso de admin a dados de outros usuários." />
              <CheckItem status="PARCIAL" label="Portal do Cliente — acesso de terceiros" detail="ClientPortalAccess implementado. Verificar se token expira, se há log de acesso e se escopo de dados visíveis é mínimo." />
              <CheckItem status="FALHA" label="Dados de partes processuais (3ºs sem conta)" detail="Nomes, CPFs e dados de partes adversas são armazenados sem que essas pessoas jamais tenham interagido com a plataforma ou dado consentimento." />
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              <strong>💡 Recomendação:</strong> Implementar filtro de PII antes de enviar prompts à OpenAI. Substituir nomes reais por tokens (ex: "CLIENTE_1", "PARTE_ADVERSA") antes da chamada de API e rehydratar na resposta. Isso reduz drasticamente o risco de exposição de dados sensíveis a terceiros internacionais.
            </div>
          </div>
        </Section>

        {/* 6. Direitos dos Titulares */}
        <Section id="direitos" icon={Users} title="6. Direitos dos Titulares (Art. 18 LGPD)" color="bg-green-100 text-green-600">
          <div className="space-y-3">
            <CheckItem status="OK" label="Acesso aos dados (Art. 18, I-II)" detail="Página /MyData implementada. Função exportUserData.js retorna todos os dados do usuário em JSON." />
            <CheckItem status="PARCIAL" label="Correção de dados (Art. 18, III)" detail="Usuário pode editar perfil em /Settings. Dados de processos/clientes: editáveis na interface. Sem canal formal para 'solicitação de correção'." />
            <CheckItem status="OK" label="Portabilidade (Art. 18, V)" detail="exportUserData.js implementado com referência explícita ao Art. 18º inciso II LGPD. Exportação em JSON — avaliar formato estruturado adicional (CSV)." />
            <CheckItem status="PARCIAL" label="Exclusão / Anonimização (Art. 18, VI)" detail="deleteUserAccount.js implementado e funcional. Porém: entidade User não é deletada automaticamente (requer admin). Logs de auditoria são deletados junto — pode conflitar com obrigação legal de retenção." />
            <CheckItem status="PARCIAL" label="Revogação de consentimento (Art. 18, IX)" detail="Modal de consentimento presente. Não há fluxo claro de 'revogar consentimento sem excluir conta' — apenas 'excluir conta' apaga tudo." />
            <CheckItem status="FALHA" label="Oposição ao tratamento (Art. 18, IX)" detail="Não há mecanismo para o titular opor-se a tratamentos específicos (ex: uso de dados para melhoria do serviço) sem sair da plataforma." />
            <CheckItem status="FALHA" label="Prazo de resposta documentado (15 dias — Art. 19)" detail="A PP e os Termos não mencionam o prazo legal de 15 dias para resposta às solicitações dos titulares." />
            <CheckItem status="FALHA" label="Canal formal de exercício de direitos" detail="Apenas e-mail mencionado (contato@juris.app). Recomendado: formulário estruturado com protocolo de atendimento, SLA e confirmação automática." />
            <CheckItem status="PARCIAL" label="Titular = parte processual (3º sem conta)" detail="Pessoas cujos dados foram cadastrados por advogados não têm como exercer seus direitos diretamente na plataforma." />
          </div>
        </Section>

        {/* 7. Terceiros e Integrações */}
        <Section id="terceiros" icon={Globe} title="7. Terceiros, Integrações e Transferência Internacional" color="bg-teal-100 text-teal-600">
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-2 border border-gray-200">Terceiro</th>
                  <th className="text-left p-2 border border-gray-200">Dados Compartilhados</th>
                  <th className="text-left p-2 border border-gray-200">País</th>
                  <th className="text-left p-2 border border-gray-200">DPA?</th>
                  <th className="text-left p-2 border border-gray-200">Risco</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["OpenAI (GPT)", "Prompts com dados processuais, estratégias, nomes", "EUA 🇺🇸", "Não verificado", "CRÍTICO"],
                  ["Base44 (infra)", "Todos os dados — BD, auth, storage, functions", "EUA/Cloud 🌍", "Contrato de uso", "MÉDIO"],
                  ["Hotmart", "Nome, e-mail, dados de pagamento, plano", "EUA/BR 🇧🇷", "Não verificado", "MÉDIO"],
                  ["MercadoPago", "Dados de pagamento, CPF (potencial)", "AR/BR 🇧🇷", "Não verificado", "MÉDIO"],
                  ["Cakto", "Dados de pagamento", "BR 🇧🇷", "Não verificado", "BAIXO"],
                  ["Stripe", "Dados de pagamento (secrets configurados)", "EUA 🇺🇸", "Stripe DPA disponível", "MÉDIO"],
                  ["Google OAuth (login)", "Nome, e-mail, foto de perfil", "EUA 🇺🇸", "Google TOS/DPA", "BAIXO"],
                  ["API Diário da Justiça (potencial)", "Nomes de partes, nº processos", "BR 🇧🇷", "Dados públicos", "BAIXO"],
                ].map(([terceiro, dados, pais, dpa, risco], i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="p-2 border border-gray-200 font-semibold">{terceiro}</td>
                    <td className="p-2 border border-gray-200 text-gray-600">{dados}</td>
                    <td className="p-2 border border-gray-200">{pais}</td>
                    <td className="p-2 border border-gray-200">{dpa}</td>
                    <td className="p-2 border border-gray-200">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold border ${riskColor(risco)}`}>{risco}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
            <strong>⚠ Transferência Internacional — Art. 33 LGPD:</strong> Dados enviados à OpenAI (EUA) configuram transferência internacional. É necessário garantir nível adequado de proteção por meio de: (a) cláusulas contratuais padrão (SCCs), (b) consentimento específico do titular, ou (c) garantias de que a OpenAI adota proteção equivalente à LGPD. A PP menciona "dados anonimizados" mas o código não implementa anonimização.
          </div>
        </Section>

        {/* 8. Riscos e Penalidades */}
        <Section id="riscos" icon={AlertTriangle} title="8. Mapa de Riscos e Penalidades" color="bg-red-100 text-red-600">
          <div className="space-y-2">
            <RiskItem level="CRÍTICO" title="Criptografia falsa de CPF/CNPJ (Base64)" detail="Base legal violada. Art. 46 LGPD exige medidas técnicas. Sanção ANPD: até 2% do faturamento, limitado a R$ 50 milhões por infração." impact="Multa ANPD + responsabilidade civil coletiva" />
            <RiskItem level="CRÍTICO" title="Transmissão de dados sigilosos à OpenAI sem anonimização" detail="Violação do sigilo profissional do advogado + art. 33 LGPD (transferência internacional inadequada). Risco ético-disciplinar na OAB." impact="Multa ANPD + infração ética OAB + danos morais" />
            <RiskItem level="CRÍTICO" title="Ausência de Plano de Resposta a Incidentes" detail="Art. 48 LGPD: prazo de comunicação à ANPD de incidentes. Sem PRI, qualquer vazamento vira infração autônoma adicional." impact="Multa agravada + publicização do incidente" />
            <RiskItem level="ALTO" title="Sem MFA — conta única protege dados de escritório inteiro" detail="Credentials stuffing / phishing expostos. Todo o escritório comprometido por uma senha roubada." impact="Vazamento massivo + responsabilidade civil do Juris" />
            <RiskItem level="ALTO" title="Dados de partes processuais (3ºs) sem base legal explícita" detail="Pessoas cujos CPFs e dados foram cadastrados não deram consentimento. Base legal deve ser formalizada no ROPA." impact="Autuação ANPD + reclamações de titulares" />
            <RiskItem level="ALTO" title="Deleção de logs ao excluir conta" detail="deleteUserAccount.js remove AuditLogs. Pode colidir com obrigação de retenção de logs por período mínimo (contratos, litígios)." impact="Impossibilidade de defesa em processos + infração" />
            <RiskItem level="MÉDIO" title="DPO declarado sem nomeação formal / comunicação ANPD" detail="Art. 41 LGPD. E-mail listado mas nomeação formal não evidenciada." impact="Infração formal ANPD" />
            <RiskItem level="MÉDIO" title="ROPA inexistente" detail="Art. 37 LGPD exige manter registro das operações de tratamento, especialmente em tratamento em larga escala." impact="Autuação + dificuldade de demonstrar conformidade" />
            <RiskItem level="MÉDIO" title="Canal de exercício de direitos informal (só e-mail)" detail="Art. 18 LGPD: direitos devem ser exercíveis de forma facilitada. Apenas e-mail é insuficiente." impact="Reclamações ANPD por titulares" />
            <RiskItem level="BAIXO" title="Cookies sem política detalhada" detail="Uso de localStorage sem banner específico de cookies não-essenciais." impact="Infração menor / recomendação ANPD" />
          </div>
        </Section>

        {/* 9. Plano de Ação */}
        <Section id="plano" icon={TrendingUp} title="9. Plano de Ação Priorizado" color="bg-amber-100 text-amber-600">
          <div className="space-y-1">
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-bold text-red-800 text-sm mb-1">🚨 AÇÃO IMEDIATA (0–30 dias)</h3>
            </div>
            <ActionItem priority={1} title="Corrigir criptografia de CPF/CNPJ" detail="Substituir Base64 por AES-256-GCM com chave derivada (HKDF/PBKDF2) via Web Crypto API no Deno. Migrar dados existentes." deadline="0–15 dias" />
            <ActionItem priority={1} title="Implementar anonimização de PII antes da OpenAI" detail="Criar filtro que substitui CPFs, nomes, nºs de processo por tokens antes de enviar prompts. Rehydratar na resposta." deadline="0–20 dias" />
            <ActionItem priority={1} title="Criar Plano de Resposta a Incidentes (PRI)" detail="Documento com: identificação, contenção, notificação ANPD (72h), comunicação a titulares, remediação e post-mortem." deadline="0–30 dias" />
            <ActionItem priority={1} title="Formalizar nomeação do DPO e publicar na plataforma" detail="Documento interno de nomeação + publicação na PP com nome completo, e-mail e canal de contato." deadline="0–15 dias" />

            <div className="mb-3 mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <h3 className="font-bold text-orange-800 text-sm mb-1">⚡ CURTO PRAZO (30–90 dias)</h3>
            </div>
            <ActionItem priority={2} title="Elaborar ROPA (Registro de Operações de Tratamento)" detail="Documento por operação: dados tratados, finalidade, base legal, terceiros, retenção, medidas de segurança." deadline="30–60 dias" />
            <ActionItem priority={2} title="Criar RIPD (Relatório de Impacto à Proteção de Dados)" detail="Obrigatório para tratamento em larga escala de dados de caráter jurídico e potencialmente sensíveis." deadline="30–60 dias" />
            <ActionItem priority={2} title="Implementar MFA/2FA" detail="Autenticação de dois fatores para login na plataforma. Avaliar integração via TOTP (Google Authenticator) ou SMS." deadline="45–90 dias" />
            <ActionItem priority={2} title="Assinar DPAs com OpenAI, Hotmart, MercadoPago" detail="Exigir e assinar Data Processing Agreements com todos os operadores que processam dados pessoais dos usuários." deadline="30–60 dias" />
            <ActionItem priority={2} title="Formalizar cláusula Controlador/Operador nos Termos" detail="Incluir no ToS que o advogado é Controlador dos dados de seus clientes e o Juris é Operador, com obrigações recíprocas." deadline="30–45 dias" />

            <div className="mb-3 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-bold text-blue-800 text-sm mb-1">📅 MÉDIO PRAZO (90–180 dias)</h3>
            </div>
            <ActionItem priority={3} title="Implementar canal formal de exercício de direitos" detail="Formulário estruturado em /MyData com protocolo de atendimento, confirmação automática e SLA de 15 dias declarado." deadline="90–120 dias" />
            <ActionItem priority={3} title="Revisar política de retenção e deleção" detail="Criar tabela por tipo de dado. Corrigir deleteUserAccount para NÃO deletar AuditLogs (retenção mínima 5 anos). Adicionar soft-delete." deadline="90–120 dias" />
            <ActionItem priority={3} title="Implementar proteção anti-enumeração de IDs" detail="Rate limiting por IP/usuário nas chamadas de API. Validar que RLS é aplicado em todas as funções backend." deadline="90–150 dias" />
            <ActionItem priority={3} title="Elaborar Política de Segurança da Informação" detail="PSI interna cobrindo: classificação de dados, acesso, incidentes, terceiros, desenvolvimento seguro e treinamentos." deadline="120–180 dias" />
            <ActionItem priority={3} title="Realizar Pentest e revisão de segurança" detail="Contratar empresa especializada para teste de penetração focado em isolamento multi-tenant, APIs e autenticação." deadline="120–180 dias" />
          </div>
        </Section>

        {/* 10. Score Final */}
        <Section id="score" icon={Award} title="10. Score Final de Conformidade LGPD" color="bg-yellow-100 text-yellow-600" defaultOpen={true}>
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
                <p className="text-sm text-gray-500 mb-2 uppercase tracking-wide">Score Geral</p>
                <div className={`text-7xl font-bold ${scoreColor} mb-2`}>{SCORE}</div>
                <div className="text-gray-400 text-sm mb-3">/ 100 pontos</div>
                <div className="h-4 bg-gray-100 rounded-full overflow-hidden mb-3">
                  <div className={`h-full rounded-full bg-gradient-to-r ${scoreGradient} transition-all`} style={{ width: `${SCORE}%` }} />
                </div>
                <div className={`text-base font-bold ${scoreColor}`}>{scoreLabel}</div>
                <p className="text-xs text-gray-500 mt-2">Maturidade em Proteção de Dados</p>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-800 text-sm">Pontuação por Dimensão</h3>
                {[
                  { dim: "Mapeamento de Dados", nota: 55, max: 100 },
                  { dim: "Bases Legais", nota: 50, max: 100 },
                  { dim: "Documentação e Governança", nota: 45, max: 100 },
                  { dim: "Segurança da Informação", nota: 40, max: 100 },
                  { dim: "Dados Sensíveis / Sigilo", nota: 45, max: 100 },
                  { dim: "Direitos dos Titulares", nota: 65, max: 100 },
                  { dim: "Terceiros e Integrações", nota: 40, max: 100 },
                  { dim: "Gestão de Riscos", nota: 30, max: 100 },
                ].map((item, i) => {
                  const c = item.nota >= 70 ? "bg-green-500" : item.nota >= 50 ? "bg-yellow-500" : "bg-red-500";
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-700">{item.dim}</span>
                        <span className="font-bold text-gray-900">{item.nota}/100</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${c}`} style={{ width: `${item.nota}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Justificativa do Score</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold text-green-700 mb-2">✅ Pontos Positivos (+)</p>
                  <ul className="space-y-1 text-gray-700 text-xs">
                    <li>• Política de Privacidade e Termos de Uso publicados</li>
                    <li>• Modal de consentimento LGPD implementado e funcional</li>
                    <li>• DPO declarado (dpo@juris.app)</li>
                    <li>• AuditLog com trilha de auditoria operacional</li>
                    <li>• Exclusão de dados do titular implementada (Art. 18, VI)</li>
                    <li>• Exportação de dados (portabilidade) implementada</li>
                    <li>• RLS funcional por usuário (isolamento básico de tenants)</li>
                    <li>• RBAC com roles admin/user</li>
                    <li>• Secrets de API gerenciados de forma segura</li>
                    <li>• Página /MyData para acesso aos dados</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-red-700 mb-2">❌ Pontos Críticos (-)</p>
                  <ul className="space-y-1 text-gray-700 text-xs">
                    <li>• CPF criptografado com Base64 (falsa segurança)</li>
                    <li>• Dados sigilosos enviados à OpenAI sem anonimização</li>
                    <li>• Ausência de MFA/2FA</li>
                    <li>• ROPA, RIPD e PRI inexistentes</li>
                    <li>• Sem DPA com terceiros (OpenAI, Hotmart, MP)</li>
                    <li>• Dados de partes processuais (3ºs) sem base legal formal</li>
                    <li>• Deleção de AuditLogs ao excluir conta</li>
                    <li>• Canal de exercício de direitos apenas por e-mail</li>
                    <li>• Sem proteção anti-enumeração de IDs</li>
                    <li>• Nomeação formal do DPO não evidenciada</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-xl p-5 bg-gradient-to-br from-slate-50 to-gray-50">
              <h3 className="font-semibold text-gray-900 mb-3">Nível de Maturidade</h3>
              <div className="flex gap-2 mb-4 flex-wrap">
                {[
                  { label: "Inicial (0–30)", active: false },
                  { label: "Inicial-Intermediário (31–50)", active: false },
                  { label: "Intermediário (51–70) ◄ ATUAL", active: true },
                  { label: "Intermediário-Avançado (71–85)", active: false },
                  { label: "Avançado (86–100)", active: false },
                ].map((n, i) => (
                  <span key={i} className={`text-xs px-3 py-1.5 rounded-full border font-medium ${n.active ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-white text-gray-500 border-gray-200'}`}>
                    {n.label}
                  </span>
                ))}
              </div>
              <p className="text-sm text-gray-700">
                O Juris está no nível <strong>Intermediário</strong>. Possui fundações de conformidade (PP, Termos, Consentimento, Auditoria, Exclusão, Portabilidade) mas apresenta <strong>falhas técnicas graves</strong> que impedem atingir nível avançado: a criptografia fake de CPF e a ausência de anonimização de dados enviados à OpenAI são as duas vulnerabilidades mais urgentes. Com o plano de ação de 90 dias, o sistema pode alcançar score 75–80 (Intermediário-Avançado).
              </p>
            </div>
          </div>
        </Section>

        {/* Footer */}
        <div className="border border-gray-200 rounded-xl p-4 bg-white text-center">
          <p className="text-xs text-gray-500">
            Este relatório é uma auditoria interna baseada na análise do código-fonte da plataforma Juris. Não substitui consultoria jurídica especializada em LGPD. Recomenda-se validação por advogado especialista em proteção de dados.
            <br />Referências: LGPD (Lei 13.709/2018) · ANPD · Estatuto da OAB (Lei 8.906/94) · Código de Ética OAB · GDPR (comparativo)
          </p>
        </div>
      </div>
    </div>
  );
}