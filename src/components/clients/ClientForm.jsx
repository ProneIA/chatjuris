import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, ScanLine } from "lucide-react";
import DocumentScanner from "@/components/common/DocumentScanner";

export default function ClientForm({ client, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState(client || {
    name: "",
    cpf_cnpj: "",
    email: "",
    phone: "",
    address: "",
    marital_status: "",
    type: "individual",
    status: "active",
    notes: ""
  });
  const [showScanner, setShowScanner] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDocumentData = (data) => {
    setFormData(prev => ({
      ...prev,
      name: data.nome_completo || prev.name,
      cpf_cnpj: data.cpf || data.cnpj || prev.cpf_cnpj,
      address: data.endereco || prev.address
    }));
    setShowScanner(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone) {
      alert("⚠️ Preencha todos os campos obrigatórios");
      return;
    }
    
    const dataToSubmit = { ...formData };
    
    // Limpar campos vazios
    if (!dataToSubmit.cpf_cnpj || dataToSubmit.cpf_cnpj === "") delete dataToSubmit.cpf_cnpj;
    if (!dataToSubmit.email || dataToSubmit.email === "") delete dataToSubmit.email;
    if (!dataToSubmit.address || dataToSubmit.address === "") delete dataToSubmit.address;
    if (!dataToSubmit.marital_status || dataToSubmit.marital_status === "") delete dataToSubmit.marital_status;
    if (!dataToSubmit.notes || dataToSubmit.notes === "") delete dataToSubmit.notes;
    
    onSubmit(dataToSubmit);
  };

  return (
    <Card className="max-w-3xl mx-auto border-none shadow-lg">
      <CardHeader className="border-b border-slate-100">
        <div className="flex items-center justify-between">
          <CardTitle>{client ? 'Editar Cliente' : 'Novo Cliente'}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Scanner de Documento */}
          {!client && (
            <div className="mb-4">
              {!showScanner ? (
                <Button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  variant="outline"
                  className="w-full border-dashed border-2"
                >
                  <ScanLine className="w-4 h-4 mr-2" />
                  Escanear Documento (RG/CNH/CNPJ)
                </Button>
              ) : (
                <DocumentScanner
                  onDataExtracted={handleDocumentData}
                  documentType={formData.type === "company" ? "cnpj" : "identity"}
                />
              )}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo *</Label>
              <Select value={formData.type} onValueChange={(v) => handleChange('type', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Pessoa Física</SelectItem>
                  <SelectItem value="company">Pessoa Jurídica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf_cnpj">{formData.type === 'company' ? 'CNPJ' : 'CPF'}</Label>
              <Input
                id="cpf_cnpj"
                value={formData.cpf_cnpj}
                onChange={(e) => handleChange('cpf_cnpj', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="archived">Arquivado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="marital_status">Estado Civil</Label>
              <Select value={formData.marital_status} onValueChange={(v) => handleChange('marital_status', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Solteiro(a)</SelectItem>
                  <SelectItem value="married">Casado(a)</SelectItem>
                  <SelectItem value="divorced">Divorciado(a)</SelectItem>
                  <SelectItem value="widowed">Viúvo(a)</SelectItem>
                  <SelectItem value="stable_union">União Estável</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-gradient-to-r from-blue-600 to-purple-600">
              <Save className="w-4 h-4 mr-2" />
              {client ? 'Atualizar' : 'Criar'} Cliente
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}