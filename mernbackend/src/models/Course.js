const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
    courseCode: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    courseName: {
        type: String,
        required: true,
        trim: true
    },
    department: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    credits: {
        type: Number,
        required: true
    },
    semester: {
        type: Number,
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    students: [{
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        enrollmentDate: {
            type: Date,
            default: Date.now
        }
    }],
    schedule: [{
        day: {
            type: String,
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        },
        startTime: String,
        endTime: String,
        room: String
    }],
    assignments: [{
        title: String,
        description: String,
        dueDate: Date,
        totalMarks: Number,
        submissions: [{
            student: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            submissionDate: Date,
            marks: Number,
            feedback: String,
            status: {
                type: String,
                enum: ['Pending', 'Submitted', 'Graded'],
                default: 'Pending'
            }
        }]
    }],
    attendance: [{
        date: Date,
        present: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        absent: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }]
    }],
    status: {
        type: String,
        enum: ['Active', 'Inactive', 'Completed'],
        default: 'Active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Pre-save middleware to update the updatedAt field
courseSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

const Course = mongoose.model("Course", courseSchema);
module.exports = Course; 