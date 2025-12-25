import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Save, Tag } from "lucide-react";
import { toast } from "sonner";

export default function SaveCalculationDialog({ 
  open, 
  onOpenChange, 
  calculatorType, 
  legalArea, 
  inputData, 
  resultData,
  isDraft = false 
}) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.SavedCalculation.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-calculations"] });
      toast.success(isDraft ? "Rascunho salvo com sucesso" : "Cálculo salvo com sucesso");
      onOpenChange(false);
      setTitle("");
      setNotes("");
      setTags("");
    },
  });

  const handleSave = () => {
    if (!title.trim()) {
      toast.error("Digite um título para o cálculo");
      return;
    }

    const tagsArray = tags.split(",").map(t => t.trim()).filter(t => t);

    saveMutation.mutate({
      title: title.trim(),
      calculator_type: calculatorType,
      legal_area: legalArea,
      input_data: inputData,
      result_data: resultData,
      status: isDraft ? "draft" : "completed",
      notes: notes.trim(),
      tags: tagsArray
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isDraft ? "Salvar como Rascunho" : "Salvar Cálculo"}
          </DialogTitle>
          <DialogDescription>
            {isDraft 
              ? "Salve o cálculo como rascunho para continuar depois"
              : "Salve este cálculo para acessá-lo posteriormente"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              placeholder="Ex: Rescisão João Silva"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Adicione observações sobre este cálculo..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                <span>Tags (opcional)</span>
              </div>
            </Label>
            <Input
              id="tags"
              placeholder="Separe tags por vírgula: urgente, cliente x"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Use tags para organizar e encontrar seus cálculos facilmente
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="bg-gray-900 hover:bg-gray-800"
          >
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}