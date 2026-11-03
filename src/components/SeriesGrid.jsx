import SeriesCard from './SeriesCard'

export default function SeriesGrid({ series, emptyMessage, className = '' }) {
  if (series.length === 0) {
    return <p className="empty">{emptyMessage}</p>
  }
  return (
    <div className={`grid ${className}`.trim()}>
      {series.map((s) => (
        <SeriesCard key={s.id} series={s} />
      ))}
    </div>
  )
}