import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RegimeTributarioCalculator from "./RegimeTributarioCalculator";
import TeseSeculoCalculator from "./TeseSeculoCalculator";
import ExclusaoISSCalculator from "./ExclusaoISSCalculator";
import ConsumidorCalculator from "./ConsumidorCalculator";

export default function TributarioAdvancedCalculator({ isDark }) {
  return (
    <Tabs defaultValue="regimes" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="regimes">Regimes</TabsTrigger>
        <TabsTrigger value="tese_seculo">Tese do Século</TabsTrigger>
        <TabsTrigger value="exclusao_iss">Exclusão ISS</TabsTrigger>
        <TabsTrigger value="consumidor">Consumidor</TabsTrigger>
      </TabsList>
      
      <TabsContent value="regimes" className="mt-6">
        <RegimeTributarioCalculator isDark={isDark} />
      </TabsContent>
      
      <TabsContent value="tese_seculo" className="mt-6">
        <TeseSeculoCalculator isDark={isDark} />
      </TabsContent>
      
      <TabsContent value="exclusao_iss" className="mt-6">
        <ExclusaoISSCalculator isDark={isDark} />
      </TabsContent>
      
      <TabsContent value="consumidor" className="mt-6">
        <ConsumidorCalculator isDark={isDark} />
      </TabsContent>
    </Tabs>
  );
}