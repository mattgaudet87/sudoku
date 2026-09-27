import Cell from './Cell'

type BoardProps = {
  puzzle: number[]
  entries: number[]
  notes: number[][]
  solution: number[]
  selectedIndex: number | null
  highlightMistakes: boolean
  onSelectCell: (index: number) => void
}

function rowOf(index: number) {
  return Math.floor(index / 9)
}

function colOf(index: number) {
  return index % 9
}

function boxOf(index: number) {
  return Math.floor(rowOf(index) / 3) * 3 + Math.floor(colOf(index) / 3)
}

export default function Board({
  puzzle,
  entries,
  notes,
  solution,
  selectedIndex,
  highlightMistakes,
  onSelectCell,
}: BoardProps) {
  const selectedRow = selectedIndex !== null ? rowOf(selectedIndex) : -1
  const selectedCol = selectedIndex !== null ? colOf(selectedIndex) : -1
  const selectedBox = selectedIndex !== null ? boxOf(selectedIndex) : -1
  const selectedValue =
    selectedIndex !== null ? (puzzle[selectedIndex] !== 0 ? puzzle[selectedIndex] : entries[selectedIndex]) : 0

  return (
    <div className="grid grid-cols-9 border-t-2 border-l-2 border-muted">
      {Array.from({ length: 81 }, (_, index) => {
        const given = puzzle[index] !== 0
        const value = given ? puzzle[index] : entries[index]
        const wrong = !given && entries[index] !== 0 && entries[index] !== solution[index] && highlightMistakes
        const row = rowOf(index)
        const col = colOf(index)
        const box = boxOf(index)
        const selected = index === selectedIndex
        const peerHighlight =
          selectedIndex !== null &&
          index !== selectedIndex &&
          (row === selectedRow || col === selectedCol || box === selectedBox)
        const sameNumberHighlight =
          selectedIndex !== null && index !== selectedIndex && selectedValue !== 0 && value === selectedValue

        return (
          <Cell
            key={index}
            value={value}
            given={given}
            wrong={wrong}
            selected={selected}
            peerHighlight={peerHighlight}
            sameNumberHighlight={sameNumberHighlight}
            notes={value === 0 ? notes[index] : []}
            thickRight={col === 2 || col === 5 || col === 8}
            thickBottom={row === 2 || row === 5 || row === 8}
            onSelect={() => onSelectCell(index)}
          />
        )
      })}
    </div>
  )
}
