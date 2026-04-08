/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore } from './store';
import { Plus, Trash2, Microscope, Zap, TrendingUp, RefreshCw, ClipboardList, Repeat, BarChart3, CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
          <motion.div 
            key={r.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className={`r-card ${r.id}`}
          >
            <div className="r-label">{r.label}</div>
            <div className="r-title">{r.title}</div>
            <div className="r-body">{r.body}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ImplementationIntentions({ store }: { store: any }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ when: 'PAGI', trigger: '', response: '', note: '' });

  const handleAdd = () => {
    if (form.trigger && form.response) {
      store.addIntention(form);
      setForm({ when: 'PAGI', trigger: '', response: '', note: '' });
      setAdding(false);
    }
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
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="ii-row overflow-hidden" 
              style={{ background: 'var(--s2)' }}
            >
              <select className="input-field" value={form.when} onChange={e => setForm({...form, when: e.target.value})}>
                <option>PAGI</option><option>SIANG</option><option>SORE</option><option>MALAM</option><option>BURNOUT</option>
              </select>
              <div>
                <input className="input-field" placeholder="Jika [TRIGGER]..." value={form.trigger} onChange={e => setForm({...form, trigger: e.target.value})} />
                <input className="input-field" placeholder="Maka [AKSI]..." value={form.response} onChange={e => setForm({...form, response: e.target.value})} />
                <input className="input-field" placeholder="Catatan karakter (Opsional)" value={form.note} onChange={e => setForm({...form, note: e.target.value})} />
                <div className="flex-row mt-4">
                  <button className="btn btn-primary" onClick={handleAdd}>Simpan</button>
                </div>
              </div>
              <div></div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {store.intentions.map((item: any) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="ii-row"
            >
              <div className="ii-when">{item.when}</div>
              <div className="ii-action">
                Jika <span className="trigger">{item.trigger}</span>, maka aku akan <span className="response">{item.response}</span>
                {item.note && <div className="ii-note">{item.note}</div>}
              </div>
              <button className="btn btn-danger" style={{ padding: '6px' }} onClick={() => store.deleteIntention(item.id)}><Trash2 size={14}/></button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function IncomeLadder({ store }: { store: any }) {
  return (
    <div className="sec">
      <div className="sec-header">
        <div className="sec-icon" style={{ background: '#f59e0b15' }}><TrendingUp size={16} color="var(--gold)" /></div>
        <div className="sec-title">Tangga Income — UMR ke Top 5%</div>
      </div>
      <div className="ladder">
        {store.ladder.map((item: any) => (
          <motion.div 
            key={item.id} 
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={`ladder-item ${store.currentLadderStage === item.id ? 'current' : ''}`}
            onClick={() => store.setCurrentLadderStage(item.id)}
            style={{ cursor: 'pointer' }}
          >
            <div className="ladder-stage">
              <strong>{item.stageNum}</strong>
              {item.stageName}
            </div>
            <div className="ladder-skill">{item.skill}</div>
            <div className="ladder-income">{item.income}</div>
            {store.currentLadderStage === item.id && (
              <motion.div 
                layoutId="current-ladder"
                style={{ position: 'absolute', top: 12, right: 16, fontSize: 8, letterSpacing: 2, color: 'var(--green)', fontFamily: 'monospace' }}
              >
                POSISI SEKARANG
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function DailySystem({ store }: { store: any }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ char: '🌅', time: '', name: '', tasks: '' });

  const handleAdd = () => {
    if (form.name) {
      store.addDailyBlock({ ...form, tasks: form.tasks.split('\n').filter(Boolean) });
      setForm({ char: '🌅', time: '', name: '', tasks: '' });
      setAdding(false);
    }
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
           <motion.div 
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             exit={{ opacity: 0, scale: 0.95 }}
             className="card mb-4"
           >
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
          {store.dailyBlocks.map((block: any) => (
            <motion.div 
              key={block.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="daily-block"
            >
              <div className="db-char">{block.char}</div>
              <div className="db-time">
                <span>{block.time}</span>
                <button style={{ background:'transparent', border:'none', color:'var(--red)', cursor:'pointer' }} onClick={() => store.deleteDailyBlock(block.id)}><Trash2 size={12}/></button>
              </div>
              <div className="db-name">{block.name}</div>
              <ul className="db-tasks">
                {block.tasks.map((task: string, i: number) => <li key={i}>{task}</li>)}
              </ul>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function WeeklyReview({ store }: { store: any }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ q1: '', q2: '', q3: '' });

  const handleAdd = () => {
    if (form.q1 || form.q2 || form.q3) {
      store.addWeeklyReview(form);
      setForm({ q1: '', q2: '', q3: '' });
      setAdding(false);
    }
  };

  return (
    <div className="sec">
      <div className="sec-header">
        <div className="sec-icon" style={{ background: '#8b5cf615' }}><ClipboardList size={16} color="var(--elang)" /></div>
        <div className="sec-title">
          <span>Review Mingguan</span>
          <button className="btn btn-sm" onClick={() => setAdding(!adding)}>
            {adding ? <X size={14}/> : <Plus size={14}/>} {adding ? 'Batal' : 'Tambah'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {adding && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="card mb-4"
          >
            <div className="form-group">
              <label className="form-label">01. Apa yang sudah aku selesaikan minggu ini?</label>
              <textarea className="input-field" rows={2} value={form.q1} onChange={e => setForm({...form, q1: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">02. Apa satu hal yang menghambat terbesar?</label>
              <textarea className="input-field" rows={2} value={form.q2} onChange={e => setForm({...form, q2: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">03. Satu aksi konkret untuk minggu depan?</label>
              <textarea className="input-field" rows={2} value={form.q3} onChange={e => setForm({...form, q3: e.target.value})} />
            </div>
            <button className="btn btn-primary" onClick={handleAdd}>Simpan Review</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <AnimatePresence initial={false}>
          {store.weeklyReviews.map((review: any) => (
            <motion.div 
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card" 
              style={{ position: 'relative' }}
            >
              <button className="btn btn-danger" style={{ position: 'absolute', top: '16px', right: '16px', padding: '6px' }} onClick={() => store.deleteWeeklyReview(review.id)}>
                <Trash2 size={14}/>
              </button>
              <div className="review-grid" style={{ marginTop: '20px' }}>
                <div>
                  <div className="rv-num">01</div>
                  <div className="rv-q">Penyelesaian</div>
                  <div className="rv-hint">{review.q1}</div>
                </div>
                <div>
                  <div className="rv-num">02</div>
                  <div className="rv-q">Hambatan</div>
                  <div className="rv-hint">{review.q2}</div>
                </div>
                <div>
                  <div className="rv-num">03</div>
                  <div className="rv-q">Aksi Konkret</div>
                  <div className="rv-hint">{review.q3}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function MindsetReframe({ store }: { store: any }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ old: '', new: '' });

  const handleAdd = () => {
    if (form.old && form.new) {
      store.addReframe(form);
      setForm({ old: '', new: '' });
      setAdding(false);
    }
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
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="rf-row" 
              style={{ background: 'var(--s2)' }}
            >
              <input className="input-field" style={{ marginBottom: 0 }} placeholder="Mindset lama..." value={form.old} onChange={e => setForm({...form, old: e.target.value})} />
              <div className="rf-arrow">→</div>
              <input className="input-field" style={{ marginBottom: 0 }} placeholder="Mindset baru..." value={form.new} onChange={e => setForm({...form, new: e.target.value})} />
              <button className="btn btn-primary" onClick={handleAdd}>Simpan</button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {store.reframes.map((item: any) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="rf-row"
            >
              <div className="rf-old">{item.old}</div>
              <div className="rf-arrow">→</div>
              <div className="rf-new">{item.new}</div>
              <button className="btn btn-danger" style={{ padding: '6px' }} onClick={() => store.deleteReframe(item.id)}><Trash2 size={14}/></button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ProgressTracker({ store }: { store: any }) {
  const [adding, setAdding] = useState(false);
  const [trackerName, setTrackerName] = useState('');

  const handleAdd = () => {
    if (trackerName) {
      store.addTracker(trackerName);
      setTrackerName('');
      setAdding(false);
    }
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
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="card mb-4 flex-row"
          >
            <input className="input-field" style={{ marginBottom: 0 }} placeholder="Nama Habit / Target Baru..." value={trackerName} onChange={e => setTrackerName(e.target.value)} />
            <button className="btn btn-primary" onClick={handleAdd}>Simpan</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <AnimatePresence initial={false}>
          {store.trackers.map((tracker: any) => {
            const stats = getStats(tracker.history);
            const isDoneToday = tracker.history.includes(todayStr);

            return (
              <motion.div 
                key={tracker.id}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="card" 
                style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', padding: '16px 20px', marginBottom: '0' }}
              >
                <div style={{ flex: '1', minWidth: '200px' }}>
                  <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>{tracker.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Total: {tracker.history.length} kali pencapaian</div>
                </div>
                
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--muted)', background: 'var(--s2)', padding: '6px 12px', borderRadius: '8px' }}>
                    Mingguan<br/><strong style={{color:'var(--text)', fontSize: '14px'}}>{stats.weekly}</strong>
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--muted)', background: 'var(--s2)', padding: '6px 12px', borderRadius: '8px' }}>
                    Bulanan<br/><strong style={{color:'var(--text)', fontSize: '14px'}}>{stats.monthly}</strong>
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--muted)', background: 'var(--s2)', padding: '6px 12px', borderRadius: '8px' }}>
                    Tahunan<br/><strong style={{color:'var(--text)', fontSize: '14px'}}>{stats.yearly}</strong>
                  </div>
                  
                  <button 
                    onClick={() => store.toggleTracker(tracker.id, todayStr)}
                    style={{
                      padding: '8px 16px', borderRadius: '8px', border: '1px solid', cursor: 'pointer', fontWeight: 600, fontSize: '13px', marginLeft: 'auto',
                      background: isDoneToday ? '#10b98120' : 'var(--s2)',
                      color: isDoneToday ? 'var(--green)' : 'var(--text)',
                      borderColor: isDoneToday ? 'var(--green)' : 'var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {isDoneToday ? <CheckCircle2 size={16} /> : null}
                    {isDoneToday ? 'Selesai Hari Ini' : 'Tandai Selesai'}
                  </button>
                  <button className="btn btn-danger" style={{ padding: '8px' }} onClick={() => store.deleteTracker(tracker.id)}>
                    <Trash2 size={16}/>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function App() {
  const store = useStore();

  return (
    <div className="wrap">
      <Hero />
      <ResearchBase />
      <ImplementationIntentions store={store} />
      <IncomeLadder store={store} />
      <DailySystem store={store} />
      <ProgressTracker store={store} />
      <WeeklyReview store={store} />
      <MindsetReframe store={store} />
    </div>
  );
}

