import React, { useState } from "react";
import { Calculator, AlertTriangle, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";

// Parâmetros baseados em jurisprudência do STJ e RENDA MENSAL da vítima
// Base: RENDA MENSAL (não salário mínimo como indexador)
const multiplicadoresPorGravidade = {
  "leve": { min: 5, max: 10, descricao: "Aborrecimento, constrangimento leve" },
  "medio": { min: 10, max: 20, descricao: "Constrangimento, sofrimento moderado" },
  "grave": { min: 20, max: 30, descricao: "Sofrimento intenso, sequelas temporárias" },
  "gravissimo": { min: 30, max: 50, descricao: "Sequelas permanentes, invalidez, morte" }
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

    // VALIDAÇÃO: Renda mensal é obrigatória para dano moral
    if (!renda) {
      alert("⚠️ ATENÇÃO: Informe a renda mensal da vítima. A base preferencial é a RENDA MENSAL, não o salário mínimo.");
      return;
    }

    const params = multiplicadoresPorGravidade[gravidade];

    // DANO MORAL: Calculado com base na RENDA MENSAL da vítima (não salário mínimo)
    const danoMoralMinimo = renda * params.min;
    const danoMoralMaximo = renda * params.max;
    const danoMoralSugerido = (danoMoralMinimo + danoMoralMaximo) / 2;

    // LUCROS CESSANTES: Somente se houver afastamento E renda comprovável
    const lucrosCessantes = (mesesAfastado > 0 && renda > 0) ? renda * mesesAfastado : 0;

    // DANOS MATERIAIS: Exclusivamente valores comprováveis
    const danosMateriais = despesas;

    // PENSÃO MENSAL: Somente em casos gravíssimos com incapacidade permanente
    let pensaoMensal = 0;
    let pensaoJustificativa = "";
    if (gravidade === "gravissimo") {
      pensaoMensal = renda * 0.667; // 2/3 da renda
      pensaoJustificativa = "⚠️ PENSÃO: Aplicável apenas se houver incapacidade PERMANENTE comprovada por perícia. Valor sujeito a análise judicial.";
    }

    // SEPARAÇÃO OBRIGATÓRIA - cada espécie calculada individualmente
    const totalMinimo = danoMoralMinimo + lucrosCessantes + danosMateriais;
    const totalMaximo = danoMoralMaximo + lucrosCessantes + danosMateriais;

    setResultado({
      tipo: tiposIndenizacao[tipoIndenizacao],
      gravidade,
      danoMoralMinimo,
      danoMoralMaximo,
      danoMoralSugerido,
      multiplicadorMin: params.min,
      multiplicadorMax: params.max,
      rendaBase: renda,
      lucrosCessantes,
      danosMateriais,
      pensaoMensal,
      pensaoJustificativa,
      totalMinimo,
      totalMaximo
    });
  };

  return (
    <div className="space-y-6">
      {/* Aviso Obrigatório */}
      <div className={`p-4 rounded-lg ${isDark ? "bg-amber-900/20 border border-amber-800/30" : "bg-amber-50 border border-amber-200"}`}>
        <div className="flex items-start gap-3">
          <AlertTriangle className={`w-5 h-5 mt-0.5 ${isDark ? "text-amber-400" : "text-amber-600"}`} />
          <div>
            <p className={`text-sm font-medium mb-2 ${isDark ? "text-amber-300" : "text-amber-800"}`}>
              ⚖️ VALORES ESTIMATIVOS
            </p>
            <ul className={`text-xs space-y-1 ${isDark ? "text-amber-400/70" : "text-amber-700"}`}>
              <li>✓ Base: RENDA MENSAL da vítima (não salário mínimo)</li>
              <li>✓ Separação obrigatória: Dano moral, material, lucros cessantes e pensão</li>
              <li>✓ Valores dependem da análise judicial do caso concreto</li>
              <li>✓ Pensão apenas se incapacidade permanente comprovada</li>
              <li>✓ Não substitui atuação profissional do advogado</li>
            </ul>
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
              <SelectItem value="leve">Leve: 5-10x renda mensal</SelectItem>
              <SelectItem value="medio">Moderado: 10-20x renda mensal</SelectItem>
              <SelectItem value="grave">Grave: 20-30x renda mensal</SelectItem>
              <SelectItem value="gravissimo">Gravíssimo: 30-50x renda mensal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>
            Renda Mensal da Vítima (R$) *
          </Label>
          <Input
            type="number"
            placeholder="Ex: 5000 (OBRIGATÓRIO - base do cálculo)"
            value={rendaMensal}
            onChange={(e) => setRendaMensal(e.target.value)}
            className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
            required
          />
          <p className={`text-xs ${isDark ? "text-neutral-500" : "text-gray-500"}`}>
            Base preferencial: renda mensal comprovada (não salário mínimo)
          </p>
        </div>

        <div className="space-y-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>
            Tempo de Afastamento (meses)
          </Label>
          <Input
            type="number"
            placeholder="Ex: 3 (para lucros cessantes)"
            value={tempoAfastamento}
            onChange={(e) => setTempoAfastamento(e.target.value)}
            className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
          />
          <p className={`text-xs ${isDark ? "text-neutral-500" : "text-gray-500"}`}>
            Lucros cessantes: apenas se houver interrupção temporária comprovável
          </p>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>
            Despesas Médicas/Materiais Comprováveis (R$)
          </Label>
          <Input
            type="number"
            placeholder="Ex: 15000 (apenas valores documentados)"
            value={despesasMedicas}
            onChange={(e) => setDespesasMedicas(e.target.value)}
            className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
          />
          <p className={`text-xs ${isDark ? "text-neutral-500" : "text-gray-500"}`}>
            Danos materiais: exclusivamente valores comprováveis (recibos, notas)
          </p>
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

          {/* 1. DANO MORAL */}
          <div className={`p-4 rounded-lg mb-4 ${isDark ? "bg-neutral-800" : "bg-white"}`}>
            <h5 className={`text-sm font-medium mb-3 ${isDark ? "text-neutral-300" : "text-gray-700"}`}>
              1️⃣ DANO MORAL (calculado separadamente)
            </h5>
            <p className={`text-xs mb-3 ${isDark ? "text-neutral-500" : "text-gray-500"}`}>
              Base: R$ {resultado.rendaBase.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (renda mensal) × {resultado.multiplicadorMin} a {resultado.multiplicadorMax}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className={`text-xs ${isDark ? "text-neutral-500" : "text-gray-500"}`}>Valor Mínimo</p>
                <p className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                  R$ {resultado.danoMoralMinimo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className={`text-xs ${isDark ? "text-neutral-500" : "text-gray-500"}`}>Valor Máximo</p>
                <p className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                  R$ {resultado.danoMoralMaximo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* 2. OUTRAS ESPÉCIES (calculadas separadamente) */}
          <div className={`space-y-3 mb-4 p-4 rounded-lg ${isDark ? "bg-neutral-800" : "bg-white"}`}>
            <h5 className={`text-sm font-medium mb-3 ${isDark ? "text-neutral-300" : "text-gray-700"}`}>
              2️⃣ OUTRAS VERBAS (separadas)
            </h5>
            {resultado.danosMateriais > 0 && (
              <div className="flex justify-between border-b pb-2">
                <div>
                  <span className={`block ${isDark ? "text-neutral-400" : "text-gray-600"}`}>Danos Materiais</span>
                  <span className={`text-xs ${isDark ? "text-neutral-500" : "text-gray-500"}`}>Valores comprováveis</span>
                </div>
                <span className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                  R$ {resultado.danosMateriais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
            {resultado.lucrosCessantes > 0 && (
              <div className="flex justify-between border-b pb-2">
                <div>
                  <span className={`block ${isDark ? "text-neutral-400" : "text-gray-600"}`}>Lucros Cessantes</span>
                  <span className={`text-xs ${isDark ? "text-neutral-500" : "text-gray-500"}`}>Renda × período afastamento</span>
                </div>
                <span className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                  R$ {resultado.lucrosCessantes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
            {resultado.pensaoMensal > 0 && (
              <div className="border-b pb-2">
                <div className="flex justify-between mb-1">
                  <span className={isDark ? "text-neutral-400" : "text-gray-600"}>Pensão Mensal (2/3 renda)</span>
                  <span className="text-amber-600 font-semibold">
                    R$ {resultado.pensaoMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
                  </span>
                </div>
                <p className={`text-xs ${isDark ? "text-amber-400" : "text-amber-600"}`}>
                  {resultado.pensaoJustificativa}
                </p>
              </div>
            )}
          </div>

          {/* TOTAL (soma das espécies separadas) */}
          <div className={`pt-4 mt-4 border-t-2 ${isDark ? "border-neutral-600" : "border-rose-300"}`}>
            <p className={`text-xs mb-3 ${isDark ? "text-neutral-500" : "text-gray-500"}`}>
              ✓ Total = Dano Moral + Danos Materiais + Lucros Cessantes (pensão não soma ao total)
            </p>
            <div className="flex justify-between mb-2">
              <span className={`font-medium ${isDark ? "text-neutral-300" : "text-gray-700"}`}>Total Estimado Mínimo</span>
              <span className="font-semibold text-rose-600">
                R$ {resultado.totalMinimo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className={`font-medium ${isDark ? "text-neutral-300" : "text-gray-700"}`}>Total Estimado Máximo</span>
              <span className="font-bold text-green-600 text-lg">
                R$ {resultado.totalMaximo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Aviso Final */}
          <div className={`mt-4 p-3 rounded-lg ${isDark ? "bg-amber-900/20 border border-amber-800/30" : "bg-amber-50 border border-amber-200"}`}>
            <p className={`text-xs ${isDark ? "text-amber-400" : "text-amber-700"}`}>
              ⚖️ <strong>AVISO LEGAL:</strong> Valores ESTIMATIVOS. Dependem da análise judicial do caso concreto e não substituem a atuação profissional do advogado.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}