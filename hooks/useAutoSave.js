/**
 * 自动保存 Hook
 * 自动保存草稿到本地，支持在线/离线模式
 */
import { useEffect, useRef, useCallback } from "react";
import { saveDraft, addToSyncQueue } from "../lib/offlineStorage";
import { useNetworkStatus } from "./useNetworkStatus";

/**
 * 自动保存 Hook
 * @param {Object} data - 需要保存的数据
 * @param {string} noteId - 笔记ID（新建时为null）
 * @param {string} userId - 用户ID
 * @param {Function} onSave - 在线保存回调
 * @param {Object} options - 配置选项
 */
export function useAutoSave(data, noteId, userId, onSave, options = {}) {
  const {
    delay = 2000, // 防抖延迟（毫秒）
    enabled = true, // 是否启用自动保存
  } = options;

  const { isOnline } = useNetworkStatus();
  const timerRef = useRef(null);
  const lastSavedRef = useRef(null);
  const isSavingRef = useRef(false);

  /**
   * 保存数据
   */
  const save = useCallback(async () => {
    if (!enabled || !data || isSavingRef.current) {
      return;
    }

    // 检查数据是否有变化
    const currentData = JSON.stringify(data);
    if (currentData === lastSavedRef.current) {
      return; // 数据未变化，跳过保存
    }

    isSavingRef.current = true;

    try {
      // 1. 始终保存草稿到本地
      await saveDraft(noteId, data, userId);

      // 2. 如果在线，尝试同步到服务器
      if (isOnline && onSave) {
        try {
          await onSave(data);
          console.log("✅ 已同步到服务器");
        } catch (error) {
          console.warn("⚠️ 同步到服务器失败，数据已保存到本地", error);

          // 添加到同步队列
          if (noteId) {
            await addToSyncQueue("update", {
              noteId: noteId,
              ...data,
            });
          }
        }
      } else {
        console.log("📵 离线模式，数据已保存到本地");

        // 添加到同步队列（如果是更新现有笔记）
        if (noteId) {
          await addToSyncQueue("update", {
            noteId: noteId,
            ...data,
          });
        }
      }

      // 更新最后保存的数据
      lastSavedRef.current = currentData;
    } catch (error) {
      console.error("❌ 自动保存失败:", error);
    } finally {
      isSavingRef.current = false;
    }
  }, [data, noteId, userId, isOnline, onSave, enabled]);

  /**
   * 防抖保存
   */
  useEffect(() => {
    if (!enabled || !data) {
      return;
    }

    // 清除之前的定时器
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // 设置新的定时器
    timerRef.current = setTimeout(() => {
      save();
    }, delay);

    // 清理函数
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [data, delay, enabled, save]);

  /**
   * 手动保存
   */
  const saveNow = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    await save();
  }, [save]);

  return {
    saveNow, // 手动触发保存
    isSaving: isSavingRef.current,
  };
}

export default useAutoSave;
