import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Extract the computer's IP from the Metro bundler URL
const debuggerHost = Constants.expoConfig?.hostUri;
const localhost = debuggerHost?.split(':').shift() || 'localhost';

// Use the environment variable if available, otherwise fallback to local dev URL
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 
  (Platform.OS === 'web' ? 'http://localhost:5001/api' : `http://${localhost}:5001/api`);

console.log('API BASE_URL:', BASE_URL);

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

export const getLeaderboard = () => api.get('/leaderboard');
export const getUser = (studentId) => api.get(`/user/${studentId}`);
export const scanNode = (studentId, nodeId) => api.post('/scan', { studentId, nodeId });
export const getNodes = () => api.get('/nodes');

// Admin User Management
export const getUsers = () => api.get('/users');
export const updateUserScore = (studentId, totalScore) => api.put(`/users/${studentId}`, { totalScore });
export const deleteUser = (studentId) => api.delete(`/users/${studentId}`);

export default api;
