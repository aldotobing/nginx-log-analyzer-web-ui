import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  BarElement,
  Tooltip,
  Legend,
  TooltipItem,
} from "chart.js";
import { motion } from "framer-motion";

ChartJS.register(CategoryScale, BarElement, Tooltip, Legend);

interface TopRequestedUrlsChartProps {
  fetchData: () => Promise<Record<string, number>>; // Function to fetch top requested URLs data
}

export function TopRequestedUrlsChart({
  fetchData,
}: TopRequestedUrlsChartProps) {
  const [data, setData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const result = await fetchData();
        setData(result);
      } catch (err) {
        console.error("Error fetching requested URLs data:", err);
        setError("Failed to fetch data.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [fetchData]);

  const sortedData = Object.entries(data)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const chartData = {
    labels: sortedData.map(([url]) => url),
    datasets: [
      {
        label: "Request Count",
        data: sortedData.map(([_, count]) => count),
        backgroundColor: "rgba(54, 162, 235, 0.8)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 2,
        hoverBackgroundColor: "rgba(75, 192, 192, 0.9)",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        callbacks: {
          label: (tooltipItem: TooltipItem<"bar">) => {
            const url = tooltipItem.label ?? "Unknown";
            const count = tooltipItem.raw as number;
            return [`URL: ${url}`, `Requests: ${count.toLocaleString()}`];
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          autoSkip: false,
          maxRotation: 45,
          minRotation: 20,
        },
      },
    },
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  if (loading) {
    return (
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
          Loading Top Requested URLs...
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Please wait while we fetch the data.
        </p>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
          Error Loading Data
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">{error}</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="bg-gradient-to-br from-blue-50 to-white dark:from-gray-700 dark:to-gray-800 rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-shadow duration-300"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-200">
        Top Requested URLs
      </h2>
      <div className="h-[200px] sm:h-[300px] mt-4">
        <Bar data={chartData} options={options} />
      </div>

      <div className="mt-4 sm:mt-6">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200">
          Requested URLs List (Top 10)
        </h3>
        <ul className="mt-4 space-y-2 divide-y divide-gray-300 dark:divide-gray-600">
          {sortedData.map(([url, count]) => (
            <li
              key={url}
              className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 py-2"
            >
              <span className="text-gray-700 dark:text-gray-300 break-words whitespace-normal">
                {url}
              </span>
              <span className="font-semibold text-gray-600 dark:text-gray-400">
                {count.toLocaleString()} requests
              </span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

export default TopRequestedUrlsChart;
