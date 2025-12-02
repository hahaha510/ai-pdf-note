/**
 * 草稿恢复对话框
 * 当检测到未保存的草稿时提示用户恢复
 */
"use client";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Trash2, Clock } from "lucide-react";

export function DraftRecoveryDialog({ open, onOpenChange, draft, onRestore, onDiscard }) {
  if (!draft) return null;

  // 格式化时间
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = Date.now();
    const diff = now - timestamp;

    // 小于1分钟
    if (diff < 60000) {
      return "刚刚";
    }

    // 小于1小时
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} 分钟前`;
    }

    // 小于24小时
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} 小时前`;
    }

    // 超过24小时
    return date.toLocaleString("zh-CN", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 计算草稿字数
  const wordCount = draft.content ? draft.content.length : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            发现未保存的草稿
          </DialogTitle>
          <DialogDescription>
            检测到您有一个未保存的草稿，是否恢复？恢复后将覆盖当前内容。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 草稿信息 */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">标题</span>
              <span className="text-sm text-gray-900 dark:text-gray-100">
                {draft.title || "无标题"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">字数</span>
              <span className="text-sm text-gray-900 dark:text-gray-100">{wordCount} 字</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                保存时间
              </span>
              <span className="text-sm text-gray-900 dark:text-gray-100">
                {formatTime(draft.lastSaved)}
              </span>
            </div>

            {draft.tags && draft.tags.length > 0 && (
              <div className="flex items-start justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">标签</span>
                <div className="flex flex-wrap gap-1 max-w-[200px] justify-end">
                  {draft.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-block px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 内容预览 */}
          {draft.content && (
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">内容预览</p>
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 max-h-32 overflow-y-auto">
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-4">
                  {draft.content}
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onDiscard}
            className="w-full sm:w-auto text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            放弃草稿
          </Button>
          <Button onClick={onRestore} className="w-full sm:w-auto">
            <FileText className="w-4 h-4 mr-2" />
            恢复草稿
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DraftRecoveryDialog;
