const mongoose = require('mongoose');

const marksSchema = new mongoose.Schema({
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
    termTest1: {
        type: Number,
        min: 0,
        max: 25,
        default: 0
    },
    termTest2: {
        type: Number,
        min: 0,
        max: 25,
        default: 0
    },
    endSem: {
        type: Number,
        min: 0,
        max: 50,
        default: 0
    },
    total: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    grade: {
        type: String,
        enum: ['O', 'A+', 'A', 'B+', 'B', 'C', 'F'],
        default: 'F'
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
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

// Calculate total and grade before saving
marksSchema.pre('save', function(next) {
    this.total = this.termTest1 + this.termTest2 + this.endSem;
    
    // Calculate grade based on total marks
    if (this.total >= 90) this.grade = 'O';
    else if (this.total >= 80) this.grade = 'A+';
    else if (this.total >= 70) this.grade = 'A';
    else if (this.total >= 60) this.grade = 'B+';
    else if (this.total >= 50) this.grade = 'B';
    else if (this.total >= 40) this.grade = 'C';
    else this.grade = 'F';
    
    next();
});

module.exports = mongoose.model('Marks', marksSchema); 