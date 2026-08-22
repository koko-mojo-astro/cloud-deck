import { id } from '@instantdb/react'
import { FIBONACCI_SEQUENCE, User } from '@/types/room'
import { db } from './db'

/**
 * Presence windows are generous because browsers throttle timers in
 * background tabs (down to once per minute, or once per hour after 5 min).
 * A player is only considered "away" for voting-gating after this window;
 * their card always stays visible and their row is never swept mid-session.
 */
export const PLAYER_ACTIVE_WINDOW_MS = 180_000
/** Hygiene-only purge threshold; far longer than any meeting */
export const STALE_PLAYER_TTL_MS = 24 * 60 * 60_000
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

/** Purge long-abandoned player rows. Rooms themselves are never auto-deleted,
 * so a session link keeps working for its full lifetime (and beyond). */
export function purgeAbandonedPlayers(playerIds: string[]) {
	if (!playerIds.length) return
	safeTransact(playerIds.map((pid) => db.tx.players[pid].delete()))
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

/**
 * Remove everyone from the room immediately and tombstone the room itself.
 * The tombstone (only code + disbandedAt remain) keeps invite links dead;
 * purgeDisbandedRooms clears it out later.
 */
export function disbandRoom(roomEid: string, playerIds: string[]) {
	const txs: any[] = playerIds.map((pid) => db.tx.players[pid].delete())
	txs.push(db.tx.rooms[roomEid].merge({ disbandedAt: Date.now() }))
	safeTransact(txs)
}

/** Hard-delete rooms disbanded longer ago than `olderThanMs` */
export function purgeDisbandedRooms(
	rooms: { id: string; disbandedAt?: number }[],
	olderThanMs: number
) {
	const now = Date.now()
	const ids = rooms
		.filter((r) => r.disbandedAt && now - r.disbandedAt > olderThanMs)
		.map((r) => r.id)
	if (!ids.length) return
	safeTransact(ids.map((rid) => db.tx.rooms[rid].delete()))
}
