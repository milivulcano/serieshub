import SeriesGrid from '../components/SeriesGrid'
import { useLists } from '../context/ListsContext'

export default function Watched() {
  const { watched } = useLists()

  return (
    <>
      <h1 className="page-title">Ya la vi</h1>
      <SeriesGrid
        series={watched}
        emptyMessage="Todavía no marcaste series como vistas. Entrá a una serie y tocá «Ya la vi» para guardarla acá."
      />
    </>
  )
}