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
                <div className='min-h-screen bg-gradient-to-b from-white to-gray-100 dark:from-black dark:to-gray-800 font-brand'>
                        <div className='max-w-4xl mx-auto px-lg py-4xl sm:px-xl lg:px-2xl'>
				<div className='text-center'>
                                        <h1 className='text-4xl font-bold tracking-tight text-text-primary sm:text-6xl'>
						Cloud Deck
					</h1>
                                        <p className='mt-xl text-lg leading-8 text-gray-600 dark:text-gray-300'>
						Estimate your user stories efficiently with your team using Cloud
						Deck.
					</p>
				</div>

                                <div className='mt-4xl flow-root sm:mt-6xl'>
                                        <div className='max-w-md mx-auto rounded-lg bg-background shadow-lg p-2xl'>
                                                <div className='flex flex-col items-center space-y-xl'>
                                                        <div className='w-full max-w-md space-y-lg'>
                                                                <input
									type='text'
									placeholder='Enter your name'
									value={name}
									onChange={(e) => setName(e.target.value)}
                                                                        className='w-full px-lg py-sm text-text-primary placeholder-gray-500 bg-background border border-brand-green rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent'
                                                                />
								<input
									type='text'
									placeholder='Enter room name (optional)'
									value={roomName}
									onChange={(e) => setRoomName(e.target.value)}
                                                                        className='w-full px-lg py-sm text-text-primary placeholder-gray-500 bg-background border border-brand-green rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent'
                                                                />
                                                                {/* <select
                                                                        value={votingSystem}
                                                                        onChange={(e) =>
                                                                                setVotingSystem(e.target.value as VotingSystem)
                                                                        }
                                                                        className='w-full px-lg py-sm text-text-primary bg-background border border-brand-green rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent'
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
                                                                                className='w-full px-lg py-sm text-text-primary placeholder-gray-500 bg-background border border-brand-green rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent'
                                                                        />
                                                                )} */}
							</div>

                                                        <div className='flex flex-col sm:flex-row gap-lg w-full max-w-md'>
                                                                <button
                                                                        onClick={handleCreateRoom}
                                                                        disabled={!name.trim()}
                                                                        className='flex-1 px-lg py-md text-sm font-semibold text-white bg-brand-green hover:bg-brand-green-dark rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200'
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
