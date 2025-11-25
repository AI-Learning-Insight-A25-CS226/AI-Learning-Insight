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

const AverageStudyTimeChart = ({ metrics }) => {
  const data = [
    { day: "Mon", hours: 2.5 },
    { day: "Tue", hours: 3.2 },
    // { day: "Wed", hours: metrics?.avg_completion_time_hours || 2.8 },
    { day: "Wed", hours: 2.8 },
    { day: "Thu", hours: 4.1 },
    { day: "Fri", hours: 3.5 },
    { day: "Sat", hours: 2.0 },
    { day: "Sun", hours: 1.8 },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Average Study Time
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="hours" fill="#6366f1" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AverageStudyTimeChart;
