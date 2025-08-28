const mongoose = require('mongoose');

const registerSchema = new mongoose.Schema({
    role: {
        type: String,
        required: true,
        enum: ['Admin', 'Teacher', 'Student']
    },
    firstname: {
        type: String,
        required: function() {
            return this.role === 'Teacher' || this.role === 'Student';
        }
    },
    lastname: {
        type: String,
        required: function() {
            return this.role === 'Teacher' || this.role === 'Student';
        }
    },
    sapid: {
        type: String,
        required: function() {
            return this.role === 'Student';
        },
        unique: function() {
            return this.role === 'Student';
        }
    },
    department: {
        type: String,
        required: function() {
            return this.role === 'Teacher' || this.role === 'Student';
        }
    },
    year: {
        type: String,
        required: function() {
            return this.role === 'Teacher' || this.role === 'Student';
        }
    },
    division: {
        type: String,
        required: function() {
            return this.role === 'Teacher' || this.role === 'Student';
        }
    },
    subject: {
        type: String,
        required: function() {
            return this.role === 'Teacher';
        }
    },
    status: {
        type: String,
        default: 'Active',
        enum: ['Active', 'Inactive']
    },
    courseProgress: {
        completedTopics: [String],
        upcomingTopics: [String],
        lastUpdated: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Register = mongoose.model('Register', registerSchema);

module.exports = Register; 