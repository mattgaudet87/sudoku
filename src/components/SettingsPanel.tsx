import { X } from 'lucide-react'
import type { Settings } from '../lib/storage'

type SettingsPanelProps = {
  settings: Settings
  onChange: (settings: Settings) => void
  onClose: () => void
}

function Switch({ checked, onToggle, label }: { checked: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex min-h-11 items-center justify-between rounded-md border border-border bg-background px-4"
    >
      <span className="text-text">{label}</span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-gold' : 'bg-border'}`}>
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-background transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </span>
    </button>
  )
}

export default function SettingsPanel({ settings, onChange, onClose }: SettingsPanelProps) {
  return (
    <div className="fixed inset-0 z-10 flex items-end justify-center bg-background/80 p-4 sm:items-center">
      <div className="flex w-full max-w-xs flex-col gap-4 rounded-lg border border-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-text">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-11 min-w-11 items-center justify-center text-muted"
          >
            <X size={20} />
          </button>
        </div>
        <Switch
          checked={settings.threeStrikeMode}
          onToggle={() => onChange({ ...settings, threeStrikeMode: !settings.threeStrikeMode })}
          label="3-strike mode"
        />
        <Switch
          checked={settings.highlightMistakes}
          onToggle={() => onChange({ ...settings, highlightMistakes: !settings.highlightMistakes })}
          label="Highlight mistakes"
        />
      </div>
    </div>
  )
}
