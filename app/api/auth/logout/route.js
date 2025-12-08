import { NextResponse } from "next/server";

export async function POST() {
  try {
    // 创建响应
    const response = NextResponse.json({
      success: true,
      message: "登出成功",
    });

    // 删除 auth-token cookie
    response.cookies.delete("auth-token");

    // 也删除旧的 user-id cookie（如果存在）
    response.cookies.delete("user-id");

    return response;
  } catch (error) {
    console.error("登出失败:", error);
    return NextResponse.json({ success: false, message: "登出失败" }, { status: 500 });
  }
}
