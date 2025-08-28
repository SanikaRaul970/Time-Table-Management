const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const bodyParser = require("body-parser");
const hbs = require("hbs");
const session = require("express-session");
const bcrypt = require("bcryptjs");

// Import models
const User = require('./models/User');
const Attendance = require('./models/Attendance');
const Timetable = require('./models/Timetable');
const Marks = require('./models/Marks');
const ImportantDate = require('./models/ImportantDate');
const Subject = require('./models/Subject');

// Create Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

// Authentication middleware
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        req.user = req.session.user;
        next();
    } else {
        res.redirect('/login');
    }
};

// MongoDB Connection
mongoose.connect("mongodb://127.0.0.1:27017/studentPortal", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("MongoDB connected successfully");
}).catch((error) => {
    console.log("MongoDB connection error:", error);
});

// Define paths
const static_path = path.join(__dirname, 'public');
const template_path = path.join(__dirname, 'templates/views');
const partials_path = path.join(__dirname, 'templates/partials');

// Setup static directory to serve
app.use(express.static(static_path));

// Setup handlebars engine and views location
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'templates/views'));
app.set('view options', { layout: 'layouts/main' });
hbs.registerPartials(partials_path);

// Routes
app.get('/', (req, res) => {
    res.redirect('/login');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', async (req, res) => {
    try {
        const { role, identifier } = req.body;
        // Trim whitespace from identifier
        const trimmedIdentifier = identifier.trim();
        console.log('Login attempt:', { role, identifier: trimmedIdentifier });

        if (!role || !trimmedIdentifier) {
            console.log('Missing login credentials');
            return res.render('login', { error: 'Please provide both role and username/SAP ID' });
        }

        let user;
        if (role === 'Student') {
            user = await User.findOne({ role: 'Student', sapid: trimmedIdentifier });
        } else {
            user = await User.findOne({ role: role, username: trimmedIdentifier });
        }

        console.log('Found user:', user);

        if (!user) {
            console.log('No user found with these credentials');
            return res.render('login', { error: 'Invalid credentials' });
        }

        // Create session
        req.session.user = {
            id: user._id,
            username: user.username,
            role: user.role,
            name: user.name,
            department: user.department,
            sapid: user.sapid,
            year: user.year,
            division: user.division
        };
        console.log('Session created:', req.session.user);

        // Redirect based on role
        switch (role) {
            case 'Admin':
                console.log('Redirecting to admin dashboard');
                return res.redirect('/admin-dashboard');
            case 'Teacher':
                console.log('Redirecting to teacher dashboard');
                return res.redirect('/teacher-dashboard');
            case 'Student':
                console.log('Redirecting to student dashboard');
                return res.redirect('/student-dashboard');
            default:
                console.log('Invalid role, redirecting to login');
                return res.redirect('/login');
        }
    } catch (error) {
        console.error('Login error:', error);
        res.render('login', { error: 'An error occurred during login' });
    }
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', async (req, res) => {
    try {
        console.log('Registration attempt:', req.body);
        const { role, username, name, department, year, division, sapid, subject } = req.body;
        
        // Trim whitespace from username if present
        const trimmedUsername = username ? username.trim() : undefined;
        
        // Validate required fields based on role
        if (!role || !name || !department || ((role !== 'Student') && !trimmedUsername)) {
            console.log('Missing required fields:', { role, username: trimmedUsername, name, department });
            return res.render('register', { 
                error: 'Please fill in all required fields',
                values: req.body
            });
        }

        // Role-specific validation
        if (role === 'Student') {
            if (!sapid || sapid.length !== 11) {
                console.log('Invalid SAP ID for student:', sapid);
                return res.render('register', {
                    error: 'SAP ID is required for students and must be 11 digits',
                    values: req.body
                });
            }
            if (!year || !division) {
                console.log('Missing year or division for student');
                return res.render('register', {
                    error: 'Year and Division are required for students',
                    values: req.body
                });
            }
        } else if (role === 'Teacher') {
            if (!year || !division || !subject) {
                console.log('Missing year, division, or subject for teacher');
                return res.render('register', {
                    error: 'Year, Division, and Subject are required for teachers',
                    values: req.body
                });
            }
        }

        // Check if username already exists (only for non-students)
        if (role !== 'Student' && trimmedUsername) {
            const existingUser = await User.findOne({ username: trimmedUsername });
            if (existingUser) {
                console.log('Username already exists:', trimmedUsername);
                return res.render('register', { 
                    error: 'Username already exists. Please choose a different username.',
                    values: req.body
                });
            }
        }

        // Create new user
        let userData = {
            role,
            name,
            department,
            status: 'Active'
        };
        if (role === 'Student') {
            userData = { ...userData, year, division, sapid };
        } else if (role === 'Teacher') {
            userData = { ...userData, year, division, subject, username: trimmedUsername };
        } else if (role === 'Admin') {
            userData = { ...userData, username: trimmedUsername };
        }

        const user = new User(userData);
        await user.save();
        console.log('New user registered successfully:', user);

        // Redirect to login page with success message
        res.render('login', { success: 'Registration successful! Please login.' });
    } catch (error) {
        console.error('Registration error:', error);
        res.render('register', { 
            error: error.message || 'Registration failed. Please try again.',
            values: req.body
        });
    }
});

// Dashboard routes
app.get('/admin-dashboard', async (req, res) => {
    console.log('Admin dashboard access attempt:', req.session.user);
    if (!req.session.user || req.session.user.role !== 'Admin') {
        console.log('Unauthorized admin dashboard access');
        return res.redirect('/login');
    }

    try {
        // Get all users
        const users = await User.find({});
        res.render('admin-dashboard', { 
            user: req.session.user,
            users
        });
    } catch (error) {
        console.error('Error loading admin dashboard:', error);
        res.render('admin-dashboard', { 
            user: req.session.user,
            error: 'Error loading users'
        });
    }
});

app.get('/teacher-dashboard', async (req, res) => {
    console.log('Attempting to access teacher dashboard');
    console.log('Session user:', req.session.user);
    if (!req.session.user || req.session.user.role !== 'Teacher') {
        console.log('Unauthorized access to teacher dashboard');
        return res.redirect('/login');
    }
    try {
        // Fetch important dates for teacher's department, year, division
        const importantDates = await ImportantDate.find({
            department: req.session.user.department,
            year: req.session.user.year,
            division: req.session.user.division
        }).sort({ date: 1 });

        // Fetch students with same department, year, division
        const students = await User.find({
            role: 'Student',
            department: req.session.user.department,
            year: req.session.user.year,
            division: req.session.user.division
        });

        res.render('teacher-dashboard', {
            title: 'Teacher Dashboard',
            user: req.session.user,
            importantDates,
            students
        });
    } catch (error) {
        console.error('Error loading teacher dashboard:', error);
        res.render('teacher-dashboard', {
            title: 'Teacher Dashboard',
            user: req.session.user,
            error: 'Error loading dashboard data',
            importantDates: [],
            students: []
        });
    }
});

app.get('/student-dashboard', (req, res) => {
    console.log('Attempting to access student dashboard');
    console.log('Session user:', req.session.user);
    
    if (!req.session.user || req.session.user.role !== 'Student') {
        console.log('Unauthorized access to student dashboard');
        return res.redirect('/login');
    }
    console.log('Rendering student dashboard');
    res.render('student-dashboard', { 
        title: 'Student Dashboard',
        user: req.session.user 
    });
});

// Create test users
app.get('/create-test-users', async (req, res) => {
    try {
        const testUsers = [
            {
                username: 'admin',
                role: 'Admin',
                department: 'Admin',
                status: 'Active'
            },
            {
                username: 'teacher1',
                role: 'Teacher',
                department: 'COMP',
                status: 'Active'
            },
            {
                username: 'student1',
                role: 'Student',
                sapID: '12345678901',
                department: 'COMP',
                status: 'Active'
            }
        ];

        for (const userData of testUsers) {
            const existingUser = await User.findOne({ username: userData.username });
            if (!existingUser) {
                const user = new User(userData);
                await user.save();
                console.log(`Created test user: ${userData.username}`);
            }
        }

        res.json({ message: 'Test users created or already exist' });
    } catch (error) {
        console.error('Error creating test users:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add new user
app.post('/admin/add-user', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'Admin') {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    try {
        const { role, username, name, department, year, division, sapid, subject } = req.body;
        const trimmedUsername = username.trim();

        // Validate required fields
        if (!role || !trimmedUsername || !name || !department) {
            return res.status(400).json({ error: 'Please fill in all required fields' });
        }

        // Role-specific validation
        if (role === 'Student' && (!sapid || sapid.length !== 11)) {
            return res.status(400).json({ error: 'SAP ID is required for students and must be 11 digits' });
        }

        if (role === 'Teacher' && !subject) {
            return res.status(400).json({ error: 'Subject is required for teachers' });
        }

        // Check if username exists
        const existingUser = await User.findOne({ username: trimmedUsername });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Create new user
        const user = new User({
            username: trimmedUsername,
            role,
            name,
            department,
            year,
            division,
            sapid,
            subject,
            status: 'Active'
        });

        await user.save();
        res.json({ success: true, user });
    } catch (error) {
        console.error('Error adding user:', error);
        res.status(500).json({ error: 'Error adding user' });
    }
});

// Delete user
app.post('/admin/delete-user/:id', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'Admin') {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Error deleting user' });
    }
});

// Get attendance data
app.get('/admin/attendance', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'Admin') {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    try {
        const { year, department, division, date, month } = req.query;
        const query = {};
        
        if (date) query.date = new Date(date);
        if (department) query.department = department;
        if (year) query.year = year;
        if (division) query.division = division;
        if (month) {
            // Filter by month (Jan, Feb, Mar)
            const yearNow = new Date().getFullYear();
            const start = new Date(yearNow, month - 1, 1);
            const end = new Date(yearNow, month, 0, 23, 59, 59, 999);
            query.date = { $gte: start, $lte: end };
        }

        const attendance = await Attendance.find(query)
            .populate('user', 'name role department year division sapid')
            .sort({ date: -1, time: -1 });

        res.json(attendance);
    } catch (error) {
        console.error('Error fetching attendance:', error);
        res.status(500).json({ error: 'Error fetching attendance data' });
    }
});

// Generate reports
app.get('/admin/reports', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'Admin') {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    try {
        const { type, year, department, division, startDate, endDate } = req.query;
        let report;

        if (type === 'attendance') {
            report = await generateAttendanceReport(year, department, division, startDate, endDate);
        } else if (type === 'users') {
            report = await generateUserReport(year, department, division);
        }

        res.json(report);
    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ error: 'Error generating report' });
    }
});

// Helper function to generate attendance report
async function generateAttendanceReport(year, department, division, startDate, endDate) {
    const query = {};
    
    if (year) query.year = year;
    if (department) query.department = department;
    if (division) query.division = division;
    if (startDate) query.date = { $gte: new Date(startDate) };
    if (endDate) query.date = { ...query.date, $lte: new Date(endDate) };

    const attendance = await Attendance.find(query)
        .populate('user', 'name role department year division sapid')
        .sort({ date: -1, time: -1 });

    return {
        type: 'attendance',
        totalRecords: attendance.length,
        data: attendance
    };
}

// Helper function to generate user report
async function generateUserReport(year, department, division) {
    const query = {};
    
    if (year) query.year = year;
    if (department) query.department = department;
    if (division) query.division = division;

    const users = await User.find(query);
    const stats = {
        total: users.length,
        byRole: {},
        byDepartment: {},
        byYear: {},
        byDivision: {},
        active: 0,
        inactive: 0
    };

    users.forEach(user => {
        // Count by role
        stats.byRole[user.role] = (stats.byRole[user.role] || 0) + 1;
        
        // Count by department
        if (user.department) {
            stats.byDepartment[user.department] = (stats.byDepartment[user.department] || 0) + 1;
        }
        
        // Count by year
        if (user.year) {
            stats.byYear[user.year] = (stats.byYear[user.year] || 0) + 1;
        }
        
        // Count by division
        if (user.division) {
            stats.byDivision[user.division] = (stats.byDivision[user.division] || 0) + 1;
        }
        
        // Count active/inactive
        if (user.status === 'Active') {
            stats.active++;
        } else {
            stats.inactive++;
        }
    });

    return {
        type: 'users',
        stats
    };
}

// Filter users route
app.get('/admin/filter-users', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'Admin') {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    try {
        const { role, department, year, division, search } = req.query;
        console.log('Filter request received:', { role, department, year, division, search }); // Debug log
        // Mapping for frontend display values to DB values
        const yearMap = {
            "First Year": "FE",
            "Second Year": "SE",
            "Third Year": "TE",
            "Final Year": "BE",
            "Fourth Year": "BE"
        };
        const departmentMap = {
            "Computer Engineering": "COMP",
            "Information Technology": "IT",
            "Electronics & Telecommunication": "EXTC",
            "Mechanical Engineering": "MECH"
        };
        const filter = {};
        if (role) filter.role = role;
        // Only apply department, year, division if role is not Admin
        if (role !== 'Admin') {
            if (department) filter.department = departmentMap[department] || department;
            if (year) filter.year = yearMap[year] || year;
            if (division) filter.division = division;
        }
        console.log('MongoDB filter object:', filter); // Debug log

        let users = await User.find(filter);

        // Apply search filter if provided
        if (search) {
            const searchLower = search.toLowerCase();
            users = users.filter(user => 
                user.name.toLowerCase().includes(searchLower) ||
                user.username.toLowerCase().includes(searchLower) ||
                (user.sapid && user.sapid.includes(searchLower)) ||
                (user.subject && user.subject.toLowerCase().includes(searchLower))
            );
        }

        res.json(users);
    } catch (error) {
        console.error('Error filtering users:', error);
        res.status(500).json({ error: 'Error filtering users' });
    }
});

// Student Dashboard Routes
app.get('/student-dashboard', isAuthenticated, (req, res) => {
    if (req.user.role !== 'student') {
        return res.redirect('/dashboard');
    }
    res.render('student-dashboard', { user: req.user });
});

// Get student timetable
app.get('/student/timetable', isAuthenticated, async (req, res) => {
    if (req.user.role !== 'student') {
        return res.status(403).json({ error: 'Access denied' });
    }

    try {
        const { day } = req.query;
        const timetable = await Timetable.find({
            department: req.user.department,
            year: req.user.year,
            division: req.user.division,
            day: day
        }).populate('teacher', 'name');

        res.json(timetable.map(entry => ({
            time: entry.time,
            subject: entry.subject,
            teacher: entry.teacher.name,
            room: entry.room
        })));
    } catch (error) {
        console.error('Error fetching timetable:', error);
        res.status(500).json({ error: 'Failed to fetch timetable' });
    }
});

// Get student attendance
app.get('/student/attendance', isAuthenticated, async (req, res) => {
    if (req.user.role !== 'student') {
        return res.status(403).json({ error: 'Access denied' });
    }

    try {
        const { month } = req.query;
        const startDate = new Date(new Date().getFullYear(), month - 1, 1);
        const endDate = new Date(new Date().getFullYear(), month, 0);

        const attendance = await Attendance.find({
            student: req.user._id,
            date: { $gte: startDate, $lte: endDate }
        }).populate('subject', 'name');

        res.json(attendance.map(record => ({
            date: record.date,
            subject: record.subject.name,
            status: record.status,
            division: record.division
        })));
    } catch (error) {
        console.error('Error fetching attendance:', error);
        res.status(500).json({ error: 'Failed to fetch attendance' });
    }
});

// Get student marks
app.get('/student/marks', isAuthenticated, async (req, res) => {
    if (req.user.role !== 'student') {
        return res.status(403).json({ error: 'Access denied' });
    }

    try {
        const { semester } = req.query;
        const marks = await Marks.find({
            student: req.user._id,
            semester: semester
        }).populate('subject', 'name');

        res.json(marks.map(mark => ({
            subject: mark.subject.name,
            internal: mark.internal,
            external: mark.external,
            total: mark.total,
            grade: mark.grade
        })));
    } catch (error) {
        console.error('Error fetching marks:', error);
        res.status(500).json({ error: 'Failed to fetch marks' });
    }
});

// Get important dates
app.get('/student/dates', isAuthenticated, async (req, res) => {
    if (req.user.role !== 'student') {
        return res.status(403).json({ error: 'Access denied' });
    }

    try {
        const { category } = req.query;
        const query = {
            department: req.user.department,
            year: req.user.year,
            division: req.user.division
        };

        if (category) {
            query.category = category;
        }

        const dates = await ImportantDate.find(query).sort('date');

        res.json(dates.map(date => ({
            date: date.date,
            event: date.event,
            category: date.category,
            description: date.description
        })));
    } catch (error) {
        console.error('Error fetching important dates:', error);
        res.status(500).json({ error: 'Failed to fetch important dates' });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.redirect('/student-dashboard');
        }
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
});

// Teacher routes for attendance and marks
app.get('/teacher/dashboard', isAuthenticated, async (req, res) => {
    if (req.user.role !== 'teacher') {
        return res.redirect('/');
    }
    try {
        const students = await User.find({ 
            branch: 'EXTC', 
            year: 'Fourth Year' 
        });
        res.render('teacherDashboard', { students });
    } catch (error) {
        res.status(500).send('Error fetching students');
    }
});

// Add attendance for a student
app.post('/teacher/attendance', isAuthenticated, async (req, res) => {
    if (req.user.role !== 'teacher' && req.user.role !== 'Teacher') {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    try {
        const { studentIds, statuses, date } = req.body;
        const branch = req.user.department;
        const yearVal = req.user.year;
        const divisionVal = req.user.division;
        const subjectVal = req.user.subject;
        const dateVal = date ? new Date(date) : new Date();
        const monthVal = dateVal.toLocaleString('default', { month: 'long' });

        // Ensure arrays
        const ids = Array.isArray(studentIds) ? studentIds : [studentIds];
        const stats = Array.isArray(statuses) ? statuses : [statuses];

        for (let i = 0; i < ids.length; i++) {
            const studentId = ids[i];
            const status = stats[i];
            let attendance = await Attendance.findOne({
                student: studentId,
                subject: subjectVal,
                month: monthVal,
                year: yearVal,
                branch: branch,
                division: divisionVal
            });
            if (!attendance) {
                attendance = new Attendance({
                    student: studentId,
                    subject: subjectVal,
                    month: monthVal,
                    year: yearVal,
                    branch: branch,
                    division: divisionVal,
                    attendance: [],
                    totalClasses: 0,
                    presentClasses: 0,
                    percentage: 0
                });
            }
            attendance.attendance.push({ date: dateVal, status });
            attendance.totalClasses += 1;
            if (status === 'Present') {
                attendance.presentClasses += 1;
            }
            attendance.percentage = (attendance.presentClasses / attendance.totalClasses) * 100;
            await attendance.save();
        }
        res.redirect('/teacher-dashboard');
    } catch (error) {
        res.status(500).json({ error: 'Error saving attendance' });
    }
});

// Add marks for a student
app.post('/teacher/marks', isAuthenticated, async (req, res) => {
    if (req.user.role !== 'teacher') {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    try {
        const { studentId, subject, termTest1, termTest2, endSem, division } = req.body;
        
        let marks = await Marks.findOne({
            student: studentId,
            subject,
            year: 'Fourth Year',
            branch: 'EXTC',
            division
        });

        if (!marks) {
            marks = new Marks({
                student: studentId,
                subject,
                year: 'Fourth Year',
                branch: 'EXTC',
                division
            });
        }

        marks.termTest1 = termTest1;
        marks.termTest2 = termTest2;
        marks.endSem = endSem;
        marks.total = termTest1 + termTest2 + endSem;
        
        // Calculate grade based on total marks
        if (marks.total >= 90) marks.grade = 'O';
        else if (marks.total >= 80) marks.grade = 'A+';
        else if (marks.total >= 70) marks.grade = 'A';
        else if (marks.total >= 60) marks.grade = 'B+';
        else if (marks.total >= 50) marks.grade = 'B';
        else if (marks.total >= 40) marks.grade = 'C';
        else marks.grade = 'F';

        await marks.save();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error saving marks' });
    }
});

// Admin route to view student profile
app.get('/admin/student/:id', isAuthenticated, async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    const role = req.session.user.role ? req.session.user.role.toLowerCase() : '';
    if (role !== 'admin' && role !== 'teacher') {
        return res.redirect('/login');
    }
    try {
        const student = await User.findById(req.params.id);
        // Only allow teacher if student is in their subject/class
        if (role === 'teacher') {
            if (
                student.department !== req.session.user.department ||
                student.year !== req.session.user.year ||
                student.division !== req.session.user.division ||
                student.subject !== req.session.user.subject
            ) {
                return res.status(403).send('Unauthorized');
            }
        }
        // Attendance for Jan-Mar only
        const jan = new Date(new Date().getFullYear(), 0, 1);
        const mar = new Date(new Date().getFullYear(), 2, 31, 23, 59, 59, 999);
        const attendance = await Attendance.find({
            studentId: req.params.id,
            date: { $gte: jan, $lte: mar }
        });
        // Group attendance by subject
        const attendanceBySubject = {};
        attendance.forEach(a => {
            if (!attendanceBySubject[a.subject]) attendanceBySubject[a.subject] = [];
            attendanceBySubject[a.subject].push(a);
        });
        // Fetch all marks for the student
        const marks = await Marks.find({ student: req.params.id });
        res.render('studentProfile', { student, attendanceBySubject, marks });
    } catch (error) {
        res.status(500).send('Error fetching student data');
    }
});

// --- DEBUG: Seed test users endpoint ---
app.get('/admin/seed-test-users', async (req, res) => {
    try {
        const testUsers = [
            { name: 'Alice', username: 'alice', role: 'Student', department: 'EXTC', year: 'BE', division: 'BE-2', sapid: '12345678901', status: 'Active' },
            { name: 'Bob', username: 'bob', role: 'Student', department: 'COMP', year: 'SE', division: 'SE-1', sapid: '12345678902', status: 'Active' },
            { name: 'Charlie', username: 'charlie', role: 'Teacher', department: 'EXTC', subject: 'Wireless Networks', status: 'Active' },
            { name: 'Diana', username: 'diana', role: 'Admin', department: 'IT', status: 'Active' }
        ];
        for (const user of testUsers) {
            await User.updateOne({ username: user.username }, user, { upsert: true });
        }
        res.json({ message: 'Test users seeded.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to seed test users.' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

app.post('/teacher/mark-attendance', isAuthenticated, async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'Teacher') {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    try {
        const { studentId, date, status } = req.body;
        const teacher = req.session.user;
        // Only allow for Jan-Mar
        const markDate = new Date(date);
        if (markDate.getMonth() < 0 || markDate.getMonth() > 2) {
            return res.status(400).json({ error: 'Attendance can only be marked for Jan-Mar.' });
        }
        // Check if teacher is assigned to this subject/class
        const student = await User.findById(studentId);
        if (!student || student.department !== teacher.department || student.year !== teacher.year || student.division !== teacher.division) {
            return res.status(403).json({ error: 'Unauthorized: Not your class.' });
        }
        // Mark attendance
        const attendance = new Attendance({
            studentId,
            teacherId: teacher._id,
            subject: teacher.subject,
            date: markDate,
            status,
            department: teacher.department,
            year: teacher.year,
            division: teacher.division,
            markedBy: teacher._id,
            semester: 'Jan-Mar'
        });
        await attendance.save();
        res.json({ success: true, attendance });
    } catch (error) {
        res.status(500).json({ error: 'Error marking attendance.' });
    }
});

app.post('/teacher/enter-marks', isAuthenticated, async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'Teacher') {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    try {
        const { studentId, tt1, tt2 } = req.body;
        const teacher = req.session.user;
        // Check if teacher is assigned to this subject/class
        const student = await User.findById(studentId);
        if (!student || student.department !== teacher.department || student.year !== teacher.year || student.division !== teacher.division) {
            return res.status(403).json({ error: 'Unauthorized: Not your class.' });
        }
        // Find or create marks record for this student/subject
        let marks = await Marks.findOne({
            student: studentId,
            subject: teacher.subject,
            year: teacher.year,
            branch: teacher.department,
            division: teacher.division
        });
        if (!marks) {
            marks = new Marks({
                student: studentId,
                subject: teacher.subject,
                year: teacher.year,
                branch: teacher.department,
                division: teacher.division
            });
        }
        marks.termTest1 = Math.min(Number(tt1), 25);
        marks.termTest2 = Math.min(Number(tt2), 25);
        await marks.save();
        res.json({ success: true, marks });
    } catch (error) {
        res.status(500).json({ error: 'Error entering marks.' });
    }
});

// Attendance Management Routes
app.get('/mark-attendance', isAuthenticated, async (req, res) => {
    if (!['admin', 'Admin', 'teacher', 'Teacher'].includes(req.session.user.role)) {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    try {
        const students = await User.find({ 
            role: 'Student',
            department: req.session.user.department,
            year: req.session.user.year,
            division: req.session.user.division
        });
        res.render('mark-attendance', { students });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching students.' });
    }
});

app.post('/mark-attendance', isAuthenticated, async (req, res) => {
    if (!['admin', 'Admin', 'teacher', 'Teacher'].includes(req.session.user.role)) {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    try {
        const { studentId, date, status } = req.body;
        const user = req.session.user;
        const student = await User.findById(studentId);
        
        if (user.role.toLowerCase() === 'teacher') {
            if (!student || student.department !== user.department || student.year !== user.year || student.division !== user.division) {
                return res.status(403).json({ error: 'Unauthorized: Not your class.' });
            }
        }

        const attendance = new Attendance({
            studentId,
            teacherId: user._id,
            subject: user.subject || 'Admin',
            date: new Date(date),
            status,
            department: student.department,
            year: student.year,
            division: student.division,
            markedBy: user._id
        });
        await attendance.save();
        res.redirect('/attendance-dashboard');
    } catch (error) {
        res.status(500).json({ error: 'Error marking attendance.' });
    }
});

// Marks Management Routes
app.get('/enter-marks', isAuthenticated, async (req, res) => {
    if (!['admin', 'Admin', 'teacher', 'Teacher'].includes(req.session.user.role)) {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    try {
        const students = await User.find({ 
            role: 'Student',
            department: req.session.user.department,
            year: req.session.user.year,
            division: req.session.user.division
        });
        res.render('enter-marks', { students });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching students.' });
    }
});

app.post('/enter-marks', isAuthenticated, async (req, res) => {
    if (!['admin', 'Admin', 'teacher', 'Teacher'].includes(req.session.user.role)) {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    try {
        const { studentId, subject, termTest1, termTest2, endSem } = req.body;
        const user = req.session.user;
        const student = await User.findById(studentId);

        if (user.role.toLowerCase() === 'teacher') {
            if (!student || student.department !== user.department || student.year !== user.year || student.division !== user.division) {
                return res.status(403).json({ error: 'Unauthorized: Not your class.' });
            }
        }

        const marks = new Marks({
            student: studentId,
            subject,
            year: student.year,
            branch: student.department,
            division: student.division,
            termTest1: Number(termTest1),
            termTest2: Number(termTest2),
            endSem: Number(endSem),
            markedBy: user._id
        });
        await marks.save();
        res.redirect('/marks-dashboard');
    } catch (error) {
        res.status(500).json({ error: 'Error entering marks.' });
    }
});

// Student Dashboard Routes
app.get('/student-dashboard', isAuthenticated, async (req, res) => {
    if (req.session.user.role !== 'Student') {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    try {
        const attendance = await Attendance.find({ 
            studentId: req.session.user.id 
        }).sort({ date: -1 });

        const marks = await Marks.find({ 
            student: req.session.user.id 
        }).sort({ lastUpdated: -1 });

        res.render('student-dashboard', { 
            user: req.session.user,
            attendance,
            marks
        });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching student data.' });
    }
});

// Admin Dashboard Routes
app.get('/admin-dashboard', isAuthenticated, async (req, res) => {
    if (req.session.user.role !== 'Admin') {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    try {
        const teachers = await User.find({ role: 'Teacher' });
        const students = await User.find({ role: 'Student' });
        const attendance = await Attendance.find().sort({ date: -1 }).limit(50);
        const marks = await Marks.find().sort({ lastUpdated: -1 }).limit(50);

        res.render('admin-dashboard', {
            user: req.session.user,
            teachers,
            students,
            attendance,
            marks
        });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching admin dashboard data.' });
    }
});

