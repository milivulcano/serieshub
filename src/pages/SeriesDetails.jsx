import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  getSeriesDetails,
  getSeriesVideos,
  getWatchProviders,
  posterUrl,
} from '../services/tmdb'
import { useLists } from '../context/ListsContext'
import {
  createReview,
  deleteReview,
  getCurrentUserId,
  getSeriesReviews,
} from '../services/reviews'

const STATUS = {
  'Returning Series': 'En emisión',
  Ended: 'Finalizada',
  Canceled: 'Cancelada',
  'In Production': 'En producción',
  Planned: 'Planeada',
  Pilot: 'Piloto',
}

const PROVIDER_GROUPS = [
  ['flatrate', 'Streaming'],
  ['rent', 'Alquiler'],
  ['buy', 'Compra'],
]

function pickTrailer(videos) {
  const youtube = videos.filter((video) => video.site === 'YouTube')

  return (
    youtube.find((video) => video.type === 'Trailer' && video.official) ||
    youtube.find((video) => video.type === 'Trailer') ||
    youtube.find((video) => video.type === 'Teaser') ||
    null
  )
}

export default function SeriesDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const {
    isFavorite,
    isInWatchlist,
    isWatching,
    toggleFavorite,
    toggleWatchlist,
    toggleWatching,
  } = useLists()

  const [series, setSeries] = useState(null)
  const [trailer, setTrailer] = useState(null)
  const [providers, setProviders] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [reviews, setReviews] = useState([])
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [reviewText, setReviewText] = useState('')
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const [reviewMessage, setReviewMessage] = useState('')
  const [currentUserId, setCurrentUserId] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller

    async function load() {
      setLoading(true)
      setError('')
      setSeries(null)

      try {
        const [details, videos, watch] = await Promise.all([
          getSeriesDetails(id, signal),
          getSeriesVideos(id, signal).catch(() => []),
          getWatchProviders(id, signal).catch(() => null),
        ])

        setSeries(details)
        setTrailer(pickTrailer(videos))
        setProviders(watch)
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message)
        }
      } finally {
        if (!signal.aborted) {
          setLoading(false)
        }
      }
    }

    load()

    return () => controller.abort()
  }, [id])

  useEffect(() => {
    let active = true

    async function loadReviews() {
      try {
        const [userId, seriesReviews] = await Promise.all([
          getCurrentUserId(),
          getSeriesReviews(id),
        ])

        if (active) {
          setCurrentUserId(userId)
          setReviews(seriesReviews)
          setReviewError('')
        }
      } catch (err) {
        if (active) {
          setReviewError(
            'No se pudieron cargar las reseñas. Intentá nuevamente.'
          )
          console.error('Error al cargar reseñas:', err)
        }
      }
    }

    loadReviews()

    return () => {
      active = false
    }
  }, [id])

  async function handleReviewSubmit(event) {
    event.preventDefault()

    setReviewError('')
    setReviewMessage('')

    if (!reviewText.trim()) {
      setReviewError('Escribí tu reseña antes de publicarla.')
      return
    }

    if (reviewText.trim().length > 1000) {
      setReviewError('La reseña no puede superar los 1000 caracteres.')
      return
    }

    setReviewLoading(true)

    try {
      await createReview({
        seriesId: series.id,
        rating: reviewRating,
        text: reviewText,
      })

      const updatedReviews = await getSeriesReviews(series.id)

      setReviews(updatedReviews)
      setReviewText('')
      setReviewRating(5)
      setReviewModalOpen(false)
      setReviewMessage('¡Tu reseña se publicó correctamente!')
    } catch (err) {
      console.error('Error al publicar la reseña:', err)
      setReviewError(
        'No se pudo publicar la reseña. Revisá tu conexión e intentá nuevamente.'
      )
    } finally {
      setReviewLoading(false)
    }
  }

  async function handleReviewDelete(reviewId) {
    const confirmed = window.confirm(
      '¿Seguro que querés eliminar tu reseña?'
    )

    if (!confirmed) return

    setReviewError('')
    setReviewMessage('')

    try {
      await deleteReview(reviewId)

      setReviews((currentReviews) =>
        currentReviews.filter((review) => review.id !== reviewId)
      )

      setReviewMessage('La reseña se eliminó correctamente.')
    } catch (err) {
      console.error('Error al eliminar la reseña:', err)
      setReviewMessage('')
      setReviewError(
        'No se pudo eliminar la reseña. Intentá nuevamente.'
      )
    }
  }

  const goBack = () => {
    if (window.history.state?.idx > 0) {
      navigate(-1)
    } else {
      navigate('/')
    }
  }

  const backButton = (
    <button className="back-btn" onClick={goBack}>
      ← Volver
    </button>
  )

  if (loading) {
    return (
      <>
        {backButton}
        <p className="message">Cargando ficha…</p>
      </>
    )
  }

  if (error || !series) {
    return (
      <>
        {backButton}
        <p className="message error">
          {error || 'No se pudo cargar la serie.'}
        </p>
      </>
    )
  }

  const fav = isFavorite(series.id)
  const later = isInWatchlist(series.id)
  const watching = isWatching(series.id)

  const poster = posterUrl(series.poster_path, 'w500')
  const backdrop = posterUrl(series.backdrop_path, 'w780')
  const year = series.first_air_date?.slice(0, 4)

  const creators = series.created_by
    ?.map((creator) => creator.name)
    .join(', ')

  const availableGroups = PROVIDER_GROUPS.filter(
    ([key]) => providers?.[key]?.length > 0
  )

  return (
    <>
      {backButton}

      <section
        className="details-hero"
        style={
          backdrop
            ? { backgroundImage: `url(${backdrop})` }
            : undefined
        }
      >
        <div className="details-hero-inner">
          <div className="details-poster">
            {poster ? (
              <img src={poster} alt={`Póster de ${series.name}`} />
            ) : (
              <div className="no-poster">Sin póster</div>
            )}
          </div>

          <div className="details-info">
            <h1>
              {series.name}
              {year && <span className="details-year"> ({year})</span>}
            </h1>

            {series.original_name &&
              series.original_name !== series.name && (
                <p className="details-original">
                  {series.original_name}
                </p>
              )}

            {series.tagline && (
              <p className="details-tagline">{series.tagline}</p>
            )}

            <ul className="chips">
              {series.vote_average > 0 && (
                <li>★ {series.vote_average.toFixed(1)}</li>
              )}

              {series.number_of_seasons > 0 && (
                <li>
                  {series.number_of_seasons}{' '}
                  {series.number_of_seasons === 1
                    ? 'temporada'
                    : 'temporadas'}
                </li>
              )}

              {series.number_of_episodes > 0 && (
                <li>{series.number_of_episodes} episodios</li>
              )}

              {series.status && (
                <li>{STATUS[series.status] || series.status}</li>
              )}

              {series.genres?.map((genre) => (
                <li key={genre.id}>{genre.name}</li>
              ))}
            </ul>

            <div className="details-description">
              <h2 className="section-title">Sinopsis</h2>

              <p className="details-overview">
                {series.overview ||
                  'Todavía no hay sinopsis disponible en español para esta serie.'}
              </p>

              {creators && (
                <p className="card-meta">Creada por {creators}</p>
              )}
            </div>

            <div className="details-platforms">
              <h2 className="section-title">Dónde verla</h2>

              {availableGroups.length > 0 ? (
                <>
                  {availableGroups.map(([key, label]) => (
                    <div key={key} className="provider-group">
                      <h3 className="provider-label">{label}</h3>

                      <ul className="providers">
                        {providers[key].map((provider) => (
                          <li key={provider.provider_id}>
                            <img
                              src={posterUrl(provider.logo_path, 'w92')}
                              alt={provider.provider_name}
                              title={provider.provider_name}
                            />
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}

                  {providers.link && (
                    <p className="card-meta">
                      Datos de JustWatch vía TMDB.{' '}
                      <a
                        className="text-link"
                        href={providers.link}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Ver todas las opciones
                      </a>
                    </p>
                  )}
                </>
              ) : (
                <p className="empty">
                  No tenemos información de plataformas para tu región.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="details-section detail-actions-section">
        <h2 className="section-title">Tu biblioteca</h2>

        <div className="detail-actions detail-actions-centered">
          <button
            className={`detail-btn ${fav ? 'on' : ''}`}
            onClick={() => toggleFavorite(series)}
            aria-pressed={fav}
          >
            {fav ? '♥ En favoritos' : '♡ Agregar a favoritos'}
          </button>

          <button
            className={`detail-btn ${later ? 'on' : ''}`}
            onClick={() => toggleWatchlist(series)}
            aria-pressed={later}
          >
            {later ? '✓ En Quiero ver' : '+ Quiero ver'}
          </button>

          <button
            className={`detail-btn ${watching ? 'on' : ''}`}
            onClick={() => toggleWatching(series)}
            aria-pressed={watching}
          >
            {watching ? '▶ La estoy viendo' : '▷ La estoy viendo'}
          </button>

          <button
            className="detail-btn"
            type="button"
            onClick={() => {
              setReviewError('')
              setReviewModalOpen(true)
            }}
          >
            ✎ Reseñar
          </button>
        </div>
      </section>

      {trailer && (
        <section className="details-section">
          <h2 className="section-title">Tráiler</h2>

          <div className="trailer">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${trailer.key}`}
              title={`Tráiler de ${series.name}`}
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </div>
        </section>
      )}

      {reviewMessage && (
        <p className="message" role="status">
          {reviewMessage}
        </p>
      )}

      {reviewError && !reviewModalOpen && (
        <p className="message error" role="alert">
          {reviewError}
        </p>
      )}

      {reviewModalOpen && (
        <div
          className="review-modal-overlay"
          onClick={() => {
            if (!reviewLoading) setReviewModalOpen(false)
          }}
        >
          <div
            className="review-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="review-modal-close"
              type="button"
              onClick={() => {
                if (!reviewLoading) setReviewModalOpen(false)
              }}
              aria-label="Cerrar ventana"
              disabled={reviewLoading}
            >
              ✕
            </button>

            <h2 id="review-modal-title">
              Reseñar {series.name}
            </h2>

            <p>Compartí tu opinión sobre esta serie.</p>

            <form
              className="review-form"
              onSubmit={handleReviewSubmit}
            >
              <label htmlFor="review-rating">
                Tu puntuación
              </label>

              <select
                id="review-rating"
                value={reviewRating}
                onChange={(event) =>
                  setReviewRating(Number(event.target.value))
                }
                disabled={reviewLoading}
              >
                <option value={5}>★★★★★ — Excelente</option>
                <option value={4}>★★★★☆ — Muy buena</option>
                <option value={3}>★★★☆☆ — Buena</option>
                <option value={2}>★★☆☆☆ — Regular</option>
                <option value={1}>★☆☆☆☆ — No me gustó</option>
              </select>

              <label htmlFor="review-text">
                Tu reseña
              </label>

              <textarea
                id="review-text"
                value={reviewText}
                onChange={(event) => setReviewText(event.target.value)}
                placeholder={`¿Qué te pareció ${series.name}?`}
                maxLength={1000}
                rows={5}
                required
                disabled={reviewLoading}
              />

              <p className="review-counter">
                {reviewText.length}/1000 caracteres
              </p>

              {reviewError && (
                <p className="message error" role="alert">
                  {reviewError}
                </p>
              )}

              <button
                className="detail-btn on"
                type="submit"
                disabled={reviewLoading}
              >
                {reviewLoading ? 'Publicando…' : 'Publicar reseña'}
              </button>
            </form>
          </div>
        </div>
      )}

      <section className="details-section reviews-section">
        <h2 className="section-title">Reseñas de la comunidad</h2>

        <div className="reviews-list">
          {reviews.length === 0 ? (
            <p className="empty">
              Todavía no hay reseñas para esta serie. ¡Podés ser la
              primera persona en compartir tu opinión!
            </p>
          ) : (
            reviews.map((review) => (
              <article className="review-card" key={review.id}>
                <div className="review-card-header">
                  <span className="review-rating">
                    {'★'.repeat(review.rating)}
                    {'☆'.repeat(5 - review.rating)}
                  </span>

                  {review.userId === currentUserId && (
                    <button
                      className="review-delete"
                      type="button"
                      onClick={() => handleReviewDelete(review.id)}
                    >
                      Eliminar mi reseña
                    </button>
                  )}
                </div>

                <p className="review-text">{review.text}</p>

                <p className="review-author">
                  {review.userId === currentUserId
                    ? 'Tu reseña'
                    : 'Miembro de la comunidad'}
                </p>
              </article>
            ))
          )}
        </div>
      </section>
    </>
  )
}