import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Clock, ArrowRight, CheckCircle } from "lucide-react";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";

export default function TrialWelcomeModal({ open, onClose, daysLeft = 7 }) {
  const navigate = useNavigate();

  const handleViewPlans = () => {
    onClose();
    navigate(createPageUrl("Pricing"));
  };

  const handleExplore = () => {
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white border-0 p-0 overflow-hidden">
        {/* Header com gradiente */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-semibold mb-2">
            Bem-vindo ao Juris 👋
          </DialogTitle>
          <p className="text-blue-100 text-sm">
            Sua jornada para uma advocacia mais eficiente começa agora
          </p>
        </div>

        {/* Conteúdo */}
        <div className="p-6">
          {/* Badge de trial */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-700">
                Teste Gratuito: {daysLeft} dias restantes
              </span>
            </div>
          </div>

          {/* Mensagem */}
          <div className="text-center mb-6">
            <p className="text-gray-700 mb-2">
              Você está utilizando um <strong>teste gratuito de 7 dias</strong>.
            </p>
            <p className="text-gray-500 text-sm">
              Aproveite todos os recursos premium durante esse período.
            </p>
          </div>

          {/* Lista de benefícios */}
          <div className="space-y-3 mb-6">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              O que está incluso:
            </p>
            {[
              "IA Jurídica ilimitada",
              "Geração de documentos",
              "Gestão de processos e clientes",
              "Pesquisa de jurisprudência"
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                {item}
              </div>
            ))}
          </div>

          {/* Botões */}
          <div className="space-y-3">
            <Button
              onClick={handleExplore}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white py-5"
            >
              Começar a explorar
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              onClick={handleViewPlans}
              variant="outline"
              className="w-full py-5 border-gray-300"
            >
              Ver planos e assinar
            </Button>
          </div>

          <p className="text-xs text-center text-gray-400 mt-4">
            Ao final do período de teste, você poderá escolher um plano.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}