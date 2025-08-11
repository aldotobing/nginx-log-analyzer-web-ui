import React, { useEffect, useState, useMemo } from "react";
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
  TooltipItem,
  TooltipModel,
} from "chart.js";
import { MapPin } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface TopIpAddressesChartProps {
  data: Record<string, number>;
  suspiciousIps?: Record<string, any>;
  className?: string;
}

interface IpInfo {
  city: string;
  country: string;
  flag?: string;
}

export function TopIpAddressesChart({ data, suspiciousIps = {}, className = "" }: TopIpAddressesChartProps) {
  const [ipInfo, setIpInfo] = useState<Record<string, IpInfo>>({});
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

  const sortedData = useMemo(() => {
    return Object.entries(data)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7); // Limit to 7 for a cleaner look
  }, [data]);

  useEffect(() => {
    const fetchIpInfo = async (ip: string): Promise<IpInfo> => {
      try {
        const response = await fetch(`https://ipinfo.io/${ip}/json/`);
        if (!response.ok) throw new Error('Failed to fetch');
        const json = await response.json();
        
        // Map country code to full country name if needed
        const countryName = new Intl.DisplayNames(['en'], { type: 'region' }).of(json.country) || json.region || "Unknown";
        
        return {
          city: json.city || "Unknown",
          country: countryName,
          flag: json.country ? `https://flagcdn.com/16x12/${json.country.toLowerCase()}.png` : undefined,
        };
      } catch (error) {
        console.error(`Error fetching info for IP ${ip}:`, error);
        return { city: "N/A", country: "N/A" };
      }
    };

    const fetchAllIpInfo = async () => {
      setIsLoading(true);
      const ips = sortedData.map(([ip]) => ip);
      const infoPromises = ips.map(ip => fetchIpInfo(ip));
      const infoArray = await Promise.all(infoPromises);
      
      const infoMap: Record<string, IpInfo> = {};
      ips.forEach((ip, index) => {
        infoMap[ip] = infoArray[index];
      });

      setIpInfo(infoMap);
      setIsLoading(false);
    };

    if (sortedData.length > 0) {
      fetchAllIpInfo();
    } else {
      setIsLoading(false);
    }
  }, [sortedData]);

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className={`p-8 ${className}`}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <MapPin className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No IP Address Data
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Upload logs to see top IP addresses.
          </p>
        </div>
      </div>
    );
  }

  const chartData = {
    labels: sortedData.map(([ip]) => ip),
    datasets: [
      {
        label: "Requests",
        data: sortedData.map(([, count]) => count),
        backgroundColor: sortedData.map(([ip]) => 
          suspiciousIps[ip] 
            ? (isDarkMode ? 'rgba(239, 68, 68, 0.5)' : 'rgba(239, 68, 68, 0.7)') 
            : (isDarkMode ? 'rgba(59, 130, 246, 0.5)' : 'rgba(59, 130, 246, 0.7)')
        ),
        borderColor: sortedData.map(([ip]) => 
          suspiciousIps[ip] 
            ? 'rgba(239, 68, 68, 1)' 
            : 'rgba(59, 130, 246, 1)'
        ),
        borderWidth: 2,
        borderRadius: 6,
        hoverBackgroundColor: sortedData.map(([ip]) => 
          suspiciousIps[ip] 
            ? 'rgba(239, 68, 68, 1)' 
            : 'rgba(59, 130, 246, 1)'
        ),
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
          title: (items: TooltipItem<"bar">[]) => {
            const item = items[0];
            const ip = item.label;
            return suspiciousIps[ip] ? `IP: ${ip} (Suspicious)` : `IP: ${ip}`;
          },
          label: (context: TooltipItem<"bar">) => {
            const ip = context.label;
            const count = context.raw as number;
            const location = ipInfo[ip] ? `${ipInfo[ip].city}, ${ipInfo[ip].country}` : 'Loading...';
            return [
              `Requests: ${count.toLocaleString()}`,
              `Location: ${location}${suspiciousIps[ip] ? ' (Suspicious IP)' : ''}`
            ];
          },
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
        },
        ticks: {
          color: isDarkMode ? "#9ca3af" : "#6b7280",
        },
        border: {
          display: false
        }
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
          <MapPin className="h-5 w-5 text-blue-500" />
          <span>Top IP Addresses</span>
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Top IP addresses by request volume.
        </p>
      </div>

      <div className="p-6 space-y-6">
        <div className="h-[200px] sm:h-[250px] relative">
          <Bar data={chartData} options={options} />
        </div>

        <div className="flex items-center justify-end gap-4 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
            <span className="text-gray-600 dark:text-gray-400">Normal IP</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
            <span className="text-gray-600 dark:text-gray-400">Suspicious IP</span>
          </div>
        </div>

        <div className="flex flex-col pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
          <div className="grid grid-cols-12 gap-2 px-2 pb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
            <div className="col-span-5">IP Address</div>
            <div className="col-span-5">Location</div>
            <div className="col-span-2 text-right">Requests</div>
          </div>
          <motion.div
            className="flex flex-col mt-2 space-y-1"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {sortedData.map(([ip, count]) => (
              <motion.div
                key={ip}
                variants={itemVariants}
                className="grid grid-cols-12 gap-2 items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className={`col-span-5 text-sm font-mono truncate ${suspiciousIps[ip] ? 'text-red-600 dark:text-red-400 font-bold' : 'text-gray-700 dark:text-gray-300'}`}>
                  {ip} {suspiciousIps[ip] && <span className="inline-block w-2 h-2 bg-red-500 rounded-full ml-1"></span>}
                </div>
                <div className="col-span-5 text-xs text-gray-600 dark:text-gray-400 truncate">
                  {isLoading ? (
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {ipInfo[ip]?.flag && <img src={ipInfo[ip].flag} alt={ipInfo[ip].country} className="w-4 h-3" />}
                      <span>{ipInfo[ip] ? `${ipInfo[ip].city}, ${ipInfo[ip].country}` : 'N/A'}</span>
                    </div>
                  )}
                </div>
                <div className="col-span-2 text-sm font-medium text-right text-gray-800 dark:text-gray-200">{count.toLocaleString()}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default TopIpAddressesChart;
