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

export interface WeeklyReviewType {
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
  lastCompletedDate?: string;
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

export interface FocusGoal {
  id: string;
  uid: string;
  dailyMinutes: number;
}

export interface FocusSession {
  id: string;
  uid: string;
  duration: number;
  type: 'work' | 'break';
  createdAt: any;
}

export interface FocusSettings {
  uid: string;
  blocklist: string[];
  workDuration: number;
  breakDuration: number;
}

export interface Reward {
  id: string;
  uid: string;
  text: string;
  completed: boolean;
  createdAt: any;
}

export interface PinnedAction {
  id: string;
  uid: string;
  text: string;
  type: 'daily' | 'weekly';
  completed: boolean;
  lastCompletedDate?: string;
  createdAt: any;
}

export interface Note {
  id: string;
  uid: string;
  content: string;
  color: string;
  createdAt: any;
}

export interface MatrixItem {
  id: string;
  uid: string;
  quadrant: 'q1' | 'q2' | 'q3' | 'q4';
  text: string;
}

export interface TriggerStep {
  id: string;
  uid: string;
  num: string;
  title: string;
  content: string;
  ii?: string;
}

export interface ThemeSettings {
  uid: string;
  accentColor: string;
  fontFamily: string;
}

export interface Mistake {
  id: string;
  uid: string;
  description: string;
  score: number;
  date: string;
  createdAt: any;
}

interface AppState {
  user: FirebaseUser | null;
  isAuthReady: boolean;
  intentions: Intention[];
  ladder: LadderItem[];
  currentLadderStage: string;
  dailyBlocks: DailyBlock[];
  weeklyReviews: WeeklyReviewType[];
  reframes: Reframe[];
  trackers: Tracker[];
  quickTasks: QuickTask[];
  dailyStats: DailyStats[];
  focusGoals: FocusGoal[];
  focusSessions: FocusSession[];
  focusSettings: FocusSettings | null;
  rewards: Reward[];
  pinnedActions: PinnedAction[];
  notes: Note[];
  matrixItems: MatrixItem[];
  triggerSteps: TriggerStep[];
  mistakes: Mistake[];
  themeSettings: ThemeSettings | null;
  isFocusMode: boolean;

  setUser: (user: FirebaseUser | null) => void;
  setAuthReady: (ready: boolean) => void;
  
  setIntentions: (intentions: Intention[]) => void;
  setDailyBlocks: (blocks: DailyBlock[]) => void;
  setWeeklyReviews: (reviews: WeeklyReviewType[]) => void;
  setLadder: (ladder: LadderItem[]) => void;
  setReframes: (reframes: Reframe[]) => void;
  setTrackers: (trackers: Tracker[]) => void;
  setQuickTasks: (tasks: QuickTask[]) => void;
  setDailyStats: (stats: DailyStats[]) => void;
  setFocusGoals: (goals: FocusGoal[]) => void;
  setFocusSessions: (sessions: FocusSession[]) => void;
  setFocusSettings: (settings: FocusSettings | null) => void;
  setRewards: (rewards: Reward[]) => void;
  setPinnedActions: (actions: PinnedAction[]) => void;
  setNotes: (notes: Note[]) => void;
  setMatrixItems: (items: MatrixItem[]) => void;
  setTriggerSteps: (steps: TriggerStep[]) => void;
  setMistakes: (mistakes: Mistake[]) => void;
  setThemeSettings: (settings: ThemeSettings | null) => void;
  setFocusMode: (enabled: boolean) => void;

  addIntention: (intention: Omit<Intention, 'id' | 'uid'>) => void;
  deleteIntention: (id: string) => void;
  
  setCurrentLadderStage: (id: string) => void;
  
  addDailyBlock: (block: Omit<DailyBlock, 'id' | 'uid'>) => void;
  deleteDailyBlock: (id: string) => void;
  
  addWeeklyReview: (review: Omit<WeeklyReviewType, 'id' | 'uid' | 'date'>) => void;
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
        { id: '1', stageNum: 'Tahap 1', stageName: 'Sekarang', skill: 'Kerja + Survey = income primer stabil. YouTube = 0. Sistem baru dimulai. Kuliah online berjalan.', income: 'UMR' },
        { id: '2', stageNum: 'Tahap 2', stageName: 'Bulan 1–3', skill: '10–15 video live. Workflow otomatis terbentuk. Belum monetisasi tapi sistem sudah berjalan konsisten.', income: 'UMR + $0' },
        { id: '3', stageNum: 'Tahap 3', stageName: 'Bulan 3–8', skill: 'YPP aktif. Income YT pertama masuk. Kuliah hampir selesai membebaskan 2 jam malam untuk YT.', income: '+$100–500' },
        { id: '4', stageNum: 'Tahap 4', stageName: 'Bulan 8–18', skill: 'YT stabil + skill dari kuliah diaplikasikan. Pertimbangkan microstock kembali atau Framer template.', income: '+$500–2k' },
        { id: '5', stageNum: 'Tahap 5', stageName: 'Bulan 18–36', skill: 'Multiple streams: YT ads + sponsorship + template sales + web design. Top 5% nasional tercapai.', income: 'Rp15–25jt' },
      ],
      currentLadderStage: '1',
      dailyBlocks: [],
      weeklyReviews: [],
      reframes: [],
      trackers: [],
      quickTasks: [],
      dailyStats: [],
      focusGoals: [],
      focusSessions: [],
      focusSettings: null,
      rewards: [],
      pinnedActions: [],
      notes: [],
      matrixItems: [],
      triggerSteps: [],
      mistakes: [],
      themeSettings: null,
      isFocusMode: false,

      setUser: (user) => set({ user }),
      setAuthReady: (isAuthReady) => set({ isAuthReady }),

      setIntentions: (intentions) => set({ intentions }),
      setDailyBlocks: (dailyBlocks) => set({ dailyBlocks }),
      setWeeklyReviews: (weeklyReviews) => set({ weeklyReviews }),
      setLadder: (ladder) => set({ ladder }),
      setReframes: (reframes) => set({ reframes }),
      setTrackers: (trackers) => set({ trackers }),
      setQuickTasks: (quickTasks) => set({ quickTasks }),
      setDailyStats: (dailyStats) => set({ dailyStats }),
      setFocusGoals: (focusGoals) => set({ focusGoals }),
      setFocusSessions: (focusSessions) => set({ focusSessions }),
      setFocusSettings: (focusSettings) => set({ focusSettings }),
      setRewards: (rewards) => set({ rewards }),
      setPinnedActions: (pinnedActions) => set({ pinnedActions }),
      setNotes: (notes) => set({ notes }),
      setMatrixItems: (matrixItems) => set({ matrixItems }),
      setTriggerSteps: (triggerSteps) => set({ triggerSteps }),
      setMistakes: (mistakes) => set({ mistakes }),
      setThemeSettings: (themeSettings) => set({ themeSettings }),
      setFocusMode: (isFocusMode) => set({ isFocusMode }),

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

