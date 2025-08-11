import { useState, useMemo, useEffect, useCallback } from "react";
import { Line } from "react-chartjs-2";
import { motion } from "framer-motion";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Activity,
  Calendar,
  Zap
} from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface TrafficDataPoint {
  hour: number;
  count: number;
}

interface TrafficOverTimeChartProps {
  data: TrafficDataPoint[];
  className?: string;
}

type TimeFrame = "hourly" | "intervals";

export default function TrafficOverTimeChart({
  data = [],
  className = ""
}: TrafficOverTimeChartProps) {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("hourly");
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Process data based on timeframe
  const processedData = useMemo(() => {
    if (!data.length) {
      return {
        labels: [],
        dataPoints: [],
        totalRequests: 0,
        peakTime: "N/A",
        peakValue: 0,
        avgRequests: 0,
        trend: "stable" as const
      };
    }

    let labels: string[] = [];
    let dataPoints: number[] = [];
    let total = 0;

    if (timeFrame === "hourly") {
      // Sort data by hour to ensure proper order
      const sortedData = [...data].sort((a, b) => a.hour - b.hour);
      
      labels = sortedData.map((d) => {
        const hour = d.hour;
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        const ampm = hour < 12 ? 'AM' : 'PM';
        return `${displayHour}:00 ${ampm}`;
      });
      dataPoints = sortedData.map((d) => d.count);
      total = sortedData.reduce((sum, d) => sum + d.count, 0);
    } else {
      // Group by 6-hour intervals
      const intervals = 4;
      const hoursPerInterval = 24 / intervals;
      const intervalData = Array(intervals).fill(0);
      const intervalLabels = [
        "00:00 - 05:59",
        "06:00 - 11:59", 
        "12:00 - 17:59",
        "18:00 - 23:59"
      ];

      data.forEach((d) => {
        const intervalIndex = Math.floor(d.hour / hoursPerInterval);
        if (intervalIndex >= 0 && intervalIndex < intervals) {
          intervalData[intervalIndex] += d.count;
        }
      });

      labels = intervalLabels;
      dataPoints = intervalData;
      total = intervalData.reduce((sum, count) => sum + count, 0);
    }

    // Calculate metrics
    const peakValue = Math.max(...dataPoints);
    const peakIndex = dataPoints.indexOf(peakValue);
    const peakTime = labels[peakIndex] || "N/A";
    const avgRequests = dataPoints.length > 0 ? Math.round(total / dataPoints.length) : 0;
    
    // Determine trend
    const firstHalf = dataPoints.slice(0, Math.floor(dataPoints.length / 2));
    const secondHalf = dataPoints.slice(Math.floor(dataPoints.length / 2));
    const firstHalfAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    const trend = secondHalfAvg > firstHalfAvg * 1.1 ? "increasing" : 
                 secondHalfAvg < firstHalfAvg * 0.9 ? "decreasing" : "stable";

    return {
      labels,
      dataPoints,
      totalRequests: total,
      peakTime,
      peakValue,
      avgRequests,
      trend
    };
  }, [data, timeFrame]);

  const toggleTimeFrame = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => {
      setTimeFrame(prev => prev === "hourly" ? "intervals" : "hourly");
      setIsLoading(false);
    }, 200);
  }, []);

  // Chart configuration
  const chartData = useMemo(() => ({
    labels: processedData.labels,
    datasets: [
      {
        label: `Traffic Volume (${timeFrame === "hourly" ? "Hourly" : "6-Hour Periods"})`,
        data: processedData.dataPoints,
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: isMounted
          ? (context: any) => {
              const chart = context.chart;
              const { ctx, chartArea } = chart;
              if (!chartArea) return "rgba(59, 130, 246, 0.1)";
              
              const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
              gradient.addColorStop(0, "rgba(59, 130, 246, 0.05)");
              gradient.addColorStop(0.5, "rgba(59, 130, 246, 0.15)");
              gradient.addColorStop(1, "rgba(59, 130, 246, 0.3)");
              return gradient;
            }
          : "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 8,
        pointBackgroundColor: "rgb(59, 130, 246)",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        borderWidth: 3,
        pointHoverBackgroundColor: "rgb(37, 99, 235)",
        pointHoverBorderColor: "#ffffff",
        pointHoverBorderWidth: 2,
      },
    ],
  }), [processedData.labels, processedData.dataPoints, timeFrame, isMounted]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
        backgroundColor: "rgba(17, 24, 39, 0.95)",
        titleColor: "#F9FAFB",
        bodyColor: "#F9FAFB",
        borderColor: "rgba(59, 130, 246, 0.5)",
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        titleFont: {
          size: 14,
          weight: 600,
        },
        bodyFont: {
          size: 13,
        },
        callbacks: {
          title: (context: any) => {
            return `Time: ${context[0].label}`;
          },
          label: (context: any) => {
            const value = context.parsed.y || 0;
            const percentage = ((value / processedData.totalRequests) * 100).toFixed(1);
            return [
              `Requests: ${value.toLocaleString()}`,
              `Share: ${percentage}% of total traffic`
            ];
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(156, 163, 175, 0.2)",
          drawBorder: false,
        },
        border: {
          display: false,
        },
        ticks: {
          color: "#6B7280",
          font: {
            size: 12,
          },
          callback: (value: string | number) => Number(value).toLocaleString(),
        },
      },
      x: {
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
        ticks: {
          color: "#6B7280",
          font: {
            size: 12,
          },
          maxRotation: 45,
          autoSkip: true,
          maxTicksLimit: timeFrame === "hourly" ? 12 : 4,
        },
      },
    },
    animation: {
      duration: 1000,
      easing: "easeInOutQuart" as const,
    },
    interaction: {
      mode: "nearest" as const,
      axis: "x" as const,
      intersect: false,
    },
  }), [processedData.totalRequests, timeFrame]);

  // Metric cards data
  const metrics = [
    {
      title: "Peak Time",
      value: processedData.peakTime,
      icon: Clock,
      color: "blue",
      subtitle: `${processedData.peakValue.toLocaleString()} requests`
    },
    {
      title: "Average",
      value: processedData.avgRequests.toLocaleString(),
      icon: BarChart3,
      color: "green", 
      subtitle: `per ${timeFrame === "hourly" ? "hour" : "interval"}`
    },
    {
      title: "Total Volume",
      value: processedData.totalRequests.toLocaleString(),
      icon: Activity,
      color: "purple",
      subtitle: "requests processed"
    },
    {
      title: "Trend",
      value: processedData.trend === "increasing" ? "Rising" : 
             processedData.trend === "decreasing" ? "Declining" : "Stable",
      icon: processedData.trend === "increasing" ? TrendingUp : 
            processedData.trend === "decreasing" ? TrendingDown : Zap,
      color: processedData.trend === "increasing" ? "green" : 
             processedData.trend === "decreasing" ? "red" : "gray",
      subtitle: "traffic pattern"
    }
  ];

  // No data state
  if (!data.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700/50 p-8 ${className}`}
      >
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <BarChart3 className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Traffic Data
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Upload log files to see traffic patterns over time.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg ${className}`}
    >
      {/* Header */}
      <div className="p-6 pb-4 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              <span>Traffic Timeline Analysis</span>
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {timeFrame === "hourly" 
                ? "Hourly request distribution patterns" 
                : "Traffic volume across 6-hour time periods"}
            </p>
          </div>

          {/* Time Frame Toggle */}
          <div className="flex items-center space-x-3">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Hourly
            </span>
            <button
              onClick={toggleTimeFrame}
              disabled={isLoading}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                timeFrame === "hourly" 
                  ? "bg-blue-500" 
                  : "bg-gray-300 dark:bg-gray-600"
              } ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <motion.span
                className="inline-block h-4 w-4 transform rounded-full bg-white shadow-md"
                animate={{
                  x: timeFrame === "hourly" ? 2 : 22,
                }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Intervals
            </span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-6 pb-4">
        <div className="relative h-80 mb-6">
          <motion.div
            key={timeFrame}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full h-full"
          >
            <Line data={chartData} options={chartOptions} />
          </motion.div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="p-6 pt-0">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            const colorClasses = {
              blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/50",
              green: "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800/50",
              purple: "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/50",
              red: "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/50",
              gray: "bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800/50"
            };

            return (
              <motion.div
                key={metric.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className={`p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${colorClasses[metric.color as keyof typeof colorClasses]}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className="h-4 w-4 opacity-70" />
                  <div className="text-xs font-medium opacity-60">
                    #{index + 1}
                  </div>
                </div>
                <div className="space-y-1">
                  <dt className="text-xs font-semibold uppercase tracking-wide opacity-80">
                    {metric.title}
                  </dt>
                  <dd className="text-lg font-bold">
                    {metric.value}
                  </dd>
                  <p className="text-xs opacity-60">
                    {metric.subtitle}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}