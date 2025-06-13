
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { User, Conversation, Message } = require('./models');
const router = express.Router();

// Middleware to regster a new user
router.post('/auth/register', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).send({ message: 'User registered' });
  } catch (err) {
    res.status(400).send(err);
  }
});

// Middleware to login
router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).send({ message: 'Invalid credentials' });
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  res.send({ token });
});

// List all users (except current user)
router.get('/users', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).send({ message: 'No token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const users = await User.find({ _id: { $ne: decoded.id } }).select('-password');
    res.send(users);
  } catch {
    res.status(401).send({ message: 'Invalid token' });
  }
});


router.get('/users/me', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).send({ message: 'No token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    res.send(user);
  } catch {
    res.status(401).send({ message: 'Invalid token' });
  }
});

router.get('/conversations', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const conv = await Conversation.find({ participants: decoded.id }).populate('participants', 'username');
  res.send(conv);
});

router.post('/conversations', async (req, res) => {
  const convo = new Conversation({ participants: req.body.participants });
  await convo.save();
  res.status(201).send(convo);
});

router.get('/conversations/:id/messages', async (req, res) => {
  const msgs = await Message.find({ conversationId: req.params.id });
  res.send(msgs);
});

router.post('/conversations/:id/messages', async (req, res) => {
  const msg = new Message({ ...req.body, conversationId: req.params.id });
  await msg.save();
  res.status(201).send(msg);
});

module.exports = router;
