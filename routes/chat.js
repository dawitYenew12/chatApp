import express from 'express';
import Message from '../models/Message.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv'

dotenv.config(); 
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET_KEY;

const authenticate = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) {
    console.log('No token provided');
    return res.status(403).json({ message: 'No token provided' });
  }
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log('Failed to authenticate token:', err);
      return res.status(500).json({ message: 'Failed to authenticate token' });
    }
    req.userId = decoded.id;
    next();
  });
};

router.get('/:receiver', authenticate, async (req, res) => {
  const { receiver } = req.params;
  console.log('Get messages request:', { userId: req.userId, receiver });
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.userId, receiver },
        { sender: receiver, receiver: req.userId },
      ],
    }).sort('timestamp');
    res.json(messages);
    console.log('Messages retrieved:', messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/', authenticate, async (req, res) => {
  const { receiver, message } = req.body;
  console.log('Post message request:', { sender: req.userId, receiver, message });
  try {
    const newMessage = new Message({
      sender: req.userId,
      receiver,
      message,
    });
    await newMessage.save();
    res.status(201).json(newMessage);
    console.log('Message sent:', newMessage);
  } catch (error) {
    console.error('Post message error:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
