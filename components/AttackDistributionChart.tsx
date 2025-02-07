import React from "react";
import { Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Info } from "lucide-react";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface AttackDistributionChartProps {
  data: { [key: string]: number };
}

export function AttackDistributionChart({
  data,
}: AttackDistributionChartProps) {
  // Check for dark mode
  const isDarkMode = document.documentElement.classList.contains("dark");
  // Calculate total attacks
  const totalAttacks = Object.values(data).reduce((a, b) => a + b, 0);
  // Determine the most frequent attack type
  const mostFrequentAttack = totalAttacks
    ? Object.keys(data).reduce((a, b) => (data[a] > data[b] ? a : b), "")
    : "No Data";
  // Calculate percentage and counts for each attack type
  const attackPercentages = totalAttacks
    ? Object.entries(data).map(([key, value]) => ({
        attackType: key,
        percentage: ((value / totalAttacks) * 100).toFixed(2),
        count: value,
      }))
    : [];

  // Prepare chart data for the radar chart
  const chartData = {
    labels: Object.keys(data),
    datasets: [
      {
        label: "Attack Distribution",
        data: Object.values(data),
        backgroundColor: isDarkMode
          ? "rgba(239, 68, 68, 0.2)"
          : "rgba(239, 68, 68, 0.1)",
        borderColor: isDarkMode
          ? "rgba(239, 68, 68, 0.8)"
          : "rgba(239, 68, 68, 0.6)",
        borderWidth: 2,
        pointBackgroundColor: isDarkMode
          ? "rgba(239, 68, 68, 0.8)"
          : "rgba(239, 68, 68, 0.6)",
        pointBorderColor: isDarkMode ? "#111827" : "#ffffff",
        pointHoverBackgroundColor: "#ffffff",
        pointHoverBorderColor: "rgba(239, 68, 68, 1)",
      },
    ],
  };

  // Chart options
  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: isDarkMode ? "#111827" : "rgba(255, 255, 255, 0.9)",
        titleColor: isDarkMode ? "#F3F4F6" : "#111827",
        bodyColor: isDarkMode ? "#E5E7EB" : "#1F2937",
        padding: 12,
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        grid: {
          color: isDarkMode
            ? "rgba(229, 231, 235, 0.1)"
            : "rgba(55, 65, 81, 0.1)",
        },
        angleLines: {
          color: isDarkMode
            ? "rgba(229, 231, 235, 0.1)"
            : "rgba(55, 65, 81, 0.1)",
        },
        pointLabels: {
          color: isDarkMode ? "#E5E7EB" : "#374151",
          font: {
            family: "'Inter', sans-serif",
          },
        },
        ticks: {
          color: isDarkMode ? "#E5E7EB" : "#374151",
          backdropColor: "transparent",
          font: {
            family: "'Inter', sans-serif",
          },
        },
      },
    },
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl">
      {/* Header with additional information */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
            Attack Distribution
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            This radar chart visualizes the distribution of detected attack
            types. Out of {totalAttacks.toLocaleString()} total attacks, each
            axis represents an attack type and its relative frequency. Hover on
            the chart for details.
          </p>
        </div>
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <Info className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Hover for details
          </span>
        </div>
      </div>

      {/* Flex container to place the chart and summary cards side-by-side on larger screens */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Radar Chart Container */}
        <div className="w-full md:w-2/3">
          <div className="h-[400px] relative">
            {totalAttacks > 0 ? (
              <Radar data={chartData} options={options} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-center text-gray-600 dark:text-gray-400">
                  No attack data available to display.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Summary Cards Container */}
        <div className="w-full md:w-1/3">
          <div className="grid grid-cols-1 gap-4">
            {attackPercentages
              .slice(0, 3)
              .map(({ attackType, percentage, count }) => (
                <div
                  key={attackType}
                  className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20"
                >
                  <div className="font-semibold text-gray-700 dark:text-gray-300">
                    {attackType}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {count.toLocaleString()} attacks ({percentage}%)
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Key Insights Section */}
      {totalAttacks > 0 && (
        <div className="mt-8 text-sm text-gray-700 dark:text-gray-300">
          <p>
            <strong>Key Insights & Recommendations:</strong>
          </p>
          <ul className="list-disc pl-6 mt-2">
            <li>
              <strong>{mostFrequentAttack}</strong> is the most frequently
              detected attack type, accounting for{" "}
              {
                attackPercentages.find(
                  (a) => a.attackType === mostFrequentAttack
                )?.percentage
              }
              % of total attacks. Consider enhancing your defenses against this
              threat.
            </li>
            <li>
              The top 3 attack types collectively contribute to{" "}
              {attackPercentages
                .slice(0, 3)
                .reduce((sum, attack) => sum + parseFloat(attack.percentage), 0)
                .toFixed(1)}
              % of all attacks, indicating a concentrated risk area that demands
              targeted monitoring.
            </li>
            <li>
              It is advisable to review your security protocols and implement
              specific countermeasures for high-frequency attack vectors, with a
              special focus on <strong>{mostFrequentAttack}</strong>.
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
