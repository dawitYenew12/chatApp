import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import chatRoutes from './routes/chat.js';
import { requireAuth, isAdmin } from './middleware/authMiddleware.js';
import Message from './models/Message.js';
import { userRouter } from './routes/userRoutes.js';

dotenv.config();  // Load environment variables from .env file

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_STRING;

const upload = multer({ dest: 'uploads/' });  // Configure multer to save files to the 'uploads' folder

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));  // Serve uploaded files as static files

// Mongoose connection with error handling
mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('MongoDB connection error:', error));

app.use("/api/users", userRouter);
app.use('/api/chat', chatRoutes); // Ensure routes are correct

// File upload endpoint
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded');
  }
  res.status(200).json({ imageUrl: `/uploads/${req.file.filename}` });
});

// Mark message as read endpoint
app.post('/api/readMessage', requireAuth, async (req, res) => {
  const { messageId } = req.body;

  try {
    await Message.findByIdAndUpdate(messageId, { read: true });
    res.status(200).send({ success: true });
  } catch (error) {
    res.status(500).send({ success: false, error });
  }
});

// WebSocket connection
io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('sendMessage', async (data) => {
    const { sender, receiver, message, imageUrl, time } = data;

    if (!sender || !receiver || (!message && !imageUrl)) {
      console.error('Missing required fields');
      return;
    }

    const newMessage = new Message({
      sender,
      receiver,
      message: message || '',
      imageUrl,
      time: time || new Date().toISOString(),
      read: false,
    });

    try {
      await newMessage.save();
      const messageToEmit = {
        _id: newMessage._id,
        sender: newMessage.sender,
        receiver: newMessage.receiver,
        message: newMessage.message,
        imageUrl: newMessage.imageUrl,
        time: newMessage.time,
        read: newMessage.read,
      };
      io.emit('receiveMessage', messageToEmit);
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });

  socket.on('markAsRead', async (data) => {
    const { messageId } = data;
    try {
      await Message.findByIdAndUpdate(messageId, { read: true });
      io.emit('messageRead', { messageId });
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Server listening
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
