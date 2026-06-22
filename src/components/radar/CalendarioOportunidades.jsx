import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import AppCard from "@/components/ds/AppCard";
import AppBadge from "@/components/ds/AppBadge";
import { CalendarDays } from "lucide-react";

const CALENDARIO_FALLBACK = [
  { id: "c1", data_evento: "2026-06-20", titulo: "Dia do Advogado", area_juridica: "todos", tipo: "data_comemorativa", sugestao_pauta: "Publique sua trajetória ou o motivo de ter escolhido o Direito. Conteúdo pessoal gera alto engajamento nessa data." },
  { id: "c2", data_evento: "2026-06-30", titulo: "Fechamento semestral de contratos trabalhistas", area_juridica: "trabalhista", tipo: "sazonalidade", sugestao_pauta: "Aborde os direitos do trabalhador ao encerrar contrato: aviso prévio, férias proporcionais e 13º." },
  { id: "c3", data_evento: "2026-07-07", titulo: "Prazo rescisão CLT — competência junho", area_juridica: "trabalhista", tipo: "prazo", sugestao_pauta: "Explique o prazo legal para pagamento das verbas rescisórias e as consequências do atraso para o empregador." },
  { id: "c4", data_evento: "2026-07-15", titulo: "Vencimento de parcelas FGTS", area_juridica: "trabalhista", tipo: "prazo", sugestao_pauta: "Conteúdo sobre como o trabalhador pode verificar se o FGTS está sendo recolhido corretamente." },
  { id: "c5", data_evento: "2026-07-24", titulo: "Dia do Consumidor (relembrete semestral)", area_juridica: "consumidor", tipo: "campanha", sugestao_pauta: "Relembre os 5 direitos mais importantes do consumidor que muita gente desconhece." },
];

const TIPO_CONFIG = {
  prazo:             { variant: "danger",  label: "Prazo" },
  campanha:          { variant: "info",    label: "Campanha" },
  data_comemorativa: { variant: "success", label: "Data Comemorativa" },
  sazonalidade:      { variant: "warning", label: "Sazonalidade" },
};

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function formatDataEvento(dateStr) {
  const [, m, d] = dateStr.split("-");
  return { dia: d, mes: MESES[parseInt(m, 10) - 1] };
}

export default function CalendarioOportunidades({ selectedArea }) {
  const now = new Date();
  const mesAtual = now.getMonth();
  const mesProximo = (mesAtual + 1) % 12;
  const anoAtual = now.getFullYear();

  const { data: eventosDB = [], isLoading } = useQuery({
    queryKey: ["calendario-juridico"],
    queryFn: () => base44.entities.CalendarioJuridico.list("data_evento", 100),
  });

  const eventos = eventosDB.length > 0 ? eventosDB : CALENDARIO_FALLBACK;

  const filtered = eventos.filter(e => {
    const [ano, mes] = e.data_evento.split("-").map(Number);
    const mOk = (ano === anoAtual && (mes - 1 === mesAtual || mes - 1 === mesProximo)) ||
                (mesAtual === 11 && ano === anoAtual + 1 && mes === 1);
    const areaOk = !selectedArea || selectedArea === "all" || e.area_juridica === selectedArea || e.area_juridica === "todos";
    return mOk && areaOk;
  }).sort((a, b) => a.data_evento.localeCompare(b.data_evento));

  if (isLoading) {
    return (
      <div style={{ display: "grid", gap: 12 }}>
        {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: "var(--r-lg)" }} />)}
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <AppCard>
        <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-3)", fontSize: 13 }}>
          <CalendarDays size={32} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
          Nenhum evento nos próximos dois meses para esta área.
        </div>
      </AppCard>
    );
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {filtered.map((evento, i) => {
        const { dia, mes } = formatDataEvento(evento.data_evento);
        const tipoCfg = TIPO_CONFIG[evento.tipo] || TIPO_CONFIG.campanha;
        return (
          <AppCard key={evento.id || i}>
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              {/* Data em destaque */}
              <div style={{
                flexShrink: 0, textAlign: "center", width: 52,
                background: "var(--accent-light)", borderRadius: "var(--r-md)", padding: "8px 4px"
              }}>
                <p style={{ fontSize: 22, fontWeight: 700, color: "var(--accent)", lineHeight: 1, margin: 0 }}>{dia}</p>
                <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", color: "var(--accent)", letterSpacing: "0.08em", margin: 0 }}>{mes}</p>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
                  <AppBadge variant={tipoCfg.variant}>{tipoCfg.label}</AppBadge>
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)", margin: "0 0 8px", letterSpacing: "-0.01em" }}>
                  {evento.titulo}
                </h3>
                {evento.sugestao_pauta && (
                  <div style={{
                    background: "var(--surface)", border: "1px solid var(--border)",
                    borderRadius: "var(--r-md)", padding: "10px 12px"
                  }}>
                    <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-3)", margin: "0 0 4px" }}>
                      Sugestão de Pauta
                    </p>
                    <p style={{ fontSize: 12, color: "var(--text-1)", margin: 0, lineHeight: 1.55 }}>
                      {evento.sugestao_pauta}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </AppCard>
        );
      })}
    </div>
  );
}