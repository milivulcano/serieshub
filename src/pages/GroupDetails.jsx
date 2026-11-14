import { useConfirmDialog } from '../components/ConfirmDialog'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import GroupChat from '../components/GroupChat'
import ForumIconPicker from '../components/ForumIconPicker'
import { DEFAULT_FORUM_ICON, forumIconForGroup, forumIconUrl } from '../services/visualAssets'
import {
  editGroup,
  getCurrentGroupUserId,
  getGroupById,
  isFollowingForum,
  joinGroup,
  leaveGroup,
  removeGroup,
} from '../services/groups'

export default function GroupDetails() {
  const { confirm, dialog: confirmDialog } = useConfirmDialog()
  const { groupId } = useParams()
  const navigate = useNavigate()
  const [group, setGroup] = useState(null)
  const [userId, setUserId] = useState('')
  const [following, setFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [followingBusy, setFollowingBusy] = useState(false)
  const [followingError, setFollowingError] = useState('')
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [topic, setTopic] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState(DEFAULT_FORUM_ICON)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setGroup(null)
    setError('')
    setFollowingError('')
    setSuccess('')
    setEditing(false)

    Promise.all([getGroupById(groupId), getCurrentGroupUserId()])
      .then(async ([data, uid]) => {
        // Actualiza también los foros creados antes de esta mejora.
        // El creador siempre debe tener su registro de seguimiento
        // para poder publicar sin realizar una acción adicional.
        if (data?.ownerId === uid) await joinGroup(groupId)
        const follows = data ? await isFollowingForum(groupId) : false
        return [data, uid, follows]
      })
      .then(([data, uid, follows]) => {
        if (!active) return
        setGroup(data)
        setUserId(uid)
        setFollowing(follows)
        if (!data) setError('No encontramos este foro.')
      })
      .catch((err) => {
        console.error('Error al cargar el foro:', err)
        if (active) setError('No pudimos cargar este foro.')
      })
      .finally(() => { if (active) setLoading(false) })

    return () => { active = false }
  }, [groupId])

  const isOwner = Boolean(group && userId && group.ownerId === userId)

  async function handleFollow() {
    if (followingBusy || isOwner) return
    setFollowingBusy(true)
    setFollowingError('')
    setSuccess('')
    try {
      if (following) await leaveGroup(groupId)
      else await joinGroup(groupId)
      setFollowing(await isFollowingForum(groupId))
    } catch (err) {
      console.error('Error al seguir el foro:', err)
      setFollowingError('No pudimos actualizar el seguimiento. Intentá nuevamente.')
    } finally {
      setFollowingBusy(false)
    }
  }

  function startEditing() {
    setTitle(group.title)
    setTopic(group.topic)
    setDescription(group.description)
    setIcon(forumIconForGroup(group))
    setFormError('')
    setSuccess('')
    setEditing(true)
  }

  async function handleSave(event) {
    event.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      await editGroup(groupId, { title, topic, description, icon })
      setGroup((current) => ({ ...current, title: title.trim(), topic: topic.trim(), description: description.trim(), icon }))
      setEditing(false)
      setSuccess('¡Foro actualizado!')
    } catch (err) {
      console.error(err)
      setFormError(err.message || 'No pudimos actualizar el foro.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!await confirm({ title: 'Eliminar foro', message: '¿Querés eliminar este foro y sus publicaciones? Esta acción no se puede deshacer.' })) return
    setSaving(true)
    setFormError('')
    try {
      await removeGroup(groupId)
      navigate('/')
    } catch (err) {
      console.error(err)
      setFormError(err.message || 'No pudimos eliminar el foro.')
      setSaving(false)
    }
  }

  return (
    <section className="group-details-page">
      {confirmDialog}
      <Link className="back-btn group-back-link" to="/#foros-populares">← Volver a foros</Link>
      {loading && <p className="message">Cargando foro…</p>}
      {error && <p className="message error" role="alert">{error}</p>}
      {group && !loading && (
        <>
          <header className="forum-header">
            <div className="forum-header-main">
              <span className="home-forum-icon" aria-hidden="true"><img src={forumIconUrl(forumIconForGroup(group))} alt="" /></span>
              <div>
                <span className="home-forum-topic">{group.topic}</span>
                <h1>{group.title}</h1>
                <p className="group-details-description">{group.description}</p>
              </div>
            </div>
            <button type="button" className={`forum-follow-button ${following ? 'is-following' : ''}`}
              aria-pressed={following} onClick={handleFollow} disabled={followingBusy || saving || isOwner}
              title={isOwner ? "Seguís automáticamente el foro que creaste" : undefined}>
              <span className="forum-follow-star" aria-hidden="true">{following ? '★' : '☆'}</span>
              {followingBusy ? 'Guardando…' : following ? 'Siguiendo' : 'Seguir'}
            </button>
          </header>
          {followingError && <p className="message error" role="alert">{followingError}</p>}
          {success && <p className="profile-success" role="status">{success}</p>}

          {isOwner && !editing && (
            <div className="forum-manage-actions">
              <button type="button" className="group-secondary-button" onClick={startEditing}>Editar foro</button>
              <button type="button" className="group-danger-button" onClick={handleDelete} disabled={saving}>
                {saving ? 'Eliminando…' : 'Eliminar foro'}
              </button>
            </div>
          )}
          {isOwner && editing && (
            <form className="group-form" onSubmit={handleSave}>
              <h2>Editar foro</h2>
              <label htmlFor="edit-group-title">Nombre</label>
              <input id="edit-group-title" required minLength={3} maxLength={60} value={title} onChange={(e) => setTitle(e.target.value)} />
              <label htmlFor="edit-group-topic">Temática</label>
              <input id="edit-group-topic" required minLength={3} maxLength={35} value={topic} onChange={(e) => setTopic(e.target.value)} />
              <label htmlFor="edit-group-description">Descripción</label>
              <textarea id="edit-group-description" required minLength={10} maxLength={300} rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
              <ForumIconPicker value={icon} onChange={setIcon} />
              {formError && <p className="message error" role="alert">{formError}</p>}
              <div className="group-details-actions">
                <button type="button" className="group-secondary-button" disabled={saving} onClick={() => setEditing(false)}>Cancelar</button>
                <button type="submit" className="group-primary-button" disabled={saving}>{saving ? 'Guardando…' : 'Guardar cambios'}</button>
              </div>
            </form>
          )}
          {!editing && formError && <p className="message error" role="alert">{formError}</p>}
          <GroupChat group={group} userId={userId} isMember={following} />
        </>
      )}
    </section>
  )
}