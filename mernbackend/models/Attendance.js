const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subject: {
        type: String,
        required: true,
        enum: ['Wireless Networks', 'Lens', 'OC']
    },
    year: {
        type: String,
        required: true,
        enum: ['Fourth Year']
    },
    branch: {
        type: String,
        required: true,
        enum: ['EXTC']
    },
    division: {
        type: String,
        required: true
    },
    month: {
        type: String,
        required: true,
        enum: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    },
    attendance: [{
        date: {
            type: Date,
            required: true
        },
        status: {
            type: String,
            required: true,
            enum: ['Present', 'Absent']
        }
    }],
    totalClasses: {
        type: Number,
        default: 0
    },
    presentClasses: {
        type: Number,
        default: 0
    },
    percentage: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('Attendance', attendanceSchema); 