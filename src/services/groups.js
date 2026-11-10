import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { authReady, db } from '../firebase'
import { FEATURED_FORUMS, getFeaturedForum } from './featuredForums'

const groupsCollection = collection(db, 'groups')

function cleanGroup(data) {
  const title = data.title.trim()
  const description = data.description.trim()
  const topic = data.topic.trim()
  if (title.length < 3 || title.length > 60) {
    throw new Error('El nombre debe tener entre 3 y 60 caracteres.')
  }
  if (description.length < 10 || description.length > 300) {
    throw new Error('La descripción debe tener entre 10 y 300 caracteres.')
  }
  if (topic.length < 3 || topic.length > 35) {
    throw new Error('La temática debe tener entre 3 y 35 caracteres.')
  }
  return { title, description, topic }
}

async function currentUid() {
  const credential = await authReady
  return credential.user.uid
}

// Los foros editoriales tienen membresías y mensajes reales, pero sus
// descripciones no dependen de que alguien cree una cuenta de ejemplo.
export function groupCollectionName(groupId) {
  return getFeaturedForum(groupId) ? 'featuredGroups' : 'groups'
}

export function groupSubcollection(groupId, name) {
  return collection(db, groupCollectionName(groupId), groupId, name)
}

function memberRef(groupId, userId) {
  return doc(db, groupCollectionName(groupId), groupId, 'members', userId)
}

export async function getGroups() {
  await authReady
  const snapshot = await getDocs(groupsCollection)
  return snapshot.docs
    .map((item) => ({ id: item.id, ...item.data() }))
    .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
}

export async function getGroupById(groupId) {
  const featured = getFeaturedForum(groupId)
  if (featured) return featured
  await authReady
  const snapshot = await getDoc(doc(db, 'groups', groupId))
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null
}

export async function createGroup(data) {
  const userId = await currentUid()
  const groupRef = doc(groupsCollection)
  // El foro empieza sin publicaciones y su creador queda siguiéndolo.
  await setDoc(groupRef, {
    ...cleanGroup(data),
    icon: '✦',
    ownerId: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  // La subcolección de seguimiento es necesaria para poder publicar.
  // Primero se crea el foro, porque las reglas pueden exigir que exista.
  await setDoc(memberRef(groupRef.id, userId), {
    userId,
    joinedAt: serverTimestamp(),
  })
  return groupRef.id
}

export async function editGroup(groupId, data) {
  if (getFeaturedForum(groupId)) throw new Error('No se puede editar este foro.')
  const userId = await currentUid()
  const group = await getGroupById(groupId)
  if (!group || group.ownerId !== userId) {
    throw new Error('No tenés permisos para editar este grupo.')
  }
  await updateDoc(doc(db, 'groups', groupId), {
    ...cleanGroup(data),
    updatedAt: serverTimestamp(),
  })
}

export async function removeGroup(groupId) {
  if (getFeaturedForum(groupId)) throw new Error('No se puede eliminar este foro.')
  const userId = await currentUid()
  const group = await getGroupById(groupId)
  if (!group || group.ownerId !== userId) {
    throw new Error('No tenés permisos para eliminar este grupo.')
  }
  // Firestore no borra automáticamente las subcolecciones.
  const [members, messages] = await Promise.all([
    getDocs(groupSubcollection(groupId, 'members')),
    getDocs(groupSubcollection(groupId, 'messages')),
  ])
  if (members.size + messages.size > 400) {
    throw new Error('Este grupo tiene demasiados datos para eliminarlo desde la web.')
  }
  const batch = writeBatch(db)
  members.docs.forEach((item) => batch.delete(item.ref))
  messages.docs.forEach((item) => batch.delete(item.ref))
  batch.delete(doc(db, 'groups', groupId))
  await batch.commit()
}

export async function joinGroup(groupId) {
  const userId = await currentUid()
  const group = await getGroupById(groupId)
  if (!group) throw new Error('El grupo ya no existe.')
  const ref = memberRef(groupId, userId)
  if ((await getDoc(ref)).exists()) return
  await setDoc(ref, { userId, joinedAt: serverTimestamp() })
}

export async function leaveGroup(groupId) {
  const userId = await currentUid()
  const group = await getGroupById(groupId)
  if (group?.ownerId === userId) {
    throw new Error('No podés dejar de seguir un foro que creaste.')
  }
  await deleteDoc(memberRef(groupId, userId))
}

export async function getGroupMembers(groupId) {
  await authReady
  const snapshot = await getDocs(groupSubcollection(groupId, 'members'))
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
}

export async function getMyGroups() {
  const userId = await currentUid()
  const groups = [...FEATURED_FORUMS, ...(await getGroups())]
  const checks = await Promise.all(groups.map(async (group) => {
    const membership = await getDoc(memberRef(group.id, userId))
    return membership.exists() || group.ownerId === userId ? group : null
  }))
  return checks.filter(Boolean)
}

export async function getCurrentGroupUserId() {
  return currentUid()
}
// Comprueba únicamente la membresía del usuario actual, sin cargar la lista pública.
export async function isFollowingForum(groupId) {
  const userId = await currentUid()
  const membership = await getDoc(memberRef(groupId, userId))
  return membership.exists()
}