import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share, PlusSquare, MoreVertical, Menu, Smartphone, Monitor, ArrowUpCircle, CheckSquare } from "lucide-react";

export default function InstallInstructionsDialog({ open, onOpenChange, isIOS }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white text-slate-900">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-purple-600" />
            Instalar Juris App
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            Adicione o aplicativo à sua tela inicial para uma melhor experiência.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {isIOS ? (
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-slate-100">
                  <Share className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium text-sm text-slate-900">1. Toque em Compartilhar</p>
                  <p className="text-xs text-slate-500">Localizado na barra inferior do navegador.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-slate-100">
                  <PlusSquare className="w-4 h-4 text-slate-700" />
                </div>
                <div>
                  <p className="font-medium text-sm text-slate-900">2. Adicionar à Tela de Início</p>
                  <p className="text-xs text-slate-500">Role para baixo nas opções e selecione esta opção.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-slate-100">
                  <span className="text-blue-600 font-bold text-xs">Add</span>
                </div>
                <div>
                  <p className="font-medium text-sm text-slate-900">3. Confirmar</p>
                  <p className="text-xs text-slate-500">Toque em "Adicionar" no canto superior direito.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-slate-100">
                  <MoreVertical className="w-4 h-4 text-slate-700" />
                </div>
                <div>
                  <p className="font-medium text-sm text-slate-900">1. Abra o Menu</p>
                  <p className="text-xs text-slate-500">Toque nos três pontos no canto superior do navegador.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-slate-100">
                  <Smartphone className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-sm text-slate-900">2. Instalar ou Adicionar</p>
                  <p className="text-xs text-slate-500">Selecione "Instalar aplicativo" ou "Adicionar à tela inicial".</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-slate-100">
                  <CheckSquare className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-sm text-slate-900">3. Confirmar Instalação</p>
                  <p className="text-xs text-slate-500">Siga as instruções na tela para concluir.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button 
            onClick={() => onOpenChange(false)}
            className="bg-slate-900 text-white hover:bg-slate-800"
          >
            Entendi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}