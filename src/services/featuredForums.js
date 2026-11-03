// Contenido editorial de SeriesHub, disponible desde el primer día.
// No representa usuarios ni mensajes de personas ficticias.
export const FEATURED_FORUMS = [
  {
    id: 'teorias-finales',
    icon: '✦',
    title: 'Teorías y finales',
    description: 'Debatí interpretaciones, pistas y finales inesperados.',
    topic: 'Debate',
    featured: true,
    prompts: [
      '¿Qué final de una serie te hizo cambiar por completo tu interpretación?',
      '¿Qué teoría de una serie defendiste hasta el último capítulo?',
    ],
  },
  {
    id: 'viendo-ahora',
    icon: '▶',
    title: '¿Qué estamos viendo?',
    description: 'Compartí qué estás mirando y descubrí nuevas series.',
    topic: 'Recomendaciones',
    featured: true,
    prompts: [
      '¿Cuál fue la última serie que empezaste y por qué la elegiste?',
      '¿Qué serie recomendarías para una maratón de fin de semana?',
    ],
  },
  {
    id: 'sin-spoilers',
    icon: '◈',
    title: 'Recomendaciones sin spoilers',
    description: 'Encontrá tu próxima serie sin arruinarte ninguna sorpresa.',
    topic: 'Sin spoilers',
    featured: true,
    prompts: [
      'Recomendá una serie en una sola frase, sin revelar su trama.',
      '¿Qué serie te sorprendió y preferís que los demás descubran sin saber nada?',
    ],
  },
]

export function getFeaturedForum(id) {
  return FEATURED_FORUMS.find((group) => group.id === id) ?? null
}