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

interface StatusCodesChartProps {
  data: Record<string, number>;
}

export function StatusCodesChart({ data }: StatusCodesChartProps) {
  const isDarkMode = document.documentElement.classList.contains("dark");
  const totalRequests = Object.values(data).reduce((a, b) => a + b, 0);
  const errorResponses = (data["4xx"] || 0) + (data["5xx"] || 0);
  const successResponses = data["2xx"] || 0;
  const errorRatio =
    totalRequests > 0
      ? ((errorResponses / totalRequests) * 100).toFixed(2)
      : "0";
  const mostFrequentStatus =
    totalRequests > 0
      ? Object.keys(data).reduce((a, b) => (data[a] > data[b] ? a : b))
      : "N/A";

  const chartData = {
    labels: Object.keys(data),
    datasets: [
      {
        label: "Status Codes",
        data: Object.values(data),
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)", // Blue (matching GET)
          "rgba(16, 185, 129, 0.8)", // Green (matching POST)
          "rgba(239, 68, 68, 0.8)", // Red (matching DELETE)
          "rgba(139, 92, 246, 0.8)", // Purple (matching PATCH)
        ],
        borderColor: [
          "rgba(59, 130, 246, 1)",
          "rgba(16, 185, 129, 1)",
          "rgba(239, 68, 68, 1)",
          "rgba(139, 92, 246, 1)",
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
        display: false,
      },
      tooltip: {
        backgroundColor: isDarkMode ? "#111827" : "rgba(255, 255, 255, 0.9)",
        titleColor: isDarkMode ? "#F3F4F6" : "#111827",
        bodyColor: isDarkMode ? "#E5E7EB" : "#1F2937",
        padding: 12,
        displayColors: true,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: isDarkMode
            ? "rgba(229, 231, 235, 0.1)"
            : "rgba(55, 65, 81, 0.1)",
          borderColor: isDarkMode
            ? "rgba(229, 231, 235, 0.2)"
            : "rgba(55, 65, 81, 0.2)",
        },
        ticks: {
          color: isDarkMode ? "#E5E7EB" : "#374151",
          font: {
            family: "'Inter', sans-serif",
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: isDarkMode ? "#E5E7EB" : "#374151",
          font: {
            family: "'Inter', sans-serif",
          },
        },
      },
    },
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
            Status Code Distribution
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Analysis of {totalRequests.toLocaleString()} responses
          </p>
        </div>
      </div>

      <div className="h-[400px] relative">
        <Bar data={chartData} options={options} />
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <div className="font-semibold text-gray-700 dark:text-gray-300">
            Success (2xx)
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {successResponses.toLocaleString()} responses
          </div>
        </div>
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
          <div className="font-semibold text-gray-700 dark:text-gray-300">
            Errors (4xx + 5xx)
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {errorResponses.toLocaleString()} responses ({errorRatio}%)
          </div>
        </div>
        <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
          <div className="font-semibold text-gray-700 dark:text-gray-300">
            Most Frequent
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {mostFrequentStatus} status code
          </div>
        </div>
      </div>

      <div className="mt-8 text-sm text-gray-700 dark:text-gray-300">
        <p>
          <strong>Key Insights:</strong>
        </p>
        <ul className="list-disc pl-6 mt-2">
          <li>
            The success rate is {(100 - parseFloat(errorRatio)).toFixed(2)}%
            with {successResponses.toLocaleString()} successful responses
          </li>
          <li>
            Error responses make up {errorRatio}% of total traffic, which{" "}
            {parseFloat(errorRatio) > 5
              ? "might indicate issues"
              : "is within normal range"}
          </li>
          <li>
            {mostFrequentStatus} is the most common status code, indicating{" "}
            {mostFrequentStatus.startsWith("2")
              ? "healthy operation"
              : mostFrequentStatus.startsWith("4")
              ? "client-side issues"
              : mostFrequentStatus.startsWith("5")
              ? "server-side issues"
              : "mixed behavior"}
          </li>
        </ul>
      </div>
    </div>
  );
}
