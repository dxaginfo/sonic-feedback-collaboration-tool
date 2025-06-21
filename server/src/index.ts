import express from 'express';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import trackRoutes from './routes/tracks';
import feedbackRoutes from './routes/feedback';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { authenticateJWT } from './middleware/auth';

// Create Express app
const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new SocketServer(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', authenticateJWT, projectRoutes);
app.use('/api/tracks', authenticateJWT, trackRoutes);
app.use('/api/feedback', authenticateJWT, feedbackRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('A user connected', socket.id);

  // Join a track room for real-time feedback
  socket.on('join-track', (trackId: string) => {
    socket.join(`track-${trackId}`);
    console.log(`User joined track-${trackId}`);
  });

  // Leave a track room
  socket.on('leave-track', (trackId: string) => {
    socket.leave(`track-${trackId}`);
    console.log(`User left track-${trackId}`);
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected', socket.id);
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { io };
