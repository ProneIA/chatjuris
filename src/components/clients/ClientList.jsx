import React from "react";
import { motion } from "framer-motion";
import { User, Building2, Mail, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function ClientList({ clients, isLoading, onSelectClient, selectedClient }) {
  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="w-16 h-16 mx-auto text-slate-300 mb-4" />
        <p className="text-slate-500">Nenhum cliente encontrado</p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {clients.map(client => (
        <motion.div
          key={client.id}
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelectClient(client)}
          className={`bg-white rounded-xl p-6 border-2 cursor-pointer transition-all ${
            selectedClient?.id === client.id
              ? 'border-blue-500 shadow-lg'
              : 'border-slate-200 hover:border-blue-300 hover:shadow-md'
          }`}
        >
          <div className="flex items-start justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              client.type === 'company' 
                ? 'bg-gradient-to-br from-green-500 to-emerald-500' 
                : 'bg-gradient-to-br from-blue-500 to-purple-500'
            }`}>
              {client.type === 'company' ? (
                <Building2 className="w-6 h-6 text-white" />
              ) : (
                <User className="w-6 h-6 text-white" />
              )}
            </div>
            <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
              {client.status === 'active' ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>

          <h3 className="font-semibold text-slate-900 text-lg mb-3 truncate">
            {client.name}
          </h3>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <Mail className="w-4 h-4 text-slate-400" />
              <span className="truncate">{client.email}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Phone className="w-4 h-4 text-slate-400" />
              <span>{client.phone}</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}