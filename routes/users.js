const express = require('express');
const bcrypt  = require('bcryptjs');
const User    = require('../models/User');
const protect = require('../middleware/auth');
const router  = express.Router();

// ── GET /users — all APPROVED users (admin only) ──
router.get('/', protect('admin'), async (req, res) => {
  try {
    const users = await User.find({ isApproved: true }, '-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── GET /users/pending — users awaiting approval (admin only) ──
router.get('/pending', protect('admin'), async (req, res) => {
  try {
    const users = await User.find({ isApproved: false }, '-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── PUT /users/:id/approve — approve a pending user (admin only) ──
router.put('/:id/approve', protect('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    await User.findByIdAndUpdate(req.params.id, { isApproved: true });
    res.json({ msg: 'User approved successfully' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── DELETE /users/:id/reject — reject & delete a pending user (admin only) ──
router.delete('/:id/reject', protect('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    if (user.isApproved) return res.status(400).json({ msg: 'User is already approved. Use delete instead.' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ msg: 'User rejected and removed' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── GET /users/role/:role — approved users by role ──
router.get('/role/:role', protect(), async (req, res) => {
  try {
    const { role } = req.params;
    if (req.user.role === 'faculty' && role !== 'student')
      return res.status(403).json({ msg: 'Access forbidden' });
    const users = await User.find({ role, isApproved: true }, '-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── POST /users/create — admin/faculty create users (auto-approved) ──
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
    if (exists) return res.status(400).json({ msg: 'An account with this email already exists.' });

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({
      name:       name.trim(),
      email:      email.toLowerCase().trim(),
      password:   hashed,
      role,
      semester,
      isApproved: true   // created by admin/faculty = automatically approved
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

// ── DELETE /users/:id — delete approved user (admin only) ──
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

// ── GET /users/me — current logged-in user ──
router.get('/me', protect(), async (req, res) => {
  try {
    const user = await User.findById(req.user.id, '-password');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── PUT /users/:id/semester — update semester ──
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
