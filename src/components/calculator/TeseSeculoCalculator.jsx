import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, Download, Upload, FileSpreadsheet, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { jsPDF } from "jspdf";
import { toast } from "sonner";

export default function TeseSeculoCalculator({ isDark }) {
  const [arquivo, setArquivo] = useState(null);
  const [modoManual, setModoManual] = useState(false);
  const [receitaBruta, setReceitaBruta] = useState("");
  const [icmsPago, setIcmsPago] = useState("");
  const [periodo, setPeriodo] = useState("12");
  const [resultado, setResultado] = useState(null);
  const [processando, setProcessando] = useState(false);

  const processarArquivo = async () => {
    if (!arquivo) {
      toast.error("Selecione um arquivo SPED");
      return;
    }

    setProcessando(true);
    
    try {
      // Upload do arquivo
      const { file_url } = await base44.integrations.Core.UploadFile({ file: arquivo });
      
      // Extrair dados com IA
      const dados = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            receita_bruta: { type: "number" },
            icms_total: { type: "number" },
            pis_pago: { type: "number" },
            cofins_pago: { type: "number" }
          }
        }
      });

      if (dados.status === "success" && dados.output) {
        calcularRecuperacao(dados.output.receita_bruta, dados.output.icms_total, dados.output.pis_pago, dados.output.cofins_pago);
      } else {
        toast.error("Não foi possível processar o arquivo. Tente o modo manual.");
        setModoManual(true);
      }
    } catch (error) {
      toast.error("Erro ao processar arquivo");
      setModoManual(true);
    }
    
    setProcessando(false);
  };

  const calcularManual = () => {
    const receita = parseFloat(receitaBruta) || 0;
    const icms = parseFloat(icmsPago) || 0;
    const meses = parseInt(periodo) || 12;

    if (!receita || !icms) {
      toast.error("Preencha receita bruta e ICMS pago");
      return;
    }

    // Estimar PIS/COFINS pagos (lucro presumido)
    const pisPago = receita * 0.0065;
    const cofinsPago = receita * 0.03;

    calcularRecuperacao(receita, icms, pisPago, cofinsPago);
  };

  const calcularRecuperacao = (receita, icms, pisPago, cofinsPago) => {
    // Base ANTES da exclusão do ICMS
    const baseAntiga = receita;
    
    // Base DEPOIS da exclusão do ICMS (Tese do Século)
    const baseNova = receita - icms;
    
    // PIS e COFINS que DEVERIAM ter sido pagos
    const pisDevido = baseNova * 0.0065;
    const cofinsDevida = baseNova * 0.03;
    
    // Recuperação
    const recuperacaoPis = pisPago - pisDevido;
    const recuperacaoCofins = cofinsPago - cofinsDevida;
    const totalRecuperacao = recuperacaoPis + recuperacaoCofins;
    
    // Atualização pela SELIC (1% a.m. aproximado)
    const mesesPassados = parseInt(periodo) || 12;
    const montanteAtualizado = totalRecuperacao * Math.pow(1.01, mesesPassados);
    const juros = montanteAtualizado - totalRecuperacao;
    
    setResultado({
      tipo: "Tese do Século - Exclusão ICMS de PIS/COFINS",
      receitaBruta: receita,
      icmsExcluir: icms,
      baseAntiga,
      baseNova,
      pisPago,
      cofinsP ago,
      pisDevido,
      cofinsDevida,
      recuperacaoPis,
      recuperacaoCofins,
      totalRecuperacao,
      juros,
      totalComJuros: montanteAtualizado,
      base: "RE 574.706 (Tema 69 STF)"
    });
  };

  const exportarPDF = () => {
    if (!resultado) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('TESE DO SÉCULO', pageWidth / 2, 20, { align: 'center' });
    doc.text('Exclusão do ICMS da base de PIS/COFINS', pageWidth / 2, 28, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, 35, { align: 'center' });
    
    doc.line(15, 40, pageWidth - 15, 40);
    
    let y = 50;
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('RECUPERAÇÃO DE CRÉDITOS:', 15, y);
    y += 10;
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    
    doc.text('Recuperação PIS:', 15, y);
    doc.text(`R$ ${resultado.recuperacaoPis.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - 15, y, { align: 'right' });
    y += 8;
    
    doc.text('Recuperação COFINS:', 15, y);
    doc.text(`R$ ${resultado.recuperacaoCofins.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - 15, y, { align: 'right' });
    y += 8;
    
    doc.line(15, y, pageWidth - 15, y);
    y += 8;
    
    doc.setFont(undefined, 'bold');
    doc.text('TOTAL A RECUPERAR:', 15, y);
    doc.text(`R$ ${resultado.totalComJuros.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - 15, y, { align: 'right' });
    
    y += 15;
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text(`Base legal: ${resultado.base}`, 15, y);
    
    doc.save('tese_do_seculo.pdf');
    toast.success("PDF gerado com sucesso!");
  };

  return (
    <div className="space-y-6">
      {/* Upload de Arquivo */}
      {!modoManual && (
        <div className={`p-6 rounded-lg border-2 border-dashed ${isDark ? "bg-neutral-900 border-neutral-700" : "bg-blue-50 border-blue-200"}`}>
          <div className="flex items-center gap-3 mb-4">
            <FileSpreadsheet className="w-8 h-8 text-blue-600" />
            <div>
              <h4 className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                Importar SPED Fiscal ou Contribuições
              </h4>
              <p className="text-sm text-gray-500">
                Upload de arquivo XML, TXT ou planilha com dados fiscais
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            <Input
              type="file"
              accept=".xml,.txt,.xlsx,.csv"
              onChange={(e) => setArquivo(e.target.files[0])}
              className={isDark ? "bg-neutral-800 border-neutral-700" : ""}
            />
            
            <div className="flex gap-2">
              <Button
                onClick={processarArquivo}
                disabled={!arquivo || processando}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Upload className="w-4 h-4 mr-2" />
                {processando ? "Processando..." : "Processar Arquivo"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setModoManual(true)}
              >
                Modo Manual
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modo Manual */}
      {modoManual && (
        <>
          <div className={`p-4 rounded-lg ${isDark ? "bg-amber-900/20 border border-amber-800" : "bg-amber-50 border border-amber-200"}`}>
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className={`text-sm font-medium ${isDark ? "text-amber-400" : "text-amber-800"}`}>
                  Modo Manual Ativado
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  Insira os dados manualmente. Para maior precisão, importe o SPED Fiscal.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Receita Bruta no Período (R$)</Label>
              <Input
                type="number"
                placeholder="Ex: 1000000"
                value={receitaBruta}
                onChange={(e) => setReceitaBruta(e.target.value)}
                className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
              />
            </div>

            <div className="space-y-2">
              <Label>ICMS Total Pago (R$)</Label>
              <Input
                type="number"
                placeholder="Ex: 180000"
                value={icmsPago}
                onChange={(e) => setIcmsPago(e.target.value)}
                className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
              />
            </div>

            <div className="space-y-2">
              <Label>Período (meses retroativos)</Label>
              <select
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${isDark ? "bg-neutral-900 border-neutral-700 text-white" : "bg-white border-gray-200"}`}
              >
                <option value="12">12 meses (1 ano)</option>
                <option value="24">24 meses (2 anos)</option>
                <option value="36">36 meses (3 anos)</option>
                <option value="48">48 meses (4 anos)</option>
                <option value="60">60 meses (5 anos)</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={calcularManual} className="flex-1 bg-purple-600 hover:bg-purple-700">
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
        </>
      )}

      {resultado && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Resultado Principal */}
          <div className="p-6 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
            <h4 className="font-semibold text-lg mb-2">Total a Recuperar</h4>
            <p className="text-4xl font-bold mb-1">
              R$ {resultado.totalComJuros.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm opacity-90">
              Principal: R$ {resultado.totalRecuperacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} + 
              Juros SELIC: R$ {resultado.juros.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>

          {/* Detalhamento */}
          <div className={`p-6 rounded-lg ${isDark ? "bg-neutral-900 border border-neutral-800" : "bg-white border border-gray-200"}`}>
            <h4 className={`font-semibold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>Detalhamento do Cálculo</h4>
            
            <div className="space-y-3">
              <div className="flex justify-between pb-2 border-b border-gray-200">
                <span className={isDark ? "text-neutral-400" : "text-gray-600"}>Receita Bruta</span>
                <span className={isDark ? "text-white" : "text-gray-900"}>
                  R$ {resultado.receitaBruta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              
              <div className="flex justify-between pb-2 border-b border-gray-200">
                <span className={isDark ? "text-neutral-400" : "text-gray-600"}>(-) ICMS a Excluir</span>
                <span className="text-red-600">
                  R$ {resultado.icmsExcluir.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              
              <div className="flex justify-between pb-2 border-b border-gray-200">
                <span className={isDark ? "text-neutral-400" : "text-gray-600"}>= Nova Base de Cálculo</span>
                <span className="text-blue-600 font-semibold">
                  R$ {resultado.baseNova.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">PIS Pago</p>
                  <p className="font-semibold">R$ {resultado.pisPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">PIS Devido</p>
                  <p className="font-semibold text-green-600">R$ {resultado.pisDevido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">COFINS Paga</p>
                  <p className="font-semibold">R$ {resultado.cofinsPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">COFINS Devida</p>
                  <p className="font-semibold text-green-600">R$ {resultado.cofinsDevida.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>

              <div className="bg-emerald-50 p-4 rounded-lg mt-4">
                <div className="flex justify-between mb-1">
                  <span className="font-semibold text-emerald-800">Recuperação PIS</span>
                  <span className="font-bold text-emerald-600">
                    R$ {resultado.recuperacaoPis.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-emerald-800">Recuperação COFINS</span>
                  <span className="font-bold text-emerald-600">
                    R$ {resultado.recuperacaoCofins.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs mt-4 text-gray-500">{resultado.base}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}