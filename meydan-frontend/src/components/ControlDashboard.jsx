import React, { useState, useEffect } from 'react';
import { socket } from '../services/socket';
import { Shield, AlertTriangle, UserCheck, Package, Clock, CheckCircle, ArrowLeftRight, ListFilter, Users } from 'lucide-react';

export default function ControlDashboard({ user }) {
    const [incidents, setIncidents] = useState([]);
    const [activeFilter, setActiveFilter] = useState('all'); // state للفلترة اللحظية (all, emergency, supervisor, materials, resolved)

    useEffect(() => {
        // 1. الاستماع للبلاغات القادمة من المراقبين لايف
        socket.on('receive_incident', (data) => {
            setIncidents(prev => [data, ...prev]);
            
            // تشغيل صوت تنبيه قوي عند وصول بلاغ مخصص
            try {
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-600.wav');
                audio.play();
            } catch (e) { console.log("Audio play blocked"); }
        });

        return () => {
            socket.off('receive_incident');
        };
    }, []);

    // دالة لتحديث حالة البلاغ (تم الحل، أو تحويل للمشرف)
    const updateStatus = (id, newStatus) => {
        setIncidents(prev => prev.map(inc => {
            if (inc.id === id) {
                const updated = { ...inc, status: newStatus };
                // إذا تم تحويلها لمشرف، نرسل حدث لايف عبر السوكيت ليسمعها المشرف بجواله فوراً
                if (newStatus === 'dispatched') {
                    socket.emit('forward_to_supervisor', updated);
                }
                return updated;
            }
            return inc;
        }));
    };

    // فلترة المصفوفة برمجياً حسب الزر النشط
    const filteredIncidents = incidents.filter(inc => {
        if (activeFilter === 'all') return true;
        if (activeFilter === 'resolved') return inc.status === 'resolved';
        if (activeFilter === 'dispatched') return inc.status === 'dispatched';
        return inc.type === activeFilter && inc.status !== 'resolved';
    });

    // حساب نسب الأداء الذكية للمنظومة
    const total = incidents.length;
    const resolvedCount = incidents.filter(i => i.status === 'resolved').length;
    const pendingCount = incidents.filter(i => i.status === 'pending').length;
    const dispatchedCount = incidents.filter(i => i.status === 'dispatched').length;
    const successRate = total > 0 ? Math.round((resolvedCount / total) * 100) : 100;

    return (
        <div className="space-y-6 text-right" dir="rtl">
            
            {/* 📊 أولاً: لوحة مؤشرات الأداء الحركية (Analytics Metrics) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-700/50 flex items-center justify-between shadow-sm">
                    <div>
                        <p className="text-xs text-slate-400 font-bold">معدل الإنجاز العام</p>
                        <h3 className="text-2xl font-black text-blue-400 mt-1 font-mono">{successRate}%</h3>
                    </div>
                    <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400"><Shield className="h-5 w-5" /></div>
                </div>

                <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-700/50 flex items-center justify-between shadow-sm">
                    <div>
                        <p className="text-xs text-slate-400 font-bold">بلاغات قيد الانتظار ⏳</p>
                        <h3 className="text-2xl font-black text-amber-400 mt-1 font-mono">{pendingCount}</h3>
                    </div>
                    <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400"><Clock className="h-5 w-5" /></div>
                </div>

                <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-700/50 flex items-center justify-between shadow-sm">
                    <div>
                        <p className="text-xs text-slate-400 font-bold">جاري المعالجة بالميدان 🏃‍♂️</p>
                        <h3 className="text-2xl font-black text-indigo-400 mt-1 font-mono">{dispatchedCount}</h3>
                    </div>
                    <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400"><ArrowLeftRight className="h-5 w-5" /></div>
                </div>

                <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-700/50 flex items-center justify-between shadow-sm">
                    <div>
                        <p className="text-xs text-slate-400 font-bold">طلبات تم إغلاقها ✓</p>
                        <h3 className="text-2xl font-black text-emerald-400 mt-1 font-mono">{resolvedCount}</h3>
                    </div>
                    <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400"><CheckCircle className="h-5 w-5" /></div>
                </div>
            </div>

            {/* 🚦 ثانياً: شريط الفلترة المتقدمة (Live Filtering Tabs) */}
            <div className="bg-slate-900/50 p-2 rounded-xl border border-slate-800 flex flex-wrap gap-2 items-center">
                <span className="text-xs text-slate-400 font-bold px-2 flex items-center gap-1">
                    <ListFilter className="h-3.5 w-3.5" /> تصفية الرادار:
                </span>
                <button onClick={() => setActiveFilter('all')} className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${activeFilter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>الكل ({total})</button>
                <button onClick={() => setActiveFilter('emergency')} className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${activeFilter === 'emergency' ? 'bg-rose-600/20 text-rose-400 border border-rose-500/30' : 'text-slate-400 hover:bg-slate-800'}`}>الطوارئ فقط 🚨</button>
                <button onClick={() => setActiveFilter('supervisor')} className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${activeFilter === 'supervisor' ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:bg-slate-800'}`}>طلبات المشرفين 👤</button>
                <button onClick={() => setActiveFilter('dispatched')} className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${activeFilter === 'dispatched' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:bg-slate-800'}`}>بالميدان 🏃‍♂️</button>
                <button onClick={() => setActiveFilter('resolved')} className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${activeFilter === 'resolved' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:bg-slate-800'}`}>المغلقة ✅</button>
            </div>

            {/* اللوحة الرئيسية لاستقبل البث */}
            <div className="bg-[#1e293b] rounded-2xl border border-slate-700/60 p-5 shadow-xl">
                <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                    <span className="h-2 w-2 bg-red-500 rounded-full animate-ping" />
                    رادار الاستجابة الفورية المركزي
                </h2>

                {filteredIncidents.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
                        <Clock className="h-10 w-10 mx-auto mb-3 text-slate-600 animate-pulse" />
                        <p className="text-sm font-bold">لا توجد بلاغات تطابق تصفية الرادار الحالية...</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredIncidents.map((incident) => (
                            <div 
                                key={incident.id} 
                                className={`p-4 rounded-xl border transition-all duration-300 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                                    incident.status === 'resolved' ? 'bg-slate-900/40 border-slate-800 opacity-60' :
                                    incident.status === 'dispatched' ? 'bg-indigo-500/5 border-indigo-500/30' :
                                    incident.color === 'red' ? 'bg-rose-500/5 border-rose-500/30' : 
                                    incident.color === 'amber' ? 'bg-amber-500/5 border-amber-500/30' : 'bg-blue-500/5 border-blue-500/30'
                                }`}
                            >
                                {/* تفاصيل البلاغ */}
                                <div className="flex items-start gap-4 flex-1">
                                    <div className={`p-2.5 rounded-xl mt-1 ${
                                        incident.status === 'dispatched' ? 'bg-indigo-500/10 text-indigo-400' :
                                        incident.color === 'red' ? 'bg-rose-500/10 text-rose-400' :
                                        incident.color === 'amber' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'
                                    }`}>
                                        {incident.type === 'emergency' ? <AlertTriangle className="h-5 w-5" /> :
                                         incident.type === 'supervisor' ? <UserCheck className="h-5 w-5" /> : <Package className="h-5 w-5" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-black text-base text-white">قاعة ({incident.room})</span>
                                            <span className={`text-xxs px-2 py-0.5 rounded-md font-black border ${
                                                incident.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                                                incident.status === 'dispatched' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-emerald-500/10 text-emerald-400'
                                            }`}>
                                                {incident.status === 'pending' ? 'قيد الانتظار ⏳' : 
                                                 incident.status === 'dispatched' ? 'بالميدان مع المشرف 🏃‍♂️' : 'تم الإنهاء والحل ✓'}
                                            </span>
                                        </div>
                                        <p className="text-slate-200 mt-1 text-sm font-bold">{incident.label}</p>
                                        
                                        {/* عرض الملاحظة والإحصائيات بداخل صندوق فخم */}
                                        {incident.notes && (
                                            <div className="mt-2 text-xs bg-slate-900/90 text-slate-300 p-2.5 rounded-xl border border-slate-700/40 font-sans leading-relaxed">
                                                {incident.notes}
                                            </div>
                                        )}

                                        <div className="flex items-center gap-3 text-xxs text-slate-400 mt-2">
                                            <span>المراقب: <b>{incident.proctorName}</b></span>
                                            <span>•</span>
                                            <span>الوقت: {incident.time}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* 🛠️ أزرار اتخاذ الإجراء المتقدم الذكي */}
                                <div className="flex items-center gap-2 self-end md:self-center">
                                    {incident.status === 'pending' && (
                                        <>
                                            {/* زر تحويل البلاغ لمشرف ممر */}
                                            <button
                                                onClick={() => updateStatus(incident.id, 'dispatched')}
                                                className="bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/30 text-xxs font-black px-3 py-2 rounded-lg transition-all flex items-center gap-1"
                                            >
                                                <ArrowLeftRight className="h-3 w-3" /> تحويل لمشرف الممر
                                            </button>
                                            <button
                                                onClick={() => updateStatus(incident.id, 'resolved')}
                                                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xxs font-black px-3 py-2 rounded-lg transition-all"
                                            >
                                                حل مباشر ✓
                                            </button>
                                        </>
                                    )}
                                    {incident.status === 'dispatched' && (
                                        <button
                                            onClick={() => updateStatus(incident.id, 'resolved')}
                                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xxs font-black px-3 py-2 rounded-lg transition-all"
                                        >
                                            تأكيد الحل الميداني وإغلاق ✓
                                        </button>
                                    )}
                                    {incident.status === 'resolved' && (
                                        <span className="text-xxs text-slate-500 font-bold">أرشيف مغلق</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}