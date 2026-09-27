export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert'

// 81 numbers, 0 = empty.
export type Board = number[]

export type GeneratedPuzzle = {
  puzzle: Board
  solution: Board
  difficulty: Difficulty
  clueCount: number
}

export const CLUE_RANGES: Record<Difficulty, [number, number]> = {
  easy: [40, 45],
  medium: [32, 36],
  hard: [28, 31],
  expert: [24, 27],
}

// A puzzle's generation must stay under this on a phone; the removal loop
// bails out and returns whatever valid puzzle it has reached if it runs long.
const GENERATION_TIME_BUDGET_MS = 900

function rowOf(index: number): number {
  return Math.floor(index / 9)
}

function colOf(index: number): number {
  return index % 9
}

function boxOf(index: number): number {
  return Math.floor(rowOf(index) / 3) * 3 + Math.floor(colOf(index) / 3)
}

function buildPeers(): number[][] {
  const result: number[][] = []
  for (let i = 0; i < 81; i++) {
    const r = rowOf(i)
    const c = colOf(i)
    const b = boxOf(i)
    const cells = new Set<number>()
    for (let j = 0; j < 81; j++) {
      if (j === i) continue
      if (rowOf(j) === r || colOf(j) === c || boxOf(j) === b) cells.add(j)
    }
    result.push([...cells])
  }
  return result
}

const PEERS = buildPeers()

export function peers(index: number): number[] {
  return PEERS[index]
}

export function isConflict(board: Board, index: number, value: number): boolean {
  if (value === 0) return false
  return peers(index).some((p) => board[p] === value)
}

export function isValidSolution(board: Board): boolean {
  if (board.length !== 81) return false
  if (board.some((v) => v < 1 || v > 9)) return false
  return board.every((value, index) => !peers(index).some((p) => board[p] === value))
}

function popcount(mask: number): number {
  let count = 0
  let m = mask
  while (m !== 0) {
    m &= m - 1
    count++
  }
  return count
}

// Backtracking with MRV (fewest-candidates-first) ordering, counting
// solutions up to `limit` and stopping as soon as that many are found.
function solve(board: Board, limit: number): { count: number; solution: Board | null } {
  const working = board.slice()
  const rowsUsed = new Array(9).fill(0)
  const colsUsed = new Array(9).fill(0)
  const boxesUsed = new Array(9).fill(0)

  for (let i = 0; i < 81; i++) {
    const value = working[i]
    if (value === 0) continue
    const bit = 1 << (value - 1)
    rowsUsed[rowOf(i)] |= bit
    colsUsed[colOf(i)] |= bit
    boxesUsed[boxOf(i)] |= bit
  }

  let count = 0
  let firstSolution: Board | null = null

  function backtrack(): boolean {
    let bestIndex = -1
    let bestMask = 0
    let bestCount = 10

    for (let i = 0; i < 81; i++) {
      if (working[i] !== 0) continue
      const mask = 0x1ff & ~(rowsUsed[rowOf(i)] | colsUsed[colOf(i)] | boxesUsed[boxOf(i)])
      const candidateCount = popcount(mask)
      if (candidateCount === 0) return false
      if (candidateCount < bestCount) {
        bestCount = candidateCount
        bestIndex = i
        bestMask = mask
        if (candidateCount === 1) break
      }
    }

    if (bestIndex === -1) {
      count++
      if (!firstSolution) firstSolution = working.slice()
      return count >= limit
    }

    const r = rowOf(bestIndex)
    const c = colOf(bestIndex)
    const b = boxOf(bestIndex)
    let mask = bestMask
    while (mask !== 0) {
      const bit = mask & -mask
      mask ^= bit
      const value = Math.log2(bit) + 1
      working[bestIndex] = value
      rowsUsed[r] |= bit
      colsUsed[c] |= bit
      boxesUsed[b] |= bit
      if (backtrack()) return true
      working[bestIndex] = 0
      rowsUsed[r] &= ~bit
      colsUsed[c] &= ~bit
      boxesUsed[b] &= ~bit
    }
    return false
  }

  backtrack()
  return { count, solution: firstSolution }
}

export function countSolutions(board: Board, limit = 2): number {
  return solve(board, limit).count
}

export function solveBoard(board: Board): Board | null {
  return solve(board, 1).solution
}

function shuffledDigits(): number[] {
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9]
  for (let i = digits.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[digits[i], digits[j]] = [digits[j], digits[i]]
  }
  return digits
}

function generateFullGrid(): Board {
  const board: Board = new Array(81).fill(0)
  const rowsUsed = new Array(9).fill(0)
  const colsUsed = new Array(9).fill(0)
  const boxesUsed = new Array(9).fill(0)

  function fill(pos: number): boolean {
    if (pos === 81) return true
    const r = rowOf(pos)
    const c = colOf(pos)
    const b = boxOf(pos)
    for (const value of shuffledDigits()) {
      const bit = 1 << (value - 1)
      if (rowsUsed[r] & bit || colsUsed[c] & bit || boxesUsed[b] & bit) continue
      board[pos] = value
      rowsUsed[r] |= bit
      colsUsed[c] |= bit
      boxesUsed[b] |= bit
      if (fill(pos + 1)) return true
      board[pos] = 0
      rowsUsed[r] &= ~bit
      colsUsed[c] &= ~bit
      boxesUsed[b] &= ~bit
    }
    return false
  }

  fill(0)
  return board
}

function shuffledSymmetricPairs(): [number, number][] {
  const pairs: [number, number][] = []
  const seen = new Set<number>()
  for (let i = 0; i < 81; i++) {
    if (seen.has(i)) continue
    const j = 80 - i
    seen.add(i)
    seen.add(j)
    pairs.push([i, j])
  }
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pairs[i], pairs[j]] = [pairs[j], pairs[i]]
  }
  return pairs
}

function countClues(board: Board): number {
  return board.reduce((total, value) => total + (value !== 0 ? 1 : 0), 0)
}

function attemptPuzzle(difficulty: Difficulty, deadline: number): GeneratedPuzzle {
  const solution = generateFullGrid()
  const [minClues, maxClues] = CLUE_RANGES[difficulty]
  const targetClues = minClues + Math.floor(Math.random() * (maxClues - minClues + 1))

  const puzzle = solution.slice()

  for (const [a, b] of shuffledSymmetricPairs()) {
    const currentClues = countClues(puzzle)
    if (currentClues <= targetClues) break
    if (Date.now() > deadline) break

    const removedA = puzzle[a]
    const removedB = puzzle[b]
    if (removedA === 0 && removedB === 0) continue

    // A pair removes 1 clue (center cell, a === b) or 2. Skip a removal
    // that would jump past the target and undershoot the minimum.
    const removalSize = a === b ? 1 : 2
    if (currentClues - removalSize < minClues) continue

    puzzle[a] = 0
    puzzle[b] = 0

    if (countSolutions(puzzle, 2) !== 1) {
      puzzle[a] = removedA
      puzzle[b] = removedB
    }
  }

  return { puzzle, solution, difficulty, clueCount: countClues(puzzle) }
}

// A single shuffled pass over symmetric pairs can get stuck above the clue
// target (harder difficulties especially). Retry with a fresh grid and a
// fresh pair order until we land in range or the time budget runs out.
export function generatePuzzle(difficulty: Difficulty): GeneratedPuzzle {
  const deadline = Date.now() + GENERATION_TIME_BUDGET_MS
  const [, maxClues] = CLUE_RANGES[difficulty]

  let best = attemptPuzzle(difficulty, deadline)
  while (best.clueCount > maxClues && Date.now() < deadline) {
    const attempt = attemptPuzzle(difficulty, deadline)
    if (attempt.clueCount < best.clueCount) best = attempt
  }
  return best
}
