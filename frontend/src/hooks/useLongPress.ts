import { useCallback, useRef, useState, useEffect } from "react";

export interface UseLongPressOptions {
  threshold?: number; // Default: 1500ms
  onStart?: () => void;
  onFinish?: () => void;
  onCancel?: () => void;
  disabled?: boolean;
}

export interface LongPressHandlers {
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onMouseLeave: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
}

export interface UseLongPressReturn {
  handlers: LongPressHandlers;
  isPressed: boolean;
  progress: number; // 0-100
}

export function useLongPress(options: UseLongPressOptions = {}): UseLongPressReturn {
  const {
    threshold = 1500,
    onStart,
    onFinish,
    onCancel,
    disabled = false,
  } = options;

  const [isPressed, setIsPressed] = useState(false);
  const [progress, setProgress] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const isActiveRef = useRef(false);
  const hasTriggeredRef = useRef(false);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setProgress(0);
    setIsPressed(false);
    isActiveRef.current = false;
  }, []);

  const start = useCallback(() => {
    if (disabled || isActiveRef.current) return;

    isActiveRef.current = true;
    hasTriggeredRef.current = false;
    setIsPressed(true);
    startTimeRef.current = Date.now();

    // Progress update every 16ms (~60fps)
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = Math.min((elapsed / threshold) * 100, 100);
      setProgress(newProgress);
    }, 16);

    // Long press trigger
    timerRef.current = setTimeout(() => {
      hasTriggeredRef.current = true;
      cleanup();
      onStart?.();
    }, threshold);
  }, [disabled, threshold, onStart, cleanup]);

  const cancel = useCallback(() => {
    if (!isActiveRef.current) return;

    const wasActive = isActiveRef.current;
    cleanup();

    if (wasActive && !hasTriggeredRef.current) {
      onCancel?.();
    }
  }, [cleanup, onCancel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Mouse handlers
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only left click
      if (e.button !== 0) return;
      e.preventDefault();
      start();
    },
    [start]
  );

  const onMouseUp = useCallback(
    (e: React.MouseEvent) => {
      cancel();
    },
    [cancel]
  );

  const onMouseLeave = useCallback(
    (e: React.MouseEvent) => {
      cancel();
    },
    [cancel]
  );

  // Touch handlers
  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      // Prevent context menu on long press
      e.preventDefault();
      start();
    },
    [start]
  );

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      cancel();
    },
    [cancel]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      // Cancel if finger moves too far
      cancel();
    },
    [cancel]
  );

  return {
    handlers: {
      onMouseDown,
      onMouseUp,
      onMouseLeave,
      onTouchStart,
      onTouchEnd,
      onTouchMove,
    },
    isPressed,
    progress,
  };
}
