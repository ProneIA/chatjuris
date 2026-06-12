# 🎨 Juris.IA — Design System (Regras Obrigatórias)

> **Toda página e componente DEVE seguir estas regras.  
> Qualquer desvio deve ser corrigido imediatamente.**

---

## 1. TOKENS DE COR (CSS Variables)

Nunca use cores hardcoded (`#3B82F6`, `blue-500`, `bg-white`, etc).  
Use **sempre** os tokens abaixo definidos em `globals.css`:

### Fundos
| Token | Valor | Uso |
|---|---|---|
| `var(--bg)` | `#F1F5F9` | Fundo da página (body/wrapper principal) |
| `var(--surface)` | `#F8FAFC` | Fundo de seções internas, painéis secundários |
| `var(--card)` | `#FFFFFF` | Fundo de cards e modais |

### Texto
| Token | Valor | Uso |
|---|---|---|
| `var(--text-1)` | `#0F172A` | Títulos, textos principais |
| `var(--text-2)` | `#475569` | Subtítulos, descrições, labels |
| `var(--text-3)` | `#94A3B8` | Placeholders, metadados, texto inativo |

### Cores de Destaque
| Token | Valor | Uso |
|---|---|---|
| `var(--accent)` | `#3B82F6` | Azul primário — botões, links, seleção ativa |
| `var(--accent-hover)` | `#2563EB` | Hover do botão primário |
| `var(--accent-light)` | `#EFF6FF` | Fundo de ícones azuis, destaque suave |
| `var(--accent-glow)` | `rgba(59,130,246,0.2)` | Sombra de foco nos inputs |

### Sidebar
| Token | Valor | Uso |
|---|---|---|
| `var(--navy)` | `#0B1120` | Fundo da sidebar |
| `var(--navy-2)` | `#141E35` | Itens hover na sidebar |
| `var(--navy-3)` | `#1E2D4A` | Itens ativos na sidebar |

### Bordas
| Token | Valor | Uso |
|---|---|---|
| `var(--border)` | `#E2E8F0` | Borda padrão de cards e inputs |
| `var(--border-2)` | `#CBD5E1` | Borda reforçada |

### Status (sempre em trio: cor, fundo, borda)
| Status | Cor | Fundo | Borda |
|---|---|---|---|
| Sucesso/Verde | `var(--green)` | `var(--green-bg)` | `var(--green-bd)` |
| Aviso/Amarelo | `var(--yellow)` | `var(--yellow-bg)` | `var(--yellow-bd)` |
| Erro/Vermelho | `var(--red)` | `var(--red-bg)` | `var(--red-bd)` |
| Info/Azul | `var(--blue)` | `var(--blue-bg)` | `var(--blue-bd)` |

---

## 2. TIPOGRAFIA

### Fontes
- **Corpo/UI**: `var(--font-body)` → `Inter` — tudo que é texto de interface
- **Títulos/Display**: `var(--font-display)` → `Syne` — headings de páginas

### Tamanhos obrigatórios
| Uso | Tamanho | Peso | Classe CSS |
|---|---|---|---|
| Título de página (`h1`) | 22px | 700 | `.text-heading` |
| Título de card/seção | 14–15px | 600 | — |
| Corpo de texto | 13.5–14px | 400 | — |
| Label uppercase (rótulos) | 11px | 600 | `.text-label` |
| Números/métricas grandes | 24–28px | 700 | `.text-stat` |
| Texto secundário/muted | 12–13px | 400 | `.text-muted` |

### ❌ Proibido
- `text-2xl`, `text-3xl` com Tailwind diretamente em títulos de página
- `font-bold` sem font-family definida
- Qualquer fonte diferente de Inter/Syne na interface interna

---

## 3. COMPONENTES — REGRAS

### 3.1 Cards
```jsx
// ✅ CERTO — use a classe app-card
<div className="app-card" style={{ padding: 20 }}>...</div>

// ✅ CERTO — card com hover
<div className="card" data-hover style={{ padding: 20 }}>...</div>

// ❌ ERRADO
<div className="bg-white rounded-xl shadow-md p-4">...</div>
<div className="bg-neutral-900 rounded-xl border-neutral-800">...</div>
```

**Regra**: `border-radius: var(--r-lg)` (14px), `border: 1px solid var(--border)`, `background: var(--card)`.

---

### 3.2 Botões
```jsx
// ✅ CERTO
<button className="btn btn-primary">Salvar</button>
<button className="btn btn-secondary">Cancelar</button>
<button className="btn btn-danger">Excluir</button>
<button className="btn btn-ghost">Ver mais</button>

// ❌ ERRADO — nunca use cores purple, violet, emerald, etc.
<Button className="bg-purple-600 hover:bg-purple-700">...</Button>
<Button className="bg-green-500">...</Button>
```

**Regra**: O único azul é `var(--accent)`. Não existe botão roxo/verde/laranja no sistema.

---

### 3.3 Inputs
```jsx
// ✅ CERTO — o CSS global já estiliza automaticamente
<input className="input" placeholder="..." />
<textarea className="input" />

// ✅ CERTO — com ícone interno
<div style={{ position: "relative" }}>
  <Search style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 14, color: "var(--text-3)" }} />
  <input className="input" style={{ paddingLeft: 32 }} />
</div>
```

---

### 3.4 Badges / Status
```jsx
// ✅ CERTO
<span className="badge badge-green">Ativo</span>
<span className="badge badge-red">Expirado</span>
<span className="badge badge-yellow">Pendente</span>
<span className="badge badge-blue">Info</span>
<span className="badge badge-neutral">Neutro</span>

// ❌ ERRADO
<Badge className="bg-purple-500 text-white">...</Badge>
<span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">...</span>
```

---

### 3.5 Ícones de Seção (ícone + título)
```jsx
// ✅ CERTO — padrão obrigatório para todo título de página
<div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--accent-light)", border: "1px solid var(--blue-bd)", display: "flex", alignItems: "center", justifyContent: "center" }}>
  <SeuIcone style={{ width: 18, height: 18, color: "var(--accent)" }} />
</div>

// Para ícones de status/outros contextos use o trio correto:
// Verde:    background: var(--green-bg), border: 1px solid var(--green-bd), color: var(--green)
// Vermelho: background: var(--red-bg),   border: 1px solid var(--red-bd),   color: var(--red)
// Amarelo:  background: var(--yellow-bg),border: 1px solid var(--yellow-bd),color: var(--yellow)
```

---

### 3.6 Tabs (navegação por abas)
```jsx
// ✅ CERTO — padrão de tabs interno
<div style={{ display: "flex", borderBottom: "1px solid var(--border)", padding: "0 20px" }}>
  {["aba1", "aba2"].map(tab => (
    <button
      key={tab}
      onClick={() => setActiveTab(tab)}
      style={{
        padding: "13px 16px", fontSize: 13, fontWeight: 500, border: "none", background: "none",
        cursor: "pointer",
        borderBottom: activeTab === tab ? "2px solid var(--accent)" : "2px solid transparent",
        color: activeTab === tab ? "var(--accent)" : "var(--text-2)",
        marginBottom: -1,
      }}
    >
      {tab}
    </button>
  ))}
</div>
```

---

### 3.7 Tabelas
```jsx
// ✅ CERTO
<table className="table-base">
  <thead>
    <tr>
      <th>Nome</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>...</td><td>...</td></tr>
  </tbody>
</table>
```

---

### 3.8 Cabeçalho de Página
Todo `h1` de página deve seguir este padrão:
```jsx
<div style={{ marginBottom: 24 }}>
  <h1 style={{
    fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22,
    color: "var(--text-1)", letterSpacing: "-0.02em", margin: 0,
    display: "flex", alignItems: "center", gap: 12
  }}>
    <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--accent-light)", border: "1px solid var(--blue-bd)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <SeuIcone style={{ width: 18, height: 18, color: "var(--accent)" }} />
    </div>
    Nome da Página
  </h1>
  <p style={{ marginTop: 4, color: "var(--text-2)", fontSize: 13, margin: 0 }}>
    Subtítulo descritivo
  </p>
</div>
```

---

### 3.9 Grid de KPIs / Métricas
```jsx
<div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
  <div className="app-card" style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
    <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--blue-bg)", border: "1px solid var(--blue-bd)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Icone style={{ width: 18, height: 18, color: "var(--accent)" }} />
    </div>
    <div>
      <p style={{ fontSize: 24, fontWeight: 700, color: "var(--text-1)", margin: 0, lineHeight: 1 }}>42</p>
      <p style={{ fontSize: 11, color: "var(--text-3)", margin: 0, marginTop: 2 }}>Label</p>
    </div>
  </div>
</div>
```

---

## 4. LAYOUT

### Wrapper de página
```jsx
// ✅ CERTO — toda página usa este wrapper
<div style={{ minHeight: "100vh", background: "var(--bg)" }}>
  <div style={{ maxWidth: 1280, margin: "0 auto" }}>
    {/* conteúdo */}
  </div>
</div>
```

### Espaçamento entre seções
- Entre cards/seções: `gap: 16px` (padrão) ou `gap: 24px` (espaçoso)
- Padding interno de cards: `padding: 20px` (padrão) ou `padding: 24px` (grande)
- Margin bottom de título de página: `marginBottom: 24px`

---

## 5. ESTADOS VISUAIS

### Loading
```jsx
<div className="skeleton" style={{ height: 90, borderRadius: "var(--r-md)" }} />
```

### Empty State
```jsx
<div style={{ textAlign: "center", padding: "48px 24px", background: "var(--surface)", border: "1px dashed var(--border-2)", borderRadius: "var(--r-lg)" }}>
  <Icone style={{ width: 36, height: 36, margin: "0 auto 12px", color: "var(--text-3)" }} />
  <p style={{ fontWeight: 600, color: "var(--text-1)", margin: 0 }}>Título do estado vazio</p>
  <p style={{ fontSize: 13, color: "var(--text-2)", marginTop: 4 }}>Descrição de ação</p>
</div>
```

### Selecionado/Ativo
```jsx
// Card selecionado
border: "1.5px solid var(--accent)"
background: "var(--accent-light)"
boxShadow: "0 0 0 3px var(--accent-glow)"
```

---

## 6. ❌ ABSOLUTAMENTE PROIBIDO

| Proibido | Substituir por |
|---|---|
| Qualquer cor roxa/violet/purple | `var(--accent)` azul |
| `bg-neutral-900`, `bg-neutral-800` | Sem dark mode na interface interna |
| Cores hardcoded `#XXXXXX` em JSX | Tokens CSS `var(--...)` |
| `className="bg-white rounded-xl shadow-md"` | `className="app-card"` |
| Gradientes coloridos em headers | Fundo `var(--card)` ou `var(--surface)` |
| Botões com cores fora do sistema | Apenas `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-ghost` |
| Prop `theme="dark"` ou `isDark` | Não existe modo escuro na interface interna |
| `text-white` em textos de cards | `color: var(--text-1)` |
| `border-neutral-700`, `border-neutral-800` | `border: 1px solid var(--border)` |

---

## 7. RAIO DE BORDA (border-radius)

| Token | Valor | Uso |
|---|---|---|
| `var(--r-sm)` | 6px | Badges, tags pequenas |
| `var(--r-md)` | 10px | Botões, inputs, chips |
| `var(--r-lg)` | 14px | Cards, modais, painéis |
| `var(--r-xl)` | 18px | Cards grandes, banners |
| `var(--r-full)` | 9999px | Badges arredondados, avatares |

---

## 8. SOMBRAS

| Token | Uso |
|---|---|
| `var(--sh-xs)` | Cards em repouso (padrão) |
| `var(--sh-sm)` | Cards com hover suave |
| `var(--sh-md)` | Cards com hover elevado, dropdowns |
| `var(--sh-lg)` | Modais, painéis flutuantes |
| `var(--sh-xl)` | Toasts, overlays |

---

## 9. ANIMAÇÕES

```jsx
// Entrada de página/elemento
<motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>

// Ou via classe CSS
className="anim-fade-up"   // fade + subida
className="anim-fade-in"   // apenas fade
className="anim-scale-in"  // escala + fade
```

---

## 10. CHECKLIST ANTES DE ENTREGAR UMA PÁGINA

- [ ] Fundo da página usa `var(--bg)` (`#F1F5F9`)
- [ ] Cards usam `app-card` ou `card` com `var(--card)` + `var(--border)`
- [ ] Títulos H1 seguem o padrão com ícone azul + Syne 22px
- [ ] Botões usam `.btn .btn-primary` (azul) ou `.btn .btn-secondary` (branco)
- [ ] Nenhum roxo/purple em qualquer elemento
- [ ] Badges usam `.badge .badge-{cor}` do design system
- [ ] Textos usam `var(--text-1/2/3)` — sem `text-white` ou `text-gray-*`
- [ ] Bordas usam `var(--border)` ou `var(--border-2)`
- [ ] Ícones de destaque usam fundo `var(--accent-light)` + ícone `var(--accent)`
- [ ] Sem prop `isDark` ou `theme="dark"` em componentes internos