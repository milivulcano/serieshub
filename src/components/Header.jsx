import { Link, NavLink } from 'react-router-dom'

export default function Header() {
  return (
    <header className="header">
      <div className="container header-inner">
        <Link to="/" className="logo">
          SeriesHub
        </Link>

        <nav className="nav main-nav" aria-label="Navegación principal">
          <NavLink to="/" end>
            Descubrir
          </NavLink>

          <div className="profile-menu">
            <NavLink to="/perfil" className="profile-menu-link">
              Mi perfil
              <span className="dropdown-arrow" aria-hidden="true">▾</span>
            </NavLink>

            <div className="profile-dropdown">
              <Link to="/perfil?tab=series">Series</Link>
              <Link to="/perfil?tab=pendientes">Pendientes</Link>
              <Link to="/perfil?tab=favoritos">Favoritos</Link>
              <Link to="/perfil?tab=actividad">Actividad</Link>
              <Link to="/perfil?tab=viendo">Viendo</Link>
            </div>
          </div>
        </nav>
      </div>
    </header>
  )
}