import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Download, Users, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { jsPDF } from "jspdf";
import { toast } from "sonner";

export default function FamiliaCalculator({ isDark }) {
  const [tipoCalculo, setTipoCalculo] = useState("pensao");
  const [rendaAlimentante, setRendaAlimentante] = useState("");
  const [percentual, setPercentual] = useState("30");
  const [totalBens, setTotalBens] = useState("");
  const [numHerdeiros, setNumHerdeiros] = useState("2");
  const [testamento, setTestamento] = useState("50");
  const [resultado, setResultado] = useState(null);

  const calcular = () => {
    const renda = parseFloat(rendaAlimentante) || 0;
    const perc = parseFloat(percentual) || 0;
    const bens = parseFloat(totalBens) || 0;
    const herdeiros = parseInt(numHerdeiros) || 0;
    const percTestamento = parseFloat(testamento) || 50;

    let calc = {};

    switch (tipoCalculo) {
      case "pensao":
        if (!renda) {
          toast.error("Informe a renda do alimentante");
          return;
        }
        
        const valorPensao = renda * (perc / 100);
        const anual = valorPensao * 12;
        
        calc = {
          tipo: "Pensão Alimentícia",
          rendaAlimentante: renda,
          percentual: `${perc}%`,
          valorMensal: valorPensao,
          valorAnual: anual,
          base: "Art. 1.694 do Código Civil"
        };
        break;

      case "partilha":
        if (!bens || !herdeiros) {
          toast.error("Informe o total de bens e número de herdeiros");
          return;
        }
        
        // Meação (50% para cônjuge)
        const meacao = bens / 2;
        
        // Legítima (50% da herança) dividida entre herdeiros
        const heranca = meacao;
        const legitima = heranca * 0.5;
        const parteDisponivel = heranca * 0.5;
        const quinhao = legitima / herdeiros;
        
        calc = {
          tipo: "Partilha de Bens e Sucessões",
          totalBens: bens,
          meacao: meacao,
          heranca: heranca,
          legitima: legitima,
          parteDisponivel: parteDisponivel,
          numHerdeiros: herdeiros,
          quinhaoPorHerdeiro: quinhao,
          base: "Arts. 1.789, 1.829 e 1.846 do Código Civil"
        };
        break;

      case "usufruto":
        if (!bens) {
          toast.error("Informe o valor do bem");
          return;
        }
        
        // Valor do usufruto (30% a 70% dependendo da idade)
        const valorUsufruto = bens * 0.5; // 50% valor médio
        const nuaPropriedade = bens - valorUsufruto;
        
        calc = {
          tipo: "Cálculo de Usufruto",
          valorBem: bens,
          valorUsufruto,
          nuaPropriedade,
          percentualUsufruto: "50%",
          base: "Art. 1.390 e seguintes do Código Civil"
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
    doc.text('CÁLCULO - FAMÍLIA E SUCESSÕES', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, 28, { align: 'center' });
    
    doc.save('calculo_familia.pdf');
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
              <SelectItem value="pensao">Pensão Alimentícia</SelectItem>
              <SelectItem value="partilha">Partilha de Bens (Meação e Quinhões)</SelectItem>
              <SelectItem value="usufruto">Cálculo de Usufruto</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {tipoCalculo === "pensao" && (
          <>
            <div className="space-y-2">
              <Label>Renda do Alimentante (R$)</Label>
              <Input
                type="number"
                value={rendaAlimentante}
                onChange={(e) => setRendaAlimentante(e.target.value)}
                placeholder="Ex: 5000"
                className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label>Percentual da Pensão (%)</Label>
              <Input
                type="number"
                value={percentual}
                onChange={(e) => setPercentual(e.target.value)}
                placeholder="Ex: 30"
                className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
              />
            </div>
          </>
        )}

        {tipoCalculo === "partilha" && (
          <>
            <div className="space-y-2">
              <Label>Total de Bens (R$)</Label>
              <Input
                type="number"
                value={totalBens}
                onChange={(e) => setTotalBens(e.target.value)}
                placeholder="Ex: 1000000"
                className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label>Número de Herdeiros</Label>
              <Input
                type="number"
                value={numHerdeiros}
                onChange={(e) => setNumHerdeiros(e.target.value)}
                placeholder="Ex: 2"
                className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
              />
            </div>
          </>
        )}

        {tipoCalculo === "usufruto" && (
          <div className="space-y-2 md:col-span-2">
            <Label>Valor do Bem (R$)</Label>
            <Input
              type="number"
              value={totalBens}
              onChange={(e) => setTotalBens(e.target.value)}
              placeholder="Ex: 500000"
              className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
            />
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button onClick={calcular} className="flex-1 bg-pink-600 hover:bg-pink-700">
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
          className={`p-6 rounded-lg ${isDark ? "bg-neutral-900 border border-neutral-800" : "bg-pink-50 border border-pink-100"}`}
        >
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-pink-600" />
            <h4 className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{resultado.tipo}</h4>
          </div>
          
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

          <p className="text-xs mt-4 text-gray-500">Base legal: {resultado.base}</p>
        </motion.div>
      )}
    </div>
  );
}