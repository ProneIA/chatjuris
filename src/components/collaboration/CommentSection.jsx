import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { MessageSquare, Send, Trash2, AtSign } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import moment from "moment";

export default function CommentSection({ entityType, entityId }) {
  const [user, setUser] = useState(null);
  const [newComment, setNewComment] = useState("");
  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', entityType, entityId],
    queryFn: () => base44.entities.Comment.filter(
      { entity_type: entityType, entity_id: entityId },
      '-created_date'
    ),
    enabled: !!entityId
  });

  const createCommentMutation = useMutation({
    mutationFn: (data) => base44.entities.Comment.create(data),
    onSuccess: async (newComment) => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      setNewComment("");
      
      // Criar notificações para menções
      if (newComment.mentions?.length > 0) {
        for (const mentionEmail of newComment.mentions) {
          await base44.entities.Notification.create({
            type: "mention",
            title: "Você foi mencionado",
            message: `${user.full_name} mencionou você em um comentário`,
            recipient_email: mentionEmail,
            entity_type: entityType,
            entity_id: entityId,
            actor_email: user.email,
            actor_name: user.full_name
          });
        }
      }
      
      toast.success("Comentário adicionado!");
    }
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (id) => base44.entities.Comment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      toast.success("Comentário removido!");
    }
  });

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    // Detectar menções @email
    const mentions = [];
    const mentionRegex = /@(\S+@\S+\.\S+)/g;
    let match;
    while ((match = mentionRegex.exec(newComment)) !== null) {
      mentions.push(match[1]);
    }

    createCommentMutation.mutate({
      content: newComment,
      entity_type: entityType,
      entity_id: entityId,
      author_email: user.email,
      author_name: user.full_name,
      mentions
    });
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 text-slate-600" />
        <h3 className="font-semibold text-slate-900">Comentários ({comments.length})</h3>
      </div>

      <div className="space-y-4 mb-4">
        {comments.map((comment) => (
          <motion.div
            key={comment.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-50 rounded-lg p-4"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-semibold text-sm text-slate-900">{comment.author_name}</p>
                <p className="text-xs text-slate-500">
                  {moment(comment.created_date).format('DD/MM/YYYY HH:mm')}
                </p>
              </div>
              {comment.author_email === user?.email && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteCommentMutation.mutate(comment.id)}
                  className="text-red-600 hover:text-red-700 h-6"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{comment.content}</p>
            {comment.mentions?.length > 0 && (
              <div className="flex items-center gap-1 mt-2">
                <AtSign className="w-3 h-3 text-blue-600" />
                <p className="text-xs text-blue-600">
                  Mencionou: {comment.mentions.join(", ")}
                </p>
              </div>
            )}
          </motion.div>
        ))}

        {comments.length === 0 && (
          <div className="text-center py-8 text-slate-500 text-sm">
            Nenhum comentário ainda. Seja o primeiro!
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Textarea
          placeholder="Adicione um comentário... (use @email para mencionar alguém)"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[100px]"
        />
        <div className="flex justify-between items-center">
          <p className="text-xs text-slate-500">
            <AtSign className="w-3 h-3 inline mr-1" />
            Use @email para mencionar colaboradores
          </p>
          <Button
            onClick={handleAddComment}
            disabled={!newComment.trim() || createCommentMutation.isPending}
            size="sm"
          >
            <Send className="w-4 h-4 mr-2" />
            Comentar
          </Button>
        </div>
      </div>
    </Card>
  );
}