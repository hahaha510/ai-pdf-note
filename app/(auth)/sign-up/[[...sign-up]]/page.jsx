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
import { v4 as uuidv4 } from 'uuid';

export default function SignUp() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Convex mutation
  const createUser = useMutation(api.user.createUser);

  // 注册表单处理
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError('');
      
      // 基本验证
      if (!firstName || !lastName || !email || !password) {
        setError('所有字段都为必填项');
        return;
      }
      
      if (password !== confirmPassword) {
        setError('两次输入的密码不一致');
        return;
      }
      
      if (password.length < 8) {
        setError('密码长度至少为8个字符');
        return;
      }
      
      // 创建用户并保存到Convex
      const authToken = uuidv4(); // 生成一个随机令牌作为认证标识
      
      const result = await createUser({
        email: email,
        userName: `${firstName} ${lastName}`,
        password: password, // 注意：在实际应用中，应该使用哈希密码而非明文
        imageUrl: "", // 默认为空
      });
      
      if (result.success) {
        // 设置认证cookie
        setCookie('auth-token', authToken, { 
          maxAge: 60 * 60 * 24 * 7, // 7天有效期
          path: '/' 
        });
        
        // 注册成功，跳转到首页
        router.push('/');
      } else {
        setError(result.message || '注册失败，请稍后重试');
      }
    } catch (err) {
      console.error("注册失败", err);
      setError('注册失败，可能是邮箱已被使用');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">创建账户</CardTitle>
          <CardDescription className="text-center">
            输入您的信息以创建账户
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">名字</Label>
                <Input 
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="名字" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">姓氏</Label>
                <Input 
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="姓氏" 
                  required 
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input 
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com" 
                required 
                autoComplete="email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input 
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                autoComplete="new-password"
              />
              <p className="text-xs text-gray-500">
                密码至少需要8个字符
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认密码</Label>
              <Input 
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required 
                autoComplete="new-password"
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
              {isLoading ? "处理中..." : "注册"}
            </Button>
            
            <div className="text-center text-sm">
              已有账户?{" "}
              <Link 
                href="/sign-in"
                className="font-medium text-blue-600 hover:text-blue-800"
              >
                登录
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}