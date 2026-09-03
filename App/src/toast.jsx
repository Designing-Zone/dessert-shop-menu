import React, { useEffect, useState } from 'react';

let toastId = 0;

/** Fire-and-forget toast. Renders via the <Toaster /> component in App. */
export function toast(message, type = 'info') {
  window.dispatchEvent(
    new CustomEvent('bh-toast', { detail: { id: ++toastId, message, type } })
  );
}

export function Toaster() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    function onToast(e) {
      const t = e.detail;
      setItems((cur) => [...cur.slice(-2), t]);
      setTimeout(() => setItems((cur) => cur.filter((i) => i.id !== t.id)), 2600);
    }
    window.addEventListener('bh-toast', onToast);
    return () => window.removeEventListener('bh-toast', onToast);
  }, []);

  if (items.length === 0) return null;
  return (
    <div className="toaster">
      {items.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
