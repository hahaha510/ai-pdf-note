import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
// 这是一个「schema」文件：描述数据库里有哪些表、字段、类型
export default defineSchema({
    users: defineTable({          // ← 这里 users 是一张 table
      userName: v.string(),
      email: v.string(),
      imageUrl: v.string(),
    }),
  });