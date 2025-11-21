import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Share2, UserPlus, X, Users, Mail } from "lucide-react";
import { toast } from "sonner";

export default function ShareDialog({ open, onClose, entity, entityType, user }) {
  const [email, setEmail] = useState("");
  const [selectedTeam, setSelectedTeam] = useState(null);
  const queryClient = useQueryClient();

  const { data: teams = [] } = useQuery({
    queryKey: ['teams', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const allTeams = await base44.entities.Team.list();
      return allTeams.filter(t => 
        t.owner_email === user.email || t.members?.includes(user.email)
      );
    },
    enabled: !!user?.email && open
  });

  const updateEntityMutation = useMutation({
    mutationFn: async (data) => {
      if (entityType === 'case') {
        return base44.entities.Case.update(entity.id, data);
      } else if (entityType === 'document') {
        return base44.entities.LegalDocument.update(entity.id, data);
      }
    },
    onSuccess: async (updatedEntity, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      
      // Criar notificações para novos membros
      const newMembers = variables.shared_with.filter(
        m => !entity.shared_with?.includes(m)
      );
      
      for (const memberEmail of newMembers) {
        await base44.entities.Notification.create({
          type: entityType === 'case' ? 'case_shared' : 'document_shared',
          title: `${entityType === 'case' ? 'Processo' : 'Documento'} compartilhado`,
          message: `${user.full_name} compartilhou um ${entityType === 'case' ? 'processo' : 'documento'} com você: ${entity.title}`,
          recipient_email: memberEmail,
          entity_type: entityType,
          entity_id: entity.id,
          actor_email: user.email,
          actor_name: user.full_name
        });
      }
      
      toast.success("Compartilhamento atualizado!");
    }
  });

  const handleAddEmail = () => {
    if (!email) return;
    if (entity.shared_with?.includes(email)) {
      toast.error("Usuário já tem acesso");
      return;
    }

    updateEntityMutation.mutate({
      ...entity,
      shared_with: [...(entity.shared_with || []), email]
    });
    setEmail("");
  };

  const handleRemoveEmail = (emailToRemove) => {
    updateEntityMutation.mutate({
      ...entity,
      shared_with: entity.shared_with.filter(e => e !== emailToRemove)
    });
  };

  const handleShareWithTeam = (team) => {
    const newMembers = team.members.filter(m => !entity.shared_with?.includes(m));
    updateEntityMutation.mutate({
      ...entity,
      team_id: team.id,
      shared_with: [...(entity.shared_with || []), ...newMembers]
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Compartilhar {entityType === 'case' ? 'Processo' : 'Documento'}</DialogTitle>
          <DialogDescription>
            Adicione colaboradores para trabalhar em conjunto
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Compartilhar com equipe */}
          {teams.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">Compartilhar com Equipe</p>
              <div className="space-y-2">
                {teams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => handleShareWithTeam(team)}
                    className="w-full flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-600" />
                      <span className="text-sm font-medium">{team.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {team.members?.length} membros
                      </Badge>
                    </div>
                    {entity.team_id === team.id && (
                      <Badge className="bg-green-600">Ativo</Badge>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Adicionar por email */}
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">Adicionar Indivíduo</p>
            <div className="flex gap-2">
              <Input
                placeholder="email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddEmail()}
              />
              <Button onClick={handleAddEmail} disabled={updateEntityMutation.isPending}>
                <UserPlus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Lista de compartilhamentos */}
          {entity.shared_with?.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">
                Com Acesso ({entity.shared_with.length})
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {entity.shared_with.map((sharedEmail) => (
                  <div
                    key={sharedEmail}
                    className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-700">{sharedEmail}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveEmail(sharedEmail)}
                      className="h-6 text-red-600 hover:text-red-700"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}