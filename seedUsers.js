require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function seedUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");

    // ⚠️ Clean insert (optional)
    await User.deleteMany({ role: 'student' });

    const names = [
      "Aarav Sharma","Vivaan Singh","Aditya Kumar","Krishna Verma","Aryan Gupta","Rohan Mishra",
      "Ananya Das","Priya Singh","Sneha Kumari","Neha Verma","Pooja Yadav","Kajal Gupta",
      "Rahul Kumar","Amit Singh","Sandeep Yadav","Vikas Raj","Manish Kumar","Deepak Verma",
      "Sakshi Sharma","Riya Gupta","Nikita Kumari","Anjali Singh","Simran Kaur","Muskan Das",
      "Karan Mehta","Harsh Raj","Shubham Kumar","Abhishek Singh","Nitin Sharma","Gaurav Verma",
      "Meena Kumari","Payal Gupta","Ritu Singh","Komal Yadav","Sonali Das","Preeti Kumari",
      "Ajay Kumar","Pankaj Singh","Ravi Yadav","Mukesh Sharma","Dinesh Gupta","Suraj Verma"
    ];

    const users = [];

    let index = 0;

    for (let sem = 1; sem <= 7; sem++) {
      for (let i = 1; i <= 6; i++) {

        const name = names[index];
        const emailName = name.toLowerCase().replace(/\s/g, '');

        users.push({
          name,
          email: `${emailName}${sem}@ss.com`,
          password: "123456",
          role: "student",
          semester: `Semester ${sem}`
        });

        index++;
      }
    }

    for (let user of users) {
      await User.create(user); // 🔥 password auto-hash
    }

    console.log(`${users.length} students inserted successfully`);
    process.exit();

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedUsers();