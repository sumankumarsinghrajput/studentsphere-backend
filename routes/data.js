const express = require('express');
const protect = require('../middleware/auth');
const Data    = require('../models/Data');
const router  = express.Router();

// ── GET student's own data ──
router.get('/my', protect('student'), async (req, res) => {
  try {
    const data = await Data.findOne({ email: req.user.email }) || {};
    res.json(data);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── GET any student's data (faculty/admin) ──
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

// ── UPDATE attendance ──
router.put('/attendance', protect(), async (req, res) => {
  try {
    if (req.user.role === 'student') return res.status(403).json({ msg: 'Access forbidden' });
    const { email, value } = req.body;
    await Data.findOneAndUpdate({ email }, { $set: { attendance: value } }, { upsert: true, new: true });
    res.json({ msg: 'Attendance updated' });
  } catch (err) { res.status(500).json({ msg: 'Server error' }); }
});

// ── UPDATE marks ──
router.put('/marks', protect(), async (req, res) => {
  try {
    if (req.user.role === 'student') return res.status(403).json({ msg: 'Access forbidden' });
    const { email, value } = req.body;
    await Data.findOneAndUpdate({ email }, { $set: { marks: value } }, { upsert: true, new: true });
    res.json({ msg: 'Marks updated' });
  } catch (err) { res.status(500).json({ msg: 'Server error' }); }
});

// ── ADD note ──
router.post('/notes', protect(), async (req, res) => {
  try {
    if (req.user.role === 'student') return res.status(403).json({ msg: 'Access forbidden' });
    const { email, text, fileName, fileData, fileSize } = req.body;
    const note = { text, date: new Date().toISOString(), fileName, fileData, fileSize };
    await Data.findOneAndUpdate({ email }, { $push: { notes: note } }, { upsert: true, new: true });
    res.json({ msg: 'Note added' });
  } catch (err) { res.status(500).json({ msg: 'Server error' }); }
});

// ── DELETE note ──
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

// ── ADD assignment (with optional dueDate + allowLate) ──
router.post('/assignments', protect(), async (req, res) => {
  try {
    if (req.user.role === 'student') return res.status(403).json({ msg: 'Access forbidden' });
    const { email, text, fileName, fileData, fileSize, dueDate, allowLate } = req.body;
    const item = {
      text, date: new Date().toISOString(),
      fileName, fileData, fileSize,
      dueDate: dueDate || null,
      allowLate: allowLate || false
    };
    await Data.findOneAndUpdate({ email }, { $push: { assignments: item } }, { upsert: true, new: true });
    res.json({ msg: 'Assignment added' });
  } catch (err) { res.status(500).json({ msg: 'Server error' }); }
});

// ── UPDATE assignment dueDate / allowLate ──
router.put('/assignments/:email/:index', protect(), async (req, res) => {
  try {
    if (req.user.role === 'student') return res.status(403).json({ msg: 'Access forbidden' });
    const data = await Data.findOne({ email: req.params.email });
    if (!data) return res.status(404).json({ msg: 'Not found' });
    const idx = parseInt(req.params.index);
    if (req.body.dueDate   !== undefined) data.assignments[idx].dueDate   = req.body.dueDate;
    if (req.body.allowLate !== undefined) data.assignments[idx].allowLate = req.body.allowLate;
    await data.save();
    res.json({ msg: 'Assignment updated' });
  } catch (err) { res.status(500).json({ msg: 'Server error' }); }
});

// ── DELETE assignment ──
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

// ── ADD lab ──
router.post('/lab', protect(), async (req, res) => {
  try {
    if (req.user.role === 'student') return res.status(403).json({ msg: 'Access forbidden' });
    const { email, text, fileName, fileData, fileSize } = req.body;
    const item = { text, date: new Date().toISOString(), fileName, fileData, fileSize };
    await Data.findOneAndUpdate({ email }, { $push: { lab: item } }, { upsert: true, new: true });
    res.json({ msg: 'Lab report added' });
  } catch (err) { res.status(500).json({ msg: 'Server error' }); }
});

// ── DELETE lab ──
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

// ── STUDENT: Submit assignment ──
router.post('/submit', protect('student'), async (req, res) => {
  try {
    const { assignmentId, assignmentTitle, fileName, fileData, fileSize, dueDate } = req.body;
    if (!fileData) return res.status(400).json({ msg: 'No file provided' });

    // Determine if late
    let status = 'submitted';
    if (dueDate) {
      const due = new Date(dueDate);
      if (new Date() > due) status = 'late';
    }

    const sub = {
      assignmentId,
      assignmentTitle,
      studentEmail: req.user.email,
      studentName:  req.user.name || '',
      fileName,
      fileData,
      fileSize,
      submittedAt: new Date(),
      status
    };

    // Store on student's own data record
    await Data.findOneAndUpdate(
      { email: req.user.email },
      { $push: { submissions: sub } },
      { upsert: true, new: true }
    );

    res.json({ msg: 'Submitted successfully', status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── FACULTY: Get all submissions for a semester's students ──
router.get('/submissions/:email', protect(), async (req, res) => {
  try {
    if (req.user.role === 'student') return res.status(403).json({ msg: 'Access forbidden' });
    const data = await Data.findOne({ email: req.params.email }, 'submissions');
    res.json(data?.submissions || []);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
