"use client";
import { useEffect } from "react";

/**
 * Service Worker 注册组件
 * 在客户端注册 Service Worker，启用离线功能
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    // 仅在浏览器环境且支持 Service Worker 时注册
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      registerServiceWorker();
    }
  }, []);

  return null; // 不渲染任何内容
}

async function registerServiceWorker() {
  try {
    // 等待页面加载完成后再注册，避免影响首屏性能
    if (document.readyState === "complete") {
      await doRegister();
    } else {
      window.addEventListener("load", doRegister);
    }
  } catch (error) {
    console.error("❌ Service Worker 注册失败:", error);
  }
}

async function doRegister() {
  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });

    console.log("✅ Service Worker 注册成功:", registration.scope);

    // 监听更新
    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;
      console.log("🔄 发现 Service Worker 更新");

      newWorker.addEventListener("statechange", () => {
        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
          console.log("✨ 新版本 Service Worker 已安装");
          // 可以在这里提示用户刷新页面
        }
      });
    });

    // 检查更新（每小时检查一次）
    setInterval(
      () => {
        registration.update();
      },
      60 * 60 * 1000
    );
  } catch (error) {
    console.error("❌ Service Worker 注册失败:", error);
  }
}

export default ServiceWorkerRegistration;
