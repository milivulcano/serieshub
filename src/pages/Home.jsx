import { useEffect, useState } from 'react'
import SearchBar from '../components/SearchBar'
import SeriesGrid from '../components/SeriesGrid'
import PopularForums from '../components/PopularForums'
import { searchSeries, getTrendingSeries } from '../services/tmdb'

export default function Home() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const term = query.trim()

  useEffect(() => {
    const controller = new AbortController()

    const timer = setTimeout(async () => {
      setLoading(true)
      setError('')

      try {
        const data = term
          ? await searchSeries(term, controller.signal)
          : await getTrendingSeries(controller.signal)

        if (!controller.signal.aborted) {
          setResults(data ?? [])
        }
      } catch (err) {
        if (err.name !== 'AbortError' && !controller.signal.aborted) {
          setError(err.message)
          setResults([])
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, term ? 400 : 0)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [term])

  return (
    <>
      <section className="hero">
        <h1>Encontrá tu próxima serie</h1>
        <p>Buscá, guardá lo que querés ver y marcá tus favoritas.</p>
        <SearchBar value={query} onChange={setQuery} />
      </section>

      <section aria-labelledby="home-series-title">
        <h2 className="section-title" id="home-series-title">
          {term ? `Resultados para “${term}”` : 'En tendencia esta semana'}
        </h2>

        {error && <p className="message error" role="alert">{error}</p>}
        {loading && <p className="message">Cargando…</p>}
        {!error && !loading && (
          <SeriesGrid
            series={results}
            emptyMessage="No encontramos series con ese nombre. Probá con otro título."
          />
        )}
      </section>

      {!term && <PopularForums />}
    </>
  )
}