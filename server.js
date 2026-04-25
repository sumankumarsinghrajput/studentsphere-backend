require('dotenv').config();

const express  = require('express');
const mongoose = require('mongoose');

const app = express();

// ── Manual CORS middleware — compatible with Express 5 ──
const allowedOrigins = [
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  'https://studentsphere0.netlify.app',
  'https://studentsphere.netlify.app'
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin || allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json({ limit: '10mb' }));

// ── Routes ──
app.use('/api/auth',    require('./routes/auth'));
app.use('/api/users',   require('./routes/users'));
app.use('/api/data',    require('./routes/data'));
app.use('/api/notices', require('./routes/notices'));   // ← NEW

app.get('/', (req, res) => res.json({ msg: 'Student Sphere API is running' }));

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
    app.listen(process.env.PORT || 3000, () => {
      console.log('Server running on port ' + (process.env.PORT || 3000));
    });
  })
  .catch(err => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });
