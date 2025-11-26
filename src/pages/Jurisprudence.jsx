import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Search, BookOpen } from "lucide-react";
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
    <div className="h-full flex flex-col bg-neutral-950">
      <div className="bg-black border-b border-neutral-800 px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-light text-white">Pesquisa de Jurisprudência</h1>
            <p className="text-neutral-500 mt-1">
              Busque decisões nos principais tribunais brasileiros com IA
            </p>
          </div>
          <Button
            onClick={() => setShowSearch(!showSearch)}
            className="bg-white text-black hover:bg-gray-100"
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
          <div className="border border-neutral-800 rounded-lg p-4 bg-neutral-900">
            <p className="text-sm text-neutral-500">Total Salvas</p>
            <p className="text-2xl font-light text-white mt-1">{stats.total}</p>
          </div>
          <div className="border border-neutral-800 rounded-lg p-4 bg-neutral-900">
            <p className="text-sm text-neutral-500">STF</p>
            <p className="text-2xl font-light text-white mt-1">{stats.stf}</p>
          </div>
          <div className="border border-neutral-800 rounded-lg p-4 bg-neutral-900">
            <p className="text-sm text-neutral-500">STJ</p>
            <p className="text-2xl font-light text-white mt-1">{stats.stj}</p>
          </div>
          <div className="border border-neutral-800 rounded-lg p-4 bg-neutral-900">
            <p className="text-sm text-neutral-500">Favoritas</p>
            <p className="text-2xl font-light text-white mt-1">{stats.favorites}</p>
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