import { useMemo, useEffect, useState } from "react";
import { Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ChartOptions,
  ChartEvent,
  ActiveElement,
} from "chart.js";
import { ShieldAlert, Zap, ListTree, ShieldCheck, X } from "lucide-react";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface AttackDistributionChartProps {
  data: { [key: string]: number };
  className?: string;
  onFilter?: (key: string, value: string | null) => void;
  activeFilter?: string | null;
}

export function AttackDistributionChart({ 
  data, 
  className = "", 
  onFilter, 
  activeFilter 
}: AttackDistributionChartProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const updateMode = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setIsDarkMode(isDark);
    };
    
    // Initial check
    updateMode();
    
    // Listen for class changes on the document element
    const observer = new MutationObserver(updateMode);
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ["class"] 
    });
    
    // Also listen for storage changes in case theme is changed elsewhere
    const handleStorageChange = () => {
      updateMode();
    };
    
    window.addEventListener("storage", handleStorageChange);
    
    return () => {
      observer.disconnect();
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const { totalAttacks, attackLabels, attackCounts, metrics } = useMemo(() => {
    console.log('AttackDistributionChart - Raw data:', data);
    
    // When there's an active filter, we want to show all attack types but highlight the filtered one
    // The parent component has already filtered the data, so we just need to work with what we have
    const displayData = { ...data };
    
    const total = Object.values(displayData).reduce((sum, value) => sum + (Number(value) || 0), 0);
    console.log('AttackDistributionChart - Total attacks:', total);
    
    if (!data || Object.keys(displayData).length === 0) {
      console.log('AttackDistributionChart - No data or zero total attacks');
      return { totalAttacks: 0, attackLabels: [], attackCounts: [], metrics: [] };
    }

    // Sort all data but put the active filter first if it exists
    const sorted = Object.entries(displayData).sort(([aKey, aVal], [bKey, bVal]) => {
      // If we have an active filter, put it first
      if (activeFilter) {
        if (aKey === activeFilter) return -1;
        if (bKey === activeFilter) return 1;
      }
      // Otherwise sort by count descending
      return bVal - aVal;
    });
    
    const labels = sorted.map(([key]) => key);
    const counts = sorted.map(([, value]) => value);

    const [topKey, topValue] = sorted[0] || [];
    const topPct = topValue ? (topValue / total) * 100 : 0;

    return {
      totalAttacks: total,
      attackLabels: labels,
      attackCounts: counts,
      metrics: [
        { title: "Total Attacks", value: total.toLocaleString(), icon: ShieldCheck, color: "red" },
        {
          title: "Top Threat",
          value: topKey || "None",
          icon: Zap,
          color: "orange",
          subtitle: topValue
            ? `${topValue.toLocaleString()} events (${topPct.toFixed(1)}%)`
            : "No attack data",
        },
        {
          title: "Attack Varieties",
          value: labels.length,
          icon: ListTree,
          color: "purple",
          subtitle: "Unique attack types detected",
        },
      ],
    };
  }, [data, activeFilter]); // Add activeFilter to dependencies to recalculate when filter changes

  console.log('AttackDistributionChart - Rendering with:', { attackLabels, attackCounts, activeFilter });
  
  const chartData = useMemo(() => ({
    labels: attackLabels,
    datasets: [
      {
        label: 'Attack Count',
        data: attackCounts,
        backgroundColor: isDarkMode ? 'rgba(255, 0, 0, 0.2)' : 'rgba(220, 38, 38, 0.15)',
        borderColor: isDarkMode ? 'rgba(255, 50, 50, 1)' : 'rgba(220, 38, 38, 1)',
        borderWidth: isDarkMode ? 4 : 3,
        pointBackgroundColor: isDarkMode ? 'rgba(255, 100, 100, 1)' : 'rgba(220, 38, 38, 1)',
        pointBorderColor: isDarkMode ? 'rgba(255, 200, 200, 1)' : '#fff',
        pointHoverBackgroundColor: isDarkMode ? 'rgba(255, 0, 0, 1)' : '#fff',
        pointHoverBorderColor: isDarkMode ? 'rgba(255, 255, 255, 1)' : 'rgba(220, 38, 38, 1)',
        pointRadius: isDarkMode ? 7 : 6,
        pointHoverRadius: isDarkMode ? 9 : 8,
        // Add glow effect through shadow
        pointStyle: 'circle',
      },
    ],
  }), [attackLabels, attackCounts, isDarkMode]);

  const options: ChartOptions<"radar"> = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (event: ChartEvent, elements: ActiveElement[], chart: ChartJS) => {
      if (elements.length > 0 && onFilter) {
        const elementIndex = elements[0].index;
        const clickedLabel = chart.data.labels?.[elementIndex] as string;
        
        const newFilterValue = activeFilter === clickedLabel ? null : clickedLabel;
        onFilter('attackType', newFilterValue);
      }
    },
    onHover: (event: ChartEvent, elements: ActiveElement[], chart: ChartJS) => {
      const canvas = chart.canvas;
      canvas.style.cursor = elements.length > 0 ? 'pointer' : 'default';
    },
    animation: { duration: 1200, easing: "easeOutQuart" },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: isDarkMode ? '#f9fafb' : '#111827',
        bodyColor: isDarkMode ? '#e5e7eb' : '#374151',
        borderColor: isDarkMode ? 'rgba(55, 65, 81, 0.8)' : 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (ctx) => `Attack Type: ${ctx[0].label}`,
          label: (ctx) => {
            const count = ctx.raw as number;
            const pct = totalAttacks > 0 ? ((count / totalAttacks) * 100).toFixed(1) : 0;
            return `${count.toLocaleString()} events (${pct}%)`;
          },
        },
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        grid: { 
          color: isDarkMode ? "rgba(255, 255, 255, 0.25)" : "rgba(0, 0, 0, 0.1)",
          lineWidth: isDarkMode ? 2 : 1
        },
        angleLines: { 
          color: isDarkMode ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.1)",
          lineWidth: isDarkMode ? 2 : 1
        },
        pointLabels: { 
          color: isDarkMode ? "#ffffff" : "#374151", 
          font: { size: 12, weight: 'bold' as const },
          padding: 15,
        },
        ticks: { 
          display: false, 
          stepSize: attackCounts.length > 0 ? Math.ceil(Math.max(...attackCounts) / 4) : 1,
          color: isDarkMode ? "#e5e7eb" : "#6b7280"
        },
      },
    },
  };

  const hasNoData = Object.values(data).every(val => val === 0 || val === undefined);
  
  if (hasNoData) {
    return (
      <div className={className}>
        <div className="p-6 pb-4 border-b border-gray-200/50 dark:border-gray-700/50">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
            <ShieldAlert className="h-5 w-5 text-red-500" />
            <span>Attack Distribution</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            No security threats detected {activeFilter ? `for ${activeFilter}` : ''}
          </p>
        </div>
        <div className="p-6">
          <div className="h-[200px] flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="text-center">
              <ShieldCheck className="h-12 w-12 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500 dark:text-gray-400">No attack data available</p>
              {activeFilter && (
                <button
                  onClick={() => onFilter?.('attackType', null)}
                  className="mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <X className="w-4 h-4" />
                    Clear Filter
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="p-6 pb-4 border-b border-gray-200/50 dark:border-gray-700/50">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
          <ShieldAlert className="h-5 w-5 text-red-500" />
          <span>Attack Distribution</span>
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Distribution of {totalAttacks.toLocaleString()} threats. Click a point to filter.
        </p>
      </div>

      <div className="p-6 space-y-6">
        <div className="h-[200px] sm:h-[250px] md:h-[300px] relative">
          <Radar key={isDarkMode ? "dark" : "light"} data={chartData} options={options} />
        </div>
        
        {activeFilter && (
          <div className="flex justify-center">
            <button
              onClick={() => {
                if (onFilter) {
                  onFilter('attackType', null);
                }
              }}
              className="group px-4 py-2 rounded-lg transition-all duration-300 text-sm font-medium flex items-center gap-2 relative bg-red-500 hover:bg-red-600 active:scale-95"
            >
              <X className="w-4 h-4 text-white" />
              <span className="text-white">Clear Filter</span>
              
              {/* Tooltip */}
              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
                Remove {activeFilter} filter
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
