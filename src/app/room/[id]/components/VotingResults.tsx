'use client'

import { useState, useEffect } from 'react'

interface VotingResultsProps {
	voteStats: { [key: number]: number }
	revealed: boolean
	showResults?: boolean
	onClose?: () => void
	inline?: boolean
}

export default function VotingResults({
	voteStats,
	revealed,
	showResults = true,
	onClose,
	inline = false,
}: VotingResultsProps) {
	const [isOpen, setIsOpen] = useState(showResults)

	useEffect(() => {
		setIsOpen(showResults)
	}, [showResults])

	if (!revealed || Object.keys(voteStats).length === 0) return null
	if (!inline && !isOpen) return null

	// Calculate average vote
	const totalVotes = Object.values(voteStats).reduce(
		(sum, count) => sum + count,
		0
	)
	const weightedSum = Object.entries(voteStats).reduce(
		(sum, [vote, count]) => sum + Number(vote) * count,
		0
	)
	const averageVote =
		totalVotes > 0 ? (weightedSum / totalVotes).toFixed(1) : '0'

	const handleClose = () => {
		setIsOpen(false)
		onClose?.()
	}

	// Render inline results for player cards
	if (inline) {
		return (
			<div className='w-full max-w-lg mx-auto mt-4 mb-4 z-10 relative'>
				<div className='bg-white dark:bg-black rounded-lg shadow-lg p-4 sm:p-6'>
					<div className='flex justify-between items-center mb-4'>
						<h3 className='text-base font-semibold text-gray-900 dark:text-white'>
							Voting Results
						</h3>
						<div className='text-[#00A550] font-bold text-sm'>
							Average: {averageVote}
						</div>
					</div>
					<div className='space-y-3'>
						{Object.entries(voteStats)
							.sort(([a], [b]) => Number(a) - Number(b))
							.map(([vote, count]) => (
								<div key={vote} className='flex items-center gap-3'>
									<div className='w-8 text-sm text-gray-600 dark:text-gray-400 font-medium'>
										{vote}
									</div>
									<div className='flex-1 h-4 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden'>
										<div
											className='h-full bg-[#00A550] transition-all duration-500'
											style={{
												width: `${(count / totalVotes) * 100}%`,
											}}
										/>
									</div>
									<div className='w-10 text-right text-sm text-gray-600 dark:text-gray-400'>
										{count} {count !== 1 ? 'votes' : 'vote'}
									</div>
								</div>
							))}
					</div>
				</div>
			</div>
		)
	}

	// Render modal results
	return (
		<div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
			<div className='relative w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto bg-white dark:bg-black rounded-lg shadow-lg p-4 sm:p-6 md:p-8 animate-[bounceIn_0.5s_ease-in-out]'>
				<button
					onClick={handleClose}
					className='absolute top-2 sm:top-4 right-2 sm:right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
				>
					<svg
						xmlns='http://www.w3.org/2000/svg'
						className='h-5 w-5 sm:h-6 sm:w-6'
						fill='none'
						viewBox='0 0 24 24'
						stroke='currentColor'
					>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth={2}
							d='M6 18L18 6M6 6l12 12'
						/>
					</svg>
				</button>
				<div className='flex flex-col gap-3 sm:gap-4'>
					<div className='flex justify-between items-center'>
						<h3 className='text-base sm:text-lg font-semibold text-gray-900 dark:text-white'>
							Voting Results
						</h3>
						<div className='text-[#00A550] font-bold text-sm sm:text-base'>
							Average: {averageVote}
						</div>
					</div>
					<div className='space-y-2'>
						{Object.entries(voteStats)
							.sort(([a], [b]) => Number(a) - Number(b))
							.map(([vote, count]) => (
								<div key={vote} className='flex items-center gap-2'>
									<div className='w-8 sm:w-12 text-xs sm:text-sm text-gray-600 dark:text-gray-400'>
										{vote}
									</div>
									<div className='flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden'>
										<div
											className='h-full bg-[#00A550] transition-all duration-500'
											style={{
												width: `${(count / totalVotes) * 100}%`,
											}}
										/>
									</div>
									<div className='w-10 sm:w-12 text-right text-xs sm:text-sm text-gray-600 dark:text-gray-400'>
										{count} vote{count !== 1 ? 's' : ''}
									</div>
								</div>
							))}
					</div>
				</div>
			</div>
		</div>
	)
}
