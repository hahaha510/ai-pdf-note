export function NoteCardSkeleton() {
  return (
    <div className="flex p-5 shadow-md rounded-md flex-col border bg-white dark:bg-gray-800 h-[260px] animate-pulse">
      {/* 头部：图标 + 标题 + 时间 */}
      <div className="flex items-start gap-3 mb-3">
        {/* 图标骨架 */}
        <div className="w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded flex-shrink-0"></div>

        <div className="flex-1 min-w-0">
          {/* 标题骨架 */}
          <div className="space-y-2 mb-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
          {/* 时间骨架 */}
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        </div>
      </div>

      {/* 摘要骨架 */}
      <div className="flex-1 overflow-hidden mb-3 min-h-[60px] space-y-2">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
      </div>

      {/* 底部标签骨架 */}
      <div className="flex gap-1.5 min-h-[28px]">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16"></div>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20"></div>
      </div>
    </div>
  );
}
