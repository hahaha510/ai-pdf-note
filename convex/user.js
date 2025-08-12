import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

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
        upgrade: false
      });
      return { success: true, message: "Inserted New User", userId };
    }
    
    return { success: false, message: "User Already Exists" };
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
        imageUrl: user[0].imageUrl
      }
    };
  },
});

//更新用户的升级状态
export const updateUserUpgrade = mutation({
  args: {
    userEmail: v.string()
  },
  handler: async (ctx, args) => {
    const result=await ctx.db.query("users").filter((q)=>q.eq(q.field("email"),args.userEmail)).collect();
    if(result){
      await ctx.db.patch(result[0]._id, { upgrade: true });
      return 'success'
    }
    return 'failed'
  },
});

//获取用户的详细信息
export const getUserDetails = query({
  args: {
    userEmail: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    if(!args.userEmail){
      return ''
    }
    const result=await ctx.db.query("users").filter((q)=>q.eq(q.field("email"),args.userEmail)).collect();
    return result[0]
  },
});