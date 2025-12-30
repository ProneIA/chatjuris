import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Book, Search, Video, FileText, Sparkles, Calculator, 
  Users, Scale, FolderOpen, Calendar, MessageSquare, 
  PlayCircle, CheckCircle2, ChevronRight, ExternalLink,
  Code, Zap, HelpCircle, BookOpen, Download, Printer
} from "lucide-react";
import { motion } from "framer-motion";

const documentationSections = [
  {
    id: "inicio",
    title: "Primeiros Passos",
    icon: Zap,
    color: "blue",
    topics: [
      {
        title: "Bem-vindo ao Juris",
        content: `O Juris é uma plataforma completa para gestão de escritórios de advocacia, combinando ferramentas de produtividade com inteligência artificial.

**O que você pode fazer:**
- Gerenciar clientes, processos e tarefas
- Calcular valores jurídicos automaticamente
- Usar IA para análise de documentos e pesquisa jurídica
- Colaborar com sua equipe em tempo real
- Monitorar prazos e compromissos

**Requisitos:**
- Navegador moderno (Chrome, Firefox, Safari ou Edge)
- Conexão com internet
- Conta Juris (gratuita ou Pro)`,
        video: null
      },
      {
        title: "Criando sua Conta",
        content: `**Passo a passo:**

1. Acesse o site do Juris
2. Clique em "Criar Conta"
3. Preencha seu nome, email e senha
4. Confirme seu email
5. Faça login e configure seu perfil

**Dica:** Use um email profissional para facilitar o compartilhamento com sua equipe.`,
        video: null
      },
      {
        title: "Tour pela Interface",
        content: `**Barra Superior:**
- Logo Juris (clique para voltar ao Dashboard)
- Menu de navegação principal
- Notificações
- Seu perfil e configurações

**Áreas Principais:**
- **Painel:** Visão geral e métricas
- **Biblioteca:** Templates e documentos
- **Assistente IA:** Chat inteligente
- **Gestão:** Clientes, processos, tarefas
- **Ferramentas:** Calculadoras jurídicas
- **Colaboração:** Equipes e compartilhamento

**Atalhos de Teclado:**
- \`Ctrl + K\`: Busca rápida
- \`Ctrl + N\`: Novo item
- \`Ctrl + /\`: Ajuda`,
        video: null
      }
    ]
  },
  {
    id: "clientes",
    title: "Gestão de Clientes",
    icon: Users,
    color: "green",
    topics: [
      {
        title: "Cadastrando Clientes",
        content: `**Como adicionar um novo cliente:**

1. Vá para **Gestão → Clientes**
2. Clique em **"Novo Cliente"**
3. Preencha os dados obrigatórios:
   - Nome completo *
   - Telefone *
   - Tipo (Pessoa Física ou Jurídica)
   - Status (Ativo/Inativo)

**Dados Opcionais:**
- CPF/CNPJ
- Email
- Endereço
- Estado civil
- Observações

**Scanner de Documentos:**
Para facilitar o cadastro, use o scanner de documentos:
1. Clique em "Escanear Documento"
2. Escolha entre Galeria ou Câmera
3. Tire uma foto clara do RG, CNH ou CNPJ
4. Aguarde a extração automática dos dados
5. Revise e complete as informações
6. Salve o cliente

**Dicas para melhor leitura:**
- Tire foto em local bem iluminado
- Evite reflexos e sombras
- Mantenha o documento reto e completo
- Use fundo neutro se possível`,
        video: null
      },
      {
        title: "Organizando Clientes",
        content: `**Busca e Filtros:**
Use a barra de busca para encontrar clientes por:
- Nome
- Email
- CPF/CNPJ

**Estatísticas:**
Veja no topo da página:
- Total de clientes ativos
- Pessoas físicas
- Pessoas jurídicas

**Status:**
- **Ativo:** Cliente com processos em andamento
- **Inativo:** Cliente sem processos ativos
- **Arquivado:** Cliente histórico`,
        video: null
      },
      {
        title: "Histórico do Cliente",
        content: `Ao clicar em um cliente, você vê:

**Informações Gerais:**
- Dados cadastrais completos
- Status atual

**Processos Relacionados:**
- Lista de todos os processos
- Status de cada processo
- Valores envolvidos

**Comunicações:**
- Histórico de emails
- Ligações registradas
- Reuniões
- Mensagens do WhatsApp

**Pagamentos:**
- Honorários acordados
- Pagamentos recebidos
- Saldo pendente

**Lembretes:**
- Próximas ações
- Follow-ups programados`,
        video: null
      }
    ]
  },
  {
    id: "ia",
    title: "Assistente IA",
    icon: Sparkles,
    color: "purple",
    topics: [
      {
        title: "Como Usar o Assistente",
        content: `O Assistente IA é seu copiloto jurídico inteligente.

**Principais Usos:**
1. **Análise de Documentos**
   - Upload de contratos, petições, decisões
   - Resumos automáticos
   - Identificação de cláusulas importantes
   - Riscos e pontos de atenção

2. **Pesquisa Jurídica**
   - Busca de jurisprudência
   - Teses e precedentes
   - Legislação aplicável
   - Doutrina relevante

3. **Redação de Documentos**
   - Petições iniciais
   - Recursos
   - Contratos
   - Pareceres

4. **Consultas Gerais**
   - Dúvidas sobre prazos
   - Cálculos jurídicos
   - Procedimentos
   - Estratégias processuais

**Como Fazer Perguntas:**
- Seja específico: "Como calcular juros de mora em processo trabalhista?"
- Forneça contexto: "Tenho um contrato de prestação de serviços com cláusula X..."
- Anexe documentos quando relevante`,
        video: null
      },
      {
        title: "Análise de Documentos",
        content: `**Passo a passo:**

1. Abra o Assistente IA
2. Clique no ícone de anexo (📎)
3. Selecione o documento (PDF, DOCX, imagem)
4. Aguarde o upload
5. Faça sua pergunta ou peça uma análise geral

**Exemplo de Pergunta:**
"Analise este contrato e identifique cláusulas abusivas conforme o CDC"

**O que a IA pode fazer:**
- Resumir documentos longos
- Extrair informações específicas
- Comparar versões de documentos
- Identificar inconsistências
- Sugerir melhorias

**Limites:**
- Plano Gratuito: 5 análises por dia
- Plano Pro: Ilimitado`,
        video: null
      },
      {
        title: "Histórico de Conversas",
        content: `**Gerenciando Conversas:**

1. Clique em "Histórico" no topo
2. Veja todas as conversas anteriores
3. Clique em uma conversa para continuar
4. Renomeie para facilitar organização
5. Exclua conversas antigas

**Favoritar Conversas:**
- Clique no ícone de estrela
- Conversas favoritas aparecem no topo
- Útil para casos complexos em andamento

**Dica:** Crie uma conversa por processo para manter contexto organizado`,
        video: null
      }
    ]
  },
  {
    id: "calculadoras",
    title: "Calculadoras Jurídicas",
    icon: Calculator,
    color: "orange",
    topics: [
      {
        title: "Visão Geral das Calculadoras",
        content: `O Juris possui calculadoras especializadas para todas as áreas do direito:

**Direito Civil:**
- Juros e correção monetária
- Multas contratuais
- Danos materiais
- Pensão alimentícia
- Partilha de bens

**Direito Trabalhista:**
- Rescisão (com/sem justa causa)
- Férias e 13º salário
- Horas extras
- FGTS e multas

**Direito Tributário:**
- SELIC e IPCA
- Tese do Século (exclusão de ISS da base do PIS/COFINS)
- Simulação de regimes tributários
- Exclusão de ISS da base do PIS/COFINS

**Direito Penal:**
- Dosimetria da pena
- Progressão de regime
- Remição por trabalho/estudo

**Ferramentas Gerais:**
- Prazos processuais (dias úteis)
- Custas judiciais
- Honorários advocatícios
- Atualização monetária`,
        video: null
      },
      {
        title: "Calculadora de Juros",
        content: `**Como usar:**

1. Vá em Ferramentas → Calculadora Jurídica
2. Selecione a área (ex: Geral)
3. Escolha "Juros e Correção"
4. Preencha:
   - Tipo de juros (simples/compostos/SELIC)
   - Valor principal
   - Taxa de juros
   - Período em meses

**Exemplo Prático:**
- Valor: R$ 10.000,00
- Taxa: 1% a.m.
- Período: 12 meses
- Tipo: Juros simples

**Resultado:**
- Juros: R$ 1.200,00
- Montante: R$ 11.200,00

**Exportar:**
Clique em "PDF" para gerar um relatório completo`,
        video: null
      },
      {
        title: "Calculadora Trabalhista",
        content: `**Tipos de Cálculo:**
- Rescisão sem justa causa
- Pedido de demissão
- Acordo (art. 484-A CLT)
- Justa causa

**Campos Necessários:**
- Salário bruto mensal
- Meses trabalhados
- Dias trabalhados no mês
- Férias vencidas (se houver)
- Aviso prévio (trabalhado/indenizado)
- Horas extras pendentes

**O que é calculado:**
✓ Saldo de salário
✓ Aviso prévio proporcional (Lei 12.506/2011)
✓ Férias proporcionais + 1/3
✓ Férias vencidas + 1/3
✓ 13º salário proporcional
✓ FGTS depositado (referência)
✓ Multa 40% FGTS
✓ Horas extras (50%)

**Base Legal:**
Todos os cálculos seguem a CLT e jurisprudência do TST`,
        video: null
      },
      {
        title: "Tese do Século (Tributário)",
        content: `**O que é:**
Exclusão do ICMS da base de cálculo do PIS e COFINS (Tema 69 do STF).

**Como calcular:**

1. Acesse Tributário Avançado → Tese do Século
2. Preencha os dados:
   - Período de apuração (meses)
   - Faturamento mensal médio
   - ICMS pago (%)
   - Alíquota PIS (geralmente 1,65%)
   - Alíquota COFINS (geralmente 7,6%)

**Exemplo:**
- Faturamento: R$ 100.000/mês
- ICMS: 18%
- Período: 60 meses (5 anos)

**Resultado Aproximado:**
- Base reduzida: R$ 82.000
- Economia mensal: ~R$ 1.665
- Total 5 anos: ~R$ 100.000

**Atenção:**
- Calcular juros SELIC sobre o período
- Correção monetária aplicável
- Prazo prescricional de 5 anos`,
        video: null
      },
      {
        title: "Salvando Cálculos",
        content: `**Como salvar:**

1. Após realizar o cálculo, clique em "Salvar"
2. Dê um título descritivo
3. Adicione tags para organização
4. Escolha se é rascunho ou final

**Acessar salvos:**
- Clique em "Histórico" na calculadora
- Veja todos os cálculos anteriores
- Filtre por área jurídica
- Exporte novamente se necessário

**Integração:**
Cálculos salvos podem ser vinculados a processos específicos`,
        video: null
      }
    ]
  },
  {
    id: "processos",
    title: "Gestão de Processos",
    icon: Scale,
    color: "indigo",
    topics: [
      {
        title: "Cadastro de Processos",
        content: `**Informações Básicas:**
- Número do processo
- Cliente relacionado
- Área do direito
- Status (Novo, Em andamento, Aguardando, Encerrado)
- Prioridade

**Detalhes:**
- Título descritivo
- Descrição completa do caso
- Vara/Tribunal
- Parte contrária
- Data de início
- Prazo importante
- Valor da causa

**Organização:**
- Vincule a pastas
- Compartilhe com equipe
- Atribua responsável`,
        video: null
      },
      {
        title: "Acompanhamento",
        content: `**Dashboard do Processo:**
- Timeline de eventos
- Documentos anexados
- Tarefas relacionadas
- Movimentações processuais
- Anotações da equipe

**Atualizações:**
Registre cada movimentação:
- Data e hora
- Tipo (audiência, despacho, sentença)
- Descrição
- Anexos (petições, decisões)
- Próximos passos

**Notificações:**
Configure alertas para:
- Prazos próximos do vencimento
- Novas movimentações
- Tarefas pendentes`,
        video: null
      }
    ]
  },
  {
    id: "colaboracao",
    title: "Colaboração em Equipe",
    icon: Users,
    color: "teal",
    topics: [
      {
        title: "Criando Equipes",
        content: `**Passo a passo:**

1. Vá em Colaboração → Equipes
2. Clique em "Nova Equipe"
3. Dê um nome (ex: "Equipe Trabalhista")
4. Adicione membros por email
5. Defina permissões

**Permissões:**
- **Owner:** Controle total
- **Admin:** Gerenciar membros e processos
- **Member:** Visualizar e editar
- **Viewer:** Apenas visualização`,
        video: null
      },
      {
        title: "Compartilhamento",
        content: `**Compartilhar Processos:**
1. Abra o processo
2. Clique em "Compartilhar"
3. Adicione emails ou selecione equipe
4. Defina nível de acesso
5. Envie convite

**Compartilhar Documentos:**
- Mesma lógica dos processos
- Útil para revisão colaborativa
- Controle de versões automático

**Comentários:**
- Comente em processos e documentos
- Mencione colegas com @nome
- Receba notificações de respostas`,
        video: null
      }
    ]
  },
  {
    id: "avancado",
    title: "Recursos Avançados",
    icon: Code,
    color: "red",
    topics: [
      {
        title: "Integrações",
        content: `**Google Calendar:**
- Sincronize compromissos
- Alertas de audiências
- Bloqueio de horários

**WhatsApp Business:**
- Atendimento ao cliente
- Notificações de processos
- Bot com IA (em breve)

**Email:**
- Integração SMTP
- Templates de email
- Envio automático

**API:**
Plano Enterprise tem acesso à API REST para:
- Integração com sistemas legados
- Automações customizadas
- Relatórios personalizados`,
        video: null
      },
      {
        title: "Monitoramento de Diários",
        content: `**Como funciona:**
Configure palavras-chave (nomes, números de processo) e receba alertas quando aparecerem no Diário Oficial.

**Configuração:**
1. Vá em Ferramentas → Diário Monitor
2. Adicione termos de busca
3. Escolha tribunais/diários
4. Defina frequência de verificação

**Alertas:**
- Email instantâneo
- Notificação no app
- Resumo diário

*Recurso exclusivo do Plano Pro*`,
        video: null
      },
      {
        title: "Relatórios e Analytics",
        content: `**Dashboards Disponíveis:**

**Financeiro:**
- Honorários a receber
- Inadimplência
- Projeção de receita

**Produtividade:**
- Processos por advogado
- Taxa de sucesso
- Tempo médio de resolução

**Operacional:**
- Novos clientes/mês
- Processos ativos por área
- Prazos cumpridos vs. vencidos

**Exportação:**
- PDF para apresentações
- Excel para análise
- Agendamento de envio`,
        video: null
      }
    ]
  }
];

export default function Documentation({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSection, setSelectedSection] = useState("inicio");
  const [selectedTopic, setSelectedTopic] = useState(0);

  const currentSection = documentationSections.find(s => s.id === selectedSection);
  const filteredSections = documentationSections.filter(section =>
    searchTerm === "" || 
    section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.topics.some(topic => 
      topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      topic.content.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className={`min-h-screen ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`border-b ${isDark ? 'bg-black border-neutral-800' : 'bg-white border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-white' : 'bg-gray-900'}`}>
              <Book className={`w-5 h-5 ${isDark ? 'text-black' : 'text-white'}`} />
            </div>
            <div>
              <h1 className={`text-2xl font-light ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Documentação
              </h1>
              <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                Guias completos e tutoriais para dominar o Juris
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-neutral-500' : 'text-gray-400'}`} />
            <Input
              placeholder="Buscar na documentação..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 ${isDark ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-gray-200'}`}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className={`rounded-lg border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'} p-4 sticky top-6`}>
              <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Categorias
              </h3>
              <nav className="space-y-1">
                {filteredSections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => {
                        setSelectedSection(section.id);
                        setSelectedTopic(0);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedSection === section.id
                          ? isDark ? 'bg-white text-black' : 'bg-gray-900 text-white'
                          : isDark ? 'text-neutral-400 hover:bg-neutral-800' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{section.title}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {currentSection && (
              <motion.div
                key={selectedSection}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Section Header */}
                <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}>
                  <CardHeader>
                    <CardTitle className={`flex items-center gap-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {React.createElement(currentSection.icon, { className: "w-6 h-6" })}
                      {currentSection.title}
                    </CardTitle>
                  </CardHeader>
                </Card>

                {/* Topics */}
                <div className="space-y-4">
                  {currentSection.topics.map((topic, index) => (
                    <Card key={index} className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}>
                      <CardHeader>
                        <CardTitle className={`text-lg flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                          {topic.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Video */}
                        {topic.video && (
                          <div className={`rounded-lg border overflow-hidden ${isDark ? 'border-neutral-800 bg-neutral-800' : 'border-gray-200 bg-gray-100'}`}>
                            <div className="aspect-video flex items-center justify-center">
                              <Button variant="ghost" size="lg" className="gap-2">
                                <PlayCircle className="w-8 h-8" />
                                Assistir Tutorial
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Content */}
                        <div className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''}`}>
                          {topic.content.split('\n\n').map((paragraph, i) => {
                            // Bold headers
                            if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                              return (
                                <h4 key={i} className={`font-semibold mt-4 mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  {paragraph.replace(/\*\*/g, '')}
                                </h4>
                              );
                            }
                            
                            // Lists
                            if (paragraph.includes('\n-') || paragraph.includes('\n✓')) {
                              const lines = paragraph.split('\n');
                              return (
                                <div key={i}>
                                  {lines.map((line, j) => {
                                    if (line.startsWith('-') || line.startsWith('✓')) {
                                      return (
                                        <div key={j} className={`flex items-start gap-2 mb-1 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                                          <ChevronRight className="w-4 h-4 mt-1 shrink-0 text-blue-600" />
                                          <span>{line.substring(1).trim()}</span>
                                        </div>
                                      );
                                    }
                                    return <p key={j} className={`mb-2 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>{line}</p>;
                                  })}
                                </div>
                              );
                            }

                            // Code blocks
                            if (paragraph.includes('`')) {
                              return (
                                <p key={i} className={isDark ? 'text-neutral-300' : 'text-gray-700'}>
                                  {paragraph.split('`').map((part, j) => 
                                    j % 2 === 1 ? (
                                      <code key={j} className={`px-1.5 py-0.5 rounded text-sm ${isDark ? 'bg-neutral-800 text-blue-400' : 'bg-gray-100 text-blue-600'}`}>
                                        {part}
                                      </code>
                                    ) : part
                                  )}
                                </p>
                              );
                            }

                            // Regular paragraphs
                            return (
                              <p key={i} className={`mb-3 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                                {paragraph}
                              </p>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Help Section */}
                <Card className={`border-2 ${isDark ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${isDark ? 'bg-blue-900' : 'bg-blue-100'}`}>
                        <HelpCircle className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Precisa de mais ajuda?
                        </h4>
                        <p className={`text-sm mb-4 ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                          Nossa equipe está pronta para ajudar você a aproveitar ao máximo o Juris.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" className="gap-2">
                            <MessageSquare className="w-4 h-4" />
                            Chat de Suporte
                          </Button>
                          <Button size="sm" variant="outline" className="gap-2">
                            <ExternalLink className="w-4 h-4" />
                            Base de Conhecimento
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}