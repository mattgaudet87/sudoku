type NumberPadProps = {
  completed: boolean[]
  onPress: (value: number) => void
}

export default function NumberPad({ completed, onPress }: NumberPadProps) {
  return (
    <div className="grid grid-cols-9 gap-1">
      {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onPress(n)}
          className={`min-h-11 rounded-md border border-border bg-surface text-lg font-medium ${
            completed[n - 1] ? 'text-muted/40' : 'text-gold'
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  )
}
