const mongoose = require('../db/conn');
const Course = require('../models/Course');
const User = require('../models/User');

async function createTestData() {
    try {
        // Create a test teacher
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
            }
        });

        // Create test students
        const student1 = new User({
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
            }
        });

        const student2 = new User({
            password: "12345678",
            role: "Student",
            sapID: "60004200002",
            personalInfo: {
                firstName: "Bob",
                lastName: "Johnson",
                email: "bob.johnson@example.com",
                phone: "9876543211"
            },
            academicInfo: {
                department: "Computer Science",
                year: 2,
                semester: 3
            }
        });

        // Save users
        const savedTeacher = await teacher.save();
        const savedStudent1 = await student1.save();
        const savedStudent2 = await student2.save();

        // Create test courses
        const course1 = new Course({
            courseCode: "CS101",
            courseName: "Introduction to Programming",
            department: "Computer Science",
            description: "Basic programming concepts using Python",
            credits: 4,
            semester: 1,
            year: 2024,
            instructor: savedTeacher._id,
            students: [
                { studentId: savedStudent1._id },
                { studentId: savedStudent2._id }
            ],
            schedule: [{
                day: "Monday",
                startTime: "10:00",
                endTime: "11:30",
                room: "CS-Lab-1"
            }],
            status: "Active"
        });

        const course2 = new Course({
            courseCode: "CS102",
            courseName: "Data Structures",
            department: "Computer Science",
            description: "Fundamental data structures and algorithms",
            credits: 4,
            semester: 2,
            year: 2024,
            instructor: savedTeacher._id,
            students: [
                { studentId: savedStudent1._id }
            ],
            schedule: [{
                day: "Wednesday",
                startTime: "14:00",
                endTime: "15:30",
                room: "CS-Lab-2"
            }],
            status: "Active"
        });

        // Save courses
        await course1.save();
        await course2.save();

        console.log("Test data created successfully!");
        console.log("Created:");
        console.log("- 1 Teacher (password: Teacher@123)");
        console.log("- 2 Students (password: 12345678)");
        console.log("- 2 Courses (CS101, CS102)");
        
    } catch (error) {
        console.error("Error creating test data:", error);
    } finally {
        // Close the connection
        await mongoose.connection.close();
    }
}

// Run the function
createTestData(); 