import { FORUM_ICONS, forumIconUrl } from '../services/visualAssets'

export default function ForumIconPicker({ value, onChange, name = 'Icono del foro' }) {
  return (
    <fieldset className="forum-icon-fieldset">
      <legend>{name}</legend>
      <div className="forum-icon-picker">
        {FORUM_ICONS.map((icon) => (
          <button
            key={icon}
            type="button"
            className={`forum-icon-choice${value === icon ? ' is-selected' : ''}`}
            aria-label={`Elegir icono ${icon.replace('-', ' ')}`}
            aria-pressed={value === icon}
            onClick={() => onChange(icon)}
          >
            <img src={forumIconUrl(icon)} alt="" />
          </button>
        ))}
      </div>
    </fieldset>
  )
}
