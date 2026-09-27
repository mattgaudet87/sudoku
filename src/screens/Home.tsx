import { Settings as SettingsIcon } from 'lucide-react'
import { useState } from 'react'
import SettingsPanel from '../components/SettingsPanel'
import StatsPanel from '../components/StatsPanel'
import type { Difficulty } from '../lib/sudoku'
import {
  type GameState,
  type Settings,
  createGame,
  currentStreak,
  loadGame,
  loadSettings,
  loadStats,
  recordResult,
  saveGame,
  saveSettings,
  setLastPlayedDifficulty,
} from '../lib/storage'

type HomeProps = {
  onPlay: () => void
}

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'expert']

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function percentFilled(game: GameState): number {
  const filled = game.puzzle.filter((clue, i) => clue !== 0 || game.entries[i] !== 0).length
  return Math.round((filled / 81) * 100)
}

export default function Home({ onPlay }: HomeProps) {
  const [savedGame, setSavedGame] = useState<GameState | null>(loadGame)
  const [stats, setStats] = useState(loadStats)
  const [settings, setSettings] = useState(loadSettings)
  const [statsTab, setStatsTab] = useState<Difficulty>(() => stats.lastPlayedDifficulty)
  const [pendingDifficulty, setPendingDifficulty] = useState<Difficulty | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  function startNewGame(difficulty: Difficulty) {
    const next = createGame(difficulty)
    saveGame(next)
    setLastPlayedDifficulty(difficulty)
    setSavedGame(next)
    onPlay()
  }

  function handleNewGameClick(difficulty: Difficulty) {
    if (savedGame) {
      setPendingDifficulty(difficulty)
      return
    }
    startNewGame(difficulty)
  }

  function confirmAbandon() {
    if (!pendingDifficulty || !savedGame) return
    const updatedStats = recordResult(savedGame.difficulty, savedGame.elapsedSeconds, false)
    setStats(updatedStats)
    startNewGame(pendingDifficulty)
    setPendingDifficulty(null)
  }

  function cancelAbandon() {
    setPendingDifficulty(null)
  }

  function handleSettingsChange(next: Settings) {
    setSettings(next)
    saveSettings(next)
  }

  const streak = currentStreak(stats)

  return (
    <div className="mx-auto flex min-h-screen max-w-[440px] flex-col gap-6 p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-medium text-text">Wolf Sudoku</h1>
        <button
          type="button"
          onClick={() => setShowSettings(true)}
          className="flex min-h-11 min-w-11 items-center justify-center text-muted"
        >
          <SettingsIcon size={22} />
        </button>
      </header>

      {savedGame && (
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium capitalize text-text">{savedGame.difficulty}</span>
            <span className="text-sm text-muted">{formatTime(savedGame.elapsedSeconds)}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-border">
            <div className="h-full bg-gold" style={{ width: `${percentFilled(savedGame)}%` }} />
          </div>
          <button
            type="button"
            onClick={onPlay}
            className="mt-2 min-h-11 rounded-md bg-gold font-medium text-background"
          >
            Play
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-sm text-muted">New game</span>
        <div className="grid grid-cols-4 gap-2">
          {DIFFICULTIES.map((difficulty) => (
            <button
              key={difficulty}
              type="button"
              onClick={() => handleNewGameClick(difficulty)}
              className="min-h-11 rounded-md border border-border bg-surface text-sm capitalize text-gold"
            >
              {difficulty}
            </button>
          ))}
        </div>
      </div>

      <StatsPanel
        stats={stats}
        streak={streak}
        selectedDifficulty={statsTab}
        onSelectDifficulty={setStatsTab}
        onPlayEmpty={handleNewGameClick}
      />

      {pendingDifficulty && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-background/80 p-4">
          <div className="flex w-full max-w-xs flex-col gap-4 rounded-lg border border-border bg-surface p-4 text-center">
            <p className="text-text">Abandon current game? It will count as a loss.</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={cancelAbandon}
                className="min-h-11 flex-1 rounded-md border border-border text-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmAbandon}
                className="min-h-11 flex-1 rounded-md bg-error font-medium text-background"
              >
                Abandon
              </button>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <SettingsPanel settings={settings} onChange={handleSettingsChange} onClose={() => setShowSettings(false)} />
      )}
    </div>
  )
}
