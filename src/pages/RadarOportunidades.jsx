import React, { useState } from "react";
import { Activity, TrendingUp, CalendarDays, BookOpen, Sparkles } from "lucide-react";
import { AppPage, PageHeader, AppCard, AppAlert, AppTabs, SectionHeader } from "@/components/ds";
import { AppTabPanel } from "@/components/ds/AppTabs";
import TemasList from "@/components/radar/TemasList";
import CalendarioOportunidades from "@/components/radar/CalendarioOportunidades";
import ReferenciasConteudo from "@/components/radar/ReferenciasConteudo";
import Direcionar from "@/components/radar/Direcionar";

const AREAS = [
  { id: "consumidor",     label: "Consumidor" },
  { id: "trabalhista",    label: "Trabalhista" },
  { id: "previdenciario", label: "Previdenciário" },
  { id: "familia",        label: "Família" },
  { id: "empresarial",    label: "Empresarial" },
  { id: "tributario",     label: "Tributário" },
  { id: "saude",          label: "Saúde" },
  { id: "imobiliario",    label: "Imobiliário" },
];

const TABS = [
  { value: "temas",      label: "Temas em Alta",      icon: TrendingUp   },
  { value: "calendario", label: "Calendário",          icon: CalendarDays },
  { value: "referencias",label: "Referências",         icon: BookOpen     },
  { value: "direcionar", label: "Direcionar Conteúdo", icon: Sparkles     },
];

export default function RadarOportunidades() {
  const [selectedArea, setSelectedArea] = useState("all");
  const [activeTab, setActiveTab]       = useState("temas");
  const [temaDirecionar, setTemaDirecionar] = useState(null);

  const handleDirecionar = (tema) => {
    setTemaDirecionar(tema);
    setActiveTab("direcionar");
  };

  const handleVerReferencias = () => {
    setActiveTab("referencias");
  };

  return (
    <AppPage>
      <PageHeader
        title="Radar de Oportunidades"
        subtitle="Marketing jurídico — curadoria de temas e direcionamento de conteúdo"
        icon={Activity}
      />

      <div style={{ padding: "24px 32px" }}>
        <div style={{ marginBottom: 20 }}>
          <AppAlert variant="warning">
            <strong>Aviso:</strong> As informações têm caráter exclusivamente informativo e estratégico, não configurando captação direta de clientela, em conformidade com o Código de Ética da OAB e LGPD.
          </AppAlert>
        </div>

        <AppTabs tabs={TABS} value={activeTab} onValueChange={setActiveTab}>
          <AppTabPanel value="temas">
            <TemasList selectedArea={selectedArea} onDirecionar={handleDirecionar} />
          </AppTabPanel>

          <AppTabPanel value="calendario">
            <CalendarioOportunidades selectedArea={selectedArea} />
          </AppTabPanel>

          <AppTabPanel value="referencias">
            <ReferenciasConteudo selectedArea={selectedArea} />
          </AppTabPanel>

          <AppTabPanel value="direcionar">
            <Direcionar temaPre={temaDirecionar} onVerReferencias={handleVerReferencias} />
          </AppTabPanel>
        </AppTabs>

        {/* Filtro de área */}
        <AppCard style={{ marginTop: 20 }} noPad>
          <SectionHeader title="Filtrar por Área Jurídica" />
          <div style={{ padding: "12px 20px", display: "flex", flexWrap: "wrap", gap: 6 }}>
            <button
              onClick={() => setSelectedArea("all")}
              style={{
                padding: "6px 14px", borderRadius: 8, border: "1px solid", cursor: "pointer",
                fontSize: 12, fontWeight: 500, fontFamily: "var(--font-body)", letterSpacing: "-0.01em",
                background: selectedArea === "all" ? "var(--accent)" : "var(--card)",
                color:      selectedArea === "all" ? "#fff" : "var(--text-2)",
                borderColor: selectedArea === "all" ? "var(--accent)" : "var(--border)",
                transition: "all 0.15s ease",
              }}
            >
              Todas
            </button>
            {AREAS.map(area => (
              <button
                key={area.id}
                onClick={() => setSelectedArea(area.id)}
                style={{
                  padding: "6px 14px", borderRadius: 8, border: "1px solid", cursor: "pointer",
                  fontSize: 12, fontWeight: 500, fontFamily: "var(--font-body)", letterSpacing: "-0.01em",
                  background: selectedArea === area.id ? "var(--accent)" : "var(--card)",
                  color:      selectedArea === area.id ? "#fff" : "var(--text-2)",
                  borderColor: selectedArea === area.id ? "var(--accent)" : "var(--border)",
                  transition: "all 0.15s ease",
                }}
              >
                {area.label}
              </button>
            ))}
          </div>
        </AppCard>
      </div>
    </AppPage>
  );
}