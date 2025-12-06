/**
 * IndexedDB 离线存储管理器
 * 用于在浏览器中存储笔记数据
 */

const DB_NAME = "AI_PDF_Notes_Offline";
const DB_VERSION = 1;
const NOTES_STORE = "notes";
const DRAFTS_STORE = "drafts";

class OfflineStorage {
  constructor() {
    this.db = null;
  }

  /**
   * 初始化数据库
   */
  async init() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // 创建笔记存储
        if (!db.objectStoreNames.contains(NOTES_STORE)) {
          const notesStore = db.createObjectStore(NOTES_STORE, { keyPath: "noteId" });
          notesStore.createIndex("createdBy", "createdBy", { unique: false });
          notesStore.createIndex("updatedAt", "updatedAt", { unique: false });
          // 注意：synced 是布尔值，不适合作为索引，我们使用手动过滤
        }

        // 创建草稿存储（用于临时保存编辑中的内容）
        if (!db.objectStoreNames.contains(DRAFTS_STORE)) {
          db.createObjectStore(DRAFTS_STORE, { keyPath: "noteId" });
        }
      };
    });
  }

  /**
   * 保存笔记到本地
   */
  async saveNote(note) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([NOTES_STORE], "readwrite");
      const store = transaction.objectStore(NOTES_STORE);

      const noteData = {
        ...note,
        updatedAt: Date.now(),
        synced: false, // 标记为未同步
      };

      const request = store.put(noteData);
      request.onsuccess = () => resolve(noteData);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 获取单个笔记
   */
  async getNote(noteId) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([NOTES_STORE], "readonly");
      const store = transaction.objectStore(NOTES_STORE);
      const request = store.get(noteId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 获取所有笔记
   */
  async getAllNotes(userName) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([NOTES_STORE], "readonly");
      const store = transaction.objectStore(NOTES_STORE);
      const index = store.index("createdBy");
      const request = userName ? index.getAll(userName) : store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 获取未同步的笔记
   */
  async getUnsyncedNotes() {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([NOTES_STORE], "readonly");
      const store = transaction.objectStore(NOTES_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        // 手动过滤未同步的笔记
        const allNotes = request.result || [];
        const unsyncedNotes = allNotes.filter((note) => note.synced === false);
        resolve(unsyncedNotes);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 标记笔记为已同步
   */
  async markAsSynced(noteId) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([NOTES_STORE], "readwrite");
      const store = transaction.objectStore(NOTES_STORE);
      const getRequest = store.get(noteId);

      getRequest.onsuccess = () => {
        const note = getRequest.result;
        if (note) {
          note.synced = true;
          const putRequest = store.put(note);
          putRequest.onsuccess = () => resolve(note);
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve(null);
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  /**
   * 删除笔记
   */
  async deleteNote(noteId) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([NOTES_STORE], "readwrite");
      const store = transaction.objectStore(NOTES_STORE);
      const request = store.delete(noteId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 保存草稿（临时编辑内容）
   */
  async saveDraft(noteId, content) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([DRAFTS_STORE], "readwrite");
      const store = transaction.objectStore(DRAFTS_STORE);

      const draft = {
        noteId,
        content,
        savedAt: Date.now(),
      };

      const request = store.put(draft);
      request.onsuccess = () => resolve(draft);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 获取草稿
   */
  async getDraft(noteId) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([DRAFTS_STORE], "readonly");
      const store = transaction.objectStore(DRAFTS_STORE);
      const request = store.get(noteId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 删除草稿
   */
  async deleteDraft(noteId) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([DRAFTS_STORE], "readwrite");
      const store = transaction.objectStore(DRAFTS_STORE);
      const request = store.delete(noteId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 清理已同步的笔记（保留未同步的）
   */
  async cleanSyncedNotes() {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([NOTES_STORE], "readwrite");
      const store = transaction.objectStore(NOTES_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const allNotes = request.result || [];
        const deletePromises = [];

        // 删除所有 synced:true 的笔记
        allNotes.forEach((note) => {
          if (note.synced === true) {
            deletePromises.push(
              new Promise((res, rej) => {
                const delReq = store.delete(note.noteId);
                delReq.onsuccess = () => res();
                delReq.onerror = () => rej(delReq.error);
              })
            );
          }
        });

        Promise.all(deletePromises)
          .then(() => resolve(deletePromises.length))
          .catch(reject);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 清空所有数据
   */
  async clearAll() {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([NOTES_STORE, DRAFTS_STORE], "readwrite");
      const notesStore = transaction.objectStore(NOTES_STORE);
      const draftsStore = transaction.objectStore(DRAFTS_STORE);

      notesStore.clear();
      draftsStore.clear();

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

// 导出单例
export const offlineStorage = new OfflineStorage();
