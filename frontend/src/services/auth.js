import api from './api';

export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data.data.user;
};

export const logout = () => {
  localStorage.removeItem('access_token');
};

// Metrics API
export const getMetrics = async (developerId) => {
  const response = await api.get(`/api/developers/${developerId}/metrics`);
  return response.data.data.metrics;
};

export const updateMetrics = async (developerId, metrics) => {
  const response = await api.put(`/api/developers/${developerId}/metrics`, metrics);
  return response.data.data.metrics;
};

// Insights API
export const getInsights = async (developerId) => {
  const response = await api.get(`/api/developers/${developerId}/insights`);
  return response.data.data.insight;
};

export const generateInsights = async (developerId) => {
  const response = await api.post(`/api/developers/${developerId}/insights`);
  return response.data.data.insight;
};

// Chart Data APIs
export const getStudyTimeData = async (developerId) => {
  const response = await api.get(`/api/developers/${developerId}/study-time`);
  return response.data.data.studyTime;
};

export const getWeeklyProgressData = async (developerId) => {
  const response = await api.get(`/api/developers/${developerId}/weekly-progress`);
  return response.data.data.weeklyProgress;
};

export const getHistoricalData = async (developerId) => {
  const response = await api.get(`/api/developers/${developerId}/historical-performance`);
  return response.data.data.historical;
};