// routes/roomRoutes.js
const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const auth = require('../middleware/authMiddleware');

router.post('/', auth, roomController.createRoom);
router.get('/', auth, roomController.getAllRooms);

module.exports = router;