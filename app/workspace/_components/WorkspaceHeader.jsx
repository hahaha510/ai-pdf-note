"use client";
import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEditorContext } from "./EditorContext";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Tag, FolderOpen, Plus, X, Save, Check } from "lucide-react";
import { toast } from "sonner";
import { useAutoSave } from "../../../hooks/useAutoSave";
import { ThemeToggle } from "@/components/ThemeToggle";
import { KeyboardShortcutsHelp } from "@/components/KeyboardShortcutsHelp";
import { useNetworkStatus } from "../../../hooks/useNetworkStatus";
import { offlineStorage } from "../../../lib/offlineStorage";

function WorkspaceHeader({ fileName, noteId, user, noteType, noteData }) {
  const { editor } = useEditorContext();
  const [title, setTitle] = useState(fileName || "");
  const [tags, setTags] = useState([]);
  const [category, setCategory] = useState("");
  const [newTag, setNewTag] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);
  const { isOnline } = useNetworkStatus();

  // 旧的保存方法（兼容 PDF）
  const saveNotes = useMutation(api.notes.AddNotes);
  // 新的保存方法
  const updateNote = useMutation(api.workspaceNotes.updateNote);

  useEffect(() => {
    if (noteData) {
      setTitle(noteData.title || noteData.fileName || "");
      setTags(noteData.tags || []);
      setCategory(noteData.category || "");
    }
  }, [noteData]);

  const handleSave = useCallback(
    async (silent = false) => {
      if (!editor || !user) return;

      setIsSaving(true);
      const content = editor.getHTML();
      const plainContent = editor.getText();
      const excerpt = plainContent.substring(0, 150);

      try {
        // 离线模式：保存到本地
        if (!isOnline) {
          const offlineNote = {
            noteId: noteId || `offline_${Date.now()}`,
            title,
            content,
            plainContent,
            excerpt,
            tags,
            category,
            type: noteType || "note",
            createdBy: user.userName,
            synced: false,
          };

          await offlineStorage.saveNote(offlineNote);

          if (!silent) {
            toast.info("离线保存成功，网络恢复后将自动同步");
          } else {
            setAutoSaved(true);
            setTimeout(() => setAutoSaved(false), 2000);
          }
        } else {
          // 在线模式：保存到服务器
          if (noteData?.noteId) {
            await updateNote({
              noteId,
              content,
              plainContent,
              title,
              tags,
              category: category || undefined,
            });

            // 保存成功后删除草稿和本地缓存
            await offlineStorage.deleteDraft(noteId);
            await offlineStorage.deleteNote(noteId); // 删除可能存在的本地缓存

            if (!silent) {
              toast.success("笔记已保存");
            } else {
              setAutoSaved(true);
              setTimeout(() => setAutoSaved(false), 2000);
            }
          } else {
            // 兼容旧的保存方式
            await saveNotes({
              fileId: noteId,
              notes: content,
              createdBy: user.userName || "",
            });

            // 删除草稿
            if (noteId) {
              await offlineStorage.deleteDraft(noteId);
            }

            if (!silent) {
              toast.success("保存成功");
            }
          }
        }
      } catch (error) {
        console.error("保存失败:", error);
        // 如果在线保存失败，尝试离线保存
        if (isOnline) {
          try {
            await offlineStorage.saveNote({
              noteId: noteId || `offline_${Date.now()}`,
              title,
              content,
              plainContent,
              excerpt,
              tags,
              category,
              type: noteType || "note",
              createdBy: user.userName,
              synced: false,
            });
            toast.warning("保存到服务器失败，已保存到本地");
          } catch (offlineError) {
            if (!silent) {
              toast.error("保存失败");
            }
          }
        } else {
          if (!silent) {
            toast.error("保存失败");
          }
        }
      } finally {
        setIsSaving(false);
      }
    },
    [
      editor,
      user,
      noteData,
      noteId,
      updateNote,
      saveNotes,
      title,
      tags,
      category,
      isOnline,
      noteType,
    ]
  );

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  // 自动保存
  useAutoSave(
    () => handleSave(true),
    editor?.getHTML(),
    3000 // 3秒后自动保存
  );

  // 快捷键支持
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + S 保存
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  return (
    <div className="border-b">
      <div className="p-4 flex justify-between items-center">
        <Image src={"/logo.svg"} alt="logo" width={140} height={100} />
        <div className="flex-1 mx-8">
          <Input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-xl font-bold text-center border-none focus:ring-0"
            placeholder="标题..."
          />
        </div>
        <div className="flex items-center gap-2">
          {autoSaved && (
            <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1 animate-fadeIn">
              <Check className="w-4 h-4" />
              {isOnline ? "已自动保存到云端" : "已保存到本地"}
            </span>
          )}
          <KeyboardShortcutsHelp />
          <ThemeToggle />
          <Button onClick={() => handleSave(false)} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "保存中..." : "保存"}
          </Button>
        </div>
      </div>

      {/* 标签和分类区域（仅普通笔记显示） */}
      {noteType === "note" && (
        <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 标签 */}
          <div>
            <div className="flex items-center mb-2">
              <Tag className="w-4 h-4 mr-2 text-gray-500" />
              <span className="text-sm font-medium">标签</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                >
                  {tag}
                  <button onClick={() => handleRemoveTag(tag)} className="ml-2">
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
              <Button variant="outline" size="sm" onClick={handleAddTag}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* 分类 */}
          <div>
            <div className="flex items-center mb-2">
              <FolderOpen className="w-4 h-4 mr-2 text-gray-500" />
              <span className="text-sm font-medium">分类</span>
            </div>
            <Input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="输入分类..."
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkspaceHeader;
