import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createGroup, getGroups } from '../services/groups'

import { FEATURED_FORUMS } from '../services/featuredForums'
import { DEFAULT_FORUM_ICON, forumIconForGroup, forumIconUrl } from '../services/visualAssets'
import ForumIconPicker from './ForumIconPicker'

export default function PopularForums() {
  const navigate = useNavigate()

  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [topic, setTopic] = useState('')
  const [icon, setIcon] = useState(DEFAULT_FORUM_ICON)
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
          setLoadError('No se pudieron cargar los foros creados.')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const shownGroups = [
    ...FEATURED_FORUMS,
    ...groups.map((group) => ({ ...group, featured: false })),
  ]

  async function handleCreate(event) {
    event.preventDefault()
    setFormError('')
    setSaving(true)

    try {
      const id = await createGroup({
        title,
        description,
        topic,
        icon,
      })

      navigate(`/grupo/${id}`)
    } catch (err) {
      console.error('Error al crear foro:', err)
      setFormError(err.message || 'No pudimos crear el foro.')
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
          {showForm ? 'Cancelar' : '+ Crear foro'}
        </button>
      </div>

      {showForm && (
        <form className="group-form" onSubmit={handleCreate}>
          <h3>Crear un foro</h3>

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
            placeholder="¿De qué se va a hablar en este foro?"
          />

          <ForumIconPicker value={icon} onChange={setIcon} />

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
            {saving ? 'Creando…' : 'Crear foro'}
          </button>
        </form>
      )}


      {loading && (
        <p className="message">Cargando foros…</p>
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
                  <img src={forumIconUrl(forumIconForGroup(forum))} alt="" />
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
                aria-label={`Entrar al foro ${forum.title}`}
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