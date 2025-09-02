'use client'

import { useState, useRef, useEffect } from 'react'
import { Room } from '@/types/room'

interface AdminControlsProps {
  room: Room
  onToggleRoomEnabled: (enabled: boolean) => void
  onSetTimer: (duration: number) => void
  isOpen: boolean
  onClose: () => void
}

export default function AdminControls({
  room,
  onToggleRoomEnabled,
  onSetTimer,
  isOpen,
  onClose,
}: AdminControlsProps) {
  const [showTimerSettings, setShowTimerSettings] = useState(false)
  const [timerDuration, setTimerDuration] = useState(room.timerDuration)
  const modalRef = useRef<HTMLDivElement>(null)

  const handleToggleRoomEnabled = () => {
    onToggleRoomEnabled(!room.enabled)
  }

  const handleTimerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    if (!isNaN(value) && value > 0) {
      setTimerDuration(value)
    }
  }

  const handleSetTimer = () => {
    onSetTimer(timerDuration)
    setShowTimerSettings(false)
  }

  useEffect(() => {
    if (!isOpen) return
    const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
    )
    const first = focusable?.[0]
    const last = focusable?.[focusable.length - 1]
    first?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (!first || !last) return
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      } else if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        ref={modalRef}
        className="relative w-full max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 animate-[bounceIn_0.5s_ease-in-out]"
      >
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Admin Controls
        </h3>
        
        <div className="flex flex-col gap-4">
          {/* Room Enable/Disable Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Room Status
            </span>
            <button
              onClick={handleToggleRoomEnabled}
              className={`px-3 py-1 rounded-md text-white text-sm ${room.enabled ? 'bg-[#00A550]' : 'bg-[#EC1C24]'}`}
            >
              {room.enabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {/* Timer Settings */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Timer Duration: {room.timerDuration} seconds
            </span>
            <button
              onClick={() => setShowTimerSettings(!showTimerSettings)}
              className="px-3 py-1 bg-[#00A550] text-white rounded-md text-sm"
            >
              {showTimerSettings ? 'Cancel' : 'Change'}
            </button>
          </div>

          {/* Timer Settings Form */}
          {showTimerSettings && (
            <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="5"
                  max="300"
                  value={timerDuration}
                  onChange={handleTimerChange}
                  className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">seconds</span>
                <button
                  onClick={handleSetTimer}
                  className="ml-auto px-3 py-1 bg-[#00A550] text-white rounded-md text-sm"
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
