import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Mail, Phone, MapPin, Clock, Scale, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ContactPublic() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <nav className="w-full px-6 md:px-12 py-6 flex items-center justify-between border-b border-gray-900">
        <Link to={createPageUrl("LandingPage")} className="flex items-center gap-2">
          <Scale className="w-6 h-6" />
          <span className="text-xl font-semibold tracking-tight">Juris</span>
        </Link>
        <Link to={createPageUrl("LandingPage")}>
          <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-900">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-light mb-4">Entre em Contato</h1>
          <p className="text-gray-400 max-w-xl mx-auto">
            Estamos aqui para ajudar. Entre em contato conosco através dos canais abaixo.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Email */}
          <div className="border border-gray-800 rounded-lg p-8 hover:border-gray-700 transition-colors">
            <div className="w-12 h-12 border border-gray-700 rounded-lg flex items-center justify-center mb-6">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-medium mb-2">Email</h3>
            <p className="text-gray-400 mb-4">Resposta em até 24 horas úteis</p>
            <a 
              href="mailto:contato@juris.com.br" 
              className="text-white hover:text-gray-300 transition-colors font-medium"
            >
              contato@juris.com.br
            </a>
          </div>

          {/* Telefone */}
          <div className="border border-gray-800 rounded-lg p-8 hover:border-gray-700 transition-colors">
            <div className="w-12 h-12 border border-gray-700 rounded-lg flex items-center justify-center mb-6">
              <Phone className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-medium mb-2">Telefone</h3>
            <p className="text-gray-400 mb-4">Segunda a sexta, 9h às 18h</p>
            <a 
              href="tel:+551140028922" 
              className="text-white hover:text-gray-300 transition-colors font-medium"
            >
              (11) 4002-8922
            </a>
          </div>

          {/* Horário */}
          <div className="border border-gray-800 rounded-lg p-8 hover:border-gray-700 transition-colors">
            <div className="w-12 h-12 border border-gray-700 rounded-lg flex items-center justify-center mb-6">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-medium mb-2">Horário de Atendimento</h3>
            <p className="text-gray-400 mb-2">Segunda a Sexta: 9h às 18h</p>
            <p className="text-gray-400">Sábado: 9h às 12h</p>
          </div>

          {/* Endereço */}
          <div className="border border-gray-800 rounded-lg p-8 hover:border-gray-700 transition-colors">
            <div className="w-12 h-12 border border-gray-700 rounded-lg flex items-center justify-center mb-6">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-medium mb-2">Endereço</h3>
            <p className="text-gray-400">
              Av. Paulista, 1000 - Bela Vista<br />
              São Paulo - SP, 01310-100
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center border border-gray-800 rounded-lg p-10">
          <h3 className="text-2xl font-light mb-4">Pronto para começar?</h3>
          <p className="text-gray-400 mb-6">
            Crie sua conta e transforme sua prática jurídica com IA.
          </p>
          <Link to={createPageUrl("Pricing")}>
            <Button className="bg-white text-black hover:bg-gray-100 px-8 py-3">
              Criar Conta Grátis
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-900 py-8 px-6 mt-16">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <span className="text-lg font-semibold tracking-tight">Juris</span>
          <p className="text-gray-600 text-sm">© 2024 Juris. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}