const mongoose = require('mongoose');
const User = require('./models/User');

// MongoDB connection string (update if needed)
const mongoUri = 'mongodb://127.0.0.1:27017/studentPortal';

async function updateStudents() {
  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Update all students to have the correct department, year, and division
    const result = await User.updateMany(
      { role: 'Student' },
      { $set: { department: 'EXTC', year: 'BE', division: 'BE-2' } }
    );
    console.log(`Updated ${result.nModified || result.modifiedCount} students.`);
  } catch (error) {
    console.error('Error updating students:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

updateStudents(); 