import { db, authReady } from '../firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'

// Devuelve la referencia al documento del usuario actual.
async function getUserDocument() {
  const credential = await authReady

  return doc(db, 'users', credential.user.uid)
}

// Obtiene los datos del perfil.
// Si todavía no existe un perfil, devuelve valores iniciales.
export async function getProfile() {
  const userDocument = await getUserDocument()
  const snapshot = await getDoc(userDocument)

  if (!snapshot.exists()) {
    return {
      username: 'Usuario de SeriesHub',
      description: '',
      avatarPath: '',
      avatarName: '',
      topFavorites: [],
    }
  }

  const profile = snapshot.data().profile ?? {}

  return {
    username: profile.username ?? 'Usuario de SeriesHub',
    description: profile.description ?? '',
    avatarPath: profile.avatarPath ?? '',
    avatarName: profile.avatarName ?? '',
    topFavorites: Array.isArray(profile.topFavorites)
      ? profile.topFavorites.slice(0, 4)
      : [],
  }
}

// Guarda los cambios del perfil sin modificar las listas existentes.
export async function saveProfile(profileData) {
  const userDocument = await getUserDocument()

  const profile = {
    username: String(
      profileData.username ?? 'Usuario de SeriesHub'
    ).trim() || 'Usuario de SeriesHub',

    description: String(profileData.description ?? '').trim(),

    avatarPath: String(profileData.avatarPath ?? ''),
    avatarName: String(profileData.avatarName ?? ''),

    topFavorites: Array.isArray(profileData.topFavorites)
      ? profileData.topFavorites.slice(0, 4)
      : [],
  }

  await setDoc(
    userDocument,
    { profile },
    { merge: true }
  )

  return profile
}