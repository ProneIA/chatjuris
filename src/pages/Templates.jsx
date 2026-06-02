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
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--surface)' }}>
      <div className="flex-1 flex flex-col">
        <div style={{ borderBottom: '1px solid var(--border)', padding: '16px 24px', background: 'var(--main-bg)' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-primary)' }}>Modelos de Peças</h1>
              <p style={{ marginTop: 4, color: 'var(--text-secondary)', fontSize: 13 }}>Modelos de documentos jurídicos</p>
            </div>
            <Button
              onClick={() => {
                setShowForm(true);
                setEditingTemplate(null);
                setSelectedTemplate(null);
              }}
              className="btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Modelo
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 16, background: 'var(--main-bg)', borderBottom: '3px solid var(--info)' }}>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-secondary)' }}>Total de Modelos</p>
              <p style={{ fontSize: 34, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>{templates.length}</p>
            </div>
            <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 16, background: 'var(--main-bg)', borderBottom: '3px solid var(--accent)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Star className="w-4 h-4" style={{ color: 'var(--accent)', fill: 'var(--accent)' }} />
                <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-secondary)' }}>Favoritos</p>
              </div>
              <p style={{ fontSize: 34, fontWeight: 700, color: 'var(--text-primary)' }}>{favoriteTemplates}</p>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <Input
              placeholder="Buscar modelos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 24, background: 'var(--surface)' }}>
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