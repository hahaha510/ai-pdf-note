import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// 创建普通笔记
export const createNote = mutation({
  args: {
    noteId: v.string(),
    title: v.string(),
    tags: v.optional(v.array(v.string())),
    category: v.optional(v.string()),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const id = await ctx.db.insert("workspaceNotes", {
      noteId: args.noteId,
      title: args.title,
      type: "note",
      content: "",
      tags: args.tags || [],
      category: args.category,
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });
    return id;
  },
});

// 创建 PDF 笔记
export const createPdfNote = mutation({
  args: {
    noteId: v.string(),
    title: v.string(),
    pdfFileId: v.string(), // 只需要传入 PDF 文件 ID
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const id = await ctx.db.insert("workspaceNotes", {
      noteId: args.noteId,
      title: args.title,
      type: "pdf",
      content: "",
      tags: [],
      pdfFileId: args.pdfFileId, // 引用关系
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });
    return id;
  },
});

// 更新笔记内容
export const updateNote = mutation({
  args: {
    noteId: v.string(),
    content: v.string(),
    plainContent: v.optional(v.string()),
    title: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const note = await ctx.db
      .query("workspaceNotes")
      .filter((q) => q.eq(q.field("noteId"), args.noteId))
      .first();

    if (!note) {
      throw new Error("Note not found");
    }

    const updates = {
      content: args.content,
      updatedAt: Date.now(),
    };

    if (args.plainContent !== undefined) {
      updates.plainContent = args.plainContent;
      // 自动生成摘要（取纯文本前150个字符）
      updates.excerpt = args.plainContent.substring(0, 150);
    }
    if (args.title !== undefined) updates.title = args.title;
    if (args.tags !== undefined) updates.tags = args.tags;
    if (args.category !== undefined) updates.category = args.category;

    await ctx.db.patch(note._id, updates);
    return note._id;
  },
});

// 删除笔记（优化版 - 级联删除）
export const deleteNote = mutation({
  args: {
    noteId: v.string(),
  },
  handler: async (ctx, args) => {
    const note = await ctx.db
      .query("workspaceNotes")
      .filter((q) => q.eq(q.field("noteId"), args.noteId))
      .first();

    if (!note) {
      throw new Error("Note not found");
    }

    // 删除 workspaceNotes 表的记录
    await ctx.db.delete(note._id);

    // 如果是 PDF 笔记，同时删除 PDF 文件记录
    if (note.type === "pdf" && note.pdfFileId) {
      const pdfFile = await ctx.db
        .query("pdfFiles")
        .filter((q) => q.eq(q.field("fileId"), note.pdfFileId))
        .first();

      if (pdfFile) {
        await ctx.db.delete(pdfFile._id);
      }
    }

    return { success: true };
  },
});

// 获取单个笔记
export const getNote = query({
  args: {
    noteId: v.string(),
  },
  handler: async (ctx, args) => {
    const note = await ctx.db
      .query("workspaceNotes")
      .filter((q) => q.eq(q.field("noteId"), args.noteId))
      .first();

    return note;
  },
});

// 获取单个笔记（包含 PDF 文件信息）
export const getNoteWithPdfInfo = query({
  args: {
    noteId: v.string(),
  },
  handler: async (ctx, args) => {
    const note = await ctx.db
      .query("workspaceNotes")
      .filter((q) => q.eq(q.field("noteId"), args.noteId))
      .first();

    if (!note) return null;

    // 如果是 PDF 笔记，获取文件信息
    if (note.type === "pdf" && note.pdfFileId) {
      const pdfFile = await ctx.db
        .query("pdfFiles")
        .filter((q) => q.eq(q.field("fileId"), note.pdfFileId))
        .first();

      return {
        ...note,
        pdfFile, // 添加文件信息
      };
    }

    return note;
  },
});

// 获取用户所有笔记（支持类型筛选和分页）
export const getUserNotes = query({
  args: {
    userName: v.string(),
    type: v.optional(v.string()), // "pdf" | "note" | undefined
    paginationOpts: v.optional(
      v.object({
        numItems: v.number(),
        cursor: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const notesQuery = ctx.db
      .query("workspaceNotes")
      .withIndex("by_user", (q) => q.eq("createdBy", args.userName))
      .order("desc");

    // 如果有分页参数
    if (args.paginationOpts) {
      const result = await notesQuery.paginate(args.paginationOpts);

      if (args.type) {
        return {
          ...result,
          page: result.page.filter((note) => note.type === args.type),
        };
      }

      return result;
    }

    // 无分页参数，返回所有（向后兼容）
    const notes = await notesQuery.collect();

    if (args.type) {
      return notes.filter((note) => note.type === args.type);
    }

    return notes;
  },
});

// 搜索笔记
export const searchNotes = query({
  args: {
    userName: v.string(),
    searchQuery: v.string(),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.searchQuery || args.searchQuery.trim() === "") {
      return [];
    }

    const searchTerm = args.searchQuery.toLowerCase();

    // 获取所有用户笔记
    const allNotes = await ctx.db
      .query("workspaceNotes")
      .withIndex("by_user", (q) => q.eq("createdBy", args.userName))
      .collect();

    // 手动过滤：标题或内容包含搜索词
    let filteredNotes = allNotes.filter((note) => {
      const titleMatch = note.title.toLowerCase().includes(searchTerm);
      const contentMatch = note.plainContent
        ? note.plainContent.toLowerCase().includes(searchTerm)
        : note.content.toLowerCase().includes(searchTerm);
      return titleMatch || contentMatch;
    });

    // 按类型过滤
    if (args.type) {
      filteredNotes = filteredNotes.filter((note) => note.type === args.type);
    }

    return filteredNotes;
  },
});

// 按标签筛选
export const getNotesByTag = query({
  args: {
    userName: v.string(),
    tag: v.string(),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const allNotes = await ctx.db
      .query("workspaceNotes")
      .withIndex("by_user", (q) => q.eq("createdBy", args.userName))
      .collect();

    let filtered = allNotes.filter((note) => note.tags.includes(args.tag));

    if (args.type) {
      filtered = filtered.filter((note) => note.type === args.type);
    }

    return filtered;
  },
});

// 按分类筛选
export const getNotesByCategory = query({
  args: {
    userName: v.string(),
    category: v.string(),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const notes = await ctx.db
      .query("workspaceNotes")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .filter((q) => q.eq(q.field("createdBy"), args.userName))
      .order("desc")
      .collect();

    if (args.type) {
      return notes.filter((note) => note.type === args.type);
    }

    return notes;
  },
});

// 获取所有标签
export const getAllTags = query({
  args: {
    userName: v.string(),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let notes = await ctx.db
      .query("workspaceNotes")
      .withIndex("by_user", (q) => q.eq("createdBy", args.userName))
      .collect();

    if (args.type) {
      notes = notes.filter((note) => note.type === args.type);
    }

    const tagsSet = new Set();
    notes.forEach((note) => {
      note.tags.forEach((tag) => tagsSet.add(tag));
    });

    return Array.from(tagsSet);
  },
});

// 获取所有分类
export const getAllCategories = query({
  args: {
    userName: v.string(),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let notes = await ctx.db
      .query("workspaceNotes")
      .withIndex("by_user", (q) => q.eq("createdBy", args.userName))
      .collect();

    if (args.type) {
      notes = notes.filter((note) => note.type === args.type);
    }

    const categoriesSet = new Set();
    notes.forEach((note) => {
      if (note.category) {
        categoriesSet.add(note.category);
      }
    });

    return Array.from(categoriesSet);
  },
});
