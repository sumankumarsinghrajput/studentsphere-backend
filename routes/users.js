const express = require('express');
const User    = require('../models/User');
const protect = require('../middleware/auth');
const router  = express.Router();

// ── GET all users (admin only) ──
router.get('/', protect('admin'), async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── GET users by role ──
router.get('/role/:role', protect(), async (req, res) => {
  try {
    const { role } = req.params;
    if (req.user.role === 'faculty' && role !== 'student')
      return res.status(403).json({ msg: 'Access forbidden' });
    const users = await User.find({ role }, '-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── POST create user ──
router.post('/create', protect(), async (req, res) => {
  try {
    const { name, email, password, role, semester } = req.body;
    const creator = req.user;

    if (creator.role === 'faculty' && role !== 'student')
      return res.status(403).json({ msg: 'Faculty can only add students.' });
    if (creator.role !== 'admin' && role === 'faculty')
      return res.status(403).json({ msg: 'Only admin can add faculty.' });

    if (!name || !email || !password || !role)
      return res.status(400).json({ msg: 'All fields are required.' });
    if (password.length < 6)
      return res.status(400).json({ msg: 'Password must be at least 6 characters.' });
    if (!['student', 'faculty'].includes(role))
      return res.status(400).json({ msg: 'Invalid role.' });
    if (!semester)
      return res.status(400).json({ msg: 'Please select a semester.' });

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists)
      return res.status(400).json({ msg: 'An account with this email already exists.' });

    // ✅ Do NOT hash here — User model pre('save') hook handles hashing
    const user = await User.create({
      name:     name.trim(),
      email:    email.toLowerCase().trim(),
      password: password,   // plain — hook will hash it
      role,
      semester
    });

    res.status(201).json({
      msg: 'Account created successfully',
      user: { name: user.name, email: user.email, role: user.role, semester: user.semester }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── DELETE user (admin only) ──
router.delete('/:id', protect('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    if (user.role === 'admin')
      return res.status(400).json({ msg: 'Cannot delete admin account.' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ msg: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── GET current user profile ──
router.get('/me', protect(), async (req, res) => {
  try {
    const user = await User.findById(req.user.id, '-password');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
