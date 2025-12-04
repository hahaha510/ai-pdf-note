/**
 * IndexedDB 数据库配置 (使用 Dexie.js)
 * 用于离线存储笔记草稿、离线笔记和同步队列
 */
import Dexie from "dexie";

// 创建数据库实例
export const db = new Dexie("NotesOfflineDB");

// 定义数据库结构（版本1 - 保留旧版本）
db.version(1).stores({
  // 草稿表：存储正在编辑的笔记草稿
  drafts: "id, userId, lastSaved, noteId",

  // 离线笔记表：网络断开时创建的新笔记
  offlineNotes: "tempId, userId, createdAt, synced",

  // 同步队列：待同步到服务器的操作
  syncQueue: "++id, type, timestamp, retries, status",
});

// 定义数据库结构（版本2 - 添加缓存表）
db.version(2).stores({
  // 保留版本1的所有表
  drafts: "id, userId, lastSaved, noteId",
  offlineNotes: "tempId, userId, createdAt, synced",
  syncQueue: "++id, type, timestamp, retries, status",

  // 缓存笔记列表：缓存用户的所有笔记列表
  cachedNotesList: "userId, cachedAt",

  // 缓存单个笔记：缓存笔记详情
  cachedNotes: "noteId, userId, cachedAt",

  // 缓存标签列表
  cachedTags: "userId, cachedAt",

  // 缓存分类列表
  cachedCategories: "userId, cachedAt",
});

// 数据表类型定义（用于 JSDoc）
/**
 * @typedef {Object} Draft
 * @property {string} id - 草稿唯一ID
 * @property {string} noteId - 对应的笔记ID（如果是编辑现有笔记）
 * @property {string} userId - 用户ID
 * @property {string} title - 标题
 * @property {string} content - 内容
 * @property {string[]} tags - 标签数组
 * @property {string} category - 分类
 * @property {number} lastSaved - 最后保存时间戳
 */

/**
 * @typedef {Object} OfflineNote
 * @property {string} tempId - 临时ID（格式：offline_timestamp_random）
 * @property {string} userId - 用户ID
 * @property {string} title - 标题
 * @property {string} content - 内容
 * @property {string[]} tags - 标签数组
 * @property {string} category - 分类
 * @property {number} createdAt - 创建时间戳
 * @property {boolean} synced - 是否已同步
 * @property {string} [realId] - 同步后的真实ID
 */

/**
 * @typedef {Object} SyncQueueItem
 * @property {number} id - 自增ID
 * @property {'create'|'update'|'delete'} type - 操作类型
 * @property {Object} data - 操作数据
 * @property {number} timestamp - 创建时间戳
 * @property {number} retries - 重试次数
 * @property {number} maxRetries - 最大重试次数
 * @property {'pending'|'syncing'|'failed'|'success'} status - 同步状态
 * @property {string} [error] - 错误信息
 */

export default db;
