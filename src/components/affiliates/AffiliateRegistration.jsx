import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UserPlus, Info } from "lucide-react";
import { toast } from "sonner";

export default function AffiliateRegistration({ theme = 'light', isOwner = false }) {
  if (!isOwner) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">Acesso restrito ao administrador do sistema.</p>
      </div>
    );
  }

  const isDark = theme === 'dark';
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: '',
    user_email: '',
    phone: '',
    pix_key: '',
    commission_rate: 20,
    affiliate_code: '',
    notes: ''
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await base44.functions.invoke('createAffiliate', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliates'] });
      setForm({ name: '', user_email: '', phone: '', pix_key: '', commission_rate: 20, affiliate_code: '', notes: '' });
      toast.success("Afiliado cadastrado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao cadastrar afiliado: " + error.message);
    }
  });

  // Auto-gerar código a partir do nome se não preenchido
  const handleNameChange = (name) => {
    const autoCode = name.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 15);
    setForm({ ...form, name, affiliate_code: form.affiliate_code || autoCode });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.affiliate_code.trim()) {
      toast.error("Código do cupom é obrigatório");
      return;
    }
    const cleanCode = form.affiliate_code.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!cleanCode) {
      toast.error("Código deve conter apenas letras e números");
      return;
    }
    createMutation.mutate({ ...form, affiliate_code: cleanCode, status: 'active' });
  };

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <UserPlus className="w-5 h-5" />
          Cadastrar Novo Afiliado
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Nome Completo *</Label>
              <Input
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ex: Pedro Silva"
                required
              />
            </div>

            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={form.user_email}
                onChange={(e) => setForm({ ...form, user_email: e.target.value })}
                placeholder="pedro@email.com"
                required
              />
            </div>

            <div>
              <Label className="flex items-center gap-1">
                Código do Cupom *
                <Info className="w-3 h-3 text-gray-400" />
              </Label>
              <Input
                value={form.affiliate_code}
                onChange={(e) => setForm({ ...form, affiliate_code: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') })}
                placeholder="Ex: pedro, ana10, juris30"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Somente letras minúsculas e números. O cliente usará este código no checkout.
              </p>
            </div>

            <div>
              <Label>Taxa de Comissão (%) *</Label>
              <Input
                type="number"
                step="0.01"
                min="1"
                max="100"
                value={form.commission_rate}
                onChange={(e) => setForm({ ...form, commission_rate: parseFloat(e.target.value) })}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Este % é o desconto aplicado ao cliente E a comissão do afiliado.
              </p>
            </div>

            <div>
              <Label>Telefone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
              <Label>Chave PIX para Pagamento</Label>
              <Input
                value={form.pix_key}
                onChange={(e) => setForm({ ...form, pix_key: e.target.value })}
                placeholder="Email, CPF, telefone ou chave aleatória"
              />
            </div>
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              placeholder="Anotações internas sobre o afiliado..."
            />
          </div>

          {/* Preview */}
          {form.affiliate_code && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm">
              <p className="font-medium text-blue-900 mb-1">Preview do Link de Afiliado:</p>
              <code className="text-blue-700 break-all">
                {window.location.origin}/Pricing?ref={form.affiliate_code}
              </code>
              <p className="text-blue-600 mt-2">
                Desconto para o cliente: <strong>{form.commission_rate}%</strong> | 
                Comissão do afiliado: <strong>{form.commission_rate}% sobre o valor do plano</strong>
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setForm({ name: '', user_email: '', phone: '', pix_key: '', commission_rate: 20, affiliate_code: '', notes: '' })}
            >
              Limpar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Cadastrando...' : 'Cadastrar Afiliado'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}