/**
 * 离线存储管理器
 * 处理草稿保存、离线笔记创建、数据恢复等
 */
import db from "./db";

// ==================== 草稿管理 ====================

/**
 * 保存草稿到本地
 * @param {string} noteId - 笔记ID（新建时为null）
 * @param {Object} data - 笔记数据
 * @param {string} userId - 用户ID
 */
export async function saveDraft(noteId, data, userId) {
  const draftId = noteId || `new_${Date.now()}`;

  try {
    await db.drafts.put({
      id: draftId,
      noteId: noteId,
      userId: userId,
      title: data.title,
      content: data.content,
      tags: data.tags || [],
      category: data.category || "",
      lastSaved: Date.now(),
    });

    console.log("✅ 草稿已保存:", draftId);
    return draftId;
  } catch (error) {
    console.error("❌ 保存草稿失败:", error);
    throw error;
  }
}

/**
 * 获取草稿
 * @param {string} draftId - 草稿ID
 */
export async function getDraft(draftId) {
  try {
    const draft = await db.drafts.get(draftId);
    return draft;
  } catch (error) {
    console.error("❌ 获取草稿失败:", error);
    return null;
  }
}

/**
 * 获取用户所有草稿
 * @param {string} userId - 用户ID
 */
export async function getUserDrafts(userId) {
  try {
    const drafts = await db.drafts.where("userId").equals(userId).toArray();
    return drafts;
  } catch (error) {
    console.error("❌ 获取用户草稿失败:", error);
    return [];
  }
}

/**
 * 删除草稿
 * @param {string} draftId - 草稿ID
 */
export async function deleteDraft(draftId) {
  try {
    await db.drafts.delete(draftId);
    console.log("✅ 草稿已删除:", draftId);
  } catch (error) {
    console.error("❌ 删除草稿失败:", error);
  }
}

/**
 * 清理旧草稿（超过7天的草稿）
 * @param {string} userId - 用户ID
 */
export async function cleanOldDrafts(userId) {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  try {
    const oldDrafts = await db.drafts
      .where("userId")
      .equals(userId)
      .and((draft) => draft.lastSaved < sevenDaysAgo)
      .toArray();

    for (const draft of oldDrafts) {
      await db.drafts.delete(draft.id);
    }

    console.log(`✅ 已清理 ${oldDrafts.length} 个旧草稿`);
    return oldDrafts.length;
  } catch (error) {
    console.error("❌ 清理旧草稿失败:", error);
    return 0;
  }
}

// ==================== 离线笔记管理 ====================

/**
 * 创建离线笔记（网络断开时）
 * @param {Object} data - 笔记数据
 * @param {string} userId - 用户ID
 */
export async function createOfflineNote(data, userId) {
  const tempId = `offline_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  try {
    await db.offlineNotes.add({
      tempId: tempId,
      userId: userId,
      title: data.title,
      content: data.content,
      tags: data.tags || [],
      category: data.category || "",
      createdAt: Date.now(),
      synced: false,
    });

    console.log("✅ 离线笔记已创建:", tempId);
    return tempId;
  } catch (error) {
    console.error("❌ 创建离线笔记失败:", error);
    throw error;
  }
}

/**
 * 获取离线笔记
 * @param {string} tempId - 临时ID
 */
export async function getOfflineNote(tempId) {
  try {
    const note = await db.offlineNotes.get(tempId);
    return note;
  } catch (error) {
    console.error("❌ 获取离线笔记失败:", error);
    return null;
  }
}

/**
 * 获取用户所有未同步的离线笔记
 * @param {string} userId - 用户ID
 */
export async function getUnsyncedOfflineNotes(userId) {
  try {
    const notes = await db.offlineNotes
      .where("userId")
      .equals(userId)
      .and((note) => !note.synced)
      .toArray();

    return notes;
  } catch (error) {
    console.error("❌ 获取未同步笔记失败:", error);
    return [];
  }
}

/**
 * 标记离线笔记为已同步
 * @param {string} tempId - 临时ID
 * @param {string} realId - 服务器返回的真实ID
 */
export async function markOfflineNoteSynced(tempId, realId) {
  try {
    await db.offlineNotes.update(tempId, {
      synced: true,
      realId: realId,
      syncedAt: Date.now(),
    });

    console.log("✅ 离线笔记已标记为同步:", tempId, "->", realId);
  } catch (error) {
    console.error("❌ 标记同步状态失败:", error);
  }
}

/**
 * 删除已同步的离线笔记
 * @param {string} tempId - 临时ID
 */
export async function deleteOfflineNote(tempId) {
  try {
    await db.offlineNotes.delete(tempId);
    console.log("✅ 离线笔记已删除:", tempId);
  } catch (error) {
    console.error("❌ 删除离线笔记失败:", error);
  }
}

// ==================== 同步队列管理 ====================

/**
 * 添加操作到同步队列
 * @param {'create'|'update'|'delete'} type - 操作类型
 * @param {Object} data - 操作数据
 */
export async function addToSyncQueue(type, data) {
  try {
    const id = await db.syncQueue.add({
      type: type,
      data: data,
      timestamp: Date.now(),
      retries: 0,
      maxRetries: 3,
      status: "pending",
    });

    console.log("✅ 已添加到同步队列:", type, id);
    return id;
  } catch (error) {
    console.error("❌ 添加到同步队列失败:", error);
    throw error;
  }
}

/**
 * 获取待同步的队列项
 */
export async function getPendingSyncQueue() {
  try {
    const items = await db.syncQueue
      .where("status")
      .equals("pending")
      .or("status")
      .equals("failed")
      .and((item) => item.retries < item.maxRetries)
      .sortBy("timestamp");

    return items;
  } catch (error) {
    console.error("❌ 获取同步队列失败:", error);
    return [];
  }
}

/**
 * 更新同步队列项状态
 * @param {number} id - 队列项ID
 * @param {'pending'|'syncing'|'failed'|'success'} status - 状态
 * @param {string} [error] - 错误信息
 */
export async function updateSyncQueueStatus(id, status, error = null) {
  try {
    const updates = { status: status };

    if (status === "failed") {
      const item = await db.syncQueue.get(id);
      updates.retries = (item?.retries || 0) + 1;
      updates.error = error;
      updates.lastRetry = Date.now();
    }

    if (status === "success") {
      updates.syncedAt = Date.now();
    }

    await db.syncQueue.update(id, updates);
    console.log(`✅ 队列项 ${id} 状态更新为:`, status);
  } catch (error) {
    console.error("❌ 更新队列状态失败:", error);
  }
}

/**
 * 删除已成功同步的队列项
 */
export async function cleanSyncedQueue() {
  try {
    const count = await db.syncQueue.where("status").equals("success").delete();
    console.log(`✅ 已清理 ${count} 个已同步队列项`);
    return count;
  } catch (error) {
    console.error("❌ 清理同步队列失败:", error);
    return 0;
  }
}

/**
 * 获取失败的同步队列项
 */
export async function getFailedSyncQueue() {
  try {
    const items = await db.syncQueue
      .where("status")
      .equals("failed")
      .and((item) => item.retries >= item.maxRetries)
      .toArray();

    return items;
  } catch (error) {
    console.error("❌ 获取失败队列失败:", error);
    return [];
  }
}

// ==================== 统计信息 ====================

/**
 * 获取离线存储统计信息
 * @param {string} userId - 用户ID
 */
export async function getOfflineStats(userId) {
  try {
    const draftsCount = await db.drafts.where("userId").equals(userId).count();

    const offlineNotesCount = await db.offlineNotes
      .where("userId")
      .equals(userId)
      .and((note) => !note.synced)
      .count();

    const pendingQueueCount = await db.syncQueue.where("status").equals("pending").count();

    const failedQueueCount = await db.syncQueue
      .where("status")
      .equals("failed")
      .and((item) => item.retries >= item.maxRetries)
      .count();

    return {
      draftsCount,
      offlineNotesCount,
      pendingQueueCount,
      failedQueueCount,
      totalPending: offlineNotesCount + pendingQueueCount,
    };
  } catch (error) {
    console.error("❌ 获取统计信息失败:", error);
    return {
      draftsCount: 0,
      offlineNotesCount: 0,
      pendingQueueCount: 0,
      failedQueueCount: 0,
      totalPending: 0,
    };
  }
}

const offlineStorage = {
  saveDraft,
  getDraft,
  getUserDrafts,
  deleteDraft,
  cleanOldDrafts,
  createOfflineNote,
  getOfflineNote,
  getUnsyncedOfflineNotes,
  markOfflineNoteSynced,
  deleteOfflineNote,
  addToSyncQueue,
  getPendingSyncQueue,
  updateSyncQueueStatus,
  cleanSyncedQueue,
  getFailedSyncQueue,
  getOfflineStats,
};

export default offlineStorage;
