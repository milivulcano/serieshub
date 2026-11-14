import DatePicker from '../components/DatePicker'
import { useEffect, useState } from 'react'

import {
  getSeriesDetails,
  posterUrl,
  searchSeries,
} from '../services/tmdb'

import { createReview } from '../services/reviews'
import { useLists } from '../context/ListsContext'

function getTodayDate() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export default function QuickReview({ open, onClose }) {
  const {
    ready,
    isFavorite,
    isWatched,
    toggleFavorite,
    toggleWatched,
  } = useLists()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')

  const [series, setSeries] = useState(null)
  const [loadingSeries, setLoadingSeries] = useState(false)
  const [seriesError, setSeriesError] = useState('')

  const [reviewRating, setReviewRating] = useState(0)
  const [reviewFavorite, setReviewFavorite] = useState(false)
  const [reviewText, setReviewText] = useState('')
  const [reviewDate, setReviewDate] = useState(getTodayDate())
  const [reviewSaving, setReviewSaving] = useState(false)
  const [reviewError, setReviewError] = useState('')

  const [successMessage, setSuccessMessage] = useState('')

  // Reiniciamos todo cuando se cierra el acceso rápido.
  useEffect(() => {
    if (open) return

    setQuery('')
    setResults([])
    setSearching(false)
    setSearchError('')

    setSeries(null)
    setLoadingSeries(false)
    setSeriesError('')

    setReviewRating(0)
    setReviewFavorite(false)
    setReviewText('')
    setReviewDate(getTodayDate())
    setReviewSaving(false)
    setReviewError('')

    setSuccessMessage('')
  }, [open])

  // Buscador con espera de 400 ms, igual que los del perfil.
  useEffect(() => {
    if (!open || series || query.trim().length < 2) {
      setResults([])
      setSearching(false)
      setSearchError('')
      return
    }

    const controller = new AbortController()

    const timeoutId = setTimeout(async () => {
      try {
        setSearching(true)
        setSearchError('')

        const data = await searchSeries(
          query.trim(),
          controller.signal
        )

        if (!controller.signal.aborted) {
          setResults(data ?? [])
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error al buscar series:', error)

          setSearchError(
            'No pudimos buscar series. Intentá nuevamente.'
          )
        }
      } finally {
        if (!controller.signal.aborted) {
          setSearching(false)
        }
      }
    }, 400)

    return () => {
      clearTimeout(timeoutId)
      controller.abort()
    }
  }, [open, query, series])

  function resetReviewForm() {
    setReviewRating(0)
    setReviewFavorite(false)
    setReviewText('')
    setReviewDate(getTodayDate())
    setReviewError('')
  }

  function closeModal() {
    if (reviewSaving) return
    onClose()
  }

  async function selectSeries(selectedSeries) {
    if (loadingSeries) return

    setLoadingSeries(true)
    setSeriesError('')
    setSearchError('')

    try {
      const details = await getSeriesDetails(selectedSeries.id)

      setSeries(details)
      setReviewFavorite(isFavorite(details.id))
      resetReviewForm()

      // El corazón comienza con el estado real de Favoritos.
      setReviewFavorite(isFavorite(details.id))
    } catch (error) {
      console.error('Error al cargar la serie:', error)

      setSeriesError(
        'No pudimos cargar los detalles de esta serie. Intentá nuevamente.'
      )
    } finally {
      setLoadingSeries(false)
    }
  }

  function returnToSearch() {
    if (reviewSaving) return

    setSeries(null)
    resetReviewForm()
    setSeriesError('')
    setResults([])
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!series || reviewSaving) return

    setReviewError('')

    if (!reviewText.trim()) {
      setReviewError('Escribí tu reseña antes de publicarla.')
      return
    }

    if (reviewText.trim().length > 1000) {
      setReviewError(
        'La reseña no puede superar los 1000 caracteres.'
      )
      return
    }

    if (reviewRating < 1 || reviewRating > 5) {
      setReviewError('Elegí una puntuación con las estrellas.')
      return
    }

    if (!reviewDate) {
      setReviewError(
        'Seleccioná la fecha en que viste la serie.'
      )
      return
    }

    if (reviewDate > getTodayDate()) {
      setReviewError(
        'La fecha no puede ser posterior al día de hoy.'
      )
      return
    }

    if (!ready) {
      setReviewError(
        'Tu biblioteca todavía se está cargando. Intentá nuevamente.'
      )
      return
    }

    setReviewSaving(true)

    try {
      await createReview({
        seriesId: series.id,
        seriesName: series.name,
        rating: reviewRating,
        text: reviewText.trim(),
        watchedAt: reviewDate,
      })

      // Aplicamos el corazón después de publicar correctamente.
      if (reviewFavorite !== isFavorite(series.id)) {
        toggleFavorite(series)
      }

      // Reseñar también marca la serie como vista.
      if (!isWatched(series.id)) {
        toggleWatched(series)
      }

      setSuccessMessage(
        `¡Tu reseña de ${series.name} se publicó correctamente!`
      )
    } catch (error) {
      console.error('Error al publicar la reseña:', error)

      setReviewError(
        'No pudimos publicar la reseña. Revisá tu conexión e intentá nuevamente.'
      )
    } finally {
      setReviewSaving(false)
    }
  }

  if (!open) return null

  const poster = series
    ? posterUrl(series.poster_path, 'w500')
    : null

  const year = series?.first_air_date?.slice(0, 4)

  return (
    <div
      className="review-modal-overlay"
      onClick={closeModal}
    >
      <div
        className="review-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-review-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="review-modal-close"
          onClick={closeModal}
          aria-label="Cerrar ventana"
          disabled={reviewSaving}
        >
          ✕
        </button>

        {successMessage ? (
          <div className="quick-review-success">
            <h2 id="quick-review-title">
              ¡Reseña publicada!
            </h2>

            <p className="profile-success" role="status">
              {successMessage}
            </p>

            <p>
              Ya podés encontrarla en tu historial de Actividad.
            </p>

            <button
              type="button"
              className="detail-btn on"
              onClick={closeModal}
            >
              Cerrar
            </button>
          </div>
        ) : !series ? (
          <div className="quick-review-search">
            <h2 id="quick-review-title">
              ¿Qué serie querés reseñar?
            </h2>

            <p className="quick-review-description">
              Buscá una serie y seleccionala para escribir tu reseña.
            </p>

            <input
              className="search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar una serie..."
              aria-label="Buscar serie para reseñar"
              autoFocus
              disabled={loadingSeries}
            />

            {query.trim().length < 2 && (
              <p className="message">
                Escribí al menos dos caracteres para buscar.
              </p>
            )}

            {searching && (
              <p className="message">Buscando series…</p>
            )}

            {loadingSeries && (
              <p className="message">
                Cargando detalles de la serie…
              </p>
            )}

            {searchError && (
              <p className="message error" role="alert">
                {searchError}
              </p>
            )}

            {seriesError && (
              <p className="message error" role="alert">
                {seriesError}
              </p>
            )}

            {!searching &&
              !loadingSeries &&
              !searchError &&
              query.trim().length >= 2 &&
              results.length === 0 && (
                <p className="message">
                  No encontramos series con ese nombre.
                </p>
              )}

            {results.length > 0 && (
              <div className="quick-review-results">
                {results.map((result) => {
                  const resultPoster = posterUrl(
                    result.poster_path,
                    'w92'
                  )

                  return (
                    <button
                      key={result.id}
                      type="button"
                      className="quick-review-result"
                      onClick={() => selectSeries(result)}
                      disabled={loadingSeries}
                    >
                      <div className="quick-review-result-poster">
                        {resultPoster ? (
                          <img
                            src={resultPoster}
                            alt=""
                            loading="lazy"
                          />
                        ) : (
                          <span>Sin póster</span>
                        )}
                      </div>

                      <span className="quick-review-result-info">
                        <strong>{result.name}</strong>

                        <small>
                          {result.first_air_date
                            ? result.first_air_date.slice(0, 4)
                            : 'Año desconocido'}
                        </small>
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="quick-review-back-row">
              <button
                type="button"
                className="back-btn"
                onClick={returnToSearch}
                disabled={reviewSaving}
              >
                ← Buscar otra serie
              </button>
            </div>

            <div className="review-modal-layout">
              <div className="review-modal-poster">
                {poster ? (
                  <img
                    src={poster}
                    alt={`Póster de ${series.name}`}
                  />
                ) : (
                  <div className="no-poster">
                    Sin póster
                  </div>
                )}
              </div>

              <div className="review-modal-content">
                <h2 id="quick-review-title">
                  {series.name}
                  {year && (
                    <span className="details-year">
                      {' '}({year})
                    </span>
                  )}
                </h2>

                <form
                  className="review-form"
                  onSubmit={handleSubmit}
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
                            star <= reviewRating
                              ? 'selected'
                              : ''
                          }`}
                          onClick={() => setReviewRating(star)}
                          disabled={reviewSaving}
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
                      disabled={reviewSaving}
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
                    >
                      {reviewFavorite ? '♥' : '♡'}
                    </button>
                  </div>

                  <label htmlFor="quick-review-text">
                    Tu reseña
                  </label>

                  <textarea
                    id="quick-review-text"
                    value={reviewText}
                    onChange={(event) =>
                      setReviewText(event.target.value)
                    }
                    placeholder={`¿Qué te pareció ${series.name}?`}
                    maxLength={1000}
                    rows={5}
                    required
                    disabled={reviewSaving}
                  />

                  <p className="review-counter">
                    {reviewText.length}/1000 caracteres
                  </p>

                  <div className="review-date-field">
                    <label htmlFor="quick-review-date">
                      Vista el
                    </label>

                    <DatePicker id="quick-review-date" value={reviewDate} max={getTodayDate()} onChange={setReviewDate} required disabled={reviewSaving} />
                  </div>

                  {reviewError && (
                    <p
                      className="message error"
                      role="alert"
                    >
                      {reviewError}
                    </p>
                  )}

                  <button
                    className="detail-btn on"
                    type="submit"
                    disabled={reviewSaving || !ready}
                  >
                    {reviewSaving
                      ? 'Publicando…'
                      : 'Publicar reseña'}
                  </button>
                </form>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}