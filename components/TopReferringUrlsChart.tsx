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
  fetchData: () => Promise<Record<string, number>>;
  className?: string;
}

export function TopReferringUrlsChart({ fetchData, className = "" }: TopReferringUrlsChartProps) {
  const [data, setData] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const result = await fetchData();
        setData(result);
      } catch (err) {
        console.error("Error fetching referring URLs data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [fetchData]);

  const sortedData = useMemo(() => {
    return Object.entries(data)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7);
  }, [data]);

  if (isLoading) {
    return (
      <div className={`p-8 ${className}`}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center animate-pulse">
            <Share2 className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Loading Top Referrers...
          </h3>
        </div>
      </div>
    );
  }

  if (Object.keys(data).length === 0) {
    return (
      <div className={`p-8 ${className}`}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <Share2 className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Referrer Data
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            No referring URLs found in the logs.
          </p>
        </div>
      </div>
    );
  }

  const chartData = {
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
  };

  const options: ChartOptions<'bar'> = {
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
            const originalLabel = sortedData[context[0].dataIndex][0];
            return `Referrer: ${originalLabel}`;
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
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { x: -10, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
    }
  };

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
          <Bar data={chartData} options={options} />
        </div>

        <div className="flex flex-col pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
          <div className="grid grid-cols-12 gap-2 px-2 pb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
            <div className="col-span-10">Referrer</div>
            <div className="col-span-2 text-right">Requests</div>
          </div>
          <motion.div
            className="flex flex-col mt-2 space-y-1"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {sortedData.map(([url, count]) => (
              <motion.div
                key={url}
                variants={itemVariants}
                className="grid grid-cols-12 gap-2 items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="col-span-10 text-sm font-mono truncate text-gray-700 dark:text-gray-300" title={url}>
                  {url}
                </div>
                <div className="col-span-2 text-sm font-medium text-right text-gray-800 dark:text-gray-200">
                  {count.toLocaleString()}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default TopReferringUrlsChart;