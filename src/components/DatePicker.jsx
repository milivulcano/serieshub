import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const WEEKDAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do']
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function parseDate(value) {
  if (!ISO_DATE.test(value || '')) return null
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null
}

function toISO(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatDate(value) {
  const date = parseDate(value)
  return date ? new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'long', year: 'numeric' }).format(date) : 'Seleccionar fecha'
}

/** Selector controlado. Mantiene el valor YYYY-MM-DD usado por las reseñas de Firebase. */
export default function DatePicker({ id, value, onChange, max, min, disabled = false, required = false }) {
  const generatedId = useId()
  const controlId = id || generatedId
  const triggerRef = useRef(null)
  const panelRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const maxDate = parseDate(max)
  const minDate = parseDate(min)
  const selected = parseDate(value)
  const initial = selected || maxDate || new Date()
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(initial.getFullYear(), initial.getMonth(), 1))

  function recalculatePosition() {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const panelWidth = Math.min(344, window.innerWidth - 24)
    const left = Math.max(12, Math.min(rect.left, window.innerWidth - panelWidth - 12))
    const availableBelow = window.innerHeight - rect.bottom
    const panelHeight = Math.min(350, window.innerHeight - 24)
    const above = availableBelow < panelHeight && rect.top > availableBelow
    setPosition({ top: above ? Math.max(12, rect.top - panelHeight - 8) : Math.min(rect.bottom + 8, Math.max(12, window.innerHeight - panelHeight - 12)), left })
  }

  function toggle() {
    if (disabled) return
    if (!open) {
      const base = selected || maxDate || new Date()
      setVisibleMonth(new Date(base.getFullYear(), base.getMonth(), 1))
    }
    setOpen((current) => !current)
  }

  useLayoutEffect(() => {
    if (open) recalculatePosition()
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    function handlePointer(event) {
      if (!panelRef.current?.contains(event.target) && !triggerRef.current?.contains(event.target)) setOpen(false)
    }
    function handleKey(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    function handleReposition() { recalculatePosition() }
    document.addEventListener('pointerdown', handlePointer)
    document.addEventListener('keydown', handleKey)
    window.addEventListener('resize', handleReposition)
    window.addEventListener('scroll', handleReposition, true)
    return () => {
      document.removeEventListener('pointerdown', handlePointer)
      document.removeEventListener('keydown', handleKey)
      window.removeEventListener('resize', handleReposition)
      window.removeEventListener('scroll', handleReposition, true)
    }
  }, [open])

  useEffect(() => {
    if (disabled) setOpen(false)
  }, [disabled])

  const year = visibleMonth.getFullYear()
  const month = visibleMonth.getMonth()
  const firstOffset = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevMonth = new Date(year, month - 1, 1)
  const nextMonth = new Date(year, month + 1, 1)
  const minMonth = minDate ? new Date(minDate.getFullYear(), minDate.getMonth(), 1) : null
  const maxMonth = maxDate ? new Date(maxDate.getFullYear(), maxDate.getMonth(), 1) : null
  const canPrev = !minMonth || prevMonth >= minMonth
  const canNext = !maxMonth || nextMonth <= maxMonth
  const firstYear = Math.min(1900, minDate?.getFullYear() ?? 1900)
  const lastYear = maxDate?.getFullYear() ?? new Date().getFullYear()
  const years = Array.from({ length: Math.max(1, lastYear - firstYear + 1) }, (_, i) => lastYear - i)

  function changeMonth(newYear, newMonth) {
    const next = new Date(newYear, newMonth, 1)
    if ((minMonth && next < minMonth) || (maxMonth && next > maxMonth)) return
    setVisibleMonth(next)
  }

  function chooseDate(date) {
    const iso = toISO(date)
    if ((max && iso > max) || (min && iso < min)) return
    onChange(iso)
    setOpen(false)
    triggerRef.current?.focus()
  }

  return (
    <div className="sh-date-picker">
      <button
        id={controlId}
        ref={triggerRef}
        type="button"
        className={`sh-date-trigger${open ? ' is-open' : ''}`}
        onClick={toggle}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-required={required}
        aria-label={`Fecha de visualización: ${formatDate(value)}`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/></svg>
        <span>{formatDate(value)}</span>
        <svg className="sh-date-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
      </button>
      {open && createPortal(
        <div className="sh-date-popover" ref={panelRef} style={{ top: position.top, left: position.left }} role="dialog" aria-label="Elegir fecha de visualización" onClick={(event) => event.stopPropagation()}>
          <div className="sh-date-header">
            <button type="button" className="sh-date-arrow" onClick={() => changeMonth(year, month - 1)} disabled={!canPrev} aria-label="Mes anterior">‹</button>
            <div className="sh-date-selectors">
              <select aria-label="Mes" value={month} onChange={(event) => changeMonth(year, Number(event.target.value))}>
                {MONTHS.map((name, index) => <option value={index} key={name}>{name.charAt(0).toUpperCase() + name.slice(1)}</option>)}
              </select>
              <select aria-label="Año" value={year} onChange={(event) => changeMonth(Number(event.target.value), month)}>
                {years.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            <button type="button" className="sh-date-arrow" onClick={() => changeMonth(year, month + 1)} disabled={!canNext} aria-label="Mes siguiente">›</button>
          </div>
          <div className="sh-date-grid" role="grid" aria-label={`${MONTHS[month]} de ${year}`}>
            {WEEKDAYS.map((name) => <span key={name} className="sh-date-weekday">{name}</span>)}
            {Array.from({ length: firstOffset }, (_, index) => <span key={`empty-${index}`} aria-hidden="true" />)}
            {Array.from({ length: daysInMonth }, (_, index) => {
              const date = new Date(year, month, index + 1)
              const iso = toISO(date)
              const unavailable = Boolean((max && iso > max) || (min && iso < min))
              const isToday = iso === toISO(new Date())
              return (
                <button key={iso} type="button" className={`sh-date-day${iso === value ? ' is-selected' : ''}${isToday ? ' is-today' : ''}`} disabled={unavailable} onClick={() => chooseDate(date)} aria-label={new Intl.DateTimeFormat('es-AR', { dateStyle: 'full' }).format(date)} aria-pressed={iso === value}>{index + 1}</button>
              )
            })}
          </div>
          <div className="sh-date-footer">
            <button type="button" onClick={() => chooseDate(new Date())} disabled={Boolean(max && toISO(new Date()) > max)}>Hoy</button>
            <button type="button" onClick={() => { setOpen(false); triggerRef.current?.focus() }}>Cerrar</button>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
