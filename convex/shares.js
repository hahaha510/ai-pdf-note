import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// 创建分享链接
export const createShare = mutation({
  args: {
    noteId: v.string(),
    createdBy: v.string(),
    permission: v.string(), // "view" | "edit"
    expiresIn: v.optional(v.number()), // 过期时间（毫秒）
  },
  handler: async (ctx, args) => {
    // 生成随机 token
    const shareToken = generateShareToken();

    // 计算过期时间
    const expiresAt = args.expiresIn ? Date.now() + args.expiresIn : undefined;

    // 插入分享记录
    const shareData = {
      noteId: args.noteId,
      shareToken,
      createdBy: args.createdBy,
      permission: args.permission,
      shareType: "public_link",
      accessControl: "any_logged_in_user",
      isActive: true,
      createdAt: Date.now(),
      viewCount: 0,
    };

    // 只有当 expiresAt 有值时才添加
    if (expiresAt !== undefined) {
      shareData.expiresAt = expiresAt;
    }

    const shareId = await ctx.db.insert("shares", shareData);

    return {
      success: true,
      shareId,
      shareToken,
      shareUrl: `/share/${shareToken}`,
    };
  },
});

// 通过 token 获取分享信息
export const getShareByToken = query({
  args: {
    shareToken: v.string(),
  },
  handler: async (ctx, args) => {
    const share = await ctx.db
      .query("shares")
      .filter((q) => q.eq(q.field("shareToken"), args.shareToken))
      .first();

    if (!share) {
      return null;
    }

    // 检查是否过期
    if (share.expiresAt && Date.now() > share.expiresAt) {
      return { ...share, expired: true };
    }

    return { ...share, expired: false };
  },
});

// 获取笔记的所有分享链接
export const getSharesByNote = query({
  args: {
    noteId: v.string(),
  },
  handler: async (ctx, args) => {
    const shares = await ctx.db
      .query("shares")
      .filter((q) => q.eq(q.field("noteId"), args.noteId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return shares;
  },
});

// 更新分享访问统计
export const updateShareAccess = mutation({
  args: {
    shareToken: v.string(),
  },
  handler: async (ctx, args) => {
    const share = await ctx.db
      .query("shares")
      .filter((q) => q.eq(q.field("shareToken"), args.shareToken))
      .first();

    if (share) {
      await ctx.db.patch(share._id, {
        viewCount: share.viewCount + 1,
        lastAccessedAt: Date.now(),
      });
    }
  },
});

// 撤销分享链接
export const revokeShare = mutation({
  args: {
    shareId: v.id("shares"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.shareId, {
      isActive: false,
    });

    return { success: true };
  },
});

// 删除分享链接
export const deleteShare = mutation({
  args: {
    shareId: v.id("shares"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.shareId);
    return { success: true };
  },
});

// 生成随机 token（8位字符）
function generateShareToken() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 8; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}
