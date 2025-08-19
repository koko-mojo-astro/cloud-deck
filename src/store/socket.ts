import { create } from 'zustand';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface SocketStore {
  status: ConnectionStatus;
  setStatus: (status: ConnectionStatus) => void;
}

export const useSocketStore = create<SocketStore>((set) => ({
  status: 'disconnected',
  setStatus: (status) => set({ status }),
}));
