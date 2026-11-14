import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import {
  getSeriesDetails,
  posterUrl,
  searchSeries,
} from '../services/tmdb'

import { getProfile, saveProfile } from '../services/profile'
import { AVATAR_STYLES, AVATAR_COLORS, avatarAssetUrl, DEFAULT_AVATAR_STYLE, DEFAULT_AVATAR_COLOR } from '../services/visualAssets'
import SeriesCard from '../components/SeriesCard'
import { useLists } from '../context/ListsContext'
import ProfileListSection from '../components/ProfileListSection'
import RecentActivity from '../components/RecentActivity'
import ActivityList from '../components/ActivityList'
import ProfileStats from '../components/ProfileStats'
import MyGroups from '../components/MyGroups'

import {
  getUserReviews,
  updateReview,
  deleteReview,
} from '../services/reviews'

const tabs = [
  { id: 'perfil', label: 'Perfil' },
  { id: 'diario', label: 'Diario' },
  { id: 'series', label: 'Series' },
  { id: 'pendientes', label: 'Pendientes' },
  { id: 'viendo', label: 'Viendo' },
  { id: 'favoritos', label: 'Favoritos' },
]

const validTabs = tabs.map((tab) => tab.id)
const DEFAULT_USERNAME = 'Usuario de SeriesHub'
const MAX_TOP_FAVORITES = 4

function getTodayDate() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export default function Profile() {
  const {
    favorites,
    isFavorite,
    toggleFavorite,
    watchlist,
    watching,
    watched,
    ready,
  } = useLists()

  const [profile, setProfile] = useState(null)
  const [searchParams, setSearchParams] = useSearchParams()

  const requestedTab = searchParams.get('tab')
  const activeTab = requestedTab === 'actividad'
    ? 'diario' // Compatibilidad con enlaces anteriores.
    : validTabs.includes(requestedTab)
      ? requestedTab
      : 'perfil'

  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [username, setUsername] = useState(DEFAULT_USERNAME)
  const [description, setDescription] = useState('')
  const [avatarPath, setAvatarPath] = useState('')
  const [avatarName, setAvatarName] = useState('')

  const [avatarStyle, setAvatarStyle] = useState(DEFAULT_AVATAR_STYLE)
  const [avatarColor, setAvatarColor] = useState(DEFAULT_AVATAR_COLOR)

  const [topFavorites, setTopFavorites] = useState([])
  const [activeSlot, setActiveSlot] = useState(null)
  const [seriesQuery, setSeriesQuery] = useState('')
  const [seriesResults, setSeriesResults] = useState([])
  const [searchingSeries, setSearchingSeries] = useState(false)
  const [seriesError, setSeriesError] = useState('')
  const [draggedIndex, setDraggedIndex] = useState(null)

  const [reviews, setReviews] = useState([])
  const [reviewsReady, setReviewsReady] = useState(false)
  const [reviewsError, setReviewsError] = useState('')

  // Estados para editar reseñas desde Actividad.
  const [editingReview, setEditingReview] = useState(null)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [reviewDate, setReviewDate] = useState(getTodayDate())
  const [reviewSaving, setReviewSaving] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const [reviewFavorite, setReviewFavorite] = useState(false)
  const [reviewSeries, setReviewSeries] = useState(null)
  const [reviewSeriesLoading, setReviewSeriesLoading] = useState(false)
  const [reviewSeriesError, setReviewSeriesError] = useState('')

  useEffect(() => {
    let active = true

    async function loadProfile() {
      try {
        setLoading(true)
        setError('')

        const data = await getProfile()

        if (active) {
          setProfile(data)
          setUsername(data.username)
          setDescription(data.description)
          setAvatarPath(data.avatarPath)
          setAvatarName(data.avatarName)
          setAvatarStyle(data.avatarStyle ?? DEFAULT_AVATAR_STYLE)
          setAvatarColor(data.avatarColor ?? DEFAULT_AVATAR_COLOR)
          setTopFavorites(data.topFavorites ?? [])
        }
      } catch (err) {
        console.error('Error al cargar el perfil:', err)

        if (active) {
          setError('No pudimos cargar tu perfil. Intentá nuevamente.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadProfile()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (
      !editing ||
      activeSlot === null ||
      seriesQuery.trim().length < 2
    ) {
      setSeriesResults([])
      setSeriesError('')
      setSearchingSeries(false)
      return
    }

    const controller = new AbortController()

    const timeoutId = setTimeout(async () => {
      try {
        setSearchingSeries(true)
        setSeriesError('')

        const results = await searchSeries(
          seriesQuery.trim(),
          controller.signal
        )

        if (!controller.signal.aborted) {
          setSeriesResults(
            (results ?? []).filter((series) => series.poster_path)
          )
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error al buscar series:', err)
          setSeriesError(
            'No pudimos realizar la búsqueda. Intentá nuevamente.'
          )
        }
      } finally {
        if (!controller.signal.aborted) {
          setSearchingSeries(false)
        }
      }
    }, 400)

    return () => {
      clearTimeout(timeoutId)
      controller.abort()
    }
  }, [seriesQuery, activeSlot, editing])

  useEffect(() => {
    let active = true

    async function loadReviews() {
      try {
        const data = await getUserReviews()

        if (active) {
          setReviews(data)
          setReviewsError('')
        }
      } catch (err) {
        console.error('Error al cargar las reseñas:', err)

        if (active) {
          setReviewsError('No se pudieron cargar tus reseñas.')
        }
      } finally {
        if (active) setReviewsReady(true)
      }
    }

    loadReviews()

    return () => {
      active = false
    }
  }, [])

  // Traemos los detalles desde TMDB para mostrar el póster y el año.
  // También necesitamos los datos completos para agregar la serie a Favoritos.
  useEffect(() => {
    if (!editingReview) return

    const controller = new AbortController()

    setReviewSeries(null)
    setReviewSeriesLoading(true)
    setReviewSeriesError('')

    getSeriesDetails(editingReview.seriesId, controller.signal)
      .then((details) => {
        if (!controller.signal.aborted) setReviewSeries(details)
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.error('Error al cargar la serie de la reseña:', err)
          setReviewSeriesError(
            'No pudimos cargar la información de la serie desde TMDB.'
          )
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setReviewSeriesLoading(false)
      })

    return () => controller.abort()
  }, [editingReview])

  function selectTab(tabId) {
    setSuccess('')

    if (tabId === 'perfil') {
      setSearchParams({})
    } else {
      setSearchParams({ tab: tabId })
    }
  }

  function startEditing() {
    setUsername(profile.username)
    setDescription(profile.description)
    setAvatarPath(profile.avatarPath)
    setAvatarName(profile.avatarName)
    setAvatarStyle(profile.avatarStyle ?? DEFAULT_AVATAR_STYLE)
    setAvatarColor(profile.avatarColor ?? DEFAULT_AVATAR_COLOR)
    setTopFavorites(profile.topFavorites ?? [])


    setActiveSlot(null)
    setSeriesQuery('')
    setSeriesResults([])
    setSeriesError('')

    setError('')
    setSuccess('')
    setEditing(true)
  }

  function cancelEditing() {
    setUsername(profile.username)
    setDescription(profile.description)
    setAvatarPath(profile.avatarPath)
    setAvatarName(profile.avatarName)
    setAvatarStyle(profile.avatarStyle ?? DEFAULT_AVATAR_STYLE)
    setAvatarColor(profile.avatarColor ?? DEFAULT_AVATAR_COLOR)
    setTopFavorites(profile.topFavorites ?? [])


    setActiveSlot(null)
    setSeriesQuery('')
    setSeriesResults([])
    setSeriesError('')

    setError('')
    setEditing(false)
  }

  function selectAvatarStyle(style) {
    setAvatarStyle(style)
    setAvatarPath('')
    setAvatarName('')
  }

  function selectAvatarColor(color) {
    setAvatarColor(color)
    setAvatarPath('')
    setAvatarName('')
  }

  function openSeriesSearch(slotIndex) {
    setActiveSlot(slotIndex)
    setSeriesQuery('')
    setSeriesResults([])
    setSeriesError('')
  }

  function closeSeriesSearch() {
    setActiveSlot(null)
    setSeriesQuery('')
    setSeriesResults([])
    setSeriesError('')
  }

  function addTopFavorite(series) {
    const alreadyAdded = topFavorites.some(
      (favorite) => favorite.id === series.id
    )

    if (alreadyAdded) {
      setSeriesError('Esa serie ya está en tus Top 4.')
      return
    }

    const updatedFavorites = [...topFavorites]
    updatedFavorites[activeSlot] = {
      id: series.id,
      name: series.name,
      poster_path: series.poster_path,
    }

    setTopFavorites(updatedFavorites)
    closeSeriesSearch()
  }

  function removeTopFavorite(slotIndex) {
    setTopFavorites((current) =>
      current.filter((_, index) => index !== slotIndex)
    )
  }

  function moveTopFavorite(fromIndex, toIndex) {
    if (
      fromIndex === null ||
      fromIndex === toIndex ||
      toIndex < 0 ||
      toIndex >= topFavorites.length
    ) {
      return
    }

    setTopFavorites((current) => {
      const updated = [...current]
      const [movedSeries] = updated.splice(fromIndex, 1)
      updated.splice(toIndex, 0, movedSeries)
      return updated
    })
  }

  function handleDragStart(event, index) {
    setDraggedIndex(index)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(index))
  }

  function handleDrop(event, targetIndex) {
    event.preventDefault()

    const sourceIndex = Number(
      event.dataTransfer.getData('text/plain')
    )

    if (Number.isInteger(sourceIndex)) {
      moveTopFavorite(sourceIndex, targetIndex)
    }

    setDraggedIndex(null)
  }

  async function handleSaveProfile(event) {
    event.preventDefault()

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const updatedProfile = await saveProfile({
        username,
        description,
        avatarPath,
        avatarName,
        avatarStyle,
        avatarColor,
        topFavorites,
      })

      setProfile(updatedProfile)
      setUsername(updatedProfile.username)
      setDescription(updatedProfile.description)
      setAvatarPath(updatedProfile.avatarPath)
      setAvatarName(updatedProfile.avatarName)
      setAvatarStyle(updatedProfile.avatarStyle)
      setAvatarColor(updatedProfile.avatarColor)
      setTopFavorites(updatedProfile.topFavorites)

      setEditing(false)
      setActiveSlot(null)
      setSeriesQuery('')
      setSeriesResults([])

      setSuccess('¡Tu perfil se actualizó correctamente!')
    } catch (err) {
      console.error('Error al guardar el perfil:', err)
      setError('No pudimos guardar los cambios. Intentá nuevamente.')
    } finally {
      setSaving(false)
    }
  }

  function openEditReview(review) {
    setEditingReview(review)
    setReviewRating(review.rating)
    setReviewText(review.text)
    setReviewDate(review.watchedAt || getTodayDate())
    setReviewFavorite(isFavorite(review.seriesId))
    setReviewError('')
    setSuccess('')
  }

  function resetReviewEditor() {
    setEditingReview(null)
    setReviewRating(0)
    setReviewText('')
    setReviewDate(getTodayDate())
    setReviewFavorite(false)
    setReviewSeries(null)
    setReviewSeriesError('')
    setReviewError('')
  }

  function closeEditReview() {
    if (reviewSaving) return
    resetReviewEditor()
  }

  async function handleUpdateReview(event) {
    event.preventDefault()
    setReviewError('')

    if (!reviewText.trim()) {
      setReviewError('Escribí tu reseña antes de guardar.')
      return
    }

    if (reviewText.trim().length > 1000) {
      setReviewError('La reseña no puede superar los 1000 caracteres.')
      return
    }

    if (reviewRating < 1 || reviewRating > 5) {
      setReviewError('Elegí una puntuación entre 1 y 5 estrellas.')
      return
    }

    if (!reviewDate) {
      setReviewError('Seleccioná la fecha en que viste la serie.')
      return
    }

    if (reviewDate > getTodayDate()) {
      setReviewError('La fecha no puede ser posterior al día de hoy.')
      return
    }

    const currentlyFavorite = isFavorite(editingReview.seriesId)

    if (reviewFavorite && !currentlyFavorite && !reviewSeries) {
      setReviewError(
        'No pudimos cargar la serie para agregarla a Favoritos. Intentá cerrar y abrir nuevamente el editor.'
      )
      return
    }

    setReviewSaving(true)

    try {
      await updateReview(editingReview.id, {
        seriesId: editingReview.seriesId,
        seriesName: editingReview.seriesName,
        rating: reviewRating,
        text: reviewText,
        watchedAt: reviewDate,
      })

      // Igual que en SeriesDetails: el corazón se aplica al guardar.
      if (reviewFavorite !== currentlyFavorite) {
        const seriesToToggle = currentlyFavorite
          ? favorites.find((series) => series.id === editingReview.seriesId)
          : reviewSeries

        if (seriesToToggle) {
          await toggleFavorite(seriesToToggle)
        }
      }

      const updatedReviews = await getUserReviews()
      setReviews(updatedReviews)

      resetReviewEditor()
      setSuccess('¡Tu reseña se actualizó correctamente!')
    } catch (err) {
      console.error('Error al actualizar la reseña:', err)
      setReviewError(
        'No se pudo completar la actualización. Revisá tu conexión e intentá nuevamente.'
      )
    } finally {
      setReviewSaving(false)
    }
  }

  async function handleDeleteReview(reviewId) {
    const confirmed = window.confirm(
      '¿Seguro que querés eliminar tu reseña? Esta acción no se puede deshacer.'
    )

    if (!confirmed) return

    setReviewsErrorForDelete('')

    try {
      await deleteReview(reviewId)

      setReviews((current) =>
        current.filter((review) => review.id !== reviewId)
      )

      setSuccess('La reseña se eliminó correctamente.')
    } catch (err) {
      console.error('Error al eliminar la reseña:', err)
      setReviewsErrorForDelete(
        'No se pudo eliminar la reseña. Intentá nuevamente.'
      )
    }
  }

  const [deleteError, setDeleteError] = useState('')

  function setReviewsErrorForDelete(message) {
    setDeleteError(message)
  }

  if (loading) {
    return <p className="message">Cargando tu perfil…</p>
  }

  if (error && !profile) {
    return <p className="error">{error}</p>
  }

  if (!profile) {
    return <p className="message">No encontramos los datos del perfil.</p>
  }

  const currentAvatar = profile.avatarPath
    ? `https://image.tmdb.org/t/p/w185${profile.avatarPath}`
    : avatarAssetUrl(profile.avatarStyle, profile.avatarColor)
  const editingAvatar = avatarAssetUrl(avatarStyle, avatarColor)

  const topFavoriteSlots = Array.from(
    { length: MAX_TOP_FAVORITES },
    (_, index) => topFavorites[index] ?? null
  )

  return (
    <section className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar">
          <img src={currentAvatar} alt={`Avatar de ${profile.username}`} />
        </div>

        <div className="profile-info">
          <h1>{profile.username}</h1>

          {profile.description ? (
            <p>{profile.description}</p>
          ) : (
            <p className="profile-description-empty">
              Todavía no agregaste una descripción.
            </p>
          )}

          {!editing && (
            <button
              type="button"
              className="profile-edit-button"
              onClick={startEditing}
            >
              ✎ Editar perfil
            </button>
          )}
        </div>
      </div>

      {success && (
        <p className="profile-success" role="status">
          {success}
        </p>
      )}

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {editing && (
        <section className="profile-editor">
          <h2>Editar perfil</h2>

          <form onSubmit={handleSaveProfile}>
            <div className="profile-editor-field">
              <label htmlFor="profile-username">
                Nombre de usuario
              </label>

              <input
                id="profile-username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                maxLength={40}
                placeholder={DEFAULT_USERNAME}
              />

              <small>Máximo 40 caracteres.</small>
            </div>

            <div className="profile-editor-field">
              <label htmlFor="profile-description">
                Descripción (opcional)
              </label>

              <textarea
                id="profile-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={250}
                rows={3}
                placeholder="Contá algo sobre tus gustos o tus series favoritas…"
              />

              <small>{description.length}/250 caracteres</small>
            </div>

            <div className="profile-editor-field">
              <label>Elegí tu avatar</label>
              <div className="profile-avatar-editor">
                <div className="profile-avatar profile-avatar-preview">
                  <img src={editingAvatar} alt="Vista previa del avatar seleccionado" />
                </div>
                <p className="avatar-editor-help">Seleccioná una expresión y un color. Los cambios se verán en la vista previa.</p>
              </div>
              <div className="avatar-style-picker" role="group" aria-label="Expresión del avatar">
                {AVATAR_STYLES.map(({ id, label }) => (
                  <button type="button" key={id}
                    aria-label={label} title={label}
                    aria-pressed={avatarStyle === id}
                    className={`avatar-style-choice${avatarStyle === id ? ' is-selected' : ''}`}
                    onClick={() => selectAvatarStyle(id)}>
                    <img src={avatarAssetUrl(id, avatarColor)} alt="" />
                  </button>
                ))}
              </div>
              <div className="avatar-color-picker" role="group" aria-label="Color del avatar">
                {AVATAR_COLORS.map(({ id, label, hex }) => (
                  <button type="button" key={id}
                    title={label} aria-label={label}
                    aria-pressed={avatarColor === id}
                    className={`avatar-color-choice${avatarColor === id ? ' is-selected' : ''}`}
                    style={{ '--avatar-color': hex }}
                    onClick={() => selectAvatarColor(id)} />
                ))}
              </div>
            </div>

            <div className="profile-editor-field">
              <label>Series Favoritas</label>

              <p className="profile-editor-hint">
                Elegí hasta cuatro series y ordenalas como quieras.
              </p>

              <div className="top-favorites-grid">
                {topFavoriteSlots.map((series, index) => (
                  <div
                    key={series ? series.id : `empty-${index}`}
                    className={`top-favorite-slot ${
                      draggedIndex === index ? 'dragging' : ''
                    }`}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => handleDrop(event, index)}
                  >
                    {series ? (
                      <>
                        <img
                          src={posterUrl(series.poster_path, 'w185')}
                          alt={`Póster de ${series.name}`}
                          draggable="false"
                        />

                        <strong className="top-favorite-name">
                          {series.name}
                        </strong>

                        <button
                          type="button"
                          className="top-favorite-remove"
                          aria-label={`Quitar ${series.name}`}
                          title="Quitar serie"
                          onClick={() => removeTopFavorite(index)}
                        >
                          ×
                        </button>

                        <button
                          type="button"
                          className="top-favorite-drag"
                          draggable
                          onDragStart={(event) =>
                            handleDragStart(event, index)
                          }
                          onDragEnd={() => setDraggedIndex(null)}
                          aria-label={`Arrastrar ${series.name} para cambiar su posición`}
                          title="Arrastrar para ordenar"
                        >
                          ⠿ Arrastrar
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="top-favorite-add"
                        onClick={() => openSeriesSearch(index)}
                      >
                        <span aria-hidden="true">＋</span>
                        <span>Agregar serie</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {activeSlot !== null && (
                <div className="top-favorite-search">
                  <div className="top-favorite-search-heading">
                    <strong>Elegir serie</strong>

                    <button
                      type="button"
                      onClick={closeSeriesSearch}
                      aria-label="Cerrar búsqueda"
                    >
                      ×
                    </button>
                  </div>

                  <input
                    type="search"
                    value={seriesQuery}
                    onChange={(event) => setSeriesQuery(event.target.value)}
                    placeholder="Buscar una serie…"
                    autoFocus
                  />

                  <small>
                    Escribí al menos dos caracteres para buscar.
                  </small>

                  {searchingSeries && (
                    <p className="message">Buscando series…</p>
                  )}

                  {seriesError && <p className="error">{seriesError}</p>}

                  {!searchingSeries &&
                    seriesQuery.trim().length >= 2 &&
                    seriesResults.length === 0 &&
                    !seriesError && (
                      <p className="message">
                        No encontramos series con ese nombre o no tienen póster disponible.
                      </p>
                    )}

                  {seriesResults.length > 0 && (
                    <div className="top-favorite-search-results">
                      {seriesResults.map((series) => {
                        const alreadyAdded = topFavorites.some(
                          (favorite) => favorite.id === series.id
                        )

                        return (
                          <button
                            key={series.id}
                            type="button"
                            className="top-favorite-result"
                            disabled={alreadyAdded}
                            onClick={() => addTopFavorite(series)}
                          >
                            <img
                              src={posterUrl(series.poster_path, 'w92')}
                              alt=""
                              loading="lazy"
                            />

                            <span>
                              <strong>{series.name}</strong>
                              <small>
                                {series.first_air_date
                                  ? series.first_air_date.slice(0, 4)
                                  : 'Año desconocido'}
                              </small>
                            </span>

                            <span className="top-favorite-result-status">
                              {alreadyAdded ? 'Agregada' : '＋'}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="profile-editor-actions">
              <button
                type="button"
                className="profile-cancel-button"
                onClick={cancelEditing}
                disabled={saving}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="profile-save-button"
                disabled={saving}
              >
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </section>
      )}

      <nav className="profile-tabs" aria-label="Secciones del perfil">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activeTab === tab.id ? 'active' : ''}
            onClick={() => selectTab(tab.id)}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="profile-tab-content">
        {activeTab === 'perfil' && (
          <div className="profile-overview-layout">
            <div className="profile-favorites-area">
              {profile.topFavorites?.length > 0 && (
                <section className="profile-top-favorites">
                  <h2 className="section-title">Series Favoritas</h2>
                  <div className="profile-top-favorites-grid">
                    {profile.topFavorites.map((series) => (
                      <SeriesCard key={series.id} series={series} />
                    ))}
                  </div>
                </section>
              )}
              {!profile.topFavorites?.length && !editing && (
                <section className="profile-top-favorites">
                  <h2 className="section-title">Series Favoritas</h2>
                  <p className="message">
                    Todavía no elegiste tus cuatro series favoritas.
                    Podés agregarlas desde «Editar perfil».
                  </p>
                </section>
              )}
            </div>

            <aside className="profile-stats-area" aria-label="Estadísticas de biblioteca">
              <ProfileStats
                ready={ready}
                watched={watched}
                watchlist={watchlist}
                watching={watching}
                favorites={favorites}
                onSelectTab={selectTab}
              />
            </aside>

            <div className="profile-activity-area">
              <RecentActivity
                reviews={reviews}
                favorites={favorites}
                watched={watched}
                loading={!reviewsReady}
                error={reviewsError}
                onViewAll={() => selectTab('diario')}
              />
            </div>

            <aside className="profile-forums-area" aria-label="Foros que seguís">
              <MyGroups />
            </aside>
          </div>
        )}

        {activeTab === 'diario' && (
          <section>
            <h2 className="section-title">Diario</h2>

            {!reviewsReady && (
              <p className="empty">Cargando tus reseñas...</p>
            )}

            {reviewsReady && reviewsError && (
              <p className="empty">{reviewsError}</p>
            )}

            {deleteError && (
              <p className="message error" role="alert">
                {deleteError}
              </p>
            )}

            {reviewsReady && !reviewsError && reviews.length === 0 && (
              <p className="empty">
                Todavía no publicaste ninguna reseña.
              </p>
            )}

            {reviewsReady && !reviewsError && reviews.length > 0 && (
              <ActivityList
                reviews={[...reviews].sort((a, b) => {
                  // Fecha de visualización, no fecha de publicación de la reseña.
                  // ISO yyyy-mm-dd mantiene orden cronológico con comparación de texto.
                  const da = /^\d{4}-\d{2}-\d{2}$/.test(a.watchedAt ?? '') ? a.watchedAt : ''
                  const db = /^\d{4}-\d{2}-\d{2}$/.test(b.watchedAt ?? '') ? b.watchedAt : ''
                  return db.localeCompare(da)
                })}
                favorites={favorites}
                watched={watched}
                onEdit={openEditReview}
                onDelete={handleDeleteReview}
              />
            )}

            {editingReview && (
              <div
                className="review-modal-overlay"
                onClick={closeEditReview}
              >
                <div
                  className="review-modal"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="profile-review-modal-title"
                  onClick={(event) => event.stopPropagation()}
                >
                  <button
                    className="review-modal-close"
                    type="button"
                    onClick={closeEditReview}
                    aria-label="Cerrar ventana"
                    disabled={reviewSaving}
                  >
                    ✕
                  </button>

                  <div className="review-modal-layout">
                    <div className="review-modal-poster">
                      {reviewSeries?.poster_path ? (
                        <img
                          src={posterUrl(reviewSeries.poster_path, 'w500')}
                          alt={`Póster de ${editingReview.seriesName}`}
                        />
                      ) : (
                        <div className="no-poster">
                          {reviewSeriesLoading ? 'Cargando póster…' : 'Sin póster'}
                        </div>
                      )}
                    </div>

                    <div className="review-modal-content">
                      <h2 id="profile-review-modal-title">
                        {editingReview.seriesName}
                        {reviewSeries?.first_air_date && (
                          <span className="details-year">
                            {' '}({reviewSeries.first_air_date.slice(0, 4)})
                          </span>
                        )}
                      </h2>

                      <form
                        className="review-form"
                        onSubmit={handleUpdateReview}
                      >
                        <div
                          className="review-rating-row"
                          role="group"
                          aria-label="Tu puntuación"
                        >
                          <div className="review-star-selector">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                className={`review-star-button ${
                                  star <= reviewRating ? 'selected' : ''
                                }`}
                                onClick={() => setReviewRating(star)}
                                disabled={reviewSaving}
                                aria-label={`${star} de 5 estrellas`}
                                aria-pressed={reviewRating === star}
                              >
                                {star <= reviewRating ? '★' : '☆'}
                              </button>
                            ))}
                          </div>

                          <button
                            type="button"
                            className={`review-favorite-button ${
                              reviewFavorite ? 'on' : ''
                            }`}
                            onClick={() =>
                              setReviewFavorite((current) => !current)
                            }
                            aria-label={
                              reviewFavorite
                                ? 'Quitar serie de favoritos'
                                : 'Agregar serie a favoritos'
                            }
                            aria-pressed={reviewFavorite}
                            title={
                              reviewFavorite
                                ? 'Quitar de favoritos'
                                : 'Agregar a favoritos'
                            }
                            disabled={reviewSaving || reviewSeriesLoading}
                          >
                            {reviewFavorite ? '♥' : '♡'}
                          </button>
                        </div>

                        <label htmlFor="profile-review-text">
                          Tu reseña
                        </label>

                        <textarea
                          id="profile-review-text"
                          value={reviewText}
                          onChange={(event) =>
                            setReviewText(event.target.value)
                          }
                          placeholder={`¿Qué te pareció ${editingReview.seriesName}?`}
                          maxLength={1000}
                          rows={5}
                          required
                          disabled={reviewSaving}
                        />

                        <p className="review-counter">
                          {reviewText.length}/1000 caracteres
                        </p>

                        <div className="review-date-field">
                          <label htmlFor="profile-review-date">
                            Vista el
                          </label>

                          <input
                            id="profile-review-date"
                            type="date"
                            value={reviewDate}
                            max={getTodayDate()}
                            onChange={(event) =>
                              setReviewDate(event.target.value)
                            }
                            required
                            disabled={reviewSaving}
                          />
                        </div>

                        {reviewSeriesError && (
                          <p className="message error" role="status">
                            {reviewSeriesError}
                          </p>
                        )}

                        {reviewError && (
                          <p className="message error" role="alert">
                            {reviewError}
                          </p>
                        )}

                        <button
                          className="detail-btn on"
                          type="submit"
                          disabled={reviewSaving || reviewSeriesLoading}
                        >
                          {reviewSaving ? 'Guardando…' : 'Guardar cambios'}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === 'series' && (
          <ProfileListSection
            title="Mis series"
            series={watched}
            ready={ready}
            emptyMessage="Todavía no marcaste series como vistas."
          />
        )}

        {activeTab === 'pendientes' && (
          <ProfileListSection
            title="Pendientes"
            series={watchlist}
            ready={ready}
            emptyMessage="Todavía no agregaste series a tu lista de pendientes."
          />
        )}

        {activeTab === 'viendo' && (
          <ProfileListSection
            title="Viendo"
            series={watching}
            ready={ready}
            emptyMessage="Todavía no agregaste series a esta lista."
          />
        )}

        {activeTab === 'favoritos' && (
          <ProfileListSection
            title="Favoritos"
            series={favorites}
            ready={ready}
            emptyMessage="Todavía no agregaste series a tus favoritos."
          />
        )}
      </div>
    </section>
  )
}