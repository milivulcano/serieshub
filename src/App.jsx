import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'

import { ListsProvider } from './context/ListsContext'
import Header from './components/Header'

import Home from './pages/Home'
import SeriesDetails from './pages/SeriesDetails'
import ReviewDetails from './pages/ReviewDetails'
import GroupDetails from './pages/GroupDetails'
import Profile from './pages/Profile'

export default function App() {
  return (
    <BrowserRouter>
      <ListsProvider>
        <Header />

        <main className="container">
          <Routes>
            <Route path="/" element={<Home />} />

            <Route
              path="/serie/:id"
              element={<SeriesDetails />}
            />

            <Route
              path="/resena/:reviewId"
              element={<ReviewDetails />}
            />

            <Route
              path="/grupo/:groupId"
              element={<GroupDetails />}
            />

            <Route
              path="/perfil"
              element={<Profile />}
            />

            {/* Enlaces antiguos: redirigen a las pestañas del perfil */}
            <Route
              path="/ya-la-vi"
              element={
                <Navigate
                  to="/perfil?tab=series"
                  replace
                />
              }
            />

            <Route
              path="/quiero-ver"
              element={
                <Navigate
                  to="/perfil?tab=pendientes"
                  replace
                />
              }
            />

            <Route
              path="/viendo"
              element={
                <Navigate
                  to="/perfil?tab=viendo"
                  replace
                />
              }
            />

            <Route
              path="/favoritos"
              element={
                <Navigate
                  to="/perfil?tab=favoritos"
                  replace
                />
              }
            />

            {/* Cualquier dirección desconocida vuelve a Descubrir */}
            <Route
              path="*"
              element={<Navigate to="/" replace />}
            />
          </Routes>
        </main>
      </ListsProvider>
    </BrowserRouter>
  )
}