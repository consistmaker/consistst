/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useStore } from './store';
import { 
  Plus, Trash2, Microscope, Zap, TrendingUp, RefreshCw, ClipboardList, 
  Repeat, BarChart3, CheckCircle2, X, LogIn, LogOut, User as UserIcon 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  auth, db, googleProvider, signInWithPopup, onAuthStateChanged, 
  collection, doc, setDoc, deleteDoc, updateDoc, query, where, onSnapshot, 
  OperationType, handleFirestoreError, serverTimestamp, getDoc 
} from './firebase';

// --- Components ---

function Login() {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
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
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }} onClick={handleLogin}>
          <LogIn size={18} /> Masuk dengan Google
        </button>
      </motion.div>
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
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px', gap: '12px', alignItems: 'center' }}>
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
      <div className="ladder">
        {store.ladder.map((item) => (
          <motion.div key={item.id} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className={`ladder-item ${store.currentLadderStage === item.id ? 'current' : ''}`} onClick={() => handleStageChange(item.id)} style={{ cursor: 'pointer' }}>
            <div className="ladder-stage"><strong>{item.stageNum}</strong>{item.stageName}</div>
            <div className="ladder-skill">{item.skill}</div>
            <div className="ladder-income">{item.income}</div>
            {store.currentLadderStage === item.id && (
              <motion.div layoutId="current-ladder" style={{ position: 'absolute', top: 12, right: 16, fontSize: 8, letterSpacing: 2, color: 'var(--green)', fontFamily: 'monospace' }}>POSISI SEKARANG</motion.div>
            )}
          </motion.div>
        ))}
      </div>
      <div style={{ marginTop: '12px', padding: '14px 20px', background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '12px', color: 'var(--muted2)', lineHeight: '1.7' }}>
        ⚠ Top 5% nasional Indonesia ≈ Rp15–25 juta/bulan (BPS 2023). $2k/mo sudah masuk rentang ini tergantung kurs. $10k/mo = top 1%. Realistis dalam 2–3 tahun dengan eksekusi konsisten — bukan 6 bulan.
      </div>
    </div>
  );
}

function DailySystem() {
  const store = useStore();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ char: '🌅', time: '', name: '', tasks: '' });

  const handleAdd = async () => {
    if (form.name && store.user) {
      const id = Math.random().toString(36).substring(7);
      const path = 'dailyBlocks';
      try {
        await setDoc(doc(db, path, id), { ...form, id, uid: store.user.uid, tasks: form.tasks.split('\n').filter(Boolean), createdAt: serverTimestamp() });
        setForm({ char: '🌅', time: '', name: '', tasks: '' });
        setAdding(false);
      } catch (e) { handleFirestoreError(e, OperationType.WRITE, path); }
    }
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
          <button className="btn btn-sm" onClick={() => setAdding(!adding)}>
            {adding ? <X size={14}/> : <Plus size={14}/>} {adding ? 'Batal' : 'Tambah'}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {adding && (
           <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="card mb-4">
             <div className="flex-row">
               <input className="input-field" placeholder="Ikon (🌅)" value={form.char} onChange={e => setForm({...form, char: e.target.value})} style={{ width: '60px' }} />
               <input className="input-field" placeholder="Waktu (05:00 - 06:00)" value={form.time} onChange={e => setForm({...form, time: e.target.value})} />
               <input className="input-field" placeholder="Nama Blok (Creative Block)" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
             </div>
             <textarea className="input-field" rows={3} placeholder="Tugas (satu per baris)" value={form.tasks} onChange={e => setForm({...form, tasks: e.target.value})} />
             <button className="btn btn-primary" onClick={handleAdd}>Simpan Block</button>
           </motion.div>
        )}
      </AnimatePresence>
      <div className="daily-wrap">
        <AnimatePresence initial={false}>
          {store.dailyBlocks.map((block) => (
            <motion.div key={block.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="daily-block">
              <div className="db-char">{block.char}</div>
              <div className="db-time"><span>{block.time}</span><button style={{ background:'transparent', border:'none', color:'var(--red)', cursor:'pointer' }} onClick={() => handleDelete(block.id)}><Trash2 size={12}/></button></div>
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

  return (
    <div className="sec">
      <div className="sec-header">
        <div className="sec-icon" style={{ background: '#8b5cf615' }}><ClipboardList size={16} color="var(--elang)" /></div>
        <div className="sec-title">
          <span>Review Mingguan — 15 Menit, Setiap Minggu</span>
          <button className="btn btn-sm" onClick={() => setAdding(!adding)}>
            {adding ? <X size={14}/> : <Plus size={14}/>} {adding ? 'Batal' : 'Tambah'}
          </button>
        </div>
        <div className="sec-ref">Locke & Latham · Feedback Loop</div>
      </div>

      <div className="review-grid" style={{ marginBottom: '24px' }}>
        <div className="rv-card">
          <div className="rv-num">01</div>
          <div className="rv-q">Apa yang sudah aku selesaikan minggu ini?</div>
          <div className="rv-hint">Tulis angka konkret: berapa video dibuat, berapa views, berapa income. Singa butuh bukti progress nyata.</div>
        </div>
        <div className="rv-card">
          <div className="rv-num">02</div>
          <div className="rv-q">Apa satu hal yang menghambat terbesar?</div>
          <div className="rv-hint">Hanya satu — bukan daftar panjang. Elang cenderung over-analyze. Batasi ke satu hambatan yang paling menentukan.</div>
        </div>
        <div className="rv-card">
          <div className="rv-num">03</div>
          <div className="rv-q">Satu aksi konkret untuk minggu depan?</div>
          <div className="rv-hint">Tulis dalam format implementation intention: "Jika X maka Y." Koala butuh rencana yang sudah jelas sebelum minggu dimulai.</div>
        </div>
      </div>

      <AnimatePresence>
        {adding && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="card mb-4">
            <div className="form-group"><label className="form-label">01. Apa yang sudah aku selesaikan?</label><textarea className="input-field" rows={2} value={form.q1} onChange={e => setForm({...form, q1: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">02. Apa hambatan terbesar?</label><textarea className="input-field" rows={2} value={form.q2} onChange={e => setForm({...form, q2: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">03. Satu aksi konkret?</label><textarea className="input-field" rows={2} value={form.q3} onChange={e => setForm({...form, q3: e.target.value})} /></div>
            <button className="btn btn-primary" onClick={handleAdd}>Simpan Review</button>
          </motion.div>
        )}
      </AnimatePresence>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <AnimatePresence initial={false}>
          {store.weeklyReviews.map((review) => (
            <motion.div key={review.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="card" style={{ position: 'relative' }}>
              <button className="btn btn-danger" style={{ position: 'absolute', top: '16px', right: '16px', padding: '6px' }} onClick={() => handleDelete(review.id)}><Trash2 size={14}/></button>
              <div className="review-grid" style={{ marginTop: '20px' }}>
                <div><div className="rv-num">01</div><div className="rv-q">Penyelesaian</div><div className="rv-hint">{review.q1}</div></div>
                <div><div className="rv-num">02</div><div className="rv-q">Hambatan</div><div className="rv-hint">{review.q2}</div></div>
                <div><div className="rv-num">03</div><div className="rv-q">Aksi</div><div className="rv-hint">{review.q3}</div></div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
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
      createdAt: serverTimestamp()
    }
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
}

export default function App() {
  const store = useStore();

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

        // Real-time Sync for all collections
        const qIntentions = query(collection(db, 'intentions'), where('uid', '==', user.uid));
        const unsubIntentions = onSnapshot(qIntentions, (snap) => {
          store.setIntentions(snap.docs.map(d => d.data() as any));
        }, (e) => handleFirestoreError(e, OperationType.LIST, 'intentions'));

        const qBlocks = query(collection(db, 'dailyBlocks'), where('uid', '==', user.uid));
        const unsubBlocks = onSnapshot(qBlocks, (snap) => {
          store.setDailyBlocks(snap.docs.map(d => d.data() as any));
        }, (e) => handleFirestoreError(e, OperationType.LIST, 'dailyBlocks'));

        const qReviews = query(collection(db, 'weeklyReviews'), where('uid', '==', user.uid));
        const unsubReviews = onSnapshot(qReviews, (snap) => {
          store.setWeeklyReviews(snap.docs.map(d => d.data() as any));
        }, (e) => handleFirestoreError(e, OperationType.LIST, 'weeklyReviews'));

        const qReframes = query(collection(db, 'reframes'), where('uid', '==', user.uid));
        const unsubReframes = onSnapshot(qReframes, (snap) => {
          store.setReframes(snap.docs.map(d => d.data() as any));
        }, (e) => handleFirestoreError(e, OperationType.LIST, 'reframes'));

        const qTrackers = query(collection(db, 'trackers'), where('uid', '==', user.uid));
        const unsubTrackers = onSnapshot(qTrackers, (snap) => {
          store.setTrackers(snap.docs.map(d => d.data() as any));
        }, (e) => handleFirestoreError(e, OperationType.LIST, 'trackers'));

        return () => {
          unsubIntentions();
          unsubBlocks();
          unsubReviews();
          unsubReframes();
          unsubTrackers();
        };
      }
    });
    return () => unsubscribe();
  }, []);

  if (!store.isAuthReady) {
    return <div className="wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>Memuat...</div>;
  }

  if (!store.user) {
    return <Login />;
  }

  return (
    <div className="wrap">
      <Navbar />
      <Hero />
      <ResearchBase />
      <ImplementationIntentions />
      <IncomeLadder />
      <DailySystem />
      <ProgressTracker />
      <WeeklyReview />
      <MindsetReframe />
    </div>
  );
}
