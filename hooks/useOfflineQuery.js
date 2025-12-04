/**
 * 支持离线的查询 Hook
 * 优先从服务器获取，失败时降级到缓存
 */
import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { useNetworkStatus } from "./useNetworkStatus";
import {
  getCachedNotesList,
  cacheNotesList,
  getCachedNote,
  cacheNote,
  getCachedTags,
  cacheTags,
  getCachedCategories,
  cacheCategories,
} from "@/lib/offlineCache";

/**
 * 离线查询笔记列表
 */
export function useOfflineNotesList(convexQuery, queryArgs) {
  const [data, setData] = useState(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { isOnline } = useNetworkStatus();

  // 提取 userId 避免对象引用变化
  const userId = queryArgs !== "skip" && queryArgs ? queryArgs.userName : null;

  // Convex 在线查询
  const onlineData = useQuery(convexQuery, queryArgs);

  useEffect(() => {
    const loadData = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      // 在线且有数据：缓存并使用
      if (onlineData !== undefined) {
        if (onlineData) {
          await cacheNotesList(userId, onlineData);
          setData(onlineData);
          setIsFromCache(false);
        }
        setIsLoading(false);
      }
      // 仅在真正离线时使用缓存
      else if (!isOnline) {
        const cached = await getCachedNotesList(userId);
        if (cached) {
          setData(cached);
          setIsFromCache(true);
          setIsLoading(false);
        }
      }
    };

    loadData();
  }, [isOnline, onlineData, userId]);

  return { data, isFromCache, isLoading };
}

/**
 * 离线查询单个笔记
 */
export function useOfflineNote(convexQuery, queryArgs) {
  const [data, setData] = useState(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { isOnline } = useNetworkStatus();

  // 提取 noteId 避免对象引用变化
  const noteId = queryArgs !== "skip" && queryArgs ? queryArgs.noteId : null;

  const onlineData = useQuery(convexQuery, queryArgs);

  useEffect(() => {
    const loadData = async () => {
      if (!noteId) {
        setIsLoading(false);
        return;
      }

      if (onlineData !== undefined) {
        if (onlineData) {
          await cacheNote(noteId, onlineData);
          setData(onlineData);
          setIsFromCache(false);
        }
        setIsLoading(false);
      } else if (!isOnline) {
        const cached = await getCachedNote(noteId);
        if (cached) {
          setData(cached);
          setIsFromCache(true);
          setIsLoading(false);
        }
      }
    };

    loadData();
  }, [isOnline, onlineData, noteId]);

  return { data, isFromCache, isLoading };
}

/**
 * 离线查询标签列表
 */
export function useOfflineTags(convexQuery, queryArgs) {
  const [data, setData] = useState(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const { isOnline } = useNetworkStatus();

  // 提取 userId 避免对象引用变化
  const userId = queryArgs !== "skip" && queryArgs ? queryArgs.userName : null;

  const onlineData = useQuery(convexQuery, queryArgs);

  useEffect(() => {
    const loadData = async () => {
      if (!userId) return;

      if (onlineData !== undefined) {
        if (onlineData) {
          await cacheTags(userId, onlineData);
          setData(onlineData);
          setIsFromCache(false);
        }
      } else if (!isOnline) {
        const cached = await getCachedTags(userId);
        if (cached) {
          setData(cached);
          setIsFromCache(true);
        }
      }
    };

    loadData();
  }, [isOnline, onlineData, userId]);

  return { data, isFromCache };
}

/**
 * 离线查询分类列表
 */
export function useOfflineCategories(convexQuery, queryArgs) {
  const [data, setData] = useState(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const { isOnline } = useNetworkStatus();

  // 提取 userId 避免对象引用变化
  const userId = queryArgs !== "skip" && queryArgs ? queryArgs.userName : null;

  const onlineData = useQuery(convexQuery, queryArgs);

  useEffect(() => {
    const loadData = async () => {
      if (!userId) return;

      if (onlineData !== undefined) {
        if (onlineData) {
          await cacheCategories(userId, onlineData);
          setData(onlineData);
          setIsFromCache(false);
        }
      } else if (!isOnline) {
        const cached = await getCachedCategories(userId);
        if (cached) {
          setData(cached);
          setIsFromCache(true);
        }
      }
    };

    loadData();
  }, [isOnline, onlineData, userId]);

  return { data, isFromCache };
}
