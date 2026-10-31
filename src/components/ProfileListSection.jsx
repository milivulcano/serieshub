import SeriesGrid from './SeriesGrid'

export default function ProfileListSection({
  title,
  series,
  ready,
  emptyMessage,
}) {
  if (!ready) {
    return (
      <section>
        <h2 className="section-title">{title}</h2>
        <p className="message">Cargando series…</p>
      </section>
    )
  }

  return (
    <section>
      <h2 className="section-title">{title}</h2>

      <SeriesGrid
        series={series}
        emptyMessage={emptyMessage}
      />
    </section>
  )
}