import React from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ThemeToggle({ className = "" }) {
  const [theme, setTheme] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('juris-theme') || 'light';
    }
    return 'light';
  });

  React.useEffect(() => {
    const root = window.document.documentElement;
    root.setAttribute('data-theme', theme);
    localStorage.setItem('juris-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={`relative ${className}`}
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5" />
      ) : (
        <Sun className="w-5 h-5" />
      )}
    </Button>
  );
}

export function useTheme() {
  const [theme, setTheme] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('juris-theme') || 'light';
    }
    return 'light';
  });

  React.useEffect(() => {
    const handleStorageChange = () => {
      setTheme(localStorage.getItem('juris-theme') || 'light');
    };

    window.addEventListener('storage', handleStorageChange);
    
    const observer = new MutationObserver(() => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      if (currentTheme && currentTheme !== theme) {
        setTheme(currentTheme);
      }
    });
    
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      observer.disconnect();
    };
  }, [theme]);

  return theme;
}