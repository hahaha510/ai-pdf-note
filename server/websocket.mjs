import { Server } from "@hocuspocus/server";
import { Database } from "@hocuspocus/extension-database";
import { ConvexHttpClient } from "convex/browser";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// 加载环境变量
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../.env.local") });

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  console.error("❌ 错误: NEXT_PUBLIC_CONVEX_URL 环境变量未设置");
  console.error("请检查 .env.local 文件是否存在并包含 NEXT_PUBLIC_CONVEX_URL");
  process.exit(1);
}

console.log("✅ Convex URL:", CONVEX_URL);

const convex = new ConvexHttpClient(CONVEX_URL);

// 创建 Hocuspocus WebSocket 服务器
const server = new Server({
  // 数据库扩展 - 使用 Convex 持久化
  extensions: [
    new Database({
      // 从 Convex 加载文档
      fetch: async ({ documentName }) => {
        try {
          console.log(`📥 加载文档: ${documentName}`);

          const state = await convex.query("collaboration:getDocumentState", {
            noteId: documentName,
          });

          if (state && state.yDocState) {
            // 将 base64 转换为 Uint8Array
            const buffer = Buffer.from(state.yDocState, "base64");
            console.log(`✅ 文档加载成功: ${documentName} (${buffer.length} bytes)`);
            return buffer;
          }

          console.log(`ℹ️ 文档不存在，创建新文档: ${documentName}`);
          return null;
        } catch (error) {
          console.error(`❌ 加载文档失败: ${documentName}`, error);
          return null;
        }
      },

      // 保存文档到 Convex
      store: async ({ documentName, state }) => {
        try {
          console.log(`💾 保存文档: ${documentName} (${state.length} bytes)`);

          // 将 Uint8Array 转换为 base64
          const base64State = Buffer.from(state).toString("base64");

          await convex.mutation("collaboration:saveDocumentState", {
            noteId: documentName,
            yDocState: base64State,
          });

          console.log(`✅ 文档保存成功: ${documentName}`);
        } catch (error) {
          console.error(`❌ 保存文档失败: ${documentName}`, error);
        }
      },
    }),
  ],

  // 连接事件
  onConnect: (data) => {
    console.log(`🔗 用户连接: ${data.documentName} (连接数: ${data.instance.connectionsCount})`);
  },

  // 断开事件
  onDisconnect: (data) => {
    console.log(`🔌 用户断开: ${data.documentName} (剩余连接: ${data.instance.connectionsCount})`);
  },

  // 认证（可选）
  onAuthenticate: async (data) => {
    const { token } = data;

    // 这里可以验证 JWT token
    // 暂时允许所有连接
    console.log(`🔐 认证请求: ${data.documentName}`);
    return {
      user: {
        id: token || "anonymous",
        name: token || "Anonymous",
      },
    };
  },
});

// 启动服务器
const PORT = process.env.PORT || 1234;
const ADDRESS = "0.0.0.0";

server.listen(PORT, ADDRESS).then(() => {
  console.log("🚀 WebSocket 服务器启动成功！");
  console.log(`📡 监听端口: ${PORT}`);
  console.log(`🔗 连接地址: ws://localhost:${PORT}`);
  console.log(`🌐 环境: ${process.env.NODE_ENV || "development"}`);
});

// 优雅关闭
process.on("SIGINT", () => {
  console.log("\n👋 正在关闭 WebSocket 服务器...");
  server.destroy();
  process.exit(0);
});
