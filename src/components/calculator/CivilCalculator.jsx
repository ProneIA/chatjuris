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
  const [mesesAtraso, setMesesAtraso] = useState("");
  const [lucrosCessantes, setLucrosCessantes] = useState("");
  const [danoEmergente, setDanoemergente] = useState("");
  const [resultado, setResultado] = useState(null);

  const calcular = () => {
    const valor = parseFloat(valorContrato) || 0;
    const perc = parseFloat(percentualMulta) || 0;
    const meses = parseInt(mesesAtraso) || 0;
    const lucros = parseFloat(lucrosCessantes) || 0;
    const dano = parseFloat(danoEmergente) || 0;

    if (!valor) {
      toast.error("Informe o valor do contrato");
      return;
    }

    let resultado = {};

    switch (tipoCalculo) {
      case "multa_contratual":
        // Cláusula penal (art. 408 CC)
        const multa = valor * (perc / 100);
        resultado = {
          tipo: "Multa Contratual (Cláusula Penal)",
          valorContrato: valor,
          percentual: perc,
          multaDevida: multa,
          total: multa,
          base: "Art. 408 do Código Civil"
        };
        break;

      case "danos_materiais":
        // Lucros cessantes + dano emergente (art. 402 CC)
        const totalDanos = lucros + dano;
        resultado = {
          tipo: "Danos Materiais",
          lucrosCessantes: lucros,
          danoEmergente: dano,
          total: totalDanos,
          base: "Art. 402 do Código Civil"
        };
        break;

      case "revisao_contratual":
        // Simulação de revisão por juros abusivos
        const jurosAbusivos = valor * 0.15; // Exemplo: redução de 15%
        const descontoAplicado = valor * 0.1; // Desconto de 10%
        resultado = {
          tipo: "Revisão Contratual",
          valorOriginal: valor,
          jurosAbusivos,
          descontoAplicado,
          valorRevisado: valor - jurosAbusivos - descontoAplicado,
          base: "Art. 317 e 478 do Código Civil"
        };
        break;

      case "pensao_mensal":
        // Pensão mensal vitalícia ou temporária
        const pensaoMensal = parseFloat(percentualMulta) || 0;
        const totalPensao = pensaoMensal * meses;
        resultado = {
          tipo: "Pensão Mensal",
          valorMensal: pensaoMensal,
          meses: meses,
          total: totalPensao,
          base: "Art. 948-950 do Código Civil"
        };
        break;

      default:
        break;
    }

    setResultado(resultado);
  };

  const exportarPDF = () => {
    if (!resultado) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`CÁLCULO - ${resultado.tipo}`, 15, 20);
    doc.setFontSize(12);
    let y = 40;
    Object.entries(resultado).forEach(([key, value]) => {
      if (key !== "tipo" && typeof value === "number") {
        doc.text(`${key}: R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 15, y);
        y += 10;
      }
    });
    doc.save("calculo_civil.pdf");
    toast.success("PDF gerado!");
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Tipo de Cálculo</Label>
          <Select value={tipoCalculo} onValueChange={setTipoCalculo}>
            <SelectTrigger className={isDark ? "bg-neutral-900 border-neutral-700" : ""}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="multa_contratual">Multa Contratual (Cláusula Penal)</SelectItem>
              <SelectItem value="danos_materiais">Danos Materiais (Lucro Cessante + Dano Emergente)</SelectItem>
              <SelectItem value="revisao_contratual">Revisão Contratual (Juros Abusivos)</SelectItem>
              <SelectItem value="pensao_mensal">Pensão Mensal Vitalícia/Temporária</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {tipoCalculo === "multa_contratual" && (
          <>
            <div className="space-y-2">
              <Label>Valor do Contrato (R$)</Label>
              <Input type="number" value={valorContrato} onChange={(e) => setValorContrato(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Percentual da Multa (%)</Label>
              <Input type="number" value={percentualMulta} onChange={(e) => setPercentualMulta(e.target.value)} />
            </div>
          </>
        )}

        {tipoCalculo === "danos_materiais" && (
          <>
            <div className="space-y-2">
              <Label>Lucros Cessantes (R$)</Label>
              <Input type="number" value={lucrosCessantes} onChange={(e) => setLucrosCessantes(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Dano Emergente (R$)</Label>
              <Input type="number" value={danoEmergente} onChange={(e) => setDanoemergente(e.target.value)} />
            </div>
          </>
        )}

        {tipoCalculo === "revisao_contratual" && (
          <div className="space-y-2">
            <Label>Valor Original (R$)</Label>
            <Input type="number" value={valorContrato} onChange={(e) => setValorContrato(e.target.value)} />
          </div>
        )}

        {tipoCalculo === "pensao_mensal" && (
          <>
            <div className="space-y-2">
              <Label>Valor Mensal (R$)</Label>
              <Input type="number" value={percentualMulta} onChange={(e) => setPercentualMulta(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Número de Meses</Label>
              <Input type="number" value={mesesAtraso} onChange={(e) => setMesesAtraso(e.target.value)} />
            </div>
          </>
        )}
      </div>

      <div className="flex gap-2">
        <Button onClick={calcular} className="flex-1 bg-blue-600 hover:bg-blue-700">
          <Calculator className="w-4 h-4 mr-2" />
          Calcular
        </Button>
        {resultado && (
          <Button onClick={exportarPDF} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>
        )}
      </div>

      {resultado && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-lg ${isDark ? "bg-neutral-900 border border-neutral-800" : "bg-blue-50 border border-blue-100"}`}
        >
          <h4 className={`font-semibold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>{resultado.tipo}</h4>
          <div className="space-y-2">
            {Object.entries(resultado).map(([key, value]) => {
              if (key === "tipo" || key === "base") return null;
              return (
                <div key={key} className="flex justify-between">
                  <span className={isDark ? "text-neutral-400" : "text-gray-600"}>{key}</span>
                  <span className={isDark ? "text-white" : "text-gray-900"}>
                    {typeof value === "number"
                      ? `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                      : value}
                  </span>
                </div>
              );
            })}
          </div>
          <p className={`text-xs mt-4 ${isDark ? "text-neutral-500" : "text-gray-500"}`}>
            Base legal: {resultado.base}
          </p>
        </motion.div>
      )}
    </div>
  );
}