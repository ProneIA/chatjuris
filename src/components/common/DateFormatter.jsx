import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

// Detecta automaticamente o fuso horário do navegador do usuário
export const getUserTimezone = () => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

// Formata uma data no fuso horário local do usuário
export const formatLocalDate = (date, formatStr = "dd/MM/yyyy") => {
  if (!date) return "-";
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return format(dateObj, formatStr, { locale: ptBR });
  } catch (e) {
    return "-";
  }
};

// Formata data e hora no fuso horário local
export const formatLocalDateTime = (date, formatStr = "dd/MM/yyyy 'às' HH:mm") => {
  if (!date) return "-";
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return format(dateObj, formatStr, { locale: ptBR });
  } catch (e) {
    return "-";
  }
};

// Formata hora apenas
export const formatLocalTime = (date, formatStr = "HH:mm") => {
  if (!date) return "-";
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return format(dateObj, formatStr, { locale: ptBR });
  } catch (e) {
    return "-";
  }
};

// Componente React para exibir data formatada
export default function DateFormatter({ date, format: formatStr = "dd/MM/yyyy", showTime = false }) {
  if (!date) return <span>-</span>;
  
  const formatted = showTime 
    ? formatLocalDateTime(date, formatStr || "dd/MM/yyyy 'às' HH:mm")
    : formatLocalDate(date, formatStr);
    
  return <span title={getUserTimezone()}>{formatted}</span>;
}