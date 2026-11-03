const BASE_URL = 'https://api.themoviedb.org/3'
const IMAGE_URL = 'https://image.tmdb.org/t/p'
const API_KEY = import.meta.env.VITE_TMDB_API_KEY

export const WATCH_REGION = 'AR'

export const posterUrl = (path, size = 'w342') =>
  path ? `${IMAGE_URL}/${size}${path}` : null

export const profileUrl = (path, size = 'w185') =>
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
      throw new Error(
        'TMDB rechazó la clave. Verificá que sea la API Key v3.'
      )
    }

    if (res.status === 404) {
      throw new Error('No encontramos esa serie.')
    }

    throw new Error(
      `Error al consultar TMDB (${res.status}).`
    )
  }

  return res.json()
}

export async function searchSeries(query, signal) {
  const data = await request(
    '/search/tv',
    { query },
    signal
  )

  return data.results ?? []
}

export async function searchPeople(query, signal) {
  const data = await request(
    '/search/person',
    { query },
    signal
  )

  return data.results ?? []
}

// Trae 24 series distintas consultando dos páginas de tendencias.
export async function getTrendingSeries(signal) {
  const firstPage = await request(
    '/trending/tv/week',
    { page: 1 },
    signal
  )

  const secondPage = await request(
    '/trending/tv/week',
    { page: 2 },
    signal
  )

  const allSeries = [
    ...(firstPage.results ?? []),
    ...(secondPage.results ?? []),
  ]

  const uniqueSeries = []
  const seenIds = new Set()

  for (const series of allSeries) {
    if (seenIds.has(series.id)) continue

    seenIds.add(series.id)
    uniqueSeries.push(series)

    if (uniqueSeries.length === 24) break
  }

  return uniqueSeries
}

export function getSeriesDetails(id, signal) {
  return request(`/tv/${id}`, {}, signal)
}

export async function getSeriesVideos(id, signal) {
  try {
    const es = await request(
      `/tv/${id}/videos`,
      {},
      signal
    )

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

export async function getWatchProviders(
  id,
  signal,
  region = WATCH_REGION
) {
  const data = await request(
    `/tv/${id}/watch/providers`,
    {},
    signal
  )

  return data.results?.[region] ?? null
}