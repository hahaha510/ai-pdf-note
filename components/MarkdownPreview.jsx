"use client";
import React, { Suspense, lazy } from "react";
import { Card } from "@/components/ui/card";
import remarkGfm from "remark-gfm";

// 懒加载 ReactMarkdown 组件
const ReactMarkdown = lazy(() => import("react-markdown"));

export function MarkdownPreview({ content, className = "" }) {
  return (
    <Suspense
      fallback={
        <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-5/6" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-4/6" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </Card>
      }
    >
      <div className={`prose prose-sm dark:prose-invert max-w-none ${className}`}>
        {content ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        ) : (
          <p className="text-gray-400 dark:text-gray-500 italic">Nothing to preview yet...</p>
        )}
      </div>
    </Suspense>
  );
}
