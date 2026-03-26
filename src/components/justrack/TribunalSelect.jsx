import React from "react";

export const TRIBUNAIS = [
  { grupo: "Tribunais Superiores", itens: [
    { nome: "TST — Tribunal Superior do Trabalho", url: "https://api-publica.datajud.cnj.jus.br/api_publica_tst/_search" },
    { nome: "TSE — Tribunal Superior Eleitoral", url: "https://api-publica.datajud.cnj.jus.br/api_publica_tse/_search" },
    { nome: "STJ — Superior Tribunal de Justiça", url: "https://api-publica.datajud.cnj.jus.br/api_publica_stj/_search" },
    { nome: "STM — Tribunal Superior Militar", url: "https://api-publica.datajud.cnj.jus.br/api_publica_stm/_search" },
  ]},
  { grupo: "Justiça Federal", itens: [
    { nome: "TRF 1ª Região", url: "https://api-publica.datajud.cnj.jus.br/api_publica_trf1/_search" },
    { nome: "TRF 2ª Região", url: "https://api-publica.datajud.cnj.jus.br/api_publica_trf2/_search" },
    { nome: "TRF 3ª Região", url: "https://api-publica.datajud.cnj.jus.br/api_publica_trf3/_search" },
    { nome: "TRF 4ª Região", url: "https://api-publica.datajud.cnj.jus.br/api_publica_trf4/_search" },
    { nome: "TRF 5ª Região", url: "https://api-publica.datajud.cnj.jus.br/api_publica_trf5/_search" },
    { nome: "TRF 6ª Região", url: "https://api-publica.datajud.cnj.jus.br/api_publica_trf6/_search" },
  ]},
  { grupo: "Justiça Estadual", itens: [
    { nome: "TJAC", url: "https://api-publica.datajud.cnj.jus.br/api_publica_tjac/_search" },
    { nome: "TJAL", url: "https://api-publica.datajud.cnj.jus.br/api_publica_tjal/_search" },
    { nome: "TJAM", url: "https://api-publica.datajud.cnj.jus.br/api_publica_tjam/_search" },
    { nome: "TJAP", url: "https://api-publica.datajud.cnj.jus.br/api_publica_tjap/_search" },
    { nome: "TJBA", url: "https://api-publica.datajud.cnj.jus.br/api_publica_tjba/_search" },
    { nome: "TJCE", url: "https://api-publica.datajud.cnj.jus.br/api_publica_tjce/_search" },
    { nome: "TJDFT", url: "https://api-publica.datajud.cnj.jus.br/api_publica_tjdft/_search" },
    { nome: "TJES", url: "https://api-publica.datajud.cnj.jus.br/api_publica_tjes/_search" },
    { nome: "TJGO", url: "https://api-publica.datajud.cnj.jus.br/api_publica_tjgo/_search" },
    { nome: "TJMA", url: "https://api-publica.datajud.cnj.jus.br/api_publica_tjma/_search" },
    { nome: "TJMG", url: "https://api-publica.datajud.cnj.jus.br/api_publica_tjmg/_search" },
    { nome: "TJMS", url: "https://api-publica.datajud.cnj.jus.br/api_publica_tjms/_search" },
    { nome: "TJMT", url: "https://api-publica.datajud.cnj.jus.br/api_publica_tjmt/_search" },
    { nome: "TJPA", url: "https://api-publica.datajud.cnj.jus.br/api_publica_tjpa/_search" },
    { nome: "TJPB", url: "https://api-publica.datajud.cnj.jus.br/api_publica_tjpb/_search" },
    { nome: "TJPE", url: "https://api-publica.datajud.cnj.jus.br/api_publica_tjpe/_search" },
    { nome: "TJPI", url: "https://api-publica.datajud.cnj.jus.br/api_publica_tjpi/_search" },
    { nome: "TJPR", url: "https://api-publica.datajud.cnj.jus.br/api_publica_tjpr/_search" },
    { nome: "TJRJ", url: "https://api-publica.datajud.cnj.jus.br/api_publica_tjrj/_search" },
    { nome: "TJRN", url: "https://api-publica.datajud.cnj.jus.br/api_publica_tjrn/_search" },
    { nome: "TJRO", url: "https://api-publica.datajud.cnj.jus.br/api_publica_tjro/_search" },
    { nome: "TJRR", url: "https://api-publica.datajud.cnj.jus.br/api_publica_tjrr/_search" },
    { nome: "TJRS", url: "https://api-publica.datajud.cnj.jus.br/api_publica_tjrs/_search" },
    { nome: "TJSC", url: "https://api-publica.datajud.cnj.jus.br/api_publica_tjsc/_search" },
    { nome: "TJSE", url: "https://api-publica.datajud.cnj.jus.br/api_publica_tjse/_search" },
    { nome: "TJSP", url: "https://api-publica.datajud.cnj.jus.br/api_publica_tjsp/_search" },
    { nome: "TJTO", url: "https://api-publica.datajud.cnj.jus.br/api_publica_tjto/_search" },
  ]},
];

export default function TribunalSelect({ value, onChange, style = {} }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        background: "#0d1117",
        border: "1px solid #1e2740",
        color: value ? "#e8eaf0" : "#4a5568",
        padding: ".65rem .9rem",
        fontFamily: "'IBM Plex Sans', sans-serif",
        fontSize: ".85rem",
        outline: "none",
        width: "100%",
        cursor: "pointer",
        ...style,
      }}
    >
      <option value="">— Selecione o Tribunal —</option>
      {TRIBUNAIS.map(g => (
        <optgroup key={g.grupo} label={g.grupo}>
          {g.itens.map(t => (
            <option key={t.url} value={t.url}>{t.nome}</option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

export function getTribunalNome(url) {
  for (const g of TRIBUNAIS) {
    for (const t of g.itens) {
      if (t.url === url) return t.nome;
    }
  }
  return url;
}