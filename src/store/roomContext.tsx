'use client'

import { createContext, useContext } from 'react'
import type { Room, User } from '@/types/room'
import type { Socket } from 'socket.io-client'

interface RoomContextValue {
  room: Room | null
  setRoom: React.Dispatch<React.SetStateAction<Room | null>>
  currentUser: User | null
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>
  socket: Socket | null
  timeLeft: number | null
  setTimeLeft: React.Dispatch<React.SetStateAction<number | null>>
  countdown: number | null
  setCountdown: React.Dispatch<React.SetStateAction<number | null>>
  inviteToast: string
  handleStartVoting: () => void
  handleRevealVotes: () => void
  handleResetVotes: () => void
  handleCopyInviteLink: () => void
}

export const RoomContext = createContext<RoomContextValue | undefined>(undefined)

export const useRoomContext = () => {
  const context = useContext(RoomContext)
  if (!context) {
    throw new Error('useRoomContext must be used within a RoomContext.Provider')
  }
  return context
}

