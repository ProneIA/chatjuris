import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Download } from "lucide-react";
import { motion } from "framer-motion";
import { jsPDF } from "jspdf";
import { toast } from "sonner";

export default function CivilCalculator({ isDark }) {
  const [tipoCalculo, setTipoCalculo] = useState("multa_contratual");
  const [valorContrato, setValorContrato] = useState("");
  const [percentualMulta, setPercentualMulta] = useState("10");
  const [valorParcela, setValorParcela] = useState("");
  const [numeroParcelas, setNumeroParcelas] = useState("");
  const [diasAtraso, setDiasAtraso] = useState("");
  const [resultado, setResultado] = useState(null);

  const calcular = () => {
    const valor = parseFloat(valorContrato) || 0;
    const multa = parseFloat(percentualMulta) || 0;
    const parcela = parseFloat(valorParcela) || 0;
    const numParcelas = parseInt(numeroParcelas) || 0;
    const dias = parseInt(diasAtraso) || 0;

    if (!valor) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    let calc = {};

    switch (tipoCalculo) {
      case "multa_contratual":
        const valorMulta = valor * (multa / 100);
        calc = {
          tipo: "Multa Contratual (Cláusula Penal)",
          valorContrato: valor,
          percentual: multa,
          valorMulta,
          total: valor + valorMulta,
          base: "Art. 408 e 409 do Código Civil"
        };
        break;

      case "parcelas_vencidas":
        const parcelasVencidas = parcela * numParcelas;
        const jurosMora = parcelasVencidas * (dias * 0.0033); // 1% a.m. ≈ 0,033% a.d.
        const correcao = parcelasVencidas * 0.05; // IPCA estimado
        calc = {
          tipo: "Parcelas Vencidas",
          valorParcela: parcela,
          numeroParcelas: numParcelas,
          totalParcelas: parcelasVencidas,
          jurosMora,
          correcao,
          diasAtraso: dias,
          total: parcelasVencidas + jurosMora + correcao,
          base: "Art. 395 do Código Civil"
        };
        break;

      case "dano_material":
        const danoEmergente = parseFloat(valorContrato) || 0;
        const lucroCessante = parseFloat(valorParcela) || 0;
        calc = {
          tipo: "Danos Materiais",
          danoEmergente,
          lucroCessante,
          total: danoEmergente + lucroCessante,
          base: "Art. 402 e 403 do Código Civil"
        };
        break;

      case "pensao_alimenticia":
        const percentualPensao = parseFloat(percentualMulta) || 30;
        const rendaAlimentante = parseFloat(valorContrato) || 0;
        const valorPensao = rendaAlimentante * (percentualPensao / 100);
        calc = {
          tipo: "Pensão Alimentícia",
          rendaAlimentante,
          percentual: percentualPensao,
          valorMensal: valorPensao,
          valorAnual: valorPensao * 12,
          base: "Art. 1.694 do Código Civil"
        };
        break;

      case "partilha_bens":
        const totalBens = parseFloat(valorContrato) || 0;
        const meacao = totalBens / 2;
        const numHerdeiros = parseInt(numeroParcelas) || 2;
        const quinhao = meacao / numHerdeiros;
        calc = {
          tipo: "Partilha de Bens",
          totalBens,
          meacao,
          numHerdeiros,
          quinhao,
          base: "Art. 1.829 do Código Civil"
        };
        break;

      default:
        return;
    }

    setResultado(calc);
  };

  const exportarPDF = () => {
    if (!resultado) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('CÁLCULO - DIREITO CIVIL', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, 28, { align: 'center' });
    
    doc.line(15, 32, pageWidth - 15, 32);
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text(resultado.tipo, 15, 42);
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text(`Base legal: ${resultado.base}`, 15, 50);
    
    let y = 60;
    Object.entries(resultado).forEach(([key, value]) => {
      if (key !== 'tipo' && key !== 'base' && typeof value !== 'object') {
        const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
        doc.text(`${label}:`, 15, y);
        const formattedValue = typeof value === 'number' 
          ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
          : value;
        doc.text(String(formattedValue), pageWidth - 15, y, { align: 'right' });
        y += 7;
      }
    });
    
    doc.save('calculo_civil.pdf');
    toast.success("PDF gerado com sucesso!");
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2 md:col-span-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Tipo de Cálculo</Label>
          <Select value={tipoCalculo} onValueChange={setTipoCalculo}>
            <SelectTrigger className={isDark ? "bg-neutral-900 border-neutral-700" : ""}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="multa_contratual">Multa Contratual (Cláusula Penal)</SelectItem>
              <SelectItem value="parcelas_vencidas">Parcelas Vencidas e Vincendas</SelectItem>
              <SelectItem value="dano_material">Danos Materiais (Emergente + Lucro Cessante)</SelectItem>
              <SelectItem value="pensao_alimenticia">Pensão Alimentícia</SelectItem>
              <SelectItem value="partilha_bens">Partilha de Bens (Meação e Quinhão)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {tipoCalculo === "multa_contratual" && (
          <>
            <div className="space-y-2">
              <Label>Valor do Contrato (R$)</Label>
              <Input
                type="number"
                value={valorContrato}
                onChange={(e) => setValorContrato(e.target.value)}
                className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label>Percentual da Multa (%)</Label>
              <Input
                type="number"
                value={percentualMulta}
                onChange={(e) => setPercentualMulta(e.target.value)}
                className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
              />
            </div>
          </>
        )}

        {tipoCalculo === "parcelas_vencidas" && (
          <>
            <div className="space-y-2">
              <Label>Valor da Parcela (R$)</Label>
              <Input
                type="number"
                value={valorParcela}
                onChange={(e) => setValorParcela(e.target.value)}
                className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label>Número de Parcelas Vencidas</Label>
              <Input
                type="number"
                value={numeroParcelas}
                onChange={(e) => setNumeroParcelas(e.target.value)}
                className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label>Dias em Atraso</Label>
              <Input
                type="number"
                value={diasAtraso}
                onChange={(e) => setDiasAtraso(e.target.value)}
                className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
              />
            </div>
          </>
        )}

        {tipoCalculo === "dano_material" && (
          <>
            <div className="space-y-2">
              <Label>Dano Emergente (R$)</Label>
              <Input
                type="number"
                value={valorContrato}
                onChange={(e) => setValorContrato(e.target.value)}
                placeholder="Prejuízo efetivo"
                className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label>Lucro Cessante (R$)</Label>
              <Input
                type="number"
                value={valorParcela}
                onChange={(e) => setValorParcela(e.target.value)}
                placeholder="Lucro que deixou de ganhar"
                className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
              />
            </div>
          </>
        )}

        {tipoCalculo === "pensao_alimenticia" && (
          <>
            <div className="space-y-2">
              <Label>Renda do Alimentante (R$)</Label>
              <Input
                type="number"
                value={valorContrato}
                onChange={(e) => setValorContrato(e.target.value)}
                className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label>Percentual da Pensão (%)</Label>
              <Input
                type="number"
                value={percentualMulta}
                onChange={(e) => setPercentualMulta(e.target.value)}
                placeholder="Ex: 30"
                className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
              />
            </div>
          </>
        )}

        {tipoCalculo === "partilha_bens" && (
          <>
            <div className="space-y-2">
              <Label>Total de Bens (R$)</Label>
              <Input
                type="number"
                value={valorContrato}
                onChange={(e) => setValorContrato(e.target.value)}
                className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label>Número de Herdeiros</Label>
              <Input
                type="number"
                value={numeroParcelas}
                onChange={(e) => setNumeroParcelas(e.target.value)}
                placeholder="Ex: 2"
                className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
              />
            </div>
          </>
        )}
      </div>

      <div className="flex gap-2">
        <Button onClick={calcular} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
          <Calculator className="w-4 h-4 mr-2" />
          Calcular
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
          className={`p-6 rounded-lg ${isDark ? "bg-neutral-900 border border-neutral-800" : "bg-indigo-50 border border-indigo-100"}`}
        >
          <h4 className={`font-semibold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>{resultado.tipo}</h4>
          <p className={`text-xs mb-4 ${isDark ? "text-neutral-500" : "text-gray-500"}`}>{resultado.base}</p>
          <div className="space-y-2">
            {Object.entries(resultado)
              .filter(([key]) => key !== 'tipo' && key !== 'base')
              .map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className={isDark ? "text-neutral-400" : "text-gray-600"}>
                    {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                  </span>
                  <span className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                    {typeof value === 'number' 
                      ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                      : value}
                  </span>
                </div>
              ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}