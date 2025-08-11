import { useMemo, useEffect, useState } from "react";
import { Radar } from "react-chartjs-2";
import { motion } from "framer-motion";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import { ShieldAlert, Zap, ListTree, ShieldCheck } from "lucide-react";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface AttackDistributionChartProps {
  data: { [key: string]: number };
  className?: string;
}

export function AttackDistributionChart({ data, className = "" }: AttackDistributionChartProps) {
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
    totalAttacks,
    attackLabels,
    attackCounts,
    metrics
  } = useMemo(() => {
    const total = Object.values(data).reduce((sum: number, value) => {
      const num = Number(value);
      return sum + (isNaN(num) ? 0 : num);
    }, 0);
    if (total === 0) {
      return { totalAttacks: 0, attackLabels: [], attackCounts: [], metrics: [] };
    }

    const sortedAttacks = Object.entries(data).sort(([, a], [, b]) => b - a);
    const labels = sortedAttacks.map(([key]) => key);
    const counts = sortedAttacks.map(([, value]) => value);
    
    const mostFrequent = sortedAttacks.length > 0 ? sortedAttacks[0] : null;
    const mostFrequentPercentage = mostFrequent ? (mostFrequent[1] / total) * 100 : 0;

    const calculatedMetrics = [
      {
        title: "Total Attacks",
        value: total.toLocaleString(),
        icon: ShieldCheck,
        color: "red",
      },
      {
        title: "Top Threat",
        value: mostFrequent ? mostFrequent[0] : "None",
        icon: Zap,
        color: "orange",
        subtitle: mostFrequent 
          ? `${mostFrequent[1].toLocaleString()} events (${mostFrequentPercentage.toFixed(1)}%)`
          : "No attack data"
      },
      {
        title: "Attack Varieties",
        value: labels.length,
        icon: ListTree,
        color: "purple",
        subtitle: "Unique attack types detected"
      },
    ];

    return {
      totalAttacks: total,
      attackLabels: labels,
      attackCounts: counts,
      metrics: calculatedMetrics
    };
  }, [data]);

  if (totalAttacks === 0) {
    return (
      <div className={`p-8 ${className}`}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <ShieldAlert className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Attack Data
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            No security threats detected in the logs.
          </p>
        </div>
      </div>
    );
  }

  const chartData = {
    labels: attackLabels,
    datasets: [
      {
        label: "Attack Count",
        data: attackCounts,
        backgroundColor: isDarkMode ? "rgba(239, 68, 68, 0.3)" : "rgba(255, 99, 132, 0.2)",
        borderColor: isDarkMode ? "rgba(239, 68, 68, 0.8)" : "rgba(255, 99, 132, 1)",
        borderWidth: 2,
        pointBackgroundColor: isDarkMode ? "rgba(239, 68, 68, 1)" : "rgba(255, 99, 132, 1)",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: isDarkMode ? "rgba(239, 68, 68, 1)" : "rgba(255, 99, 132, 1)",
      },
    ],
  };

  const options: ChartOptions<"radar"> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1200,
      easing: 'easeOutQuart'
    },
    plugins: {
      legend: {
        display: false,
      },
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
          title: (context) => `Attack Type: ${context[0].label}`,
          label: (context) => {
            const count = context.raw as number;
            const percentage = ((count / totalAttacks) * 100).toFixed(1);
            return `${count.toLocaleString()} events (${percentage}%)`;
          },
        },
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        grid: {
          color: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
        },
        angleLines: {
          color: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
        },
        pointLabels: {
          color: isDarkMode ? "#cbd5e1" : "#475569",
          font: {
            size: 12,
            weight: 600,
          },
        },
        ticks: {
          display: false,
          stepSize: Math.ceil(Math.max(...attackCounts) / 4) || 1,
        },
      },
    },
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100
      }
    }
  };

  return (
    <div className={className}>
      <div className="p-6 pb-4 border-b border-gray-200/50 dark:border-gray-700/50">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
          <ShieldAlert className="h-5 w-5 text-red-500" />
          <span>Attack Distribution</span>
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Distribution of {totalAttacks.toLocaleString()} detected security threats.
        </p>
      </div>

      <div className="p-6 space-y-6">
        <div className="h-[200px] sm:h-[250px] md:h-[300px] relative">
          <Radar data={chartData} options={options} />
        </div>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {metrics.map((metric) => {
            const Icon = metric.icon;
            const colorClasses = {
              red: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300",
              orange: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300",
              purple: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300",
            };

            return (
              <motion.div
                key={metric.title}
                variants={itemVariants}
                className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg transition-all duration-200 hover:shadow-md hover:-translate-y-1"
              >
                <div className="flex items-start gap-3">
                  <Icon className={`h-7 w-7 mt-1 p-1 rounded-full ${colorClasses[metric.color as keyof typeof colorClasses]}`} />
                  <div>
                    <dt className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {metric.title}
                    </dt>
                    <dd className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                      {metric.value}
                    </dd>
                    {metric.subtitle && <p className="text-xs text-gray-500 dark:text-gray-400">{metric.subtitle}</p>}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}