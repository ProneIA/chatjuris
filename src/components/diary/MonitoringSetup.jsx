import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Bell, 
  Plus, 
  X, 
  Trash2, 
  Search,
  Building2,
  Users,
  FileText,
  Loader2,
  Check
} from "lucide-react";
import { toast } from "sonner";

export default function MonitoringSetup({ open, onClose, isDark, monitorings, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    keywords: [],
    client_names: [],
    case_numbers: [],
    courts: [],
    is_active: true,
    notification_email: true
  });
  const [inputValues, setInputValues] = useState({
    keyword: "",
    client: "",
    case: "",
    court: ""
  });

  const addItem = (field, inputField) => {
    const value = inputValues[inputField].trim();
    if (value && !formData[field].includes(value)) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value]
      }));
      setInputValues(prev => ({ ...prev, [inputField]: "" }));
    }
  };

  const removeItem = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter(v => v !== value)
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Informe um nome para o monitoramento");
      return;
    }

    setIsLoading(true);
    try {
      await base44.entities.DiaryMonitoring.create(formData);
      toast.success("Monitoramento criado com sucesso!");
      onRefresh();
      setShowForm(false);
      setFormData({
        name: "",
        keywords: [],
        client_names: [],
        case_numbers: [],
        courts: [],
        is_active: true,
        notification_email: true
      });
    } catch (error) {
      toast.error("Erro ao criar monitoramento");
    }
    setIsLoading(false);
  };

  const deleteMonitoring = async (id) => {
    try {
      await base44.entities.DiaryMonitoring.delete(id);
      toast.success("Monitoramento excluído");
      onRefresh();
    } catch (error) {
      toast.error("Erro ao excluir");
    }
  };

  const toggleActive = async (monitoring) => {
    try {
      await base44.entities.DiaryMonitoring.update(monitoring.id, {
        is_active: !monitoring.is_active
      });
      onRefresh();
    } catch (error) {
      toast.error("Erro ao atualizar");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={`max-w-2xl max-h-[90vh] overflow-y-auto ${isDark ? 'bg-neutral-900 border-neutral-800' : ''}`}>
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-2 ${isDark ? 'text-white' : ''}`}>
            <Bell className="w-5 h-5 text-purple-500" />
            Monitoramentos Configurados
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Lista de Monitoramentos */}
          {monitorings.length > 0 && !showForm && (
            <div className="space-y-3">
              {monitorings.map(mon => (
                <div 
                  key={mon.id}
                  className={`p-4 rounded-xl border ${isDark ? 'bg-neutral-800/50 border-neutral-700' : 'bg-slate-50 border-slate-200'}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={mon.is_active}
                        onCheckedChange={() => toggleActive(mon)}
                      />
                      <h4 className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {mon.name}
                      </h4>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMonitoring(mon.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {mon.keywords?.map((kw, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        <Search className="w-3 h-3 mr-1" />
                        {kw}
                      </Badge>
                    ))}
                    {mon.client_names?.map((c, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        <Users className="w-3 h-3 mr-1" />
                        {c}
                      </Badge>
                    ))}
                    {mon.case_numbers?.map((c, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        <FileText className="w-3 h-3 mr-1" />
                        {c}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Form */}
          {showForm ? (
            <div className="space-y-4">
              <div>
                <label className={`text-sm font-medium mb-2 block ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                  Nome do Monitoramento
                </label>
                <Input
                  placeholder="Ex: Processos do Cliente X"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className={isDark ? 'bg-neutral-800 border-neutral-700 text-white' : ''}
                />
              </div>

              {/* Keywords */}
              <div>
                <label className={`text-sm font-medium mb-2 block ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                  Palavras-chave
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Adicionar palavra-chave"
                    value={inputValues.keyword}
                    onChange={(e) => setInputValues(prev => ({ ...prev, keyword: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && addItem('keywords', 'keyword')}
                    className={isDark ? 'bg-neutral-800 border-neutral-700 text-white' : ''}
                  />
                  <Button variant="outline" onClick={() => addItem('keywords', 'keyword')}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.keywords.map((kw, i) => (
                    <Badge key={i} className="gap-1">
                      {kw}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => removeItem('keywords', kw)} />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Client Names */}
              <div>
                <label className={`text-sm font-medium mb-2 block ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                  Nomes de Clientes
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nome do cliente para monitorar"
                    value={inputValues.client}
                    onChange={(e) => setInputValues(prev => ({ ...prev, client: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && addItem('client_names', 'client')}
                    className={isDark ? 'bg-neutral-800 border-neutral-700 text-white' : ''}
                  />
                  <Button variant="outline" onClick={() => addItem('client_names', 'client')}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.client_names.map((c, i) => (
                    <Badge key={i} variant="outline" className="gap-1">
                      <Users className="w-3 h-3" />
                      {c}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => removeItem('client_names', c)} />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Case Numbers */}
              <div>
                <label className={`text-sm font-medium mb-2 block ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                  Números de Processos
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="0000000-00.0000.0.00.0000"
                    value={inputValues.case}
                    onChange={(e) => setInputValues(prev => ({ ...prev, case: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && addItem('case_numbers', 'case')}
                    className={isDark ? 'bg-neutral-800 border-neutral-700 text-white' : ''}
                  />
                  <Button variant="outline" onClick={() => addItem('case_numbers', 'case')}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.case_numbers.map((c, i) => (
                    <Badge key={i} variant="outline" className="gap-1 font-mono text-xs">
                      {c}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => removeItem('case_numbers', c)} />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Options */}
              <div className="flex items-center justify-between py-2">
                <span className={`text-sm ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                  Receber notificações por email
                </span>
                <Switch
                  checked={formData.notification_email}
                  onCheckedChange={(v) => setFormData(prev => ({ ...prev, notification_email: v }))}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit} disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  Salvar Monitoramento
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => setShowForm(true)} className="w-full gap-2">
              <Plus className="w-4 h-4" />
              Criar Novo Monitoramento
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}