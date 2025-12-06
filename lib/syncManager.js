import { offlineStorage } from "./offlineStorage";
import { toast } from "sonner";

/**
 * 同步管理器
 * 负责在网络恢复时将离线数据同步到后端
 */
class SyncManager {
  constructor() {
    this.isSyncing = false;
    this.syncCallbacks = [];
  }

  /**
   * 注册同步回调函数
   * @param {Function} callback - 同步函数，接收笔记数据并返回 Promise
   */
  registerSyncCallback(callback) {
    this.syncCallbacks.push(callback);
  }

  /**
   * 执行同步
   * @param {Function} updateNoteMutation - Convex mutation 函数
   * @param {Function} createNoteMutation - Convex mutation 函数（可选）
   */
  async syncAll(updateNoteMutation, createNoteMutation = null) {
    if (this.isSyncing) {
      console.log("同步已在进行中...");
      return { success: 0, failed: 0 };
    }

    this.isSyncing = true;
    const unsyncedNotes = await offlineStorage.getUnsyncedNotes();

    if (unsyncedNotes.length === 0) {
      this.isSyncing = false;
      return { success: 0, failed: 0 };
    }

    console.log(`开始同步 ${unsyncedNotes.length} 个离线笔记...`);

    let successCount = 0;
    let failedCount = 0;
    const results = [];

    for (const note of unsyncedNotes) {
      try {
        // 判断是更新还是创建
        const isNewNote = note.noteId.startsWith("offline_");

        if (isNewNote && createNoteMutation) {
          // 创建新笔记
          const result = await createNoteMutation({
            title: note.title,
            content: note.content,
            plainContent: note.plainContent,
            excerpt: note.excerpt,
            tags: note.tags || [],
            category: note.category,
            type: note.type || "note",
            createdBy: note.createdBy,
          });

          // 删除旧的离线笔记，使用新的 ID
          await offlineStorage.deleteNote(note.noteId);

          // 保存新笔记（已同步）
          await offlineStorage.saveNote({
            ...note,
            noteId: result.noteId || result._id,
            synced: true,
          });

          successCount++;
          results.push({ noteId: note.noteId, status: "created", newId: result.noteId });
        } else {
          // 更新现有笔记
          await updateNoteMutation({
            noteId: note.noteId,
            content: note.content,
            plainContent: note.plainContent,
            title: note.title,
            tags: note.tags,
            category: note.category,
          });

          // 标记为已同步
          await offlineStorage.markAsSynced(note.noteId);
          successCount++;
          results.push({ noteId: note.noteId, status: "updated" });
        }

        console.log(`✓ 同步成功: ${note.title}`);
      } catch (error) {
        console.error(`✗ 同步失败: ${note.title}`, error);
        failedCount++;
        results.push({ noteId: note.noteId, status: "failed", error: error.message });
      }
    }

    this.isSyncing = false;

    // 显示同步结果
    if (successCount > 0) {
      toast.success(`成功同步 ${successCount} 个笔记`);
    }
    if (failedCount > 0) {
      toast.error(`${failedCount} 个笔记同步失败`);
    }

    return { success: successCount, failed: failedCount, results };
  }

  /**
   * 同步单个笔记
   */
  async syncNote(noteId, updateNoteMutation) {
    const note = await offlineStorage.getNote(noteId);
    if (!note || note.synced) {
      return { success: false, message: "笔记不存在或已同步" };
    }

    try {
      await updateNoteMutation({
        noteId: note.noteId,
        content: note.content,
        plainContent: note.plainContent,
        title: note.title,
        tags: note.tags,
        category: note.category,
      });

      await offlineStorage.markAsSynced(noteId);
      return { success: true };
    } catch (error) {
      console.error("同步失败:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取同步状态
   */
  async getSyncStatus() {
    const unsyncedNotes = await offlineStorage.getUnsyncedNotes();
    return {
      isSyncing: this.isSyncing,
      unsyncedCount: unsyncedNotes.length,
      hasUnsynced: unsyncedNotes.length > 0,
    };
  }
}

// 导出单例
export const syncManager = new SyncManager();
