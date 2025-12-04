"use client";
//编辑器上方的工具
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
} from "lucide-react";
import { useAction, useMutation } from "convex/react";
import { useParams } from "next/navigation";
import { api } from "../../../convex/_generated/api";
import { chatSession } from "../../configs/AIModel";
import { toast } from "sonner";
function EditorExtension({ editor }) {
  const [user, setUser] = useState(null);
  const { fileId } = useParams();
  const SearchAI = useAction(api.myAction.search);
  const saveNotes = useMutation(api.notes.AddNotes);

  // 安全访问 localStorage
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
    // console.log(selectedText)
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
    saveNotes({ fileId: fileId, notes: editor.getHTML(), createdBy: user?.userName || "" });
  };
  return (
    <div className="p-5 ">
      <div className="control-group">
        <div className="button-group flex gap-3">
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={editor.isActive("heading", { level: 1 }) ? "is-active" : ""}
          >
            H1
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={editor.isActive("heading", { level: 2 }) ? "is-active" : ""}
          >
            H2
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={editor.isActive("heading", { level: 3 }) ? "is-active" : ""}
          >
            H3
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive("bold") ? "is-active" : ""}
          >
            <Bold />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive("italic") ? "is-active" : ""}
          >
            <Italic />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={editor.isActive("underline") ? "is-active" : ""}
          >
            <Underline />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={editor.isActive("strike") ? "is-active" : ""}
          >
            <Strikethrough />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={editor.isActive("highlight") ? "is-active" : ""}
          >
            <Highlighter />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={editor.isActive("codeBlock") ? "is-active" : ""}
          >
            <Code />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={editor.isActive("blockquote") ? "is-active" : ""}
          >
            <TextQuote />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            className={editor.isActive({ textAlign: "left" }) ? "is-active" : ""}
          >
            <AlignLeft />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            className={editor.isActive({ textAlign: "center" }) ? "is-active" : ""}
          >
            <AlignCenter />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            className={editor.isActive({ textAlign: "right" }) ? "is-active" : ""}
          >
            <AlignRight />
          </button>
          <button onClick={() => onAiClick()} className={"hover:text-blue-500"}>
            <Sparkles />
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditorExtension;
