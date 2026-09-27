import { beforeEach, describe, expect, it } from 'vitest'
import {
  averageWinSeconds,
  currentStreak,
  loadSettings,
  loadStats,
  recordResult,
} from './storage'

beforeEach(() => {
  localStorage.clear()
})

// year-month-day in local time, avoiding the UTC-midnight parsing of
// date-only ISO strings (which shifts a day in negative-UTC-offset zones).
function localDate(year: number, month: number, day: number, hours = 12): Date {
  return new Date(year, month - 1, day, hours)
}

describe('loadSettings', () => {
  it('falls back to defaults when nothing is saved', () => {
    expect(loadSettings()).toEqual({
      schemaVersion: 1,
      threeStrikeMode: false,
      highlightMistakes: true,
    })
  })
})

describe('loadStats', () => {
  it('falls back to empty stats for every difficulty when nothing is saved', () => {
    const stats = loadStats()
    expect(stats.easy).toEqual({ played: 0, won: 0, totalWinSeconds: 0, bestSeconds: null, recent: [] })
    expect(stats.streak).toEqual({ current: 0, lastWinDate: null })
  })

  it('falls back to defaults when storage holds broken JSON', () => {
    localStorage.setItem('wolf-sudoku:stats', '{not json')
    expect(loadStats().easy.played).toBe(0)
  })
})

describe('recordResult', () => {
  it('increments played and won, and tracks best time on a win', () => {
    recordResult('medium', 120, true, localDate(2026, 3, 10))
    const stats = recordResult('medium', 90, true, localDate(2026, 3, 11))

    expect(stats.medium.played).toBe(2)
    expect(stats.medium.won).toBe(2)
    expect(stats.medium.bestSeconds).toBe(90)
    expect(averageWinSeconds(stats.medium)).toBe(105)
  })

  it('increments played but not won on a loss', () => {
    const stats = recordResult('hard', 200, false, localDate(2026, 3, 10))
    expect(stats.hard.played).toBe(1)
    expect(stats.hard.won).toBe(0)
    expect(stats.hard.bestSeconds).toBeNull()
  })

  it('caps the recent games list at 10, newest first', () => {
    let stats = loadStats()
    for (let i = 0; i < 12; i++) {
      stats = recordResult('easy', 60 + i, true, localDate(2026, 1, i + 1))
    }
    expect(stats.easy.recent).toHaveLength(10)
    expect(stats.easy.recent[0].seconds).toBe(71)
  })

  it('updates lastPlayedDifficulty', () => {
    const stats = recordResult('expert', 300, true, localDate(2026, 3, 10))
    expect(stats.lastPlayedDifficulty).toBe('expert')
  })
})

describe('streak rules', () => {
  it('starts a streak of 1 on the first win', () => {
    const stats = recordResult('easy', 100, true, localDate(2026, 3, 10))
    expect(stats.streak.current).toBe(1)
    expect(stats.streak.lastWinDate).toBe('2026-03-10')
  })

  it('extends the streak on a win the next calendar day', () => {
    recordResult('easy', 100, true, localDate(2026, 3, 10))
    const stats = recordResult('easy', 90, true, localDate(2026, 3, 11))
    expect(stats.streak.current).toBe(2)
  })

  it('does not double count a second win on the same day', () => {
    recordResult('easy', 100, true, localDate(2026, 3, 10, 9))
    const stats = recordResult('easy', 90, true, localDate(2026, 3, 10, 20))
    expect(stats.streak.current).toBe(1)
  })

  it('resets to 1 when a day is skipped', () => {
    recordResult('easy', 100, true, localDate(2026, 3, 10))
    const stats = recordResult('easy', 90, true, localDate(2026, 3, 12))
    expect(stats.streak.current).toBe(1)
    expect(stats.streak.lastWinDate).toBe('2026-03-12')
  })

  it('a loss does not break an existing streak but does not extend it', () => {
    recordResult('easy', 100, true, localDate(2026, 3, 10))
    const stats = recordResult('easy', 90, false, localDate(2026, 3, 11))
    expect(stats.streak.current).toBe(1)
    expect(stats.streak.lastWinDate).toBe('2026-03-10')
  })

  it('currentStreak shows 0 once the last win was before yesterday', () => {
    const stats = recordResult('easy', 100, true, localDate(2026, 3, 10))
    expect(currentStreak(stats, localDate(2026, 3, 12))).toBe(0)
  })

  it('currentStreak still shows the count on the win day and the day after', () => {
    const stats = recordResult('easy', 100, true, localDate(2026, 3, 10))
    expect(currentStreak(stats, localDate(2026, 3, 10))).toBe(1)
    expect(currentStreak(stats, localDate(2026, 3, 11))).toBe(1)
  })
})
