import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Star } from "lucide-react";
import TemplateList from "../components/templates/TemplateList";
import TemplateForm from "../components/templates/TemplateForm";
import TemplateDetails from "../components/templates/TemplateDetails";
import { useDebounce } from "@/components/common/useDebounce";

export default function Templates() {
  const isDark = false;
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);
  const [showForm, setShowForm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [filterCategory, setFilterCategory] = useState("all");
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.Template.filter({ created_by: user.email }, '-created_date', 100);
    },
    enabled: !!user?.email
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Template.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setShowForm(false);
      setEditingTemplate(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Template.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setShowForm(false);
      setEditingTemplate(null);
      setSelectedTemplate(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Template.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setSelectedTemplate(null);
    },
  });

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = 
      template.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      template.description?.toLowerCase().includes(debouncedSearch.toLowerCase());
    
    const matchesCategory = filterCategory === "all" || template.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  const handleSubmit = (data) => {
    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setShowForm(true);
    setSelectedTemplate(null);
  };

  const favoriteTemplates = templates.filter(t => t.is_favorite).length;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--surface)', fontFamily: 'var(--font-sans)' }}>

      {/* ── Cabeçalho editorial ── */}
      <div style={{ background: "var(--white)", borderBottom: "1px solid var(--ink-6)", padding: "28px 32px 24px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
          <div>
            <p style={{ fontSize: 11, color: "var(--ink-4)", fontWeight: 400, marginBottom: 4, letterSpacing: "0.02em" }}>Ferramentas</p>
            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 600, fontSize: 28, color: "var(--ink)", letterSpacing: "-0.02em", lineHeight: 1.2, margin: 0 }}>
              Modelos de Peças
            </h1>
            <p style={{ marginTop: 6, fontSize: 11, color: "var(--ink-4)" }}>Modelos de documentos jurídicos prontos para uso</p>
          </div>
          <button className="btn-primary" onClick={() => { setShowForm(true); setEditingTemplate(null); setSelectedTemplate(null); }}>
            <Plus style={{ width: 14, height: 14 }} />
            Novo Modelo
          </button>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", background: "var(--ink-6)", gap: 1, borderBottom: "1px solid var(--ink-6)" }}>
        <div style={{ background: "var(--white)", padding: "20px 22px 18px", borderBottom: "2px solid var(--ink)" }}>
          <p style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--ink-4)", margin: "0 0 12px" }}>Total de Modelos</p>
          <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 36, fontWeight: 600, lineHeight: 1, color: "var(--ink)", letterSpacing: "-0.04em" }}>{templates.length}</span>
        </div>
        <div style={{ background: "var(--white)", padding: "20px 22px 18px", borderBottom: "2px solid var(--warn)" }}>
          <p style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--ink-4)", margin: "0 0 12px" }}>Favoritos</p>
          <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 36, fontWeight: 600, lineHeight: 1, color: "var(--ink)", letterSpacing: "-0.04em" }}>{favoriteTemplates}</span>
        </div>
      </div>

      {/* ── Search ── */}
      <div style={{ background: "var(--white)", borderBottom: "1px solid var(--ink-6)", padding: "12px 28px" }}>
        <div style={{ position: "relative", maxWidth: 480 }}>
          <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "var(--ink-4)" }} />
          <input
            placeholder="Buscar modelos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: "100%", paddingLeft: 36, paddingRight: 12, paddingTop: 8, paddingBottom: 8, border: "1px solid var(--ink-5)", background: "var(--white)", fontSize: 12, fontFamily: "var(--font-sans)", outline: "none", color: "var(--ink)" }}
          />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px 24px', background: 'var(--surface)' }}>
          {showForm ? (
            <TemplateForm
              template={editingTemplate}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingTemplate(null);
              }}
              isLoading={createMutation.isPending || updateMutation.isPending}
            />
          ) : (
            <TemplateList
              templates={filteredTemplates}
              isLoading={isLoading}
              onSelectTemplate={setSelectedTemplate}
              selectedTemplate={selectedTemplate}
            />
          )}
        </div>
      {selectedTemplate && !showForm && (
        <TemplateDetails
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          onEdit={handleEdit}
          onDelete={() => deleteMutation.mutate(selectedTemplate.id)}
          onToggleFavorite={(isFavorite) => 
            updateMutation.mutate({ 
              id: selectedTemplate.id, 
              data: { ...selectedTemplate, is_favorite: isFavorite } 
            })
          }
        />
      )}
    </div>
  );
}