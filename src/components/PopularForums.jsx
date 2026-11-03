import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createGroup, getGroups } from '../services/groups'

import { FEATURED_FORUMS } from '../services/featuredForums'

export default function PopularForums() {
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [topic, setTopic] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    let active = true

    getGroups()
      .then((data) => {
        if (active) setGroups(data)
      })
      .catch((err) => {
        console.error('Error al cargar grupos:', err)

        if (active) {
          setLoadError('No se pudieron cargar los grupos creados.')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const shownGroups = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('es')

    const all = [
      ...FEATURED_FORUMS,
      ...groups.map((group) => ({
        ...group,
        featured: false,
      })),
    ]

    if (!term) return all

    return all.filter((forum) =>
      [forum.title, forum.description, forum.topic].some((value) =>
        value.toLocaleLowerCase('es').includes(term)
      )
    )
  }, [query, groups])

  async function handleCreate(event) {
    event.preventDefault()
    setFormError('')
    setSaving(true)

    try {
      const id = await createGroup({
        title,
        description,
        topic,
      })

      navigate(`/grupo/${id}`)
    } catch (err) {
      console.error('Error al crear grupo:', err)
      setFormError(err.message || 'No pudimos crear el grupo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section
      className="home-forums"
      id="foros-populares"
      aria-labelledby="home-forums-title"
    >
      <div className="home-forums-heading">
        <div>
          <h2
            className="section-title"
            id="home-forums-title"
          >
            Foros populares
          </h2>

          <p>
            Un espacio para compartir lo que más te gusta de las series.
          </p>
        </div>

        <button
          className="group-primary-button"
          type="button"
          onClick={() => {
            setShowForm((current) => !current)
            setFormError('')
          }}
          aria-expanded={showForm}
        >
          {showForm ? 'Cancelar' : '+ Crear grupo'}
        </button>
      </div>

      {showForm && (
        <form className="group-form" onSubmit={handleCreate}>
          <h3>Crear un grupo</h3>

          <label htmlFor="new-group-title">Nombre</label>
          <input
            id="new-group-title"
            required
            minLength={3}
            maxLength={60}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej.: Fans de las series de misterio"
          />

          <label htmlFor="new-group-topic">Temática</label>
          <input
            id="new-group-topic"
            required
            minLength={3}
            maxLength={35}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Ej.: Misterio"
          />

          <label htmlFor="new-group-description">
            Descripción
          </label>
          <textarea
            id="new-group-description"
            required
            minLength={10}
            maxLength={300}
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="¿De qué se va a hablar en este grupo?"
          />

          {formError && (
            <p className="message error" role="alert">
              {formError}
            </p>
          )}

          <button
            className="group-primary-button"
            type="submit"
            disabled={saving}
          >
            {saving ? 'Creando…' : 'Crear grupo'}
          </button>
        </form>
      )}

      <label
        className="home-forums-search-label"
        htmlFor="home-forums-search"
      >
        Buscar foros
      </label>

      <input
        id="home-forums-search"
        className="home-forums-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar por nombre o temática…"
      />

      {loading && (
        <p className="message">Cargando grupos…</p>
      )}

      {loadError && (
        <p className="message error" role="alert">
          {loadError}
        </p>
      )}

      {shownGroups.length === 0 ? (
        <p className="empty">
          No encontramos foros con ese nombre.
        </p>
      ) : (
        <div className="home-forums-list">
          {shownGroups.map((forum) => {
            const content = (
              <>
                <span
                  className="home-forum-icon"
                  aria-hidden="true"
                >
                  {forum.icon}
                </span>

                <div className="home-forum-info">
                  <h3>{forum.title}</h3>
                  <p>{forum.description}</p>

                  <span className="home-forum-topic">
                    {forum.topic}
                  </span>
                </div>
              </>
            )

            return (
              <Link
                key={forum.id}
                to={`/grupo/${forum.id}`}
                className="home-forum-card group-card-link"
                aria-label={`Entrar al grupo ${forum.title}`}
              >
                {content}
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}