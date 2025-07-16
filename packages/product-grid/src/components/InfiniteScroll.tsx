import React, { useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import type { InfiniteScrollProps } from '../types';

export const InfiniteScroll: React.FC<InfiniteScrollProps> = ({
  hasMore,
  loading,
  onLoadMore,
  threshold = 0.8,
  loader = <div className="text-center py-4">로딩 중...</div>,
  endMessage = <div className="text-center py-4 text-gray-500">모든 상품을 불러왔습니다.</div>,
  children
}) => {
  const { ref, inView } = useInView({
    threshold,
    triggerOnce: false
  });

  useEffect(() => {
    if (inView && hasMore && !loading) {
      onLoadMore();
    }
  }, [inView, hasMore, loading, onLoadMore]);

  return (
    <>
      {children}
      
      {hasMore && (
        <div ref={ref}>
          {loading && loader}
        </div>
      )}
      
      {!hasMore && !loading && endMessage}
    </>
  );
};