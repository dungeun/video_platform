import { useCallback, useEffect, useRef, useState } from 'react';
import { AutoPlayOptions, UseAutoPlayReturn } from '../types';

export function useAutoPlay(
  enabled: boolean = false,
  options: AutoPlayOptions = {},
  onNext: () => void
): UseAutoPlayReturn {
  const {
    delay = 4000,
    stopOnInteraction = true,
    stopOnMouseEnter = true,
    stopOnFocusIn = true
  } = options;

  const [isPlaying, setIsPlaying] = useState(enabled);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const rootNodeRef = useRef<HTMLElement | null>(null);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const play = useCallback(() => {
    stop();
    
    if (delay <= 0) return;

    intervalRef.current = setInterval(() => {
      onNext();
    }, delay);
    
    setIsPlaying(true);
  }, [delay, onNext, stop]);

  const reset = useCallback(() => {
    if (isPlaying) {
      stop();
      play();
    }
  }, [isPlaying, play, stop]);

  const toggle = useCallback(() => {
    if (isPlaying) {
      stop();
    } else {
      play();
    }
  }, [isPlaying, play, stop]);

  // Handle mouse enter/leave
  useEffect(() => {
    if (!stopOnMouseEnter || !rootNodeRef.current) return;

    const handleMouseEnter = () => {
      if (isPlaying) stop();
    };

    const handleMouseLeave = () => {
      if (enabled) play();
    };

    const node = rootNodeRef.current;
    node.addEventListener('mouseenter', handleMouseEnter);
    node.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      node.removeEventListener('mouseenter', handleMouseEnter);
      node.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [enabled, isPlaying, play, stop, stopOnMouseEnter]);

  // Handle focus in/out
  useEffect(() => {
    if (!stopOnFocusIn || !rootNodeRef.current) return;

    const handleFocusIn = () => {
      if (isPlaying) stop();
    };

    const handleFocusOut = () => {
      if (enabled) play();
    };

    const node = rootNodeRef.current;
    node.addEventListener('focusin', handleFocusIn);
    node.addEventListener('focusout', handleFocusOut);

    return () => {
      node.removeEventListener('focusin', handleFocusIn);
      node.removeEventListener('focusout', handleFocusOut);
    };
  }, [enabled, isPlaying, play, stop, stopOnFocusIn]);

  // Handle interaction
  useEffect(() => {
    if (!stopOnInteraction || !rootNodeRef.current) return;

    const handleInteraction = () => {
      if (isPlaying) reset();
    };

    const node = rootNodeRef.current;
    node.addEventListener('click', handleInteraction);
    node.addEventListener('touchstart', handleInteraction);

    return () => {
      node.removeEventListener('click', handleInteraction);
      node.removeEventListener('touchstart', handleInteraction);
    };
  }, [isPlaying, reset, stopOnInteraction]);

  // Initialize auto play
  useEffect(() => {
    if (enabled) {
      play();
    } else {
      stop();
    }

    return () => {
      stop();
    };
  }, [enabled, play, stop]);

  // Set root node
  useEffect(() => {
    if (options.rootNode) {
      const emblaRoot = document.querySelector('[data-embla-root]') as HTMLElement;
      if (emblaRoot) {
        rootNodeRef.current = options.rootNode(emblaRoot);
      }
    }
  }, [options.rootNode]);

  return {
    isPlaying,
    play,
    stop,
    reset,
    toggle
  };
}