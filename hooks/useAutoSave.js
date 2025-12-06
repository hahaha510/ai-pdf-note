import { useEffect, useRef } from "react";

/**
 * 自动保存 Hook
 * @param {Function} callback - 保存函数
 * @param {any} content - 要保存的内容
 * @param {number} delay - 延迟时间（毫秒）
 */
export function useAutoSave(callback, content, delay = 2000) {
  const timeoutRef = useRef(null);
  const isFirstRun = useRef(true);
  const previousContent = useRef(content);

  useEffect(() => {
    // 跳过第一次运行（初始加载时）
    if (isFirstRun.current) {
      isFirstRun.current = false;
      previousContent.current = content;
      return;
    }

    // 如果内容没有变化，不触发保存
    if (content === previousContent.current) {
      return;
    }

    // 清除之前的定时器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // 设置新的定时器
    timeoutRef.current = setTimeout(() => {
      if (content && content !== previousContent.current) {
        previousContent.current = content;
        callback();
      }
    }, delay);

    // 清理函数
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [content, callback, delay]);
}
