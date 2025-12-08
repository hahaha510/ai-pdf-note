"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // 检查用户是否已登录
    const user = JSON.parse(localStorage.getItem("user"));

    if (user) {
      // 已登录，跳转到 dashboard
      router.push("/dashboard");
    } else {
      // 未登录，跳转到登录页
      router.push("/sign-in");
    }
  }, [router]);

  // 显示加载状态
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-white">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        <p className="mt-4 text-gray-600">加载中...</p>
      </div>
    </div>
  );
}
