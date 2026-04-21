const express = require('express');
const bcrypt  = require('bcryptjs');
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
    // Faculty can only fetch students
    if (req.user.role === 'faculty' && role !== 'student')
      return res.status(403).json({ msg: 'Access forbidden' });
    const users = await User.find({ role }, '-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── POST create user (admin creates faculty+students, faculty creates students only) ──
router.post('/create', protect(), async (req, res) => {
  try {
    const { name, email, password, role, semester } = req.body;
    const creator = req.user;

    // Faculty can only create students
    if (creator.role === 'faculty' && role !== 'student')
      return res.status(403).json({ msg: 'Faculty can only add students.' });

    // Only admin can create faculty or admin
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
    if (exists) return res.status(400).json({ msg: 'An account with this email already exists.' });

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({
      name:     name.trim(),
      email:    email.toLowerCase().trim(),
      password: hashed,
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
    if (user.role === 'admin') return res.status(400).json({ msg: 'Cannot delete admin account.' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ msg: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── GET current logged-in user profile ──
router.get('/me', protect(), async (req, res) => {
  try {
    const user = await User.findById(req.user.id, '-password');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});


// ── PUT update semester ──
router.put('/:id/semester', protect(), async (req, res) => {
  try {
    const { semester } = req.body;
    if (!semester) return res.status(400).json({ msg: 'Semester required' });
    await User.findByIdAndUpdate(req.params.id, { semester });
    res.json({ msg: 'Semester updated' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;