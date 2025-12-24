import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Download } from "lucide-react";
import { motion } from "framer-motion";
import { jsPDF } from "jspdf";
import { toast } from "sonner";

export default function PenalCalculator({ isDark }) {
  const [tipoCalculo, setTipoCalculo] = useState("dosimetria");
  const [penaBase, setPenaBase] = useState("");
  const [agravantes, setAgravantes] = useState("0");
  const [atenuantes, setAtenuantes] = useState("0");
  const [causasAumento, setCausasAumento] = useState("0");
  const [causasDiminuicao, setCausasDiminuicao] = useState("0");
  const [penaTotal, setPenaTotal] = useState("");
  const [tempoTrabalhado, setTempoTrabalhado] = useState("");
  const [tempoEstudado, setTempoEstudado] = useState("");
  const [resultado, setResultado] = useState(null);

  const calcular = () => {
    if (tipoCalculo === "dosimetria") {
      const base = parseInt(penaBase) || 0;
      const agrav = parseInt(agravantes) || 0;
      const aten = parseInt(atenuantes) || 0;
      const aumento = parseFloat(causasAumento) || 0;
      const diminui = parseFloat(causasDiminuicao) || 0;

      if (!base) {
        toast.error("Informe a pena-base");
        return;
      }

      // 1ª Fase: Pena-base (art. 59 CP)
      let pena1Fase = base;

      // 2ª Fase: Agravantes e atenuantes (art. 61-66 CP)
      const saldoCircunstancias = agrav - aten;
      let pena2Fase = pena1Fase;
      
      if (saldoCircunstancias > 0) {
        pena2Fase = pena1Fase + (saldoCircunstancias * 2); // +2 meses por agravante
      } else if (saldoCircunstancias < 0) {
        pena2Fase = Math.max(base, pena1Fase + (saldoCircunstancias * 2));
      }

      // 3ª Fase: Causas de aumento/diminuição
      let pena3Fase = pena2Fase;
      if (aumento > 0) {
        pena3Fase = pena2Fase * (1 + aumento / 100);
      }
      if (diminui > 0) {
        pena3Fase = pena3Fase * (1 - diminui / 100);
      }

      const penaFinal = Math.round(pena3Fase);

      // Regime inicial (art. 33 CP)
      let regime = "semiaberto";
      if (penaFinal >= 96) regime = "fechado"; // > 8 anos
      else if (penaFinal >= 48) regime = "semiaberto"; // 4 a 8 anos
      else regime = "aberto"; // < 4 anos

      setResultado({
        tipo: "Dosimetria da Pena",
        penaBase: base,
        pena1Fase,
        agravantes: agrav,
        atenuantes: aten,
        pena2Fase,
        causasAumento: aumento,
        causasDiminuicao: diminui,
        penaFinal,
        anos: Math.floor(penaFinal / 12),
        meses: penaFinal % 12,
        regime,
        base: "Arts. 59, 61-66 e 68 do Código Penal"
      });
    } else if (tipoCalculo === "progressao") {
      const total = parseInt(penaTotal) || 0;
      const trabalho = parseInt(tempoTrabalhado) || 0;
      const estudo = parseInt(tempoEstudado) || 0;

      if (!total) {
        toast.error("Informe a pena total");
        return;
      }

      // Requisito temporal para progressão (art. 112, LEP)
      const requisito = Math.ceil(total * 0.16); // 1/6 ou 16%
      
      // Remição pelo trabalho: 3 dias trabalhados = 1 dia remido
      const remicaoTrabalho = Math.floor(trabalho / 3);
      
      // Remição pelo estudo: 12h estudo = 1 dia remido
      const remicaoEstudo = Math.floor(estudo / 12);
      
      const totalRemido = remicaoTrabalho + remicaoEstudo;
      const penaRestante = Math.max(0, total - totalRemido);
      
      setResultado({
        tipo: "Progressão de Regime / Remição",
        penaTotal: total,
        requisito,
        diasTrabalhados: trabalho,
        diasEstudados: estudo,
        remicaoTrabalho,
        remicaoEstudo,
        totalRemido,
        penaRestante,
        anos: Math.floor(penaRestante / 365),
        dias: penaRestante % 365,
        base: "Arts. 112 e 126 da Lei de Execução Penal"
      });
    }
  };

  const exportarPDF = () => {
    if (!resultado) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('CÁLCULO - DIREITO PENAL', pageWidth / 2, 20, { align: 'center' });
    
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
    
    doc.save('calculo_penal.pdf');
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
              <SelectItem value="dosimetria">Dosimetria da Pena (3 fases)</SelectItem>
              <SelectItem value="progressao">Progressão de Regime / Remição</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {tipoCalculo === "dosimetria" && (
          <>
            <div className="space-y-2 md:col-span-2">
              <Label>Pena-Base (meses)</Label>
              <Input
                type="number"
                value={penaBase}
                onChange={(e) => setPenaBase(e.target.value)}
                placeholder="Ex: 24"
                className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label>Agravantes (quantidade)</Label>
              <Input
                type="number"
                value={agravantes}
                onChange={(e) => setAgravantes(e.target.value)}
                className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label>Atenuantes (quantidade)</Label>
              <Input
                type="number"
                value={atenuantes}
                onChange={(e) => setAtenuantes(e.target.value)}
                className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label>Causa de Aumento (%)</Label>
              <Input
                type="number"
                value={causasAumento}
                onChange={(e) => setCausasAumento(e.target.value)}
                placeholder="Ex: 50"
                className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label>Causa de Diminuição (%)</Label>
              <Input
                type="number"
                value={causasDiminuicao}
                onChange={(e) => setCausasDiminuicao(e.target.value)}
                placeholder="Ex: 33.33"
                className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
              />
            </div>
          </>
        )}

        {tipoCalculo === "progressao" && (
          <>
            <div className="space-y-2">
              <Label>Pena Total (dias)</Label>
              <Input
                type="number"
                value={penaTotal}
                onChange={(e) => setPenaTotal(e.target.value)}
                placeholder="Ex: 730"
                className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label>Dias Trabalhados</Label>
              <Input
                type="number"
                value={tempoTrabalhado}
                onChange={(e) => setTempoTrabalhado(e.target.value)}
                className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label>Horas de Estudo</Label>
              <Input
                type="number"
                value={tempoEstudado}
                onChange={(e) => setTempoEstudado(e.target.value)}
                className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
              />
            </div>
          </>
        )}
      </div>

      <div className="flex gap-2">
        <Button onClick={calcular} className="flex-1 bg-red-600 hover:bg-red-700">
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
          className={`p-6 rounded-lg ${isDark ? "bg-neutral-900 border border-neutral-800" : "bg-red-50 border border-red-100"}`}
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
                    {value}
                  </span>
                </div>
              ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}