'use client'

import { useState } from 'react'
import Image from 'next/image'
import PlayerCard from './PlayerCard'
import vercelLogo from '@/public/vercel.svg'
import { useRoomContext } from '@/store/roomContext'
import { DEFAULT_TIMER_DURATION } from '@/types/room'

export default function PlayerTable() {
  const { room, currentUser, timeLeft } = useRoomContext()
  const [currentPage, setCurrentPage] = useState(0)

  if (!room) return null

  const playersPerPage = 10
  const totalPages = Math.ceil(room.users.length / playersPerPage) || 1

  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1)
    }
  }

  const goToPrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
    }
  }

  return (
    <div className='flex-1 flex flex-col min-h-[500px] gap-4 md:gap-8 overflow-y-auto justify-center'>
      <div className='w-full flex items-center justify-center mt-8'>
        <div className='relative h-[170px] sm:h-[150px] w-[230px] sm:w-[250px] md:w-[300px]'>
          <div className='w-full h-full bg-[#2A2A2A] rounded-lg flex flex-col items-center justify-center shadow-2xl'>
            <div className='w-[95%] h-[85%] bg-[#333333] rounded-lg flex flex-col items-center justify-center shadow-inner relative'>
              <Image src={vercelLogo} alt='Menicon Logo' width={40} height={40} className='mb-4' />
              <h2 className='text-white text-lg font-medium'>{'Cloud Deck'}</h2>
            </div>
          </div>
          <div className='absolute inset-0'>
            {room.users.map((user, index) => {
              let left, top
              let position: 'top' | 'bottom' | 'left' | 'right' = 'top'
              const totalPlayers = room.users.length
              const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 640
              const isMediumScreen =
                typeof window !== 'undefined' &&
                window.innerWidth >= 640 &&
                window.innerWidth < 768
              const baseRadius = isSmallScreen ? 100 : 200
              const radius = baseRadius * (1 + Math.min(0.2, (totalPlayers - 4) * 0.02))
              const playersPerPage = 10
              const pageStartIndex = currentPage * playersPerPage
              const pageEndIndex = pageStartIndex + playersPerPage
              if (totalPlayers > playersPerPage && (index < pageStartIndex || index >= pageEndIndex)) {
                return null
              }
              const playerIndexInPage =
                totalPlayers > playersPerPage ? index - pageStartIndex : index
              const visiblePlayers =
                totalPlayers > playersPerPage
                  ? Math.min(playersPerPage, totalPlayers - pageStartIndex)
                  : totalPlayers

              if (visiblePlayers === 1) {
                left = 50
                top = -40
                position = 'top'
              } else {
                const angleStep = 360 / visiblePlayers
                const startAngle = 270
                const angle = startAngle + playerIndexInPage * angleStep
                const angleRad = (angle * Math.PI) / 180
                left = 50 + (radius * Math.cos(angleRad)) / 2
                let topAdjustment = 0
                if (angle > 225 && angle < 315) {
                  topAdjustment = -15
                } else if (angle > 45 && angle < 135) {
                  topAdjustment = 20
                }
                top = 60 + (radius * Math.sin(angleRad)) / 2 + topAdjustment
                if (angle > 225 && angle < 315) {
                  position = 'top'
                } else if (angle >= 315 || angle < 45) {
                  position = 'right'
                } else if (angle >= 45 && angle < 135) {
                  position = 'bottom'
                } else {
                  position = 'left'
                }
              }

              return (
                <div
                  key={user.id}
                  className='absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ease-in-out'
                  style={{ left: `${left}%`, top: `${top}%` }}
                >
                  <PlayerCard
                    player={user}
                    revealed={room.revealed}
                    isCurrentUser={currentUser?.id === user.id}
                    position={position}
                    timerProgress={
                      room.isVoting &&
                      timeLeft !== null &&
                      user.role === 'estimator'
                        ? (timeLeft / DEFAULT_TIMER_DURATION) * 100
                        : undefined
                    }
                  />
                </div>
              )
            })}
          </div>
        </div>
      </div>
      {room && room.users.length > 10 && (
        <div className='flex justify-center items-center mt-4 mb-4 space-x-4'>
          <button
            onClick={goToPrevPage}
            disabled={currentPage === 0}
            className='px-3 py-1 bg-[#00A550] text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed'
          >
            &larr; Previous
          </button>
          <span className='text-sm text-gray-600 dark:text-gray-300'>
            Page {currentPage + 1} of {totalPages} ({room.users.length} players)
          </span>
          <button
            onClick={goToNextPage}
            disabled={currentPage >= totalPages - 1}
            className='px-3 py-1 bg-[#00A550] text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed'
          >
            Next &rarr;
          </button>
        </div>
      )}
    </div>
  )
}

