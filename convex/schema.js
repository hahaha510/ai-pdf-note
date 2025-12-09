import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
// 这是一个「schema」文件：描述数据库里有哪些表、字段、类型
export default defineSchema({
  users: defineTable({
    // ← 这里 users 是一张 table
    userName: v.string(),
    email: v.string(),
    imageUrl: v.string(),
    password: v.string(),
    upgrade: v.boolean(),
  }),
  pdfFiles: defineTable({
    fileId: v.string(),
    storageId: v.string(),
    fileName: v.string(),
    fileUrl: v.string(),
    createdBy: v.string(),
  }),
  documents: defineTable({
    embedding: v.array(v.number()),
    text: v.string(),
    metadata: v.any(),
  }).vectorIndex("byEmbedding", {
    vectorField: "embedding",
    dimensions: 768,
  }),
  // AI PDF Note 工作区笔记表 - 支持普通笔记和 PDF 笔记
  workspaceNotes: defineTable({
    noteId: v.string(), // 笔记 ID
    title: v.string(), // 标题
    type: v.string(), // "pdf" 或 "note"
    content: v.string(), // 笔记内容（HTML格式）
    plainContent: v.optional(v.string()), // 纯文本内容（用于搜索）
    excerpt: v.optional(v.string()), // 笔记摘要（用于列表展示）
    tags: v.array(v.string()), // 标签
    category: v.optional(v.string()), // 分类
    // PDF 相关字段
    fileId: v.optional(v.string()), // PDF 文件 ID
    storageId: v.optional(v.string()), // 存储 ID
    fileUrl: v.optional(v.string()), // PDF URL
    // 通用字段
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["createdBy"])
    .index("by_type", ["type"])
    .index("by_category", ["category"])
    .index("by_user_and_type", ["createdBy", "type"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["createdBy", "type", "category"],
    })
    .searchIndex("search_content", {
      searchField: "plainContent",
      filterFields: ["createdBy", "type"],
    }),

  // 分享链接表 - 实现笔记分享功能
  shares: defineTable({
    noteId: v.string(), // 笔记 ID
    shareToken: v.string(), // 分享 token（8位随机字符）
    createdBy: v.string(), // 创建者
    permission: v.string(), // 权限："view" | "edit"
    shareType: v.string(), // 分享类型："public_link"
    accessControl: v.string(), // 访问控制："any_logged_in_user"
    isActive: v.boolean(), // 是否激活
    createdAt: v.number(), // 创建时间
    expiresAt: v.optional(v.number()), // 过期时间（可选）
    viewCount: v.number(), // 访问次数
    lastAccessedAt: v.optional(v.number()), // 最后访问时间
  })
    .index("by_note", ["noteId"])
    .index("by_token", ["shareToken"]),

  // 文档状态表 - Y.js 实时协作状态（WebSocket 服务器使用）
  documentStates: defineTable({
    noteId: v.string(), // 笔记 ID
    yDocState: v.string(), // Y.js 文档状态（base64）
    lastUpdate: v.string(), // 最后一次更新（base64）
    updatedAt: v.number(), // 更新时间
    updatedBy: v.string(), // 更新者
  }).index("by_note", ["noteId"]),
});
