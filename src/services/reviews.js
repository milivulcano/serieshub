import { db, authReady } from '../firebase'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore'

const reviewsCollection = collection(db, 'reviews')

// Obtiene las reseñas de una serie.
export async function getSeriesReviews(seriesId) {
  await authReady

  const reviewsQuery = query(
    reviewsCollection,
    where('seriesId', '==', Number(seriesId))
  )

  const snapshot = await getDocs(reviewsQuery)

  const reviews = snapshot.docs.map((reviewDoc) => ({
    id: reviewDoc.id,
    ...reviewDoc.data(),
  }))

  return reviews.sort((a, b) => {
    const dateA = a.createdAt?.toMillis?.() ?? 0
    const dateB = b.createdAt?.toMillis?.() ?? 0
    return dateB - dateA
  })
}

// Crea una reseña para la serie.
export async function createReview({ seriesId, rating, text }) {
  const credential = await authReady
  const normalizedText = text.trim()
  const normalizedRating = Number(rating)

  if (!Number.isInteger(normalizedRating) ||
      normalizedRating < 1 ||
      normalizedRating > 5) {
    throw new Error('La puntuación debe estar entre 1 y 5.')
  }

  if (!normalizedText || normalizedText.length > 1000) {
    throw new Error('La reseña debe tener entre 1 y 1000 caracteres.')
  }

  const review = {
    seriesId: Number(seriesId),
    rating: normalizedRating,
    text: normalizedText,
    userId: credential.user.uid,
    createdAt: serverTimestamp(),
  }

  console.log('Intentando guardar reseña:', review)

  const reviewRef = await addDoc(reviewsCollection, review)

  console.log('Reseña guardada en Firestore. ID:', reviewRef.id)

  return reviewRef.id 
}

// Elimina una reseña propia.
// Las reglas de Firestore verifican los permisos.
export async function deleteReview(reviewId) {
  await authReady
  return deleteDoc(doc(db, 'reviews', reviewId))
}

// Devuelve el identificador del usuario actual.
export async function getCurrentUserId() {
  const credential = await authReady
  return credential.user.uid
}