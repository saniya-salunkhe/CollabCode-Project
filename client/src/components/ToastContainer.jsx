import { useState, useEffect } from 'react';

// ── Global toast event system ────────────────────────────
const listeners = new Set();

export const toast = {
  show: (message, type = 'info') => {
    const t = { message, type, id: Date.now() + Math.random() };
    listeners.forEach((fn) => fn(t));
  },
  success: (msg) => toast.show(msg, 'success'),
  error: (msg) => toast.show(msg, 'error'),
  info: (msg) => toast.show(msg, 'info'),
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (t) => {
      setToasts((prev) => [...prev, t]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id));
      }, 3000);
    };
    listeners.add(handler);
    return () => listeners.delete(handler);
  }, []);

  return (
    <>
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          {t.message}
        </div>
      ))}
    </>
  );
}
