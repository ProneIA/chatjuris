import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { 
  History, 
  Search, 
  Trash2, 
  FileText, 
  Clock,
  Tag,
  Filter,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function CalculationHistory({ isDark, onLoadCalculation, currentArea, currentType }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const queryClient = useQueryClient();

  const { data: calculations = [] } = useQuery({
    queryKey: ["saved-calculations"],
    queryFn: () => base44.entities.SavedCalculation.list("-created_date", 50),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SavedCalculation.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-calculations"] });
      toast.success("Cálculo excluído");
    },
  });

  const filteredCalculations = calculations.filter(calc => {
    const matchesSearch = 
      calc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      calc.calculator_type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || calc.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const calculatorTypeLabels = {
    juros: "Juros e Correção",
    trabalhista: "Trabalhista",
    civil: "Civil",
    penal: "Penal",
    tributario: "Tributário",
    familia: "Família",
    consumidor: "Consumidor",
    honorarios: "Honorários",
    prazos: "Prazos",
    custas: "Custas",
    atualizacao: "Atualização",
    indenizacao: "Indenizações",
    previdenciario: "Previdenciário",
    liquidacao: "Liquidação"
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <History className={`w-5 h-5 ${isDark ? "text-neutral-400" : "text-gray-600"}`} />
        <h3 className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
          Histórico de Cálculos
        </h3>
      </div>

      {/* Search and Filter */}
      <div className="space-y-2">
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-neutral-500" : "text-gray-400"}`} />
          <Input
            placeholder="Buscar cálculos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`pl-9 ${isDark ? "bg-neutral-900 border-neutral-800" : ""}`}
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant={filterStatus === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("all")}
            className={filterStatus === "all" ? "bg-gray-900" : ""}
          >
            Todos
          </Button>
          <Button
            variant={filterStatus === "completed" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("completed")}
            className={filterStatus === "completed" ? "bg-gray-900" : ""}
          >
            Completos
          </Button>
          <Button
            variant={filterStatus === "draft" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("draft")}
            className={filterStatus === "draft" ? "bg-gray-900" : ""}
          >
            Rascunhos
          </Button>
        </div>
      </div>

      {/* Calculations List */}
      <ScrollArea className="h-[400px]">
        <div className="space-y-2 pr-4">
          <AnimatePresence>
            {filteredCalculations.length === 0 ? (
              <div className={`text-center py-12 ${isDark ? "text-neutral-500" : "text-gray-400"}`}>
                <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum cálculo encontrado</p>
              </div>
            ) : (
              filteredCalculations.map((calc) => (
                <motion.div
                  key={calc.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Card 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isDark ? "bg-neutral-900 border-neutral-800 hover:border-neutral-700" : "hover:border-gray-400"
                    }`}
                    onClick={() => onLoadCalculation(calc)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <FileText className={`w-4 h-4 flex-shrink-0 ${isDark ? "text-neutral-400" : "text-gray-500"}`} />
                            <h4 className={`font-medium truncate ${isDark ? "text-white" : "text-gray-900"}`}>
                              {calc.title || "Cálculo sem título"}
                            </h4>
                          </div>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              isDark ? "bg-neutral-800 text-neutral-300" : "bg-gray-100 text-gray-600"
                            }`}>
                              {calculatorTypeLabels[calc.calculator_type] || calc.calculator_type}
                            </span>
                            {calc.status === "draft" && (
                              <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700">
                                Rascunho
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs">
                            <span className={`flex items-center gap-1 ${isDark ? "text-neutral-500" : "text-gray-500"}`}>
                              <Clock className="w-3 h-3" />
                              {format(new Date(calc.created_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </span>
                            {calc.tags && calc.tags.length > 0 && (
                              <span className={`flex items-center gap-1 ${isDark ? "text-neutral-500" : "text-gray-500"}`}>
                                <Tag className="w-3 h-3" />
                                {calc.tags.slice(0, 2).join(", ")}
                              </span>
                            )}
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="flex-shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMutation.mutate(calc.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {calc.notes && (
                        <p className={`text-xs mt-2 line-clamp-2 ${isDark ? "text-neutral-400" : "text-gray-500"}`}>
                          {calc.notes}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}