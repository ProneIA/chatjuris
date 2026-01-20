import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Star } from "lucide-react";
import TemplateList from "../components/templates/TemplateList";
import TemplateForm from "../components/templates/TemplateForm";
import TemplateDetails from "../components/templates/TemplateDetails";

export default function Templates({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [filterCategory, setFilterCategory] = useState("all");
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.Template.list('-created_date'),
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
      template.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
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
    <div className={`h-full flex ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className={`border-b px-6 py-6 ${isDark ? 'bg-black border-neutral-800' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className={`text-2xl font-light ${isDark ? 'text-white' : 'text-gray-900'}`}>Modelos de Peças</h1>
              <p className={`mt-1 ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Modelos de documentos jurídicos</p>
            </div>
            <Button
              onClick={() => {
                setShowForm(true);
                setEditingTemplate(null);
                setSelectedTemplate(null);
              }}
              className={isDark ? 'bg-white text-black hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'}
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Modelo
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className={`border rounded-lg p-4 ${isDark ? 'border-neutral-800 bg-neutral-900' : 'border-gray-200 bg-white'}`}>
              <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Total de Modelos</p>
              <p className={`text-2xl font-light mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{templates.length}</p>
            </div>
            <div className={`border rounded-lg p-4 ${isDark ? 'border-neutral-800 bg-neutral-900' : 'border-gray-200 bg-white'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Favoritos</p>
              </div>
              <p className={`text-2xl font-light ${isDark ? 'text-white' : 'text-gray-900'}`}>{favoriteTemplates}</p>
            </div>
          </div>

          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDark ? 'text-neutral-500' : 'text-gray-400'}`} />
            <Input
              placeholder="Buscar modelos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 ${isDark ? 'bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-600' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'}`}
            />
          </div>
        </div>

        <div className={`flex-1 overflow-y-auto p-6 ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
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