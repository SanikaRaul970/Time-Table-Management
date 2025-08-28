const mongoose = require("mongoose");

const syllabusSchema = new mongoose.Schema({
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
    termTest: {
        type: String,
        required: true,
        enum: ['TT1', 'TT2']
    },
    subjects: [{
        subjectName: {
            type: String,
            required: true
        },
        topics: [{
            type: String,
            required: true
        }],
        referenceBooks: [{
            type: String
        }]
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
syllabusSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Syllabus = mongoose.model('Syllabus', syllabusSchema);
module.exports = Syllabus; 