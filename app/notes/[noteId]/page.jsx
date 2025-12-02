/**
 * 笔记编辑页面 - 支持离线编辑
 * 功能：
 * - 自动保存草稿到本地
 * - 离线时保存到 IndexedDB
 * - 网络恢复后自动同步
 * - 草稿恢复提示
 */
"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  Save,
  Eye,
  EyeOff,
  Tag,
  FolderOpen,
  X,
  Plus,
  Keyboard,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { KeyboardShortcutsDialog } from "@/components/KeyboardShortcuts";
import { MarkdownPreview } from "@/components/MarkdownPreview";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { DraftRecoveryDialog } from "@/components/DraftRecoveryDialog";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { saveDraft, getDraft, deleteDraft, addToSyncQueue } from "@/lib/offlineStorage";

export default function NoteEditPage() {
  const router = useRouter();
  const params = useParams();
  const noteId = params.noteId;
  const { isOnline } = useNetworkStatus();

  // Convex mutations - must be at top level
  const createNoteMutation = useMutation(api.onlineNotes.createNote);
  const updateNoteMutation = useMutation(api.onlineNotes.updateNote);
  const deleteNoteMutation = useMutation(api.onlineNotes.deleteNote);

  const [user, setUser] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState([]);
  const [category, setCategory] = useState("");
  const [newTag, setNewTag] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false);

  // 草稿相关状态
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [draftData, setDraftData] = useState(null);
  const [saveMode, setSaveMode] = useState("online"); // 'online' | 'offline' | 'draft'

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (!userData) {
      router.push("/sign-in");
    } else {
      setUser(userData);
    }
  }, [router]);

  // 快捷键支持
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + S: 保存
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
      // Ctrl/Cmd + P: 切换预览
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault();
        setShowPreview(!showPreview);
      }
      // Ctrl/Cmd + /: 显示快捷键帮助
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        setShowShortcutsDialog(true);
      }
      // Esc: 关闭帮助
      if (e.key === "Escape") {
        setShowShortcutsDialog(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPreview]);

  // 获取笔记数据
  const note = useQuery(api.onlineNotes.getNote, noteId ? { noteId } : "skip");

  // 使用已定义的 mutation
  const updateNote = updateNoteMutation;

  // 检查并加载草稿
  useEffect(() => {
    if (!note || !user) return;

    const checkDraft = async () => {
      const draft = await getDraft(noteId);

      // 如果草稿存在且比服务器数据新，提示恢复
      if (draft && draft.lastSaved > note.updatedAt) {
        setDraftData(draft);
        setShowDraftDialog(true);
      }
    };

    checkDraft();
  }, [note, noteId, user]);

  // 当笔记数据加载完成后，填充表单
  useEffect(() => {
    if (note && !draftData) {
      setTitle(note.title);
      setContent(note.content);
      setTags(note.tags || []);
      setCategory(note.category || "");
      setLastSaved(note.updatedAt);
    }
  }, [note, draftData]);

  // 恢复草稿
  const handleRestoreDraft = () => {
    if (draftData) {
      setTitle(draftData.title);
      setContent(draftData.content);
      setTags(draftData.tags || []);
      setCategory(draftData.category || "");
      setLastSaved(draftData.lastSaved);
      toast.success("草稿已恢复");
    }
    setShowDraftDialog(false);
  };

  // 放弃草稿
  const handleDiscardDraft = async () => {
    if (draftData) {
      await deleteDraft(noteId);
      toast.info("草稿已放弃");
    }
    setShowDraftDialog(false);
  };

  // 保存笔记（支持在线/离线）
  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      toast.error("标题不能为空");
      return;
    }

    setIsSaving(true);

    const noteData = {
      title,
      content,
      tags,
      category: category || undefined,
    };

    try {
      // 1. 始终保存草稿到本地
      await saveDraft(noteId, noteData, user.userName);
      console.log("✅ 草稿已保存到本地");

      // 2. 尝试保存到服务器
      if (isOnline) {
        try {
          await updateNote({
            noteId,
            ...noteData,
          });

          setLastSaved(Date.now());
          setSaveMode("online");
          toast.success("笔记已保存");

          // 保存成功后删除草稿
          await deleteDraft(noteId);
        } catch (error) {
          console.error("保存到服务器失败:", error);

          // 添加到同步队列
          await addToSyncQueue("update", {
            noteId,
            ...noteData,
          });

          setSaveMode("offline");
          toast.warning("离线保存成功，将在网络恢复后同步");
        }
      } else {
        // 离线模式：添加到同步队列
        await addToSyncQueue("update", {
          noteId,
          ...noteData,
        });

        setSaveMode("offline");
        setLastSaved(Date.now());
        toast.info("离线保存成功，将在网络恢复后同步");
      }
    } catch (error) {
      console.error("保存失败:", error);
      toast.error("保存失败：" + error.message);
    } finally {
      setIsSaving(false);
    }
  }, [title, content, tags, category, noteId, user, isOnline, updateNote]);

  // 自动保存（每2秒检查一次）
  useEffect(() => {
    if (!note || !user) return;

    const autoSaveTimer = setTimeout(() => {
      const hasChanges =
        title !== note.title ||
        content !== note.content ||
        JSON.stringify(tags) !== JSON.stringify(note.tags) ||
        category !== note.category;

      if (hasChanges) {
        // 自动保存草稿到本地
        saveDraft(
          noteId,
          {
            title,
            content,
            tags,
            category,
          },
          user.userName
        );

        console.log("🔄 自动保存草稿");
      }
    }, 2000);

    return () => clearTimeout(autoSaveTimer);
  }, [title, content, tags, category, note, noteId, user]);

  // 添加标签
  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  // 删除标签
  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  // 格式化时间
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) return "刚刚";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
    return new Date(timestamp).toLocaleDateString("zh-CN");
  };

  if (!user || !note) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* 顶部操作栏 */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Button variant="ghost" onClick={() => router.push("/notes")} className="flex items-center">
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回笔记列表
        </Button>

        <div className="flex items-center gap-2 flex-wrap">
          {/* 离线状态指示器 */}
          <OfflineIndicator
            userId={user.userName}
            convexMutations={{
              createNote: createNoteMutation,
              updateNote: updateNoteMutation,
              deleteNote: deleteNoteMutation,
            }}
          />

          {/* 保存状态指示器 */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-100 dark:bg-gray-800">
            {isSaving ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                <span className="text-xs text-gray-600 dark:text-gray-400">保存中...</span>
              </>
            ) : lastSaved ? (
              <>
                <div
                  className={`w-2 h-2 rounded-full ${
                    saveMode === "online"
                      ? "bg-green-500"
                      : saveMode === "offline"
                        ? "bg-orange-500"
                        : "bg-gray-500"
                  }`}
                ></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {saveMode === "offline" ? "离线保存" : "已保存"} {formatTime(lastSaved)}
                </span>
              </>
            ) : (
              <span className="text-xs text-gray-500">未保存</span>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowShortcutsDialog(true)}
            title="快捷键 (Ctrl/⌘+/)"
          >
            <Keyboard className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center"
            title={showPreview ? "隐藏预览 (Ctrl/⌘+P)" : "显示预览 (Ctrl/⌘+P)"}
          >
            {showPreview ? (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                隐藏预览
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                显示预览
              </>
            )}
          </Button>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center"
            title="保存 (Ctrl/⌘+S)"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "保存中..." : "保存"}
          </Button>
        </div>
      </div>

      {/* 标题 */}
      <div className="mb-6">
        <Input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="笔记标题..."
          className="text-3xl font-bold border-none focus:ring-0 px-0"
        />
      </div>

      {/* 标签和分类 */}
      <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 标签 */}
        <div>
          <div className="flex items-center mb-2">
            <Tag className="w-4 h-4 mr-2 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">标签</span>
          </div>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
              >
                {tag}
                <button onClick={() => handleRemoveTag(tag)} className="ml-2 hover:text-blue-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              placeholder="添加标签..."
              className="flex-1"
            />
            <Button variant="outline" size="sm" onClick={handleAddTag} disabled={!newTag.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 分类 */}
        <div>
          <div className="flex items-center mb-2">
            <FolderOpen className="w-4 h-4 mr-2 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">分类</span>
          </div>
          <Input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="输入分类..."
            className="w-full"
          />
        </div>
      </div>

      {/* 编辑器和预览 */}
      <div className={`grid gap-6 ${showPreview ? "lg:grid-cols-2" : "grid-cols-1"}`}>
        {/* 编辑器 */}
        <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-900 dark:text-gray-100">
            <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
            编辑器
          </h3>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="开始使用 Markdown 写作...&#10;&#10;**粗体** 或 __粗体__&#10;*斜体* 或 _斜体_&#10;# 一级标题&#10;## 二级标题&#10;- 列表项&#10;1. 数字列表&#10;[链接](url)&#10;`代码`&#10;```&#10;代码块&#10;```"
            className="w-full min-h-[500px] p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 font-mono text-sm resize-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          />
        </Card>

        {/* 预览 */}
        {showPreview && (
          <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-900 dark:text-gray-100">
              <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
              预览
            </h3>
            <div className="min-h-[500px] overflow-auto">
              <MarkdownPreview content={content} />
            </div>
          </Card>
        )}
      </div>

      {/* Markdown 帮助 */}
      <Card className="mt-6 p-6 bg-gray-50 dark:bg-gray-800">
        <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
          Markdown 语法
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs text-gray-600 dark:text-gray-400">
          <div>
            <code className="bg-white dark:bg-gray-900 px-2 py-1 rounded">**粗体**</code>
            <span className="ml-2">粗体文本</span>
          </div>
          <div>
            <code className="bg-white dark:bg-gray-900 px-2 py-1 rounded">*斜体*</code>
            <span className="ml-2">斜体文本</span>
          </div>
          <div>
            <code className="bg-white dark:bg-gray-900 px-2 py-1 rounded"># 标题</code>
            <span className="ml-2">一级标题</span>
          </div>
          <div>
            <code className="bg-white dark:bg-gray-900 px-2 py-1 rounded">- 列表</code>
            <span className="ml-2">项目列表</span>
          </div>
          <div>
            <code className="bg-white dark:bg-gray-900 px-2 py-1 rounded">1. 列表</code>
            <span className="ml-2">数字列表</span>
          </div>
          <div>
            <code className="bg-white dark:bg-gray-900 px-2 py-1 rounded">[链接](url)</code>
            <span className="ml-2">超链接</span>
          </div>
          <div>
            <code className="bg-white dark:bg-gray-900 px-2 py-1 rounded">`代码`</code>
            <span className="ml-2">行内代码</span>
          </div>
          <div>
            <code className="bg-white dark:bg-gray-900 px-2 py-1 rounded">```代码```</code>
            <span className="ml-2">代码块</span>
          </div>
          <div>
            <code className="bg-white dark:bg-gray-900 px-2 py-1 rounded">&gt; 引用</code>
            <span className="ml-2">引用块</span>
          </div>
        </div>
      </Card>

      {/* 草稿恢复对话框 */}
      <DraftRecoveryDialog
        open={showDraftDialog}
        onOpenChange={setShowDraftDialog}
        draft={draftData}
        onRestore={handleRestoreDraft}
        onDiscard={handleDiscardDraft}
      />

      {/* 快捷键帮助对话框 */}
      <KeyboardShortcutsDialog open={showShortcutsDialog} onOpenChange={setShowShortcutsDialog} />
    </div>
  );
}
