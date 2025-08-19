'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { io, Socket } from 'socket.io-client'
import { User, Room, FIBONACCI_SEQUENCE } from '@/types/room'
import VotingControls from './components/VotingControls'
import VotingResults from './components/VotingResults'
import AdminControls from './components/AdminControls'
import RoomHeader from './components/RoomHeader'
import PlayerTable from './components/PlayerTable'
import Timer from './components/Timer'
import { RoomContext } from '@/store/roomContext'

export default function RoomPage() {
	const [showAdminControls, setShowAdminControls] = useState(false)
	const params = useParams()
	const searchParams = useSearchParams()
        const [socket, setSocket] = useState<Socket | null>(null)
        const [room, setRoom] = useState<Room | null>(null)
        const [error, setError] = useState<string | null>(null)
        const [inviteToast, setInviteToast] = useState('')
        const [currentUser, setCurrentUser] = useState<User | null>(null)
        const [timeLeft, setTimeLeft] = useState<number | null>(null)
        const [countdown, setCountdown] = useState<number | null>(null)

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

        // Vote state is managed through socket events
        return (
                <RoomContext.Provider
                        value={{
                                room,
                                setRoom,
                                currentUser,
                                setCurrentUser,
                                socket,
                                timeLeft,
                                setTimeLeft,
                                countdown,
                                setCountdown,
                                inviteToast,
                                handleStartVoting,
                                handleRevealVotes,
                                handleResetVotes,
                                handleCopyInviteLink,
                        }}
                >
                        <Timer />
                        <div className='min-h-dvh bg-gradient-to-b from-white to-gray-100 dark:from-black dark:to-gray-800 p-4 md:p-8 overflow-x-hidden overflow-y-auto'>
                                <div className='max-w-6xl mx-auto w-full min-h-full flex flex-col justify-between'>
                                        <RoomHeader onAdminSettings={() => setShowAdminControls(true)} />
                                        <div className='flex-1 flex flex-col min-h-[500px] gap-4 md:gap-8 overflow-y-auto justify-center'>
                                                {currentUser?.role === 'admin' && (
                                                        <AdminControls
                                                                room={room}
                                                                onToggleRoomEnabled={handleToggleRoomEnabled}
                                                                onSetTimer={handleSetRoomTimer}
                                                                isOpen={showAdminControls}
                                                                onClose={() => setShowAdminControls(false)}
                                                        />
                                                )}
                                                <PlayerTable />
                                        </div>
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
                </RoomContext.Provider>
        )
}
