import React, { useState, useEffect, useMemo } from "react";
import { Bar } from "react-chartjs-2";
import { motion } from "framer-motion";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import { Share2 } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface TopReferringUrlsChartProps {
  data: Record<string, number>;
  className?: string;
}

export function TopReferringUrlsChart({ data, className = "" }: TopReferringUrlsChartProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const darkMode = document.documentElement.classList.contains("dark");
    setIsDarkMode(darkMode);
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const sortedData = useMemo(() => {
    if (!data) return [];
    return Object.entries(data)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7);
  }, [data]);

  const chartDataConfig = useMemo(() => ({
    labels: sortedData.map(([url]) => url === 'Direct' ? 'Direct Traffic' : (url.length > 30 ? `${url.substring(0, 27)}...` : url)),
    datasets: [
      {
        label: "Requests",
        data: sortedData.map(([, count]) => count),
        backgroundColor: isDarkMode ? 'rgba(236, 72, 153, 0.5)' : 'rgba(236, 72, 153, 0.7)',
        borderColor: 'rgba(236, 72, 153, 1)',
        borderWidth: 2,
        borderRadius: 6,
        hoverBackgroundColor: 'rgba(236, 72, 153, 1)',
      },
    ],
  }), [sortedData, isDarkMode]);

  const options: ChartOptions<'bar'> = useMemo(() => ({
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1200,
      easing: 'easeOutQuart'
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        backgroundColor: isDarkMode ? "rgba(17, 24, 39, 0.9)" : "rgba(255, 255, 255, 0.9)",
        titleColor: isDarkMode ? "#F9FAFB" : "#111827",
        bodyColor: isDarkMode ? "#D1D5DB" : "#374151",
        borderColor: isDarkMode ? "rgba(209, 213, 219, 0.2)" : "rgba(0, 0, 0, 0.1)",
        borderWidth: 1,
        padding: 15,
        cornerRadius: 12,
        displayColors: false,
        callbacks: {
          title: (context) => {
            if (sortedData.length > 0) {
                const originalLabel = sortedData[context[0].dataIndex][0];
                return `Referrer: ${originalLabel}`;
            }
            return '';
          },
          label: (context) => `Requests: ${(context.raw as number).toLocaleString()}`,
        },
      },
    },
    scales: {
      y: {
        grid: { display: false },
        ticks: {
          color: isDarkMode ? "#9ca3af" : "#6b7280",
          font: { size: 10 },
        },
      },
      x: {
        beginAtZero: true,
        grid: {
          color: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
          display: false
        },
        border: {
          display: false
        },
        ticks: {
          color: isDarkMode ? "#9ca3af" : "#6b7280",
        },
      },
    },
  }), [isDarkMode, sortedData]);

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className={`p-8 ${className}`}>
        <div className="text-center">
          <Share2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold">No Referrer Data</h3>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="p-6 pb-4 border-b border-gray-200/50 dark:border-gray-700/50">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
          <Share2 className="h-5 w-5 text-pink-500" />
          <span>Top Referring URLs</span>
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Top sources driving traffic to your site.
        </p>
      </div>

      <div className="p-6 space-y-6">
        <div className="h-[200px] sm:h-[250px] relative">
          <Bar data={chartDataConfig} options={options} />
        </div>
      </div>
    </div>
  );
}

export default TopReferringUrlsChart;