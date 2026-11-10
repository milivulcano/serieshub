import { useEffect, useMemo, useState } from 'react'
import { getSamplePosts } from '../services/featuredForums'
import {
  deleteGroupMessage,
  editGroupMessage,
  sendGroupMessage,
  subscribeGroupMessages,
} from '../services/messages'

const MAX_LENGTH = 1000

// El campo text de Firestore se mantiene intacto para no perder mensajes
// anteriores ni requerir cambios en las reglas: título + doble salto + contenido.
function parsePostText(text = '') {
  const normalized = text.trim()
  const index = normalized.indexOf('\n\n')
  if (index !== -1) {
    return { title: normalized.slice(0, index).trim(), body: normalized.slice(index + 2).trim() }
  }
  const firstLine = normalized.split('\n')[0]
  return { title: firstLine.slice(0, 100), body: normalized === firstLine ? '' : normalized.slice(firstLine.length).trim() }
}

function formatDate(value) {
  const date = value?.toDate?.() ?? (value instanceof Date ? value : null)
  if (!date) return 'Recién publicado'
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

export default function GroupChat({ group, userId, isMember }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [showComposer, setShowComposer] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [actionError, setActionError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editBody, setEditBody] = useState('')
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    let active = true
    setMessages([])
    setLoading(true)
    setLoadError('')
    setEditingId(null)
    const unsubscribe = subscribeGroupMessages(
      group.id,
      (items) => { if (active) { setMessages(items); setLoading(false); setLoadError('') } },
      (err) => { console.error('Error al leer publicaciones:', err); if (active) { setLoadError('No pudimos cargar las publicaciones.'); setLoading(false) } },
    )
    return () => { active = false; unsubscribe() }
  }, [group.id])

  const posts = useMemo(() => {
    const samples = getSamplePosts(group.id).map((item) => ({ ...item, order: new Date(`${item.date}T12:00:00`).getTime() }))
    const real = messages.map((message) => {
      const parsed = parsePostText(message.text)
      return {
        ...message, ...parsed,
        id: message.id,
        author: message.userId === userId ? 'Vos' : 'Usuario de SeriesHub',
        excerpt: parsed.body,
        date: formatDate(message.createdAt),
        views: null, // No existe seguimiento de visitas para publicaciones reales.
        replies: 0, // No hay función de respuestas en esta versión.
        order: message.createdAt?.toMillis?.() ?? Date.now(),
        sample: false,
      }
    })
    return [...samples, ...real].sort((a, b) => b.order - a.order)
  }, [group.id, messages, userId])

  async function handlePublish(event) {
    event.preventDefault()
    setActionError('')
    const content = `${title.trim()}\n\n${body.trim()}`
    if (!title.trim() || !body.trim() || content.length > MAX_LENGTH) {
      setActionError('Completá el título y el contenido (máximo 1000 caracteres en total).')
      return
    }
    setSending(true)
    try {
      await sendGroupMessage(group.id, content)
      setTitle('')
      setBody('')
      setShowComposer(false)
    } catch (err) {
      console.error(err)
      setActionError(err.message || 'No pudimos publicar.')
    } finally {
      setSending(false)
    }
  }

  function beginEdit(post) {
    setEditingId(post.id)
    const parsed = parsePostText(post.text)
    setEditTitle(parsed.title)
    setEditBody(parsed.body)
    setActionError('')
  }

  async function handleSaveEdit(event) {
    event.preventDefault()
    const text = `${editTitle.trim()}\n\n${editBody.trim()}`
    if (!editTitle.trim() || !editBody.trim() || text.length > MAX_LENGTH) {
      setActionError('Completá título y contenido (máximo 1000 caracteres).')
      return
    }
    setBusyId(editingId)
    setActionError('')
    try {
      await editGroupMessage(group.id, editingId, text)
      setEditingId(null)
    } catch (err) {
      console.error(err)
      setActionError(err.message || 'No pudimos editar la publicación.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('¿Eliminar esta publicación?')) return
    setBusyId(id)
    setActionError('')
    try {
      await deleteGroupMessage(group.id, id)
      if (editingId === id) setEditingId(null)
    } catch (err) {
      console.error(err)
      setActionError(err.message || 'No pudimos eliminar la publicación.')
    } finally {
      setBusyId(null)
    }
  }

  const textLength = `${title.trim()}\n\n${body.trim()}`.length
  const editLength = `${editTitle.trim()}\n\n${editBody.trim()}`.length

  return (
    <section className="forum-posts" aria-labelledby="forum-posts-title">
      <div className="forum-posts-heading">
        <div>
          <h2 id="forum-posts-title">Publicaciones</h2>
          <span>{loading ? 'Cargando…' : `${posts.length} publicaciones`}</span>
        </div>
        {isMember && (
          <button type="button" className="group-primary-button" onClick={() => { setShowComposer((v) => !v); setActionError('') }}>
            {showComposer ? 'Cancelar' : '+ Nueva publicación'}
          </button>
        )}
      </div>

      {isMember && showComposer && (
        <form className="forum-post-compose" onSubmit={handlePublish}>
          <h3>Crear publicación</h3>
          <label htmlFor="forum-new-title">Título</label>
          <input id="forum-new-title" value={title} maxLength={100} required disabled={sending}
            onChange={(e) => setTitle(e.target.value)} placeholder="¿De qué querés hablar?" />
          <label htmlFor="forum-new-body">Contenido</label>
          <textarea id="forum-new-body" value={body} rows={5} maxLength={998} required disabled={sending}
            onChange={(e) => setBody(e.target.value)} placeholder="Contá tu opinión, pregunta o recomendación…" />
          <div className="forum-post-compose-footer">
            <small>{textLength}/1000 caracteres</small>
            <button className="group-primary-button" type="submit" disabled={sending || !title.trim() || !body.trim() || textLength > MAX_LENGTH}>
              {sending ? 'Publicando…' : 'Publicar'}
            </button>
          </div>
        </form>
      )}

      {loading && <p className="message">Cargando publicaciones…</p>}
      {loadError && <p className="message error" role="alert">{loadError}</p>}
      {!loading && !loadError && posts.length === 0 && <p className="forum-posts-empty">Este foro todavía no tiene publicaciones.</p>}
      {actionError && <p className="message error" role="alert">{actionError}</p>}
      {!loadError && posts.length > 0 && (
        <div className="forum-posts-list">
          {posts.map((post) => {
            const mine = !post.sample && post.userId === userId
            return (
              <article className="forum-post-row" key={post.id}>
                {editingId === post.id ? (
                  <form className="forum-post-compose forum-post-editor" onSubmit={handleSaveEdit}>
                    <h3>Editar publicación</h3>
                    <label htmlFor={`forum-edit-title-${post.id}`}>Título</label>
                    <input id={`forum-edit-title-${post.id}`} value={editTitle} required maxLength={100} disabled={busyId === post.id} onChange={(e) => setEditTitle(e.target.value)} />
                    <label htmlFor={`forum-edit-body-${post.id}`}>Contenido</label>
                    <textarea id={`forum-edit-body-${post.id}`} rows={4} value={editBody} required maxLength={998} disabled={busyId === post.id} onChange={(e) => setEditBody(e.target.value)} />
                    <small>{editLength}/1000 caracteres</small>
                    <div className="group-details-actions">
                      <button type="submit" className="group-primary-button" disabled={busyId === post.id || editLength > MAX_LENGTH}>Guardar</button>
                      <button type="button" className="group-secondary-button" disabled={busyId === post.id} onClick={() => setEditingId(null)}>Cancelar</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <h3>{post.title}</h3>
                    {post.excerpt && <p className="forum-post-excerpt">{post.excerpt}</p>}
                    <div className="forum-post-footer">
                      <div className="forum-post-author">
                        <span className="forum-post-avatar" aria-hidden="true">{post.author.slice(0, 1).toUpperCase()}</span>
                        <span><strong>{post.author}</strong><time>{post.date || formatDate(post.createdAt)}</time></span>
                      </div>
                      <div className="forum-post-counts" aria-label="Estadísticas de la publicación">
                        <span title={post.sample ? 'Vistas de muestra' : 'Vistas no registradas'} aria-label={`Vistas: ${post.views ?? 'sin registro'}`}>
                          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>
                          {post.views ?? '—'}
                        </span>
                        <span title={post.sample ? 'Respuestas de muestra' : 'Sin respuestas'} aria-label={`Respuestas: ${post.replies}`}>
                          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v12H8l-4 4V4Z"/></svg>
                          {post.replies}
                        </span>
                      </div>
                    </div>
                    {mine && (
                      <div className="forum-post-actions">
                        <button type="button" disabled={busyId === post.id || !isMember} onClick={() => beginEdit(post)}>Editar</button>
                        <button type="button" disabled={busyId === post.id || !isMember} onClick={() => handleDelete(post.id)}>Eliminar</button>
                      </div>
                    )}
                  </>
                )}
              </article>
            )
          })}
        </div>
      )}
      {!isMember && <p className="forum-follow-hint">Seguí este foro para publicar.</p>}
    </section>
  )
}