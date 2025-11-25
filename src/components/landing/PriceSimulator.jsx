import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight, Zap, Crown, Calculator, Sparkles } from "lucide-react";

export default function PriceSimulator({ onSubscribe }) {
  const [documentsPerMonth, setDocumentsPerMonth] = useState(20);
  const [hoursPerDocument, setHoursPerDocument] = useState(2);

  const hourlyRate = 150; // R$/hora média advogado
  const timeSavedPercent = 0.8; // 80% de economia

  const currentCost = documentsPerMonth * hoursPerDocument * hourlyRate;
  const timeSaved = documentsPerMonth * hoursPerDocument * timeSavedPercent;
  const moneySaved = currentCost * timeSavedPercent;
  const proPlanCost = 49.99;
  const netSavings = moneySaved - proPlanCost;
  const roi = ((netSavings / proPlanCost) * 100).toFixed(0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <Card className="bg-white/10 backdrop-blur-lg border-white/20 overflow-hidden">
        <CardContent className="p-6 sm:p-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Inputs */}
            <div className="space-y-8">
              <div>
                <label className="block text-white font-medium mb-4">
                  Quantos documentos você produz por mês?
                </label>
                <Slider
                  value={[documentsPerMonth]}
                  onValueChange={([val]) => setDocumentsPerMonth(val)}
                  max={100}
                  min={1}
                  step={1}
                  className="mb-2"
                />
                <div className="flex justify-between text-sm text-slate-400">
                  <span>1 doc</span>
                  <span className="text-white font-bold text-lg">{documentsPerMonth} documentos</span>
                  <span>100 docs</span>
                </div>
              </div>

              <div>
                <label className="block text-white font-medium mb-4">
                  Tempo médio por documento (horas)?
                </label>
                <Slider
                  value={[hoursPerDocument]}
                  onValueChange={([val]) => setHoursPerDocument(val)}
                  max={8}
                  min={0.5}
                  step={0.5}
                  className="mb-2"
                />
                <div className="flex justify-between text-sm text-slate-400">
                  <span>30min</span>
                  <span className="text-white font-bold text-lg">{hoursPerDocument}h</span>
                  <span>8h</span>
                </div>
              </div>

              <div className="bg-white/10 rounded-xl p-4">
                <p className="text-slate-300 text-sm mb-2">Valor hora estimado (mercado)</p>
                <p className="text-2xl font-bold text-white">R$ {hourlyRate}/hora</p>
              </div>
            </div>

            {/* Results */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-6 border border-green-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="w-5 h-5 text-green-400" />
                  <p className="text-green-400 font-medium">Sua Economia Mensal</p>
                </div>
                <p className="text-4xl sm:text-5xl font-black text-white mb-2">
                  R$ {moneySaved.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                </p>
                <p className="text-slate-300 text-sm">
                  ou {timeSaved.toFixed(0)} horas economizadas
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-slate-400 text-xs mb-1">Custo atual</p>
                  <p className="text-xl font-bold text-white">
                    R$ {currentCost.toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-slate-400 text-xs mb-1">Investimento Pro</p>
                  <p className="text-xl font-bold text-white">
                    R$ {proPlanCost.toFixed(2).replace('.', ',')}
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-4 border border-blue-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-400 text-sm font-medium">Retorno sobre Investimento</p>
                    <p className="text-3xl font-black text-white">{roi}x</p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>

              <Button 
                onClick={onSubscribe}
                size="lg"
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90 text-lg py-6"
              >
                Começar a Economizar Agora
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              <p className="text-center text-slate-400 text-xs">
                * Cálculo baseado em valores médios do mercado jurídico brasileiro
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plans comparison mini */}
      <div className="grid sm:grid-cols-2 gap-4 mt-8">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-slate-300" />
              </div>
              <div>
                <p className="font-bold text-white">Gratuito</p>
                <p className="text-slate-400 text-sm">R$ 0/mês</p>
              </div>
            </div>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-slate-300">
                <Check className="w-4 h-4 text-green-400" />
                5 ações de IA por dia
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-300">
                <Check className="w-4 h-4 text-green-400" />
                Até 3 clientes/processos
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-blue-500/30">
          <CardContent className="p-5">
            <Badge className="bg-yellow-500 text-yellow-900 mb-3">Recomendado</Badge>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-white">Profissional</p>
                <p className="text-blue-300 text-sm">R$ 49,99/mês</p>
              </div>
            </div>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-white">
                <Check className="w-4 h-4 text-green-400" />
                IA ilimitada
              </li>
              <li className="flex items-center gap-2 text-sm text-white">
                <Check className="w-4 h-4 text-green-400" />
                Todos os recursos Pro
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}