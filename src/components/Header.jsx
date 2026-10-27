import { NavLink } from 'react-router-dom'
import { useLists } from '../context/ListsContext'

export default function Header() {
  const { favorites, watchlist, watching, watched } = useLists()

  return (
    <header className="header">
      <div className="container header-inner">
        <NavLink to="/" className="logo">
          SeriesHub
        </NavLink>

        <nav className="nav">
          <NavLink to="/" end>
            Descubrir
          </NavLink>

          <NavLink to="/viendo">
            Viendo <span className="count">{watching.length}</span>
          </NavLink>

          <NavLink to="/quiero-ver">
            Quiero ver <span className="count">{watchlist.length}</span>
          </NavLink>

          <NavLink to="/ya-la-vi">
            Ya la vi <span className="count">{watched.length}</span>
          </NavLink>

          <NavLink to="/favoritos">
            Favoritos <span className="count">{favorites.length}</span>
          </NavLink>
        </nav>
      </div>
    </header>
  )
}