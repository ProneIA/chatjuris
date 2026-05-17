// ============================================================
// CALCULADORA JURÍDICA BRASILEIRA — Motor Local 100%
// Atualizar PARAMS conforme mudanças na legislação
// ============================================================

export const PARAMS = {
  salarioMinimo: 1412.00,
  tetoPrev: 7786.02,
  fgts: 0.08,
  multaFgts: 0.40,
  multaFgtsAcordo: 0.20,
  adicionalHE50: 0.50,
  adicionalHE100: 1.00,
  adicionalNoturno: 0.20,
  insalMax: 0.40,
  insalMed: 0.20,
  insalMin: 0.10,
  periculosidade: 0.30,
  jurosMoraCivel: 0.01,
  selicMensal: 0.0107,
  inpcMensal: 0.0045,
  ipcaMensal: 0.0048,
  igpmMensal: 0.0052,
  honorariosMin: 0.10,
  honorariosMax: 0.20,
  horasMensais: 220,
  multaConsCDC: 0.02,
  jurosMoraLoc: 0.01,
};

// ============================================================
// UTILITÁRIOS
// ============================================================

export function diasEntre(dataInicio, dataFim) {
  const d1 = new Date(dataInicio);
  const d2 = new Date(dataFim);
  return Math.max(0, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
}

export function mesesEntre(dataInicio, dataFim) {
  const d1 = new Date(dataInicio);
  const d2 = new Date(dataFim);
  return Math.max(0, (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth()));
}

export function mesesProporcionais(dataInicio, dataFim) {
  const d2 = new Date(dataFim);
  const meses = mesesEntre(dataInicio, dataFim);
  const diasRestantes = d2.getDate();
  return diasRestantes >= 15 ? meses + 1 : meses;
}

export function brl(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency", currency: "BRL",
    minimumFractionDigits: 2, maximumFractionDigits: 2
  });
}

export function fmtData(str) {
  if (!str) return "—";
  const [y, m, d] = str.split("-");
  return `${d}/${m}/${y}`;
}

export function correcaoAcumulada(valorBase, meses, taxaMensal) {
  if (meses <= 0) return 0;
  return valorBase * (Math.pow(1 + taxaMensal, meses) - 1);
}

export function jurosSimples(valorBase, meses, taxaMensal) {
  if (meses <= 0) return 0;
  return valorBase * taxaMensal * meses;
}

export function calcAvisoPrevio(dataAdmissao, dataDemissao) {
  const anos = Math.floor(mesesEntre(dataAdmissao, dataDemissao) / 12);
  return Math.min(90, 30 + anos * 3);
}

export function gerarProtocolo() {
  return String(Date.now()).slice(-8);
}

// ============================================================
// 1. TRABALHISTA
// ============================================================
function calcularTrabalhista(dados) {
  const salarioBase = Number(dados.salarioBase) || PARAMS.salarioMinimo;
  const dataAdmissao = dados.dataAdmissao;
  const dataDemissao = dados.dataDemissao;
  const tipoDemissao = dados.tipoDemissao || "Sem Justa Causa";
  const horasExtrasMsg = Number(dados.horasExtras) || 0;
  const adicionalNoturno = dados.adicionalNoturno === "Sim" || dados.adicionalNoturno === true;
  const insalubridade = dados.insalubridade || "Nenhum";
  const periculos = dados.periculosidade === "Sim" || dados.periculosidade === true;
  const fgtsDepositado = Number(dados.fgtsDepositado) || 0;
  const avisoPrevio = dados.avisoPrevio || "Indenizado";
  const ferias = dados.ferias || "Vencidas + Proporcionais";
  const decimoTerceiro = dados.decimoTerceiro !== "Não";

  if (!dataAdmissao || !dataDemissao) throw new Error("Informe as datas de admissão e demissão.");
  if (new Date(dataDemissao) <= new Date(dataAdmissao)) throw new Error("Data de demissão deve ser após a admissão.");

  const totalDias = diasEntre(dataAdmissao, dataDemissao);
  const totalMeses = mesesEntre(dataAdmissao, dataDemissao);
  const mesesProp = mesesProporcionais(dataAdmissao, dataDemissao);
  const anos = Math.floor(totalMeses / 12);
  const diasAvisoPrevio = calcAvisoPrevio(dataAdmissao, dataDemissao);
  const diasTrabalhadosMes = new Date(dataDemissao).getDate();
  const valorHora = salarioBase / PARAMS.horasMensais;

  const verbas = [];

  // Saldo de salário
  const saldoSalario = (salarioBase / 30) * diasTrabalhadosMes;
  verbas.push({ nome: "Saldo de Salário", formula: `${brl(salarioBase)} ÷ 30 × ${diasTrabalhadosMes} dias`, legal: "Art. 459 CLT", valor: saldoSalario });

  // Aviso prévio indenizado
  if ((tipoDemissao === "Sem Justa Causa" || tipoDemissao === "Rescisão Indireta") && avisoPrevio === "Indenizado") {
    const valorAP = (salarioBase / 30) * diasAvisoPrevio;
    verbas.push({ nome: `Aviso Prévio Indenizado (${diasAvisoPrevio} dias)`, formula: `${brl(salarioBase)} ÷ 30 × ${diasAvisoPrevio} dias`, legal: "Art. 487 CLT c/c Lei 12.506/2011", valor: valorAP });
  }

  // 13º proporcional
  if (decimoTerceiro) {
    const meses13 = Math.min(mesesProp, 12) || 1;
    const decimo = (salarioBase / 12) * meses13;
    verbas.push({ nome: `13º Salário Proporcional (${meses13}/12)`, formula: `${brl(salarioBase)} ÷ 12 × ${meses13}`, legal: "Art. 7º ADCT; Lei 4.090/62", valor: decimo });
  }

  // Férias
  const mesesFeriasProp = mesesProp % 12 || (mesesProp >= 12 ? 12 : 0);
  if (ferias.includes("Proporcionais") && mesesFeriasProp > 0) {
    const feriasProp = (salarioBase / 12) * mesesFeriasProp;
    verbas.push({ nome: `Férias Proporcionais (${mesesFeriasProp}/12)`, formula: `${brl(salarioBase)} ÷ 12 × ${mesesFeriasProp}`, legal: "Art. 146 CLT; Súmula 171 TST", valor: feriasProp });
    verbas.push({ nome: "1/3 Constitucional s/ Férias Proporcionais", formula: `${brl(feriasProp)} × 1/3`, legal: "Art. 7º, XVII CF/88", valor: feriasProp / 3 });
  }
  if (ferias.includes("Vencidas") && totalMeses >= 12) {
    verbas.push({ nome: "Férias Vencidas (1 período)", formula: `${brl(salarioBase)} × 1`, legal: "Art. 137 CLT", valor: salarioBase });
    verbas.push({ nome: "1/3 Constitucional s/ Férias Vencidas", formula: `${brl(salarioBase)} × 1/3`, legal: "Art. 7º, XVII CF/88", valor: salarioBase / 3 });
  }

  // FGTS sobre verbas rescisórias
  const baseVerbas = verbas.reduce((s, v) => s + v.valor, 0);
  const fgtsVerbas = baseVerbas * PARAMS.fgts;
  verbas.push({ nome: "FGTS s/ Verbas Rescisórias (8%)", formula: `${brl(baseVerbas)} × 8%`, legal: "Art. 15 Lei 8.036/90", valor: fgtsVerbas });

  // Multa FGTS
  const saldoFgts = fgtsDepositado + fgtsVerbas;
  if (tipoDemissao === "Sem Justa Causa" || tipoDemissao === "Rescisão Indireta") {
    verbas.push({ nome: "Multa FGTS 40%", formula: `${brl(saldoFgts)} × 40%`, legal: "Art. 18 §1º Lei 8.036/90", valor: saldoFgts * PARAMS.multaFgts });
  }
  if (tipoDemissao === "Acordo (484-A CLT)") {
    verbas.push({ nome: "Multa FGTS 20% (Acordo §6º)", formula: `${brl(saldoFgts)} × 20%`, legal: "Art. 484-A CLT", valor: saldoFgts * PARAMS.multaFgtsAcordo });
  }

  // Horas extras
  if (horasExtrasMsg > 0) {
    const heVal = valorHora * (1 + PARAMS.adicionalHE50) * horasExtrasMsg * totalMeses;
    verbas.push({ nome: `Horas Extras 50% (${horasExtrasMsg}h/mês × ${totalMeses} meses)`, formula: `${brl(valorHora)} × 1,50 × ${horasExtrasMsg}h × ${totalMeses} meses`, legal: "Art. 59 CLT; Súmula 264 TST", valor: heVal });
    verbas.push({ nome: "Reflexos HE em 13º/Férias/FGTS (1/3)", formula: `${brl(heVal)} × 33,33%`, legal: "Súmula 172 TST", valor: heVal * 0.3333 });
  }

  // Adicional noturno
  if (adicionalNoturno) {
    const addNot = salarioBase * PARAMS.adicionalNoturno * totalMeses;
    verbas.push({ nome: `Adicional Noturno 20% (${totalMeses} meses)`, formula: `${brl(salarioBase)} × 20% × ${totalMeses} meses`, legal: "Art. 73 CLT; Súmula 60 TST", valor: addNot });
  }

  // Insalubridade
  if (insalubridade && insalubridade !== "Nenhum") {
    const pct = insalubridade === "Máxima" ? PARAMS.insalMax : insalubridade === "Média" ? PARAMS.insalMed : PARAMS.insalMin;
    verbas.push({ nome: `Adicional de Insalubridade Grau ${insalubridade} (${(pct*100).toFixed(0)}%)`, formula: `${brl(PARAMS.salarioMinimo)} × ${(pct*100).toFixed(0)}% × ${totalMeses} meses`, legal: "Art. 192 CLT; Súmula 228 TST", valor: PARAMS.salarioMinimo * pct * totalMeses });
  }

  // Periculosidade
  if (periculos) {
    verbas.push({ nome: `Adicional de Periculosidade 30% (${totalMeses} meses)`, formula: `${brl(salarioBase)} × 30% × ${totalMeses} meses`, legal: "Art. 193 CLT", valor: salarioBase * PARAMS.periculosidade * totalMeses });
  }

  const subtotal = verbas.reduce((s, v) => s + v.valor, 0);
  const hoje = new Date().toISOString().split("T")[0];
  const mesesCorrecao = mesesEntre(dataDemissao, hoje);
  const corrMonetaria = correcaoAcumulada(subtotal, mesesCorrecao, PARAMS.ipcaMensal);
  const juros = jurosSimples(subtotal, mesesCorrecao, PARAMS.selicMensal);
  const honorarios = subtotal * PARAMS.honorariosMin;
  const totalGeral = subtotal + corrMonetaria + juros + honorarios;

  return {
    area: "Trabalhista",
    identificacao: { parteAutora: dados.parteAutora, cpfAutora: dados.cpfAutora, parteRe: dados.parteRe, cpfRe: dados.cpfRe, advogado: dados.advogado },
    periodoBase: { dataInicio: dataAdmissao, dataFim: dataDemissao, diasTotais: totalDias, mesesTotais: totalMeses },
    verbas,
    subtotal,
    correcaoMonetaria: { indice: "IPCA", meses: mesesCorrecao, valor: corrMonetaria },
    juros: { tipo: "SELIC", meses: mesesCorrecao, taxa: PARAMS.selicMensal * 100, valor: juros },
    honorarios: { percentual: 10, base: subtotal, valor: honorarios, legal: "Art. 85 CPC" },
    totalGeral,
    observacoes: `Salário base: ${brl(salarioBase)}. Tempo de serviço: ${anos} anos e ${totalMeses % 12} meses. Aviso prévio: ${diasAvisoPrevio} dias.`
  };
}

// ============================================================
// 2. PREVIDENCIÁRIO
// ============================================================
function calcularPrevidenciario(dados) {
  const tipoBeneficio = dados.tipoBeneficio || "Aposentadoria por Idade";
  const salarioContribuicao = Math.min(Math.max(Number(dados.salarioContribuicao) || PARAMS.salarioMinimo, PARAMS.salarioMinimo), PARAMS.tetoPrev);
  const tempoContribuicaoMeses = Number(dados.tempoContribuicaoMeses) || 0;
  const dataRequerimento = dados.dataRequerimento;
  const competenciasAtraso = Number(dados.competenciasAtraso) || 0;
  const beneficioAtual = Number(dados.beneficioAtual) || 0;
  const dataConcessao = dados.dataConcessao;

  if (!dataRequerimento) throw new Error("Informe a data do requerimento.");

  const verbas = [];
  let rmi = salarioContribuicao;

  if (tipoBeneficio.includes("Aposentadoria por Idade")) {
    const anosContrib = Math.floor(tempoContribuicaoMeses / 12);
    const coefAdicional = Math.max(0, anosContrib - 15) * 0.02;
    const coefFinal = Math.min(1.0, 0.60 + coefAdicional);
    rmi = salarioContribuicao * coefFinal;
    verbas.push({ nome: "Renda Mensal Inicial (RMI)", formula: `${brl(salarioContribuicao)} × ${(coefFinal * 100).toFixed(0)}%`, legal: "Art. 26 EC 103/2019", valor: rmi });
  } else if (tipoBeneficio.includes("Incapacidade") || tipoBeneficio.includes("Auxílio-Doença")) {
    rmi = salarioContribuicao * 0.91;
    verbas.push({ nome: "Renda Mensal Inicial (RMI) — 91%", formula: `${brl(salarioContribuicao)} × 91%`, legal: "Art. 61 Lei 8.213/91", valor: rmi });
  } else if (tipoBeneficio.includes("BPC")) {
    rmi = PARAMS.salarioMinimo;
    verbas.push({ nome: "BPC/LOAS — 1 Salário Mínimo", formula: brl(PARAMS.salarioMinimo), legal: "Art. 203 CF/88; Art. 20 Lei 8.742/93", valor: rmi });
  } else if (tipoBeneficio.includes("Pensão por Morte")) {
    const coefPensao = Math.min(1.0, 0.50 + Math.floor(tempoContribuicaoMeses / 12) * 0.01);
    rmi = salarioContribuicao * coefPensao;
    verbas.push({ nome: "Pensão por Morte", formula: `${brl(salarioContribuicao)} × ${(coefPensao * 100).toFixed(0)}%`, legal: "Art. 77 Lei 8.213/91; EC 103/2019", valor: rmi });
  } else {
    verbas.push({ nome: "Renda Mensal Inicial (RMI)", formula: brl(rmi), legal: "Lei 8.213/91", valor: rmi });
  }

  if (competenciasAtraso > 0) {
    const atrasados = rmi * competenciasAtraso;
    const corrAtrasados = correcaoAcumulada(atrasados, competenciasAtraso, PARAMS.inpcMensal);
    const jurosAtrasados = jurosSimples(atrasados, competenciasAtraso, 0.005);
    verbas.push({ nome: `Competências em Atraso (${competenciasAtraso} meses × ${brl(rmi)})`, formula: `${brl(rmi)} × ${competenciasAtraso} meses`, legal: "Art. 43 §2º Lei 8.213/91", valor: atrasados });
    verbas.push({ nome: "Correção INPC s/ atrasados", formula: `${brl(atrasados)} × INPC acumulado (${competenciasAtraso} meses)`, legal: "Lei 10.150/2000", valor: corrAtrasados });
    verbas.push({ nome: "Juros 0,5% a.m. s/ atrasados", formula: `${brl(atrasados)} × 0,5% × ${competenciasAtraso} meses`, legal: "Art. 1º-F Lei 9.494/97", valor: jurosAtrasados });
  }

  if (tipoBeneficio.includes("Revisão") && beneficioAtual && dataConcessao) {
    const difMensal = Math.max(0, rmi - beneficioAtual);
    const mesesRevisao = mesesEntre(dataConcessao, new Date().toISOString().split("T")[0]);
    const totalDif = difMensal * mesesRevisao;
    const corrRevisao = correcaoAcumulada(totalDif, Math.round(mesesRevisao / 2), PARAMS.inpcMensal);
    verbas.push({ nome: `Diferenças de Benefício (${mesesRevisao} meses)`, formula: `(${brl(rmi)} - ${brl(beneficioAtual)}) × ${mesesRevisao} meses`, legal: "Art. 103-A Lei 8.213/91; Súmula 85 STJ", valor: totalDif });
    verbas.push({ nome: "Correção INPC s/ diferenças", formula: `${brl(totalDif)} × INPC acumulado`, legal: "Lei 10.150/2000", valor: corrRevisao });
  }

  const subtotal = verbas.reduce((s, v) => s + v.valor, 0);
  const honorarios = subtotal * PARAMS.honorariosMin;

  return {
    area: "Previdenciário",
    identificacao: { parteAutora: dados.parteAutora, cpfAutora: dados.cpfAutora, parteRe: dados.parteRe || "INSS", advogado: dados.advogado },
    periodoBase: { dataInicio: dataRequerimento, dataFim: new Date().toISOString().split("T")[0], diasTotais: diasEntre(dataRequerimento, new Date().toISOString().split("T")[0]), mesesTotais: mesesEntre(dataRequerimento, new Date().toISOString().split("T")[0]) },
    verbas,
    subtotal,
    correcaoMonetaria: { indice: "INPC", meses: competenciasAtraso, valor: 0 },
    juros: { tipo: "0,5% a.m.", meses: competenciasAtraso, taxa: 0.5, valor: 0 },
    honorarios: { percentual: 10, base: subtotal, valor: honorarios, legal: "Art. 85 CPC" },
    totalGeral: subtotal + honorarios,
    observacoes: `RMI calculada: ${brl(rmi)}/mês. Tipo: ${tipoBeneficio}. Salário de contribuição: ${brl(salarioContribuicao)}.`
  };
}

// ============================================================
// 3. CIVIL / RESPONSABILIDADE
// ============================================================
function calcularCivil(dados) {
  const tipoAcao = dados.tipoAcao || "Danos Morais";
  const dataFato = dados.dataFato;
  const dataCalculo = dados.dataCalculo || new Date().toISOString().split("T")[0];
  const indiceCorrecao = dados.indiceCorrecao || "IPCA";
  const quantidadeSM = Number(dados.quantidadeSM) || 10;

  if (!dataFato) throw new Error("Informe a data do fato.");

  const meses = mesesEntre(dataFato, dataCalculo);
  const taxa = indiceCorrecao === "SELIC" ? PARAMS.selicMensal : indiceCorrecao === "INPC" ? PARAMS.inpcMensal : PARAMS.ipcaMensal;
  const verbas = [];
  let base = Number(dados.valorPrincipal) || 0;

  if (tipoAcao === "Danos Morais" && base === 0) {
    base = PARAMS.salarioMinimo * quantidadeSM;
    verbas.push({ nome: `Danos Morais (${quantidadeSM}× salário mínimo)`, formula: `${brl(PARAMS.salarioMinimo)} × ${quantidadeSM}`, legal: "Art. 186 c/c 927 CC/2002; Súmula 54 STJ", valor: base });
  } else {
    verbas.push({ nome: tipoAcao, formula: "Valor arbitrado/comprovado", legal: "Art. 186 c/c 927 CC/2002", valor: base });
  }

  if (tipoAcao === "Lucros Cessantes" && base > 0) {
    const lc = base * meses;
    verbas.push({ nome: `Lucros Cessantes (${meses} meses)`, formula: `${brl(base)}/mês × ${meses} meses`, legal: "Art. 402 CC/2002", valor: lc });
    base += lc;
  }

  const corrMonetaria = correcaoAcumulada(base, meses, taxa);
  const juros = jurosSimples(base, meses, PARAMS.jurosMoraCivel);

  verbas.push({ nome: `Correção Monetária ${indiceCorrecao} (${meses} meses)`, formula: `${brl(base)} × ${indiceCorrecao} acumulado`, legal: "Súmula 54 STJ; Art. 395 CC", valor: corrMonetaria });
  verbas.push({ nome: `Juros de Mora 1% a.m. (${meses} meses)`, formula: `${brl(base)} × 1% × ${meses} meses`, legal: "Art. 406 CC/2002; Súmula 54 STJ", valor: juros });

  const subtotal = verbas.reduce((s, v) => s + v.valor, 0);
  const honorarios = subtotal * PARAMS.honorariosMin;

  return {
    area: "Civil / Responsabilidade",
    identificacao: { parteAutora: dados.parteAutora, cpfAutora: dados.cpfAutora, parteRe: dados.parteRe, advogado: dados.advogado },
    periodoBase: { dataInicio: dataFato, dataFim: dataCalculo, diasTotais: diasEntre(dataFato, dataCalculo), mesesTotais: meses },
    verbas,
    subtotal,
    correcaoMonetaria: { indice: indiceCorrecao, meses, valor: corrMonetaria },
    juros: { tipo: "1% a.m. simples", meses, taxa: 1, valor: juros },
    honorarios: { percentual: 10, base: subtotal, valor: honorarios, legal: "Art. 85 CPC" },
    totalGeral: subtotal + honorarios,
    observacoes: `Cálculo desde ${fmtData(dataFato)} (${meses} meses). Índice: ${indiceCorrecao}. Juros a partir do evento.`
  };
}

// ============================================================
// 4. CONSUMIDOR (CDC)
// ============================================================
function calcularConsumidor(dados) {
  const dataContrato = dados.dataContrato;
  const tipoViolacao = dados.tipoViolacao || "Cobrança Indevida";
  const dataCalculo = dados.dataCalculo || new Date().toISOString().split("T")[0];

  if (!dataContrato) throw new Error("Informe a data do contrato.");

  const meses = mesesEntre(dataContrato, dataCalculo);
  const base = Number(dados.valorPago) || Number(dados.valorContrato) || 0;
  const verbas = [];

  if (tipoViolacao === "Cobrança Indevida" || tipoViolacao === "Repetição de Indébito") {
    verbas.push({ nome: "Devolução em Dobro (Repetição Indébito)", formula: `${brl(base)} × 2`, legal: "Art. 42, parágrafo único CDC", valor: base * 2 });
  } else {
    verbas.push({ nome: "Devolução do Valor Pago", formula: brl(base), legal: "Art. 18 §1º CDC", valor: base });
  }

  const corrMonetaria = correcaoAcumulada(base, meses, PARAMS.ipcaMensal);
  verbas.push({ nome: `Correção Monetária IPCA (${meses} meses)`, formula: `${brl(base)} × IPCA acumulado`, legal: "Art. 395 CC/2002", valor: corrMonetaria });

  const juros = jurosSimples(base, meses, PARAMS.jurosMoraCivel);
  verbas.push({ nome: `Juros de Mora 1% a.m. (${meses} meses)`, formula: `${brl(base)} × 1% × ${meses} meses`, legal: "Art. 406 CC/2002; Art. 52 §1º CDC", valor: juros });

  const multaContratual = Math.min(Number(dados.multaContratual) || 2, 2);
  const multaVal = base * (multaContratual / 100);
  verbas.push({ nome: `Multa Moratória ${multaContratual}% (máx. CDC)`, formula: `${brl(base)} × ${multaContratual}%`, legal: "Art. 52 §1º CDC", valor: multaVal });

  if (tipoViolacao === "Dano Moral" || tipoViolacao === "Publicidade Enganosa") {
    verbas.push({ nome: "Danos Morais", formula: `${brl(PARAMS.salarioMinimo)} × 10 (parâmetro médio STJ)`, legal: "Art. 6º, VI CDC; Art. 186 CC", valor: PARAMS.salarioMinimo * 10 });
  }

  const subtotal = verbas.reduce((s, v) => s + v.valor, 0);
  const honorarios = subtotal * PARAMS.honorariosMin;

  return {
    area: "Consumidor (CDC)",
    identificacao: { parteAutora: dados.parteAutora, cpfAutora: dados.cpfAutora, parteRe: dados.parteRe, advogado: dados.advogado },
    periodoBase: { dataInicio: dataContrato, dataFim: dataCalculo, diasTotais: diasEntre(dataContrato, dataCalculo), mesesTotais: meses },
    verbas,
    subtotal,
    correcaoMonetaria: { indice: "IPCA", meses, valor: corrMonetaria },
    juros: { tipo: "1% a.m. simples", meses, taxa: 1, valor: juros },
    honorarios: { percentual: 10, base: subtotal, valor: honorarios, legal: "Art. 85 CPC" },
    totalGeral: subtotal + honorarios,
    observacoes: `Violação: ${tipoViolacao}. Valor base: ${brl(base)}. Multa limitada a 2% conforme art. 52 §1º CDC.`
  };
}

// ============================================================
// 5. FAMÍLIA / ALIMENTOS
// ============================================================
function calcularFamilia(dados) {
  const tipoCalculo = dados.tipoCalculo || "Débito Alimentar";
  const salarioAlimentante = Number(dados.salarioAlimentante) || PARAMS.salarioMinimo;
  const percentualAlimentos = Number(dados.percentualAlimentos) || 30;
  const dataInicio = dados.dataInicio;
  const mesesAtraso = Number(dados.mesesAtraso) || 0;
  const dataCalculo = dados.dataCalculo || new Date().toISOString().split("T")[0];

  if (!dataInicio) throw new Error("Informe a data de início dos alimentos.");

  const pensaoMensal = salarioAlimentante * (percentualAlimentos / 100);
  const verbas = [];

  verbas.push({ nome: `Pensão Alimentícia Mensal (${percentualAlimentos}% da renda)`, formula: `${brl(salarioAlimentante)} × ${percentualAlimentos}%`, legal: "Art. 1.694 CC/2002; Art. 529 CPC", valor: pensaoMensal });

  if (tipoCalculo === "Débito Alimentar" && mesesAtraso > 0) {
    const totalAtrasado = pensaoMensal * mesesAtraso;
    verbas.push({ nome: `Alimentos em Atraso (${mesesAtraso} meses)`, formula: `${brl(pensaoMensal)} × ${mesesAtraso} meses`, legal: "Art. 528 CPC; Art. 19 Lei 5.478/68", valor: totalAtrasado });
    verbas.push({ nome: `Correção INPC s/ atrasados (${mesesAtraso} meses)`, formula: `${brl(totalAtrasado)} × INPC acumulado`, legal: "Tabela IBGE/INPC", valor: correcaoAcumulada(totalAtrasado, mesesAtraso, PARAMS.inpcMensal) });
    verbas.push({ nome: "Juros 1% a.m. s/ atrasados", formula: `${brl(totalAtrasado)} × 1% × ${mesesAtraso} meses`, legal: "Art. 406 CC/2002", valor: jurosSimples(totalAtrasado, mesesAtraso, PARAMS.jurosMoraCivel) });
    verbas.push({ nome: "Multa por Atraso 10%", formula: `${brl(totalAtrasado)} × 10%`, legal: "Art. 523 §1º CPC", valor: totalAtrasado * 0.10 });
  }

  const subtotal = verbas.reduce((s, v) => s + v.valor, 0);
  const honorarios = subtotal * PARAMS.honorariosMin;

  return {
    area: "Família / Alimentos",
    identificacao: { parteAutora: dados.parteAutora, cpfAutora: dados.cpfAutora, parteRe: dados.parteRe, advogado: dados.advogado },
    periodoBase: { dataInicio, dataFim: dataCalculo, diasTotais: diasEntre(dataInicio, dataCalculo), mesesTotais: mesesEntre(dataInicio, dataCalculo) },
    verbas,
    subtotal,
    correcaoMonetaria: { indice: "INPC", meses: mesesAtraso, valor: 0 },
    juros: { tipo: "1% a.m. simples", meses: mesesAtraso, taxa: 1, valor: 0 },
    honorarios: { percentual: 10, base: subtotal, valor: honorarios, legal: "Art. 85 CPC" },
    totalGeral: subtotal + honorarios,
    observacoes: `Pensão de ${percentualAlimentos}% sobre renda de ${brl(salarioAlimentante)} = ${brl(pensaoMensal)}/mês. Débito de ${mesesAtraso} meses em atraso.`
  };
}

// ============================================================
// 6. TRIBUTÁRIO
// ============================================================
function calcularTributario(dados) {
  const tipoTributo = dados.tipoTributo || "IPTU";
  const dataVencimento = dados.dataVencimento;
  const dataPagamento = dados.dataPagamento || new Date().toISOString().split("T")[0];

  if (!dataVencimento) throw new Error("Informe a data de vencimento.");

  const dias = diasEntre(dataVencimento, dataPagamento);
  const meses = mesesEntre(dataVencimento, dataPagamento);
  const base = Number(dados.valorPrincipal) || 0;
  const verbas = [];

  verbas.push({ nome: `${tipoTributo} — Principal`, formula: brl(base), legal: "Código Tributário Nacional", valor: base });

  const pctMulta = Math.min(0.20, dias * 0.0033);
  verbas.push({ nome: `Multa de Mora (${(pctMulta * 100).toFixed(2)}% — ${dias} dias × 0,33%/dia, máx. 20%)`, formula: `${brl(base)} × ${(pctMulta * 100).toFixed(2)}%`, legal: "Art. 61 Lei 9.430/96", valor: base * pctMulta });

  const jurosSelic = base * PARAMS.selicMensal * meses;
  verbas.push({ nome: `Juros SELIC (${meses} meses)`, formula: `${brl(base)} × SELIC (${(PARAMS.selicMensal * 100).toFixed(2)}% a.m.) × ${meses} meses`, legal: "Art. 61 §3º Lei 9.430/96", valor: jurosSelic });

  const subtotal = verbas.reduce((s, v) => s + v.valor, 0);

  return {
    area: "Tributário / Fiscal",
    identificacao: { parteAutora: dados.parteAutora, cpfAutora: dados.cpfAutora, parteRe: dados.parteRe || "Fazenda Pública", advogado: dados.advogado },
    periodoBase: { dataInicio: dataVencimento, dataFim: dataPagamento, diasTotais: dias, mesesTotais: meses },
    verbas,
    subtotal,
    correcaoMonetaria: { indice: "SELIC", meses, valor: jurosSelic },
    juros: { tipo: "SELIC", meses, taxa: PARAMS.selicMensal * 100, valor: jurosSelic },
    honorarios: { percentual: 0, base: 0, valor: 0, legal: "N/A" },
    totalGeral: subtotal,
    observacoes: `${dias} dias de atraso. Multa: ${(pctMulta*100).toFixed(2)}%. Juros SELIC: ${(PARAMS.selicMensal*100).toFixed(2)}% a.m.`
  };
}

// ============================================================
// 7. PENAL / EXECUÇÃO
// ============================================================
function calcularPenal(dados) {
  const dataPrisao = dados.dataPrisao;
  const penaMeses = Number(dados.penaMeses) || 0;
  const diasTrabalhados = Number(dados.diasTrabalhados) || 0;
  const diasEstudados = Number(dados.diasEstudados) || 0;
  const dataCalculo = dados.dataCalculo || new Date().toISOString().split("T")[0];
  const reincidente = dados.reincidente === "Sim" || dados.reincidente === true;

  if (!dataPrisao) throw new Error("Informe a data de início da pena/prisão.");

  const verbas = [];
  const mesesCumpridos = mesesEntre(dataPrisao, dataCalculo);

  const remicaoTrabalho = Math.floor(diasTrabalhados / 3);
  if (remicaoTrabalho > 0) {
    verbas.push({ nome: `Remição por Trabalho (${diasTrabalhados} dias ÷ 3)`, formula: `${diasTrabalhados} dias trabalhados ÷ 3 = ${remicaoTrabalho} dias remidos`, legal: "Art. 126 §1º I LEP", valor: remicaoTrabalho });
  }

  const remicaoEstudo = Math.floor(diasEstudados / 12);
  if (remicaoEstudo > 0) {
    verbas.push({ nome: `Remição por Estudo (${diasEstudados}h ÷ 12h)`, formula: `${diasEstudados}h ÷ 12h = ${remicaoEstudo} dias remidos`, legal: "Art. 126 §1º II LEP", valor: remicaoEstudo });
  }

  const totalRemicao = remicaoTrabalho + remicaoEstudo;
  const penaEfetiva = Math.max(0, penaMeses - totalRemicao);
  const fracaoLivramento = reincidente ? 2 / 3 : 1 / 3;
  const mesesLivramento = Math.ceil(penaMeses * fracaoLivramento);

  verbas.push({ nome: "Pena Total", formula: `${penaMeses} meses`, legal: "Sentença/Acórdão", valor: penaMeses });
  verbas.push({ nome: "Total de Remição", formula: `${remicaoTrabalho} (trabalho) + ${remicaoEstudo} (estudo) = ${totalRemicao} dias`, legal: "Art. 126 LEP", valor: -totalRemicao });
  verbas.push({ nome: "Pena Efetiva a Cumprir", formula: `${penaMeses} meses − ${totalRemicao} dias`, legal: "Art. 127 LEP", valor: penaEfetiva });
  verbas.push({ nome: `Livramento Condicional — ${(fracaoLivramento * 100).toFixed(0)}% da pena`, formula: `${penaMeses} meses × ${(fracaoLivramento * 100).toFixed(0)}% = ${mesesLivramento} meses (descontada remição)`, legal: reincidente ? "Art. 83 II CP" : "Art. 83 I CP", valor: mesesLivramento });

  return {
    area: "Penal / Execução",
    identificacao: { parteAutora: dados.parteAutora, cpfAutora: dados.cpfAutora, parteRe: dados.parteRe || "Ministério Público", advogado: dados.advogado },
    periodoBase: { dataInicio: dataPrisao, dataFim: dataCalculo, diasTotais: diasEntre(dataPrisao, dataCalculo), mesesTotais: mesesCumpridos },
    verbas,
    subtotal: penaEfetiva,
    correcaoMonetaria: { indice: "N/A", meses: 0, valor: 0 },
    juros: { tipo: "N/A", meses: 0, taxa: 0, valor: 0 },
    honorarios: { percentual: 0, base: 0, valor: 0, legal: "N/A" },
    totalGeral: penaEfetiva,
    observacoes: `Pena: ${penaMeses} meses. Remição total: ${totalRemicao} dias. Pena efetiva: ${penaEfetiva} meses. Livramento condicional: após ${mesesLivramento} meses.`,
    unidade: "meses/dias"
  };
}

// ============================================================
// 8. IMOBILIÁRIO / LOCAÇÃO
// ============================================================
function calcularImobiliario(dados) {
  const tipoCalculo = dados.tipoCalculo || "Atraso de Aluguel";
  const dataInicio = dados.dataInicio;
  const mesesAtraso = Number(dados.mesesAtraso) || 0;
  const indiceReajuste = dados.indiceReajuste || "IGPM";
  const multaRescisaoMeses = Number(dados.multaRescisaoMeses) || 3;
  const dataCalculo = dados.dataCalculo || new Date().toISOString().split("T")[0];

  if (!dataInicio) throw new Error("Informe a data de início do contrato.");

  const aluguel = Number(dados.valorAluguel) || 0;
  const verbas = [];
  const mesesContrato = mesesEntre(dataInicio, dataCalculo);

  if (tipoCalculo === "Atraso de Aluguel" || tipoCalculo === "Ação de Despejo") {
    const totalAluguel = aluguel * mesesAtraso;
    verbas.push({ nome: `Aluguéis em Atraso (${mesesAtraso} meses × ${brl(aluguel)})`, formula: `${brl(aluguel)} × ${mesesAtraso} meses`, legal: "Art. 22 c/c 23 Lei 8.245/91", valor: totalAluguel });
    verbas.push({ nome: "Multa por Inadimplência 10%", formula: `${brl(totalAluguel)} × 10%`, legal: "Cláusula contratual; Art. 412 CC", valor: totalAluguel * 0.10 });
    const taxa = indiceReajuste === "IGPM" ? PARAMS.igpmMensal : PARAMS.ipcaMensal;
    verbas.push({ nome: `Correção ${indiceReajuste} s/ aluguéis (${mesesAtraso} meses)`, formula: `${brl(totalAluguel)} × ${indiceReajuste} acumulado`, legal: "Lei 8.245/91; Cláusula contratual", valor: correcaoAcumulada(totalAluguel, mesesAtraso, taxa) });
    verbas.push({ nome: `Juros de Mora 1% a.m. (${mesesAtraso} meses)`, formula: `${brl(totalAluguel)} × 1% × ${mesesAtraso} meses`, legal: "Art. 406 CC/2002", valor: jurosSimples(totalAluguel, mesesAtraso, PARAMS.jurosMoraLoc) });
  }

  if (tipoCalculo === "Rescisão Antecipada") {
    const mesesRestantes = Math.max(0, 30 - mesesContrato);
    const multaProp = (aluguel * multaRescisaoMeses) * (mesesRestantes / 30 || 1);
    verbas.push({ nome: "Multa Rescisória Proporcional", formula: `${brl(aluguel)} × ${multaRescisaoMeses} meses × (${mesesRestantes}/30 meses restantes)`, legal: "Art. 4º Lei 8.245/91; Súmula 440 STJ", valor: multaProp });
  }

  const subtotal = verbas.reduce((s, v) => s + v.valor, 0);
  const honorarios = subtotal * PARAMS.honorariosMin;

  return {
    area: "Imobiliário / Locação",
    identificacao: { parteAutora: dados.parteAutora, cpfAutora: dados.cpfAutora, parteRe: dados.parteRe, advogado: dados.advogado },
    periodoBase: { dataInicio, dataFim: dataCalculo, diasTotais: diasEntre(dataInicio, dataCalculo), mesesTotais: mesesContrato },
    verbas,
    subtotal,
    correcaoMonetaria: { indice: indiceReajuste, meses: mesesAtraso, valor: 0 },
    juros: { tipo: "1% a.m.", meses: mesesAtraso, taxa: 1, valor: 0 },
    honorarios: { percentual: 10, base: subtotal, valor: honorarios, legal: "Art. 85 CPC" },
    totalGeral: subtotal + honorarios,
    observacoes: `Contrato desde ${fmtData(dataInicio)} (${mesesContrato} meses). Aluguel: ${brl(aluguel)}/mês. Reajuste: ${indiceReajuste}.`
  };
}

// ============================================================
// DISPATCHER PRINCIPAL
// ============================================================
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

// ============================================================
// VALIDAÇÃO
// ============================================================
export function validar(areaId, dados) {
  const erros = [];
  if (!dados.parteAutora?.trim()) erros.push("Informe o nome da Parte Autora.");
  if (areaId === "trabalhista") {
    if (!dados.dataAdmissao) erros.push("Data de admissão obrigatória.");
    if (!dados.dataDemissao) erros.push("Data de demissão obrigatória.");
    if (dados.dataAdmissao && dados.dataDemissao && new Date(dados.dataDemissao) <= new Date(dados.dataAdmissao)) erros.push("Data de demissão deve ser após admissão.");
  }
  if (areaId === "civil" && !dados.dataFato) erros.push("Data do fato obrigatória.");
  if (areaId === "consumidor" && !dados.dataContrato) erros.push("Data do contrato obrigatória.");
  if (areaId === "familia" && !dados.dataInicio) erros.push("Data de início dos alimentos obrigatória.");
  if (areaId === "tributario" && !dados.dataVencimento) erros.push("Data de vencimento obrigatória.");
  if (areaId === "penal" && !dados.dataPrisao) erros.push("Data de início da pena obrigatória.");
  if (areaId === "imobiliario" && !dados.dataInicio) erros.push("Data de início do contrato obrigatória.");
  if (areaId === "previdenciario" && !dados.dataRequerimento) erros.push("Data do requerimento obrigatória.");
  return erros;
}