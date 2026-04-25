const express = require('express');
const protect = require('../middleware/auth');
const Notice  = require('../models/Notice');
const router  = express.Router();

// GET all notices (student/faculty/admin — any authenticated user)
// Students only see notices for their semester or 'All'
router.get('/', protect(), async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'student') {
      // students see notices targeted at their semester or 'All'
      // We fetch user semester from User model
      const User = require('../models/User');
      const user = await User.findById(req.user.id, 'semester');
      const sem = user?.semester || '';
      query = { $or: [{ semester: 'All' }, { semester: sem }] };
    }
    const notices = await Notice.find(query).sort({ createdAt: -1 });
    res.json(notices);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// POST create notice (faculty / admin only)
router.post('/', protect(), async (req, res) => {
  try {
    if (req.user.role === 'student')
      return res.status(403).json({ msg: 'Students cannot create notices' });

    const { title, body, semester } = req.body;
    if (!title || !body)
      return res.status(400).json({ msg: 'Title and body are required' });

    // Get author name
    const User = require('../models/User');
    const user = await User.findById(req.user.id, 'name');

    const notice = await Notice.create({
      title: title.trim(),
      body:  body.trim(),
      author: user?.name || 'Faculty',
      semester: semester || 'All'
    });

    res.status(201).json({ msg: 'Notice posted', notice });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// DELETE notice (faculty who created it, or admin)
router.delete('/:id', protect(), async (req, res) => {
  try {
    if (req.user.role === 'student')
      return res.status(403).json({ msg: 'Access forbidden' });

    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).json({ msg: 'Notice not found' });

    await Notice.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Notice deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
