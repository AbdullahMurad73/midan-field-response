// controllers/requestController.js
const pool = require('../config/db');

// 1. إنشاء بلاغ جديد (المراقب يضغط الزر)
exports.createRequest = async (req, res) => {
    const { room_id, request_type } = req.body;
    try {
        // إدخال البلاغ في قاعدة البيانات بالحالة الافتراضية pending
        const newRequest = await pool.query(
            'INSERT INTO requests (room_id, request_type, status) VALUES ($1, $2, \'pending\') RETURNING *',
            [room_id, request_type]
        );

        // جلب تفاصيل القاعة لإرسالها في السوكيت
        const roomInfo = await pool.query('SELECT room_name FROM rooms WHERE room_id = $1', [room_id]);
        
        const socketData = {
            ...newRequest.rows[0],
            room_name: roomInfo.rows[0].room_name
        };

        // 🔥 إرسال تنبيه لحظي فوري إلى غرفة الكنترول بالصوت والبيانات!
        const io = req.app.get('io');
        io.to('control_room').emit('new_request', socketData);

        res.status(201).json({ message: 'تم إرسال البلاغ للكنترول فوراً', request: socketData });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('خطأ في السيرفر أثناء إرسال البلاغ');
    }
};

// 2. الكنترول يوجه البلاغ لمشرف ميداني معين (تحديث الحالة إلى processing)
exports.assignSupervisor = async (req, res) => {
    const { request_id, supervisor_id } = req.body;
    try {
        const updatedRequest = await pool.query(
            'UPDATE requests SET supervisor_id = $1, status = \'processing\', updated_at = CURRENT_TIMESTAMP WHERE request_id = $2 RETURNING *',
            [supervisor_id, request_id]
        );

        if (updatedRequest.rows.length === 0) {
            return res.status(404).json({ message: 'البلاغ غير موجود!' });
        }

        const io = req.app.get('io');
        
        // 🔥 1. تنبيه المشرف الميداني المحدّد فوراً على جواله ليهتز ويستقبل المهمة
        io.to(`supervisor_${supervisor_id}`).emit('new_task', updatedRequest.rows[0]);

        // 🔥 2. تحديث شاشة المراقب والكنترول لايف لتصبح الحالة "جاري التنفيذ"
        io.emit('request_updated', updatedRequest.rows[0]);

        res.json({ message: 'تم توجيه المشرف بنجاح التام', request: updatedRequest.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('خطأ في السيرفر أثناء توجيه المشرف');
    }
};

// 3. المشرف يغلق البلاغ من الميدان (تحديث الحالة إلى completed)
exports.completeRequest = async (req, res) => {
    const { request_id } = req.params;
    try {
        const completedRequest = await pool.query(
            'UPDATE requests SET status = \'completed\', updated_at = CURRENT_TIMESTAMP WHERE request_id = $1 RETURNING *',
            [request_id]
        );

        // 🔥 تحديث الشاشات لحظياً باختفاء أو أرشفة الطلب
        const io = req.app.get('io');
        io.emit('request_completed', completedRequest.rows[0]);

        res.json({ message: 'تم إنهاء البلاغ وإغلاقه بنجاح', request: completedRequest.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('خطأ في السيرفر أثناء إغلاق البلاغ');
    }
};