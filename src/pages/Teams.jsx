import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Users, Plus, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AppPage, PageHeader, AppCard, AppContent, AppButton, EmptyState
} from "@/components/ds";

export default function Teams() {
  const [user, setUser] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => setUser(null)); }, []);

  const { data: myTeams = [], isLoading } = useQuery({
    queryKey: ['my-teams', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.Team.filter({ owner_email: user.email }, '-created_date', 100);
    },
    enabled: !!user?.email
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user?.email) throw new Error("Usuário não autenticado");
      if (!newTeamName.trim()) throw new Error("Nome obrigatório");
      return base44.entities.Team.create({ name: newTeamName.trim(), owner_email: user.email });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['my-teams'] });
      toast.success("Equipe criada!");
      setIsCreateOpen(false);
      setNewTeamName("");
      navigate(createPageUrl("TeamDetail") + `?id=${data.id}`);
    },
    onError: (e) => toast.error(e.message || "Erro ao criar equipe"),
  });

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 style={{ width: 24, height: 24, color: "var(--text-3)", animation: "spin .7s linear infinite" }} />
      </div>
    );
  }

  return (
    <AppPage>
      <PageHeader
        title="Minhas Equipes"
        subtitle={`${myTeams.length} equipe${myTeams.length !== 1 ? "s" : ""}`}
        icon={Users}
        actions={
          <AppButton variant="primary" icon={Plus} onClick={() => setIsCreateOpen(true)}>
            Nova Equipe
          </AppButton>
        }
      />

      <AppContent>
        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
            <Loader2 style={{ width: 28, height: 28, color: "var(--text-3)", animation: "spin .7s linear infinite" }} />
          </div>
        ) : myTeams.length === 0 ? (
          <AppCard>
            <EmptyState
              icon={Users}
              title="Nenhuma equipe encontrada"
              description='Clique em "Nova Equipe" para começar'
            />
          </AppCard>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }} className="lg:grid-cols-3 md:grid-cols-2 grid-cols-1">
            {myTeams.map(team => (
              <div
                key={team.id}
                onClick={() => navigate(createPageUrl("TeamDetail") + `?id=${team.id}`)}
                style={{
                  background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)",
                  padding: "20px 24px", cursor: "pointer", boxShadow: "var(--sh-xs)",
                  transition: "box-shadow 0.15s, border-color 0.15s, transform 0.15s",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "var(--sh-md)"; e.currentTarget.style.borderColor = "var(--border-strong)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "var(--sh-xs)"; e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <div>
                  <p style={{ fontWeight: 600, color: "var(--text-1)", fontSize: 14, margin: "0 0 4px", letterSpacing: "-0.01em" }}>{team.name}</p>
                  <p style={{ fontSize: 12, color: "var(--text-2)", margin: 0 }}>
                    Criada em {format(new Date(team.created_date), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
                <ArrowRight style={{ width: 18, height: 18, color: "var(--accent)", flexShrink: 0 }} />
              </div>
            ))}
          </div>
        )}
      </AppContent>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Equipe</DialogTitle>
          </DialogHeader>
          <div style={{ padding: "8px 0" }}>
            <Input
              value={newTeamName}
              onChange={e => setNewTeamName(e.target.value)}
              placeholder="Nome da equipe"
              onKeyDown={e => e.key === 'Enter' && createMutation.mutate()}
            />
          </div>
          <DialogFooter>
            <AppButton variant="secondary" onClick={() => setIsCreateOpen(false)}>Cancelar</AppButton>
            <AppButton variant="primary" onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !newTeamName.trim()}>
              {createMutation.isPending ? "Criando..." : "Criar"}
            </AppButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppPage>
  );
}