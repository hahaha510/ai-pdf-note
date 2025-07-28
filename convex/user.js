import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const createUser = mutation({
  args: {
    email: v.string(),
    userName: v.string(),
    imageUrl: v.string(),
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
      });
      return { success: true, message: "Inserted New User", userId };
    }
    
    return { success: true, message: "User Already Exists", userId: user[0]._id };
  },
});