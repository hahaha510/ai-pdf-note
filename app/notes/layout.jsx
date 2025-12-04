"use client";
import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";

export default function NotesLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);

  // 判断是否在笔记详情页
  const isNoteDetailPage = pathname && pathname.startsWith("/notes/") && pathname !== "/notes";

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (userData) {
      setUser(userData);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative flex items-center justify-between py-4">
            {/* 左侧 */}
            <div className="flex items-center">
              {!isNoteDetailPage && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/")}
                  className="flex items-center"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  返回主页
                </Button>
              )}
            </div>

            {/* 中间标题 - 绝对居中 */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap mt-5">
                Online Notes
              </h1>
            </div>

            {/* 右侧 */}
            <div className="flex items-center gap-3">
              <ThemeToggle />
              {user && <UserMenu user={user} />}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}
