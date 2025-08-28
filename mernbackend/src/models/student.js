const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    sapid: {
        type: String,
        required: true,
        unique: true
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
    role: {
        type: String,
        default: "Student"
    },
    termTestMarks: {
        wn: {
            tt1: { type: Number, default: 0 },
            tt2: { type: Number, default: 0 }
        },
        oc: {
            tt1: { type: Number, default: 0 },
            tt2: { type: Number, default: 0 }
        },
        elective: {
            tt1: { type: Number, default: 0 },
            tt2: { type: Number, default: 0 }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
});

// Generate auth token
studentSchema.methods.generateAuthToken = async function() {
    try {
        const token = jwt.sign({_id: this._id.toString()}, process.env.SECRET_KEY);
        this.tokens = this.tokens.concat({token: token});
        await this.save();
        return token;
    } catch(error) {
        console.log("the error part" + error);
        res.send("the error part" + error);
    }
}

// Hash password
studentSchema.pre("save", async function(next) {
    if(this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

const Student = new mongoose.model("Student", studentSchema);

module.exports = Student; 