import React from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Ban, Eye } from "lucide-react";
import { toast } from "sonner";

export default function AffiliateList({ affiliates, theme = 'light' }) {
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Affiliate.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliates'] });
      toast.success("Status atualizado!");
    }
  });

  const getStatusBadge = (status) => {
    const variants = {
      active: { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: 'Ativo' },
      pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-800', label: 'Pendente' },
      suspended: { icon: Ban, color: 'bg-red-100 text-red-800', label: 'Suspenso' }
    };
    const variant = variants[status] || variants.pending;
    const Icon = variant.icon;
    
    return (
      <Badge className={variant.color}>
        <Icon className="w-3 h-3 mr-1" />
        {variant.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-3">
      {affiliates.map((affiliate) => (
        <Card key={affiliate.id} className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {affiliate.name}
                  </h3>
                  {getStatusBadge(affiliate.status)}
                  <code className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-neutral-800' : 'bg-gray-100'}`}>
                    {affiliate.affiliate_code}
                  </code>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className={isDark ? 'text-neutral-400' : 'text-gray-600'}>Email:</span>{' '}
                    <span className={isDark ? 'text-neutral-300' : 'text-gray-700'}>{affiliate.user_email}</span>
                  </div>
                  <div>
                    <span className={isDark ? 'text-neutral-400' : 'text-gray-600'}>Vendas:</span>{' '}
                    <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {affiliate.total_sales}
                    </span>
                  </div>
                  <div>
                    <span className={isDark ? 'text-neutral-400' : 'text-gray-600'}>Comissão:</span>{' '}
                    <span className={`font-semibold text-green-600`}>
                      {affiliate.commission_rate}%
                    </span>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 text-sm mt-2">
                  <div>
                    <span className={isDark ? 'text-neutral-400' : 'text-gray-600'}>Total Comissões:</span>{' '}
                    <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      R$ {(affiliate.total_commission || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className={isDark ? 'text-neutral-400' : 'text-gray-600'}>Já Pago:</span>{' '}
                    <span className="text-purple-600 font-semibold">
                      R$ {(affiliate.total_paid || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className={isDark ? 'text-neutral-400' : 'text-gray-600'}>Pendente:</span>{' '}
                    <span className="text-orange-600 font-semibold">
                      R$ {((affiliate.total_commission || 0) - (affiliate.total_paid || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {affiliate.pix_key && (
                  <div className={`text-xs mt-2 ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                    PIX: {affiliate.pix_key}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {affiliate.status === 'active' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateStatusMutation.mutate({ id: affiliate.id, status: 'suspended' })}
                  >
                    Suspender
                  </Button>
                )}
                {affiliate.status === 'suspended' && (
                  <Button
                    size="sm"
                    onClick={() => updateStatusMutation.mutate({ id: affiliate.id, status: 'active' })}
                  >
                    Reativar
                  </Button>
                )}
                {affiliate.status === 'pending' && (
                  <Button
                    size="sm"
                    onClick={() => updateStatusMutation.mutate({ id: affiliate.id, status: 'active' })}
                  >
                    Aprovar
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {affiliates.length === 0 && (
        <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
          <CardContent className="p-8 text-center">
            <p className={isDark ? 'text-neutral-400' : 'text-gray-600'}>
              Nenhum afiliado cadastrado ainda.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}