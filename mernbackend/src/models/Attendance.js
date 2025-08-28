const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['Present', 'Absent'],
        required: true
    },
    department: {
        type: String,
        required: true
    },
    year: {
        type: String,
        required: true
    },
    division: {
        type: String,
        required: true
    },
    markedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    semester: {
        type: String,
        required: true,
        enum: ['Jan-Mar', 'Apr-Jun', 'Jul-Sep', 'Oct-Dec']
    }
}, {
    timestamps: true
});

// Create compound index for efficient querying
attendanceSchema.index({ studentId: 1, date: 1, subject: 1 }, { unique: true });

// Static method to calculate required attendance for 75%
attendanceSchema.statics.calculateRequiredAttendance = async function(studentId, semester) {
    const totalClasses = await this.countDocuments({
        studentId,
        semester,
        status: { $in: ['Present', 'Absent'] }
    });

    const presentClasses = await this.countDocuments({
        studentId,
        semester,
        status: 'Present'
    });

    const requiredFor75 = Math.ceil(totalClasses * 0.75);
    const currentAttendance = presentClasses;
    const remainingRequired = Math.max(0, requiredFor75 - currentAttendance);

    return {
        totalClasses,
        presentClasses,
        requiredFor75,
        currentAttendance,
        remainingRequired,
        percentage: totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0
    };
};

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance; 