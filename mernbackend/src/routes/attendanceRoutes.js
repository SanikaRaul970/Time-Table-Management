const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { auth, isTeacher, isStudent } = require('../middleware/auth');

// Teacher routes
router.post('/mark', auth, isTeacher, attendanceController.markAttendance);
router.get('/class', auth, isTeacher, attendanceController.getClassAttendance);

// Student routes
router.get('/student', auth, isStudent, attendanceController.getStudentAttendance);

module.exports = router; 