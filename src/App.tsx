/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, ReactNode, useMemo } from 'react';
import { 
  Plus, Trash2, Microscope, Zap, TrendingUp, RefreshCw, ClipboardList, 
  Repeat, BarChart3, CheckCircle2, X, LogIn, LogOut, User as UserIcon,
  CheckSquare, Square, Play, Pause, RotateCcw, Target, Shield, ShieldOff,
  Eye, EyeOff, Timer, Edit2, Gift, Check, History, Pin, StickyNote,
  Palette, Type, LayoutDashboard, Settings
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { 
  useStore, 
  Intention, 
  DailyBlock, 
  WeeklyReviewType, 
  Reframe, 
  Tracker, 
  QuickTask,
  FocusGoal,
  FocusSession,
  FocusSettings,
  Reward,
  PinnedAction,
  Note,
  ThemeSettings
} from './store';
import { 
  auth, db, googleProvider, signInWithPopup, onAuthStateChanged, 
  collection, doc, setDoc, deleteDoc, updateDoc, query, where, onSnapshot, 
  OperationType, handleFirestoreError, serverTimestamp, getDoc 
} from './firebase';

// --- Helpers ---

const getTodayStr = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const getStartOfWeekStr = () => {
  const now = new Date();
  const day = now.getDay(); // 0 (Sun) to 6 (Sat)
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  const monday = new Date(now.setDate(diff));
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
};

const parseDate = (dateVal: any): Date => {
  if (!dateVal) return new Date();
  if (dateVal.toDate) return dateVal.toDate();
  const d = new Date(dateVal);
  return isNaN(d.getTime()) ? new Date() : d;
};

// --- Components ---

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends React.Component<any, any> {
  state: any = { hasError: false, error: null };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      let message = "Terjadi kesalahan pada aplikasi.";
      try {
        const info = JSON.parse(this.state.error.message);
        if (info.error && info.error.toLowerCase().includes("permission")) {
          message = "Izin ditolak. Silakan periksa aturan keamanan Firebase atau coba login ulang.";
        }
      } catch (e) {
        message = this.state.error?.message || message;
      }
      
      return (
        <div className="wrap" style={{ padding: '40px', textAlign: 'center', minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '24px' }}>⚠️</div>
          <h2 style={{ color: 'var(--red)', marginBottom: '16px' }}>Ups! Ada Masalah</h2>
          <p style={{ color: 'var(--muted2)', marginBottom: '32px', lineHeight: '1.6', maxWidth: '400px', margin: '0 auto 32px' }}>{message}</p>
          <button className="btn btn-primary" style={{ alignSelf: 'center' }} onClick={() => window.location.reload()}>Muat Ulang Aplikasi</button>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

function Login() {
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Login failed", err);
      if (err.code === 'auth/unauthorized-domain') {
        setError(`Domain '${window.location.hostname}' belum diizinkan di Firebase Console. Tambahkan domain ini ke 'Authorized Domains' di setelan Authentication Firebase.`);
      } else if (err.code === 'auth/popup-blocked') {
        setError("Popup diblokir oleh browser. Izinkan popup atau buka aplikasi di tab baru.");
      } else {
        setError(err.message || "Gagal masuk. Silakan coba lagi.");
      }
    }
  };

  return (
    <div className="wrap" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card"
        style={{ textAlign: 'center', padding: '48px', maxWidth: '400px' }}
      >
        <div className="sec-icon" style={{ background: '#8b5cf615', width: '64px', height: '64px', margin: '0 auto 24px', fontSize: '24px' }}>🦅</div>
        <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>Selamat Datang di Consist</h1>
        <p style={{ color: 'var(--muted2)', fontSize: '14px', marginBottom: '32px', lineHeight: '1.6' }}>
          Masuk dengan akun Google untuk mensinkronkan data Anda di semua perangkat secara aman.
        </p>
        
        {error && (
          <div style={{ background: '#ef444415', color: 'var(--red)', padding: '12px', borderRadius: '8px', fontSize: '12px', marginBottom: '20px', textAlign: 'left', border: '1px solid #ef444430' }}>
            <strong>Error:</strong> {error}
            <div style={{ marginTop: '8px', fontSize: '11px', opacity: 0.8 }}>
              Tips: Klik tombol "Open in new tab" di pojok kanan atas preview jika popup tidak muncul.
            </div>
          </div>
        )}

        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }} onClick={handleLogin}>
          <LogIn size={18} /> Masuk dengan Google
        </button>
      </motion.div>
    </div>
  );
}

function PinnedActions() {
  const store = useStore();
  const [text, setText] = useState('');
  const [type, setType] = useState<'daily' | 'weekly'>('daily');
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!text.trim() || !store.user || adding === 'saving') return;
    setAdding('saving');
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2);
    const path = 'pinnedActions';
    try {
      await setDoc(doc(db, path, id), {
        id,
        uid: store.user.uid,
        text: text.trim(),
        type,
        completed: false,
        lastCompletedDate: '',
        createdAt: serverTimestamp()
      });
      setText('');
      setAdding(false);
    } catch (e) { 
      setAdding(true);
      handleFirestoreError(e, OperationType.WRITE, path); 
    }
  };

  const toggleComplete = async (action: PinnedAction) => {
    const path = `pinnedActions/${action.id}`;
    const today = getTodayStr();
    try {
      await updateDoc(doc(db, 'pinnedActions', action.id), { 
        completed: !action.completed,
        lastCompletedDate: !action.completed ? today : ''
      });
    } catch (e) { handleFirestoreError(e, OperationType.UPDATE, path); }
  };

  const handleDelete = async (id: string) => {
    const path = `pinnedActions/${id}`;
    try {
      await deleteDoc(doc(db, 'pinnedActions', id));
    } catch (e) { handleFirestoreError(e, OperationType.DELETE, path); }
  };

  const daily = store.pinnedActions.filter(a => a.type === 'daily');
  const weekly = store.pinnedActions.filter(a => a.type === 'weekly');

  return (
    <div className="sec" style={{ marginBottom: '32px' }}>
      <div className="sec-header">
        <div className="sec-icon" style={{ background: '#f59e0b15' }}><Pin size={16} color="var(--gold)" /></div>
        <div className="sec-title">
          <span>Pinned Actions (Fokus Utama)</span>
          <button className="btn btn-sm" onClick={() => setAdding(!adding)}>
            {adding ? <X size={14}/> : <Plus size={14}/>} {adding ? 'Batal' : 'Pin Aksi'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {adding && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="card mb-4" style={{ border: '1px solid var(--gold)' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <button 
                className={`btn ${type === 'daily' ? 'btn-primary' : ''}`} 
                style={{ flex: 1, fontSize: '11px', background: type === 'daily' ? 'var(--gold)' : 'var(--s2)', color: type === 'daily' ? '#000' : 'var(--text)' }}
                onClick={() => setType('daily')}
              >Harian</button>
              <button 
                className={`btn ${type === 'weekly' ? 'btn-primary' : ''}`} 
                style={{ flex: 1, fontSize: '11px', background: type === 'weekly' ? 'var(--gold)' : 'var(--s2)', color: type === 'weekly' ? '#000' : 'var(--text)' }}
                onClick={() => setType('weekly')}
              >Mingguan</button>
            </div>
            <input 
              className="input-field" 
              placeholder={type === 'daily' ? "Aksi krusial hari ini..." : "Target utama minggu ini..."} 
              value={text} 
              onChange={e => setText(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', background: 'var(--gold)', color: '#000' }} 
              onClick={handleAdd}
              disabled={adding === 'saving'}
            >
              {adding === 'saving' ? 'Menyimpan...' : 'Pin Sekarang'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="card" style={{ background: 'rgba(245, 158, 11, 0.03)', border: '1px dashed rgba(245, 158, 11, 0.2)' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gold)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>📌 Hari Ini</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {daily.map(action => (
              <div key={action.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: 'var(--s1)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div onClick={() => toggleComplete(action)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  {action.completed ? <CheckCircle2 size={16} color="var(--green)" /> : <Square size={16} color="var(--muted)" />}
                </div>
                <span style={{ flex: 1, fontSize: '13px', textDecoration: action.completed ? 'line-through' : 'none', color: action.completed ? 'var(--muted2)' : 'var(--text)' }}>{action.text}</span>
                <button style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer' }} onClick={() => handleDelete(action.id)}><Trash2 size={14}/></button>
              </div>
            ))}
            {daily.length === 0 && <div style={{ fontSize: '11px', color: 'var(--muted2)', textAlign: 'center', padding: '10px' }}>Belum ada aksi harian yang di-pin.</div>}
          </div>
        </div>

        <div className="card" style={{ background: 'rgba(245, 158, 11, 0.03)', border: '1px dashed rgba(245, 158, 11, 0.2)' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gold)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>📌 Minggu Ini</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {weekly.map(action => (
              <div key={action.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: 'var(--s1)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div onClick={() => toggleComplete(action)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  {action.completed ? <CheckCircle2 size={16} color="var(--green)" /> : <Square size={16} color="var(--muted)" />}
                </div>
                <span style={{ flex: 1, fontSize: '13px', textDecoration: action.completed ? 'line-through' : 'none', color: action.completed ? 'var(--muted2)' : 'var(--text)' }}>{action.text}</span>
                <button style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer' }} onClick={() => handleDelete(action.id)}><Trash2 size={14}/></button>
              </div>
            ))}
            {weekly.length === 0 && <div style={{ fontSize: '11px', color: 'var(--muted2)', textAlign: 'center', padding: '10px' }}>Belum ada target mingguan yang di-pin.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function ThemeCustomizer() {
  const store = useStore();
  const [open, setOpen] = useState(false);

  const accentColors = [
    { name: 'Violet', value: '#8b5cf6' },
    { name: 'Cyan', value: '#06b6d4' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Emerald', value: '#10b981' },
    { name: 'Rose', value: '#f43f5e' },
    { name: 'Amber', value: '#f59e0b' },
  ];

  const fonts = [
    { name: 'Instrument Sans', value: "'Instrument Sans', sans-serif" },
    { name: 'Clash Display', value: "'Clash Display', sans-serif" },
    { name: 'DM Mono', value: "'DM Mono', monospace" },
    { name: 'Inter', value: "'Inter', sans-serif" },
  ];

  const updateTheme = async (settings: Partial<ThemeSettings>) => {
    if (!store.user) return;
    const current = store.themeSettings || { accentColor: '#8b5cf6', fontFamily: "'Instrument Sans', sans-serif" };
    const newSettings = { ...current, ...settings, uid: store.user.uid };
    try {
      await setDoc(doc(db, 'themeSettings', store.user.uid), newSettings);
    } catch (e) { handleFirestoreError(e, OperationType.WRITE, 'themeSettings'); }
  };

  return (
    <div className="sec">
      <div className="sec-header">
        <div className="sec-icon" style={{ background: '#ec489915' }}><Palette size={16} color="#ec4899" /></div>
        <div className="sec-title">
          <span>Kustomisasi Tampilan</span>
          <button className="btn btn-sm" onClick={() => setOpen(!open)}>
            {open ? <X size={14}/> : <Settings size={14}/>} {open ? 'Tutup' : 'Buka Pengaturan'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="card" style={{ overflow: 'hidden' }}>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <div className="form-label mb-4">Warna Aksen Utama</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {accentColors.map(c => (
                    <button 
                      key={c.value} 
                      onClick={() => updateTheme({ accentColor: c.value })}
                      style={{ 
                        padding: '12px', 
                        borderRadius: '12px', 
                        background: c.value + '15', 
                        border: `1px solid ${store.themeSettings?.accentColor === c.value ? c.value : 'var(--border)'}`,
                        color: c.value,
                        fontSize: '11px',
                        fontWeight: 600,
                        textAlign: 'center'
                      }}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="form-label mb-4">Pilihan Font</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {fonts.map(f => (
                    <button 
                      key={f.value} 
                      onClick={() => updateTheme({ fontFamily: f.value })}
                      style={{ 
                        padding: '12px', 
                        borderRadius: '12px', 
                        background: 'var(--s2)', 
                        border: `1px solid ${store.themeSettings?.fontFamily === f.value ? 'var(--primary)' : 'var(--border)'}`,
                        fontFamily: f.value,
                        fontSize: '13px',
                        textAlign: 'left'
                      }}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AdvancedAnalytics() {
  const store = useStore();
  const [timeframe, setTimeframe] = useState<'monthly' | 'yearly'>('monthly');

  const analyticsData = useMemo(() => {
    const stats = store.dailyStats;
    if (timeframe === 'monthly') {
      // Group by month for the current year
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const currentYear = new Date().getFullYear();
      
      return months.map((name, index) => {
        const monthStats = stats.filter(s => {
          const d = new Date(s.date);
          return d.getMonth() === index && d.getFullYear() === currentYear;
        });
        
        const totalMain = monthStats.reduce((acc, s) => acc + (s.mainCompleted || 0), 0);
        const totalQuick = monthStats.reduce((acc, s) => acc + (s.quickCompleted || 0), 0);
        
        return { name, main: totalMain, quick: totalQuick };
      });
    } else {
      // Group by year
      const years = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - 2 + i);
      return years.map(year => {
        const yearStats = stats.filter(s => new Date(s.date).getFullYear() === year);
        const totalMain = yearStats.reduce((acc, s) => acc + (s.mainCompleted || 0), 0);
        const totalQuick = yearStats.reduce((acc, s) => acc + (s.quickCompleted || 0), 0);
        return { name: year.toString(), main: totalMain, quick: totalQuick };
      });
    }
  }, [store.dailyStats, timeframe]);

  return (
    <div className="sec">
      <div className="sec-header">
        <div className="sec-icon" style={{ background: '#3b82f615' }}><LayoutDashboard size={16} color="#3b82f6" /></div>
        <div className="sec-title">
          <span>Dashboard Analitik Lanjutan</span>
          <div className="flex-row">
            <button className={`btn btn-sm ${timeframe === 'monthly' ? 'btn-primary' : ''}`} onClick={() => setTimeframe('monthly')}>Bulanan</button>
            <button className={`btn btn-sm ${timeframe === 'yearly' ? 'btn-primary' : ''}`} onClick={() => setTimeframe('yearly')}>Tahunan</button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="card" style={{ padding: '24px', height: '320px' }}>
          <div className="form-label mb-6">Tren Penyelesaian Tugas Utama</div>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analyticsData}>
              <defs>
                <linearGradient id="colorMain" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--muted2)' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--muted2)' }} />
              <Tooltip contentStyle={{ background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: '8px' }} />
              <Area type="monotone" dataKey="main" stroke="var(--primary)" fillOpacity={1} fill="url(#colorMain)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding: '24px', height: '320px' }}>
          <div className="form-label mb-6">Perbandingan Tugas Utama vs Cepat</div>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analyticsData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--muted2)' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--muted2)' }} />
              <Tooltip contentStyle={{ background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: '8px' }} />
              <Bar dataKey="main" name="Utama" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="quick" name="Cepat" fill="var(--muted)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function Notepad() {
  const store = useStore();
  const [content, setContent] = useState('');
  const [adding, setAdding] = useState(false);
  const [selectedColor, setSelectedColor] = useState('var(--s2)');

  const colors = [
    'var(--s2)',
    'rgba(16, 185, 129, 0.1)', // Greenish
    'rgba(59, 130, 246, 0.1)', // Bluish
    'rgba(245, 158, 11, 0.1)', // Goldish
    'rgba(239, 68, 68, 0.1)',  // Reddish
  ];

  const handleAdd = async () => {
    if (!content.trim() || !store.user || adding === 'saving') return;
    setAdding('saving');
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2);
    const path = 'notes';
    try {
      await setDoc(doc(db, path, id), {
        id,
        uid: store.user.uid,
        content: content.trim(),
        color: selectedColor,
        createdAt: serverTimestamp()
      });
      setContent('');
      setAdding(false);
    } catch (e) { 
      setAdding(true);
      handleFirestoreError(e, OperationType.WRITE, path); 
    }
  };

  const handleDelete = async (id: string) => {
    const path = `notes/${id}`;
    try {
      await deleteDoc(doc(db, 'notes', id));
    } catch (e) { handleFirestoreError(e, OperationType.DELETE, path); }
  };

  return (
    <div className="sec">
      <div className="sec-header">
        <div className="sec-icon" style={{ background: '#8b5cf615' }}><StickyNote size={16} color="var(--primary)" /></div>
        <div className="sec-title">
          <span>Notepad (Catatan Penting)</span>
          <button className="btn btn-sm" onClick={() => setAdding(!adding)}>
            {adding ? <X size={14}/> : <Plus size={14}/>} {adding ? 'Batal' : 'Tulis Catatan'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {adding && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="card mb-6">
            <textarea 
              className="input-field" 
              rows={4} 
              placeholder="Tulis hal penting di sini..." 
              value={content} 
              onChange={e => setContent(e.target.value)}
              style={{ background: selectedColor, border: '1px solid var(--border)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {colors.map(c => (
                  <div 
                    key={c} 
                    onClick={() => setSelectedColor(c)}
                    style={{ 
                      width: '20px', 
                      height: '20px', 
                      borderRadius: '4px', 
                      background: c, 
                      cursor: 'pointer',
                      border: selectedColor === c ? '2px solid var(--primary)' : '1px solid var(--border)'
                    }} 
                  />
                ))}
              </div>
              <button className="btn btn-primary" onClick={handleAdd} disabled={adding === 'saving'}>
                {adding === 'saving' ? 'Menyimpan...' : 'Simpan Catatan'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid sm:grid-cols-2 gap-4">
        {store.notes.sort((a,b) => parseDate(b.createdAt).getTime() - parseDate(a.createdAt).getTime()).map(note => (
          <motion.div 
            key={note.id} 
            layout
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="card" 
            style={{ background: note.color, border: '1px solid var(--border)', position: 'relative', padding: '16px' }}
          >
            <button 
              style={{ position: 'absolute', top: '8px', right: '8px', background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}
              onClick={() => handleDelete(note.id)}
            >
              <Trash2 size={12} />
            </button>
            <div style={{ fontSize: '13px', lineHeight: '1.6', whiteSpace: 'pre-wrap', color: 'var(--text)' }}>
              {note.content}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--muted2)', marginTop: '12px' }}>
              {parseDate(note.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </div>
          </motion.div>
        ))}
        {store.notes.length === 0 && !adding && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '32px', color: 'var(--muted2)', fontSize: '12px', border: '1px dashed var(--border)', borderRadius: '12px' }}>
            Belum ada catatan penting. Klik "Tulis Catatan" untuk memulai.
          </div>
        )}
      </div>
    </div>
  );
}

function Navbar() {
  const store = useStore();
  const user = store.user;

  const handleLogout = async () => {
    try { await auth.signOut(); }
    catch (e) { console.error("Logout error", e); }
  };

  const handleSeed = async () => {
    if (user) {
      await seedUserData(user.uid);
    }
  };

  if (!user) return null;

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--muted2)' }}>
          <UserIcon size={14} />
          <span>{user.email}</span>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '8px' }}>
        <button className="btn btn-sm" onClick={handleSeed} style={{ background: 'var(--s2)', border: '1px solid var(--border)' }}>
          <RefreshCw size={14} /> Masukkan Default
        </button>
        <button className="btn btn-sm" onClick={handleLogout}>
          <LogOut size={14} /> Keluar
        </button>
      </div>
    </div>
  );
}

function PomodoroTimer() {
  const store = useStore();
  const settings = store.focusSettings || { workDuration: 25, breakDuration: 5 };
  const [timeLeft, setTimeLeft] = useState(settings.workDuration * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ work: settings.workDuration, break: settings.breakDuration });

  // Sync timeLeft when settings change (if not active)
  useEffect(() => {
    if (!isActive) {
      setTimeLeft(mode === 'work' ? settings.workDuration * 60 : settings.breakDuration * 60);
    }
  }, [settings.workDuration, settings.breakDuration, mode, isActive]);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      handleComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleComplete = async () => {
    if (!store.user) return;
    const duration = mode === 'work' ? settings.workDuration : settings.breakDuration;
    const id = Math.random().toString(36).substring(7);
    try {
      await setDoc(doc(db, 'focusSessions', id), {
        id,
        uid: store.user.uid,
        duration,
        type: mode,
        createdAt: serverTimestamp()
      });
      const nextMode = mode === 'work' ? 'break' : 'work';
      setMode(nextMode);
      setTimeLeft((nextMode === 'work' ? settings.workDuration : settings.breakDuration) * 60);
    } catch (e) { console.error(e); }
  };

  const toggle = () => setIsActive(!isActive);
  const reset = () => {
    setIsActive(false);
    setTimeLeft(mode === 'work' ? settings.workDuration * 60 : settings.breakDuration * 60);
  };

  const handleSaveSettings = async () => {
    if (!store.user) return;
    const workVal = Math.max(1, Math.min(120, editForm.work));
    const breakVal = Math.max(1, Math.min(60, editForm.break));
    const path = 'focusSettings';
    try {
      await setDoc(doc(db, path, store.user.uid), {
        ...settings,
        uid: store.user.uid,
        workDuration: workVal,
        breakDuration: breakVal
      }, { merge: true });
      setIsEditing(false);
    } catch (e) { handleFirestoreError(e, OperationType.WRITE, path); }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="pomo-widget">
      <div className="pomo-display">
        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', textAlign: 'center' }}>CUSTOMIZE DURATIONS</div>
            
            <div className="flex-row" style={{ gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '10px', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>WORK (MIN)</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={editForm.work} 
                  onChange={e => setEditForm({...editForm, work: parseInt(e.target.value) || 0})}
                  style={{ textAlign: 'center' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '10px', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>BREAK (MIN)</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={editForm.break} 
                  onChange={e => setEditForm({...editForm, break: parseInt(e.target.value) || 0})}
                  style={{ textAlign: 'center' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-sm" style={{ flex: 1 }} onClick={() => setIsEditing(false)}>Batal</button>
              <button className="btn btn-sm btn-primary" style={{ flex: 1 }} onClick={handleSaveSettings}>Simpan</button>
            </div>
          </div>
        ) : (
          <>
            <div className="pomo-time" onClick={() => setIsEditing(true)} style={{ cursor: 'pointer' }}>
              {formatTime(timeLeft)}
            </div>
            <div className="pomo-status">
              <span style={{ color: mode === 'work' ? 'var(--primary)' : 'var(--green)', fontWeight: 600 }}>
                {mode === 'work' ? 'Deep Work Session' : 'Short Break'}
              </span>
              <button 
                style={{ background: 'none', border: 'none', color: 'var(--muted)', marginLeft: '8px', cursor: 'pointer' }}
                onClick={() => { setEditForm({ work: settings.workDuration, break: settings.breakDuration }); setIsEditing(true); }}
              >
                <Settings size={12} />
              </button>
            </div>
          </>
        )}
      </div>
      {!isEditing && (
        <div className="pomo-controls">
          <button className={`pomo-btn ${isActive ? 'active' : ''}`} onClick={toggle}>
            {isActive ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button className="pomo-btn" onClick={reset}>
            <RotateCcw size={20} />
          </button>
          <button 
            className="pomo-btn" 
            onClick={() => {
              const nextMode = mode === 'work' ? 'break' : 'work';
              setMode(nextMode);
              setIsActive(false);
              setTimeLeft((nextMode === 'work' ? settings.workDuration : settings.breakDuration) * 60);
            }}
            title="Switch Mode"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      )}
    </div>
  );
}


function BlocklistManager() {
  const store = useStore();
  const [url, setUrl] = useState('');

  const handleAdd = async () => {
    if (!url.trim() || !store.user) return;
    const currentList = store.focusSettings?.blocklist || [];
    if (currentList.includes(url.trim())) return;

    const id = store.user.uid;
    try {
      await setDoc(doc(db, 'focusSettings', id), {
        uid: store.user.uid,
        blocklist: [...currentList, url.trim()],
        workDuration: 25,
        breakDuration: 5
      }, { merge: true });
      setUrl('');
    } catch (e) { console.error(e); }
  };

  const remove = async (item: string) => {
    if (!store.user) return;
    const currentList = store.focusSettings?.blocklist || [];
    try {
      await setDoc(doc(db, 'focusSettings', store.user.uid), {
        blocklist: currentList.filter(i => i !== item)
      }, { merge: true });
    } catch (e) { console.error(e); }
  };

  return (
    <div className="sec">
      <div className="sec-header">
        <div className="sec-icon" style={{ background: '#ef444415' }}><Shield size={16} color="var(--red)" /></div>
        <div className="sec-title">Distraction Blocklist</div>
        <div className="sec-ref">Hapus Gangguan Digital</div>
      </div>
      <div className="card">
        <div className="flex-row mb-4">
          <input 
            className="input-field" 
            style={{ marginBottom: 0 }} 
            placeholder="Tambah URL atau App (misal: facebook.com)" 
            value={url} 
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <button className="btn btn-primary" onClick={handleAdd}>Tambah</button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {store.focusSettings?.blocklist?.map(item => (
            <div key={item} className="chip" style={{ background: 'var(--s2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px' }}>
              {item}
              <button onClick={() => remove(item)} style={{ color: 'var(--muted2)' }}><X size={12}/></button>
            </div>
          ))}
          {(!store.focusSettings?.blocklist || store.focusSettings.blocklist.length === 0) && (
            <div style={{ fontSize: '12px', color: 'var(--muted2)', padding: '8px 0' }}>Belum ada daftar blokir.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function FocusStats() {
  const store = useStore();
  const today = getTodayStr();
  
  const sessions = store.focusSessions;
  const workSessions = sessions.filter(s => s.type === 'work');
  
  // Daily stats for today
  const todaySessions = workSessions.filter(s => {
    const d = s.createdAt?.toDate ? s.createdAt.toDate() : new Date(s.createdAt);
    const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return dStr === today;
  });
  const todayMinutes = todaySessions.reduce((acc, s) => acc + s.duration, 0);
  
  const totalMinutes = workSessions.reduce((acc, s) => acc + s.duration, 0);
  const avgDuration = workSessions.length > 0 ? totalMinutes / workSessions.length : 0;
  
  // Weekly/Daily History Stats
  const dailyHistory = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });

    return last7Days.map(dateStr => {
      const daySessions = workSessions.filter(s => {
        const d = s.createdAt?.toDate ? s.createdAt.toDate() : new Date(s.createdAt);
        const sDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return sDateStr === dateStr;
      });
      const minutes = daySessions.reduce((acc, s) => acc + s.duration, 0);
      return {
        date: parseDate(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        minutes,
        fullDate: dateStr
      };
    });
  }, [workSessions]);

  const weeklyMinutes = dailyHistory.reduce((acc, d) => acc + d.minutes, 0);

  return (
    <div className="sec">
      <div className="sec-header">
        <div className="sec-icon" style={{ background: '#8b5cf615' }}><BarChart3 size={16} color="var(--elang)" /></div>
        <div className="sec-title">Analisis Fokus & Deep Work</div>
      </div>
      
      <div className="stats-grid">
        <div className="card" style={{ margin: 0, padding: '16px' }}>
          <div style={{ fontSize: '10px', color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Deep Work Hari Ini</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--primary)' }}>{todayMinutes} <span style={{ fontSize: '12px', fontWeight: 400 }}>menit</span></div>
          <div style={{ fontSize: '11px', color: 'var(--muted2)', marginTop: '4px' }}>Target: {store.focusGoals[0]?.dailyMinutes || 0}m</div>
        </div>
        <div className="card" style={{ margin: 0, padding: '16px' }}>
          <div style={{ fontSize: '10px', color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>7 Hari Terakhir</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--koala)' }}>{weeklyMinutes} <span style={{ fontSize: '12px', fontWeight: 400 }}>menit</span></div>
          <div style={{ fontSize: '11px', color: 'var(--muted2)', marginTop: '4px' }}>Minggu ini</div>
        </div>
        <div className="card" style={{ margin: 0, padding: '16px' }}>
          <div style={{ fontSize: '10px', color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Rata-rata Sesi</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--gold)' }}>{avgDuration.toFixed(0)} <span style={{ fontSize: '12px', fontWeight: 400 }}>menit</span></div>
          <div style={{ fontSize: '11px', color: 'var(--muted2)', marginTop: '4px' }}>Per sesi kerja</div>
        </div>
        <div className="card" style={{ margin: 0, padding: '16px' }}>
          <div style={{ fontSize: '10px', color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Total Sesi</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--green)' }}>{workSessions.length} <span style={{ fontSize: '12px', fontWeight: 400 }}>sesi</span></div>
          <div style={{ fontSize: '11px', color: 'var(--muted2)', marginTop: '4px' }}>Sepanjang waktu</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '16px', padding: '24px' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <History size={16} color="var(--primary)" />
          Tren Deep Work (7 Hari Terakhir)
        </div>
        <div style={{ width: '100%', height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyHistory}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: 'var(--muted2)' }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: 'var(--muted2)' }}
                unit="m"
              />
              <Tooltip 
                contentStyle={{ background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
                cursor={{ fill: 'var(--s2)' }}
              />
              <Bar dataKey="minutes" radius={[4, 4, 0, 0]}>
                {dailyHistory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fullDate === today ? 'var(--primary)' : 'var(--border2)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function DailyRewards() {
  const store = useStore();
  const [newReward, setNewReward] = useState('');

  const handleAdd = async () => {
    if (newReward.trim() && store.user) {
      const id = Date.now().toString(36) + Math.random().toString(36).substring(2);
      const path = 'rewards';
      try {
        await setDoc(doc(db, path, id), {
          id,
          uid: store.user.uid,
          text: newReward,
          completed: false,
          lastCompletedDate: '',
          createdAt: serverTimestamp()
        });
        setNewReward('');
      } catch (e) { handleFirestoreError(e, OperationType.WRITE, path); }
    }
  };

  const toggleReward = async (reward: Reward) => {
    const path = `rewards/${reward.id}`;
    const today = getTodayStr();
    try {
      await updateDoc(doc(db, 'rewards', reward.id), { 
        completed: !reward.completed,
        lastCompletedDate: !reward.completed ? today : ''
      });
    } catch (e) { handleFirestoreError(e, OperationType.UPDATE, path); }
  };

  const deleteReward = async (id: string) => {
    const path = 'rewards';
    try { await deleteDoc(doc(db, path, id)); }
    catch (e) { handleFirestoreError(e, OperationType.DELETE, path); }
  };

  return (
    <div className="sec">
      <div className="sec-header">
        <div className="sec-icon" style={{ background: '#f59e0b15' }}><Gift size={16} color="var(--gold)" /></div>
        <div className="sec-title">Daily Rewards — Self-Motivation</div>
      </div>
      
      <div className="card" style={{ padding: '16px' }}>
        <div className="reward-input-group">
          <input 
            className="input-field" 
            style={{ marginBottom: 0 }} 
            placeholder="Hadiah: misal Instagram 10 menit..." 
            value={newReward} 
            onChange={e => setNewReward(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <button className="btn btn-primary" onClick={handleAdd}><Plus size={18}/></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {store.rewards.map(reward => (
            <div key={reward.id} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              padding: '10px', 
              background: 'var(--s2)', 
              borderRadius: '8px',
              border: '1px solid var(--border)',
              opacity: reward.completed ? 0.6 : 1
            }}>
              <button 
                onClick={() => toggleReward(reward)}
                style={{ 
                  width: '20px', height: '20px', 
                  borderRadius: '6px', 
                  border: '2px solid',
                  borderColor: reward.completed ? 'var(--green)' : 'var(--muted)',
                  background: reward.completed ? 'var(--green)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white'
                }}
              >
                {reward.completed && <Check size={14} />}
              </button>
              <span style={{ 
                flex: 1, 
                fontSize: '13px', 
                textDecoration: reward.completed ? 'line-through' : 'none',
                color: reward.completed ? 'var(--muted2)' : 'var(--text)'
              }}>
                {reward.text}
              </span>
              <button onClick={() => deleteReward(reward.id)} style={{ color: 'var(--muted)' }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {store.rewards.length === 0 && (
            <div style={{ textAlign: 'center', padding: '12px', fontSize: '11px', color: 'var(--muted2)' }}>
              Tentukan hadiah untuk kerja kerasmu hari ini.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


function Hero() {
  const store = useStore();
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      className="hero"
    >
      <div className="hero-eyebrow">
        <span>Sistem Harian Personal — Dikalibrasi untuk Kondisimu</span>
      </div>
      <h1>Dari UMR<br />ke <span>Top 1%</span><br />Nasional</h1>
      <div className="hero-context">
        <span className="ctx-tag work">💼 Kerja + Survey</span>
        <span className="ctx-tag study">📚 Kuliah Online</span>
        <span className="ctx-tag yt">🎵 YouTube Music</span>
        <span className="ctx-tag family">👨‍👩‍👧 Keluarga + Anak</span>
      </div>
      <p className="hero-desc">
        Kamu punya 2+ jam/hari untuk YouTube di luar semua itu. Itu cukup — jika digunakan dengan sistem yang tepat, bukan dengan willpower.
      </p>
    </motion.div>
  );
}

function CoveyMatrix() {
  const store = useStore();
  const [adding, setAdding] = useState<string | null>(null);
  const [text, setText] = useState('');

  const handleAdd = async (quadrant: 'q1' | 'q2' | 'q3' | 'q4') => {
    if (!text.trim() || !store.user) return;
    const id = Math.random().toString(36).substring(7);
    const path = 'matrixItems';
    try {
      await setDoc(doc(db, path, id), { id, uid: store.user.uid, quadrant, text: text.trim() });
      setText('');
      setAdding(null);
    } catch (e) { handleFirestoreError(e, OperationType.WRITE, path); }
  };

  const handleDelete = async (id: string) => {
    const path = `matrixItems/${id}`;
    try { await deleteDoc(doc(db, 'matrixItems', id)); }
    catch (e) { handleFirestoreError(e, OperationType.DELETE, path); }
  };

  const getItems = (q: string) => store.matrixItems.filter(i => i.quadrant === q);

  return (
    <div className="sec">
      <div className="sec-label">Prioritas Energi — Covey Matrix</div>
      <div className="matrix">
        {[
          { id: 'q1', label: 'Q1 · Lakukan Sekarang', title: 'Penting + Mendesak', color: 'var(--singa)' },
          { id: 'q2', label: 'Q2 · Jadwalkan', title: 'Penting + Tidak Mendesak', color: 'var(--koala)' },
          { id: 'q3', label: 'Q3 · Batasi', title: 'Tidak Penting + Mendesak', color: 'var(--gold)' },
          { id: 'q4', label: 'Q4 · Eliminasi', title: 'Tidak Penting + Tidak Mendesak', color: 'var(--muted)' },
        ].map(q => (
          <div key={q.id} className={`mx-card ${q.id}`}>
            <div className="mx-label">{q.label}</div>
            <div className="mx-title">{q.title}</div>
            <ul className="mx-items">
              {getItems(q.id).map(item => (
                <li key={item.id}>
                  {item.text}
                  <button onClick={() => handleDelete(item.id)} style={{ background: 'transparent', border: 'none', color: 'var(--muted2)', cursor: 'pointer', marginLeft: 'auto' }}><X size={10}/></button>
                </li>
              ))}
            </ul>
            {adding === q.id ? (
              <div style={{ marginTop: '10px' }}>
                <input className="input-field" style={{ fontSize: '11px', padding: '6px' }} value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd(q.id as any)} autoFocus />
                <div className="flex-row"><button className="btn btn-sm btn-primary" onClick={() => handleAdd(q.id as any)}>Simpan</button></div>
              </div>
            ) : (
              <button className="btn btn-sm" style={{ marginTop: '10px', width: '100%', fontSize: '10px' }} onClick={() => setAdding(q.id)}><Plus size={10}/> Tambah Item</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TriggerProtocol() {
  const store = useStore();
  return (
    <div className="sec">
      <div className="sec-label">Protokol Trigger — Saat Sendiri + Stres</div>
      <div className="trigger-flow">
        {store.triggerSteps.sort((a,b) => a.num.localeCompare(b.num)).map(step => (
          <div key={step.id} className="tf-row">
            <div className="tf-num">{step.num}</div>
            <div className="tf-content">
              <h4>{step.title}</h4>
              <p>{step.content}</p>
              {step.ii && (
                <div className="ii-box">
                  <strong>Implementation Intention</strong>
                  {step.ii}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="warn-box" style={{ marginTop: '12px' }}>
        <div className="warn-title">⚠ Catatan Penting</div>
        <div className="warn-body">
          Protokol ini adalah langkah pertama. Jika dalam 30 hari sistem ini tidak cukup membantu, pertimbangkan serius untuk berkonsultasi dengan psikolog. Bukan karena ada yang salah denganmu — tapi karena hambatan ini nyata dan layak mendapat bantuan profesional. Ini sama seperti ke dokter untuk masalah fisik.
        </div>
      </div>
    </div>
  );
}

function WeekendSystem() {
  return (
    <div className="sec">
      <div className="sec-label">Sabtu & Minggu — Berbeda dari Weekday</div>
      <div className="energy-week">
        {[
          { name: 'Sen', tasks: [{t: 'YT Produksi', c: 'dt-yt'}, {t: 'Kerja', c: 'dt-work'}, {t: 'Kuliah', c: 'dt-study'}] },
          { name: 'Sel', tasks: [{t: 'YT Upload', c: 'dt-yt'}, {t: 'Kerja', c: 'dt-work'}, {t: 'Kuliah', c: 'dt-study'}] },
          { name: 'Rab', tasks: [{t: 'YT Produksi', c: 'dt-yt'}, {t: 'Kerja', c: 'dt-work'}, {t: 'Kuliah', c: 'dt-study'}] },
          { name: 'Kam', tasks: [{t: 'YT Analisa', c: 'dt-yt'}, {t: 'Kerja', c: 'dt-work'}, {t: 'Kuliah', c: 'dt-study'}] },
          { name: 'Jum', tasks: [{t: 'YT Produksi', c: 'dt-yt'}, {t: 'Kerja', c: 'dt-work'}, {t: 'dt-rest', c: 'dt-rest'}] },
          { name: 'Sab', tasks: [{t: 'YT 3 jam', c: 'dt-yt'}, {t: 'Kuliah', c: 'dt-study'}, {t: 'Keluarga', c: 'dt-rest'}] },
          { name: 'Min', tasks: [{t: 'Keluarga', c: 'dt-rest'}, {t: 'Review', c: 'dt-review'}, {t: 'Istirahat', c: 'dt-rest'}] },
        ].map(day => (
          <div key={day.name} className="day-col">
            <div className="day-name">{day.name}</div>
            <div className="day-tasks">
              {day.tasks.map((task, i) => (
                <div key={i} className={`day-task ${task.c}`}>{task.t}</div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="card" style={{ marginTop: '12px' }}>
        <div style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: '1.7' }}>
          <strong style={{ color: 'var(--text)' }}>Sabtu:</strong> Sesi YouTube terpanjang — 3 jam tanpa gangguan. Buat 2–3 video sekaligus (batch production). Jauh lebih efisien dari produksi harian.<br />
          <strong style={{ color: 'var(--text)' }}>Minggu:</strong> Hari keluarga murni + review mingguan 15 menit. Tidak ada produksi. Koala butuh hari reset penuh.
        </div>
      </div>
    </div>
  );
}

function ResearchBase() {
  const research = [
    { 
      id: 'c1', 
      label: 'Gollwitzer, 1999 · Psych Review', 
      title: 'Implementation Intentions', 
      body: 'Format "Jika X → maka Y" meningkatkan follow-through 2–3x dibanding goal biasa. Bekerja di level non-conscious habit loop.'
    },
    { 
      id: 'c2', 
      label: 'Locke & Latham, 2002', 
      title: 'Goal-Setting Theory', 
      body: 'Goal yang spesifik + menantang + ada feedback menghasilkan performa 16–25% lebih tinggi secara konsisten.'
    },
    { 
      id: 'c3', 
      label: 'Beaty et al., 2016 · PNAS', 
      title: 'Default Mode Network', 
      body: 'Otak memproses solusi kreatif saat tidak aktif, TAPI hanya jika masalah sudah di-load dulu via kerja keras sadar.'
    },
    { 
      id: 'c4', 
      label: 'Graybiel, 2008', 
      title: 'Habit Loop & Basal Ganglia', 
      body: 'Rutinitas yang diulang 60–90 hari menjadi otomatis — membebaskan otak sadar untuk kerja kreatif.'
    }
  ];

  return (
    <div className="sec">
      <div className="sec-header">
        <div className="sec-icon" style={{ background: '#8b5cf615' }}><Microscope size={16} color="var(--elang)" /></div>
        <div className="sec-title">Landasan Riset yang Valid</div>
        <div className="sec-ref">Peer-reviewed</div>
      </div>
      <div className="research-grid">
        {research.map((r, idx) => (
          <motion.div key={r.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }} className={`r-card ${r.id}`}>
            <div className="r-label">{r.label}</div>
            <div className="r-title">{r.title}</div>
            <div className="r-body">{r.body}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ImplementationIntentions() {
  const store = useStore();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ when: 'PAGI', trigger: '', response: '', note: '' });

  const handleAdd = async () => {
    if (form.trigger && form.response && store.user && adding !== 'saving') {
      const id = Date.now().toString(36) + Math.random().toString(36).substring(2);
      const path = 'intentions';
      setAdding('saving');
      try {
        await setDoc(doc(db, path, id), { ...form, id, uid: store.user.uid, createdAt: serverTimestamp() });
        setForm({ when: 'PAGI', trigger: '', response: '', note: '' });
        setAdding(false);
      } catch (e) { 
        setAdding(true);
        handleFirestoreError(e, OperationType.WRITE, path); 
      }
    }
  };

  const handleDelete = async (id: string) => {
    const path = 'intentions';
    try { await deleteDoc(doc(db, path, id)); }
    catch (e) { handleFirestoreError(e, OperationType.DELETE, path); }
  };

  return (
    <div className="sec">
      <div className="sec-header">
        <div className="sec-icon" style={{ background: '#06b6d415' }}><Zap size={16} color="var(--koala)" /></div>
        <div className="sec-title">
          <span>Implementation Intentions Harian</span>
          <button className="btn btn-sm" onClick={() => setAdding(!adding)}>
            {adding ? <X size={14}/> : <Plus size={14}/>} {adding ? 'Batal' : 'Tambah'}
          </button>
        </div>
      </div>
      <div className="ii-builder">
        <div className="ii-header">Format: "Jika [TRIGGER] → maka [AKSI]"</div>
        <AnimatePresence>
          {adding && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="ii-row overflow-hidden" style={{ background: 'var(--s2)' }}>
              <select className="input-field" value={form.when} onChange={e => setForm({...form, when: e.target.value})}>
                <option>PAGI</option><option>SIANG</option><option>SORE</option><option>MALAM</option><option>BURNOUT</option>
              </select>
              <div>
                <input className="input-field" placeholder="Jika [TRIGGER]..." value={form.trigger} onChange={e => setForm({...form, trigger: e.target.value})} />
                <input className="input-field" placeholder="Maka [AKSI]..." value={form.response} onChange={e => setForm({...form, response: e.target.value})} />
                <input className="input-field" placeholder="Catatan karakter (Opsional)" value={form.note} onChange={e => setForm({...form, note: e.target.value})} />
                <div className="flex-row mt-4">
                  <button className="btn btn-primary" onClick={handleAdd} disabled={adding === 'saving'}>
                    {adding === 'saving' ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence initial={false}>
          {store.intentions.map((item) => (
            <motion.div key={item.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="ii-row">
              <div className="ii-when">{item.when}</div>
              <div className="ii-action">
                Jika <span className="trigger">{item.trigger}</span>, maka aku akan <span className="response">{item.response}</span>
                {item.note && <div className="ii-note">{item.note}</div>}
              </div>
              <button className="btn btn-danger" style={{ padding: '6px' }} onClick={() => handleDelete(item.id)}><Trash2 size={14}/></button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function IncomeLadder() {
  const store = useStore();
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ id: '', stageNum: '', stageName: '', skill: '', income: '' });
  
  const handleStageChange = async (id: string) => {
    store.setCurrentLadderStage(id);
    if (store.user) {
      const path = `users/${store.user.uid}`;
      try { await updateDoc(doc(db, 'users', store.user.uid), { currentLadderStage: id }); }
      catch (e) { handleFirestoreError(e, OperationType.UPDATE, path); }
    }
  };

  const handleSave = async () => {
    if (store.user && editForm.stageName) {
      const id = editForm.id || Math.random().toString(36).substring(7);
      const path = 'ladder';
      try {
        await setDoc(doc(db, path, id), { ...editForm, id, uid: store.user.uid });
        setEditing(false);
        setEditForm({ id: '', stageNum: '', stageName: '', skill: '', income: '' });
      } catch (e) { handleFirestoreError(e, OperationType.WRITE, path); }
    }
  };

  const handleDelete = async (id: string) => {
    const path = 'ladder';
    try { await deleteDoc(doc(db, path, id)); }
    catch (e) { handleFirestoreError(e, OperationType.DELETE, path); }
  };

  return (
    <div className="sec">
      <div className="sec-header">
        <div className="sec-label">Proyeksi Income — Realistis Berbasis Sistem Ini</div>
        <button className="btn btn-sm" onClick={() => setEditing(!editing)}>
          {editing ? 'Batal' : <Plus size={14} />}
        </button>
      </div>

      <AnimatePresence>
        {editing && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="card mb-4">
            <div className="flex-row">
              <input className="input-field" placeholder="Tahap (Tahap 1)" value={editForm.stageNum} onChange={e => setEditForm({...editForm, stageNum: e.target.value})} />
              <input className="input-field" placeholder="Nama (Sekarang)" value={editForm.stageName} onChange={e => setEditForm({...editForm, stageName: e.target.value})} />
            </div>
            <textarea className="input-field" placeholder="Deskripsi Skill/Sistem" value={editForm.skill} onChange={e => setEditForm({...editForm, skill: e.target.value})} />
            <input className="input-field" placeholder="Target Income (UMR)" value={editForm.income} onChange={e => setEditForm({...editForm, income: e.target.value})} />
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleSave}>Simpan Tahap</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="projection">
        {store.ladder.map((item) => {
          const isCurrent = store.currentLadderStage === item.id;
          const currentIdx = store.ladder.findIndex(l => l.id === store.currentLadderStage);
          const itemIdx = store.ladder.findIndex(l => l.id === item.id);
          const isPast = itemIdx < currentIdx;
          
          return (
            <motion.div 
              key={item.id} 
              className={`proj-row ${isCurrent ? 'now' : ''}`}
              style={{ 
                opacity: isPast ? 0.6 : 1,
                position: 'relative'
              }}
            >
              <div className="proj-phase" onClick={() => handleStageChange(item.id)} style={{ cursor: 'pointer' }}>
                <strong>{item.stageName}</strong>
                {item.stageNum}
              </div>
              <div className="proj-desc" onClick={() => handleStageChange(item.id)} style={{ cursor: 'pointer' }}>{item.skill}</div>
              <div className="proj-income" style={{ color: isCurrent ? 'var(--singa)' : 'var(--muted)' }}>
                {item.income}
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px', justifyContent: 'flex-end' }}>
                  <button style={{ background:'transparent', border:'none', color:'var(--muted)', cursor:'pointer' }} onClick={() => { setEditForm(item); setEditing(true); }}><Edit2 size={12}/></button>
                  <button style={{ background:'transparent', border:'none', color:'var(--red)', cursor:'pointer' }} onClick={() => handleDelete(item.id)}><Trash2 size={12}/></button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function DailySystem() {
  const store = useStore();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ char: '🌅', time: '', name: '', tasks: '', ii: '' });

  const handleAdd = async () => {
    if (form.name && store.user) {
      const id = editingId || Math.random().toString(36).substring(7);
      const path = 'dailyBlocks';
      try {
        await setDoc(doc(db, path, id), { 
          ...form, 
          id, 
          uid: store.user.uid, 
          tasks: form.tasks.split('\n').filter(Boolean), 
          createdAt: serverTimestamp() 
        }, { merge: true });
        setForm({ char: '🌅', time: '', name: '', tasks: '', ii: '' });
        setAdding(false);
        setEditingId(null);
      } catch (e) { handleFirestoreError(e, OperationType.WRITE, path); }
    }
  };

  const handleEdit = (block: any) => {
    setForm({
      char: block.char,
      time: block.time,
      name: block.name,
      tasks: block.tasks.join('\n'),
      ii: block.ii || ''
    });
    setEditingId(block.id);
    setAdding(true);
  };

  const handleDelete = async (id: string) => {
    const path = 'dailyBlocks';
    try { await deleteDoc(doc(db, path, id)); }
    catch (e) { handleFirestoreError(e, OperationType.DELETE, path); }
  };

  return (
    <div className="sec">
      <div className="sec-label">Jadwal Harian — Senin s/d Jumat</div>
      <div className="schedule">
        <AnimatePresence>
          {adding && (
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="card mb-4">
               <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '12px', color: 'var(--elang)' }}>
                 {editingId ? 'EDIT BLOK SISTEM' : 'TAMBAH BLOK SISTEM BARU'}
               </div>
               <div className="flex-row">
                 <input className="input-field" placeholder="Ikon (🌅)" value={form.char} onChange={e => setForm({...form, char: e.target.value})} style={{ width: '60px' }} />
                 <input className="input-field" placeholder="Waktu (05:00 - 06:00)" value={form.time} onChange={e => setForm({...form, time: e.target.value})} />
                 <input className="input-field" placeholder="Nama Blok (Creative Block)" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
               </div>
               <textarea className="input-field" rows={3} placeholder="Tugas (satu per baris)" value={form.tasks} onChange={e => setForm({...form, tasks: e.target.value})} />
               <input className="input-field" placeholder="Implementation Intention (Opsional)" value={form.ii} onChange={e => setForm({...form, ii: e.target.value})} />
               <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleAdd}>
                 {editingId ? 'Update Block' : 'Simpan Block'}
               </button>
             </motion.div>
          )}
        </AnimatePresence>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {store.dailyBlocks.map((block) => (
            <div key={block.id} className="time-row">
              <div className="time-col">
                <div className="time-val">{block.time.split(' - ')[0]}</div>
                <div className="time-val">{block.time.split(' - ')[1]}</div>
                <div className="time-dur">{block.char}</div>
              </div>
              <div className="time-body">
                <div className="time-title">
                  <div className="time-dot" style={{ background: 'var(--primary)' }}></div>
                  {block.name}
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                    <button style={{ background:'transparent', border:'none', color:'var(--muted)', cursor:'pointer' }} onClick={() => handleEdit(block)}><Edit2 size={12}/></button>
                    <button style={{ background:'transparent', border:'none', color:'var(--red)', cursor:'pointer' }} onClick={() => handleDelete(block.id)}><Trash2 size={12}/></button>
                  </div>
                </div>
                <ul className="time-tasks">
                  {block.tasks.map((task, i) => <li key={i}>{task}</li>)}
                </ul>
                {(block as any).ii && (
                  <div className="time-ii">
                    <strong>Implementation Intention</strong>
                    {(block as any).ii}
                  </div>
                )}
              </div>
            </div>
          ))}
          <button className="btn btn-sm" style={{ width: '100%', marginTop: '8px' }} onClick={() => { setAdding(!adding); setEditingId(null); setForm({ char: '🌅', time: '', name: '', tasks: '', ii: '' }); }}>
            <Plus size={14}/> Tambah Blok Jadwal
          </button>
        </div>
      </div>
    </div>
  );
}

function ProgressTracker() {
  const store = useStore();
  const [adding, setAdding] = useState(false);
  const [trackerName, setTrackerName] = useState('');

  const handleAdd = async () => {
    if (trackerName && store.user) {
      const id = Math.random().toString(36).substring(7);
      const path = 'trackers';
      try {
        await setDoc(doc(db, path, id), { id, uid: store.user.uid, name: trackerName, history: [], createdAt: serverTimestamp() });
        setTrackerName('');
        setAdding(false);
      } catch (e) { handleFirestoreError(e, OperationType.WRITE, path); }
    }
  };

  const handleDelete = async (id: string) => {
    const path = 'trackers';
    try { await deleteDoc(doc(db, path, id)); }
    catch (e) { handleFirestoreError(e, OperationType.DELETE, path); }
  };

  const toggleTracker = async (tracker: any, date: string) => {
    const path = `trackers/${tracker.id}`;
    const hasDate = tracker.history.includes(date);
    const newHistory = hasDate ? tracker.history.filter((d: string) => d !== date) : [...tracker.history, date];
    try { await updateDoc(doc(db, 'trackers', tracker.id), { history: newHistory }); }
    catch (e) { handleFirestoreError(e, OperationType.UPDATE, path); }
  };

  const todayStr = getTodayStr();
  const today = new Date();
  
  const getStats = (history: string[]) => {
    let weekly = 0, monthly = 0, yearly = 0;
    history.forEach(dStr => {
      const d = new Date(dStr);
      if (d.getFullYear() === today.getFullYear()) yearly++;
      if (d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth()) monthly++;
      const diffTime = Math.abs(today.getTime() - d.getTime());
      if (diffTime <= 7 * 24 * 60 * 60 * 1000) weekly++;
    });
    return { weekly, monthly, yearly };
  };

  return (
    <div className="sec">
      <div className="sec-header">
        <div className="sec-icon" style={{ background: '#10b98115' }}><BarChart3 size={16} color="var(--green)" /></div>
        <div className="sec-title">
          <span>Progress Tracker</span>
          <button className="btn btn-sm" onClick={() => setAdding(!adding)}>
            {adding ? <X size={14}/> : <Plus size={14}/>} {adding ? 'Batal' : 'Tambah'}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {adding && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="card mb-4 flex-row">
            <input className="input-field" style={{ marginBottom: 0 }} placeholder="Nama Habit / Target Baru..." value={trackerName} onChange={e => setTrackerName(e.target.value)} />
            <button className="btn btn-primary" onClick={handleAdd}>Simpan</button>
          </motion.div>
        )}
      </AnimatePresence>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <AnimatePresence initial={false}>
          {store.trackers.map((tracker) => {
            const stats = getStats(tracker.history);
            const isDoneToday = tracker.history.includes(todayStr);
            return (
              <motion.div key={tracker.id} layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="card" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', padding: '16px 20px', marginBottom: '0' }}>
                <div style={{ flex: '1', minWidth: '200px' }}>
                  <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>{tracker.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Total: {tracker.history.length} kali pencapaian</div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'center', fontSize: '10px', color: 'var(--muted)', background: 'var(--s2)', padding: '4px 8px', borderRadius: '8px', minWidth: '60px' }}>Mingguan<br/><strong style={{color:'var(--text)', fontSize: '12px'}}>{stats.weekly}</strong></div>
                  <div style={{ textAlign: 'center', fontSize: '10px', color: 'var(--muted)', background: 'var(--s2)', padding: '4px 8px', borderRadius: '8px', minWidth: '60px' }}>Bulanan<br/><strong style={{color:'var(--text)', fontSize: '12px'}}>{stats.monthly}</strong></div>
                  <div style={{ textAlign: 'center', fontSize: '10px', color: 'var(--muted)', background: 'var(--s2)', padding: '4px 8px', borderRadius: '8px', minWidth: '60px' }}>Tahunan<br/><strong style={{color:'var(--text)', fontSize: '12px'}}>{stats.yearly}</strong></div>
                  <button onClick={() => toggleTracker(tracker, todayStr)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid', cursor: 'pointer', fontWeight: 600, fontSize: '13px', marginLeft: 'auto', background: isDoneToday ? '#10b98120' : 'var(--s2)', color: isDoneToday ? 'var(--green)' : 'var(--text)', borderColor: isDoneToday ? 'var(--green)' : 'var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isDoneToday ? <CheckCircle2 size={16} /> : null} {isDoneToday ? 'Selesai' : 'Tandai Selesai'}
                  </button>
                  <button className="btn btn-danger" style={{ padding: '8px' }} onClick={() => handleDelete(tracker.id)}><Trash2 size={16}/></button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

function WeeklyReview() {
  const store = useStore();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ q1: '', q2: '', q3: '' });

  const handleAdd = async () => {
    if ((form.q1 || form.q2 || form.q3) && store.user) {
      const id = Date.now().toString(36) + Math.random().toString(36).substring(2);
      const path = 'weeklyReviews';
      try {
        await setDoc(doc(db, path, id), { ...form, id, uid: store.user.uid, date: getTodayStr() });
        setForm({ q1: '', q2: '', q3: '' });
        setAdding(false);
      } catch (e) { handleFirestoreError(e, OperationType.WRITE, path); }
    }
  };

  const handleDelete = async (id: string) => {
    const path = 'weeklyReviews';
    try { await deleteDoc(doc(db, path, id)); }
    catch (e) { handleFirestoreError(e, OperationType.DELETE, path); }
  };

  const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="sec">
      <div className="sec-header">
        <div className="sec-icon" style={{ background: '#8b5cf615' }}><ClipboardList size={16} color="var(--elang)" /></div>
        <div className="sec-title">
          <span>Review Mingguan</span>
          <button className="btn btn-sm btn-primary" onClick={() => setAdding(!adding)}>
            {adding ? <X size={14}/> : <Plus size={14}/>} {adding ? 'Batal' : 'Tulis Review'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {adding && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="card mb-6" style={{ background: 'var(--s2)', border: '1px solid var(--elang)30' }}>
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Refleksi Mingguan — {todayStr}</h4>
              <p style={{ fontSize: '11px', color: 'var(--muted2)' }}>Locke & Latham · Feedback Loop untuk performa puncak.</p>
            </div>
            
            <div className="form-group">
              <label className="form-label">01. Apa yang sudah aku selesaikan minggu ini?</label>
              <textarea className="input-field" rows={3} placeholder="Tulis angka konkret: video dibuat, views, income..." value={form.q1} onChange={e => setForm({...form, q1: e.target.value})} />
            </div>
            
            <div className="form-group">
              <label className="form-label">02. Apa satu hal yang menghambat terbesar?</label>
              <textarea className="input-field" rows={3} placeholder="Batasi ke satu hambatan yang paling menentukan..." value={form.q2} onChange={e => setForm({...form, q2: e.target.value})} />
            </div>
            
            <div className="form-group">
              <label className="form-label">03. Satu aksi konkret untuk minggu depan?</label>
              <textarea className="input-field" rows={3} placeholder='Format: "Jika X maka Y"...' value={form.q3} onChange={e => setForm({...form, q3: e.target.value})} />
            </div>
            
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleAdd}>Simpan Review Mingguan</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {store.weeklyReviews.length === 0 && !adding && (
          <div className="card" style={{ textAlign: 'center', padding: '40px', borderStyle: 'dashed' }}>
            <div style={{ fontSize: '24px', marginBottom: '12px' }}>📝</div>
            <div style={{ fontSize: '14px', color: 'var(--muted2)' }}>Belum ada review mingguan. Mulai tulis untuk melacak pertumbuhan Anda.</div>
          </div>
        )}
        
        <AnimatePresence initial={false}>
          {store.weeklyReviews.sort((a,b) => parseDate(b.date).getTime() - parseDate(a.date).getTime()).map((review) => (
            <motion.div key={review.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--elang)' }}></div>
                  <span style={{ fontFamily: 'DM Mono', fontSize: '11px', color: 'var(--muted2)' }}>
                    {parseDate(review.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <button className="btn btn-danger" style={{ padding: '6px' }} onClick={() => handleDelete(review.id)}><Trash2 size={14}/></button>
              </div>

              <div style={{ display: 'grid', gap: '20px' }}>
                <div style={{ borderLeft: '2px solid var(--border)', paddingLeft: '16px' }}>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--muted)', marginBottom: '4px' }}>Pencapaian</div>
                  <div style={{ fontSize: '13px', lineHeight: '1.6' }}>{review.q1}</div>
                </div>
                <div style={{ borderLeft: '2px solid var(--border)', paddingLeft: '16px' }}>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--muted)', marginBottom: '4px' }}>Hambatan</div>
                  <div style={{ fontSize: '13px', lineHeight: '1.6' }}>{review.q2}</div>
                </div>
                <div style={{ borderLeft: '2px solid var(--border)', paddingLeft: '16px' }}>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--muted)', marginBottom: '4px' }}>Aksi Selanjutnya</div>
                  <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--koala)', fontWeight: 500 }}>{review.q3}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function MasterHistory() {
  const store = useStore();
  
  const totalDeepWorkMinutes = store.focusSessions
    .filter(s => s.type === 'work')
    .reduce((acc, s) => acc + s.duration, 0);
  
  const totalTasksDone = store.dailyStats.reduce((acc, s) => acc + (s.mainCompleted || 0) + (s.quickCompleted || 0), 0);
  const totalHabitCheckins = store.trackers.reduce((acc, t) => acc + t.history.length, 0);

  return (
    <div className="sec">
      <div className="sec-header">
        <div className="sec-icon" style={{ background: '#3b82f615' }}><History size={16} color="var(--koala)" /></div>
        <div className="sec-title">Arsip & History Pencapaian</div>
      </div>
      
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--elang)' }}>{(totalDeepWorkMinutes / 60).toFixed(1)}h</div>
            <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase' }}>Deep Work</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--green)' }}>{totalTasksDone}</div>
            <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase' }}>Tugas Selesai</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--gold)' }}>{totalHabitCheckins}</div>
            <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase' }}>Habit Done</div>
          </div>
        </div>
        
        <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '12px', color: 'var(--muted2)' }}>Timeline Perjalanan</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
           {store.weeklyReviews.sort((a,b) => parseDate(b.date).getTime() - parseDate(a.date).getTime()).map(review => (
             <div key={review.id} style={{ display: 'flex', gap: '12px', borderLeft: '2px solid var(--border)', paddingLeft: '16px', position: 'relative', paddingBottom: '8px' }}>
               <div style={{ position: 'absolute', left: '-5px', top: '4px', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--elang)' }}></div>
               <div>
                 <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text)' }}>Review Mingguan — {parseDate(review.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</div>
                 <div style={{ fontSize: '12px', color: 'var(--muted2)', marginTop: '4px', fontStyle: 'italic' }}>"{review.q3.substring(0, 80)}..."</div>
               </div>
             </div>
           ))}
           {store.weeklyReviews.length === 0 && (
             <div style={{ fontSize: '11px', color: 'var(--muted)', textAlign: 'center', padding: '12px' }}>
               History akan muncul di sini setelah Anda membuat review mingguan pertama.
             </div>
           )}
        </div>
      </div>
    </div>
  );
}

function MindsetReframe() {
  const store = useStore();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ old: '', new: '' });

  const handleAdd = async () => {
    if (form.old && form.new && store.user) {
      const id = Math.random().toString(36).substring(7);
      const path = 'reframes';
      try {
        await setDoc(doc(db, path, id), { ...form, id, uid: store.user.uid, createdAt: serverTimestamp() });
        setForm({ old: '', new: '' });
        setAdding(false);
      } catch (e) { handleFirestoreError(e, OperationType.WRITE, path); }
    }
  };

  const handleDelete = async (id: string) => {
    const path = 'reframes';
    try { await deleteDoc(doc(db, path, id)); }
    catch (e) { handleFirestoreError(e, OperationType.DELETE, path); }
  };

  return (
    <div className="sec">
      <div className="sec-header">
        <div className="sec-icon" style={{ background: '#f9731615' }}><Repeat size={16} color="var(--singa)" /></div>
        <div className="sec-title">
          <span>Reframe Pikiran</span>
          <button className="btn btn-sm" onClick={() => setAdding(!adding)}>
            {adding ? <X size={14}/> : <Plus size={14}/>} {adding ? 'Batal' : 'Tambah'}
          </button>
        </div>
      </div>
      <div className="reframe-grid">
        <AnimatePresence>
          {adding && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }} 
              className="rf-form"
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="rf-section">
                  <label className="rf-label rf-old-label">Pikiran Lama (Stres/Negatif)</label>
                  <textarea 
                    className="input-field" 
                    rows={2}
                    placeholder="Contoh: 'Aku tidak akan pernah bisa...'" 
                    value={form.old} 
                    onChange={e => setForm({...form, old: e.target.value})} 
                  />
                </div>
                <div className="rf-section">
                  <label className="rf-label rf-new-label">Pikiran Baru (Reframe/Positif)</label>
                  <textarea 
                    className="input-field" 
                    rows={2}
                    placeholder="Contoh: 'Aku sedang belajar untuk...'" 
                    value={form.new} 
                    onChange={e => setForm({...form, new: e.target.value})} 
                  />
                </div>
              </div>
              <button className="btn btn-primary" style={{ alignSelf: 'flex-end' }} onClick={handleAdd}>Simpan Reframe</button>
            </motion.div>
          )}
               {store.reframes.map((item) => (
            <motion.div 
              key={item.id} 
              layout
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              className="rf-card"
            >
              <div className="rf-section">
                <div className="rf-label rf-old-label">Dulu</div>
                <div className="rf-old-text">{item.old}</div>
              </div>
              
              <div className="rf-divider"></div>
              
              <div className="rf-section">
                <div className="rf-label rf-new-label">Sekarang</div>
                <div className="rf-new-text">{item.new}</div>
              </div>

              <button 
                className="btn btn-danger rf-delete" 
                onClick={() => handleDelete(item.id)}
              >
                <Trash2 size={14}/>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function DailyAudit() {
  const store = useStore();
  const today = getTodayStr();
  const [viewDate, setViewDate] = useState(today);
  const stats = store.dailyStats.find(s => s.date === viewDate);

  const mainTasks = store.dailyBlocks.flatMap(b => b.tasks.map((t, i) => ({ id: `${b.id}:${i}`, text: t, blockName: b.name })));
  const quickTasks = store.quickTasks;

  const completedQuickCount = stats?.quickCompleted || 0;
  const completedMainIds = (stats as any)?.completedMainIds || [];

  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });

    return last7Days.map(date => {
      const s = store.dailyStats.find(stat => stat.date === date);
      return {
        date: parseDate(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        main: s?.mainCompleted || 0,
        quick: s?.quickCompleted || 0,
        fullDate: date
      };
    });
  }, [store.dailyStats]);

  const toggleMainTask = async (taskId: string) => {
    if (viewDate !== today) return; // Only allow editing today's stats
    const newIds = completedMainIds.includes(taskId) 
      ? completedMainIds.filter((id: string) => id !== taskId)
      : [...completedMainIds, taskId];
    
    if (!store.user) return;
    const id = stats?.id || `${store.user.uid}_${today}`;
    try {
      await setDoc(doc(db, 'dailyStats', id), { 
        id, 
        uid: store.user.uid, 
        date: today, 
        completedMainIds: newIds,
        mainCompleted: newIds.length,
        mainTotal: mainTasks.length,
        quickCompleted: completedQuickCount
      }, { merge: true });
    } catch (e) { handleFirestoreError(e, OperationType.WRITE, `dailyStats/${id}`); }
  };

  return (
    <div className="sec">
      <div className="sec-header">
        <div className="sec-icon" style={{ background: '#8b5cf615' }}><BarChart3 size={16} color="var(--primary)" /></div>
        <div className="sec-title">Audit Produktivitas Harian</div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input 
            type="date" 
            className="input-field" 
            style={{ marginBottom: 0, padding: '4px 8px', fontSize: '12px', width: 'auto' }} 
            value={viewDate} 
            onChange={e => setViewDate(e.target.value)}
            max={today}
          />
        </div>
      </div>
      
      <div className="sec-ref" style={{ marginBottom: '16px' }}>
        {viewDate === today ? 'Deteksi: Apakah Anda mengerjakan "Tugas Asli" atau hanya "Tugas Tambahan"?' : `Melihat rekapan tanggal: ${parseDate(viewDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`}
      </div>

      <div className="card mb-6" style={{ padding: '20px', background: 'var(--s1)', height: '240px' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted2)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tren Produktivitas (7 Hari Terakhir)</div>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: 'var(--muted2)' }} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: 'var(--muted2)' }} 
            />
            <Tooltip 
              contentStyle={{ background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
              cursor={{ fill: 'var(--s2)', opacity: 0.4 }}
            />
            <Bar dataKey="main" name="Tugas Utama" radius={[4, 4, 0, 0]} barSize={20}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fullDate === viewDate ? 'var(--gold)' : 'var(--primary)'} />
              ))}
            </Bar>
            <Bar dataKey="quick" name="Tugas Cepat" fill="var(--muted)" radius={[4, 4, 0, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card" style={{ background: 'var(--s1)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={14} color="var(--gold)" /> Tugas Utama (Sistem)
            <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--muted2)' }}>{completedMainIds.length}/{mainTasks.length}</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {mainTasks.map(task => (
              <div key={task.id} onClick={() => toggleMainTask(task.id)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: 'var(--s2)', borderRadius: '8px', cursor: viewDate === today ? 'pointer' : 'default', opacity: completedMainIds.includes(task.id) ? 0.6 : 1 }}>
                {completedMainIds.includes(task.id) ? <CheckCircle2 size={16} color="var(--green)" /> : <Square size={16} color="var(--muted)" />}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', textDecoration: completedMainIds.includes(task.id) ? 'line-through' : 'none' }}>{task.text}</div>
                  <div style={{ fontSize: '10px', color: 'var(--muted2)' }}>{task.blockName}</div>
                </div>
              </div>
            ))}
            {mainTasks.length === 0 && <div style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'center', padding: '12px' }}>Belum ada sistem harian yang diatur.</div>}
          </div>
        </div>

        <div className="card" style={{ background: 'var(--s1)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardList size={14} color="var(--red)" /> Tugas Tambahan (Quick)
            <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--muted2)' }}>{completedQuickCount} Selesai</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '12px', color: 'var(--muted2)', padding: '8px', background: 'var(--s2)', borderRadius: '8px', textAlign: 'center' }}>
              {completedQuickCount} tugas cepat diselesaikan pada tanggal ini.
            </div>
          </div>
        </div>
      </div>

      {viewDate === today && (
        <div className="mt-6 p-4" style={{ background: 'var(--s2)', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: 'var(--muted2)' }}>ANALISIS MOMENTUM</div>
          {completedMainIds.length === 0 && completedQuickCount > 0 ? (
            <div style={{ color: 'var(--red)', fontSize: '13px' }}>⚠️ <strong>Bahaya:</strong> Anda sibuk mengerjakan tugas tambahan tapi tugas utama (sistem) belum disentuh. Ini adalah bentuk prokrastinasi produktif.</div>
          ) : completedMainIds.length > 0 && completedMainIds.length === mainTasks.length ? (
            <div style={{ color: 'var(--green)', fontSize: '13px' }}>✅ <strong>Luar Biasa:</strong> Sistem harian selesai 100%. Anda berada di jalur Elang.</div>
          ) : (
            <div style={{ color: 'var(--muted2)', fontSize: '13px' }}>Selesaikan tugas utama di "Daily System" untuk menjaga momentum jangka panjang.</div>
          )}
        </div>
      )}
    </div>
  );
}

function QuickTasks() {
  const store = useStore();
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState('');

  const handleAdd = async () => {
    if (!text.trim() || !store.user || adding === 'saving') return;
    setAdding('saving');

    const id = Date.now().toString(36) + Math.random().toString(36).substring(2);
    const path = 'quickTasks';
    const newTask = { 
      id, 
      uid: store.user.uid, 
      text: text.trim(), 
      completed: false, 
      lastCompletedDate: '',
      createdAt: serverTimestamp() 
    };

    try {
      await setDoc(doc(db, path, id), newTask);
      setText('');
      setAdding(false);
    } catch (e) { 
      setAdding(true);
      handleFirestoreError(e, OperationType.WRITE, path); 
    }
  };

  const toggleTask = async (task: any) => {
    if (!store.user) return;
    const path = `quickTasks/${task.id}`;
    const today = getTodayStr();
    try {
      await updateDoc(doc(db, 'quickTasks', task.id), { 
        completed: !task.completed,
        lastCompletedDate: !task.completed ? today : ''
      });
      
      // Update DailyStats count
      const stats = store.dailyStats.find(s => s.date === today);
      const id = stats?.id || `${store.user.uid}_${today}`;
      const newQuickCount = !task.completed 
        ? (stats?.quickCompleted || 0) + 1 
        : Math.max(0, (stats?.quickCompleted || 0) - 1);
      
      await setDoc(doc(db, id.includes('_') ? 'dailyStats' : 'dailyStats', id), { 
        uid: store.user.uid,
        date: today,
        quickCompleted: newQuickCount 
      }, { merge: true });
    } catch (e) { handleFirestoreError(e, OperationType.UPDATE, path); }
  };

  const handleDelete = async (id: string) => {
    const path = 'quickTasks';
    try { await deleteDoc(doc(db, path, id)); }
    catch (e) { handleFirestoreError(e, OperationType.DELETE, path); }
  };

  return (
    <div className="sec">
      <div className="sec-header">
        <div className="sec-icon" style={{ background: '#ef444415' }}><CheckSquare size={16} color="var(--red)" /></div>
        <div className="sec-title">
          <span>Tugas Cepat (Quick Tasks)</span>
          <button className="btn btn-sm" onClick={() => setAdding(!adding)}>
            {adding ? <X size={14}/> : <Plus size={14}/>} {adding ? 'Batal' : 'Tambah'}
          </button>
        </div>
        <div className="sec-ref">Urgent & Penting — Jangan Sampai Lupa</div>
      </div>

      <AnimatePresence>
        {adding && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="card mb-4 flex-row">
            <input className="input-field" style={{ marginBottom: 0 }} placeholder="Tulis tugas baru..." value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} />
            <button className="btn btn-primary" onClick={handleAdd}>Simpan</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <AnimatePresence initial={false}>
          {[...store.quickTasks].sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1)).map((task) => (
            <motion.div key={task.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', opacity: task.completed ? 0.6 : 1 }}>
              <button onClick={() => toggleTask(task)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: task.completed ? 'var(--green)' : 'var(--muted)', display: 'flex', alignItems: 'center' }}>
                {task.completed ? <CheckCircle2 size={20} /> : <Square size={20} />}
              </button>
              <span style={{ flex: 1, textDecoration: task.completed ? 'line-through' : 'none', fontSize: '14px' }}>{task.text}</span>
              <button className="btn btn-danger" style={{ padding: '6px' }} onClick={() => handleDelete(task.id)}><Trash2 size={14}/></button>
            </motion.div>
          ))}
        </AnimatePresence>
        {store.quickTasks.length === 0 && !adding && (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--muted2)', fontSize: '13px', border: '1px dashed var(--border)', borderRadius: '12px' }}>
            Tidak ada tugas mendesak. Klik "+" untuk menambah.
          </div>
        )}
      </div>
    </div>
  );
}

// --- Main App ---

async function seedUserData(uid: string) {
  // Intentions
  const intentions = [
    { when: 'PAGI', trigger: 'sudah sarapan dan duduk di meja', response: 'langsung buka Suno dan generate 1 track — sebelum buka sosmed apapun.', note: '🐨 Koala: trigger fisik (duduk) lebih kuat dari trigger waktu. 🦅 Elang: urutan jelas = tidak ada decision fatigue.' },
    { when: 'SIANG', trigger: 'jam makan siang dan ada 10 menit', response: 'buka catatan dan tulis 1 kalimat: "Tadi aku sudah [X]. Besok aku akan [Y]."', note: '🦁 Singa: mencatat progress kecil mempertahankan momentum. 🦅 Elang: eksternalisasi pikiran = kepala lebih jernih.' }
  ];

  // Daily Blocks
  const blocks = [
    { id: 'b1', char: '🌅', time: '05:00 - 06:00', name: 'Creative Block — YouTube', tasks: ['Generate 1 track Suno ATAU buat visual AI untuk video', 'Edit video yang sudah ada draft-nya', 'Sebelum buka HP / sosmed apapun — ini aturan keras'], ii: 'Jika alarm 05:00 bunyi dan aku sudah duduk → langsung buka laptop, bukan HP.' },
    { id: 'b2', char: '🍳', time: '06:00 - 07:00', name: 'Keluarga + Persiapan', tasks: ['Sarapan, persiapan anak, waktu keluarga', 'Tidak ada kerja di jam ini — ini waktu keluarga murni', 'Koala butuh batas waktu yang jelas antara domain'] },
    { id: 'b3', char: '💼', time: '07:00 - 16:00', name: 'Kerja Utama + Survey', tasks: ['Fokus penuh ke pekerjaan — ini income primer yang harus dijaga stabil', 'Survey diselesaikan sesuai target kerja', 'YouTube tidak masuk jam ini sama sekali', 'Singa: ini adalah "bertahan" dulu, bukan menyerang'] },
    { id: 'b4', char: '☕', time: '16:00 - 17:00', name: 'Buffer + Transisi', tasks: ['Istirahat aktif — jalan kaki singkat, makan, dekompresi', 'Ini bukan waktu produktif — ini pengisian ulang energi', 'Tanpa buffer ini, sesi YouTube malam akan tidak efektif'], ii: 'Jika dorongan negatif muncul di jam ini → langsung keluar ruangan, jalan 5 menit, lalu buka catatan dan tulis satu kalimat tentang progress hari ini.' },
    { id: 'b5', char: '🎵', time: '17:00 - 19:00', name: 'Production Block — YouTube', tasks: ['Senin/Rabu/Jumat: produksi video baru (Suno → visual → edit)', 'Selasa/Kamis: optimasi + upload + analisa analytics', 'Workflow SAMA setiap sesi — Koala butuh rutinitas tidak berubah', 'Target: 1 video selesai per 2 hari produksi'], ii: 'Jika jam menunjukkan 17:00 dan kerja sudah selesai → langsung buka folder project YouTube, bukan sosmed.' },
    { id: 'b6', char: '🎓', time: '19:00 - 21:00', name: 'Kuliah Online', tasks: ['Fokus kuliah — ini investasi jangka panjang untuk income ladder', 'Elang: catat poin penting secara singkat, bukan semua hal', 'Jika tidak ada kuliah malam itu → tambah 1 jam YouTube atau istirahat'] },
    { id: 'b7', char: '📝', time: '21:00 - 21:15', name: 'Brain Dump + Plan Besok', tasks: ['Tulis satu kalimat: "Besok aku akan [X]" — spesifik', 'Tulis satu masalah kreatif untuk diproses otak saat tidur', 'Tutup semua app — Default Mode Network bekerja saat tidur'], ii: 'Jika sudah 21:00 → tulis catatan malam, letakkan HP di luar kamar, tidur.' }
  ];

  // Reframes
  const reframes = [
    { old: 'Pengeluaran terus naik, pemasukan tidak cukup, aku gagal.', new: 'Aku sedang membangun income stream kedua. Gap finansial adalah motivasi, bukan bukti kegagalan.' },
    { old: 'Kompetitor sudah ratusan video, aku baru mulai dari 0.', new: 'Mereka juga pernah di video ke-1. Yang aku perlukan hanya video ke-1 hari ini.' }
  ];

  // Trackers
  const trackers = [
    { name: 'Generate Track / Visual AI', history: [] },
    { name: 'Upload 1 Video', history: [] }
  ];

  // Weekly Review
  const reviews = [
    {
      q1: 'Minggu ini aku sudah upload 2 video dan dapat 500 views, income $5.',
      q2: 'Terlalu perfeksionis saat editing, makan waktu lama.',
      q3: 'Jika edit jam 17:00, aku set timer 1 jam. Kalau habis, langsung render.',
      date: new Date().toISOString()
    }
  ];

  // Quick Tasks
  const tasks = [
    { text: 'Beli paket data / bayar internet', completed: false },
    { text: 'Cek email dari YouTube / Microstock', completed: false }
  ];

  // Matrix
  const matrix = [
    { id: 'm1', quadrant: 'q1', text: 'Deadline kerja / survey' },
    { id: 'm2', quadrant: 'q1', text: 'Kebutuhan anak dan keluarga' },
    { id: 'm3', quadrant: 'q1', text: 'Upload video yang sudah siap' },
    { id: 'm4', quadrant: 'q1', text: 'Tugas kuliah deadline hari ini' },
    { id: 'm5', quadrant: 'q2', text: 'Produksi video YouTube rutin' },
    { id: 'm6', quadrant: 'q2', text: 'Belajar kuliah online' },
    { id: 'm7', quadrant: 'q2', text: 'Review mingguan sistem' },
    { id: 'm8', quadrant: 'q2', text: 'Olahraga + kesehatan' },
    { id: 'm9', quadrant: 'q3', text: 'Notifikasi sosmed' },
    { id: 'm10', quadrant: 'q3', text: 'Chat yang tidak kritis' },
    { id: 'm11', quadrant: 'q3', text: 'Research tools baru terus-terusan' },
    { id: 'm12', quadrant: 'q4', text: 'Scroll tanpa tujuan' },
    { id: 'm13', quadrant: 'q4', text: 'Trigger negatif saat sendiri' },
    { id: 'm14', quadrant: 'q4', text: 'Overthinking tanpa aksi' }
  ];

  // Trigger Steps
  const triggerSteps = [
    { id: 't1', num: '01', title: 'Kenali — Jangan Lawan Langsung', content: 'Saat dorongan negatif muncul, katakan dalam hati: "Ini sinyal stres, bukan kebutuhan nyata. Aku sedang menghindari sesuatu." Jangan panik, jangan paksa.' },
    { id: 't2', num: '02', title: '2 Menit Pertama — Kritis', content: 'Dalam 2 menit pertama otak masih bisa dialihkan. Setelah itu jauh lebih susah. Langkah: tutup semua tab/app, berdiri, keluar ruangan.', ii: 'Jika dorongan muncul → langsung berdiri dan berjalan ke ruangan lain. Itu saja dulu.' },
    { id: 't3', num: '03', title: 'Alihkan ke Output Kreatif', content: 'Energi arousal meningkatkan kreativitas jika dialihkan sebelum eskalasi. Buka Suno, buat satu track, atau tulis ide video. Energi yang sama, output berbeda.', ii: 'Jika sudah berdiri dan keluar ruangan → langsung buka laptop dan kerjakan satu hal kecil di YouTube project.' },
    { id: 't4', num: '04', title: 'Jika Gagal — Tidak Apa-Apa', content: 'Shame loop adalah musuh terbesar. Jika protokol gagal, jangan tambah rasa bersalah. Catat trigger-nya: jam berapa, sedang apa, stres tentang apa. Data ini penting untuk perbaikan sistem, bukan untuk menghukum diri.' }
  ];

  // Ladder
  const ladder = [
    { id: '1', stageNum: 'Tahap 1', stageName: 'Sekarang', skill: 'Kerja + Survey = income primer stabil. YouTube = 0. Sistem baru dimulai. Kuliah online berjalan.', income: 'UMR' },
    { id: '2', stageNum: 'Tahap 2', stageName: 'Growth', skill: 'YouTube mulai menghasilkan $10-$50/bln. Kerja utama tetap jalan. Sistem makin disiplin.', income: 'UMR + $50' },
    { id: '3', stageNum: 'Tahap 3', stageName: 'Scale', skill: 'YouTube $200-$500/bln. Mulai delegasi editing. Kuliah hampir selesai.', income: '2x UMR' },
    { id: '4', stageNum: 'Tahap 4', stageName: 'Freedom', skill: 'YouTube > $1000/bln. Fokus penuh ke sistem kreatif. Investasi ke aset lain.', income: 'Top 5%' }
  ];

  for (const [i, item] of intentions.entries()) {
    const id = `${uid}_intention_${i}`;
    await setDoc(doc(db, 'intentions', id), { ...item, id, uid, createdAt: serverTimestamp() });
  }
  for (const item of blocks) {
    const blockId = `${uid}_${item.id}`;
    await setDoc(doc(db, 'dailyBlocks', blockId), { ...item, id: blockId, uid, createdAt: serverTimestamp() });
  }
  for (const [i, item] of reframes.entries()) {
    const id = `${uid}_reframe_${i}`;
    await setDoc(doc(db, 'reframes', id), { ...item, id, uid, createdAt: serverTimestamp() });
  }
  for (const [i, item] of trackers.entries()) {
    const id = `${uid}_tracker_${i}`;
    await setDoc(doc(db, 'trackers', id), { ...item, id, uid, createdAt: serverTimestamp() });
  }
  for (const [i, item] of reviews.entries()) {
    const id = `${uid}_review_${i}`;
    await setDoc(doc(db, 'weeklyReviews', id), { ...item, id, uid, createdAt: serverTimestamp() });
  }
  for (const [i, item] of tasks.entries()) {
    const id = `${uid}_task_${i}`;
    await setDoc(doc(db, 'quickTasks', id), { ...item, id, uid, createdAt: serverTimestamp() });
  }
  for (const item of matrix) {
    const matrixId = `${uid}_${item.id}`;
    await setDoc(doc(db, 'matrixItems', matrixId), { ...item, id: matrixId, uid });
  }
  for (const item of triggerSteps) {
    const triggerId = `${uid}_${item.id}`;
    await setDoc(doc(db, 'triggerSteps', triggerId), { ...item, id: triggerId, uid });
  }
  for (const item of ladder) {
    const ladderId = `${uid}_${item.id}`;
    await setDoc(doc(db, 'ladder', ladderId), { ...item, id: ladderId, uid });
  }

  // Focus Settings
  await setDoc(doc(db, 'focusSettings', uid), {
    uid,
    blocklist: [],
    workDuration: 25,
    breakDuration: 5
  });

  // Initial Daily Stats
  const today = getTodayStr();
  const statId = `${uid}_${today}`;
  await setDoc(doc(db, 'dailyStats', statId), {
    id: statId,
    uid,
    date: today,
    mainCompleted: 0,
    mainTotal: 7, 
    quickCompleted: 0,
    completedMainIds: []
  });
}

const getStartOfWeekStrFromDate = (dateStr: string) => {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
};

export default function App() {
  const store = useStore();
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    if (!store.user) return;
    const today = getTodayStr();
    const currentWeek = getStartOfWeekStr();

    // Check for Daily/Weekly Resets
    const resetTasks = async () => {
      // Reset Pinned Actions
      for (const action of store.pinnedActions) {
        if (action.completed) {
          if (action.type === 'daily' && action.lastCompletedDate !== today) {
            await updateDoc(doc(db, 'pinnedActions', action.id), { completed: false });
          } else if (action.type === 'weekly') {
            const lastWeek = action.lastCompletedDate ? getStartOfWeekStrFromDate(action.lastCompletedDate) : '';
            if (lastWeek !== currentWeek) {
              await updateDoc(doc(db, 'pinnedActions', action.id), { completed: false });
            }
          }
        }
      }

      // Reset Quick Tasks (if they were completed on a previous day)
      for (const task of store.quickTasks) {
        if (task.completed && task.lastCompletedDate && task.lastCompletedDate !== today) {
          await updateDoc(doc(db, 'quickTasks', task.id), { completed: false });
        }
      }

      // Reset Rewards
      for (const reward of store.rewards) {
        if (reward.completed && (reward as any).lastCompletedDate && (reward as any).lastCompletedDate !== today) {
          await updateDoc(doc(db, 'rewards', reward.id), { completed: false });
        }
      }
    };

    resetTasks();
  }, [store.user, store.pinnedActions.length, store.quickTasks.length, store.rewards.length]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      store.setUser(user);
      store.setAuthReady(true);

      if (user) {
        // Sync User Doc (Ladder Stage)
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          store.setCurrentLadderStage(userDoc.data().currentLadderStage);
        } else {
          await setDoc(userDocRef, { uid: user.uid, email: user.email, displayName: user.displayName, currentLadderStage: '1' });
          await seedUserData(user.uid);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Separate effect for Firestore listeners to handle cleanup correctly
  useEffect(() => {
    if (!store.user) {
      // Clear data when logged out
      store.setIntentions([]);
      store.setDailyBlocks([]);
      store.setWeeklyReviews([]);
      store.setReframes([]);
      store.setTrackers([]);
      store.setQuickTasks([]);
      store.setDailyStats([]);
      store.setFocusGoals([]);
      store.setFocusSessions([]);
      store.setFocusSettings(null);
      store.setRewards([]);
      store.setPinnedActions([]);
      store.setNotes([]);
      store.setMatrixItems([]);
      store.setTriggerSteps([]);
      store.setLadder([]);
      store.setThemeSettings(null);
      return;
    }

    const user = store.user;

    // Real-time Sync for all collections
    const qIntentions = query(collection(db, 'intentions'), where('uid', '==', user.uid));
    const unsubIntentions = onSnapshot(qIntentions, (snap) => {
      store.setIntentions(snap.docs.map(d => d.data() as any));
    }, (e) => {
      // Only log if we are still logged in, otherwise it's an expected cleanup race condition
      if (auth.currentUser) handleFirestoreError(e, OperationType.LIST, 'intentions');
    });

    const qBlocks = query(collection(db, 'dailyBlocks'), where('uid', '==', user.uid));
    const unsubBlocks = onSnapshot(qBlocks, (snap) => {
      store.setDailyBlocks(snap.docs.map(d => d.data() as any));
    }, (e) => {
      if (auth.currentUser) handleFirestoreError(e, OperationType.LIST, 'dailyBlocks');
    });

    const qReviews = query(collection(db, 'weeklyReviews'), where('uid', '==', user.uid));
    const unsubReviews = onSnapshot(qReviews, (snap) => {
      store.setWeeklyReviews(snap.docs.map(d => d.data() as any));
    }, (e) => {
      if (auth.currentUser) handleFirestoreError(e, OperationType.LIST, 'weeklyReviews');
    });

    const qReframes = query(collection(db, 'reframes'), where('uid', '==', user.uid));
    const unsubReframes = onSnapshot(qReframes, (snap) => {
      store.setReframes(snap.docs.map(d => d.data() as any));
    }, (e) => {
      if (auth.currentUser) handleFirestoreError(e, OperationType.LIST, 'reframes');
    });

    const qTrackers = query(collection(db, 'trackers'), where('uid', '==', user.uid));
    const unsubTrackers = onSnapshot(qTrackers, (snap) => {
      store.setTrackers(snap.docs.map(d => d.data() as any));
    }, (e) => {
      if (auth.currentUser) handleFirestoreError(e, OperationType.LIST, 'trackers');
    });

    const qQuickTasks = query(collection(db, 'quickTasks'), where('uid', '==', user.uid));
    const unsubQuickTasks = onSnapshot(qQuickTasks, (snap) => {
      store.setQuickTasks(snap.docs.map(d => d.data() as any));
    }, (e) => {
      if (auth.currentUser) handleFirestoreError(e, OperationType.LIST, 'quickTasks');
    });

    const qDailyStats = query(collection(db, 'dailyStats'), where('uid', '==', user.uid));
    const unsubDailyStats = onSnapshot(qDailyStats, (snap) => {
      store.setDailyStats(snap.docs.map(d => d.data() as any));
    }, (e) => {
      if (auth.currentUser) handleFirestoreError(e, OperationType.LIST, 'dailyStats');
    });

    const qFocusGoals = query(collection(db, 'focusGoals'), where('uid', '==', user.uid));
    const unsubFocusGoals = onSnapshot(qFocusGoals, (snap) => {
      store.setFocusGoals(snap.docs.map(d => d.data() as any));
    }, (e) => {
      if (auth.currentUser) handleFirestoreError(e, OperationType.LIST, 'focusGoals');
    });

    const qFocusSessions = query(collection(db, 'focusSessions'), where('uid', '==', user.uid));
    const unsubFocusSessions = onSnapshot(qFocusSessions, (snap) => {
      store.setFocusSessions(snap.docs.map(d => d.data() as any));
    }, (e) => {
      if (auth.currentUser) handleFirestoreError(e, OperationType.LIST, 'focusSessions');
    });

    const qFocusSettings = doc(db, 'focusSettings', user.uid);
    const unsubFocusSettings = onSnapshot(qFocusSettings, (doc) => {
      if (doc.exists()) store.setFocusSettings(doc.data() as any);
    }, (e) => {
      if (auth.currentUser) handleFirestoreError(e, OperationType.GET, 'focusSettings');
    });

    const qRewards = query(collection(db, 'rewards'), where('uid', '==', user.uid));
    const unsubRewards = onSnapshot(qRewards, (snap) => {
      store.setRewards(snap.docs.map(d => d.data() as any));
    }, (e) => {
      if (auth.currentUser) handleFirestoreError(e, OperationType.LIST, 'rewards');
    });

    const qPinned = query(collection(db, 'pinnedActions'), where('uid', '==', user.uid));
    const unsubPinned = onSnapshot(qPinned, (snap) => {
      store.setPinnedActions(snap.docs.map(d => d.data() as any));
    }, (e) => {
      if (auth.currentUser) handleFirestoreError(e, OperationType.LIST, 'pinnedActions');
    });

    const qTheme = doc(db, 'themeSettings', user.uid);
    const unsubTheme = onSnapshot(qTheme, (doc) => {
      if (doc.exists()) store.setThemeSettings(doc.data() as any);
    }, (e) => {
      if (auth.currentUser) handleFirestoreError(e, OperationType.GET, 'themeSettings');
    });

    const qNotes = query(collection(db, 'notes'), where('uid', '==', user.uid));
    const unsubNotes = onSnapshot(qNotes, (snap) => {
      store.setNotes(snap.docs.map(d => d.data() as any));
    }, (e) => {
      if (auth.currentUser) handleFirestoreError(e, OperationType.LIST, 'notes');
    });

    const qMatrix = query(collection(db, 'matrixItems'), where('uid', '==', user.uid));
    const unsubMatrix = onSnapshot(qMatrix, (snap) => {
      store.setMatrixItems(snap.docs.map(d => d.data() as any));
    }, (e) => {
      if (auth.currentUser) handleFirestoreError(e, OperationType.LIST, 'matrixItems');
    });

    const qTrigger = query(collection(db, 'triggerSteps'), where('uid', '==', user.uid));
    const unsubTrigger = onSnapshot(qTrigger, (snap) => {
      store.setTriggerSteps(snap.docs.map(d => d.data() as any));
    }, (e) => {
      if (auth.currentUser) handleFirestoreError(e, OperationType.LIST, 'triggerSteps');
    });

    const qLadder = query(collection(db, 'ladder'), where('uid', '==', user.uid));
    const unsubLadder = onSnapshot(qLadder, (snap) => {
      store.setLadder(snap.docs.map(d => d.data() as any).sort((a, b) => a.id.localeCompare(b.id)));
    }, (e) => {
      if (auth.currentUser) handleFirestoreError(e, OperationType.LIST, 'ladder');
    });

    return () => {
      unsubIntentions();
      unsubBlocks();
      unsubReviews();
      unsubReframes();
      unsubTrackers();
      unsubQuickTasks();
      unsubDailyStats();
      unsubFocusGoals();
      unsubFocusSessions();
      unsubFocusSettings();
      unsubRewards();
      unsubPinned();
      unsubTheme();
      unsubNotes();
      unsubMatrix();
      unsubTrigger();
      unsubLadder();
    };
  }, [store.user]);

  useEffect(() => {
    if (store.themeSettings) {
      const root = document.documentElement;
      root.style.setProperty('--primary', store.themeSettings.accentColor);
      root.style.setProperty('--elang', store.themeSettings.accentColor);
      document.body.style.fontFamily = store.themeSettings.fontFamily;
    }
  }, [store.themeSettings]);

  if (!store.isAuthReady) {
    return <div className="wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>Memuat...</div>;
  }

  if (!store.user) {
    return <Login />;
  }

  return (
    <ErrorBoundary>
      <div className="wrap">
        <Navbar />
        <Hero />
        
        <div style={{ marginBottom: '32px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button 
            className={`btn ${!showAnalytics ? 'btn-primary' : ''}`} 
            onClick={() => setShowAnalytics(false)}
          >
            <ClipboardList size={16} /> Workspace Utama
          </button>
          <button 
            className={`btn ${showAnalytics ? 'btn-primary' : ''}`} 
            onClick={() => setShowAnalytics(true)}
          >
            <LayoutDashboard size={16} /> Dashboard Analitik
          </button>
        </div>

        <AnimatePresence mode="wait">
          {showAnalytics ? (
            <motion.div 
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <AdvancedAnalytics />
              <ThemeCustomizer />
            </motion.div>
          ) : (
            <motion.div 
              key="workspace"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="main-grid"
            >
              <div>
                <Notepad />
                <PinnedActions />
                <DailySystem />
                <WeekendSystem />
                <CoveyMatrix />
                <TriggerProtocol />
                <PomodoroTimer />
                <ResearchBase />
                <ImplementationIntentions />
                <IncomeLadder />
                <DailyAudit />
                <QuickTasks />
                <BlocklistManager />
              </div>
              <div className="sticky-side">
                <FocusStats />
                <DailyRewards />
                <MasterHistory />
                <ProgressTracker />
                <WeeklyReview />
                <MindsetReframe />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
}
