"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import { HocuspocusProvider } from "@hocuspocus/provider";
import * as Y from "yjs";
import EditorExtension from "./EditorExtension";
import { Users, Wifi, WifiOff } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export function CollaborativeEditor({ fileId, user, permission = "edit", initialContent = "" }) {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [status, setStatus] = useState("connecting"); // connecting | connected | disconnected
  const [contentInitialized, setContentInitialized] = useState(false);
  const saveTimeoutRef = useRef(null);

  // 创建 Y.js 文档
  const [ydoc] = useState(() => new Y.Doc());

  // Convex mutation
  const updateNote = useMutation(api.workspaceNotes.updateNote);

  const editor = useEditor({
    immediatelyRender: false, // 避免 SSR 水合不匹配
    editable: permission === "edit" || permission === "owner",
    extensions: [
      StarterKit.configure({
        // 禁用 history，因为 Y.js 有自己的 undo/redo
        history: false,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Highlight,
      Underline,
      Placeholder.configure({
        placeholder: permission === "view" ? "只读模式..." : "开始输入... 支持 Markdown 语法",
      }),
      // Y.js 协作扩展
      Collaboration.configure({
        document: ydoc,
      }),
    ],
  });

  // 初始化 WebSocket 连接
  useEffect(() => {
    if (!fileId || !user || !editor) return;

    // 创建 Hocuspocus Provider
    // 使用环境变量配置 WebSocket 地址，本地开发使用 localhost
    const websocketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://localhost:1234";

    const hocuspocusProvider = new HocuspocusProvider({
      url: websocketUrl,
      name: fileId,
      document: ydoc,
      token: user.email, // 用于认证

      onStatus: ({ status }) => {
        setStatus(status);
      },

      onSynced: () => {
        // 如果编辑器为空且有初始内容，则初始化
        if (!contentInitialized && editor && initialContent) {
          const currentContent = editor.getText();

          // 如果编辑器为空但有初始内容，则从 content 字段加载
          if (currentContent.length === 0 && initialContent.length > 0) {
            editor.commands.setContent(initialContent);
            setContentInitialized(true);
          }
        }
      },

      onAwarenessUpdate: ({ states }) => {
        // 获取当前客户端 ID
        const myClientId = hocuspocusProvider.awareness.clientID;

        // 更新在线用户列表（排除当前用户）
        const users = Array.from(states.entries())
          .filter(([clientId]) => clientId !== myClientId)
          .map(([, state]) => state.user)
          .filter(Boolean);

        setOnlineUsers(users);
      },
    });

    // 设置当前用户信息
    const userInfo = {
      name: user.userName || user.email,
      color: getUserColor(user.email),
      email: user.email,
    };

    hocuspocusProvider.setAwarenessField("user", userInfo);

    return () => {
      hocuspocusProvider.destroy();
    };
  }, [fileId, user, editor, ydoc, contentInitialized, initialContent]);

  // 自动保存函数（带防抖）
  const saveContent = useCallback(() => {
    if (!editor || !fileId) return;

    // 清除之前的定时器
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // 设置新的定时器（2秒防抖）
    saveTimeoutRef.current = setTimeout(async () => {
      const content = editor.getHTML();
      const plainContent = editor.getText();

      try {
        await updateNote({
          noteId: fileId,
          content: content,
          plainContent: plainContent,
        });
      } catch (error) {
        console.error("❌ 自动保存失败:", error);
      }
    }, 2000); // 2秒防抖
  }, [editor, fileId, updateNote]);

  // 监听编辑器更新
  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      saveContent();
    };

    editor.on("update", handleUpdate);

    return () => {
      editor.off("update", handleUpdate);
      // 清理定时器
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [editor, saveContent]);

  // 根据用户邮箱生成颜色
  function getUserColor(email) {
    if (!email) return "#999999";
    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#FFA07A",
      "#98D8C8",
      "#F7DC6F",
      "#BB8FCE",
      "#85C1E2",
    ];
    const hash = email.split("").reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  }

  // 如果没有用户信息，显示加载状态
  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">正在加载用户信息...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      {/* 连接状态 */}
      <div className="absolute top-4 left-4 z-10">
        {status === "connected" && (
          <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm">
            <Wifi className="w-4 h-4" />
            <span>已连接</span>
          </div>
        )}
        {status === "connecting" && (
          <div className="flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-3 py-1 rounded-full text-sm">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-800 dark:border-yellow-200"></div>
            <span>连接中...</span>
          </div>
        )}
        {status === "disconnected" && (
          <div className="flex items-center gap-2 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-3 py-1 rounded-full text-sm">
            <WifiOff className="w-4 h-4" />
            <span>已断开</span>
          </div>
        )}
      </div>

      {/* 在线用户列表 */}
      <div className="absolute top-4 right-4 z-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 border">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-medium">{onlineUsers.length + 1} 人在线</span>
        </div>
        <div className="space-y-1">
          {/* 当前用户 */}
          <div className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: getUserColor(user.email) }}
            />
            <span className="text-gray-700 dark:text-gray-300 font-medium">
              {user.userName || user.email} (你)
            </span>
          </div>
          {/* 其他用户 */}
          {onlineUsers.map((u, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: u.color }} />
              <span className="text-gray-700 dark:text-gray-300">{u.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 编辑器工具栏 */}
      {editor && permission !== "view" && <EditorExtension editor={editor} />}

      {/* 编辑器内容 */}
      <EditorContent
        editor={editor}
        className="prose prose-lg dark:prose-invert max-w-none p-6 focus:outline-none min-h-[500px]"
      />

      {/* 只读提示 */}
      {permission === "view" && (
        <div className="absolute bottom-4 left-4 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm">
          只读模式
        </div>
      )}
    </div>
  );
}
