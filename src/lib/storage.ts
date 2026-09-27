import type { Board, Difficulty } from './sudoku'

const SCHEMA_VERSION = 1

const GAME_KEY = 'wolf-sudoku:game'
const STATS_KEY = 'wolf-sudoku:stats'
const SETTINGS_KEY = 'wolf-sudoku:settings'

export type HistoryEntry = {
  type: 'entry' | 'erase' | 'note' | 'hint'
  index: number
  previousValue: number
  previousNotes: number[]
}

export type GameState = {
  schemaVersion: number
  difficulty: Difficulty
  puzzle: Board
  solution: Board
  entries: Board
  notes: number[][]
  elapsedSeconds: number
  mistakes: number
  hintsUsed: number
  startedAt: string
  history: HistoryEntry[]
}

export type RecentGame = {
  date: string
  seconds: number
  won: boolean
}

export type DifficultyStats = {
  played: number
  won: number
  totalWinSeconds: number
  bestSeconds: number | null
  recent: RecentGame[]
}

export type Stats = {
  schemaVersion: number
  easy: DifficultyStats
  medium: DifficultyStats
  hard: DifficultyStats
  expert: DifficultyStats
  lastPlayedDifficulty: Difficulty
  streak: {
    current: number
    lastWinDate: string | null
  }
}

export type Settings = {
  schemaVersion: number
  threeStrikeMode: boolean
  highlightMistakes: boolean
}

type StorageLike = {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

// Used whenever the real localStorage is unavailable or throws (private
// browsing, storage disabled, non-browser test environment).
const memoryStore: Record<string, string> = {}
const memoryStorage: StorageLike = {
  getItem: (key) => (key in memoryStore ? memoryStore[key] : null),
  setItem: (key, value) => {
    memoryStore[key] = value
  },
  removeItem: (key) => {
    delete memoryStore[key]
  },
}

function getStorage(): StorageLike {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage
    }
  } catch {
    // Accessing localStorage can throw (e.g. Safari private browsing).
  }
  return memoryStorage
}

function readJSON<T>(key: string): T | null {
  try {
    const raw = getStorage().getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function writeJSON(key: string, value: unknown): void {
  try {
    getStorage().setItem(key, JSON.stringify(value))
  } catch {
    // Storage full, disabled or unavailable; the in-memory session state
    // (if that's what getStorage() returned) already holds the value.
  }
}

export function loadGame(): GameState | null {
  const game = readJSON<GameState>(GAME_KEY)
  if (!game || game.schemaVersion !== SCHEMA_VERSION) return null
  return game
}

export function saveGame(game: GameState): void {
  writeJSON(GAME_KEY, { ...game, schemaVersion: SCHEMA_VERSION })
}

export function clearGame(): void {
  try {
    getStorage().removeItem(GAME_KEY)
  } catch {
    // Ignore; nothing more we can do if storage is unavailable.
  }
}

function emptyDifficultyStats(): DifficultyStats {
  return { played: 0, won: 0, totalWinSeconds: 0, bestSeconds: null, recent: [] }
}

function defaultStats(): Stats {
  return {
    schemaVersion: SCHEMA_VERSION,
    easy: emptyDifficultyStats(),
    medium: emptyDifficultyStats(),
    hard: emptyDifficultyStats(),
    expert: emptyDifficultyStats(),
    lastPlayedDifficulty: 'medium',
    streak: { current: 0, lastWinDate: null },
  }
}

export function loadStats(): Stats {
  const stats = readJSON<Stats>(STATS_KEY)
  if (!stats || stats.schemaVersion !== SCHEMA_VERSION) return defaultStats()
  return stats
}

export function saveStats(stats: Stats): void {
  writeJSON(STATS_KEY, { ...stats, schemaVersion: SCHEMA_VERSION })
}

export function averageWinSeconds(bucket: DifficultyStats): number | null {
  return bucket.won > 0 ? bucket.totalWinSeconds / bucket.won : null
}

function defaultSettings(): Settings {
  return { schemaVersion: SCHEMA_VERSION, threeStrikeMode: false, highlightMistakes: true }
}

export function loadSettings(): Settings {
  const settings = readJSON<Settings>(SETTINGS_KEY)
  if (!settings || settings.schemaVersion !== SCHEMA_VERSION) return defaultSettings()
  return settings
}

export function saveSettings(settings: Settings): void {
  writeJSON(SETTINGS_KEY, { ...settings, schemaVersion: SCHEMA_VERSION })
}

function toLocalDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addDays(dateString: string, days: number): string {
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + days)
  return toLocalDateString(date)
}

// The stored streak count can go stale (no win yesterday or today), so the
// display value is derived rather than trusted as-is.
export function currentStreak(stats: Stats, now: Date = new Date()): number {
  const { lastWinDate, current } = stats.streak
  if (!lastWinDate) return 0
  const today = toLocalDateString(now)
  const yesterday = addDays(today, -1)
  if (lastWinDate === today || lastWinDate === yesterday) return current
  return 0
}

export function recordResult(
  difficulty: Difficulty,
  seconds: number,
  won: boolean,
  now: Date = new Date(),
): Stats {
  const stats = loadStats()
  const bucket = stats[difficulty]
  const today = toLocalDateString(now)

  bucket.played += 1

  if (won) {
    bucket.won += 1
    bucket.totalWinSeconds += seconds
    bucket.bestSeconds = bucket.bestSeconds === null ? seconds : Math.min(bucket.bestSeconds, seconds)

    const yesterday = addDays(today, -1)
    if (stats.streak.lastWinDate === today) {
      // Already recorded a win today; streak count doesn't change again.
    } else if (stats.streak.lastWinDate === yesterday) {
      stats.streak.current += 1
      stats.streak.lastWinDate = today
    } else {
      stats.streak.current = 1
      stats.streak.lastWinDate = today
    }
  }

  bucket.recent = [{ date: today, seconds, won }, ...bucket.recent].slice(0, 10)
  stats.lastPlayedDifficulty = difficulty

  saveStats(stats)
  return stats
}
