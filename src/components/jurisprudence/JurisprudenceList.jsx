import React from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, ExternalLink, Calendar, BookOpen } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const courtColors = {
  STF: "bg-blue-100 text-blue-800",
  STJ: "bg-purple-100 text-purple-800",
  TST: "bg-green-100 text-green-800",
  TSE: "bg-yellow-100 text-yellow-800",
  STM: "bg-red-100 text-red-800",
  TRF: "bg-indigo-100 text-indigo-800",
  TJ: "bg-pink-100 text-pink-800",
  TRT: "bg-orange-100 text-orange-800",
  outros: "bg-gray-100 text-gray-800"
};

export default function JurisprudenceList({
  jurisprudences,
  isLoading,
  onSelect,
  selectedJurisprudence,
  filterCourt,
  setFilterCourt,
  filterFavorites,
  setFilterFavorites
}) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <Select value={filterCourt} onValueChange={setFilterCourt}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tribunais</SelectItem>
            <SelectItem value="STF">STF</SelectItem>
            <SelectItem value="STJ">STJ</SelectItem>
            <SelectItem value="TST">TST</SelectItem>
            <SelectItem value="TSE">TSE</SelectItem>
            <SelectItem value="TRF">TRF</SelectItem>
            <SelectItem value="TJ">TJ</SelectItem>
            <SelectItem value="TRT">TRT</SelectItem>
            <SelectItem value="outros">Outros</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Switch
            checked={filterFavorites}
            onCheckedChange={setFilterFavorites}
          />
          <span className="text-sm text-slate-600">Apenas favoritas</span>
        </div>
      </div>

      {/* List */}
      {jurisprudences.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Nenhuma jurisprudência encontrada
          </h3>
          <p className="text-slate-600">
            {filterFavorites
              ? "Você ainda não marcou nenhuma jurisprudência como favorita"
              : "Faça uma pesquisa para começar sua biblioteca"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {jurisprudences.map((jurisprudence) => {
            const isSelected = selectedJurisprudence?.id === jurisprudence.id;

            return (
              <motion.div
                key={jurisprudence.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Card
                  onClick={() => onSelect(jurisprudence)}
                  className={cn(
                    "p-4 cursor-pointer transition-all hover:shadow-md",
                    isSelected ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-slate-900 line-clamp-2">
                          {jurisprudence.title}
                        </h3>
                        {jurisprudence.is_favorite && (
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 shrink-0" />
                        )}
                      </div>
                      {jurisprudence.case_number && (
                        <p className="text-xs text-slate-500 font-mono mb-2">
                          {jurisprudence.case_number}
                        </p>
                      )}
                      {jurisprudence.summary && (
                        <p className="text-sm text-slate-600 line-clamp-2">
                          {jurisprudence.summary}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={courtColors[jurisprudence.court]}>
                      {jurisprudence.court}
                    </Badge>

                    {jurisprudence.decision_date && (
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(jurisprudence.decision_date), "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                    )}

                    {jurisprudence.relevance_score && (
                      <Badge variant="outline" className="text-xs">
                        Relevância: {jurisprudence.relevance_score}%
                      </Badge>
                    )}

                    {jurisprudence.tags && jurisprudence.tags.length > 0 && (
                      <div className="flex gap-1">
                        {jurisprudence.tags.slice(0, 2).map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}