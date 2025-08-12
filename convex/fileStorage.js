import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
})


export const AddFileEntryToDb = mutation({
  args:{
    fileId:v.string(),
    storageId:v.string(),
    fileName:v.string(),
    fileUrl:v.string(),
    createdBy:v.string(),
  },
  handler:async(ctx,args)=>{
    await ctx.db.insert("pdfFiles",{
      fileId:args.fileId,
      storageId:args.storageId,
      fileName:args.fileName,
      fileUrl:args.fileUrl,
      createdBy:args.createdBy,
    });
    return 'file Inserted'
  }
})

//获取文件的url
export const getFileUrl=mutation({
  args:{
    storageId:v.string(),
  },
  handler:async(ctx,args)=>{
    const url=await ctx.storage.getUrl(args.storageId);
    return url;
  }
})

//根据fileId获取文件信息
export const getFileRecord=query({
  args:{
    fileId:v.string(),
  },
  handler:async(ctx,args)=>{
    const result=await ctx.db.query('pdfFiles').filter((q)=>q.eq(q.field('fileId'),args.fileId)).collect();
    return result[0];
  }
})

//获取用户文件列表
export const getUserFiles=query({
  args:{
    userName:v.optional(v.string()),
  },
  handler:async(ctx,args)=>{
    const result=await ctx.db.query('pdfFiles').filter((q)=>q.eq(q.field('createdBy'),args.userName)).collect();
    return result;
  }
})