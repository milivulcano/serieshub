import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSeriesDetails, posterUrl } from '../services/tmdb'

export default function RecentActivity({
  reviews,
  favorites,
  watched,
  loading,
  error,
  onViewAll,
}) {
  // Mostramos una sola tarjeta por serie.
  // Las reseñas ya vienen ordenadas de más reciente a más antigua.
  const recentReviews = useMemo(() => {
    const seen = new Set()

    return reviews
      .filter((review) => {
        if (seen.has(review.seriesId)) return false

        seen.add(review.seriesId)
        return true
      })
      .slice(0, 4)
  }, [reviews])

  const [posters, setPosters] = useState({})

  // Aprovechamos los pósters de "Ya la vi".
  // Si falta alguno, lo buscamos en TMDB.
  useEffect(() => {
    if (recentReviews.length === 0) return

    const controller = new AbortController()

    async function loadPosters() {
      const missing = recentReviews.filter(
        (review) =>
          !watched.some(
            (series) =>
              series.id === review.seriesId &&
              series.poster_path
          )
      )

      const entries = await Promise.all(
        missing.map(async (review) => {
          try {
            const details = await getSeriesDetails(
              review.seriesId,
              controller.signal
            )

            return [
              review.seriesId,
              details.poster_path ?? null,
            ]
          } catch (err) {
            if (err.name !== 'AbortError') {
              console.error(
                'No se pudo cargar el póster:',
                err
              )
            }

            return [review.seriesId, null]
          }
        })
      )

      if (!controller.signal.aborted) {
        setPosters(Object.fromEntries(entries))
      }
    }

    loadPosters()

    return () => controller.abort()
  }, [recentReviews, watched])

  return (
    <section className="profile-recent-activity">
      <div className="profile-recent-heading">
        <h2 className="section-title">
          Actividad reciente
        </h2>

        <button
          className="profile-recent-view-all"
          type="button"
          onClick={onViewAll}
        >
          Ver todo →
        </button>
      </div>

      {loading ? (
        <p className="message">
          Cargando tu actividad…
        </p>
      ) : error ? (
        <p className="message error">
          {error}
        </p>
      ) : recentReviews.length === 0 ? (
        <p className="empty">
          Todavía no tenés reseñas registradas.
          Tus últimas series reseñadas aparecerán acá.
        </p>
      ) : (
        <div className="profile-recent-grid">
          {recentReviews.map((review) => {
            const savedSeries = watched.find(
              (series) =>
                series.id === review.seriesId
            )

            const path =
              savedSeries?.poster_path ||
              posters[review.seriesId]

            const image = posterUrl(path, 'w342')

            const favorite = favorites.some(
              (series) =>
                series.id === review.seriesId
            )

            return (
              <article
                className="profile-recent-card"
                key={review.id}
              >
                <Link
                  className="poster poster-link"
                  to={`/resena/${review.id}`}
                  state={{ from: '/perfil' }}
                  aria-label={`Leer mi reseña de ${review.seriesName}`}
                >
                  {image ? (
                    <img
                      src={image}
                      alt={`Póster de ${review.seriesName}`}
                      loading="lazy"
                    />
                  ) : (
                    <div className="no-poster">
                      Sin póster
                    </div>
                  )}

                  <span className="poster-overlay">
                    <span className="poster-overlay-title">
                      {review.seriesName}
                    </span>
                  </span>
                </Link>

                <div className="profile-recent-meta">
                  <span
                    className="review-rating"
                    aria-label={`${review.rating} de 5 estrellas`}
                  >
                    {'★'.repeat(review.rating)}
                  </span>

                  {favorite && (
                    <span
                      className="profile-recent-heart"
                      aria-label="En favoritos"
                      title="En favoritos"
                    >
                      ♥
                    </span>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}