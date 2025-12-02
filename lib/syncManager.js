/**
 * 数据同步管理器
 * 处理离线数据与服务器的同步
 */
import { toast } from "sonner";
import {
  getUnsyncedOfflineNotes,
  markOfflineNoteSynced,
  deleteOfflineNote,
  getPendingSyncQueue,
  updateSyncQueueStatus,
  cleanSyncedQueue,
  getOfflineStats,
} from "./offlineStorage";

/**
 * 同步管理器类
 */
class SyncManager {
  constructor() {
    this.isSyncing = false;
    this.syncCallbacks = [];
    this.progressCallbacks = [];
  }

  /**
   * 注册同步状态变化回调
   */
  onSyncStatusChange(callback) {
    this.syncCallbacks.push(callback);
    return () => {
      this.syncCallbacks = this.syncCallbacks.filter((cb) => cb !== callback);
    };
  }

  /**
   * 注册同步进度回调
   */
  onSyncProgress(callback) {
    this.progressCallbacks.push(callback);
    return () => {
      this.progressCallbacks = this.progressCallbacks.filter((cb) => cb !== callback);
    };
  }

  /**
   * 通知同步状态变化
   */
  notifySyncStatus(status) {
    this.syncCallbacks.forEach((cb) => cb(status));
  }

  /**
   * 通知同步进度
   */
  notifySyncProgress(progress) {
    this.progressCallbacks.forEach((cb) => cb(progress));
  }

  /**
   * 执行完整同步
   * @param {string} userId - 用户ID
   * @param {Object} convexMutations - Convex mutations 对象
   */
  async syncAll(userId, convexMutations) {
    if (this.isSyncing) {
      console.log("⏳ 同步正在进行中，跳过...");
      return { success: false, message: "同步正在进行中" };
    }

    this.isSyncing = true;
    this.notifySyncStatus({ syncing: true, error: null });

    try {
      console.log("🔄 开始同步离线数据...");

      // 1. 获取统计信息
      const stats = await getOfflineStats(userId);
      const totalItems = stats.offlineNotesCount + stats.pendingQueueCount;

      if (totalItems === 0) {
        console.log("✅ 没有需要同步的数据");
        this.isSyncing = false;
        this.notifySyncStatus({ syncing: false, error: null });
        return { success: true, message: "没有需要同步的数据", synced: 0 };
      }

      let syncedCount = 0;
      const errors = [];

      // 2. 同步离线笔记
      const offlineNotes = await getUnsyncedOfflineNotes(userId);
      console.log(`📝 发现 ${offlineNotes.length} 个离线笔记`);

      for (let i = 0; i < offlineNotes.length; i++) {
        const note = offlineNotes[i];

        try {
          // 更新进度
          this.notifySyncProgress({
            current: syncedCount + 1,
            total: totalItems,
            message: `正在同步笔记: ${note.title}`,
          });

          // 调用 Convex 创建笔记
          const realId = await convexMutations.createNote({
            title: note.title,
            content: note.content,
            tags: note.tags,
            category: note.category,
            createdBy: userId,
          });

          // 标记为已同步
          await markOfflineNoteSynced(note.tempId, realId);
          syncedCount++;

          console.log(`✅ 离线笔记已同步: ${note.tempId} -> ${realId}`);
        } catch (error) {
          console.error(`❌ 同步离线笔记失败: ${note.tempId}`, error);
          errors.push({ type: "offlineNote", id: note.tempId, error: error.message });
        }
      }

      // 3. 同步操作队列
      const syncQueue = await getPendingSyncQueue();
      console.log(`📋 发现 ${syncQueue.length} 个待同步操作`);

      for (let i = 0; i < syncQueue.length; i++) {
        const item = syncQueue[i];

        try {
          // 更新进度
          this.notifySyncProgress({
            current: syncedCount + 1,
            total: totalItems,
            message: `正在同步操作: ${item.type}`,
          });

          // 标记为正在同步
          await updateSyncQueueStatus(item.id, "syncing");

          // 根据操作类型执行同步
          if (item.type === "create") {
            await convexMutations.createNote(item.data);
          } else if (item.type === "update") {
            await convexMutations.updateNote(item.data);
          } else if (item.type === "delete") {
            await convexMutations.deleteNote({ noteId: item.data.noteId });
          }

          // 标记为成功
          await updateSyncQueueStatus(item.id, "success");
          syncedCount++;

          console.log(`✅ 操作已同步: ${item.type} (ID: ${item.id})`);
        } catch (error) {
          console.error(`❌ 同步操作失败: ${item.type} (ID: ${item.id})`, error);
          await updateSyncQueueStatus(item.id, "failed", error.message);
          errors.push({ type: "syncQueue", id: item.id, error: error.message });
        }
      }

      // 4. 清理已成功同步的数据
      await cleanSyncedQueue();

      // 清理已同步的离线笔记（可选，保留一段时间以便查看）
      for (const note of offlineNotes) {
        if (note.synced) {
          await deleteOfflineNote(note.tempId);
        }
      }

      // 5. 同步完成
      this.isSyncing = false;
      this.notifySyncStatus({ syncing: false, error: null });

      if (errors.length === 0) {
        console.log(`✅ 同步完成！共同步 ${syncedCount} 项`);
        toast.success(`同步成功！已同步 ${syncedCount} 项数据`);
        return { success: true, synced: syncedCount, errors: [] };
      } else {
        console.warn(`⚠️ 同步部分完成：成功 ${syncedCount} 项，失败 ${errors.length} 项`);
        toast.warning(`同步部分完成：${syncedCount} 成功，${errors.length} 失败`);
        return { success: false, synced: syncedCount, errors };
      }
    } catch (error) {
      console.error("❌ 同步过程出错:", error);
      this.isSyncing = false;
      this.notifySyncStatus({ syncing: false, error: error.message });
      toast.error("同步失败：" + error.message);
      return { success: false, error: error.message, synced: 0 };
    }
  }

  /**
   * 快速检查是否有待同步数据
   * @param {string} userId - 用户ID
   */
  async hasPendingSync(userId) {
    try {
      const stats = await getOfflineStats(userId);
      return stats.totalPending > 0;
    } catch (error) {
      console.error("❌ 检查待同步数据失败:", error);
      return false;
    }
  }

  /**
   * 获取同步统计信息
   * @param {string} userId - 用户ID
   */
  async getSyncStats(userId) {
    return await getOfflineStats(userId);
  }
}

// 导出单例
const syncManager = new SyncManager();

export default syncManager;

// 同时导出类，以便测试
export { SyncManager };
