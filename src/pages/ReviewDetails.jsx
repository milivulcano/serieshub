import { useEffect, useState } from 'react'

import {
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom'

import {
  getSeriesDetails,
  posterUrl,
} from '../services/tmdb'

import { getReviewById } from '../services/reviews'
import { useLists } from '../context/ListsContext'

function formatWatchedDate(date) {
  if (!date) return ''

  return new Date(
    `${date}T12:00:00`
  ).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export default function ReviewDetails() {
  const { reviewId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const { isFavorite } = useLists()

  const [review, setReview] = useState(null)
  const [series, setSeries] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller

    async function loadReview() {
      setLoading(true)
      setError('')
      setReview(null)
      setSeries(null)

      try {
        // Primero obtenemos la reseña desde Firebase.
        const reviewData = await getReviewById(reviewId)

        if (signal.aborted) return

        if (!reviewData) {
          setError(
            'No encontramos esta reseña. Es posible que haya sido eliminada.'
          )
          return
        }

        setReview(reviewData)

        // Después buscamos el póster y el año en TMDB.
        // Si falla TMDB, la reseña sigue siendo visible.
        try {
          const details = await getSeriesDetails(
            reviewData.seriesId,
            signal
          )

          if (!signal.aborted) {
            setSeries(details)
          }
        } catch (err) {
          if (err.name !== 'AbortError') {
            console.error(
              'No se pudieron cargar los detalles de la serie:',
              err
            )
          }
        }
      } catch (err) {
        if (!signal.aborted) {
          console.error(
            'Error al cargar la reseña:',
            err
          )

          setError(
            'No pudimos cargar la reseña. Revisá tu conexión e intentá nuevamente.'
          )
        }
      } finally {
        if (!signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadReview()

    return () => controller.abort()
  }, [reviewId])

  function goBack() {
    // Si llegamos desde Actividad reciente, volvemos al perfil.
    if (location.state?.from) {
      navigate(location.state.from)
      return
    }

    // Si abrimos un enlace directo, tenemos un destino seguro.
    if (window.history.state?.idx > 0) {
      navigate(-1)
    } else {
      navigate('/perfil?tab=actividad')
    }
  }

  const backButton = (
    <button
      className="back-btn"
      type="button"
      onClick={goBack}
    >
      ← Volver
    </button>
  )

  if (loading) {
    return (
      <>
        {backButton}
        <p className="message">
          Cargando reseña…
        </p>
      </>
    )
  }

  if (error || !review) {
    return (
      <>
        {backButton}

        <p
          className="message error"
          role="alert"
        >
          {error || 'No encontramos esta reseña.'}
        </p>
      </>
    )
  }

  const poster = posterUrl(
    series?.poster_path,
    'w500'
  )

  const year = series?.first_air_date?.slice(0, 4)

  const favorite = isFavorite(review.seriesId)

  return (
    <div className="review-details-page">
      {backButton}

      <article className="review-details-card">
        <div className="review-modal-layout">
          <div className="review-modal-poster">
            {poster ? (
              <img
                src={poster}
                alt={`Póster de ${review.seriesName}`}
              />
            ) : (
              <div className="no-poster">
                Sin póster
              </div>
            )}
          </div>

          <div className="review-modal-content">
            <h1 className="review-details-title">
              {review.seriesName}

              {year && (
                <span className="details-year">
                  {' '}({year})
                </span>
              )}
            </h1>

            <div className="review-details-date">
              <span>Vista el</span>

              <strong>
                {review.watchedAt
                  ? formatWatchedDate(review.watchedAt)
                  : 'Fecha no registrada'}
              </strong>
            </div>

            <div className="review-details-rating">
              <span
                className="review-rating"
                aria-label={`${review.rating} de 5 estrellas`}
              >
                {'★'.repeat(review.rating)}
              </span>

              {favorite && (
                <span
                  className="review-details-heart"
                  aria-label="En favoritos"
                  title="En favoritos"
                >
                  ♥
                </span>
              )}
            </div>

            <div className="review-details-text-section">
              <h2>Mi reseña</h2>

              <p className="review-text">
                {review.text}
              </p>
            </div>
          </div>
        </div>
      </article>
    </div>
  )
}