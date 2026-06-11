import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { lockBodyScroll, unlockBodyScroll } from '../../lib/modalScrollLock'

export default function Modal({ open, title, onClose, children, size = 'md' }) {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return undefined

    lockBodyScroll()

    function onKeyDown(event) {
      if (event.key === 'Escape') onCloseRef.current()
    }

    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      unlockBodyScroll()
    }
  }, [open])

  if (!open) return null

  const sizeClass =
    size === 'xl'
      ? 'max-w-5xl'
      : size === 'lg'
        ? 'max-w-xl'
        : size === 'sm'
          ? 'max-w-sm'
          : 'max-w-lg'

  return createPortal(
    <div
      className="fixed inset-0 z-[200] overflow-y-auto overscroll-contain animate-fade-in"
      role="presentation"
    >
      <div className="flex min-h-full items-center justify-center p-4 py-10 sm:py-12">
        <button
          type="button"
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
          aria-label="Cerrar"
          onClick={onClose}
        />

        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className={`modal-enter relative z-10 flex w-full ${sizeClass} max-h-[min(90svh,calc(100vh-5rem))] flex-col rounded-xl border border-slate-200/80 bg-white shadow-[0_24px_64px_rgba(15,23,42,0.18)]`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
            <h2
              id="modal-title"
              className="text-lg font-bold tracking-tight text-cocode-heading"
            >
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-cocode-heading"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
