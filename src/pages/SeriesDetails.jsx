import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  getSeriesDetails,
  getSeriesVideos,
  getWatchProviders,
  getSeriesCredits,
  getSimilarSeries,
  posterUrl,
  profileUrl,
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

// Devuelve la fecha actual usando la zona horaria local.
function getTodayDate() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function pickTrailer(videos) {
  const youtube = videos.filter((video) => video.site === 'YouTube')

  return (
    youtube.find((video) => video.type === 'Trailer' && video.official) ||
    youtube.find((video) => video.type === 'Trailer') ||
    youtube.find((video) => video.type === 'Teaser') ||
    null
  )
}


// Iconos SVG consistentes con el resto de la interfaz.
function DetailIcon({ name, size = 20, active = false }) {
  const mainFill = active ? 'currentColor' : 'none'
  const paths = {
    eye: <>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" fill={mainFill}/>
      <circle cx="12" cy="12" r="3" fill={active ? 'var(--surface)' : 'none'}/>
    </>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" fill={mainFill}/>,
    clock: <>
      <circle cx="12" cy="12" r="9" fill={mainFill}/>
      <path d="M12 7v5l3 2" stroke={active ? 'var(--surface)' : 'currentColor'}/>
    </>,
    play: <path d="m8 5 11 7-11 7V5Z" fill={mainFill}/>,
    pencil: <><path d="m15 5 4 4M4 20l4.3-.8L20 7.5 16.5 4 4.8 15.7 4 20Z"/></>,
    chevronLeft: <path d="m15 18-6-6 6-6"/>,
    chevronRight: <path d="m9 18 6-6-6-6"/>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3-7 8-7s8 3 8 7"/></>,
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true" focusable="false">
      {paths[name]}
    </svg>
  )
}

// Carrusel por páginas completas: seis personas a la vez y transición suave.
// Todas las páginas mantienen la misma altura, incluso con textos largos.
function PeopleCarousel({ people, mode }) {
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 6
  const totalPages = Math.ceil(people.length / PAGE_SIZE)
  const currentPage = Math.min(page, Math.max(0, totalPages - 1))

  if (!people.length) {
    return <p className="empty">No hay información disponible para esta serie.</p>
  }

  const pages = Array.from({ length: totalPages }, (_, index) =>
    people.slice(index * PAGE_SIZE, (index + 1) * PAGE_SIZE)
  )

  return (
    <div className="detail-people">
      <div className="detail-people-viewport">
        <div
          className="detail-people-track"
          style={{ transform: `translateX(-${currentPage * 100}%)` }}
        >
          {pages.map((pagePeople, index) => (
            <div
              className="detail-people-grid detail-people-page"
              key={`${mode}-page-${index}`}
              aria-hidden={index !== currentPage}
            >
              {pagePeople.map((person) => {
                const photo = profileUrl(person.profile_path, 'w185')
                const role = mode === 'cast'
                  ? person.roles?.map((item) => item.character).filter(Boolean).join(', ') || 'Reparto'
                  : person.jobs?.map((item) => item.job).filter(Boolean).join(', ') || person.department || 'Equipo'

                return (
                  <article className="detail-person-card" key={person.id}>
                    <div className="detail-person-photo">
                      {photo ? (
                        <img src={photo} alt={`Foto de ${person.name}`} loading="lazy" />
                      ) : (
                        <DetailIcon name="user" size={36} />
                      )}
                    </div>
                    <strong title={person.name}>{person.name}</strong>
                    <span title={role}>{role}</span>
                  </article>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="detail-carousel-controls" aria-label="Navegar por las personas">
          <span className="detail-carousel-page">{currentPage + 1} de {totalPages}</span>
          <button type="button" disabled={currentPage === 0}
            onClick={() => setPage((current) => Math.max(0, current - 1))}
            aria-label="Ver las seis personas anteriores">
            <DetailIcon name="chevronLeft" />
          </button>
          <button type="button" disabled={currentPage >= totalPages - 1}
            onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
            aria-label="Ver las seis personas siguientes">
            <DetailIcon name="chevronRight" />
          </button>
        </div>
      )}
    </div>
  )
}

// Usa el mismo póster con overlay y opacidad que SeriesCard en la Home.
function SimilarSeries({ items }) {
  if (!items.length) {
    return <p className="empty">Todavía no hay series similares disponibles.</p>
  }

  return (
    <div className="detail-similar-grid">
      {items.map((item) => (
        <article className="card detail-similar-card" key={item.id}>
          <Link
            to={`/serie/${item.id}`}
            className="poster poster-link"
            aria-label={`Ver ficha de ${item.name}`}
          >
            {item.poster_path ? (
              <img
                src={posterUrl(item.poster_path, 'w342')}
                alt={`Póster de ${item.name}`}
                loading="lazy"
              />
            ) : (
              <span className="no-poster">Sin póster</span>
            )}
            <span className="poster-overlay">
              <span className="poster-overlay-title">{item.name}</span>
            </span>
          </Link>
        </article>
      ))}
    </div>
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
  const [mediaTab, setMediaTab] = useState('trailer')
  const [synopsisExpanded, setSynopsisExpanded] = useState(false)
  const [credits, setCredits] = useState(null)
  const [similar, setSimilar] = useState(null)
  const [mediaLoading, setMediaLoading] = useState(false)
  const [mediaError, setMediaError] = useState('')
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
  const [reviewDate, setReviewDate] = useState(getTodayDate)

  // Estado temporal del corazón dentro del formulario.
  const [reviewFavorite, setReviewFavorite] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller

    async function load() {
      setLoading(true)
      setError('')
      setSeries(null)
      setMediaTab('trailer')
      setSynopsisExpanded(false)
      setCredits(null)
      setSimilar(null)

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

  // La ficha principal sigue visible. Solo consultamos los datos de la pestaña seleccionada.
  useEffect(() => {
    if (mediaTab === 'trailer') return
    if ((mediaTab === 'reparto' || mediaTab === 'equipo') && credits) return
    if (mediaTab === 'similares' && similar) return

    const controller = new AbortController()
    let active = true
    setMediaLoading(true)
    setMediaError('')
    const requestData = mediaTab === 'similares'
      ? getSimilarSeries(id, controller.signal)
      : getSeriesCredits(id, controller.signal)

    requestData.then((data) => {
      if (!active) return
      if (mediaTab === 'similares') setSimilar(data)
      else setCredits(data)
    }).catch((err) => {
      if (active && err.name !== 'AbortError') {
        console.error('No se pudo cargar la sección de TMDB:', err)
        setMediaError('No pudimos cargar esta información. Intentá cambiar de pestaña y volver.')
      }
    }).finally(() => { if (active) setMediaLoading(false) })

    return () => { active = false; controller.abort() }
  }, [id, mediaTab, credits, similar])

  function openNewReview() {
    setEditingReviewId(null)
    setReviewRating(0)
    setReviewText('')
    setReviewDate(getTodayDate())

    // Copiamos el estado actual de favoritos al formulario.
    setReviewFavorite(isFavorite(series.id))

    setReviewError('')
    setReviewMessage('')
    setReviewModalOpen(true)
  }

  function openEditReview(review) {
    setEditingReviewId(review.id)
    setReviewRating(review.rating)
    setReviewText(review.text)
    setReviewDate(review.watchedAt || getTodayDate())

    // Al editar, mostramos el estado actual de favoritos.
    setReviewFavorite(isFavorite(series.id))

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
    setReviewDate(getTodayDate())
    setReviewFavorite(false)
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

    if (!reviewDate) {
      setReviewError('Seleccioná la fecha en que viste la serie.')
      return
    }

    if (reviewDate > getTodayDate()) {
      setReviewError('La fecha no puede ser posterior al día de hoy.')
      return
    }

    setReviewLoading(true)

    try {
      const reviewData = {
        seriesId: series.id,
        seriesName: series.name,
        rating: reviewRating,
        text: reviewText,
        watchedAt: reviewDate,
      }

      if (editingReviewId) {
        await updateReview(editingReviewId, reviewData)
      } else {
        await createReview(reviewData)
      }

      // Aplicamos el cambio de favoritos recién después
      // de guardar correctamente la reseña.
      const currentFavorite = isFavorite(series.id)

      if (reviewFavorite !== currentFavorite) {
        toggleFavorite(series)
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
      setReviewDate(getTodayDate())
      setReviewRating(0)
      setReviewFavorite(false)

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

              <p className={`details-overview ${synopsisExpanded ? 'expanded' : ''}`}>
                {series.overview ||
                  'Todavía no hay sinopsis disponible en español para esta serie.'}
              </p>
              {series.overview?.length > 230 && (
                <button
                  className="details-read-more"
                  type="button"
                  aria-expanded={synopsisExpanded}
                  onClick={() => setSynopsisExpanded((value) => !value)}
                >
                  {synopsisExpanded ? 'Leer menos' : 'Leer más'}
                </button>
              )}

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

      <div className="details-lower-layout details-media-layout">
        <section className="details-section detail-actions-section" aria-label="Acciones de biblioteca">
          <div className="detail-library-actions">
            <button type="button" className={`detail-library-action ${watching ? 'on' : ''}`}
              onClick={() => toggleWatching(series)} aria-pressed={watching}>
              <DetailIcon name="play" active={watching} />
              <span>La estoy viendo</span>
            </button>
            <button type="button" className={`detail-library-action ${watched ? 'on' : ''}`}
              onClick={() => toggleWatched(series)} aria-pressed={watched}>
              <DetailIcon name="eye" active={watched} />
              <span>Ya la vi</span>
            </button>
            <button type="button" className={`detail-library-action ${later ? 'on' : ''}`}
              onClick={() => toggleWatchlist(series)} aria-pressed={later}>
              <DetailIcon name="clock" active={later} />
              <span>Quiero ver</span>
            </button>
            <button type="button" className={`detail-library-action ${fav ? 'on' : ''}`}
              onClick={() => toggleFavorite(series)} aria-pressed={fav}>
              <DetailIcon name="heart" active={fav} />
              <span>Favoritos</span>
            </button>
            <button type="button" className="detail-library-action" onClick={openNewReview}>
              <DetailIcon name="pencil" />
              <span>Reseñar</span>
            </button>
          </div>
        </section>

        <section className="details-section details-media-section" aria-label="Contenido adicional de la serie">
          <div className="detail-media-tabs" role="tablist" aria-label="Información de la serie">
            {[
              ['trailer', 'Tráiler'],
              ['reparto', 'Reparto'],
              ['equipo', 'Equipo'],
              ['similares', 'Series similares'],
            ].map(([key, label]) => (
              <button key={key} type="button" role="tab"
                id={`detail-tab-${key}`} aria-controls="detail-media-panel"
                aria-selected={mediaTab === key}
                className={mediaTab === key ? 'active' : ''}
                onClick={() => setMediaTab(key)}>{label}</button>
            ))}
          </div>
          <div className="detail-media-panel" id="detail-media-panel" role="tabpanel"
            aria-labelledby={`detail-tab-${mediaTab}`}>
            {mediaTab === 'trailer' && (
              trailer ? (
                <div className="trailer">
                  <iframe src={`https://www.youtube-nocookie.com/embed/${trailer.key}`}
                    title={`Tráiler de ${series.name}`}
                    allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen loading="lazy"/>
                </div>
              ) : <p className="empty">No encontramos un tráiler disponible para esta serie.</p>
            )}

            {mediaTab !== 'trailer' && mediaLoading && (
              <p className="message">Cargando información de TMDB…</p>
            )}
            {mediaTab !== 'trailer' && !mediaLoading && mediaError && (
              <p className="message error" role="alert">{mediaError}</p>
            )}
            {mediaTab === 'reparto' && !mediaLoading && !mediaError && credits && (
              <PeopleCarousel people={[...credits.cast].sort((a, b) => (a.order ?? 999) - (b.order ?? 999))} mode="cast"/>
            )}
            {mediaTab === 'equipo' && !mediaLoading && !mediaError && credits && (
              <PeopleCarousel people={credits.crew} mode="crew"/>
            )}
            {mediaTab === 'similares' && !mediaLoading && !mediaError && similar && (
              <>
                <h2 className="detail-similar-title">Podría interesarte...</h2>
                <SimilarSeries items={similar}/>
              </>
            )}
          </div>
        </section>
      </div>

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

            <div className="review-modal-layout">
              <div className="review-modal-poster">
                {poster ? (
                  <img
                    src={poster}
                    alt={`Póster de ${series.name}`}
                  />
                ) : (
                  <div className="no-poster">Sin póster</div>
                )}
              </div>

              <div className="review-modal-content">
                <h2 id="review-modal-title">
                  {series.name}
                  {year && (
                    <span className="details-year"> ({year})</span>
                  )}
                </h2>

                <form
                  className="review-form"
                  onSubmit={handleReviewSubmit}
                >
                  <div
                    className="review-rating-row"
                    role="group"
                    aria-label="Tu puntuación"
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
                        reviewFavorite ? 'on' : ''
                      }`}
                      onClick={() =>
                        setReviewFavorite((current) => !current)
                      }
                      aria-label={
                        reviewFavorite
                          ? 'Quitar serie de favoritos'
                          : 'Agregar serie a favoritos'
                      }
                      aria-pressed={reviewFavorite}
                      title={
                        reviewFavorite
                          ? 'Quitar de favoritos'
                          : 'Agregar a favoritos'
                      }
                      disabled={reviewLoading}
                    >
                      {reviewFavorite ? '♥' : '♡'}
                    </button>
                  </div>

                  <label htmlFor="review-text">
                    Tu reseña
                  </label>

                  <textarea
                    id="review-text"
                    value={reviewText}
                    onChange={(event) =>
                      setReviewText(event.target.value)
                    }
                    placeholder={`¿Qué te pareció ${series.name}?`}
                    maxLength={1000}
                    rows={5}
                    required
                    disabled={reviewLoading}
                  />

                  <p className="review-counter">
                    {reviewText.length}/1000 caracteres
                  </p>

                  <div className="review-date-field">
                    <label htmlFor="reviewDate">Vista el</label>

                    <input
                      id="reviewDate"
                      type="date"
                      value={reviewDate}
                      max={getTodayDate()}
                      onChange={(event) =>
                        setReviewDate(event.target.value)
                      }
                      required
                      disabled={reviewLoading}
                    />
                  </div>

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
                  <div className="review-card-rating">
                    <span
                      className="review-rating"
                      aria-label={`${review.rating} de 5 estrellas`}
                    >
                      {'★'.repeat(review.rating)}
                    </span>

                    {review.watchedAt && (
                      <p className="review-date">
                        {new Date(
                          `${review.watchedAt}T12:00:00`
                        ).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </p>
                    )}
                  </div>

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