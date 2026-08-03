import { io } from 'socket.io-client';

let socket = null;

export const initSocket = (token) => {
  if (socket && socket.connected) {
    return socket;
  }

  socket = io(window.location.origin, {
    auth: {
      token: token || localStorage.getItem('accessToken'),
    },
    transports: ['websocket', 'polling'],
    autoConnect: true,
  });

  socket.on('connect', () => {
    console.log('Connected to socket server:', socket.id);
  });

  socket.on('connect_error', (err) => {
    console.error('Socket connection error:', err.message);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
