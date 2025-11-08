import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scale, FileText, Sparkles, Search } from "lucide-react";

export default function CaseSummarizerDialog({ open, onClose, cases, onSummarize }) {
  const [tab, setTab] = useState("existing");
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [manualCase, setManualCase] = useState({
    case_number: "",
    title: "",
    court: "",
    area: "",
    client_name: "",
    opposing_party: "",
    description: "",
    value: "",
    status: "",
    priority: ""
  });

  const selectedCase = cases.find(c => c.id === selectedCaseId);

  const filteredCases = cases.filter(c =>
    c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.case_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = () => {
    if (tab === "existing" && selectedCase) {
      onSummarize(selectedCase);
    } else if (tab === "manual") {
      onSummarize(manualCase);
    }
    onClose();
    // Reset
    setSelectedCaseId("");
    setSearchTerm("");
    setManualCase({
      case_number: "",
      title: "",
      court: "",
      area: "",
      client_name: "",
      opposing_party: "",
      description: "",
      value: "",
      status: "",
      priority: ""
    });
  };

  const areaLabels = {
    civil: "Civil",
    criminal: "Criminal",
    trabalhista: "Trabalhista",
    tributario: "Tributário",
    familia: "Família",
    empresarial: "Empresarial",
    consumidor: "Consumidor",
    previdenciario: "Previdenciário",
    outros: "Outros"
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl">Resumir Processo Judicial</DialogTitle>
              <DialogDescription>
                Selecione um processo existente ou insira os dados manualmente
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing">
              <FileText className="w-4 h-4 mr-2" />
              Processos Cadastrados
            </TabsTrigger>
            <TabsTrigger value="manual">
              <Sparkles className="w-4 h-4 mr-2" />
              Inserir Manualmente
            </TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar por título, número ou cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredCases.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>Nenhum processo encontrado</p>
                </div>
              ) : (
                filteredCases.map((caseItem) => (
                  <Card
                    key={caseItem.id}
                    className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                      selectedCaseId === caseItem.id
                        ? 'ring-2 ring-purple-500 bg-purple-50'
                        : 'hover:bg-slate-50'
                    }`}
                    onClick={() => setSelectedCaseId(caseItem.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900 mb-1">{caseItem.title}</h4>
                        <div className="space-y-1 text-sm text-slate-600">
                          {caseItem.case_number && (
                            <p>Processo: {caseItem.case_number}</p>
                          )}
                          {caseItem.client_name && (
                            <p>Cliente: {caseItem.client_name}</p>
                          )}
                          {caseItem.court && (
                            <p>Vara: {caseItem.court}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <Badge variant="secondary">
                          {areaLabels[caseItem.area] || caseItem.area}
                        </Badge>
                        {caseItem.priority === 'urgent' && (
                          <Badge className="bg-red-100 text-red-800">Urgente</Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="case_number">Número do Processo</Label>
                <Input
                  id="case_number"
                  value={manualCase.case_number}
                  onChange={(e) => setManualCase({ ...manualCase, case_number: e.target.value })}
                  placeholder="Ex: 0001234-56.2024.8.09.0001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Título do Caso</Label>
                <Input
                  id="title"
                  value={manualCase.title}
                  onChange={(e) => setManualCase({ ...manualCase, title: e.target.value })}
                  placeholder="Ex: Ação de Cobrança"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="area">Área do Direito</Label>
                <Select
                  value={manualCase.area}
                  onValueChange={(v) => setManualCase({ ...manualCase, area: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="civil">Civil</SelectItem>
                    <SelectItem value="criminal">Criminal</SelectItem>
                    <SelectItem value="trabalhista">Trabalhista</SelectItem>
                    <SelectItem value="tributario">Tributário</SelectItem>
                    <SelectItem value="familia">Família</SelectItem>
                    <SelectItem value="empresarial">Empresarial</SelectItem>
                    <SelectItem value="consumidor">Consumidor</SelectItem>
                    <SelectItem value="previdenciario">Previdenciário</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="court">Vara/Tribunal</Label>
                <Input
                  id="court"
                  value={manualCase.court}
                  onChange={(e) => setManualCase({ ...manualCase, court: e.target.value })}
                  placeholder="Ex: 1ª Vara Cível"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_name">Cliente</Label>
                <Input
                  id="client_name"
                  value={manualCase.client_name}
                  onChange={(e) => setManualCase({ ...manualCase, client_name: e.target.value })}
                  placeholder="Nome do cliente"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="opposing_party">Parte Contrária</Label>
                <Input
                  id="opposing_party"
                  value={manualCase.opposing_party}
                  onChange={(e) => setManualCase({ ...manualCase, opposing_party: e.target.value })}
                  placeholder="Nome da parte contrária"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="value">Valor da Causa (R$)</Label>
                <Input
                  id="value"
                  type="number"
                  value={manualCase.value}
                  onChange={(e) => setManualCase({ ...manualCase, value: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={manualCase.status}
                  onValueChange={(v) => setManualCase({ ...manualCase, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Novo</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="waiting">Aguardando</SelectItem>
                    <SelectItem value="closed">Encerrado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição do Caso</Label>
              <Textarea
                id="description"
                value={manualCase.description}
                onChange={(e) => setManualCase({ ...manualCase, description: e.target.value })}
                rows={4}
                placeholder="Descreva os fatos, argumentos principais, pedidos e qualquer informação relevante sobre o processo..."
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              (tab === "existing" && !selectedCaseId) ||
              (tab === "manual" && !manualCase.title && !manualCase.case_number)
            }
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Gerar Resumo com IA
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}