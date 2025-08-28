const express = require('express');
const router = express.Router();
const Syllabus = require('../models/syllabus');

// Get syllabus based on department, year and term test
router.get('/:department/:year/:termTest', async (req, res) => {
    try {
        const { department, year, termTest } = req.params;
        const syllabus = await Syllabus.findOne({ department, year, termTest });
        
        if (!syllabus) {
            return res.status(404).render('syllabus', {
                error: 'Syllabus not found',
                department,
                year,
                termTest
            });
        }

        res.render('syllabus', { syllabus });
    } catch (error) {
        res.status(500).render('syllabus', { error: 'Internal server error' });
    }
});

// Add new syllabus (admin only)
router.post('/add', async (req, res) => {
    try {
        const { department, year, termTest, subjects } = req.body;
        
        // Check if syllabus already exists
        const existingSyllabus = await Syllabus.findOne({ department, year, termTest });
        if (existingSyllabus) {
            return res.status(400).json({ error: 'Syllabus already exists' });
        }

        const newSyllabus = new Syllabus({
            department,
            year,
            termTest,
            subjects
        });

        await newSyllabus.save();
        res.status(201).json({ message: 'Syllabus added successfully', syllabus: newSyllabus });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update existing syllabus (admin only)
router.put('/update/:id', async (req, res) => {
    try {
        const { subjects } = req.body;
        const syllabus = await Syllabus.findByIdAndUpdate(
            req.params.id,
            { subjects },
            { new: true }
        );
        
        if (!syllabus) {
            return res.status(404).json({ error: 'Syllabus not found' });
        }

        res.json({ message: 'Syllabus updated successfully', syllabus });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete syllabus (admin only)
router.delete('/delete/:id', async (req, res) => {
    try {
        const syllabus = await Syllabus.findByIdAndDelete(req.params.id);
        
        if (!syllabus) {
            return res.status(404).json({ error: 'Syllabus not found' });
        }

        res.json({ message: 'Syllabus deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router; 