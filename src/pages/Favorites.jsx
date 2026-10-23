import SeriesGrid from '../components/SeriesGrid'
import { useLists } from '../context/ListsContext'

export default function Favorites() {
  const { favorites } = useLists()
  return (
    <>
      <h1 className="page-title">Favoritos</h1>
      <SeriesGrid series={favorites} emptyMessage="Todavía no marcaste favoritas. Tocá ♡ en cualquier serie para guardarla acá." />
    </>
  )
}