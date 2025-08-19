'use client'

import { User } from '@/types/room'

interface VotingResultsProps {
	users: User[]
	revealed: boolean
}

export default function VotingResults({ users, revealed }: VotingResultsProps) {
	if (!revealed) return null

	// Calculate stats from users array
	const voteStats: { [key: number]: number } = {}
	let totalVotesCast = 0
	let weightedSum = 0

	users.forEach((user) => {
		if (user.role === 'estimator' && user.hasVoted && user.vote !== null) {
			voteStats[user.vote] = (voteStats[user.vote] || 0) + 1
			totalVotesCast++
			weightedSum += user.vote
		}
	})

	if (totalVotesCast === 0) return null // Don't show if no one voted

	const averageVote = (weightedSum / totalVotesCast).toFixed(1)
	const votingEstimators = users.filter(
		(u) => u.role === 'estimator' && u.hasVoted && u.vote !== null
	)

	return (
		// Render inline results
                <div className='w-full max-w-2xl mx-auto mt-lg mb-lg z-10 relative'>
                        <div className='bg-white dark:bg-gray-900 rounded-lg shadow-lg p-lg sm:p-xl border border-gray-200 dark:border-gray-700'>
                                {/* Header: Title, Total Votes, Average */}
                                <div className='flex flex-wrap justify-between items-center mb-lg gap-sm'>
                                        <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                                                Voting Results
                                        </h3>
                                        <div className='flex gap-lg text-sm'>
                                                <span className='text-gray-600 dark:text-gray-400'>
                                                        Votes Cast:{' '}
                                                        <span className='font-bold text-gray-800 dark:text-gray-200'>
                                                                {totalVotesCast}
                                                        </span>
                                                </span>
                                                <span className='text-brand-green font-bold'>
                                                        Average: {averageVote}
                                                </span>
                                        </div>
                                </div>

                                {/* Summary Chart */}
                                <div className='space-y-md mb-xl'>
                                        <h4 className='text-sm font-medium text-gray-700 dark:text-gray-300 mb-sm'>
                                                Vote Summary
                                        </h4>
                                        {Object.entries(voteStats)
                                                .sort(([a], [b]) => Number(a) - Number(b))
                                                .map(([vote, count]) => (
                                                        <div key={vote} className='flex items-center gap-md'>
                                                                <div className='w-8 text-sm text-gray-600 dark:text-gray-400 font-medium text-center'>
                                                                        {vote}
                                                                </div>
                                                                <div className='flex-1 h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden'>
                                                                        <div
                                                                                className='h-full bg-brand-green transition-all duration-500 rounded-full'
                                                                                style={{
                                                                                        width: `${(count / totalVotesCast) * 100}%`,
                                                                                }}
                                                                        />
                                                                </div>
                                                                <div className='w-16 text-right text-sm text-gray-600 dark:text-gray-400'>
                                                                        {count} {count !== 1 ? 'votes' : 'vote'}
                                                                </div>
                                                        </div>
                                                ))}
                                </div>

				{/* Individual Votes List */}
				<div>
                                        <h4 className='text-sm font-medium text-gray-700 dark:text-gray-300 mb-sm'>
                                                Individual Votes
                                        </h4>
                                        <div className='max-h-40 overflow-y-auto space-y-xs pr-sm'>
                                                {' '}
                                                {/* Scrollable container */}
                                                {votingEstimators
                                                        .sort((a, b) => a.name.localeCompare(b.name)) // Sort alphabetically
                                                        .map((user) => (
								<div
									key={user.id}
									className='flex justify-between text-sm text-gray-800 dark:text-gray-200'
								>
									<span>{user.name}</span>
									<span className='font-medium'>{user.vote}</span>
								</div>
							))}
					</div>
				</div>
			</div>
		</div>
	)
}
