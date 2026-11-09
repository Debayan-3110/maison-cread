import React from 'react';
import { X } from 'lucide-react';
import { useShop } from '../context/ShopContext';

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
    <div className="pointer-events-auto flex items-start justify-between gap-3 rounded-[14px] border border-hairline bg-panel px-4 py-3.5 shadow-quiet toast-in sm:gap-4">
      <div className="flex min-w-0 items-start gap-3">
        <span className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${
          toast.type === 'success' ? 'bg-success' :
          toast.type === 'error' ? 'bg-[#9B3B22]' : 'bg-accent'
        }`} />
        <p className="min-w-0 break-words text-[13px] leading-relaxed text-body">{toast.message}</p>
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
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-stretch gap-2 px-3 phone-lg:gap-3 sm:inset-x-auto sm:right-4 sm:top-4 sm:w-80">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}
