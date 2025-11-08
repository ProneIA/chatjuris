import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Folder, 
  FolderPlus, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  X,
  Check,
  Inbox,
  ChevronRight,
  ChevronDown
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const folderColors = {
  blue: "bg-blue-100 text-blue-700 border-blue-300",
  purple: "bg-purple-100 text-purple-700 border-purple-300",
  green: "bg-green-100 text-green-700 border-green-300",
  red: "bg-red-100 text-red-700 border-red-300",
  yellow: "bg-yellow-100 text-yellow-700 border-yellow-300",
  pink: "bg-pink-100 text-pink-700 border-pink-300",
  orange: "bg-orange-100 text-orange-700 border-orange-300",
  gray: "bg-gray-100 text-gray-700 border-gray-300"
};

export default function FolderSidebar({ 
  folders = [], 
  selectedFolder, 
  onSelectFolder, 
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder,
  cases = []
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [expandedFolders, setExpandedFolders] = useState(new Set());

  const getCaseCount = (folderId) => {
    return cases.filter(c => c.folder_id === folderId).length;
  };

  const uncategorizedCount = cases.filter(c => !c.folder_id).length;

  const handleCreate = () => {
    if (!newFolderName.trim()) return;
    onCreateFolder({ name: newFolderName, color: "blue" });
    setNewFolderName("");
    setIsCreating(false);
  };

  const handleUpdate = (folder, newName) => {
    if (!newName.trim()) return;
    onUpdateFolder(folder.id, { ...folder, name: newName });
    setEditingId(null);
  };

  const toggleExpanded = (folderId) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  // Organize folders hierarchically
  const rootFolders = folders.filter(f => !f.parent_folder_id);
  const getSubfolders = (parentId) => folders.filter(f => f.parent_folder_id === parentId);

  const FolderItem = ({ folder, level = 0 }) => {
    const subfolders = getSubfolders(folder.id);
    const hasSubfolders = subfolders.length > 0;
    const isExpanded = expandedFolders.has(folder.id);
    const isEditing = editingId === folder.id;
    const isSelected = selectedFolder === folder.id;
    const count = getCaseCount(folder.id);

    return (
      <div>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className={cn(
            "group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all mb-1",
            isSelected ? "bg-blue-50 border-l-4 border-l-blue-600" : "hover:bg-slate-50",
            level > 0 && "ml-4"
          )}
          style={{ paddingLeft: `${12 + level * 16}px` }}
        >
          {hasSubfolders && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(folder.id);
              }}
              className="shrink-0"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>
          )}

          <div
            onClick={() => !isEditing && onSelectFolder(folder.id)}
            className="flex items-center gap-2 flex-1 min-w-0"
          >
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
              folderColors[folder.color]
            )}>
              <Folder className="w-4 h-4" />
            </div>

            {isEditing ? (
              <Input
                autoFocus
                defaultValue={folder.name}
                onBlur={(e) => handleUpdate(folder, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleUpdate(folder, e.target.value);
                  if (e.key === 'Escape') setEditingId(null);
                }}
                onClick={(e) => e.stopPropagation()}
                className="h-7 text-sm"
              />
            ) : (
              <>
                <span className="font-medium text-slate-900 text-sm truncate flex-1">
                  {folder.name}
                </span>
                {count > 0 && (
                  <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                    {count}
                  </span>
                )}
              </>
            )}
          </div>

          {!isEditing && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditingId(folder.id)}>
                  <Edit2 className="w-3 h-3 mr-2" />
                  Renomear
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDeleteFolder(folder.id)}
                  className="text-red-600"
                >
                  <Trash2 className="w-3 h-3 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </motion.div>

        {hasSubfolders && isExpanded && (
          <AnimatePresence>
            {subfolders.map(subfolder => (
              <FolderItem key={subfolder.id} folder={subfolder} level={level + 1} />
            ))}
          </AnimatePresence>
        )}
      </div>
    );
  };

  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col h-full">
      <div className="p-4 border-b border-slate-200">
        <h2 className="font-semibold text-slate-900 mb-3">Organizar Processos</h2>
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

      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {/* All Cases / Uncategorized */}
        <motion.div
          onClick={() => onSelectFolder(null)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all mb-3",
            selectedFolder === null ? "bg-slate-100 border-l-4 border-l-slate-600" : "hover:bg-slate-50"
          )}
        >
          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
            <Inbox className="w-4 h-4 text-slate-600" />
          </div>
          <span className="font-medium text-slate-900 text-sm flex-1">
            Todos os Processos
          </span>
          {uncategorizedCount > 0 && (
            <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
              {uncategorizedCount}
            </span>
          )}
        </motion.div>

        {/* Create New Folder Form */}
        <AnimatePresence>
          {isCreating && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 mb-3"
            >
              <Input
                autoFocus
                placeholder="Nome da pasta..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate();
                  if (e.key === 'Escape') {
                    setIsCreating(false);
                    setNewFolderName("");
                  }
                }}
                className="mb-2"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleCreate} className="flex-1">
                  <Check className="w-3 h-3 mr-1" />
                  Criar
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => {
                    setIsCreating(false);
                    setNewFolderName("");
                  }}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Folders List */}
        <div className="space-y-1">
          {rootFolders.map(folder => (
            <FolderItem key={folder.id} folder={folder} />
          ))}
        </div>

        {folders.length === 0 && !isCreating && (
          <div className="text-center py-8 text-slate-400">
            <Folder className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma pasta ainda</p>
            <p className="text-xs mt-1">Crie pastas para organizar</p>
          </div>
        )}
      </div>
    </div>
  );
}