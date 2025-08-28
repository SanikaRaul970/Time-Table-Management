const mongoose = require('mongoose');

const teachingAssignmentSchema = new mongoose.Schema({
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Register',
        required: true
    },
    teacherName: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    department: {
        type: String,
        required: true,
        enum: ['EXTC', 'COMP', 'IT', 'MECH']
    },
    year: {
        type: String,
        required: true,
        enum: ['FE', 'SE', 'TE', 'BE']
    },
    division: {
        type: String,
        required: true,
        enum: ['BE-1', 'BE-2', 'BE-3']
    },
    totalLectures: {
        type: Number,
        required: true,
        default: 0
    }
}, {
    timestamps: true
});

// Create compound index for unique teaching assignments
teachingAssignmentSchema.index(
    { teacher: 1, subject: 1, department: 1, year: 1, division: 1 },
    { unique: true }
);

const TeachingAssignment = mongoose.model('TeachingAssignment', teachingAssignmentSchema);

module.exports = TeachingAssignment; 