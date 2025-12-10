# 📝 AI PDF Note

一个功能强大的智能笔记与 PDF 笔记应用，支持实时协作编辑和 AI 辅助功能。

## ✨ 核心功能

### 📄 笔记管理

- **多种笔记类型**：支持普通笔记和 PDF 笔记
- **富文本编辑**：基于 Tiptap 的强大编辑器，支持多种格式
- **标签分类**：通过标签和分类轻松组织笔记
- **全文搜索**：快速查找笔记内容
- **离线支持**：使用 IndexedDB 实现本地存储和离线访问

### 🤝 实时协作

- **多人同时编辑**：基于 Y.js CRDT 算法的实时协作
- **在线用户显示**：实时查看协作编辑的其他用户
- **自动同步**：编辑内容自动保存到云端（2秒防抖）
- **冲突解决**：CRDT 算法自动处理编辑冲突

### 🔗 分享功能

- **生成分享链接**：一键生成笔记分享链接
- **权限控制**：支持"仅查看"和"可编辑"两种权限
- **过期时间**：可设置分享链接的有效期（24小时/7天/永久）
- **访问统计**：记录分享链接的访问次数

### 🤖 AI 功能

- **智能问答**：基于 Google Gemini AI 的智能对话
- **内容分析**：AI 辅助分析笔记内容
- **向量检索**：使用 LangChain 实现语义搜索

## 🛠️ 技术栈

### 前端

- **框架**：Next.js 15 (React 18)
- **样式**：Tailwind CSS + shadcn/ui
- **编辑器**：Tiptap (富文本编辑)
- **状态管理**：React Hooks
- **图标**：Lucide React
- **主题**：next-themes (深色模式支持)

### 后端

- **数据库**：Convex (实时数据库)
- **WebSocket**：Hocuspocus Server (实时协作)
- **认证**：自定义 JWT 认证
- **文件存储**：Convex 文件存储

### 实时协作

- **Y.js**：CRDT 算法库
- **Hocuspocus**：WebSocket 协作服务器
- **IndexedDB**：本地持久化存储

### AI & 向量数据库

- **Google Gemini**：大语言模型
- **LangChain**：AI 应用框架
- **Convex Vector Search**：向量检索

## 📦 安装

### 前置要求

- Node.js 18+
- npm 或 yarn

### 环境变量配置

创建 `.env.local` 文件：

```bash
# Convex
NEXT_PUBLIC_CONVEX_URL=your_convex_deployment_url
CONVEX_DEPLOYMENT=your_convex_deployment
# Google AI
GOOGLE_AI_API_KEY=your_google_ai_api_key
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key

# WebSocket 用线上websocket需配置
NEXT_PUBLIC_WEBSOCKET_URL=your_websocket_url
# JWT
JWT_SECRET=your_jwt_secret
```

### 安装依赖

```bash
npm install
```

## 🚀 运行项目

### 开发模式

1. **启动 Convex 开发服务器**：

```bash
npx convex dev
```

2. **启动 WebSocket 服务器**（实时协作）：

```bash
npm run websocket
```

3. **启动 Next.js 开发服务器**：

```bash
npm run dev
```

4. 打开浏览器访问 [http://localhost:3000](http://localhost:3000)

### 生产构建

```bash
npm run build
npm start
```

## 🌐 在线部署

### 主应用部署

本项目已部署至：\*_[https://ai-pdf-note.vercel.app_]\*

### WebSocket 服务部署

WebSocket 协作服务已部署至：**[https://notes-websocket.onrender.com]**

#

## 🎯 核心功能说明

### 实时协作原理

本项目使用 **Y.js + Hocuspocus** 实现实时协作编辑：

1. **Y.js CRDT**：使用 CRDT (Conflict-free Replicated Data Type) 算法，实现无冲突的分布式数据同步
2. **WebSocket 连接**：通过 Hocuspocus Provider 建立 WebSocket 连接
3. **自动同步**：编辑内容实时同步到所有在线用户
4. **持久化**：通过 Convex 数据库持久化文档状态

### 离线功能

- 使用 **IndexedDB** 存储笔记数据
- 支持离线创建和编辑笔记
- 网络恢复后自动同步到云端
- 使用 `syncManager` 管理同步状态

### AI 对话功能

- 集成 **Google Gemini** 大语言模型
- 支持基于笔记内容的智能问答
- 使用 **LangChain** 实现向量检索和 RAG

## 🔐 认证系统

- 自定义 JWT 认证
- 支持用户注册和登录
- 使用 middleware 保护路由
- 基于邮箱的用户身份识别

## 📊 数据库 Schema

### 主要数据表

- **workspaceNotes**：笔记数据
- **shares**：分享链接记录
- **documentStates**：Y.js 文档状态
- **documentUpdates**：文档更新记录
- **userPresence**：用户在线状态
- **users**：用户信息

## 🔧 脚本命令

```bash
# 开发
npm run dev              # 启动 Next.js 开发服务器
npm run websocket        # 启动 WebSocket 服务器
npx convex dev           # 启动 Convex 开发服务器

# 构建
npm run build            # 生产构建

# 代码质量
npm run lint             # ESLint 检查
npm run lint:fix         # 自动修复 lint 问题
npm run format           # Prettier 格式化
npm run format:check     # 检查格式
npm run type-check       # TypeScript 类型检查
```

## 🌟 特色亮点

1. **🔄 真正的实时协作**：基于 CRDT 算法，多人同时编辑无冲突
2. **💾 离线优先**：支持完整的离线功能，网络恢复自动同步
3. **🤖 AI 辅助**：集成大语言模型，提供智能辅助功能
4. **📱 响应式设计**：完美支持桌面和移动设备
5. **🎨 现代 UI**：基于 shadcn/ui 的精美界面
6. **⚡ 高性能**：Next.js 15 + React Server Components

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 License

MIT License

## 👨‍💻 作者

Created with ❤️ by hahaha510

---

**注意**：本项目需要配置 Convex 和 Google AI API Key 才能正常运行。请参考上方的环境变量配置说明。
