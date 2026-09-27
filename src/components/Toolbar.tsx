import { Eraser, Lightbulb, Pencil, Undo2 } from 'lucide-react'

type ToolbarProps = {
  notesMode: boolean
  canUndo: boolean
  onUndo: () => void
  onErase: () => void
  onToggleNotes: () => void
  onHint: () => void
}

export default function Toolbar({ notesMode, canUndo, onUndo, onErase, onToggleNotes, onHint }: ToolbarProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo}
        className="flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-md border border-border bg-surface text-muted disabled:opacity-40"
      >
        <Undo2 size={18} />
        <span className="text-xs">Undo</span>
      </button>
      <button
        type="button"
        onClick={onErase}
        className="flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-md border border-border bg-surface text-muted"
      >
        <Eraser size={18} />
        <span className="text-xs">Erase</span>
      </button>
      <button
        type="button"
        onClick={onToggleNotes}
        className={`flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-md border text-xs ${
          notesMode ? 'border-gold bg-gold/15 text-gold' : 'border-border bg-surface text-muted'
        }`}
      >
        <Pencil size={18} />
        <span>Notes {notesMode ? 'on' : 'off'}</span>
      </button>
      <button
        type="button"
        onClick={onHint}
        className="flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-md border border-border bg-surface text-muted"
      >
        <Lightbulb size={18} />
        <span className="text-xs">Hint</span>
      </button>
    </div>
  )
}
