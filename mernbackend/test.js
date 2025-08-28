const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const app = express();
const port = 3000;

const template_path = path.join(__dirname, 'templates/views');
app.set('views', path.join(__dirname, 'templates/views'));

mongoose.connect('mongodb://127.0.0.1:27017/studentPortal', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

app.get('/', (req, res) => {
    res.send('Hello from test server');
});

app.post('/mark-attendance', isAuthenticated, async (req, res) => {
    if (!req.session.user || !['admin', 'Admin', 'teacher', 'Teacher'].includes(req.session.user.role)) {
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
        console.log("About to save attendance:", {
            student: studentId,
            subject: user.subject || 'Admin',
            date: new Date(date),
            status,
            department: student.department,
            year: student.year,
            division: student.division,
            markedBy: user._id
        });
        const attendance = new Attendance({
            student: mongoose.Types.ObjectId("68196d442d423c3616ea6ed2"),
            subject: "Wireless Networks",
            date: new Date(),
            status: "Present",
            department: "EXTC",
            year: "BE",
            division: "BE-2",
            markedBy: mongoose.Types.ObjectId("68196d442d423c3616ea6ed1")
        });
        await attendance.save();
        res.redirect('back');
    } catch (error) {
        console.error("Attendance save error:", error, error.stack);
        throw error;
    }
});

app.post('/edit-attendance', isAuthenticated, async (req, res) => {
    if (!req.session.user || !['admin', 'Admin'].includes(req.session.user.role)) {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    try {
        const { attendanceId, status } = req.body;
        await Attendance.findByIdAndUpdate(attendanceId, { status });
        res.redirect('back');
    } catch (error) {
        res.status(500).json({ error: 'Error updating attendance.' });
    }
});

app.get('/teacher/mark-attendance', isAuthenticated, async (req, res) => {
    if (req.session.user.role !== 'Teacher') return res.status(403).send('Unauthorized');
    console.log('Teacher session:', req.session.user);
    const students = await User.find({
        role: 'Student',
        department: req.session.user.department,
        year: req.session.user.year,
        division: req.session.user.division
    });
    console.log('Students found:', students.length);
    res.render('mark-attendance', { students });
});

app.post('/teacher/attendance', isAuthenticated, async (req, res) => {
    if (req.session.user.role !== 'Teacher') return res.status(403).send('Unauthorized');
    try {
        const { studentIds, statuses, date } = req.body;
        const ids = Array.isArray(studentIds) ? studentIds : [studentIds];
        const stats = Array.isArray(statuses) ? statuses : [statuses];

        for (let i = 0; i < ids.length; i++) {
            await Attendance.create({
                student: ids[i],
                subject: req.session.user.subject,
                date: new Date(date),
                status: stats[i],
                markedBy: req.session.user._id,
                department: req.session.user.department,
                year: req.session.user.year,
                division: req.session.user.division
            });
        }
        res.redirect('/teacher-dashboard');
    } catch (error) {
        console.error("Attendance save error:", error, error.stack);
        res.status(500).json({ error: 'Error saving attendance', details: error.message });
    }
});

app.get('/student/attendance', isAuthenticated, async (req, res) => {
    if (req.session.user.role !== 'Student') return res.status(403).send('Unauthorized');
    const attendance = await Attendance.find({ student: req.session.user._id }).sort({ date: -1 });
    res.render('student-attendance', { attendance });
});

app.get('/admin/attendance', isAuthenticated, async (req, res) => {
    if (req.session.user.role !== 'Admin') return res.status(403).send('Unauthorized');
    const attendance = await Attendance.find().populate('student').sort({ date: -1 });
    res.render('admin-attendance', { attendance });
});

// Show edit form
app.get('/admin/edit-attendance/:id', isAuthenticated, async (req, res) => {
    if (req.session.user.role !== 'Admin') return res.status(403).send('Unauthorized');
    const attendance = await Attendance.findById(req.params.id).populate('student');
    res.render('edit-attendance', { attendance });
});

// Handle edit
app.post('/admin/edit-attendance/:id', isAuthenticated, async (req, res) => {
    if (req.session.user.role !== 'Admin') return res.status(403).send('Unauthorized');
    const { status } = req.body;
    await Attendance.findByIdAndUpdate(req.params.id, { status });
    res.redirect('/admin/attendance');
});

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

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('usersTableBody').addEventListener('click', function(event) {
    if (event.target.closest('.delete-user')) {
        alert('Delete button clicked!');
    }
  });
});