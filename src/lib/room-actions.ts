import { id } from '@instantdb/react'
import { FIBONACCI_SEQUENCE, User } from '@/types/room'
import { db } from './db'

export const PLAYER_ACTIVE_WINDOW_MS = 65_000
export const STALE_PLAYER_TTL_MS = 120_000
const COUNTDOWN_MS = 3_000

/**
 * InstantDB requires entity ids to be UUIDs. All transact failures are caught
 * here so a transient DB error can never white-screen the app again.
 */
export function safeTransact(txs: unknown) {
	Promise.resolve(db.transact(txs as any)).catch((e) =>
		console.error('[instantdb] transaction failed:', e)
	)
}

export function ensureRoomAndJoin(opts: {
	roomCode: string
	user: User
	roomExists: boolean
	existingRoomId?: string
	existingPlayerId?: string
}) {
	const now = Date.now()
	const { roomCode, user, roomExists } = opts

	const txs: any[] = [
		db.tx.players[opts.existingPlayerId ?? id()].update({
			roomId: roomCode,
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
			db.tx.rooms[opts.existingRoomId ?? id()].update({
				code: roomCode,
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

	safeTransact(txs)
}

export function heartbeat(playerId: string, lastSeenAt: number) {
	safeTransact(db.tx.players[playerId].merge({ lastSeenAt }))
}

export function leaveRoom(playerId: string | null) {
	if (!playerId) return
	safeTransact(db.tx.players[playerId].delete())
}

/** Mirrors the socket server GC: drop stale players; delete the room when nobody is left */
export function sweepStalePlayers(
	stalePlayerIds: string[],
	activePlayerCount: number,
	roomId: string | null
) {
	if (!stalePlayerIds.length && activePlayerCount > 0) return

	const txs: any[] = stalePlayerIds.map((pid) => db.tx.players[pid].delete())

	if (activePlayerCount === 0 && roomId) {
		txs.push(db.tx.rooms[roomId].delete())
	}

	if (txs.length) safeTransact(txs)
}

export function startVoting(roomEid: string) {
	safeTransact(
		db.tx.rooms[roomEid].update({
			timerStartedAt: Date.now() + COUNTDOWN_MS,
			revealed: false,
		})
	)
}

export function submitVote(playerEid: string, vote: number) {
	safeTransact(
		db.tx.players[playerEid].merge({
			vote,
			hasVoted: true,
			lastSeenAt: Date.now(),
		})
	)
}

export function revealVotes(roomEid: string) {
	safeTransact(
		db.tx.rooms[roomEid].update({
			revealed: true,
		})
	)
}

const UNSET = null as unknown as number

export function resetVotes(roomEid: string, playerIds: string[]) {
	const txs: any[] = playerIds.map((pid) =>
		db.tx.players[pid].merge({ vote: null, hasVoted: false })
	)
	txs.push(
		db.tx.rooms[roomEid].merge({
			revealed: false,
			timerStartedAt: UNSET,
		})
	)
	safeTransact(txs)
}

export function toggleRoomEnabled(roomEid: string, enabled: boolean) {
	safeTransact(db.tx.rooms[roomEid].merge({ enabled }))
}

export function setRoomTimer(roomEid: string, duration: number) {
	safeTransact(db.tx.rooms[roomEid].merge({ timerDuration: duration }))
}
