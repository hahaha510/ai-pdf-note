"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Eye, Edit3, AlertCircle, Loader2 } from "lucide-react";

export default function SharePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token;

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 获取分享信息
  const shareInfo = useQuery(api.shares.getShareByToken, { shareToken: token });

  useEffect(() => {
    // 检查用户登录状态
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  // 处理访问笔记
  const handleAccess = () => {
    if (!user) {
      // 未登录，跳转到登录页
      router.push(`/sign-in?from=/share/${token}`);
      return;
    }

    if (shareInfo && !shareInfo.expired) {
      // 已登录且链接有效，跳转到笔记页面
      router.push(`/workspace/${shareInfo.noteId}?share=${token}`);
    }
  };

  // 加载中
  if (loading || shareInfo === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  // 链接无效
  if (!shareInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-md w-full p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">链接无效</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">此分享链接不存在或已被删除</p>
          <Button onClick={() => router.push("/dashboard")}>返回首页</Button>
        </div>
      </div>
    );
  }

  // 链接已过期
  if (shareInfo.expired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-md w-full p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg text-center">
          <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">链接已过期</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            此分享链接已过期，请联系分享者重新生成
          </p>
          <Button onClick={() => router.push("/dashboard")}>返回首页</Button>
        </div>
      </div>
    );
  }

  // 显示访问界面
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-md w-full p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
            {shareInfo.permission === "view" ? (
              <Eye className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            ) : (
              <Edit3 className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            )}
          </div>
          <h1 className="text-2xl font-bold mb-2">加入协同笔记</h1>
          <p className="text-gray-600 dark:text-gray-400">
            有人邀请你{shareInfo.permission === "view" ? "查看" : "编辑"}一份笔记
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">权限</span>
              <span className="text-sm font-semibold">
                {shareInfo.permission === "view" ? "可查看" : "可编辑"}
              </span>
            </div>
            {shareInfo.expiresAt && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">有效期</span>
                <span className="text-sm font-semibold">
                  {new Date(shareInfo.expiresAt).toLocaleDateString("zh-CN")}
                </span>
              </div>
            )}
          </div>

          {!user && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">ℹ️ 需要登录才能访问此笔记</p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Button onClick={handleAccess} className="w-full" size="lg">
            {user ? "打开笔记" : "登录后访问"}
          </Button>

          {user && (
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              以 {user.userName || user.email} 的身份访问
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
