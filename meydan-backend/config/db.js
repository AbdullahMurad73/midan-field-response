// config/db.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

pool.on('connect', () => {
    console.log('🔗 تم الاتصال بقاعدة بيانات مـيـدان بنجاح القوة!');
});

pool.on('error', (err) => {
    console.error('❌ خطأ غير متوقع في الاتصال بقاعدة البيانات:', err);
});

module.exports = pool;