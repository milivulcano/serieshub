import { DEFAULT_AVATAR_STYLE, DEFAULT_AVATAR_COLOR } from './visualAssets'
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
      username: 'Usuario',
      description: '',
      avatarPath: '',
      avatarName: '',
      avatarStyle: DEFAULT_AVATAR_STYLE,
      avatarColor: DEFAULT_AVATAR_COLOR,
      topFavorites: [],
    }
  }

  const profile = snapshot.data().profile ?? {}

  return {
    username: profile.username ?? 'Usuario',
    description: profile.description ?? '',
    avatarPath: profile.avatarPath ?? '',
    avatarName: profile.avatarName ?? '',
    avatarStyle: profile.avatarStyle ?? DEFAULT_AVATAR_STYLE,
    avatarColor: profile.avatarColor ?? DEFAULT_AVATAR_COLOR,
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
      profileData.username ?? 'Usuario'
    ).trim() || 'Usuario',

    description: String(profileData.description ?? '').trim(),

    avatarPath: String(profileData.avatarPath ?? ''),
    avatarName: String(profileData.avatarName ?? ''),
    avatarStyle: String(profileData.avatarStyle ?? DEFAULT_AVATAR_STYLE),
    avatarColor: String(profileData.avatarColor ?? DEFAULT_AVATAR_COLOR),

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