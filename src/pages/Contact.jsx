import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send, 
  MessageSquare, 
  CheckCircle2,
  Clock,
  Headphones,
  Sparkles,
  Loader2
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function Contact() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  React.useEffect(() => {
    base44.auth.me().then(userData => {
      setUser(userData);
      setFormData(prev => ({
        ...prev,
        name: userData.full_name || "",
        email: userData.email || ""
      }));
    }).catch(() => {});
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error("Por favor, preencha todos os campos!");
      return;
    }

    setIsSubmitting(true);

    try {
      // Envia email para a equipe da plataforma
      await base44.integrations.Core.SendEmail({
        from_name: "LegalTech Pro - Contato",
        to: "suporte@legaltech.com.br", // Substitua pelo email real
        subject: `[Contato] ${formData.subject}`,
        body: `
          <h2>Nova mensagem de contato</h2>
          <p><strong>Nome:</strong> ${formData.name}</p>
          <p><strong>Email:</strong> ${formData.email}</p>
          <p><strong>Assunto:</strong> ${formData.subject}</p>
          <hr>
          <h3>Mensagem:</h3>
          <p>${formData.message.replace(/\n/g, '<br>')}</p>
          <hr>
          <p><small>Enviado via formulário de contato - LegalTech Pro</small></p>
        `
      });

      // Envia email de confirmação para o usuário
      await base44.integrations.Core.SendEmail({
        from_name: "LegalTech Pro",
        to: formData.email,
        subject: "Recebemos sua mensagem!",
        body: `
          <h2>Olá, ${formData.name}!</h2>
          <p>Recebemos sua mensagem e nossa equipe entrará em contato em breve.</p>
          <p><strong>Assunto:</strong> ${formData.subject}</p>
          <p>Normalmente respondemos em até 24 horas úteis.</p>
          <hr>
          <p>Atenciosamente,<br><strong>Equipe LegalTech Pro</strong></p>
        `
      });

      setSubmitted(true);
      toast.success("Mensagem enviada com sucesso!");
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setFormData({
          name: user?.full_name || "",
          email: user?.email || "",
          subject: "",
          message: ""
        });
        setSubmitted(false);
      }, 3000);

    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      toast.error("Erro ao enviar mensagem. Tente novamente.");
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.div
            animate={{ 
              scale: [1, 1.05, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="inline-block mb-6"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl">
              <MessageSquare className="w-10 h-10 text-white" />
            </div>
          </motion.div>

          <h1 className="text-5xl md:text-6xl font-black mb-4">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Entre em Contato
            </span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Estamos aqui para ajudar! Envie sua mensagem e nossa equipe responderá em breve.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card className="p-8 shadow-xl border-2 border-slate-200">
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">
                    Mensagem Enviada!
                  </h3>
                  <p className="text-slate-600 mb-4">
                    Obrigado por entrar em contato. Responderemos em breve!
                  </p>
                  <div className="inline-flex items-center gap-2 text-sm text-slate-500">
                    <Clock className="w-4 h-4" />
                    <span>Tempo de resposta: até 24 horas</span>
                  </div>
                </motion.div>
              ) : (
                <>
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">
                      Envie sua Mensagem
                    </h2>
                    <p className="text-slate-600">
                      Preencha o formulário abaixo e entraremos em contato
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="name" className="text-slate-900 font-semibold">
                          Nome Completo *
                        </Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Seu nome"
                          required
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label htmlFor="email" className="text-slate-900 font-semibold">
                          Email *
                        </Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="seu@email.com"
                          required
                          className="mt-2"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="subject" className="text-slate-900 font-semibold">
                        Assunto *
                      </Label>
                      <Input
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="Como podemos ajudar?"
                        required
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="message" className="text-slate-900 font-semibold">
                        Mensagem *
                      </Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Descreva sua dúvida, sugestão ou problema..."
                        required
                        rows={6}
                        className="mt-2 resize-none"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-6 text-lg font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:opacity-90"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          Enviar Mensagem
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-slate-500 text-center">
                      * Campos obrigatórios
                    </p>
                  </form>
                </>
              )}
            </Card>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            {/* Contact Cards */}
            <Card className="p-6 border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Email</h3>
              <p className="text-slate-700 text-sm mb-2">
                Envie um email diretamente
              </p>
              <a 
                href="mailto:suporte@legaltech.com.br" 
                className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
              >
                suporte@legaltech.com.br
              </a>
            </Card>

            <Card className="p-6 border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100">
              <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mb-4">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Telefone</h3>
              <p className="text-slate-700 text-sm mb-2">
                Seg - Sex: 9h às 18h
              </p>
              <a 
                href="tel:+551140028922" 
                className="text-green-600 hover:text-green-700 font-semibold text-sm"
              >
                (11) 4002-8922
              </a>
            </Card>

            <Card className="p-6 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
              <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mb-4">
                <Headphones className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Suporte</h3>
              <p className="text-slate-700 text-sm mb-2">
                Respondemos em até 24h
              </p>
              <span className="text-purple-600 font-semibold text-sm">
                Suporte Prioritário para Pro
              </span>
            </Card>

            <Card className="p-6 border-2 border-pink-200 bg-gradient-to-br from-pink-50 to-pink-100">
              <div className="w-12 h-12 bg-pink-600 rounded-xl flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Endereço</h3>
              <p className="text-slate-700 text-sm">
                Av. Paulista, 1000<br />
                São Paulo - SP<br />
                CEP: 01310-100
              </p>
            </Card>
          </motion.div>
        </div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">
              Perguntas Frequentes
            </h2>
            <p className="text-slate-600">
              Confira as dúvidas mais comuns antes de entrar em contato
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 border-2 border-slate-200 hover:border-blue-300 transition-colors">
              <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                Como funciona o plano Pro?
              </h3>
              <p className="text-sm text-slate-600">
                O plano Pro oferece uso ilimitado de todas as funcionalidades por R$ 49,99/mês. Você pode cancelar a qualquer momento.
              </p>
            </Card>

            <Card className="p-6 border-2 border-slate-200 hover:border-blue-300 transition-colors">
              <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-green-600" />
                Posso testar antes de assinar?
              </h3>
              <p className="text-sm text-slate-600">
                Sim! O plano gratuito oferece 5 ações por dia para você testar todas as funcionalidades básicas.
              </p>
            </Card>

            <Card className="p-6 border-2 border-slate-200 hover:border-blue-300 transition-colors">
              <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Como cancelo minha assinatura?
              </h3>
              <p className="text-sm text-slate-600">
                Entre em contato conosco e cancelamos imediatamente. Não há multas ou taxas de cancelamento.
              </p>
            </Card>

            <Card className="p-6 border-2 border-slate-200 hover:border-blue-300 transition-colors">
              <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange-600" />
                Meus dados estão seguros?
              </h3>
              <p className="text-sm text-slate-600">
                Sim! Utilizamos criptografia SSL e seguimos todas as normas da LGPD para proteger seus dados.
              </p>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}