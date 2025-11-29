import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const WeeklyProgressChart = ({ data }) => {
  // Fallback data jika API belum ada data
  const defaultData = [
    { week: "Week 1", completed: 0, target: 5 },
    { week: "Week 2", completed: 0, target: 5 },
    { week: "Week 3", completed: 0, target: 5 },
    { week: "Week 4", completed: 0, target: 5 },
    { week: "Current", completed: 0, target: 5 },
  ];

  const chartData = data && data.length > 0 ? data : defaultData;

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Weekly Progress
      </h3>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="completed"
              stroke="#10b981"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="target"
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-[300px] text-gray-500">
          No weekly progress data available
        </div>
      )}
    </div>
  );
};

export default WeeklyProgressChart;
