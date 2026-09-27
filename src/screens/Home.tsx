type HomeProps = {
  onPlay: () => void
}

export default function Home({ onPlay }: HomeProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="text-2xl font-medium text-text">Home screen</h1>
      <button
        onClick={onPlay}
        className="min-h-11 min-w-11 rounded-lg border border-border bg-surface px-6 py-3 text-gold"
      >
        Go to game
      </button>
    </div>
  )
}
