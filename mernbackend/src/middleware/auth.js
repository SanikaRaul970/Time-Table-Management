const jwt = require('jsonwebtoken');
const Register = require('../models/Register');

const auth = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;
        if (!token) {
            if (req.accepts('html')) {
                return res.redirect('/login');
            }
            return res.status(401).json({ message: 'Please authenticate' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await Register.findOne({ _id: decoded._id });

        if (!user) {
            if (req.accepts('html')) {
                return res.redirect('/login');
            }
            return res.status(401).json({ message: 'User not found' });
        }

        req.token = token;
        req.user = user;
        next();
    } catch (error) {
        if (req.accepts('html')) {
            return res.redirect('/login');
        }
        res.status(401).json({ message: 'Please authenticate' });
    }
};

const isTeacher = async (req, res, next) => {
    try {
        if (req.user.role !== 'Teacher') {
            if (req.accepts('html')) {
                return res.redirect('/login');
            }
            return res.status(403).json({ message: 'Access denied. Only teachers can access this route.' });
        }
        next();
    } catch (error) {
        if (req.accepts('html')) {
            return res.redirect('/login');
        }
        res.status(403).json({ message: error.message });
    }
};

const isStudent = async (req, res, next) => {
    try {
        if (req.user.role !== 'Student') {
            if (req.accepts('html')) {
                return res.redirect('/login');
            }
            return res.status(403).json({ message: 'Access denied. Only students can access this route.' });
        }
        next();
    } catch (error) {
        if (req.accepts('html')) {
            return res.redirect('/login');
        }
        res.status(403).json({ message: error.message });
    }
};

const isAdmin = async (req, res, next) => {
    try {
        if (req.user.role !== 'Admin') {
            if (req.accepts('html')) {
                return res.redirect('/login');
            }
            return res.status(403).json({ message: 'Access denied. Only administrators can access this route.' });
        }
        next();
    } catch (error) {
        if (req.accepts('html')) {
            return res.redirect('/login');
        }
        res.status(403).json({ message: error.message });
    }
};

module.exports = {
    auth,
    isTeacher,
    isStudent,
    isAdmin
};