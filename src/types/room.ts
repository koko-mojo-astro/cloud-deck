export type UserRole = 'admin' | 'observer' | 'estimator';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  vote: number | null;
  hasVoted: boolean;
  roomName?: string;
  votingOptions?: number[];
}

export interface Room {
  id: string;
  name: string;
  createdAt: Date;
  users: User[];
  isVoting: boolean;
  timerStartedAt: Date | null;
  timerDuration: number; // in seconds
  revealed: boolean;
  votingOptions: number[];
  enabled: boolean; // Whether the room is enabled for voting
}

export interface RoomState extends Room {
  currentUser: User | null;
}

export const FIBONACCI_SEQUENCE = [1, 2, 3, 5, 8, 13, 21];

export const DEFAULT_TIMER_DURATION = 15; // 15 seconds