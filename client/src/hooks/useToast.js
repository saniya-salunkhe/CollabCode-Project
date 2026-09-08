import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Toast hook — lightweight notifications without a library.
 * Usage: const toast = useToast(); toast.success('Saved!');
 */
export const useToast = () => {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const show = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    timers.current[id] = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      delete timers.current[id];
    }, duration);
  }, []);

  useEffect(() => {
    return () => {
      Object.values(timers.current).forEach(clearTimeout);
    };
  }, []);

  return {
    toasts,
    show,
    success: (msg, d) => show(msg, 'success', d),
    error: (msg, d) => show(msg, 'error', d),
    info: (msg, d) => show(msg, 'info', d),
  };
};
