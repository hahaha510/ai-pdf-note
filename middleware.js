import { NextResponse } from 'next/server'

// 定义公共路由（无需登录即可访问）
const publicPaths = ['/sign-in', '/sign-up']

// 中间件函数
export function middleware(request) {
  const { pathname } = request.nextUrl
  
  // 检查是否是公共路由
  const isPublicPath = publicPaths.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  )
  
  // 检查用户是否已登录（从cookie中获取user-id）
  const isAuthenticated = request.cookies.has('user-id')
  
  // 如果是公共路由，直接允许访问
  if (isPublicPath) {
    return NextResponse.next()
  }
  
  // 如果不是公共路由，且用户未登录，重定向到登录页面
  if (!isAuthenticated) {
    const url = new URL('/sign-in', request.url)
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }
  
  // 用户已登录，允许访问
  return NextResponse.next()
}

// 配置中间件适用的路由
export const config = {
  matcher: [
    // 排除静态资源
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}

