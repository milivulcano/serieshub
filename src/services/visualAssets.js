// Recursos de identidad visual de SeriesHub. Se sirven desde /public/assets.
export const AVATAR_STYLES = [
  { id: 'clasico', label: 'Clásico' },
  { id: 'feliz', label: 'Feliz' },
  { id: 'emocionado', label: 'Emocionado' },
  { id: 'guiño', label: 'Guiño' },
]
export const AVATAR_COLORS = [
  { id: 'turquesa', label: 'Turquesa', hex: '#7bc7c0' },
  { id: 'rosa', label: 'Rosa', hex: '#ee7289' },
  { id: 'amarillo', label: 'Amarillo', hex: '#ffd93d' },
  { id: 'azul', label: 'Azul', hex: '#586cb2' },
  { id: 'violeta', label: 'Violeta', hex: '#9482bc' },
]
export const FORUM_ICONS = [
  'terror', 'misterio', 'romance', 'ciencia-ficcion', 'fantasia', 'drama',
  'comedia', 'estrenos', 'debates', 'recomendaciones', 'eventos', 'calendario',
]
export const DEFAULT_AVATAR_STYLE = 'clasico'
export const DEFAULT_AVATAR_COLOR = 'turquesa'
export const DEFAULT_FORUM_ICON = 'debates'
export const avatarAssetUrl = (style = DEFAULT_AVATAR_STYLE, color = DEFAULT_AVATAR_COLOR) =>
  `/assets/avatars/${AVATAR_STYLES.some((item) => item.id === style) ? style : DEFAULT_AVATAR_STYLE}-${AVATAR_COLORS.some((item) => item.id === color) ? color : DEFAULT_AVATAR_COLOR}.svg`
export const forumIconUrl = (icon = DEFAULT_FORUM_ICON) =>
  `/assets/foros/${FORUM_ICONS.includes(icon) ? icon : DEFAULT_FORUM_ICON}.svg?v=2`
// Los foros antiguos guardaban caracteres Unicode. Se representan con SVG sin modificar sus documentos.
export const forumIconForGroup = (group) =>
  FORUM_ICONS.includes(group?.icon) ? group.icon :
  group?.id === 'teorias-finales' ? 'misterio' :
  group?.id === 'viendo-ahora' ? 'estrenos' :
  group?.id === 'sin-spoilers' ? 'recomendaciones' : DEFAULT_FORUM_ICON
