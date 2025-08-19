'use client'

import { useRoomContext } from '@/store/roomContext'

interface RoomHeaderProps {
  onAdminSettings: () => void
}

export default function RoomHeader({ onAdminSettings }: RoomHeaderProps) {
  const {
    room,
    currentUser,
    inviteToast,
    handleStartVoting,
    handleRevealVotes,
    handleResetVotes,
    handleCopyInviteLink
  } = useRoomContext()

  return (
    <div className='flex flex-col md:flex-row justify-between items-center mb-4 md:mb-8 gap-4'>
      <div className='flex flex-col items-start w-full md:w-auto'>
        <h1 className='text-2xl md:text-3xl flex font-bold text-gray-900 dark:text-white mb-2 md:mb-4'>
          {currentUser?.roomName || 'Planning Poker Room'}
        </h1>
      </div>
      <div className='flex items-center gap-2 md:gap-4 flex-wrap justify-center relative w-full md:w-auto'>
        {inviteToast && (
          <div className='fixed top-28 left-4 right-4 md:left-auto md:right-4 md:w-80 transform bg-[#ffffff] z-10 text-black border border-l-[4px] border-l-teal-500 px-6 py-3 duration-500 shadow-md'>
            {inviteToast}
          </div>
        )}
        {currentUser?.role === 'admin' && (
          <div className='flex gap-2 flex-wrap justify-center'>
            {!room?.isVoting && room?.enabled && !room?.revealed && (
              <button
                onClick={handleStartVoting}
                className='px-3 md:px-4 py-2 bg-[#00A550] hover:bg-[#008040] text-white rounded-md text-sm md:text-base'
              >
                Start Voting
              </button>
            )}
            {room?.isVoting && !room?.revealed && room?.enabled && (
              <button
                onClick={handleRevealVotes}
                disabled={!room.users.every((user) => user.role !== 'estimator' || user.hasVoted)}
                className='px-3 md:px-4 py-2 bg-[#00A550] hover:bg-[#008040] text-white rounded-md shadow-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base'
              >
                Reveal Votes
              </button>
            )}
            {room?.revealed && (
              <div className='flex gap-2 flex-wrap justify-center'>
                <button
                  onClick={handleResetVotes}
                  className='px-3 md:px-4 py-2 bg-[#EC1C24] hover:bg-[#D01017] text-white rounded-md shadow-sm transition-colors duration-200 text-sm md:text-base'
                >
                  Reset
                </button>
              </div>
            )}
            <button
              onClick={handleCopyInviteLink}
              className='px-3 md:px-4 py-2 bg-[#00A550] hover:bg-[#008040] text-white rounded-md shadow-sm transition-colors duration-200 text-sm md:text-base'
            >
              {inviteToast ? 'Copied!' : 'Invite Team'}
            </button>
            <button
              onClick={onAdminSettings}
              className='px-3 md:px-4 py-2 bg-[#00A550] hover:bg-[#008040] text-white rounded-md shadow-sm transition-colors duration-200 text-sm md:text-base'
            >
              Admin Settings
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

