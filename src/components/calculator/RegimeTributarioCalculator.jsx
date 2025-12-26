import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Calculator, Download, Loader2, FileText, TrendingUp, TrendingDown, Info } from "lucide-react";
import { motion } from "framer-motion";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function RegimeTributarioCalculator({ isDark }) {
  const [faturamentoAnual, setFaturamentoAnual] = useState("");
  const [custosMercadorias, setCustosMercadorias] = useState("");
  const [despesasOperacionais, setDespesasOperacionais] = useState("");
  const [atividadeEmpresa, setAtividadeEmpresa] = useState("comercio");
  const [numeroFuncionarios, setNumeroFuncionarios] = useState("");
  const [folhaPagamento, setFolhaPagamento] = useState("");
  const [resultado, setResultado] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [viewMode, setViewMode] = useState("comparison"); // comparison ou detailed

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    toast.info("Fazendo upload do arquivo...");

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      setExtracting(true);
      toast.info("Extraindo dados fiscais com IA...");

      const response = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            faturamento_anual: { type: "number", description: "Faturamento bruto anual total da empresa" },
            custos_mercadorias: { type: "number", description: "Custo total de mercadorias vendidas ou serviços prestados (CMV)" },
            despesas_operacionais: { type: "number", description: "Total de despesas operacionais (aluguel, salários, etc)" },
            folha_pagamento: { type: "number", description: "Total anual da folha de pagamento" },
            numero_funcionarios: { type: "number", description: "Número total de funcionários" }
          }
        }
      });

      if (response.status === "success" && response.output) {
        setFaturamentoAnual(response.output.faturamento_anual?.toString() || "");
        setCustosMercadorias(response.output.custos_mercadorias?.toString() || "");
        setDespesasOperacionais(response.output.despesas_operacionais?.toString() || "");
        setFolhaPagamento(response.output.folha_pagamento?.toString() || "");
        setNumeroFuncionarios(response.output.numero_funcionarios?.toString() || "");
        toast.success("Dados do SPED extraídos com sucesso!");
        
        // Calcular automaticamente
        setTimeout(() => calcular(
          response.output.faturamento_anual,
          response.output.custos_mercadorias,
          response.output.despesas_operacionais
        ), 500);
      } else {
        toast.error("Não foi possível extrair os dados do SPED: " + (response.details || "erro desconhecido"));
      }
    } catch (error) {
      toast.error("Erro ao processar arquivo: " + error.message);
    } finally {
      setUploading(false);
      setExtracting(false);
    }
  };

  const calcular = (fat = null, custos = null, desp = null) => {
    const faturamento = parseFloat(fat || faturamentoAnual) || 0;
    const cmt = parseFloat(custos || custosMercadorias) || 0;
    const despesas = parseFloat(desp || despesasOperacionais) || 0;
    const folha = parseFloat(folhaPagamento) || 0;

    if (!faturamento) {
      toast.error("Informe o faturamento anual");
      return;
    }

    // Percentuais de presunção por atividade
    const percentuaisPresuncao = {
      comercio: 0.08,
      industria: 0.08,
      servicos: 0.32,
      servicos_hospitalares: 0.08,
      transporte_cargas: 0.08,
      profissionais_liberais: 0.32
    };

    const percPresuncao = percentuaisPresuncao[atividadeEmpresa] || 0.08;

    // ========== SIMPLES NACIONAL ==========
    // Anexos: I (Comércio), II (Indústria), III (Serviços), V (Serviços)
    let aliquotaSimples = 0;
    let anexoSimples = "I";
    
    // Fator R para serviços (Folha / Receita)
    const fatorR = faturamento > 0 ? (folha / faturamento) : 0;

    if (atividadeEmpresa === "servicos" || atividadeEmpresa === "profissionais_liberais") {
      anexoSimples = fatorR >= 0.28 ? "III" : "V";
      
      if (anexoSimples === "III") {
        // Anexo III - Serviços com fator R >= 28%
        if (faturamento <= 180000) aliquotaSimples = 6.0;
        else if (faturamento <= 360000) aliquotaSimples = 11.2;
        else if (faturamento <= 720000) aliquotaSimples = 13.5;
        else if (faturamento <= 1800000) aliquotaSimples = 16.0;
        else if (faturamento <= 3600000) aliquotaSimples = 21.0;
        else if (faturamento <= 4800000) aliquotaSimples = 33.0;
      } else {
        // Anexo V - Serviços com fator R < 28%
        if (faturamento <= 180000) aliquotaSimples = 15.5;
        else if (faturamento <= 360000) aliquotaSimples = 18.0;
        else if (faturamento <= 720000) aliquotaSimples = 19.5;
        else if (faturamento <= 1800000) aliquotaSimples = 20.5;
        else if (faturamento <= 3600000) aliquotaSimples = 23.0;
        else if (faturamento <= 4800000) aliquotaSimples = 30.5;
      }
    } else if (atividadeEmpresa === "industria") {
      anexoSimples = "II";
      if (faturamento <= 180000) aliquotaSimples = 4.5;
      else if (faturamento <= 360000) aliquotaSimples = 7.8;
      else if (faturamento <= 720000) aliquotaSimples = 10.0;
      else if (faturamento <= 1800000) aliquotaSimples = 11.2;
      else if (faturamento <= 3600000) aliquotaSimples = 14.7;
      else if (faturamento <= 4800000) aliquotaSimples = 30.0;
    } else {
      // Comércio - Anexo I
      if (faturamento <= 180000) aliquotaSimples = 4.0;
      else if (faturamento <= 360000) aliquotaSimples = 7.3;
      else if (faturamento <= 720000) aliquotaSimples = 9.5;
      else if (faturamento <= 1800000) aliquotaSimples = 10.7;
      else if (faturamento <= 3600000) aliquotaSimples = 14.3;
      else if (faturamento <= 4800000) aliquotaSimples = 19.0;
    }

    const tributosSimples = faturamento * (aliquotaSimples / 100);
    const cargaTributariaSimples = faturamento > 0 ? (tributosSimples / faturamento) * 100 : 0;

    // ========== LUCRO PRESUMIDO ==========
    const basePresumida = faturamento * percPresuncao;
    const irpjPresumido = basePresumida * 0.15;
    const adicionalIrpjPresumido = Math.max(0, basePresumida - 240000) * 0.10;
    const csllPresumida = basePresumida * 0.09;
    const pisPresumido = faturamento * 0.0065;
    const cofinsPresumido = faturamento * 0.03;
    const totalPresumido = irpjPresumido + adicionalIrpjPresumido + csllPresumida + pisPresumido + cofinsPresumido;
    const cargaTributariaPresumido = faturamento > 0 ? (totalPresumido / faturamento) * 100 : 0;

    // ========== LUCRO REAL ==========
    const lucroReal = Math.max(0, faturamento - cmt - despesas);
    const irpjReal = lucroReal * 0.15;
    const adicionalIrpj = Math.max(0, lucroReal - 240000) * 0.10;
    const csllReal = lucroReal * 0.09;
    const pisReal = faturamento * 0.0165;
    const cofinsReal = faturamento * 0.076;
    const totalReal = irpjReal + adicionalIrpj + csllReal + pisReal + cofinsReal;
    const cargaTributariaReal = faturamento > 0 ? (totalReal / faturamento) * 100 : 0;

    // Margem líquida
    const margemLiquidaReal = faturamento > 0 ? ((faturamento - totalReal - cmt - despesas) / faturamento) * 100 : 0;
    const margemLiquidaPresumido = faturamento > 0 ? ((faturamento - totalPresumido - cmt - despesas) / faturamento) * 100 : 0;
    const margemLiquidaSimples = faturamento > 0 ? ((faturamento - tributosSimples - cmt - despesas) / faturamento) * 100 : 0;

    // ========== MELHOR REGIME ==========
    const regimes = [
      { nome: "Simples Nacional", valor: tributosSimples, elegivel: faturamento <= 4800000 && aliquotaSimples > 0, cargaTributaria: cargaTributariaSimples, margemLiquida: margemLiquidaSimples },
      { nome: "Lucro Presumido", valor: totalPresumido, elegivel: faturamento <= 78000000, cargaTributaria: cargaTributariaPresumido, margemLiquida: margemLiquidaPresumido },
      { nome: "Lucro Real", valor: totalReal, elegivel: true, cargaTributaria: cargaTributariaReal, margemLiquida: margemLiquidaReal }
    ];

    const regimesElegiveis = regimes.filter(r => r.elegivel);
    const melhor = regimesElegiveis.reduce((prev, curr) => 
      curr.valor < prev.valor ? curr : prev
    );
    const pior = regimesElegiveis.reduce((prev, curr) => 
      curr.valor > prev.valor ? curr : prev
    );

    setResultado({
      faturamento,
      custosMercadorias: cmt,
      despesasOperacionais: despesas,
      atividade: atividadeEmpresa,
      simplesNacional: {
        tributos: tributosSimples,
        aliquota: aliquotaSimples,
        anexo: anexoSimples,
        fatorR: fatorR,
        elegivel: faturamento <= 4800000 && aliquotaSimples > 0,
        cargaTributaria: cargaTributariaSimples,
        margemLiquida: margemLiquidaSimples,
        detalhamento: {
          irpj: tributosSimples * 0.15,
          csll: tributosSimples * 0.09,
          pis: tributosSimples * 0.03,
          cofins: tributosSimples * 0.12,
          cpp: tributosSimples * 0.28,
          iss_icms: tributosSimples * 0.33
        }
      },
      lucroPresumido: {
        irpj: irpjPresumido + adicionalIrpjPresumido,
        csll: csllPresumida,
        pis: pisPresumido,
        cofins: cofinsPresumido,
        total: totalPresumido,
        elegivel: faturamento <= 78000000,
        basePresuncao: percPresuncao * 100,
        baseCalculoIrpj: basePresumida,
        cargaTributaria: cargaTributariaPresumido,
        margemLiquida: margemLiquidaPresumido
      },
      lucroReal: {
        irpj: irpjReal + adicionalIrpj,
        csll: csllReal,
        pis: pisReal,
        cofins: cofinsReal,
        total: totalReal,
        elegivel: true,
        lucroContabil: lucroReal,
        cargaTributaria: cargaTributariaReal,
        margemLiquida: margemLiquidaReal
      },
      melhorRegime: melhor.nome,
      economia: pior.valor - melhor.valor,
      economiaPercentual: pior.valor > 0 ? ((pior.valor - melhor.valor) / pior.valor) * 100 : 0,
      regimes: regimesElegiveis
    });
  };

  const exportarPDF = () => {
    if (!resultado) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('SIMULAÇÃO DE REGIMES TRIBUTÁRIOS', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, 28, { align: 'center' });
    
    doc.line(15, 32, pageWidth - 15, 32);
    
    let y = 42;
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('DADOS DA EMPRESA', 15, y);
    
    y += 10;
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text(`Faturamento Anual: R$ ${resultado.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 15, y);
    y += 6;
    doc.text(`Custos de Mercadorias: R$ ${resultado.custosMercadorias.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 15, y);
    y += 6;
    doc.text(`Despesas Operacionais: R$ ${resultado.despesasOperacionais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 15, y);
    
    y += 12;
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 150, 0);
    doc.text(`✓ MELHOR REGIME: ${resultado.melhorRegime}`, 15, y);
    y += 6;
    doc.setFontSize(9);
    doc.text(`Economia anual: R$ ${resultado.economia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${resultado.economiaPercentual.toFixed(1)}%)`, 15, y);
    doc.setTextColor(0, 0, 0);
    
    y += 12;
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('COMPARATIVO DETALHADO', 15, y);
    
    y += 10;
    resultado.regimes.forEach((regime) => {
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text(regime.nome, 15, y);
      doc.setFont(undefined, 'normal');
      doc.text(`R$ ${regime.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - 15, y, { align: 'right' });
      y += 5;
      doc.text(`Carga: ${regime.cargaTributaria.toFixed(2)}% | Margem: ${regime.margemLiquida.toFixed(2)}%`, 15, y);
      y += 8;
    });
    
    doc.save('simulacao_regimes_tributarios.pdf');
    toast.success("PDF gerado com sucesso!");
  };

  return (
    <div className="space-y-6">
      {/* Upload SPED */}
      <div className={`p-4 rounded-lg border-2 border-dashed ${isDark ? "border-neutral-700 bg-neutral-900/50" : "border-amber-300 bg-amber-50"}`}>
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <FileText className={`w-6 h-6 ${isDark ? "text-amber-400" : "text-amber-600"}`} />
            <Upload className={`w-6 h-6 ${isDark ? "text-neutral-400" : "text-gray-400"}`} />
          </div>
          <div className="text-center">
            <p className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
              Importar SPED Fiscal
            </p>
            <p className={`text-xs ${isDark ? "text-neutral-500" : "text-gray-600"}`}>
              SPED ECD/ECF, DRE, Balancete, XML NFe - Extração automática por IA
            </p>
          </div>
          <Input
            type="file"
            accept=".xml,.txt,.pdf,.xlsx,.xls,.sped"
            onChange={handleFileUpload}
            disabled={uploading || extracting}
            className={`max-w-xs ${isDark ? "bg-neutral-900 border-neutral-700" : ""}`}
          />
          {(uploading || extracting) && (
            <div className="flex items-center gap-2 text-sm text-amber-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              {uploading ? "Fazendo upload..." : "Extraindo dados do SPED com IA..."}
            </div>
          )}
        </div>
      </div>

      {/* Dados Financeiros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Atividade da Empresa</Label>
          <Select value={atividadeEmpresa} onValueChange={setAtividadeEmpresa}>
            <SelectTrigger className={isDark ? "bg-neutral-900 border-neutral-700" : ""}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="comercio">Comércio</SelectItem>
              <SelectItem value="industria">Indústria</SelectItem>
              <SelectItem value="servicos">Serviços</SelectItem>
              <SelectItem value="servicos_hospitalares">Serviços Hospitalares</SelectItem>
              <SelectItem value="transporte_cargas">Transporte de Cargas</SelectItem>
              <SelectItem value="profissionais_liberais">Profissionais Liberais</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Faturamento Anual (R$)</Label>
          <Input
            type="number"
            value={faturamentoAnual}
            onChange={(e) => setFaturamentoAnual(e.target.value)}
            placeholder="Ex: 2400000"
            className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
          />
        </div>
        
        <div className="space-y-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Custos / CMV (R$)</Label>
          <Input
            type="number"
            value={custosMercadorias}
            onChange={(e) => setCustosMercadorias(e.target.value)}
            placeholder="Ex: 800000"
            className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
          />
        </div>
        
        <div className="space-y-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Despesas Operacionais (R$)</Label>
          <Input
            type="number"
            value={despesasOperacionais}
            onChange={(e) => setDespesasOperacionais(e.target.value)}
            placeholder="Ex: 400000"
            className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
          />
        </div>
        
        <div className="space-y-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>
            Folha de Pagamento Anual (R$)
            <span className={`ml-1 text-xs ${isDark ? "text-neutral-500" : "text-gray-500"}`}>(Para Fator R)</span>
          </Label>
          <Input
            type="number"
            value={folhaPagamento}
            onChange={(e) => setFolhaPagamento(e.target.value)}
            placeholder="Ex: 300000"
            className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
          />
        </div>
        
        <div className="space-y-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>
            Número de Funcionários
            <span className={`ml-1 text-xs ${isDark ? "text-neutral-500" : "text-gray-500"}`}>(Opcional)</span>
          </Label>
          <Input
            type="number"
            value={numeroFuncionarios}
            onChange={(e) => setNumeroFuncionarios(e.target.value)}
            placeholder="Ex: 15"
            className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={() => calcular()} className="flex-1 bg-amber-600 hover:bg-amber-700">
          <Calculator className="w-4 h-4 mr-2" />
          Simular Regimes Tributários
        </Button>
        {resultado && (
          <Button onClick={exportarPDF} variant="outline" className="px-4">
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
        )}
      </div>

      {resultado && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Resumo do Melhor Regime */}
          <div className={`p-6 rounded-lg ${isDark ? "bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-800" : "bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300"}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-600">✓ Regime Mais Vantajoso</p>
                  <p className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                    {resultado.melhorRegime}
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p className={`text-xs ${isDark ? "text-neutral-400" : "text-gray-600"}`}>Economia Anual</p>
                <p className="text-lg font-bold text-green-600">
                  R$ {resultado.economia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-green-600">
                  {resultado.economiaPercentual.toFixed(1)}% a menos em tributos
                </p>
              </div>
              <div>
                <p className={`text-xs ${isDark ? "text-neutral-400" : "text-gray-600"}`}>Margem Líquida Estimada</p>
                <p className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                  {resultado.regimes.find(r => r.nome === resultado.melhorRegime)?.margemLiquida.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>

          {/* Abas de Visualização */}
          <Tabs value={viewMode} onValueChange={setViewMode} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="comparison">Comparação Rápida</TabsTrigger>
              <TabsTrigger value="detailed">Análise Detalhada</TabsTrigger>
            </TabsList>
            
            {/* Comparação Rápida */}
            <TabsContent value="comparison" className="mt-4">
              <div className="grid md:grid-cols-3 gap-4">
                {resultado.simplesNacional.elegivel && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className={`p-5 rounded-lg border-2 ${
                      resultado.melhorRegime === "Simples Nacional"
                        ? isDark ? "bg-green-900/20 border-green-700" : "bg-green-50 border-green-400"
                        : isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                        Simples Nacional
                      </h4>
                      {resultado.melhorRegime === "Simples Nacional" && (
                        <span className="px-2 py-1 text-xs font-semibold bg-green-600 text-white rounded-full">
                          Melhor
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className={`text-xs ${isDark ? "text-neutral-500" : "text-gray-500"}`}>Alíquota Efetiva</p>
                        <p className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                          {resultado.simplesNacional.aliquota}%
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${isDark ? "text-neutral-500" : "text-gray-500"}`}>Anexo</p>
                        <p className={`text-sm ${isDark ? "text-neutral-300" : "text-gray-700"}`}>
                          {resultado.simplesNacional.anexo}
                        </p>
                      </div>
                      {resultado.simplesNacional.fatorR > 0 && (
                        <div>
                          <p className={`text-xs ${isDark ? "text-neutral-500" : "text-gray-500"}`}>Fator R</p>
                          <p className={`text-sm ${isDark ? "text-neutral-300" : "text-gray-700"}`}>
                            {(resultado.simplesNacional.fatorR * 100).toFixed(2)}%
                          </p>
                        </div>
                      )}
                      <div className="pt-3 border-t">
                        <p className={`text-xs ${isDark ? "text-neutral-500" : "text-gray-500"}`}>Total Tributos/Ano</p>
                        <p className="text-xl font-bold text-blue-600">
                          R$ {resultado.simplesNacional.tributos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className={`text-xs ${isDark ? "text-neutral-500" : "text-gray-500"} mt-1`}>
                          Carga: {resultado.simplesNacional.cargaTributaria.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {resultado.lucroPresumido.elegivel && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className={`p-5 rounded-lg border-2 ${
                      resultado.melhorRegime === "Lucro Presumido"
                        ? isDark ? "bg-green-900/20 border-green-700" : "bg-green-50 border-green-400"
                        : isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                        Lucro Presumido
                      </h4>
                      {resultado.melhorRegime === "Lucro Presumido" && (
                        <span className="px-2 py-1 text-xs font-semibold bg-green-600 text-white rounded-full">
                          Melhor
                        </span>
                      )}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className={`text-xs ${isDark ? "text-neutral-500" : "text-gray-500"}`}>Base Presunção</p>
                        <p className={`text-sm ${isDark ? "text-neutral-300" : "text-gray-700"}`}>
                          {resultado.lucroPresumido.basePresuncao}%
                        </p>
                      </div>
                      <div className="flex justify-between">
                        <span className={isDark ? "text-neutral-400" : "text-gray-600"}>IRPJ + CSLL</span>
                        <span className={isDark ? "text-white" : "text-gray-900"}>
                          R$ {(resultado.lucroPresumido.irpj + resultado.lucroPresumido.csll).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isDark ? "text-neutral-400" : "text-gray-600"}>PIS + COFINS</span>
                        <span className={isDark ? "text-white" : "text-gray-900"}>
                          R$ {(resultado.lucroPresumido.pis + resultado.lucroPresumido.cofins).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                      <div className="pt-3 border-t">
                        <p className={`text-xs ${isDark ? "text-neutral-500" : "text-gray-500"}`}>Total Tributos/Ano</p>
                        <p className="text-xl font-bold text-blue-600">
                          R$ {resultado.lucroPresumido.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className={`text-xs ${isDark ? "text-neutral-500" : "text-gray-500"} mt-1`}>
                          Carga: {resultado.lucroPresumido.cargaTributaria.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className={`p-5 rounded-lg border-2 ${
                    resultado.melhorRegime === "Lucro Real"
                      ? isDark ? "bg-green-900/20 border-green-700" : "bg-green-50 border-green-400"
                      : isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                      Lucro Real
                    </h4>
                    {resultado.melhorRegime === "Lucro Real" && (
                      <span className="px-2 py-1 text-xs font-semibold bg-green-600 text-white rounded-full">
                        Melhor
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className={`text-xs ${isDark ? "text-neutral-500" : "text-gray-500"}`}>Lucro Contábil</p>
                      <p className={`text-sm ${isDark ? "text-neutral-300" : "text-gray-700"}`}>
                        R$ {resultado.lucroReal.lucroContabil.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    <div className="flex justify-between">
                      <span className={isDark ? "text-neutral-400" : "text-gray-600"}>IRPJ + CSLL</span>
                      <span className={isDark ? "text-white" : "text-gray-900"}>
                        R$ {(resultado.lucroReal.irpj + resultado.lucroReal.csll).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={isDark ? "text-neutral-400" : "text-gray-600"}>PIS + COFINS</span>
                      <span className={isDark ? "text-white" : "text-gray-900"}>
                        R$ {(resultado.lucroReal.pis + resultado.lucroReal.cofins).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div className="pt-3 border-t">
                      <p className={`text-xs ${isDark ? "text-neutral-500" : "text-gray-500"}`}>Total Tributos/Ano</p>
                      <p className="text-xl font-bold text-blue-600">
                        R$ {resultado.lucroReal.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className={`text-xs ${isDark ? "text-neutral-500" : "text-gray-500"} mt-1`}>
                        Carga: {resultado.lucroReal.cargaTributaria.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </TabsContent>

            {/* Análise Detalhada */}
            <TabsContent value="detailed" className="mt-4 space-y-4">
              <div className={`p-5 rounded-lg ${isDark ? "bg-blue-900/20 border border-blue-800" : "bg-blue-50 border border-blue-200"}`}>
                <div className="flex items-start gap-2 mb-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                      Análise Comparativa Detalhada
                    </h4>
                    <p className={`text-xs ${isDark ? "text-neutral-400" : "text-gray-600"} mt-1`}>
                      Comparação completa de cargas tributárias e margens de lucro líquido por regime
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabela Comparativa */}
              <div className="overflow-x-auto">
                <table className={`w-full text-sm ${isDark ? "text-white" : "text-gray-900"}`}>
                  <thead>
                    <tr className={`border-b-2 ${isDark ? "border-neutral-700" : "border-gray-300"}`}>
                      <th className="text-left py-3 px-2">Regime</th>
                      <th className="text-right py-3 px-2">Tributos Totais</th>
                      <th className="text-right py-3 px-2">Carga Tributária</th>
                      <th className="text-right py-3 px-2">Margem Líquida</th>
                      <th className="text-right py-3 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultado.regimes.map((regime, idx) => (
                      <tr 
                        key={idx}
                        className={`border-b ${isDark ? "border-neutral-800" : "border-gray-200"} ${
                          regime.nome === resultado.melhorRegime 
                            ? isDark ? "bg-green-900/10" : "bg-green-50" 
                            : ""
                        }`}
                      >
                        <td className="py-3 px-2 font-medium">{regime.nome}</td>
                        <td className="text-right py-3 px-2 font-semibold text-blue-600">
                          R$ {regime.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="text-right py-3 px-2">
                          {regime.cargaTributaria.toFixed(2)}%
                        </td>
                        <td className={`text-right py-3 px-2 font-semibold ${
                          regime.margemLiquida > 20 ? "text-green-600" : 
                          regime.margemLiquida > 10 ? "text-amber-600" : "text-red-600"
                        }`}>
                          {regime.margemLiquida.toFixed(2)}%
                        </td>
                        <td className="text-right py-3 px-2">
                          {regime.nome === resultado.melhorRegime ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-green-600 text-white rounded-full">
                              <TrendingUp className="w-3 h-3" /> Melhor
                            </span>
                          ) : (
                            <span className={`text-xs ${isDark ? "text-neutral-500" : "text-gray-500"}`}>
                              +R$ {(regime.valor - resultado.regimes.find(r => r.nome === resultado.melhorRegime).valor).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      )}
    </div>
  );
}