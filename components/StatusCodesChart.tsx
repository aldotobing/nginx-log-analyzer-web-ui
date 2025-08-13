import { useMemo, useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { motion, AnimatePresence } from "framer-motion";
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
import { ListChecks, CheckCircle, AlertCircle, ServerCrash, BarChart3, X, Zap, Server, AlertTriangle, ArrowRightLeft } from "lucide-react";

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
  parsedLines?: any[];
}

const STATUS_CODE_COLORS: Record<string, { base: string; hover: string }> = {
  "1xx": { base: "#60a5fa", hover: "#3b82f6" }, // blue-400, blue-600
  "2xx": { base: "#4ade80", hover: "#22c55e" }, // green-400, green-600
  "3xx": { base: "#fbbf24", hover: "#f59e0b" }, // amber-400, amber-600
  "4xx": { base: "#f87171", hover: "#ef4444" }, // red-400, red-600
  "5xx": { base: "#a78bfa", hover: "#8b5cf6" }, // violet-400, violet-600
};

export function StatusCodesChart({ data, className = "", onFilter, activeFilter, parsedLines }: StatusCodesChartProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [statusLogs, setStatusLogs] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Function to format Nginx timestamp
  const formatNginxTimestamp = (timestamp: string) => {
    try {
      // Nginx timestamp format: 11/Aug/2025:03:30:00 +0700
      // Parse the timestamp properly
      const match = timestamp.match(/(\d{2})\/(\w{3})\/(\d{4}):(\d{2}):(\d{2}):(\d{2})/);
      if (match) {
        const [, day, month, year, hour, minute] = match;
        // Return an even shorter format: "08/11 03:30"
        return `${month}/${day} ${hour}:${minute}`;
      }
      // If parsing fails, return the original timestamp
      return timestamp;
    } catch (error) {
      // If any error occurs, return the original timestamp
      return timestamp;
    }
  };

  useEffect(() => {
    const darkMode = document.documentElement.classList.contains("dark");
    setIsDarkMode(darkMode);

    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const handleStatusClick = (status: string) => {
    // Apply filter
    if (onFilter) {
      const newFilterValue = activeFilter === status ? null : status;
      onFilter('status', newFilterValue);
    }
    
    // Show logs modal only when applying a filter (not when clearing)
    if (parsedLines && parsedLines.length > 0 && activeFilter !== status) {
      // Filter logs by status code category (1xx, 2xx, etc.)
      const filteredLogs = parsedLines.filter(log => {
        const statusCode = log.status?.toString();
        if (!statusCode) return false;
        
        // Match the category (e.g., "2xx" for status "200")
        return statusCode.startsWith(status.charAt(0));
      });
      
      setStatusLogs(filteredLogs);
      setSelectedStatus(status);
      setIsModalOpen(true);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    // Do not reset filter when closing modal
    // if (onFilter && activeFilter !== null) {
    //   onFilter('status', null);
    // }
  };

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
      if (elements.length > 0 && chart.data.labels) {
        const elementIndex = elements[0].index;
        const clickedLabel = chart.data.labels[elementIndex] as string;
        handleStatusClick(clickedLabel);
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
      
      {activeFilter && (
        <div className="flex justify-center pt-4">
          <motion.button
            onClick={() => {
              if (onFilter) {
                onFilter('status', null);
              }
            }}
            className="group px-4 py-2 rounded-lg transition-all duration-300 text-sm font-medium flex items-center gap-2 relative"
            style={{
              backgroundColor: STATUS_CODE_COLORS[activeFilter]?.base ?? '#64748b',
            }}
            whileHover={{ 
              scale: 1.05,
              backgroundColor: STATUS_CODE_COLORS[activeFilter]?.hover ?? '#475569'
            }}
            whileTap={{ scale: 0.95 }}
            animate={{
              scale: [1, 1.05, 1],
              transition: {
                duration: 1.5,
                repeat: Infinity,
                repeatType: "reverse"
              }
            }}
          >
            <X className="w-4 h-4 text-white" />
            <span className="text-white">Clear Filter</span>
            
            {/* Tooltip */}
            <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
              Remove {activeFilter} filter
            </span>
          </motion.button>
        </div>
      )}
      
      {/* Logs Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              className="bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col border border-white/20 dark:border-gray-700/50"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="flex justify-between items-center p-5 border-b border-gray-200/50 dark:border-gray-700/50">
                <div>
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2 ${
                      selectedStatus?.startsWith('2') ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' :
                      selectedStatus?.startsWith('4') ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200' :
                      selectedStatus?.startsWith('5') ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200' :
                      'bg-gray-100 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200'
                    }`}>
                      <Zap className="w-4 h-4" />
                      {selectedStatus}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      Status Code Details
                    </h3>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Showing {statusLogs.length} requests
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors duration-200"
                >
                  <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-5">
                {statusLogs.length > 0 ? (
                  <div className="space-y-4">
                    {statusLogs.slice(0, 50).map((log, index) => (
                      <div 
                        key={index}
                        className="bg-white dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200/50 dark:border-gray-600/30 shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex-shrink-0 mt-1 flex items-center gap-1 ${
                            log.status.startsWith('2') ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' :
                            log.status.startsWith('4') ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200' :
                            log.status.startsWith('5') ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200' :
                            'bg-gray-100 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200'
                          }`}>
                            <Zap className="w-3 h-3" />
                            {log.status}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-gray-800 dark:text-gray-200 text-sm font-medium break-all mb-2">
                              {log.method} {log.path}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg">
                                <div className="bg-blue-100 dark:bg-blue-900/30 p-1 rounded-lg">
                                  <Server className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">Size</div>
                                  <div className="text-xs font-medium text-gray-800 dark:text-gray-200">{log.bodyBytesSent} bytes</div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg">
                                <div className="bg-purple-100 dark:bg-purple-900/30 p-1 rounded-lg">
                                  <AlertTriangle className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">IP</div>
                                  <div className="text-xs font-medium text-gray-800 dark:text-gray-200 font-mono">{log.ipAddress}</div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg">
                                <div className="bg-amber-100 dark:bg-amber-900/30 p-1 rounded-lg">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">Time</div>
                                  <div className="text-xs font-medium text-gray-800 dark:text-gray-200">{formatNginxTimestamp(log.timestamp)}</div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg">
                                <div className="bg-cyan-100 dark:bg-cyan-900/30 p-1 rounded-lg">
                                  <ArrowRightLeft className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">Method</div>
                                  <div className="text-xs font-medium text-gray-800 dark:text-gray-200">{log.method}</div>
                                </div>
                              </div>
                            </div>
                            
                            {log.userAgent && (
                              <div className="mt-3 pt-3 border-t border-gray-200/50 dark:border-gray-600/30">
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">User Agent</div>
                                <div className="text-sm text-gray-700 dark:text-gray-300 break-all bg-gray-50 dark:bg-gray-700/30 p-2 rounded">
                                  {log.userAgent}
                                </div>
                              </div>
                            )}
                            
                            {log.referer && log.referer !== '-' && (
                              <div className="mt-2">
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Referrer</div>
                                <div className="text-sm text-gray-700 dark:text-gray-300 break-all bg-gray-50 dark:bg-gray-700/30 p-2 rounded">
                                  {log.referer}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {statusLogs.length > 50 && (
                      <div className="text-center py-4 bg-gray-100/50 dark:bg-gray-700/30 rounded-lg mt-2">
                        <div className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-300 text-sm">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Showing first 50 of {statusLogs.length} logs</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700/50 rounded-full flex items-center justify-center mb-6">
                      <BarChart3 className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      No Status Code Logs Found
                    </h4>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                      No logs were found for the <span className="font-semibold text-gray-900 dark:text-white">{selectedStatus}</span> status codes. 
                      This might indicate that no responses with these status codes were recorded during the monitoring period.
                    </p>
                  </div>
                )}
              </div>
              
              <div className="p-5 border-t border-gray-200/50 dark:border-gray-700/50 flex justify-end">
                <button
                  onClick={closeModal}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}