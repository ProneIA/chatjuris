import React, { useState } from "react";
import { Calculator, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";

// Tabela simplificada de custas (valores aproximados - 2024)
const tabelaCustas = {
  "SP": { nome: "São Paulo", taxa: 0.01, minimo: 106.30, maximo: 98170.00, preparo: 0.02 },
  "RJ": { nome: "Rio de Janeiro", taxa: 0.02, minimo: 87.10, maximo: 174200.00, preparo: 0.02 },
  "MG": { nome: "Minas Gerais", taxa: 0.015, minimo: 78.50, maximo: 85000.00, preparo: 0.02 },
  "RS": { nome: "Rio Grande do Sul", taxa: 0.01, minimo: 65.00, maximo: 75000.00, preparo: 0.02 },
  "PR": { nome: "Paraná", taxa: 0.01, minimo: 58.00, maximo: 68000.00, preparo: 0.02 },
  "SC": { nome: "Santa Catarina", taxa: 0.01, minimo: 55.00, maximo: 65000.00, preparo: 0.02 },
  "BA": { nome: "Bahia", taxa: 0.01, minimo: 48.00, maximo: 55000.00, preparo: 0.02 },
  "PE": { nome: "Pernambuco", taxa: 0.01, minimo: 45.00, maximo: 52000.00, preparo: 0.02 },
  "CE": { nome: "Ceará", taxa: 0.01, minimo: 42.00, maximo: 48000.00, preparo: 0.02 },
  "DF": { nome: "Distrito Federal", taxa: 0.01, minimo: 75.00, maximo: 80000.00, preparo: 0.02 },
  "GO": { nome: "Goiás", taxa: 0.01, minimo: 52.00, maximo: 58000.00, preparo: 0.02 },
  "ES": { nome: "Espírito Santo", taxa: 0.01, minimo: 48.00, maximo: 55000.00, preparo: 0.02 },
  "JF": { nome: "Justiça Federal", taxa: 0.01, minimo: 10.64, maximo: 1915.38, preparo: 0.02 }
};

export default function CustasCalculator({ isDark }) {
  const [estado, setEstado] = useState("SP");
  const [valorCausa, setValorCausa] = useState("");
  const [tipoAcao, setTipoAcao] = useState("conhecimento");
  const [instancia, setInstancia] = useState("primeira");
  const [resultado, setResultado] = useState(null);

  const calcular = () => {
    const valor = parseFloat(valorCausa) || 0;
    const tabela = tabelaCustas[estado];

    if (!tabela || valor <= 0) return;

    // Cálculo da taxa judiciária
    let taxaJudiciaria = valor * tabela.taxa;
    taxaJudiciaria = Math.max(tabela.minimo, Math.min(taxaJudiciaria, tabela.maximo));

    // Preparo recursal (se segunda instância)
    let preparo = 0;
    if (instancia === "segunda") {
      preparo = valor * tabela.preparo;
      preparo = Math.max(tabela.minimo, Math.min(preparo, tabela.maximo));
    }

    // Porte de remessa e retorno (valores aproximados)
    const porteRemessa = instancia === "segunda" ? 150.00 : 0;

    // Diligências e citações (valores aproximados)
    const diligencias = tipoAcao === "execucao" ? 250.00 : 85.00;

    // Perícia (estimativa se necessária)
    const pericia = tipoAcao === "conhecimento" ? 3500.00 : 0;

    const totalCustas = taxaJudiciaria + preparo + porteRemessa + diligencias;

    setResultado({
      estado: tabela.nome,
      valorCausa: valor,
      taxaJudiciaria,
      preparo,
      porteRemessa,
      diligencias,
      pericia,
      totalCustas,
      totalComPericia: totalCustas + pericia
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Estado/Tribunal</Label>
          <Select value={estado} onValueChange={setEstado}>
            <SelectTrigger className={isDark ? "bg-neutral-900 border-neutral-700" : ""}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(tabelaCustas).map(([sigla, dados]) => (
                <SelectItem key={sigla} value={sigla}>{dados.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Valor da Causa (R$)</Label>
          <Input
            type="number"
            placeholder="Ex: 50000"
            value={valorCausa}
            onChange={(e) => setValorCausa(e.target.value)}
            className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
          />
        </div>

        <div className="space-y-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Tipo de Ação</Label>
          <Select value={tipoAcao} onValueChange={setTipoAcao}>
            <SelectTrigger className={isDark ? "bg-neutral-900 border-neutral-700" : ""}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="conhecimento">Ação de Conhecimento</SelectItem>
              <SelectItem value="execucao">Execução</SelectItem>
              <SelectItem value="cautelar">Cautelar/Tutela</SelectItem>
              <SelectItem value="monitoria">Monitória</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Instância</Label>
          <Select value={instancia} onValueChange={setInstancia}>
            <SelectTrigger className={isDark ? "bg-neutral-900 border-neutral-700" : ""}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="primeira">1ª Instância</SelectItem>
              <SelectItem value="segunda">2ª Instância (Recurso)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button onClick={calcular} className="w-full bg-red-600 hover:bg-red-700">
        <Calculator className="w-4 h-4 mr-2" />
        Calcular Custas
      </Button>

      {resultado && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-lg ${isDark ? "bg-neutral-900 border border-neutral-800" : "bg-red-50 border border-red-100"}`}
        >
          <h4 className={`font-semibold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
            Estimativa de Custas - {resultado.estado}
          </h4>
          <div className="space-y-3">
            {[
              { label: "Taxa Judiciária", value: resultado.taxaJudiciaria },
              { label: "Preparo Recursal", value: resultado.preparo, show: resultado.preparo > 0 },
              { label: "Porte de Remessa", value: resultado.porteRemessa, show: resultado.porteRemessa > 0 },
              { label: "Diligências/Citações", value: resultado.diligencias },
            ].filter(item => item.show !== false).map((item, i) => (
              <div key={i} className="flex justify-between">
                <span className={isDark ? "text-neutral-400" : "text-gray-600"}>{item.label}</span>
                <span className={isDark ? "text-white" : "text-gray-900"}>
                  R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
            <div className={`pt-3 mt-3 border-t ${isDark ? "border-neutral-700" : "border-red-200"} flex justify-between`}>
              <span className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Total Custas</span>
              <span className="font-bold text-red-600 text-lg">
                R$ {resultado.totalCustas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            {resultado.pericia > 0 && (
              <div className="flex justify-between pt-2">
                <span className={`text-sm ${isDark ? "text-neutral-500" : "text-gray-500"}`}>
                  + Perícia (estimativa)
                </span>
                <span className={`text-sm ${isDark ? "text-neutral-400" : "text-gray-600"}`}>
                  R$ {resultado.pericia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>
          <p className={`text-xs mt-4 ${isDark ? "text-neutral-500" : "text-gray-500"}`}>
            * Valores aproximados. Consulte a tabela oficial do tribunal para valores exatos.
          </p>
        </motion.div>
      )}
    </div>
  );
}