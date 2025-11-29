import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getMetrics,
  getInsights,
  generateInsights,
  getStudyTimeData,
  getWeeklyProgressData,
  getHistoricalData,
} from "../services/auth";
import MetricCard from "../components/dashboard/MetricCard";
import AverageStudyTimeChart from "../components/dashboard/AverageStudyTimeChart";
import WeeklyProgressChart from "../components/dashboard/WeeklyProgressChart";
import HistoricalComparisonChart from "../components/dashboard/HistoricalComparisonChart";
import MetricsBreakdown from "../components/dashboard/MetricsBreakdown";
import {
  Brain,
  RefreshCw,
  TrendingUp,
  Clock,
  Target,
  Award,
} from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [insights, setInsights] = useState(null);
  const [studyTimeData, setStudyTimeData] = useState([]);
  const [weeklyProgressData, setWeeklyProgressData] = useState([]);
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingInsights, setGeneratingInsights] = useState(false);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const [metricsData, insightsData, studyTime, weeklyProgress, historical] =
        await Promise.all([
          getMetrics(user.id),
          getInsights(user.id).catch(() => null),
          getStudyTimeData(user.id).catch(() => []),
          getWeeklyProgressData(user.id).catch(() => []),
          getHistoricalData(user.id).catch(() => []),
        ]);

      setMetrics(metricsData);
      setInsights(insightsData);
      setStudyTimeData(studyTime);
      setWeeklyProgressData(weeklyProgress);
      setHistoricalData(historical);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInsights = async () => {
    if (!user?.id) return;

    try {
      setGeneratingInsights(true);
      const newInsights = await generateInsights(user.id);
      setInsights(newInsights);
    } catch (error) {
      console.error("Error generating insights:", error);
    } finally {
      setGeneratingInsights(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Learning Dashboard
        </h1>
        <p className="text-gray-600">
          Track your learning progress and insights
        </p>
      </div>

      {/* Insights Section */}
      {insights && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg p-6 mb-8 text-white">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-3">
                <Brain className="h-6 w-6 mr-2" />
                <h2 className="text-xl font-semibold">
                  Your Learning Style: {insights.learning_style}
                </h2>
              </div>
              <p className="text-white/90 mb-4">{insights.insight_text}</p>
              <div className="flex items-center space-x-4 text-sm">
                <span className="bg-white/20 px-3 py-1 rounded-full">
                  Confidence: {(insights.confidence_score * 100).toFixed(0)}%
                </span>
                <span className="bg-white/20 px-3 py-1 rounded-full">
                  Cluster: {insights.cluster_label || "N/A"}
                </span>
              </div>
            </div>
            <button
              onClick={handleGenerateInsights}
              disabled={generatingInsights}
              className="ml-4 bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`h-5 w-5 ${
                  generatingInsights ? "animate-spin" : ""
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Active Days"
          value={metrics?.total_active_days || 0}
          icon={TrendingUp}
          color="blue"
        />
        <MetricCard
          title="Avg Completion Time"
          value={`${metrics?.avg_completion_time_hours?.toFixed(1) || 0}h`}
          icon={Clock}
          color="green"
        />
        <MetricCard
          title="Journeys Completed"
          value={metrics?.total_journeys_completed || 0}
          icon={Target}
          color="purple"
        />
        <MetricCard
          title="Avg Exam Score"
          value={`${metrics?.avg_exam_score?.toFixed(1) || 0}%`}
          icon={Award}
          color="yellow"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <AverageStudyTimeChart data={studyTimeData} />
        <WeeklyProgressChart data={weeklyProgressData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HistoricalComparisonChart data={historicalData} />
        <MetricsBreakdown metrics={metrics} />
      </div>
    </div>
  );
};

export default Dashboard;
