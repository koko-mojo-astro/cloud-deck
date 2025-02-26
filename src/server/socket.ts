import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { FIBONACCI_SEQUENCE, Room, User } from '@/types/room';

interface ServerToClientEvents {
  roomUpdated: (room: Room) => void;
  userJoined: (user: User) => void;
  userLeft: (userId: string) => void;
  votingStarted: () => void;
  votingEnded: () => void;
  votesRevealed: () => void;
  votesReset: () => void;
  countdownStarted: () => void;
}

interface ClientToServerEvents {
  joinRoom: (roomId: string, user: User) => void;
  leaveRoom: (roomId: string, userId: string) => void;
  startVoting: (roomId: string) => void;
  endVoting: (roomId: string) => void;
  submitVote: (roomId: string, userId: string, vote: number) => void;
  revealVotes: (roomId: string) => void;
  resetVotes: (roomId: string) => void;
  updateTimer: (roomId: string, duration: number) => void;
  updateVotingSystem: (roomId: string, options: number[]) => void;
}

interface InterServerEvents { }

interface SocketData {
  user: User;
  roomId: string;
}

const rooms = new Map<string, Room>();

export const initSocketServer = (httpServer: HttpServer) => {
  const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
      allowedHeaders: ['Content-Type']
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
  });

  io.on('connection', (socket) => {
    socket.on('joinRoom', async (roomId, user) => {
      socket.data.user = user;
      socket.data.roomId = roomId;
      await socket.join(roomId);

      let room = rooms.get(roomId);
      if (!room) {
        // Only use user's voting options when creating a new room and user is admin
        room = {
          id: roomId,
          name: user.roomName || 'Planning Poker Room',
          createdAt: new Date(),
          users: [],
          isVoting: false,
          timerStartedAt: null,
          timerDuration: 30,
          revealed: false,
          votingOptions: FIBONACCI_SEQUENCE
        };
      }

      room.users.push(user);
      rooms.set(roomId, room);

      socket.to(roomId).emit('userJoined', user);
      io.to(roomId).emit('roomUpdated', room);
    });

    socket.on('leaveRoom', async (roomId, userId) => {
      const room = rooms.get(roomId);
      if (room) {
        room.users = room.users.filter((u) => u.id !== userId);
        if (room.users.length === 0) {
          rooms.delete(roomId);
        } else {
          rooms.set(roomId, room);
          socket.to(roomId).emit('userLeft', userId);
          io.to(roomId).emit('roomUpdated', room);
        }
      }
      await socket.leave(roomId);
    });

    socket.on('startVoting', (roomId) => {
      const room = rooms.get(roomId);
      if (room) {
        // Emit countdown to all clients in the room
        io.to(roomId).emit('countdownStarted');

        // Start voting after 3 seconds
        setTimeout(() => {
          room.isVoting = true;
          room.timerStartedAt = new Date();
          room.revealed = false;
          rooms.set(roomId, room);
          io.to(roomId).emit('votingStarted');
          io.to(roomId).emit('roomUpdated', room);
        }, 3000);
      }
    });

    socket.on('endVoting', (roomId) => {
      const room = rooms.get(roomId);
      if (room) {
        room.isVoting = false;
        room.timerStartedAt = null;
        rooms.set(roomId, room);
        io.to(roomId).emit('votingEnded');
        io.to(roomId).emit('roomUpdated', room);
      }
    });

    socket.on('submitVote', (roomId, userId, vote) => {
      const room = rooms.get(roomId);
      if (room) {
        const user = room.users.find((u) => u.id === userId);
        if (user) {
          user.vote = vote;
          user.hasVoted = true;
          rooms.set(roomId, room);
          io.to(roomId).emit('roomUpdated', room);
        }
      }
    });

    socket.on('revealVotes', (roomId) => {
      const room = rooms.get(roomId);
      if (room) {
        room.revealed = true;
        rooms.set(roomId, room);
        io.to(roomId).emit('votesRevealed');
        io.to(roomId).emit('roomUpdated', room);
      }
    });

    socket.on('resetVotes', (roomId) => {
      const room = rooms.get(roomId);
      if (room) {
        room.users.forEach((user) => {
          user.vote = null;
          user.hasVoted = false;
        });
        room.revealed = false;
        room.isVoting = false;
        room.timerStartedAt = null;
        rooms.set(roomId, room);
        io.to(roomId).emit('votesReset');
        io.to(roomId).emit('roomUpdated', room);
      }
    });

    socket.on('updateTimer', (roomId, duration) => {
      const room = rooms.get(roomId);
      if (room) {
        room.timerDuration = duration;
        rooms.set(roomId, room);
        io.to(roomId).emit('roomUpdated', room);
      }
    });



    socket.on('disconnect', () => {
      if (socket.data.roomId && socket.data.user) {
        const room = rooms.get(socket.data.roomId);
        if (room) {
          room.users = room.users.filter((u) => u.id !== socket.data.user.id);
          if (room.users.length === 0) {
            rooms.delete(socket.data.roomId);
          } else {
            rooms.set(socket.data.roomId, room);
            socket.to(socket.data.roomId).emit('userLeft', socket.data.user.id);
            io.to(socket.data.roomId).emit('roomUpdated', room);
          }
        }
      }
    });
  });

  return io;
};