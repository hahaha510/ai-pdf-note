import { NextResponse } from "next/server";
import { aiService } from "@/lib/aiService";

/**
 * AI 语义搜索 API
 * POST /api/ai-search
 * Body: { query: string, notes: Array }
 */
export async function POST(request) {
  try {
    const { query, notes } = await request.json();

    if (!query || !notes || notes.length === 0) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    // 执行语义搜索
    const results = await aiService.semanticSearch(query, notes, 10);

    return NextResponse.json({
      success: true,
      query,
      results,
      count: results.length,
    });
  } catch (error) {
    console.error("AI 搜索失败:", error);
    return NextResponse.json({ error: "搜索失败", message: error.message }, { status: 500 });
  }
}
