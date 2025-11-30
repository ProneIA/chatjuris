import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, MessageCircle, Send, Loader2, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function SendMessageDialog({ 
  open, 
  onClose, 
  portal, 
  cases = [],
  user,
  onMessageSent 
}) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("whatsapp");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");

  const templates = [
    {
      id: "welcome",
      name: "Boas-vindas ao Portal",
      subject: "Bem-vindo ao Portal do Cliente",
      message: `Olá ${portal?.client_name || "Cliente"}! 👋

Seja bem-vindo(a) ao Portal do Cliente do nosso escritório!

Através deste portal, você poderá:
✅ Acompanhar o andamento do(s) seu(s) processo(s)
✅ Receber atualizações importantes
✅ Enviar mensagens diretamente para nossa equipe
✅ Visualizar documentos relacionados ao seu caso

Qualquer dúvida, estamos à disposição!

Atenciosamente,
${user?.full_name || "Equipe Jurídica"}`
    },
    {
      id: "update",
      name: "Atualização de Processo",
      subject: "Atualização sobre seu processo",
      message: `Olá ${portal?.client_name || "Cliente"}!

Informamos que houve uma atualização em seu processo.

Acesse o Portal do Cliente para verificar os detalhes:

Qualquer dúvida, entre em contato conosco.

Atenciosamente,
${user?.full_name || "Equipe Jurídica"}`
    },
    {
      id: "hearing",
      name: "Lembrete de Audiência",
      subject: "Lembrete: Audiência agendada",
      message: `Olá ${portal?.client_name || "Cliente"}!

Este é um lembrete sobre sua audiência agendada.

⚠️ IMPORTANTE: Chegue com pelo menos 30 minutos de antecedência.

📍 Leve seus documentos de identificação.

Em caso de dúvidas, entre em contato conosco imediatamente.

Atenciosamente,
${user?.full_name || "Equipe Jurídica"}`
    },
    {
      id: "documents",
      name: "Solicitação de Documentos",
      subject: "Documentos necessários",
      message: `Olá ${portal?.client_name || "Cliente"}!

Para darmos andamento ao seu processo, precisamos dos seguintes documentos:

1. [Liste os documentos necessários]

Por favor, envie os documentos o mais breve possível.

Você pode responder esta mensagem ou enviar pelo Portal do Cliente.

Atenciosamente,
${user?.full_name || "Equipe Jurídica"}`
    }
  ];

  const applyTemplate = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setMessage(template.message);
      setSelectedTemplate(templateId);
    }
  };

  const getPortalLink = () => {
    return `${window.location.origin}/client-access/${portal?.access_token}`;
  };

  const formatPhoneForWhatsApp = (phone) => {
    if (!phone) return null;
    // Remove tudo que não é número
    let cleaned = phone.replace(/\D/g, '');
    // Adiciona código do país se não tiver
    if (cleaned.length === 11) {
      cleaned = '55' + cleaned;
    } else if (cleaned.length === 10) {
      cleaned = '55' + cleaned;
    }
    return cleaned;
  };

  const sendWhatsApp = () => {
    const phone = formatPhoneForWhatsApp(portal?.client_phone);
    if (!phone) {
      toast.error("Telefone do cliente não cadastrado");
      return;
    }

    const portalLink = getPortalLink();
    const fullMessage = message + (message.includes(portalLink) ? '' : `\n\n🔗 Acesse seu portal: ${portalLink}`);
    
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(fullMessage)}`;
    window.open(whatsappUrl, '_blank');

    // Salvar mensagem no histórico
    saveMessage("whatsapp");
    toast.success("WhatsApp aberto! Envie a mensagem.");
  };

  const sendEmail = async () => {
    if (!portal?.client_email) {
      toast.error("Email do cliente não cadastrado");
      return;
    }

    setLoading(true);
    try {
      const portalLink = getPortalLink();
      const fullMessage = message + (message.includes(portalLink) ? '' : `\n\n🔗 Acesse seu portal: ${portalLink}`);

      await base44.integrations.Core.SendEmail({
        to: portal.client_email,
        subject: subject || "Mensagem do seu advogado",
        body: fullMessage.replace(/\n/g, '<br>')
      });

      // Salvar mensagem no histórico
      await saveMessage("email");
      toast.success("Email enviado com sucesso!");
      handleClose();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao enviar email");
    } finally {
      setLoading(false);
    }
  };

  const saveMessage = async (sentVia) => {
    try {
      await base44.entities.ClientMessage.create({
        case_id: portal?.case_ids?.[0] || "",
        client_portal_id: portal?.id,
        sender_type: "lawyer",
        sender_name: user?.full_name,
        sender_email: user?.email,
        content: message,
        sent_via: sentVia
      });
      onMessageSent?.();
    } catch (error) {
      console.error("Erro ao salvar mensagem:", error);
    }
  };

  const handleClose = () => {
    setSubject("");
    setMessage("");
    setSelectedTemplate("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Enviar Mensagem para {portal?.client_name}
          </DialogTitle>
          <DialogDescription>
            Envie mensagens por WhatsApp ou Email para seu cliente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Templates */}
          <div>
            <Label className="text-sm font-medium">Templates Rápidos</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {templates.map(template => (
                <Button
                  key={template.id}
                  variant={selectedTemplate === template.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => applyTemplate(template.id)}
                >
                  {template.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Assunto (para email) */}
          <div>
            <Label>Assunto (Email)</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Assunto do email"
            />
          </div>

          {/* Mensagem */}
          <div>
            <Label>Mensagem</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              rows={8}
            />
            <p className="text-xs text-gray-500 mt-1">
              O link do portal será adicionado automaticamente ao final da mensagem.
            </p>
          </div>

          {/* Info do cliente */}
          <div className="bg-gray-50 dark:bg-neutral-900 rounded-lg p-3 text-sm space-y-1">
            <p><strong>Email:</strong> {portal?.client_email || "Não cadastrado"}</p>
            <p><strong>Telefone:</strong> {portal?.client_phone || "Não cadastrado"}</p>
            <p className="flex items-center gap-1">
              <strong>Portal:</strong> 
              <span className="text-blue-600 truncate max-w-xs">{getPortalLink()}</span>
            </p>
          </div>

          {/* Botões de envio */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={sendWhatsApp}
              disabled={!message.trim() || !portal?.client_phone}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              WhatsApp
              <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
            <Button
              onClick={sendEmail}
              disabled={loading || !message.trim() || !portal?.client_email}
              className="flex-1"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Mail className="w-4 h-4 mr-2" />
              )}
              Email
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}