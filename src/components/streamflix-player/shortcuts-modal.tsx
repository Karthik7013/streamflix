"use client"

import { X } from "lucide-react"

interface ShortcutsModalProps {
  onClose: () => void
}

export function ShortcutsModal({ onClose }: ShortcutsModalProps) {
  return (
    <div
      className="np-shortcuts-overlay"
      onClick={onClose}
    >
      <div
        className="np-shortcards-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="np-shortcuts-title">
            Keyboard Shortcuts
          </div>
          <button
            className="np-shortcuts-close w-[28px] h-[28px] rounded-full flex items-center justify-center cursor-pointer"
            onClick={onClose}
          >
            <X size={13} />
          </button>
        </div>
        {[
          ["Space / K", "Play / Pause"],
          ["← / →", "Seek −/+ 10 seconds"],
          ["↑ / ↓", "Volume up / down"],
          ["M", "Mute / Unmute"],
          ["F", "Toggle fullscreen"],
          ["?", "Toggle shortcuts"],
          ["Esc", "Close"],
        ].map(([k, l]) => (
          <div key={k} className="np-shortcut-row">
            <span className="np-shortcut-label">{l}</span>
            <span className="np-shortcut-key">{k}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
