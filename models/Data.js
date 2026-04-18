const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  text:     String,
  date:     String,
  fileName: String,
  fileData: String,
  fileSize: Number
});

const dataSchema = new mongoose.Schema({
  email:       { type: String, required: true, unique: true, lowercase: true },
  attendance:  { type: Number, default: null },
  marks:       { type: Number, default: null },
  notes:       [itemSchema],
  assignments: [itemSchema],
  lab:         [itemSchema]
});

module.exports = mongoose.model('Data', dataSchema);