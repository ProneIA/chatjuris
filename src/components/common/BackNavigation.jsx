import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BackNavigation({ to, label = "Voltar", className = "", theme = 'light' }) {
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const handleBack = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        onClick={handleBack}
        variant="ghost"
        size="sm"
        className={`gap-2 ${isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">{label}</span>
      </Button>
    </div>
  );
}