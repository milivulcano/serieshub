export default function SearchBar({ value, onChange }) {
  return (
    <input
      type="search"
      className="search"
      placeholder="Buscar una serie…"
      aria-label="Buscar una serie"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}