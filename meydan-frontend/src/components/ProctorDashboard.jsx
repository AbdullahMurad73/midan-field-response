import React, { useState, useEffect } from 'react';
import { socket } from '../services/socket';
import { 
    AlertTriangle, UserCheck, Package, Wifi, WifiOff, 
    Clock, Users, BookOpen, Smile, HelpCircle, ChevronDown, ChevronUp 
} from 'lucide-react';

export default function ProctorDashboard({ user }) {
    // حالات الإدخال الأساسية
    const [roomNumber, setRoomNumber] = useState('');
    const [customNotes, setCustomNotes] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [isConnected, setIsConnected] = useState(socket.connected);

    // مميزات عبد الله الإضافية الذكية
    const [showGuide, setShowGuide] = useState(false); // إظهار الدليل
    const [presentCount, setPresentCount] = useState(''); // الحاضرين
    const [absentCount, setAbsentCount] = useState(''); // الغائبين

    // عداد الوقت التنازلي المطور
    const [timeLeft, setTimeLeft] = useState(0); // بالثواني
    const [isTimerActive, setIsTimerActive] = useState(false);

    // عبارات الكتابة السريعة المجهزة بلمسة واحدة لراحة المراقب
    const quickTags = [
        "محاولة غش / برشام 🚫", 
        "التكييف معطل أو ضعيف ❄️", 
        "طالب يحتاج رعاية طبية 🩺", 
        "تمزق ورقة إجابة 📄", 
        "طالب متأخر عن اللجنة ⏰",
        "تشويش / إزعاج خارجي 📢"
    ];

    // ربط السوكيت ومتابعة حالة الشبكة
    useEffect(() => {
        function onConnect() { setIsConnected(true); }
        function onDisconnect() { setIsConnected(false); }

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
        };
    }, []);

    // تفعيل عداد الوقت التنازلي
    useEffect(() => {
        let interval = null;
        if (isTimerActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsTimerActive(false);
        }
        return () => clearInterval(interval);
    }, [isTimerActive, timeLeft]);

    // دالة تحويل الثواني إلى صيغة (ساعة:دقيقة:ثانية)
    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    // دالة بدء العداد بلمسة سريعة
    const startTimerWithHours = (hours) => {
        setTimeLeft(hours * 3600);
        setIsTimerActive(true);
    };

    // دالة إرسال البلاغ الفوري للكنترول
    const sendIncident = (type, label, color) => {
        if (!roomNumber.trim()) {
            setStatusMessage('⚠️ يرجى تحديد رقم القاعة أو اللجنة أولاً!');
            return;
        }

        // دمج إحصائية الطلاب إذا رغب المراقب بتضمينها
        let finalNotes = customNotes.trim();
        if (presentCount || absentCount) {
            finalNotes += ` [إحصائية القاعة الفورية -> حضور: ${presentCount || 0} | غياب: ${absentCount || 0}]`;
        }

        const incidentData = {
            id: Date.now(),
            proctorId: user.id,
            proctorName: user.full_name,
            room: roomNumber,
            type: type,
            label: label,
            notes: finalNotes,
            color: color,
            time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            status: 'pending'
        };

        socket.emit('send_incident', incidentData);

        setStatusMessage(`✅ تم إرسال طلب (${label}) بنجاح.`);
        setCustomNotes(''); // تصفير الملاحظة بعد الإرسال
        setTimeout(() => setStatusMessage(''), 4000);
    };

    return (
        <div className="max-w-md mx-auto bg-[#1e293b] rounded-2xl border border-slate-700/60 shadow-2xl p-5 text-right space-y-5" dir="rtl">
            
            {/* 1. الهيدر ومستشعر حالة الاتصال */}
            <div className="flex justify-between items-center border-b border-slate-700/50 pb-3">
                <div>
                    <h2 className="text-xl font-black text-white m-0 flex items-center gap-1.5">
                        لوحة الكنترول الميداني الميكروويف
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">المساعد الميداني الذكي لمراقب اللجنة</p>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono border ${
                    isConnected ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }`}>
                    <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                    {isConnected ? 'لايف' : 'منقطع'}
                </div>
            </div>

            {/* 2. العداد التنازلي الذكي لوقت الاختبار من ذوقنا الفني */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 space-y-2.5">
                <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-blue-400" /> عداد وقت اللجنة المتبقي:
                    </span>
                    <span className="text-base font-mono font-black text-blue-400">
                        {formatTime(timeLeft)}
                    </span>
                </div>
                {/* أزرار تعيين الوقت السريع بلمسة واحدة */}
                <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => startTimerWithHours(1)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-1.5 rounded-lg border border-slate-700/30 font-medium transition-colors">ساعة واحدة</button>
                    <button onClick={() => startTimerWithHours(2)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-1.5 rounded-lg border border-slate-700/30 font-medium transition-colors">ساعتان</button>
                    <button onClick={() => setTimeLeft(0)} className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs py-1.5 rounded-lg border border-rose-500/20 transition-colors">تصفير</button>
                </div>
            </div>

            {/* 3. إدخال القاعة وإحصاء الحضور السريع */}
            <div className="grid grid-cols-3 gap-3 bg-slate-900/40 p-3 rounded-xl border border-slate-800">
                <div className="col-span-1">
                    <label className="block text-xxs font-bold text-slate-400 mb-1 text-center">رقم اللجنة</label>
                    <input
                        type="text"
                        value={roomNumber}
                        onChange={(e) => setRoomNumber(e.target.value)}
                        placeholder="104"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-1 text-white text-center font-black focus:ring-1 focus:ring-blue-500/50 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-xxs font-bold text-slate-400 mb-1 text-center">حاضر 👤</label>
                    <input
                        type="number"
                        value={presentCount}
                        onChange={(e) => setPresentCount(e.target.value)}
                        placeholder="0"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-1 text-white text-center font-bold font-mono focus:ring-1 focus:ring-blue-500/50 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-xxs font-bold text-slate-400 mb-1 text-center">غائب ❌</label>
                    <input
                        type="number"
                        value={absentCount}
                        onChange={(e) => setAbsentCount(e.target.value)}
                        placeholder="0"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-1 text-white text-center font-bold font-mono focus:ring-1 focus:ring-blue-500/50 outline-none"
                    />
                </div>
            </div>

            {/* 4. خانة الملاحظات والتاغات الحركية السريعة بلمسة يد */}
            <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">نص الملاحظة الميدانية (كتابة حرة أو تاغ سريع)</label>
                <textarea
                    rows="2"
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    placeholder="اكتب هنا توضيحك أو انقر على أحد التاغات السريعة أدناه لتعبئة الخانة فوراً..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-right resize-none transition-all"
                />
                
                {/* الأزرار التلقائية الصغيرة (مريحة وتوفر الوقت) */}
                <div className="flex flex-wrap gap-1.5">
                    {quickTags.map((tag, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => setCustomNotes(tag)}
                            className="text-xxs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded-md border border-slate-700/40 font-medium transition-all active:scale-95"
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </div>

            {/* رسائل التنبيه المؤقتة */}
            {statusMessage && (
                <div className={`p-2.5 rounded-xl text-xs text-center border ${
                    statusMessage.startsWith('⚠️') ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}>
                    {statusMessage}
                </div>
            )}

            {/* 5. الأزرار الكبيرة والملونة لطلب الكنترول مع عزل المساحات */}
            <div className="space-y-3.5 pt-1">
                
                {/* بلاغ طوارئ حمراء خطيرة */}
                <button
                    onClick={() => sendIncident('emergency', 'حالة طوارئ / شغب 🚨', 'red')}
                    className="w-full bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 font-black p-3.5 rounded-xl border border-rose-500/30 transition-all active:scale-98 flex items-center justify-between group shadow"
                >
                    <div className="flex items-center gap-2.5">
                        <span className="p-1.5 bg-rose-500/20 rounded-lg group-hover:scale-105 transition-transform">
                            <AlertTriangle className="h-4.5 w-4.5" />
                        </span>
                        <span className="text-sm">بلاغ طارئ / حالة غش أو شغب</span>
                    </div>
                    <span className="text-xxs bg-rose-500/20 px-1.5 py-0.5 rounded font-mono font-bold">🚨 طوارئ</span>
                </button>

                {/* استدعاء مشرف ممر أصفر */}
                <button
                    onClick={() => sendIncident('supervisor', 'طلب مشرف ميداني 👤', 'amber')}
                    className="w-full bg-amber-600/10 hover:bg-amber-600/20 text-amber-400 font-black p-3.5 rounded-xl border border-amber-500/30 transition-all active:scale-98 flex items-center justify-between group shadow"
                >
                    <div className="flex items-center gap-2.5">
                        <span className="p-1.5 bg-amber-500/20 rounded-lg group-hover:scale-105 transition-transform">
                            <UserCheck className="h-4.5 w-4.5" />
                        </span>
                        <span className="text-sm">طلب المشرف الميداني للممر</span>
                    </div>
                    <span className="text-xxs bg-amber-500/20 px-1.5 py-0.5 rounded font-mono font-bold">👤 مشرف</span>
                </button>

                {/* نقص دفاتر وأوراق أزرق */}
                <button
                    onClick={() => sendIncident('materials', 'نقص دفاتر / أوراق 📦', 'blue')}
                    className="w-full bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 font-black p-3.5 rounded-xl border border-blue-500/30 transition-all active:scale-98 flex items-center justify-between group shadow"
                >
                    <div className="flex items-center gap-2.5">
                        <span className="p-1.5 bg-blue-500/20 rounded-lg group-hover:scale-105 transition-transform">
                            <Package className="h-4.5 w-4.5" />
                        </span>
                        <span className="text-sm">نقص أوراق أسئلة / دفاتر إجابة</span>
                    </div>
                    <span className="text-xxs bg-blue-500/20 px-1.5 py-0.5 rounded font-mono font-bold">📦 مواد</span>
                </button>

            </div>

            {/* 6. زر دليل المراقب السريع (أكورديون منسدل مريح جداً) */}
            <div className="border-t border-slate-800 pt-2">
                <button 
                    type="button"
                    onClick={() => setShowGuide(!showGuide)}
                    className="w-full flex justify-between items-center text-xs text-slate-400 hover:text-slate-200 transition-colors py-1 outline-none"
                >
                    <span className="flex items-center gap-1 font-bold">
                        <BookOpen className="h-3.5 w-3.5 text-indigo-400" /> دليل تعليمات وأنظمة اللجان السريع
                    </span>
                    {showGuide ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                
                {showGuide && (
                    <div className="mt-2 p-3 bg-slate-900/80 border border-slate-800 rounded-xl text-xxs text-slate-300 space-y-1.5 leading-relaxed transition-all">
                        <p>🔹 <b>الجوالات:</b> يمنع منعاً باتاً دخول الجوالات مع الطلاب حتى وهي مغلقة.</p>
                        <p>🔹 <b>وقت الخروج:</b> لا يُسمح لأي طالب بمغادرة اللجنة إلا بعد مضي نصف وقت الاختبار.</p>
                        <p>🔹 <b>حالات الغش:</b> في حال ضبط غش، يتم استدعاء الكنترول فوراً دون إثارة شغب داخل القاعة.</p>
                        <p>🔹 <b>التوقيع:</b> تأكد من توقيع جميع الطلاب الحاضرين في كشف التحضير الرسمي.</p>
                    </div>
                )}
            </div>

        </div>
    );
}