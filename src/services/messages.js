import {
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { authReady, db } from '../firebase'
import { getGroupById, groupCollectionName, groupSubcollection } from './groups'

const MAX_MESSAGE_LENGTH = 1000

function cleanMessage(text) {
  const content = text.trim()
  if (!content || content.length > MAX_MESSAGE_LENGTH) {
    throw new Error('El mensaje debe tener entre 1 y 1000 caracteres.')
  }
  return content
}

async function requireMember(groupId) {
  const credential = await authReady
  const uid = credential.user.uid
  const group = await getGroupById(groupId)
  if (!group) throw new Error('Este grupo ya no existe.')
  const member = await getDoc(doc(db, groupCollectionName(groupId), groupId, 'members', uid))
  if (!member.exists()) throw new Error('Unite al grupo para escribir mensajes.')
  return uid
}

// La suscripción recibe actualizaciones de Firestore mientras la página esté abierta.
export function subscribeGroupMessages(groupId, onMessages, onError) {
  const messagesQuery = query(groupSubcollection(groupId, 'messages'), orderBy('createdAt', 'asc'))
  return onSnapshot(
    messagesQuery,
    (snapshot) => onMessages(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))),
    onError
  )
}

export async function sendGroupMessage(groupId, text) {
  const userId = await requireMember(groupId)
  await addDoc(groupSubcollection(groupId, 'messages'), {
    userId,
    text: cleanMessage(text),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function editGroupMessage(groupId, messageId, text) {
  const userId = await requireMember(groupId)
  const ref = doc(db, groupCollectionName(groupId), groupId, 'messages', messageId)
  const snapshot = await getDoc(ref)
  if (!snapshot.exists() || snapshot.data().userId !== userId) {
    throw new Error('No podés editar este mensaje.')
  }
  await updateDoc(ref, { text: cleanMessage(text), updatedAt: serverTimestamp() })
}

export async function deleteGroupMessage(groupId, messageId) {
  const userId = await requireMember(groupId)
  const ref = doc(db, groupCollectionName(groupId), groupId, 'messages', messageId)
  const snapshot = await getDoc(ref)
  if (!snapshot.exists() || snapshot.data().userId !== userId) {
    throw new Error('No podés eliminar este mensaje.')
  }
  await deleteDoc(ref)
}