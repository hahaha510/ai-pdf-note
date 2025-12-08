"use client";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function FilterDialog({
  open,
  onOpenChange,
  allTags,
  allCategories,
  selectedTag,
  selectedCategory,
  onTagSelect,
  onCategorySelect,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Filter Notes</DialogTitle>
          <DialogDescription>Filter notes by tags or categories</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* 标签筛选 */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {allTags && allTags.length > 0 ? (
                allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      onTagSelect(tag === selectedTag ? null : tag);
                      onOpenChange(false);
                    }}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      selectedTag === tag
                        ? "bg-green-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    }`}
                  >
                    {tag}
                  </button>
                ))
              ) : (
                <p className="text-sm text-gray-500">No tags available</p>
              )}
            </div>
          </div>

          {/* 分类筛选 */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              Categories
            </h3>
            <div className="flex flex-wrap gap-2">
              {allCategories && allCategories.length > 0 ? (
                allCategories.map((category) => (
                  <button
                    key={category}
                    onClick={() => {
                      onCategorySelect(category === selectedCategory ? null : category);
                      onOpenChange(false);
                    }}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      selectedCategory === category
                        ? "bg-purple-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    }`}
                  >
                    {category}
                  </button>
                ))
              ) : (
                <p className="text-sm text-gray-500">No categories available</p>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              onTagSelect(null);
              onCategorySelect(null);
            }}
          >
            Clear All Filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
