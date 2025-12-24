import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Download, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { jsPDF } from "jspdf";
import { toast } from "sonner";

export default function PenalCalculator({ isDark }) {
  const [tipoCalculo, setTipoCalculo] = useState("dosimetria");
  const [penaMinima, setPenaMinima] = useState("");
  const [penaMaxima, setPenaMaxima] = useState("");
  const [circunstancias, setCircunstancias] = useState("favoraveis");
  const [atenuantes, setAtenuantes] = useState("0");
  const [agravantes, setAgravantes] = useState("0");
  const [resultado, setResultado] = useState(null);

  const calcular = () => {
    const min = parseInt(penaMinima) || 0;
    const max = parseInt(penaMaxima) || 0;
    const aten = parseInt(atenuantes) || 0;
    const agrav = parseInt(agravantes) || 0;

    if (!min || !max) {
      toast.error("Informe a pena mínima e máxima");
      return;
    }

    // Dosimetria trifásica (art. 68 CP)
    // 1ª fase: Pena-base
    let penaBase = min;
    if (circunstancias === "favoraveis") {
      penaBase = min;
    } else if (circunstancias === "desfavoraveis") {
      penaBase = min + (max - min) / 2;
    }

    // 2ª fase: Atenuantes e agravantes
    let penaProvisoria = penaBase;
    if (aten > 0) {
      penaProvisoria -= aten; // Reduz 1 ano por atenuante
    }
    if (agrav > 0) {
      penaProvisoria += agrav; // Aumenta 1 ano por agravante
    }

    penaProvisoria = Math.max(min, Math.min(penaProvisoria, max));

    // 3ª fase: Causas de aumento/diminuição (não implementadas neste exemplo)
    const penaDefinitiva = penaProvisoria;

    // Regime inicial (art. 33 CP)
    let regime = "aberto";
    if (penaDefinitiva > 8) {
      regime = "fechado";
    } else if (penaDefinitiva > 4) {
      regime = "semiaberto";
    }

    // Substituição (art. 44 CP)
    const substituivel = penaDefinitiva <= 4 && circunstancias === "favoraveis";

    setResultado({
      tipo: "Dosimetria da Pena",
      penaMinima: min,
      penaMaxima: max,
      penaBase: penaBase.toFixed(1),
      penaProvisoria: penaProvisoria.toFixed(1),
      penaDefinitiva: penaDefinitiva.toFixed(1),
      regimeInicial: regime,
      substituivel: substituivel ? "Sim" : "Não",
      base: "Art. 68 do Código Penal"
    });
  };

  const exportarPDF = () => {
    if (!resultado) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("DOSIMETRIA DA PENA", 15, 20);
    doc.setFontSize(12);
    let y = 40;
    Object.entries(resultado).forEach(([key, value]) => {
      if (key !== "tipo" && key !== "base") {
        doc.text(`${key}: ${value}`, 15, y);
        y += 10;
      }
    });
    doc.save("dosimetria_pena.pdf");
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
              <SelectItem value="dosimetria">Dosimetria da Pena (art. 68 CP)</SelectItem>
              <SelectItem value="progressao">Progressão de Regime</SelectItem>
              <SelectItem value="prescricao">Prescrição Penal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {tipoCalculo === "dosimetria" && (
          <>
            <div className="space-y-2">
              <Label>Pena Mínima (anos)</Label>
              <Input type="number" value={penaMinima} onChange={(e) => setPenaMinima(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Pena Máxima (anos)</Label>
              <Input type="number" value={penaMaxima} onChange={(e) => setPenaMaxima(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Circunstâncias Judiciais</Label>
              <Select value={circunstancias} onValueChange={setCircunstancias}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="favoraveis">Todas Favoráveis</SelectItem>
                  <SelectItem value="desfavoraveis">Parcialmente Desfavoráveis</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Atenuantes</Label>
              <Input type="number" value={atenuantes} onChange={(e) => setAtenuantes(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Agravantes</Label>
              <Input type="number" value={agravantes} onChange={(e) => setAgravantes(e.target.value)} />
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
          className={`p-6 rounded-lg ${isDark ? "bg-neutral-900" : "bg-red-50"}`}
        >
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-red-600" />
            <h4 className="font-semibold">{resultado.tipo}</h4>
          </div>
          <div className="space-y-2">
            {Object.entries(resultado).map(([key, value]) => {
              if (key === "tipo" || key === "base") return null;
              return (
                <div key={key} className="flex justify-between">
                  <span>{key}</span>
                  <span className="font-semibold">{String(value)}</span>
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