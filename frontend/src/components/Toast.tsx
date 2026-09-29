import React from 'react';
import { X } from 'lucide-react';
import { useShop } from '../context/ShopContext.tsx';

interface ToastProps {
    toast: {
        id: number;
        message: string;
        type: 'info' | 'success' | 'error';
    };
    onRemove: (id: number) => void;
}

function ToastItem({ toast, onRemove }: ToastProps) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-[14px] border border-hairline bg-panel px-4 py-3.5 shadow-quiet toast-in min-w-[300px]">
      <div className="flex items-start gap-3">
        <span className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${
          toast.type === 'success' ? 'bg-success' :
          toast.type === 'error' ? 'bg-[#9B3B22]' : 'bg-accent'
        }`} />
        <p className="text-[13px] leading-relaxed text-body">{toast.message}</p>
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        aria-label="Dismiss notification"
        className="-mr-1 -mt-1 rounded-full p-1 text-faint transition-colors hover:bg-recess hover:text-body"
      >
        <X className="w-3.5 h-3.5" strokeWidth={1.5} />
      </button>
    </div>
  );
}

export default function Toast() {
  const { toasts, removeToast } = useShop();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed right-4 top-4 z-[100] flex max-w-sm flex-col gap-3">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}
