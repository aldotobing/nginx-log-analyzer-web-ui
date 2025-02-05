import React from "react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import { Info } from "lucide-react";

ChartJS.register(ArcElement, Tooltip, Legend);

const HTTP_METHOD_DESCRIPTIONS: Readonly<Record<string, string>> = {
  GET: "Retrieves data from the server",
  POST: "Submits data to be processed to the server",
  PUT: "Updates existing resource on the server",
  DELETE: "Removes specified resource from the server",
  PATCH: "Applies partial modifications to a resource",
  OPTIONS: "Describes communication options for the target resource",
  HEAD: "Same as GET but returns only HTTP headers",
};

const HTTP_METHOD_COLORS: Readonly<
  Record<string, { base: string; hover: string }>
> = {
  GET: { base: "#3B82F6", hover: "#2563EB" }, // Blue
  POST: { base: "#10B981", hover: "#059669" }, // Green
  PUT: { base: "#F59E0B", hover: "#D97706" }, // Yellow
  DELETE: { base: "#EF4444", hover: "#DC2626" }, // Red
  PATCH: { base: "#8B5CF6", hover: "#7C3AED" }, // Purple
  OPTIONS: { base: "#6B7280", hover: "#4B5563" }, // Gray
  HEAD: { base: "#EC4899", hover: "#DB2777" }, // Pink
};

interface HttpMethodsChartProps {
  data: Record<string, number>;
}

export function HttpMethodsChart({ data }: HttpMethodsChartProps) {
  const total = Object.values(data).reduce((sum, value) => sum + value, 0);

  if (total === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
          HTTP Methods Distribution
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          No data available to display.
        </p>
      </div>
    );
  }

  // Calculate percentages and sort by value
  const methodsData = Object.entries(data)
    .map(([method, count]) => ({
      method,
      count,
      percentage: ((count / total) * 100).toFixed(1),
    }))
    .sort((a, b) => b.count - a.count);

  const chartData = {
    labels: methodsData.map((item) => item.method),
    datasets: [
      {
        data: methodsData.map((item) => item.count),
        backgroundColor: methodsData.map(
          (item) => HTTP_METHOD_COLORS[item.method]?.base ?? "#6B7280"
        ),
        hoverBackgroundColor: methodsData.map(
          (item) => HTTP_METHOD_COLORS[item.method]?.hover ?? "#4B5563"
        ),
        borderWidth: 2,
        borderColor: "#ffffff",
      },
    ],
  };

  const options: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "60%",
    plugins: {
      legend: {
        position: "right",
        labels: {
          padding: 20,
          font: {
            size: 13,
            family: "'Inter', sans-serif",
          },
          generateLabels: (chart) => {
            const datasets = chart.data.datasets[0];
            if (
              !datasets.backgroundColor ||
              !Array.isArray(datasets.backgroundColor)
            ) {
              return [];
            }
            return (chart.data.labels || []).map((label, i) => ({
              text: `${label as string} (${methodsData[i].percentage}%)`,
              fillStyle: Array.isArray(datasets.backgroundColor)
                ? datasets.backgroundColor[i]
                : "#6B7280",
              hidden: false,
              index: i,
            }));
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const method = context.label ?? "Unknown";
            const count = context.raw as number;
            const percentage = ((count / total) * 100).toFixed(1);
            return [
              `Count: ${count.toLocaleString()}`,
              `Percentage: ${percentage}%`,
              `Description: ${
                HTTP_METHOD_DESCRIPTIONS[method] ?? "Other HTTP method"
              }`,
            ];
          },
        },
      },
    },
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
            HTTP Methods Distribution
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Analysis of {total.toLocaleString()} requests
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Hover for details
          </span>
        </div>
      </div>

      <div className="h-[400px] relative">
        <Doughnut data={chartData} options={options} />
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {methodsData.slice(0, 3).map(({ method, count, percentage }) => (
          <div
            key={method}
            className="p-4 rounded-lg"
            style={{
              backgroundColor: `${
                HTTP_METHOD_COLORS[method]?.base ?? "#6B7280"
              }15`,
            }}
          >
            <div className="font-semibold text-gray-700 dark:text-gray-300">
              {method}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {count.toLocaleString()} requests ({percentage}%)
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HttpMethodsChart;
