const TeachingAssignment = require('../models/TeachingAssignment');
const Register = require('../models/Register');

// Assign teaching responsibilities
exports.assignTeaching = async (req, res) => {
    try {
        const { subject, department, year, division } = req.body;
        const teacherId = req.user._id;

        // Verify teacher exists and has correct role
        const teacher = await Register.findOne({
            _id: teacherId,
            role: 'Teacher'
        });

        if (!teacher) {
            return res.status(403).json({ message: 'Only teachers can be assigned classes' });
        }

        // Create or update teaching assignment
        const assignment = await TeachingAssignment.findOneAndUpdate(
            { teacher: teacherId, subject, department, year, division },
            { 
                teacher: teacherId, 
                subject, 
                department, 
                year, 
                division,
                teacherName: teacher.name // Add teacher name to assignment
            },
            { upsert: true, new: true }
        );

        res.status(201).json(assignment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get teacher's assignments
exports.getTeachingAssignments = async (req, res) => {
    try {
        const teacherId = req.user._id;

        const assignments = await TeachingAssignment.find({ teacher: teacherId })
            .populate('teacher', 'name department');

        res.status(200).json(assignments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Remove teaching assignment
exports.removeTeachingAssignment = async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const teacherId = req.user._id;

        await TeachingAssignment.findOneAndDelete({
            _id: assignmentId,
            teacher: teacherId
        });

        res.status(200).json({ message: 'Teaching assignment removed successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}; 