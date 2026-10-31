import { BrowserRouter, Routes, Route } from 'react-router-dom'

import { ListsProvider } from './context/ListsContext'
import Header from './components/Header'

import Home from './pages/Home'
import SeriesDetails from './pages/SeriesDetails'
import Watchlist from './pages/Watchlist'
import Favorites from './pages/Favorites'
import Watching from './pages/Watching'
import Watched from './pages/Watched'
import Profile from './pages/Profile'

export default function App() {
  return (
    <BrowserRouter>
      <ListsProvider>
        <Header />

        <main className="container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/serie/:id" element={<SeriesDetails />} />

            <Route path="/perfil" element={<Profile />} />

            <Route path="/quiero-ver" element={<Watchlist />} />
            <Route path="/favoritos" element={<Favorites />} />
            <Route path="/viendo" element={<Watching />} />
            <Route path="/ya-la-vi" element={<Watched />} />
          </Routes>
        </main>
      </ListsProvider>
    </BrowserRouter>
  )
}