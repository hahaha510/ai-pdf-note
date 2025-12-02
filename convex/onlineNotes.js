import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// 创建笔记
export const createNote = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    tags: v.array(v.string()),
    category: v.optional(v.string()),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    // 生成摘要（取前150个字符）
    const excerpt = args.content.substring(0, 150);
    const now = Date.now();

    const noteId = await ctx.db.insert("onlineNotes", {
      title: args.title,
      content: args.content,
      excerpt,
      tags: args.tags,
      category: args.category,
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });

    return noteId;
  },
});

// 更新笔记
export const updateNote = mutation({
  args: {
    noteId: v.id("onlineNotes"),
    title: v.string(),
    content: v.string(),
    tags: v.array(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { noteId, ...updates } = args;
    const excerpt = updates.content.substring(0, 150);

    await ctx.db.patch(noteId, {
      ...updates,
      excerpt,
      updatedAt: Date.now(),
    });

    return noteId;
  },
});

// 删除笔记
export const deleteNote = mutation({
  args: {
    noteId: v.id("onlineNotes"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.noteId);
    return { success: true };
  },
});

// 获取单个笔记
export const getNote = query({
  args: {
    noteId: v.id("onlineNotes"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.noteId);
  },
});

// 获取用户的所有笔记（带分页支持）
export const getUserNotes = query({
  args: {
    userName: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50; // 默认加载50条

    const notes = await ctx.db
      .query("onlineNotes")
      .withIndex("by_user", (q) => q.eq("createdBy", args.userName))
      .order("desc")
      .take(limit);

    return notes;
  },
});

// 获取用户的笔记（分页版本 - 用于无限滚动）
export const getUserNotesPaginated = query({
  args: {
    userName: v.string(),
    cursor: v.optional(v.number()),
    pageSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const pageSize = args.pageSize || 12; // 每页12条
    const cursor = args.cursor || 0;

    const allNotes = await ctx.db
      .query("onlineNotes")
      .withIndex("by_user", (q) => q.eq("createdBy", args.userName))
      .order("desc")
      .collect();

    const notes = allNotes.slice(cursor, cursor + pageSize);
    const hasMore = cursor + pageSize < allNotes.length;

    return {
      notes,
      nextCursor: hasMore ? cursor + pageSize : null,
      hasMore,
    };
  },
});

// 按分类获取笔记
export const getNotesByCategory = query({
  args: {
    userName: v.string(),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const notes = await ctx.db
      .query("onlineNotes")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .filter((q) => q.eq(q.field("createdBy"), args.userName))
      .order("desc")
      .collect();

    return notes;
  },
});

// 按标签筛选笔记
export const getNotesByTag = query({
  args: {
    userName: v.string(),
    tag: v.string(),
  },
  handler: async (ctx, args) => {
    const allNotes = await ctx.db
      .query("onlineNotes")
      .withIndex("by_user", (q) => q.eq("createdBy", args.userName))
      .collect();

    // 筛选包含指定标签的笔记
    return allNotes.filter((note) => note.tags.includes(args.tag));
  },
});

// 搜索笔记（标题和内容）
export const searchNotes = query({
  args: {
    userName: v.string(),
    searchQuery: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.searchQuery || args.searchQuery.trim() === "") {
      return [];
    }

    // 搜索标题
    const titleResults = await ctx.db
      .query("onlineNotes")
      .withSearchIndex("search_title", (q) =>
        q.search("title", args.searchQuery).eq("createdBy", args.userName)
      )
      .collect();

    // 搜索内容
    const contentResults = await ctx.db
      .query("onlineNotes")
      .withSearchIndex("search_content", (q) =>
        q.search("content", args.searchQuery).eq("createdBy", args.userName)
      )
      .collect();

    // 合并结果并去重
    const allResults = [...titleResults, ...contentResults];
    const uniqueResults = Array.from(new Map(allResults.map((note) => [note._id, note])).values());

    return uniqueResults;
  },
});

// 获取用户的所有标签
export const getAllTags = query({
  args: {
    userName: v.string(),
  },
  handler: async (ctx, args) => {
    const notes = await ctx.db
      .query("onlineNotes")
      .withIndex("by_user", (q) => q.eq("createdBy", args.userName))
      .collect();

    // 提取所有标签并去重
    const tagsSet = new Set();
    notes.forEach((note) => {
      note.tags.forEach((tag) => tagsSet.add(tag));
    });

    return Array.from(tagsSet);
  },
});

// 获取用户的所有分类
export const getAllCategories = query({
  args: {
    userName: v.string(),
  },
  handler: async (ctx, args) => {
    const notes = await ctx.db
      .query("onlineNotes")
      .withIndex("by_user", (q) => q.eq("createdBy", args.userName))
      .collect();

    // 提取所有分类并去重
    const categoriesSet = new Set();
    notes.forEach((note) => {
      if (note.category) {
        categoriesSet.add(note.category);
      }
    });

    return Array.from(categoriesSet);
  },
});

// 获取最近更新的笔记
export const getRecentNotes = query({
  args: {
    userName: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    const notes = await ctx.db
      .query("onlineNotes")
      .withIndex("by_user", (q) => q.eq("createdBy", args.userName))
      .order("desc")
      .take(limit);

    return notes;
  },
});
