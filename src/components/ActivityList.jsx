import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSeriesDetails, posterUrl } from '../services/tmdb'

function dateParts(date) {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { day: '—', month: '', full: 'Fecha no registrada' }
  }
  const [year, month, day] = date.split('-').map(Number)
  const value = new Date(year, month - 1, day, 12)
  return {
    day: String(day).padStart(2, '0'),
    month: value.toLocaleDateString('es-AR', { month: 'short' }).replace('.', '').toUpperCase(),
    full: value.toLocaleDateString('es-AR'),
  }
}

export default function ActivityList({ reviews, favorites, watched, onEdit, onDelete }) {
  const [details, setDetails] = useState({})
  const ids = useMemo(() => [...new Set(reviews.map((review) => review.seriesId))], [reviews])
  const idsKey = ids.join(',')

  useEffect(() => {
    if (!ids.length) return
    const controller = new AbortController()

    async function load() {
      const values = await Promise.all(ids.map(async (id) => {
        try {
          return [id, await getSeriesDetails(id, controller.signal)]
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.error('No se pudieron cargar los datos de la serie:', error)
          }
          return [id, null]
        }
      }))
      if (!controller.signal.aborted) setDetails(Object.fromEntries(values))
    }
    load()
    return () => controller.abort()
  }, [idsKey])

  return (
    <div className="profile-activity-list">
      {reviews.map((review) => {
        const date = dateParts(review.watchedAt)
        const series = details[review.seriesId]
        const saved = watched.find((item) => item.id === review.seriesId)
        const image = posterUrl(series?.poster_path || saved?.poster_path, 'w185')
        const year = series?.first_air_date?.slice(0, 4) || saved?.first_air_date?.slice(0, 4)
        const favorite = favorites.some((item) => item.id === review.seriesId)

        return (
          <article className="profile-activity-item" key={review.id}>
            <div className="profile-activity-date" title={date.full}>
              <span>{date.month}</span>
              <strong>{date.day}</strong>
            </div>

            <Link
              to={`/resena/${review.id}`}
              state={{ from: '/perfil?tab=diario' }}
              className="profile-activity-poster"
              aria-label={`Leer reseña de ${review.seriesName}`}
            >
              {image ? <img src={image} alt={`Póster de ${review.seriesName}`} loading="lazy" /> : <span>Sin póster</span>}
            </Link>

            <div className="profile-activity-info">
              <Link
                to={`/resena/${review.id}`}
                state={{ from: '/perfil?tab=diario' }}
                className="profile-activity-name"
              >
                {review.seriesName}
                {year && <span className="details-year"> ({year})</span>}
              </Link>
              <div className="profile-activity-rating">
                <span className="review-rating" aria-label={`${review.rating} de 5 estrellas`}>
                  {'★'.repeat(review.rating)}
                </span>
                {favorite && <span className="profile-recent-heart" aria-label="En favoritos" title="En favoritos">♥</span>}
              </div>
            </div>

            <div className="profile-activity-actions">
              <button type="button" className="review-icon-button" onClick={() => onEdit(review)} aria-label={`Editar reseña de ${review.seriesName}`} title="Editar reseña">✎</button>
              <button
                type="button"
                className="review-icon-button review-delete"
                onClick={() => onDelete(review.id)}
                aria-label={`Eliminar reseña de ${review.seriesName}`}
                title="Eliminar reseña"
              >
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
              </button>
            </div>
          </article>
        )
      })}
    </div>
  )
}