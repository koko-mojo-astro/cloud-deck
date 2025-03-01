'use client'

interface VotingControlsProps {
	onVote: (value: number) => void
	votingOptions: number[]
	disabled: boolean
	currentVote: number | null
}

export default function VotingControls({
	onVote,
	votingOptions,
	disabled,
	currentVote,
}: VotingControlsProps) {
	// Remove debug console.log as it's no longer needed
	return (
		<div className='flex-2 max-w-6xl bottom-2 left-0 right-0 dark:bg-gray-800'>
			<div className='max-w-6xl mx-auto flex flex-wrap gap-4 justify-center'>
				{votingOptions.map((value) => (
					<button
						key={value}
						onClick={() => onVote(value)}
						disabled={disabled}
						className={`w-16 h-24 rounded-lg shadow-md transition-all duration-200 ${
							currentVote === value
								? 'bg-[#00A550] text-white transform scale-110 translate-y-[-8px] shadow-lg ring-2 ring-[#00A550] ring-opacity-50'
								: 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600'
						} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
					>
						<span className='text-xl font-bold'>{value}</span>
					</button>
				))}
			</div>
		</div>
	)
}
