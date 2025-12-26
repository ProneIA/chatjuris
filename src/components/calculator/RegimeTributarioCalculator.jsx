import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, Upload, Download, TrendingUp, TrendingDown, DollarSign, FileText, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { jsPDF } from "jspdf";
import { toast } from "sonner";

export default function RegimeTributarioCalculator({ isDark }) {
  const [arquivo, setArquivo] = useState(null);
  const [processando, setProcessando] = useState(false);
  const [tipoEmpresa, setTipoEmpresa] = useState("servicos");
  const [faturamentoBruto, setFaturamentoBruto] = useState("");
  const [custosMercadorias, setCustosMercadorias] = useState("");
  const [despesasOperacionais, setDespesasOperacionais] = useState("");
  const [folhaPagamento, setFolhaPagamento] = useState("");
  const [aluguel, setAluguel] = useState("");
  const [outrasReceitas, setOutrasReceitas] = useState("");
  const [anexoSimples, setAnexoSimples] = useState("3");
  const [resultados, setResultados] = useState(null);

  const processarSPED = async () => {
    if (!arquivo) {
      toast.error("Selecione um arquivo SPED");
      return;
    }

    setProcessando(true);
    
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: arquivo });
      
      const schema = {
        type: "object",
        properties: {
          faturamento_bruto: { type: "number" },
          custos_mercadorias: { type: "number" },
          despesas_operacionais: { type: "number" },
          folha_pagamento: { type: "number" },
          outras_receitas: { type: "number" }
        }
      };

      const dados = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: schema
      });

      if (dados.status === "success" && dados.output) {
        if (dados.output.faturamento_bruto) setFaturamentoBruto(String(dados.output.faturamento_bruto));
        if (dados.output.custos_mercadorias) setCustosMercadorias(String(dados.output.custos_mercadorias));
        if (dados.output.despesas_operacionais) setDespesasOperacionais(String(dados.output.despesas_operacionais));
        if (dados.output.folha_pagamento) setFolhaPagamento(String(dados.output.folha_pagamento));
        if (dados.output.outras_receitas) setOutrasReceitas(String(dados.output.outras_receitas));
        toast.success("Dados do SPED extraídos com sucesso!");
      } else {
        toast.error("Não foi possível extrair dados do SPED");
      }
    } catch (error) {
      toast.error("Erro ao processar SPED");
    }
    
    setProcessando(false);
  };

  const calcularRegimes = () => {
    const faturamento = parseFloat(faturamentoBruto) || 0;
    const custos = parseFloat(custosMercadorias) || 0;
    const despesas = parseFloat(despesasOperacionais) || 0;
    const folha = parseFloat(folhaPagamento) || 0;
    const aluguelVal = parseFloat(aluguel) || 0;
    const outras = parseFloat(outrasReceitas) || 0;

    if (!faturamento) {
      toast.error("Informe o faturamento bruto");
      return;
    }

    // Validação de limite do Simples Nacional
    const limiteSimplesAnual = 4800000;
    const simplesDisponivel = faturamento <= limiteSimplesAnual;

    // SIMPLES NACIONAL
    let simplesNacional = null;
    if (simplesDisponivel) {
      const tabelasSimples = {
        "1": [ // Comércio
          { ate: 180000, aliquota: 4.0, deduzir: 0 },
          { ate: 360000, aliquota: 7.3, deduzir: 5940 },
          { ate: 720000, aliquota: 9.5, deduzir: 13860 },
          { ate: 1800000, aliquota: 10.7, deduzir: 22500 },
          { ate: 3600000, aliquota: 14.3, deduzir: 87300 },
          { ate: 4800000, aliquota: 19.0, deduzir: 378000 }
        ],
        "3": [ // Serviços
          { ate: 180000, aliquota: 6.0, deduzir: 0 },
          { ate: 360000, aliquota: 11.2, deduzir: 9360 },
          { ate: 720000, aliquota: 13.5, deduzir: 17640 },
          { ate: 1800000, aliquota: 16.0, deduzir: 35640 },
          { ate: 3600000, aliquota: 21.0, deduzir: 125640 },
          { ate: 4800000, aliquota: 33.0, deduzir: 648000 }
        ],
        "5": [ // Serviços (sem substituição)
          { ate: 180000, aliquota: 15.5, deduzir: 0 },
          { ate: 360000, aliquota: 18.0, deduzir: 4500 },
          { ate: 720000, aliquota: 19.5, deduzir: 9900 },
          { ate: 1800000, aliquota: 20.5, deduzir: 17100 },
          { ate: 3600000, aliquota: 23.0, deduzir: 62100 },
          { ate: 4800000, aliquota: 30.5, deduzir: 540000 }
        ]
      };

      const tabela = tabelasSimples[anexoSimples];
      const faixaSimples = tabela.find(f => faturamento <= f.ate) || tabela[tabela.length - 1];
      
      const aliquotaEfetiva = ((faturamento * (faixaSimples.aliquota / 100)) - faixaSimples.deduzir) / faturamento * 100;
      const impostoSimples = faturamento * (aliquotaEfetiva / 100);
      const lucroLiquidoSimples = faturamento - custos - despesas - folha - aluguelVal - impostoSimples;

      simplesNacional = {
        regime: "Simples Nacional",
        anexo: anexoSimples,
        faixaAliquota: faixaSimples.aliquota,
        aliquotaEfetiva: aliquotaEfetiva,
        impostoTotal: impostoSimples,
        lucroLiquido: lucroLiquidoSimples,
        detalhes: {
          "Faturamento Bruto": faturamento,
          "Alíquota Nominal": `${faixaSimples.aliquota}%`,
          "Valor a Deduzir": faixaSimples.deduzir,
          "Alíquota Efetiva": `${aliquotaEfetiva.toFixed(2)}%`,
          "DAS (Imposto Único)": impostoSimples,
          "Lucro Líquido": lucroLiquidoSimples
        }
      };
    }

    // LUCRO PRESUMIDO
    const receitaBruta = faturamento + outras;
    const percentualPresumido = tipoEmpresa === "servicos" ? 32 : 8; // 32% serviços, 8% comércio/indústria
    const baseCalculoPresumido = receitaBruta * (percentualPresumido / 100);
    
    // IRPJ: 15% + adicional 10% sobre o que exceder R$ 20.000/mês
    const irpjPresumido = baseCalculoPresumido * 0.15;
    const adicionalIRPJ = Math.max(0, (baseCalculoPresumido - 240000) * 0.10);
    
    // CSLL: 9%
    const csllPresumido = baseCalculoPresumido * 0.09;
    
    // PIS: 0,65%
    const pisPresumido = receitaBruta * 0.0065;
    
    // COFINS: 3%
    const cofinsPresumido = receitaBruta * 0.03;
    
    // ISS ou ICMS (estimado)
    const issIcmsPresumido = tipoEmpresa === "servicos" 
      ? receitaBruta * 0.05  // ISS 5%
      : receitaBruta * 0.12; // ICMS 12%
    
    const impostoTotalPresumido = irpjPresumido + adicionalIRPJ + csllPresumido + pisPresumido + cofinsPresumido + issIcmsPresumido;
    const lucroLiquidoPresumido = receitaBruta - custos - despesas - folha - aluguelVal - impostoTotalPresumido;

    const lucroPresumido = {
      regime: "Lucro Presumido",
      baseCalculo: baseCalculoPresumido,
      percentualPresumido: percentualPresumido,
      impostoTotal: impostoTotalPresumido,
      lucroLiquido: lucroLiquidoPresumido,
      detalhes: {
        "Receita Bruta": receitaBruta,
        "Base de Cálculo Presumida": baseCalculoPresumido,
        "IRPJ (15%)": irpjPresumido,
        "IRPJ Adicional (10%)": adicionalIRPJ,
        "CSLL (9%)": csllPresumido,
        "PIS (0,65%)": pisPresumido,
        "COFINS (3%)": cofinsPresumido,
        [tipoEmpresa === "servicos" ? "ISS (5%)" : "ICMS (12%)"]: issIcmsPresumido,
        "Total Impostos": impostoTotalPresumido,
        "Lucro Líquido": lucroLiquidoPresumido
      }
    };

    // LUCRO REAL
    const lucroReal = receitaBruta - custos - despesas - folha - aluguelVal;
    
    // IRPJ: 15% + adicional 10%
    const irpjReal = lucroReal * 0.15;
    const adicionalIRPJReal = Math.max(0, (lucroReal - 240000) * 0.10);
    
    // CSLL: 9%
    const csllReal = lucroReal * 0.09;
    
    // PIS não-cumulativo: 1,65%
    const pisReal = receitaBruta * 0.0165;
    
    // COFINS não-cumulativo: 7,6%
    const cofinsReal = receitaBruta * 0.076;
    
    // ISS ou ICMS
    const issIcmsReal = tipoEmpresa === "servicos" 
      ? receitaBruta * 0.05 
      : receitaBruta * 0.12;
    
    const impostoTotalReal = irpjReal + adicionalIRPJReal + csllReal + pisReal + cofinsReal + issIcmsReal;
    const lucroLiquidoReal = receitaBruta - custos - despesas - folha - aluguelVal - impostoTotalReal;

    const lucroRealCalc = {
      regime: "Lucro Real",
      lucroReal: lucroReal,
      impostoTotal: impostoTotalReal,
      lucroLiquido: lucroLiquidoReal,
      detalhes: {
        "Receita Bruta": receitaBruta,
        "(-) Custos": custos,
        "(-) Despesas": despesas,
        "(-) Folha": folha,
        "(-) Aluguel": aluguelVal,
        "Lucro Real": lucroReal,
        "IRPJ (15%)": irpjReal,
        "IRPJ Adicional (10%)": adicionalIRPJReal,
        "CSLL (9%)": csllReal,
        "PIS (1,65%)": pisReal,
        "COFINS (7,6%)": cofinsReal,
        [tipoEmpresa === "servicos" ? "ISS (5%)" : "ICMS (12%)"]: issIcmsReal,
        "Total Impostos": impostoTotalReal,
        "Lucro Líquido": lucroLiquidoReal
      }
    };

    const regimes = [lucroPresumido, lucroRealCalc];
    if (simplesNacional) regimes.unshift(simplesNacional);

    // Ordenar por maior lucro líquido
    regimes.sort((a, b) => b.lucroLiquido - a.lucroLiquido);

    setResultados({
      regimes,
      melhorRegime: regimes[0],
      simplesDisponivel,
      limiteSimplesAnual
    });
  };

  const exportarPDF = () => {
    if (!resultados) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('COMPARATIVO DE REGIMES TRIBUTÁRIOS', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, 28, { align: 'center' });
    
    doc.line(15, 32, pageWidth - 15, 32);
    
    let y = 42;

    resultados.regimes.forEach((regime, index) => {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(regime.regime, 15, y);
      
      if (index === 0) {
        doc.setFontSize(9);
        doc.setTextColor(0, 150, 0);
        doc.text('✓ MAIS VANTAJOSO', pageWidth - 15, y, { align: 'right' });
        doc.setTextColor(0, 0, 0);
      }
      
      y += 8;
      
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      
      Object.entries(regime.detalhes).forEach(([key, value]) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        
        doc.text(key + ':', 20, y);
        const valorTexto = typeof value === 'number' 
          ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
          : value;
        doc.text(valorTexto, pageWidth - 15, y, { align: 'right' });
        y += 6;
      });
      
      y += 8;
      doc.line(15, y, pageWidth - 15, y);
      y += 10;
    });
    
    doc.save('comparativo_regimes_tributarios.pdf');
    toast.success("PDF exportado com sucesso!");
  };

  return (
    <div className="space-y-6">
      {/* Upload SPED */}
      <Card className={isDark ? "bg-neutral-900 border-neutral-800" : "bg-blue-50 border-blue-200"}>
        <CardHeader className="pb-3">
          <CardTitle className={`text-sm flex items-center gap-2 ${isDark ? "text-white" : "text-gray-900"}`}>
            <FileText className="w-4 h-4" />
            Importar SPED Fiscal (Opcional)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              type="file"
              accept=".xml,.txt"
              onChange={(e) => setArquivo(e.target.files[0])}
              className={isDark ? "bg-neutral-800 border-neutral-700" : ""}
            />
            <Button
              onClick={processarSPED}
              disabled={!arquivo || processando}
              variant="outline"
              size="sm"
            >
              <Upload className="w-4 h-4 mr-1" />
              {processando ? "..." : "Extrair"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="dados" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dados">Dados Financeiros</TabsTrigger>
          <TabsTrigger value="config">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="dados" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>
                Faturamento Bruto Anual (R$) *
              </Label>
              <Input
                type="number"
                placeholder="Ex: 1200000"
                value={faturamentoBruto}
                onChange={(e) => setFaturamentoBruto(e.target.value)}
                className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
              />
            </div>

            <div className="space-y-2">
              <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>
                Custos com Mercadorias/Serviços (R$)
              </Label>
              <Input
                type="number"
                placeholder="Ex: 400000"
                value={custosMercadorias}
                onChange={(e) => setCustosMercadorias(e.target.value)}
                className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
              />
            </div>

            <div className="space-y-2">
              <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>
                Despesas Operacionais (R$)
              </Label>
              <Input
                type="number"
                placeholder="Ex: 200000"
                value={despesasOperacionais}
                onChange={(e) => setDespesasOperacionais(e.target.value)}
                className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
              />
            </div>

            <div className="space-y-2">
              <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>
                Folha de Pagamento (R$)
              </Label>
              <Input
                type="number"
                placeholder="Ex: 300000"
                value={folhaPagamento}
                onChange={(e) => setFolhaPagamento(e.target.value)}
                className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
              />
            </div>

            <div className="space-y-2">
              <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>
                Aluguel e Outras Despesas Fixas (R$)
              </Label>
              <Input
                type="number"
                placeholder="Ex: 100000"
                value={aluguel}
                onChange={(e) => setAluguel(e.target.value)}
                className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
              />
            </div>

            <div className="space-y-2">
              <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>
                Outras Receitas (R$)
              </Label>
              <Input
                type="number"
                placeholder="Ex: 50000"
                value={outrasReceitas}
                onChange={(e) => setOutrasReceitas(e.target.value)}
                className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="config" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>
                Tipo de Empresa
              </Label>
              <Select value={tipoEmpresa} onValueChange={setTipoEmpresa}>
                <SelectTrigger className={isDark ? "bg-neutral-900 border-neutral-700" : ""}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="servicos">Prestação de Serviços</SelectItem>
                  <SelectItem value="comercio">Comércio</SelectItem>
                  <SelectItem value="industria">Indústria</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>
                Anexo do Simples Nacional
              </Label>
              <Select value={anexoSimples} onValueChange={setAnexoSimples}>
                <SelectTrigger className={isDark ? "bg-neutral-900 border-neutral-700" : ""}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Anexo I - Comércio</SelectItem>
                  <SelectItem value="3">Anexo III - Serviços</SelectItem>
                  <SelectItem value="5">Anexo V - Serviços (sem substituição)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className={`p-4 rounded-lg ${isDark ? "bg-neutral-800" : "bg-blue-50"}`}>
            <p className={`text-sm ${isDark ? "text-neutral-400" : "text-gray-600"}`}>
              💡 <strong>Dica:</strong> O Simples Nacional possui limite anual de R$ 4,8 milhões. 
              A simulação comparará automaticamente os três regimes disponíveis.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex gap-2">
        <Button 
          onClick={calcularRegimes} 
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          <Calculator className="w-4 h-4 mr-2" />
          Simular Regimes
        </Button>
        {resultados && (
          <Button onClick={exportarPDF} variant="outline" className="px-4">
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>
        )}
      </div>

      {resultados && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {!resultados.simplesDisponivel && (
            <div className={`p-4 rounded-lg border ${isDark ? "bg-amber-900/20 border-amber-800" : "bg-amber-50 border-amber-200"}`}>
              <p className={`text-sm ${isDark ? "text-amber-400" : "text-amber-800"}`}>
                ⚠️ Faturamento acima de R$ 4,8 milhões/ano. Simples Nacional não disponível.
              </p>
            </div>
          )}

          <div className="grid gap-4">
            {resultados.regimes.map((regime, index) => (
              <Card 
                key={regime.regime}
                className={`${
                  index === 0 
                    ? isDark 
                      ? "bg-green-900/20 border-green-800" 
                      : "bg-green-50 border-green-200 border-2"
                    : isDark 
                      ? "bg-neutral-900 border-neutral-800" 
                      : "bg-white border-gray-200"
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className={`text-lg flex items-center gap-2 ${isDark ? "text-white" : "text-gray-900"}`}>
                      <DollarSign className="w-5 h-5" />
                      {regime.regime}
                    </CardTitle>
                    {index === 0 && (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="text-sm font-semibold">MAIS VANTAJOSO</span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(regime.detalhes).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center">
                        <span className={`text-sm ${isDark ? "text-neutral-400" : "text-gray-600"}`}>
                          {key}
                        </span>
                        <span className={`font-semibold ${
                          key.includes("Lucro Líquido") || key.includes("Total")
                            ? isDark ? "text-white" : "text-gray-900"
                            : isDark ? "text-neutral-300" : "text-gray-700"
                        }`}>
                          {typeof value === 'number' 
                            ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                            : value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Indicadores visuais */}
                  <div className="mt-4 pt-4 border-t border-neutral-700">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs ${isDark ? "text-neutral-500" : "text-gray-500"}`}>
                        Carga Tributária Efetiva
                      </span>
                      <span className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                        {((regime.impostoTotal / parseFloat(faturamentoBruto)) * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      {index === 0 ? (
                        <TrendingDown className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingUp className="w-4 h-4 text-red-600" />
                      )}
                      <span className={`text-xs ${isDark ? "text-neutral-400" : "text-gray-600"}`}>
                        {index === 0 
                          ? "Menor carga tributária" 
                          : `R$ ${(regime.impostoTotal - resultados.melhorRegime.impostoTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} a mais em impostos`}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Resumo comparativo */}
          <Card className={isDark ? "bg-neutral-900 border-neutral-800" : "bg-gray-50"}>
            <CardHeader>
              <CardTitle className={`text-sm ${isDark ? "text-white" : "text-gray-900"}`}>
                💰 Economia Anual Estimada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${isDark ? "text-green-400" : "text-green-600"}`}>
                R$ {(resultados.regimes[resultados.regimes.length - 1].impostoTotal - resultados.melhorRegime.impostoTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className={`text-sm mt-1 ${isDark ? "text-neutral-400" : "text-gray-600"}`}>
                Ao optar pelo {resultados.melhorRegime.regime} em vez do regime menos vantajoso
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}