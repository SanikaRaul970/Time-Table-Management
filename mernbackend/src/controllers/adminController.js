const Attendance = require('../models/Attendance');
const Register = require('../models/Register');

// Get attendance overview for all departments
exports.getAttendanceOverview = async (req, res) => {
    try {
        const { semester } = req.query;
        const departments = await Register.distinct('department', { role: 'Student' });

        const departmentStats = await Promise.all(departments.map(async (department) => {
            const students = await Register.countDocuments({ 
                role: 'Student', 
                department,
                status: 'Active'
            });

            const attendance = await Attendance.find({
                department,
                semester
            });

            const totalRecords = attendance.length;
            const presentRecords = attendance.filter(record => record.status === 'Present').length;

            return {
                department,
                totalStudents: students,
                totalAttendance: totalRecords,
                presentCount: presentRecords,
                attendancePercentage: (presentRecords / totalRecords) * 100 || 0
            };
        }));

        res.status(200).json({
            departments: departmentStats,
            semester
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get attendance for a specific department
exports.getDepartmentAttendance = async (req, res) => {
    try {
        const { department } = req.params;
        const { semester } = req.query;

        const students = await Register.find({
            role: 'Student',
            department,
            status: 'Active'
        });

        const attendance = await Attendance.find({
            department,
            semester
        });

        const studentStats = students.map(student => {
            const studentRecords = attendance.filter(record => 
                record.studentId.toString() === student._id.toString()
            );

            const totalRecords = studentRecords.length;
            const presentRecords = studentRecords.filter(r => r.status === 'Present').length;

            return {
                studentId: student._id,
                name: student.name,
                sapid: student.sapid,
                totalAttendance: totalRecords,
                presentCount: presentRecords,
                attendancePercentage: (presentRecords / totalRecords) * 100 || 0
            };
        });

        res.status(200).json({
            department,
            students: studentStats
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get detailed attendance for a specific student
exports.getStudentAttendanceAdmin = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { semester } = req.query;

        const student = await Register.findById(studentId);
        const attendance = await Attendance.find({
            studentId,
            semester
        }).populate('teacherId', 'name');

        const records = attendance.map(record => ({
            date: record.date,
            subject: record.subject,
            status: record.status,
            teacherName: record.teacherId.name
        }));

        const totalRecords = records.length;
        const presentRecords = records.filter(r => r.status === 'Present').length;
        const requiredFor75 = Math.ceil(totalRecords * 0.75);
        const remainingRequired = Math.max(0, requiredFor75 - presentRecords);

        res.status(200).json({
            student: {
                name: student.name,
                sapid: student.sapid,
                department: student.department,
                year: student.year,
                division: student.division
            },
            attendance: records,
            statistics: {
                totalLectures: totalRecords,
                presentCount: presentRecords,
                attendancePercentage: (presentRecords / totalRecords) * 100 || 0,
                requiredFor75,
                remainingRequired
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}; 