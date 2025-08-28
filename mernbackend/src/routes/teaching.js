const express = require('express');
const router = express.Router();
const teachingController = require('../controllers/teachingController');
const auth = require('../middleware/auth');

router.post('/assign', auth, teachingController.assignTeaching);
router.get('/assignments', auth, teachingController.getTeachingAssignments);
router.delete('/assignment/:assignmentId', auth, teachingController.removeTeachingAssignment);

module.exports = router; 