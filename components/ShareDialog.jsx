"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, Check, Link2, Eye, Edit3 } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

export function ShareDialog({ open, onOpenChange, noteId, noteTitle }) {
  const [permission, setPermission] = useState("edit");
  const [expiresIn, setExpiresIn] = useState("never");
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const createShare = useMutation(api.shares.createShare);

  const handleGenerateLink = async () => {
    try {
      setIsGenerating(true);

      // 获取当前用户
      const user = JSON.parse(localStorage.getItem("user"));
      if (!noteId) {
        toast.error("无法获取笔记ID");
        return;
      }

      // 计算过期时间
      let expiresInMs = null;
      if (expiresIn === "24h") {
        expiresInMs = 24 * 60 * 60 * 1000;
      } else if (expiresIn === "7d") {
        expiresInMs = 7 * 24 * 60 * 60 * 1000;
      }

      // 创建分享链接参数
      const shareParams = {
        noteId,
        createdBy: user.email,
        permission,
      };

      // 只有当 expiresInMs 不为 null 时才添加 expiresIn 字段
      if (expiresInMs !== null) {
        shareParams.expiresIn = expiresInMs;
      }

      const result = await createShare(shareParams);

      if (result.success) {
        const fullUrl = `${window.location.origin}${result.shareUrl}`;
        setShareUrl(fullUrl);
        toast.success("分享链接已生成");
      }
    } catch (error) {
      console.error("生成分享链接失败:", error);
      toast.error("生成分享链接失败");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("链接已复制到剪贴板");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("复制失败");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            分享笔记
          </DialogTitle>
          <DialogDescription>{noteTitle && `"${noteTitle}"`}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 权限设置 */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">🔐 访问权限</Label>
            <RadioGroup value={permission} onValueChange={setPermission}>
              <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                <RadioGroupItem value="view" id="view" className="mt-1" />
                <div className="flex-1">
                  <Label
                    htmlFor="view"
                    className="cursor-pointer font-medium flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    可查看
                  </Label>
                  <p className="text-sm text-gray-500 mt-1">只能阅读，不能编辑</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                <RadioGroupItem value="edit" id="edit" className="mt-1" />
                <div className="flex-1">
                  <Label
                    htmlFor="edit"
                    className="cursor-pointer font-medium flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    可编辑
                  </Label>
                  <p className="text-sm text-gray-500 mt-1">可以实时协同编辑</p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* 有效期设置 */}
          <div className="space-y-3">
            <Label htmlFor="expires" className="text-base font-semibold">
              ⏰ 有效期
            </Label>
            <Select value={expiresIn} onValueChange={setExpiresIn}>
              <SelectTrigger id="expires">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">永久有效</SelectItem>
                <SelectItem value="7d">7天后过期</SelectItem>
                <SelectItem value="24h">24小时后过期</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 分享链接 */}
          {shareUrl && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">🔗 分享链接</Label>
              <div className="flex gap-2">
                <div className="flex-1 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm break-all">
                  {shareUrl}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyLink}
                  className="flex-shrink-0"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500">任何有此链接的登录用户都可以访问</p>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleGenerateLink} disabled={isGenerating}>
            {isGenerating ? "生成中..." : shareUrl ? "重新生成" : "生成链接"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
