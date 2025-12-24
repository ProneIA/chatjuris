import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Download, Upload, FileText, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TributarioAdvancedCalculator({ isDark }) {
  const [activeTab, setActiveTab] = useState("regimes");
  const [isUploading, setIsUploading] = useState(false);
  
  // Comparação de Regimes
  const [receitaBruta, setReceitaBruta] = useState("");
  const [custos, setCustos] = useState("");
  const [despesas, setDespesas] = useState("");
  const [atividadeServico, setAtividadeServico] = useState(true);
  
  // TUSD/TUST
  const [valorConta, setValorConta] = useState("");
  const [percentualTusd, setPercentualTusd] = useState("25");
  const [aliquotaIcms, setAliquotaIcms] = useState("18");
  const [mesesAtras, setMesesAtras] = useState("60");
  
  // Tese do Século
  const [faturamentoPisCofins, setFaturamentoPisCofins] = useState("");
  const [icmsRecolhido, setIcmsRecolhido] = useState("");
  const [aliquotaPis, setAliquotaPis] = useState("1.65");
  const [aliquotaCofins, setAliquotaCofins] = useState("7.6");
  
  // ISS da base PIS/COFINS
  const [faturamentoServicos, setFaturamentoServicos] = useState("");
  const [issRecolhido, setIssRecolhido] = useState("");
  
  // PIS/COFINS da própria base
  const [faturamentoTotal, setFaturamentoTotal] = useState("");
  
  // Clínicas de Saúde
  const [faturamentoClinica, setFaturamentoClinica] = useState("");
  const [irpjPago, setIrpjPago] = useState("");
  const [csllPago, setCsllPago] = useState("");
  
  // 20 SM Contribuições
  const [folhaPagamento, setFolhaPagamento] = useState("");
  const [aliquotaTerceiros, setAliquotaTerceiros] = useState("5.8");
  
  const [resultado, setResultado] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      // Extrair dados do arquivo
      const jsonSchema = {
        type: "object",
        properties: {
          faturamento: { type: "number" },
          icms: { type: "number" },
          pis: { type: "number" },
          cofins: { type: "number" },
          iss: { type: "number" }
        }
      };
      
      const extracted = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: jsonSchema
      });

      if (extracted.status === "success" && extracted.output) {
        setFaturamentoPisCofins(extracted.output.faturamento || "");
        setIcmsRecolhido(extracted.output.icms || "");
        toast.success("Dados extraídos com sucesso!");
      }
    } catch (err) {
      toast.error("Erro ao processar arquivo");
    } finally {
      setIsUploading(false);
    }
  };

  const calcularRegimes = () => {
    const receita = parseFloat(receitaBruta) || 0;
    const custo = parseFloat(custos) || 0;
    const despesa = parseFloat(despesas) || 0;

    if (!receita) {
      toast.error("Informe a receita bruta");
      return;
    }

    // Simples Nacional
    let simplesTotal = 0;
    if (receita <= 180000) {
      simplesTotal = receita * (atividadeServico ? 0.06 : 0.04); // 6% serviço, 4% comércio
    } else if (receita <= 360000) {
      simplesTotal = receita * (atividadeServico ? 0.112 : 0.073);
    } else if (receita <= 720000) {
      simplesTotal = receita * (atividadeServico ? 0.135 : 0.095);
    } else if (receita <= 1800000) {
      simplesTotal = receita * (atividadeServico ? 0.16 : 0.107);
    } else if (receita <= 3600000) {
      simplesTotal = receita * (atividadeServico ? 0.21 : 0.143);
    } else if (receita <= 4800000) {
      simplesTotal = receita * (atividadeServico ? 0.33 : 0.19);
    }

    // Lucro Presumido
    const basePresumida = receita * (atividadeServico ? 0.32 : 0.08);
    const irpjPresumido = basePresumida * 0.15;
    const csllPresumido = basePresumida * 0.09;
    const pisPresumido = receita * 0.0065;
    const cofinsPresumido = receita * 0.03;
    const presumidoTotal = irpjPresumido + csllPresumido + pisPresumido + cofinsPresumido;

    // Lucro Real
    const lucro = receita - custo - despesa;
    const irpjReal = Math.max(0, lucro * 0.15);
    const adicionalIrpj = Math.max(0, (lucro - 240000) * 0.10);
    const csllReal = Math.max(0, lucro * 0.09);
    const pisReal = receita * 0.0165;
    const cofinsReal = receita * 0.076;
    const realTotal = irpjReal + adicionalIrpj + csllReal + pisReal + cofinsReal;

    setResultado({
      tipo: "Comparação de Regimes Tributários",
      receita,
      simples: {
        total: simplesTotal,
        percentual: (simplesTotal / receita * 100).toFixed(2)
      },
      presumido: {
        irpj: irpjPresumido,
        csll: csllPresumido,
        pis: pisPresumido,
        cofins: cofinsPresumido,
        total: presumidoTotal,
        percentual: (presumidoTotal / receita * 100).toFixed(2)
      },
      real: {
        irpj: irpjReal,
        adicional: adicionalIrpj,
        csll: csllReal,
        pis: pisReal,
        cofins: cofinsReal,
        total: realTotal,
        percentual: (realTotal / receita * 100).toFixed(2)
      },
      melhorRegime: simplesTotal < presumidoTotal && simplesTotal < realTotal ? "Simples Nacional" :
                    presumidoTotal < realTotal ? "Lucro Presumido" : "Lucro Real",
      economia: Math.max(simplesTotal, presumidoTotal, realTotal) - Math.min(simplesTotal, presumidoTotal, realTotal)
    });
  };

  const calcularTusdTust = () => {
    const conta = parseFloat(valorConta) || 0;
    const tusd = parseFloat(percentualTusd) || 25;
    const icms = parseFloat(aliquotaIcms) || 18;
    const meses = parseInt(mesesAtras) || 60;

    if (!conta) {
      toast.error("Informe o valor da conta");
      return;
    }

    const valorTusd = conta * (tusd / 100);
    const icmsSobreTusd = valorTusd * (icms / 100);
    const recuperacaoMensal = icmsSobreTusd;
    const recuperacaoTotal = recuperacaoMensal * meses;
    
    // SELIC 1% a.m.
    const corrigido = recuperacaoTotal * Math.pow(1.01, meses);

    setResultado({
      tipo: "Recuperação TUSD/TUST",
      valorConta: conta,
      valorTusd,
      percentualTusd: tusd,
      aliquotaIcms: icms,
      icmsMensal: recuperacaoMensal,
      meses,
      totalBruto: recuperacaoTotal,
      totalCorrigido: corrigido,
      economia: corrigido,
      base: "Tema 986 STF - Exclusão TUSD/TUST da base ICMS"
    });
  };

  const calcularTeseSeculo = () => {
    const fat = parseFloat(faturamentoPisCofins) || 0;
    const icms = parseFloat(icmsRecolhido) || 0;
    const pis = parseFloat(aliquotaPis) || 1.65;
    const cofins = parseFloat(aliquotaCofins) || 7.6;

    if (!fat || !icms) {
      toast.error("Preencha os campos");
      return;
    }

    // Base atual (com ICMS)
    const pisAtual = fat * (pis / 100);
    const cofinsAtual = fat * (cofins / 100);
    
    // Base correta (sem ICMS)
    const baseCorreta = fat - icms;
    const pisCorreto = baseCorreta * (pis / 100);
    const cofinsCorreto = baseCorreta * (cofins / 100);
    
    const recuperacaoPis = pisAtual - pisCorreto;
    const recuperacaoCofins = cofinsAtual - cofinsCorreto;
    const totalRecuperar = recuperacaoPis + recuperacaoCofins;

    setResultado({
      tipo: "Tese do Século - Exclusão ICMS de PIS/COFINS",
      faturamento: fat,
      icmsRecolhido: icms,
      baseAtual: fat,
      baseCorreta,
      recuperacaoPis,
      recuperacaoCofins,
      totalMensal: totalRecuperar,
      total60Meses: totalRecuperar * 60,
      economia: totalRecuperar * 60 * 1.01 ** 30, // Corrigido SELIC
      base: "RE 574.706 - Tema 69 STF"
    });
  };

  const calcularIssBase = () => {
    const fat = parseFloat(faturamentoServicos) || 0;
    const iss = parseFloat(issRecolhido) || 0;
    const pis = 1.65;
    const cofins = 7.6;

    if (!fat || !iss) {
      toast.error("Preencha os campos");
      return;
    }

    const pisAtual = fat * (pis / 100);
    const cofinsAtual = fat * (cofins / 100);
    
    const baseCorreta = fat - iss;
    const pisCorreto = baseCorreta * (pis / 100);
    const cofinsCorreto = baseCorreta * (cofins / 100);
    
    const recuperacao = (pisAtual - pisCorreto) + (cofinsAtual - cofinsCorreto);

    setResultado({
      tipo: "Exclusão ISS da base PIS/COFINS",
      faturamento: fat,
      issRecolhido: iss,
      recuperacaoMensal: recuperacao,
      total60Meses: recuperacao * 60,
      totalCorrigido: recuperacao * 60 * 1.5,
      base: "REsp 1.330.737 - ISS não compõe base PIS/COFINS"
    });
  };

  const calcularPisCofinsPropria = () => {
    const fat = parseFloat(faturamentoTotal) || 0;
    const pis = 1.65;
    const cofins = 7.6;

    if (!fat) {
      toast.error("Informe o faturamento");
      return;
    }

    // Cálculo atual (com PIS/COFINS na base)
    const total = pis + cofins;
    const valorAtual = fat * (total / 100);
    
    // Cálculo correto (sem PIS/COFINS na base)
    const baseCorreta = fat / (1 + total / 100);
    const valorCorreto = baseCorreta * (total / 100);
    
    const recuperacao = valorAtual - valorCorreto;

    setResultado({
      tipo: "Exclusão PIS/COFINS da Própria Base",
      faturamento: fat,
      baseAtual: fat,
      baseCorreta,
      recuperacaoMensal: recuperacao,
      total60Meses: recuperacao * 60,
      totalCorrigido: recuperacao * 60 * 1.3,
      base: "Tema 1.067 STF - PIS/COFINS não integram própria base"
    });
  };

  const calcularClinicas = () => {
    const fat = parseFloat(faturamentoClinica) || 0;
    const irpj = parseFloat(irpjPago) || 0;
    const csll = parseFloat(csllPago) || 0;

    if (!fat || !irpj || !csll) {
      toast.error("Preencha todos os campos");
      return;
    }

    // Alíquotas normais: IRPJ 15%, CSLL 9%
    // Alíquotas reduzidas p/ saúde: IRPJ 8%, CSLL 12% sobre 8% da receita
    const basePresumida = fat * 0.08;
    const irpjCorreto = basePresumida * 0.08;
    const csllCorreto = fat * 0.12 * 0.08;
    
    const recuperacaoIrpj = irpj - irpjCorreto;
    const recuperacaoCsll = csll - csllCorreto;

    setResultado({
      tipo: "Recuperação de Créditos - Clínicas de Saúde",
      faturamento: fat,
      irpjPago: irpj,
      irpjCorreto,
      csllPago: csll,
      csllCorreto,
      recuperacaoIrpj,
      recuperacaoCsll,
      totalRecuperar: recuperacaoIrpj + recuperacaoCsll,
      base: "Lei 9.249/95 art. 15 §1º III"
    });
  };

  const calcular20SM = () => {
    const folha = parseFloat(folhaPagamento) || 0;
    const aliquota = parseFloat(aliquotaTerceiros) || 5.8;

    if (!folha) {
      toast.error("Informe a folha de pagamento");
      return;
    }

    const salarioMinimo = 1412; // 2024
    const teto = salarioMinimo * 20;
    
    const contribuicaoAtual = folha * (aliquota / 100);
    const contribuicaoCorreta = Math.min(folha, teto) * (aliquota / 100);
    const recuperacao = contribuicaoAtual - contribuicaoCorreta;

    setResultado({
      tipo: "Limite 20 SM - Contribuições de Terceiros",
      folhaPagamento: folha,
      teto20SM: teto,
      aliquota: aliquota,
      contribuicaoAtual,
      contribuicaoCorreta,
      recuperacaoMensal: recuperacao,
      total60Meses: recuperacao * 60,
      base: "Art. 4º Lei 6.950/81 - Teto 20 SM"
    });
  };

  const exportarPDF = () => {
    if (!resultado) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('RELATÓRIO DE CÁLCULO TRIBUTÁRIO', pageWidth / 2, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, 23, { align: 'center' });
    doc.line(15, 27, pageWidth - 15, 27);
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(resultado.tipo, 15, 37);
    
    if (resultado.base) {
      doc.setFontSize(9);
      doc.setFont(undefined, 'italic');
      doc.text(`Fundamentação: ${resultado.base}`, 15, 44);
    }
    
    let y = 55;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    
    Object.entries(resultado).forEach(([key, value]) => {
      if (key !== 'tipo' && key !== 'base' && typeof value !== 'object') {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        
        const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
        doc.text(`${label}:`, 15, y);
        
        const formatted = typeof value === 'number' 
          ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
          : String(value);
        doc.text(formatted, pageWidth - 15, y, { align: 'right' });
        y += 8;
      }
    });
    
    // Resumo
    if (resultado.economia || resultado.totalRecuperar) {
      y += 10;
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('VALOR A RECUPERAR:', 15, y);
      const total = resultado.economia || resultado.totalRecuperar || resultado.totalCorrigido || 0;
      doc.text(`R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - 15, y, { align: 'right' });
    }
    
    doc.save(`calculo_tributario_${Date.now()}.pdf`);
    toast.success("PDF gerado com sucesso!");
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 lg:grid-cols-8 gap-1">
          <TabsTrigger value="regimes" className="text-xs">Regimes</TabsTrigger>
          <TabsTrigger value="tusd" className="text-xs">TUSD/TUST</TabsTrigger>
          <TabsTrigger value="seculo" className="text-xs">Tese Século</TabsTrigger>
          <TabsTrigger value="iss" className="text-xs">ISS Base</TabsTrigger>
          <TabsTrigger value="propria" className="text-xs">PIS/COFINS</TabsTrigger>
          <TabsTrigger value="clinicas" className="text-xs">Clínicas</TabsTrigger>
          <TabsTrigger value="20sm" className="text-xs">20 SM</TabsTrigger>
          <TabsTrigger value="upload" className="text-xs">Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="regimes" className="space-y-4">
          <Card className={isDark ? "bg-neutral-900 border-neutral-800" : ""}>
            <CardHeader>
              <CardTitle className="text-base">Comparação entre Regimes Tributários</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Receita Bruta Anual (R$)</Label>
                  <Input type="number" value={receitaBruta} onChange={(e) => setReceitaBruta(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Custos (R$)</Label>
                  <Input type="number" value={custos} onChange={(e) => setCustos(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Despesas (R$)</Label>
                  <Input type="number" value={despesas} onChange={(e) => setDespesas(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Atividade</Label>
                  <Select value={atividadeServico ? "servico" : "comercio"} onValueChange={(v) => setAtividadeServico(v === "servico")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="servico">Serviço</SelectItem>
                      <SelectItem value="comercio">Comércio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={calcularRegimes} className="w-full">
                <Calculator className="w-4 h-4 mr-2" />
                Calcular Melhor Regime
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tusd" className="space-y-4">
          <Card className={isDark ? "bg-neutral-900 border-neutral-800" : ""}>
            <CardHeader>
              <CardTitle className="text-base">Revisão TUSD/TUST - Exclusão ICMS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor Médio da Conta (R$)</Label>
                  <Input type="number" value={valorConta} onChange={(e) => setValorConta(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>% TUSD/TUST na conta</Label>
                  <Input type="number" value={percentualTusd} onChange={(e) => setPercentualTusd(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Alíquota ICMS (%)</Label>
                  <Input type="number" value={aliquotaIcms} onChange={(e) => setAliquotaIcms(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Período (meses)</Label>
                  <Input type="number" value={mesesAtras} onChange={(e) => setMesesAtras(e.target.value)} />
                </div>
              </div>
              <Button onClick={calcularTusdTust} className="w-full">
                <Calculator className="w-4 h-4 mr-2" />
                Calcular Recuperação
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seculo" className="space-y-4">
          <Card className={isDark ? "bg-neutral-900 border-neutral-800" : ""}>
            <CardHeader>
              <CardTitle className="text-base">Tese do Século - ICMS fora de PIS/COFINS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Faturamento Mensal (R$)</Label>
                  <Input type="number" value={faturamentoPisCofins} onChange={(e) => setFaturamentoPisCofins(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>ICMS Recolhido Mensal (R$)</Label>
                  <Input type="number" value={icmsRecolhido} onChange={(e) => setIcmsRecolhido(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Alíquota PIS (%)</Label>
                  <Input type="number" value={aliquotaPis} onChange={(e) => setAliquotaPis(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Alíquota COFINS (%)</Label>
                  <Input type="number" value={aliquotaCofins} onChange={(e) => setAliquotaCofins(e.target.value)} />
                </div>
              </div>
              <Button onClick={calcularTeseSeculo} className="w-full">
                <Calculator className="w-4 h-4 mr-2" />
                Calcular Recuperação
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="iss" className="space-y-4">
          <Card className={isDark ? "bg-neutral-900 border-neutral-800" : ""}>
            <CardHeader>
              <CardTitle className="text-base">Exclusão ISS da Base PIS/COFINS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Faturamento Mensal (R$)</Label>
                  <Input type="number" value={faturamentoServicos} onChange={(e) => setFaturamentoServicos(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>ISS Recolhido Mensal (R$)</Label>
                  <Input type="number" value={issRecolhido} onChange={(e) => setIssRecolhido(e.target.value)} />
                </div>
              </div>
              <Button onClick={calcularIssBase} className="w-full">
                <Calculator className="w-4 h-4 mr-2" />
                Calcular Recuperação
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="propria" className="space-y-4">
          <Card className={isDark ? "bg-neutral-900 border-neutral-800" : ""}>
            <CardHeader>
              <CardTitle className="text-base">PIS/COFINS fora da Própria Base</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Faturamento Mensal (R$)</Label>
                <Input type="number" value={faturamentoTotal} onChange={(e) => setFaturamentoTotal(e.target.value)} />
              </div>
              <Button onClick={calcularPisCofinsPropria} className="w-full">
                <Calculator className="w-4 h-4 mr-2" />
                Calcular Recuperação
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clinicas" className="space-y-4">
          <Card className={isDark ? "bg-neutral-900 border-neutral-800" : ""}>
            <CardHeader>
              <CardTitle className="text-base">Recuperação - Clínicas de Saúde</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Faturamento Anual (R$)</Label>
                  <Input type="number" value={faturamentoClinica} onChange={(e) => setFaturamentoClinica(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>IRPJ Pago (R$)</Label>
                  <Input type="number" value={irpjPago} onChange={(e) => setIrpjPago(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>CSLL Pago (R$)</Label>
                  <Input type="number" value={csllPago} onChange={(e) => setCsllPago(e.target.value)} />
                </div>
              </div>
              <Button onClick={calcularClinicas} className="w-full">
                <Calculator className="w-4 h-4 mr-2" />
                Calcular Recuperação
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="20sm" className="space-y-4">
          <Card className={isDark ? "bg-neutral-900 border-neutral-800" : ""}>
            <CardHeader>
              <CardTitle className="text-base">Limite 20 SM - Contribuições de Terceiros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Folha de Pagamento Mensal (R$)</Label>
                  <Input type="number" value={folhaPagamento} onChange={(e) => setFolhaPagamento(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Alíquota Terceiros (%)</Label>
                  <Input type="number" value={aliquotaTerceiros} onChange={(e) => setAliquotaTerceiros(e.target.value)} />
                </div>
              </div>
              <Button onClick={calcular20SM} className="w-full">
                <Calculator className="w-4 h-4 mr-2" />
                Calcular Recuperação
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <Card className={isDark ? "bg-neutral-900 border-neutral-800" : ""}>
            <CardHeader>
              <CardTitle className="text-base">Importar Documentos Fiscais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`border-2 border-dashed rounded-lg p-8 text-center ${isDark ? "border-neutral-700" : "border-gray-300"}`}>
                <Upload className={`w-12 h-12 mx-auto mb-4 ${isDark ? "text-neutral-600" : "text-gray-400"}`} />
                <p className={`mb-4 ${isDark ? "text-neutral-400" : "text-gray-600"}`}>
                  Arraste ou clique para fazer upload
                </p>
                <p className={`text-sm mb-4 ${isDark ? "text-neutral-500" : "text-gray-500"}`}>
                  SPED Fiscal, SPED Contribuições, GFIP, Contas de Energia
                </p>
                <Input
                  type="file"
                  accept=".txt,.xml,.pdf"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button asChild disabled={isUploading}>
                    <span>
                      {isUploading ? "Processando..." : "Selecionar Arquivo"}
                    </span>
                  </Button>
                </label>
              </div>
              <div className={`flex items-start gap-2 p-4 rounded-lg ${isDark ? "bg-blue-900/20 text-blue-400" : "bg-blue-50 text-blue-700"}`}>
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium mb-1">Extração Automática de Dados</p>
                  <p>O sistema extrairá automaticamente faturamento, ICMS, PIS, COFINS e ISS dos seus documentos.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {resultado && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Card className={isDark ? "bg-neutral-900 border-neutral-800" : "bg-gradient-to-br from-amber-50 to-orange-50"}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{resultado.tipo}</CardTitle>
                  {resultado.base && (
                    <p className={`text-sm mt-2 ${isDark ? "text-neutral-500" : "text-gray-600"}`}>
                      {resultado.base}
                    </p>
                  )}
                </div>
                <Button onClick={exportarPDF} size="sm" variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {resultado.melhorRegime ? (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className={`p-4 rounded-lg ${resultado.melhorRegime === "Simples Nacional" ? "ring-2 ring-green-500" : ""} ${isDark ? "bg-neutral-800" : "bg-white"}`}>
                      <p className="text-sm font-medium mb-2">Simples Nacional</p>
                      <p className="text-2xl font-bold">R$ {resultado.simples.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      <p className="text-sm text-gray-500">{resultado.simples.percentual}% da receita</p>
                    </div>
                    <div className={`p-4 rounded-lg ${resultado.melhorRegime === "Lucro Presumido" ? "ring-2 ring-green-500" : ""} ${isDark ? "bg-neutral-800" : "bg-white"}`}>
                      <p className="text-sm font-medium mb-2">Lucro Presumido</p>
                      <p className="text-2xl font-bold">R$ {resultado.presumido.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      <p className="text-sm text-gray-500">{resultado.presumido.percentual}% da receita</p>
                    </div>
                    <div className={`p-4 rounded-lg ${resultado.melhorRegime === "Lucro Real" ? "ring-2 ring-green-500" : ""} ${isDark ? "bg-neutral-800" : "bg-white"}`}>
                      <p className="text-sm font-medium mb-2">Lucro Real</p>
                      <p className="text-2xl font-bold">R$ {resultado.real.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      <p className="text-sm text-gray-500">{resultado.real.percentual}% da receita</p>
                    </div>
                  </div>
                  <div className={`p-4 rounded-lg ${isDark ? "bg-green-900/20" : "bg-green-50"}`}>
                    <p className="font-semibold text-green-700 mb-1">✓ Melhor opção: {resultado.melhorRegime}</p>
                    <p className="text-sm text-green-600">Economia anual: R$ {resultado.economia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(resultado)
                    .filter(([key]) => key !== 'tipo' && key !== 'base' && typeof resultado[key] !== 'object')
                    .map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-neutral-700 last:border-0">
                        <span className={`font-medium ${isDark ? "text-neutral-400" : "text-gray-600"}`}>
                          {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                        </span>
                        <span className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                          {typeof value === 'number' 
                            ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                            : value}
                        </span>
                      </div>
                    ))}
                  {(resultado.economia || resultado.totalRecuperar || resultado.totalCorrigido) && (
                    <div className={`mt-4 p-4 rounded-lg ${isDark ? "bg-amber-900/20" : "bg-amber-50"}`}>
                      <p className="text-lg font-bold text-amber-700">
                        💰 Total a Recuperar: R$ {(resultado.economia || resultado.totalRecuperar || resultado.totalCorrigido).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}