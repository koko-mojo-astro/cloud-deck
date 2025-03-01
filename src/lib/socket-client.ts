import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from '../server/socket';

const getSocketUrl = () => {
  if (typeof window === 'undefined') return '';
  
  // For production, always use the NEXT_PUBLIC_SOCKET_URL
  if (process.env.NODE_ENV === 'production') {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }
  
  return process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;
};

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(getSocketUrl(), {
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
  autoConnect: true,
  withCredentials: true,
});

socket.on('connect_error', (error) => {
  console.error('Socket connection error:', error);
});

socket.on('connect', () => {
  console.log('Socket connected successfully');
});

export default socket;