import { useMemo, useEffect, useState } from "react";
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
  ChartEvent,
  ActiveElement,
} from "chart.js";
import { ListChecks, CheckCircle, AlertCircle, ServerCrash, BarChart3 } from "lucide-react";

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
  className?: string;
  onFilter?: (key: string, value: any) => void;
  activeFilter?: string | null;
}

const STATUS_CODE_COLORS: Record<string, { base: string; hover: string }> = {
  "1xx": { base: "#60a5fa", hover: "#3b82f6" }, // blue-400, blue-600
  "2xx": { base: "#4ade80", hover: "#22c55e" }, // green-400, green-600
  "3xx": { base: "#fbbf24", hover: "#f59e0b" }, // amber-400, amber-600
  "4xx": { base: "#f87171", hover: "#ef4444" }, // red-400, red-600
  "5xx": { base: "#a78bfa", hover: "#8b5cf6" }, // violet-400, violet-600
};

export function StatusCodesChart({ data, className = "", onFilter, activeFilter }: StatusCodesChartProps) {
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

  const {
    totalRequests,
    sortedLabels,
    sortedData,
    metrics
  } = useMemo(() => {
    const total = Object.values(data).reduce((a, b) => a + b, 0);
    if (total === 0) {
      return { totalRequests: 0, sortedLabels: [], sortedData: [], metrics: [] };
    }

    const statusCategories = {
      "1xx": 0, "2xx": 0, "3xx": 0, "4xx": 0, "5xx": 0
    };

    Object.entries(data).forEach(([code, count]) => {
      statusCategories[code as keyof typeof statusCategories] += count;
    });

    const filteredCategories = Object.entries(statusCategories).filter(([, count]) => count > 0);
    const labels = filteredCategories.map(([category]) => category);
    const values = filteredCategories.map(([, count]) => count);

    const successCount = statusCategories["2xx"];
    const successRate = total > 0 ? (successCount / total) * 100 : 0;

    const calculatedMetrics = [
      { title: "Success Rate", value: `${successRate.toFixed(1)}%`, icon: CheckCircle, color: "green" },
      { title: "Client Errors", value: statusCategories["4xx"].toLocaleString(), icon: AlertCircle, color: "red" },
      { title: "Server Errors", value: statusCategories["5xx"].toLocaleString(), icon: ServerCrash, color: "purple" },
      { title: "Total Requests", value: total.toLocaleString(), icon: BarChart3, color: "blue" },
    ];

    return { totalRequests: total, sortedLabels: labels, sortedData: values, metrics: calculatedMetrics };
  }, [data]);

  if (totalRequests === 0) {
    return (
      <div className={`p-8 ${className}`}>
        <div className="text-center">
          <ListChecks className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold">No Status Code Data</h3>
        </div>
      </div>
    );
  }

  const chartData = useMemo(() => ({
    labels: sortedLabels,
    datasets: [
      {
        label: "Request Count",
        data: sortedData,
        backgroundColor: sortedLabels.map(label => activeFilter === label ? STATUS_CODE_COLORS[label]?.hover : STATUS_CODE_COLORS[label]?.base),
        borderColor: sortedLabels.map(label => STATUS_CODE_COLORS[label]?.hover),
        borderWidth: 2,
        borderRadius: 8,
        hoverBackgroundColor: sortedLabels.map(label => STATUS_CODE_COLORS[label]?.hover),
      },
    ],
  }), [sortedLabels, sortedData, activeFilter]);

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (event: ChartEvent, elements: ActiveElement[], chart: ChartJS) => {
      if (elements.length > 0 && onFilter && chart.data.labels) {
        const elementIndex = elements[0].index;
        const clickedLabel = chart.data.labels[elementIndex] as string;
        
        // If clicking the active filter, clear it. Otherwise, set it.
        const newFilterValue = activeFilter === clickedLabel ? null : clickedLabel;
        onFilter('status', newFilterValue);
      }
    },
    onHover: (event: ChartEvent, elements: ActiveElement[], chart: ChartJS) => {
        const canvas = chart.canvas;
        canvas.style.cursor = elements.length > 0 ? 'pointer' : 'default';
    },
    animation: { duration: 1200, easing: 'easeOutQuart' },
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
          title: (context) => `Status: ${context[0].label}`,
          label: (context) => {
            const count = context.raw as number;
            const percentage = ((count / totalRequests) * 100).toFixed(1);
            return `${count.toLocaleString()} requests (${percentage}%)`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)" },
        border: { display: false },
        ticks: { color: isDarkMode ? "#9ca3af" : "#6b7280", padding: 10 },
      },
      x: {
        grid: { display: false },
        ticks: { color: isDarkMode ? "#9ca3af" : "#6b7280", font: { weight: 600 } },
      },
    },
  };

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { 
    hidden: { y: 20, opacity: 0 }, 
    visible: { 
      y: 0, 
      opacity: 1, 
      transition: { 
        type: 'spring' as const,
        stiffness: 100 
      } 
    } 
  };

  return (
    <div className={className}>
      <div className="p-6 pb-4 border-b border-gray-200/50 dark:border-gray-700/50">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
          <ListChecks className="h-5 w-5 text-green-500" />
          <span>Status Code Distribution</span>
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Analysis of {totalRequests.toLocaleString()} server responses.
        </p>
      </div>

      <div className="p-6 space-y-6">
        <div className="h-[200px] sm:h-[250px] md:h-[300px] relative">
          <Bar data={chartData} options={options} />
        </div>
        
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {metrics.map((metric) => {
            const Icon = metric.icon;
            const colorClasses = {
              blue: "bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-300",
              green: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300",
              purple: "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300",
              red: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300",
            };

            return (
              <motion.div
                key={metric.title}
                variants={itemVariants}
                className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg text-center transition-all duration-200 hover:shadow-md hover:-translate-y-1"
              >
                <Icon className={`h-7 w-7 mx-auto p-1 rounded-full ${colorClasses[metric.color as keyof typeof colorClasses]}`} />
                <dd className="text-xl font-bold text-gray-800 dark:text-gray-100 mt-2">
                  {metric.value}
                </dd>
                <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {metric.title}
                </dt>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}