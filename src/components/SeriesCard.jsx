import { Link } from 'react-router-dom'
import { posterUrl } from '../services/tmdb'

export default function SeriesCard({ series }) {
  const poster = posterUrl(series.poster_path)

  return (
    <article className="card">
      <Link
        to={`/serie/${series.id}`}
        className="poster poster-link"
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

        <span className="poster-overlay">
          <span className="poster-overlay-title">
            {series.name}
          </span>
        </span>
      </Link>
    </article>
  )
}