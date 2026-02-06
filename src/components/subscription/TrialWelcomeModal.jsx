import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Clock, ArrowRight, Check } from "lucide-react";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";

export default function TrialWelcomeModal({ open, onClose, daysLeft = 7 }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          {/* Header com gradiente */}
          <div className="bg-gradient-to-br from-purple-600 to-indigo-600 p-8 text-center text-white">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Bem-vindo ao Juris 👋</h2>
            <p className="text-purple-100">
              Sua jornada para uma advocacia mais inteligente começa agora
            </p>
          </div>

          {/* Conteúdo */}
          <div className="p-6">
            {/* Badge de teste */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-blue-900">
                    Teste Gratuito de 7 Dias
                  </p>
                  <p className="text-sm text-blue-700">
                    {daysLeft} {daysLeft === 1 ? 'dia' : 'dias'} restantes para explorar tudo
                  </p>
                </div>
              </div>
            </div>

            {/* O que está incluso */}
            <p className="text-sm font-medium text-gray-700 mb-3">
              Durante o teste você tem acesso a:
            </p>
            <ul className="space-y-2 mb-6">
              {[
                "Assistente Jurídico com IA ilimitado",
                "Geração de petições e documentos",
                "Pesquisa de jurisprudência completa",
                "Gestão de clientes e processos",
                "Todas as calculadoras jurídicas"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            {/* CTAs */}
            <div className="space-y-3">
              <Button
                onClick={onClose}
                className="w-full h-11 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium"
              >
                Começar a Explorar
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  onClose();
                  window.location.href = createPageUrl("Pricing");
                }}
                className="w-full h-11"
              >
                Ver Planos e Assinar Agora
              </Button>
            </div>

            <p className="text-xs text-center text-gray-500 mt-4">
              Aproveite todos os recursos premium durante seu período de teste
            </p>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}