import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Change this to your machine's local IP when testing via Expo Go on phone
// Or your deployed Render/Railway URL in production
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.100:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Inject token from storage on every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('hydrosmart_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ============= Auth =============
export const authAPI = {
  register: (phoneNumber: string, name: string, password: string) =>
    api.post('/user/register', { phoneNumber, name, password }),

  login: (phoneNumber: string, password: string) =>
    api.post('/user/login', { phoneNumber, password }),

  getProfile: () => api.get('/user/profile'),

  updateSetup: (data: {
    dailyGoal?: number;
    wakeUpTime?: string;
    wakeUpHour?: number;
    wakeUpMinute?: number;
    sleepTime?: string;
    sleepHour?: number;
    sleepMinute?: number;
    remindersEnabled?: boolean;
    name?: string;
  }) => api.put('/user/setup', data),

  registerPushToken: (expoPushToken: string) =>
    api.put('/user/push-token', { expoPushToken }),
};

// ============= Water =============
export const waterAPI = {
  log: (amount: number, containerLabel?: string) =>
    api.post('/water/log', { amount, containerLabel }),

  getProgress: () => api.get('/water/progress'),

  getHistory: (days = 30) => api.get(`/water/history?days=${days}`),

  undo: () => api.delete('/water/undo'),

  reset: () => api.post('/water/reset'),
};

// ============= Stats =============
export const statsAPI = {
  weekly: () => api.get('/stats/weekly'),
  monthly: () => api.get('/stats/monthly'),
  streak: () => api.get('/stats/streak'),
  nutritionTip: () => api.get('/stats/nutrition-tip'),
};

export default api;
