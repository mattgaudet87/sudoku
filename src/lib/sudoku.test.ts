import { describe, expect, it } from 'vitest'
import {
  CLUE_RANGES,
  type Difficulty,
  countSolutions,
  generatePuzzle,
  isValidSolution,
} from './sudoku'

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'expert']

describe('generatePuzzle', () => {
  for (const difficulty of DIFFICULTIES) {
    it(`produces a valid, uniquely-solvable ${difficulty} puzzle within the clue range`, () => {
      const { puzzle, solution, clueCount } = generatePuzzle(difficulty)

      expect(isValidSolution(solution)).toBe(true)
      expect(clueCount).toBe(puzzle.filter((v) => v !== 0).length)

      const [min, max] = CLUE_RANGES[difficulty]
      expect(clueCount).toBeGreaterThanOrEqual(min)
      expect(clueCount).toBeLessThanOrEqual(max)

      expect(countSolutions(puzzle, 2)).toBe(1)

      // Every given clue must match the solution at that cell.
      puzzle.forEach((value, index) => {
        if (value !== 0) expect(value).toBe(solution[index])
      })
    })

    it(`generates a ${difficulty} puzzle in under 1 second`, () => {
      const start = Date.now()
      generatePuzzle(difficulty)
      expect(Date.now() - start).toBeLessThan(1000)
    })
  }
})

describe('countSolutions', () => {
  it('reports exactly one solution for a solved board', () => {
    const { solution } = generatePuzzle('easy')
    expect(countSolutions(solution, 2)).toBe(1)
  })

  it('reports more than one solution for an empty board (capped at the limit)', () => {
    const empty = new Array(81).fill(0)
    expect(countSolutions(empty, 2)).toBe(2)
  })
})
