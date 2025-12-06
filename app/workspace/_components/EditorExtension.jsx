"use client";
import React, { useState, useEffect } from "react";
import {
  Bold,
  Italic,
  AlignRight,
  AlignLeft,
  AlignCenter,
  TextQuote,
  Code,
  Highlighter,
  Underline,
  Strikethrough,
  Sparkles,
  List,
  ListOrdered,
  Minus,
} from "lucide-react";
import { useAction, useMutation, useQuery } from "convex/react";
import { useParams } from "next/navigation";
import { api } from "../../../convex/_generated/api";
import { chatSession } from "../../configs/AIModel";
import { toast } from "sonner";

function EditorExtension({ editor }) {
  const [user, setUser] = useState(null);
  const { fileId } = useParams();
  const SearchAI = useAction(api.myAction.search);
  const saveNotes = useMutation(api.notes.AddNotes);
  const updateWorkspaceNote = useMutation(api.workspaceNotes.updateNote);
  const workspaceNote = useQuery(api.workspaceNotes.getNote, fileId ? { noteId: fileId } : "skip");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const onAiClick = async () => {
    toast("AI is getting your answer...");
    const selectedText = editor.state.doc.textBetween(
      editor.state.selection.from,
      editor.state.selection.to,
      " "
    );
    const result = await SearchAI({ query: selectedText, fileId: fileId });
    const UnformattedAns = JSON.parse(result);
    let AllUnformattedAns = "";
    UnformattedAns &&
      UnformattedAns.forEach((item) => {
        AllUnformattedAns += item.pageContent;
      });
    const PROMPT =
      "For question :" +
      selectedText +
      " and with the given content as answer:" +
      "please give appropriate answer in HTML format. The answer content is:" +
      AllUnformattedAns;
    const AiModelResult = await chatSession.sendMessage(PROMPT);
    const FinalAns = AiModelResult.response
      .text()
      .replace("```", "")
      .replace("html", "")
      .replace("```", "");
    const AllText = editor.getHTML();
    editor.commands.setContent(AllText + "<p> <strong>AI Answer:</strong> " + FinalAns + "</p>");

    if (workspaceNote) {
      await updateWorkspaceNote({
        noteId: fileId,
        content: editor.getHTML(),
        plainContent: editor.getText(),
      });
    } else {
      saveNotes({ fileId: fileId, notes: editor.getHTML(), createdBy: user?.userName || "" });
    }
  };

  return (
    <div className="p-5">
      <div className="control-group">
        <div className="button-group flex gap-3 flex-wrap">
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={editor.isActive("heading", { level: 1 }) ? "is-active" : ""}
            title="标题1 (# )"
          >
            H1
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={editor.isActive("heading", { level: 2 }) ? "is-active" : ""}
            title="标题2 (## )"
          >
            H2
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={editor.isActive("heading", { level: 3 }) ? "is-active" : ""}
            title="标题3 (### )"
          >
            H3
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive("bold") ? "is-active" : ""}
            title="粗体 (**text**)"
          >
            <Bold />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive("italic") ? "is-active" : ""}
            title="斜体 (*text*)"
          >
            <Italic />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={editor.isActive("underline") ? "is-active" : ""}
            title="下划线"
          >
            <Underline />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={editor.isActive("strike") ? "is-active" : ""}
            title="删除线 (~~text~~)"
          >
            <Strikethrough />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={editor.isActive("highlight") ? "is-active" : ""}
            title="高亮"
          >
            <Highlighter />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive("bulletList") ? "is-active" : ""}
            title="无序列表 (- item)"
          >
            <List />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive("orderedList") ? "is-active" : ""}
            title="有序列表 (1. item)"
          >
            <ListOrdered />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={editor.isActive("codeBlock") ? "is-active" : ""}
            title="代码块 (``` code)"
          >
            <Code />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={editor.isActive("blockquote") ? "is-active" : ""}
            title="引用 (> quote)"
          >
            <TextQuote />
          </button>
          <button
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="水平线 (---)"
          >
            <Minus />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            className={editor.isActive({ textAlign: "left" }) ? "is-active" : ""}
            title="左对齐"
          >
            <AlignLeft />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            className={editor.isActive({ textAlign: "center" }) ? "is-active" : ""}
            title="居中"
          >
            <AlignCenter />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            className={editor.isActive({ textAlign: "right" }) ? "is-active" : ""}
            title="右对齐"
          >
            <AlignRight />
          </button>
          <button onClick={() => onAiClick()} className={"hover:text-blue-500"} title="AI 助手">
            <Sparkles />
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditorExtension;
