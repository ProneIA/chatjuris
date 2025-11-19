import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

export default function KeyboardShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ignorar se estiver digitando em input/textarea
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
        return;
      }

      // Ctrl/Cmd + K - Ir para Assistente IA
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        navigate(createPageUrl("AIAssistant"));
        toast.success("Assistente IA");
      }

      // Ctrl/Cmd + D - Ir para Dashboard
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        navigate(createPageUrl("Dashboard"));
        toast.success("Dashboard");
      }

      // Ctrl/Cmd + P - Ir para Processos
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault();
        navigate(createPageUrl("Cases"));
        toast.success("Processos");
      }

      // Ctrl/Cmd + C - Ir para Clientes
      if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        e.preventDefault();
        navigate(createPageUrl("Clients"));
        toast.success("Clientes");
      }

      // Ctrl/Cmd + T - Ir para Templates
      if ((e.ctrlKey || e.metaKey) && e.key === "t") {
        e.preventDefault();
        navigate(createPageUrl("Templates"));
        toast.success("Templates");
      }

      // Ctrl/Cmd + J - Ir para Jurisprudência
      if ((e.ctrlKey || e.metaKey) && e.key === "j") {
        e.preventDefault();
        navigate(createPageUrl("Jurisprudence"));
        toast.success("Jurisprudência");
      }

      // Ctrl/Cmd + L - Ir para Calendário
      if ((e.ctrlKey || e.metaKey) && e.key === "l") {
        e.preventDefault();
        navigate(createPageUrl("Calendar"));
        toast.success("Calendário");
      }

      // Ctrl/Cmd + , - Ir para Configurações
      if ((e.ctrlKey || e.metaKey) && e.key === ",") {
        e.preventDefault();
        navigate(createPageUrl("Settings"));
        toast.success("Configurações");
      }

      // ? - Mostrar atalhos
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        showShortcutsHelp();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [navigate]);

  const showShortcutsHelp = () => {
    toast(
      <div className="space-y-2">
        <p className="font-bold text-sm">Atalhos de Teclado</p>
        <div className="text-xs space-y-1">
          <div><kbd className="px-1 py-0.5 bg-slate-200 rounded">⌘K</kbd> Assistente IA</div>
          <div><kbd className="px-1 py-0.5 bg-slate-200 rounded">⌘D</kbd> Dashboard</div>
          <div><kbd className="px-1 py-0.5 bg-slate-200 rounded">⌘P</kbd> Processos</div>
          <div><kbd className="px-1 py-0.5 bg-slate-200 rounded">⌘C</kbd> Clientes</div>
          <div><kbd className="px-1 py-0.5 bg-slate-200 rounded">⌘T</kbd> Templates</div>
          <div><kbd className="px-1 py-0.5 bg-slate-200 rounded">⌘J</kbd> Jurisprudência</div>
          <div><kbd className="px-1 py-0.5 bg-slate-200 rounded">⌘L</kbd> Calendário</div>
          <div><kbd className="px-1 py-0.5 bg-slate-200 rounded">⌘,</kbd> Configurações</div>
          <div><kbd className="px-1 py-0.5 bg-slate-200 rounded">?</kbd> Ajuda</div>
        </div>
      </div>,
      { duration: 5000 }
    );
  };

  return null;
}