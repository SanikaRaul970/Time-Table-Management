const Register = require('../models/Register');
const Attendance = require('../models/Attendance');
const TeachingAssignment = require('../models/TeachingAssignment');

// Get students for a specific teacher's class
exports.getStudentsForTeacher = async (req, res) => {
    try {
        const { department, year, division } = req.query;
        
        // Get students
        const students = await Register.find({
            role: 'Student',
            department,
            year,
            division,
            status: 'Active'
        }).select('name sapid');

        res.status(200).json({
            students: students.map(student => ({
                id: student._id,
                name: student.name,
                sapid: student.sapid
            }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Mark attendance for multiple students
exports.markAttendance = async (req, res) => {
    try {
        const { subject, date, department, year, division, attendanceRecords } = req.body;
        const teacherId = req.user._id;

        // Validate teacher's subject
        const teacher = await Register.findById(teacherId);
        if (!teacher || teacher.subject !== subject) {
            return res.status(403).json({ error: 'You are not authorized to mark attendance for this subject' });
        }

        const attendancePromises = attendanceRecords.map(async (record) => {
            const attendance = new Attendance({
                studentId: record.studentId,
                teacherId,
                subject,
                date,
                status: record.status,
                department,
                year,
                division
            });
            return attendance.save();
        });

        await Promise.all(attendancePromises);
        res.status(201).json({ message: 'Attendance marked successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get attendance for a student
exports.getStudentAttendance = async (req, res) => {
    try {
        const studentId = req.user._id;
        const { subject, month, year } = req.query;

        let startDate, endDate;
        if (month && year) {
            startDate = new Date(year, month - 1, 1);
            endDate = new Date(year, month, 0);
        }

        const query = { studentId };
        if (subject) query.subject = subject;
        if (startDate && endDate) {
            query.date = {
                $gte: startDate,
                $lte: endDate
            };
        }

        const attendance = await Attendance.find(query)
            .populate('teacherId', 'name')
            .sort({ date: -1 });

        const totalRecords = attendance.length;
        const presentRecords = attendance.filter(record => record.status === 'Present').length;

        res.status(200).json({
            attendance: attendance.map(record => ({
                date: record.date,
                subject: record.subject,
                status: record.status,
                teacherName: record.teacherId ? record.teacherId.name : 'N/A'
            })),
            statistics: {
                totalLectures: totalRecords,
                presentCount: presentRecords,
                attendancePercentage: (presentRecords / totalRecords) * 100 || 0,
                requiredFor75: Math.ceil(totalRecords * 0.75),
                remainingRequired: Math.max(0, Math.ceil(totalRecords * 0.75) - presentRecords)
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get attendance for a class (for teachers)
exports.getClassAttendance = async (req, res) => {
    try {
        const teacherId = req.user._id;
        const { subject, department, year, division, date } = req.query;

        const query = { teacherId };
        if (subject) query.subject = subject;
        if (department) query.department = department;
        if (year) query.year = year;
        if (division) query.division = division;
        if (date) query.date = new Date(date);

        const attendance = await Attendance.find(query)
            .populate('studentId', 'name sapid')
            .sort({ date: -1 });

        res.json(attendance);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get attendance overview for teacher
exports.getTeacherAttendanceOverview = async (req, res) => {
    try {
        const teacherId = req.user._id;
        const { month, year } = req.query;

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const attendance = await Attendance.find({
            teacherId,
            date: { $gte: startDate, $lte: endDate }
        }).populate('studentId', 'name sapid');

        res.status(200).json({
            attendance: attendance.map(record => ({
                date: record.date,
                subject: record.subject,
                department: record.department,
                year: record.year,
                division: record.division,
                studentName: record.studentId.name,
                sapid: record.studentId.sapid,
                status: record.status
            }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get overall attendance overview for admin
exports.getAdminAttendanceOverview = async (req, res) => {
    try {
        const { month, year } = req.query;
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const departments = await Register.distinct('department', { role: 'Student' });

        const departmentStats = await Promise.all(departments.map(async (department) => {
            const students = await Register.countDocuments({ 
                role: 'Student', 
                department,
                status: 'Active'
            });

            const attendance = await Attendance.find({
                department,
                date: { $gte: startDate, $lte: endDate }
            });

            const totalRecords = attendance.reduce((sum, record) => sum + record.records.length, 0);
            const presentRecords = attendance.reduce((sum, record) => 
                sum + record.records.filter(r => r.status === 'present').length, 0
            );

            return {
                department,
                totalStudents: students,
                totalAttendance: totalRecords,
                presentCount: presentRecords,
                attendancePercentage: (presentRecords / totalRecords) * 100 || 0
            };
        }));

        res.status(200).json({
            departments: departmentStats
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get attendance statistics for a specific department
exports.getDepartmentAttendance = async (req, res) => {
    try {
        const { department } = req.params;
        const { month, year } = req.query;
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const students = await Register.find({
            role: 'Student',
            department,
            status: 'Active'
        });

        const attendance = await Attendance.find({
            department,
            date: { $gte: startDate, $lte: endDate }
        });

        const studentStats = students.map(student => {
            const studentRecords = attendance.flatMap(record => 
                record.records.filter(r => r.student.toString() === student._id.toString())
            );

            const totalRecords = studentRecords.length;
            const presentRecords = studentRecords.filter(r => r.status === 'present').length;

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

// Get detailed attendance for a specific student (admin view)
exports.getStudentAttendanceAdmin = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { month, year } = req.query;
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const student = await Register.findById(studentId);
        const attendance = await Attendance.find({
            'records.student': studentId,
            date: { $gte: startDate, $lte: endDate }
        }).populate('teacher', 'name');

        const records = attendance.map(record => ({
            date: record.date,
            subject: record.subject,
            status: record.records.find(r => r.student.toString() === studentId).status,
            teacherName: record.teacher.name
        }));

        const totalRecords = records.length;
        const presentRecords = records.filter(r => r.status === 'present').length;

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
                attendancePercentage: (presentRecords / totalRecords) * 100 || 0
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

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