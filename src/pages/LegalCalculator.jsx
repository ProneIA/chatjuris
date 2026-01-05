import React, { useState } from "react";
import { Calculator, Percent, Calendar, Scale, DollarSign, Briefcase, FileText, ChevronRight, Heart, Shield, FileCheck, Sparkles, Download, Printer, TrendingUp, Users, ShoppingCart, TrendingDown, Building2, Upload, ArrowRight, ArrowLeft, Save, History, Bookmark, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

// Componentes de calculadora
import AICalculatorAssistant from "../components/calculator/AICalculatorAssistant";
import CustasCalculator from "../components/calculator/CustasCalculator";
import AtualizacaoCalculator from "../components/calculator/AtualizacaoCalculator";
import IndenizacaoCalculator from "../components/calculator/IndenizacaoCalculator";
import PrevidenciarioCalculator from "../components/calculator/PrevidenciarioCalculator";
import LiquidacaoCalculator from "../components/calculator/LiquidacaoCalculator";
import CivilCalculator from "../components/calculator/CivilCalculator";
import PenalCalculator from "../components/calculator/PenalCalculator";
import TributarioCalculator from "../components/calculator/TributarioCalculator";
import FamiliaCalculator from "../components/calculator/FamiliaCalculator";
import ConsumidorCalculator from "../components/calculator/ConsumidorCalculator";
import TributarioAdvancedCalculator from "../components/calculator/TributarioAdvancedCalculator";
import CalculationHistory from "../components/calculator/CalculationHistory";
import SaveCalculationDialog from "../components/calculator/SaveCalculationDialog";
import { useSwipeable } from "react-swipeable";

const areasJuridicas = [
  {
    id: "civil",
    title: "Direito Civil",
    description: "Contratos, obrigações, danos materiais",
    icon: FileText,
    color: "indigo",
    calculators: ["civil", "juros", "honorarios", "prazos"]
  },
  {
    id: "trabalhista",
    title: "Direito Trabalhista",
    description: "Rescisão, férias, verbas trabalhistas",
    icon: Briefcase,
    color: "green",
    calculators: ["trabalhista", "juros", "prazos", "liquidacao"]
  },
  {
    id: "tributario",
    title: "Direito Tributário",
    description: "Impostos, SELIC, teses fiscais",
    icon: DollarSign,
    color: "amber",
    calculators: ["tributario", "tributario_avancado", "juros"]
  },
  {
    id: "familia",
    title: "Família e Sucessões",
    description: "Pensão, partilha, divórcio",
    icon: Users,
    color: "pink",
    calculators: ["familia", "juros", "honorarios"]
  },
  {
    id: "penal",
    title: "Direito Penal",
    description: "Dosimetria, progressão de regime",
    icon: Shield,
    color: "red",
    calculators: ["penal", "prazos"]
  },
  {
    id: "consumidor",
    title: "Direito do Consumidor",
    description: "Repetição, juros abusivos, CDC",
    icon: ShoppingCart,
    color: "cyan",
    calculators: ["consumidor", "juros", "indenizacao"]
  },
  {
    id: "previdenciario",
    title: "Direito Previdenciário",
    description: "Benefícios, aposentadoria, INSS",
    icon: Shield,
    color: "teal",
    calculators: ["previdenciario", "atualizacao", "liquidacao"]
  },
  {
    id: "geral",
    title: "Ferramentas Gerais",
    description: "Prazos, custas, atualização",
    icon: Calculator,
    color: "purple",
    calculators: ["prazos", "custas", "atualizacao", "honorarios"]
  }
];

const calculatorTypes = {
  juros: { title: "Juros e Correção", description: "Juros simples, compostos e correção monetária", icon: Percent },
  trabalhista: { title: "Rescisão Trabalhista", description: "Rescisão, férias, 13º, horas extras", icon: Briefcase },
  civil: { title: "Direito Civil", description: "Obrigações, multas, danos materiais", icon: FileText },
  familia: { title: "Família e Sucessões", description: "Pensão, partilha, usufruto", icon: Users },
  penal: { title: "Direito Penal", description: "Dosimetria, progressão, remição", icon: Shield },
  tributario: { title: "Tributário Básico", description: "SELIC, impostos, multas fiscais", icon: DollarSign },
  tributario_avancado: { title: "Tributário Avançado", description: "Tese do Século, ISS, Regimes", icon: TrendingUp },
  consumidor: { title: "Consumidor", description: "Repetição indébito, juros abusivos", icon: ShoppingCart },
  honorarios: { title: "Honorários", description: "Honorários advocatícios e sucumbência", icon: Scale },
  prazos: { title: "Prazos Processuais", description: "Dias úteis e corridos (CPC/CLT)", icon: Calendar },
  custas: { title: "Custas Judiciais", description: "Custas por tribunal e instância", icon: FileText },
  atualizacao: { title: "Atualização Monetária", description: "SELIC, IPCA, INPC, IGP-M, TR", icon: DollarSign },
  indenizacao: { title: "Indenizações", description: "Danos morais e materiais (STJ)", icon: Heart },
  previdenciario: { title: "Previdenciário", description: "RMI, fator, atrasados INSS", icon: Shield },
  liquidacao: { title: "Liquidação", description: "Liquidação de sentença completa", icon: FileCheck }
};

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

    if (!principal || !taxa || !meses) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

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
      periodo: meses,
      tipo: tipoJuros
    });
  };

  const exportarPDF = () => {
    if (!resultado) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('CÁLCULO DE JUROS E CORREÇÃO', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, 28, { align: 'center' });
    
    // Linha separadora
    doc.setDrawColor(200, 200, 200);
    doc.line(15, 32, pageWidth - 15, 32);
    
    // Dados do cálculo
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('DADOS DO CÁLCULO', 15, 42);
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    let y = 52;
    
    const dados = [
      ['Tipo de Juros:', resultado.tipo === 'simples' ? 'Juros Simples' : 'Juros Compostos'],
      ['Valor Principal:', `R$ ${resultado.principal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
      ['Período:', `${resultado.periodo} meses`],
      ['Taxa Mensal Efetiva:', `${resultado.taxaMensal.toFixed(4)}%`],
      ['Taxa Anual Efetiva:', `${resultado.taxaAnual.toFixed(2)}%`]
    ];
    
    dados.forEach(([label, value]) => {
      doc.setFont(undefined, 'bold');
      doc.text(label, 15, y);
      doc.setFont(undefined, 'normal');
      doc.text(value, 80, y);
      y += 8;
    });
    
    // Resultado
    doc.setDrawColor(200, 200, 200);
    doc.line(15, y + 5, pageWidth - 15, y + 5);
    y += 15;
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('RESULTADO', 15, y);
    y += 10;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('Valor Principal:', 15, y);
    doc.text(`R$ ${resultado.principal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 80, y);
    y += 8;
    
    doc.setTextColor(0, 100, 200);
    doc.text('Juros Acumulados:', 15, y);
    doc.text(`R$ ${resultado.juros.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 80, y);
    y += 8;
    
    doc.setTextColor(0, 150, 0);
    doc.setFont(undefined, 'bold');
    doc.text('Montante Final:', 15, y);
    doc.text(`R$ ${resultado.montante.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 80, y);
    
    doc.save('calculo_juros.pdf');
    toast.success("PDF gerado com sucesso!");
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

      <div className="flex gap-2">
        <Button onClick={calcular} className="flex-1 bg-blue-600 hover:bg-blue-700">
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

  const exportarPDF = () => {
    if (!resultado) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('CÁLCULO DE RESCISÃO TRABALHISTA', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, 28, { align: 'center' });
    
    doc.line(15, 32, pageWidth - 15, 32);
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('VERBAS RESCISÓRIAS', 15, 42);
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    let y = 52;
    
    const verbas = [
      { label: 'Saldo de Salário', value: resultado.saldoSalario, show: true },
      { label: `Aviso Prévio (${resultado.avisoPrevioDias} dias)`, value: resultado.avisoPrevioValor, show: resultado.avisoPrevioValor > 0 },
      { label: 'Férias Proporcionais', value: resultado.feriasProporcionais, show: resultado.feriasProporcionais > 0 },
      { label: '1/3 Férias Proporcionais', value: resultado.tercoFeriasProporcionais, show: resultado.tercoFeriasProporcionais > 0 },
      { label: 'Férias Vencidas', value: resultado.feriasVencidasValor, show: resultado.feriasVencidasValor > 0 },
      { label: '1/3 Férias Vencidas', value: resultado.tercoFeriasVencidas, show: resultado.tercoFeriasVencidas > 0 },
      { label: '13º Proporcional', value: resultado.decimoTerceiro, show: resultado.decimoTerceiro > 0 },
      { label: 'FGTS Depositado', value: resultado.fgtsDeposito, show: true },
      { label: 'Multa FGTS (40%)', value: resultado.multaFgts, show: resultado.multaFgts > 0 },
      { label: 'Horas Extras', value: resultado.valorHoraExtra, show: resultado.valorHoraExtra > 0 }
    ];
    
    verbas.filter(v => v.show).forEach(verba => {
      doc.text(verba.label, 15, y);
      doc.text(`R$ ${verba.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - 15, y, { align: 'right' });
      y += 7;
    });
    
    doc.line(15, y, pageWidth - 15, y);
    y += 7;
    
    doc.setFont(undefined, 'bold');
    doc.setFontSize(11);
    doc.text('TOTAL:', 15, y);
    doc.text(`R$ ${resultado.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - 15, y, { align: 'right' });
    
    doc.save('calculo_rescisao.pdf');
    toast.success("PDF gerado com sucesso!");
  };

  const calcular = () => {
    const sal = parseFloat(salario) || 0;
    const meses = parseInt(mesesTrabalhados) || 0;
    const dias = parseInt(diasTrabalhados) || 0;
    const ferias = parseInt(feriasVencidas) || 0;
    const horas = parseFloat(horasExtras) || 0;

    if (!sal || !meses) {
      toast.error("Preencha salário e meses trabalhados");
      return;
    }

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

      <div className="flex gap-2">
        <Button onClick={calcular} className="flex-1 bg-green-600 hover:bg-green-700">
          <Calculator className="w-4 h-4 mr-2" />
          Calcular Rescisão
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

  const exportarPDF = () => {
    if (!resultado) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('CÁLCULO DE HONORÁRIOS ADVOCATÍCIOS', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, 28, { align: 'center' });
    
    doc.line(15, 32, pageWidth - 15, 32);
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('BASE DE CÁLCULO', 15, 42);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    let y = 52;
    
    doc.text('Valor da Causa:', 15, y);
    doc.text(`R$ ${resultado.valorCausa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - 15, y, { align: 'right' });
    y += 8;
    
    if (resultado.fazenda) {
      doc.setFontSize(9);
      doc.text(`Faixa aplicável (art. 85, §3º CPC): ${resultado.percentualMinimo}% a ${resultado.percentualMaximo}%`, 15, y);
      y += 8;
    }
    
    doc.line(15, y, pageWidth - 15, y);
    y += 10;
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('HONORÁRIOS ADVOCATÍCIOS', 15, y);
    y += 10;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Percentual Aplicado: ${resultado.percentual}%`, 15, y);
    y += 8;
    
    doc.setFont(undefined, 'bold');
    doc.text('Valor dos Honorários:', 15, y);
    doc.text(`R$ ${resultado.honorarios.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - 15, y, { align: 'right' });
    
    doc.save('calculo_honorarios.pdf');
    toast.success("PDF gerado com sucesso!");
  };

  const calcular = () => {
    const valor = parseFloat(valorCausa) || 0;
    let perc = parseFloat(percentual) || 0;

    if (!valor) {
      toast.error("Informe o valor da causa");
      return;
    }

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

      <div className="flex gap-2">
        <Button onClick={calcular} className="flex-1 bg-purple-600 hover:bg-purple-700">
          <Calculator className="w-4 h-4 mr-2" />
          Calcular Honorários
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

  const exportarPDF = () => {
    if (!resultado) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('CÁLCULO DE PRAZO PROCESSUAL', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, 28, { align: 'center' });
    
    doc.line(15, 32, pageWidth - 15, 32);
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('DADOS DO PRAZO', 15, 42);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    let y = 52;
    
    doc.text('Data da Intimação:', 15, y);
    doc.text(resultado.dataInicial.toLocaleDateString('pt-BR'), pageWidth - 15, y, { align: 'right' });
    y += 8;
    
    doc.text('Prazo:', 15, y);
    const prazoTexto = `${resultado.prazo} ${resultado.tipo === "uteis" ? "dias úteis" : "dias corridos"}`;
    doc.text(prazoTexto, pageWidth - 15, y, { align: 'right' });
    y += 8;
    
    if (resultado.dobro) {
      doc.text(`(Prazo original: ${resultado.prazoOriginal} dias x 2)`, 15, y);
      y += 8;
    }
    
    doc.line(15, y, pageWidth - 15, y);
    y += 10;
    
    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.text('DATA FINAL DO PRAZO:', 15, y);
    doc.text(resultado.dataFinal.toLocaleDateString('pt-BR'), pageWidth - 15, y, { align: 'right' });
    y += 8;
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(`Dia da semana: ${resultado.dataFinal.toLocaleDateString('pt-BR', { weekday: 'long' })}`, 15, y);
    
    if (resultado.prorrogado) {
      y += 10;
      doc.setTextColor(200, 100, 0);
      doc.text('⚠ Prazo prorrogado para o primeiro dia útil seguinte (art. 224, §1º CPC)', 15, y);
    }
    
    doc.save('calculo_prazo.pdf');
    toast.success("PDF gerado com sucesso!");
  };

  const calcular = () => {
    const inicio = new Date(dataInicial);
    let dias = parseInt(prazo) || 0;

    if (isNaN(inicio.getTime())) {
      toast.error("Informe a data inicial");
      return;
    }
    
    if (!dias) {
      toast.error("Informe o prazo em dias");
      return;
    }

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

      <div className="flex gap-2">
        <Button onClick={calcular} className="flex-1 bg-orange-600 hover:bg-orange-700">
          <Calendar className="w-4 h-4 mr-2" />
          Calcular Prazo
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
  const [step, setStep] = useState(1); // 1: upload, 2: área, 3: tipo de cálculo, 4: calculadora
  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedCalculator, setSelectedCalculator] = useState(null);
  const [showAI, setShowAI] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [currentInputData, setCurrentInputData] = useState(null);
  const [currentResultData, setCurrentResultData] = useState(null);
  const [saveAsDraft, setSaveAsDraft] = useState(false);
  const [showAIChatHistory, setShowAIChatHistory] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractedData, setExtractedData] = useState(null);

  // Navegação por gestos mobile
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (step < 4) setStep(step + 1);
    },
    onSwipedRight: () => {
      if (step > 1) setStep(step - 1);
    },
    preventScrollOnSwipe: true,
    trackMouse: false
  });

  const renderCalculator = () => {
    if (!selectedCalculator) return null;

    const calculators = {
      juros: JurosCalculator,
      trabalhista: TrabalhistaCalculator,
      civil: CivilCalculator,
      penal: PenalCalculator,
      tributario: TributarioCalculator,
      familia: FamiliaCalculator,
      consumidor: ConsumidorCalculator,
      tributario_avancado: TributarioAdvancedCalculator,
      honorarios: HonorariosCalculator,
      prazos: PrazosCalculator,
      custas: CustasCalculator,
      atualizacao: AtualizacaoCalculator,
      indenizacao: IndenizacaoCalculator,
      previdenciario: PrevidenciarioCalculator,
      liquidacao: LiquidacaoCalculator
    };

    const CalculatorComponent = calculators[selectedCalculator];
    return CalculatorComponent ? <CalculatorComponent isDark={isDark} extractedData={extractedData} /> : null;
  };

  const selectedAreaData = areasJuridicas.find(a => a.id === selectedArea);
  const availableCalculators = selectedAreaData?.calculators.map(id => ({ id, ...calculatorTypes[id] })) || [];

  const handleLoadCalculation = (calc) => {
    setSelectedArea(calc.legal_area);
    setSelectedCalculator(calc.calculator_type);
    setCurrentInputData(calc.input_data);
    setCurrentResultData(calc.result_data);
    setStep(4);
    setShowHistory(false);
    toast.success("Cálculo carregado");
  };

  const handleSaveCalculation = (isDraft = false) => {
    setSaveAsDraft(isDraft);
    setShowSaveDialog(true);
  };

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;
    
    const fileArray = Array.from(files);
    setUploadedFiles(fileArray);
    toast.success(`${fileArray.length} arquivo(s) carregado(s)`);
  };

  const analyzeDocumentsWithAI = async () => {
    if (uploadedFiles.length === 0) {
      toast.error("Nenhum arquivo para analisar");
      return;
    }

    setIsAnalyzing(true);
    toast.info("Analisando documentos com IA...");

    try {
      // Upload dos arquivos
      const fileUrls = [];
      for (const file of uploadedFiles) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        fileUrls.push(file_url);
      }

      // Define o contexto do tipo de cálculo
      let analysisPrompt = `Analise os documentos fornecidos e extraia TODOS os dados numéricos e informações relevantes para cálculos jurídicos.

INSTRUÇÕES IMPORTANTES:
- Extraia TODOS os valores monetários, datas, percentuais, e números encontrados
- Identifique o tipo de documento (contrato, nota fiscal, holerite, SPED, petição, etc)
- Organize os dados de forma estruturada e detalhada
- Inclua contexto de cada informação extraída
- Se houver múltiplos documentos, organize por documento

Retorne um JSON com a seguinte estrutura:
{
  "tipo_documento": "descrição do tipo",
  "dados_extraidos": {
    "valores_monetarios": [
      {"descricao": "nome do campo", "valor": numero, "contexto": "onde foi encontrado"}
    ],
    "datas": [
      {"descricao": "tipo de data", "data": "YYYY-MM-DD", "contexto": "relevância"}
    ],
    "percentuais": [
      {"descricao": "tipo de percentual", "valor": numero, "contexto": "aplicação"}
    ],
    "periodos": [
      {"descricao": "tipo de período", "quantidade": numero, "unidade": "dias/meses/anos", "contexto": "detalhes"}
    ],
    "partes": {
      "nomes": ["lista de nomes de pessoas/empresas"],
      "identificadores": ["CPF, CNPJ, etc se houver"]
    },
    "observacoes": "informações adicionais relevantes"
  }
}`;

      if (selectedCalculator) {
        const calculatorContext = {
          'trabalhista': 'Foque em: salários, verbas rescisórias, período de trabalho, férias, 13º, FGTS, horas extras',
          'juros': 'Foque em: valor principal, taxas de juros, período, datas de vencimento',
          'civil': 'Foque em: valores de contratos, multas, danos, prazos',
          'tributario': 'Foque em: impostos, multas, SELIC, valores de tributos, períodos fiscais',
          'familia': 'Foque em: valores de pensão, patrimônio, rendas, dependentes',
          'honorarios': 'Foque em: valor da causa, percentuais, custas',
          'prazos': 'Foque em: datas de intimação, prazos processuais',
          'previdenciario': 'Foque em: salários de contribuição, tempo de contribuição, benefícios',
          'liquidacao': 'Foque em: valores principais, juros, correção monetária, períodos'
        };

        analysisPrompt += `\n\nCONTEXTO ESPECÍFICO: ${calculatorContext[selectedCalculator] || 'Análise geral de dados jurídicos'}`;
      }

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: analysisPrompt,
        file_urls: fileUrls,
        response_json_schema: {
          type: "object",
          properties: {
            tipo_documento: { type: "string" },
            dados_extraidos: {
              type: "object",
              properties: {
                valores_monetarios: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      descricao: { type: "string" },
                      valor: { type: "number" },
                      contexto: { type: "string" }
                    }
                  }
                },
                datas: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      descricao: { type: "string" },
                      data: { type: "string" },
                      contexto: { type: "string" }
                    }
                  }
                },
                percentuais: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      descricao: { type: "string" },
                      valor: { type: "number" },
                      contexto: { type: "string" }
                    }
                  }
                },
                periodos: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      descricao: { type: "string" },
                      quantidade: { type: "number" },
                      unidade: { type: "string" },
                      contexto: { type: "string" }
                    }
                  }
                },
                partes: {
                  type: "object",
                  properties: {
                    nomes: { type: "array", items: { type: "string" } },
                    identificadores: { type: "array", items: { type: "string" } }
                  }
                },
                observacoes: { type: "string" }
              }
            }
          }
        }
      });

      setExtractedData(response);
      toast.success("Análise concluída! Os dados foram extraídos e estão prontos para uso.");
    } catch (error) {
      console.error("Erro ao analisar documentos:", error);
      toast.error("Erro ao analisar documentos. Tente novamente.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div {...swipeHandlers} className={`min-h-screen p-4 md:p-6 lg:p-8 ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto">
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
                  {step === 1 && "Comece fazendo upload de um documento ou escolha uma área"}
                  {step === 2 && "Selecione a área jurídica do seu cálculo"}
                  {step === 3 && "Escolha o tipo de cálculo"}
                  {step === 4 && "Preencha os dados e calcule"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {step === 4 && (
                <>
                  <Button
                    onClick={() => setShowHistory(!showHistory)}
                    variant="outline"
                    size="sm"
                    className={isDark ? 'border-neutral-700 text-white hover:bg-neutral-800' : ''}
                  >
                    <History className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Histórico</span>
                  </Button>
                  <Button
                    onClick={() => setShowAIChatHistory(!showAIChatHistory)}
                    variant="outline"
                    size="sm"
                    className={isDark ? 'border-neutral-700 text-white hover:bg-neutral-800' : ''}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Chat IA</span>
                  </Button>
                  <Button
                    onClick={() => handleSaveCalculation(true)}
                    variant="outline"
                    size="sm"
                    className={isDark ? 'border-neutral-700 text-white hover:bg-neutral-800' : ''}
                  >
                    <Bookmark className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Rascunho</span>
                  </Button>
                  <Button
                    onClick={() => handleSaveCalculation(false)}
                    variant="outline"
                    size="sm"
                    className={isDark ? 'border-neutral-700 text-white hover:bg-neutral-800' : ''}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Salvar</span>
                  </Button>
                  <Button
                    onClick={() => setShowAI(!showAI)}
                    variant={showAI ? "default" : "outline"}
                    className={showAI ? "bg-purple-600 hover:bg-purple-700" : ""}
                    size="sm"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Assistente IA</span>
                  </Button>
                </>
              )}
              {step > 1 && (
                <Button
                  onClick={() => {
                    setStep(1);
                    setSelectedArea(null);
                    setSelectedCalculator(null);
                    setUploadedFiles([]);
                    setExtractedData(null);
                  }}
                  variant="outline"
                  size="sm"
                  className={isDark ? 'border-neutral-700 text-white hover:bg-neutral-800' : ''}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Recomeçar</span>
                </Button>
              )}
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-2 mt-6">
            {[1, 2, 3, 4].map((s) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-2 ${s > 1 ? 'flex-1' : ''}`}>
                  {s > 1 && (
                    <div className={`h-0.5 flex-1 ${step >= s ? (isDark ? 'bg-white' : 'bg-gray-900') : (isDark ? 'bg-neutral-800' : 'bg-gray-300')}`} />
                  )}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    step >= s 
                      ? isDark ? 'bg-white text-black' : 'bg-gray-900 text-white'
                      : isDark ? 'bg-neutral-800 text-neutral-500' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {s}
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Upload */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <Card className={`${isDark ? 'bg-neutral-900 border-neutral-800' : 'border-2'}`}>
                <CardContent className="p-12">
                  <div className="text-center space-y-6">
                    <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${isDark ? 'bg-neutral-800' : 'bg-gray-100'}`}>
                      <Upload className={`w-10 h-10 ${isDark ? 'text-neutral-400' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <h2 className={`text-2xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Upload de Documento (Opcional)
                      </h2>
                      <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                        Contratos, SPED, notas fiscais, holerites - A IA extrairá os dados automaticamente
                      </p>
                    </div>
                    <div className="max-w-md mx-auto">
                      <Input
                        type="file"
                        accept=".pdf,.xml,.txt,.docx,.xlsx,.xls"
                        onChange={(e) => {
                          setUploadedFile(e.target.files[0]);
                          toast.success("Arquivo carregado! Prossiga para a próxima etapa.");
                        }}
                        className={`text-center ${isDark ? 'bg-neutral-800 border-neutral-700' : ''}`}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="text-center">
                <Button
                  onClick={() => setStep(2)}
                  size="lg"
                  className={isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-gray-900 text-white hover:bg-gray-800'}
                >
                  {uploadedFile ? "Continuar com o arquivo" : "Pular para seleção manual"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Área Jurídica */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {areasJuridicas.map((area) => {
                  const Icon = area.icon;
                  return (
                    <motion.button
                      key={area.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSelectedArea(area.id);
                        setStep(3);
                      }}
                      className={`p-6 rounded-lg border-2 text-left transition-all ${
                        isDark
                          ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-600'
                          : 'bg-white border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <Icon className={`w-8 h-8 mb-3 text-${area.color}-600`} />
                      <h3 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {area.title}
                      </h3>
                      <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                        {area.description}
                      </p>
                    </motion.button>
                  );
                })}
              </div>

              <div className="flex justify-center">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Tipo de Cálculo */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
                <CardHeader>
                  <CardTitle className={isDark ? 'text-white' : ''}>
                    Escolha o tipo de cálculo
                  </CardTitle>
                  <CardDescription className={isDark ? 'text-neutral-400' : ''}>
                    {selectedAreaData?.title} - Selecione o cálculo específico
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-3">
                    {availableCalculators.map((calc) => {
                      const Icon = calc.icon;
                      return (
                        <motion.button
                          key={calc.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setSelectedCalculator(calc.id);
                            setStep(4);
                          }}
                          className={`p-4 rounded-lg border text-left transition-all ${
                            isDark
                              ? 'bg-neutral-800 border-neutral-700 hover:border-neutral-600'
                              : 'bg-gray-50 border-gray-200 hover:border-gray-400'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Icon className={`w-5 h-5 mt-0.5 ${isDark ? 'text-neutral-400' : 'text-gray-600'}`} />
                            <div className="flex-1">
                              <h4 className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {calc.title}
                              </h4>
                              <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                                {calc.description}
                              </p>
                            </div>
                            <ChevronRight className={`w-4 h-4 ${isDark ? 'text-neutral-600' : 'text-gray-400'}`} />
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-center">
                <Button
                  onClick={() => setStep(2)}
                  variant="outline"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Calculadora */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className={`grid ${showAI || showHistory || showAIChatHistory ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-6`}>
                {showHistory && (
                  <div className="lg:order-first">
                    <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
                      <CardContent className="p-4">
                        <CalculationHistory
                          isDark={isDark}
                          onLoadCalculation={handleLoadCalculation}
                          currentArea={selectedArea}
                          currentType={selectedCalculator}
                        />
                      </CardContent>
                    </Card>
                  </div>
                )}

                {showAIChatHistory && (
                  <div className="lg:order-first">
                    <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
                      <CardHeader className="pb-3">
                        <CardTitle className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Histórico de Chat com IA
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <AICalculatorAssistant 
                          isDark={isDark} 
                          calculatorType={selectedCalculator}
                          historyMode={true}
                        />
                      </CardContent>
                    </Card>
                  </div>
                )}

                <div className={showAI || showHistory || showAIChatHistory ? 'lg:col-span-2' : ''}>
                  <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {selectedCalculator && calculatorTypes[selectedCalculator] && (() => {
                            const SelectedIcon = calculatorTypes[selectedCalculator].icon;
                            return (
                              <>
                                <SelectedIcon className={`w-6 h-6 ${isDark ? 'text-white' : 'text-gray-900'}`} />
                                <div>
                                  <CardTitle className={isDark ? 'text-white' : ''}>
                                    {calculatorTypes[selectedCalculator].title}
                                  </CardTitle>
                                  <CardDescription className={isDark ? 'text-neutral-400' : ''}>
                                    {calculatorTypes[selectedCalculator].description}
                                  </CardDescription>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                        <Button
                          onClick={() => {
                            setStep(3);
                            setSelectedCalculator(null);
                          }}
                          variant="outline"
                          size="sm"
                        >
                          Trocar
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {renderCalculator()}
                    </CardContent>
                  </Card>

                  <div className="flex justify-center gap-3 mt-6">
                    <Button
                      onClick={() => setStep(3)}
                      variant="outline"
                      className={isDark ? 'border-neutral-700 text-white hover:bg-neutral-800' : ''}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Voltar para cálculos
                    </Button>
                    <Button
                      onClick={() => {
                        setStep(2);
                        setSelectedCalculator(null);
                      }}
                      variant="outline"
                      className={isDark ? 'border-neutral-700 text-white hover:bg-neutral-800' : ''}
                    >
                      Trocar área jurídica
                    </Button>
                  </div>
                </div>

                {showAI && (
                  <div>
                    <AICalculatorAssistant 
                      isDark={isDark} 
                      calculatorType={selectedCalculator}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Save Dialog */}
        <SaveCalculationDialog
          open={showSaveDialog}
          onOpenChange={setShowSaveDialog}
          calculatorType={selectedCalculator}
          legalArea={selectedArea}
          inputData={currentInputData}
          resultData={currentResultData}
          isDraft={saveAsDraft}
        />

        {/* Mobile Swipe Hint */}
        {step > 1 && step < 4 && (
          <div className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2">
            <div className={`px-4 py-2 rounded-full text-xs ${
              isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-white border border-gray-200 text-gray-500'
            }`}>
              ← Deslize para navegar →
            </div>
          </div>
        )}
      </div>
    </div>
  );
}