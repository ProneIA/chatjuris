import React from "react";
import { motion } from "framer-motion";
import { User, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      <div className={`shrink-0 h-8 w-8 rounded-xl flex items-center justify-center ${
        isUser 
          ? "bg-slate-200" 
          : "bg-gradient-to-br from-blue-500 to-purple-500"
      }`}>
        {isUser ? (
          <User className="w-4 h-4 text-slate-600" />
        ) : (
          <Sparkles className="w-4 h-4 text-white" />
        )}
      </div>

      {/* Message Content */}
      <div className={`flex flex-col gap-1 max-w-[75%] ${isUser ? "items-end" : "items-start"}`}>
        <div className={`rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
            : "bg-white border border-slate-200 text-slate-900 shadow-sm"
        }`}>
          {message.content && (
            isUser ? (
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            ) : (
              <ReactMarkdown
                className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
                  code: ({ inline, children }) => 
                    inline ? (
                      <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">{children}</code>
                    ) : (
                      <code className="block bg-slate-900 text-slate-100 p-3 rounded-lg my-2 overflow-x-auto text-xs">
                        {children}
                      </code>
                    ),
                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {children}
                    </a>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            )
          )}

          {message.image_url && (
            <div className="mt-2">
              <img
                src={message.image_url}
                alt="Imagem gerada"
                className="rounded-lg max-w-full h-auto shadow-lg"
              />
            </div>
          )}
        </div>

        {message.timestamp && (
          <span className="text-xs text-slate-400 px-2">
            {format(new Date(message.timestamp), "HH:mm", { locale: ptBR })}
          </span>
        )}
      </div>
    </motion.div>
  );
}