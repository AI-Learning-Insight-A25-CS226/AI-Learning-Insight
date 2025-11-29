import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const AverageStudyTimeChart = ({ data }) => {
  // Fallback data jika API belum ada data
  const defaultData = [
    { day: "Mon", hours: 0 },
    { day: "Tue", hours: 0 },
    { day: "Wed", hours: 0 },
    { day: "Thu", hours: 0 },
    { day: "Fri", hours: 0 },
    { day: "Sat", hours: 0 },
    { day: "Sun", hours: 0 },
  ];

  const chartData = data && data.length > 0 ? data : defaultData;

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Average Study Time
      </h3>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="hours" fill="#6366f1" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-[300px] text-gray-500">
          No study time data available
        </div>
      )}
    </div>
  );
};

export default AverageStudyTimeChart;
