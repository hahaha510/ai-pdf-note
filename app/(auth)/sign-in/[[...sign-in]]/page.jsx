"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent
} from '@/components/ui/card';
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { setCookie } from 'cookies-next';

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 使用Convex登录验证
  const loginUser = useMutation(api.user.loginUser);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError('');
      
      // 基本验证
      if (!email || !password) {
        setError('请输入邮箱和密码');
        return;
      }
      
      // 调用Convex验证
      const result = await loginUser({
        email,
        password
      });

      if (result.success) {
        // 登录成功，设置cookie
        setCookie('user-id', result.userId, { 
          maxAge: 60 * 60 * 24 * 7, // 7天有效期
          path: '/' 
        });
        
        // 设置用户信息
        localStorage.setItem('user', JSON.stringify(result.user));
        
        // 重定向到首页
        router.push('/');
      } else {
        // 登录失败
        setError(result.message || '登录失败，请检查您的邮箱和密码');
      }
    } catch (err) {
      console.error("登录失败", err);
      setError('登录失败，请稍后再试');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">登录账户</CardTitle>
          <CardDescription className="text-center">
            输入您的邮箱和密码继续
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input 
                id="email"
                type="email" 
                placeholder="name@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">密码</Label>
                <Link 
                  href="/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  忘记密码?
                </Link>
              </div>
              <Input 
                id="password"
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            {error && (
              <div className="p-3 text-sm text-white bg-red-500 rounded-md">
                {error}
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? "登录中..." : "登录"}
            </Button>
          </form>
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-2 bg-white text-gray-500">或</span>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => router.push('/sign-up')}
          >
            创建新账户
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}