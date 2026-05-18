const express = require('express');
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const router  = express.Router();

// ── Seed default admin on startup ──
async function seedAdmin() {
  const exists = await User.findOne({ email: 'admin@studentsphere.com' });
  if (!exists) {
    await User.create({
      name:       'Administrator',
      email:      'admin@studentsphere.com',
      password:   'admin123',
      role:       'admin',
      semester:   null,
      isApproved: true   // admin is always approved
    });
    console.log('Admin account seeded');
  } else if (!exists.isApproved) {
    // Ensure existing admin is approved (migration safety)
    await User.findByIdAndUpdate(exists._id, { isApproved: true });
  }
}
seedAdmin();

// ── POST /auth/login ──
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ msg: 'Please fill in all fields.' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user)
      return res.status(400).json({ msg: 'No account found with this email.' });

    const match = await user.comparePassword(password);
    if (!match)
      return res.status(400).json({ msg: 'Incorrect password.' });

    // ── Approval gate (skip for admin) ──
    if (user.role !== 'admin' && !user.isApproved) {
      return res.status(403).json({
        msg: 'Your account is pending admin approval. Please wait for approval before logging in.',
        code: 'PENDING_APPROVAL'
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        name:       user.name,
        email:      user.email,
        role:       user.role,
        semester:   user.semester,
        isApproved: user.isApproved
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── POST /auth/register ──
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, semester } = req.body;

    if (!name || !email || !password || !role)
      return res.status(400).json({ msg: 'All fields are required' });

    if (password.length < 6)
      return res.status(400).json({ msg: 'Password must be at least 6 characters' });

    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists)
      return res.status(400).json({ msg: 'Email already registered' });

    await User.create({
      name:       name.trim(),
      email:      email.toLowerCase().trim(),
      password,
      role,
      semester,
      isApproved: false   // new users must wait for admin approval
    });

    res.status(201).json({
      msg: 'Account created successfully. Please wait for admin approval before logging in.'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
