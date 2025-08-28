const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Register',
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
    students: [{
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Register'
        },
        marks: {
            tt1: {
                type: Number,
                default: 0,
                min: 0,
                max: 20
            },
            tt2: {
                type: Number,
                default: 0,
                min: 0,
                max: 20
            }
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Create a compound unique index for subject name, department, year, and division
subjectSchema.index({ 
    name: 1, 
    department: 1, 
    year: 1, 
    division: 1
}, { 
    unique: true 
});

const Subject = mongoose.model('Subject', subjectSchema);

module.exports = Subject; 