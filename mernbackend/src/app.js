require('dotenv').config();
const express = require('express');
const path = require('path');
const hbs = require('hbs');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { auth, isTeacher, isStudent, isAdmin } = require('./middleware/auth');
const ApprovedSapId = require('./models/ApprovedSapId');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');

// Import routes
const attendanceRoutes = require('./routes/attendanceRoutes');
const adminRoutes = require('./routes/adminRoutes');
const syllabusRouter = require('./routes/syllabus');

const app = express();
const port = process.env.PORT || 3001;

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Register Handlebars helpers
hbs.registerHelper('formatDate', function(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
});

hbs.registerHelper('eq', function (a, b) {
    return a === b;
});

// MongoDB Connection
require('./db/conn');

// Define paths
const static_path = path.join(__dirname, '../public');
const template_path = path.join(__dirname, '../templates/views');
const partials_path = path.join(__dirname, '../templates/partials');

// Setup static directory to serve
app.use(express.static(static_path));

// Setup handlebars engine and views location
app.set('view engine', 'hbs');
app.set('views', template_path);
hbs.registerPartials(partials_path);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false
}));

// Add flash message middleware
app.use((req, res, next) => {
    res.locals.message = req.session.message;
    res.locals.error = req.session.error;
    delete req.session.message;
    delete req.session.error;
    next();
});

// Import models
const Register = require('./models/Register');
const Attendance = require('./models/Attendance');
const Subject = require('./models/Subject');
const Notification = require('./models/Notification');

// Public routes
app.get('/', (req, res) => {
    res.render('index');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.get('/login', (req, res) => {
    res.render('login');
});

// Use routes
app.use('/api/attendance', attendanceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/syllabus', syllabusRouter);

// Protected routes
app.get('/student-dashboard', auth, isStudent, async (req, res) => {
    try {
        const user = await Register.findById(req.user._id);
        if (!user) {
            return res.redirect('/login');
        }

        // Get attendance records for the student
        const attendanceRecords = await Attendance.find({ 
            studentId: req.user._id 
        }).populate('teacherId', 'name');

        // Get notifications
        const notifications = await Notification.find({ 
            userId: req.user._id 
        }).sort({ timestamp: -1 }).limit(10);

        res.render('student-dashboard', {
            user,
            notifications,
            attendanceRecords
        });
    } catch (error) {
        console.error('Error in student dashboard:', error);
        res.redirect('/login');
    }
});

app.get('/teacher-dashboard', auth, isTeacher, async (req, res) => {
    try {
        const teacher = await Register.findById(req.user._id);
        if (!teacher) {
            return res.redirect('/login');
        }

        // Get students for the teacher's department, year, and division
        const students = await Register.find({
            role: 'Student',
            department: teacher.department,
            year: teacher.year,
            division: teacher.division,
            status: 'Active'
        }).sort('name');

        res.render('teacher-dashboard', {
            teacher,
            students
        });
    } catch (error) {
        console.error('Error in teacher dashboard:', error);
        res.redirect('/login');
    }
});

app.get('/admin-dashboard', auth, isAdmin, async (req, res) => {
    try {
        const admin = await Register.findById(req.user._id);
        if (!admin) {
            return res.redirect('/login');
        }

        // Get all active students
        const students = await Register.find({
            role: 'Student',
            status: 'Active'
        }).sort('name');

        res.render('admin-dashboard', {
            admin,
            students
        });
    } catch (error) {
        console.error('Error in admin dashboard:', error);
        res.redirect('/login');
    }
});

// POST: Registration
app.post('/register', async (req, res) => {
    try {
        const { role, name, department, year, division, sapid, subject } = req.body;
        console.log('Registration request body:', req.body); // Debug log
        const standardizedRole = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();

        if (standardizedRole === 'Teacher') {
            if (!name || !department || !year || !division || !subject) {
                throw new Error('Please fill in all required fields');
            }
            const teacherUser = new Register({
                role: standardizedRole,
                name,
                department,
                year,
                division,
                subject,
                status: 'Active'
            });
            console.log('Teacher registration object:', teacherUser); // Debug log
            await teacherUser.save();
            console.log('Teacher registered successfully:', teacherUser); // Debug log
        } else if (standardizedRole === 'Student') {
            if (!name || !sapid || !department || !year || !division) {
                throw new Error('Please fill in all required fields');
            }
            if (!/^[0-9]{11}$/.test(sapid)) {
                throw new Error('SAP ID must be exactly 11 digits');
            }
            const existingStudent = await Register.findOne({ sapid });
            if (existingStudent) {
                throw new Error('SAP ID already exists');
            }
            const studentUser = new Register({
                role: standardizedRole,
                name,
                sapid,
                department,
                year,
                division,
                status: 'Active'
            });
            await studentUser.save();
        } else if (standardizedRole === 'Admin') {
            if (!name) {
                throw new Error('Please fill in all required fields');
            }
            const adminUser = new Register({
                role: standardizedRole,
                name,
                status: 'Active'
            });
            await adminUser.save();
        }
        req.session.message = 'Registration successful';
        res.redirect('/login');
    } catch (error) {
        console.error('Registration error:', error);
        res.render('register', { 
            error: error.message,
            formData: req.body
        });
    }
});

// POST: Login
app.post('/login', async (req, res) => {
    try {
        const { role, identifier } = req.body;
        if (!role || !identifier) {
            return res.render('login', {
                error: 'Please provide both role and identifier',
                formData: { role, identifier }
            });
        }
        let query = { role: { $regex: new RegExp(`^${role}$`, 'i') } };
        if (role.toLowerCase() === 'student') {
            query.sapid = identifier;
        } else {
            // Case-insensitive, trimmed name match for teacher/admin
            query.name = { $regex: new RegExp(`^${identifier.trim()}$`, 'i') };
        }
        console.log('Login query:', query); // Debug log
        const user = await Register.findOne(query);
        if (!user) {
            return res.render('login', {
                error: role === 'Student' ? 'Invalid SAP ID' : 'No teacher/admin found with that name. Please check your spelling or register first.',
                formData: { role, identifier }
            });
        }
        if (user.status !== 'Active') {
            return res.render('login', {
                error: 'Your account is not active. Please contact the administrator.',
                formData: { role, identifier }
            });
        }
        req.session.userId = user._id;
        req.session.userRole = user.role;
        req.session.department = user.department;
        req.session.year = user.year;
        req.session.division = user.division;
        req.session.subject = user.subject;
        switch (role.toLowerCase()) {
            case 'admin':
                return res.redirect('/admin-dashboard');
            case 'teacher':
                return res.redirect('/teacher-dashboard');
            case 'student':
                return res.redirect('/student-dashboard');
            default:
                return res.redirect('/');
        }
    } catch (error) {
        console.error('Login error:', error);
        res.render('login', {
            error: 'An error occurred during login',
            formData: req.body
        });
    }
});

// Fallback for unknown routes
app.use((req, res) => {
    res.status(404).render('404', { url: req.originalUrl });
});

// Start server
app.listen(port, () => {
    console.log(`Server is running at port ${port}`);
});

module.exports = app; 