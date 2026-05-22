const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // ── Core (existing — unchanged) ──
  name:       { type: String, required: true, trim: true },
  email:      { type: String, required: true, unique: true, lowercase: true },
  password:   { type: String, required: true, minlength: 6 },
  role:       { type: String, enum: ['student','faculty','admin'], default: 'student' },
  semester:   { type: String, default: null },
  isApproved: { type: Boolean, default: false },
  createdAt:  { type: Date, default: Date.now },

  // ── Extended profile (all optional — backward compatible) ──
  profileImage: { type: String, default: null },   // base64 data URL
  phone:        { type: String, default: '' },
  gender:       { type: String, enum: ['Male','Female','Other',''], default: '' },
  dob:          { type: String, default: '' },     // ISO date string
  address:      { type: String, default: '' },
  bio:          { type: String, default: '' },

  // Student-specific
  rollNumber:   { type: String, default: '' },
  department:   { type: String, default: '' },

  // Faculty-specific
  facultyId:     { type: String, default: '' },
  subject:       { type: String, default: '' },
  qualification: { type: String, default: '' },
  experience:    { type: String, default: '' },   // e.g. "5 years"
});

userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
