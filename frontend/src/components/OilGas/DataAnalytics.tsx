import React from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const generateData = (base: number, fluctuation: number) =>
  Array.from({ length: 10 }, (_, i) => ({
    time: `${i}:00`,
    value: base + Math.random() * fluctuation,
  }));

const pieData = [
  { name: "Normal", value: 60 },
  { name: "Warning", value: 30 },
  { name: "Critical", value: 10 },
];

const charts = [
  { title: "Pressure Over Time", data: generateData(120, 10), color: "#82ca9d", type: "line" },
  { title: "Temperature Over Time", data: generateData(300, 15), color: "#f56a79", type: "line" },
  { title: "Flow Rate Over Time", data: generateData(45, 5), color: "#8884d8", type: "bar" },
  { title: "Gas Detection", data: generateData(10, 5), color: "#f6d55c", type: "bar" },
  { title: "Humidity Levels", data: generateData(50, 10), color: "#82caff", type: "line" },
  { title: "Leak Detection", data: generateData(5, 2), color: "#ffcc5c", type: "bar" },
  { title: "Energy Consumption", data: generateData(200, 30), color: "#d24d57", type: "line" },
  { title: "Vibration Levels", data: generateData(20, 10), color: "#6c5b7b", type: "line" },
];

const DataAnalytics: React.FC = () => {
  return (
    <div className="p-4 bg-white shadow rounded-3xl">
      {/* Charts */}
      <div className="grid grid-cols-4 gap-4">
        {charts.map((chart, index) => (
          <div
            key={index}
            className="p-2 bg-white rounded shadow"
            style={{
              gridColumn: chart.type === "pie" ? "span 2" : "span 1", // Pie charts span two columns
            }}
          >
            <h3 className="mb-2 text-sm font-semibold">{chart.title}</h3>
            <ResponsiveContainer width="100%" height={chart.type === "pie" ? 200 : 230}>
              {chart.type === "line" && (
                <LineChart data={chart.data}>
                  <Line type="monotone" dataKey="value" stroke={chart.color} />
                  <CartesianGrid stroke="#ccc" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                </LineChart>
              )}
              {chart.type === "bar" && (
                <BarChart data={chart.data}>
                  <Bar dataKey="value" fill={chart.color} />
                  <CartesianGrid stroke="#ccc" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                </BarChart>
              )}
              {chart.type === "pie" && (
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60}>
                    {pieData.map((entry, i) => (
                      <Cell key={`cell-${i}`} fill={["#82ca9d", "#f6d55c", "#f56a79"][i]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DataAnalytics;
