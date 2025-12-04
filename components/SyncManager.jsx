"use client";
import { useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { AutoSyncService } from "@/lib/syncService";
import { toast } from "sonner";

/**
 * 同步管理器组件
 * 自动处理离线数据同步
 */
export function SyncManager() {
  const syncServiceRef = useRef(null);

  // Convex mutations
  const createNote = useMutation(api.onlineNotes.createNote);
  const updateNote = useMutation(api.onlineNotes.updateNote);
  const deleteNote = useMutation(api.onlineNotes.deleteNote);

  useEffect(() => {
    // 初始化同步服务
    if (!syncServiceRef.current) {
      syncServiceRef.current = new AutoSyncService({
        createNote,
        updateNote,
        deleteNote,
      });
      syncServiceRef.current.start();
    }

    // 监听同步成功事件
    const handleSyncSuccess = (event) => {
      const { success, failed } = event.detail;
      if (success > 0) {
        toast.success(`✅ 已同步 ${success} 条更新`);
      }
      if (failed > 0) {
        toast.error(`❌ ${failed} 条同步失败`);
      }
    };

    window.addEventListener("sync-success", handleSyncSuccess);

    // 清理
    return () => {
      window.removeEventListener("sync-success", handleSyncSuccess);
      if (syncServiceRef.current) {
        syncServiceRef.current.stop();
      }
    };
  }, [createNote, updateNote, deleteNote]);

  return null;
}

export default SyncManager;
