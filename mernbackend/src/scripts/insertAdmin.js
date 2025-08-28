const mongoose = require('../db/conn');
const User = require('../models/User');

async function insertAdmin() {
    try {
        const adminUser = new User({
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
                privileges: ["all"],
                lastLogin: new Date()
            },
            status: "Active",
            createdAt: new Date(),
            updatedAt: new Date()
        });

        await adminUser.save();
        console.log("Admin user created successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Error creating admin:", error);
        process.exit(1);
    }
}

insertAdmin(); 