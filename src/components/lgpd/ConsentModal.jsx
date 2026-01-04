import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, FileText, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

export default function ConsentModal({ open, onAccept }) {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAccept = async () => {
    if (!acceptedTerms || !acceptedPrivacy) {
      toast.error("Por favor, aceite todos os termos para continuar");
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await base44.auth.me();
      
      // Registrar consentimentos
      await Promise.all([
        base44.entities.UserConsent.create({
          user_email: user.email,
          consent_type: "terms_of_use",
          accepted: true,
          accepted_at: new Date().toISOString(),
          version: "1.0"
        }),
        base44.entities.UserConsent.create({
          user_email: user.email,
          consent_type: "privacy_policy",
          accepted: true,
          accepted_at: new Date().toISOString(),
          version: "1.0"
        })
      ]);

      toast.success("Consentimento registrado com sucesso!");
      onAccept();
    } catch (error) {
      console.error("Erro ao registrar consentimento:", error);
      toast.error("Erro ao salvar. Você pode continuar e aceitar depois nas configurações.");
      // Permitir continuar mesmo com erro
      setTimeout(() => onAccept(), 1500);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" hideClose>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Shield className="w-6 h-6 text-blue-600" />
            Bem-vindo ao Juris
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Proteção de Dados (LGPD)</p>
                <p>
                  Para usar o Juris, precisamos do seu consentimento para coletar e processar seus dados conforme a 
                  Lei Geral de Proteção de Dados Pessoais (LGPD).
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox 
                id="terms" 
                checked={acceptedTerms}
                onCheckedChange={setAcceptedTerms}
                className="mt-1"
              />
              <label htmlFor="terms" className="text-sm cursor-pointer">
                Li e aceito os{" "}
                <Link 
                  to={createPageUrl("TermsOfService")} 
                  target="_blank"
                  className="text-blue-600 hover:underline font-medium"
                >
                  Termos de Uso
                </Link>
                , incluindo as condições de uso da plataforma, limitações de responsabilidade e direitos de propriedade intelectual.
              </label>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox 
                id="privacy" 
                checked={acceptedPrivacy}
                onCheckedChange={setAcceptedPrivacy}
                className="mt-1"
              />
              <label htmlFor="privacy" className="text-sm cursor-pointer">
                Li e aceito a{" "}
                <Link 
                  to={createPageUrl("PrivacyPolicy")} 
                  target="_blank"
                  className="text-blue-600 hover:underline font-medium"
                >
                  Política de Privacidade
                </Link>
                , autorizando a coleta, armazenamento e processamento dos meus dados pessoais para as finalidades descritas, 
                incluindo o uso de serviços de IA.
              </label>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
            <p className="font-medium mb-2">Seus Direitos (Art. 18º LGPD):</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Acessar, corrigir ou excluir seus dados</li>
              <li>Exportar seus dados (portabilidade)</li>
              <li>Revogar consentimento a qualquer momento</li>
              <li>Informações sobre compartilhamento de dados</li>
            </ul>
            <p className="mt-2 text-xs">
              Você pode exercer seus direitos em{" "}
              <Link to={createPageUrl("MyData")} className="text-blue-600 hover:underline font-medium">
                Meus Dados
              </Link>
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleAccept}
              disabled={!acceptedTerms || !acceptedPrivacy || isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? "Processando..." : "Aceitar e Continuar"}
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Ao aceitar, você concorda com o tratamento dos seus dados conforme nossa Política de Privacidade
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}