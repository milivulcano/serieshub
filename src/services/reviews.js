import { db, authReady } from '../firebase'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
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

// Valida y prepara los datos de una reseña.
function normalizeReview({ seriesId, seriesName, rating, text }) {
  const normalizedText = text.trim()
  const normalizedRating = Number(rating)
  const normalizedSeriesName = String(seriesName ?? '').trim()

  if (
    !Number.isInteger(normalizedRating) ||
    normalizedRating < 1 ||
    normalizedRating > 5
  ) {
    throw new Error('La puntuación debe estar entre 1 y 5.')
  }

  if (!normalizedText || normalizedText.length > 1000) {
    throw new Error('La reseña debe tener entre 1 y 1000 caracteres.')
  }

  if (!normalizedSeriesName) {
    throw new Error('No se encontró el nombre de la serie.')
  }

  return {
    seriesId: Number(seriesId),
    seriesName: normalizedSeriesName,
    rating: normalizedRating,
    text: normalizedText,
  }
}

// Crea una reseña nueva.
export async function createReview({
  seriesId,
  seriesName,
  rating,
  text,
}) {
  const credential = await authReady

  const normalized = normalizeReview({
    seriesId,
    seriesName,
    rating,
    text,
  })

  const review = {
    ...normalized,
    userId: credential.user.uid,
    createdAt: serverTimestamp(),
  }

  const reviewRef = await addDoc(reviewsCollection, review)

  return reviewRef.id
}

// Actualiza la puntuación y el texto de una reseña existente.
export async function updateReview(reviewId, {
  seriesId,
  seriesName,
  rating,
  text,
}) {
  await authReady

  const normalized = normalizeReview({
    seriesId,
    seriesName,
    rating,
    text,
  })

  await updateDoc(doc(db, 'reviews', reviewId), normalized)
}

// Elimina una reseña.
// Las reglas de Firestore verifican que sea propia.
export async function deleteReview(reviewId) {
  await authReady
  return deleteDoc(doc(db, 'reviews', reviewId))
}

// Devuelve el identificador del usuario actual.
export async function getCurrentUserId() {
  const credential = await authReady
  return credential.user.uid
}