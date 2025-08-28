const mongoose = require('mongoose');

const importantDateSchema = new mongoose.Schema({
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
    date: {
        type: Date,
        required: true
    },
    event: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['exam', 'assignment', 'event', 'holiday']
    },
    description: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('ImportantDate', importantDateSchema); 