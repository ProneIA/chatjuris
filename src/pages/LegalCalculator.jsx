import React, { useState } from "react";
import { Calculator, Percent, Calendar, Scale, DollarSign, Briefcase, FileText, ChevronRight, Heart, Shield, FileCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";

// Componentes de calculadora
import AICalculatorAssistant from "../components/calculator/AICalculatorAssistant";
import CustasCalculator from "../components/calculator/CustasCalculator";
import AtualizacaoCalculator from "../components/calculator/AtualizacaoCalculator";
import IndenizacaoCalculator from "../components/calculator/IndenizacaoCalculator";
import PrevidenciarioCalculator from "../components/calculator/PrevidenciarioCalculator";
import LiquidacaoCalculator from "../components/calculator/LiquidacaoCalculator";

const calculatorTypes = [
  {
    id: "juros",
    title: "Juros e Correção",
    description: "Juros simples, compostos e correção monetária",
    icon: Percent,
    color: "blue"
  },
  {
    id: "trabalhista",
    title: "Cálculos Trabalhistas",
    description: "Rescisão, férias, 13º, horas extras",
    icon: Briefcase,
    color: "green"
  },
  {
    id: "honorarios",
    title: "Honorários",
    description: "Honorários advocatícios e sucumbência",
    icon: Scale,
    color: "purple"
  },
  {
    id: "prazos",
    title: "Prazos Processuais",
    description: "Dias úteis e corridos (CPC/CLT)",
    icon: Calendar,
    color: "orange"
  },
  {
    id: "custas",
    title: "Custas Judiciais",
    description: "Custas por tribunal e instância",
    icon: FileText,
    color: "red"
  },
  {
    id: "atualizacao",
    title: "Atualização Monetária",
    description: "SELIC, IPCA, INPC, IGP-M, TR",
    icon: DollarSign,
    color: "indigo"
  },
  {
    id: "indenizacao",
    title: "Indenizações",
    description: "Danos morais e materiais (STJ)",
    icon: Heart,
    color: "rose"
  },
  {
    id: "previdenciario",
    title: "Previdenciário",
    description: "RMI, fator, atrasados INSS",
    icon: Shield,
    color: "teal"
  },
  {
    id: "liquidacao",
    title: "Liquidação",
    description: "Liquidação de sentença completa",
    icon: FileCheck,
    color: "cyan"
  }
];

// Componente de Juros e Correção
function JurosCalculator({ isDark }) {
  const [tipoJuros, setTipoJuros] = useState("simples");
  const [valorPrincipal, setValorPrincipal] = useState("");
  const [taxaJuros, setTaxaJuros] = useState("");
  const [periodo, setPeriodo] = useState("");
  const [taxaTipo, setTaxaTipo] = useState("mensal");
  const [resultado, setResultado] = useState(null);

  const calcular = () => {
    const principal = parseFloat(valorPrincipal) || 0;
    let taxa = parseFloat(taxaJuros) / 100 || 0;
    const meses = parseInt(periodo) || 0;

    // Converter taxa anual para mensal se necessário
    if (taxaTipo === "anual") {
      taxa = Math.pow(1 + taxa, 1/12) - 1;
    }

    let juros = 0;
    let montante = 0;

    if (tipoJuros === "simples") {
      juros = principal * taxa * meses;
      montante = principal + juros;
    } else {
      montante = principal * Math.pow(1 + taxa, meses);
      juros = montante - principal;
    }

    // Taxa equivalente
    const taxaMensalEfetiva = taxa * 100;
    const taxaAnualEfetiva = (Math.pow(1 + taxa, 12) - 1) * 100;

    setResultado({
      principal,
      juros,
      montante,
      taxaMensal: taxaMensalEfetiva,
      taxaAnual: taxaAnualEfetiva,
      periodo: meses
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Tipo de Juros</Label>
          <Select value={tipoJuros} onValueChange={setTipoJuros}>
            <SelectTrigger className={isDark ? "bg-neutral-900 border-neutral-700" : ""}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="simples">Juros Simples (art. 591 CC)</SelectItem>
              <SelectItem value="compostos">Juros Compostos</SelectItem>
              <SelectItem value="legal">Juros Legais - SELIC (art. 406 CC)</SelectItem>
              <SelectItem value="mora">Juros de Mora (1% a.m.)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Valor Principal (R$)</Label>
          <Input
            type="number"
            placeholder="Ex: 10000"
            value={valorPrincipal}
            onChange={(e) => setValorPrincipal(e.target.value)}
            className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
          />
        </div>

        <div className="space-y-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Taxa de Juros (%)</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Ex: 1"
              value={taxaJuros}
              onChange={(e) => setTaxaJuros(e.target.value)}
              className={`flex-1 ${isDark ? "bg-neutral-900 border-neutral-700" : ""}`}
            />
            <Select value={taxaTipo} onValueChange={setTaxaTipo}>
              <SelectTrigger className={`w-28 ${isDark ? "bg-neutral-900 border-neutral-700" : ""}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mensal">a.m.</SelectItem>
                <SelectItem value="anual">a.a.</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Período (meses)</Label>
          <Input
            type="number"
            placeholder="Ex: 12"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
          />
        </div>
      </div>

      <Button onClick={calcular} className="w-full bg-blue-600 hover:bg-blue-700">
        <Calculator className="w-4 h-4 mr-2" />
        Calcular
      </Button>

      {resultado && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-lg ${isDark ? "bg-neutral-900 border border-neutral-800" : "bg-blue-50 border border-blue-100"}`}
        >
          <h4 className={`font-semibold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>Resultado do Cálculo</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className={`text-sm ${isDark ? "text-neutral-400" : "text-gray-500"}`}>Valor Principal</p>
              <p className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                R$ {resultado.principal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className={`text-sm ${isDark ? "text-neutral-400" : "text-gray-500"}`}>Juros Acumulados</p>
              <p className="text-lg font-semibold text-blue-600">
                R$ {resultado.juros.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className={`text-sm ${isDark ? "text-neutral-400" : "text-gray-500"}`}>Montante Final</p>
              <p className="text-lg font-semibold text-green-600">
                R$ {resultado.montante.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className={`text-sm ${isDark ? "text-neutral-400" : "text-gray-500"}`}>Período</p>
              <p className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                {resultado.periodo} meses
              </p>
            </div>
            <div>
              <p className={`text-sm ${isDark ? "text-neutral-400" : "text-gray-500"}`}>Taxa Mensal Efetiva</p>
              <p className={`text-lg ${isDark ? "text-white" : "text-gray-900"}`}>
                {resultado.taxaMensal.toFixed(4)}%
              </p>
            </div>
            <div>
              <p className={`text-sm ${isDark ? "text-neutral-400" : "text-gray-500"}`}>Taxa Anual Efetiva</p>
              <p className={`text-lg ${isDark ? "text-white" : "text-gray-900"}`}>
                {resultado.taxaAnual.toFixed(2)}%
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Componente de Cálculos Trabalhistas
function TrabalhistaCalculator({ isDark }) {
  const [tipoCalculo, setTipoCalculo] = useState("rescisao_sem_justa");
  const [salario, setSalario] = useState("");
  const [mesesTrabalhados, setMesesTrabalhados] = useState("");
  const [diasTrabalhados, setDiasTrabalhados] = useState("15");
  const [feriasVencidas, setFeriasVencidas] = useState("0");
  const [avisoPrevio, setAvisoPrevio] = useState("indenizado");
  const [horasExtras, setHorasExtras] = useState("");
  const [resultado, setResultado] = useState(null);

  const calcular = () => {
    const sal = parseFloat(salario) || 0;
    const meses = parseInt(mesesTrabalhados) || 0;
    const dias = parseInt(diasTrabalhados) || 0;
    const ferias = parseInt(feriasVencidas) || 0;
    const horas = parseFloat(horasExtras) || 0;

    // Saldo de salário
    const saldoSalario = (sal / 30) * dias;

    // Aviso prévio proporcional (Lei 12.506/2011)
    const diasAvisoPrevio = Math.min(90, 30 + Math.floor(meses / 12) * 3);
    let avisoPrevioValor = 0;
    let avisoPrevioDias = 0;

    if (tipoCalculo === "rescisao_sem_justa" && avisoPrevio === "indenizado") {
      avisoPrevioValor = (sal / 30) * diasAvisoPrevio;
      avisoPrevioDias = diasAvisoPrevio;
    }

    // Férias proporcionais (meses do período aquisitivo)
    const mesesFerias = meses % 12;
    const feriasProporcionais = (sal / 12) * mesesFerias;
    const tercoFeriasProporcionais = feriasProporcionais / 3;

    // Férias vencidas
    const feriasVencidasValor = ferias * sal;
    const tercoFeriasVencidas = feriasVencidasValor / 3;

    // 13º proporcional
    const meses13 = new Date().getMonth() + 1;
    const decimoTerceiro = (sal / 12) * meses13;

    // FGTS
    const fgtsDeposito = sal * 0.08 * meses;
    
    // Multa FGTS
    let multaFgts = 0;
    if (tipoCalculo === "rescisao_sem_justa") {
      multaFgts = fgtsDeposito * 0.4;
    } else if (tipoCalculo === "acordo") {
      multaFgts = fgtsDeposito * 0.2; // 20% no acordo
    }

    // Horas extras (50%)
    const valorHoraExtra = (sal / 220) * 1.5 * horas;

    // Multas CLT
    let multa477 = 0;
    let multa467 = 0;
    
    // Total
    let total = saldoSalario + avisoPrevioValor + feriasProporcionais + tercoFeriasProporcionais + 
                feriasVencidasValor + tercoFeriasVencidas + decimoTerceiro + multaFgts + valorHoraExtra;

    // Ajustes por tipo de rescisão
    if (tipoCalculo === "pedido_demissao") {
      multaFgts = 0;
      total = saldoSalario + feriasProporcionais + tercoFeriasProporcionais + 
              feriasVencidasValor + tercoFeriasVencidas + decimoTerceiro + valorHoraExtra;
    } else if (tipoCalculo === "justa_causa") {
      multaFgts = 0;
      total = saldoSalario + feriasVencidasValor + tercoFeriasVencidas;
    }

    setResultado({
      tipo: tipoCalculo,
      saldoSalario,
      avisoPrevioValor,
      avisoPrevioDias,
      feriasProporcionais,
      tercoFeriasProporcionais,
      feriasVencidasValor,
      tercoFeriasVencidas,
      decimoTerceiro,
      fgtsDeposito,
      multaFgts,
      valorHoraExtra,
      multa477,
      multa467,
      total
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Tipo de Rescisão</Label>
          <Select value={tipoCalculo} onValueChange={setTipoCalculo}>
            <SelectTrigger className={isDark ? "bg-neutral-900 border-neutral-700" : ""}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rescisao_sem_justa">Sem Justa Causa (art. 477 CLT)</SelectItem>
              <SelectItem value="pedido_demissao">Pedido de Demissão</SelectItem>
              <SelectItem value="acordo">Acordo (art. 484-A CLT)</SelectItem>
              <SelectItem value="justa_causa">Justa Causa (art. 482 CLT)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Salário Bruto (R$)</Label>
          <Input
            type="number"
            placeholder="Ex: 3000"
            value={salario}
            onChange={(e) => setSalario(e.target.value)}
            className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
          />
        </div>

        <div className="space-y-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Meses Trabalhados</Label>
          <Input
            type="number"
            placeholder="Ex: 24"
            value={mesesTrabalhados}
            onChange={(e) => setMesesTrabalhados(e.target.value)}
            className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
          />
        </div>

        <div className="space-y-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Dias Trabalhados no Mês</Label>
          <Input
            type="number"
            placeholder="Ex: 15"
            value={diasTrabalhados}
            onChange={(e) => setDiasTrabalhados(e.target.value)}
            className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
          />
        </div>

        <div className="space-y-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Férias Vencidas</Label>
          <Select value={feriasVencidas} onValueChange={setFeriasVencidas}>
            <SelectTrigger className={isDark ? "bg-neutral-900 border-neutral-700" : ""}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Nenhuma</SelectItem>
              <SelectItem value="1">1 período</SelectItem>
              <SelectItem value="2">2 períodos (em dobro)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {tipoCalculo === "rescisao_sem_justa" && (
          <div className="space-y-2">
            <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Aviso Prévio</Label>
            <Select value={avisoPrevio} onValueChange={setAvisoPrevio}>
              <SelectTrigger className={isDark ? "bg-neutral-900 border-neutral-700" : ""}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trabalhado">Trabalhado</SelectItem>
                <SelectItem value="indenizado">Indenizado (Lei 12.506/2011)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2 md:col-span-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Horas Extras Pendentes</Label>
          <Input
            type="number"
            placeholder="Quantidade de horas"
            value={horasExtras}
            onChange={(e) => setHorasExtras(e.target.value)}
            className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
          />
        </div>
      </div>

      <Button onClick={calcular} className="w-full bg-green-600 hover:bg-green-700">
        <Calculator className="w-4 h-4 mr-2" />
        Calcular Rescisão
      </Button>

      {resultado && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-lg ${isDark ? "bg-neutral-900 border border-neutral-800" : "bg-green-50 border border-green-100"}`}
        >
          <h4 className={`font-semibold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>Verbas Rescisórias</h4>
          <div className="space-y-3">
            {[
              { label: "Saldo de Salário", value: resultado.saldoSalario, show: true },
              { label: `Aviso Prévio Indenizado (${resultado.avisoPrevioDias} dias)`, value: resultado.avisoPrevioValor, show: resultado.avisoPrevioValor > 0 },
              { label: "Férias Proporcionais", value: resultado.feriasProporcionais, show: resultado.feriasProporcionais > 0 },
              { label: "1/3 Férias Proporcionais", value: resultado.tercoFeriasProporcionais, show: resultado.tercoFeriasProporcionais > 0 },
              { label: "Férias Vencidas", value: resultado.feriasVencidasValor, show: resultado.feriasVencidasValor > 0 },
              { label: "1/3 Férias Vencidas", value: resultado.tercoFeriasVencidas, show: resultado.tercoFeriasVencidas > 0 },
              { label: "13º Proporcional", value: resultado.decimoTerceiro, show: resultado.decimoTerceiro > 0 },
              { label: "FGTS Depositado (referência)", value: resultado.fgtsDeposito, show: true },
              { label: "Multa FGTS (40%)", value: resultado.multaFgts, show: resultado.multaFgts > 0 },
              { label: "Horas Extras (50%)", value: resultado.valorHoraExtra, show: resultado.valorHoraExtra > 0 },
            ].filter(item => item.show).map((item, i) => (
              <div key={i} className="flex justify-between">
                <span className={isDark ? "text-neutral-400" : "text-gray-600"}>{item.label}</span>
                <span className={isDark ? "text-white" : "text-gray-900"}>
                  R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
            <div className={`pt-3 mt-3 border-t ${isDark ? "border-neutral-700" : "border-green-200"} flex justify-between`}>
              <span className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Total Estimado</span>
              <span className="font-bold text-green-600 text-lg">
                R$ {resultado.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Componente de Honorários
function HonorariosCalculator({ isDark }) {
  const [valorCausa, setValorCausa] = useState("");
  const [percentual, setPercentual] = useState("15");
  const [tipoHonorario, setTipoHonorario] = useState("sucumbencia");
  const [fazendaPublica, setFazendaPublica] = useState("nao");
  const [resultado, setResultado] = useState(null);

  const calcular = () => {
    const valor = parseFloat(valorCausa) || 0;
    let perc = parseFloat(percentual) || 0;

    // Limites do art. 85 CPC
    let minimo = 10;
    let maximo = 20;

    if (fazendaPublica === "sim") {
      // Art. 85, §3º CPC - Fazenda Pública
      if (valor <= 200 * 1412) { // até 200 SM
        minimo = 10; maximo = 20;
      } else if (valor <= 2000 * 1412) {
        minimo = 8; maximo = 10;
      } else if (valor <= 20000 * 1412) {
        minimo = 5; maximo = 8;
      } else if (valor <= 100000 * 1412) {
        minimo = 3; maximo = 5;
      } else {
        minimo = 1; maximo = 3;
      }
    }

    perc = Math.max(minimo, Math.min(perc, maximo));

    const honorarios = valor * (perc / 100);
    const honorariosMinimo = valor * (minimo / 100);
    const honorariosMaximo = valor * (maximo / 100);

    // Honorários recursais (§11, art. 85 CPC)
    const honorariosRecursais = honorarios * 0.1; // Majoração de 10%

    setResultado({
      valorCausa: valor,
      percentual: perc,
      percentualMinimo: minimo,
      percentualMaximo: maximo,
      honorarios,
      honorariosMinimo,
      honorariosMaximo,
      honorariosRecursais,
      fazenda: fazendaPublica === "sim"
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Tipo de Honorário</Label>
          <Select value={tipoHonorario} onValueChange={setTipoHonorario}>
            <SelectTrigger className={isDark ? "bg-neutral-900 border-neutral-700" : ""}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sucumbencia">Sucumbência (art. 85 CPC)</SelectItem>
              <SelectItem value="contratual">Contratual (art. 22 EOAB)</SelectItem>
              <SelectItem value="exito">Êxito (ad exitum)</SelectItem>
              <SelectItem value="arbitramento">Arbitramento Judicial</SelectItem>
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
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Percentual (%)</Label>
          <Input
            type="number"
            placeholder="Ex: 15"
            value={percentual}
            onChange={(e) => setPercentual(e.target.value)}
            className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
          />
        </div>

        <div className="space-y-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Contra Fazenda Pública?</Label>
          <Select value={fazendaPublica} onValueChange={setFazendaPublica}>
            <SelectTrigger className={isDark ? "bg-neutral-900 border-neutral-700" : ""}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nao">Não</SelectItem>
              <SelectItem value="sim">Sim (art. 85, §3º CPC)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button onClick={calcular} className="w-full bg-purple-600 hover:bg-purple-700">
        <Calculator className="w-4 h-4 mr-2" />
        Calcular Honorários
      </Button>

      {resultado && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-lg ${isDark ? "bg-neutral-900 border border-neutral-800" : "bg-purple-50 border border-purple-100"}`}
        >
          <h4 className={`font-semibold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>Cálculo de Honorários</h4>
          {resultado.fazenda && (
            <p className={`text-xs mb-4 ${isDark ? "text-neutral-500" : "text-gray-500"}`}>
              Faixa aplicável (art. 85, §3º CPC): {resultado.percentualMinimo}% a {resultado.percentualMaximo}%
            </p>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className={`text-sm ${isDark ? "text-neutral-400" : "text-gray-500"}`}>Valor da Causa</p>
              <p className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                R$ {resultado.valorCausa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className={`text-sm ${isDark ? "text-neutral-400" : "text-gray-500"}`}>Honorários ({resultado.percentual}%)</p>
              <p className="text-lg font-semibold text-purple-600">
                R$ {resultado.honorarios.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className={`text-sm ${isDark ? "text-neutral-400" : "text-gray-500"}`}>Mínimo ({resultado.percentualMinimo}%)</p>
              <p className={`text-lg ${isDark ? "text-neutral-300" : "text-gray-700"}`}>
                R$ {resultado.honorariosMinimo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className={`text-sm ${isDark ? "text-neutral-400" : "text-gray-500"}`}>Máximo ({resultado.percentualMaximo}%)</p>
              <p className={`text-lg ${isDark ? "text-neutral-300" : "text-gray-700"}`}>
                R$ {resultado.honorariosMaximo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className={`text-sm ${isDark ? "text-neutral-400" : "text-gray-500"}`}>Majoração Recursal (§11, art. 85)</p>
              <p className={`text-lg ${isDark ? "text-neutral-300" : "text-gray-700"}`}>
                + R$ {resultado.honorariosRecursais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Componente de Prazos
function PrazosCalculator({ isDark }) {
  const [dataInicial, setDataInicial] = useState("");
  const [prazo, setPrazo] = useState("");
  const [tipoPrazo, setTipoPrazo] = useState("uteis");
  const [prazoEmDobro, setPrazoEmDobro] = useState("nao");
  const [resultado, setResultado] = useState(null);

  // Feriados nacionais 2024/2025 (simplificado)
  const feriados = [
    "2024-01-01", "2024-02-12", "2024-02-13", "2024-03-29", "2024-04-21",
    "2024-05-01", "2024-05-30", "2024-09-07", "2024-10-12", "2024-11-02",
    "2024-11-15", "2024-12-25",
    "2025-01-01", "2025-03-03", "2025-03-04", "2025-04-18", "2025-04-21",
    "2025-05-01", "2025-06-19", "2025-09-07", "2025-10-12", "2025-11-02",
    "2025-11-15", "2025-12-25"
  ];

  const isFeriado = (date) => {
    return feriados.includes(date.toISOString().split('T')[0]);
  };

  const calcular = () => {
    const inicio = new Date(dataInicial);
    let dias = parseInt(prazo) || 0;

    if (isNaN(inicio.getTime())) return;

    // Prazo em dobro
    if (prazoEmDobro !== "nao") {
      dias = dias * 2;
    }

    let dataFinal = new Date(inicio);
    
    // Início da contagem: primeiro dia útil subsequente (art. 224 CPC)
    dataFinal.setDate(dataFinal.getDate() + 1);
    
    if (tipoPrazo === "uteis") {
      // Ajusta se início cair em fim de semana ou feriado
      while (dataFinal.getDay() === 0 || dataFinal.getDay() === 6 || isFeriado(dataFinal)) {
        dataFinal.setDate(dataFinal.getDate() + 1);
      }
      
      let diasContados = 0;
      while (diasContados < dias) {
        dataFinal.setDate(dataFinal.getDate() + 1);
        const diaSemana = dataFinal.getDay();
        if (diaSemana !== 0 && diaSemana !== 6 && !isFeriado(dataFinal)) {
          diasContados++;
        }
      }
    } else {
      dataFinal.setDate(dataFinal.getDate() + dias);
    }

    // Verifica se término cai em dia não útil
    const dataFinalOriginal = new Date(dataFinal);
    while (dataFinal.getDay() === 0 || dataFinal.getDay() === 6 || isFeriado(dataFinal)) {
      dataFinal.setDate(dataFinal.getDate() + 1);
    }

    setResultado({
      dataInicial: inicio,
      dataFinal,
      dataFinalOriginal,
      prorrogado: dataFinal.getTime() !== dataFinalOriginal.getTime(),
      prazo: dias,
      prazoOriginal: prazoEmDobro !== "nao" ? dias / 2 : dias,
      tipo: tipoPrazo,
      dobro: prazoEmDobro !== "nao"
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Data da Intimação/Citação</Label>
          <Input
            type="date"
            value={dataInicial}
            onChange={(e) => setDataInicial(e.target.value)}
            className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
          />
        </div>

        <div className="space-y-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Prazo (dias)</Label>
          <Input
            type="number"
            placeholder="Ex: 15"
            value={prazo}
            onChange={(e) => setPrazo(e.target.value)}
            className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
          />
        </div>

        <div className="space-y-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Tipo de Prazo</Label>
          <Select value={tipoPrazo} onValueChange={setTipoPrazo}>
            <SelectTrigger className={isDark ? "bg-neutral-900 border-neutral-700" : ""}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="uteis">Dias Úteis (art. 219 CPC)</SelectItem>
              <SelectItem value="corridos">Dias Corridos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Prazo em Dobro?</Label>
          <Select value={prazoEmDobro} onValueChange={setPrazoEmDobro}>
            <SelectTrigger className={isDark ? "bg-neutral-900 border-neutral-700" : ""}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nao">Não</SelectItem>
              <SelectItem value="fazenda">Fazenda Pública (art. 183 CPC)</SelectItem>
              <SelectItem value="defensoria">Defensoria (art. 186 CPC)</SelectItem>
              <SelectItem value="litisconsortes">Litisconsortes (art. 229 CPC)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button onClick={calcular} className="w-full bg-orange-600 hover:bg-orange-700">
        <Calendar className="w-4 h-4 mr-2" />
        Calcular Prazo
      </Button>

      {resultado && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-lg ${isDark ? "bg-neutral-900 border border-neutral-800" : "bg-orange-50 border border-orange-100"}`}
        >
          <h4 className={`font-semibold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>Resultado do Prazo</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className={`text-sm ${isDark ? "text-neutral-400" : "text-gray-500"}`}>Data da Intimação</p>
              <p className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                {resultado.dataInicial.toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div>
              <p className={`text-sm ${isDark ? "text-neutral-400" : "text-gray-500"}`}>Data Final do Prazo</p>
              <p className="text-lg font-semibold text-orange-600">
                {resultado.dataFinal.toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div>
              <p className={`text-sm ${isDark ? "text-neutral-400" : "text-gray-500"}`}>Prazo</p>
              <p className={`text-lg ${isDark ? "text-white" : "text-gray-900"}`}>
                {resultado.prazo} {resultado.tipo === "uteis" ? "dias úteis" : "dias corridos"}
                {resultado.dobro && ` (${resultado.prazoOriginal} x 2)`}
              </p>
            </div>
            <div>
              <p className={`text-sm ${isDark ? "text-neutral-400" : "text-gray-500"}`}>Dia da Semana</p>
              <p className={`text-lg ${isDark ? "text-white" : "text-gray-900"}`}>
                {resultado.dataFinal.toLocaleDateString('pt-BR', { weekday: 'long' })}
              </p>
            </div>
          </div>
          {resultado.prorrogado && (
            <p className={`text-sm mt-4 ${isDark ? "text-amber-400" : "text-amber-600"}`}>
              ⚠️ Prazo prorrogado para o primeiro dia útil seguinte (art. 224, §1º CPC)
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}

export default function LegalCalculator({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const [selectedCalculator, setSelectedCalculator] = useState("juros");
  const [showAI, setShowAI] = useState(false);

  const renderCalculator = () => {
    switch (selectedCalculator) {
      case "juros":
        return <JurosCalculator isDark={isDark} />;
      case "trabalhista":
        return <TrabalhistaCalculator isDark={isDark} />;
      case "honorarios":
        return <HonorariosCalculator isDark={isDark} />;
      case "prazos":
        return <PrazosCalculator isDark={isDark} />;
      case "custas":
        return <CustasCalculator isDark={isDark} />;
      case "atualizacao":
        return <AtualizacaoCalculator isDark={isDark} />;
      case "indenizacao":
        return <IndenizacaoCalculator isDark={isDark} />;
      case "previdenciario":
        return <PrevidenciarioCalculator isDark={isDark} />;
      case "liquidacao":
        return <LiquidacaoCalculator isDark={isDark} />;
      default:
        return <JurosCalculator isDark={isDark} />;
    }
  };

  const selectedType = calculatorTypes.find(c => c.id === selectedCalculator);

  return (
    <div className={`min-h-screen p-4 md:p-6 lg:p-8 ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-white' : 'bg-gray-900'}`}>
                <Calculator className={`w-5 h-5 ${isDark ? 'text-black' : 'text-white'}`} />
              </div>
              <div>
                <h1 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Calculadora Jurídica
                </h1>
                <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                  Cálculos conforme normas dos tribunais e legislação vigente
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowAI(!showAI)}
              variant={showAI ? "default" : "outline"}
              className={showAI ? "bg-purple-600 hover:bg-purple-700" : ""}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Assistente IA
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar - Tipos de Cálculo */}
          <div className="lg:col-span-1 space-y-2">
            {calculatorTypes.map((calc) => {
              const Icon = calc.icon;
              const isSelected = selectedCalculator === calc.id;

              return (
                <button
                  key={calc.id}
                  onClick={() => setSelectedCalculator(calc.id)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    isSelected
                      ? isDark
                        ? 'bg-white text-black'
                        : 'bg-gray-900 text-white'
                      : isDark
                        ? 'bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-white'
                        : 'bg-white border border-gray-200 hover:border-gray-300 text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isSelected ? '' : isDark ? 'text-neutral-400' : 'text-gray-500'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{calc.title}</p>
                      <p className={`text-xs truncate ${isSelected ? 'opacity-70' : isDark ? 'text-neutral-500' : 'text-gray-400'}`}>
                        {calc.description}
                      </p>
                    </div>
                    {isSelected && <ChevronRight className="w-4 h-4 shrink-0" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Main Content - Calculadora */}
          <div className={`${showAI ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  {selectedType && <selectedType.icon className={`w-6 h-6 ${isDark ? 'text-white' : 'text-gray-900'}`} />}
                  <div>
                    <CardTitle className={isDark ? 'text-white' : ''}>
                      {selectedType?.title}
                    </CardTitle>
                    <CardDescription className={isDark ? 'text-neutral-400' : ''}>
                      {selectedType?.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {renderCalculator()}
              </CardContent>
            </Card>
          </div>

          {/* AI Assistant */}
          {showAI && (
            <div className="lg:col-span-1">
              <AICalculatorAssistant 
                isDark={isDark} 
                calculatorType={selectedCalculator}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}