const mongoose = require('../db/conn');
const User = require('../models/User');

async function insertUsers() {
    try {
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
                designation: "Professor",
                joiningDate: new Date()
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
                semester: 3,
                enrolledCourses: []
            },
            status: "Active",
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // Save both users
        await teacher.save();
        console.log("Teacher created successfully!");
        
        await student.save();
        console.log("Student created successfully!");

        process.exit(0);
    } catch (error) {
        console.error("Error creating users:", error);
        process.exit(1);
    }
}

insertUsers(); 