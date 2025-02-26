'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { io, Socket } from 'socket.io-client'
import {
	User,
	Room,
	FIBONACCI_SEQUENCE,
	DEFAULT_TIMER_DURATION,
} from '@/types/room'
import VotingControls from './components/VotingControls'
import PlayerCard from './components/PlayerCard'
import VotingResults from './components/VotingResults'
import Image from 'next/image'
import meniconLogo from '../../../public/menicon-logo.png'
import vercelLogo from '../../../public/vercel.svg'
export default function RoomPage() {
	const params = useParams()
	const searchParams = useSearchParams()
	const [socket, setSocket] = useState<Socket | null>(null)
	const [room, setRoom] = useState<Room | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [inviteUrl, setInviteUrl] = useState('')
	const [inviteToast, setInviteToast] = useState('')
	const [currentUser, setCurrentUser] = useState<User | null>(null)
	const [timeLeft, setTimeLeft] = useState<number | null>(null)
	const [voteStats, setVoteStats] = useState<{ [key: number]: number }>({})
	const [countdown, setCountdown] = useState<number | null>(null)
	const [showResults, setShowResults] = useState(false)

	useEffect(() => {
		const name = searchParams.get('name')
		if (!name) {
			setError('Name is required')
			return
		}

		const newSocket = io(
			process.env.NODE_ENV === 'development'
				? 'http://localhost:3000'
				: `https://${
						process.env.VERCEL_BRANCH_URL ||
						process.env.VERCEL_URL ||
						'cloud-deck.vercel.app'
				  }`
		)
		setSocket(newSocket)

		const role = searchParams.get('role') || 'estimator'
		const roomName = searchParams.get('roomName') || 'Planning Poker Room'
		const user: User = {
			id: Math.random().toString(36).substring(2, 9),
			name,
			vote: null,
			hasVoted: false,
			role: role as 'estimator' | 'observer' | 'admin',
			roomName,
			votingOptions: role === 'admin' ? FIBONACCI_SEQUENCE : undefined,
		}
		setCurrentUser(user)

		newSocket.on('connect', () => {
			newSocket.emit('joinRoom', params.id as string, user)
		})

		newSocket.on('countdownStarted', () => {
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

			// Clear countdown after 3 seconds
			setTimeout(() => {
				clearInterval(countdownInterval)
				setCountdown(null)
			}, 3000)
		})

		newSocket.on('roomUpdated', (updatedRoom: Room) => {
			// Reset current user's vote if voting options have changed
			if (
				room &&
				JSON.stringify(room.votingOptions) !==
					JSON.stringify(updatedRoom.votingOptions)
			) {
				newSocket.emit('submitVote', updatedRoom.id, user.id, null)
			}

			setRoom(updatedRoom)
			const url = `${window.location.origin}/join/${params.id}`
			setInviteUrl(url)

			// Handle timer updates
			if (updatedRoom.revealed) {
				setTimeLeft(null) // Reset timer when votes are revealed
			} else if (updatedRoom.isVoting && updatedRoom.timerStartedAt) {
				const startTime = new Date(updatedRoom.timerStartedAt).getTime()
				const now = new Date().getTime()
				const elapsed = Math.floor((now - startTime) / 1000)
				const remaining = Math.max(0, updatedRoom.timerDuration - elapsed)
				setTimeLeft(remaining)
			} else {
				setTimeLeft(null)
			}

			// Calculate vote statistics
			if (updatedRoom.revealed) {
				const stats: { [key: number]: number } = {}
				updatedRoom.users.forEach((user) => {
					if (user.vote !== null) {
						stats[user.vote] = (stats[user.vote] || 0) + 1
					}
				})
				setVoteStats(stats)
			} else {
				setVoteStats({})
			}
		})

		newSocket.on('connect_error', () => {
			setError('Failed to connect to server')
		})

		return () => {
			if (newSocket) {
				newSocket.emit('leaveRoom', params.id as string, user.id)
				newSocket.disconnect()
			}
		}
	}, [params.id, searchParams])

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
	}, [timeLeft, room?.revealed])

	// Auto-reveal votes when timer reaches 0
	useEffect(() => {
		if (timeLeft === 0 && socket && room && !room.revealed) {
			socket.emit('revealVotes', room.id)
			setTimeLeft(null) // Reset timer when votes are revealed
		}
	}, [timeLeft, socket, room])

	const handleVote = (value: number) => {
		if (socket && currentUser && room && !room.revealed) {
			socket.emit('submitVote', room.id, currentUser.id, value)
		}
	}

	const handleRevealVotes = () => {
		if (socket && room) {
			socket.emit('revealVotes', room.id)
		}
	}

	const handleResetVotes = () => {
		if (socket && room) {
			socket.emit('resetVotes', room.id)
		}
	}

	const handleStartVoting = () => {
		if (socket && room) {
			socket.emit('startVoting', room.id)
		}
	}

	if (error) {
		return (
			<div className='min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800'>
				<div className='text-center text-red-600 dark:text-red-400'>
					<h1 className='text-2xl font-bold'>{error}</h1>
				</div>
			</div>
		)
	}

	if (!room) {
		return (
			<div className='min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800'>
				<div className='text-center'>
					<h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
						Connecting to room...
					</h1>
				</div>
			</div>
		)
	}

	const handleCopyInviteLink = () => {
		const url = `${window.location.origin}/join/${params.id}/?roomName=${
			currentUser?.roomName ? encodeURIComponent(currentUser?.roomName) : 'room'
		}`
		navigator.clipboard.writeText(url)
		setInviteToast(
			'Invite URL copied! Share with your team members to join the planning session.'
		)
		setTimeout(() => setInviteToast(''), 3000)
	}

	// Calculate progress percentage for the timer
	const timerProgress =
		timeLeft !== null ? (timeLeft / DEFAULT_TIMER_DURATION) * 100 : 0

	return (
		<>
			{countdown !== null && (
				<div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center'>
					<div
						key={countdown}
						className='text-8xl font-bold text-white animate-[bounceIn_0.5s_ease-in-out]'
						style={{
							animationFillMode: 'both',
						}}
					>
						{countdown}
					</div>
				</div>
			)}
			<div className='h-dvh bg-gradient-to-b from-white to-gray-100 dark:from-black dark:to-gray-800 p-4 md:p-8 overflow-x-hidden overflow-y-auto'>
				<div className='max-w-6xl mx-auto w-full h-full flex flex-col justify-between'>
					<div className='flex flex-2 flex-col md:flex-row justify-between items-center mb-8 gap-4'>
						<div className='flex flex-col items-start w-auto'>
							<h1 className='text-3xl flex font-bold text-gray-900 dark:text-white mb-4'>
								{currentUser?.roomName || 'Planning Poker Room'}
							</h1>
						</div>
						<div className='flex items-center gap-4 flex-wrap justify-center relative'>
							{inviteToast && (
								<div className='fixed top-28 w-1/8 left-4/5 transform bg-[#ffffff] z-10 text-black border border-l-[4px] border-l-teal-500 px-6 py-3 duration-500'>
									{inviteToast}
								</div>
							)}
							{currentUser?.role === 'admin' && (
								<div className='flex gap-2 flex-wrap justify-center'>
									{!room.isVoting && (
										<button
											onClick={handleStartVoting}
											className='px-4 py-2 bg-[#00A550] hover:bg-[#008040] text-white rounded-md'
										>
											Start Voting
										</button>
									)}
									{room.isVoting && !room.revealed && (
										<button
											onClick={handleRevealVotes}
											disabled={
												!room.users.every(
													(user) => user.role !== 'estimator' || user.hasVoted
												)
											}
											className='px-4 py-2 bg-[#00A550] hover:bg-[#008040] text-white rounded-md shadow-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
										>
											Reveal Votes
										</button>
									)}
									{room.revealed && (
										<div className='flex gap-2 flex-wrap justify-center'>
											<button
												onClick={handleResetVotes}
												className='px-4 py-2 bg-[#EC1C24] hover:bg-[#D01017] text-white rounded-md shadow-sm transition-colors duration-200'
											>
												Reset
											</button>
											<button
												onClick={() => setShowResults(true)}
												className='px-4 py-2 bg-[#00A550] hover:bg-[#008040] text-white rounded-md shadow-sm transition-colors duration-200'
											>
												View Results
											</button>
										</div>
									)}
									<button
										onClick={handleCopyInviteLink}
										className='px-4 py-2 bg-[#00A550] hover:bg-[#008040] text-white rounded-md shadow-sm transition-colors duration-200'
									>
										{inviteToast ? 'Copied!' : 'Invite Team'}
									</button>
								</div>
							)}
						</div>
					</div>

					<div className='flex-2 flex flex-col gap-8'>
						<div className='w-full flex items-center justify-center mb-8'>
							<div className='relative h-[200px] w-[400px]'>
								<div className='w-full h-full bg-[#2A2A2A] rounded-lg flex flex-col items-center justify-center shadow-2xl'>
									<div className='w-[95%] h-[85%] bg-[#333333] rounded-lg flex flex-col items-center justify-center shadow-inner relative'>
										<Image
											src={vercelLogo}
											alt='Menicon Logo'
											width={40}
											height={40}
											className='mb-4'
										/>
										<h2 className='text-white text-lg font-medium'>
											{'Cloud Deck'}
										</h2>
									</div>
								</div>
								{/* Players around the rectangular table */}
								<div className='absolute inset-0'>
									{room.users.map((user, index) => {
										// Calculate positions for optimal spacing
										let left, top
										let position: 'top' | 'bottom' | 'left' | 'right' = 'top'
										const totalPlayers = room.users.length

										// Distribute players based on total count
										if (totalPlayers === 1) {
											// For 2 players, place them facing each other
											if (index === 0) {
												left = 50
												top = -40
												position = 'top'
											}
										} else if (totalPlayers === 2) {
											// For 2 players, place them facing each other
											if (index === 0) {
												left = 50
												top = -40
												position = 'top'
											} else {
												left = 50
												top = 140
												position = 'bottom'
											}
										} else if (totalPlayers === 3) {
											// For 3 players, distribute on three sides
											switch (index) {
												case 0: // Top
													left = 50
													top = -40
													position = 'top'
													break
												case 1: // Right
													left = 120 // Moved away from edge
													top = 50
													position = 'right'
													break
												case 2: // Left
													left = -20 // Moved away from edge
													top = 50
													position = 'left'
													break
											}
										} else if (totalPlayers === 4) {
											// For 4 players, one on each side
											switch (index) {
												case 0: // Top
													left = 50
													top = -40
													position = 'top'
													break
												case 1: // Right
													left = 120 // Moved away from edge
													top = 50
													position = 'right'
													break
												case 2: // Bottom
													left = 50
													top = 140
													position = 'bottom'
													break
												case 3: // Left
													left = -20 // Moved away from edge
													top = 50
													position = 'left'
													break
											}
										} else {
											// For 5+ players, distribute evenly around the table
											const angle =
												index * ((2 * Math.PI) / totalPlayers) - Math.PI / 2
											const radius = 200 // Increased radius for better spacing
											const leftDivider = 2.5
											const topDivider = 2

											// Adjust the position calculations for better distribution
											left = 50 + (radius * Math.cos(angle)) / leftDivider // Adjusted divisor for X-axis
											top = 60 + (radius * Math.sin(angle)) / topDivider // Adjusted divisor for Y-axis

											// Determine position based on angle
											if (angle >= -Math.PI / 4 && angle < Math.PI / 4)
												position = 'right'
											else if (
												angle >= Math.PI / 4 &&
												angle < (3 * Math.PI) / 4
											)
												position = 'bottom'
											else if (
												angle >= (-3 * Math.PI) / 4 &&
												angle < -Math.PI / 4
											)
												position = 'top'
											else position = 'left'
										}

										return (
											<div
												key={user.id}
												className='absolute transform -translate-x-1/2 -translate-y-1/2'
												style={{
													left: `${left}%`,
													top: `${top}%`,
												}}
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
						<div className='w-full'>
							<VotingResults
								voteStats={voteStats}
								revealed={room.revealed}
								showResults={showResults}
								onClose={() => setShowResults(false)}
							/>
						</div>
					</div>
					{currentUser && (
						<VotingControls
							onVote={handleVote}
							votingOptions={room.votingOptions}
							disabled={
								!room.isVoting ||
								room.revealed ||
								currentUser?.role !== 'estimator'
							}
							currentVote={currentUser.vote}
						/>
					)}
				</div>
			</div>
		</>
	)
}
