import { createContext, useContext, useEffect, useState } from 'react'
import { db, authReady } from '../firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'

const ListsContext = createContext(null)

// Guardamos solo los datos necesarios de cada serie.
const slim = (s) => ({
  id: s.id,
  name: s.name,
  poster_path: s.poster_path,
  first_air_date: s.first_air_date,
  vote_average: s.vote_average,
})

export function ListsProvider({ children }) {
  const [favorites, setFavorites] = useState([])
  const [watchlist, setWatchlist] = useState([])
  const [watching, setWatching] = useState([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true

    async function loadLists() {
      try {
        const credential = await authReady
        const userDoc = doc(db, 'users', credential.user.uid)
        const snapshot = await getDoc(userDoc)

        if (!active) return

        if (snapshot.exists()) {
          const data = snapshot.data()
          setFavorites(data.favorites ?? [])
          setWatchlist(data.watchlist ?? [])
          setWatching(data.watching ?? [])
        } else {
          await setDoc(userDoc, {
            favorites: [],
            watchlist: [],
            watching: [],
          })
        }
      } catch (error) {
        console.error('Error al cargar las listas de Firestore:', error)
      } finally {
        if (active) setReady(true)
      }
    }

    loadLists()

    return () => {
      active = false
    }
  }, [])

  async function saveLists(nextFavorites, nextWatchlist, nextWatching) {
    try {
      const credential = await authReady
      const userDoc = doc(db, 'users', credential.user.uid)

      await setDoc(
        userDoc,
        {
          favorites: nextFavorites,
          watchlist: nextWatchlist,
          watching: nextWatching,
        },
        { merge: true }
      )
    } catch (error) {
      console.error('Error al guardar las listas en Firestore:', error)
    }
  }

  function toggleFavorite(series) {
    const next = favorites.some((s) => s.id === series.id)
      ? favorites.filter((s) => s.id !== series.id)
      : [...favorites, slim(series)]

    setFavorites(next)

    if (ready) saveLists(next, watchlist, watching)
  }

  function toggleWatchlist(series) {
    const next = watchlist.some((s) => s.id === series.id)
      ? watchlist.filter((s) => s.id !== series.id)
      : [...watchlist, slim(series)]

    setWatchlist(next)

    if (ready) saveLists(favorites, next, watching)
  }

  function toggleWatching(series) {
    const next = watching.some((s) => s.id === series.id)
      ? watching.filter((s) => s.id !== series.id)
      : [...watching, slim(series)]

    setWatching(next)

    if (ready) saveLists(favorites, watchlist, next)
  }

  const value = {
    favorites,
    watchlist,
    watching,
    ready,
    toggleFavorite,
    toggleWatchlist,
    toggleWatching,
    isFavorite: (id) => favorites.some((s) => s.id === id),
    isInWatchlist: (id) => watchlist.some((s) => s.id === id),
    isWatching: (id) => watching.some((s) => s.id === id),
  }

  return (
    <ListsContext.Provider value={value}>
      {children}
    </ListsContext.Provider>
  )
}

export const useLists = () => useContext(ListsContext)