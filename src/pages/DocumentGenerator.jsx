import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Save, Loader2, ArrowLeft, FileText, ChevronRight, Check, Scale, Briefcase, Users, FileSignature, Download } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";

const legalAreas = [
  { id: 'civil', name: 'Direito Civil', emoji: '📜' },
  { id: 'penal', name: 'Direito Penal', emoji: '⚖️' },
  { id: 'trabalhista', name: 'Direito Trabalhista', emoji: '👔' },
  { id: 'tributario', name: 'Direito Tributário', emoji: '💰' },
  { id: 'empresarial', name: 'Direito Empresarial', emoji: '🏢' },
  { id: 'consumidor', name: 'Direito do Consumidor', emoji: '🛒' },
  { id: 'familia', name: 'Direito de Família', emoji: '👨‍👩‍👧‍👦' },
  { id: 'previdenciario', name: 'Direito Previdenciário', emoji: '🏥' },
  { id: 'constitucional', name: 'Direito Constitucional', emoji: '🏛️' },
  { id: 'administrativo', name: 'Direito Administrativo', emoji: '🏛️' },
  { id: 'ambiental', name: 'Direito Ambiental', emoji: '🌳' },
  { id: 'eleitoral', name: 'Direito Eleitoral', emoji: '🗳️' },
  { id: 'internacional', name: 'Direito Internacional', emoji: '🌍' },
  { id: 'processual_civil', name: 'Processo Civil', emoji: '📋' },
  { id: 'processual_penal', name: 'Processo Penal', emoji: '⚖️' },
  { id: 'imobiliario', name: 'Direito Imobiliário', emoji: '🏠' },
  { id: 'digital', name: 'Direito Digital', emoji: '💻' },
  { id: 'bancario', name: 'Direito Bancário', emoji: '🏦' },
];

const documentTemplates = [
  {
    id: "peticao",
    name: "Petição Inicial",
    icon: Scale,
    color: "blue",
    fields: [
      { name: "tribunal", label: "Tribunal/Vara", type: "text", placeholder: "Ex: 1ª Vara Cível de São Paulo" },
      { name: "autor", label: "Nome do Autor", type: "text", placeholder: "Nome completo" },
      { name: "reu", label: "Nome do Réu", type: "text", placeholder: "Nome completo" },
      { name: "valor", label: "Valor da Causa", type: "text", placeholder: "R$ 50.000,00" },
      { name: "fatos", label: "Resumo dos Fatos", type: "textarea", placeholder: "Descreva os fatos relevantes..." },
      { name: "pedidos", label: "Pedidos", type: "textarea", placeholder: "Liste os pedidos principais..." }
    ]
  },
  {
    id: "contrato",
    name: "Contrato",
    icon: FileSignature,
    color: "green",
    fields: [
      { name: "tipo_contrato", label: "Tipo de Contrato", type: "select", options: ["Aluguel", "Prestação de Serviços", "Compra e Venda", "Parceria"] },
      { name: "parte1", label: "Primeira Parte (Contratante)", type: "text", placeholder: "Nome e qualificação" },
      { name: "parte2", label: "Segunda Parte (Contratado)", type: "text", placeholder: "Nome e qualificação" },
      { name: "objeto", label: "Objeto do Contrato", type: "textarea", placeholder: "Descreva o que está sendo contratado..." },
      { name: "valor", label: "Valor/Remuneração", type: "text", placeholder: "R$ 5.000,00 mensais" },
      { name: "prazo", label: "Prazo de Vigência", type: "text", placeholder: "12 meses" },
      { name: "clausulas", label: "Cláusulas Especiais", type: "textarea", placeholder: "Cláusulas adicionais..." }
    ]
  },
  {
    id: "procuracao",
    name: "Procuração",
    icon: Users,
    color: "purple",
    fields: [
      { name: "outorgante", label: "Outorgante (quem dá poderes)", type: "text", placeholder: "Nome completo, CPF, endereço" },
      { name: "outorgado", label: "Outorgado (advogado)", type: "text", placeholder: "Nome, OAB" },
      { name: "poderes", label: "Poderes Concedidos", type: "select", options: ["Gerais com cláusula ad judicia", "Específicos para processo", "Poderes especiais"] },
      { name: "processo", label: "Processo (se aplicável)", type: "text", placeholder: "Número do processo" },
      { name: "poderes_extras", label: "Poderes Adicionais", type: "textarea", placeholder: "Poderes específicos..." }
    ]
  },
  {
    id: "recurso",
    name: "Recurso/Apelação",
    icon: Briefcase,
    color: "orange",
    fields: [
      { name: "tipo_recurso", label: "Tipo de Recurso", type: "select", options: ["Apelação", "Agravo de Instrumento", "Embargos de Declaração", "Recurso Especial"] },
      { name: "processo", label: "Número do Processo", type: "text", placeholder: "0000000-00.0000.0.00.0000" },
      { name: "recorrente", label: "Recorrente", type: "text", placeholder: "Nome completo" },
      { name: "recorrido", label: "Recorrido", type: "text", placeholder: "Nome completo" },
      { name: "decisao", label: "Síntese da Decisão Recorrida", type: "textarea", placeholder: "Resuma a decisão que está sendo recorrida..." },
      { name: "fundamentos", label: "Fundamentos do Recurso", type: "textarea", placeholder: "Argumentos jurídicos..." }
    ]
  }
];

export default function DocumentGenerator({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  // Controle de etapas
  const [step, setStep] = useState(1); // 1: Escolher área, 2: Escolher tipo, 3: Preencher dados, 4: Gerar e revisar, 5: Salvar
  const [selectedLegalArea, setSelectedLegalArea] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({});
  const [generatedContent, setGeneratedContent] = useState("");
  const [documentTitle, setDocumentTitle] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Buscar clientes e casos para vincular
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
    enabled: !!user
  });

  const { data: cases = [] } = useQuery({
    queryKey: ['cases'],
    queryFn: () => base44.entities.Case.list(),
    enabled: !!user
  });

  // Geração com IA
  const generateMutation = useMutation({
    mutationFn: async () => {
      const template = documentTemplates.find(t => t.id === selectedTemplate);
      
      // Construir prompt estruturado
      let prompt = `Você é um advogado sênior experiente especializado em ${selectedLegalArea}. Crie um documento jurídico profissional do tipo: ${template.name}.\n\n`;
      prompt += "DADOS FORNECIDOS:\n";
      
      template.fields.forEach(field => {
        if (formData[field.name]) {
          prompt += `${field.label}: ${formData[field.name]}\n`;
        }
      });
      
      prompt += "\n INSTRUÇÕES:\n";
      prompt += "- Use linguagem jurídica formal e técnica\n";
      prompt += "- Estruture com cabeçalho, identificação das partes, fundamentação e conclusão\n";
      prompt += "- Inclua base legal quando relevante\n";
      prompt += "- Use formatação Markdown clara\n";
      prompt += "- Seja completo e profissional\n";

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false
      });
      
      return result;
    },
    onSuccess: (content) => {
      setGeneratedContent(content);
      if (!documentTitle) {
        const template = documentTemplates.find(t => t.id === selectedTemplate);
        setDocumentTitle(`${template.name} - ${new Date().toLocaleDateString()}`);
      }
      setStep(4);
      toast.success("Documento gerado com sucesso!");
    },
    onError: (e) => toast.error("Erro ao gerar: " + e.message)
  });

  // Salvamento
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const doc = await base44.entities.LegalDocument.create({
        title: documentTitle.trim(),
        content: generatedContent,
        type: selectedTemplate,
        status: "draft",
        notes: `Gerado via IA em ${new Date().toLocaleString()}`,
        client_ids: data.client_ids || [],
        case_ids: data.case_ids || []
      });
      return doc;
    },
    onSuccess: () => {
      toast.success("Documento salvo com sucesso!");
      navigate(createPageUrl('Documents'));
    },
    onError: (e) => toast.error("Erro ao salvar: " + e.message)
  });

  // Download em PDF
  const handleDownloadPDF = async () => {
    try {
      toast.info("Preparando PDF...");
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);
      
      // Título
      doc.setFontSize(16);
      doc.text(documentTitle, margin, margin);
      
      // Conteúdo
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(generatedContent, maxWidth);
      let y = margin + 10;
      
      lines.forEach((line) => {
        if (y > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += 6;
      });
      
      doc.save(`${documentTitle}.pdf`);
      toast.success("PDF baixado com sucesso!");
    } catch (error) {
      toast.error("Erro ao gerar PDF: " + error.message);
    }
  };

  // Download em Word (DOCX)
  const handleDownloadWord = () => {
    try {
      const blob = new Blob([generatedContent], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${documentTitle}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Documento Word baixado com sucesso!");
    } catch (error) {
      toast.error("Erro ao gerar Word: " + error.message);
    }
  };

  const handleAreaSelect = (areaName) => {
    setSelectedLegalArea(areaName);
    setStep(2);
  };

  const handleTemplateSelect = (templateId) => {
    setSelectedTemplate(templateId);
    setFormData({});
    setStep(3);
  };

  const handleNext = () => {
    const template = documentTemplates.find(t => t.id === selectedTemplate);
    const requiredFields = template.fields.filter(f => !f.optional);
    const missingFields = requiredFields.filter(f => !formData[f.name]);
    
    if (missingFields.length > 0) {
      toast.error(`Preencha os campos obrigatórios: ${missingFields.map(f => f.label).join(', ')}`);
      return;
    }
    
    generateMutation.mutate();
  };

  const steps = [
    { number: 1, label: "Área Jurídica" },
    { number: 2, label: "Tipo Documento" },
    { number: 3, label: "Preencher Dados" },
    { number: 4, label: "Revisar" },
    { number: 5, label: "Salvar" }
  ];

  return (
    <div className={`min-h-screen p-4 md:p-8 ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className={`text-2xl md:text-3xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <Sparkles className="text-purple-600" /> Gerador de Documentos IA
          </h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
            Crie documentos jurídicos profissionais em etapas simples
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            {steps.map((s, idx) => (
              <div key={s.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center relative flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    step >= s.number 
                      ? 'bg-purple-600 text-white' 
                      : isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-gray-200 text-gray-400'
                  }`}>
                    {step > s.number ? <Check className="w-5 h-5" /> : s.number}
                  </div>
                  <span className={`text-xs mt-2 font-medium ${
                    step >= s.number 
                      ? isDark ? 'text-white' : 'text-gray-900'
                      : isDark ? 'text-neutral-500' : 'text-gray-400'
                  }`}>
                    {s.label}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`h-1 flex-1 mx-2 rounded transition-all ${
                    step > s.number 
                      ? 'bg-purple-600' 
                      : isDark ? 'bg-neutral-800' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {/* STEP 1: Escolher área jurídica */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
                <CardHeader>
                  <CardTitle className={isDark ? 'text-white' : ''}>Escolha a área jurídica</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {legalAreas.map((area) => (
                      <motion.div
                        key={area.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Card 
                          className={`cursor-pointer transition-all border-2 hover:border-purple-500 ${
                            isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white hover:shadow-lg'
                          }`}
                          onClick={() => handleAreaSelect(area.name)}
                        >
                          <CardContent className="p-4 text-center">
                            <div className="text-3xl mb-2">{area.emoji}</div>
                            <p className={`text-xs font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {area.name}
                            </p>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* STEP 2: Escolher tipo de documento */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className={isDark ? 'text-white' : ''}>Escolha o tipo de documento</CardTitle>
                    <Badge className="bg-purple-600">{selectedLegalArea}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {documentTemplates.map((template) => {
                      const Icon = template.icon;
                      const colors = {
                        blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20 hover:border-blue-500',
                        green: 'bg-green-500/10 text-green-500 border-green-500/20 hover:border-green-500',
                        purple: 'bg-purple-500/10 text-purple-500 border-purple-500/20 hover:border-purple-500',
                        orange: 'bg-orange-500/10 text-orange-500 border-orange-500/20 hover:border-orange-500'
                      };
                      
                      return (
                        <motion.div
                          key={template.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Card 
                            className={`cursor-pointer transition-all border-2 ${colors[template.color]} ${
                              isDark ? 'bg-neutral-800' : 'hover:shadow-lg'
                            }`}
                            onClick={() => handleTemplateSelect(template.id)}
                          >
                            <CardContent className="p-6">
                              <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[template.color]}`}>
                                  <Icon className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                  <h3 className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {template.name}
                                  </h3>
                                  <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                                    {template.fields.length} campos
                                  </p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* STEP 3: Preencher dados */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className={isDark ? 'text-white' : ''}>
                      Preencha os dados do documento
                    </CardTitle>
                    <Badge>{documentTemplates.find(t => t.id === selectedTemplate)?.name}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Seleção de cliente para pré-preencher dados */}
                  {clients.length > 0 && (
                    <div className={`p-4 rounded-lg border-2 border-dashed ${isDark ? 'border-purple-700 bg-purple-900/20' : 'border-purple-300 bg-purple-50'}`}>
                      <label className={`text-sm font-semibold mb-2 block ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                        🔗 Pré-preencher com dados do cliente (opcional)
                      </label>
                      <select
                        value={selectedClientId}
                        onChange={(e) => {
                          const clientId = e.target.value;
                          setSelectedClientId(clientId);
                          if (clientId) {
                            const client = clients.find(c => c.id === clientId);
                            if (client) {
                              const qualificacao = [
                                client.name,
                                client.cpf_cnpj ? `CPF/CNPJ: ${client.cpf_cnpj}` : '',
                                client.address || '',
                              ].filter(Boolean).join(', ');
                              // Preenche campos relevantes conforme o template
                              const updates = {};
                              const template = documentTemplates.find(t => t.id === selectedTemplate);
                              template?.fields.forEach(f => {
                                if (['autor', 'outorgante', 'recorrente'].includes(f.name)) updates[f.name] = qualificacao;
                                if (['parte1'].includes(f.name)) updates[f.name] = qualificacao;
                              });
                              setFormData(prev => ({ ...prev, ...updates }));
                            }
                          }
                        }}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          isDark
                            ? 'bg-neutral-800 border-neutral-700 text-white'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <option value="">Selecione um cliente para pré-preencher...</option>
                        {clients.map(c => (
                          <option key={c.id} value={c.id}>{c.name}{c.cpf_cnpj ? ` — ${c.cpf_cnpj}` : ''}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {documentTemplates.find(t => t.id === selectedTemplate)?.fields.map((field) => (
                    <div key={field.name} className="space-y-2">
                      <label className={`text-sm font-medium ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                        {field.label} {!field.optional && <span className="text-red-500">*</span>}
                      </label>
                      {field.type === 'text' && (
                        <Input
                          value={formData[field.name] || ''}
                          onChange={(e) => setFormData({...formData, [field.name]: e.target.value})}
                          placeholder={field.placeholder}
                        />
                      )}
                      {field.type === 'textarea' && (
                        <Textarea
                          value={formData[field.name] || ''}
                          onChange={(e) => setFormData({...formData, [field.name]: e.target.value})}
                          placeholder={field.placeholder}
                          rows={4}
                        />
                      )}
                      {field.type === 'select' && (
                        <select
                          value={formData[field.name] || ''}
                          onChange={(e) => setFormData({...formData, [field.name]: e.target.value})}
                          className={`w-full px-3 py-2 rounded-lg border ${
                            isDark 
                              ? 'bg-neutral-800 border-neutral-700 text-white' 
                              : 'bg-white border-gray-200'
                          }`}
                        >
                          <option value="">Selecione...</option>
                          {field.options.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
                  
                  <div className="flex gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                      Voltar
                    </Button>
                    <Button 
                      onClick={handleNext} 
                      disabled={generateMutation.isPending}
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                    >
                      {generateMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Gerando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Gerar Documento
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* STEP 4: Revisar documento gerado */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
                <CardHeader>
                  <CardTitle className={isDark ? 'text-white' : ''}>Documento Gerado</CardTitle>
                  <p className={`text-sm mt-1 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                    Você pode editar o documento abaixo antes de salvar
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={generatedContent}
                    onChange={(e) => setGeneratedContent(e.target.value)}
                    className={`min-h-[500px] font-mono text-sm ${
                      isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-white border-gray-200'
                    }`}
                    placeholder="O conteúdo do documento aparecerá aqui..."
                  />
                  
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(3)}>
                      Refazer
                    </Button>
                    <Button 
                      onClick={() => setStep(5)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      Continuar para Salvar
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* STEP 5: Salvar */}
          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
                <CardHeader>
                  <CardTitle className={isDark ? 'text-white' : ''}>Finalizar e Salvar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className={`text-sm font-medium ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                      Título do Documento *
                    </label>
                    <Input
                      value={documentTitle}
                      onChange={(e) => setDocumentTitle(e.target.value)}
                      placeholder="Ex: Petição Inicial - Cliente XYZ"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className={`text-sm font-medium ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                      Vincular ao Cliente (opcional)
                    </label>
                    <select
                      onChange={(e) => setFormData({...formData, client_ids: e.target.value ? [e.target.value] : []})}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDark 
                          ? 'bg-neutral-800 border-neutral-700 text-white' 
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <option value="">Nenhum cliente</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className={`text-sm font-medium ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                      Vincular ao Processo (opcional)
                    </label>
                    <select
                      onChange={(e) => setFormData({...formData, case_ids: e.target.value ? [e.target.value] : []})}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDark 
                          ? 'bg-neutral-800 border-neutral-700 text-white' 
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <option value="">Nenhum processo</option>
                      {cases.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex gap-3">
                      <Button 
                        variant="outline"
                        onClick={handleDownloadPDF}
                        className="flex-1"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Baixar PDF
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={handleDownloadWord}
                        className="flex-1"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Baixar Word
                      </Button>
                    </div>
                    
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => setStep(4)}>
                        Voltar
                      </Button>
                      <Button 
                        onClick={() => saveMutation.mutate(formData)}
                        disabled={saveMutation.isPending || !documentTitle.trim()}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        {saveMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Salvar Documento
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}