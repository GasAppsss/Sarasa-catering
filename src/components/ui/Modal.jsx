import React, { useEffect } from 'react';

export function Modal({ isOpen, onClose, children, maxWidth = 'max-w-lg', className = '' }) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-backdrop-zoom ${className}`}
      onClick={onClose}
    >
      <div
        className={`w-full ${maxWidth} animate-scale-in`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
