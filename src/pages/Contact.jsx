import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { 
  Mail, 
  MessageSquare, 
  Send, 
  MapPin, 
  Phone, 
  Clock,
  CheckCircle,
  Loader2,
  Sparkles,
  HeadphonesIcon
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [user, setUser] = useState(null);

  React.useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      setFormData(prev => ({
        ...prev,
        name: u.full_name || "",
        email: u.email || ""
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
    setIsSubmitting(true);

    try {
      // Send email to support
      await base44.integrations.Core.SendEmail({
        from_name: formData.name,
        to: "suporte@legaltech.com.br", // Email da plataforma
        subject: `[Contato] ${formData.subject}`,
        body: `
          <h2>Nova mensagem de contato</h2>
          <p><strong>Nome:</strong> ${formData.name}</p>
          <p><strong>Email:</strong> ${formData.email}</p>
          <p><strong>Assunto:</strong> ${formData.subject}</p>
          <hr>
          <h3>Mensagem:</h3>
          <p>${formData.message.replace(/\n/g, '<br>')}</p>
        `
      });

      // Send confirmation email to user
      await base44.integrations.Core.SendEmail({
        from_name: "LegalTech Pro",
        to: formData.email,
        subject: "Recebemos sua mensagem!",
        body: `
          <h2>Olá, ${formData.name}!</h2>
          <p>Recebemos sua mensagem e entraremos em contato em breve.</p>
          <p><strong>Assunto:</strong> ${formData.subject}</p>
          <hr>
          <p>Nossa equipe responde em até 24 horas úteis.</p>
          <br>
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
            Estamos aqui para ajudar! Envie sua mensagem e responderemos em breve.
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
            <Card className="p-8 bg-white shadow-xl border-2 border-slate-200 rounded-2xl">
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">
                    Mensagem Enviada!
                  </h3>
                  <p className="text-slate-600 mb-4">
                    Recebemos sua mensagem e responderemos em breve.
                  </p>
                  <p className="text-sm text-slate-500">
                    Você receberá um email de confirmação em {formData.email}
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="name" className="text-slate-900 font-semibold">
                        Nome Completo
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
                        Email
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
                      Assunto
                    </Label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="Sobre o que você quer falar?"
                      required
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message" className="text-slate-900 font-semibold">
                      Mensagem
                    </Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Escreva sua mensagem aqui..."
                      required
                      rows={8}
                      className="mt-2 resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-6 text-lg font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:opacity-90 transition-opacity"
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
                </form>
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
            {/* Support Card */}
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-2xl">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                <HeadphonesIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">
                Suporte Prioritário
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                Usuários Pro têm suporte prioritário com resposta em até 4 horas úteis.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-blue-300 hover:bg-blue-100"
                onClick={() => window.location.href = '/pricing'}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Fazer Upgrade
              </Button>
            </Card>

            {/* Contact Methods */}
            <div className="space-y-4">
              <Card className="p-5 bg-white border-2 border-slate-200 rounded-xl hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Email</h4>
                    <a 
                      href="mailto:suporte@legaltech.com.br"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      suporte@legaltech.com.br
                    </a>
                  </div>
                </div>
              </Card>

              <Card className="p-5 bg-white border-2 border-slate-200 rounded-xl hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Telefone</h4>
                    <a 
                      href="tel:+5511999999999"
                      className="text-sm text-green-600 hover:underline"
                    >
                      (11) 99999-9999
                    </a>
                    <p className="text-xs text-slate-500 mt-1">
                      Segunda a Sexta, 9h às 18h
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-5 bg-white border-2 border-slate-200 rounded-xl hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Horário</h4>
                    <p className="text-sm text-slate-600">
                      Segunda a Sexta
                    </p>
                    <p className="text-sm text-slate-600">
                      09:00 - 18:00
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-5 bg-white border-2 border-slate-200 rounded-xl hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Localização</h4>
                    <p className="text-sm text-slate-600">
                      São Paulo, SP
                    </p>
                    <p className="text-sm text-slate-600">
                      Brasil
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* FAQ Link */}
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl text-center">
              <h3 className="font-bold text-slate-900 mb-2">
                Perguntas Frequentes
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                Encontre respostas rápidas para dúvidas comuns
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-purple-300 hover:bg-purple-100"
                onClick={() => window.location.href = '/pricing#faq'}
              >
                Ver FAQ
              </Button>
            </Card>
          </motion.div>
        </div>

        {/* Bottom Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <Card className="max-w-3xl mx-auto p-8 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white border-0">
            <h3 className="text-2xl font-bold mb-3">
              Resposta Rápida Garantida
            </h3>
            <p className="text-white/90 mb-4">
              Nossa equipe responde todas as mensagens em até 24 horas úteis. 
              Usuários Pro recebem resposta prioritária em até 4 horas.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm">
              <CheckCircle className="w-5 h-5" />
              <span>Suporte em Português</span>
              <span className="text-white/50">•</span>
              <CheckCircle className="w-5 h-5" />
              <span>Equipe Especializada</span>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}