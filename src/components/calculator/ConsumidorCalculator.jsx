import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Download, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { jsPDF } from "jspdf";
import { toast } from "sonner";

export default function ConsumidorCalculator({ isDark }) {
  const [tipoCalculo, setTipoCalculo] = useState("repeticao_indebito");
  const [valorPago, setValorPago] = useState("");
  const [meses, setMeses] = useState("12");
  const [emDobro, setEmDobro] = useState("nao");
  const [jurosContrato, setJurosContrato] = useState("");
  const [jurosLegais, setJurosLegais] = useState("1");
  const [resultado, setResultado] = useState(null);

  const calcular = () => {
    const valor = parseFloat(valorPago) || 0;
    const periodo = parseInt(meses) || 0;
    const jurosContr = parseFloat(jurosContrato) || 0;
    const jurosLeg = parseFloat(jurosLegais) || 1;

    if (!valor) {
      toast.error("Preencha o valor pago indevidamente");
      return;
    }

    let calc = {};

    switch (tipoCalculo) {
      case "repeticao_indebito":
        // Repetição do indébito (art. 42 CDC)
        let valorRepetir = valor;
        if (emDobro === "sim") {
          valorRepetir = valor * 2; // Em dobro se comprovada má-fé
        }
        
        // Atualização monetária (IPCA estimado 5% a.a.)
        const ipca = 0.004; // 0,4% a.m.
        const montanteAtualizado = valorRepetir * Math.pow(1 + ipca, periodo);
        const correcao = montanteAtualizado - valorRepetir;
        
        calc = {
          tipo: "Repetição de Indébito",
          valorPago: valor,
          emDobro: emDobro === "sim" ? "Sim" : "Não",
          valorBase: valorRepetir,
          correcaoMonetaria: correcao,
          totalRestituir: montanteAtualizado,
          periodo: `${periodo} meses`,
          base: "Art. 42, parágrafo único do CDC"
        };
        break;

      case "juros_abusivos":
        // Revisão de juros abusivos em contrato
        const jurosAbusivos = jurosContr - jurosLeg;
        const valorAbusivo = valor * (jurosAbusivos / 100) * periodo;
        const valorDevido = valor * (jurosLeg / 100) * periodo;
        const diferenca = valorAbusivo - valorDevido;
        
        calc = {
          tipo: "Revisão de Juros Abusivos",
          valorContrato: valor,
          jurosContratados: `${jurosContr}% a.m.`,
          jurosLegais: `${jurosLeg}% a.m.`,
          diferencaAbusiva: `${jurosAbusivos}% a.m.`,
          valorAbusivo,
          valorDevido,
          valorRecuperar: diferenca,
          periodo: `${periodo} meses`,
          base: "Art. 51, IV do CDC c/c Súmula 530 STJ"
        };
        break;

      case "cobranca_indevida":
        // Cobrança indevida de tarifas bancárias
        const valorMensal = valor;
        const totalPago = valorMensal * periodo;
        let valorRestituir = totalPago;
        
        if (emDobro === "sim") {
          valorRestituir = totalPago * 2;
        }
        
        // Correção monetária
        const montanteCorrigido = valorRestituir * Math.pow(1.004, periodo);
        const correcaoMon = montanteCorrigido - valorRestituir;
        
        calc = {
          tipo: "Cobrança Indevida de Tarifas",
          valorMensal,
          periodoMeses: periodo,
          totalPago,
          emDobro: emDobro === "sim" ? "Sim" : "Não",
          valorBase: valorRestituir,
          correcao: correcaoMon,
          totalRestituir: montanteCorrigido,
          base: "Art. 42 do CDC e Resoluções BACEN"
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
    doc.text('CÁLCULO - DIREITO DO CONSUMIDOR', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, 28, { align: 'center' });
    
    doc.save('calculo_consumidor.pdf');
    toast.success("PDF gerado com sucesso!");
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2 md:col-span-2">
          <Label>Tipo de Cálculo</Label>
          <Select value={tipoCalculo} onValueChange={setTipoCalculo}>
            <SelectTrigger className={isDark ? "bg-neutral-900 border-neutral-700" : ""}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="repeticao_indebito">Repetição de Indébito (art. 42 CDC)</SelectItem>
              <SelectItem value="juros_abusivos">Revisão de Juros Abusivos</SelectItem>
              <SelectItem value="cobranca_indevida">Cobrança Indevida de Tarifas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {tipoCalculo === "repeticao_indebito" && (
          <>
            <div className="space-y-2">
              <Label>Valor Pago Indevidamente (R$)</Label>
              <Input
                type="number"
                value={valorPago}
                onChange={(e) => setValorPago(e.target.value)}
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
            <div className="space-y-2 md:col-span-2">
              <Label>Repetir em Dobro? (se má-fé comprovada)</Label>
              <Select value={emDobro} onValueChange={setEmDobro}>
                <SelectTrigger className={isDark ? "bg-neutral-900 border-neutral-700" : ""}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nao">Não (valor simples)</SelectItem>
                  <SelectItem value="sim">Sim (em dobro - art. 42, § único CDC)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {tipoCalculo === "juros_abusivos" && (
          <>
            <div className="space-y-2">
              <Label>Valor do Contrato (R$)</Label>
              <Input
                type="number"
                value={valorPago}
                onChange={(e) => setValorPago(e.target.value)}
                className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label>Juros Contratados (% a.m.)</Label>
              <Input
                type="number"
                value={jurosContrato}
                onChange={(e) => setJurosContrato(e.target.value)}
                placeholder="Ex: 5"
                className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label>Juros Legais (% a.m.)</Label>
              <Input
                type="number"
                value={jurosLegais}
                onChange={(e) => setJurosLegais(e.target.value)}
                placeholder="1"
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

        {tipoCalculo === "cobranca_indevida" && (
          <>
            <div className="space-y-2">
              <Label>Valor Mensal da Tarifa (R$)</Label>
              <Input
                type="number"
                value={valorPago}
                onChange={(e) => setValorPago(e.target.value)}
                placeholder="Ex: 15"
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
            <div className="space-y-2 md:col-span-2">
              <Label>Devolução em Dobro?</Label>
              <Select value={emDobro} onValueChange={setEmDobro}>
                <SelectTrigger className={isDark ? "bg-neutral-900 border-neutral-700" : ""}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nao">Não</SelectItem>
                  <SelectItem value="sim">Sim (art. 42, § único CDC)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </div>

      <div className="flex gap-2">
        <Button onClick={calcular} className="flex-1 bg-cyan-600 hover:bg-cyan-700">
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
          className={`p-6 rounded-lg ${isDark ? "bg-neutral-900 border border-neutral-800" : "bg-cyan-50 border border-cyan-100"}`}
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