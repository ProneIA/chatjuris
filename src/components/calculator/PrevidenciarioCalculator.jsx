import React, { useState } from "react";
import { Calculator, Shield, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";

// Valores 2024
const TETO_INSS = 7786.02;
const SALARIO_MINIMO = 1412.00;

// Alíquotas progressivas INSS
const aliquotasINSS = [
  { ate: 1412.00, aliquota: 0.075 },
  { ate: 2666.68, aliquota: 0.09 },
  { ate: 4000.03, aliquota: 0.12 },
  { ate: 7786.02, aliquota: 0.14 }
];

export default function PrevidenciarioCalculator({ isDark }) {
  const [tipoCalculo, setTipoCalculo] = useState("rmi");
  const [mediaSalarial, setMediaSalarial] = useState("");
  const [tempoContribuicao, setTempoContribuicao] = useState("");
  const [idade, setIdade] = useState("");
  const [tipoBeneficio, setTipoBeneficio] = useState("aposentadoria");
  const [resultado, setResultado] = useState(null);

  const calcularFatorPrevidenciario = (tc, id) => {
    const a = 0.31; // Alíquota
    const Es = 21; // Expectativa de sobrevida (aproximado)
    const Tc = tc;
    const Id = id;
    
    const fator = (Tc * a / Es) * (1 + (Id + Tc * a) / 100);
    return Math.max(fator, 0.5); // Mínimo de 0.5
  };

  const calcular = () => {
    const media = parseFloat(mediaSalarial) || 0;
    const tempo = parseInt(tempoContribuicao) || 0;
    const id = parseInt(idade) || 0;

    if (!media || !tempo) return;

    let rmi = 0;
    let coeficiente = 0;
    let fatorPrev = 1;
    let descricaoRegra = "";

    if (tipoCalculo === "rmi") {
      // Regra pós-reforma (EC 103/2019)
      // 60% + 2% para cada ano acima de 20 anos (homem) ou 15 anos (mulher)
      const anosExcedentes = Math.max(0, tempo - 20);
      coeficiente = 0.60 + (anosExcedentes * 0.02);
      coeficiente = Math.min(coeficiente, 1); // Máximo 100%
      
      rmi = media * coeficiente;
      rmi = Math.min(rmi, TETO_INSS);
      rmi = Math.max(rmi, SALARIO_MINIMO);
      
      descricaoRegra = `Regra EC 103/2019: 60% + 2% por ano acima de 20 anos`;
    } else if (tipoCalculo === "fator") {
      // Com fator previdenciário (regra antiga)
      fatorPrev = calcularFatorPrevidenciario(tempo, id);
      rmi = media * fatorPrev;
      rmi = Math.min(rmi, TETO_INSS);
      rmi = Math.max(rmi, SALARIO_MINIMO);
      
      descricaoRegra = `Com fator previdenciário: ${fatorPrev.toFixed(4)}`;
    }

    // Calcular contribuição mensal sobre a média
    let contribuicaoMensal = 0;
    let salarioRestante = Math.min(media, TETO_INSS);
    let faixaAnterior = 0;

    for (const faixa of aliquotasINSS) {
      if (salarioRestante > 0) {
        const baseCalculo = Math.min(salarioRestante, faixa.ate - faixaAnterior);
        contribuicaoMensal += baseCalculo * faixa.aliquota;
        salarioRestante -= baseCalculo;
        faixaAnterior = faixa.ate;
      }
    }

    // Atrasados (exemplo: 5 anos)
    const mesesAtrasados = 60;
    const atrasados = rmi * mesesAtrasados;

    setResultado({
      tipoCalculo,
      media,
      tempo,
      idade: id,
      coeficiente: coeficiente * 100,
      fatorPrevidenciario: fatorPrev,
      rmi,
      contribuicaoMensal,
      atrasados,
      descricaoRegra,
      tetoINSS: TETO_INSS,
      salarioMinimo: SALARIO_MINIMO
    });
  };

  return (
    <div className="space-y-6">
      {/* Info */}
      <div className={`p-4 rounded-lg ${isDark ? "bg-neutral-800/50" : "bg-teal-50"}`}>
        <div className="flex items-start gap-3">
          <Shield className={`w-5 h-5 mt-0.5 ${isDark ? "text-teal-400" : "text-teal-600"}`} />
          <div>
            <p className={`text-sm font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
              Cálculos baseados nas regras da EC 103/2019
            </p>
            <p className={`text-xs ${isDark ? "text-neutral-400" : "text-gray-600"}`}>
              Teto INSS: R$ {TETO_INSS.toLocaleString('pt-BR')} | Salário Mínimo: R$ {SALARIO_MINIMO.toLocaleString('pt-BR')}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Tipo de Cálculo</Label>
          <Select value={tipoCalculo} onValueChange={setTipoCalculo}>
            <SelectTrigger className={isDark ? "bg-neutral-900 border-neutral-700" : ""}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rmi">RMI (Regra EC 103/2019)</SelectItem>
              <SelectItem value="fator">Com Fator Previdenciário</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Tipo de Benefício</Label>
          <Select value={tipoBeneficio} onValueChange={setTipoBeneficio}>
            <SelectTrigger className={isDark ? "bg-neutral-900 border-neutral-700" : ""}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="aposentadoria">Aposentadoria por Idade</SelectItem>
              <SelectItem value="tempo">Aposentadoria por Tempo</SelectItem>
              <SelectItem value="invalidez">Aposentadoria por Invalidez</SelectItem>
              <SelectItem value="auxilio">Auxílio-Doença</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Média Salarial (R$)</Label>
          <Input
            type="number"
            placeholder="Ex: 5000"
            value={mediaSalarial}
            onChange={(e) => setMediaSalarial(e.target.value)}
            className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
          />
          <p className={`text-xs ${isDark ? "text-neutral-500" : "text-gray-500"}`}>
            Média de todas as contribuições desde 07/1994
          </p>
        </div>

        <div className="space-y-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Tempo de Contribuição (anos)</Label>
          <Input
            type="number"
            placeholder="Ex: 35"
            value={tempoContribuicao}
            onChange={(e) => setTempoContribuicao(e.target.value)}
            className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
          />
        </div>

        {tipoCalculo === "fator" && (
          <div className="space-y-2 md:col-span-2">
            <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Idade na DIB</Label>
            <Input
              type="number"
              placeholder="Ex: 65"
              value={idade}
              onChange={(e) => setIdade(e.target.value)}
              className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
            />
          </div>
        )}
      </div>

      <Button onClick={calcular} className="w-full bg-teal-600 hover:bg-teal-700">
        <Calculator className="w-4 h-4 mr-2" />
        Calcular Benefício
      </Button>

      {resultado && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-lg ${isDark ? "bg-neutral-900 border border-neutral-800" : "bg-teal-50 border border-teal-100"}`}
        >
          <h4 className={`font-semibold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
            Cálculo do Benefício Previdenciário
          </h4>
          <p className={`text-xs mb-4 ${isDark ? "text-neutral-500" : "text-gray-500"}`}>
            {resultado.descricaoRegra}
          </p>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className={isDark ? "text-neutral-400" : "text-gray-600"}>Média Salarial</span>
              <span className={isDark ? "text-white" : "text-gray-900"}>
                R$ {resultado.media.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? "text-neutral-400" : "text-gray-600"}>Tempo de Contribuição</span>
              <span className={isDark ? "text-white" : "text-gray-900"}>
                {resultado.tempo} anos
              </span>
            </div>
            {resultado.tipoCalculo === "rmi" && (
              <div className="flex justify-between">
                <span className={isDark ? "text-neutral-400" : "text-gray-600"}>Coeficiente</span>
                <span className={isDark ? "text-white" : "text-gray-900"}>
                  {resultado.coeficiente.toFixed(0)}%
                </span>
              </div>
            )}
            {resultado.tipoCalculo === "fator" && (
              <div className="flex justify-between">
                <span className={isDark ? "text-neutral-400" : "text-gray-600"}>Fator Previdenciário</span>
                <span className={isDark ? "text-white" : "text-gray-900"}>
                  {resultado.fatorPrevidenciario.toFixed(4)}
                </span>
              </div>
            )}
            <div className={`pt-3 mt-3 border-t ${isDark ? "border-neutral-700" : "border-teal-200"} flex justify-between`}>
              <span className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>RMI (Renda Mensal Inicial)</span>
              <span className="font-bold text-teal-600 text-lg">
                R$ {resultado.rmi.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? "text-neutral-400" : "text-gray-600"}>Atrasados (5 anos estimado)</span>
              <span className="text-green-600 font-medium">
                R$ {resultado.atrasados.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <p className={`text-xs mt-4 ${isDark ? "text-neutral-500" : "text-gray-500"}`}>
            * Cálculo simplificado. Valores exatos dependem do CNIS e regras de transição aplicáveis.
          </p>
        </motion.div>
      )}
    </div>
  );
}