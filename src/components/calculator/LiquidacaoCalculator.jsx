import React, { useState } from "react";
import { Calculator, FileCheck, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";

export default function LiquidacaoCalculator({ isDark }) {
  const [valorPrincipal, setValorPrincipal] = useState("");
  const [dataBase, setDataBase] = useState("");
  const [dataAtualizacao, setDataAtualizacao] = useState(new Date().toISOString().split('T')[0]);
  const [indiceCorrecao, setIndiceCorrecao] = useState("SELIC");
  const [taxaJurosMora, setTaxaJurosMora] = useState("1");
  const [honorariosSucumbencia, setHonorariosSucumbencia] = useState("10");
  const [multaArt523, setMultaArt523] = useState("sim");
  const [verbas, setVerbas] = useState([{ descricao: "", valor: "" }]);
  const [resultado, setResultado] = useState(null);

  const addVerba = () => {
    setVerbas([...verbas, { descricao: "", valor: "" }]);
  };

  const removeVerba = (index) => {
    setVerbas(verbas.filter((_, i) => i !== index));
  };

  const updateVerba = (index, field, value) => {
    const newVerbas = [...verbas];
    newVerbas[index][field] = value;
    setVerbas(newVerbas);
  };

  const calcular = () => {
    const principal = parseFloat(valorPrincipal) || 0;
    const inicio = new Date(dataBase);
    const fim = new Date(dataAtualizacao);

    if (!principal || isNaN(inicio.getTime())) return;

    // Calcular meses
    const meses = Math.max(0,
      (fim.getFullYear() - inicio.getFullYear()) * 12 +
      (fim.getMonth() - inicio.getMonth())
    );

    // Taxas aproximadas por índice
    const taxasAnuais = {
      "SELIC": 0.1075,
      "IPCA": 0.0465,
      "INPC": 0.0412,
      "IPCAE": 0.0458
    };

    const taxaAnual = taxasAnuais[indiceCorrecao] || 0.1075;
    const taxaMensal = Math.pow(1 + taxaAnual, 1/12) - 1;

    // Correção monetária
    const fatorCorrecao = Math.pow(1 + taxaMensal, meses);
    const valorCorrigido = principal * fatorCorrecao;
    const correcaoMonetaria = valorCorrigido - principal;

    // Juros de mora (se não for SELIC)
    let jurosMora = 0;
    if (indiceCorrecao !== "SELIC") {
      const taxaJuros = parseFloat(taxaJurosMora) / 100 || 0.01;
      jurosMora = principal * taxaJuros * meses;
    }

    // Subtotal antes de honorários e multas
    const subtotal = valorCorrigido + jurosMora;

    // Honorários de sucumbência
    const percHonorarios = parseFloat(honorariosSucumbencia) / 100 || 0.1;
    const honorarios = subtotal * percHonorarios;

    // Multa art. 523 CPC (10%)
    const multa523 = multaArt523 === "sim" ? subtotal * 0.1 : 0;

    // Honorários art. 523 (10%)
    const honorarios523 = multaArt523 === "sim" ? subtotal * 0.1 : 0;

    // Verbas adicionais
    const totalVerbas = verbas.reduce((acc, v) => acc + (parseFloat(v.valor) || 0), 0);

    // Total geral
    const totalGeral = subtotal + honorarios + multa523 + honorarios523 + totalVerbas;

    setResultado({
      principal,
      meses,
      fatorCorrecao,
      correcaoMonetaria,
      valorCorrigido,
      jurosMora,
      subtotal,
      honorarios,
      percHonorarios: honorariosSucumbencia,
      multa523,
      honorarios523,
      totalVerbas,
      totalGeral,
      indice: indiceCorrecao
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Valor Principal (R$)</Label>
          <Input
            type="number"
            placeholder="Ex: 50000"
            value={valorPrincipal}
            onChange={(e) => setValorPrincipal(e.target.value)}
            className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
          />
        </div>

        <div className="space-y-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Índice de Correção</Label>
          <Select value={indiceCorrecao} onValueChange={setIndiceCorrecao}>
            <SelectTrigger className={isDark ? "bg-neutral-900 border-neutral-700" : ""}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SELIC">SELIC (art. 406 CC)</SelectItem>
              <SelectItem value="IPCA">IPCA</SelectItem>
              <SelectItem value="INPC">INPC</SelectItem>
              <SelectItem value="IPCAE">IPCA-E (Precatórios)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Data Base (início)</Label>
          <Input
            type="date"
            value={dataBase}
            onChange={(e) => setDataBase(e.target.value)}
            className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
          />
        </div>

        <div className="space-y-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Data Atualização</Label>
          <Input
            type="date"
            value={dataAtualizacao}
            onChange={(e) => setDataAtualizacao(e.target.value)}
            className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
          />
        </div>

        {indiceCorrecao !== "SELIC" && (
          <div className="space-y-2">
            <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Juros de Mora (% a.m.)</Label>
            <Input
              type="number"
              placeholder="1"
              value={taxaJurosMora}
              onChange={(e) => setTaxaJurosMora(e.target.value)}
              className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Honorários Sucumbência (%)</Label>
          <Input
            type="number"
            placeholder="10"
            value={honorariosSucumbencia}
            onChange={(e) => setHonorariosSucumbencia(e.target.value)}
            className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Aplicar Multa/Honorários Art. 523 CPC?</Label>
          <Select value={multaArt523} onValueChange={setMultaArt523}>
            <SelectTrigger className={isDark ? "bg-neutral-900 border-neutral-700" : ""}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sim">Sim (10% multa + 10% honorários)</SelectItem>
              <SelectItem value="nao">Não</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Verbas adicionais */}
      <div className={`p-4 rounded-lg ${isDark ? "bg-neutral-800/50" : "bg-gray-50"}`}>
        <div className="flex justify-between items-center mb-3">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Verbas Adicionais</Label>
          <Button variant="outline" size="sm" onClick={addVerba}>
            <Plus className="w-4 h-4 mr-1" /> Adicionar
          </Button>
        </div>
        {verbas.map((verba, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <Input
              placeholder="Descrição"
              value={verba.descricao}
              onChange={(e) => updateVerba(index, "descricao", e.target.value)}
              className={`flex-1 ${isDark ? "bg-neutral-900 border-neutral-700" : ""}`}
            />
            <Input
              type="number"
              placeholder="Valor"
              value={verba.valor}
              onChange={(e) => updateVerba(index, "valor", e.target.value)}
              className={`w-32 ${isDark ? "bg-neutral-900 border-neutral-700" : ""}`}
            />
            {verbas.length > 1 && (
              <Button variant="ghost" size="icon" onClick={() => removeVerba(index)}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <Button onClick={calcular} className="w-full bg-cyan-600 hover:bg-cyan-700">
        <Calculator className="w-4 h-4 mr-2" />
        Calcular Liquidação
      </Button>

      {resultado && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-lg ${isDark ? "bg-neutral-900 border border-neutral-800" : "bg-cyan-50 border border-cyan-100"}`}
        >
          <h4 className={`font-semibold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
            Memória de Cálculo - Liquidação de Sentença
          </h4>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className={isDark ? "text-neutral-400" : "text-gray-600"}>Valor Principal</span>
              <span className={isDark ? "text-white" : "text-gray-900"}>
                R$ {resultado.principal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? "text-neutral-400" : "text-gray-600"}>Período</span>
              <span className={isDark ? "text-white" : "text-gray-900"}>
                {resultado.meses} meses
              </span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? "text-neutral-400" : "text-gray-600"}>Correção ({resultado.indice})</span>
              <span className="text-blue-600">
                + R$ {resultado.correcaoMonetaria.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            {resultado.jurosMora > 0 && (
              <div className="flex justify-between">
                <span className={isDark ? "text-neutral-400" : "text-gray-600"}>Juros de Mora</span>
                <span className="text-blue-600">
                  + R$ {resultado.jurosMora.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
            <div className={`flex justify-between py-2 border-t border-b ${isDark ? "border-neutral-700" : "border-cyan-200"}`}>
              <span className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>Subtotal</span>
              <span className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                R$ {resultado.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? "text-neutral-400" : "text-gray-600"}>
                Honorários Sucumbência ({resultado.percHonorarios}%)
              </span>
              <span className={isDark ? "text-white" : "text-gray-900"}>
                + R$ {resultado.honorarios.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            {resultado.multa523 > 0 && (
              <>
                <div className="flex justify-between">
                  <span className={isDark ? "text-neutral-400" : "text-gray-600"}>Multa Art. 523 (10%)</span>
                  <span className="text-orange-600">
                    + R$ {resultado.multa523.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? "text-neutral-400" : "text-gray-600"}>Honorários Art. 523 (10%)</span>
                  <span className="text-orange-600">
                    + R$ {resultado.honorarios523.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </>
            )}
            {resultado.totalVerbas > 0 && (
              <div className="flex justify-between">
                <span className={isDark ? "text-neutral-400" : "text-gray-600"}>Verbas Adicionais</span>
                <span className={isDark ? "text-white" : "text-gray-900"}>
                  + R$ {resultado.totalVerbas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
            <div className={`pt-3 mt-3 border-t ${isDark ? "border-neutral-700" : "border-cyan-200"} flex justify-between`}>
              <span className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>TOTAL EXEQUENDO</span>
              <span className="font-bold text-green-600 text-xl">
                R$ {resultado.totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}