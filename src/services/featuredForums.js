// Foros editoriales disponibles para todos. Sus publicaciones iniciales
// son datos ficticios de muestra, no documentos ni cuentas de Firebase.
export const FEATURED_FORUMS = [
  { id: 'teorias-finales', icon: '✦', title: 'Teorías y finales', description: 'Debatí interpretaciones, pistas y finales inesperados.', topic: 'Debate', featured: true },
  { id: 'viendo-ahora', icon: '▶', title: '¿Qué estamos viendo?', description: 'Compartí qué estás mirando y descubrí nuevas series.', topic: 'Recomendaciones', featured: true },
  { id: 'sin-spoilers', icon: '◈', title: 'Recomendaciones sin spoilers', description: 'Encontrá tu próxima serie sin arruinarte ninguna sorpresa.', topic: 'Sin spoilers', featured: true },
]

export function getFeaturedForum(id) {
  return FEATURED_FORUMS.find((forum) => forum.id === id) ?? null
}

// Formato: [título, extracto, usuario ficticio, fecha, vistas ficticias, respuestas ficticias]
const SAMPLES = {
  'teorias-finales': [
    ['¿Cuál fue el mejor final de serie que viste?', 'Busco finales que cierren las historias y que tengan algo para debatir después.', 'LunaMaraton', '2026-10-30', 284, 19],
    ['Volví a ver Dark y encontré otra pista', 'Hay detalles de los primeros episodios que cobran otro sentido al terminar la serie.', 'NicoSeries', '2026-10-27', 412, 24],
    ['¿Los finales abiertos son una buena idea?', 'A veces me encanta interpretarlos; otras, siento que faltó una conclusión.', 'SofiEnPantalla', '2026-10-23', 196, 13],
    ['Esa escena de Severance que cambia todo', 'Sin revelar el giro, me impresionó cómo cambia la lectura de una conversación anterior.', 'PixelDrama', '2026-10-19', 341, 21],
    ['Teorías sobre personajes que parecen secundarios', '¿Alguna vez un personaje que casi no aparecía resultó ser la clave?', 'ValeTV', '2026-10-15', 157, 9],
    ['¿Qué pistas se nos escaparon en Lost?', 'Revisité varios capítulos y me sorprendió la cantidad de detalles repetidos.', 'MarcosBinge', '2026-10-11', 231, 17],
    ['El giro que más te sorprendió', 'Me interesan esas historias que parecen ir por un lado y terminan en otro.', 'CamiFiccion', '2026-10-07', 368, 28],
    ['El peso de una buena última temporada', '¿Preferís una serie breve y consistente o una larga con altibajos?', 'MateYSeries', '2026-10-02', 189, 12],
    ['Una teoría sobre los recuerdos en las series', 'Cuando un narrador no es confiable, las escenas anteriores cambian por completo.', 'SeriesConTe', '2026-09-28', 146, 8],
    ['¿Final feliz o final coherente?', 'Creo que un cierre triste puede funcionar mejor si respeta a los personajes.', 'RomiReviews', '2026-09-22', 273, 16],
  ],
  'viendo-ahora': [
    ['¿Qué serie empezaste esta semana?', 'Quiero saber cuáles son las series que más están enganchando ahora.', 'LunaMaraton', '2026-11-01', 325, 22],
    ['Mi maratón del fin de semana', 'Arranqué una temporada el viernes y terminé viendo más capítulos de lo planeado.', 'NicoSeries', '2026-10-29', 208, 12],
    ['¿Una serie corta para ver después de estudiar?', 'Busco algo de pocos capítulos que sea entretenido desde el comienzo.', 'SofiEnPantalla', '2026-10-25', 181, 16],
    ['Volví a empezar The Office', 'Hay comedias que funcionan incluso cuando ya conocés todos los chistes.', 'PixelDrama', '2026-10-21', 294, 20],
    ['¿Seguís varias series al mismo tiempo?', 'Me cuesta decidir si alternar géneros o terminar una antes de empezar otra.', 'ValeTV', '2026-10-17', 133, 9],
    ['La serie que me sacó del bloqueo', 'Había pasado semanas sin encontrar algo para ver hasta que probé un drama corto.', 'MarcosBinge', '2026-10-13', 176, 11],
    ['¿Comedias o dramas para la noche?', 'Cuando tengo poco tiempo prefiero capítulos autoconclusivos.', 'CamiFiccion', '2026-10-09', 220, 14],
    ['Empecé una serie sin ver el tráiler', 'Elegí por la sinopsis y terminé sorprendiéndome con la historia.', 'MateYSeries', '2026-10-05', 142, 7],
    ['¿Qué estás mirando con alguien más?', 'Compartir una serie puede hacer que la experiencia sea mucho más divertida.', 'SeriesConTe', '2026-09-29', 199, 12],
    ['¿Esperar episodios o ver todo junto?', 'Extraño conversar sobre cada capítulo cuando se estrenan semanalmente.', 'RomiReviews', '2026-09-24', 357, 31],
  ],
  'sin-spoilers': [
    ['Recomienden una miniserie atrapante', 'Busco una historia cerrada, con buen ritmo y que no tenga diez temporadas.', 'LunaMaraton', '2026-11-02', 306, 25],
    ['Una comedia para levantar el ánimo', '¿Qué serie liviana recomendarían para desconectarse un rato?', 'NicoSeries', '2026-10-28', 242, 17],
    ['¿Vale la pena empezar The Bear?', 'Me atrae la propuesta, pero no sé si es muy intensa para verla de noche.', 'SofiEnPantalla', '2026-10-24', 418, 27],
    ['Historias de misterio sin terror', 'Quiero resolver pistas, pero prefiero evitar los sustos.', 'PixelDrama', '2026-10-20', 231, 19],
    ['Series ideales para ver en familia', 'Busco historias interesantes que podamos compartir sin escenas demasiado fuertes.', 'ValeTV', '2026-10-16', 185, 10],
    ['Tres series con capítulos cortos', '¿Conocen buenas historias que se puedan ver en ratos de media hora?', 'MarcosBinge', '2026-10-12', 168, 14],
    ['¿Por qué recomendarías Brooklyn Nine-Nine?', 'Me dijeron que tiene personajes muy queribles. Quiero opiniones sin contar tramas.', 'CamiFiccion', '2026-10-08', 271, 18],
    ['Ciencia ficción para principiantes', 'Me gustaría empezar por algo accesible y con personajes memorables.', 'MateYSeries', '2026-10-04', 327, 23],
    ['Series para una tarde de lluvia', 'Es uno de esos días en los que dan ganas de quedarse mirando capítulos.', 'SeriesConTe', '2026-09-30', 144, 9],
    ['Una serie poco conocida que te encantó', 'Quiero encontrar joyitas fuera de las recomendaciones de siempre.', 'RomiReviews', '2026-09-25', 389, 35],
  ],
}

export function getSamplePosts(groupId) {
  return (SAMPLES[groupId] ?? []).map(([title, excerpt, author, date, views, replies], i) => ({
    id: `sample-${groupId}-${i}`,
    title, excerpt, author, date, views, replies,
    sample: true,
  }))
}