import { useState, useCallback } from 'react';

// Simple global toast emitter so any component can trigger toasts
// without prop drilling or context nesting.
let toastListeners = [];

export const toast = {
  show: (message, type = 'info') => {
    toastListeners.forEach((fn) => fn({ message, type, id: Date.now() + Math.random() }));
  },
  success: (msg) => toast.show(msg, 'success'),
  error: (msg) => toast.show(msg, 'error'),
  info: (msg) => toast.show(msg, 'info'),
};

export function useToastState() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((t) => {
    setToasts((prev) => [...prev, t]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== t.id));
    }, 3000);
  }, []);

  // subscribe to global toast emitter
  if (toastListeners.length === 0) {
    toastListeners.push(addToast);
  }

  // keep listener fresh
  toastListeners = [addToast];

  return { toasts };
}
