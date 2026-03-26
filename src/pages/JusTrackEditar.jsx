import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import JusTrackNovo from "./JusTrackNovo";
import JusTrackLayout from "@/components/justrack/JusTrackLayout";
import { TRIBUNAIS } from "@/components/justrack/TribunalSelect";

function getTribunalUrl(nome) {
  for (const g of TRIBUNAIS) {
    for (const t of g.itens) {
      if (t.nome === nome || t.nome.startsWith(nome?.split("—")[0]?.trim())) return t.url;
    }
  }
  return "";
}

export default function JusTrackEditar() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  const { data, isLoading } = useQuery({
    queryKey: ["processo", id],
    queryFn: () => base44.entities.Processo.filter({ id }),
    select: d => d[0],
    enabled: !!id,
  });

  if (isLoading) return (
    <JusTrackLayout>
      <div style={{ padding: "4rem", textAlign: "center", color: "#8892a4", fontFamily: "'IBM Plex Sans', sans-serif" }}>Carregando...</div>
    </JusTrackLayout>
  );

  if (!data) return (
    <JusTrackLayout>
      <div style={{ padding: "4rem", textAlign: "center", color: "#f87171", fontFamily: "'IBM Plex Sans', sans-serif" }}>Processo não encontrado.</div>
    </JusTrackLayout>
  );

  const editData = {
    ...data,
    tribunalUrl: data.tribunalUrl || getTribunalUrl(data.tribunal),
  };

  return <JusTrackNovo editData={editData} />;
}