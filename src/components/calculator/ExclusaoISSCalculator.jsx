import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, Download, Upload, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { jsPDF } from "jspdf";
import { toast } from "sonner";

export default function ExclusaoISSCalculator({ isDark }) {
  const [receitaServicos, setReceitaServicos] = useState("");
  const [issPago, setIssPago] = useState("");
  const [periodo, setPeriodo] = useState("60");
  const [arquivo, setArquivo] = useState(null);
  const [processando, setProcessando] = useState(false);
  const [resultado, setResultado] = useState(null);

  const processarArquivo = async () => {
    if (!arquivo) {
      toast.error("Selecione um arquivo SPED Contribuições");
      return;
    }

    setProcessando(true);
    
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: arquivo });
      
      const dados = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            receita_servicos: { type: "number" },
            iss_pago: { type: "number" },
            pis_pago: { type: "number" },
            cofins_pago: { type: "number" }
          }
        }
      });

      if (dados.status === "success" && dados.output) {
        setReceitaServicos(String(dados.output.receita_servicos || ""));
        setIssPago(String(dados.output.iss_pago || ""));
        toast.success("Dados extraídos do SPED!");
      } else {
        toast.error("Não foi possível processar o arquivo");
      }
    } catch (error) {
      toast.error("Erro ao processar arquivo");
    }
    
    setProcessando(false);
  };

  const calcular = () => {
    const receita = parseFloat(receitaServicos) || 0;
    const iss = parseFloat(issPago) || 0;
    const meses = parseInt(periodo) || 60;

    if (!receita || !iss) {
      toast.error("Preencha receita de serviços e ISS pago");
      return;
    }

    // Base ANTES da exclusão do ISS
    const baseAntiga = receita;
    
    // Base DEPOIS da exclusão do ISS
    const baseNova = receita - iss;
    
    // PIS/COFINS pagos (estimativa se não importou)
    const pisPago = receita * 0.0065;
    const cofinsPago = receita * 0.03;
    
    // PIS/COFINS que deveriam ter sido pagos
    const pisDevido = baseNova * 0.0065;
    const cofinsDevida = baseNova * 0.03;
    
    // Recuperação
    const recuperacaoPis = pisPago - pisDevido;
    const recuperacaoCofins = cofinsPago - cofinsDevida;
    const totalRecuperacao = recuperacaoPis + recuperacaoCofins;
    
    // Atualização pela SELIC
    const montanteAtualizado = totalRecuperacao * Math.pow(1.01, meses);
    const juros = montanteAtualizado - totalRecuperacao;
    
    setResultado({
      tipo: "Exclusão do ISS da Base de PIS/COFINS",
      receitaServicos: receita,
      issExcluir: iss,
      baseAntiga,
      baseNova,
      reducaoBase: ((iss / receita) * 100).toFixed(2),
      pisPago,
      cofinsPago,
      pisDevido,
      cofinsDevida,
      recuperacaoPis,
      recuperacaoCofins,
      totalRecuperacao,
      periodoMeses: meses,
      juros,
      totalComJuros: montanteAtualizado,
      base: "Tema 118 do STJ"
    });
  };

  const exportarPDF = () => {
    if (!resultado) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('EXCLUSÃO DO ISS DA BASE DE PIS/COFINS', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, 28, { align: 'center' });
    doc.text(`Período: ${resultado.periodoMeses} meses`, pageWidth / 2, 34, { align: 'center' });
    
    doc.line(15, 38, pageWidth - 15, 38);
    
    let y = 50;
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 150, 0);
    doc.text('TOTAL A RECUPERAR:', 15, y);
    doc.text(`R$ ${resultado.totalComJuros.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - 15, y, { align: 'right' });
    
    doc.save('exclusao_iss.pdf');
    toast.success("PDF gerado com sucesso!");
  };

  return (
    <div className="space-y-6">
      {/* Upload */}
      <div className={`p-4 rounded-lg border ${isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-gray-200"}`}>
        <Label className="mb-2 block">Importar SPED Contribuições (opcional)</Label>
        <div className="flex gap-2">
          <Input
            type="file"
            accept=".xml,.txt,.xlsx,.csv"
            onChange={(e) => setArquivo(e.target.files[0])}
            className={isDark ? "bg-neutral-800 border-neutral-700" : ""}
          />
          <Button
            onClick={processarArquivo}
            disabled={!arquivo || processando}
            variant="outline"
            className="shrink-0"
          >
            <Upload className="w-4 h-4 mr-2" />
            {processando ? "..." : "Importar"}
          </Button>
        </div>
      </div>

      {/* Campos Manuais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Receita de Serviços (R$)</Label>
          <Input
            type="number"
            placeholder="Ex: 500000"
            value={receitaServicos}
            onChange={(e) => setReceitaServicos(e.target.value)}
            className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
          />
        </div>

        <div className="space-y-2">
          <Label>ISS Pago no Período (R$)</Label>
          <Input
            type="number"
            placeholder="Ex: 25000"
            value={issPago}
            onChange={(e) => setIssPago(e.target.value)}
            className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Período de Recuperação</Label>
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className={`w-full px-3 py-2 rounded-lg border ${isDark ? "bg-neutral-900 border-neutral-700 text-white" : "bg-white border-gray-200"}`}
          >
            <option value="12">12 meses (1 ano)</option>
            <option value="24">24 meses (2 anos)</option>
            <option value="36">36 meses (3 anos)</option>
            <option value="48">48 meses (4 anos)</option>
            <option value="60">60 meses (5 anos - prazo máximo)</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={calcular} className="flex-1 bg-teal-600 hover:bg-teal-700">
          <Calculator className="w-4 h-4 mr-2" />
          Calcular Recuperação
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
          className={`p-6 rounded-lg ${isDark ? "bg-neutral-900 border border-neutral-800" : "bg-teal-50 border border-teal-100"}`}
        >
          <h4 className={`font-semibold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>{resultado.tipo}</h4>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white p-3 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Redução da Base</p>
              <p className="text-lg font-bold text-teal-600">{resultado.reducaoBase}%</p>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Período</p>
              <p className="text-lg font-bold">{resultado.periodoMeses} meses</p>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className={isDark ? "text-neutral-400" : "text-gray-600"}>Recuperação PIS</span>
              <span className="font-semibold text-teal-600">
                R$ {resultado.recuperacaoPis.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? "text-neutral-400" : "text-gray-600"}>Recuperação COFINS</span>
              <span className="font-semibold text-teal-600">
                R$ {resultado.recuperacaoCofins.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="font-semibold">Total com Juros SELIC</span>
              <span className="font-bold text-lg text-emerald-600">
                R$ {resultado.totalComJuros.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <p className="text-xs mt-4 text-gray-500">Base legal: {resultado.base}</p>
        </motion.div>
      )}
    </div>
  );
}