"use node";

import { ConvexVectorStore } from "@langchain/community/vectorstores/convex";
import { action } from "./_generated/server.js";
import { TaskType } from "@google/generative-ai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { v } from "convex/values";

//将text转成vector并存储到convex中
export const ingest = action({
  args: {
    splitText:v.any(),
    fileId:v.string(),
  },
  handler: async (ctx,args) => {
    await ConvexVectorStore.fromTexts(
      args.splitText, //Array
      args.fileId,//string
      new GoogleGenerativeAIEmbeddings({
        apiKey:'AIzaSyBxuTNEFowI-u1iXs_NpEXQJe9wphElsBo',
        model: "text-embedding-004", // 768 dimensions
        taskType: TaskType.RETRIEVAL_DOCUMENT,
        title: "Document title",
      }),
      { ctx }
    );
    return 'Completed..'
  },
});
//向ai提问
export const search = action({
  args: {
    query: v.string(),
    fileId: v.string(),
  },
  handler: async (ctx, args) => {
    const vectorStore = new ConvexVectorStore(
      new GoogleGenerativeAIEmbeddings({
        apiKey:'AIzaSyBxuTNEFowI-u1iXs_NpEXQJe9wphElsBo',
        model: "text-embedding-004", // 768 dimensions
        taskType: TaskType.RETRIEVAL_DOCUMENT,
        title: "Document title",
      }),
       { ctx });

       //根据fileId来过滤 
       const resultOne = (await vectorStore.similaritySearch(args.query, 1))
       .filter(q => {
        return Object.values(q.metadata).join('')=== args.fileId.trim()
       }
       );
    console.log('resultOne:',resultOne);
    return JSON.stringify(resultOne);
  },
});