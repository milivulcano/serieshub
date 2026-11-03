const stats = [
  { key: 'series', label: 'Series', icon: 'eye', list: 'watched' },
  { key: 'pendientes', label: 'Pendientes', icon: 'bookmark', list: 'watchlist' },
  { key: 'viendo', label: 'Viendo', icon: 'play', list: 'watching' },
  { key: 'favoritos', label: 'Favoritos', icon: 'heart', list: 'favorites' },
]

function StatIcon({ name }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="21"
      height="21"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {name === 'eye' && (
        <>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
      {name === 'bookmark' && (
        <path d="M5 4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v18l-7-4-7 4V4Z" />
      )}
      {name === 'play' && (
        <>
          <circle cx="12" cy="12" r="10" />
          <path d="m10 8 6 4-6 4V8Z" />
        </>
      )}
      {name === 'heart' && (
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
      )}
    </svg>
  )
}

export default function ProfileStats({
  ready,
  watched,
  watchlist,
  watching,
  favorites,
  onSelectTab,
}) {
  const lists = { watched, watchlist, watching, favorites }

  return (
    <section
      className="profile-stats-card"
      aria-labelledby="profile-stats-title"
    >
      <h2 id="profile-stats-title">Estadísticas</h2>

      <div className="profile-stats-list">
        {stats.map((stat) => (
          <button
            key={stat.key}
            type="button"
            className="profile-stats-row"
            onClick={() => onSelectTab(stat.key)}
            title={`Ver ${stat.label.toLowerCase()}`}
          >
            <span className="profile-stats-icon">
              <StatIcon name={stat.icon} />
            </span>

            <span className="profile-stats-label">
              {stat.label}
            </span>

            <strong
              className="profile-stats-count"
              aria-label={
                ready
                  ? `${lists[stat.list].length} series`
                  : 'Cargando'
              }
            >
              {ready ? lists[stat.list].length : '—'}
            </strong>
          </button>
        ))}
      </div>
    </section>
  )
}