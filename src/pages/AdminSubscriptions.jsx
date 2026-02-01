import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AdminSubscriptions() {
  const navigate = useNavigate();
  
  React.useEffect(() => {
    navigate(createPageUrl("Dashboard"));
  }, [navigate]);

  return null;
}