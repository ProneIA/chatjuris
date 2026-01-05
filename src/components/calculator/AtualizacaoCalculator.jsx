import React, { useState } from "react";
import { Calculator, DollarSign, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import CurrencyInput from "./CurrencyInput";

// Índices acumulados aproximados (últimos anos - valores simulados para demonstração)
const indicesAcumulados = {
  "IPCA": { nome: "IPCA (IBGE)", taxaAnual: 0.0465, descricao: "Índice oficial de inflação" },
  "INPC": { nome: "INPC (IBGE)", taxaAnual: 0.0412, descricao: "Correção de benefícios INSS" },
  "IGPM": { nome: "IGP-M (FGV)", taxaAnual: 0.0328, descricao: "Reajuste de aluguéis" },
  "SELIC": { nome: "Taxa SELIC", taxaAnual: 0.1075, descricao: "Débitos judiciais (art. 406 CC)" },
  "TR": { nome: "TR (BCB)", taxaAnual: 0.0189, descricao: "FGTS e poupança" },
  "IPCAE": { nome: "IPCA-E", taxaAnual: 0.0458, descricao: "Precatórios (EC 113/2021)" }
};

export default function AtualizacaoCalculator({ isDark }) {
  const [valorOriginal, setValorOriginal] = useState("");
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState(new Date().toISOString().split('T')[0]);
  const [indice, setIndice] = useState("SELIC");
  const [aplicarJuros, setAplicarJuros] = useState("sim");
  const [resultado, setResultado] = useState(null);

  const calcular = () => {
    const parseNumero = (valor) => {
      if (!valor) return 0;
      const str = valor.toString().replace(/\./g, '').replace(',', '.');
      return parseFloat(str) || 0;
    };
    const valor = parseNumero(valorOriginal);
    const inicio = new Date(dataInicial);
    const fim = new Date(dataFinal);

    if (!valor || isNaN(inicio.getTime()) || isNaN(fim.getTime())) return;

    const indiceData = indicesAcumulados[indice];
    
    // Calcular meses entre as datas
    const meses = Math.max(0, 
      (fim.getFullYear() - inicio.getFullYear()) * 12 + 
      (fim.getMonth() - inicio.getMonth())
    );

    // Taxa mensal aproximada
    const taxaMensal = Math.pow(1 + indiceData.taxaAnual, 1/12) - 1;
    
    // Correção monetária
    const fatorCorrecao = Math.pow(1 + taxaMensal, meses);
    const valorCorrigido = valor * fatorCorrecao;
    const correcaoMonetaria = valorCorrigido - valor;

    // Juros de mora (1% ao mês se aplicável e não for SELIC)
    let jurosMora = 0;
    if (aplicarJuros === "sim" && indice !== "SELIC") {
      jurosMora = valor * 0.01 * meses; // 1% ao mês simples
    }

    const valorTotal = valorCorrigido + jurosMora;

    setResultado({
      valorOriginal: valor,
      indice: indiceData.nome,
      dataInicial: inicio,
      dataFinal: fim,
      meses,
      fatorCorrecao,
      correcaoMonetaria,
      valorCorrigido,
      jurosMora,
      valorTotal
    });
  };

  return (
    <div className="space-y-6">
      {/* Info sobre índices */}
      <div className={`p-4 rounded-lg ${isDark ? "bg-neutral-800/50" : "bg-indigo-50"}`}>
        <div className="flex items-start gap-3">
          <TrendingUp className={`w-5 h-5 mt-0.5 ${isDark ? "text-indigo-400" : "text-indigo-600"}`} />
          <div>
            <p className={`text-sm font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
              {indicesAcumulados[indice]?.nome}
            </p>
            <p className={`text-xs ${isDark ? "text-neutral-400" : "text-gray-600"}`}>
              {indicesAcumulados[indice]?.descricao}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Valor Original (R$)</Label>
          <Input
            type="number"
            placeholder="Ex: 10000"
            value={valorOriginal}
            onChange={(e) => setValorOriginal(e.target.value)}
            className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
          />
        </div>

        <div className="space-y-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Índice de Correção</Label>
          <Select value={indice} onValueChange={setIndice}>
            <SelectTrigger className={isDark ? "bg-neutral-900 border-neutral-700" : ""}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(indicesAcumulados).map(([key, data]) => (
                <SelectItem key={key} value={key}>{data.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Data Inicial</Label>
          <Input
            type="date"
            value={dataInicial}
            onChange={(e) => setDataInicial(e.target.value)}
            className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
          />
        </div>

        <div className="space-y-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Data Final</Label>
          <Input
            type="date"
            value={dataFinal}
            onChange={(e) => setDataFinal(e.target.value)}
            className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Aplicar Juros de Mora (1% a.m.)?</Label>
          <Select value={aplicarJuros} onValueChange={setAplicarJuros}>
            <SelectTrigger className={isDark ? "bg-neutral-900 border-neutral-700" : ""}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sim">Sim (além da correção)</SelectItem>
              <SelectItem value="nao">Não (apenas correção)</SelectItem>
            </SelectContent>
          </Select>
          {indice === "SELIC" && (
            <p className={`text-xs ${isDark ? "text-neutral-500" : "text-gray-500"}`}>
              * SELIC já inclui juros e correção (art. 406 CC c/c Lei 9.065/95)
            </p>
          )}
        </div>
      </div>

      <Button onClick={calcular} className="w-full bg-indigo-600 hover:bg-indigo-700">
        <Calculator className="w-4 h-4 mr-2" />
        Atualizar Valor
      </Button>

      {resultado && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-lg ${isDark ? "bg-neutral-900 border border-neutral-800" : "bg-indigo-50 border border-indigo-100"}`}
        >
          <h4 className={`font-semibold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
            Valor Atualizado por {resultado.indice}
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className={isDark ? "text-neutral-400" : "text-gray-600"}>Valor Original</span>
              <span className={isDark ? "text-white" : "text-gray-900"}>
                R$ {resultado.valorOriginal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? "text-neutral-400" : "text-gray-600"}>Período</span>
              <span className={isDark ? "text-white" : "text-gray-900"}>
                {resultado.meses} meses
              </span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? "text-neutral-400" : "text-gray-600"}>Fator de Correção</span>
              <span className={isDark ? "text-white" : "text-gray-900"}>
                {resultado.fatorCorrecao.toFixed(6)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? "text-neutral-400" : "text-gray-600"}>Correção Monetária</span>
              <span className="text-indigo-600">
                + R$ {resultado.correcaoMonetaria.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            {resultado.jurosMora > 0 && (
              <div className="flex justify-between">
                <span className={isDark ? "text-neutral-400" : "text-gray-600"}>Juros de Mora</span>
                <span className="text-orange-600">
                  + R$ {resultado.jurosMora.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
            <div className={`pt-3 mt-3 border-t ${isDark ? "border-neutral-700" : "border-indigo-200"} flex justify-between`}>
              <span className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Valor Atualizado</span>
              <span className="font-bold text-green-600 text-lg">
                R$ {resultado.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          <p className={`text-xs mt-4 ${isDark ? "text-neutral-500" : "text-gray-500"}`}>
            * Cálculo aproximado. Para valores exatos, utilize as tabelas oficiais dos tribunais.
          </p>
        </motion.div>
      )}
    </div>
  );
}