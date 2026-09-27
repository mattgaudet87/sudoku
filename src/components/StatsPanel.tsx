import { Flame } from 'lucide-react'
import type { Difficulty } from '../lib/sudoku'
import { averageWinSeconds, type Stats } from '../lib/storage'

type StatsPanelProps = {
  stats: Stats
  streak: number
  selectedDifficulty: Difficulty
  onSelectDifficulty: (difficulty: Difficulty) => void
  onPlayEmpty: (difficulty: Difficulty) => void
}

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'expert']

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.round(totalSeconds % 60)
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export default function StatsPanel({
  stats,
  streak,
  selectedDifficulty,
  onSelectDifficulty,
  onPlayEmpty,
}: StatsPanelProps) {
  const bucket = stats[selectedDifficulty]
  const winRate = bucket.played > 0 ? Math.round((bucket.won / bucket.played) * 100) : 0
  const average = averageWinSeconds(bucket)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-text">Stats</h2>
        <div className="flex items-center gap-1 text-gold">
          <Flame size={18} />
          <span className="text-sm font-medium">{streak}</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {DIFFICULTIES.map((difficulty) => (
          <button
            key={difficulty}
            type="button"
            onClick={() => onSelectDifficulty(difficulty)}
            className={`min-h-11 rounded-md border text-sm capitalize ${
              difficulty === selectedDifficulty
                ? 'border-gold bg-gold/15 text-gold'
                : 'border-border bg-surface text-muted'
            }`}
          >
            {difficulty}
          </button>
        ))}
      </div>

      {bucket.played === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface p-6 text-center">
          <p className="text-muted">
            No <span className="capitalize">{selectedDifficulty}</span> games yet
          </p>
          <button
            type="button"
            onClick={() => onPlayEmpty(selectedDifficulty)}
            className="min-h-11 rounded-md bg-gold px-6 font-medium capitalize text-background"
          >
            Play {selectedDifficulty}
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-border bg-surface p-3">
              <p className="text-xs text-muted">Games won</p>
              <p className="text-lg font-medium text-text">{bucket.won}</p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-3">
              <p className="text-xs text-muted">Win rate</p>
              <p className="text-lg font-medium text-text">{winRate}%</p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-3">
              <p className="text-xs text-muted">Best time</p>
              <p className="text-lg font-medium text-text">
                {bucket.bestSeconds !== null ? formatTime(bucket.bestSeconds) : '--:--'}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-3">
              <p className="text-xs text-muted">Average time</p>
              <p className="text-lg font-medium text-text">{average !== null ? formatTime(average) : '--:--'}</p>
            </div>
          </div>

          <div className="flex flex-col">
            {bucket.recent.map((recentGame, i) => (
              <div
                key={`${recentGame.date}-${i}`}
                className="flex items-center justify-between border-b border-border py-2 text-sm last:border-b-0"
              >
                <span className="text-muted">{recentGame.date}</span>
                <span className="text-text">{formatTime(recentGame.seconds)}</span>
                <span className={recentGame.won ? 'text-gold' : 'text-error'}>
                  {recentGame.won ? 'Won' : 'Lost'}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
