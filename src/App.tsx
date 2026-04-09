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
    if (!text.trim() || !store.user) return;
    const id = Math.random().toString(36).substring(7);
    const path = 'pinnedActions';
    try {
      await setDoc(doc(db, path, id), {
        id,
        uid: store.user.uid,
        text: text.trim(),
        type,
        completed: false,
        createdAt: serverTimestamp()
      });
      setText('');
      setAdding(false);
    } catch (e) { handleFirestoreError(e, OperationType.WRITE, path); }
  };

  const toggleComplete = async (action: PinnedAction) => {
    const path = `pinnedActions/${action.id}`;
    try {
      await updateDoc(doc(db, 'pinnedActions', action.id), { completed: !action.completed });
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
            <button className="btn btn-primary" style={{ width: '100%', background: 'var(--gold)', color: '#000' }} onClick={handleAdd}>Pin Sekarang</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid md:grid-cols-2 gap-4">
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
    if (!content.trim() || !store.user) return;
    const id = Math.random().toString(36).substring(7);
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
    } catch (e) { handleFirestoreError(e, OperationType.WRITE, path); }
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
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
              <button className="btn btn-primary" onClick={handleAdd}>Simpan Catatan</button>
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
    if (user && confirm("Masukkan data default ke sistem Anda? Ini akan menambahkan item baru.")) {
      await seedUserData(user.uid);
      alert("Data default berhasil dimasukkan!");
    }
  };

  if (!user) return null;

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', gap: '12px', alignItems: 'center' }}>
      <button 
        className={`btn btn-sm ${store.isFocusMode ? 'btn-primary' : ''}`} 
        onClick={() => store.setFocusMode(!store.isFocusMode)}
      >
        {store.isFocusMode ? <EyeOff size={14} /> : <Eye size={14} />}
        {store.isFocusMode ? 'Matikan Focus Mode' : 'Aktifkan Focus Mode'}
      </button>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--muted2)' }}>
          <UserIcon size={14} />
          <span>{user.email}</span>
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
    </div>
  );
}

function PomodoroTimer() {
  const store = useStore();
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');

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
    const duration = mode === 'work' ? 25 : 5;
    const id = Math.random().toString(36).substring(7);
    try {
      await setDoc(doc(db, 'focusSessions', id), {
        id,
        uid: store.user.uid,
        duration,
        type: mode,
        createdAt: serverTimestamp()
      });
      alert(`${mode === 'work' ? 'Sesi Kerja' : 'Istirahat'} Selesai!`);
      setMode(mode === 'work' ? 'break' : 'work');
      setTimeLeft(mode === 'work' ? 5 * 60 : 25 * 60);
    } catch (e) { console.error(e); }
  };

  const toggle = () => setIsActive(!isActive);
  const reset = () => {
    setIsActive(false);
    setTimeLeft(mode === 'work' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="pomo-widget">
      <div className="pomo-display">
        <div className="pomo-time">{formatTime(timeLeft)}</div>
        <div className="pomo-status">{mode === 'work' ? 'Deep Work Session' : 'Short Break'}</div>
      </div>
      <div className="pomo-controls">
        <button className={`pomo-btn ${isActive ? 'active' : ''}`} onClick={toggle}>
          {isActive ? <Pause size={20} /> : <Play size={20} />}
        </button>
        <button className="pomo-btn" onClick={reset}>
          <RotateCcw size={20} />
        </button>
      </div>
    </div>
  );
}

function FocusGoalTracker() {
  const store = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [newGoal, setNewGoal] = useState(120);
  
  const goal = store.focusGoals[0] || { dailyMinutes: 120 };
  const sessions = store.focusSessions;
  
  const today = new Date().toISOString().split('T')[0];
  const todayMinutes = sessions
    .filter(s => {
      const d = s.createdAt.toDate ? s.createdAt.toDate() : new Date(s.createdAt);
      return d.toISOString().split('T')[0] === today && s.type === 'work';
    })
    .reduce((acc, s) => acc + s.duration, 0);

  const progress = Math.min((todayMinutes / goal.dailyMinutes) * 100, 100);

  const handleUpdateGoal = async () => {
    if (!store.user) return;
    const goalId = ('id' in goal) ? goal.id : `${store.user.uid}_goal`;
    const path = 'focusGoals';
    try {
      await setDoc(doc(db, path, goalId), {
        id: goalId,
        uid: store.user.uid,
        dailyMinutes: newGoal
      });
      setIsEditing(false);
    } catch (e) { handleFirestoreError(e, OperationType.WRITE, path); }
  };

  return (
    <div className="goal-card">
      <div className="goal-header">
        <div className="goal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Target size={16} color="var(--elang)" />
          Target Deep Work
        </div>
        {isEditing ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="number" 
              className="input-field" 
              style={{ width: '60px', marginBottom: 0, padding: '4px 8px' }} 
              value={newGoal} 
              onChange={e => setNewGoal(parseInt(e.target.value) || 0)}
            />
            <button className="btn btn-sm btn-primary" onClick={handleUpdateGoal}><Check size={14}/></button>
            <button className="btn btn-sm" onClick={() => setIsEditing(false)}><X size={14}/></button>
          </div>
        ) : (
          <button className="btn btn-sm" onClick={() => { setIsEditing(true); setNewGoal(goal.dailyMinutes); }}>
            <Edit2 size={12} /> Edit
          </button>
        )}
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
        <span style={{ color: 'var(--muted2)' }}>{todayMinutes} / {goal.dailyMinutes} menit</span>
        <span style={{ fontWeight: 600, color: 'var(--elang)' }}>{progress.toFixed(0)}%</span>
      </div>
      
      <div className="goal-progress-bg">
        <div className="goal-progress-bar" style={{ width: `${progress}%` }}></div>
      </div>
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
  
  const today = new Date().toISOString().split('T')[0];
  const sessions = store.focusSessions;
  
  const workSessions = sessions.filter(s => s.type === 'work');
  const totalMinutes = workSessions.reduce((acc, s) => acc + s.duration, 0);
  const avgDuration = workSessions.length > 0 ? totalMinutes / workSessions.length : 0;
  
  // Weekly stats
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weeklyMinutes = workSessions
    .filter(s => {
      const d = s.createdAt.toDate ? s.createdAt.toDate() : new Date(s.createdAt);
      return d >= oneWeekAgo;
    })
    .reduce((acc, s) => acc + s.duration, 0);

  return (
    <div className="sec">
      <div className="sec-header">
        <div className="sec-icon" style={{ background: '#8b5cf615' }}><BarChart3 size={16} color="var(--elang)" /></div>
        <div className="sec-title">Analisis Fokus</div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
        <div className="card" style={{ margin: 0, padding: '16px' }}>
          <div style={{ fontSize: '10px', color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Total Deep Work</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--elang)' }}>{totalMinutes} <span style={{ fontSize: '12px', fontWeight: 400 }}>menit</span></div>
          <div style={{ fontSize: '11px', color: 'var(--muted2)', marginTop: '4px' }}>Sepanjang waktu</div>
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
          <div style={{ fontSize: '11px', color: 'var(--muted2)', marginTop: '4px' }}>Selesai</div>
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
      const id = Math.random().toString(36).substring(7);
      const path = 'rewards';
      try {
        await setDoc(doc(db, path, id), {
          id,
          uid: store.user.uid,
          text: newReward,
          completed: false,
          createdAt: serverTimestamp()
        });
        setNewReward('');
      } catch (e) { handleFirestoreError(e, OperationType.WRITE, path); }
    }
  };

  const toggleReward = async (reward: Reward) => {
    const path = 'rewards';
    try {
      await updateDoc(doc(db, path, reward.id), { completed: !reward.completed });
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
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
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

function FocusOverlay() {
  const store = useStore();
  if (!store.isFocusMode) return null;

  return (
    <div className="focus-overlay">
      <div className="focus-timer-large">
        <div className="timer-label">Deep Work Session Active</div>
        <div className="timer-digits">
          <Timer size={120} color="var(--elang)" style={{ opacity: 0.2, position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: -1 }} />
          Focus
        </div>
        <button className="btn btn-primary" onClick={() => store.setFocusMode(false)}>
          Selesaikan Sesi
        </button>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      className="hero"
    >
      <div className="hero-eyebrow">
        <span>Life Operating System — Evidence Based</span>
      </div>
      <h1>Dari UMR<br />menuju <em>Top 5%</em></h1>
      <p className="hero-desc">
        Sistem berbasis riset ilmiah valid yang dirancang spesifik untuk karakter Elang + Koala + Singa.
        Bukan motivasi kosong — tapi mekanisme kognitif nyata yang bisa diimplementasi hari ini.
      </p>
      <div className="char-row">
        <span className="chip s">🦁 Singa — hasil & berani</span>
        <span className="chip k">🐨 Koala — rutinitas & stabil</span>
        <span className="chip e">🦅 Elang — detail & proses</span>
      </div>
    </motion.div>
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
    if (form.trigger && form.response && store.user) {
      const id = Math.random().toString(36).substring(7);
      const path = 'intentions';
      try {
        await setDoc(doc(db, path, id), { ...form, id, uid: store.user.uid, createdAt: serverTimestamp() });
        setForm({ when: 'PAGI', trigger: '', response: '', note: '' });
        setAdding(false);
      } catch (e) { handleFirestoreError(e, OperationType.WRITE, path); }
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
                <div className="flex-row mt-4"><button className="btn btn-primary" onClick={handleAdd}>Simpan</button></div>
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
  
  const handleStageChange = async (id: string) => {
    store.setCurrentLadderStage(id);
    if (store.user) {
      const path = `users/${store.user.uid}`;
      try { await updateDoc(doc(db, 'users', store.user.uid), { currentLadderStage: id }); }
      catch (e) { handleFirestoreError(e, OperationType.UPDATE, path); }
    }
  };

  return (
    <div className="sec">
      <div className="sec-header">
        <div className="sec-icon" style={{ background: '#f59e0b15' }}><TrendingUp size={16} color="var(--gold)" /></div>
        <div className="sec-title">Tangga Income — UMR ke Top 5%</div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {store.ladder.map((item, index) => {
          const isCurrent = store.currentLadderStage === item.id;
          const isPast = parseInt(item.id) < parseInt(store.currentLadderStage);
          
          return (
            <motion.div 
              key={item.id} 
              whileHover={{ x: 4 }}
              onClick={() => handleStageChange(item.id)}
              className={`card ${isCurrent ? 'current-stage' : ''}`}
              style={{ 
                cursor: 'pointer', 
                margin: 0, 
                position: 'relative',
                borderLeft: isCurrent ? '4px solid var(--green)' : isPast ? '4px solid var(--muted)' : '4px solid transparent',
                background: isCurrent ? 'var(--s2)' : 'var(--s1)',
                opacity: isPast ? 0.7 : 1
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ 
                      fontFamily: 'DM Mono', 
                      fontSize: '10px', 
                      background: isCurrent ? 'var(--green)' : 'var(--border2)',
                      color: isCurrent ? 'white' : 'var(--muted2)',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      {item.stageNum}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>{item.stageName}</span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--muted2)', lineHeight: '1.5' }}>{item.skill}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: isCurrent ? 'var(--green)' : 'var(--text)' }}>{item.income}</div>
                  <div style={{ fontSize: '10px', color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '1px' }}>Per Bulan</div>
                </div>
              </div>
              {isCurrent && (
                <div style={{ 
                  marginTop: '12px', 
                  paddingTop: '12px', 
                  borderTop: '1px solid var(--border)',
                  fontSize: '11px',
                  color: 'var(--green)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <CheckCircle2 size={12} /> Fokus saat ini: Bangun sistem dan asah skill utama.
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <div style={{ marginTop: '16px', padding: '16px', background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '11px', color: 'var(--muted2)', lineHeight: '1.6' }}>
        <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>💡 REALITY CHECK</div>
        Top 5% nasional Indonesia ≈ Rp15–25 juta/bulan (BPS 2023). Realistis dalam 2–3 tahun dengan eksekusi konsisten — bukan skema cepat kaya.
      </div>
    </div>
  );
}

function DailySystem() {
  const store = useStore();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ char: '🌅', time: '', name: '', tasks: '' });

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
        setForm({ char: '🌅', time: '', name: '', tasks: '' });
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
      tasks: block.tasks.join('\n')
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
      <div className="sec-header">
        <div className="sec-icon" style={{ background: '#10b98115' }}><RefreshCw size={16} color="var(--green)" /></div>
        <div className="sec-title">
          <span>Sistem Harian</span>
          <button className="btn btn-sm" onClick={() => { setAdding(!adding); setEditingId(null); setForm({ char: '🌅', time: '', name: '', tasks: '' }); }}>
            {adding ? <X size={14}/> : <Plus size={14}/>} {adding ? 'Batal' : 'Tambah'}
          </button>
        </div>
      </div>
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
             <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleAdd}>
               {editingId ? 'Update Block' : 'Simpan Block'}
             </button>
           </motion.div>
        )}
      </AnimatePresence>
      <div className="daily-wrap">
        <AnimatePresence initial={false}>
          {store.dailyBlocks.map((block) => (
            <motion.div key={block.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="daily-block">
              <div className="db-char">{block.char}</div>
              <div className="db-time">
                <span>{block.time}</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button style={{ background:'transparent', border:'none', color:'var(--muted)', cursor:'pointer' }} onClick={() => handleEdit(block)}><Edit2 size={12}/></button>
                  <button style={{ background:'transparent', border:'none', color:'var(--red)', cursor:'pointer' }} onClick={() => handleDelete(block.id)}><Trash2 size={12}/></button>
                </div>
              </div>
              <div className="db-name">{block.name}</div>
              <ul className="db-tasks">{block.tasks.map((task, i) => <li key={i}>{task}</li>)}</ul>
            </motion.div>
          ))}
        </AnimatePresence>
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

  const todayStr = new Date().toISOString().split('T')[0];
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
      const id = Math.random().toString(36).substring(7);
      const path = 'weeklyReviews';
      try {
        await setDoc(doc(db, path, id), { ...form, id, uid: store.user.uid, date: new Date().toISOString() });
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
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="rf-row" style={{ background: 'var(--s2)' }}>
              <input className="input-field" style={{ marginBottom: 0 }} placeholder="Mindset lama..." value={form.old} onChange={e => setForm({...form, old: e.target.value})} />
              <div className="rf-arrow">→</div>
              <input className="input-field" style={{ marginBottom: 0 }} placeholder="Mindset baru..." value={form.new} onChange={e => setForm({...form, new: e.target.value})} />
              <button className="btn btn-primary" onClick={handleAdd}>Simpan</button>
            </motion.div>
          )}
               {store.reframes.map((item) => (
            <motion.div key={item.id} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="rf-row">
              <div className="rf-old">{item.old}</div><div className="rf-arrow">→</div><div className="rf-new">{item.new}</div>
              <button className="btn btn-danger" style={{ padding: '6px' }} onClick={() => handleDelete(item.id)}><Trash2 size={14}/></button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function DailyAudit() {
  const store = useStore();
  const [viewDate, setViewDate] = useState(new Date().toISOString().split('T')[0]);
  const today = new Date().toISOString().split('T')[0];
  const stats = store.dailyStats.find(s => s.date === viewDate);

  const mainTasks = store.dailyBlocks.flatMap(b => b.tasks.map((t, i) => ({ id: `${b.id}:${i}`, text: t, blockName: b.name })));
  const quickTasks = store.quickTasks;

  const completedQuickCount = stats?.quickCompleted || 0;
  const completedMainIds = (stats as any)?.completedMainIds || [];

  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
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
    if (!text.trim()) return;
    if (!store.user) {
      console.error("No user found in store");
      return;
    }

    const id = Math.random().toString(36).substring(7);
    const path = 'quickTasks';
    const newTask = { 
      id, 
      uid: store.user.uid, 
      text: text.trim(), 
      completed: false, 
      createdAt: serverTimestamp() 
    };

    try {
      console.log("Adding task:", newTask);
      await setDoc(doc(db, path, id), newTask);
      setText('');
      setAdding(false);
    } catch (e) { 
      console.error("Error adding task:", e);
      handleFirestoreError(e, OperationType.WRITE, path); 
    }
  };

  const toggleTask = async (task: any) => {
    if (!store.user) return;
    const path = `quickTasks/${task.id}`;
    try {
      await updateDoc(doc(db, 'quickTasks', task.id), { completed: !task.completed });
      
      // Update DailyStats count
      const today = new Date().toISOString().split('T')[0];
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
    { char: '🌅', time: '05:00–06:00 · Pagi', name: 'Creative Block', tasks: ['Baca catatan malam sebelumnya', 'Generate 1 track Suno ATAU buat visual AI', 'Sebelum buka sosmed apapun'] },
    { char: '☀️', time: 'Kerja Utama · Siang', name: 'Kerja Utama', tasks: ['Fokus penuh ke pekerjaan utama', 'YouTube bukan prioritas jam ini', 'Jaga income primer tetap stabil'] },
    { char: '🌙', time: '21:00–21:15 · Malam', name: 'Brain Load', tasks: ['Tulis 1 masalah kreatif di catatan', 'Tutup semua app — tidur'] }
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
      date: new Date().toISOString(),
      createdAt: serverTimestamp()
    }
  ];

  // Quick Tasks
  const tasks = [
    { text: 'Beli paket data / bayar internet', completed: false },
    { text: 'Cek email dari YouTube / Microstock', completed: false }
  ];

  for (const item of intentions) {
    const id = Math.random().toString(36).substring(7);
    await setDoc(doc(db, 'intentions', id), { ...item, id, uid, createdAt: serverTimestamp() });
  }
  for (const item of blocks) {
    const id = Math.random().toString(36).substring(7);
    await setDoc(doc(db, 'dailyBlocks', id), { ...item, id, uid, createdAt: serverTimestamp() });
  }
  for (const item of reframes) {
    const id = Math.random().toString(36).substring(7);
    await setDoc(doc(db, 'reframes', id), { ...item, id, uid, createdAt: serverTimestamp() });
  }
  for (const item of trackers) {
    const id = Math.random().toString(36).substring(7);
    await setDoc(doc(db, 'trackers', id), { ...item, id, uid, createdAt: serverTimestamp() });
  }
  for (const item of reviews) {
    const id = Math.random().toString(36).substring(7);
    await setDoc(doc(db, 'weeklyReviews', id), { ...item, id, uid, createdAt: serverTimestamp() });
  }
  for (const item of tasks) {
    const id = Math.random().toString(36).substring(7);
    await setDoc(doc(db, 'quickTasks', id), { ...item, id, uid, createdAt: serverTimestamp() });
  }

  // Initial Daily Stats
  const today = new Date().toISOString().split('T')[0];
  const statId = `${uid}_${today}`;
  await setDoc(doc(db, 'dailyStats', statId), {
    id: statId,
    uid,
    date: today,
    mainCompleted: 0,
    mainTotal: 9, // 3 blocks * 3 tasks approx
    quickCompleted: 0,
    completedMainIds: []
  });
}

export default function App() {
  const store = useStore();
  const [showAnalytics, setShowAnalytics] = useState(false);

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
    };
  }, [store.user]);

  useEffect(() => {
    if (store.isFocusMode) {
      document.body.classList.add('focus-mode');
    } else {
      document.body.classList.remove('focus-mode');
    }
  }, [store.isFocusMode]);

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
      <FocusOverlay />
      <div className={`wrap ${store.isFocusMode ? 'focus-active' : ''}`}>
        <Navbar />
        <Hero />
        
        <div style={{ marginBottom: '32px', display: 'flex', gap: '12px' }}>
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
                <PomodoroTimer />
                <ResearchBase />
                <ImplementationIntentions />
                <IncomeLadder />
                <DailyAudit />
                <QuickTasks />
                <BlocklistManager />
              </div>
              <div className="sticky-side">
                <FocusGoalTracker />
                <FocusStats />
                <DailyRewards />
                <MasterHistory />
                <DailySystem />
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
