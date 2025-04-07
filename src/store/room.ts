import { create } from 'zustand';
import { Room, RoomState, User, FIBONACCI_SEQUENCE, DEFAULT_TIMER_DURATION } from '@/types/room';

interface RoomStore extends RoomState {
  setCurrentUser: (user: User) => void;
  addUser: (user: User) => void;
  removeUser: (userId: string) => void;
  startVoting: () => void;
  endVoting: () => void;
  submitVote: (userId: string, vote: number) => void;
  revealVotes: () => void;
  resetVotes: () => void;
  updateTimer: (duration: number) => void;
  toggleRoomEnabled: (enabled: boolean) => void;
  setRoomTimer: (duration: number) => void;
}

const initialState: RoomState = {
  id: '',
  name: '',
  createdAt: new Date(),
  users: [],
  isVoting: false,
  timerStartedAt: null,
  timerDuration: DEFAULT_TIMER_DURATION,
  revealed: false,
  votingOptions: FIBONACCI_SEQUENCE,
  enabled: true,
  currentUser: null
};

export const useRoomStore = create<RoomStore>((set) => ({
  ...initialState,
  setCurrentUser: (user) => set({ currentUser: user }),
  addUser: (user) =>
    set((state) => ({
      users: [...state.users, user]
    })),
  removeUser: (userId) =>
    set((state) => ({
      users: state.users.filter((user) => user.id !== userId)
    })),
  startVoting: () =>
    set({
      isVoting: true,
      timerStartedAt: new Date(),
      revealed: false
    }),
  endVoting: () =>
    set({
      isVoting: false,
      timerStartedAt: null
    }),
  submitVote: (userId, vote) =>
    set((state) => ({
      users: state.users.map((user) =>
        user.id === userId
          ? { ...user, vote, hasVoted: true }
          : user
      )
    })),
  revealVotes: () => set({ revealed: true }),
  resetVotes: () =>
    set((state) => ({
      users: state.users.map((user) => ({
        ...user,
        vote: null,
        hasVoted: false
      })),
      revealed: false,
      isVoting: false,
      timerStartedAt: null
    })),
  updateTimer: (duration) => set({ timerDuration: duration }),
  toggleRoomEnabled: (enabled) => set({ enabled }),
  setRoomTimer: (duration) => set({ timerDuration: duration })
}));