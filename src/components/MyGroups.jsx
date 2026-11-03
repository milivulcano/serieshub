import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyGroups } from '../services/groups'

export default function MyGroups() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    getMyGroups()
      .then((data) => {
        if (active) setGroups(data)
      })
      .catch((err) => {
        console.error('Error al cargar mis grupos:', err)
        if (active) setError('No pudimos cargar tus grupos.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [])

  return (
    <section className="profile-my-groups" aria-labelledby="profile-my-groups-title">
      <div className="profile-my-groups-heading">
        <h2 id="profile-my-groups-title">Mis grupos</h2>
        <span aria-label={`${groups.length} grupos`}>{loading ? '—' : groups.length}</span>
      </div>

      {loading && <p className="profile-my-groups-empty">Cargando grupos…</p>}
      {error && <p className="message error" role="alert">{error}</p>}

      {!loading && !error && groups.length === 0 && (
        <p className="profile-my-groups-empty">
          Todavía no te uniste a ningún grupo.
        </p>
      )}

      {!loading && !error && groups.length > 0 && (
        <div className="profile-my-groups-list">
          {groups.map((group) => (
            <Link className="profile-my-group-link" to={`/grupo/${group.id}`} key={group.id}>
              <span className="profile-my-group-icon" aria-hidden="true">{group.icon || '✦'}</span>
              <span className="profile-my-group-info">
                <strong>{group.title}</strong>
                <small>{group.topic}</small>
              </span>
              <span aria-hidden="true">›</span>
            </Link>
          ))}
        </div>
      )}

      <Link className="profile-my-groups-discover" to="/#foros-populares">
        Explorar foros
      </Link>
    </section>
  )
}