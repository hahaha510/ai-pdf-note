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
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Save, Tag, FolderOpen, X, Plus, Keyboard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { KeyboardShortcutsDialog } from "@/components/KeyboardShortcuts";
import { MarkdownRichEditor } from "@/app/notes/_components/MarkdownRichEditor";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { DraftRecoveryDialog } from "@/components/DraftRecoveryDialog";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useOfflineNote } from "@/hooks/useOfflineQuery";
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
  }, []);

  // 获取笔记数据（支持离线）
  const { data: note, isFromCache: noteFromCache } = useOfflineNote(
    api.onlineNotes.getNote,
    noteId ? { noteId } : "skip"
  );

  // 使用已定义的 mutation
  const updateNote = updateNoteMutation;

  // 检查并加载草稿
  useEffect(() => {
    if (!note || !user) return;

    const checkDraft = async () => {
      const draft = await getDraft(noteId);

      // 如果草稿存在，检查是否需要恢复
      if (draft) {
        // 使用 updatedAt、_creationTime 或 cachedAt 作为服务器时间
        const serverTime = note.updatedAt || note._creationTime || note.cachedAt || 0;

        // 如果草稿比服务器数据新，或者没有服务器时间戳，提示恢复
        if (!serverTime || draft.lastSaved > serverTime) {
          setDraftData(draft);
          setShowDraftDialog(true);
        } else {
          // 草稿比服务器数据旧，自动删除
          await deleteDraft(noteId);
          console.log("🗑️ 已删除过期草稿");
        }
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

  // 使用自动保存 Hook
  const autoSaveData = {
    title,
    content,
    tags,
    category,
  };

  const handleAutoSave = useCallback(
    async (data) => {
      if (noteId) {
        await updateNote({
          noteId,
          ...data,
        });
        setLastSaved(Date.now());
        setSaveMode("online");
      }
    },
    [noteId, updateNote]
  );

  useAutoSave(autoSaveData, noteId, user?.userName, handleAutoSave, {
    delay: 2000,
    enabled: !!note && !!user,
  });

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

        <div className="flex items-center gap-3 flex-wrap">
          {/* 离线模式提示 */}
          {noteFromCache && (
            <div className="px-3 py-1.5 rounded-md bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
              <span className="text-xs font-medium">📵 离线数据</span>
            </div>
          )}

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

      {/* 富文本编辑器（支持 Markdown） */}
      <div className="mt-6">
        <MarkdownRichEditor
          initialContent={content}
          onUpdate={setContent}
          placeholder="开始写作... 支持工具栏和 Markdown 语法（输入 **粗体** 自动转换）"
        />
      </div>

      {/* 编辑器使用说明 */}
      <Card className="mt-6 p-6 bg-gray-50 dark:bg-gray-800">
        <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
          📝 编辑器使用说明
        </h3>
        <div className="space-y-3 text-xs text-gray-600 dark:text-gray-400">
          <div>
            <strong className="text-gray-900 dark:text-gray-100">两种编辑方式：</strong>
            <p>1. 使用工具栏按钮格式化文本（点击即可）</p>
            <p>2. 直接输入 Markdown 语法（实时转换）</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
            <div>
              <code className="bg-white dark:bg-gray-900 px-2 py-1 rounded">**粗体**</code>
              <span className="ml-2">
                → <strong>粗体</strong>
              </span>
            </div>
            <div>
              <code className="bg-white dark:bg-gray-900 px-2 py-1 rounded">*斜体*</code>
              <span className="ml-2">
                → <em>斜体</em>
              </span>
            </div>
            <div>
              <code className="bg-white dark:bg-gray-900 px-2 py-1 rounded">~~删除~~</code>
              <span className="ml-2">
                → <del>删除</del>
              </span>
            </div>
            <div>
              <code className="bg-white dark:bg-gray-900 px-2 py-1 rounded"># 标题</code>
              <span className="ml-2">→ 一级标题</span>
            </div>
            <div>
              <code className="bg-white dark:bg-gray-900 px-2 py-1 rounded">- 列表</code>
              <span className="ml-2">→ 无序列表</span>
            </div>
            <div>
              <code className="bg-white dark:bg-gray-900 px-2 py-1 rounded">1. 列表</code>
              <span className="ml-2">→ 有序列表</span>
            </div>
            <div>
              <code className="bg-white dark:bg-gray-900 px-2 py-1 rounded">&gt; 引用</code>
              <span className="ml-2">→ 引用块</span>
            </div>
            <div>
              <code className="bg-white dark:bg-gray-900 px-2 py-1 rounded">```代码```</code>
              <span className="ml-2">→ 代码块</span>
            </div>
            <div>
              <code className="bg-white dark:bg-gray-900 px-2 py-1 rounded">`代码`</code>
              <span className="ml-2">→ 行内代码</span>
            </div>
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
