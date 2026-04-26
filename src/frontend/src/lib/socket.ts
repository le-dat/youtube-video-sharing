import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:5000/events';

export interface VideoNotification {
  id: string;
  type: 'new_video' | 'vote_update';
  videoId?: string;
  videoTitle?: string;
  sharedByUsername?: string;
  thumbnailUrl?: string;
  createdAt?: string;
  upvoteCount?: number;
  downvoteCount?: number;
}

type NotificationHandler = (data: VideoNotification) => void;

let socket: Socket | null = null;
let handlers: NotificationHandler[] = [];

export function connectSocket(): Socket {
  if (socket?.connected) return socket;

  socket = io(WS_URL, {
    transports: ['websocket', 'polling'],
    autoConnect: true,
  });

  socket.on('newVideo', (data: VideoNotification) => {
    handlers.forEach(handler => handler(data));
  });

  socket.on('videoUpdate', (data: VideoNotification) => {
    handlers.forEach(handler => handler(data));
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function onVideoNotification(handler: NotificationHandler) {
  handlers.push(handler);
  return () => {
    handlers = handlers.filter(h => h !== handler);
  };
}
