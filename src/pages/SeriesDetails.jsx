import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  getSeriesDetails,
  getSeriesVideos,
  getWatchProviders,
  posterUrl,
} from '../services/tmdb'
import { useLists } from '../context/ListsContext'

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
    toggleFavorite,
    toggleWatchlist,
  } = useLists()

  const [series, setSeries] = useState(null)
  const [trailer, setTrailer] = useState(null)
  const [providers, setProviders] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
  const poster = posterUrl(series.poster_path, 'w500')
  const backdrop = posterUrl(series.backdrop_path, 'w780')
  const year = series.first_air_date?.slice(0, 4)
  const creators = series.created_by?.map((creator) => creator.name).join(', ')

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
                <p className="details-original">{series.original_name}</p>
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

            <div className="detail-actions">
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
            </div>
          </div>
        </div>
      </section>

      <section className="details-section">
        <h2 className="section-title">Sinopsis</h2>

        <p className="details-overview">
          {series.overview ||
            'Todavía no hay sinopsis disponible en español para esta serie.'}
        </p>

        {creators && (
          <p className="card-meta">Creada por {creators}</p>
        )}
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

      <section className="details-section">
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
      </section>
    </>
  )
}