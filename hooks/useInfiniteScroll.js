import { useEffect, useRef, useCallback } from "react";

export function useInfiniteScroll(callback, hasMore) {
  const observer = useRef();
  const loadMoreRef = useRef(null);

  const lastElementRef = useCallback(
    (node) => {
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore) {
            callback();
          }
        },
        {
          threshold: 0.1,
          rootMargin: "100px",
        }
      );

      if (node) observer.current.observe(node);
    },
    [callback, hasMore]
  );

  return lastElementRef;
}
