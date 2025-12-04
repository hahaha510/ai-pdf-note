"use client";
import React, { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Blockquote from "@tiptap/extension-blockquote";
import CodeBlock from "@tiptap/extension-code-block";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import Strike from "@tiptap/extension-strike";
import Heading from "@tiptap/extension-heading";
import Typography from "@tiptap/extension-typography";
import {
  Bold,
  Italic,
  AlignRight,
  AlignLeft,
  AlignCenter,
  TextQuote,
  Code,
  Highlighter,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
} from "lucide-react";

/**
 * 支持 Markdown 语法的富文本编辑器
 * - 可以使用工具栏格式化
 * - 可以输入 Markdown 语法（实时转换）
 * - 所见即所得
 */
export function MarkdownRichEditor({
  initialContent = "",
  onUpdate,
  placeholder = "开始写作... 支持 Markdown 语法",
  editable = true,
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Blockquote.configure({
        HTMLAttributes: {
          class: "border-l-4 border-blue-500 pl-4 italic text-gray-700 dark:text-gray-300",
        },
      }),
      CodeBlock.configure({
        HTMLAttributes: {
          class: "bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm my-4",
        },
      }),
      Highlight.configure({
        multicolor: true,
        HTMLAttributes: {
          class: "bg-yellow-200 dark:bg-yellow-600",
        },
      }),
      Underline,
      Strike,
      Heading.configure({
        levels: [1, 2, 3],
      }),
      Typography, // 支持 Markdown 语法自动转换
    ],
    content: initialContent,
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "focus:outline-none min-h-[500px] p-5 prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none",
      },
    },
    onUpdate: ({ editor }) => {
      if (onUpdate) {
        const html = editor.getHTML();
        onUpdate(html);
      }
    },
  });

  // 当 initialContent 变化时更新编辑器内容
  useEffect(() => {
    if (editor && initialContent && initialContent !== editor.getHTML()) {
      editor.commands.setContent(initialContent);
    }
  }, [initialContent, editor]);

  // 当 editable 变化时更新编辑器状态
  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editable, editor]);

  if (!editor) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="animate-pulse text-gray-500">加载编辑器...</div>
      </div>
    );
  }

  const ToolbarButton = ({ onClick, isActive, children, title }) => (
    <button
      onClick={onClick}
      className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
        isActive ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400" : ""
      }`}
      title={title}
    >
      {children}
    </button>
  );

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
      {/* 工具栏 */}
      {editable && (
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2">
          <div className="flex flex-wrap items-center gap-1">
            {/* 标题 */}
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              isActive={editor.isActive("heading", { level: 1 })}
              title="一级标题 (Markdown: # 标题)"
            >
              <span className="text-sm font-bold">H1</span>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              isActive={editor.isActive("heading", { level: 2 })}
              title="二级标题 (Markdown: ## 标题)"
            >
              <span className="text-sm font-bold">H2</span>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              isActive={editor.isActive("heading", { level: 3 })}
              title="三级标题 (Markdown: ### 标题)"
            >
              <span className="text-sm font-bold">H3</span>
            </ToolbarButton>

            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

            {/* 文本格式 */}
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive("bold")}
              title="粗体 (Markdown: **文本** 或 Ctrl+B)"
            >
              <Bold className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive("italic")}
              title="斜体 (Markdown: *文本* 或 Ctrl+I)"
            >
              <Italic className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              isActive={editor.isActive("underline")}
              title="下划线 (Ctrl+U)"
            >
              <UnderlineIcon className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              isActive={editor.isActive("strike")}
              title="删除线 (Markdown: ~~文本~~)"
            >
              <Strikethrough className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              isActive={editor.isActive("highlight")}
              title="高亮 (Markdown: ==文本==)"
            >
              <Highlighter className="w-4 h-4" />
            </ToolbarButton>

            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

            {/* 列表 */}
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive("bulletList")}
              title="无序列表 (Markdown: - 项目)"
            >
              <List className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive("orderedList")}
              title="有序列表 (Markdown: 1. 项目)"
            >
              <ListOrdered className="w-4 h-4" />
            </ToolbarButton>

            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

            {/* 特殊格式 */}
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              isActive={editor.isActive("codeBlock")}
              title="代码块 (Markdown: ```代码```)"
            >
              <Code className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              isActive={editor.isActive("blockquote")}
              title="引用 (Markdown: > 引用)"
            >
              <TextQuote className="w-4 h-4" />
            </ToolbarButton>

            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

            {/* 对齐 */}
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              isActive={editor.isActive({ textAlign: "left" })}
              title="左对齐"
            >
              <AlignLeft className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign("center").run()}
              isActive={editor.isActive({ textAlign: "center" })}
              title="居中"
            >
              <AlignCenter className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
              isActive={editor.isActive({ textAlign: "right" })}
              title="右对齐"
            >
              <AlignRight className="w-4 h-4" />
            </ToolbarButton>
          </div>
        </div>
      )}

      {/* 编辑器内容 */}
      <div className="overflow-auto max-h-[70vh]">
        <EditorContent editor={editor} />
      </div>

      {/* Markdown 提示 */}
      {editable && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            💡 提示：支持 Markdown 语法 - 试试输入{" "}
            <code className="px-1 bg-gray-200 dark:bg-gray-700 rounded">**粗体**</code>、
            <code className="px-1 bg-gray-200 dark:bg-gray-700 rounded">*斜体*</code>、
            <code className="px-1 bg-gray-200 dark:bg-gray-700 rounded"># 标题</code> 等
          </p>
        </div>
      )}
    </div>
  );
}

export default MarkdownRichEditor;
