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

export default function NoteEditPage() {
  const router = useRouter();
  const params = useParams();
  const noteId = params.noteId;

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
  }, [showPreview]);

  // 获取笔记数据
  const note = useQuery(api.onlineNotes.getNote, noteId ? { noteId } : "skip");

  // 更新笔记
  const updateNote = useMutation(api.onlineNotes.updateNote);

  // 当笔记数据加载完成后，填充表单
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setTags(note.tags || []);
      setCategory(note.category || "");
      setLastSaved(note.updatedAt);
    }
  }, [note]);

  // 保存笔记
  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Title cannot be empty");
      return;
    }

    setIsSaving(true);
    try {
      await updateNote({
        noteId,
        title,
        content,
        tags,
        category: category || undefined,
      });
      setLastSaved(Date.now());
      toast.success("Note saved successfully");
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error("Failed to save note");
    } finally {
      setIsSaving(false);
    }
  };

  // 自动保存
  useEffect(() => {
    if (!note) return;

    const autoSaveTimer = setTimeout(() => {
      if (
        title !== note.title ||
        content !== note.content ||
        JSON.stringify(tags) !== JSON.stringify(note.tags) ||
        category !== note.category
      ) {
        handleSave();
      }
    }, 2000);

    return () => clearTimeout(autoSaveTimer);
  }, [title, content, tags, category, note]);

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

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  if (!user || !note) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* 顶部操作栏 */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Button variant="ghost" onClick={() => router.push("/notes")} className="flex items-center">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Notes
        </Button>

        <div className="flex items-center gap-2 flex-wrap">
          {/* 保存状态指示器 */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-100 dark:bg-gray-800">
            {isSaving ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Saving...</span>
              </>
            ) : lastSaved ? (
              <>
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Saved {formatTime(lastSaved)}
                </span>
              </>
            ) : (
              <span className="text-xs text-gray-500">Not saved</span>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowShortcutsDialog(true)}
            title="Keyboard shortcuts (Ctrl/⌘+/)"
          >
            <Keyboard className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center"
            title={showPreview ? "Hide Preview (Ctrl/⌘+P)" : "Show Preview (Ctrl/⌘+P)"}
          >
            {showPreview ? (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                Hide Preview
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Show Preview
              </>
            )}
          </Button>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center"
            title="Save (Ctrl/⌘+S)"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* 标题 */}
      <div className="mb-6">
        <Input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title..."
          className="text-3xl font-bold border-none focus:ring-0 px-0"
        />
      </div>

      {/* 标签和分类 */}
      <div className="mb-6 space-y-4">
        {/* 标签 */}
        <div>
          <div className="flex items-center mb-2">
            <Tag className="w-4 h-4 mr-2 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Tags</span>
          </div>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
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
              placeholder="Add a tag..."
              className="max-w-xs"
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
            <span className="text-sm font-medium text-gray-700">Category</span>
          </div>
          <Input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Enter category..."
            className="max-w-xs"
          />
        </div>
      </div>

      {/* 编辑器和预览 */}
      <div className={`grid gap-6 ${showPreview ? "lg:grid-cols-2" : "grid-cols-1"}`}>
        {/* 编辑器 */}
        <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-900 dark:text-gray-100">
            <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
            Editor
          </h3>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start writing in Markdown...&#10;&#10;**Bold** or __bold__&#10;*Italic* or _italic_&#10;# Heading 1&#10;## Heading 2&#10;- List item&#10;1. Numbered item&#10;[Link](url)&#10;`code`&#10;```&#10;code block&#10;```"
            className="w-full min-h-[500px] p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 font-mono text-sm resize-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          />
        </Card>

        {/* 预览 */}
        {showPreview && (
          <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-900 dark:text-gray-100">
              <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
              Preview
            </h3>
            <div className="min-h-[500px] overflow-auto">
              <MarkdownPreview content={content} />
            </div>
          </Card>
        )}
      </div>

      {/* Markdown 帮助 */}
      <Card className="mt-6 p-6 bg-gray-50">
        <h3 className="text-sm font-semibold mb-3 text-gray-700">Markdown Guide</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs text-gray-600">
          <div>
            <code className="bg-white px-2 py-1 rounded">**bold**</code>
            <span className="ml-2">Bold text</span>
          </div>
          <div>
            <code className="bg-white px-2 py-1 rounded">*italic*</code>
            <span className="ml-2">Italic text</span>
          </div>
          <div>
            <code className="bg-white px-2 py-1 rounded"># Heading</code>
            <span className="ml-2">Heading</span>
          </div>
          <div>
            <code className="bg-white px-2 py-1 rounded">- List</code>
            <span className="ml-2">Bullet list</span>
          </div>
          <div>
            <code className="bg-white px-2 py-1 rounded">1. List</code>
            <span className="ml-2">Numbered list</span>
          </div>
          <div>
            <code className="bg-white px-2 py-1 rounded">[Link](url)</code>
            <span className="ml-2">Link</span>
          </div>
          <div>
            <code className="bg-white px-2 py-1 rounded">`code`</code>
            <span className="ml-2">Inline code</span>
          </div>
          <div>
            <code className="bg-white px-2 py-1 rounded">```code```</code>
            <span className="ml-2">Code block</span>
          </div>
          <div>
            <code className="bg-white px-2 py-1 rounded">&gt; Quote</code>
            <span className="ml-2">Blockquote</span>
          </div>
        </div>
      </Card>

      {/* 快捷键帮助对话框 */}
      <KeyboardShortcutsDialog open={showShortcutsDialog} onOpenChange={setShowShortcutsDialog} />
    </div>
  );
}
