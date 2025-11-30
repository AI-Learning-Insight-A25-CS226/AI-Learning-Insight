import api from "./api";

export const login = async (email, password) => {
  const response = await api.post("/auth/login", { email, password });
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get("/auth/me");
  return response.data.data.user;
};

export const logout = () => {
  localStorage.removeItem("access_token");
};

export const getMetrics = async (developerId) => {
  const response = await api.get(
    `/api/developers/${developerId}/metrics`
  );
  return response.data.data;
};

export const updateMetrics = async (developerId, metrics) => {
  const response = await api.put(
    `/api/developers/${developerId}/metrics`,
    metrics
  );
  return response.data.data;
};

export const getInsights = async (developerId) => {
  const response = await api.get(
    `/api/developers/${developerId}/insights`
  );
  return response.data.data.insight;
};

export const generateInsights = async (developerId) => {
  const response = await api.post(
    `/api/developers/${developerId}/insights`
  );
  return response.data.data.insight;
};

export const getStudyTimeData = async (developerId) => {
  const response = await api.get(`/api/developers/${developerId}/metrics`);
  const m = response.data.data || {};

  const totalJourneys = Number(m.total_journeys_completed || 0);
  const avgCompletionHours = Number(m.avg_completion_time_hours || 0);
  const activeDays = Number(m.total_active_days || 0);

  if (!totalJourneys || !avgCompletionHours || !activeDays) {
    return [
      { day: "Mon", hours: 0 },
      { day: "Tue", hours: 0 },
      { day: "Wed", hours: 0 },
      { day: "Thu", hours: 0 },
      { day: "Fri", hours: 0 },
      { day: "Sat", hours: 0 },
      { day: "Sun", hours: 0 },
    ];
  }

  let totalHours = totalJourneys * avgCompletionHours;
  let avgDailyHours = totalHours / activeDays;

  avgDailyHours = Math.max(0, Math.min(avgDailyHours, 8));

  const factors = [1.1, 1.0, 0.9, 1.0, 1.1, 0.7, 0.6];
  const sumFactors = factors.reduce((a, b) => a + b, 0);
  const base = (avgDailyHours * 7) / sumFactors;

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return days.map((day, i) => ({
    day,
    hours: Number((base * factors[i]).toFixed(1)),
  }));
};

export const getWeeklyProgressData = async (developerId) => {
  const response = await api.get(
    `/api/developers/${developerId}/metrics/weekly`
  );
  return response.data.data ?? [];
};

export const getHistoricalData = async (developerId) => {
  const response = await api.get(
    `/api/developers/${developerId}/metrics/history`
  );
  return response.data.data ?? [];
};