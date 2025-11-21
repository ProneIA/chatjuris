import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, CheckCheck, Trash2, MessageSquare, UserPlus, FileText, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function NotificationPanel({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: () => base44.entities.Notification.filter(
      { recipient_email: user.email },
      '-created_date',
      50
    ),
    enabled: !!user?.email,
    refetchInterval: 30000 // Atualizar a cada 30s
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(unread.map(n => 
        base44.entities.Notification.update(n.id, { is_read: true })
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success("Todas as notificações marcadas como lidas");
    }
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success("Notificação removida");
    }
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getIcon = (type) => {
    switch (type) {
      case 'comment': return <MessageSquare className="w-4 h-4" />;
      case 'mention': return <MessageSquare className="w-4 h-4" />;
      case 'task_assigned': return <CheckCheck className="w-4 h-4" />;
      case 'case_shared': return <FileText className="w-4 h-4" />;
      case 'document_shared': return <FileText className="w-4 h-4" />;
      case 'deadline': return <AlertCircle className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const handleNotificationClick = (notification) => {
    markAsReadMutation.mutate(notification.id);
    
    // Navegar para a página relevante
    if (notification.entity_type === 'case') {
      navigate(createPageUrl('Cases'));
    } else if (notification.entity_type === 'document') {
      navigate(createPageUrl('Documents'));
    } else if (notification.entity_type === 'task') {
      navigate(createPageUrl('Tasks'));
    }
    
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-600 text-white text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 top-12 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 max-h-[600px] flex flex-col"
            >
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">Notificações</h3>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markAllAsReadMutation.mutate()}
                    className="text-xs"
                  >
                    <CheckCheck className="w-3 h-3 mr-1" />
                    Marcar todas como lidas
                  </Button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">Nenhuma notificação</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${
                          !notification.is_read ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            !notification.is_read ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {getIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-semibold text-slate-900">
                                {notification.title}
                              </p>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotificationMutation.mutate(notification.id);
                                }}
                                className="h-6 w-6 p-0 text-slate-400 hover:text-red-600"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                            <p className="text-sm text-slate-600 mt-1">{notification.message}</p>
                            {notification.actor_name && (
                              <p className="text-xs text-slate-500 mt-1">
                                Por {notification.actor_name}
                              </p>
                            )}
                            <p className="text-xs text-slate-400 mt-1">
                              {moment(notification.created_date).fromNow()}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}