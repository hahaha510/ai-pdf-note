import { NextResponse } from "next/server";
import { verifyToken } from "./lib/auth";

// 定义公共路由（无需登录即可访问）
const publicPaths = ["/", "/sign-in", "/sign-up"];

// 定义 API 路由（不需要中间件验证）
const apiPaths = ["/api/auth"];

// 中间件函数
export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // 检查是否是公共路由
  const isPublicPath = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  // 检查是否是 API 路由
  const isApiPath = apiPaths.some((path) => pathname.startsWith(path));

  // 如果是公共路由或 API 路由，直接允许访问
  if (isPublicPath || isApiPath) {
    return NextResponse.next();
  }

  // 获取 auth-token cookie
  const token = request.cookies.get("auth-token")?.value;

  // 如果没有 token，重定向到登录页面
  if (!token) {
    const url = new URL("/sign-in", request.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // 验证 JWT token
  const payload = await verifyToken(token);

  // 如果 token 无效或过期，清除 cookie 并重定向到登录页面
  if (!payload) {
    const url = new URL("/sign-in", request.url);
    url.searchParams.set("from", pathname);
    url.searchParams.set("expired", "true");

    const response = NextResponse.redirect(url);
    response.cookies.delete("auth-token");
    return response;
  }

  // Token 有效，将用户信息添加到请求头中
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", payload.userId);
  requestHeaders.set("x-user-email", payload.email);

  // 用户已登录且 token 有效，允许访问
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// 配置中间件适用的路由
export const config = {
  matcher: [
    // 排除静态资源、manifest.json、sw.js 等
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.ico).*)",
  ],
};
