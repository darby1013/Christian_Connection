import React, { useEffect, useRef, useCallback } from 'react';

export function InfiniteScroll({ 
  children, 
  loadMore, 
  hasMore, 
  loading,
  threshold = 100,
  loader = <div className="text-center py-4"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500 mx-auto"></div></div>,
  endMessage = <div className="text-center py-4 text-slate-400">No more items to load</div>
}) {
  const observerTarget = useRef(null);

  const handleObserver = useCallback((entries) => {
    const [target] = entries;
    if (target.isIntersecting && hasMore && !loading) {
      loadMore();
    }
  }, [hasMore, loading, loadMore]);

  useEffect(() => {
    const element = observerTarget.current;
    const option = { threshold };

    const observer = new IntersectionObserver(handleObserver, option);
    if (element) observer.observe(element);

    return () => {
      if (element) observer.unobserve(element);
    };
  }, [handleObserver, threshold]);

  return (
    <div>
      {children}
      <div ref={observerTarget}>
        {loading && loader}
        {!hasMore && !loading && endMessage}
      </div>
    </div>
  );
}

export default InfiniteScroll;