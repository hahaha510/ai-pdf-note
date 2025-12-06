"use node";

import { ConvexVectorStore } from "@langchain/community/vectorstores/convex";
import { action } from "./_generated/server.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { v } from "convex/values";

// 自定义 Embeddings 类，修复中文编码问题
class FixedGeminiEmbeddings {
  constructor(apiKey) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "text-embedding-004" });
  }

  async embedDocuments(texts) {
    const embeddings = [];
    for (const text of texts) {
      try {
        const result = await this.model.embedContent(text);
        embeddings.push(result.embedding.values);
      } catch (error) {
        console.error("Embedding error:", error.message);
        // 降级：返回零向量
        embeddings.push(new Array(768).fill(0));
      }
    }
    return embeddings;
  }

  async embedQuery(text) {
    try {
      const result = await this.model.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      console.error("Query embedding error:", error.message);
      // 降级：返回零向量
      return new Array(768).fill(0);
    }
  }
}

//将text转成vector并存储到convex中
export const ingest = action({
  args: {
    splitText: v.any(),
    fileId: v.string(),
  },
  handler: async (ctx, args) => {
    await ConvexVectorStore.fromTexts(
      args.splitText, //Array
      args.fileId, //string
      new FixedGeminiEmbeddings(process.env.GEMINI_API_KEY),
      { ctx }
    );
    return "Completed..";
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
      new FixedGeminiEmbeddings(process.env.GEMINI_API_KEY),
      { ctx }
    );

    //根据fileId来过滤，增加检索数量从1到5
    const resultOne = (await vectorStore.similaritySearch(args.query, 5)).filter((q) => {
      return Object.values(q.metadata).join("") === args.fileId.trim();
    });
    console.log("检索到的相关内容数量:", resultOne.length);
    console.log(
      "检索结果预览:",
      resultOne.map((r) => r.pageContent.substring(0, 100))
    );
    return JSON.stringify(resultOne);
  },
});
