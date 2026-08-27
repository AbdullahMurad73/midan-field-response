// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    // جلب التوكين من الهيدر
    const token = req.header('x-auth-token');

    // التحقق إذا لم يكن هناك توكين
    if (!token) {
        return res.status(401).json({ message: 'لا يوجد توكين، تم رفض صلاحية الوصول!' });
    }

    try {
        // فك التوكين والتحقق منه
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user; // إضافة بيانات المستخدم (id, role) للطلب
        next();
    } catch (err) {
        res.status(401).json({ message: 'التوكين غير صالح أو منتهي الصلاحية!' });
    }
};