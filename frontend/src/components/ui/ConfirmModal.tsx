import React, { useId } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './Button';
import { IconBadge } from './IconBadge';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDestructive = false,
  onConfirm,
  onCancel,
}) => {
  const titleId = useId();
  const messageId = useId();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl shadow-black/40 text-slate-800 animate-fade-up"
      >
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-3 mb-4 pr-8">
          <IconBadge icon={AlertTriangle} tone={isDestructive ? 'danger' : 'brand'} size="md" />
          <h3 id={titleId} className="text-lg font-semibold text-slate-900">
            {title}
          </h3>
        </div>

        <p id={messageId} className="text-sm text-slate-600 mb-6 leading-relaxed">
          {message}
        </p>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button variant={isDestructive ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};
