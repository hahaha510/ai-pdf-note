/**
 * 清除缓存脚本
 * 在浏览器控制台运行此脚本来清除所有缓存
 */

async function clearAllCache() {
  console.log("🧹 开始清除缓存...");

  try {
    // 1. 清除 Service Worker Cache
    if ("caches" in window) {
      const cacheNames = await caches.keys();
      console.log(`📦 找到 ${cacheNames.length} 个缓存`);

      for (const name of cacheNames) {
        await caches.delete(name);
        console.log(`✅ 已删除缓存: ${name}`);
      }
    }

    // 2. 清除 IndexedDB
    if ("indexedDB" in window) {
      const dbName = "NotesOfflineDB";
      const request = indexedDB.deleteDatabase(dbName);

      request.onsuccess = () => {
        console.log(`✅ 已删除数据库: ${dbName}`);
        console.log("🎉 缓存清除完成！");
        console.log("🔄 请刷新页面...");

        // 3秒后自动刷新
        setTimeout(() => {
          location.reload();
        }, 3000);
      };

      request.onerror = () => {
        console.error("❌ 删除数据库失败");
      };

      request.onblocked = () => {
        console.warn("⚠️ 数据库被阻止，请关闭其他标签页");
      };
    }

    // 3. 注销 Service Worker
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        console.log("✅ Service Worker 已注销");
      }
    }
  } catch (error) {
    console.error("❌ 清除缓存失败:", error);
  }
}

// 运行清除
clearAllCache();
