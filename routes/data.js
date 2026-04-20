const express = require('express');
const protect = require('../middleware/auth');
const Data    = require('../models/Data');
const router  = express.Router();

// GET student's own data
router.get('/my', protect('student'), async (req, res) => {
  try {
    const data = await Data.findOne({ email: req.user.email }) || {};
    res.json(data);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET any student's data (faculty/admin) — explicit path avoids Express 5 wildcard crash
router.get('/student/:email', protect(), async (req, res) => {
  try {
    if (req.user.role === 'student')
      return res.status(403).json({ msg: 'Access forbidden' });
    const data = await Data.findOne({ email: req.params.email }) || {};
    res.json(data);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// UPDATE attendance
router.put('/attendance', protect(), async (req, res) => {
  try {
    if (req.user.role === 'student') return res.status(403).json({ msg: 'Access forbidden' });
    const { email, value } = req.body;
    await Data.findOneAndUpdate({ email }, { $set: { attendance: value } }, { upsert: true, new: true });
    res.json({ msg: 'Attendance updated' });
  } catch (err) { res.status(500).json({ msg: 'Server error' }); }
});

// UPDATE marks
router.put('/marks', protect(), async (req, res) => {
  try {
    if (req.user.role === 'student') return res.status(403).json({ msg: 'Access forbidden' });
    const { email, value } = req.body;
    await Data.findOneAndUpdate({ email }, { $set: { marks: value } }, { upsert: true, new: true });
    res.json({ msg: 'Marks updated' });
  } catch (err) { res.status(500).json({ msg: 'Server error' }); }
});

// ADD note
router.post('/notes', protect(), async (req, res) => {
  try {
    if (req.user.role === 'student') return res.status(403).json({ msg: 'Access forbidden' });
    const { email, text, fileName, fileData, fileSize } = req.body;
    const note = { text, date: new Date().toISOString(), fileName, fileData, fileSize };
    await Data.findOneAndUpdate({ email }, { $push: { notes: note } }, { upsert: true, new: true });
    res.json({ msg: 'Note added' });
  } catch (err) { res.status(500).json({ msg: 'Server error' }); }
});

// DELETE note
router.delete('/notes/:email/:index', protect(), async (req, res) => {
  try {
    if (req.user.role === 'student') return res.status(403).json({ msg: 'Access forbidden' });
    const data = await Data.findOne({ email: req.params.email });
    if (!data) return res.status(404).json({ msg: 'Not found' });
    data.notes.splice(parseInt(req.params.index), 1);
    await data.save();
    res.json({ msg: 'Note deleted' });
  } catch (err) { res.status(500).json({ msg: 'Server error' }); }
});

// ADD assignment
router.post('/assignments', protect(), async (req, res) => {
  try {
    if (req.user.role === 'student') return res.status(403).json({ msg: 'Access forbidden' });
    const { email, text, fileName, fileData, fileSize } = req.body;
    const item = { text, date: new Date().toISOString(), fileName, fileData, fileSize };
    await Data.findOneAndUpdate({ email }, { $push: { assignments: item } }, { upsert: true, new: true });
    res.json({ msg: 'Assignment added' });
  } catch (err) { res.status(500).json({ msg: 'Server error' }); }
});

// DELETE assignment
router.delete('/assignments/:email/:index', protect(), async (req, res) => {
  try {
    if (req.user.role === 'student') return res.status(403).json({ msg: 'Access forbidden' });
    const data = await Data.findOne({ email: req.params.email });
    if (!data) return res.status(404).json({ msg: 'Not found' });
    data.assignments.splice(parseInt(req.params.index), 1);
    await data.save();
    res.json({ msg: 'Assignment deleted' });
  } catch (err) { res.status(500).json({ msg: 'Server error' }); }
});

// ADD lab
router.post('/lab', protect(), async (req, res) => {
  try {
    if (req.user.role === 'student') return res.status(403).json({ msg: 'Access forbidden' });
    const { email, text, fileName, fileData, fileSize } = req.body;
    const item = { text, date: new Date().toISOString(), fileName, fileData, fileSize };
    await Data.findOneAndUpdate({ email }, { $push: { lab: item } }, { upsert: true, new: true });
    res.json({ msg: 'Lab report added' });
  } catch (err) { res.status(500).json({ msg: 'Server error' }); }
});

// DELETE lab
router.delete('/lab/:email/:index', protect(), async (req, res) => {
  try {
    if (req.user.role === 'student') return res.status(403).json({ msg: 'Access forbidden' });
    const data = await Data.findOne({ email: req.params.email });
    if (!data) return res.status(404).json({ msg: 'Not found' });
    data.lab.splice(parseInt(req.params.index), 1);
    await data.save();
    res.json({ msg: 'Lab report deleted' });
  } catch (err) { res.status(500).json({ msg: 'Server error' }); }
});

module.exports = router;
