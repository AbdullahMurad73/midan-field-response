// controllers/roomController.js
const pool = require('../config/db');

// 1. إضافة قاعة جديدة (مخصص للكنترول)
exports.createRoom = async (req, res) => {
    const { room_name, current_proctor_id } = req.body;
    try {
        const newRoom = await pool.query(
            'INSERT INTO rooms (room_name, current_proctor_id) VALUES ($1, $2) RETURNING *',
            [room_name, current_proctor_id || null]
        );
        res.status(201).json(newRoom.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('خطأ في السيرفر أثناء إنشاء القاعة');
    }
};

// 2. جلب جميع القاعات
exports.getAllRooms = async (req, res) => {
    try {
        const rooms = await pool.query(`
            SELECT r.room_id, r.room_name, u.full_name as proctor_name 
            FROM rooms r 
            LEFT JOIN users u ON r.current_proctor_id = u.user_id
        `);
        res.json(rooms.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('خطأ في السيرفر أثناء جلب القاعات');
    }
};