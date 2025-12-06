"use client";
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";

export function KeyboardShortcutsHelp() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + / 打开快捷键帮助
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        setOpen(true);
      }
      // Esc 关闭
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const shortcuts = [
    {
      category: "基本操作",
      items: [
        { key: "Ctrl/Cmd + S", desc: "保存笔记" },
        { key: "Ctrl/Cmd + Z", desc: "撤销" },
        { key: "Ctrl/Cmd + Shift + Z", desc: "重做" },
        { key: "Ctrl/Cmd + Y", desc: "重做（备选）" },
        { key: "Ctrl/Cmd + /", desc: "显示快捷键帮助" },
      ],
    },
    {
      category: "文本格式",
      items: [
        { key: "Ctrl/Cmd + B", desc: "粗体" },
        { key: "Ctrl/Cmd + I", desc: "斜体" },
        { key: "Ctrl/Cmd + U", desc: "下划线" },
        { key: "Ctrl/Cmd + Shift + X", desc: "删除线" },
      ],
    },
    {
      category: "Markdown 快捷输入",
      items: [
        { key: "# + 空格", desc: "一级标题" },
        { key: "## + 空格", desc: "二级标题" },
        { key: "### + 空格", desc: "三级标题" },
        { key: "**text**", desc: "粗体" },
        { key: "*text*", desc: "斜体" },
        { key: "~~text~~", desc: "删除线" },
        { key: "- + 空格", desc: "无序列表" },
        { key: "1. + 空格", desc: "有序列表" },
        { key: "> + 空格", desc: "引用" },
        { key: "``` + 空格", desc: "代码块" },
        { key: "---", desc: "水平线" },
        { key: "`code`", desc: "行内代码" },
      ],
    },
  ];

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2"
        title="快捷键帮助 (Ctrl/Cmd + /)"
      >
        <Keyboard className="w-4 h-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="w-5 h-5" />
              键盘快捷键
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {shortcuts.map((section, idx) => (
              <div key={idx}>
                <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-gray-100">
                  {section.category}
                </h3>
                <div className="space-y-2">
                  {section.items.map((item, itemIdx) => (
                    <div
                      key={itemIdx}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <span className="text-gray-700 dark:text-gray-300">{item.desc}</span>
                      <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
                        {item.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-200">
              💡 提示：按{" "}
              <kbd className="px-1.5 py-0.5 text-xs bg-white dark:bg-gray-700 border rounded">
                Ctrl/Cmd + /
              </kbd>{" "}
              随时查看此帮助
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
