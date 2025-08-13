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
import { ShieldAlert, Zap, ShieldCheck, X } from "lucide-react";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface AttackDistributionChartProps {
  data?: { [key: string]: number | string | null };
  allAttackTypes?: string[];
  className?: string;
  onFilter?: (key: string, value: string | null) => void;
  activeFilter?: string | null;
}

const ChartTitle = ({ activeFilter }: { activeFilter?: string | null }) => (
  <div className="p-6 pb-4 border-b border-gray-200/50 dark:border-gray-700/50">
    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
      <ShieldAlert className="h-5 w-5 text-red-500" />
      <span>Attack Distribution</span>
    </h2>
    <p className="text-gray-600 dark:text-gray-400 mt-1">
      {activeFilter 
        ? `Filtered by: ${activeFilter}` 
        : `Distribution of security threats. Click a point to filter.`}
    </p>
  </div>
);

const FilteredView = ({ 
  attackType, 
  count, 
  onClearFilter 
}: { 
  attackType: string; 
  count: number; 
  onClearFilter: () => void;
}) => (
  <div className="p-6">
    <div className="h-[200px] flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-lg text-center">
      {count > 0 ? (
        <>
          <Zap className="h-12 w-12 mx-auto text-orange-400 mb-2" />
          <p className="text-2xl font-bold text-gray-800 dark:text-white">
            {count.toLocaleString()}
          </p>
          <p className="text-gray-600 dark:text-gray-400">{attackType} events</p>
        </>
      ) : (
        <>
          <ShieldCheck className="h-12 w-12 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-500 dark:text-gray-400">No {attackType} events found.</p>
        </>
      )}
      <button
        onClick={onClearFilter}
        className="mt-6 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
      >
        <X className="w-4 h-4" />
        Clear Filter
      </button>
    </div>
  </div>
);

const NoDataView = () => (
    <div className="p-6">
        <div className="h-[200px] flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <div className="text-center">
            <ShieldCheck className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500 dark:text-gray-400">No attack data available</p>
        </div>
        </div>
    </div>
);


export function AttackDistributionChart({ 
  data = {}, 
  allAttackTypes = [],
  className = "", 
  onFilter, 
  activeFilter 
}: AttackDistributionChartProps) {
  // Set default empty values for props
  const safeData = data || {};
  const safeAllAttackTypes = allAttackTypes || [];
  
  // Track dark mode state
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Set up dark mode detection
  useEffect(() => {
    const updateMode = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    };
    
    updateMode();
    const observer = new MutationObserver(updateMode);
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ["class"] 
    });
    
    window.addEventListener("storage", updateMode);
    
    return () => {
      observer.disconnect();
      window.removeEventListener("storage", updateMode);
    };
  }, []);

  // Calculate total attacks
  const totalAttacks = useMemo(() => {
    return Object.values(safeData).reduce<number>((sum, value) => {
      const numValue = typeof value === 'number' ? value : Number(value) || 0;
      return sum + numValue;
    }, 0);
  }, [safeData]);

  // Prepare chart data
  const chartData = useMemo(() => ({
    labels: safeAllAttackTypes,
    datasets: [
      {
        label: 'Attack Count',
        data: safeAllAttackTypes.map(type => {
          const value = safeData[type];
          return typeof value === 'number' ? value : Number(value) || 0;
        }),
        backgroundColor: isDarkMode ? 'rgba(255, 0, 0, 0.2)' : 'rgba(220, 38, 38, 0.15)',
        borderColor: isDarkMode ? 'rgba(255, 50, 50, 1)' : 'rgba(220, 38, 38, 1)',
        borderWidth: 3,
        pointBackgroundColor: isDarkMode ? 'rgba(255, 100, 100, 1)' : 'rgba(220, 38, 38, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(220, 38, 38, 1)',
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  }), [safeData, safeAllAttackTypes, isDarkMode]);

  // Handle filtered view
  if (activeFilter) {
    const value = safeData[activeFilter];
    const count = typeof value === 'number' ? value : Number(value) || 0;
    return (
      <div className={className}>
        <ChartTitle activeFilter={activeFilter} />
        <FilteredView 
          attackType={activeFilter} 
          count={count} 
          onClearFilter={() => onFilter?.('attackType', null)} 
        />
      </div>
    );
  }

  // Handle no data case
  if (totalAttacks === 0) {
    return (
      <div className={className}>
        <ChartTitle activeFilter={null} />
        <NoDataView />
      </div>
    );
  }

  const options: ChartOptions<"radar"> = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (event: ChartEvent, elements: ActiveElement[]) => {
      if (elements.length > 0 && onFilter) {
        const clickedLabel = chartData.labels[elements[0].index];
        onFilter('attackType', clickedLabel);
      }
    },
    onHover: (event: ChartEvent, elements: ActiveElement[], chart: ChartJS) => {
      chart.canvas.style.cursor = elements.length > 0 ? 'pointer' : 'default';
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: isDarkMode ? '#f9fafb' : '#111827',
        bodyColor: isDarkMode ? '#e5e7eb' : '#374151',
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
        grid: { color: isDarkMode ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.1)" },
        angleLines: { color: isDarkMode ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.1)" },
        pointLabels: { color: isDarkMode ? "#ffffff" : "#374151", font: { size: 12, weight: 'bold' as const } },
        ticks: { display: false },
      },
    },
  };

  return (
    <div className={className}>
      <ChartTitle activeFilter={null} />
      <div className="p-6">
        <div className="h-[200px] sm:h-[250px] md:h-[300px] relative">
          <Radar data={chartData} options={options} />
        </div>
      </div>
    </div>
  );
}