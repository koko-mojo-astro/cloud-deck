import { i } from '@instantdb/react';

const _schema = i.schema({
	entities: {
		rooms: i.entity({
			name: i.string(),
			createdAt: i.number(),
			votingOptions: i.any(),
			timerDuration: i.number(),
			timerStartedAt: i.number().optional(),
			revealed: i.boolean(),
			enabled: i.boolean(),
		}),
		players: i.entity({
			roomId: i.string().indexed(),
			userId: i.string().indexed(),
			name: i.string(),
			role: i.string(),
			roomName: i.string().optional(),
			vote: i.any().optional(),
			hasVoted: i.boolean(),
			lastSeenAt: i.number(),
		}),
	},
});

type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema = _schema as unknown as AppSchema;

export type { AppSchema };
export default schema;
