import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:5000/api',
});

// ميزة مطورة: إرفاق التوكين أوتوماتيكياً في هيدر أي طلب إذا كان المستخدم مسجل دخوله
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers['x-auth-token'] = token;
    }
    return config;
});

export default API;