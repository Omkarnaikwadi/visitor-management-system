const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);
    
    // Join user to their personal room
    socket.join(`user_${socket.userId}`);
    
    // Join host room for notifications
    socket.on('join_host_room', (hostId) => {
      socket.join(`host_${hostId}`);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });

  console.log('✅ Socket.io initialized');
  return io;
};

const getIO = () => io;

// Emit visitor arrival notification to host
const notifyVisitorArrival = (hostId, visitorData) => {
  if (io) {
    io.to(`host_${hostId}`).emit('visitor_arrived', visitorData);
    io.emit('visitor_checkin', visitorData); // Broadcast to all for dashboard updates
  }
};

// Emit visitor checkout notification
const notifyVisitorCheckout = (visitId, visitorData) => {
  if (io) {
    io.emit('visitor_checkout', { visitId, ...visitorData });
  }
};

// Emit dashboard stats update
const notifyStatsUpdate = () => {
  if (io) {
    io.emit('stats_updated');
  }
};

module.exports = { initSocket, getIO, notifyVisitorArrival, notifyVisitorCheckout, notifyStatsUpdate };
