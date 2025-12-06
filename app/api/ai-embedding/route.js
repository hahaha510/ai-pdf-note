import { NextResponse } from "next/server";
import { aiService } from "@/lib/aiService";

/**
 * AI Embedding 生成 API
 * POST /api/ai-embedding
 * Body: { text: string } | { texts: Array }
 */
export async function POST(request) {
  try {
    const body = await request.json();

    // 单个文本
    if (body.text) {
      const embedding = await aiService.generateEmbedding(body.text);

      return NextResponse.json({
        success: true,
        embedding,
      });
    }

    // 批量文本
    if (body.texts && body.texts.length > 0) {
      const embeddings = await aiService.generateBatchEmbeddings(body.texts);

      return NextResponse.json({
        success: true,
        embeddings,
        count: embeddings.length,
      });
    }

    return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
  } catch (error) {
    console.error("生成 Embedding 失败:", error);
    return NextResponse.json(
      { error: "生成 Embedding 失败", message: error.message },
      { status: 500 }
    );
  }
}
