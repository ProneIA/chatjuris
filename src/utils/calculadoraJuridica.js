// ============================================================
// MOTOR JURÍDICO BRASILEIRO — v2.0
// Arquitetura modular: Área → Engine → Validador → Auditor → PDF
// Atualizar PARAMS conforme mudanças legislativas (2026)
// ============================================================

// ─── TABELAS OFICIAIS VERSIONADAS ───────────────────────────────────────────

export const PARAMS = {
  // Salários e Tetos
  salarioMinimo: 1518.00,          // 2025
  tetoPrev: 7786.02,               // Teto INSS 2025
  fgts: 0.08,
  multaFgts: 0.40,
  multaFgtsAcordo: 0.20,

  // Adicionais trabalhistas
  adicionalHE50: 0.50,
  adicionalHE100: 1.00,
  adicionalNoturno: 0.20,
  insalMax: 0.40,
  insalMed: 0.20,
  insalMin: 0.10,
  periculosidade: 0.30,
  horasMensais: 220,

  // Índices de correção (médias mensais — atualizar periodicamente)
  inpcMensal: 0.0045,
  ipcaeMensal: 0.0047,
  ipcaMensal: 0.0048,
  igpmMensal: 0.0052,
  trMensal: 0.0008,
  cdiMensal: 0.0088,

  // Juros
  selicMensal: 0.0107,             // SELIC mensal (EC 113/2021)
  jurosMoraCivel: 0.01,            // 1% a.m. CC/2002
  jurosFazenda: 0.005,             // 0,5% a.m. — Lei 9.494/97 (pré-EC113)
  jurosTrabalhista: 0.01,          // 1% a.m. CLT

  // Honorários
  honorariosMin: 0.10,
  honorariosMax: 0.20,

  // Locação / CDC
  multaConsCDC: 0.02,
  jurosMoraLoc: 0.01,

  // FGTS / Rescisão
  multaInadimplenciaLocacao: 0.10,
};

// Salário mínimo histórico (para cálculos retroativos)
export const SALARIO_MINIMO_HISTORICO = {
  2018: 954, 2019: 998, 2020: 1045, 2021: 1100,
  2022: 1212, 2023: 1320, 2024: 1412, 2025: 1518,
};

// ─── REGIMES DE JUROS ────────────────────────────────────────────────────────
// Selecione conforme área, ente e período (jurisprudência automática)
export const REGIMES_JUROS = {
  CIVIL_CC:          { label: "1% a.m. (Art. 406 CC)", taxa: 0.01, tipo: "simples", legal: "Art. 406 CC/2002; Súmula 54 STJ" },
  SELIC_EC113:       { label: "SELIC (EC 113/2021)", taxa: null, selicRef: true, tipo: "acumulado", legal: "EC 113/2021; ADC 58 STF" },
  FAZENDA_PRE_EC113: { label: "0,5% a.m. (Lei 9.494/97)", taxa: 0.005, tipo: "simples", legal: "Art. 1º-F Lei 9.494/97" },
  TRABALHISTA_ADC58: { label: "IPCA-E + SELIC (ADC 58)", taxa: null, selicRef: true, tipo: "acumulado", legal: "ADC 58 STF; TST; Tema 1191" },
  INPC:              { label: "INPC (previdenciário)", taxa: null, inpcRef: true, tipo: "acumulado", legal: "Lei 10.150/2000" },
  TRIBUTARIO_SELIC:  { label: "SELIC integral", taxa: null, selicRef: true, tipo: "acumulado", legal: "Art. 61 §3º Lei 9.430/96" },
};

// Súmulas e Temas automaticamente aplicáveis
export const JURISPRUDENCIA = {
  "Súmula 54 STJ":   "Juros de mora correm desde o evento danoso (responsabilidade extracontratual).",
  "Súmula 362 STJ":  "Prescrição para cobrança de FGTS: 5 anos até a extinção do contrato.",
  "Súmula 440 STJ":  "Multa rescisória locatícia proporcional ao tempo restante.",
  "Súmula 171 TST":  "Férias proporcionais no caso de culpa do empregado na rescisão.",
  "Súmula 264 TST":  "Horas extras habitualmente prestadas integram o salário.",
  "Súmula 172 TST":  "Reflexos de horas extras em 13º/férias/FGTS.",
  "Súmula 228 TST":  "Insalubridade calculada sobre o salário mínimo.",
  "Súmula 60 TST":   "Adicional noturno e reflexos.",
  "ADC 58 STF":      "Trabalhista: IPCA-E na fase pré-judicial + SELIC pós-ajuizamento (substituindo TR).",
  "Tema 810 STF":    "Correção de débitos previdenciários: INPC para fase administrativa; IPCA-E judicial.",
  "EC 113/2021":     "SELIC substitui TJLP/TRD para débitos contra a Fazenda Pública.",
  "Súmula 381 TST":  "Juros de mora fluem a partir do ajuizamento da ação trabalhista.",
  "Súmula 85 STJ":   "Prescrição quinquenal para benefícios previdenciários.",
  "Art. 7º XVII CF": "Férias com acréscimo de 1/3 sobre o salário normal.",
};

// ─── UTILITÁRIOS CENTRAIS ────────────────────────────────────────────────────

export function diasEntre(dataInicio, dataFim) {
  if (!dataInicio || !dataFim) return 0;
  const d1 = new Date(dataInicio + "T00:00:00");
  const d2 = new Date(dataFim + "T00:00:00");
  return Math.max(0, Math.round((d2 - d1) / 86400000));
}

export function mesesEntre(dataInicio, dataFim) {
  if (!dataInicio || !dataFim) return 0;
  const d1 = new Date(dataInicio + "T00:00:00");
  const d2 = new Date(dataFim + "T00:00:00");
  return Math.max(0, (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth()));
}

// Proporcional: considera dia >= 15 como mês cheio
export function mesesProporcionais(dataInicio, dataFim) {
  if (!dataInicio || !dataFim) return 0;
  const d2 = new Date(dataFim + "T00:00:00");
  const meses = mesesEntre(dataInicio, dataFim);
  return d2.getDate() >= 15 ? meses + 1 : meses;
}

export function brl(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency", currency: "BRL",
    minimumFractionDigits: 2, maximumFractionDigits: 2
  });
}

export function fmtData(str) {
  if (!str) return "—";
  const p = str.split("-");
  return `${p[2]}/${p[1]}/${p[0]}`;
}

export function correcaoAcumulada(valorBase, meses, taxaMensal) {
  if (!meses || meses <= 0 || !taxaMensal) return 0;
  return valorBase * (Math.pow(1 + taxaMensal, meses) - 1);
}

export function jurosSimples(valorBase, meses, taxaMensal) {
  if (!meses || meses <= 0 || !taxaMensal) return 0;
  return valorBase * taxaMensal * meses;
}

export function calcAvisoPrevio(dataAdmissao, dataDemissao) {
  const anos = Math.floor(mesesEntre(dataAdmissao, dataDemissao) / 12);
  return Math.min(90, 30 + anos * 3);
}

export function gerarProtocolo() {
  return `CALC-${String(Date.now()).slice(-8)}`;
}

export function hoje() {
  return new Date().toISOString().split("T")[0];
}

// ─── GERADOR DE COMPETÊNCIAS MENSAIS ─────────────────────────────────────────
// Usado por: previdenciário, alimentos, locação, execução
export function gerarCompetencias(dataInicio, dataFim, valorBase, taxaCorrecao, taxaJuros) {
  const competencias = [];
  let d = new Date(dataInicio + "T00:00:00");
  const fim = new Date(dataFim + "T00:00:00");
  let mesIndex = 0;

  while (d <= fim) {
    const mesStr = `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    const corr = correcaoAcumulada(valorBase, mesIndex, taxaCorrecao);
    const jr = jurosSimples(valorBase, mesIndex, taxaJuros);
    competencias.push({
      mes: mesStr, valorBase,
      correcao: corr, juros: jr,
      subtotal: valorBase + corr + jr,
    });
    d.setMonth(d.getMonth() + 1);
    mesIndex++;
  }
  return competencias;
}

// ─── AUDITOR JURÍDICO ─────────────────────────────────────────────────────────
// Detecta inconsistências e gera alertas automáticos
export function auditar(areaId, dados, resultado) {
  const alertas = [];

  // Validação de datas
  if (dados.dataInicio && dados.dataFim && new Date(dados.dataFim) < new Date(dados.dataInicio)) {
    alertas.push({ tipo: "ERRO", msg: "Data final anterior à data inicial." });
  }

  // Período inferior a 30 dias — não gerar competência mensal integral
  if (dados.dataInicio && dados.dataFim) {
    const d = diasEntre(dados.dataInicio, dados.dataFim);
    if (d > 0 && d < 30 && resultado?.verbas?.some(v => v.formula?.includes("meses"))) {
      alertas.push({ tipo: "AVISO", msg: `Período de ${d} dias (< 30): competência mensal não deve ser gerada de forma integral.` });
    }
  }

  // Trabalhista — período prescricional
  if (areaId === "trabalhista" && dados.dataDemissao) {
    const anos = diasEntre(dados.dataDemissao, hoje()) / 365;
    if (anos > 2) alertas.push({ tipo: "ALERTA", msg: `Prescrição trabalhista bienal detectada: ${Math.floor(anos)} anos desde a demissão. Art. 7º, XXIX CF/88.` });
  }

  // Previdenciário — prescrição quinquenal
  if (areaId === "previdenciario" && dados.dataConcessao) {
    const anos = diasEntre(dados.dataConcessao, hoje()) / 365;
    if (anos > 5) alertas.push({ tipo: "ALERTA", msg: `Possível prescrição quinquenal: competências anteriores a ${Math.floor(anos - 5)} anos prescritas. Súmula 85 STJ.` });
  }

  // Honorários acima do limite CPC
  if (resultado?.honorarios?.percentual > 20) {
    alertas.push({ tipo: "AVISO", msg: `Honorários de ${resultado.honorarios.percentual}% excedem o limite máximo de 20% previsto no Art. 85 §2º CPC.` });
  }

  // Civil — juros antes da citação/evento
  if (areaId === "civil" && !dados.dataFato) {
    alertas.push({ tipo: "AVISO", msg: "Sem data do fato: juros de mora não podem ser calculados corretamente (Súmula 54 STJ)." });
  }

  // Competências duplicadas
  if (resultado?.competencias) {
    const meses = resultado.competencias.map(c => c.mes);
    const duplicados = meses.filter((m, i) => meses.indexOf(m) !== i);
    if (duplicados.length > 0) alertas.push({ tipo: "ERRO", msg: `Competências duplicadas detectadas: ${duplicados.join(", ")}.` });
  }

  return alertas;
}

// ─── ENGINE 1: TRABALHISTA ────────────────────────────────────────────────────
// Regime de correção: ADC 58 STF — IPCA-E pré-judicial + SELIC pós-ajuizamento
function calcularTrabalhista(dados) {
  const salarioBase = Number(dados.salarioBase) || PARAMS.salarioMinimo;
  const { dataAdmissao, dataDemissao } = dados;
  const tipoDemissao = dados.tipoDemissao || "Sem Justa Causa";
  const horasExtras = Number(dados.horasExtras) || 0;
  const adicionalNoturno = dados.adicionalNoturno === "Sim";
  const insalubridade = dados.insalubridade || "Nenhum";
  const periculosidade = dados.periculosidade === "Sim";
  const fgtsDepositado = Number(dados.fgtsDepositado) || 0;
  const avisoPrevio = dados.avisoPrevio || "Indenizado";
  const ferias = dados.ferias || "Vencidas + Proporcionais";
  const decimoTerceiro = dados.decimoTerceiro !== "Não";

  const totalDias = diasEntre(dataAdmissao, dataDemissao);
  const totalMeses = mesesEntre(dataAdmissao, dataDemissao);
  const mesesProp = mesesProporcionais(dataAdmissao, dataDemissao);
  const anos = Math.floor(totalMeses / 12);
  const diasAP = calcAvisoPrevio(dataAdmissao, dataDemissao);
  const diasMes = new Date(dataDemissao + "T00:00:00").getDate();
  const valorHora = salarioBase / PARAMS.horasMensais;
  const verbas = [];

  // Saldo de salário
  const saldo = (salarioBase / 30) * diasMes;
  verbas.push({ nome: "Saldo de Salário", formula: `${brl(salarioBase)} ÷ 30 × ${diasMes} dias`, legal: "Art. 459 CLT", valor: saldo });

  // Aviso prévio
  if ((tipoDemissao === "Sem Justa Causa" || tipoDemissao === "Rescisão Indireta") && avisoPrevio === "Indenizado") {
    verbas.push({ nome: `Aviso Prévio Indenizado (${diasAP} dias)`, formula: `${brl(salarioBase)} ÷ 30 × ${diasAP}`, legal: "Art. 487 CLT; Lei 12.506/2011", valor: (salarioBase / 30) * diasAP });
  }

  // 13º proporcional
  if (decimoTerceiro) {
    const m13 = Math.min(mesesProp, 12) || 1;
    verbas.push({ nome: `13º Salário Proporcional (${m13}/12)`, formula: `${brl(salarioBase)} ÷ 12 × ${m13}`, legal: "Art. 7º ADCT; Lei 4.090/62", valor: (salarioBase / 12) * m13 });
  }

  // Férias
  const mFerProp = mesesProp % 12 || (mesesProp >= 12 ? 12 : 0);
  if (ferias.includes("Proporcionais") && mFerProp > 0) {
    const fp = (salarioBase / 12) * mFerProp;
    verbas.push({ nome: `Férias Proporcionais (${mFerProp}/12)`, formula: `${brl(salarioBase)} ÷ 12 × ${mFerProp}`, legal: "Art. 146 CLT; Súmula 171 TST", valor: fp });
    verbas.push({ nome: "1/3 Constitucional s/ Férias Proporcionais", formula: `${brl(fp)} × 1/3`, legal: "Art. 7º, XVII CF/88", valor: fp / 3 });
  }
  if (ferias.includes("Vencidas") && totalMeses >= 12) {
    verbas.push({ nome: "Férias Vencidas (1 período)", formula: brl(salarioBase), legal: "Art. 137 CLT", valor: salarioBase });
    verbas.push({ nome: "1/3 Constitucional s/ Férias Vencidas", formula: `${brl(salarioBase)} × 1/3`, legal: "Art. 7º, XVII CF/88", valor: salarioBase / 3 });
  }

  // FGTS
  const baseVerbas = verbas.reduce((s, v) => s + v.valor, 0);
  const fgtsV = baseVerbas * PARAMS.fgts;
  verbas.push({ nome: "FGTS s/ Verbas Rescisórias (8%)", formula: `${brl(baseVerbas)} × 8%`, legal: "Art. 15 Lei 8.036/90", valor: fgtsV });

  // Multa FGTS
  const saldoFgts = fgtsDepositado + fgtsV;
  if (tipoDemissao === "Sem Justa Causa" || tipoDemissao === "Rescisão Indireta") {
    verbas.push({ nome: "Multa FGTS 40%", formula: `${brl(saldoFgts)} × 40%`, legal: "Art. 18 §1º Lei 8.036/90", valor: saldoFgts * PARAMS.multaFgts });
  }
  if (tipoDemissao === "Acordo (484-A CLT)") {
    verbas.push({ nome: "Multa FGTS 20% (Acordo Art. 484-A)", formula: `${brl(saldoFgts)} × 20%`, legal: "Art. 484-A CLT", valor: saldoFgts * PARAMS.multaFgtsAcordo });
  }

  // Horas extras + reflexos
  if (horasExtras > 0) {
    const heVal = valorHora * (1 + PARAMS.adicionalHE50) * horasExtras * totalMeses;
    verbas.push({ nome: `Horas Extras 50% (${horasExtras}h/mês × ${totalMeses} meses)`, formula: `${brl(valorHora)} × 1,50 × ${horasExtras}h × ${totalMeses} meses`, legal: "Art. 59 CLT; Súmula 264 TST", valor: heVal });
    verbas.push({ nome: "Reflexos HE em 13º/Férias/FGTS", formula: `${brl(heVal)} × 33,33%`, legal: "Súmula 172 TST", valor: heVal * 0.3333 });
  }

  // Adicional noturno
  if (adicionalNoturno) {
    verbas.push({ nome: `Adicional Noturno 20% (${totalMeses} meses)`, formula: `${brl(salarioBase)} × 20% × ${totalMeses}`, legal: "Art. 73 CLT; Súmula 60 TST", valor: salarioBase * PARAMS.adicionalNoturno * totalMeses });
  }

  // Insalubridade
  if (insalubridade !== "Nenhum") {
    const pct = insalubridade === "Máxima" ? PARAMS.insalMax : insalubridade === "Média" ? PARAMS.insalMed : PARAMS.insalMin;
    verbas.push({ nome: `Adicional de Insalubridade Grau ${insalubridade} (${(pct*100).toFixed(0)}%)`, formula: `${brl(PARAMS.salarioMinimo)} × ${(pct*100).toFixed(0)}% × ${totalMeses} meses`, legal: "Art. 192 CLT; Súmula 228 TST", valor: PARAMS.salarioMinimo * pct * totalMeses });
  }

  // Periculosidade
  if (periculosidade) {
    verbas.push({ nome: `Adicional de Periculosidade 30% (${totalMeses} meses)`, formula: `${brl(salarioBase)} × 30% × ${totalMeses}`, legal: "Art. 193 CLT", valor: salarioBase * PARAMS.periculosidade * totalMeses });
  }

  // Encargos — ADC 58 STF: IPCA-E pré-judicial + SELIC pós-ajuizamento
  const subtotal = verbas.reduce((s, v) => s + v.valor, 0);
  const mesesCorrecao = mesesEntre(dataDemissao, hoje());
  const corrMonetaria = correcaoAcumulada(subtotal, mesesCorrecao, PARAMS.ipcaeMensal);
  const juros = jurosSimples(subtotal, mesesCorrecao, PARAMS.selicMensal); // SELIC pós ajuizamento
  const honorarios = subtotal * PARAMS.honorariosMin;

  return {
    area: "Trabalhista",
    identificacao: { parteAutora: dados.parteAutora, cpfAutora: dados.cpfAutora, parteRe: dados.parteRe, cpfRe: dados.cpfRe, advogado: dados.advogado },
    periodoBase: { dataInicio: dataAdmissao, dataFim: dataDemissao, diasTotais: totalDias, mesesTotais: totalMeses },
    verbas, subtotal,
    correcaoMonetaria: { indice: "IPCA-E (ADC 58 STF)", meses: mesesCorrecao, valor: corrMonetaria },
    juros: { tipo: "SELIC pós-ajuizamento (EC 113/2021; ADC 58)", meses: mesesCorrecao, taxa: PARAMS.selicMensal * 100, valor: juros },
    honorarios: { percentual: 10, base: subtotal, valor: honorarios, legal: "Art. 85 CPC" },
    totalGeral: subtotal + corrMonetaria + juros + honorarios,
    jurisprudencia: ["ADC 58 STF", "EC 113/2021", "Súmula 264 TST", "Súmula 172 TST", "Súmula 228 TST"],
    observacoes: `Salário: ${brl(salarioBase)}. Período: ${anos} anos e ${totalMeses % 12} meses. Aviso prévio: ${diasAP} dias. Correção: IPCA-E (ADC 58). Juros: SELIC.`,
  };
}

// ─── ENGINE 2: PREVIDENCIÁRIO ─────────────────────────────────────────────────
// Correção: INPC (Tema 810 STF); Juros: SELIC pós-EC 113 (Fazenda Pública)
function calcularPrevidenciario(dados) {
  const tipoBeneficio = dados.tipoBeneficio || "Aposentadoria por Idade";
  const salContrib = Math.min(Math.max(Number(dados.salarioContribuicao) || PARAMS.salarioMinimo, PARAMS.salarioMinimo), PARAMS.tetoPrev);
  const tempoMeses = Number(dados.tempoContribuicaoMeses) || 0;
  const { dataRequerimento, dataConcessao } = dados;
  const competenciasAtraso = Number(dados.competenciasAtraso) || 0;
  const beneficioAtual = Number(dados.beneficioAtual) || 0;
  const verbas = [];
  let rmi = salContrib;

  // Cálculo da RMI conforme tipo
  if (tipoBeneficio.includes("Aposentadoria por Idade")) {
    const anosC = Math.floor(tempoMeses / 12);
    const coef = Math.min(1.0, 0.60 + Math.max(0, anosC - 15) * 0.02);
    rmi = salContrib * coef;
    verbas.push({ nome: "Renda Mensal Inicial (RMI)", formula: `${brl(salContrib)} × ${(coef * 100).toFixed(0)}%`, legal: "Art. 26 EC 103/2019", valor: rmi });
  } else if (tipoBeneficio.includes("Incapacidade") || tipoBeneficio.includes("Auxílio-Doença")) {
    rmi = salContrib * 0.91;
    verbas.push({ nome: "RMI — Auxílio por Incapacidade (91%)", formula: `${brl(salContrib)} × 91%`, legal: "Art. 61 Lei 8.213/91", valor: rmi });
  } else if (tipoBeneficio.includes("BPC")) {
    rmi = PARAMS.salarioMinimo;
    verbas.push({ nome: "BPC/LOAS — 1 Salário Mínimo", formula: brl(PARAMS.salarioMinimo), legal: "Art. 203 CF/88; Art. 20 Lei 8.742/93", valor: rmi });
  } else if (tipoBeneficio.includes("Pensão por Morte")) {
    const coefP = Math.min(1.0, 0.50 + Math.floor(tempoMeses / 12) * 0.01);
    rmi = salContrib * coefP;
    verbas.push({ nome: "Pensão por Morte", formula: `${brl(salContrib)} × ${(coefP*100).toFixed(0)}%`, legal: "Art. 77 Lei 8.213/91; EC 103/2019", valor: rmi });
  } else {
    verbas.push({ nome: "Renda Mensal Inicial (RMI)", formula: brl(rmi), legal: "Lei 8.213/91", valor: rmi });
  }

  // Competências em atraso — INPC (Tema 810 STF pré-EC113)
  let totalCorr = 0, totalJuros = 0;
  if (competenciasAtraso > 0) {
    const atrasados = rmi * competenciasAtraso;
    totalCorr = correcaoAcumulada(atrasados, competenciasAtraso, PARAMS.inpcMensal);
    totalJuros = jurosSimples(atrasados, competenciasAtraso, PARAMS.jurosFazenda);
    verbas.push({ nome: `Competências em Atraso (${competenciasAtraso} meses × ${brl(rmi)})`, formula: `${brl(rmi)} × ${competenciasAtraso}`, legal: "Art. 43 §2º Lei 8.213/91", valor: atrasados });
    verbas.push({ nome: "Correção INPC s/ atrasados (Tema 810 STF)", formula: `${brl(atrasados)} × INPC acumulado`, legal: "Lei 10.150/2000; Tema 810 STF", valor: totalCorr });
    verbas.push({ nome: "Juros 0,5% a.m. (Lei 9.494/97)", formula: `${brl(atrasados)} × 0,5% × ${competenciasAtraso} meses`, legal: "Art. 1º-F Lei 9.494/97 (pré-EC 113)", valor: totalJuros });
  }

  // Revisão de benefício
  if (tipoBeneficio.includes("Revisão") && beneficioAtual && dataConcessao) {
    const dif = Math.max(0, rmi - beneficioAtual);
    const mR = mesesEntre(dataConcessao, hoje());
    const totalDif = dif * mR;
    verbas.push({ nome: `Diferenças de Benefício (${mR} meses × ${brl(dif)})`, formula: `(${brl(rmi)} - ${brl(beneficioAtual)}) × ${mR}`, legal: "Art. 103-A Lei 8.213/91; Súmula 85 STJ", valor: totalDif });
    verbas.push({ nome: "Correção INPC s/ diferenças", formula: `${brl(totalDif)} × INPC acumulado`, legal: "Tema 810 STF", valor: correcaoAcumulada(totalDif, Math.round(mR / 2), PARAMS.inpcMensal) });
  }

  const subtotal = verbas.reduce((s, v) => s + v.valor, 0);
  const honorarios = subtotal * PARAMS.honorariosMin;

  return {
    area: "Previdenciário",
    identificacao: { parteAutora: dados.parteAutora, cpfAutora: dados.cpfAutora, parteRe: dados.parteRe || "INSS", advogado: dados.advogado },
    periodoBase: { dataInicio: dataRequerimento, dataFim: hoje(), diasTotais: diasEntre(dataRequerimento, hoje()), mesesTotais: mesesEntre(dataRequerimento, hoje()) },
    verbas, subtotal,
    correcaoMonetaria: { indice: "INPC (Tema 810 STF)", meses: competenciasAtraso, valor: totalCorr },
    juros: { tipo: "0,5% a.m. (Lei 9.494/97)", meses: competenciasAtraso, taxa: 0.5, valor: totalJuros },
    honorarios: { percentual: 10, base: subtotal, valor: honorarios, legal: "Art. 85 CPC" },
    totalGeral: subtotal + honorarios,
    jurisprudencia: ["Tema 810 STF", "EC 113/2021", "Súmula 85 STJ"],
    observacoes: `RMI: ${brl(rmi)}/mês. Tipo: ${tipoBeneficio}. Salário de contribuição: ${brl(salContrib)}.`,
  };
}

// ─── ENGINE 3: CIVIL / RESPONSABILIDADE ──────────────────────────────────────
// Juros: desde o evento (Súmula 54 STJ); Correção: IPCA ou SELIC
function calcularCivil(dados) {
  const tipoAcao = dados.tipoAcao || "Danos Morais";
  const { dataFato } = dados;
  const dataCalculo = dados.dataCalculo || hoje();
  const indice = dados.indiceCorrecao || "IPCA";
  const quantSM = Number(dados.quantidadeSM) || 10;
  const meses = mesesEntre(dataFato, dataCalculo);
  const taxa = indice === "SELIC" ? PARAMS.selicMensal : indice === "INPC" ? PARAMS.inpcMensal : PARAMS.ipcaMensal;
  const verbas = [];
  let base = Number(dados.valorPrincipal) || 0;

  if (tipoAcao === "Danos Morais" && base === 0) {
    base = PARAMS.salarioMinimo * quantSM;
    verbas.push({ nome: `Danos Morais (${quantSM}× salário mínimo)`, formula: `${brl(PARAMS.salarioMinimo)} × ${quantSM}`, legal: "Art. 186 c/c 927 CC/2002; Súmula 54 STJ", valor: base });
  } else {
    verbas.push({ nome: tipoAcao, formula: "Valor arbitrado/comprovado", legal: "Art. 186 c/c 927 CC/2002", valor: base });
  }

  if (tipoAcao === "Lucros Cessantes") {
    const lc = base * meses;
    verbas.push({ nome: `Lucros Cessantes (${meses} meses)`, formula: `${brl(base)}/mês × ${meses}`, legal: "Art. 402 CC/2002", valor: lc });
    base += lc;
  }

  const corrM = correcaoAcumulada(base, meses, taxa);
  const juros = jurosSimples(base, meses, PARAMS.jurosMoraCivel);
  verbas.push({ nome: `Correção Monetária ${indice} (${meses} meses)`, formula: `${brl(base)} × ${indice}`, legal: "Súmula 54 STJ; Art. 395 CC", valor: corrM });
  verbas.push({ nome: `Juros de Mora 1% a.m. (${meses} meses)`, formula: `${brl(base)} × 1% × ${meses}`, legal: "Art. 406 CC/2002; Súmula 54 STJ", valor: juros });

  const subtotal = verbas.reduce((s, v) => s + v.valor, 0);
  const honorarios = subtotal * PARAMS.honorariosMin;

  return {
    area: "Civil / Responsabilidade",
    identificacao: { parteAutora: dados.parteAutora, cpfAutora: dados.cpfAutora, parteRe: dados.parteRe, advogado: dados.advogado },
    periodoBase: { dataInicio: dataFato, dataFim: dataCalculo, diasTotais: diasEntre(dataFato, dataCalculo), mesesTotais: meses },
    verbas, subtotal,
    correcaoMonetaria: { indice, meses, valor: corrM },
    juros: { tipo: "1% a.m. simples (Art. 406 CC)", meses, taxa: 1, valor: juros },
    honorarios: { percentual: 10, base: subtotal, valor: honorarios, legal: "Art. 85 CPC" },
    totalGeral: subtotal + honorarios,
    jurisprudencia: ["Súmula 54 STJ", "Art. 406 CC/2002"],
    observacoes: `Responsabilidade civil desde ${fmtData(dataFato)} (${meses} meses). Índice: ${indice}. Juros desde o evento danoso — Súmula 54 STJ.`,
  };
}

// ─── ENGINE 4: CONSUMIDOR (CDC) ───────────────────────────────────────────────
function calcularConsumidor(dados) {
  const { dataContrato } = dados;
  const tipoViolacao = dados.tipoViolacao || "Cobrança Indevida";
  const dataCalculo = dados.dataCalculo || hoje();
  const meses = mesesEntre(dataContrato, dataCalculo);
  const base = Number(dados.valorPago) || Number(dados.valorContrato) || 0;
  const verbas = [];

  if (tipoViolacao === "Cobrança Indevida" || tipoViolacao === "Repetição de Indébito") {
    verbas.push({ nome: "Devolução em Dobro (Art. 42 CDC)", formula: `${brl(base)} × 2`, legal: "Art. 42, parágrafo único CDC", valor: base * 2 });
  } else {
    verbas.push({ nome: "Devolução do Valor Pago", formula: brl(base), legal: "Art. 18 §1º CDC", valor: base });
  }

  const corrM = correcaoAcumulada(base, meses, PARAMS.ipcaMensal);
  const juros = jurosSimples(base, meses, PARAMS.jurosMoraCivel);
  const multaVal = base * Math.min(Number(dados.multaContratual) || 2, 2) / 100;

  verbas.push({ nome: `Correção Monetária IPCA (${meses} meses)`, formula: `${brl(base)} × IPCA`, legal: "Art. 395 CC/2002", valor: corrM });
  verbas.push({ nome: `Juros de Mora 1% a.m. (${meses} meses)`, formula: `${brl(base)} × 1% × ${meses}`, legal: "Art. 406 CC; Art. 52 §1º CDC", valor: juros });
  verbas.push({ nome: "Multa Moratória (máx. 2% — CDC)", formula: `${brl(base)} × 2%`, legal: "Art. 52 §1º CDC", valor: multaVal });

  if (tipoViolacao === "Dano Moral" || tipoViolacao === "Publicidade Enganosa") {
    verbas.push({ nome: "Danos Morais", formula: `${brl(PARAMS.salarioMinimo)} × 10 (parâmetro STJ)`, legal: "Art. 6º VI CDC; Art. 186 CC", valor: PARAMS.salarioMinimo * 10 });
  }

  const subtotal = verbas.reduce((s, v) => s + v.valor, 0);
  const honorarios = subtotal * PARAMS.honorariosMin;

  return {
    area: "Consumidor (CDC)",
    identificacao: { parteAutora: dados.parteAutora, cpfAutora: dados.cpfAutora, parteRe: dados.parteRe, advogado: dados.advogado },
    periodoBase: { dataInicio: dataContrato, dataFim: dataCalculo, diasTotais: diasEntre(dataContrato, dataCalculo), mesesTotais: meses },
    verbas, subtotal,
    correcaoMonetaria: { indice: "IPCA", meses, valor: corrM },
    juros: { tipo: "1% a.m. simples", meses, taxa: 1, valor: juros },
    honorarios: { percentual: 10, base: subtotal, valor: honorarios, legal: "Art. 85 CPC" },
    totalGeral: subtotal + honorarios,
    jurisprudencia: ["Art. 42 CDC", "Art. 52 §1º CDC"],
    observacoes: `Violação: ${tipoViolacao}. Valor base: ${brl(base)}. Multa limitada a 2% (Art. 52 §1º CDC).`,
  };
}

// ─── ENGINE 5: FAMÍLIA / ALIMENTOS ───────────────────────────────────────────
function calcularFamilia(dados) {
  const tipoCalculo = dados.tipoCalculo || "Débito Alimentar";
  const salario = Number(dados.salarioAlimentante) || PARAMS.salarioMinimo;
  const pct = Number(dados.percentualAlimentos) || 30;
  const { dataInicio } = dados;
  const mesesAtraso = Number(dados.mesesAtraso) || 0;
  const dataCalculo = dados.dataCalculo || hoje();
  const pensao = salario * (pct / 100);
  const verbas = [];

  verbas.push({ nome: `Pensão Alimentícia Mensal (${pct}%)`, formula: `${brl(salario)} × ${pct}%`, legal: "Art. 1.694 CC/2002; Art. 529 CPC", valor: pensao });

  if (tipoCalculo === "Débito Alimentar" && mesesAtraso > 0) {
    const total = pensao * mesesAtraso;
    const corr = correcaoAcumulada(total, mesesAtraso, PARAMS.inpcMensal);
    const juros = jurosSimples(total, mesesAtraso, PARAMS.jurosMoraCivel);
    const multa = total * 0.10;
    verbas.push({ nome: `Alimentos em Atraso (${mesesAtraso} meses)`, formula: `${brl(pensao)} × ${mesesAtraso}`, legal: "Art. 528 CPC; Art. 19 Lei 5.478/68", valor: total });
    verbas.push({ nome: `Correção INPC s/ atrasados (${mesesAtraso} meses)`, formula: `${brl(total)} × INPC`, legal: "Tabela IBGE/INPC", valor: corr });
    verbas.push({ nome: "Juros 1% a.m. s/ atrasados", formula: `${brl(total)} × 1% × ${mesesAtraso}`, legal: "Art. 406 CC/2002", valor: juros });
    verbas.push({ nome: "Multa por Atraso 10% (Art. 523 §1º CPC)", formula: `${brl(total)} × 10%`, legal: "Art. 523 §1º CPC", valor: multa });
  }

  const subtotal = verbas.reduce((s, v) => s + v.valor, 0);
  const honorarios = subtotal * PARAMS.honorariosMin;

  return {
    area: "Família / Alimentos",
    identificacao: { parteAutora: dados.parteAutora, cpfAutora: dados.cpfAutora, parteRe: dados.parteRe, advogado: dados.advogado },
    periodoBase: { dataInicio, dataFim: dataCalculo, diasTotais: diasEntre(dataInicio, dataCalculo), mesesTotais: mesesEntre(dataInicio, dataCalculo) },
    verbas, subtotal,
    correcaoMonetaria: { indice: "INPC", meses: mesesAtraso, valor: 0 },
    juros: { tipo: "1% a.m. simples", meses: mesesAtraso, taxa: 1, valor: 0 },
    honorarios: { percentual: 10, base: subtotal, valor: honorarios, legal: "Art. 85 CPC" },
    totalGeral: subtotal + honorarios,
    jurisprudencia: ["Art. 523 §1º CPC", "Art. 1.694 CC"],
    observacoes: `Pensão: ${pct}% sobre ${brl(salario)} = ${brl(pensao)}/mês. Débito: ${mesesAtraso} meses.`,
  };
}

// ─── ENGINE 6: TRIBUTÁRIO / FISCAL ───────────────────────────────────────────
// Juros: SELIC (Art. 61 §3º Lei 9.430/96); Multa: 0,33%/dia limitada a 20%
function calcularTributario(dados) {
  const tipoTributo = dados.tipoTributo || "IPTU";
  const { dataVencimento } = dados;
  const dataPag = dados.dataPagamento || hoje();
  const dias = diasEntre(dataVencimento, dataPag);
  const meses = mesesEntre(dataVencimento, dataPag);
  const base = Number(dados.valorPrincipal) || 0;
  const verbas = [];

  verbas.push({ nome: `${tipoTributo} — Principal`, formula: brl(base), legal: "Código Tributário Nacional", valor: base });

  // Multa: 0,33%/dia, máx. 20%
  const pctMulta = Math.min(0.20, dias * 0.0033);
  verbas.push({ nome: `Multa de Mora (${(pctMulta*100).toFixed(2)}% — máx. 20%)`, formula: `${brl(base)} × ${(pctMulta*100).toFixed(2)}%`, legal: "Art. 61 Lei 9.430/96", valor: base * pctMulta });

  // Juros: SELIC acumulada
  const jurosSelic = jurosSimples(base, meses, PARAMS.selicMensal);
  verbas.push({ nome: `Juros SELIC (${meses} meses)`, formula: `${brl(base)} × SELIC ${(PARAMS.selicMensal*100).toFixed(2)}% × ${meses}`, legal: "Art. 61 §3º Lei 9.430/96", valor: jurosSelic });

  const subtotal = verbas.reduce((s, v) => s + v.valor, 0);

  return {
    area: "Tributário / Fiscal",
    identificacao: { parteAutora: dados.parteAutora, cpfAutora: dados.cpfAutora, parteRe: dados.parteRe || "Fazenda Pública", advogado: dados.advogado },
    periodoBase: { dataInicio: dataVencimento, dataFim: dataPag, diasTotais: dias, mesesTotais: meses },
    verbas, subtotal,
    correcaoMonetaria: { indice: "SELIC", meses, valor: jurosSelic },
    juros: { tipo: "SELIC integral", meses, taxa: PARAMS.selicMensal * 100, valor: jurosSelic },
    honorarios: { percentual: 0, base: 0, valor: 0, legal: "N/A" },
    totalGeral: subtotal,
    jurisprudencia: ["Art. 61 §3º Lei 9.430/96", "EC 113/2021"],
    observacoes: `${dias} dias em atraso. Multa: ${(pctMulta*100).toFixed(2)}%. Juros SELIC: ${(PARAMS.selicMensal*100).toFixed(2)}% a.m.`,
  };
}

// ─── ENGINE 7: PENAL / EXECUÇÃO PENAL ────────────────────────────────────────
function calcularPenal(dados) {
  const { dataPrisao } = dados;
  const penaMeses = Number(dados.penaMeses) || 0;
  const diasTrab = Number(dados.diasTrabalhados) || 0;
  const diasEst = Number(dados.diasEstudados) || 0;
  const dataCalculo = dados.dataCalculo || hoje();
  const reincidente = dados.reincidente === "Sim";
  const verbas = [];
  const mesesCumpridos = mesesEntre(dataPrisao, dataCalculo);

  const remTrab = Math.floor(diasTrab / 3);
  const remEst = Math.floor(diasEst / 12);
  if (remTrab > 0) verbas.push({ nome: `Remição por Trabalho (${diasTrab} dias ÷ 3)`, formula: `${diasTrab} ÷ 3 = ${remTrab} dias`, legal: "Art. 126 §1º I LEP", valor: remTrab });
  if (remEst > 0) verbas.push({ nome: `Remição por Estudo (${diasEst}h ÷ 12)`, formula: `${diasEst}h ÷ 12h = ${remEst} dias`, legal: "Art. 126 §1º II LEP", valor: remEst });

  const totalRem = remTrab + remEst;
  const penaEfetiva = Math.max(0, penaMeses - Math.round(totalRem / 30));
  const frac = reincidente ? 2 / 3 : 1 / 3;
  const mesesLiv = Math.ceil(penaMeses * frac);

  verbas.push({ nome: "Pena Total", formula: `${penaMeses} meses`, legal: "Sentença/Acórdão", valor: penaMeses });
  verbas.push({ nome: "Total de Remição", formula: `${remTrab}d (trab.) + ${remEst}d (est.) = ${totalRem} dias`, legal: "Art. 126 LEP", valor: -totalRem });
  verbas.push({ nome: "Pena Efetiva a Cumprir", formula: `${penaMeses} meses − ${totalRem} dias de remição`, legal: "Art. 127 LEP", valor: penaEfetiva });
  verbas.push({ nome: `Livramento Condicional — ${(frac*100).toFixed(0)}%`, formula: `${penaMeses} × ${(frac*100).toFixed(0)}% = ${mesesLiv} meses`, legal: reincidente ? "Art. 83 II CP" : "Art. 83 I CP", valor: mesesLiv });

  return {
    area: "Penal / Execução Penal",
    identificacao: { parteAutora: dados.parteAutora, cpfAutora: dados.cpfAutora, parteRe: dados.parteRe || "Ministério Público", advogado: dados.advogado },
    periodoBase: { dataInicio: dataPrisao, dataFim: dataCalculo, diasTotais: diasEntre(dataPrisao, dataCalculo), mesesTotais: mesesCumpridos },
    verbas, subtotal: penaEfetiva,
    correcaoMonetaria: { indice: "N/A", meses: 0, valor: 0 },
    juros: { tipo: "N/A", meses: 0, taxa: 0, valor: 0 },
    honorarios: { percentual: 0, base: 0, valor: 0, legal: "N/A" },
    totalGeral: penaEfetiva,
    jurisprudencia: ["Art. 126 LEP", "Art. 83 CP"],
    observacoes: `Pena: ${penaMeses} meses. Remição: ${totalRem} dias. Pena efetiva: ${penaEfetiva} meses. Livramento: após ${mesesLiv} meses.`,
    unidade: "meses/dias",
  };
}

// ─── ENGINE 8: IMOBILIÁRIO / LOCAÇÃO ─────────────────────────────────────────
function calcularImobiliario(dados) {
  const tipoCalculo = dados.tipoCalculo || "Atraso de Aluguel";
  const { dataInicio } = dados;
  const mesesAtraso = Number(dados.mesesAtraso) || 0;
  const indiceReajuste = dados.indiceReajuste || "IGPM";
  const multaRescMeses = Number(dados.multaRescisaoMeses) || 3;
  const dataCalculo = dados.dataCalculo || hoje();
  const aluguel = Number(dados.valorAluguel) || 0;
  const verbas = [];
  const mesesContrato = mesesEntre(dataInicio, dataCalculo);

  if (tipoCalculo === "Atraso de Aluguel" || tipoCalculo === "Ação de Despejo") {
    const total = aluguel * mesesAtraso;
    const taxa = indiceReajuste === "IGPM" ? PARAMS.igpmMensal : PARAMS.ipcaMensal;
    verbas.push({ nome: `Aluguéis em Atraso (${mesesAtraso} × ${brl(aluguel)})`, formula: `${brl(aluguel)} × ${mesesAtraso}`, legal: "Art. 22 c/c 23 Lei 8.245/91", valor: total });
    verbas.push({ nome: "Multa por Inadimplência 10%", formula: `${brl(total)} × 10%`, legal: "Cláusula contratual; Art. 412 CC", valor: total * PARAMS.multaInadimplenciaLocacao });
    verbas.push({ nome: `Correção ${indiceReajuste} (${mesesAtraso} meses)`, formula: `${brl(total)} × ${indiceReajuste}`, legal: "Lei 8.245/91", valor: correcaoAcumulada(total, mesesAtraso, taxa) });
    verbas.push({ nome: `Juros de Mora 1% a.m. (${mesesAtraso} meses)`, formula: `${brl(total)} × 1% × ${mesesAtraso}`, legal: "Art. 406 CC/2002", valor: jurosSimples(total, mesesAtraso, PARAMS.jurosMoraLoc) });
  }

  if (tipoCalculo === "Rescisão Antecipada") {
    const mesesRestantes = Math.max(0, 30 - mesesContrato);
    const multa = (aluguel * multaRescMeses) * (mesesRestantes / 30 || 1);
    verbas.push({ nome: "Multa Rescisória Proporcional", formula: `${brl(aluguel)} × ${multaRescMeses} × (${mesesRestantes}/30 meses)`, legal: "Art. 4º Lei 8.245/91; Súmula 440 STJ", valor: multa });
  }

  const subtotal = verbas.reduce((s, v) => s + v.valor, 0);
  const honorarios = subtotal * PARAMS.honorariosMin;

  return {
    area: "Imobiliário / Locação",
    identificacao: { parteAutora: dados.parteAutora, cpfAutora: dados.cpfAutora, parteRe: dados.parteRe, advogado: dados.advogado },
    periodoBase: { dataInicio, dataFim: dataCalculo, diasTotais: diasEntre(dataInicio, dataCalculo), mesesTotais: mesesContrato },
    verbas, subtotal,
    correcaoMonetaria: { indice: indiceReajuste, meses: mesesAtraso, valor: 0 },
    juros: { tipo: "1% a.m.", meses: mesesAtraso, taxa: 1, valor: 0 },
    honorarios: { percentual: 10, base: subtotal, valor: honorarios, legal: "Art. 85 CPC" },
    totalGeral: subtotal + honorarios,
    jurisprudencia: ["Súmula 440 STJ", "Lei 8.245/91"],
    observacoes: `Contrato desde ${fmtData(dataInicio)} (${mesesContrato} meses). Aluguel: ${brl(aluguel)}/mês. Reajuste: ${indiceReajuste}.`,
  };
}

// ─── DISPATCHER PRINCIPAL ─────────────────────────────────────────────────────
export function calcular(areaId, dados) {
  switch (areaId) {
    case "trabalhista":    return calcularTrabalhista(dados);
    case "previdenciario": return calcularPrevidenciario(dados);
    case "civil":          return calcularCivil(dados);
    case "consumidor":     return calcularConsumidor(dados);
    case "familia":        return calcularFamilia(dados);
    case "tributario":     return calcularTributario(dados);
    case "penal":          return calcularPenal(dados);
    case "imobiliario":    return calcularImobiliario(dados);
    default: throw new Error("Área não reconhecida: " + areaId);
  }
}

// ─── VALIDADOR JURÍDICO (com mensagens precisas) ──────────────────────────────
export function validar(areaId, dados) {
  const erros = [];
  if (!dados.parteAutora?.trim()) erros.push("Informe o nome da Parte Autora.");

  if (areaId === "trabalhista") {
    if (!dados.dataAdmissao) erros.push("Data de admissão obrigatória.");
    if (!dados.dataDemissao) erros.push("Data de demissão obrigatória.");
    if (dados.dataAdmissao && dados.dataDemissao) {
      if (new Date(dados.dataDemissao) <= new Date(dados.dataAdmissao))
        erros.push("Data de demissão deve ser posterior à admissão.");
      const dias = diasEntre(dados.dataAdmissao, dados.dataDemissao);
      if (dias < 30) erros.push(`Atenção: período de ${dias} dias (< 30 dias) — competência mensal integral não aplicável.`);
    }
  }
  if (areaId === "civil") {
    if (!dados.dataFato) erros.push("Data do fato obrigatória para juros desde o evento (Súmula 54 STJ).");
  }
  if (areaId === "consumidor") {
    if (!dados.dataContrato) erros.push("Data do contrato obrigatória.");
    if (!dados.valorPago && !dados.valorContrato) erros.push("Informe o valor pago ou o valor do contrato.");
  }
  if (areaId === "familia") {
    if (!dados.dataInicio) erros.push("Data de início dos alimentos obrigatória.");
    if (!dados.salarioAlimentante || Number(dados.salarioAlimentante) <= 0) erros.push("Informe o salário do alimentante.");
  }
  if (areaId === "tributario") {
    if (!dados.dataVencimento) erros.push("Data de vencimento obrigatória.");
    if (!dados.valorPrincipal || Number(dados.valorPrincipal) <= 0) erros.push("Informe o valor principal do tributo.");
  }
  if (areaId === "penal") {
    if (!dados.dataPrisao) erros.push("Data de início da pena/prisão obrigatória.");
    if (!dados.penaMeses || Number(dados.penaMeses) <= 0) erros.push("Informe a duração da pena em meses.");
  }
  if (areaId === "imobiliario") {
    if (!dados.dataInicio) erros.push("Data de início do contrato obrigatória.");
    if (!dados.valorAluguel || Number(dados.valorAluguel) <= 0) erros.push("Informe o valor do aluguel mensal.");
  }
  if (areaId === "previdenciario") {
    if (!dados.dataRequerimento) erros.push("Data do requerimento/DIB obrigatória.");
    if (!dados.salarioContribuicao || Number(dados.salarioContribuicao) <= 0) erros.push("Informe o salário de contribuição.");
  }

  return erros;
}