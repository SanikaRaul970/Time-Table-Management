const mongoose = require('mongoose');

const registerSchema = new mongoose.Schema({
    role: {
        type: String,
        required: true,
        enum: ['Student', 'Teacher', 'Admin']
    },
    name: {
        type: String,
        required: true // Making name required for all roles
    },
    sapid: {
        type: String,
        required: function() {
            return this.role === 'Student';
        },
        unique: true,
        sparse: true,
        validate: {
            validator: function(v) {
                return this.role === 'Student' ? /^\d{11}$/.test(v) : true;
            },
            message: 'SAP ID must be 11 digits'
        }
    },
    department: {
        type: String,
        required: function() {
            return this.role !== 'Admin';
        },
        enum: ['EXTC', 'COMP', 'IT', 'MECH']
    },
    year: {
        type: String,
        required: function() {
            return this.role !== 'Admin';
        },
        enum: ['FE', 'SE', 'TE', 'BE']
    },
    division: {
        type: String,
        required: function() {
            return this.role !== 'Admin';
        },
        enum: ['BE-1', 'BE-2', 'BE-3']
    },
    subject: {
        type: String,
        required: function() {
            return this.role === 'Teacher';
        }
    },
    status: {
        type: String,
        required: true,
        default: 'Active'
    },
    courseProgress: {
        type: {
            completedTopics: [{
                type: String,
                trim: true
            }],
            upcomingTopics: [{
                type: String,
                trim: true
            }],
            lastUpdated: {
                type: Date,
                default: Date.now
            }
        },
        required: function() {
            return this.role === 'Teacher';
        },
        default: function() {
            return this.role === 'Teacher' ? {
                completedTopics: [],
                upcomingTopics: [],
                lastUpdated: new Date()
            } : undefined;
        }
    }
}, {
    timestamps: true
});

const Register = mongoose.model('Register', registerSchema);

// Drop existing indexes before creating new ones
async function resetIndexes() {
    try {
        await Register.collection.dropIndexes();
        console.log('Dropped all indexes');
        
        // Create new indexes
        await Register.init();
        console.log('Created new indexes successfully');
    } catch (err) {
        console.error('Error resetting indexes:', err);
    }
}

// Reset indexes when the model is first loaded
resetIndexes();

module.exports = Register; 