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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export function TrafficOverTimeChart({ data }) {
  const chartData = {
    labels: data.map((d) => d.hour), // Assuming 'hour' is the time unit
    datasets: [
      {
        label: "Requests Over Time",
        data: data.map((d) => d.count),
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.5)",
        tension: 0.1,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: "#4B5563", // Dark gray for legend
          font: {
            size: 14,
          },
        },
      },
      title: {
        display: true,
        text: "Traffic Over Time (by Hour)", // Added time unit (can be customized)
        font: {
          size: 20,
          weight: "bold" as const,
        },
        color: "#1F2937", // Dark text for readability
        padding: {
          top: 10,
          bottom: 20,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "#E5E7EB", // Light grid color for better visibility
        },
        ticks: {
          color: "#6B7280", // Darker tick color for readability
        },
      },
      x: {
        ticks: {
          color: "#6B7280", // Darker tick color for readability
        },
      },
    },
  };

  return (
    <div className="bg-gradient-to-br from-green-100 via-white to-green-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 rounded-xl shadow-lg p-8 transition-all duration-300 hover:shadow-xl">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 text-center">
          Visualizing Traffic Over Time
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-1">
          A breakdown of requests over time by hour.
        </p>
      </div>
      <Line data={chartData} options={options} />
    </div>
  );
}
