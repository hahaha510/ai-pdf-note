import { NextResponse } from "next/server";
import { aiService } from "@/lib/aiService";

/**
 * AI 主题聚合 API
 * POST /api/ai-topics
 * Body: { notes: Array, topK: number }
 */
export async function POST(request) {
  try {
    const { notes, topK = 5 } = await request.json();

    if (!notes || notes.length === 0) {
      return NextResponse.json({ error: "缺少笔记数据" }, { status: 400 });
    }

    // 提取主题
    const topics = await aiService.extractTopics(notes, topK);

    return NextResponse.json({
      success: true,
      topics,
      totalNotes: notes.length,
    });
  } catch (error) {
    console.error("提取主题失败:", error);
    return NextResponse.json({ error: "提取主题失败", message: error.message }, { status: 500 });
  }
}
