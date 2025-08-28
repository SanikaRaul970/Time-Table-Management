const mongoose = require('mongoose');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/studentManagementDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', async function() {
    try {
        // First, clear existing users
        await User.deleteMany({});
        console.log("Cleared existing users");

        // Create admin
        const admin = new User({
            password: "Admin@123",
            role: "Admin",
            personalInfo: {
                firstName: "Admin",
                lastName: "User",
                email: "admin@example.com",
                phone: "1234567890"
            },
            adminInfo: {
                department: "Administration",
                accessLevel: 3,
                privileges: ["all"]
            },
            status: "Active",
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // Create teacher
        const teacher = new User({
            password: "Teacher@123",
            role: "Teacher",
            personalInfo: {
                firstName: "John",
                lastName: "Doe",
                email: "john.doe@example.com",
                phone: "1234567890"
            },
            academicInfo: {
                department: "Computer Science",
                designation: "Professor"
            },
            status: "Active",
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // Create student
        const student = new User({
            password: "12345678",
            role: "Student",
            sapID: "60004200001",
            personalInfo: {
                firstName: "Alice",
                lastName: "Smith",
                email: "alice.smith@example.com",
                phone: "9876543210"
            },
            academicInfo: {
                department: "Computer Science",
                year: 2,
                semester: 3
            },
            status: "Active",
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // Save all users
        await admin.save();
        console.log("Admin created successfully!");
        
        await teacher.save();
        console.log("Teacher created successfully!");
        
        await student.save();
        console.log("Student created successfully!");

        console.log("All users created successfully!");
        
        // Display all users
        const users = await User.find({});
        console.log("\nCurrent users in database:");
        users.forEach(user => {
            console.log(`- ${user.role}: ${user.username} (${user.personalInfo.email})`);
        });

    } catch (error) {
        console.error("Error:", error);
    } finally {
        // Close the connection
        await mongoose.connection.close();
        console.log("\nDatabase connection closed");
    }
}); 