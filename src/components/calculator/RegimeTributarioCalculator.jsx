import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, Download, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";
import { jsPDF } from "jspdf";
import { toast } from "sonner";

export default function RegimeTributarioCalculator({ isDark }) {
  const [receitaBruta, setReceitaBruta] = useState("");
  const [custoMercadoria, setCustoMercadoria] = useState("");
  const [despesasOperacionais, setDespesasOperacionais] = useState("");
  const [cnae, setCnae] = useState("comercio");
  const [resultado, setResultado] = useState(null);

  const calcular = () => {
    const receita = parseFloat(receitaBruta) || 0;
    const custo = parseFloat(custoMercadoria) || 0;
    const despesas = parseFloat(despesasOperacionais) || 0;

    if (!receita) {
      toast.error("Informe a receita bruta anual");
      return;
    }

    // SIMPLES NACIONAL
    const aliquotaSimples = cnae === "comercio" ? 0.06 : cnae === "servicos" ? 0.155 : 0.045;
    const impostoSimples = receita * aliquotaSimples;

    // LUCRO PRESUMIDO
    const margemPresumida = cnae === "comercio" ? 0.08 : cnae === "servicos" ? 0.32 : 0.12;
    const basePresumida = receita * margemPresumida;
    const irpjPresumido = basePresumida * 0.15;
    const csllPresumida = basePresumida * 0.09;
    const pisPresumido = receita * 0.0065;
    const cofinsPresumida = receita * 0.03;
    const impostoPresumido = irpjPresumido + csllPresumida + pisPresumido + cofinsPresumida;

    // LUCRO REAL
    const lucroReal = receita - custo - despesas;
    const irpjReal = Math.max(0, lucroReal * 0.15);
    const csllReal = Math.max(0, lucroReal * 0.09);
    const pisReal = receita * 0.0165;
    const cofinsReal = receita * 0.076;
    const impostoReal = irpjReal + csllReal + pisReal + cofinsReal;

    // Melhor regime
    const valores = [
      { regime: "Simples Nacional", valor: impostoSimples },
      { regime: "Lucro Presumido", valor: impostoPresumido },
      { regime: "Lucro Real", valor: impostoReal }
    ];
    const melhorRegime = valores.reduce((prev, curr) => prev.valor < curr.valor ? prev : curr);

    setResultado({
      receitaBruta: receita,
      simplesNacional: impostoSimples,
      lucroPresumido: impostoPresumido,
      lucroReal: impostoReal,
      melhorRegime: melhorRegime.regime,
      economia: Math.max(...valores.map(v => v.valor)) - melhorRegime.valor,
      detalhamentoPresumido: {
        irpj: irpjPresumido,
        csll: csllPresumida,
        pis: pisPresumido,
        cofins: cofinsPresumida
      },
      detalhamentoReal: {
        irpj: irpjReal,
        csll: csllReal,
        pis: pisReal,
        cofins: cofinsReal
      }
    });
  };

  const exportarPDF = () => {
    if (!resultado) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('COMPARAÇÃO DE REGIMES TRIBUTÁRIOS', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, 28, { align: 'center' });
    
    doc.line(15, 32, pageWidth - 15, 32);
    
    let y = 45;
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('RECEITA BRUTA ANUAL:', 15, y);
    doc.text(`R$ ${resultado.receitaBruta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - 15, y, { align: 'right' });
    
    y += 15;
    doc.text('TRIBUTOS POR REGIME:', 15, y);
    y += 10;
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    
    doc.text('Simples Nacional:', 15, y);
    doc.text(`R$ ${resultado.simplesNacional.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - 15, y, { align: 'right' });
    y += 8;
    
    doc.text('Lucro Presumido:', 15, y);
    doc.text(`R$ ${resultado.lucroPresumido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - 15, y, { align: 'right' });
    y += 8;
    
    doc.text('Lucro Real:', 15, y);
    doc.text(`R$ ${resultado.lucroReal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - 15, y, { align: 'right' });
    
    y += 12;
    doc.line(15, y, pageWidth - 15, y);
    y += 10;
    
    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0, 150, 0);
    doc.text('MELHOR REGIME:', 15, y);
    doc.text(resultado.melhorRegime, pageWidth - 15, y, { align: 'right' });
    y += 10;
    
    doc.text('ECONOMIA:', 15, y);
    doc.text(`R$ ${resultado.economia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - 15, y, { align: 'right' });
    
    doc.save('comparacao_regimes.pdf');
    toast.success("PDF gerado com sucesso!");
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Receita Bruta Anual (R$)</Label>
          <Input
            type="number"
            placeholder="Ex: 1000000"
            value={receitaBruta}
            onChange={(e) => setReceitaBruta(e.target.value)}
            className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
          />
        </div>

        <div className="space-y-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Atividade Principal</Label>
          <select
            value={cnae}
            onChange={(e) => setCnae(e.target.value)}
            className={`w-full px-3 py-2 rounded-lg border ${isDark ? "bg-neutral-900 border-neutral-700 text-white" : "bg-white border-gray-200"}`}
          >
            <option value="comercio">Comércio</option>
            <option value="servicos">Serviços</option>
            <option value="industria">Indústria</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>
            Custo de Mercadorias/Serviços (R$)
            <span className="text-xs text-gray-400 ml-1">(para Lucro Real)</span>
          </Label>
          <Input
            type="number"
            placeholder="Ex: 400000"
            value={custoMercadoria}
            onChange={(e) => setCustoMercadoria(e.target.value)}
            className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
          />
        </div>

        <div className="space-y-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>
            Despesas Operacionais (R$)
            <span className="text-xs text-gray-400 ml-1">(para Lucro Real)</span>
          </Label>
          <Input
            type="number"
            placeholder="Ex: 200000"
            value={despesasOperacionais}
            onChange={(e) => setDespesasOperacionais(e.target.value)}
            className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={calcular} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
          <Calculator className="w-4 h-4 mr-2" />
          Comparar Regimes
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
          className="space-y-4"
        >
          {/* Comparação Visual */}
          <div className={`p-6 rounded-lg ${isDark ? "bg-neutral-900 border border-neutral-800" : "bg-white border border-gray-200"}`}>
            <h4 className={`font-semibold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
              Comparação de Tributos Anuais
            </h4>
            
            <div className="space-y-3">
              {[
                { nome: "Simples Nacional", valor: resultado.simplesNacional, cor: "blue" },
                { nome: "Lucro Presumido", valor: resultado.lucroPresumido, cor: "purple" },
                { nome: "Lucro Real", valor: resultado.lucroReal, cor: "indigo" }
              ].map((regime, i) => {
                const percentual = (regime.valor / resultado.receitaBruta) * 100;
                const isMelhor = regime.nome === resultado.melhorRegime;
                
                return (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`font-medium ${isMelhor ? "text-emerald-600" : isDark ? "text-neutral-300" : "text-gray-700"}`}>
                        {regime.nome}
                        {isMelhor && <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">MELHOR</span>}
                      </span>
                      <span className={`font-semibold ${isMelhor ? "text-emerald-600" : isDark ? "text-white" : "text-gray-900"}`}>
                        R$ {regime.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className={`h-2 rounded-full overflow-hidden ${isDark ? "bg-neutral-800" : "bg-gray-200"}`}>
                      <div
                        className={`h-full ${isMelhor ? "bg-emerald-500" : `bg-${regime.cor}-500`}`}
                        style={{ width: `${percentual}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">{percentual.toFixed(2)}% da receita bruta</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Economia */}
          <div className="p-6 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
            <div className="flex items-center gap-3 mb-2">
              <TrendingDown className="w-6 h-6" />
              <h4 className="font-semibold text-lg">Economia Anual Estimada</h4>
            </div>
            <p className="text-3xl font-bold">
              R$ {resultado.economia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm opacity-90 mt-1">
              Escolhendo {resultado.melhorRegime} ao invés do regime mais caro
            </p>
          </div>

          {/* Detalhamento */}
          <div className={`p-6 rounded-lg ${isDark ? "bg-neutral-900 border border-neutral-800" : "bg-gray-50 border border-gray-200"}`}>
            <h4 className={`font-semibold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
              Detalhamento Lucro Presumido
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span className={isDark ? "text-neutral-400" : "text-gray-600"}>IRPJ (15%)</span>
                <span className={isDark ? "text-white" : "text-gray-900"}>
                  R$ {resultado.detalhamentoPresumido.irpj.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={isDark ? "text-neutral-400" : "text-gray-600"}>CSLL (9%)</span>
                <span className={isDark ? "text-white" : "text-gray-900"}>
                  R$ {resultado.detalhamentoPresumido.csll.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={isDark ? "text-neutral-400" : "text-gray-600"}>PIS (0,65%)</span>
                <span className={isDark ? "text-white" : "text-gray-900"}>
                  R$ {resultado.detalhamentoPresumido.pis.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={isDark ? "text-neutral-400" : "text-gray-600"}>COFINS (3%)</span>
                <span className={isDark ? "text-white" : "text-gray-900"}>
                  R$ {resultado.detalhamentoPresumido.cofins.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}