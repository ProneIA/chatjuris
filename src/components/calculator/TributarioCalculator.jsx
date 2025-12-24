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
  const [aliquota, setAliquota] = useState("");
  const [baseCalculo, setBaseCalculo] = useState("");
  const [resultado, setResultado] = useState(null);

  const calcular = () => {
    const valor = parseFloat(valorPrincipal) || 0;
    const periodo = parseInt(meses) || 0;
    const aliq = parseFloat(aliquota) || 0;
    const base = parseFloat(baseCalculo) || 0;

    if (!valor) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    let calc = {};

    switch (tipoCalculo) {
      case "selic":
        // SELIC média aproximada: 1% a.m.
        const selicMensal = 0.01;
        const montanteSelic = valor * Math.pow(1 + selicMensal, periodo);
        const jurosSelic = montanteSelic - valor;
        
        calc = {
          tipo: "Atualização pela SELIC",
          valorPrincipal: valor,
          periodo: `${periodo} meses`,
          taxaSelic: "1% a.m. (estimada)",
          juros: jurosSelic,
          montante: montanteSelic,
          base: "Art. 39, §4º da Lei 9.250/95"
        };
        break;

      case "icms":
        const valorIcms = base * (aliq / 100);
        calc = {
          tipo: "ICMS",
          baseCalculo: base,
          aliquota: `${aliq}%`,
          valorImposto: valorIcms,
          base: "Lei Complementar 87/96"
        };
        break;

      case "iss":
        const valorIss = base * (aliq / 100);
        calc = {
          tipo: "ISS - Imposto Sobre Serviços",
          baseCalculo: base,
          aliquota: `${aliq}%`,
          valorImposto: valorIss,
          base: "Lei Complementar 116/2003"
        };
        break;

      case "repetir_indebito":
        // Repetição de indébito com SELIC
        const selicRepet = 0.01;
        const montanteRepet = valor * Math.pow(1 + selicRepet, periodo);
        const jurosRepet = montanteRepet - valor;
        
        calc = {
          tipo: "Repetição de Indébito Tributário",
          valorPago: valor,
          periodo: `${periodo} meses`,
          correcaoSelic: jurosRepet,
          totalRestituir: montanteRepet,
          base: "Art. 165 do CTN c/c Súmula 162 STJ"
        };
        break;

      case "multa_fiscal":
        const percentualMulta = aliq || 75;
        const valorMulta = valor * (percentualMulta / 100);
        const total = valor + valorMulta;
        
        calc = {
          tipo: "Multa Fiscal",
          tributoPrincipal: valor,
          percentualMulta: `${percentualMulta}%`,
          valorMulta,
          totalDevido: total,
          base: "Art. 44 da Lei 9.430/96"
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
    doc.text('CÁLCULO TRIBUTÁRIO', pageWidth / 2, 20, { align: 'center' });
    
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
    
    doc.save('calculo_tributario.pdf');
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
              <SelectItem value="selic">Atualização pela SELIC</SelectItem>
              <SelectItem value="icms">ICMS</SelectItem>
              <SelectItem value="iss">ISS</SelectItem>
              <SelectItem value="repetir_indebito">Repetição de Indébito</SelectItem>
              <SelectItem value="multa_fiscal">Multa Fiscal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(tipoCalculo === "selic" || tipoCalculo === "repetir_indebito") && (
          <>
            <div className="space-y-2">
              <Label>Valor Principal (R$)</Label>
              <Input
                type="number"
                value={valorPrincipal}
                onChange={(e) => setValorPrincipal(e.target.value)}
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
          </>
        )}

        {(tipoCalculo === "icms" || tipoCalculo === "iss") && (
          <>
            <div className="space-y-2">
              <Label>Base de Cálculo (R$)</Label>
              <Input
                type="number"
                value={baseCalculo}
                onChange={(e) => setBaseCalculo(e.target.value)}
                className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label>Alíquota (%)</Label>
              <Input
                type="number"
                value={aliquota}
                onChange={(e) => setAliquota(e.target.value)}
                placeholder={tipoCalculo === "icms" ? "Ex: 18" : "Ex: 5"}
                className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
              />
            </div>
          </>
        )}

        {tipoCalculo === "multa_fiscal" && (
          <>
            <div className="space-y-2">
              <Label>Tributo Principal (R$)</Label>
              <Input
                type="number"
                value={valorPrincipal}
                onChange={(e) => setValorPrincipal(e.target.value)}
                className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label>Percentual da Multa (%)</Label>
              <Input
                type="number"
                value={aliquota}
                onChange={(e) => setAliquota(e.target.value)}
                placeholder="Ex: 75"
                className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
              />
            </div>
          </>
        )}
      </div>

      <div className="flex gap-2">
        <Button onClick={calcular} className="flex-1 bg-amber-600 hover:bg-amber-700">
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
          className={`p-6 rounded-lg ${isDark ? "bg-neutral-900 border border-neutral-800" : "bg-amber-50 border border-amber-100"}`}
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