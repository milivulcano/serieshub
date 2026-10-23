const BASE_URL = 'https://api.themoviedb.org/3'
const IMAGE_URL = 'https://image.tmdb.org/t/p'
const API_KEY = import.meta.env.VITE_TMDB_API_KEY

// Devuelve la URL completa de un póster, o null si la serie no tiene.
export const posterUrl = (path, size = 'w342') =>
  path ? `${IMAGE_URL}/${size}${path}` : null

// Función base: todas las consultas pasan por acá.
async function request(endpoint, params = {}, signal) {
  if (!API_KEY) {
    throw new Error('Falta la clave de TMDB. Revisá el archivo .env y reiniciá el servidor.')
  }
  const url = new URL(BASE_URL + endpoint)
  url.search = new URLSearchParams({ api_key: API_KEY, language: 'es-ES', ...params })

  const res = await fetch(url, { signal })
  if (!res.ok) {
    throw new Error(
      res.status === 401
        ? 'TMDB rechazó la clave. Verificá que sea la API Key v3.'
        : `Error al consultar TMDB (${res.status}).`
    )
  }
  return res.json()
}

export async function searchSeries(query, signal) {
  const data = await request('/search/tv', { query }, signal)
  return data.results
}

export async function getTrendingSeries(signal) {
  const data = await request('/trending/tv/week', {}, signal)
  return data.results
}