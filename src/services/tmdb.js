const BASE_URL = 'https://api.themoviedb.org/3'
const IMAGE_URL = 'https://image.tmdb.org/t/p'
const API_KEY = import.meta.env.VITE_TMDB_API_KEY

// País para consultar las plataformas donde ver la serie.
export const WATCH_REGION = 'AR'

export const posterUrl = (path, size = 'w342') =>
  path ? `${IMAGE_URL}/${size}${path}` : null

async function request(endpoint, params = {}, signal) {
  if (!API_KEY) {
    throw new Error(
      'Falta la clave de TMDB. Revisá el archivo .env y reiniciá el servidor.'
    )
  }

  const url = new URL(BASE_URL + endpoint)
  url.search = new URLSearchParams({
    api_key: API_KEY,
    language: 'es-ES',
    ...params,
  })

  const res = await fetch(url, { signal })

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('TMDB rechazó la clave. Verificá que sea la API Key v3.')
    }
    if (res.status === 404) {
      throw new Error('No encontramos esa serie.')
    }
    throw new Error(`Error al consultar TMDB (${res.status}).`)
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

// Información completa de una serie.
export function getSeriesDetails(id, signal) {
  return request(`/tv/${id}`, {}, signal)
}

// Vídeos de la serie: primero español y después inglés si hace falta.
export async function getSeriesVideos(id, signal) {
  try {
    const es = await request(`/tv/${id}/videos`, {}, signal)
    if (es.results?.length > 0) return es.results
  } catch (error) {
    if (error.name === 'AbortError') throw error
  }

  const en = await request(
    `/tv/${id}/videos`,
    { language: 'en-US' },
    signal
  )

  return en.results ?? []
}

// Plataformas disponibles en Argentina.
export async function getWatchProviders(
  id,
  signal,
  region = WATCH_REGION
) {
  const data = await request(`/tv/${id}/watch/providers`, {}, signal)
  return data.results?.[region] ?? null
}