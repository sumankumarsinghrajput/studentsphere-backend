const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  text:      String,
  date:      String,
  fileName:  String,
  fileData:  String,
  fileSize:  Number,
  // ── Assignment extras ──
  dueDate:   { type: String, default: null },          // ISO date string set by faculty
  allowLate: { type: Boolean, default: false }         // faculty toggle
});

const submissionSchema = new mongoose.Schema({
  type:         { type: String, enum: ['assignment','lab'], default: 'assignment' }, // submission type
  itemId:       String,                                // matches itemSchema _id (new field)
  itemTitle:    String,                                // title (new field)
  assignmentId: String,                                // legacy: matches itemSchema _id
  assignmentTitle: String,                             // legacy
  studentEmail: String,
  studentName:  String,
  fileName:     String,
  fileData:     String,
  fileSize:     Number,
  submittedAt:  { type: Date, default: Date.now },
  status:       { type: String, enum: ['submitted','late'], default: 'submitted' }
});

const dataSchema = new mongoose.Schema({
  email:       { type: String, required: true, unique: true, lowercase: true },
  attendance:  { type: Number, default: null },
  marks:       { type: Number, default: null },
  notes:       [itemSchema],
  assignments: [itemSchema],
  lab:         [itemSchema],
  submissions: [submissionSchema]                      // student file submissions
});

module.exports = mongoose.model('Data', dataSchema);
