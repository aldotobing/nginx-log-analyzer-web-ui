import { useState, useMemo, useEffect } from "react";
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

interface TrafficOverTimeChartProps {
  data: Array<{
    hour: number; // Changed from string to number to match the actual data structure
    count: number;
  }>;
}

export default function TrafficOverTimeChart({
  data,
}: TrafficOverTimeChartProps) {
  const [timeFrame, setTimeFrame] = useState<"hourly" | "daily">("hourly");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { labels, dataPoints, totalRequests } = useMemo(() => {
    let processedLabels: string[] = [];
    let processedData: number[] = [];
    let total = 0;

    if (timeFrame === "hourly") {
      // Format hours properly
      processedLabels = data.map((d) => {
        const hour = d.hour;
        return `${hour.toString().padStart(2, "0")}:00`;
      });
      processedData = data.map((d) => d.count);
      total = data.reduce((sum, d) => sum + d.count, 0);
    } else {
      // For daily view, group by 6-hour intervals
      const intervals = 4;
      const hoursPerInterval = 24 / intervals;

      const dailyData = Array(intervals).fill(0);
      const dailyLabels = Array(intervals).fill("");

      data.forEach((d) => {
        const intervalIndex = Math.floor(d.hour / hoursPerInterval);
        if (intervalIndex >= 0 && intervalIndex < intervals) {
          dailyData[intervalIndex] += d.count;
        }
      });

      for (let i = 0; i < intervals; i++) {
        const startHour = i * hoursPerInterval;
        const endHour = startHour + hoursPerInterval - 1;
        dailyLabels[i] = `${startHour.toString().padStart(2, "0")}:00-${endHour
          .toString()
          .padStart(2, "0")}:59`;
      }

      processedLabels = dailyLabels;
      processedData = dailyData;
      total = dailyData.reduce((sum, count) => sum + count, 0);
    }

    return {
      labels: processedLabels,
      dataPoints: processedData,
      totalRequests: total,
    };
  }, [data, timeFrame]);

  const chartData = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: `Requests (${
            timeFrame === "hourly" ? "Hourly" : "6-Hour Intervals"
          })`,
          data: dataPoints,
          borderColor: "rgb(16, 185, 129)",
          backgroundColor: isMounted
            ? (context: any) => {
                const chart = context.chart;
                const { ctx, chartArea } = chart;
                if (!chartArea) return null;
                const gradient = ctx.createLinearGradient(
                  0,
                  chartArea.bottom,
                  0,
                  chartArea.top
                );
                gradient.addColorStop(0, "rgba(16, 185, 129, 0.3)");
                gradient.addColorStop(1, "rgba(16, 185, 129, 0.01)");
                return gradient;
              }
            : "rgba(16, 185, 129, 0.3)",
          tension: 0.4,
          fill: true,
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: "rgb(16, 185, 129)",
          borderWidth: 2,
        },
      ],
    }),
    [labels, dataPoints, timeFrame, isMounted]
  );

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top" as const,
          labels: {
            color: "#374151",
            font: {
              size: 14,
              weight: 600,
            },
          },
        },
        title: {
          display: true,
          text: `Traffic Pattern Analysis - ${totalRequests.toLocaleString()} Total Requests`,
          color: "#1F2937",
          font: {
            size: 18,
            weight: 700,
          },
          padding: {
            top: 5,
            bottom: 15,
          },
        },
        tooltip: {
          mode: "index" as const,
          intersect: false,
          backgroundColor: "#1F2937",
          titleColor: "#F3F4F6",
          bodyColor: "#F3F4F6",
          padding: 12,
          cornerRadius: 6,
          displayColors: true,
          callbacks: {
            label: (context: any) => {
              const label = context.dataset.label || "";
              const value = context.parsed.y || 0;
              return ` ${label}: ${value.toLocaleString()}`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: "#E5E7EB",
          },
          ticks: {
            color: "#6B7280",
            callback: (value: string | number) =>
              Number(value).toLocaleString(),
          },
          title: {
            display: true,
            text: "Number of Requests",
            color: "#4B5563",
            font: {
              size: 14,
              weight: 600,
            },
          },
        },
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: "#6B7280",
            maxRotation: 45,
            autoSkip: true,
            maxTicksLimit: timeFrame === "hourly" ? 24 : 4,
          },
          title: {
            display: true,
            text: timeFrame === "hourly" ? "Time (UTC)" : "Time Intervals",
            color: "#4B5563",
            font: {
              size: 14,
              weight: 600,
            },
          },
        },
      },
      animation: {
        duration: 800,
        easing: "easeInOutQuart" as const,
      },
      interaction: {
        mode: "nearest" as const,
        axis: "x" as const,
        intersect: false,
      },
    }),
    [totalRequests, timeFrame]
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
            Traffic Analysis Dashboard
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {timeFrame === "hourly"
              ? "Hourly request patterns"
              : "6-hour interval analysis"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Hourly
          </span>
          <button
            onClick={() =>
              setTimeFrame((prev) => (prev === "hourly" ? "daily" : "hourly"))
            }
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${
              timeFrame === "hourly" ? "bg-emerald-500" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                timeFrame === "hourly" ? "translate-x-1.5" : "translate-x-6"
              }`}
            />
          </button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Intervals
          </span>
        </div>
      </div>

      <div className="relative h-80">
        <Line data={chartData} options={options} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="bg-emerald-50 dark:bg-gray-700 p-4 rounded-lg">
          <dt className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
            Peak {timeFrame === "hourly" ? "Hour" : "Interval"}
          </dt>
          <dd className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {labels[dataPoints.indexOf(Math.max(...dataPoints))]}
          </dd>
        </div>
        <div className="bg-emerald-50 dark:bg-gray-700 p-4 rounded-lg">
          <dt className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
            Avg. Requests
          </dt>
          <dd className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {Math.round(totalRequests / dataPoints.length).toLocaleString()}
          </dd>
        </div>
        <div className="bg-emerald-50 dark:bg-gray-700 p-4 rounded-lg">
          <dt className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
            Total Requests
          </dt>
          <dd className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {totalRequests.toLocaleString()}
          </dd>
        </div>
        <div className="bg-emerald-50 dark:bg-gray-700 p-4 rounded-lg">
          <dt className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
            Current Trend
          </dt>
          <dd className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {dataPoints[dataPoints.length - 1] >
            dataPoints[dataPoints.length - 2]
              ? "↑ Increasing"
              : "↓ Decreasing"}
          </dd>
        </div>
      </div>
    </div>
  );
}
