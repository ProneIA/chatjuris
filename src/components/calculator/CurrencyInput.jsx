import React from "react";
import { Input } from "@/components/ui/input";

export default function CurrencyInput({ value, onChange, placeholder, className, disabled }) {
  const formatNumber = (num) => {
    if (!num) return "";
    const number = parseFloat(num);
    if (isNaN(number)) return "";
    return number.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const parseNumber = (str) => {
    if (!str) return "";
    return str.replace(/\./g, '').replace(',', '.');
  };

  const handleChange = (e) => {
    const inputValue = e.target.value;
    // Remove tudo exceto números, vírgula e ponto
    const cleaned = inputValue.replace(/[^\d,.]/g, '');
    const parsed = parseNumber(cleaned);
    onChange(parsed);
  };

  const displayValue = value ? formatNumber(value) : "";

  return (
    <Input
      type="text"
      value={displayValue}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
    />
  );
}

export function NumberInput({ value, onChange, placeholder, className, disabled, decimals = 0 }) {
  const formatNumber = (num) => {
    if (!num) return "";
    const number = parseFloat(num);
    if (isNaN(number)) return "";
    return number.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  const parseNumber = (str) => {
    if (!str) return "";
    return str.replace(/\./g, '').replace(',', '.');
  };

  const handleChange = (e) => {
    const inputValue = e.target.value;
    const cleaned = inputValue.replace(/[^\d,.]/g, '');
    const parsed = parseNumber(cleaned);
    onChange(parsed);
  };

  const displayValue = value ? formatNumber(value) : "";

  return (
    <Input
      type="text"
      value={displayValue}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
    />
  );
}