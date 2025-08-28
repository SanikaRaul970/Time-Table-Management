const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
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
    day: {
        type: String,
        required: true,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    },
    time: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    room: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Timetable', timetableSchema); 