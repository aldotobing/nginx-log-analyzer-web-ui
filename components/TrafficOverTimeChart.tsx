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
    hour: string;
    count: number;
  }>;
}

export function TrafficOverTimeChart({ data }: TrafficOverTimeChartProps) {
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
      processedLabels = data.map((d) => {
        if (typeof d.hour === "string") {
          const [_, time] = d.hour.split(" ");
          return time.slice(0, 5); // Format as HH:MM
        }
        return "";
      });
      processedData = data.map((d) => d.count);
      total = data.reduce((sum, d) => sum + d.count, 0);
    } else {
      const dailyData = data.reduce((acc, curr) => {
        if (typeof curr.hour === "string") {
          const [date] = curr.hour.split(" ");
          acc[date] = (acc[date] || 0) + curr.count;
        }
        return acc;
      }, {} as Record<string, number>);

      const sortedDays = Object.keys(dailyData).sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime()
      );

      processedLabels = sortedDays.map((day) =>
        new Date(day).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      );
      processedData = sortedDays.map((day) => dailyData[day]);
      total = processedData.reduce((sum, count) => sum + count, 0);
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
          label: `Requests (${timeFrame === "hourly" ? "Hourly" : "Daily"})`,
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
          footerColor: "#F3F4F6",
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
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: timeFrame === "hourly" ? 12 : 8,
          },
          title: {
            display: true,
            text: timeFrame === "hourly" ? "Time of Day (UTC)" : "Date",
            color: "#4B5563",
            font: {
              size: 14,
              weight: 600 as const,
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
              ? "Hourly request patterns with trend analysis"
              : "Daily aggregate metrics with historical comparison"}
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
            Daily
          </span>
        </div>
      </div>

      <div className="relative h-80">
        <Line data={chartData} options={options} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="bg-emerald-50 dark:bg-gray-700 p-4 rounded-lg">
          <dt className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
            Peak {timeFrame === "hourly" ? "Hour" : "Day"}
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
            Total Sessions
          </dt>
          <dd className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {totalRequests.toLocaleString()}
          </dd>
        </div>
        <div className="bg-emerald-50 dark:bg-gray-700 p-4 rounded-lg">
          <dt className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
            {timeFrame === "hourly" ? "Today's" : "Current"} Trend
          </dt>
          <dd className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {dataPoints[dataPoints.length - 1] > dataPoints[0]
              ? "↑ Increasing"
              : "↓ Decreasing"}
          </dd>
        </div>
      </div>
    </div>
  );
}
