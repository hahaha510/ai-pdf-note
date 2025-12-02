"use client";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 避免 hydration 错误：在挂载前返回占位符
  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="w-9 h-9 p-0" disabled>
        <div className="h-5 w-5" />
      </Button>
    );
  }

  const currentTheme = theme === "system" ? systemTheme : theme;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
      className="w-9 h-9 p-0"
      title={currentTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {currentTheme === "dark" ? (
        <Sun className="h-5 w-5 text-gray-300 transition-all" />
      ) : (
        <Moon className="h-5 w-5 text-gray-700 transition-all" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
