import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { createToken } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

// 简单的速率限制（内存存储）
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15分钟

function checkRateLimit(email) {
  const now = Date.now();
  const attempts = loginAttempts.get(email) || { count: 0, lastAttempt: now };

  // 如果超过锁定时间，重置计数
  if (now - attempts.lastAttempt > LOCKOUT_TIME) {
    loginAttempts.set(email, { count: 1, lastAttempt: now });
    return true;
  }

  // 检查是否超过最大尝试次数
  if (attempts.count >= MAX_ATTEMPTS) {
    return false;
  }

  // 增加尝试次数
  loginAttempts.set(email, { count: attempts.count + 1, lastAttempt: now });
  return true;
}

function resetRateLimit(email) {
  loginAttempts.delete(email);
}

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    // 基本验证
    if (!email || !password) {
      return NextResponse.json({ success: false, message: "请输入邮箱和密码" }, { status: 400 });
    }

    // 速率限制检查
    if (!checkRateLimit(email)) {
      return NextResponse.json(
        { success: false, message: "尝试次数过多，请15分钟后再试" },
        { status: 429 }
      );
    }

    // 查询用户
    const users = await convex.query(api.user.getUserByEmail, { email });

    if (!users || users.length === 0) {
      return NextResponse.json({ success: false, message: "用户不存在" }, { status: 401 });
    }

    const user = users[0];

    // 验证密码（兼容旧的明文密码和新的加密密码）
    let isValid = false;

    // 检查是否是加密密码（包含 $ 分隔符）
    if (user.password.includes("$")) {
      // 新格式：加密密码
      isValid = await verifyPassword(password, user.password);
    } else {
      // 旧格式：明文密码（直接比较）
      isValid = password === user.password;
    }

    if (!isValid) {
      return NextResponse.json({ success: false, message: "密码错误" }, { status: 401 });
    }

    // 登录成功，重置速率限制
    resetRateLimit(email);

    // 创建 JWT token
    const token = await createToken({
      userId: user._id,
      email: user.email,
      userName: user.userName,
    });

    // 创建响应
    const response = NextResponse.json({
      success: true,
      message: "登录成功",
      user: {
        id: user._id,
        email: user.email,
        userName: user.userName,
        imageUrl: user.imageUrl,
      },
    });

    // 设置 httpOnly cookie
    response.cookies.set("auth-token", token, {
      httpOnly: true, // 防止 XSS 攻击
      secure: process.env.NODE_ENV === "production", // 生产环境使用 HTTPS
      sameSite: "strict", // 防止 CSRF 攻击
      maxAge: 60 * 60 * 24 * 7, // 7天
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("登录失败:", error);
    return NextResponse.json({ success: false, message: "登录失败，请稍后再试" }, { status: 500 });
  }
}
