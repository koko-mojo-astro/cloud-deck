'use client'

import { useEffect, useRef, useState } from 'react'
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

const PLAYERS_PER_PAGE = 10

const getSeatRadius = (count: number) => {
        if (count <= 0) {
                return '0px'
        }
        if (count === 1) {
                return 'clamp(8rem, 32vw, 13rem)'
        }
        if (count === 2) {
                return 'clamp(7rem, 28vw, 12rem)'
        }
        if (count <= 4) {
                return 'clamp(8rem, 30vw, 14rem)'
        }
        if (count <= 6) {
                return 'clamp(9rem, 32vw, 15rem)'
        }
        if (count <= 8) {
                return 'clamp(10rem, 34vw, 16rem)'
        }
        return 'clamp(11rem, 36vw, 17rem)'
}

const getSeatTransform = (index: number, total: number, radius: string) => {
        if (total <= 0) {
                return 'translate(-50%, -50%)'
        }
        if (total === 1) {
                return `translate(-50%, -50%) rotate(180deg) translateY(calc(-1 * ${radius})) rotate(-180deg)`
        }
        const angleOffset = -90
        const angle = (360 / total) * index + angleOffset
        return `translate(-50%, -50%) rotate(${angle}deg) translateY(calc(-1 * ${radius})) rotate(${-angle}deg)`
}

const getSeatPosition = (index: number, total: number) => {
        if (total <= 0) {
                return 'top'
        }
        if (total === 1) {
                return 'bottom'
        }
        const angleOffset = -90
        const angle = (360 / total) * index + angleOffset
        const normalized = ((angle % 360) + 360) % 360
        return normalized > 90 && normalized < 270 ? 'bottom' : 'top'
}

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
        const [pageIndex, setPageIndex] = useState(0)
        const initialPageAssigned = useRef(false)

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

        useEffect(() => {
                if (!room) {
                        return
                }
                const pages = Math.max(1, Math.ceil(room.users.length / PLAYERS_PER_PAGE))
                setPageIndex((prev) => {
                        const next = Math.min(prev, pages - 1)
                        return prev === next ? prev : next
                })
        }, [room?.users.length])

        useEffect(() => {
                if (!room || !currentUser || initialPageAssigned.current) {
                        return
                }
                const currentUserIndex = room.users.findIndex((user) => user.id === currentUser.id)
                if (currentUserIndex === -1) {
                        return
                }
                const pageForUser = Math.floor(currentUserIndex / PLAYERS_PER_PAGE)
                setPageIndex(pageForUser)
                initialPageAssigned.current = true
        }, [room, currentUser])

        useEffect(() => {
                initialPageAssigned.current = false
        }, [currentUser?.id])

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

        const totalPages = Math.max(1, Math.ceil(room.users.length / PLAYERS_PER_PAGE))
        const clampedPageIndex = Math.min(pageIndex, totalPages - 1)
        const startIndex = clampedPageIndex * PLAYERS_PER_PAGE
        const displayedPlayers = room.users.slice(
                startIndex,
                startIndex + PLAYERS_PER_PAGE
        )
        const seatRadius = getSeatRadius(displayedPlayers.length)

        const showCarouselControls = totalPages > 1

        const handleNextPage = () => {
                initialPageAssigned.current = true
                setPageIndex((prev) => (prev + 1) % totalPages)
        }

        const handlePreviousPage = () => {
                initialPageAssigned.current = true
                setPageIndex((prev) => (prev - 1 + totalPages) % totalPages)
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
                                                <div className='w-full flex flex-col items-center justify-center mt-8 gap-6'>
                                                        <div className='relative w-full max-w-4xl aspect-square flex items-center justify-center'>
                                                                {showCarouselControls && (
                                                                        <>
                                                                                <button
                                                                                        type='button'
                                                                                        onClick={handlePreviousPage}
                                                                                        className='hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 dark:bg-white/10 backdrop-blur px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-100 shadow-lg transition-colors hover:bg-white/90 dark:hover:bg-white/20'
                                                                                        aria-label='Show previous seating group'
                                                                                >
                                                                                        ‹
                                                                                </button>
                                                                                <button
                                                                                        type='button'
                                                                                        onClick={handleNextPage}
                                                                                        className='hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 dark:bg-white/10 backdrop-blur px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-100 shadow-lg transition-colors hover:bg-white/90 dark:hover:bg-white/20'
                                                                                        aria-label='Show next seating group'
                                                                                >
                                                                                        ›
                                                                                </button>
                                                                        </>
                                                                )}
                                                                <div className='absolute inset-[7%] sm:inset-[8%] rounded-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-white/10 shadow-[0_30px_120px_-40px_rgba(15,23,42,0.7)] flex flex-col items-center justify-center text-center px-8 py-12'>
                                                                        <div className='flex flex-col items-center gap-3 text-white/90'>
                                                                                <Image
                                                                                        src={vercelLogo}
                                                                                        alt='Cloud Deck logo'
                                                                                        width={56}
                                                                                        height={56}
                                                                                        className='opacity-90'
                                                                                />
                                                                                <h2 className='text-xl sm:text-2xl font-semibold tracking-wide text-white'>
                                                                                        Cloud Deck
                                                                                </h2>
                                                                                <p className='text-xs sm:text-sm text-white/60 max-w-[200px]'>
                                                                                        Collaborative planning table
                                                                                </p>
                                                                        </div>
                                                                </div>
                                                                <div className='absolute inset-[3%] sm:inset-[4%] rounded-full border border-white/10 dark:border-white/5 pointer-events-none' />
                                                                {displayedPlayers.map((user, index) => (
                                                                        <div
                                                                                key={user.id}
                                                                                className='absolute left-1/2 top-1/2'
                                                                                style={{ transform: getSeatTransform(index, displayedPlayers.length, seatRadius) }}
                                                                        >
                                                                                <PlayerCard
                                                                                        player={user}
                                                                                        revealed={room.revealed}
                                                                                        isCurrentUser={currentUser?.id === user.id}
                                                                                        timerProgress={
                                                                                                room.isVoting &&
                                                                                                timeLeft !== null &&
                                                                                                user.role === 'estimator'
                                                                                                        ? (timeLeft / DEFAULT_TIMER_DURATION) * 100
                                                                                                        : undefined
                                                                                        }
                                                                                        position={getSeatPosition(index, displayedPlayers.length)}
                                                                                />
                                                                        </div>
                                                                ))}
                                                        </div>
                                                        {showCarouselControls && (
                                                                <div className='flex flex-col items-center gap-3 text-center text-sm text-gray-600 dark:text-gray-300'>
                                                                        <div className='flex items-center gap-2'>
                                                                                <button
                                                                                        type='button'
                                                                                        onClick={handlePreviousPage}
                                                                                        className='px-3 py-1 rounded-full border border-gray-200 dark:border-white/20 bg-white dark:bg-white/10 text-gray-700 dark:text-gray-100 shadow-sm hover:bg-gray-50 dark:hover:bg-white/20 transition'
                                                                                >
                                                                                        Previous
                                                                                </button>
                                                                                <span>
                                                                                        Seats {startIndex + 1}–
                                                                                        {Math.min(startIndex + PLAYERS_PER_PAGE, room.users.length)} of {room.users.length}
                                                                                </span>
                                                                                <button
                                                                                        type='button'
                                                                                        onClick={handleNextPage}
                                                                                        className='px-3 py-1 rounded-full border border-gray-200 dark:border-white/20 bg-white dark:bg-white/10 text-gray-700 dark:text-gray-100 shadow-sm hover:bg-gray-50 dark:hover:bg-white/20 transition'
                                                                                >
                                                                                        Next
                                                                                </button>
                                                                        </div>
                                                                        <div className='flex items-center gap-1'>
                                                                                {Array.from({ length: totalPages }).map((_, indicatorIndex) => (
                                                                                        <span
                                                                                                key={`indicator-${indicatorIndex}`}
                                                                                                className={`h-2 w-2 rounded-full ${
                                                                                                        indicatorIndex === clampedPageIndex
                                                                                                                ? 'bg-[#00A550]'
                                                                                                                : 'bg-gray-300 dark:bg-gray-600'
                                                                                                }`}
                                                                                        />
                                                                                ))}
                                                                        </div>
                                                                </div>
                                                        )}
                                                </div>
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
