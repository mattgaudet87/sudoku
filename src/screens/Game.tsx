type GameProps = {
  onHome: () => void
}

export default function Game({ onHome }: GameProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="text-2xl font-medium text-text">Game screen</h1>
      <button
        onClick={onHome}
        className="min-h-11 min-w-11 rounded-lg border border-border bg-surface px-6 py-3 text-gold"
      >
        Go to home
      </button>
    </div>
  )
}
