"use client";
import React, { useState, useEffect } from "react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { syncManager } from "@/lib/syncManager";
import { WifiOff, Wifi, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function OfflineIndicator({ onSync }) {
  const { isOnline, wasOffline } = useNetworkStatus();
  const [syncStatus, setSyncStatus] = useState({ unsyncedCount: 0, isSyncing: false });
  const [showDetails, setShowDetails] = useState(false);

  // 检查同步状态
  useEffect(() => {
    const checkSyncStatus = async () => {
      const status = await syncManager.getSyncStatus();
      setSyncStatus(status);
    };

    checkSyncStatus();
    const interval = setInterval(checkSyncStatus, 5000); // 每5秒检查一次

    return () => clearInterval(interval);
  }, [isOnline]);

  // 网络恢复时自动同步
  useEffect(() => {
    if (wasOffline && syncStatus.hasUnsynced && onSync) {
      toast.info("网络已恢复，正在同步离线数据...");
      onSync();
    }
  }, [wasOffline, syncStatus.hasUnsynced, onSync]);

  const handleManualSync = () => {
    if (onSync) {
      onSync();
    }
  };

  if (isOnline && syncStatus.unsyncedCount === 0) {
    return null; // 在线且无未同步数据，不显示
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg transition-all ${
          isOnline ? "bg-blue-500 text-white" : "bg-orange-500 text-white"
        }`}
        onMouseEnter={() => setShowDetails(true)}
        onMouseLeave={() => setShowDetails(false)}
      >
        {/* 状态图标 */}
        {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5 animate-pulse" />}

        {/* 状态文本 */}
        <div className="flex flex-col">
          <span className="text-sm font-semibold">{isOnline ? "在线" : "离线模式"}</span>
          {syncStatus.unsyncedCount > 0 && (
            <span className="text-xs opacity-90">{syncStatus.unsyncedCount} 个笔记待同步</span>
          )}
        </div>

        {/* 同步按钮 */}
        {isOnline && syncStatus.unsyncedCount > 0 && (
          <Button
            size="sm"
            variant="ghost"
            className="ml-2 text-white hover:bg-white/20"
            onClick={handleManualSync}
            disabled={syncStatus.isSyncing}
          >
            {syncStatus.isSyncing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        )}

        {/* 详细信息提示 */}
        {showDetails && !isOnline && (
          <div className="absolute bottom-full right-0 mb-2 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg max-w-xs">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">离线模式已启用</p>
                <p>您可以继续编辑笔记，所有更改将保存在本地。</p>
                <p className="mt-1">网络恢复后将自动同步。</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
