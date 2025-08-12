import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const StaticSensorChart: React.FC<{ sensorName: string }> = ({ sensorName }) => {
  // Static data and labels
  const chartData = {
    labels: ["0s", "1s", "2s", "3s", "4s", "5s", "6s", "7s", "8s", "9s"],
    datasets: [
      {
        label: `${sensorName} Range`,
        data: [500, 505, 502, 510, 508, 507, 503, 500, 495, 498], // Example static values
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false, // Allow manual control over height/width
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          font: {
            size: 10, // Adjust legend font size
          },
        },
      },
      title: {
        display: true,
        text: `${sensorName} Chart`,
        font: {
          size: 14, // Adjust title font size
        },
      },
    },
    scales: {
      x: {
        ticks: {
          font: {
            size: 10, // Adjust x-axis font size
          },
        },
      },
      y: {
        ticks: {
          font: {
            size: 10, // Adjust y-axis font size
          },
        },
      },
    },
  };

  return (
    <div style={{ width: "150px", height: "200px", margin: "" }}>
      <Line data={chartData} options={chartOptions} />
    </div>
  );
};

export default StaticSensorChart;
