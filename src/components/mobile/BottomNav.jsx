import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard,
  FolderOpen,
  Sparkles,
  CheckSquare,
  Menu
} from "lucide-react";

const navItems = [
  { title: "Painel", url: createPageUrl("Dashboard"), icon: LayoutDashboard },
  { title: "Processos", url: createPageUrl("Cases"), icon: FolderOpen },
  { title: "IA", url: createPageUrl("AIAssistant"), icon: Sparkles, highlight: true },
  { title: "Tarefas", url: createPageUrl("Tasks"), icon: CheckSquare },
  { title: "Menu", url: null, icon: Menu, isMenu: true },
];

export default function BottomNav({ onMenuOpen }) {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.url && location.pathname === item.url;

          if (item.isMenu) {
            return (
              <button
                key="menu"
                onClick={onMenuOpen}
                className="flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[56px] text-gray-500"
              >
                <Icon className="w-6 h-6" />
                <span className="text-[10px] font-medium">Menu</span>
              </button>
            );
          }

          if (item.highlight) {
            return (
              <Link
                key={item.title}
                to={item.url}
                className="flex flex-col items-center justify-center -mt-4"
              >
                <div className="w-14 h-14 rounded-full bg-black flex items-center justify-center shadow-lg">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-[10px] font-medium text-gray-500 mt-1">{item.title}</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.title}
              to={item.url}
              className={`flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[56px] transition-colors ${
                isActive ? "text-black" : "text-gray-400"
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-[10px] font-medium">{item.title}</span>
              {isActive && (
                <div className="absolute bottom-0 w-1 h-1 rounded-full bg-black" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}