import { Link } from 'react-router-dom'
import { posterUrl } from '../services/tmdb'
import { useLists } from '../context/ListsContext'

export default function SeriesCard({ series }) {
  const {
    isFavorite,
    isInWatchlist,
    toggleFavorite,
    toggleWatchlist,
  } = useLists()

  const fav = isFavorite(series.id)
  const later = isInWatchlist(series.id)
  const poster = posterUrl(series.poster_path)
  const year = series.first_air_date?.slice(0, 4)
  const detailsPath = `/serie/${series.id}`

  return (
    <article className="card">
      <div className="poster">
        <Link
          to={detailsPath}
          className="poster-link"
          aria-label={`Ver ficha de ${series.name}`}
        >
          {poster ? (
            <img
              src={poster}
              alt={`Póster de ${series.name}`}
              loading="lazy"
            />
          ) : (
            <div className="no-poster">Sin póster</div>
          )}
        </Link>

        <div className="actions">
          <button
            className={`icon-btn ${fav ? 'on' : ''}`}
            onClick={() => toggleFavorite(series)}
            aria-pressed={fav}
            aria-label={
              fav ? 'Quitar de favoritos' : 'Agregar a favoritos'
            }
            title={fav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          >
            {fav ? '♥' : '♡'}
          </button>

          <button
            className={`icon-btn ${later ? 'on' : ''}`}
            onClick={() => toggleWatchlist(series)}
            aria-pressed={later}
            aria-label={
              later ? 'Quitar de Quiero ver' : 'Agregar a Quiero ver'
            }
            title={later ? 'Quitar de Quiero ver' : 'Agregar a Quiero ver'}
          >
            {later ? '✓' : '+'}
          </button>
        </div>
      </div>

      <h3 className="card-title">
        <Link to={detailsPath} className="title-link">
          {series.name}
        </Link>
      </h3>

      <p className="card-meta">
        {year || 'Sin fecha'}
        {series.vote_average > 0 &&
          ` · ★ ${series.vote_average.toFixed(1)}`}
      </p>
    </article>
  )
}