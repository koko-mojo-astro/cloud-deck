'use client'

import { User } from '@/types/room'
import { motion } from 'framer-motion'

interface PlayerCardProps {
	player: User
	revealed: boolean
	voteCount?: number
	isHighestVoted?: boolean
	isCurrentUser?: boolean
	timerProgress?: number
	position?: 'top' | 'bottom' | 'left' | 'right'
}

export default function PlayerCard({
	player,
	revealed,
	voteCount,
	isHighestVoted,
	isCurrentUser,
	timerProgress,
	position = 'top',
}: PlayerCardProps) {
	return (
		<div
			className={`flex ${position === 'top' ? 'flex-col' : position === 'bottom' ? 'flex-col' : 'flex-col-reverse'} items-center gap-2 sm:gap-3 w-[80px] sm:w-[110px]`} // Increased container width to match the text width
		>
			<div
				className={`text-xs sm:text-sm font-medium ${
					isCurrentUser
						? 'text-[#00A550] font-bold'
						: 'text-black dark:text-white'
				} text-center truncate max-w-[80px] sm:max-w-[100px] overflow-hidden`} // Increased max-width for more characters
			>
				{player.role === 'admin' && (
					<span className='ml-1 text-[#EC1C24]'>👑 </span>
				)}
				{player.name}
			</div>

			<motion.div
				initial={{ scale: 0.8, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				className='relative rounded-lg'
			>
				{/* Timer progress border for estimator players */}
				{player.role === 'estimator' && timerProgress !== undefined && (
					<div
						className='absolute inset-[-4px] rounded-lg transition-all duration-1000 ease-linear'
						style={{
							background: `conic-gradient(from 0deg at 50% 50%, #00A550 0%, #00A550 ${timerProgress}%, transparent ${timerProgress}%, transparent 100%)`,
							zIndex: -1,
						}}
					/>
				)}
				{player.hasVoted ? (
					<motion.div
						initial={{ rotateY: 180 }}
						animate={{ rotateY: revealed ? 0 : 180 }}
						transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
						className='w-12 h-20 sm:w-16 sm:h-24 relative preserve-3d items-center justify-center flex'
						style={{ transformStyle: 'preserve-3d' }}
					>
						{/* Back of the card */}
						<div
							className='absolute inset-0 backface-hidden rounded-lg shadow-lg'
							style={{
								transform: 'rotateY(180deg)',
								backfaceVisibility: 'hidden',
								background: 'linear-gradient(135deg, #00A550, #008040)',
							}}
						>
							<div className='w-full h-full flex items-center justify-center'>
								<div className='w-12 h-20 sm:w-16 sm:h-24 rounded-lg border-4 border-white/30 flex items-center justify-center'>
									<div className='text-white text-opacity-80 text-xl'>♠</div>
								</div>
							</div>
						</div>

						{/* Front of the card (number) */}
						<div
							className={`absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-black rounded-lg border-2 ${
								isHighestVoted ? 'border-[#EC1C24]' : 'border-[#00A550]'
							} shadow-lg backface-hidden ${
								isHighestVoted ? 'ring-2 ring-[#EC1C24]' : ''
							}`}
							style={{
								transform: 'rotateY(0deg)',
								backfaceVisibility: 'hidden',
							}}
						>
							<span
								className={`text-lg sm:text-xl font-bold ${
									isHighestVoted ? 'text-[#EC1C24]' : 'text-[#00A550]'
								}`}
							>
								{player.vote}
							</span>
							{voteCount && voteCount > 1 && (
								<span className='text-xs text-gray-500 mt-1'>
									{voteCount} votes
								</span>
							)}
						</div>
					</motion.div>
				) : (
					<div className='w-12 h-20 sm:w-16 sm:h-24 rounded-lg border-2 border-gray-300 dark:border-gray-700 flex items-center justify-center bg-gray-100 dark:bg-gray-800'>
						<span className='text-gray-400 dark:text-gray-600 text-xs'>
							{player.role === 'observer' ? 'Observer' : '?'}
						</span>
					</div>
				)}
			</motion.div>
		</div>
	)
}
