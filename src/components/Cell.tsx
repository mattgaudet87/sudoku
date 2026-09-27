type CellProps = {
  value: number
  given: boolean
  wrong: boolean
  selected: boolean
  peerHighlight: boolean
  sameNumberHighlight: boolean
  notes: number[]
  thickRight: boolean
  thickBottom: boolean
  onSelect: () => void
}

export default function Cell({
  value,
  given,
  wrong,
  selected,
  peerHighlight,
  sameNumberHighlight,
  notes,
  thickRight,
  thickBottom,
  onSelect,
}: CellProps) {
  let background = ''
  if (selected) background = 'bg-gold/25'
  else if (sameNumberHighlight) background = 'bg-gold/15'
  else if (peerHighlight) background = 'bg-surface'

  let textClass = 'text-text font-medium'
  if (!given) textClass = wrong ? 'text-error font-medium' : 'text-gold font-medium'

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative flex aspect-square items-center justify-center border-t border-l border-border text-lg select-none outline-none ${background} ${
        thickRight ? 'border-r-2 border-r-muted' : ''
      } ${thickBottom ? 'border-b-2 border-b-muted' : ''}`}
    >
      {value !== 0 ? (
        <span className={textClass}>{value}</span>
      ) : notes.length > 0 ? (
        <span className="grid grid-cols-3 grid-rows-3 h-full w-full p-0.5 text-[8px] leading-none text-muted">
          {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
            <span key={n} className="flex items-center justify-center">
              {notes.includes(n) ? n : ''}
            </span>
          ))}
        </span>
      ) : null}
    </button>
  )
}
