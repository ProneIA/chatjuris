import React from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";

export default function LandingPage() {
  const handleLogin = () => {
    base44.auth.redirectToLogin(createPageUrl("Dashboard"));
  };

  return (
    <div 
      className="min-h-screen w-full relative"
      style={{
        backgroundImage: `url('https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690e408daf48e0f633c6cf3a/ec0dffc16_Gemini_Generated_Image_72n7ph72n7ph72n7.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay escuro para melhor legibilidade */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Conteúdo */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Navegação */}
        <nav className="w-full px-6 md:px-12 py-6 flex items-center justify-between">
          <span className="text-2xl font-semibold text-white tracking-tight">
            Juris
          </span>
          
          <button 
            onClick={handleLogin}
            className="px-6 py-2.5 text-sm font-medium bg-white text-gray-900 rounded-md hover:bg-gray-100 transition-all"
          >
            Entrar
          </button>
        </nav>

        {/* Título centralizado */}
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-white tracking-tight leading-tight">
              Direito Tradicional.
            </h1>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-white tracking-tight leading-tight mt-2">
              Soluções Modernas.
            </h1>
            
            {/* Linha decorativa */}
            <div className="w-20 h-1 bg-white mx-auto mt-8 rounded-full" />

            {/* Botão Assinar Agora */}
            <Link 
              to={createPageUrl("Plans")}
              className="inline-block mt-10 px-8 py-3.5 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-all shadow-lg hover:shadow-xl"
            >
              Assinar agora
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}