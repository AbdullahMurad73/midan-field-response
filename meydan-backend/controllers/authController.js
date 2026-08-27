// controllers/authController.js
const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. تسجيل مستخدم جديد (مخصص للادارة أو لتهيئة الحسابات)
exports.register = async (req, res) => {
    const { username, password, full_name, role } = req.body;
    try {
        // التحقق من وجود المستخدم مسبقاً
        const userExists = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'اسم المستخدم مسجل مسبقاً في النظام!' });
        }

        // تشفير كلمة المرور بقوة القوة
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // إدخال المستخدم في قاعدة البيانات
        const newUser = await pool.query(
            'INSERT INTO users (username, password_text, full_name, role) VALUES ($1, $2, $3, $4) RETURNING user_id, username, full_name, role',
            [username, hashedPassword, full_name, role]
        );

        res.status(201).json({ message: 'تم إنشاء الحساب بنجاح', user: newUser.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('خطأ في السيرفر أثناء التسجيل');
    }
};

// 2. تسجيل الدخول والتحقق من الهوية
exports.login = async (req, res) => {
    const { username, password } = req.body;
    try {
        // البحث عن المستخدم
        const userResult = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (userResult.rows.length === 0) {
            return res.status(400).json({ message: 'بيانات الاعتماد غير صحيحة!' });
        }

        const user = userResult.rows[0];

        // مطابقة كلمة المرور المشفرة
        const isMatch = await bcrypt.compare(password, user.password_text);
        if (!isMatch) {
            return res.status(400).json({ message: 'بيانات الاعتماد غير صحيحة!' });
        }

        // توليد الـ JWT Token يحمل الـ ID والصلاحية
        const payload = {
            user: {
                id: user.user_id,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '12h' }, // صلاحية التوكين تضمن تغطية فترة الاختبارات اليومية كاملة
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    user: {
                        id: user.user_id,
                        full_name: user.full_name,
                        role: user.role
                    }
                });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('خطأ في السيرفر أثناء تسجيل الدخول');
    }
};