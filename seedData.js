require('dotenv').config();
const mongoose = require('mongoose');
const Data = require('./models/Data');
const User = require('./models/User');

async function seedData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");

    // 🔥 Clear old data (recommended)
    await Data.deleteMany({});

    const students = await User.find({ role: 'student' });

    // 📦 Group students by semester
    const semMap = {};

    students.forEach(s => {
      if (!semMap[s.semester]) semMap[s.semester] = [];
      semMap[s.semester].push(s);
    });

    // 🔁 Process each semester
    for (let sem in semMap) {

      const group = semMap[sem];

      // Shuffle students (random order)
      group.sort(() => Math.random() - 0.5);

      for (let i = 0; i < group.length; i++) {

        let marks, attendance;

        if (i === 0) {
          // 🥇 Topper
          marks = rand(88, 95);
          attendance = rand(90, 95);
        } 
        else if (i <= 2) {
          // 👍 Good
          marks = rand(70, 87);
          attendance = rand(75, 89);
        } 
        else if (i <= 4) {
          // 🙂 Average
          marks = rand(50, 69);
          attendance = rand(50, 74);
        } 
        else {
          // ❌ Weak
          marks = rand(30, 40);
          attendance = rand(20, 30);
        }

        await Data.create({
          email: group[i].email,
          attendance,
          marks,
          notes: [],
          assignments: [],
          lab: []
        });
      }
    }

    console.log(`${students.length} students data inserted successfully`);
    process.exit();

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

// 🔢 Random helper
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

seedData();