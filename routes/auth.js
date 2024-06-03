import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import dotenv from 'dotenv';

dotenv.config();  // Load environment variables from .env file
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET_KEY;

if (!JWT_SECRET) {
  console.error("JWT_SECRET_KEY is not set. Please set it in the .env file.");
  process.exit(1);  // Exit if the secret key is not set
}

// Register
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  console.log('Register request:', req.body);  // Log request details
  try {
    const user = new User({ username, password });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
    console.log('User registered successfully:', username);  // Log success
  } catch (error) {
    console.error('Registration error:', error);  // Log error details
    res.status(500).json({ message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  console.log('Login request:', req.body);  // Log request details
  try {
    const user = await User.findOne({ username });
    if (!user || !(await user.comparePassword(password))) {
      console.log('Invalid credentials');  // Log invalid credentials
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
    console.log('User logged in successfully:', username);  // Log success
  } catch (error) {
    console.error('Login error:', error);  // Log error details
    res.status(500).json({ message: error.message });
  }
});

export default router;
