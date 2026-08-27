import React, { useState, useEffect } from 'react';
import { socket } from '../services/socket';
import { Shield, AlertTriangle, UserCheck, Package, Clock, CheckCircle2, Navigation } from 'lucide-react';

export default function SupervisorDashboard({ user }) {
    const [tasks, setTasks] = useState([]);

    useEffect(() => {
        // 1. الاستماع للمهمات المحولة من الكنترول لايف
        socket.on('supervisor_new_task', (taskData) => {
            setTasks(prev => [taskData, ...prev]);

            // 🔥 ميزة اهتزاز الجوال المتقدمة (Vibration API)
            if ('vibrate' in navigator) {
                // يهتز الجوال نمط طوارئ: اهتزاز 500 ملي ثانية، إيقاف 200، اهتزاز 500
                navigator.vibrate([500, 200, 500]);
            }

            // تشغيل صوت تنبيه مميز للمشرف
            try {
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/911/911-600.wav');
                audio.play();
            } catch (e) { console.log("Audio blocked"); }
        });

        return () => {
            socket.off('supervisor_new_task');
        };
    }, []);

    // دالة لإنهاء المهمة ميدانياً من قبل المشرف
    const completeTask = (id) => {
        setTasks(prev => prev.map(task => task.id === id ? { ...task, status: 'resolved' } : task));
    };

    return (
        <div className="max-w-md mx-auto bg-[#1e293b] rounded-2xl border border-slate-700/60 shadow-2xl p-5 text-right space-y-5" dir="rtl">
            
            {/* الهيدر والعنوان */}
            <div className="flex justify-between items-center border-b border-slate-700/50 pb-3">
                <div>
                    <h2 className="text-lg font-black text-white m-0 flex items-center gap-2">
                        <Navigation className="h-5 w-5 text-indigo-400 animate-bounce" />
                        الاستجابة الميدانية للمشرف
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">المهمات والتكليفات المحولة لك من الكنترول</p>
                </div>
                <span className="text-xxs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-full font-bold">
                    ممر القاعات لايف
                </span>
            </div>

            {/* قائمة التكليفات الحالية */}
            <div className="space-y-4">
                {tasks.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
                        <Clock className="h-10 w-10 mx-auto mb-3 text-slate-600" />
                        <p className="text-sm font-bold">لا توجد مهمات ميدانية موجهة لك حالياً</p>
                        <p className="text-xxs text-slate-600 mt-1">تجوّل في الممرات، وعند تحويل أي بلاغ سيهتز جوالك فوراً</p>
                    </div>
                ) : (
                    tasks.map((task) => (
                        <div 
                            key={task.id}
                            className={`p-4 rounded-xl border transition-all ${
                                task.status === 'resolved' 
                                ? 'bg-slate-900/40 border-slate-800 opacity-50' 
                                : 'bg-indigo-600/5 border-indigo-500/30 shadow-md animate-fade-in'
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg mt-1 ${
                                    task.color === 'red' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                                }`}>
                                    {task.type === 'emergency' ? <AlertTriangle className="h-4.5 w-4.5" /> : <UserCheck className="h-4.5 w-4.5" />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center">
                                        <span className="font-black text-base text-white">توجه إلى: قاعة ({task.room})</span>
                                        <span className="text-xxs text-slate-400 font-mono">{task.time}</span>
                                    </div>
                                    <p className="text-xs text-slate-300 mt-1 font-bold">نوع البلاغ: {task.label}</p>
                                    
                                    {/* عرض ملاحظة المراقب للمشرف عشان يفهم الوضع قبل يدخل القاعة */}
                                    {task.notes && (
                                        <div className="mt-2 bg-slate-900/80 p-2.5 rounded-lg border border-slate-700/40 text-xxs text-slate-300 font-sans">
                                            📌 <b>تفصيل المراقب:</b> {task.notes}
                                        </div>
                                    )}

                                    {/* زر اتخاذ الإجراء من الميدان */}
                                    <div className="mt-3 flex justify-end">
                                        {task.status !== 'resolved' ? (
                                            <button
                                                onClick={() => completeTask(task.id)}
                                                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xxs font-black px-4 py-2 rounded-lg transition-all shadow-sm flex items-center gap-1"
                                            >
                                                🟢 تم حل المشكلة ميدانياً
                                            </button>
                                        ) : (
                                            <span className="text-xxs text-emerald-400 font-bold flex items-center gap-1">
                                                <CheckCircle2 className="h-3.5 w-3.5" /> تم الإنجاز وإبلاغ الكنترول
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}