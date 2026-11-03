import { useEffect, useState } from 'react'
import {
  deleteGroupMessage,
  editGroupMessage,
  sendGroupMessage,
  subscribeGroupMessages,
} from '../services/messages'

function dateLabel(timestamp) {
  const date = timestamp?.toDate?.()
  if (!date) return 'Enviando…'
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  }).format(date)
}

export default function GroupChat({ group, userId, isMember }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [actionError, setActionError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingText, setEditingText] = useState('')
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    setMessages([])
    setLoading(true)
    setLoadError('')
    // No hay mensajes de otros usuarios inventados: la lista es en tiempo real.
    const stop = subscribeGroupMessages(
      group.id,
      (data) => { setMessages(data); setLoading(false); setLoadError('') },
      (error) => {
        console.error('Error al escuchar mensajes:', error)
        setLoadError('No pudimos cargar los mensajes de este grupo.')
        setLoading(false)
      }
    )
    return () => stop()
  }, [group.id])

  async function handleSend(event) {
    event.preventDefault()
    setActionError('')
    setSending(true)
    try {
      await sendGroupMessage(group.id, text)
      setText('')
    } catch (error) {
      setActionError(error.message || 'No se pudo enviar el mensaje.')
    } finally {
      setSending(false)
    }
  }

  async function handleSaveMessage(event) {
    event.preventDefault()
    setActionError('')
    setBusyId(editingId)
    try {
      await editGroupMessage(group.id, editingId, editingText)
      setEditingId(null)
    } catch (error) {
      setActionError(error.message || 'No pudimos editar el mensaje.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(messageId) {
    if (!window.confirm('¿Eliminar este mensaje?')) return
    setActionError('')
    setBusyId(messageId)
    try {
      await deleteGroupMessage(group.id, messageId)
      if (editingId === messageId) setEditingId(null)
    } catch (error) {
      setActionError(error.message || 'No pudimos eliminar el mensaje.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className="group-chat" aria-labelledby="group-chat-title">
      <div className="group-chat-heading">
        <h2 id="group-chat-title">Conversaciones</h2>
        <span>{messages.length} {messages.length === 1 ? 'mensaje' : 'mensajes'}</span>
      </div>

      {group.featured && (
        <div className="group-conversation-starters">
          <strong>Para empezar la conversación</strong>
          <ul>
            {group.prompts.map((prompt) => <li key={prompt}>{prompt}</li>)}
          </ul>
        </div>
      )}

      {loading && <p className="message">Cargando mensajes…</p>}
      {loadError && <p className="message error" role="alert">{loadError}</p>}
      {!loading && !loadError && messages.length === 0 && (
        <p className="group-chat-empty">Todavía no hay mensajes. ¡Iniciá la conversación!</p>
      )}

      {!loadError && messages.length > 0 && (
        <div className="group-chat-list" aria-live="polite">
          {messages.map((message) => {
            const mine = message.userId === userId
            return (
              <article className={`group-chat-message ${mine ? 'mine' : ''}`} key={message.id}>
                <div className="group-chat-message-header">
                  <strong>{mine ? 'Vos' : 'Integrante'}</strong>
                  <time>{dateLabel(message.createdAt)}</time>
                </div>
                {editingId === message.id ? (
                  <form className="group-chat-edit" onSubmit={handleSaveMessage}>
                    <label className="group-chat-sr-only" htmlFor={`edit-message-${message.id}`}>Editar mensaje</label>
                    <textarea id={`edit-message-${message.id}`} value={editingText}
                      onChange={(event) => setEditingText(event.target.value)}
                      rows={3} maxLength={1000} required disabled={busyId === message.id} />
                    <div className="group-chat-actions">
                      <button className="group-primary-button" type="submit" disabled={busyId === message.id}>Guardar</button>
                      <button className="group-secondary-button" type="button" onClick={() => setEditingId(null)} disabled={busyId === message.id}>Cancelar</button>
                    </div>
                  </form>
                ) : (
                  <p className="group-chat-text">{message.text}</p>
                )}
                {mine && editingId !== message.id && (
                  <div className="group-chat-actions">
                    <button type="button" disabled={busyId === message.id || !isMember}
                      onClick={() => { setEditingId(message.id); setEditingText(message.text); setActionError('') }}>Editar</button>
                    <button type="button" disabled={busyId === message.id || !isMember}
                      onClick={() => handleDelete(message.id)}>Eliminar</button>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}

      {actionError && <p className="message error" role="alert">{actionError}</p>}

      {isMember ? (
        <form className="group-chat-compose" onSubmit={handleSend}>
          <label htmlFor="new-group-message">Escribir un mensaje</label>
          <textarea id="new-group-message" rows={3} value={text} maxLength={1000}
            placeholder="Compartí tu opinión con el grupo…" required disabled={sending}
            onChange={(event) => setText(event.target.value)} />
          <div className="group-chat-compose-footer">
            <small>{text.length}/1000 caracteres</small>
            <button className="group-primary-button" type="submit" disabled={sending || !text.trim()}>
              {sending ? 'Publicando…' : 'Publicar mensaje'}
            </button>
          </div>
        </form>
      ) : (
        <p className="group-chat-join-hint">Unite al grupo para participar en la conversación.</p>
      )}
    </section>
  )
}