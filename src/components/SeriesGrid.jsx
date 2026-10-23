import SeriesCard from './SeriesCard'

export default function SeriesGrid({ series, emptyMessage }) {
  if (series.length === 0) {
    return <p className="empty">{emptyMessage}</p>
  }
  return (
    <div className="grid">
      {series.map((s) => (
        <SeriesCard key={s.id} series={s} />
      ))}
    </div>
  )
}