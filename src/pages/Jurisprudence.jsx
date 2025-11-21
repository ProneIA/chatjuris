import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ProGuard from "../components/common/ProGuard";
import { Button } from "@/components/ui/button";
import { Search, Sparkles, BookOpen, Star, Plus } from "lucide-react";
import JurisprudenceSearch from "../components/jurisprudence/JurisprudenceSearch";
import JurisprudenceList from "../components/jurisprudence/JurisprudenceList";
import JurisprudenceDetails from "../components/jurisprudence/JurisprudenceDetails";

export default function Jurisprudence() {
  const [showSearch, setShowSearch] = useState(true);
  const [selectedJurisprudence, setSelectedJurisprudence] = useState(null);
  const [filterCourt, setFilterCourt] = useState("all");
  const [filterFavorites, setFilterFavorites] = useState(false);
  const queryClient = useQueryClient();

  const { data: jurisprudences = [], isLoading } = useQuery({
    queryKey: ['jurisprudences'],
    queryFn: () => base44.entities.Jurisprudence.list('-created_date'),
  });

  const { data: cases = [] } = useQuery({
    queryKey: ['cases'],
    queryFn: () => base44.entities.Case.list('title'),
  });

  const createJurisprudenceMutation = useMutation({
    mutationFn: (data) => base44.entities.Jurisprudence.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jurisprudences'] });
    },
  });

  const updateJurisprudenceMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Jurisprudence.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jurisprudences'] });
    },
  });

  const deleteJurisprudenceMutation = useMutation({
    mutationFn: (id) => base44.entities.Jurisprudence.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jurisprudences'] });
      setSelectedJurisprudence(null);
    },
  });

  const filteredJurisprudences = jurisprudences.filter(j => {
    const courtMatch = filterCourt === "all" || j.court === filterCourt;
    const favoriteMatch = !filterFavorites || j.is_favorite;
    return courtMatch && favoriteMatch;
  });

  const stats = {
    total: jurisprudences.length,
    stf: jurisprudences.filter(j => j.court === 'STF').length,
    stj: jurisprudences.filter(j => j.court === 'STJ').length,
    favorites: jurisprudences.filter(j => j.is_favorite).length,
  };

  return (
    <ProGuard featureName="Pesquisa de Jurisprudência">
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200 px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Pesquisa de Jurisprudência</h1>
            <p className="text-slate-600 mt-1">
              Busque decisões nos principais tribunais brasileiros com IA
            </p>
          </div>
          <Button
            onClick={() => setShowSearch(!showSearch)}
            className="bg-gradient-to-r from-blue-600 to-purple-600"
          >
            {showSearch ? (
              <>
                <BookOpen className="w-4 h-4 mr-2" />
                Ver Biblioteca
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Nova Pesquisa
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
            <p className="text-sm text-blue-600 font-medium">Total Salvas</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">{stats.total}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
            <p className="text-sm text-purple-600 font-medium">STF</p>
            <p className="text-2xl font-bold text-purple-900 mt-1">{stats.stf}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
            <p className="text-sm text-green-600 font-medium">STJ</p>
            <p className="text-2xl font-bold text-green-900 mt-1">{stats.stj}</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4">
            <p className="text-sm text-yellow-600 font-medium">Favoritas</p>
            <p className="text-2xl font-bold text-yellow-900 mt-1">{stats.favorites}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        <div className="flex-1 overflow-y-auto p-6">
          {showSearch ? (
            <JurisprudenceSearch
              cases={cases}
              onSave={(data) => createJurisprudenceMutation.mutate(data)}
            />
          ) : (
            <JurisprudenceList
              jurisprudences={filteredJurisprudences}
              isLoading={isLoading}
              onSelect={setSelectedJurisprudence}
              selectedJurisprudence={selectedJurisprudence}
              filterCourt={filterCourt}
              setFilterCourt={setFilterCourt}
              filterFavorites={filterFavorites}
              setFilterFavorites={setFilterFavorites}
            />
          )}
        </div>

        {selectedJurisprudence && !showSearch && (
          <JurisprudenceDetails
            jurisprudence={selectedJurisprudence}
            cases={cases}
            onClose={() => setSelectedJurisprudence(null)}
            onUpdate={(data) => updateJurisprudenceMutation.mutate({
              id: selectedJurisprudence.id,
              data
            })}
            onDelete={() => {
              if (confirm('Deseja excluir esta jurisprudência?')) {
                deleteJurisprudenceMutation.mutate(selectedJurisprudence.id);
              }
            }}
          />
        )}
      </div>
    </div>
    </ProGuard>
  );
}