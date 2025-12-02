/**
 * 离线状态指示器组件
 * 显示网络状态和待同步数据数量
 */
"use client";
import React, { useState, useEffect } from "react";
import { WifiOff, Wifi, Cloud, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import syncManager from "@/lib/syncManager";

export function OfflineIndicator({ userId, convexMutations, className = "" }) {
  const { isOnline } = useNetworkStatus();
  const [syncStats, setSyncStats] = useState({
    totalPending: 0,
    draftsCount: 0,
    offlineNotesCount: 0,
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });

  // 加载同步统计
  useEffect(() => {
    if (!userId) return;

    const loadStats = async () => {
      const stats = await syncManager.getSyncStats(userId);
      setSyncStats(stats);
    };

    loadStats();

    // 每30秒刷新一次统计
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  // 手动触发同步
  const handleSync = async () => {
    if (!userId || !convexMutations || isSyncing) return;

    await syncManager.syncAll(userId, convexMutations);

    // 刷新统计
    const stats = await syncManager.getSyncStats(userId);
    setSyncStats(stats);
  };

  // 监听网络状态变化，自动同步
  useEffect(() => {
    if (!isOnline || !userId || !convexMutations) return;

    const handleOnline = async () => {
      // 检查是否有待同步数据
      const hasPending = await syncManager.hasPendingSync(userId);
      if (hasPending) {
        // 延迟1秒后自动同步，避免网络刚恢复时不稳定
        setTimeout(() => {
          handleSync();
        }, 1000);
      }
    };

    window.addEventListener("network-online", handleOnline);
    return () => window.removeEventListener("network-online", handleOnline);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, userId, convexMutations]);

  // 监听同步状态
  useEffect(() => {
    const unsubscribeStatus = syncManager.onSyncStatusChange((status) => {
      setIsSyncing(status.syncing);
    });

    const unsubscribeProgress = syncManager.onSyncProgress((progress) => {
      setSyncProgress(progress);
    });

    return () => {
      unsubscribeStatus();
      unsubscribeProgress();
    };
  }, []);

  // 如果在线且没有待同步数据，不显示
  if (isOnline && syncStats.totalPending === 0 && !isSyncing) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* 网络状态图标 */}
      <div className="flex items-center gap-2">
        {isOnline ? (
          <Wifi className="w-4 h-4 text-green-600" />
        ) : (
          <WifiOff className="w-4 h-4 text-orange-600" />
        )}

        {/* 状态文本 */}
        <span className="text-sm font-medium">
          {isOnline ? (
            isSyncing ? (
              <span className="text-blue-600">正在同步...</span>
            ) : syncStats.totalPending > 0 ? (
              <span className="text-orange-600">有 {syncStats.totalPending} 项待同步</span>
            ) : (
              <span className="text-green-600">已同步</span>
            )
          ) : (
            <span className="text-orange-600">离线模式</span>
          )}
        </span>
      </div>

      {/* 同步按钮 */}
      {isOnline && syncStats.totalPending > 0 && !isSyncing && (
        <Button variant="outline" size="sm" onClick={handleSync} className="h-7 text-xs">
          <Cloud className="w-3 h-3 mr-1" />
          立即同步
        </Button>
      )}

      {/* 同步进度 */}
      {isSyncing && syncProgress.total > 0 && (
        <div className="flex items-center gap-1 text-xs text-blue-600">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>
            {syncProgress.current}/{syncProgress.total}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * 离线横幅组件（页面顶部显示）
 */
export function OfflineBanner() {
  const { isOnline } = useNetworkStatus();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // 离线时显示，延迟500ms避免闪烁
    if (!isOnline) {
      const timer = setTimeout(() => setShow(true), 500);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [isOnline]);

  if (!show) return null;

  return (
    <div className="bg-orange-50 border-l-4 border-orange-400 p-4">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-orange-400" />
        </div>
        <div className="ml-3">
          <p className="text-sm text-orange-700">
            <span className="font-medium">您当前处于离线状态</span>
            <span className="ml-2">笔记将保存到本地，网络恢复后自动同步到服务器。</span>
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * 同步进度浮层（右下角）
 */
export function SyncProgressToast() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, message: "" });

  useEffect(() => {
    const unsubscribeStatus = syncManager.onSyncStatusChange((status) => {
      setVisible(status.syncing);
    });

    const unsubscribeProgress = syncManager.onSyncProgress((prog) => {
      setProgress(prog);
    });

    return () => {
      unsubscribeStatus();
      unsubscribeProgress();
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg min-w-[250px]">
      <div className="flex items-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
        <div className="flex-1">
          <div className="text-sm font-medium">正在同步数据</div>
          {progress.message && <div className="text-xs opacity-90 mt-1">{progress.message}</div>}
          {progress.total > 0 && (
            <div className="text-xs opacity-90 mt-1">
              {progress.current} / {progress.total}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OfflineIndicator;
