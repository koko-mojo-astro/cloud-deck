'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type VotingSystem = 'fibonacci' | 'modifiedFibonacci' | 'powerOfTwo' | 'custom'

const VOTING_SYSTEMS = {
	fibonacci: [1, 2, 3, 5, 8, 13, 21],
	modifiedFibonacci: [0, 0.5, 1, 2, 3, 5, 8, 13, 20, 40, 100],
	powerOfTwo: [1, 2, 4, 8, 16, 32, 64],
}

export default function Home() {
	const router = useRouter()
	const [isCreating, setIsCreating] = useState(false)
	const [name, setName] = useState('')
	const [roomName, setRoomName] = useState('')
	const [votingSystem, setVotingSystem] = useState<VotingSystem>('fibonacci')
	const [customDeck, setCustomDeck] = useState('1, 2, 3, 5, 8, 13')

	const handleCreateRoom = () => {
		if (!name.trim()) return
		const roomId = Math.random().toString(36).substring(2, 8)
		router.push(
			`/room/${roomId}?name=${encodeURIComponent(
				name
			)}&roomName=${encodeURIComponent(
				roomName || 'Planning Poker Room'
			)}&role=admin`
		)
	}

	return (
		<div className='min-h-screen bg-gradient-to-b from-white to-gray-100 dark:from-black dark:to-gray-800'>
			<div className='max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8'>
				<div className='text-center'>
					<h1 className='text-4xl font-bold tracking-tight text-black dark:text-white sm:text-6xl'>
						Cloud Deck
					</h1>
					<p className='mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300'>
						Estimate your user stories efficiently with your team using Cloud
						Deck.
					</p>
				</div>

				<div className='mt-16 flow-root sm:mt-24'>
					<div className='max-w-md mx-auto rounded-lg bg-white dark:bg-black shadow-lg p-8'>
						<div className='flex flex-col items-center space-y-6'>
							<div className='w-full max-w-md space-y-4'>
								<input
									type='text'
									placeholder='Enter your name'
									value={name}
									onChange={(e) => setName(e.target.value)}
									className='w-full px-4 py-2 text-black dark:text-white placeholder-gray-500 bg-white dark:bg-black border border-[#00A550] dark:border-[#00A550] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00A550] focus:border-transparent'
								/>
								<input
									type='text'
									placeholder='Enter room name (optional)'
									value={roomName}
									onChange={(e) => setRoomName(e.target.value)}
									className='w-full px-4 py-2 text-black dark:text-white placeholder-gray-500 bg-white dark:bg-black border border-[#00A550] dark:border-[#00A550] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00A550] focus:border-transparent'
								/>
								{/* <select
									value={votingSystem}
									onChange={(e) =>
										setVotingSystem(e.target.value as VotingSystem)
									}
									className='w-full px-4 py-2 text-black dark:text-white bg-white dark:bg-black border border-[#00A550] dark:border-[#00A550] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00A550] focus:border-transparent'
								>
									<option value='fibonacci'>Fibonacci</option>
									<option value='modifiedFibonacci'>Modified Fibonacci</option>
									<option value='powerOfTwo'>Power of 2</option>
									<option value='custom'>Custom Deck</option>
								</select>
								{votingSystem === 'custom' && (
									<input
										type='text'
										placeholder='Enter custom deck values (comma-separated)'
										value={customDeck}
										onChange={(e) => setCustomDeck(e.target.value)}
										className='w-full px-4 py-2 text-black dark:text-white placeholder-gray-500 bg-white dark:bg-black border border-[#00A550] dark:border-[#00A550] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00A550] focus:border-transparent'
									/>
								)} */}
							</div>

							<div className='flex flex-col sm:flex-row gap-4 w-full max-w-md'>
								<button
									onClick={handleCreateRoom}
									disabled={!name.trim()}
									className='flex-1 px-4 py-3 text-sm font-semibold text-white bg-[#00A550] hover:bg-[#008040] rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200'
								>
									Create Room
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
