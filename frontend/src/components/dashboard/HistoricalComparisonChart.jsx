import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const HistoricalComparisonChart = ({ data }) => {
  const defaultData = [
    { month: "Jan", score: 0 },
    { month: "Feb", score: 0 },
    { month: "Mar", score: 0 },
    { month: "Apr", score: 0 },
    { month: "May", score: 0 },
    { month: "Jun", score: 0 },
  ];

  const chartData = data && data.length > 0 ? data : defaultData;

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Historical Performance
      </h3>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#8b5cf6"
              fill="#8b5cf6"
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-[300px] text-gray-500">
          No historical performance data available
        </div>
      )}
    </div>
  );
};

export default HistoricalComparisonChart;
