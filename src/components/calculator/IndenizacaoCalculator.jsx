import React, { useState } from "react";
import { Calculator, AlertTriangle, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";

// Parâmetros baseados em jurisprudência do STJ
const parametrosDanoMoral = {
  "leve": { min: 1000, max: 10000, salarios: { min: 1, max: 5 } },
  "medio": { min: 10000, max: 30000, salarios: { min: 5, max: 15 } },
  "grave": { min: 30000, max: 100000, salarios: { min: 15, max: 50 } },
  "gravissimo": { min: 100000, max: 500000, salarios: { min: 50, max: 200 } },
  "morte": { min: 200000, max: 1000000, salarios: { min: 100, max: 500 } }
};

const tiposIndenizacao = {
  "consumidor": "Relação de Consumo",
  "trabalho": "Acidente de Trabalho",
  "transito": "Acidente de Trânsito",
  "medico": "Erro Médico",
  "banco": "Negativação Indevida",
  "contrato": "Descumprimento Contratual",
  "honra": "Ofensa à Honra",
  "morte": "Morte de Familiar"
};

export default function IndenizacaoCalculator({ isDark }) {
  const [tipoIndenizacao, setTipoIndenizacao] = useState("consumidor");
  const [gravidade, setGravidade] = useState("medio");
  const [rendaMensal, setRendaMensal] = useState("");
  const [tempoAfastamento, setTempoAfastamento] = useState("");
  const [despesasMedicas, setDespesasMedicas] = useState("");
  const [descricao, setDescricao] = useState("");
  const [resultado, setResultado] = useState(null);

  const calcular = () => {
    const renda = parseFloat(rendaMensal) || 0;
    const mesesAfastado = parseInt(tempoAfastamento) || 0;
    const despesas = parseFloat(despesasMedicas) || 0;

    const params = parametrosDanoMoral[gravidade];

    // Dano moral baseado em parâmetros
    const danoMoralMinimo = params.min;
    const danoMoralMaximo = params.max;
    const danoMoralSugerido = (danoMoralMinimo + danoMoralMaximo) / 2;

    // Em salários mínimos (R$ 1.412,00 em 2024)
    const salarioMinimo = 1412;
    const emSalariosMin = Math.round(danoMoralMinimo / salarioMinimo);
    const emSalariosMax = Math.round(danoMoralMaximo / salarioMinimo);

    // Lucros cessantes
    const lucrosCessantes = renda * mesesAfastado;

    // Danos materiais
    const danosMateriais = despesas;

    // Pensão mensal (se aplicável - acidentes graves)
    let pensaoMensal = 0;
    if (gravidade === "gravissimo" || gravidade === "morte") {
      pensaoMensal = renda * 0.667; // 2/3 da renda
    }

    const totalMinimo = danoMoralMinimo + lucrosCessantes + danosMateriais;
    const totalMaximo = danoMoralMaximo + lucrosCessantes + danosMateriais;

    setResultado({
      tipo: tiposIndenizacao[tipoIndenizacao],
      gravidade,
      danoMoralMinimo,
      danoMoralMaximo,
      danoMoralSugerido,
      emSalariosMin,
      emSalariosMax,
      lucrosCessantes,
      danosMateriais,
      pensaoMensal,
      totalMinimo,
      totalMaximo
    });
  };

  return (
    <div className="space-y-6">
      {/* Aviso */}
      <div className={`p-4 rounded-lg ${isDark ? "bg-amber-900/20 border border-amber-800/30" : "bg-amber-50 border border-amber-200"}`}>
        <div className="flex items-start gap-3">
          <AlertTriangle className={`w-5 h-5 mt-0.5 ${isDark ? "text-amber-400" : "text-amber-600"}`} />
          <div>
            <p className={`text-sm font-medium ${isDark ? "text-amber-300" : "text-amber-800"}`}>
              Valores Referenciais
            </p>
            <p className={`text-xs ${isDark ? "text-amber-400/70" : "text-amber-700"}`}>
              Baseado em parâmetros jurisprudenciais do STJ. O valor final depende da análise do caso concreto.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Tipo de Indenização</Label>
          <Select value={tipoIndenizacao} onValueChange={setTipoIndenizacao}>
            <SelectTrigger className={isDark ? "bg-neutral-900 border-neutral-700" : ""}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(tiposIndenizacao).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Gravidade do Dano</Label>
          <Select value={gravidade} onValueChange={setGravidade}>
            <SelectTrigger className={isDark ? "bg-neutral-900 border-neutral-700" : ""}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="leve">Leve (aborrecimento)</SelectItem>
              <SelectItem value="medio">Médio (constrangimento)</SelectItem>
              <SelectItem value="grave">Grave (sofrimento intenso)</SelectItem>
              <SelectItem value="gravissimo">Gravíssimo (sequelas permanentes)</SelectItem>
              <SelectItem value="morte">Morte</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Renda Mensal da Vítima (R$)</Label>
          <Input
            type="number"
            placeholder="Ex: 5000"
            value={rendaMensal}
            onChange={(e) => setRendaMensal(e.target.value)}
            className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
          />
        </div>

        <div className="space-y-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Tempo de Afastamento (meses)</Label>
          <Input
            type="number"
            placeholder="Ex: 3"
            value={tempoAfastamento}
            onChange={(e) => setTempoAfastamento(e.target.value)}
            className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Despesas Médicas/Materiais (R$)</Label>
          <Input
            type="number"
            placeholder="Ex: 15000"
            value={despesasMedicas}
            onChange={(e) => setDespesasMedicas(e.target.value)}
            className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
          />
        </div>
      </div>

      <Button onClick={calcular} className="w-full bg-rose-600 hover:bg-rose-700">
        <Calculator className="w-4 h-4 mr-2" />
        Calcular Indenização
      </Button>

      {resultado && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-lg ${isDark ? "bg-neutral-900 border border-neutral-800" : "bg-rose-50 border border-rose-100"}`}
        >
          <h4 className={`font-semibold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
            Estimativa de Indenização - {resultado.tipo}
          </h4>

          {/* Dano Moral */}
          <div className={`p-4 rounded-lg mb-4 ${isDark ? "bg-neutral-800" : "bg-white"}`}>
            <h5 className={`text-sm font-medium mb-3 ${isDark ? "text-neutral-300" : "text-gray-700"}`}>
              Dano Moral
            </h5>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className={`text-xs ${isDark ? "text-neutral-500" : "text-gray-500"}`}>Valor Mínimo</p>
                <p className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                  R$ {resultado.danoMoralMinimo.toLocaleString('pt-BR')}
                </p>
                <p className={`text-xs ${isDark ? "text-neutral-500" : "text-gray-500"}`}>
                  ({resultado.emSalariosMin} salários mínimos)
                </p>
              </div>
              <div>
                <p className={`text-xs ${isDark ? "text-neutral-500" : "text-gray-500"}`}>Valor Máximo</p>
                <p className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                  R$ {resultado.danoMoralMaximo.toLocaleString('pt-BR')}
                </p>
                <p className={`text-xs ${isDark ? "text-neutral-500" : "text-gray-500"}`}>
                  ({resultado.emSalariosMax} salários mínimos)
                </p>
              </div>
            </div>
          </div>

          {/* Danos Materiais */}
          <div className="space-y-3">
            {resultado.lucrosCessantes > 0 && (
              <div className="flex justify-between">
                <span className={isDark ? "text-neutral-400" : "text-gray-600"}>Lucros Cessantes</span>
                <span className={isDark ? "text-white" : "text-gray-900"}>
                  R$ {resultado.lucrosCessantes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
            {resultado.danosMateriais > 0 && (
              <div className="flex justify-between">
                <span className={isDark ? "text-neutral-400" : "text-gray-600"}>Danos Materiais</span>
                <span className={isDark ? "text-white" : "text-gray-900"}>
                  R$ {resultado.danosMateriais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
            {resultado.pensaoMensal > 0 && (
              <div className="flex justify-between">
                <span className={isDark ? "text-neutral-400" : "text-gray-600"}>Pensão Mensal (2/3 renda)</span>
                <span className="text-amber-600">
                  R$ {resultado.pensaoMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
                </span>
              </div>
            )}
          </div>

          <div className={`pt-4 mt-4 border-t ${isDark ? "border-neutral-700" : "border-rose-200"}`}>
            <div className="flex justify-between mb-2">
              <span className={`font-medium ${isDark ? "text-neutral-300" : "text-gray-700"}`}>Total Mínimo</span>
              <span className="font-semibold text-rose-600">
                R$ {resultado.totalMinimo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className={`font-medium ${isDark ? "text-neutral-300" : "text-gray-700"}`}>Total Máximo</span>
              <span className="font-bold text-green-600 text-lg">
                R$ {resultado.totalMaximo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}