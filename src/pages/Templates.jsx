import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Star } from "lucide-react";
import TemplateList from "../components/templates/TemplateList";
import TemplateForm from "../components/templates/TemplateForm";
import TemplateDetails from "../components/templates/TemplateDetails";

export default function Templates() {
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
    <div className="h-full flex bg-neutral-950 min-h-screen">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-black border-b border-gray-800 px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-light text-white">Templates</h1>
              <p className="text-gray-500 mt-1">Modelos de documentos jurídicos</p>
            </div>
            <Button
              onClick={() => {
                setShowForm(true);
                setEditingTemplate(null);
                setSelectedTemplate(null);
              }}
              className="bg-white text-black hover:bg-gray-100"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Template
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="border border-gray-800 rounded-lg p-4 hover:border-gray-600 transition-colors">
              <p className="text-sm text-gray-500 font-medium">Total de Templates</p>
              <p className="text-2xl font-light text-white mt-1">{templates.length}</p>
            </div>
            <div className="border border-gray-800 rounded-lg p-4 hover:border-gray-600 transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-4 h-4 text-gray-400" />
                <p className="text-sm text-gray-500 font-medium">Favoritos</p>
              </div>
              <p className="text-2xl font-light text-white">{favoriteTemplates}</p>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Buscar templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-900 border-gray-800 text-white placeholder:text-gray-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-neutral-950">
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