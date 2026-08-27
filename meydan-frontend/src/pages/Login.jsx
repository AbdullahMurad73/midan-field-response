import React, { useState } from 'react';
import API from '../services/api';
import { socket } from '../services/socket';
import { Shield, Lock, User } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await API.post('/auth/login', { username, password });
            
            // حفظ التوكين وبيانات المستخدم محلياً
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            
            // تشغيل اتصال الـ Socket وتوجيه المستخدم لغرفته حسب دوره
            socket.connect();
            socket.emit('join_role_room', res.data.user.role);
            if(res.data.user.role === 'supervisor') {
                socket.emit('join_supervisor_room', res.data.user.id);
            }

            onLoginSuccess(res.data.user);
        } catch (err) {
            setError(err.response?.data?.message || 'حدث خطأ في الاتصال بالسيرفر');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f172a] px-4">
            <div className="max-w-md w-full bg-[#1e293b] rounded-2xl shadow-2xl p-8 border border-slate-700/50 transform transition-all">
                <div className="text-center mb-8">
                    <div className="mx-auto h-16 w-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 mb-4 border border-blue-500/20">
                        <Shield className="h-8 w-8 text-blue-400" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-white tracking-tight">نظام مـيـدان</h2>
                    <p className="text-slate-400 mt-2 text-sm">نظام الاستجابة اللحظية لإدارة لجان الاختبارات</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg text-center mb-6">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">اسم المستخدم</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500">
                                <User className="h-5 w-5" />
                            </span>
                            <input
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl pr-10 pl-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-right"
                                placeholder="ادخل اسم المستخدم"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">كلمة المرور</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500">
                                <Lock className="h-5 w-5" />
                            </span>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl pr-10 pl-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-right"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl transition-all transform active:scale-95 shadow-lg shadow-blue-600/20 flex items-center justify-center"
                    >
                        {loading ? 'جاري التحقق من القوة...' : 'دخول للمنظومة'}
                    </button>
                </form>
            </div>
        </div>
    );
}