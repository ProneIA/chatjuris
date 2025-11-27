import React, { useState } from "react";
import { Calculator, Percent, Calendar, Scale, DollarSign, Clock, Briefcase, FileText, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";

const calculatorTypes = [
  {
    id: "juros",
    title: "Juros e Correção Monetária",
    description: "Calcule juros simples, compostos e correção monetária",
    icon: Percent,
    color: "blue"
  },
  {
    id: "trabalhista",
    title: "Cálculos Trabalhistas",
    description: "Rescisão, férias, 13º, horas extras e verbas",
    icon: Briefcase,
    color: "green"
  },
  {
    id: "honorarios",
    title: "Honorários Advocatícios",
    description: "Calcule honorários sobre o valor da causa",
    icon: Scale,
    color: "purple"
  },
  {
    id: "prazos",
    title: "Prazos Processuais",
    description: "Calcule prazos em dias úteis ou corridos",
    icon: Calendar,
    color: "orange"
  },
  {
    id: "custas",
    title: "Custas Judiciais",
    description: "Estime custas e despesas processuais",
    icon: FileText,
    color: "red"
  },
  {
    id: "atualizacao",
    title: "Atualização de Valores",
    description: "Atualize valores por índices oficiais",
    icon: DollarSign,
    color: "indigo"
  }
];

// Componente de Juros e Correção
function JurosCalculator({ isDark }) {
  const [tipoJuros, setTipoJuros] = useState("simples");
  const [valorPrincipal, setValorPrincipal] = useState("");
  const [taxaJuros, setTaxaJuros] = useState("");
  const [periodo, setPeriodo] = useState("");
  const [resultado, setResultado] = useState(null);

  const calcular = () => {
    const principal = parseFloat(valorPrincipal) || 0;
    const taxa = parseFloat(taxaJuros) / 100 || 0;
    const meses = parseInt(periodo) || 0;

    let juros = 0;
    let montante = 0;

    if (tipoJuros === "simples") {
      juros = principal * taxa * meses;
      montante = principal + juros;
    } else {
      montante = principal * Math.pow(1 + taxa, meses);
      juros = montante - principal;
    }

    setResultado({
      principal,
      juros,
      montante,
      taxa: taxaJuros,
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
              <SelectItem value="simples">Juros Simples</SelectItem>
              <SelectItem value="compostos">Juros Compostos</SelectItem>
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
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Taxa de Juros (% ao mês)</Label>
          <Input
            type="number"
            placeholder="Ex: 1"
            value={taxaJuros}
            onChange={(e) => setTaxaJuros(e.target.value)}
            className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
          />
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
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Componente de Cálculos Trabalhistas
function TrabalhistaCalculator({ isDark }) {
  const [tipoCalculo, setTipoCalculo] = useState("rescisao");
  const [salario, setSalario] = useState("");
  const [mesesTrabalhados, setMesesTrabalhados] = useState("");
  const [feriasVencidas, setFeriasVencidas] = useState("0");
  const [avisoPrevio, setAvisoPrevio] = useState("trabalhado");
  const [resultado, setResultado] = useState(null);

  const calcular = () => {
    const sal = parseFloat(salario) || 0;
    const meses = parseInt(mesesTrabalhados) || 0;
    const ferias = parseInt(feriasVencidas) || 0;

    // Cálculos básicos de rescisão
    const saldoSalario = (sal / 30) * 15; // Exemplo: 15 dias trabalhados no mês
    const feriasProporcionais = (sal / 12) * (meses % 12);
    const tercoFerias = feriasProporcionais / 3;
    const feriasVencidasValor = ferias * (sal + sal / 3);
    const decimoTerceiro = (sal / 12) * meses;
    const avisoPrevioValor = avisoPrevio === "indenizado" ? sal : 0;
    const fgts = sal * 0.08 * meses;
    const multaFgts = fgts * 0.4;

    const total = saldoSalario + feriasProporcionais + tercoFerias + feriasVencidasValor + decimoTerceiro + avisoPrevioValor + fgts + multaFgts;

    setResultado({
      saldoSalario,
      feriasProporcionais,
      tercoFerias,
      feriasVencidasValor,
      decimoTerceiro,
      avisoPrevioValor,
      fgts,
      multaFgts,
      total
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Tipo de Cálculo</Label>
          <Select value={tipoCalculo} onValueChange={setTipoCalculo}>
            <SelectTrigger className={isDark ? "bg-neutral-900 border-neutral-700" : ""}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rescisao">Rescisão Sem Justa Causa</SelectItem>
              <SelectItem value="pedido">Pedido de Demissão</SelectItem>
              <SelectItem value="acordo">Acordo (Art. 484-A CLT)</SelectItem>
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
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Férias Vencidas</Label>
          <Select value={feriasVencidas} onValueChange={setFeriasVencidas}>
            <SelectTrigger className={isDark ? "bg-neutral-900 border-neutral-700" : ""}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Nenhuma</SelectItem>
              <SelectItem value="1">1 período</SelectItem>
              <SelectItem value="2">2 períodos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Aviso Prévio</Label>
          <Select value={avisoPrevio} onValueChange={setAvisoPrevio}>
            <SelectTrigger className={isDark ? "bg-neutral-900 border-neutral-700" : ""}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="trabalhado">Trabalhado</SelectItem>
              <SelectItem value="indenizado">Indenizado</SelectItem>
            </SelectContent>
          </Select>
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
              { label: "Saldo de Salário", value: resultado.saldoSalario },
              { label: "Férias Proporcionais", value: resultado.feriasProporcionais },
              { label: "1/3 de Férias", value: resultado.tercoFerias },
              { label: "Férias Vencidas", value: resultado.feriasVencidasValor },
              { label: "13º Proporcional", value: resultado.decimoTerceiro },
              { label: "Aviso Prévio Indenizado", value: resultado.avisoPrevioValor },
              { label: "FGTS", value: resultado.fgts },
              { label: "Multa FGTS (40%)", value: resultado.multaFgts },
            ].map((item, i) => (
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
  const [percentual, setPercentual] = useState("20");
  const [tipoHonorario, setTipoHonorario] = useState("exito");
  const [resultado, setResultado] = useState(null);

  const calcular = () => {
    const valor = parseFloat(valorCausa) || 0;
    const perc = parseFloat(percentual) || 0;

    const honorarios = valor * (perc / 100);
    const honorariosMinimo = valor * 0.1; // 10% mínimo
    const honorariosMaximo = valor * 0.2; // 20% máximo

    setResultado({
      valorCausa: valor,
      percentual: perc,
      honorarios,
      honorariosMinimo,
      honorariosMaximo
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
              <SelectItem value="exito">Êxito (ad exitum)</SelectItem>
              <SelectItem value="contratual">Contratual</SelectItem>
              <SelectItem value="sucumbencia">Sucumbência</SelectItem>
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

        <div className="space-y-2 md:col-span-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Percentual (%)</Label>
          <Input
            type="number"
            placeholder="Ex: 20"
            value={percentual}
            onChange={(e) => setPercentual(e.target.value)}
            className={isDark ? "bg-neutral-900 border-neutral-700" : ""}
          />
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
              <p className={`text-sm ${isDark ? "text-neutral-400" : "text-gray-500"}`}>Mínimo Legal (10%)</p>
              <p className={`text-lg ${isDark ? "text-neutral-300" : "text-gray-700"}`}>
                R$ {resultado.honorariosMinimo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className={`text-sm ${isDark ? "text-neutral-400" : "text-gray-500"}`}>Máximo Legal (20%)</p>
              <p className={`text-lg ${isDark ? "text-neutral-300" : "text-gray-700"}`}>
                R$ {resultado.honorariosMaximo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
  const [resultado, setResultado] = useState(null);

  const calcular = () => {
    const inicio = new Date(dataInicial);
    const dias = parseInt(prazo) || 0;

    if (isNaN(inicio.getTime())) return;

    let dataFinal = new Date(inicio);

    if (tipoPrazo === "uteis") {
      let diasContados = 0;
      while (diasContados < dias) {
        dataFinal.setDate(dataFinal.getDate() + 1);
        const diaSemana = dataFinal.getDay();
        if (diaSemana !== 0 && diaSemana !== 6) {
          diasContados++;
        }
      }
    } else {
      dataFinal.setDate(dataFinal.getDate() + dias);
    }

    setResultado({
      dataInicial: inicio,
      dataFinal,
      prazo: dias,
      tipo: tipoPrazo
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Data Inicial (Intimação/Citação)</Label>
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

        <div className="space-y-2 md:col-span-2">
          <Label className={isDark ? "text-neutral-300" : "text-gray-700"}>Tipo de Prazo</Label>
          <Select value={tipoPrazo} onValueChange={setTipoPrazo}>
            <SelectTrigger className={isDark ? "bg-neutral-900 border-neutral-700" : ""}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="uteis">Dias Úteis</SelectItem>
              <SelectItem value="corridos">Dias Corridos</SelectItem>
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
              <p className={`text-sm ${isDark ? "text-neutral-400" : "text-gray-500"}`}>Data Inicial</p>
              <p className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                {resultado.dataInicial.toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div>
              <p className={`text-sm ${isDark ? "text-neutral-400" : "text-gray-500"}`}>Data Final</p>
              <p className="text-lg font-semibold text-orange-600">
                {resultado.dataFinal.toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div>
              <p className={`text-sm ${isDark ? "text-neutral-400" : "text-gray-500"}`}>Prazo</p>
              <p className={`text-lg ${isDark ? "text-white" : "text-gray-900"}`}>
                {resultado.prazo} {resultado.tipo === "uteis" ? "dias úteis" : "dias corridos"}
              </p>
            </div>
            <div>
              <p className={`text-sm ${isDark ? "text-neutral-400" : "text-gray-500"}`}>Dia da Semana</p>
              <p className={`text-lg ${isDark ? "text-white" : "text-gray-900"}`}>
                {resultado.dataFinal.toLocaleDateString('pt-BR', { weekday: 'long' })}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function LegalCalculator({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const [selectedCalculator, setSelectedCalculator] = useState("juros");

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
      default:
        return <JurosCalculator isDark={isDark} />;
    }
  };

  const selectedType = calculatorTypes.find(c => c.id === selectedCalculator);

  return (
    <div className={`min-h-screen p-4 md:p-6 lg:p-8 ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-white' : 'bg-gray-900'}`}>
              <Calculator className={`w-5 h-5 ${isDark ? 'text-black' : 'text-white'}`} />
            </div>
            <div>
              <h1 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Calculadora Jurídica
              </h1>
              <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                Ferramentas de cálculo para o dia a dia do advogado
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar - Tipos de Cálculo */}
          <div className="lg:col-span-1 space-y-2">
            {calculatorTypes.map((calc) => {
              const Icon = calc.icon;
              const isSelected = selectedCalculator === calc.id;
              const isAvailable = ["juros", "trabalhista", "honorarios", "prazos"].includes(calc.id);

              return (
                <button
                  key={calc.id}
                  onClick={() => isAvailable && setSelectedCalculator(calc.id)}
                  disabled={!isAvailable}
                  className={`w-full text-left p-4 rounded-lg transition-all ${
                    isSelected
                      ? isDark
                        ? 'bg-white text-black'
                        : 'bg-gray-900 text-white'
                      : isDark
                        ? 'bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-white'
                        : 'bg-white border border-gray-200 hover:border-gray-300 text-gray-900'
                  } ${!isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${isSelected ? '' : isDark ? 'text-neutral-400' : 'text-gray-500'}`} />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{calc.title}</p>
                      {!isAvailable && (
                        <span className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>Em breve</span>
                      )}
                    </div>
                    {isSelected && <ChevronRight className="w-4 h-4" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Main Content - Calculadora */}
          <div className="lg:col-span-3">
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
        </div>
      </div>
    </div>
  );
}