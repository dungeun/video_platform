import { useCallback, useEffect, useRef, useState } from 'react';
import { UseTouchReturn } from '../types';

interface TouchState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  startTime: number;
}

export function useTouch(
  containerRef: React.RefObject<HTMLElement>,
  options: {
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    threshold?: number;
    velocity?: number;
  } = {}
): UseTouchReturn {
  const {
    onSwipeLeft,
    onSwipeRight,
    threshold = 50,
    velocity = 0.5
  } = options;

  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const touchState = useRef<TouchState | null>(null);

  const handleStart = useCallback((clientX: number, clientY: number) => {
    touchState.current = {
      startX: clientX,
      startY: clientY,
      currentX: clientX,
      currentY: clientY,
      startTime: Date.now()
    };
    setIsDragging(true);
  }, []);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!touchState.current || !containerRef.current) return;

    const deltaX = clientX - touchState.current.startX;
    const deltaY = clientY - touchState.current.startY;

    // Prevent vertical scrolling if horizontal swipe is detected
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      touchState.current.currentX = clientX;
      touchState.current.currentY = clientY;

      const containerWidth = containerRef.current.offsetWidth;
      const progress = (deltaX / containerWidth) * 100;
      
      setDragProgress(progress);
      setDragOffset(deltaX);
    }
  }, [containerRef]);

  const handleEnd = useCallback(() => {
    if (!touchState.current) return;

    const deltaX = touchState.current.currentX - touchState.current.startX;
    const deltaTime = Date.now() - touchState.current.startTime;
    const velocityX = Math.abs(deltaX) / deltaTime;

    // Determine if swipe occurred based on threshold and velocity
    if (Math.abs(deltaX) > threshold || velocityX > velocity) {
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }

    // Reset state
    touchState.current = null;
    setIsDragging(false);
    setDragProgress(0);
    setDragOffset(0);
  }, [threshold, velocity, onSwipeLeft, onSwipeRight]);

  // Touch event handlers
  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  }, [handleStart]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  }, [handleMove]);

  const handleTouchEnd = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  // Mouse event handlers (for desktop)
  const handleMouseDown = useCallback((e: MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
  }, [handleStart]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX, e.clientY);
  }, [isDragging, handleMove]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    handleEnd();
  }, [isDragging, handleEnd]);

  const handleMouseLeave = useCallback(() => {
    if (!isDragging) return;
    handleEnd();
  }, [isDragging, handleEnd]);

  // Attach event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Touch events
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('touchcancel', handleTouchEnd);

    // Mouse events
    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [
    containerRef,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave
  ]);

  return {
    isDragging,
    dragProgress,
    dragOffset
  };
}