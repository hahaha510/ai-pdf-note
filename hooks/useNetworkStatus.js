/**
 * 网络状态监听 Hook
 * 实时监测在线/离线状态
 */
import { useState, useEffect } from "react";

export function useNetworkStatus() {
  // 初始化在线状态
  const [isOnline, setIsOnline] = useState(typeof window !== "undefined" ? navigator.onLine : true);

  const [lastOnlineTime, setLastOnlineTime] = useState(Date.now());
  const [lastOfflineTime, setLastOfflineTime] = useState(null);

  useEffect(() => {
    // 在线事件处理
    const handleOnline = () => {
      console.log("🌐 网络已恢复");
      setIsOnline(true);
      setLastOnlineTime(Date.now());

      // 触发自定义事件，通知其他组件开始同步
      window.dispatchEvent(new CustomEvent("network-online"));
    };

    // 离线事件处理
    const handleOffline = () => {
      console.log("📵 网络已断开");
      setIsOnline(false);
      setLastOfflineTime(Date.now());

      // 触发自定义事件
      window.dispatchEvent(new CustomEvent("network-offline"));
    };

    // 添加事件监听
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // 初始检查（避免状态不同步）
    if (navigator.onLine !== isOnline) {
      setIsOnline(navigator.onLine);
    }

    // 清理事件监听
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [isOnline]);

  // 手动触发网络检查（可选）
  const checkNetworkStatus = () => {
    return navigator.onLine;
  };

  return {
    isOnline,
    isOffline: !isOnline,
    lastOnlineTime,
    lastOfflineTime,
    checkNetworkStatus,
  };
}

export default useNetworkStatus;
