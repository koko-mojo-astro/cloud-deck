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
import AdminControls from './components/AdminControls'
import Image from 'next/image'
import vercelLogo from '../../../public/vercel.svg'

export default function RoomPage() {
	const [showAdminControls, setShowAdminControls] = useState(false)
	const params = useParams()
	const searchParams = useSearchParams()
	const [socket, setSocket] = useState<Socket | null>(null)
	const [room, setRoom] = useState<Room | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [inviteUrl, setInviteUrl] = useState('')
	const [inviteToast, setInviteToast] = useState('')
	const [currentUser, setCurrentUser] = useState<User | null>(null)
	const [timeLeft, setTimeLeft] = useState<number | null>(null)
	const [countdown, setCountdown] = useState<number | null>(null)
	const [currentPage, setCurrentPage] = useState(0)

	useEffect(() => {
		const name = searchParams?.get('name')
		if (!name) {
			setError('Name is required')
			return
		}
		const socket_url =
			process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000'
		const newSocket = io({
			path: '/socket.io',
			transports: ['websocket', 'polling'],
			reconnectionAttempts: 5,
			reconnectionDelay: 1000,
			timeout: 10000,
			autoConnect: true,
			forceNew: true,
		})
		setSocket(newSocket)

		const role = searchParams?.get('role') || 'estimator'
		const roomName = searchParams?.get('roomName') || 'Planning Poker Room'
		const user: User = {
			id: Math.random().toString(36).substring(2, 9),
			name,
			vote: null,
			hasVoted: false,
			role: role as 'estimator' | 'observer' | 'admin',
			roomName,
			votingOptions: FIBONACCI_SEQUENCE,
		}
		setCurrentUser(user)

		newSocket.on('connect', () => {
			newSocket.emit('joinRoom', params?.id as string, user)
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
			// Update current user's vote from the room state
			const updatedCurrentUser = updatedRoom.users.find((u) => u.id === user.id)
			if (updatedCurrentUser) {
				setCurrentUser(updatedCurrentUser)
			}
			// Reset current user's vote if voting options have changed
			if (
				room &&
				JSON.stringify(room.votingOptions) !==
					JSON.stringify(updatedRoom.votingOptions)
			) {
				newSocket.emit('submitVote', updatedRoom.id, user.id, null)
			}

			setRoom(updatedRoom)
			const url = `${window.location.origin}/join/${params?.id}`
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
		})

		newSocket.on('connect_error', () => {
			setError('Failed to connect to server')
		})

		return () => {
			if (newSocket) {
				newSocket.emit('leaveRoom', params?.id as string, user.id)
				newSocket.disconnect()
			}
		}
	}, [params?.id, searchParams])

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

	// Admin handlers for room enabling/disabling and timer settings
	const handleToggleRoomEnabled = (enabled: boolean) => {
		if (socket && room) {
			socket.emit('toggleRoomEnabled', room.id, enabled)
		}
	}

	const handleSetRoomTimer = (duration: number) => {
		if (socket && room) {
			socket.emit('setRoomTimer', room.id, duration)
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
		const url = `${window.location.origin}/join/${params?.id}/?roomName=${
			currentUser?.roomName ? encodeURIComponent(currentUser?.roomName) : 'room'
		}`
		navigator.clipboard.writeText(url)
		setInviteToast(
			'Invite URL copied! Share with your team members to join the planning session.'
		)
		setTimeout(() => setInviteToast(''), 3000)
	}

	// Calculate total pages based on number of users
	const playersPerPage = 10
	const totalPages = Math.ceil((room?.users?.length || 0) / playersPerPage)
		? Math.ceil(room.users.length / playersPerPage)
		: 1

	// Functions to navigate between pages
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

	// Calculate progress percentage for the timer
	const timerProgress =
		timeLeft !== null ? (timeLeft / DEFAULT_TIMER_DURATION) * 100 : 0
	// Vote state is managed through socket events
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
			<div className='min-h-dvh bg-gradient-to-b from-white to-gray-100 dark:from-black dark:to-gray-800 p-4 md:p-8 overflow-x-hidden overflow-y-auto'>
				<div className='max-w-6xl mx-auto w-full min-h-full flex flex-col justify-between'>
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
									{!room.isVoting && room.enabled && !room.revealed && (
										<button
											onClick={handleStartVoting}
											className='px-3 md:px-4 py-2 bg-[#00A550] hover:bg-[#008040] text-white rounded-md text-sm md:text-base'
										>
											Start Voting
										</button>
									)}
									{room.isVoting && !room.revealed && room.enabled && (
										<button
											onClick={handleRevealVotes}
											disabled={
												!room.users.every(
													(user) => user.role !== 'estimator' || user.hasVoted
												)
											}
											className='px-3 md:px-4 py-2 bg-[#00A550] hover:bg-[#008040] text-white rounded-md shadow-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base'
										>
											Reveal Votes
										</button>
									)}
									{room.revealed && (
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
										onClick={() => setShowAdminControls(true)}
										className='px-3 md:px-4 py-2 bg-[#00A550] hover:bg-[#008040] text-white rounded-md shadow-sm transition-colors duration-200 text-sm md:text-base'
									>
										Admin Settings
									</button>
								</div>
							)}
						</div>
					</div>

					<div className='flex-1 flex flex-col min-h-[500px] gap-4 md:gap-8 overflow-y-auto justify-center'>
						{/* Admin Controls Panel - Only visible to admin users */}
						{currentUser?.role === 'admin' && (
							<AdminControls
								room={room}
								onToggleRoomEnabled={handleToggleRoomEnabled}
								onSetTimer={handleSetRoomTimer}
								isOpen={showAdminControls}
								onClose={() => setShowAdminControls(false)}
							/>
						)}
						<div className='w-full flex items-center justify-center mt-8'>
							<div className='relative h-[170px] sm:h-[150px] w-[230px] sm:w-[250px] md:w-[300px]'>
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
								{/* Players around the table in a circle */}
								<div className='absolute inset-0'>
									{room.users.map((user, index) => {
										// Calculate positions for circular arrangement
										let left, top
										let position: 'top' | 'bottom' | 'left' | 'right' = 'top'
										const totalPlayers = room.users.length

										// Responsive adjustments for player positioning
										const isSmallScreen =
											typeof window !== 'undefined' && window.innerWidth < 640
										const isMediumScreen =
											typeof window !== 'undefined' &&
											window.innerWidth >= 640 &&
											window.innerWidth < 768

										// Adjust radius based on screen size and number of players
										const baseRadius = isSmallScreen ? 100 : 200
										// Increase radius slightly for more players to prevent overlap
										const radius =
											baseRadius *
											(1 + Math.min(0.2, (totalPlayers - 4) * 0.02))

										// For pagination with more than 10 players
										const playersPerPage = 10
										const pageStartIndex = currentPage * playersPerPage
										const pageEndIndex = pageStartIndex + playersPerPage

										// Skip rendering players not in the current page
										if (
											totalPlayers > playersPerPage &&
											(index < pageStartIndex || index >= pageEndIndex)
										) {
											return null
										}

										// Calculate the player's position within the current page
										const playerIndexInPage =
											totalPlayers > playersPerPage
												? index - pageStartIndex
												: index
										const visiblePlayers =
											totalPlayers > playersPerPage
												? Math.min(
														playersPerPage,
														totalPlayers - pageStartIndex
												  )
												: totalPlayers

										// Special case for 1 player
										if (visiblePlayers === 1) {
											left = 50
											top = -40 // Reduced distance from table
											position = 'top'
										} else {
											// Calculate angle for each player in a circle
											// Start from the top (270 degrees) and distribute evenly
											const angleStep = 360 / visiblePlayers
											// Offset the starting angle to place first player at the top
											const startAngle = 270
											const angle = startAngle + playerIndexInPage * angleStep

											// Convert angle to radians for Math.sin and Math.cos
											const angleRad = (angle * Math.PI) / 180

											// Calculate position using trigonometry
											// Center is at (50%, 50%)
											left = 50 + (radius * Math.cos(angleRad)) / 2

											// Adjust top position - add extra distance for cards at the top and bottom
											let topAdjustment = 0
											if (angle > 225 && angle < 315) {
												// For cards at the top, add extra distance
												topAdjustment = -15 // Reduced extra distance from table for top cards
											} else if (angle > 45 && angle < 135) {
												// For cards at the bottom, add extra distance
												topAdjustment = 20 // Reduced extra distance from table for bottom cards
											}
											top =
												60 + (radius * Math.sin(angleRad)) / 2 + topAdjustment

											// Determine card orientation based on position
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
						{/* Pagination controls for when there are more than 10 users */}
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
									Page {currentPage + 1} of {totalPages} ({room.users.length}{' '}
									players)
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

					{/* Display voting results below the player circle area */}
					{room.revealed && (
						<VotingResults users={room.users} revealed={room.revealed} />
					)}

					{currentUser && (
						<VotingControls
							onVote={handleVote}
							votingOptions={room.votingOptions}
							disabled={
								!room.isVoting ||
								room.revealed ||
								currentUser?.role !== 'estimator' ||
								!room.enabled
							}
							currentVote={currentUser.vote}
						/>
					)}
				</div>
			</div>
		</>
	)
}
