import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export function StatusCodesChart({ data }) {
  const chartData = {
    labels: Object.keys(data),
    datasets: [
      {
        label: "Status Codes",
        data: Object.values(data),
        backgroundColor: [
          "rgba(54, 162, 235, 0.8)", // Blue
          "rgba(255, 206, 86, 0.8)", // Yellow
          "rgba(255, 99, 132, 0.8)", // Red
          "rgba(75, 192, 192, 0.8)", // Teal
        ],
        borderColor: [
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(255, 99, 132, 1)",
          "rgba(75, 192, 192, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false, // Disable the title in the chart options
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          borderColor: "#E5E7EB", // Light grid color for better visibility
          color: "#E5E7EB",
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
    <div className="bg-gradient-to-br from-blue-100 via-white to-blue-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 rounded-xl shadow-xl p-8 transition-all duration-300 hover:shadow-2xl">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
          Request Status Code Distribution
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          A breakdown of the status codes in your traffic log data.
        </p>
      </div>

      <Bar data={chartData} options={options} />
    </div>
  );
}
