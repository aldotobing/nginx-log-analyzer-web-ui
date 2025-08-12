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
  ChartEvent,
  ActiveElement,
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
  onFilter?: (key: string, value: any) => void;
  activeFilter?: string | null;
}

interface IpInfo {
  city: string;
  country: string;
  flag?: string;
}

export function TopIpAddressesChart({ data, suspiciousIps = {}, className = "", onFilter, activeFilter }: TopIpAddressesChartProps) {
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
    // Cache key prefix and expiration time (24 hours)
    const CACHE_KEY_PREFIX = 'ipinfo_';
    const CACHE_EXPIRATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    // Get cached IP info or return null if expired/missing
    const getCachedIpInfo = (ip: string): IpInfo | null => {
      try {
        const cached = localStorage.getItem(`${CACHE_KEY_PREFIX}${ip}`);
        if (!cached) return null;
        
        const { data, timestamp } = JSON.parse(cached);
        const now = Date.now();
        
        // Check if cache is expired
        if (now - timestamp > CACHE_EXPIRATION) {
          localStorage.removeItem(`${CACHE_KEY_PREFIX}${ip}`);
          return null;
        }
        
        return data;
      } catch (error) {
        console.error(`Error reading cache for IP ${ip}:`, error);
        return null;
      }
    };

    // Save IP info to cache
    const setCachedIpInfo = (ip: string, info: IpInfo) => {
      try {
        const cacheEntry = {
          data: info,
          timestamp: Date.now()
        };
        localStorage.setItem(`${CACHE_KEY_PREFIX}${ip}`, JSON.stringify(cacheEntry));
      } catch (error) {
        console.error(`Error caching info for IP ${ip}:`, error);
      }
    };

    const fetchIpInfo = async (ip: string): Promise<IpInfo> => {
      // Check cache first
      const cachedInfo = getCachedIpInfo(ip);
      if (cachedInfo) {
        return cachedInfo;
      }

      try {
        // Respect rate limiting - add a small delay for multiple requests
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const response = await fetch(`https://ipinfo.io/${ip}/json/`);
        if (!response.ok) {
          if (response.status === 429) {
            console.warn(`Rate limited for IP ${ip}. Using fallback data.`);
            return { city: "Rate Limited", country: "N/A" };
          }
          throw new Error(`HTTP ${response.status}`);
        }
        
        const json = await response.json();
        
        const countryName = new Intl.DisplayNames(['en'], { type: 'region' }).of(json.country) || json.region || "Unknown";
        
        const info: IpInfo = {
          city: json.city || "Unknown",
          country: countryName,
          flag: json.country ? `https://flagcdn.com/16x12/${json.country.toLowerCase()}.png` : undefined,
        };
        
        // Cache the result
        setCachedIpInfo(ip, info);
        
        return info;
      } catch (error) {
        console.error(`Error fetching info for IP ${ip}:`, error);
        return { city: "N/A", country: "N/A" };
      }
    };

    const fetchAllIpInfo = async () => {
      setIsLoading(true);
      const ips = sortedData.map(([ip]) => ip);
      
      // Get cached info first to minimize API calls
      const initialInfoMap: Record<string, IpInfo> = {};
      const ipsToFetch: string[] = [];
      
      ips.forEach(ip => {
        const cachedInfo = getCachedIpInfo(ip);
        if (cachedInfo) {
          initialInfoMap[ip] = cachedInfo;
        } else {
          ipsToFetch.push(ip);
        }
      });
      
      // Set cached data immediately
      setIpInfo(initialInfoMap);
      
      // Only fetch data for IPs not in cache
      if (ipsToFetch.length > 0) {
        const infoPromises = ipsToFetch.map(ip => fetchIpInfo(ip));
        const infoArray = await Promise.all(infoPromises);
        
        const updatedInfoMap = { ...initialInfoMap };
        ipsToFetch.forEach((ip, index) => {
          updatedInfoMap[ip] = infoArray[index];
        });
        
        setIpInfo(updatedInfoMap);
      }
      
      setIsLoading(false);
    };

    if (sortedData.length > 0) {
      fetchAllIpInfo();
    } else {
      setIsLoading(false);
      setIpInfo({});
    }
  }, [sortedData]);

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className={`p-8 ${className}`}>
        <div className="text-center">
          <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold">No IP Address Data</h3>
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
          activeFilter === ip 
            ? (suspiciousIps[ip] ? 'rgba(220, 38, 38, 1)' : 'rgba(37, 99, 235, 1)')
            : (suspiciousIps[ip] 
              ? (isDarkMode ? 'rgba(239, 68, 68, 0.5)' : 'rgba(239, 68, 68, 0.7)') 
              : (isDarkMode ? 'rgba(59, 130, 246, 0.5)' : 'rgba(59, 130, 246, 0.7)'))
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
    onClick: (event: ChartEvent, elements: ActiveElement[], chart: ChartJS) => {
      if (elements.length > 0 && onFilter && chart.data.labels) {
        const elementIndex = elements[0].index;
        const labels = chart.data.labels as string[];
        const clickedLabel = labels[elementIndex];
        
        if (clickedLabel !== undefined) {
          const newFilterValue = activeFilter === clickedLabel ? null : clickedLabel;
          onFilter('ipAddress', newFilterValue);
        }
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
          title: (items: TooltipItem<"bar">[]) => {
            const item = items[0];
            const ip = item.label;
            return suspiciousIps[ip] ? `IP: ${ip} (Suspicious)` : `IP: ${ip}`;
          },
          label: (context: TooltipItem<"bar">) => {
            const ip = context.label;
            const count = context.raw as number;
            const info = ipInfo[ip];
            
            if (!info) {
              return [
                `Requests: ${count.toLocaleString()}`,
                `Location: Loading...`
              ];
            }
            
            // Check if we have rate limited data
            if (info.city === "Rate Limited") {
              return [
                `Requests: ${count.toLocaleString()}`,
                `Location: Rate limit reached. Data unavailable.`
              ];
            }
            
            const location = `${info.city}, ${info.country}`;
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
        ticks: { color: isDarkMode ? "#9ca3af" : "#6b7280", font: { size: 10 } },
      },
      x: {
        beginAtZero: true,
        grid: { color: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)" },
        ticks: { color: isDarkMode ? "#9ca3af" : "#6b7280" },
        border: { display: false }
      },
    },
  };

  return (
    <div className={className}>
      <div className="p-6 pb-4 border-b border-gray-200/50 dark:border-gray-700/50">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
          <MapPin className="h-5 w-5 text-blue-500" />
          <span>Top IP Addresses</span>
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Top IP addresses by request volume. Click to filter.
        </p>
      </div>

      <div className="p-6 space-y-6">
        <div className="h-[200px] sm:h-[250px] relative">
          <Bar data={chartData} options={options} />
        </div>

        <div className="flex items-center justify-end gap-4 text-sm">
          <div className="flex items-center"><div className="w-4 h-4 bg-blue-500 rounded mr-2"></div><span className="text-gray-600 dark:text-gray-400">Normal IP</span></div>
          <div className="flex items-center"><div className="w-4 h-4 bg-red-500 rounded mr-2"></div><span className="text-gray-600 dark:text-gray-400">Suspicious IP</span></div>
        </div>
      </div>
    </div>
  );
}

export default TopIpAddressesChart;