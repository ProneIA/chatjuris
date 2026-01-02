import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";

export default function AffiliateRegistration({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: '',
    user_email: '',
    phone: '',
    pix_key: '',
    commission_rate: 30,
    notes: ''
  });

  const generateCode = (name) => {
    return name.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 10) + Math.random().toString(36).substring(2, 6);
  };

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const affiliate = await base44.entities.Affiliate.create(data);
      
      // Atualizar o usuário para marcar como afiliado
      const users = await base44.asServiceRole.entities.User.filter({ email: data.user_email });
      if (users.length > 0) {
        await base44.asServiceRole.entities.User.update(users[0].id, {
          is_affiliate: true,
          affiliate_id: affiliate.id
        });
      }
      
      return affiliate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliates'] });
      setForm({
        name: '',
        user_email: '',
        phone: '',
        pix_key: '',
        commission_rate: 30,
        notes: ''
      });
      toast.success("Afiliado cadastrado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao cadastrar afiliado: " + error.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const affiliate_code = generateCode(form.name);
    createMutation.mutate({ ...form, affiliate_code, status: 'active' });
  };

  return (
    <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
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
                onChange={(e) => setForm({...form, name: e.target.value})}
                required
              />
            </div>

            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={form.user_email}
                onChange={(e) => setForm({...form, user_email: e.target.value})}
                required
              />
            </div>

            <div>
              <Label>Telefone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({...form, phone: e.target.value})}
              />
            </div>

            <div>
              <Label>Chave PIX</Label>
              <Input
                value={form.pix_key}
                onChange={(e) => setForm({...form, pix_key: e.target.value})}
                placeholder="Email, CPF, telefone ou chave aleatória"
              />
            </div>

            <div>
              <Label>Taxa de Comissão (%) *</Label>
              <Input
                type="number"
                step="0.01"
                value={form.commission_rate}
                onChange={(e) => setForm({...form, commission_rate: parseFloat(e.target.value)})}
                required
              />
            </div>
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({...form, notes: e.target.value})}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => setForm({
                name: '',
                user_email: '',
                phone: '',
                pix_key: '',
                commission_rate: 30,
                notes: ''
              })}
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