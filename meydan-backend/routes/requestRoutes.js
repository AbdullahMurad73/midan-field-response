// routes/requestRoutes.js
const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const auth = require('../middleware/authMiddleware');

router.post('/create', auth, requestController.createRequest);
router.post('/assign', auth, requestController.assignSupervisor);
router.put('/complete/:request_id', auth, requestController.completeRequest);

module.exports = router;