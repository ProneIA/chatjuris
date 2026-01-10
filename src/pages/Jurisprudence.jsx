import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Search, BookOpen } from "lucide-react";
import JurisprudenceSearch from "../components/jurisprudence/JurisprudenceSearch";
import JurisprudenceList from "../components/jurisprudence/JurisprudenceList";
import JurisprudenceDetails from "../components/jurisprudence/JurisprudenceDetails";

export default function Jurisprudence({ theme = 'light' }) {
  const isDark = theme === 'dark';
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
    <div className={`h-full flex flex-col ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
      <div className={`border-b px-6 py-6 ${isDark ? 'bg-black border-neutral-800' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className={`text-2xl font-light ${isDark ? 'text-white' : 'text-gray-900'}`}>Pesquisa de Jurisprudência</h1>
            <p className={`mt-1 ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
              Busque decisões nos principais tribunais brasileiros com IA
            </p>
          </div>
          <Button
            onClick={() => setShowSearch(!showSearch)}
            className={isDark ? 'bg-white text-black hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'}
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
          <div className="border border-gray-200 rounded-lg p-4 bg-white">
            <p className="text-sm text-gray-600">Total Salvas</p>
            <p className="text-2xl font-light text-gray-900 mt-1">{stats.total}</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 bg-white">
            <p className="text-sm text-gray-600">STF</p>
            <p className="text-2xl font-light text-gray-900 mt-1">{stats.stf}</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 bg-white">
            <p className="text-sm text-gray-600">STJ</p>
            <p className="text-2xl font-light text-gray-900 mt-1">{stats.stj}</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 bg-white">
            <p className="text-sm text-gray-600">Favoritas</p>
            <p className="text-2xl font-light text-gray-900 mt-1">{stats.favorites}</p>
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
  );
}