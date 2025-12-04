/**
 * 后台同步服务
 * 网络恢复时自动同步待处理的数据
 */
import { getPendingSyncQueue, updateSyncQueueStatus, cleanSyncedQueue } from "./offlineStorage";

/**
 * 执行同步队列
 * @param {Object} convexMutations - Convex mutation 函数对象
 */
export async function syncQueue(convexMutations) {
  console.log("🔄 开始同步队列...");

  const pendingItems = await getPendingSyncQueue();

  if (pendingItems.length === 0) {
    console.log("✅ 没有待同步项");
    return { success: 0, failed: 0 };
  }

  console.log(`📋 找到 ${pendingItems.length} 个待同步项`);

  let successCount = 0;
  let failedCount = 0;

  for (const item of pendingItems) {
    try {
      await updateSyncQueueStatus(item.id, "syncing");

      // 根据操作类型执行对应的 mutation
      switch (item.type) {
        case "create":
          await convexMutations.createNote(item.data);
          break;
        case "update":
          await convexMutations.updateNote(item.data);
          break;
        case "delete":
          await convexMutations.deleteNote(item.data);
          break;
        default:
          throw new Error(`未知操作类型: ${item.type}`);
      }

      await updateSyncQueueStatus(item.id, "success");
      successCount++;
      console.log(`✅ 同步成功: ${item.type}`, item.data.noteId);
    } catch (error) {
      console.error(`❌ 同步失败: ${item.type}`, error);
      await updateSyncQueueStatus(item.id, "failed", error.message);
      failedCount++;
    }
  }

  // 清理已成功的队列项
  await cleanSyncedQueue();

  console.log(`🎉 同步完成: 成功 ${successCount}, 失败 ${failedCount}`);

  return { success: successCount, failed: failedCount };
}

/**
 * 自动同步服务
 * 监听网络状态，自动触发同步
 */
export class AutoSyncService {
  constructor(convexMutations) {
    this.convexMutations = convexMutations;
    this.isOnline = navigator.onLine;
    this.isSyncing = false;
    this.syncInterval = null;
  }

  /**
   * 启动自动同步
   */
  start() {
    // 监听网络状态变化
    window.addEventListener("online", this.handleOnline);
    window.addEventListener("offline", this.handleOffline);

    // 如果当前在线，立即同步一次
    if (this.isOnline) {
      this.sync();
    }

    // 定期检查并同步（每5分钟）
    this.syncInterval = setInterval(
      () => {
        if (this.isOnline && !this.isSyncing) {
          this.sync();
        }
      },
      5 * 60 * 1000
    );

    console.log("🚀 自动同步服务已启动");
  }

  /**
   * 停止自动同步
   */
  stop() {
    window.removeEventListener("online", this.handleOnline);
    window.removeEventListener("offline", this.handleOffline);

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    console.log("⏹️ 自动同步服务已停止");
  }

  /**
   * 网络恢复处理
   */
  handleOnline = () => {
    console.log("🌐 网络已连接");
    this.isOnline = true;
    // 网络恢复后立即同步
    setTimeout(() => this.sync(), 1000);
  };

  /**
   * 网络断开处理
   */
  handleOffline = () => {
    console.log("📵 网络已断开");
    this.isOnline = false;
  };

  /**
   * 执行同步
   */
  async sync() {
    if (this.isSyncing) {
      console.log("⏳ 同步正在进行中...");
      return;
    }

    this.isSyncing = true;

    try {
      const result = await syncQueue(this.convexMutations);

      if (result.success > 0) {
        // 通知用户同步成功
        if (typeof window !== "undefined" && window.dispatchEvent) {
          window.dispatchEvent(
            new CustomEvent("sync-success", {
              detail: result,
            })
          );
        }
      }
    } catch (error) {
      console.error("❌ 同步过程出错:", error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * 手动触发同步
   */
  async syncNow() {
    return await this.sync();
  }
}

export default { syncQueue, AutoSyncService };
