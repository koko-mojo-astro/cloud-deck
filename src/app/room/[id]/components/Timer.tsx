'use client'

import { useEffect } from 'react'
import { useRoomContext } from '@/store/roomContext'

export default function Timer() {
  const { timeLeft, setTimeLeft, countdown, setCountdown, socket, room } = useRoomContext()

  // Handle countdown started event
  useEffect(() => {
    if (!socket) return
    const handleCountdownStart = () => {
      setCountdown(3)
      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(countdownInterval)
            return null
          }
          return prev - 1
        })
      }, 1000)
      setTimeout(() => {
        clearInterval(countdownInterval)
        setCountdown(null)
      }, 3000)
    }
    socket.on('countdownStarted', handleCountdownStart)
    return () => {
      socket.off('countdownStarted', handleCountdownStart)
    }
  }, [socket, setCountdown])

  // Timer countdown effect
  useEffect(() => {
    if (timeLeft === null || timeLeft === 0 || room?.revealed) return
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 0 || room?.revealed) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [timeLeft, room?.revealed, setTimeLeft])

  // Auto reveal when timer reaches 0
  useEffect(() => {
    if (timeLeft === 0 && socket && room && !room.revealed) {
      socket.emit('revealVotes', room.id)
      setTimeLeft(null)
    }
  }, [timeLeft, socket, room, setTimeLeft])

  return countdown !== null ? (
    <div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center'>
      <div
        key={countdown}
        className='text-8xl font-bold text-white animate-[bounceIn_0.5s_ease-in-out]'
        style={{ animationFillMode: 'both' }}
      >
        {countdown}
      </div>
    </div>
  ) : null
}

