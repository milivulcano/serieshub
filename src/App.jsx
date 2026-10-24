import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ListsProvider } from './context/ListsContext'
import Header from './components/Header'
import Home from './pages/Home'
import Favorites from './pages/Favorites'
import Watchlist from './pages/Watchlist'
import SeriesDetails from './pages/SeriesDetails'

export default function App() {
  return (
    <BrowserRouter>
      <ListsProvider>
        <Header />
        <main className="container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/serie/:id" element={<SeriesDetails />} />
            <Route path="/quiero-ver" element={<Watchlist />} />
            <Route path="/favoritos" element={<Favorites />} />
          </Routes>
        </main>
      </ListsProvider>
    </BrowserRouter>
  )
}