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
  updateReview,
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
    isWatched,
    toggleFavorite,
    toggleWatchlist,
    toggleWatching,
    toggleWatched,
  } = useLists()

  const [series, setSeries] = useState(null)
  const [trailer, setTrailer] = useState(null)
  const [providers, setProviders] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [reviews, setReviews] = useState([])
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [reviewText, setReviewText] = useState('')
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const [reviewMessage, setReviewMessage] = useState('')
  const [currentUserId, setCurrentUserId] = useState('')
  const [editingReviewId, setEditingReviewId] = useState(null)

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

  function openNewReview() {
    setEditingReviewId(null)
    setReviewRating(0)
    setReviewText('')
    setReviewError('')
    setReviewMessage('')
    setReviewModalOpen(true)
  }

  function openEditReview(review) {
    setEditingReviewId(review.id)
    setReviewRating(review.rating)
    setReviewText(review.text)
    setReviewError('')
    setReviewMessage('')
    setReviewModalOpen(true)
  }

  function closeReviewModal() {
    if (reviewLoading) return

    setReviewModalOpen(false)
    setEditingReviewId(null)
    setReviewRating(0)
    setReviewText('')
    setReviewError('')
  }

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

    if (reviewRating === 0) {
      setReviewError('Elegí una puntuación con las estrellas.')
      return
    }

    setReviewLoading(true)

    try {
      const reviewData = {
        seriesId: series.id,
        seriesName: series.name,
        rating: reviewRating,
        text: reviewText,
      }

      if (editingReviewId) {
          await updateReview(editingReviewId, reviewData)
        } else {
          await createReview(reviewData)
        }

        // Si la serie todavía no está marcada como vista,
        // la agregamos automáticamente a "Ya la vi".
        if (!isWatched(series.id)) {
          await toggleWatched(series)
        }

      const updatedReviews = await getSeriesReviews(series.id)
      setReviews(updatedReviews)
      setReviewModalOpen(false)
      setEditingReviewId(null)
      setReviewText('')
      setReviewRating(0)
      setReviewMessage(
        editingReviewId
          ? '¡Tu reseña se actualizó correctamente!'
          : '¡Tu reseña se publicó correctamente!'
      )
    } catch (err) {
      console.error('Error al guardar la reseña:', err)
      setReviewError(
        'No se pudo guardar la reseña. Revisá tu conexión e intentá nuevamente.'
      )
    } finally {
      setReviewLoading(false)
    }
  }

  async function handleReviewDelete(reviewId) {
    const confirmed = window.confirm(
      '¿Seguro que querés eliminar tu reseña? Esta acción no se puede deshacer.'
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
    <button className="back-btn" onClick={goBack} type="button">
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
  const watched = isWatched(series.id)

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
            className={`detail-btn ${watched ? 'on' : ''}`}
            type="button"
            onClick={() => toggleWatched(series)}
            aria-pressed={watched}
            aria-label={watched ? 'Quitar de Ya la vi' : 'Marcar como vista'}
            title={watched ? 'Quitar de Ya la vi' : 'Marcar como vista'}
          >
            <span aria-hidden="true">{watched ? '◉' : '◎'}</span>
            {watched ? 'Ya la vi' : 'Ya la vi'}
          </button>

          <button
            className={`detail-btn ${fav ? 'on' : ''}`}
            type="button"
            onClick={() => toggleFavorite(series)}
            aria-pressed={fav}
            aria-label={fav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          >
            <span aria-hidden="true">{fav ? '♥' : '♡'}</span>
            Favoritos
          </button>

          <button
            className={`detail-btn ${later ? 'on' : ''}`}
            type="button"
            onClick={() => toggleWatchlist(series)}
            aria-pressed={later}
            aria-label={later ? 'Quitar de Quiero ver' : 'Agregar a Quiero ver'}
          >
            <span aria-hidden="true">{later ? '✓' : '+'}</span>
            Quiero ver
          </button>

          <button
            className={`detail-btn ${watching ? 'on' : ''}`}
            type="button"
            onClick={() => toggleWatching(series)}
            aria-pressed={watching}
            aria-label={
              watching
                ? 'Quitar de La estoy viendo'
                : 'Marcar como La estoy viendo'
            }
          >
            <span aria-hidden="true">{watching ? '▶' : '▷'}</span>
            La estoy viendo
          </button>

          <button
            className="detail-btn"
            type="button"
            onClick={openNewReview}
          >
            <span aria-hidden="true">✎</span>
            Reseñar
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
          onClick={closeReviewModal}
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
              onClick={closeReviewModal}
              aria-label="Cerrar ventana"
              disabled={reviewLoading}
            >
              ✕
            </button>

            <h2 id="review-modal-title">
              {editingReviewId ? 'Editar reseña' : 'Reseñar'} {series.name}
            </h2>

            <p>Compartí tu opinión sobre esta serie.</p>

            <form
              className="review-form"
              onSubmit={handleReviewSubmit}
            >
              <label id="review-rating-label">
                Tu puntuación
              </label>

              <div
                className="review-rating-row"
                role="group"
                aria-labelledby="review-rating-label"
              >
                <div className="review-star-selector">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`review-star-button ${
                        star <= reviewRating ? 'selected' : ''
                      }`}
                      onClick={() => setReviewRating(star)}
                      disabled={reviewLoading}
                      aria-label={`${star} de 5 estrellas`}
                      aria-pressed={reviewRating === star}
                    >
                      {star <= reviewRating ? '★' : '☆'}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className={`review-favorite-button ${
                    fav ? 'on' : ''
                  }`}
                  onClick={() => toggleFavorite(series)}
                  aria-label={
                    fav
                      ? 'Quitar serie de favoritos'
                      : 'Agregar serie a favoritos'
                  }
                  aria-pressed={fav}
                  title={fav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                >
                  {fav ? '♥' : '♡'}
                </button>
              </div>

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
                {reviewLoading
                  ? 'Guardando…'
                  : editingReviewId
                    ? 'Guardar cambios'
                    : 'Publicar reseña'}
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
                  <span
                    className="review-rating"
                    aria-label={`${review.rating} de 5 estrellas`}
                  >
                    {'★'.repeat(review.rating)}
                  </span>

                  {review.userId === currentUserId && (
                    <div className="review-card-actions">
                      <button
                        className="review-icon-button"
                        type="button"
                        onClick={() => openEditReview(review)}
                        aria-label="Editar mi reseña"
                        title="Editar reseña"
                      >
                        ✎
                      </button>

                      <button
                        className="review-icon-button review-delete"
                        type="button"
                        onClick={() => handleReviewDelete(review.id)}
                        aria-label="Eliminar mi reseña"
                        title="Eliminar reseña"
                      >
                        ♲
                      </button>
                    </div>
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