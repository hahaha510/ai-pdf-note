import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// 保留旧的 createUser 以兼容性（已废弃，请使用 createUserSecure）
export const createUser = mutation({
  args: {
    email: v.string(),
    userName: v.string(),
    imageUrl: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // 先查是否已存在
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .collect();

    // 不存在就插入
    if (user?.length === 0) {
      const userId = await ctx.db.insert("users", {
        email: args.email,
        userName: args.userName,
        imageUrl: args.imageUrl,
        password: args.password,
        upgrade: false,
      });
      return { success: true, message: "Inserted New User", userId };
    }

    return { success: false, message: "User Already Exists" };
  },
});

// 新的安全创建用户函数（使用加密密码）
export const createUserSecure = mutation({
  args: {
    email: v.string(),
    userName: v.string(),
    imageUrl: v.string(),
    password: v.string(), // 已加密的密码
  },
  handler: async (ctx, args) => {
    // 检查用户是否已存在
    const existingUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (existingUser) {
      return { success: false, message: "该邮箱已被注册" };
    }

    // 插入新用户（密码已经加密）
    const userId = await ctx.db.insert("users", {
      email: args.email,
      userName: args.userName,
      imageUrl: args.imageUrl,
      password: args.password, // 存储加密后的密码
      upgrade: false,
    });

    return { success: true, message: "注册成功", userId };
  },
});

// 用于验证用户登录
export const loginUser = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // 查找用户
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .collect();

    // 用户不存在
    if (user.length === 0) {
      return { success: false, message: "用户不存在" };
    }

    // 检查密码是否匹配
    if (user[0].password !== args.password) {
      return { success: false, message: "密码错误" };
    }

    // 登录成功
    return {
      success: true,
      message: "登录成功",
      userId: user[0]._id,
      user: {
        id: user[0]._id,
        email: user[0].email,
        userName: user[0].userName,
        imageUrl: user[0].imageUrl,
      },
    };
  },
});

//更新用户的升级状态
export const updateUserUpgrade = mutation({
  args: {
    userEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.userEmail))
      .collect();
    if (result) {
      await ctx.db.patch(result[0]._id, { upgrade: true });
      return "success";
    }
    return "failed";
  },
});

//获取用户的详细信息
export const getUserDetails = query({
  args: {
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.userEmail) {
      return "";
    }
    const result = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.userEmail))
      .collect();
    return result[0];
  },
});

// 通过邮箱获取用户（用于登录验证）
export const getUserByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .collect();
    return users;
  },
});
