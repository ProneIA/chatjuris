import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RegimeTributarioCalculator from "./RegimeTributarioCalculator";
import TeseSeculoCalculator from "./TeseSeculoCalculator";
import ExclusaoISSCalculator from "./ExclusaoISSCalculator";

export default function TributarioAdvancedCalculator({ isDark }) {
  return (
    <Tabs defaultValue="regimes" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="regimes">Regimes</TabsTrigger>
        <TabsTrigger value="tese_seculo">Tese do Século</TabsTrigger>
        <TabsTrigger value="exclusao_iss">Exclusão ISS</TabsTrigger>
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
    </Tabs>
  );
}