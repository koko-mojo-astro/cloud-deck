'use client'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
	User,
	Room,
	FIBONACCI_SEQUENCE,
	DEFAULT_TIMER_DURATION,
} from '@/types/room'
import { db } from '@/lib/db'
import {
	ensureRoomAndJoin,
	heartbeat,
	leaveRoom,
	revealVotes,
	resetVotes,
	setRoomTimer,
	startVoting,
	submitVote,
	sweepStalePlayers,
	toggleRoomEnabled,
	PLAYER_ACTIVE_WINDOW_MS,
	STALE_PLAYER_TTL_MS,
} from '@/lib/room-actions'
import VotingControls from './components/VotingControls'
import PlayerCard from './components/PlayerCard'
import VotingResults from './components/VotingResults'
import AdminControls from './components/AdminControls'
import Image from 'next/image'
import vercelLogo from '../../public/vercel.svg'

export default function RoomPage() {
	return (
		<Suspense
			fallback={
				<div className='min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800'>
					<h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
						Loading...
					</h1>
				</div>
			}
		>
			<RoomContent />
		</Suspense>
	)
}

const COUNTDOWN_MS = 3_000

function RoomContent() {
	const [showAdminControls, setShowAdminControls] = useState(false)
	const searchParams = useSearchParams()
	const roomId = searchParams?.get('id')
	const name = searchParams?.get('name') || ''
	const role = (searchParams?.get('role') || 'estimator') as
		| 'estimator'
		| 'observer'
		| 'admin'
	const roomName = searchParams?.get('roomName') || 'Planning Poker Room'

	// Stable per-tab identity, mirroring the previous socket-session behaviour
	const [userId] = useState(() => Math.random().toString(36).substring(2, 9))

	const [error, setError] = useState<string | null>(null)
	const [inviteToast, setInviteToast] = useState('')
	const [currentPage, setCurrentPage] = useState(0)
	const [now, setNow] = useState(() => Date.now())
	const joinedRef = useRef(false)
	const playerIdRef = useRef<string | null>(null)

	// Realtime subscription: this single query replaces the socket connection
	const { isLoading, error: dbError, data } = db.useQuery(
		roomId
			? {
					rooms: { $: { where: { code: roomId } } },
					players: { $: { where: { roomId } } },
				}
			: null
	)

	const roomData = data?.rooms?.[0]
	const roomEid = roomData?.id
	const players = data?.players ?? []
	const myPlayer = players.find((p) => p.userId === userId)

	const user: User = useMemo(
		() => ({
			id: userId,
			name,
			vote: null,
			hasVoted: false,
			role,
			roomName,
			votingOptions: FIBONACCI_SEQUENCE,
		}),
		[userId, name, role, roomName]
	)

	// Ticking clock drives countdown, timer and presence windows
	useEffect(() => {
		const t = setInterval(() => setNow(Date.now()), 1000)
		return () => clearInterval(t)
	}, [])

	// Join once the initial query resolves (self-heals if our row was swept)
	useEffect(() => {
		if (!roomId) {
			setError('Room ID is required')
			return
		}
		if (!name) {
			setError('Name is required')
			return
		}
		setError(null)
		if (!joinedRef.current && !isLoading) {
			joinedRef.current = true
			ensureRoomAndJoin({
				roomCode: roomId,
				user,
				roomExists: roomEid != null,
				existingRoomId: roomEid ?? undefined,
				existingPlayerId: myPlayer?.id,
			})
		}
	}, [roomId, name, isLoading, user, roomEid, myPlayer])

	// Keep the room code in a ref for cleanup on unmount / tab close
	useEffect(() => {
		playerIdRef.current = myPlayer?.id ?? null
	}, [myPlayer?.id])

	// Presence heartbeat
	useEffect(() => {
		const pid = playerIdRef.current
		if (!pid) return
		const beat = () => heartbeat(pid, Date.now())
		beat()
		const t = setInterval(beat, 20_000)
		return () => clearInterval(t)
	}, [playerIdRef.current])

	// Leave on unmount (navigation); best-effort on tab close
	const roomIdRef = useRef<string | null>(null)
	useEffect(() => {
		roomIdRef.current = roomId
		const onBeforeUnload = () => leaveRoom(playerIdRef.current)
		window.addEventListener('beforeunload', onBeforeUnload)
		return () => {
			window.removeEventListener('beforeunload', onBeforeUnload)
			leaveRoom(playerIdRef.current)
		}
	}, [roomId])

	// Activate voting once the countdown elapses

	// Self-heal presence + sweep disconnected players
	useEffect(() => {
		if (!roomId || isLoading || !joinedRef.current) return
		const t = setInterval(() => {
			const mine = players.find((p) => p.userId === userId)
			if (!mine) {
				// Our row was swept (e.g. long backgrounded tab): re-assert presence
				ensureRoomAndJoin({
					roomCode: roomId,
					user,
					roomExists: roomEid != null,
					existingRoomId: roomEid ?? undefined,
				})
				return
			}
			if (!roomData) return
			const stale = players.filter(
				(p) =>
					p.userId !== userId &&
					p.lastSeenAt < Date.now() - STALE_PLAYER_TTL_MS
			)
			const activeCount = players.length - stale.length
			sweepStalePlayers(
				stale.map((p) => p.id),
				activeCount,
				roomData.id
			)
		}, 30_000)
		return () => clearInterval(t)
	}, [roomId, isLoading, roomData, roomEid, players, user, userId])

	const countingDown =
		!!roomData?.timerStartedAt &&
		now < roomData.timerStartedAt &&
		!roomData.revealed
	const countdown = countingDown
		? Math.ceil(((roomData!.timerStartedAt as number) - now) / 1000)
		: null

	// Active players only (stale ones are swept separately)
	const activePlayers = players.filter(
		(p) => p.lastSeenAt > now - PLAYER_ACTIVE_WINDOW_MS
	)

	const users: User[] = activePlayers.map((p) => ({
		id: p.userId,
		name: p.name,
		role: p.role as User['role'],
		vote: p.vote ?? null,
		hasVoted: p.hasVoted,
		roomName: p.roomName,
		votingOptions: roomData?.votingOptions ?? FIBONACCI_SEQUENCE,
	}))

	const votingOpen =
		!!roomData &&
		!!roomData.timerStartedAt &&
		now >= roomData.timerStartedAt &&
		!roomData.revealed &&
		roomData.enabled

	const timeLeft =
		votingOpen && roomData?.timerStartedAt
			? Math.max(
					0,
					roomData.timerDuration -
						Math.floor((now - roomData.timerStartedAt) / 1000)
				)
			: null

	const room: Room | null = roomData
		? {
				id: roomData.id,
				name: roomData.name,
				createdAt: new Date(roomData.createdAt),
				users,
				isVoting: votingOpen,
				timerStartedAt:
					votingOpen && roomData.timerStartedAt
						? new Date(roomData.timerStartedAt)
						: null,
				timerDuration: roomData.timerDuration ?? DEFAULT_TIMER_DURATION,
				revealed: roomData.revealed,
				votingOptions: roomData.votingOptions ?? FIBONACCI_SEQUENCE,
				enabled: roomData.enabled,
			}
		: null

	const currentUser = users.find((u) => u.id === userId) ?? null

	// Auto-reveal when every estimator has voted (parity with the socket server)
	useEffect(() => {
		if (!roomEid || !votingOpen || !users.length) return
		const estimators = users.filter((u) => u.role === 'estimator')
		if (estimators.length > 0 && estimators.every((e) => e.hasVoted)) {
			revealVotes(roomEid)
		}
	}, [roomEid, votingOpen, users])

	// Auto-reveal when the timer expires (parity with the socket client behaviour)
	useEffect(() => {
		if (timeLeft === 0 && roomEid && room && !room.revealed) {
			revealVotes(roomEid)
		}
	}, [timeLeft, roomEid, room])

	if (error || dbError) {
		return (
			<div className='min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800'>
				<div className='text-center text-red-600 dark:text-red-400'>
					<h1 className='text-2xl font-bold'>
						{error || dbError?.message || 'Something went wrong'}
					</h1>
				</div>
			</div>
		)
	}

	if (!room) {
		return (
			<div className='min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800'>
				<div className='text-center'>
					<h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
						{isLoading ? 'Connecting to room...' : 'Room not found'}
					</h1>
				</div>
			</div>
		)
	}

	const handleVote = (value: number) => {
		if (myPlayer && room && votingOpen) {
			submitVote(myPlayer.id, value)
		}
	}

	const handleRevealVotes = () => {
		if (roomEid) {
			revealVotes(roomEid)
		}
	}

	const handleResetVotes = () => {
		if (roomEid) {
			resetVotes(
				roomEid,
				players.map((p) => p.id)
			)
		}
	}

	const handleStartVoting = () => {
		if (roomEid) {
			startVoting(roomEid)
		}
	}

	// Admin handlers for room enabling/disabling and timer settings
	const handleToggleRoomEnabled = (enabled: boolean) => {
		if (roomEid) {
			toggleRoomEnabled(roomEid, enabled)
		}
	}

	const handleSetRoomTimer = (duration: number) => {
		if (roomEid) {
			setRoomTimer(roomEid, duration)
		}
	}

	const handleCopyInviteLink = () => {
		const url = `${window.location.origin}/join/?id=${roomId}&roomName=${
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
	// Vote state is managed through realtime database updates
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
                        <div className='min-h-dvh bg-gradient-to-b from-white to-gray-100 dark:from-black dark:to-gray-800 font-brand p-lg md:p-2xl overflow-x-hidden overflow-y-auto'>
                                <div className='max-w-6xl mx-auto w-full min-h-full flex flex-col justify-between'>
                                        <div className='flex flex-col md:flex-row justify-between items-center mb-lg md:mb-2xl gap-lg'>
						<div className='flex flex-col items-start w-full md:w-auto'>
                                                        <h1 className='text-2xl md:text-3xl flex font-bold text-gray-900 dark:text-white mb-sm md:mb-lg'>
								{currentUser?.roomName || 'Planning Poker Room'}
							</h1>
						</div>
                                                <div className='flex items-center gap-sm md:gap-lg flex-wrap justify-center relative w-full md:w-auto'>
							{inviteToast && (
                                                                <div className='fixed top-28 left-4 right-4 md:left-auto md:right-4 md:w-80 transform bg-background z-10 text-text-primary border border-l-[4px] border-l-teal-500 px-xl py-md duration-500 shadow-md'>
									{inviteToast}
								</div>
							)}
							{currentUser?.role === 'admin' && (
                                                                <div className='flex gap-sm flex-wrap justify-center'>
									{!room.isVoting && room.enabled && !room.revealed && (
                                                                                <button
                                                                                        onClick={handleStartVoting}
                                                                                        className='px-md md:px-lg py-sm bg-brand-green hover:bg-brand-green-dark text-white rounded-md text-sm md:text-base'
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
                                                                                        className='px-md md:px-lg py-sm bg-brand-green hover:bg-brand-green-dark text-white rounded-md shadow-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base'
                                                                                >
											Reveal Votes
										</button>
									)}
									{room.revealed && (
                                                                <div className='flex gap-sm flex-wrap justify-center'>
                                                                                        <button
                                                                                                onClick={handleResetVotes}
                                                                                                className='px-md md:px-lg py-sm bg-brand-red hover:bg-brand-red-dark text-white rounded-md shadow-sm transition-colors duration-200 text-sm md:text-base'
                                                                                        >
                                                                                                Reset
                                                                                        </button>
                                                                                </div>
                                                                        )}
                                                                        <button
                                                                                onClick={handleCopyInviteLink}
                                                                                className='px-md md:px-lg py-sm bg-brand-green hover:bg-brand-green-dark text-white rounded-md shadow-sm transition-colors duration-200 text-sm md:text-base'
                                                                        >
                                                                                {inviteToast ? 'Copied!' : 'Invite Team'}
                                                                        </button>
                                                                        <button
                                                                                onClick={() => setShowAdminControls(true)}
                                                                                className='px-md md:px-lg py-sm bg-brand-green hover:bg-brand-green-dark text-white rounded-md shadow-sm transition-colors duration-200 text-sm md:text-base'
                                                                        >
                                                                                Admin Settings
                                                                        </button>
								</div>
							)}
						</div>
					</div>

                                        <div className='flex-1 flex flex-col min-h-[500px] gap-lg md:gap-2xl overflow-y-auto justify-center'>
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
                                                <div className='w-full flex items-center justify-center mt-2xl'>
                                                        <div className='relative h-[170px] sm:h-[150px] w-[230px] sm:w-[250px] md:w-[300px]'>
                                                                <div className='w-full h-full bg-[#2A2A2A] rounded-lg flex flex-col items-center justify-center shadow-2xl'>
                                                                        <div className='w-[95%] h-[85%] bg-[#333333] rounded-lg flex flex-col items-center justify-center shadow-inner relative'>
										<Image
											src={vercelLogo}
											alt='Menicon Logo'
											width={40}
											height={40}
                                                                                        className='mb-lg'
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
												position = 'left'
											} else {
												position = 'bottom'
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
                                                        <div className='flex justify-center items-center mt-lg mb-lg space-x-lg'>
								<button
									onClick={goToPrevPage}
									disabled={currentPage === 0}
                                                                    className='px-md py-xs bg-brand-green text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed'
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
                                                                    className='px-md py-xs bg-brand-green text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed'
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
