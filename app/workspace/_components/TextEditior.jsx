"use client";
import React, { useState } from "react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import { useEditor, EditorContent } from "@tiptap/react";
import EditorExtension from "./EditorExtension";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import Strike from "@tiptap/extension-strike";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { useEffect, useRef } from "react";
import { useEditorContext } from "./EditorContext";
import { offlineStorage } from "../../../lib/offlineStorage";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { useNetworkStatus } from "../../../hooks/useNetworkStatus";
function TextEditior({ fileId }) {
  // 从 workspaceNotes 表获取笔记
  const workspaceNote = useQuery(api.workspaceNotes.getNote, fileId ? { noteId: fileId } : "skip");
  const updateNote = useMutation(api.workspaceNotes.updateNote);

  const notes = workspaceNote?.content;
  const { setEditor } = useEditorContext();
  const [hasDraft, setHasDraft] = useState(false);
  const [draftContent, setDraftContent] = useState(null);
  const [user, setUser] = useState(null);
  const [isRestoringDraft, setIsRestoringDraft] = useState(false);
  const lastSetContent = useRef(null);
  const { isOnline } = useNetworkStatus();

  // 获取用户信息
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // 启用所有 Markdown 快捷键
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
        blockquote: {
          HTMLAttributes: {
            class:
              "border-l-4 border-blue-500 pl-4 py-2 my-4 italic text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800",
          },
        },
        codeBlock: {
          HTMLAttributes: {
            class:
              "bg-gray-900 text-gray-100 rounded-lg p-4 my-4 font-mono text-sm overflow-x-auto",
          },
        },
        code: {
          HTMLAttributes: {
            class: "bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono",
          },
        },
        horizontalRule: {
          HTMLAttributes: {
            class: "my-4 border-gray-300 dark:border-gray-600",
          },
        },
      }),
      Placeholder.configure({
        placeholder:
          "开始编写你的笔记... 支持 Markdown 语法 (# 标题, **粗体**, - 列表, > 引用, ``` 代码)",
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Highlight.configure({
        multicolor: true,
        HTMLAttributes: {
          class: "bg-yellow-200 dark:bg-yellow-600 px-1 rounded",
        },
      }),
      Underline,
      Strike,
    ],
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "focus:outline-none min-h-[70vh] p-8 prose prose-lg max-w-none dark:prose-invert prose-headings:font-bold prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-ul:list-disc prose-ol:list-decimal prose-li:ml-4 prose-code:bg-gray-200 prose-code:dark:bg-gray-700 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded",
      },
    },
  });
  // 检查是否有未保存的草稿
  useEffect(() => {
    const checkDraft = async () => {
      if (fileId && editor && notes) {
        const draft = await offlineStorage.getDraft(fileId);
        if (draft && draft.content) {
          // 比较草稿和当前内容（去除空格和换行差异）
          const draftNormalized = draft.content.trim();
          const notesNormalized = notes.trim();

          if (draftNormalized !== notesNormalized && draftNormalized.length > 0) {
            setDraftContent(draft.content);
            setHasDraft(true);
          } else {
            // 内容一致，删除草稿
            await offlineStorage.deleteDraft(fileId);
          }
        }
      }
    };
    checkDraft();
  }, [fileId, editor, notes]);

  // 加载笔记内容
  useEffect(() => {
    if (notes && !hasDraft && !isRestoringDraft && editor) {
      // 检查编辑器当前内容，避免覆盖已编辑的内容
      const currentContent = editor.getHTML().trim();
      const normalizedNotes = notes.trim();
      const normalizedLast = (lastSetContent.current || "").trim();

      // 只在以下情况设置内容：
      // 1. 编辑器为空
      // 2. 内容与上次设置的不同，且与当前编辑器内容不同
      if (
        !currentContent ||
        (normalizedNotes !== normalizedLast && normalizedNotes !== currentContent)
      ) {
        editor.commands.setContent(notes);
        lastSetContent.current = notes;
      }
    }
  }, [notes, editor, hasDraft, isRestoringDraft]);

  // 自动保存草稿（仅在离线时保存）
  useEffect(() => {
    if (!editor || !fileId || !notes) return;

    const saveDraft = async () => {
      // 只在离线时才保存草稿
      if (isOnline) {
        console.log("在线状态，跳过草稿保存（使用自动保存到服务器）");
        return;
      }

      const content = editor.getHTML();
      if (!content) return;

      // 标准化比较（去除空格差异）
      const contentNormalized = content.trim();
      const notesNormalized = notes.trim();

      // 只在内容与服务器笔记不同时保存草稿
      if (contentNormalized !== notesNormalized) {
        await offlineStorage.saveDraft(fileId, content);
        console.log("离线草稿已保存");
      }
    };

    const interval = setInterval(saveDraft, 3000); // 每3秒检查并保存草稿
    return () => clearInterval(interval);
  }, [editor, fileId, notes, isOnline]);
  // console.log(editor)
  useEffect(() => {
    if (editor) {
      setEditor(editor);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);
  const handleRestoreDraft = async () => {
    if (draftContent && editor) {
      try {
        // 1. 设置标志位，防止被其他 useEffect 覆盖
        setIsRestoringDraft(true);
        setHasDraft(false);

        // 2. 设置编辑器内容并记录
        editor.commands.setContent(draftContent);
        lastSetContent.current = draftContent;

        // 3. 如果在线，立即保存到服务器
        if (isOnline && workspaceNote && user) {
          // 临时创建一个 DOM 元素来提取纯文本
          const tempDiv = document.createElement("div");
          tempDiv.innerHTML = draftContent;
          const plainContent = tempDiv.textContent || tempDiv.innerText || "";

          await updateNote({
            noteId: fileId,
            content: draftContent,
            plainContent: plainContent,
          });
          toast.success("草稿已恢复并保存到云端");

          // 保存成功后，永久禁用自动加载（因为内容已经是最新的了）
          // 不重置 isRestoringDraft，让用户继续编辑
        } else {
          toast.success("草稿已恢复（离线模式）");
        }

        // 4. 删除草稿
        await offlineStorage.deleteDraft(fileId);

        // 5. 保持标志位，防止后续自动加载
        // 只有当用户刷新页面或重新进入笔记时才会重置
      } catch (error) {
        console.error("恢复草稿失败:", error);
        toast.error("恢复草稿失败");
        setIsRestoringDraft(false);
      }
    }
  };

  const handleDiscardDraft = async () => {
    if (fileId) {
      await offlineStorage.deleteDraft(fileId);
      setHasDraft(false);
      if (notes) {
        editor && editor.commands.setContent(notes);
      }
    }
  };

  // 网络恢复后自动同步草稿
  useEffect(() => {
    const syncDraftOnReconnect = async () => {
      if (!isOnline || !fileId || !editor || !workspaceNote || !user) return;

      try {
        const draft = await offlineStorage.getDraft(fileId);
        if (draft && draft.content) {
          // 网络恢复后，如果有草稿且内容不同于服务器，自动同步
          const draftNormalized = draft.content.trim();
          const notesNormalized = (notes || "").trim();

          if (draftNormalized !== notesNormalized && draftNormalized.length > 0) {
            console.log("网络恢复，自动同步草稿到服务器");
            // 临时创建一个 DOM 元素来提取纯文本
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = draft.content;
            const plainContent = tempDiv.textContent || tempDiv.innerText || "";

            await updateNote({
              noteId: fileId,
              content: draft.content,
              plainContent: plainContent,
            });
            await offlineStorage.deleteDraft(fileId);
            toast.success("离线内容已自动同步到云端");
          }
        }
      } catch (error) {
        console.error("自动同步草稿失败:", error);
      }
    };

    syncDraftOnReconnect();
  }, [isOnline, fileId, editor, workspaceNote, notes, updateNote, user]);

  // 自动丢弃过期草稿（超过24小时）
  useEffect(() => {
    const cleanOldDrafts = async () => {
      if (!fileId) return;

      try {
        const draft = await offlineStorage.getDraft(fileId);
        if (draft && draft.savedAt) {
          const ageInHours = (Date.now() - draft.savedAt) / (1000 * 60 * 60);
          // 如果草稿超过24小时且内容与服务器一致，自动删除
          if (ageInHours > 24 && draft.content === notes) {
            await offlineStorage.deleteDraft(fileId);
            console.log("自动清理过期草稿");
          }
        }
      } catch (error) {
        console.error("清理草稿失败:", error);
      }
    };

    cleanOldDrafts();
  }, [fileId, notes]);

  return (
    <div>
      {hasDraft && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 mb-4 mx-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                发现未保存的草稿
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                检测到您之前有未保存的编辑内容，是否恢复？
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleRestoreDraft}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  恢复草稿
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDiscardDraft}
                  className="border-yellow-600 text-yellow-700 dark:text-yellow-300"
                >
                  放弃
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {editor && <EditorExtension editor={editor} />}
      <div className="overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

export default TextEditior;
