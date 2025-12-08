"use client";
import React, { useState, useEffect } from "react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

function Header() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    setUser(userData);
  }, []);

  const handleLogout = async () => {
    try {
      // 调用登出 API
      await fetch("/api/auth/logout", {
        method: "POST",
      });

      // 清除本地存储的用户信息
      localStorage.removeItem("user");

      // 跳转到登录页
      router.push("/sign-in");
    } catch (error) {
      console.error("登出失败:", error);
      // 即使 API 调用失败，也清除本地数据并跳转
      localStorage.removeItem("user");
      router.push("/sign-in");
    }
  };

  return (
    <div className="flex justify-end items-center gap-3 p-5 shadow-sm">
      <ThemeToggle />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-10 w-10 rounded-full p-0 hover:bg-transparent"
          >
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white font-medium hover:opacity-80 transition-opacity">
              {user?.userName?.[0]?.toUpperCase() || "U"}
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user?.userName || "用户"}</p>
              <p className="text-xs leading-none text-muted-foreground">{user?.email || ""}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
            <LogOut className="mr-2 h-4 w-4" />
            <span>退出登录</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
export default Header;
