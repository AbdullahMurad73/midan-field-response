const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// 1. الاتصال بقاعدة بيانات PostgreSQL
// تنبيه: تأكد أن كلمة المرور (123456) تطابق الباسورد الخاص بجهازك في pgAdmin
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'meydan_db',
    password: process.env.DB_PASSWORD || '123', 
    port: process.env.DB_PORT || 5432,
});

const server = http.createServer(app);

// 2. إعداد الـ Socket.io للاتصال اللحظي
const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST", "PUT"]
    }
});

// 3. اتصالات السوكت (WebSockets) وتوزيع الغرف للأدوار
io.on('connection', (socket) => {
    console.log(`⚡ مستخدم متصل الآن: ${socket.id}`);

    // انضمام المستخدم لغرفة بناءً على دوره (control, supervisor, proctor)
    socket.on('join_system', (role) => {
        socket.join(role);
        console.log(`👤 مستخدم انضم لغرفة الدور: ${role}`);
    });

    socket.on('disconnect', () => {
        console.log('❌ انقطع اتصال مستخدم');
    });
});

// 4. الروابط والـ API الفعالة (REST APIs)

// أ) جلب بيانات القاعة للمراقب
app.get('/api/room/:id', async (req, res) => {
    try {
        const room = await pool.query('SELECT * FROM rooms WHERE room_id = $1', [req.params.id]);
        if (room.rows.length === 0) {
            return res.status(404).json({ error: 'القاعة غير موجودة' });
        }
        res.json(room.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ب) جلب قائمة المشرفين الميدانيين المتاحين (ليعرضهم الكنترول في القائمة المنسدلة)
app.get('/api/supervisors', async (req, res) => {
    try {
        const supervisors = await pool.query("SELECT user_id, full_name FROM users WHERE role = 'supervisor'");
        res.json(supervisors.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ج) إرسال بلاغ جديد من المراقب في اللجنة
app.post('/api/request', async (req, res) => {
    try {
        const { room_id, request_type } = req.body;
        
        const newRequest = await pool.query(
            "INSERT INTO requests (room_id, request_type, status) VALUES ($1, $2, 'pending') RETURNING *",
            [room_id, request_type]
        );

        const roomInfo = await pool.query('SELECT room_name FROM rooms WHERE room_id = $1', [room_id]);
        
        const fullRequestData = {
            ...newRequest.rows[0],
            room_name: roomInfo.rows[0].room_name
        };

        // إرسال تنبيه فوري لشاشة الكنترول الرئيسي دون ريفريش
        io.to('control').emit('new_request_received', fullRequestData);

        res.json({ success: true, data: fullRequestData });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// د) تحديث الحالة وتوجيه المشرف الميداني
app.put('/api/request/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, supervisor_id } = req.body;

        const updatedRequest = await pool.query(
            `UPDATE requests 
             SET status = $1, supervisor_id = $2, updated_at = CURRENT_TIMESTAMP 
             WHERE request_id = $3 RETURNING *`,
            [status, supervisor_id, id]
        );

        // جلب اسم القاعة واسم المشرف لإرسال التحديث كاملاً للواجهات
        const details = await pool.query(
            `SELECT r.*, rm.room_name, u.full_name as supervisor_name 
             FROM requests r 
             JOIN rooms rm ON r.room_id = rm.room_id
             LEFT JOIN users u ON r.supervisor_id = u.user_id
             WHERE r.request_id = $1`, [id]
        );

        const finalData = details.rows[0];

        // بث التحديث الفوري لجميع الأطراف (المراقب والكنترول)
        io.emit('request_status_updated', finalData);
        
        // تنبيه المشرف الميداني المعني في جواله بوجود مهمة جديدة له
        if (status === 'processing') {
            io.to('supervisor').emit('task_assigned', finalData);
        }

        res.json({ success: true, data: finalData });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// هـ) جلب كل الطلبات النشطة (الانتظار وجاري التنفيذ) لشاشة الكنترول عند فتحها
app.get('/api/requests/active', async (req, res) => {
    try {
        const activeRequests = await pool.query(
            `SELECT r.*, rm.room_name, u.full_name as supervisor_name 
             FROM requests r 
             JOIN rooms rm ON r.room_id = rm.room_id 
             LEFT JOIN users u ON r.supervisor_id = u.user_id
             WHERE r.status != 'completed' 
             ORDER BY r.created_at DESC`
        );
        res.json(activeRequests.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. تشغيل السيرفر المركزي
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 السيرفر شغال ويزغرد بنظافة على البورت: ${PORT}`);
});