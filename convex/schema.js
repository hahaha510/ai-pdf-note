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
  notes: defineTable({
    fileId: v.string(),
    notes: v.any(),
    createdBy: v.string(),
  }),
  // 在线笔记表 索引优化支持快速搜索
  onlineNotes: defineTable({
    title: v.string(),
    content: v.string(), // Markdown 内容
    excerpt: v.optional(v.string()), // 摘要，用于列表展示
    tags: v.array(v.string()), // 标签数组
    category: v.optional(v.string()), // 分类
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["createdBy"])
    .index("by_category", ["category"])
    .index("by_created_at", ["createdAt"])
    .index("by_updated_at", ["updatedAt"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["createdBy", "category"],
    })
    .searchIndex("search_content", {
      searchField: "content",
      filterFields: ["createdBy"],
    }),
});
