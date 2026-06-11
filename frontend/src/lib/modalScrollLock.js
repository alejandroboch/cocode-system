let lockCount = 0

/** Bloquea el scroll del documento (soporta varios modales abiertos). */
export function lockBodyScroll() {
  if (lockCount === 0) {
    document.body.dataset.modalScrollPrev =
      document.body.style.overflow || ''
    document.body.style.overflow = 'hidden'
  }
  lockCount += 1
}

/** Libera el scroll cuando ya no queda ningún modal activo. */
export function unlockBodyScroll() {
  lockCount = Math.max(0, lockCount - 1)
  if (lockCount === 0) {
    const prev = document.body.dataset.modalScrollPrev ?? ''
    document.body.style.overflow = prev
    delete document.body.dataset.modalScrollPrev
  }
}

/** Por si un modal se desmonta sin cleanup (p. ej. navegación). */
export function resetBodyScrollLock() {
  lockCount = 0
  const prev = document.body.dataset.modalScrollPrev ?? ''
  document.body.style.overflow = prev
  delete document.body.dataset.modalScrollPrev
}
