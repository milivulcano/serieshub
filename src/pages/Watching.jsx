import { useLists } from '../context/ListsContext'
import SeriesGrid from '../components/SeriesGrid'

export default function Watching() {
  const { watching, ready } = useLists()

  if (!ready) {
    return <p className="message">Cargando tus series…</p>
  }

  return (
    <section>
      <h1 className="page-title">La estoy viendo</h1>

      <SeriesGrid
        series={watching}
        emptyMessage="Todavía no agregaste series a esta lista. Explorá SeriesHub y tocá ▷ para empezar."
      />
    </section>
  )
}