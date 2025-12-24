import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Calculator, Download, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

export default function ExclusaoISSCalculator({ isDark }) {
  const [baseCalculoISS, setBaseCalculoISS] = useState("");
  const [aliquotaISS, setAliquotaISS] = useState("5");
  const [aliquotaPIS, setAliquotaPIS] = useState("0.65");
  const [aliquotaCOFINS, setAliquotaCOFINS] = useState("3");
  const [meses, setMeses] = useState("60");
  const [resultado, setResultado] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    toast.info("Fazendo upload da nota fiscal...");

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      setExtracting(true);
      toast.info("Extraindo dados com IA...");

      const response = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            base_calculo_iss: { type: "number", description: "Base de cálculo total do ISS no período" },
            aliquota_iss: { type: "number", description: "Alíquota de ISS aplicada" },
            valor_servicos: { type: "number", description: "Valor total de serviços prestados" }
          }
        }
      });

      if (response.status === "success" && response.output) {
        setBaseCalculoISS(response.output.base_calculo_iss?.toString() || response.output.valor_servicos?.toString() || "");
        setAliquotaISS(response.output.aliquota_iss?.toString() || "5");
        toast.success("Dados extraídos com sucesso!");
        
        // Calcular automaticamente
        setTimeout(() => calcular(
          response.output.base_calculo_iss || response.output.valor_servicos,
          response.output.aliquota_iss
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

  const calcular = (base = null, aliqISS = null) => {
    const baseCalculo = parseFloat(base || baseCalculoISS) || 0;
    const aliqISSNum = parseFloat(aliqISS || aliquotaISS) || 5;
    const aliqPIS = parseFloat(aliquotaPIS) || 0.65;
    const aliqCOFINS = parseFloat(aliquotaCOFINS) || 3;
    const periodo = parseInt(meses) || 60;

    if (!baseCalculo) {
      toast.error("Informe a base de cálculo do ISS");
      return;
    }

    // Valor do ISS destacado
    const valorISS = baseCalculo * (aliqISSNum / 100);

    // Base antiga (com ISS)
    const baseAntiga = baseCalculo;

    // Base nova (sem ISS) - Exclusão do ISS
    const baseNova = baseCalculo - valorISS;

    // PIS/COFINS pagos (base antiga - com ISS)
    const pisPago = baseAntiga * (aliqPIS / 100);
    const cofinsPago = baseAntiga * (aliqCOFINS / 100);

    // PIS/COFINS devidos (base nova - sem ISS)
    const pisDevido = baseNova * (aliqPIS / 100);
    const cofinsDevida = baseNova * (aliqCOFINS / 100);

    // Créditos a recuperar
    const creditoPIS = pisPago - pisDevido;
    const creditoCOFINS = cofinsPago - cofinsDevida;
    const creditoTotal = creditoPIS + creditoCOFINS;

    // Correção SELIC (aproximada: 1% a.m.)
    const selic = 0.01;
    const fatorCorrecao = Math.pow(1 + selic, periodo);
    const creditoCorrigido = creditoTotal * fatorCorrecao;
    const juros = creditoCorrigido - creditoTotal;

    // Economia mensal futura
    const economiaMensal = (pisPago + cofinsPago - pisDevido - cofinsDevida) / periodo;

    setResultado({
      baseAntiga,
      baseNova,
      valorISS,
      pisPago,
      cofinsPago,
      pisDevido,
      cofinsDevida,
      creditoPIS,
      creditoCOFINS,
      creditoTotal,
      periodo,
      creditoCorrigido,
      juros,
      economiaMensal
    });
  };

  const exportarPDF = () => {
    if (!resultado) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('EXCLUSÃO DO ISS DA BASE', pageWidth / 2, 20, { align: 'center' });
    doc.text('PIS/COFINS', pageWidth / 2, 28, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, 36, { align: 'center' });
    doc.text('Tese Análoga ao Tema 69 do STF', pageWidth / 2, 42, { align: 'center' });
    
    doc.line(15, 46, pageWidth - 15, 46);
    
    let y = 56;
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('CRÉDITO TOTAL:', 15, y);
    doc.setTextColor(0, 150, 0);
    doc.text(`R$ ${resultado.creditoCorrigido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - 15, y, { align: 'right' });
    
    doc.save('exclusao_iss_calculo.pdf');
    toast.success("PDF gerado com sucesso!");
  };

  return (
    <div className="space-y-6">
      <div className={`p-4 rounded-lg ${isDark ? "bg-purple-900/20 border border-purple-800" : "bg-purple-50 border border-purple-200"}`}>
        <h3 className="font-semibold text-purple-600 mb-2">🏛️ Exclusão do ISS</h3>
        <p className={`text-sm ${isDark ? "text-neutral-400" : "text-gray-600"}`}>
          Tese análoga ao Tema 69 do STF: O ISS não deve compor a base de cálculo do PIS e COFINS
        </p>
      </div>

      <div className={`p-4 rounded-lg border-2 border-dashed ${isDark ? "border-neutral-700 bg-neutral-900/50" : "border-gray-300 bg-gray-50"}`}>
        <div className="flex flex-col items-center gap-3">
          <Upload className={`w-8 h-8 ${isDark ? "text-neutral-400" : "text-gray-400"}`} />
          <div className="text-center">
            <p className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
              Upload de Notas Fiscais de Serviço
            </p>
            <p className={`text-xs ${isDark ? "text-neutral-500" : "text-gray-500"}`}>
              XML, PDF ou planilha - A IA extrairá os dados automaticamente
            </p>
          </div>
          <Input
            type="file"
            accept=".xml,.pdf,.xlsx,.xls"
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2 md:col-span-2">
          <Label>Base de Cálculo do ISS (R$)</Label>
          <Input
            type="number"
            value={baseCalculoISS}
            onChange={(e) => setBaseCalculoISS(e.target.value)}
            placeholder="Total dos serviços prestados"
            className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
          />
        </div>
        <div className="space-y-2">
          <Label>Alíquota ISS (%)</Label>
          <Input
            type="number"
            value={aliquotaISS}
            onChange={(e) => setAliquotaISS(e.target.value)}
            className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
          />
        </div>
        <div className="space-y-2">
          <Label>Período (meses)</Label>
          <Input
            type="number"
            value={meses}
            onChange={(e) => setMeses(e.target.value)}
            className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
          />
        </div>
        <div className="space-y-2">
          <Label>Alíquota PIS (%)</Label>
          <Input
            type="number"
            value={aliquotaPIS}
            onChange={(e) => setAliquotaPIS(e.target.value)}
            className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
          />
        </div>
        <div className="space-y-2">
          <Label>Alíquota COFINS (%)</Label>
          <Input
            type="number"
            value={aliquotaCOFINS}
            onChange={(e) => setAliquotaCOFINS(e.target.value)}
            className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={() => calcular()} className="flex-1 bg-purple-600 hover:bg-purple-700">
          <Calculator className="w-4 h-4 mr-2" />
          Calcular Créditos
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
          <div className={`p-6 rounded-lg ${isDark ? "bg-green-900/20 border border-green-800" : "bg-green-50 border border-green-200"}`}>
            <p className="text-sm font-medium text-green-600 mb-1">💰 Crédito Total a Recuperar</p>
            <p className={`text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
              R$ {resultado.creditoCorrigido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-green-600 mt-2">
              + Economia mensal futura: R$ {resultado.economiaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className={`p-4 rounded-lg ${isDark ? "bg-neutral-900 border border-neutral-800" : "bg-white border border-gray-200"}`}>
              <h4 className={`font-semibold mb-3 ${isDark ? "text-white" : "text-gray-900"}`}>Comparativo de Bases</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className={isDark ? "text-neutral-500" : "text-gray-500"}>Base Antiga (com ISS)</span>
                  <span className={isDark ? "text-white" : "text-gray-900"}>
                    R$ {resultado.baseAntiga.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? "text-neutral-500" : "text-gray-500"}>ISS Destacado</span>
                  <span className="text-purple-600">
                    R$ {resultado.valorISS.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className={isDark ? "text-neutral-300" : "text-gray-700"}>Base Nova (sem ISS)</span>
                  <span className={isDark ? "text-white" : "text-gray-900"}>
                    R$ {resultado.baseNova.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-lg ${isDark ? "bg-neutral-900 border border-neutral-800" : "bg-white border border-gray-200"}`}>
              <h4 className={`font-semibold mb-3 ${isDark ? "text-white" : "text-gray-900"}`}>Créditos Detalhados</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className={isDark ? "text-neutral-500" : "text-gray-500"}>Crédito PIS</span>
                  <span className="text-blue-600">
                    R$ {resultado.creditoPIS.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? "text-neutral-500" : "text-gray-500"}>Crédito COFINS</span>
                  <span className="text-blue-600">
                    R$ {resultado.creditoCOFINS.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? "text-neutral-500" : "text-gray-500"}>Correção SELIC</span>
                  <span className="text-green-600">
                    R$ {resultado.juros.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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