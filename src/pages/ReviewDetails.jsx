import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { getSeriesDetails, posterUrl } from '../services/tmdb'
import { deleteReview, getCurrentUserId, getReviewById, updateReview } from '../services/reviews'
import { useLists } from '../context/ListsContext'

function today() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function displayDate(value) {
  if (!value) return 'Fecha no registrada'
  return new Date(`${value}T12:00:00`).toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

export default function ReviewDetails() {
  const { reviewId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { favorites, isFavorite, toggleFavorite } = useLists()

  const [review, setReview] = useState(null)
  const [series, setSeries] = useState(null)
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [editing, setEditing] = useState(false)
  const [rating, setRating] = useState(0)
  const [favorite, setFavorite] = useState(false)
  const [text, setText] = useState('')
  const [watchedAt, setWatchedAt] = useState(today())
  const [saving, setSaving] = useState(false)
  const [editorError, setEditorError] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      setLoading(true)
      setError('')
      setReview(null)
      setSeries(null)
      try {
        const [data, uid] = await Promise.all([getReviewById(reviewId), getCurrentUserId()])
        if (controller.signal.aborted) return
        setUserId(uid)
        if (!data) {
          setError('No encontramos esta reseña. Es posible que haya sido eliminada.')
          return
        }
        setReview(data)
        try {
          const details = await getSeriesDetails(data.seriesId, controller.signal)
          if (!controller.signal.aborted) setSeries(details)
        } catch (err) {
          if (err.name !== 'AbortError') console.error('No se pudieron cargar datos de TMDB:', err)
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error('Error al cargar la reseña:', err)
          setError('No pudimos cargar la reseña. Revisá tu conexión e intentá nuevamente.')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    load()
    return () => controller.abort()
  }, [reviewId])

  function goBack() {
    if (location.state?.from) navigate(location.state.from)
    else if (window.history.state?.idx > 0) navigate(-1)
    else navigate('/perfil?tab=diario')
  }

  function openEditor() {
    if (!review || review.userId !== userId) return
    setRating(review.rating)
    setFavorite(isFavorite(review.seriesId))
    setText(review.text)
    setWatchedAt(review.watchedAt || today())
    setEditorError('')
    setEditing(true)
  }

  function closeEditor() {
    if (!saving) setEditing(false)
  }

  async function saveReview(event) {
    event.preventDefault()
    if (!review || saving) return
    setEditorError('')
    if (!text.trim() || text.trim().length > 1000) {
      setEditorError('La reseña debe tener entre 1 y 1000 caracteres.')
      return
    }
    if (rating < 1 || rating > 5) {
      setEditorError('Elegí una puntuación entre 1 y 5 estrellas.')
      return
    }
    if (!watchedAt || watchedAt > today()) {
      setEditorError('Elegí una fecha válida que no sea posterior a hoy.')
      return
    }
    const wasFavorite = isFavorite(review.seriesId)
    if (favorite && !wasFavorite && !series) {
      setEditorError('No pudimos cargar la serie para agregarla a Favoritos.')
      return
    }

    setSaving(true)
    try {
      await updateReview(review.id, {
        seriesId: review.seriesId,
        seriesName: review.seriesName,
        rating,
        text,
        watchedAt,
      })
      if (favorite !== wasFavorite) {
        const item = wasFavorite
          ? favorites.find((value) => value.id === review.seriesId)
          : series
        if (item) toggleFavorite(item)
      }
      setReview((current) => ({ ...current, rating, text: text.trim(), watchedAt }))
      setEditing(false)
      setMessage('¡Tu reseña se actualizó correctamente!')
    } catch (err) {
      console.error('Error al actualizar la reseña:', err)
      setEditorError('No se pudo guardar la reseña. Intentá nuevamente.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!review || deleting || review.userId !== userId) return
    if (!window.confirm('¿Seguro que querés eliminar tu reseña? Esta acción no se puede deshacer.')) return
    setDeleting(true)
    setMessage('')
    try {
      await deleteReview(review.id)
      navigate('/perfil?tab=diario', { replace: true })
    } catch (err) {
      console.error('Error al eliminar la reseña:', err)
      setMessage('No se pudo eliminar la reseña. Intentá nuevamente.')
      setDeleting(false)
    }
  }

  const backButton = <button className="back-btn" type="button" onClick={goBack}>← Volver</button>
  if (loading) return <>{backButton}<p className="message">Cargando reseña…</p></>
  if (error || !review) return <>{backButton}<p className="message error" role="alert">{error || 'No encontramos esta reseña.'}</p></>

  const poster = posterUrl(series?.poster_path, 'w500')
  const year = series?.first_air_date?.slice(0, 4)
  const isOwner = Boolean(userId && review.userId === userId)
  const currentFavorite = isFavorite(review.seriesId)

  return (
    <div className="review-details-page">
      {backButton}
      {message && <p className={message.startsWith('No se') ? 'message error' : 'profile-success'} role="status">{message}</p>}

      <article className="review-details-card">
        <div className="review-modal-layout">
          <Link
            to={`/serie/${review.seriesId}`}
            className="review-modal-poster review-details-poster-link"
            aria-label={`Ir al detalle de ${review.seriesName}`}
            title={`Ver ${review.seriesName}`}
          >
            {poster ? <img src={poster} alt={`Póster de ${review.seriesName}`} /> : <div className="no-poster">Sin póster</div>}
          </Link>
          <div className="review-modal-content">
            <h1 className="review-details-title">
              {review.seriesName}{year && <span className="details-year"> ({year})</span>}
            </h1>
            <div className="review-details-date">
              <span>Vista el</span>
              <strong>{displayDate(review.watchedAt)}</strong>
            </div>
            <div className="review-details-rating">
              <span className="review-rating" aria-label={`${review.rating} de 5 estrellas`}>{'★'.repeat(review.rating)}</span>
              {currentFavorite && <span className="review-details-heart" aria-label="En favoritos" title="En favoritos">♥</span>}
            </div>
            <p className="review-details-body">{review.text}</p>
            {isOwner && (
              <div className="review-details-actions">
                <button type="button" className="review-details-edit" onClick={openEditor}>✎ Editar</button>
                <button
                  type="button"
                  className="review-icon-button review-delete review-details-delete"
                  onClick={handleDelete}
                  disabled={deleting}
                  aria-label={deleting ? 'Eliminando reseña' : 'Eliminar reseña'}
                  title={deleting ? 'Eliminando reseña…' : 'Eliminar reseña'}
                >
                  {deleting ? '…' : (
                    <svg
                      width="19"
                      height="19"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path d="M3 6h18" />
                      <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
                      <path d="M19 6l-1 14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 6" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                    </svg>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </article>

      {editing && (
        <div className="review-modal-overlay" onClick={closeEditor}>
          <div className="review-modal" role="dialog" aria-modal="true" aria-labelledby="detail-edit-title" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="review-modal-close" onClick={closeEditor} disabled={saving} aria-label="Cerrar ventana">✕</button>
            <div className="review-modal-layout">
              <div className="review-modal-poster">
                {poster ? <img src={poster} alt={`Póster de ${review.seriesName}`} /> : <div className="no-poster">Sin póster</div>}
              </div>
              <div className="review-modal-content">
                <h2 id="detail-edit-title">{review.seriesName}{year && <span className="details-year"> ({year})</span>}</h2>
                <form className="review-form" onSubmit={saveReview}>
                  <div className="review-rating-row" role="group" aria-label="Tu puntuación">
                    <div className="review-star-selector">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} type="button" className={`review-star-button ${star <= rating ? 'selected' : ''}`} onClick={() => setRating(star)} disabled={saving} aria-label={`${star} de 5 estrellas`} aria-pressed={rating === star}>
                          {star <= rating ? '★' : '☆'}
                        </button>
                      ))}
                    </div>
                    <button type="button" className={`review-favorite-button ${favorite ? 'on' : ''}`} onClick={() => setFavorite((value) => !value)} aria-pressed={favorite} aria-label={favorite ? 'Quitar de favoritos' : 'Agregar a favoritos'} disabled={saving}>
                      {favorite ? '♥' : '♡'}
                    </button>
                  </div>
                  <label htmlFor="detail-review-text">Tu reseña</label>
                  <textarea id="detail-review-text" value={text} onChange={(event) => setText(event.target.value)} placeholder={`¿Qué te pareció ${review.seriesName}?`} rows={5} maxLength={1000} required disabled={saving} />
                  <p className="review-counter">{text.length}/1000 caracteres</p>
                  <div className="review-date-field">
                    <label htmlFor="detail-review-date">Vista el</label>
                    <input id="detail-review-date" type="date" value={watchedAt} max={today()} onChange={(event) => setWatchedAt(event.target.value)} required disabled={saving} />
                  </div>
                  {editorError && <p className="message error" role="alert">{editorError}</p>}
                  <button className="detail-btn on" type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar cambios'}</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}