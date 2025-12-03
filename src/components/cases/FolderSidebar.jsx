import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Folder as FolderIcon,
  FolderPlus,
  Edit2,
  Trash2,
  MoreVertical,
  Check,
  X,
  Inbox
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const colorClasses = {
  blue: "bg-blue-100 text-blue-700 hover:bg-blue-200",
  purple: "bg-purple-100 text-purple-700 hover:bg-purple-200",
  green: "bg-green-100 text-green-700 hover:bg-green-200",
  orange: "bg-orange-100 text-orange-700 hover:bg-orange-200",
  red: "bg-red-100 text-red-700 hover:bg-red-200",
  pink: "bg-pink-100 text-pink-700 hover:bg-pink-200",
  yellow: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200",
  indigo: "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
};

export default function FolderSidebar({ 
  folders, 
  selectedFolder, 
  onSelectFolder, 
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder,
  caseCounts 
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [editFolderName, setEditFolderName] = useState("");

  const handleCreate = () => {
    if (newFolderName.trim()) {
      const colors = Object.keys(colorClasses);
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      onCreateFolder({ 
        name: newFolderName.trim(), 
        color: randomColor,
        order: folders.length 
      });
      setNewFolderName("");
      setIsCreating(false);
    }
  };

  const handleUpdate = (folder) => {
    if (editFolderName.trim()) {
      onUpdateFolder(folder.id, { ...folder, name: editFolderName.trim() });
      setEditingId(null);
      setEditFolderName("");
    }
  };

  const unfiledCount = caseCounts.unfiled || 0;
  const totalCount = caseCounts.total || 0;

  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col h-full">
      <div className="p-4 border-b border-slate-200">
        <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <FolderIcon className="w-4 h-4" />
          Organização
        </h3>
        <Button
          onClick={() => setIsCreating(true)}
          variant="outline"
          className="w-full justify-start"
          size="sm"
        >
          <FolderPlus className="w-4 h-4 mr-2" />
          Nova Pasta
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {/* All Cases */}
        <button
          onClick={() => onSelectFolder(null)}
          className={cn(
            "w-full flex items-center justify-between p-3 rounded-lg mb-1 transition-colors",
            !selectedFolder 
              ? "bg-slate-100 text-slate-900 font-medium" 
              : "text-slate-600 hover:bg-slate-50"
          )}
        >
          <div className="flex items-center gap-3">
            <Inbox className="w-4 h-4" />
            <span className="text-sm">Todos os Processos</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {totalCount}
          </Badge>
        </button>

        {/* Unfiled */}
        <button
          onClick={() => onSelectFolder('unfiled')}
          className={cn(
            "w-full flex items-center justify-between p-3 rounded-lg mb-3 transition-colors",
            selectedFolder === 'unfiled'
              ? "bg-slate-100 text-slate-900 font-medium" 
              : "text-slate-600 hover:bg-slate-50"
          )}
        >
          <div className="flex items-center gap-3">
            <FolderIcon className="w-4 h-4" />
            <span className="text-sm">Sem Pasta</span>
          </div>
          {unfiledCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {unfiledCount}
            </Badge>
          )}
        </button>

        {/* New Folder Form */}
        <AnimatePresence>
          {isCreating && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-2 p-2 bg-slate-50 rounded-lg"
            >
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Nome da pasta..."
                className="mb-2 text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                  if (e.key === "Escape") {
                    setIsCreating(false);
                    setNewFolderName("");
                  }
                }}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleCreate}
                  className="flex-1 h-7"
                  disabled={!newFolderName.trim()}
                >
                  <Check className="w-3 h-3 mr-1" />
                  Criar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false);
                    setNewFolderName("");
                  }}
                  className="h-7"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Folders List */}
        <div className="space-y-1">
          {folders.map((folder) => (
            <div key={folder.id}>
              {editingId === folder.id ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-2 bg-slate-50 rounded-lg mb-1"
                >
                  <Input
                    value={editFolderName}
                    onChange={(e) => setEditFolderName(e.target.value)}
                    className="mb-2 text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleUpdate(folder);
                      if (e.key === "Escape") {
                        setEditingId(null);
                        setEditFolderName("");
                      }
                    }}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleUpdate(folder)}
                      className="flex-1 h-7"
                      disabled={!editFolderName.trim()}
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Salvar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingId(null);
                        setEditFolderName("");
                      }}
                      className="h-7"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <button
                  onClick={() => onSelectFolder(folder.id)}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-lg transition-colors group",
                    selectedFolder === folder.id
                      ? colorClasses[folder.color]
                      : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FolderIcon className="w-4 h-4 shrink-0" />
                    <span className="text-sm truncate">{folder.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {(caseCounts[folder.id] || 0) > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {caseCounts[folder.id]}
                      </Badge>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100"
                        >
                          <MoreVertical className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(folder.id);
                            setEditFolderName(folder.name);
                          }}
                        >
                          <Edit2 className="w-3 h-3 mr-2" />
                          Renomear
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Deseja excluir a pasta "${folder.name}"? Os processos não serão deletados.`)) {
                              onDeleteFolder(folder.id);
                            }
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="w-3 h-3 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}