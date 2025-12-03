import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Mail, Phone, MapPin, Clock, Scale, ArrowRight } from "lucide-react";

export default function ContactPublic() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <nav className="w-full px-6 md:px-12 py-6 flex items-center justify-between border-b border-gray-200">
        <Link to={createPageUrl("LandingPage")} className="flex items-center gap-2">
          <Scale className="w-6 h-6 text-gray-900" />
          <span className="text-xl font-semibold tracking-tight">Juris</span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link 
            to={createPageUrl("QuemSomos")}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Quem somos
          </Link>
          <Link 
            to={createPageUrl("Funcionalidades")}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Funcionalidades
          </Link>
          <Link 
            to={createPageUrl("Pricing")}
            className="px-5 py-2.5 text-sm font-medium bg-gray-900 text-white rounded-none border-0 transition-colors hover:bg-gray-800"
          >
            Começar
          </Link>
        </div>
        <Link 
          to={createPageUrl("LandingPage")}
          className="md:hidden text-sm text-gray-600 hover:text-gray-900"
        >
          Voltar
        </Link>
      </nav>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-16 md:py-24">
        <div className="text-center mb-16">
          <p className="text-gray-500 uppercase tracking-widest text-xs mb-4">Contato</p>
          <h1 className="text-3xl md:text-4xl font-light mb-4">Entre em Contato</h1>
          <div className="w-16 h-0.5 bg-gray-900 mx-auto mb-6" />
          <p className="text-gray-600 max-w-xl mx-auto">
            Estamos aqui para ajudar. Entre em contato através dos canais abaixo.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {/* Email */}
          <div className="border border-gray-200 p-8 hover:border-gray-400 transition-colors">
            <div className="w-12 h-12 border border-gray-300 flex items-center justify-center mb-6">
              <Mail className="w-5 h-5 text-gray-700" />
            </div>
            <h3 className="text-lg font-medium mb-2">Email</h3>
            <p className="text-gray-500 text-sm mb-4">Resposta em até 24 horas úteis</p>
            <a 
              href="mailto:juris.ia.tech@gmail.com" 
              className="text-gray-900 hover:text-gray-600 transition-colors font-medium"
            >
              juris.ia.tech@gmail.com
            </a>
          </div>

          {/* Telefone */}
          <div className="border border-gray-200 p-8 hover:border-gray-400 transition-colors">
            <div className="w-12 h-12 border border-gray-300 flex items-center justify-center mb-6">
              <Phone className="w-5 h-5 text-gray-700" />
            </div>
            <h3 className="text-lg font-medium mb-2">Telefone</h3>
            <p className="text-gray-500 text-sm mb-4">Segunda a Sexta, 9h às 18h</p>
            <a 
              href="tel:+5586999931754" 
              className="text-gray-900 hover:text-gray-600 transition-colors font-medium"
            >
              (86) 99993-1754
            </a>
          </div>

          {/* Horário */}
          <div className="border border-gray-200 p-8 hover:border-gray-400 transition-colors">
            <div className="w-12 h-12 border border-gray-300 flex items-center justify-center mb-6">
              <Clock className="w-5 h-5 text-gray-700" />
            </div>
            <h3 className="text-lg font-medium mb-2">Horário de Atendimento</h3>
            <p className="text-gray-600 mb-1">Segunda a Sexta: 9h às 18h</p>
          </div>

          {/* Endereço */}
          <div className="border border-gray-200 p-8 hover:border-gray-400 transition-colors">
            <div className="w-12 h-12 border border-gray-300 flex items-center justify-center mb-6">
              <MapPin className="w-5 h-5 text-gray-700" />
            </div>
            <h3 className="text-lg font-medium mb-2">Localização</h3>
            <p className="text-gray-600">
              Piripiri, PI<br />
              Brasil
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="border border-gray-200 p-10 md:p-12 text-center">
          <h3 className="text-2xl font-light mb-4">Pronto para começar?</h3>
          <p className="text-gray-600 mb-8 max-w-lg mx-auto">
            Crie sua conta e transforme sua prática jurídica com inteligência artificial.
          </p>
          <Link 
            to={createPageUrl("Pricing")}
            className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-medium bg-gray-900 text-white rounded-none border-0 hover:bg-gray-800 transition-colors"
          >
            Criar Conta Grátis
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Link to={createPageUrl("LandingPage")} className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-gray-900" />
            <span className="font-medium">Juris</span>
          </Link>
          <p className="text-gray-500 text-sm">© 2024 Juris. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}