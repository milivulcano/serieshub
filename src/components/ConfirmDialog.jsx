import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

/** Confirmación propia: la operación destructiva ocurre solo después de aceptar. */
export function useConfirmDialog() {
  const [request, setRequest] = useState(null)
  const resolver = useRef(null)
  const titleId = useId()
  const descriptionId = useId()
  const cancelButtonRef = useRef(null)
  const confirmButtonRef = useRef(null)
  const previousFocus = useRef(null)

  function confirm(options = {}) {
    if (resolver.current) resolver.current(false)
    return new Promise((resolve) => {
      resolver.current = resolve
      setRequest(options)
    })
  }

  function finish(accepted) {
    const resolve = resolver.current
    resolver.current = null
    setRequest(null)
    resolve?.(accepted)
  }

  useEffect(() => {
    if (!request) return undefined
    previousFocus.current = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    cancelButtonRef.current?.focus()
    function onKeyDown(event) {
      if (event.key === 'Escape') { event.preventDefault(); finish(false) }
      if (event.key === 'Tab') {
        const buttons = document.querySelectorAll('.confirm-dialog button:not(:disabled)')
        if (!buttons.length) return
        const first = buttons[0]
        const last = buttons[buttons.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      previousFocus.current?.focus?.()
    }
  }, [request])

  const dialog = request ? createPortal(
    <div className="confirm-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) finish(false) }}>
      <section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId}>
        <div className="confirm-dialog-heading">
          <span className="confirm-dialog-symbol" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m5 4v7m4-7v7" /></svg>
          </span>
          <h2 id={titleId}>{request.title || 'Confirmar eliminación'}</h2>
          <button type="button" className="confirm-dialog-close" onClick={() => finish(false)} aria-label="Cerrar confirmación">×</button>
        </div>
        <p id={descriptionId}>{request.message || 'Esta acción no se puede deshacer.'}</p>
        <div className="confirm-dialog-actions">
          <button type="button" className="group-secondary-button" ref={cancelButtonRef} onClick={() => finish(false)}>Cancelar</button>
          <button type="button" className="confirm-dialog-delete" ref={confirmButtonRef} onClick={() => finish(true)}>{request.confirmLabel || 'Eliminar'}</button>
        </div>
      </section>
    </div>, document.body
  ) : null

  return { confirm, dialog }
}