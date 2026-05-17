import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function LegalCalculator() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/CalculadoraJuridica", { replace: true });
  }, []);
  return null;
}