const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

async function seedAdmin() {
  const exists = await User.findOne({ email: 'admin@studentsphere.com' });
  if (!exists) {
    await User.create({
      name: 'Administrator',
      email: 'admin@studentsphere.com',
      password: 'admin123',
      role: 'admin',
      semester: null
    });
    console.log('Admin account seeded');
  }
}
seedAdmin();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ msg: 'Please fill in all fields.' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(400).json({ msg: 'No account found with this email.' });

    const match = await user.comparePassword(password);
    if (!match) return res.status(400).json({ msg: 'Incorrect password.' });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        semester: user.semester
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── Register ──
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, semester } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ msg: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ msg: 'Password must be at least 6 characters' });
    }

    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) {
      return res.status(400).json({ msg: 'Email already registered' });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
      semester
    });

    res.status(201).json({
      msg: 'Account created successfully'
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
