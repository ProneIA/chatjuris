import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Calculator, Download, Loader2, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

export default function RegimeTributarioCalculator({ isDark }) {
  const [faturamentoAnual, setFaturamentoAnual] = useState("");
  const [custosMercadorias, setCustosMercadorias] = useState("");
  const [despesasOperacionais, setDespesasOperacionais] = useState("");
  const [resultado, setResultado] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);

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
            faturamento_anual: { type: "number", description: "Faturamento bruto anual total" },
            custos_mercadorias: { type: "number", description: "Custo total de mercadorias vendidas" },
            despesas_operacionais: { type: "number", description: "Total de despesas operacionais" }
          }
        }
      });

      if (response.status === "success" && response.output) {
        setFaturamentoAnual(response.output.faturamento_anual?.toString() || "");
        setCustosMercadorias(response.output.custos_mercadorias?.toString() || "");
        setDespesasOperacionais(response.output.despesas_operacionais?.toString() || "");
        toast.success("Dados extraídos com sucesso!");
        
        // Calcular automaticamente
        setTimeout(() => calcular(
          response.output.faturamento_anual,
          response.output.custos_mercadorias,
          response.output.despesas_operacionais
        ), 500);
      } else {
        toast.error("Não foi possível extrair os dados: " + (response.details || "erro desconhecido"));
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

    if (!faturamento) {
      toast.error("Informe o faturamento anual");
      return;
    }

    // Simples Nacional
    let aliquotaSimples = 0;
    if (faturamento <= 180000) aliquotaSimples = 4.0;
    else if (faturamento <= 360000) aliquotaSimples = 7.3;
    else if (faturamento <= 720000) aliquotaSimples = 9.5;
    else if (faturamento <= 1800000) aliquotaSimples = 10.7;
    else if (faturamento <= 3600000) aliquotaSimples = 14.3;
    else if (faturamento <= 4800000) aliquotaSimples = 19.0;
    else aliquotaSimples = 0; // Acima do limite

    const tributosSimples = faturamento * (aliquotaSimples / 100);

    // Lucro Presumido
    const basePresumida = faturamento * 0.08; // 8% para comércio
    const irpjPresumido = basePresumida * 0.15;
    const csllPresumida = basePresumida * 0.09;
    const pisPresumido = faturamento * 0.0065;
    const cofinsPresumido = faturamento * 0.03;
    const totalPresumido = irpjPresumido + csllPresumida + pisPresumido + cofinsPresumido;

    // Lucro Real
    const lucroReal = Math.max(0, faturamento - cmt - despesas);
    const irpjReal = lucroReal * 0.15;
    const adicionalIrpj = Math.max(0, lucroReal - 240000) * 0.10;
    const csllReal = lucroReal * 0.09;
    const pisReal = faturamento * 0.0165;
    const cofinsReal = faturamento * 0.076;
    const totalReal = irpjReal + adicionalIrpj + csllReal + pisReal + cofinsReal;

    // Melhor regime
    const regimes = [
      { nome: "Simples Nacional", valor: tributosSimples, elegivel: faturamento <= 4800000 },
      { nome: "Lucro Presumido", valor: totalPresumido, elegivel: faturamento <= 78000000 },
      { nome: "Lucro Real", valor: totalReal, elegivel: true }
    ];

    const melhor = regimes.filter(r => r.elegivel).reduce((prev, curr) => 
      curr.valor < prev.valor ? curr : prev
    );

    setResultado({
      faturamento,
      simplesNacional: {
        tributos: tributosSimples,
        aliquota: aliquotaSimples,
        elegivel: faturamento <= 4800000
      },
      lucroPresumido: {
        irpj: irpjPresumido,
        csll: csllPresumida,
        pis: pisPresumido,
        cofins: cofinsPresumido,
        total: totalPresumido,
        elegivel: faturamento <= 78000000
      },
      lucroReal: {
        irpj: irpjReal + adicionalIrpj,
        csll: csllReal,
        pis: pisReal,
        cofins: cofinsReal,
        total: totalReal,
        elegivel: true
      },
      melhorRegime: melhor.nome,
      economia: regimes.filter(r => r.elegivel).reduce((max, r) => Math.max(max, r.valor), 0) - melhor.valor
    });
  };

  const exportarPDF = () => {
    if (!resultado) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('COMPARAÇÃO DE REGIMES TRIBUTÁRIOS', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, 28, { align: 'center' });
    
    doc.line(15, 32, pageWidth - 15, 32);
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text(`Faturamento Anual: R$ ${resultado.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 15, 42);
    
    let y = 52;
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('MELHOR REGIME:', 15, y);
    doc.setTextColor(0, 150, 0);
    doc.text(resultado.melhorRegime, 60, y);
    doc.setTextColor(0, 0, 0);
    
    doc.save('comparacao_regimes.pdf');
    toast.success("PDF gerado com sucesso!");
  };

  return (
    <div className="space-y-6">
      <div className={`p-4 rounded-lg border-2 border-dashed ${isDark ? "border-neutral-700 bg-neutral-900/50" : "border-gray-300 bg-gray-50"}`}>
        <div className="flex flex-col items-center gap-3">
          <Upload className={`w-8 h-8 ${isDark ? "text-neutral-400" : "text-gray-400"}`} />
          <div className="text-center">
            <p className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
              Upload de Arquivo Fiscal
            </p>
            <p className={`text-xs ${isDark ? "text-neutral-500" : "text-gray-500"}`}>
              SPED, DRE, Balancete ou XML - A IA extrairá os dados automaticamente
            </p>
          </div>
          <Input
            type="file"
            accept=".xml,.txt,.pdf,.xlsx,.xls"
            onChange={handleFileUpload}
            disabled={uploading || extracting}
            className="max-w-xs"
          />
          {(uploading || extracting) && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              {uploading ? "Fazendo upload..." : "Extraindo dados com IA..."}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Faturamento Anual (R$)</Label>
          <Input
            type="number"
            value={faturamentoAnual}
            onChange={(e) => setFaturamentoAnual(e.target.value)}
            placeholder="Ex: 2400000"
            className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
          />
        </div>
        <div className="space-y-2">
          <Label>Custos de Mercadorias (R$)</Label>
          <Input
            type="number"
            value={custosMercadorias}
            onChange={(e) => setCustosMercadorias(e.target.value)}
            placeholder="Ex: 800000"
            className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
          />
        </div>
        <div className="space-y-2">
          <Label>Despesas Operacionais (R$)</Label>
          <Input
            type="number"
            value={despesasOperacionais}
            onChange={(e) => setDespesasOperacionais(e.target.value)}
            placeholder="Ex: 400000"
            className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={() => calcular()} className="flex-1 bg-yellow-600 hover:bg-yellow-700">
          <Calculator className="w-4 h-4 mr-2" />
          Comparar Regimes
        </Button>
        {resultado && (
          <Button onClick={exportarPDF} variant="outline" className="px-4">
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>
        )}
      </div>

      {resultado && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className={`p-4 rounded-lg ${isDark ? "bg-green-900/20 border border-green-800" : "bg-green-50 border border-green-200"}`}>
            <p className="text-sm font-medium text-green-600 mb-1">✓ Melhor Regime</p>
            <p className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
              {resultado.melhorRegime}
            </p>
            <p className="text-sm text-green-600 mt-2">
              Economia de R$ {resultado.economia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} por ano
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {resultado.simplesNacional.elegivel && (
              <div className={`p-4 rounded-lg ${isDark ? "bg-neutral-900 border border-neutral-800" : "bg-white border border-gray-200"}`}>
                <h4 className={`font-semibold mb-3 ${isDark ? "text-white" : "text-gray-900"}`}>
                  Simples Nacional
                </h4>
                <div className="space-y-2">
                  <div>
                    <p className={`text-xs ${isDark ? "text-neutral-500" : "text-gray-500"}`}>Alíquota</p>
                    <p className={isDark ? "text-white" : "text-gray-900"}>{resultado.simplesNacional.aliquota}%</p>
                  </div>
                  <div>
                    <p className={`text-xs ${isDark ? "text-neutral-500" : "text-gray-500"}`}>Total Tributos</p>
                    <p className="font-bold text-blue-600">
                      R$ {resultado.simplesNacional.tributos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {resultado.lucroPresumido.elegivel && (
              <div className={`p-4 rounded-lg ${isDark ? "bg-neutral-900 border border-neutral-800" : "bg-white border border-gray-200"}`}>
                <h4 className={`font-semibold mb-3 ${isDark ? "text-white" : "text-gray-900"}`}>
                  Lucro Presumido
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className={isDark ? "text-neutral-400" : "text-gray-600"}>IRPJ</span>
                    <span className={isDark ? "text-white" : "text-gray-900"}>
                      R$ {resultado.lucroPresumido.irpj.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isDark ? "text-neutral-400" : "text-gray-600"}>CSLL</span>
                    <span className={isDark ? "text-white" : "text-gray-900"}>
                      R$ {resultado.lucroPresumido.csll.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isDark ? "text-neutral-400" : "text-gray-600"}>PIS</span>
                    <span className={isDark ? "text-white" : "text-gray-900"}>
                      R$ {resultado.lucroPresumido.pis.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isDark ? "text-neutral-400" : "text-gray-600"}>COFINS</span>
                    <span className={isDark ? "text-white" : "text-gray-900"}>
                      R$ {resultado.lucroPresumido.cofins.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="pt-2 border-t flex justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-blue-600">
                      R$ {resultado.lucroPresumido.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className={`p-4 rounded-lg ${isDark ? "bg-neutral-900 border border-neutral-800" : "bg-white border border-gray-200"}`}>
              <h4 className={`font-semibold mb-3 ${isDark ? "text-white" : "text-gray-900"}`}>
                Lucro Real
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className={isDark ? "text-neutral-400" : "text-gray-600"}>IRPJ</span>
                  <span className={isDark ? "text-white" : "text-gray-900"}>
                    R$ {resultado.lucroReal.irpj.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? "text-neutral-400" : "text-gray-600"}>CSLL</span>
                  <span className={isDark ? "text-white" : "text-gray-900"}>
                    R$ {resultado.lucroReal.csll.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? "text-neutral-400" : "text-gray-600"}>PIS</span>
                  <span className={isDark ? "text-white" : "text-gray-900"}>
                    R$ {resultado.lucroReal.pis.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? "text-neutral-400" : "text-gray-600"}>COFINS</span>
                  <span className={isDark ? "text-white" : "text-gray-900"}>
                    R$ {resultado.lucroReal.cofins.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="pt-2 border-t flex justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-blue-600">
                    R$ {resultado.lucroReal.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}