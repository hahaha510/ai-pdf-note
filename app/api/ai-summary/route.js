import { NextResponse } from "next/server";
import { aiService } from "@/lib/aiService";

/**
 * AI 摘要 API
 * POST /api/ai-summary
 * Body: { content: string } | { notes: Array }
 */
export async function POST(request) {
  try {
    const body = await request.json();

    // 单篇摘要
    if (body.content) {
      const summary = await aiService.summarize(body.content, body.maxLength || 150);

      return NextResponse.json({
        success: true,
        type: "single",
        summary,
      });
    }

    // 批量摘要
    if (body.notes && body.notes.length > 0) {
      const summary = await aiService.summarizeBatch(body.notes);

      return NextResponse.json({
        success: true,
        type: "batch",
        summary,
        count: body.notes.length,
      });
    }

    return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
  } catch (error) {
    console.error("生成摘要失败:", error);
    return NextResponse.json({ error: "生成摘要失败", message: error.message }, { status: 500 });
  }
}
