import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Edit, Mail, Phone, MapPin, FileText, User, Building2, DollarSign, MessageSquare, Bell, Briefcase } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ClientFinances from "./ClientFinances";
import ClientCommunicationHistory from "./ClientCommunicationHistory";
import ClientReminders from "./ClientReminders";
import ClientRelatedData from "./ClientRelatedData";

export default function ClientDetails({ client, onClose, onEdit, theme = 'light' }) {
  const isDark = theme === 'dark';
  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      className={`w-96 border-l overflow-y-auto ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-slate-200'}`}
    >
      <div className={`sticky top-0 border-b p-6 z-10 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Detalhes do Cliente</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => onEdit(client)} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600">
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="info" className="w-full">
        <TabsList className={`w-full grid grid-cols-5 ${isDark ? 'bg-neutral-800' : 'bg-gray-100'}`}>
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="communications"><MessageSquare className="w-4 h-4" /></TabsTrigger>
          <TabsTrigger value="reminders"><Bell className="w-4 h-4" /></TabsTrigger>
          <TabsTrigger value="related"><Briefcase className="w-4 h-4" /></TabsTrigger>
          <TabsTrigger value="finances"><DollarSign className="w-4 h-4" /></TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="p-6 space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-4 ${
            client.type === 'company' 
              ? 'bg-gradient-to-br from-green-500 to-emerald-500' 
              : 'bg-gradient-to-br from-blue-500 to-purple-500'
          }`}>
            {client.type === 'company' ? (
              <Building2 className="w-10 h-10 text-white" />
            ) : (
              <User className="w-10 h-10 text-white" />
            )}
          </div>
          <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{client.name}</h3>
          <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
            {client.status === 'active' ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>

        {/* Info Sections */}
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
              Informações de Contato
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>Email</p>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{client.email || 'Não informado'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>Telefone</p>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{client.phone}</p>
                </div>
              </div>
              {client.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>Endereço</p>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{client.address}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {client.cpf_cnpj && (
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                Documentos
              </p>
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
                    {client.type === 'company' ? 'CNPJ' : 'CPF'}
                  </p>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{client.cpf_cnpj}</p>
                </div>
              </div>
            </div>
          )}

          {client.notes && (
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                Observações
              </p>
              <p className={`text-sm rounded-lg p-3 ${isDark ? 'text-neutral-300 bg-neutral-800' : 'text-slate-700 bg-slate-50'}`}>
                {client.notes}
              </p>
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
              Informações do Sistema
            </p>
            <div className={`text-sm space-y-1 ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
              <p>
                Criado em: {format(new Date(client.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
              <p>ID: {client.id}</p>
            </div>
          </div>
        </div>
        </TabsContent>

        <TabsContent value="communications" className="p-6">
          <ClientCommunicationHistory clientId={client.id} clientName={client.name} theme={theme} />
        </TabsContent>

        <TabsContent value="reminders" className="p-6">
          <ClientReminders clientId={client.id} clientName={client.name} theme={theme} />
        </TabsContent>

        <TabsContent value="related" className="p-6">
          <ClientRelatedData clientId={client.id} theme={theme} />
        </TabsContent>

        <TabsContent value="finances" className="p-6">
          <ClientFinances clientId={client.id} theme={theme} />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}