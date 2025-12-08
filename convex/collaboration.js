import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// 更新文档（保存 Y.js 更新）
export const updateDocument = mutation({
  args: {
    noteId: v.string(),
    update: v.string(), // base64 编码的 Y.js 更新
    userId: v.string(),
    userName: v.string(),
  },
  handler: async (ctx, args) => {
    // 保存更新记录
    await ctx.db.insert("documentUpdates", {
      noteId: args.noteId,
      update: args.update,
      userId: args.userId,
      userName: args.userName,
      timestamp: Date.now(),
    });

    // 更新文档状态（合并所有更新）
    const existingState = await ctx.db
      .query("documentStates")
      .filter((q) => q.eq(q.field("noteId"), args.noteId))
      .first();

    if (existingState) {
      await ctx.db.patch(existingState._id, {
        lastUpdate: args.update,
        updatedAt: Date.now(),
        updatedBy: args.userId,
      });
    } else {
      await ctx.db.insert("documentStates", {
        noteId: args.noteId,
        yDocState: args.update,
        lastUpdate: args.update,
        updatedAt: Date.now(),
        updatedBy: args.userId,
      });
    }

    return { success: true };
  },
});

// 获取文档状态
export const getDocumentState = query({
  args: {
    noteId: v.string(),
  },
  handler: async (ctx, args) => {
    const state = await ctx.db
      .query("documentStates")
      .filter((q) => q.eq(q.field("noteId"), args.noteId))
      .first();

    return state;
  },
});

// 获取最近的更新
export const getUpdates = query({
  args: {
    noteId: v.string(),
    since: v.number(), // 时间戳
  },
  handler: async (ctx, args) => {
    const updates = await ctx.db
      .query("documentUpdates")
      .filter((q) => q.eq(q.field("noteId"), args.noteId))
      .filter((q) => q.gte(q.field("timestamp"), args.since))
      .order("asc")
      .take(100);

    return updates;
  },
});

// 更新用户在线状态
export const updatePresence = mutation({
  args: {
    noteId: v.string(),
    userId: v.string(),
    userName: v.string(),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userPresence")
      .filter((q) => q.eq(q.field("noteId"), args.noteId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        userName: args.userName,
        color: args.color,
        lastSeen: Date.now(),
      });
    } else {
      await ctx.db.insert("userPresence", {
        noteId: args.noteId,
        userId: args.userId,
        userName: args.userName,
        color: args.color,
        lastSeen: Date.now(),
      });
    }

    return { success: true };
  },
});

// 获取在线用户
export const getOnlineUsers = query({
  args: {
    noteId: v.string(),
  },
  handler: async (ctx, args) => {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

    const users = await ctx.db
      .query("userPresence")
      .filter((q) => q.eq(q.field("noteId"), args.noteId))
      .filter((q) => q.gte(q.field("lastSeen"), fiveMinutesAgo))
      .collect();

    return users;
  },
});

// 保存文档状态（WebSocket 服务器使用）
export const saveDocumentState = mutation({
  args: {
    noteId: v.string(),
    yDocState: v.string(), // base64 编码的完整文档状态
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("documentStates")
      .filter((q) => q.eq(q.field("noteId"), args.noteId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        yDocState: args.yDocState,
        lastUpdate: args.yDocState,
        updatedAt: Date.now(),
        updatedBy: "websocket",
      });
    } else {
      await ctx.db.insert("documentStates", {
        noteId: args.noteId,
        yDocState: args.yDocState,
        lastUpdate: args.yDocState,
        updatedAt: Date.now(),
        updatedBy: "websocket",
      });
    }

    return { success: true };
  },
});

// 清理旧的更新记录（可选，用于定期清理）
export const cleanupOldUpdates = mutation({
  args: {
    noteId: v.string(),
    olderThan: v.number(), // 时间戳
  },
  handler: async (ctx, args) => {
    const oldUpdates = await ctx.db
      .query("documentUpdates")
      .filter((q) => q.eq(q.field("noteId"), args.noteId))
      .filter((q) => q.lt(q.field("timestamp"), args.olderThan))
      .collect();

    for (const update of oldUpdates) {
      await ctx.db.delete(update._id);
    }

    return { deleted: oldUpdates.length };
  },
});
