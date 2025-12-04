/**
 * 离线缓存管理器
 * 管理笔记数据的缓存，支持离线访问
 */
import db from "./db";

const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24小时

/**
 * 缓存笔记列表
 */
export async function cacheNotesList(userId, notes) {
  try {
    await db.cachedNotesList.put({
      userId,
      notes: notes || [],
      cachedAt: Date.now(),
    });
    console.log(`✅ 已缓存 ${notes?.length || 0} 条笔记列表`);
  } catch (error) {
    console.error("❌ 缓存笔记列表失败:", error);
  }
}

/**
 * 获取缓存的笔记列表
 */
export async function getCachedNotesList(userId) {
  try {
    const cached = await db.cachedNotesList.get(userId);
    if (!cached) return null;

    // 检查是否过期
    if (Date.now() - cached.cachedAt > CACHE_EXPIRY) {
      console.log("⚠️ 缓存已过期");
      return null;
    }

    return cached.notes;
  } catch (error) {
    console.error("❌ 获取缓存列表失败:", error);
    return null;
  }
}

/**
 * 缓存单个笔记
 */
export async function cacheNote(noteId, noteData) {
  try {
    await db.cachedNotes.put({
      noteId,
      ...noteData,
      cachedAt: Date.now(),
    });
    console.log("✅ 已缓存笔记:", noteId);
  } catch (error) {
    console.error("❌ 缓存笔记失败:", error);
  }
}

/**
 * 获取缓存的笔记
 */
export async function getCachedNote(noteId) {
  try {
    const cached = await db.cachedNotes.get(noteId);
    if (!cached) return null;

    // 检查是否过期
    if (Date.now() - cached.cachedAt > CACHE_EXPIRY) {
      console.log("⚠️ 笔记缓存已过期");
      return null;
    }

    return cached;
  } catch (error) {
    console.error("❌ 获取缓存笔记失败:", error);
    return null;
  }
}

/**
 * 缓存标签列表
 */
export async function cacheTags(userId, tags) {
  try {
    await db.cachedTags.put({
      userId,
      tags: tags || [],
      cachedAt: Date.now(),
    });
  } catch (error) {
    console.error("❌ 缓存标签失败:", error);
  }
}

/**
 * 获取缓存的标签
 */
export async function getCachedTags(userId) {
  try {
    const cached = await db.cachedTags.get(userId);
    if (!cached || Date.now() - cached.cachedAt > CACHE_EXPIRY) {
      return null;
    }
    return cached.tags;
  } catch (error) {
    console.error("❌ 获取缓存标签失败:", error);
    return null;
  }
}

/**
 * 缓存分类列表
 */
export async function cacheCategories(userId, categories) {
  try {
    await db.cachedCategories.put({
      userId,
      categories: categories || [],
      cachedAt: Date.now(),
    });
  } catch (error) {
    console.error("❌ 缓存分类失败:", error);
  }
}

/**
 * 获取缓存的分类
 */
export async function getCachedCategories(userId) {
  try {
    const cached = await db.cachedCategories.get(userId);
    if (!cached || Date.now() - cached.cachedAt > CACHE_EXPIRY) {
      return null;
    }
    return cached.categories;
  } catch (error) {
    console.error("❌ 获取缓存分类失败:", error);
    return null;
  }
}

/**
 * 清除所有缓存
 */
export async function clearAllCache(userId) {
  try {
    await Promise.all([
      db.cachedNotesList.delete(userId),
      db.cachedNotes.where("userId").equals(userId).delete(),
      db.cachedTags.delete(userId),
      db.cachedCategories.delete(userId),
    ]);
    console.log("✅ 已清除所有缓存");
  } catch (error) {
    console.error("❌ 清除缓存失败:", error);
  }
}

/**
 * 获取缓存统计信息
 */
export async function getCacheStats(userId) {
  try {
    const notesCount = await db.cachedNotes.where("userId").equals(userId).count();
    const notesList = await db.cachedNotesList.get(userId);
    const tags = await db.cachedTags.get(userId);
    const categories = await db.cachedCategories.get(userId);

    return {
      notesCount,
      hasNotesList: !!notesList,
      hasTags: !!tags,
      hasCategories: !!categories,
      lastCached: notesList?.cachedAt || null,
    };
  } catch (error) {
    console.error("❌ 获取缓存统计失败:", error);
    return null;
  }
}

export default {
  cacheNotesList,
  getCachedNotesList,
  cacheNote,
  getCachedNote,
  cacheTags,
  getCachedTags,
  cacheCategories,
  getCachedCategories,
  clearAllCache,
  getCacheStats,
};
