import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import QuickReview from './QuickReview'
import { posterUrl, searchSeries } from '../services/tmdb'

export default function Header() {
  const navigate = useNavigate()
  const searchAreaRef = useRef(null)
  const searchInputRef = useRef(null)
  const [quickReviewOpen, setQuickReviewOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function closeSearch() {
    setSearchOpen(false)
    setQuery('')
    setResults([])
    setError('')
  }

  useEffect(() => {
    if (!searchOpen) return
    searchInputRef.current?.focus()

    function onKeyDown(event) {
      if (event.key === 'Escape') closeSearch()
    }
    function onPointerDown(event) {
      if (!searchAreaRef.current?.contains(event.target)) closeSearch()
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [searchOpen])

  useEffect(() => {
    if (!searchOpen || query.trim().length < 2) {
      setResults([])
      setLoading(false)
      setError('')
      return
    }
    const controller = new AbortController()
    const timeoutId = setTimeout(async () => {
      setLoading(true)
      setError('')
      try {
        const data = await searchSeries(query.trim(), controller.signal)
        if (!controller.signal.aborted) setResults((data ?? []).slice(0, 8))
      } catch (err) {
        if (err.name !== 'AbortError' && !controller.signal.aborted) {
          setResults([])
          setError('No se pudo buscar. Intentá nuevamente.')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 350)
    return () => {
      clearTimeout(timeoutId)
      controller.abort()
    }
  }, [query, searchOpen])

  function selectSeries(id) {
    closeSearch()
    navigate(`/serie/${id}`)
  }

  return (
    <>
      <header className="header">
        <div className="container header-inner">
          <Link to="/" className="logo" onClick={closeSearch}>
            <img src="/assets/logos/isologo-serieshub.svg" alt="SeriesHub" className="site-isologo" />
          </Link>

          <nav className="nav main-nav" aria-label="Navegación principal">
            <NavLink to="/" end onClick={closeSearch}>Descubrir</NavLink>

            <div className="profile-menu">
              <NavLink to="/perfil" className="profile-menu-link" onClick={closeSearch}>
                Mi perfil
                <span className="dropdown-arrow" aria-hidden="true">▾</span>
              </NavLink>
              <div className="profile-dropdown">
                <Link to="/perfil?tab=series" onClick={closeSearch}>Series</Link>
                <Link to="/perfil?tab=pendientes" onClick={closeSearch}>Pendientes</Link>
                <Link to="/perfil?tab=favoritos" onClick={closeSearch}>Favoritos</Link>
                <Link to="/perfil?tab=diario" onClick={closeSearch}>Diario</Link>
                <Link to="/perfil?tab=viendo" onClick={closeSearch}>Viendo</Link>
              </div>
            </div>

            <div className="header-search-area" ref={searchAreaRef}>
              <button
                type="button"
                className={`header-search-toggle${searchOpen ? ' is-open' : ''}`}
                aria-label={searchOpen ? 'Cerrar buscador' : 'Buscar una serie'}
                aria-expanded={searchOpen}
                aria-controls="header-series-search"
                onClick={() => searchOpen ? closeSearch() : setSearchOpen(true)}
              >
                {searchOpen ? (
                  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg>
                )}
              </button>

              {searchOpen && (
                <div className="header-search-popover" id="header-series-search">
                  <label htmlFor="header-search-input">Buscar una serie</label>
                  <input
                    ref={searchInputRef}
                    id="header-search-input"
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Escribí el nombre de una serie…"
                    autoComplete="off"
                  />
                  {query.trim().length < 2 ? (
                    <p className="header-search-hint">Escribí al menos dos letras.</p>
                  ) : loading ? (
                    <p className="header-search-hint" role="status">Buscando…</p>
                  ) : error ? (
                    <p className="header-search-hint error" role="alert">{error}</p>
                  ) : results.length ? (
                    <ul className="header-search-results">
                      {results.map((series) => (
                        <li key={series.id}>
                          <button type="button" onClick={() => selectSeries(series.id)}>
                            {series.poster_path ? (
                              <img src={posterUrl(series.poster_path, 'w92')} alt="" loading="lazy" />
                            ) : <span className="header-search-no-poster">TV</span>}
                            <span>
                              <strong>{series.name}</strong>
                              <small>{series.first_air_date?.slice(0, 4) || 'Serie'}</small>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="header-search-hint">No encontramos series con ese nombre.</p>
                  )}
                </div>
              )}
            </div>

            <button
              className="quick-review-header-button"
              type="button"
              onClick={() => {
                closeSearch()
                setQuickReviewOpen(true)
              }}
            >
              + Reseñar
            </button>
          </nav>
        </div>
      </header>

      <QuickReview open={quickReviewOpen} onClose={() => setQuickReviewOpen(false)} />
    </>
  )
}