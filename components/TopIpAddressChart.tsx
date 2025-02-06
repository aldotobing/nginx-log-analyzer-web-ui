import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TooltipItem,
} from "chart.js";

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
}

interface IpInfo {
  city: string; // City name
  country: string; // Country code (e.g., "ID")
}

export function TopIpAddressesChart({ data }: TopIpAddressesChartProps) {
  const [ipInfo, setIpInfo] = useState<Record<string, IpInfo>>({});

  const fetchIpInfo = async (ip: string) => {
    try {
      const response = await fetch(`https://ipinfo.io/${ip}/json`);
      const json = await response.json();
      return {
        city: json.city || "Unknown",
        country: json.country || "Unknown",
      };
    } catch (error) {
      console.error(`Error fetching info for IP ${ip}:`, error);
      return { city: "Unknown", country: "Unknown" };
    }
  };

  useEffect(() => {
    const fetchAllIpInfo = async () => {
      const ips = Object.keys(data);
      const info: Record<string, IpInfo> = {};
      for (const ip of ips) {
        const ipDetails = await fetchIpInfo(ip);
        info[ip] = ipDetails;
      }
      setIpInfo(info);
    };
    fetchAllIpInfo();
  }, [data]);

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 md:p-6">
        <h2 className="text-lg md:text-2xl font-semibold text-gray-800 dark:text-gray-200">
          Top IP Addresses
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          No IP address data available
        </p>
      </div>
    );
  }

  const sortedData = Object.entries(data)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const chartData = {
    labels: sortedData.map(([ip]) => ip),
    datasets: [
      {
        label: "Requests",
        data: sortedData.map(([_, count]) => count),
        backgroundColor: "rgba(93, 173, 226, 0.7)", // Light blue
        borderRadius: 8, // Rounded bars
        borderSkipped: false, // No sharp corners
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        titleColor: "#fff",
        bodyColor: "#fff",
        borderWidth: 0,
        cornerRadius: 4,
        padding: 8,
        callbacks: {
          label: (tooltipItem: TooltipItem<"bar">) => {
            const ip = tooltipItem.label ?? "Unknown";
            const count = tooltipItem.raw as number;
            return `${ip}: ${count.toLocaleString()} requests`;
          },
        },
      },
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 12,
          },
          color: "#7f8c8d",
        },
      },
      y: {
        grid: {
          color: "rgba(200, 200, 200, 0.2)",
          drawBorder: false,
        },
        ticks: {
          callback: function (tickValue: string | number) {
            return typeof tickValue === "number"
              ? tickValue.toLocaleString()
              : tickValue;
          },
          font: {
            size: 12,
          },
          color: "#7f8c8d",
        },
      },
    },
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-4 md:p-6 transition-all duration-300 hover:shadow-xl">
      <h2 className="text-lg md:text-2xl font-semibold text-gray-800 dark:text-gray-200">
        Top IP Addresses
      </h2>
      <div className="h-[200px] md:h-[300px] mt-4 md:mt-6">
        <Bar data={chartData} options={options} />
      </div>

      <div className="mt-4 md:mt-5">
        <h3 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3 md:mb-4">
          IP Address List (Top 10)
        </h3>
        <div className="flex flex-col gap-1 md:gap-2">
          {sortedData.map(([ip, count]) => (
            <div
              key={ip}
              className="grid grid-cols-3 gap-2 md:gap-4 bg-white dark:bg-gray-800 px-2 md:px-4 py-2 rounded-lg shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300"
            >
              <span className="text-gray-800 dark:text-gray-300 font-thin text-xs md:text-base col-span-1 truncate">
                {ip}
              </span>
              <span className="text-gray-600 dark:text-gray-400 text-sm md:text-base col-span-1 truncate">
                {ipInfo[ip]
                  ? `${ipInfo[ip]?.city}, ${ipInfo[ip]?.country}`
                  : "Fetching..."}
              </span>
              <span className="text-gray-700 dark:text-gray-400 font-medium text-right text-sm md:text-base col-span-1">
                {count.toLocaleString()} reqs
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TopIpAddressesChart;
