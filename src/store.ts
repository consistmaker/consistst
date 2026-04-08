import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Intention {
  id: string;
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
  char: string;
  time: string;
  name: string;
  tasks: string[];
}

export interface WeeklyReview {
  id: string;
  q1: string;
  q2: string;
  q3: string;
  date: string;
}

export interface Reframe {
  id: string;
  old: string;
  new: string;
}

export interface Tracker {
  id: string;
  name: string;
  history: string[]; // array of ISO date strings (YYYY-MM-DD)
}

interface AppState {
  intentions: Intention[];
  ladder: LadderItem[];
  currentLadderStage: string;
  dailyBlocks: DailyBlock[];
  weeklyReviews: WeeklyReview[];
  reframes: Reframe[];
  trackers: Tracker[];

  addIntention: (intention: Omit<Intention, 'id'>) => void;
  deleteIntention: (id: string) => void;
  
  setCurrentLadderStage: (id: string) => void;
  
  addDailyBlock: (block: Omit<DailyBlock, 'id'>) => void;
  deleteDailyBlock: (id: string) => void;
  
  addWeeklyReview: (review: Omit<WeeklyReview, 'id' | 'date'>) => void;
  deleteWeeklyReview: (id: string) => void;
  
  addReframe: (reframe: Omit<Reframe, 'id'>) => void;
  deleteReframe: (id: string) => void;
  
  addTracker: (name: string) => void;
  deleteTracker: (id: string) => void;
  toggleTracker: (id: string, date: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      intentions: [
        { id: '1', when: 'PAGI', trigger: 'Bangun tidur', response: 'Minum air & stretching 5 menit', note: 'Koala mode: Stabil' },
        { id: '2', when: 'BURNOUT', trigger: 'Kehilangan fokus > 15 menit', response: 'Tutup laptop, jalan kaki 10 menit', note: 'Elang mode: Reset perspektif' },
      ],
      ladder: [
        { id: '1', stageNum: '01', stageName: 'UMR / Entry Level', skill: 'Generalist, Task Execution', income: 'Rp 5M - 10M' },
        { id: '2', stageNum: '02', stageName: 'Specialist', skill: 'Deep Technical Skill, Problem Solving', income: 'Rp 15M - 25M' },
        { id: '3', stageNum: '03', stageName: 'Managerial / Expert', skill: 'Strategy, People, High-Value Output', income: 'Rp 30M - 50M' },
        { id: '4', stageNum: '04', stageName: 'Top 5% / Business Owner', skill: 'Capital Allocation, Systems, Vision', income: 'Rp 100M+' },
      ],
      currentLadderStage: '1',
      dailyBlocks: [
        { id: '1', char: '🌅', time: '05:00 - 08:00', name: 'Deep Work Block', tasks: ['Prioritas #1', 'No Distraction', 'High Cognitive Load'] },
        { id: '2', char: '☕', time: '09:00 - 12:00', name: 'Collaboration Block', tasks: ['Meetings', 'Emails', 'Team Sync'] },
      ],
      weeklyReviews: [],
      reframes: [
        { id: '1', old: 'Saya tidak punya waktu', new: 'Itu bukan prioritas saya saat ini' },
        { id: '2', old: 'Ini terlalu sulit', new: 'Ini membutuhkan pendekatan yang berbeda' },
      ],
      trackers: [
        { id: '1', name: 'Deep Work 4 Jam', history: [] },
        { id: '2', name: 'Olahraga', history: [] },
      ],

      addIntention: (intention) => set((state) => ({
        intentions: [...state.intentions, { ...intention, id: Math.random().toString(36).substring(7) }]
      })),
      deleteIntention: (id) => set((state) => ({
        intentions: state.intentions.filter((i) => i.id !== id)
      })),

      setCurrentLadderStage: (id) => set({ currentLadderStage: id }),

      addDailyBlock: (block) => set((state) => ({
        dailyBlocks: [...state.dailyBlocks, { ...block, id: Math.random().toString(36).substring(7) }]
      })),
      deleteDailyBlock: (id) => set((state) => ({
        dailyBlocks: state.dailyBlocks.filter((b) => b.id !== id)
      })),

      addWeeklyReview: (review) => set((state) => ({
        weeklyReviews: [{ ...review, id: Math.random().toString(36).substring(7), date: new Date().toISOString() }, ...state.weeklyReviews]
      })),
      deleteWeeklyReview: (id) => set((state) => ({
        weeklyReviews: state.weeklyReviews.filter((r) => r.id !== id)
      })),

      addReframe: (reframe) => set((state) => ({
        reframes: [...state.reframes, { ...reframe, id: Math.random().toString(36).substring(7) }]
      })),
      deleteReframe: (id) => set((state) => ({
        reframes: state.reframes.filter((r) => r.id !== id)
      })),

      addTracker: (name) => set((state) => ({
        trackers: [...state.trackers, { id: Math.random().toString(36).substring(7), name, history: [] }]
      })),
      deleteTracker: (id) => set((state) => ({
        trackers: state.trackers.filter((t) => t.id !== id)
      })),
      toggleTracker: (id, date) => set((state) => ({
        trackers: state.trackers.map((t) => {
          if (t.id === id) {
            const hasDate = t.history.includes(date);
            return {
              ...t,
              history: hasDate ? t.history.filter((d) => d !== date) : [...t.history, date]
            };
          }
          return t;
        })
      })),
    }),
    {
      name: 'life-os-storage',
    }
  )
);
