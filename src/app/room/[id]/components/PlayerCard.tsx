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
			className={`flex ${
				position === 'bottom' ? 'flex-col-reverse' : 'flex-col'
			} items-center gap-2 w-[100px]`}
		>
			<div
				className={`text-sm font-medium ${
					isCurrentUser
						? 'text-[#00A550] font-bold'
						: 'text-black dark:text-white'
				} text-center truncate max-w-[100px] overflow-hidden`}
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
						className='w-16 h-24 relative preserve-3d items-center justify-center flex'
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
								<div className='w-16 h-24 rounded-lg border-4 border-white/30 flex items-center justify-center'>
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
								className={`text-xl font-bold ${
									isHighestVoted ? 'text-[#EC1C24]' : 'text-[#00A550]'
								}`}
							>
								{player.vote}
							</span>
							{revealed && voteCount && voteCount > 1 && (
								<span className='text-xs mt-1 text-gray-500'>
									{voteCount} votes
								</span>
							)}
						</div>
					</motion.div>
				) : (
					// Card holder for not voted state
					<div className='w-16 h-24 rounded-lg border-2 border-dashed border-[#00A550] dark:border-[#00A550] flex items-center justify-center'>
						<span className='text-[#00A550] dark:text-[#00A550] text-sm'>
							?
						</span>
					</div>
				)}
			</motion.div>
		</div>
	)
}
