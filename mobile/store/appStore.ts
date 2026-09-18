import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI, waterAPI, statsAPI } from '../services/api';
import type { DndWindow } from '../services/api';
import { Audio } from 'expo-av';

// Safe audio player
const playWaterSound = async () => {
  try {
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/notification_sound.wav')
    );
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate((status: any) => {
      if (status.didJustFinish) sound.unloadAsync();
    });
  } catch (err) {
    console.log('[Audio] Failed to play sound:', err);
  }
};

interface User {
  id: string;
  name: string;
  phoneNumber: string;
  dailyGoal: number;
  wakeUpTime: string;
  wakeUpHour?: number;
  wakeUpMinute?: number;
  sleepTime: string;
  sleepHour?: number;
  sleepMinute?: number;
  setupCompleted: boolean;
  remindersEnabled: boolean;
  timezone: string;
  dndUntil?: string | null;
  dndScheduleEnabled?: boolean;
  dndSchedule?: DndWindow[];
}

interface WaterLog {
  totalConsumed: number;
  goal: number;
  percentage: number;
  remaining: number;
  goalCompleted: boolean;
  entriesCount: number;
  entries: { amount: number; timestamp: string }[];
  date: string;
}

interface AppState {
  // Auth
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Water
  todayLog: WaterLog | null;

  // Stats
  streak: number;
  weeklyStats: any[];
  nutritionTip: string;

  // Actions — Auth
  login: (phoneNumber: string, password: string) => Promise<void>;
  register: (phoneNumber: string, name: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  updateSetup: (data: any) => Promise<void>;
  registerPushToken: (token: string) => Promise<void>;
  setQuickMute: (minutes: number) => Promise<void>;
  cancelQuickMute: () => Promise<void>;
  saveDndSchedule: (enabled: boolean, schedule: DndWindow[]) => Promise<void>;

  // Actions — Water
  fetchProgress: () => Promise<void>;
  logWater: (amount: number, label?: string) => Promise<{ justCompletedGoal: boolean }>;
  undoLast: () => Promise<void>;
  resetDay: () => Promise<void>;

  // Actions — Stats
  fetchWeeklyStats: () => Promise<void>;
  fetchStreak: () => Promise<void>;
  fetchNutritionTip: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  todayLog: null,
  streak: 0,
  weeklyStats: [],
  nutritionTip: '💪 Paneer (100g) me 18g protein hota hai — dinner me paneer tikka try karo!',

  // ======= Auth =======
  loadStoredAuth: async () => {
    try {
      const token = await AsyncStorage.getItem('hydrosmart_token');
      const userStr = await AsyncStorage.getItem('hydrosmart_user');
      if (token && userStr) {
        set({ token, user: JSON.parse(userStr), isAuthenticated: true });
      }
    } catch (_) {}
    set({ isLoading: false });
  },

  login: async (phoneNumber, password) => {
    const res = await authAPI.login(phoneNumber, password);
    const { token, user } = res.data;
    await AsyncStorage.setItem('hydrosmart_token', token);
    await AsyncStorage.setItem('hydrosmart_user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  register: async (phoneNumber, name, password) => {
    const res = await authAPI.register(phoneNumber, name, password);
    const { token, user } = res.data;
    await AsyncStorage.setItem('hydrosmart_token', token);
    await AsyncStorage.setItem('hydrosmart_user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  logout: async () => {
    await AsyncStorage.multiRemove(['hydrosmart_token', 'hydrosmart_user']);
    set({ token: null, user: null, isAuthenticated: false, todayLog: null });
  },

  updateSetup: async (data) => {
    const res = await authAPI.updateSetup(data);
    const updatedUser = { ...get().user, ...res.data.user } as User;
    set({ user: updatedUser });
    await AsyncStorage.setItem('hydrosmart_user', JSON.stringify(updatedUser));
  },

  registerPushToken: async (token: string) => {
    try {
      await authAPI.registerPushToken(token);
    } catch (_) {}
  },

  setQuickMute: async (minutes: number) => {
    const res = await authAPI.setQuickMute(minutes);
    const dndUntil = res.data.dndUntil;
    set(state => ({ user: state.user ? { ...state.user, dndUntil } : state.user }));
  },

  cancelQuickMute: async () => {
    await authAPI.cancelQuickMute();
    set(state => ({ user: state.user ? { ...state.user, dndUntil: null } : state.user }));
  },

  saveDndSchedule: async (enabled: boolean, schedule: DndWindow[]) => {
    const res = await authAPI.saveDndSchedule(enabled, schedule);
    set(state => ({
      user: state.user ? { ...state.user, dndScheduleEnabled: res.data.dndScheduleEnabled, dndSchedule: res.data.dndSchedule } : state.user
    }));
  },

  // ======= Water =======
  fetchProgress: async () => {
    try {
      const res = await waterAPI.getProgress();
      set({ todayLog: res.data });
    } catch (err: any) {
      if (err.response?.status === 401) get().logout();
    }
  },

  logWater: async (amount, label) => {
    const res = await waterAPI.log(amount, label);
    set({ todayLog: { ...res.data.log, date: get().todayLog?.date || '' } });
    // Play water sound (works in production APK, silent in Expo Go)
    playWaterSound();
    return { justCompletedGoal: res.data.justCompletedGoal };
  },

  undoLast: async () => {
    const res = await waterAPI.undo();
    set((state) => ({
      todayLog: state.todayLog ? { ...state.todayLog, ...res.data.log } : null,
    }));
  },

  resetDay: async () => {
    await waterAPI.reset();
    await get().fetchProgress();
  },

  // ======= Stats =======
  fetchWeeklyStats: async () => {
    try {
      const res = await statsAPI.weekly();
      set({ weeklyStats: res.data.stats });
    } catch (err: any) {
      if (err.response?.status === 401) get().logout();
    }
  },

  fetchStreak: async () => {
    try {
      const res = await statsAPI.streak();
      set({ streak: res.data.currentStreak });
    } catch (err: any) {
      if (err.response?.status === 401) get().logout();
    }
  },

  fetchNutritionTip: async () => {
    try {
      const res = await statsAPI.nutritionTip();
      set({ nutritionTip: res.data.tip });
    } catch (err: any) {
      if (err.response?.status === 401) get().logout();
    }
  },
}));
