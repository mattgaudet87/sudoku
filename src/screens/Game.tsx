import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import Board from '../components/Board'
import NumberPad from '../components/NumberPad'
import Toolbar from '../components/Toolbar'
import { generatePuzzle, peers } from '../lib/sudoku'
import {
  type GameState,
  clearGame,
  loadGame,
  loadSettings,
  recordResult,
  saveGame,
} from '../lib/storage'

type GameProps = {
  onHome: () => void
}

type Status = 'playing' | 'solved' | 'lost'

function initGame(): GameState {
  const saved = loadGame()
  if (saved) return saved

  const { puzzle, solution } = generatePuzzle('medium')
  return {
    schemaVersion: 1,
    difficulty: 'medium',
    puzzle,
    solution,
    entries: new Array(81).fill(0),
    notes: Array.from({ length: 81 }, () => []),
    elapsedSeconds: 0,
    mistakes: 0,
    hintsUsed: 0,
    startedAt: new Date().toISOString(),
    history: [],
  }
}

function isSolved(game: GameState): boolean {
  return game.puzzle.every((clue, index) => clue !== 0 || game.entries[index] === game.solution[index])
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export default function Game({ onHome }: GameProps) {
  const [game, setGame] = useState<GameState>(initGame)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [notesMode, setNotesMode] = useState(false)
  // A loaded game is never solved or lost: commit() clears storage the
  // instant either happens, so a fresh load is always still in progress.
  const [status, setStatus] = useState<Status>('playing')
  const [settings] = useState(loadSettings)

  // Persist immediately on mount too, so a brand-new game survives a reload
  // before the first move.
  useEffect(() => {
    saveGame(game)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (status !== 'playing') return
    const interval = setInterval(() => {
      if (document.hidden) return
      setGame((current) => {
        const next = { ...current, elapsedSeconds: current.elapsedSeconds + 1 }
        if (next.elapsedSeconds % 5 === 0) saveGame(next)
        return next
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [status])

  function commit(next: GameState) {
    setGame(next)
    saveGame(next)

    if (isSolved(next)) {
      setStatus('solved')
      recordResult(next.difficulty, next.elapsedSeconds, true)
      clearGame()
      return
    }

    if (settings.threeStrikeMode && next.mistakes >= 3) {
      setStatus('lost')
      recordResult(next.difficulty, next.elapsedSeconds, false)
      clearGame()
    }
  }

  function handleSelectCell(index: number) {
    if (status !== 'playing') return
    setSelectedIndex(index)
  }

  function handleNumberInput(value: number) {
    if (status !== 'playing' || selectedIndex === null) return
    const index = selectedIndex
    if (game.puzzle[index] !== 0) return

    if (notesMode) {
      if (game.entries[index] !== 0) return
      const currentNotes = game.notes[index]
      const nextNotes = currentNotes.includes(value)
        ? currentNotes.filter((n) => n !== value)
        : [...currentNotes, value].sort((a, b) => a - b)
      const notes = game.notes.map((n, i) => (i === index ? nextNotes : n))
      commit({ ...game, notes })
      return
    }

    if (game.entries[index] === value) return

    const entries = game.entries.slice()
    let notes = game.notes
    let mistakes = game.mistakes

    entries[index] = value
    notes = notes.map((n, i) => (i === index ? [] : n))

    if (value === game.solution[index]) {
      notes = notes.map((n, i) => (peers(index).includes(i) ? n.filter((v) => v !== value) : n))
    } else {
      mistakes += 1
    }

    const history = [
      ...game.history,
      { type: 'entry' as const, index, previousValue: game.entries[index], previousNotes: game.notes[index] },
    ]

    commit({ ...game, entries, notes, mistakes, history })
  }

  function handleErase() {
    if (status !== 'playing' || selectedIndex === null) return
    const index = selectedIndex
    if (game.puzzle[index] !== 0) return
    if (game.entries[index] === 0 && game.notes[index].length === 0) return

    const entries = game.entries.map((v, i) => (i === index ? 0 : v))
    const notes = game.notes.map((n, i) => (i === index ? [] : n))
    const history = [
      ...game.history,
      { type: 'erase' as const, index, previousValue: game.entries[index], previousNotes: game.notes[index] },
    ]

    commit({ ...game, entries, notes, history })
  }

  function handleHint() {
    if (status !== 'playing') return

    const needsHint =
      selectedIndex !== null &&
      game.puzzle[selectedIndex] === 0 &&
      (game.entries[selectedIndex] === 0 || game.entries[selectedIndex] !== game.solution[selectedIndex])

    let index: number | null = needsHint ? selectedIndex : null

    if (index === null) {
      const emptyCells = game.puzzle
        .map((clue, i) => (clue === 0 && game.entries[i] === 0 ? i : -1))
        .filter((i) => i !== -1)
      if (emptyCells.length === 0) return
      index = emptyCells[Math.floor(Math.random() * emptyCells.length)]
    }

    const targetIndex = index
    const value = game.solution[targetIndex]
    const entries = game.entries.map((v, i) => (i === targetIndex ? value : v))
    const notes = game.notes.map((n, i) =>
      i === targetIndex ? [] : peers(targetIndex).includes(i) ? n.filter((v) => v !== value) : n,
    )
    const history = [
      ...game.history,
      {
        type: 'hint' as const,
        index: targetIndex,
        previousValue: game.entries[targetIndex],
        previousNotes: game.notes[targetIndex],
      },
    ]

    commit({ ...game, entries, notes, hintsUsed: game.hintsUsed + 1, history })
  }

  function handleUndo() {
    if (status !== 'playing' || game.history.length === 0) return
    const last = game.history[game.history.length - 1]
    const entries = game.entries.map((v, i) => (i === last.index ? last.previousValue : v))
    const notes = game.notes.map((n, i) => (i === last.index ? last.previousNotes : n))
    const history = game.history.slice(0, -1)
    commit({ ...game, entries, notes, history })
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (status !== 'playing') return

      if (event.key >= '1' && event.key <= '9') {
        handleNumberInput(Number(event.key))
        return
      }
      if (event.key === 'Backspace' || event.key === 'Delete') {
        handleErase()
        return
      }
      if (event.key === 'n' || event.key === 'N') {
        setNotesMode((v) => !v)
        return
      }

      const deltas: Record<string, number> = {
        ArrowUp: -9,
        ArrowDown: 9,
        ArrowLeft: -1,
        ArrowRight: 1,
      }
      const delta = deltas[event.key]
      if (delta === undefined) return

      event.preventDefault()
      setSelectedIndex((current) => {
        const base = current ?? 40
        const row = Math.floor(base / 9)
        const col = base % 9
        if (event.key === 'ArrowLeft' && col === 0) return base
        if (event.key === 'ArrowRight' && col === 8) return base
        if (event.key === 'ArrowUp' && row === 0) return base
        if (event.key === 'ArrowDown' && row === 8) return base
        return base + delta
      })
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, game, selectedIndex, notesMode])

  const completed = Array.from({ length: 9 }, (_, i) => {
    const digit = i + 1
    let count = 0
    for (let index = 0; index < 81; index++) {
      const value = game.puzzle[index] !== 0 ? game.puzzle[index] : game.entries[index]
      const correct = game.puzzle[index] !== 0 || game.entries[index] === game.solution[index]
      if (value === digit && correct) count++
    }
    return count >= 9
  })

  return (
    <div className="mx-auto flex min-h-screen max-w-[440px] flex-col gap-4 p-4">
      <header className="flex items-center justify-between">
        <button type="button" onClick={onHome} className="flex min-h-11 min-w-11 items-center justify-center text-text">
          <ArrowLeft size={22} />
        </button>
        <span className="text-sm font-medium capitalize text-text">{game.difficulty}</span>
        <span className="text-sm text-muted">Mistakes: {game.mistakes}</span>
        <span className="text-sm tabular-nums text-text">{formatTime(game.elapsedSeconds)}</span>
      </header>

      {status === 'solved' ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <p className="text-2xl font-medium text-gold">Solved</p>
          <p className="text-sm text-muted">Time {formatTime(game.elapsedSeconds)}</p>
          <button type="button" onClick={onHome} className="mt-4 min-h-11 rounded-md border border-border bg-surface px-6 text-gold">
            Home
          </button>
        </div>
      ) : status === 'lost' ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <p className="text-2xl font-medium text-error">Out of strikes</p>
          <button type="button" onClick={onHome} className="mt-4 min-h-11 rounded-md border border-border bg-surface px-6 text-gold">
            Home
          </button>
        </div>
      ) : (
        <>
          <Board
            puzzle={game.puzzle}
            entries={game.entries}
            notes={game.notes}
            solution={game.solution}
            selectedIndex={selectedIndex}
            highlightMistakes={settings.highlightMistakes}
            onSelectCell={handleSelectCell}
          />
          <Toolbar
            notesMode={notesMode}
            canUndo={game.history.length > 0}
            onUndo={handleUndo}
            onErase={handleErase}
            onToggleNotes={() => setNotesMode((v) => !v)}
            onHint={handleHint}
          />
          <NumberPad completed={completed} onPress={handleNumberInput} />
        </>
      )}
    </div>
  )
}
