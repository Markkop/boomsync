import React from 'react';
import { createPortal } from 'react-dom';
import { TapSafeButton } from './TapSafeButton';
import { safeModalClose } from '../utils/dismissGuard';
import { useT } from '../i18n/I18nContext';

interface ConfirmModalProps {
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  title,
  body,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}) => {
  const t = useT();
  const resolvedConfirm = confirmLabel ?? t('common.confirm');
  const resolvedCancel = cancelLabel ?? t('common.cancel');

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-6 bg-zinc-950/90 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-[40px] p-8 shadow-2xl">
        <h2 className="text-xl font-black text-zinc-100 mb-2">{title}</h2>
        <p className="text-zinc-400 text-sm mb-6">{body}</p>
        <div className="flex gap-3">
          <TapSafeButton
            onTap={() => safeModalClose(onCancel)}
            className="flex-1 py-4 bg-zinc-800 border border-zinc-700 text-zinc-300 font-bold rounded-2xl active:scale-95 transition-transform"
          >
            {resolvedCancel}
          </TapSafeButton>
          <TapSafeButton
            onTap={() => safeModalClose(onConfirm)}
            className="flex-1 py-4 bg-cyan-500 text-zinc-950 font-black rounded-2xl active:scale-95 transition-transform"
          >
            {resolvedConfirm}
          </TapSafeButton>
        </div>
      </div>
    </div>,
    document.body
  );
};
