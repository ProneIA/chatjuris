import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Download } from "lucide-react";
import { motion } from "framer-motion";
import { jsPDF } from "jspdf";
import { toast } from "sonner";

export default function TributarioCalculator({ isDark }) {
  const [tipoCalculo, setTipoCalculo] = useState("selic");
  const [valorPrincipal, setValorPrincipal] = useState("");
  const [meses, setMeses] = useState("");
  const [aliquota, setAliquota] = useState("15");
  const [resultado, setResultado] = useState(null);

  const calcular = () => {
    const principal = parseFloat(valorPrincipal) || 0;
    const periodoMeses = parseInt(meses) || 0;
    const aliq = parseFloat(aliquota) || 0;

    if (!principal) {
      toast.error("Informe o valor principal");
      return;
    }

    let resultado = {};

    switch (tipoCalculo) {
      case "selic":
        // SELIC aproximada: 13.75% a.a. = 1.08% a.m.
        const taxaSelic = 0.0108;
        const montanteSelic = principal * Math.pow(1 + taxaSelic, periodoMeses);
        const jurosSelic = montanteSelic - principal;
        resultado = {
          tipo: "Atualização pela SELIC",
          valorPrincipal: principal,
          periodo: periodoMeses,
          taxaMensal: taxaSelic * 100,
          jurosAcumulados: jurosSelic,
          montanteFinal: montanteSelic,
          base: "Lei 9.250/95 e CTN"
        };
        break;

      case "repetindo_indebito":
        // Repetição de indébito (art. 165-A CTN)
        const valorRepetir = principal * 2; // Em dobro se má-fé
        resultado = {
          tipo: "Repetição de Indébito",
          valorPago: principal,
          valorRepetir,
          dobro: true,
          base: "Art. 165-A do CTN"
        };
        break;

      case "multa_fiscal":
        // Multa fiscal (75% ou 150%)
        const multaPerc = aliq / 100;
        const multaFiscal = principal * multaPerc;
        resultado = {
          tipo: "Multa Fiscal",
          valorPrincipal: principal,
          percentualMulta: aliq,
          multaDevida: multaFiscal,
          total: principal + multaFiscal,
          base: "Art. 44 da Lei 9.430/96"
        };
        break;

      case "compensacao":
        // Compensação tributária
        const compensacao = principal * 0.85; // 85% compensável
        resultado = {
          tipo: "Compensação Tributária",
          creditoExistente: principal,
          valorCompensavel: compensacao,
          limiteLegal: "85%",
          base: "Art. 170-A do CTN"
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
    doc.text(`CÁLCULO TRIBUTÁRIO - ${resultado.tipo}`, 15, 20);
    doc.setFontSize(12);
    let y = 40;
    Object.entries(resultado).forEach(([key, value]) => {
      if (key !== "tipo" && key !== "base" && typeof value === "number") {
        doc.text(`${key}: R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 15, y);
        y += 10;
      }
    });
    doc.save("calculo_tributario.pdf");
    toast.success("PDF gerado!");
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tipo de Cálculo</Label>
          <Select value={tipoCalculo} onValueChange={setTipoCalculo}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="selic">Atualização pela SELIC</SelectItem>
              <SelectItem value="repetindo_indebito">Repetição de Indébito</SelectItem>
              <SelectItem value="multa_fiscal">Multa Fiscal</SelectItem>
              <SelectItem value="compensacao">Compensação Tributária</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Valor Principal (R$)</Label>
          <Input type="number" value={valorPrincipal} onChange={(e) => setValorPrincipal(e.target.value)} />
        </div>

        {tipoCalculo === "selic" && (
          <div className="space-y-2">
            <Label>Período (meses)</Label>
            <Input type="number" value={meses} onChange={(e) => setMeses(e.target.value)} />
          </div>
        )}

        {tipoCalculo === "multa_fiscal" && (
          <div className="space-y-2">
            <Label>Percentual da Multa (%)</Label>
            <Input type="number" value={aliquota} onChange={(e) => setAliquota(e.target.value)} />
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button onClick={calcular} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
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
          className={`p-6 rounded-lg ${isDark ? "bg-neutral-900" : "bg-indigo-50"}`}
        >
          <h4 className="font-semibold mb-4">{resultado.tipo}</h4>
          <div className="space-y-2">
            {Object.entries(resultado).map(([key, value]) => {
              if (key === "tipo" || key === "base") return null;
              return (
                <div key={key} className="flex justify-between">
                  <span>{key}</span>
                  <span className="font-semibold">
                    {typeof value === "number" ? `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : String(value)}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-xs mt-4 text-gray-500">Base legal: {resultado.base}</p>
        </motion.div>
      )}
    </div>
  );
}