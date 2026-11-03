import GroupChat from '../components/GroupChat'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import {
  editGroup,
  getCurrentGroupUserId,
  getGroupById,
  getGroupMembers,
  joinGroup,
  leaveGroup,
  removeGroup,
} from '../services/groups'

export default function GroupDetails() {
  const { groupId } = useParams()
  const navigate = useNavigate()

  const [group, setGroup] = useState(null)
  const [userId, setUserId] = useState('')
  const [members, setMembers] = useState([])
  const [membersReady, setMembersReady] = useState(false)
  const [membersError, setMembersError] = useState('')
  const [joining, setJoining] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [topic, setTopic] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setMembersReady(false)
    setError('')
    setMembersError('')
    setSuccess('')
    setEditing(false)

    async function load() {
      try {
        const [data, uid] = await Promise.all([
          getGroupById(groupId),
          getCurrentGroupUserId(),
        ])
        if (!active) return
        setGroup(data)
        setUserId(uid)
        if (!data) {
          setError('No encontramos este grupo.')
          setMembersReady(true)
          return
        }
        try {
          const groupMembers = await getGroupMembers(groupId)
          if (active) setMembers(groupMembers)
        } catch (err) {
          console.error('Error al cargar miembros:', err)
          if (active) setMembersError('No pudimos cargar los miembros.')
        } finally {
          if (active) setMembersReady(true)
        }
      } catch (err) {
        console.error('Error al cargar grupo:', err)
        if (active) {
          setError('No pudimos cargar el grupo.')
          setMembersReady(true)
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => { active = false }
  }, [groupId])

  const isOwner = Boolean(group && userId && group.ownerId === userId)
  const isMember = members.some((member) => member.id === userId)

  async function handleMembership() {
    if (joining || !membersReady || membersError) return
    setJoining(true)
    setMembersError('')
    setSuccess('')
    try {
      if (isMember) {
        await leaveGroup(groupId)
      } else {
        await joinGroup(groupId)
      }
      // Confirmamos la lista con Firestore, sin inventar contadores.
      const updatedMembers = await getGroupMembers(groupId)
      setMembers(updatedMembers)
      setSuccess(isMember ? 'Saliste del grupo.' : '¡Ya sos parte del grupo!')
    } catch (err) {
      console.error('Error al cambiar membresía:', err)
      setMembersError('No pudimos actualizar tu participación. Intentá otra vez.')
    } finally {
      setJoining(false)
    }
  }

  function startEditing() {
    setTitle(group.title)
    setTopic(group.topic)
    setDescription(group.description)
    setFormError('')
    setSuccess('')
    setEditing(true)
  }

  async function handleSave(event) {
    event.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      await editGroup(groupId, { title, topic, description })
      setGroup((current) => ({
        ...current,
        title: title.trim(),
        topic: topic.trim(),
        description: description.trim(),
      }))
      setEditing(false)
      setSuccess('¡Grupo actualizado!')
    } catch (err) {
      console.error('Error al editar grupo:', err)
      setFormError(err.message || 'No pudimos actualizar el grupo.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm('¿Eliminar este grupo? Esta acción no se puede deshacer.')) return
    setSaving(true)
    setFormError('')
    try {
      await removeGroup(groupId)
      navigate('/')
    } catch (err) {
      console.error('Error al eliminar grupo:', err)
      setFormError(err.message || 'No pudimos eliminar el grupo.')
      setSaving(false)
    }
  }

  return (
    <section className="group-details-page">
      <Link className="back-btn group-back-link" to="/">
        ← Volver a Descubrir
      </Link>

      {loading && <p className="message">Cargando grupo…</p>}
      {error && <p className="message error" role="alert">{error}</p>}

      {group && (
        <article className="group-details-card">
          <div className="group-details-heading">
            <span className="home-forum-icon" aria-hidden="true">{group.icon}</span>
            <div>
              <span className="home-forum-topic">{group.topic}</span>
              <h1>{group.title}</h1>
            </div>
          </div>

          <p className="group-details-description">{group.description}</p>

          {success && <p className="profile-success" role="status">{success}</p>}

          <div className="group-membership-bar">
            <div className="group-membership-summary">
              <strong>{membersReady && !membersError ? members.length : '—'}</strong>
              <span>{members.length === 1 ? 'miembro' : 'miembros'}</span>
            </div>
            <button
              type="button"
              className={isMember ? 'group-secondary-button' : 'group-primary-button'}
              onClick={handleMembership}
              disabled={joining || !membersReady || Boolean(membersError) || saving}
            >
              {joining ? 'Guardando…' : isMember ? 'Salir del grupo' : 'Unirme al grupo'}
            </button>
          </div>

          {membersError && (
            <p className="message error" role="alert">{membersError}</p>
          )}

          <section className="group-members-section" aria-labelledby="group-members-title">
            <h2 id="group-members-title">Miembros</h2>
            {!membersReady && <p className="message">Cargando miembros…</p>}
            {membersReady && !membersError && members.length === 0 && (
              <p className="message">Todavía no hay integrantes.</p>
            )}
            {membersReady && !membersError && members.length > 0 && (
              <ul className="group-members-list">
                {members.map((member, index) => (
                  <li key={member.id}>
                    <span className="group-member-avatar" aria-hidden="true">◉</span>
                    <span>
                      {member.id === userId ? 'Vos' : `Miembro ${index + 1}`}
                      {member.id === group.ownerId && (
                        <small className="group-owner-label">Creador</small>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {isOwner && !editing && (
            <div className="group-details-actions">
              <button type="button" className="group-primary-button" onClick={startEditing}>
                Editar grupo
              </button>
              <button type="button" className="group-danger-button" onClick={handleDelete} disabled={saving}>
                {saving ? 'Eliminando…' : 'Eliminar grupo'}
              </button>
            </div>
          )}

          {isOwner && editing && (
            <form className="group-form" onSubmit={handleSave}>
              <h2>Editar grupo</h2>
              <label htmlFor="edit-group-title">Nombre</label>
              <input id="edit-group-title" required minLength={3} maxLength={60}
                value={title} onChange={(e) => setTitle(e.target.value)} />

              <label htmlFor="edit-group-topic">Temática</label>
              <input id="edit-group-topic" required minLength={3} maxLength={35}
                value={topic} onChange={(e) => setTopic(e.target.value)} />

              <label htmlFor="edit-group-description">Descripción</label>
              <textarea id="edit-group-description" required minLength={10} maxLength={300}
                rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />

              {formError && <p className="message error" role="alert">{formError}</p>}

              <div className="group-details-actions">
                <button className="group-primary-button" type="submit" disabled={saving}>
                  {saving ? 'Guardando…' : 'Guardar cambios'}
                </button>
                <button className="group-secondary-button" type="button"
                  onClick={() => setEditing(false)} disabled={saving}>
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {!editing && formError && (
            <p className="message error" role="alert">{formError}</p>
          )}

          <GroupChat group={group} userId={userId} isMember={isMember} />
        </article>
      )}
    </section>
  )
}