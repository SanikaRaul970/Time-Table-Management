const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const auth = require('../middleware/auth'); // Assuming you have authentication middleware

// Teacher routes
router.get('/students', auth, attendanceController.getStudentsForTeacher);
router.post('/mark', auth, attendanceController.markAttendance);
router.get('/overview', auth, attendanceController.getTeacherAttendanceOverview);

// Student routes
router.get('/student-stats', auth, attendanceController.getStudentAttendance);

// Admin routes
router.get('/admin/overview', auth, attendanceController.getAdminAttendanceOverview);
router.get('/admin/department/:department', auth, attendanceController.getDepartmentAttendance);
router.get('/admin/student/:studentId', auth, attendanceController.getStudentAttendanceAdmin);

module.exports = router; 