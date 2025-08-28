const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
    sapid: {
        type: String,
        sparse: true,
        validate: {
            validator: function(v) {
                return this.role === 'Student' ? /^\d{11}$/.test(v) : true;
            },
            message: 'SAP ID must be 11 digits'
        }
    },
    studentName: {
        type: String,
        required: true
    },
    department: {
        type: String,
        required: true
    },
    year: {
        type: String,
        required: true,
        enum: ['FE', 'SE', 'TE', 'BE']
    },
    division: {
        type: String,
        required: true,
        enum: ['BE-1', 'BE-2']
    },
    role: {
        type: String,
        required: true,
        enum: ['Student', 'Teacher', 'Admin']
    },
    isRegistered: {
        type: Boolean,
        default: true
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Register',
        required: false
    },
    addedAt: {
        type: Date,
        default: Date.now
    }
});

const Registration = mongoose.model('Registration', registrationSchema);

module.exports = Registration; 