import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ShieldAlert, Users, Package, Clock, Loader, CheckCircle } from 'lucide-react';
import { io } from 'socket.io-client';
import ControlDashboard from './ControlDashboard';
import SupervisorDashboard from './SupervisorDashboard';

const socket = io('http://localhost:5000');

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/control" element={<ControlDashboard />} />
        <Route path="/supervisor" element={<SupervisorDashboard />} />
        <Route path="/proctor" element={<ProctorInterface />} />
        <Route path="/" element={
          <div style={{ textAlign: 'center', marginTop: '100px', fontFamily: 'sans-serif', direction: 'rtl' }}>
            <h1 style={{ color: '#1e293b' }}>🌍 نظام ميدان العالمي لإدارة لجان الاختبارات</h1>
            <p style={{ color: '#64748b', fontSize: '16px' }}>اختر بوابة الدخول المخصصة لدورك الميداني:</p>
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '40px' }}>
              <Link to="/proctor" style={{ ...styles.linkBtn, background: '#2563eb' }}>📱 بوابة مراقبي اللجان</Link>
              <Link to="/supervisor" style={{ ...styles.linkBtn, background: '#d97706' }}>🏃‍♂️ بوابة المشرفين الميدانيين</Link>
              <Link to="/control" style={{ ...styles.linkBtn, background: '#1e293b' }}>🖥️ لوحة تحكم الكنترول المركزي</Link>
            </div>
          </div>
        } />
      </Routes>
    </Router>
  );
}

// واجهة المراقب المستقلة والنظيفة داخل اللجنة (قاعة 101 كمثال محاكي لقاعدة البيانات)
function ProctorInterface() {
  const [roomId] = useState(1); 
  const [roomName, setRoomName] = useState('جاري تحميل القاعة...');
  const [requestStatus, setRequestStatus] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:5000/api/room/${roomId}`)
      .then(res => res.json())
      .then(data => setRoomName(data.room_name));

    socket.emit('join_system', 'proctor');

    socket.on('request_status_updated', (updatedRequest) => {
      if (updatedRequest.room_id === roomId) {
        setRequestStatus(updatedRequest);
      }
    });

    return () => socket.off('request_status_updated');
  }, [roomId]);

  const sendProctorRequest = async (type) => {
    try {
      const response = await fetch('http://localhost:5000/api/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_id: roomId, request_type: type }),
      });
      const result = await response.json();
      if (result.success) {
        setRequestStatus(result.data);
      }
    } catch (error) {
      alert('تأكد من تشغيل الباك إند أولاً');
    }
  };

  return (
    <div style={{ padding: '25px', maxWidth: '450px', margin: '30px auto', fontFamily: 'sans-serif', direction: 'rtl', background: '#fff', borderRadius: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px' }}>
        <h3 style={{ margin: 0, color: '#1e293b' }}>نظام ميدان - لجنة المراقب</h3>
        <span style={{ background: '#1e293b', color: '#fff', padding: '5px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' }}>{roomName}</span>
      </div>
      <p style={{ color: '#64748b', textAlign: 'center', margin: '20px 0', fontSize: '14px' }}>اضغط على الزر المطلوب لإرسال بلاغ فوري عاجل للإدارة:</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <button style={{ ...styles.btn, background: '#dc2626' }} onClick={() => sendProctorRequest('emergency')}>
          <ShieldAlert size={24} /> <span>حالة طوارئ / صحية 🚨</span>
        </button>
        <button style={{ ...styles.btn, background: '#d97706' }} onClick={() => sendProctorRequest('support')}>
          <Users size={24} /> <span>استدعاء المشرف الميداني 👤</span>
        </button>
        <button style={{ ...styles.btn, background: '#2563eb' }} onClick={() => sendProctorRequest('materials')}>
          <Package size={24} /> <span>نقص مواد (أوراق/أقلام) 📦</span>
        </button>
      </div>

      {requestStatus && (
        <div style={{ marginTop: '25px', padding: '15px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <h4 style={{ margin: '0 0 10px 0' }}>حالة طلبك الميداني:</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px' }}>
            {requestStatus.status === 'pending' && <><Clock color="#d97706" /> <span style={{ color: '#d97706', fontWeight: 'bold' }}>قيد الانتظار في الكنترول 🟡</span></>}
            {requestStatus.status === 'processing' && <><Loader color="#2563eb" /> <span style={{ color: '#2563eb', fontWeight: 'bold' }}>جاري المتابعة الميدانية المتوجه إليك: {requestStatus.supervisor_name || 'المشرف'} 🔵</span></>}
            {requestStatus.status === 'completed' && <><CheckCircle color="#16a34a" /> <span style={{ color: '#16a34a', fontWeight: 'bold' }}>تم الحل بنجاح وإغلاق البلاغ 🟢</span></>}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  linkBtn: { padding: '15px 25px', color: '#fff', textDecoration: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' },
  btn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '18px', borderRadius: '10px', border: 'none', color: '#fff', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }
};