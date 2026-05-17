import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import CamposComuns from "./CamposComuns";
import CamposTrabalhista from "./campos/CamposTrabalhista";
import CamposPrevidenciario from "./campos/CamposPrevidenciario";
import CamposCivil from "./campos/CamposCivil";
import CamposConsumidor from "./campos/CamposConsumidor";
import CamposFamilia from "./campos/CamposFamilia";
import CamposTributario from "./campos/CamposTributario";
import CamposPenal from "./campos/CamposPenal";
import CamposImobiliario from "./campos/CamposImobiliario";
import UploadDocumento from "./UploadDocumento";

const PARAMETROS = {
  salarioMinimo: 1412.00,
  tetoPrev: 7786.02,
  selicMensal: 0.0107,
  inpcMensal: 0.0045,
  ipcaMensal: 0.0048,
  igpmMensal: 0.0052,
  jurosMoraCC: 0.01,
  multaFGTS: 0.40,
  multaFGTSAcordo: 0.20,
  fgtsPercentual: 0.08,
  adicionalInsalubridadeMax: 0.40,
  adicionalInsalubridade: 0.20,
  adicionalInsalubridadeMin: 0.10,
  adicionalPericulosidade: 0.30,
  adicionalNoturno: 0.20,
  heAdicionalDiaSemana: 0.50,
  heAdicionalFeriado: 1.00,
  horasJornadaMensalNormal: 220,
  honorariosMin: 0.10,
  honorariosMax: 0.20,
  dataReferencia: new Date().toISOString().split('T')[0]
};

const SYSTEM_PROMPT = `Você é um calculista jurídico especialista em Direito Brasileiro com 20 anos de experiência.
Você realiza cálculos jurídicos com precisão absoluta, sempre citando o fundamento legal de cada verba.

PARÂMETROS VIGENTES 2025/2026:
- Salário Mínimo: R$ 1.412,00
- Teto INSS: R$ 7.786,02
- SELIC mensal: ~1,07%
- INPC mensal: ~0,45%
- IPCA mensal: ~0,48%
- IGP-M mensal: ~0,52%
- Juros mora cível: 1% a.m. simples (até 06/2009) + SELIC (após 06/2009)
- Juros mora trabalhista: SELIC (ADC 58 STF)
- Multa FGTS: 40% (sem justa causa) ou 20% (acordo §6º art. 484-A CLT)
- FGTS: 8% sobre salário
- Horas Extras: +50% dias úteis, +100% domingos/feriados
- Adicional Noturno: +20%
- Insalubridade: 40%/20%/10% sobre salário mínimo
- Periculosidade: 30% sobre salário
- Honorários: Art. 85 CPC — 10% a 20%
- Alimentos: correção INPC + juros 1% a.m.
- Locação: IGP-M ou IPCA conforme contrato
- Tributário: multa mora 0,33%/dia até 20%, juros SELIC

REGRAS TRABALHISTAS (CLT + Reforma 13.467/2017):
Saldo salário = Salário ÷ 30 × dias trabalhados no mês
Aviso Prévio = 30 dias + 3 dias/ano de serviço (máx 90 dias) — Art. 487 CLT
13º Proporcional = Salário ÷ 12 × meses (fração ≥15d = 1 mês)
Férias Proporcionais = Salário ÷ 12 × meses
1/3 Constitucional = Férias × 1/3
Multa FGTS = Saldo FGTS × 40% (s/justa causa) ou 20% (acordo)

REGRAS PREVIDENCIÁRIAS (Lei 8.213/91 + EC 103/2019):
Salário de Benefício = Média dos 80% maiores salários de contribuição
Coeficiente = 60% + 2% por ano além do mínimo
RMI = Salário de Benefício × Coeficiente

REGRAS PENAIS (CP + LEP 7.210/84):
Remição trabalho: 1 dia pena / 3 dias trabalhados (art. 126 LEP)
Remição estudo: 1 dia pena / 12h estudo
Livramento: 1/3 (primário) ou 2/3 (reincidente/hediondo)

INSTRUÇÕES:
1. Calcule TODAS as verbas aplicáveis
2. Para cada verba: nome, fórmula, base de cálculo, fundamento legal e valor
3. Arredonde valores ao centavo (2 casas decimais)
4. Informe ressalvas importantes
5. Retorne APENAS JSON válido, sem texto adicional antes ou depois`;

export default function FormularioDados({ area, onResultado, onVoltar }) {
  const [aba, setAba] = useState("manual");
  const [dados, setDados] = useState({});
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);

  const handleChange = (campo, valor) => {
    setDados(prev => ({ ...prev, [campo]: valor }));
  };

  const handleDadosExtraidos = (dadosExtraidos) => {
    setDados(prev => ({ ...prev, ...dadosExtraidos }));
    setAba("manual");
  };

  const handleCalcular = async () => {
    setErro(null);
    setLoading(true);

    try {
      const prompt = `Realize o cálculo jurídico completo para a seguinte situação:

ÁREA DO DIREITO: ${area.label}
DATA DO CÁLCULO: ${new Date().toISOString().split('T')[0]}
HORA: ${new Date().toLocaleTimeString('pt-BR')}

PARÂMETROS ECONÔMICOS VIGENTES:
${JSON.stringify(PARAMETROS, null, 2)}

DADOS FORNECIDOS PELO USUÁRIO:
${JSON.stringify(dados, null, 2)}

Retorne APENAS um JSON válido neste formato exato (sem texto antes ou depois):
{
  "areaDireito": "${area.label}",
  "dataCalculo": "${new Date().toISOString().split('T')[0]}",
  "horaCalculo": "${new Date().toLocaleTimeString('pt-BR')}",
  "identificacao": {
    "parteAutora": "",
    "cpfAutora": "",
    "parteRe": "",
    "cpfRe": "",
    "advogado": ""
  },
  "periodoBase": {
    "dataInicio": "",
    "dataFim": "",
    "diasTotais": 0,
    "mesesTotais": 0
  },
  "verbas": [
    {
      "nome": "Nome da Verba",
      "base": 0,
      "formula": "Descrição da fórmula aplicada",
      "valor": 0,
      "fundamentoLegal": "Art. X da Lei Y"
    }
  ],
  "correcaoMonetaria": {
    "indice": "IPCA",
    "percentualTotal": 0,
    "valorOriginal": 0,
    "valorCorrigido": 0
  },
  "juros": {
    "tipo": "SELIC",
    "percentualAoMes": 0,
    "meses": 0,
    "valorJuros": 0
  },
  "honorarios": {
    "percentual": 10,
    "base": 0,
    "valor": 0,
    "fundamentoLegal": "Art. 85 CPC"
  },
  "resumo": {
    "subtotalVerbas": 0,
    "correcaoMonetaria": 0,
    "juros": 0,
    "honorarios": 0,
    "totalGeral": 0
  },
  "parametrosUsados": {
    "salarioMinimo": 1412.00,
    "selic": "1,07% a.m.",
    "inpc": "0,45% a.m.",
    "ipca": "0,48% a.m."
  },
  "observacoesLegais": "Observações importantes sobre o cálculo",
  "ressalvas": "Ressalvas e limitações do cálculo automatizado"
}`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        model: "claude_sonnet_4_6",
        response_json_schema: {
          type: "object",
          properties: {
            areaDireito: { type: "string" },
            dataCalculo: { type: "string" },
            horaCalculo: { type: "string" },
            identificacao: { type: "object" },
            periodoBase: { type: "object" },
            verbas: { type: "array" },
            correcaoMonetaria: { type: "object" },
            juros: { type: "object" },
            honorarios: { type: "object" },
            resumo: { type: "object" },
            parametrosUsados: { type: "object" },
            observacoesLegais: { type: "string" },
            ressalvas: { type: "string" }
          }
        }
      });

      onResultado(response);
    } catch (err) {
      setErro("Erro ao processar o cálculo. Verifique os dados e tente novamente. " + (err?.message || ""));
    } finally {
      setLoading(false);
    }
  };

  const renderCamposEspecificos = () => {
    const props = { dados, onChange: handleChange };
    switch (area.id) {
      case "trabalhista": return <CamposTrabalhista {...props} />;
      case "previdenciario": return <CamposPrevidenciario {...props} />;
      case "civil": return <CamposCivil {...props} />;
      case "consumidor": return <CamposConsumidor {...props} />;
      case "familia": return <CamposFamilia {...props} />;
      case "tributario": return <CamposTributario {...props} />;
      case "penal": return <CamposPenal {...props} />;
      case "imobiliario": return <CamposImobiliario {...props} />;
      default: return null;
    }
  };

  return (
    <div>
      {/* Breadcrumb área */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
        <button onClick={onVoltar} style={{ background: "none", border: "none", cursor: "pointer", color: "#185FA5", fontSize: "0.85rem" }}>
          ← Voltar
        </button>
        <span style={{ color: "#999" }}>|</span>
        <span style={{ fontWeight: 700, color: "#1a1a2e" }}>{area.label}</span>
      </div>

      {/* Abas */}
      <div style={{ display: "flex", borderBottom: "2px solid #e0e0e0", marginBottom: "1.5rem" }}>
        {[
          { id: "manual", label: "📋 Formulário Manual" },
          { id: "upload", label: "🤖 Raio-X com IA" },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setAba(tab.id)}
            style={{
              padding: "0.75rem 1.5rem",
              border: "none", background: "none", cursor: "pointer",
              fontWeight: aba === tab.id ? 700 : 400,
              color: aba === tab.id ? "#185FA5" : "#666",
              borderBottom: aba === tab.id ? "2px solid #185FA5" : "2px solid transparent",
              marginBottom: "-2px", fontSize: "0.9rem"
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {aba === "upload" ? (
        <UploadDocumento onDadosExtraidos={handleDadosExtraidos} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          {/* Coluna esquerda: campos comuns */}
          <div style={{ background: "#fff", padding: "1.5rem", border: "1px solid #e0e0e0" }}>
            <h3 style={{ fontFamily: "Georgia, serif", fontSize: "1rem", color: "#1a1a2e", marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: "2px solid #185FA5" }}>
              Identificação das Partes
            </h3>
            <CamposComuns dados={dados} onChange={handleChange} />
          </div>

          {/* Coluna direita: campos específicos */}
          <div style={{ background: "#fff", padding: "1.5rem", border: "1px solid #e0e0e0" }}>
            <h3 style={{ fontFamily: "Georgia, serif", fontSize: "1rem", color: "#1a1a2e", marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: "2px solid #185FA5" }}>
              Dados Específicos — {area.label}
            </h3>
            {renderCamposEspecificos()}
          </div>
        </div>
      )}

      {/* Botão calcular */}
      {aba === "manual" && (
        <div style={{ marginTop: "1.5rem" }}>
          {erro && (
            <div style={{ background: "#fee2e2", border: "1px solid #f87171", color: "#b91c1c", padding: "1rem", marginBottom: "1rem", fontSize: "0.85rem" }}>
              ⚠️ {erro}
            </div>
          )}
          <button
            onClick={handleCalcular}
            disabled={loading}
            style={{
              background: loading ? "#9ca3af" : "#185FA5",
              color: "#fff", border: "none",
              padding: "1rem 2.5rem",
              fontSize: "1rem", fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: "0.75rem",
              width: "100%", justifyContent: "center"
            }}
          >
            {loading ? (
              <>
                <span style={{ display: "inline-block", width: 20, height: 20, border: "3px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                Calculando com IA... aguarde
              </>
            ) : (
              "⚖️ Calcular com IA"
            )}
          </button>
          {loading && (
            <p style={{ textAlign: "center", color: "#666", fontSize: "0.8rem", marginTop: "0.5rem" }}>
              A IA está analisando os dados e realizando os cálculos jurídicos...
            </p>
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}