const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    role: { 
        type: String, 
        required: true, 
        enum: ['Admin', 'Teacher', 'Student'] 
    },
    name: { 
        type: String, 
        required: true 
    },
    department: { 
        type: String, 
        required: true 
    },
    year: String,
    division: {
        type: String,
        required: function() { return this.role !== 'Admin'; }
    },
    username: {
        type: String,
        required: function() { return this.role !== 'Student'; },
        unique: true,
        sparse: true
    },
    subject: {
        type: String,
        validate: {
            validator: function(v) {
                return this.role !== 'Teacher' || v;
            },
            message: 'Subject is required for teachers'
        }
    },
    status: { 
        type: String, 
        default: 'Active' 
    },
    sapid: {
        type: String,
        required: function() { return this.role === 'Student'; },
        unique: true,
        sparse: true
    }
});

module.exports = mongoose.model('User', userSchema); 

const departmentMap = {
  "Computer Engineering": "COMP",
  "Information Technology": "IT",
  "Electronics & Telecommunication": "EXTC",
  "Mechanical Engineering": "MECH"
};
const yearMap = {
  "First Year": "FE",
  "Second Year": "SE",
  "Third Year": "TE",
  "Final Year": "BE",
  "Fourth Year": "BE"
}; 