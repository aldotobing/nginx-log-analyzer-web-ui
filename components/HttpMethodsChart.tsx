import { useState, useMemo, useEffect, useRef } from "react";
import { Doughnut } from "react-chartjs-2";
import { motion } from "framer-motion";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
  Plugin,
  ChartEvent,
  ActiveElement,
} from "chart.js";
import { PieChart, Server, Zap, AlertTriangle, ArrowRightLeft } from "lucide-react";

ChartJS.register(ArcElement, Tooltip, Legend);

const HTTP_METHOD_DESCRIPTIONS: Readonly<Record<string, string>> = {
  GET: "Retrieves data from the server",
  POST: "Submits data to be processed to the server",
  PUT: "Updates existing resource on the server",
  DELETE: "Removes specified resource from the server",
  PATCH: "Applies partial modifications to a resource",
  OPTIONS: "Describes communication options for the target resource",
  HEAD: "Same as GET but returns only HTTP headers",
  TRACE: "Performs a message loop-back test",
  CONNECT: "Establishes a tunnel to the server",
  MALFORMED: "Malformed or attack requests",
  OTHER: "Non-standard HTTP methods",
};

const HTTP_METHOD_COLORS: Readonly<
  Record<string, { base: string; hover: string }>
> = {
  GET: { base: "#0ea5e9", hover: "#0284c7" }, // sky-500, sky-600
  POST: { base: "#22c55e", hover: "#16a34a" }, // green-500, green-600
  PUT: { base: "#f97316", hover: "#ea580c" }, // orange-500, orange-600
  DELETE: { base: "#ef4444", hover: "#dc2626" }, // red-500, red-600
  PATCH: { base: "#a855f7", hover: "#9333ea" }, // purple-500, purple-600
  OPTIONS: { base: "#64748b", hover: "#475569" }, // slate-500, slate-600
  HEAD: { base: "#ec4899", hover: "#db2777" }, // pink-500, pink-600
  TRACE: { base: "#8b5cf6", hover: "#7c3aed" }, // violet-500, violet-600
  CONNECT: { base: "#14b8a6", hover: "#0d9488" }, // teal-500, teal-600
  MALFORMED: { base: "#f43f5e", hover: "#e11d48" }, // rose-500, rose-600
  OTHER: { base: "#94a3b8", hover: "#64748b" }, // slate-400, slate-500
};

interface HttpMethodsChartProps {
  data: Record<string, number>;
  parsedLines?: any[];
  className?: string;
  onFilter?: (key: string, value: any) => void;
  activeFilter?: string | null;
}

export function HttpMethodsChart({ data, parsedLines = [], className = "", onFilter, activeFilter }: HttpMethodsChartProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [filteredLogs, setFilteredLogs] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const chartRef = useRef<ChartJS<"doughnut">>(null);

  useEffect(() => {
    const darkMode = document.documentElement.classList.contains("dark");
    setIsDarkMode(darkMode);

    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const handleMethodClick = (method: string) => {
    // Set the filter
    if (onFilter) {
      const newFilterValue = activeFilter === method ? null : method;
      onFilter('method', newFilterValue);
    }
    
    // Show logs for this method
    const logs = parsedLines.filter(line => line.method === method);
    setFilteredLogs(logs);
    setSelectedMethod(method);
    setIsModalOpen(true);
  };

  const total = useMemo(() => Object.values(data).reduce((sum, value) => sum + value, 0), [data]);

  const methodsData = useMemo(() => {
    if (total === 0) return [];
    return Object.entries(data)
      .filter(([method]) => method.length <= 25) // Filter out extremely long method names that are likely malicious
      .map(([method, count]) => ({
        method,
        count,
        percentage: ((count / total) * 100).toFixed(1),
      }))
      .sort((a, b) => b.count - a.count);
  }, [data, total]);

  if (total === 0) {
    return (
      <div className={`p-8 ${className}`}>
        <div className="text-center">
          <PieChart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold">No HTTP Method Data</h3>
        </div>
      </div>
    );
  }

  const chartData = useMemo(() => ({
    labels: methodsData.map((item) => item.method),
    datasets: [
      {
        data: methodsData.map((item) => item.count),
        backgroundColor: methodsData.map(
          (item) => activeFilter === item.method 
            ? (HTTP_METHOD_COLORS[item.method]?.hover ?? "#475569") 
            : (HTTP_METHOD_COLORS[item.method]?.base ?? "#94a3b8") // Fallback to slate-400 for unknown methods
        ),
        hoverBackgroundColor: methodsData.map(
          (item) => HTTP_METHOD_COLORS[item.method]?.hover ?? "#64748b" // Fallback to slate-500 for unknown methods
        ),
        borderWidth: 4,
        borderColor: isDarkMode ? "rgba(31, 41, 55, 0.8)" : "rgba(255, 255, 255, 0.9)",
        hoverBorderColor: isDarkMode ? "rgba(55, 65, 81, 0.8)" : "rgba(249, 250, 251, 0.9)",
        hoverOffset: 15,
      },
    ],
  }), [data, methodsData, isDarkMode, activeFilter]);

  const centerTextPlugin = useMemo(() => ({
    id: 'centerText' as const,
    afterDraw: (chart: ChartJS) => {
      const { ctx, chartArea } = chart;
      if (!chartArea) return;
      
      const { left, top, width, height } = chartArea;
      ctx.save();
      ctx.font = `bold ${Math.min(width / 7, 40)}px sans-serif`;
      ctx.fillStyle = isDarkMode ? '#f9fafb' : '#111827';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const text = total.toLocaleString();
      ctx.fillText(text, left + width / 2, top + height / 2 - 10);
      
      ctx.font = `500 ${Math.min(width / 18, 16)}px sans-serif`;
      ctx.fillStyle = isDarkMode ? '#9ca3af' : '#6b7280';
      ctx.fillText('Total Requests', left + width / 2, top + height / 2 + 25);
      ctx.restore();
    }
  }), [isDarkMode, total]);

  const options: ChartOptions<"doughnut"> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: "70%",
    onClick: (event: ChartEvent, elements: ActiveElement[], chart: ChartJS) => {
      if (elements.length > 0 && chart.data.labels) {
        const elementIndex = elements[0].index;
        const clickedLabel = chart.data.labels[elementIndex] as string;
        
        // Set the filter
        if (onFilter) {
          const newFilterValue = activeFilter === clickedLabel ? null : clickedLabel;
          onFilter('method', newFilterValue);
        }
        
        // Show logs for this method
        const logs = parsedLines.filter(line => line.method === clickedLabel);
        setFilteredLogs(logs);
        setSelectedMethod(clickedLabel);
        setIsModalOpen(true);
      }
    },
    onHover: (event: ChartEvent, elements: ActiveElement[], chart: ChartJS) => {
        const canvas = chart.canvas;
        canvas.style.cursor = elements.length > 0 ? 'pointer' : 'default';
    },
    animation: {
      animateScale: true,
      animateRotate: true,
      duration: 1200,
      easing: 'easeOutQuart'
    },
    plugins: { legend: { display: false },
      tooltip: {
        enabled: true,
        backgroundColor: isDarkMode ? "rgba(17, 24, 39, 0.9)" : "rgba(255, 255, 255, 0.9)",
        titleColor: isDarkMode ? "#F9FAFB" : "#111827",
        bodyColor: isDarkMode ? "#D1D5DB" : "#374151",
        borderColor: isDarkMode ? "rgba(209, 213, 219, 0.2)" : "rgba(0, 0, 0, 0.1)",
        borderWidth: 1,
        padding: 15,
        cornerRadius: 12,
        displayColors: true,
        boxPadding: 4,
        callbacks: {
          title: (context) => `Method: ${context[0].label}`,
          label: (context) => {
            const count = context.raw as number;
            const percentage = ((count / total) * 100).toFixed(1);
            return ` ${count.toLocaleString()} requests (${percentage}%)`;
          },
          afterBody: (context) => {
            const method = context[0].label ?? "Unknown";
            return `\n${HTTP_METHOD_DESCRIPTIONS[method] ?? "Other HTTP method"}`;
          }
        },
      },
    },
  }), [isDarkMode, total, onFilter, activeFilter]);

  return (
    <div className={`${className} rounded-xl overflow-hidden`}>
      <div className="p-6 pb-4 border-b border-gray-100 dark:border-gray-700/50">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
          <PieChart className="h-5 w-5 text-blue-500" />
          <span>HTTP Methods Distribution</span>
        </h2>
        <p className="text-gray-600 dark:text-gray-300/80 mt-1 text-sm">
          Breakdown of {total.toLocaleString()} requests. Click to filter.
        </p>
      </div>

      <div className="p-6 space-y-6">
        <div className="h-[200px] sm:h-[250px] md:h-[300px] relative">
          <Doughnut 
            key={total}
            ref={chartRef} 
            data={chartData} 
            options={options} 
            plugins={[centerTextPlugin]} 
            className="relative z-10"
          />
        </div>
        
        <div className="flex flex-wrap justify-center gap-3">
          {methodsData.map((item, index) => (
            <motion.div 
              key={item.method}
              className={`flex items-center gap-2 text-sm cursor-pointer px-3 py-1.5 rounded-lg transition-all duration-200 ${
                activeFilter === item.method 
                  ? 'bg-blue-50 dark:bg-blue-900/30 ring-1 ring-blue-200 dark:ring-blue-800/50' 
                  : 'hover:bg-gray-100/80 dark:hover:bg-gray-700/50'
              }`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleMethodClick(item.method)}
              onMouseEnter={() => {
                if (chartRef.current) {
                  chartRef.current.setActiveElements([{ datasetIndex: 0, index }]);
                  chartRef.current.update();
                }
              }}
              onMouseLeave={() => {
                if (chartRef.current) {
                  chartRef.current.setActiveElements([]);
                  chartRef.current.update();
                }
              }}
            >
              <div 
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ 
                  backgroundColor: activeFilter === item.method 
                    ? (HTTP_METHOD_COLORS[item.method]?.hover ?? '#475569') 
                    : (HTTP_METHOD_COLORS[item.method]?.base ?? '#64748b') 
                }}
              />
              <span className="font-medium text-gray-700 dark:text-gray-200">{item.method.length > 20 ? `${item.method.substring(0, 17)}...` : item.method}</span>
              <span className="text-gray-500 dark:text-gray-300/80">({item.percentage}%)</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
    
    {/* Modal for showing logs */}
    {isModalOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
          <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Logs for Method: {selectedMethod}
            </h3>
            <button 
              onClick={() => setIsModalOpen(false)}
              className="text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          <div className="overflow-y-auto flex-grow">
            {filteredLogs.length === 0 ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                No logs found for this method.
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {filteredLogs.slice(0, 100).map((log, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-sm">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {log.ipAddress} - {log.method} {log.path}
                    </div>
                    <div className="text-gray-600 dark:text-gray-300 mt-1">
                      Status: {log.status} | Size: {log.bodyBytesSent} | Time: {log.timestamp}
                    </div>
                    {log.userAgent && (
                      <div className="text-gray-500 dark:text-gray-400 mt-1 truncate">
                        User Agent: {log.userAgent}
                      </div>
                    )}
                  </div>
                ))}
                {filteredLogs.length > 100 && (
                  <div className="text-center text-gray-500 dark:text-gray-400 p-4">
                    Showing first 100 of {filteredLogs.length} logs
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )}
  );
}

export default HttpMethodsChart;