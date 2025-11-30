import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function MySubscription() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center">
        <h1 className="text-2xl font-light mb-4">Página em desenvolvimento</h1>
        <Link to={createPageUrl("Pricing")}>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Ver Planos
          </Button>
        </Link>
      </div>
    </div>
  );
}