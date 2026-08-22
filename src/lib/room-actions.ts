import { FIBONACCI_SEQUENCE, User } from '@/types/room'
import { db } from './db'

export const PLAYER_ACTIVE_WINDOW_MS = 65_000
export const STALE_PLAYER_TTL_MS = 120_000
const COUNTDOWN_MS = 3_000

const playerKey = (roomId: string, userId: string) => `${roomId}:${userId}`

export function ensureRoomAndJoin(
	roomId: string,
	user: User,
	roomExists: boolean
) {
	const now = Date.now()
	// Mixed room+player transaction chunks
	const txs: any[] = [
		db.tx.players[playerKey(roomId, user.id)].update({
			roomId,
			userId: user.id,
			name: user.name,
			role: user.role,
			roomName: user.roomName || 'Planning Poker Room',
			hasVoted: false,
			lastSeenAt: now,
		}),
	]

	if (!roomExists) {
		txs.push(
			db.tx.rooms[roomId].update({
				name: user.roomName || 'Planning Poker Room',
				createdAt: now,
				votingOptions:
					user.role === 'admin' && user.votingOptions?.length
						? user.votingOptions
						: FIBONACCI_SEQUENCE,
				timerDuration: 15,
				revealed: false,
				enabled: true,
			})
		)
	}

	db.transact(txs)
}

export function heartbeat(roomId: string, userId: string, lastSeenAt: number) {
	db.transact(
		db.tx.players[playerKey(roomId, userId)].merge({
			lastSeenAt,
		})
	)
}

export function leaveRoom(roomId: string, userId: string) {
	db.transact(db.tx.players[playerKey(roomId, userId)].delete())
}

export function sweepStalePlayers(
	stalePlayerIds: string[],
	activePlayerCount: number,
	roomId: string
) {
	if (!stalePlayerIds.length && activePlayerCount > 0) return

	const txs: any[] = stalePlayerIds.map((id) => db.tx.players[id].delete())

	// Mirror the socket server: delete the room when nobody is left in it
	if (activePlayerCount === 0) {
		txs.push(db.tx.rooms[roomId].delete())
	}

	if (txs.length) db.transact(txs)
}

export function startVoting(roomId: string) {
	db.transact(
		db.tx.rooms[roomId].update({
			timerStartedAt: Date.now() + COUNTDOWN_MS,
			revealed: false,
		})
	)
}

export function submitVote(roomId: string, userId: string, vote: number) {
	db.transact(
		db.tx.players[playerKey(roomId, userId)].merge({
			vote,
			hasVoted: true,
			lastSeenAt: Date.now(),
		})
	)
}

export function revealVotes(roomId: string) {
	db.transact(
		db.tx.rooms[roomId].update({
			revealed: true,
		})
	)
}

export function resetVotes(roomId: string, players: { id: string }[]) {
	const txs: any[] = players.map((p) =>
		db.tx.players[p.id].merge({ vote: null, hasVoted: false })
	)
	txs.push(
		db.tx.rooms[roomId].merge({
			revealed: false,
			timerStartedAt: null as unknown as number,
		})
	)
	db.transact(txs)
}

export function toggleRoomEnabled(roomId: string, enabled: boolean) {
	db.transact(db.tx.rooms[roomId].merge({ enabled }))
}

export function setRoomTimer(roomId: string, duration: number) {
	db.transact(db.tx.rooms[roomId].merge({ timerDuration: duration }))
}
