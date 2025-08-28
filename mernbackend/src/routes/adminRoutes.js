const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { auth, isAdmin } = require('../middleware/auth');

// Admin attendance overview
router.get('/attendance/overview', auth, isAdmin, adminController.getAttendanceOverview);

// Department-wise attendance
router.get('/attendance/department/:department', auth, isAdmin, adminController.getDepartmentAttendance);

// Student-wise attendance
router.get('/attendance/student/:studentId', auth, isAdmin, adminController.getStudentAttendanceAdmin);

module.exports = router; 