import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
// 这是一个「schema」文件：描述数据库里有哪些表、字段、类型
export default defineSchema({
    users: defineTable({          // ← 这里 users 是一张 table
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
  });