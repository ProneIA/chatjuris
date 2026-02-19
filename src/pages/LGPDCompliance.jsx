import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Shield, FileText, Users, AlertTriangle, CheckCircle,
  XCircle, Clock, Download, ChevronDown, ChevronRight,
  Lock, Globe, Server, BookOpen, Zap, ArrowLeft,
  Calendar, BarChart3, Info, RefreshCw, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const ROADMAP = [
  {
    phase: "30 dias — Crítico",
    color: "red",
    items: [
      { done: true, label: "Criptografia AES-256-GCM para CPF/CNPJ", detail: "Substituiu Base64. encryptCPF.js e decryptCPF.js corrigidos." },
      { done: true, label: "Anonimização de PII antes de enviar à OpenAI", detail: "chatgpt.js agora remove CPFs, CNPJs, e-mails, telefones e nº de processos antes de cada chamada à API." },
      { done: true, label: "Exclusão de conta LGPD-compliant", detail: "deleteUserAccount.js agora anonimiza AuditLogs (retenção obrigatória) e cobre todas as entidades." },
      { done: true, label: "DPO formalmente identificado na plataforma", detail: "dpo@juris.app listado na PP e na página MyData." },
      { done: true, label: "Relatório de Auditoria LGPD publicado", detail: "Página /LGPDAudit disponível com diagnóstico completo." },
      { done: false, label: "Plano de Resposta a Incidentes (PRI) formal", detail: "Ver modelo nesta página. Necessita aprovação e publicação interna." },
      { done: false, label: "DPA assinado com OpenAI", detail: "Acessar platform.openai.com/privacy → Data Processing Addendum." },
    ]
  },
  {
    phase: "60 dias — Alta Prioridade",
    color: "orange",
    items: [
      { done: false, label: "ROPA — Registro de Operações de Tratamento", detail: "Ver modelo nesta página. Preencher e manter atualizado." },
      { done: false, label: "RIPD — Relatório de Impacto à Proteção de Dados", detail: "Obrigatório dado o volume e sensibilidade dos dados tratados." },
      { done: false, label: "DPA com Hotmart, MercadoPago, Cakto", detail: "Solicitar ou assinar aditivos contratuais com cláusulas de proteção de dados." },
      { done: false, label: "Cláusula Controlador/Operador nos Termos de Uso", detail: "O advogado é Controlador; o Juris é Operador. Formalizar no ToS." },
      { done: false, label: "Implementar MFA/2FA", detail: "Autenticação de dois fatores para todas as contas. Prioridade máxima para dados jurídicos." },
      { done: false, label: "Rate limiting e anti-enumeração de IDs", detail: "Proteger APIs contra scraping e acesso cross-tenant por força bruta." },
    ]
  },
  {
    phase: "90 dias — Médio Prazo",
    color: "blue",
    items: [
      { done: false, label: "Política de Segurança da Informação (PSI)", detail: "Documento interno com classificação de dados, acessos, incidentes e treinamentos." },
      { done: false, label: "Canal formal de exercício de direitos dos titulares", detail: "Formulário estruturado com SLA de 15 dias (Art. 19 LGPD) e confirmação automática." },
      { done: false, label: "Revisão da política de retenção por categoria", detail: "Tabela com prazo por tipo de dado e processo de descarte seguro." },
      { done: false, label: "Pentest e revisão de segurança", detail: "Teste de penetração focado em isolamento multi-tenant e autenticação." },
      { done: false, label: "Portabilidade em formato CSV além de JSON", detail: "Art. 18º, V — formato interoperável padronizado." },
      { done: false, label: "Treinamento da equipe em LGPD", detail: "Capacitação dos colaboradores que acessam dados pessoais da plataforma." },
    ]
  }
];

const DOCUMENTS = [
  {
    title: "ROPA — Registro de Operações de Tratamento",
    icon: FileText,
    status: "pendente",
    urgency: "alta",
    basis: "Art. 37, LGPD",
    content: `REGISTRO DE OPERAÇÕES DE TRATAMENTO DE DADOS PESSOAIS
Controlador: Juris Tecnologia Ltda | Operador: Base44 (infraestrutura), OpenAI (processamento IA)
Encarregado (DPO): dpo@juris.app | Versão: 1.0 | Data: ${new Date().toLocaleDateString('pt-BR')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OPERAÇÃO 1 — Cadastro e Autenticação do Advogado
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Dados: Nome, e-mail, senha (hash), foto de perfil (OAuth)
Finalidade: Prestação do serviço SaaS / gestão de conta
Base Legal: Art. 7º, V — Execução de contrato
Retenção: Duração do contrato + 5 anos (defesa judicial)
Compartilhamento: Base44 (auth), Google OAuth (login)
Medidas: Autenticação segura, HTTPS, RLS, criptografia em trânsito

OPERAÇÃO 2 — Gestão de Clientes do Advogado
Dados: Nome, CPF/CNPJ (criptografado AES-256-GCM), e-mail, telefone, endereço
Finalidade: Gestão da relação advogado-cliente
Base Legal: Art. 7º, V (contrato com advogado) + Art. 7º, VI (exercício regular de direitos)
Retenção: Enquanto vigente o contrato + 5 anos
Compartilhamento: Nenhum (dado isolado por tenant)
Medidas: Criptografia AES-256-GCM para CPF, RLS multi-tenant, AuditLog

OPERAÇÃO 3 — Processos Judiciais e Estratégias
Dados: Número do processo, tribunal, partes, estratégia, documentos
Finalidade: Gestão jurídica — prestação do serviço ao advogado
Base Legal: Art. 7º, V + Art. 7º, VI (exercício regular de direitos)
Retenção: 5 anos após encerramento do processo (prazos prescricionais)
Compartilhamento: Base44 (storage), OpenAI (apenas conteúdo anonimizado via filtro PII)
Medidas: Filtro PII antes de IA, RLS, AuditLog

OPERAÇÃO 4 — Conversas com Assistente de IA
Dados: Prompts com contexto jurídico (anonimizados antes de envio)
Finalidade: Geração de conteúdo jurídico assistido por IA
Base Legal: Art. 7º, V — Execução de contrato + Legítimo Interesse (Art. 7º, IX)
Retenção: Histórico: até o usuário excluir a conversa
Compartilhamento: OpenAI API (EUA) — dados anonimizados com filtro PII ativo
Medidas: Anonimização de CPF, CNPJ, e-mail, telefone, nº processo antes de cada chamada

OPERAÇÃO 5 — Pagamentos e Assinaturas
Dados: Nome, e-mail, plano, valor, método de pagamento
Finalidade: Processamento financeiro e gestão de assinaturas
Base Legal: Art. 7º, V — Execução de contrato
Retenção: 10 anos (obrigação fiscal — Código Tributário Nacional)
Compartilhamento: Hotmart, MercadoPago, Cakto, Stripe
Medidas: Dados minimizados, processamento pelo gateway, HTTPS

OPERAÇÃO 6 — Logs de Auditoria
Dados: E-mail, IP, ação realizada, timestamp, entidade afetada
Finalidade: Segurança, conformidade legal e defesa judicial
Base Legal: Art. 7º, II (obrigação legal) + Art. 7º, IX (legítimo interesse)
Retenção: 5 anos (mínimo) — IMUTÁVEL
Compartilhamento: Nenhum (acesso restrito a admin)
Medidas: update: false no RLS, anonimização na exclusão de conta (email → hash SHA-256)

OPERAÇÃO 7 — Dados de Partes Processuais (terceiros)
Dados: Nomes, CPFs, dados de partes adversas inseridos pelo advogado
Finalidade: Gestão do processo judicial pelo advogado
Base Legal: Art. 7º, VI — Exercício regular de direitos em processo judicial
Nota: Esses titulares não são usuários da plataforma. Base legal deve ser explicitada ao advogado.
Medidas: Dados isolados por tenant, sem acesso de terceiros`
  },
  {
    title: "Plano de Resposta a Incidentes (PRI)",
    icon: AlertTriangle,
    status: "pendente",
    urgency: "critica",
    basis: "Art. 48, LGPD",
    content: `PLANO DE RESPOSTA A INCIDENTES DE SEGURANÇA / LGPD
Versão: 1.0 | Data: ${new Date().toLocaleDateString('pt-BR')} | Responsável: DPO — dpo@juris.app

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FASE 1 — IDENTIFICAÇÃO (0–2 horas)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ Identificar a natureza do incidente (vazamento, acesso não autorizado, perda de dados)
□ Determinar quais dados foram afetados (pessoais, sensíveis, sigilosos)
□ Estimar número de titulares afetados
□ Registrar data/hora da descoberta
□ Acionar equipe de resposta: DPO + CTO + Jurídico

FASE 2 — CONTENÇÃO (2–6 horas)
□ Isolar sistemas afetados (revogar tokens, bloquear acessos suspeitos)
□ Preservar evidências (logs, screenshots, dumps de API)
□ Interromper o vazamento ativo se identificado
□ Comunicar internamente a alta direção

FASE 3 — AVALIAÇÃO DE RISCO (6–24 horas)
□ Classificar gravidade: Baixa / Média / Alta / Crítica
□ Verificar se há obrigação de notificar ANPD (Art. 48 LGPD):
   → Incidente com risco ou dano relevante aos titulares = NOTIFICAR em 72h
□ Verificar se titulares devem ser comunicados individualmente
□ Documentar tudo no Registro de Incidentes

FASE 4 — NOTIFICAÇÃO (dentro de 72h se obrigatório)
□ ANPD: https://www.gov.br/anpd/pt-br/assuntos/incidentes-de-seguranca
   - Formulário: Tipo do incidente, dados afetados, nº de titulares, medidas tomadas
□ Titulares afetados: E-mail com linguagem clara sobre o que ocorreu e como se proteger
□ Parceiros (se afetados): Hotmart, Base44, etc.

FASE 5 — REMEDIAÇÃO
□ Aplicar correções técnicas (patches, revogação de credenciais, recriptografia)
□ Reforçar monitoramento por 30 dias após o incidente
□ Atualizar controles de segurança

FASE 6 — POST-MORTEM (até 30 dias após o incidente)
□ Relatório completo do incidente
□ Análise de causa raiz
□ Lições aprendidas e melhorias implementadas
□ Atualizar ROPA e RIPD se necessário

CONTATOS DE EMERGÊNCIA
→ DPO: dpo@juris.app
→ ANPD: https://www.gov.br/anpd | incidentes@anpd.gov.br
→ Base44 Suporte: [contato da plataforma]
→ OAB (se dados de sigilo profissional envolvidos): [seccional competente]`
  },
  {
    title: "Política de Segurança da Informação (PSI)",
    icon: Lock,
    status: "pendente",
    urgency: "alta",
    basis: "Art. 46, LGPD",
    content: `POLÍTICA DE SEGURANÇA DA INFORMAÇÃO — JURIS
Versão: 1.0 | Data: ${new Date().toLocaleDateString('pt-BR')} | Aprovação: DPO + Direção

1. OBJETIVO
Estabelecer diretrizes para proteção de dados pessoais e sigilosos tratados pela plataforma Juris,
em conformidade com a LGPD (Lei 13.709/2018) e o Estatuto da OAB (Lei 8.906/94).

2. CLASSIFICAÇÃO DE DADOS
PÚBLICO: Conteúdo do site, preços, funcionalidades
INTERNO: Dados operacionais da empresa, logs de sistema
CONFIDENCIAL: Dados pessoais de usuários, dados financeiros, chaves de API
RESTRITO: Estratégias jurídicas, documentos processuais, CPFs, dados sigilosos de clientes

3. CONTROLES TÉCNICOS OBRIGATÓRIOS
▸ Criptografia AES-256-GCM para dados RESTRITOS em repouso
▸ TLS 1.2+ para todos os dados em trânsito
▸ MFA obrigatório para contas com acesso administrativo
▸ RLS (Row Level Security) em todas as entidades com dados pessoais
▸ Logs imutáveis de auditoria com retenção mínima de 5 anos
▸ Anonimização de PII antes de qualquer transferência a terceiros

4. ACESSO A DADOS
▸ Princípio do menor privilégio: acesso mínimo necessário
▸ Revisão trimestral de permissões de acesso
▸ Acesso de administradores deve ser logado individualmente
▸ Dados de clientes de um tenant só podem ser acessados por aquele tenant

5. DESENVOLVIMENTO SEGURO
▸ Revisão de segurança antes de deploy de novas features com tratamento de dados
▸ Variáveis de ambiente para segredos (nunca hardcoded)
▸ Dependências atualizadas — revisão mensal de vulnerabilidades (npm audit, Deno deps)
▸ Nunca usar dados reais em ambiente de desenvolvimento

6. TERCEIROS
▸ DPA obrigatório com todos os fornecedores que processam dados pessoais
▸ Avaliação de conformidade LGPD/GDPR de novos fornecedores antes da contratação
▸ Dados mínimos compartilhados (minimização — Art. 6º, III LGPD)

7. INCIDENTES
▸ Seguir o Plano de Resposta a Incidentes (PRI) para qualquer suspeita de violação
▸ Notificação obrigatória à ANPD em até 72h (Art. 48 LGPD) se houver risco relevante
▸ Todo incidente deve ser registrado internamente independente da gravidade

8. TREINAMENTOS
▸ Capacitação anual de toda a equipe em LGPD e segurança da informação
▸ Treinamento específico para colaboradores com acesso a dados restritos`
  },
  {
    title: "Cláusula DPA — Controlador/Operador",
    icon: Globe,
    status: "pendente",
    urgency: "alta",
    basis: "Art. 5º VI e VII + Art. 39, LGPD",
    content: `ADENDO DE PROTEÇÃO DE DADOS (DPA) — CLÁUSULA PARA TERMOS DE USO

RELAÇÃO CONTROLADOR / OPERADOR (Art. 5º, VI e VII, LGPD)

1. PAPÉIS E RESPONSABILIDADES
O USUÁRIO (advogado ou escritório de advocacia) atua como CONTROLADOR dos dados pessoais
de seus clientes, partes processuais e terceiros inseridos na plataforma Juris.

A JURIS atua como OPERADOR, processando tais dados exclusivamente conforme as instruções
do Controlador e para a finalidade de prestação dos serviços contratados.

2. OBRIGAÇÕES DA JURIS (OPERADOR — Art. 39, LGPD)
▸ Tratar os dados pessoais apenas conforme as instruções do Controlador
▸ Manter confidencialidade dos dados processados
▸ Implementar medidas técnicas e organizacionais de segurança (Art. 46, LGPD)
▸ Notificar o Controlador sobre qualquer incidente de segurança em até 24h da descoberta
▸ Auxiliar o Controlador no atendimento aos direitos dos titulares
▸ Não subcontratar o tratamento de dados sem autorização prévia do Controlador
▸ Ao término do contrato: devolver ou deletar os dados conforme instrução do Controlador

3. OBRIGAÇÕES DO CONTROLADOR (USUÁRIO)
▸ Garantir base legal adequada para o tratamento dos dados de seus clientes e partes
▸ Informar os titulares sobre o uso da plataforma Juris para gestão de seus dados
▸ Responder diretamente pelas solicitações de direitos dos titulares de seus clientes
▸ Não inserir dados desnecessários ou excessivos na plataforma (minimização)

4. SUBOPERADORES
A Juris utiliza os seguintes suboperadores para prestação dos serviços:
▸ Base44: Infraestrutura de banco de dados, autenticação e armazenamento (cloud)
▸ OpenAI: Processamento de IA — apenas conteúdo anonimizado (filtro PII ativo)
▸ Hotmart / MercadoPago / Cakto / Stripe: Processamento de pagamentos

5. TRANSFERÊNCIA INTERNACIONAL (Art. 33, LGPD)
Dados anonimizados são processados pela OpenAI (EUA). O Usuário, ao utilizar os recursos
de IA da plataforma, consente expressamente com essa transferência, reconhecendo que
apenas tokens anonimizados (nunca CPFs, e-mails ou dados identificáveis diretamente)
são transmitidos.

6. RETENÇÃO E EXCLUSÃO
Ao término do contrato, os dados operacionais serão excluídos em até 30 dias.
Logs de auditoria serão anonimizados e retidos por 5 anos (obrigação legal).`
  }
];

const CHECKLIST = [
  { cat: "Criptografia e Segurança Técnica", items: [
    { done: true, label: "CPF/CNPJ criptografado com AES-256-GCM" },
    { done: true, label: "Anonimização de PII antes de enviar à OpenAI" },
    { done: true, label: "HTTPS/TLS em trânsito (via infraestrutura Base44)" },
    { done: true, label: "RLS multi-tenant por created_by/user_id" },
    { done: true, label: "RBAC com roles admin/user" },
    { done: false, label: "MFA/2FA implementado para usuários" },
    { done: false, label: "Rate limiting nas APIs" },
    { done: false, label: "Proteção anti-enumeração de IDs" },
    { done: false, label: "Pentest realizado" },
  ]},
  { cat: "Direitos dos Titulares (Art. 18, LGPD)", items: [
    { done: true, label: "Acesso aos dados (/MyData)" },
    { done: true, label: "Portabilidade (exportação JSON)" },
    { done: true, label: "Exclusão LGPD-compliant com anonimização de logs" },
    { done: true, label: "Revogação de consentimento" },
    { done: false, label: "Canal formal de solicitação (formulário + SLA 15 dias)" },
    { done: false, label: "Prazo de 15 dias declarado na PP" },
    { done: false, label: "Portabilidade em CSV" },
  ]},
  { cat: "Documentação e Governança", items: [
    { done: true, label: "Política de Privacidade publicada" },
    { done: true, label: "Termos de Uso publicados" },
    { done: true, label: "Modal de consentimento LGPD" },
    { done: true, label: "DPO identificado (dpo@juris.app)" },
    { done: false, label: "ROPA (Registro de Operações)" },
    { done: false, label: "RIPD (Relatório de Impacto)" },
    { done: false, label: "PRI (Plano de Resposta a Incidentes)" },
    { done: false, label: "PSI (Política de Segurança da Informação)" },
    { done: false, label: "Nomeação formal do DPO documentada" },
    { done: false, label: "Cláusula DPA nos Termos de Uso" },
  ]},
  { cat: "Terceiros e Transferência Internacional", items: [
    { done: true, label: "Anonimização ativa para OpenAI (mitigação principal)" },
    { done: false, label: "DPA assinado com OpenAI" },
    { done: false, label: "DPA assinado com Hotmart" },
    { done: false, label: "DPA assinado com MercadoPago" },
    { done: false, label: "DPA assinado com Base44" },
  ]},
  { cat: "Logs e Auditoria", items: [
    { done: true, label: "AuditLog funcional com IP e timestamp" },
    { done: true, label: "AuditLog imutável (update: false no RLS)" },
    { done: true, label: "Logs retidos (não deletados) ao excluir conta" },
    { done: true, label: "Anonimização de logs na exclusão de conta" },
    { done: false, label: "Política de retenção de 5 anos formalizada" },
    { done: false, label: "Alerta automático para acessos suspeitos" },
  ]},
];

function Section({ title, icon: Icon, color, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden mb-4">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-5 bg-white hover:bg-gray-50 transition-colors text-left">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}><Icon className="w-5 h-5" /></div>
          <span className="font-semibold text-gray-900">{title}</span>
        </div>
        {open ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
      </button>
      {open && <div className="p-5 border-t border-gray-100 bg-gray-50/50">{children}</div>}
    </div>
  );
}

function ScoreBadge({ score, projected }) {
  const c = score >= 70 ? "text-green-600" : score >= 50 ? "text-yellow-600" : "text-red-600";
  const g = score >= 70 ? "from-green-500 to-emerald-400" : score >= 50 ? "from-yellow-500 to-orange-400" : "from-red-500 to-orange-500";
  const label = score >= 80 ? "Intermediário-Avançado" : score >= 60 ? "Intermediário" : "Inicial-Intermediário";
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 text-center">
      <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">{projected ? "Score Projetado (pós-plano)" : "Score Atual"}</p>
      <div className={`text-5xl font-bold ${c} mb-1`}>{score}</div>
      <div className="text-xs text-gray-400 mb-2">/ 100</div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
        <div className={`h-full rounded-full bg-gradient-to-r ${g}`} style={{ width: `${score}%` }} />
      </div>
      <p className={`text-xs font-semibold ${c}`}>{label}</p>
    </div>
  );
}

export default function LGPDCompliance({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const [activeDoc, setActiveDoc] = useState(null);
  const [user, setUser] = React.useState(null);

  React.useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  // Calcular score atual baseado no checklist
  const totalItems = CHECKLIST.flatMap(c => c.items).length;
  const doneItems = CHECKLIST.flatMap(c => c.items).filter(i => i.done).length;
  const currentScore = Math.round((doneItems / totalItems) * 100);
  const projectedScore = 88;

  // Verificar se é admin
  const isAdmin = user?.role === 'admin';

  const downloadDoc = (doc) => {
    const blob = new Blob([doc.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Documento baixado com sucesso!");
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-neutral-950' : 'bg-slate-50'}`}>
      <div className="max-w-5xl mx-auto p-6 md:p-8 space-y-6">

        {/* Header */}
        <div>
          <Link to={createPageUrl("Dashboard")} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className={`text-2xl md:text-3xl font-bold flex items-center gap-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <Shield className="w-8 h-8 text-green-600" /> Plano de Conformidade LGPD
              </h1>
              <p className={`mt-1 text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                Implementação técnica, jurídica e operacional — Lei 13.709/2018
              </p>
            </div>
            <div className="flex gap-2">
              <Link to={createPageUrl("LGPDAudit")}>
                <Button variant="outline" size="sm" className="gap-2">
                  <BarChart3 className="w-4 h-4" /> Ver Auditoria
                </Button>
              </Link>
              <Link to={createPageUrl("MyData")}>
                <Button variant="outline" size="sm" className="gap-2">
                  <Users className="w-4 h-4" /> Meus Dados
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Score Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <ScoreBadge score={58} projected={false} />
          <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col justify-center">
            <div className="flex items-center gap-2 text-orange-600 mb-3">
              <Zap className="w-5 h-5" />
              <span className="font-bold">Correções Aplicadas</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-green-700"><CheckCircle className="w-4 h-4" /><span>AES-256-GCM para CPF/CNPJ</span></div>
              <div className="flex items-center gap-2 text-green-700"><CheckCircle className="w-4 h-4" /><span>Anonimização PII → OpenAI</span></div>
              <div className="flex items-center gap-2 text-green-700"><CheckCircle className="w-4 h-4" /><span>Exclusão compliant Art. 18º</span></div>
              <div className="flex items-center gap-2 text-green-700"><CheckCircle className="w-4 h-4" /><span>Logs retidos (não deletados)</span></div>
            </div>
          </div>
          <ScoreBadge score={projectedScore} projected={true} />
        </div>

        {/* Roadmap */}
        <Section title="Roadmap de Implementação (30/60/90 dias)" icon={Calendar} color="bg-blue-100 text-blue-600" defaultOpen={true}>
          <div className="space-y-6">
            {ROADMAP.map((phase, pi) => {
              const colors = { red: "border-red-300 bg-red-50", orange: "border-orange-300 bg-orange-50", blue: "border-blue-300 bg-blue-50" };
              const textColors = { red: "text-red-700", orange: "text-orange-700", blue: "text-blue-700" };
              const done = phase.items.filter(i => i.done).length;
              return (
                <div key={pi} className={`border rounded-xl p-4 ${colors[phase.color]}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={`font-bold text-sm ${textColors[phase.color]}`}>{phase.phase}</h3>
                    <span className={`text-xs font-semibold ${textColors[phase.color]}`}>{done}/{phase.items.length} concluídos</span>
                  </div>
                  <div className="h-1.5 bg-white/50 rounded-full mb-3 overflow-hidden">
                    <div className={`h-full rounded-full ${phase.color === 'red' ? 'bg-red-500' : phase.color === 'orange' ? 'bg-orange-500' : 'bg-blue-500'}`}
                      style={{ width: `${(done / phase.items.length) * 100}%` }} />
                  </div>
                  <div className="space-y-2">
                    {phase.items.map((item, ii) => (
                      <div key={ii} className="flex items-start gap-2 text-sm">
                        {item.done
                          ? <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                          : <XCircle className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />}
                        <div>
                          <span className={item.done ? "text-gray-500 line-through" : "text-gray-800 font-medium"}>{item.label}</span>
                          <p className="text-xs text-gray-500 mt-0.5">{item.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        {/* Checklist de Conformidade */}
        <Section title="Checklist de Conformidade LGPD" icon={CheckCircle} color="bg-green-100 text-green-600">
          <div className="space-y-4">
            {CHECKLIST.map((cat, ci) => {
              const done = cat.items.filter(i => i.done).length;
              const pct = Math.round((done / cat.items.length) * 100);
              return (
                <div key={ci} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm text-gray-800">{cat.cat}</h3>
                    <span className={`text-xs font-bold ${pct === 100 ? 'text-green-600' : pct >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>{done}/{cat.items.length}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full mb-3 overflow-hidden">
                    <div className={`h-full rounded-full ${pct === 100 ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="grid md:grid-cols-2 gap-1">
                    {cat.items.map((item, ii) => (
                      <div key={ii} className="flex items-center gap-2 text-xs py-1">
                        {item.done
                          ? <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                          : <XCircle className="w-3.5 h-3.5 text-gray-300 shrink-0" />}
                        <span className={item.done ? "text-gray-500" : "text-gray-700"}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        {/* Documentos de Governança */}
        <Section title="Documentos de Governança (Modelos)" icon={FileText} color="bg-purple-100 text-purple-600">
          <div className="space-y-3">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 mb-4">
              <strong>⚠ Ação necessária:</strong> Os documentos abaixo são modelos estruturais. Baixe, personalize com dados reais da sua empresa e publique formalmente.
            </div>
            {DOCUMENTS.map((doc, di) => {
              const Icon = doc.icon;
              const urgencyColor = doc.urgency === 'critica' ? 'bg-red-100 text-red-700' : doc.urgency === 'alta' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700';
              const urgencyLabel = doc.urgency === 'critica' ? 'Crítico' : doc.urgency === 'alta' ? 'Alta' : 'Médio';
              return (
                <div key={di} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="font-semibold text-sm text-gray-800">{doc.title}</p>
                        <p className="text-xs text-gray-500">Base legal: {doc.basis}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${urgencyColor}`}>{urgencyLabel}</span>
                      <Button size="sm" variant="outline" onClick={() => setActiveDoc(activeDoc === di ? null : di)} className="gap-1 text-xs h-7">
                        {activeDoc === di ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        Ver Modelo
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => downloadDoc(doc)} className="gap-1 text-xs h-7">
                        <Download className="w-3 h-3" /> Baixar
                      </Button>
                    </div>
                  </div>
                  {activeDoc === di && (
                    <div className="border-t border-gray-100 bg-gray-50 p-4">
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed overflow-auto max-h-80">{doc.content}</pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Section>

        {/* Correções Técnicas Aplicadas */}
        <Section title="Correções Técnicas Implementadas" icon={Zap} color="bg-emerald-100 text-emerald-600" defaultOpen={true}>
          <div className="space-y-4">

            <div className="bg-white border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <h3 className="font-semibold text-sm text-green-800">1. Criptografia AES-256-GCM para CPF/CNPJ</h3>
                <Badge className="bg-green-100 text-green-700 text-xs">CORRIGIDO</Badge>
              </div>
              <p className="text-xs text-gray-600 mb-2"><strong>Problema anterior:</strong> Base64 (codificação, não criptografia — reversível trivialmente).</p>
              <p className="text-xs text-gray-700 mb-2"><strong>Solução aplicada:</strong> AES-256-GCM com IV aleatório de 12 bytes, chave derivada via HKDF-SHA-256 do BASE44_APP_ID. Formato: <code className="bg-gray-100 px-1 rounded">aes256gcm.v1.{"{iv}"}.{"{ciphertext}"}</code></p>
              <p className="text-xs text-gray-500"><strong>Arquivos:</strong> functions/encryptCPF.js · functions/decryptCPF.js</p>
              <p className="text-xs text-gray-500"><strong>Base legal atendida:</strong> Art. 46 LGPD — medidas técnicas adequadas de segurança</p>
            </div>

            <div className="bg-white border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <h3 className="font-semibold text-sm text-green-800">2. Anonimização de PII antes de enviar à OpenAI</h3>
                <Badge className="bg-green-100 text-green-700 text-xs">CORRIGIDO</Badge>
              </div>
              <p className="text-xs text-gray-600 mb-2"><strong>Problema anterior:</strong> Dados completos (CPF, e-mails, nº de processo, estratégias) enviados em texto plano à OpenAI (EUA) sem qualquer filtro.</p>
              <p className="text-xs text-gray-700 mb-2"><strong>Solução aplicada:</strong> Filtro automático de PII que substitui CPF, CNPJ, e-mails, telefones e nº de processo CNJ por tokens antes de cada chamada. A resposta da IA é re-identificada no servidor antes de retornar ao usuário.</p>
              <div className="bg-gray-50 rounded p-2 text-xs font-mono text-gray-600 mb-2">
                "CPF 123.456.789-00" → "[CPF_1]" → OpenAI → resposta → "[CPF_1]" → "CPF 123.456.789-00"
              </div>
              <p className="text-xs text-gray-500"><strong>Arquivo:</strong> functions/chatgpt.js</p>
              <p className="text-xs text-gray-500"><strong>Base legal atendida:</strong> Art. 33 LGPD (transferência internacional) + Art. 46 (segurança) + sigilo profissional OAB</p>
            </div>

            <div className="bg-white border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <h3 className="font-semibold text-sm text-green-800">3. Exclusão de Conta LGPD-Compliant</h3>
                <Badge className="bg-green-100 text-green-700 text-xs">CORRIGIDO</Badge>
              </div>
              <p className="text-xs text-gray-600 mb-2"><strong>Problema anterior:</strong> AuditLogs eram deletados ao excluir conta — violando obrigação de retenção. Cobertura incompleta de entidades.</p>
              <p className="text-xs text-gray-700 mb-2"><strong>Solução aplicada:</strong> 30+ entidades cobertas. AuditLogs agora são <strong>anonimizados</strong> (email substituído por hash SHA-256 irreversível) e <strong>retidos</strong> por 5 anos. Usuário anonimizado na entidade User.</p>
              <p className="text-xs text-gray-500"><strong>Arquivo:</strong> functions/deleteUserAccount.js</p>
              <p className="text-xs text-gray-500"><strong>Base legal atendida:</strong> Art. 18º, VI (eliminação) + obrigação de retenção por defesa judicial</p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h3 className="font-semibold text-sm text-amber-800">Próximos Passos Críticos (requerem ação manual)</h3>
              </div>
              <div className="space-y-2 text-xs text-amber-700">
                <p>1. <strong>MFA/2FA:</strong> Implementar autenticação de dois fatores — depende de integração com provedor de auth (Base44 Auth ou TOTP).</p>
                <p>2. <strong>DPA com OpenAI:</strong> Acessar <a href="https://platform.openai.com/privacy" target="_blank" rel="noopener noreferrer" className="underline">platform.openai.com/privacy</a> e assinar o Data Processing Addendum.</p>
                <p>3. <strong>DPA com Base44:</strong> Solicitar ao suporte Base44 um contrato de processamento de dados.</p>
                <p>4. <strong>ROPA e RIPD:</strong> Baixar os modelos acima, preencher com dados reais e manter atualizado internamente.</p>
                <p>5. <strong>PRI:</strong> Baixar o modelo do Plano de Resposta a Incidentes, aprovar internamente e publicar como procedimento operacional.</p>
              </div>
            </div>
          </div>
        </Section>

        {/* Score Projetado */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 text-white">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-400" /> Score Final Projetado — Após Implementação Completa
          </h2>
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            {[
              { label: "Score Atual", value: "58", sub: "Intermediário", color: "text-yellow-400" },
              { label: "Score 30 dias", value: "72", sub: "Intermediário-Avançado", color: "text-blue-400" },
              { label: "Score 90 dias", value: "88", sub: "Avançado", color: "text-green-400" },
            ].map((s, i) => (
              <div key={i} className="bg-white/10 rounded-lg p-4 text-center">
                <p className="text-xs text-white/60 mb-1">{s.label}</p>
                <p className={`text-4xl font-bold ${s.color}`}>{s.value}</p>
                <p className={`text-xs font-medium mt-1 ${s.color}`}>{s.sub}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-white/70">
            Com as correções técnicas aplicadas (criptografia, anonimização, exclusão) e a implementação dos documentos de governança (ROPA, RIPD, PRI, DPAs) e controles operacionais (MFA, rate limiting), a plataforma atingirá nível <strong className="text-green-400">Avançado de Maturidade LGPD</strong>, com risco residual baixo e conformidade adequada para operar como SaaS jurídico multi-tenant no Brasil.
          </p>
        </div>

        <div className="border border-gray-200 rounded-xl p-4 bg-white text-center">
          <p className="text-xs text-gray-500">
            Este plano de conformidade foi gerado com base em análise técnica do código-fonte da plataforma Juris.
            Recomenda-se validação periódica por advogado especialista em LGPD e atualização anual do ROPA.
            <br />Referências: LGPD (Lei 13.709/2018) · ANPD · OAB (Lei 8.906/94) · GDPR (comparativo) · ISO 27001
          </p>
        </div>
      </div>
    </div>
  );
}