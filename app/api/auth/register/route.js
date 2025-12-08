import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { createToken } from "@/lib/auth";
import { hashPassword } from "@/lib/password";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function POST(request) {
  try {
    const { email, userName, password } = await request.json();

    // 基本验证
    if (!email || !userName || !password) {
      return NextResponse.json({ success: false, message: "所有字段都为必填项" }, { status: 400 });
    }

    // 密码强度验证
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: "密码长度至少为8个字符" },
        { status: 400 }
      );
    }

    // 检查用户是否已存在
    const existingUsers = await convex.query(api.user.getUserByEmail, { email });

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json({ success: false, message: "该邮箱已被注册" }, { status: 409 });
    }

    // 加密密码
    const hashedPassword = await hashPassword(password);

    // 创建用户
    const result = await convex.mutation(api.user.createUserSecure, {
      email,
      userName,
      password: hashedPassword,
      imageUrl: "",
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message || "注册失败" },
        { status: 500 }
      );
    }

    // 创建 JWT token
    const token = await createToken({
      userId: result.userId,
      email,
      userName,
    });

    // 创建响应
    const response = NextResponse.json({
      success: true,
      message: "注册成功",
      user: {
        id: result.userId,
        email,
        userName,
        imageUrl: "",
      },
    });

    // 设置 httpOnly cookie
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7天
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("注册失败:", error);
    return NextResponse.json({ success: false, message: "注册失败，请稍后再试" }, { status: 500 });
  }
}
