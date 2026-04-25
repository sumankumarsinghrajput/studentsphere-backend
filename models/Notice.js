const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  title:     { type: String, required: true, trim: true },
  body:      { type: String, required: true },
  author:    { type: String, required: true },        // faculty name
  semester:  { type: String, default: 'All' },        // 'All' or specific semester
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notice', noticeSchema);
