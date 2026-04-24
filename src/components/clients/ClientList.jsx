import React from "react";
import { motion } from "framer-motion";
import { User, Building2, Mail, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function ClientList({ clients, isLoading, onSelectClient, selectedClient }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Skeleton key={i} className="h-32 sm:h-40 rounded-xl" />
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {clients.map(client => (
        <motion.div
          key={client.id}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelectClient(client)}
          className={`bg-white rounded-xl p-4 sm:p-6 border-2 cursor-pointer transition-all ${
            selectedClient?.id === client.id
              ? 'border-blue-500 shadow-lg'
              : 'border-slate-200 hover:border-blue-300 hover:shadow-md'
          }`}
          style={{ minHeight: 44 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${
              client.type === 'company' 
                ? 'bg-gradient-to-br from-green-500 to-emerald-500' 
                : 'bg-gradient-to-br from-blue-500 to-purple-500'
            }`}>
              {client.type === 'company' ? (
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              ) : (
                <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 text-base truncate">
                {client.name}
              </h3>
              <Badge variant={client.status === 'active' ? 'default' : 'secondary'} className="text-xs mt-0.5">
                {client.status === 'active' ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
          </div>

          <div className="space-y-1.5 text-sm">
            {client.email && (
              <div className="flex items-center gap-2 text-slate-600">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate text-xs sm:text-sm">{client.email}</span>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-2 text-slate-600">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-xs sm:text-sm">{client.phone}</span>
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}