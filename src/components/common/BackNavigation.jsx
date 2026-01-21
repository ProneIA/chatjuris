import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BackNavigation({ theme = 'light', customLabel, customAction }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isDark = theme === 'dark';

  // Não mostrar na página inicial
  if (location.pathname === '/' || location.pathname === '/Dashboard') {
    return null;
  }

  const handleBack = () => {
    if (customAction) {
      customAction();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className={`sticky top-14 z-10 border-b ${isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-gray-50 border-gray-200'}`}>
      <div className="max-w-7xl mx-auto px-4 py-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className={`flex items-center gap-2 ${isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">{customLabel || 'Voltar'}</span>
        </Button>
      </div>
    </div>
  );
}