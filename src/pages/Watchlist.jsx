import SeriesGrid from '../components/SeriesGrid'
import { useLists } from '../context/ListsContext'

export default function Watchlist() {
  const { watchlist } = useLists()
  return (
    <>
      <h1 className="page-title">Quiero ver</h1>
      <SeriesGrid series={watchlist} emptyMessage="Tu lista está vacía. Tocá + en una serie para dejarla pendiente." />
    </>
  )
}