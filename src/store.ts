import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FirebaseUser } from './firebase';

export interface Intention {
  id: string;
  uid: string;
  when: string;
  trigger: string;
  response: string;
  note?: string;
}

export interface LadderItem {
  id: string;
  stageNum: string;
  stageName: string;
  skill: string;
  income: string;
}

export interface DailyBlock {
  id: string;
  uid: string;
  char: string;
  time: string;
  name: string;
  tasks: string[];
}

export interface WeeklyReview {
  id: string;
  uid: string;
  q1: string;
  q2: string;
  q3: string;
  date: string;
}

export interface Reframe {
  id: string;
  uid: string;
  old: string;
  new: string;
}

export interface Tracker {
  id: string;
  uid: string;
  name: string;
  history: string[]; // array of ISO date strings (YYYY-MM-DD)
}

export interface QuickTask {
  id: string;
  uid: string;
  text: string;
  completed: boolean;
  createdAt?: any;
}

export interface DailyStats {
  id: string;
  uid: string;
  date: string; // YYYY-MM-DD
  mainCompleted: number;
  mainTotal: number;
  quickCompleted: number;
}

interface AppState {
  user: FirebaseUser | null;
  isAuthReady: boolean;
  intentions: Intention[];
  ladder: LadderItem[];
  currentLadderStage: string;
  dailyBlocks: DailyBlock[];
  weeklyReviews: WeeklyReview[];
  reframes: Reframe[];
  trackers: Tracker[];
  quickTasks: QuickTask[];
  dailyStats: DailyStats[];

  setUser: (user: FirebaseUser | null) => void;
  setAuthReady: (ready: boolean) => void;
  
  setIntentions: (intentions: Intention[]) => void;
  setDailyBlocks: (blocks: DailyBlock[]) => void;
  setWeeklyReviews: (reviews: WeeklyReview[]) => void;
  setReframes: (reframes: Reframe[]) => void;
  setTrackers: (trackers: Tracker[]) => void;
  setQuickTasks: (tasks: QuickTask[]) => void;
  setDailyStats: (stats: DailyStats[]) => void;

  addIntention: (intention: Omit<Intention, 'id' | 'uid'>) => void;
  deleteIntention: (id: string) => void;
  
  setCurrentLadderStage: (id: string) => void;
  
  addDailyBlock: (block: Omit<DailyBlock, 'id' | 'uid'>) => void;
  deleteDailyBlock: (id: string) => void;
  
  addWeeklyReview: (review: Omit<WeeklyReview, 'id' | 'uid' | 'date'>) => void;
  deleteWeeklyReview: (id: string) => void;
  
  addReframe: (reframe: Omit<Reframe, 'id' | 'uid'>) => void;
  deleteReframe: (id: string) => void;
  
  addTracker: (name: string) => void;
  deleteTracker: (id: string) => void;
  toggleTracker: (id: string, date: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthReady: false,
      intentions: [],
      ladder: [
        { id: '1', stageNum: 'Tahap 1', stageName: 'Sekarang', skill: 'Gaji UMR + skill tunggal. Pengeluaran melebihi pemasukan. Belum ada income stream kedua yang aktif.', income: 'UMR' },
        { id: '2', stageNum: 'Tahap 2', stageName: 'Bulan 1–3', skill: 'Upload 10–20 video YouTube. Workflow otomatis terbentuk. Mulai dapat data: video mana yang perform. Belum ada income tapi sistem sudah berjalan.', income: '$0–50/mo' },
        { id: '3', stageNum: 'Tahap 3', stageName: 'Bulan 3–8', skill: 'YPP aktif. Income YT mulai masuk. Skill: musik AI + video editing + SEO YouTube terbentuk. Deliberate practice: perbaiki 1 hal per video.', income: '$100–500/mo' },
        { id: '4', stageNum: 'Tahap 4', stageName: 'Bulan 8–18', skill: 'YT stabil. Buka kembali microstock dengan strategi baru. Mulai Framer/Elementor template. Tiga income stream aktif bersamaan.', income: '$500–2k/mo' },
        { id: '5', stageNum: 'Tahap 5', stageName: 'Bulan 18–36', skill: 'Compounding konten + template sales + web design service. Skill set rare + valuable terbentuk. Income bisa scale tanpa linear tambah jam kerja.', income: '$2k–10k/mo' },
      ],
      currentLadderStage: '1',
      dailyBlocks: [],
      weeklyReviews: [],
      reframes: [],
      trackers: [],
      quickTasks: [],
      dailyStats: [],

      setUser: (user) => set({ user }),
      setAuthReady: (isAuthReady) => set({ isAuthReady }),

      setIntentions: (intentions) => set({ intentions }),
      setDailyBlocks: (dailyBlocks) => set({ dailyBlocks }),
      setWeeklyReviews: (weeklyReviews) => set({ weeklyReviews }),
      setReframes: (reframes) => set({ reframes }),
      setTrackers: (trackers) => set({ trackers }),
      setQuickTasks: (quickTasks) => set({ quickTasks }),
      setDailyStats: (dailyStats) => set({ dailyStats }),

      addIntention: (intention) => {
        const { user } = get();
        if (!user) return;
        // This will be handled by Firestore sync in App.tsx
      },
      deleteIntention: (id) => {
        // This will be handled by Firestore sync in App.tsx
      },

      setCurrentLadderStage: (id) => set({ currentLadderStage: id }),

      addDailyBlock: (block) => {
        const { user } = get();
        if (!user) return;
      },
      deleteDailyBlock: (id) => {},

      addWeeklyReview: (review) => {
        const { user } = get();
        if (!user) return;
      },
      deleteWeeklyReview: (id) => {},

      addReframe: (reframe) => {
        const { user } = get();
        if (!user) return;
      },
      deleteReframe: (id) => {},

      addTracker: (name) => {
        const { user } = get();
        if (!user) return;
      },
      deleteTracker: (id) => {},
      toggleTracker: (id, date) => {},
    }),
    {
      name: 'life-os-storage',
      partialize: (state) => ({ 
        currentLadderStage: state.currentLadderStage 
      }), // Only persist ladder stage locally for now
    }
  )
);

