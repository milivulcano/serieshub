import { NavLink } from 'react-router-dom'
import { useLists } from '../context/ListsContext'

export default function Header() {
  const { favorites, watchlist } = useLists()

  return (
    <header className="header">
      <div className="container header-inner">
        <NavLink to="/" className="logo">SeriesHub</NavLink>
        <nav className="nav">
          <NavLink to="/" end>Descubrir</NavLink>
          <NavLink to="/quiero-ver">Quiero ver <span className="count">{watchlist.length}</span></NavLink>
          <NavLink to="/favoritos">Favoritos <span className="count">{favorites.length}</span></NavLink>
        </nav>
      </div>
    </header>
  )
}