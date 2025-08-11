import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { 
  AlertTriangle, 
  Eye, 
  FileText, 
  Hash,
  Clock,
  Activity,
  Wifi,
  ExternalLink
} from "lucide-react";

interface SuspiciousIpData {
  attackCount: number;
  requestCount: number;
  lastSeen: string;
  uniquePaths: number;
  uniqueUserAgents: number;
  bandwidthUsage: number;
  methods: Record<string, number>;
  statusCodes: Record<string, number>;
}

interface TopSuspiciousIpsChartProps {
  data: Record<string, SuspiciousIpData>;
  className?: string;
}

export function TopSuspiciousIpsChart({ data, className = "" }: TopSuspiciousIpsChartProps) {
  const sortedData = useMemo(() => {
    return Object.entries(data)
      .sort((a, b) => b[1].attackCount - a[1].attackCount)
      .slice(0, 10); // Limit to top 10
  }, [data]);

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className={`p-8 ${className}`}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Suspicious IPs Detected
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            No suspicious activity found in the analyzed logs.
          </p>
        </div>
      </div>
    );
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    try {
      // Handle Nginx log timestamp format: "10/Aug/2025:12:47:01 +0700"
      // Convert to a format that JavaScript can parse: "Aug 10 2025 12:47:01"
      const parts = dateString.replace(/\[|\]/g, "").split(':');
      if (parts.length >= 3) {
        const datePart = parts[0]; // "10/Aug/2025"
        const timePart = parts.slice(1, 4).join(':'); // "12:47:01"
        
        // Reformat to "Aug 10 2025 12:47:01"
        const [day, month, year] = datePart.split('/');
        const formattedDate = `${month} ${day} ${year} ${timePart}`;
        
        const date = new Date(formattedDate);
        if (!isNaN(date.getTime())) {
          return date.toLocaleString();
        }
      }
      return dateString;
    } catch (e) {
      return dateString;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    }
  };

  return (
    <div className={className}>
      <div className="px-4 sm:px-6 py-6 pb-4 border-b border-gray-200/50 dark:border-gray-700/50">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          <span>Top Suspicious IP Addresses</span>
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          IP addresses with detected attack attempts
        </p>
      </div>

      <div className="px-4 sm:px-6 py-6">
        <div className="flex flex-col space-y-4">
          <motion.div
            className="flex flex-col mt-2 space-y-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {sortedData.map(([ip, details]) => (
              <motion.div
                key={ip}
                variants={itemVariants}
                className="p-4 rounded-lg border border-gray-200 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded-lg">
                      <Wifi className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900 dark:text-white break-all">{ip}</h3>
                        <a 
                          href={`https://whois.domaintools.com/${ip}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(details.lastSeen)}
                      </p>
                    </div>
                  </div>
                  <div className="bg-red-100 dark:bg-red-900/30 px-3 py-1 rounded-full flex items-center self-start">
                    <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 mr-1" />
                    <span className="text-sm font-bold text-red-700 dark:text-red-300">
                      {details.attackCount} attack{details.attackCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 xs:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex items-center min-w-0">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg mr-3">
                      <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Total Requests</p>
                      <p className="font-semibold text-gray-900 dark:text-white truncate">
                        {details.requestCount.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center min-w-0">
                    <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg mr-3">
                      <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Unique Paths</p>
                      <p className="font-semibold text-gray-900 dark:text-white truncate">
                        {details.uniquePaths}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center min-w-0">
                    <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg mr-3">
                      <Eye className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">User Agents</p>
                      <p className="font-semibold text-gray-900 dark:text-white truncate">
                        {details.uniqueUserAgents}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center min-w-0">
                    <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-lg mr-3">
                      <Hash className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Bandwidth</p>
                      <p className="font-semibold text-gray-900 dark:text-white truncate">
                        {formatBytes(details.bandwidthUsage)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex flex-wrap gap-2">
                    <div className="text-xs">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Methods:</span>
                      {Object.entries(details.methods).map(([method, count]) => (
                        <span key={method} className="ml-2 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded mt-1 inline-block">
                          {method} ({count})
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <div className="text-xs">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Status Codes:</span>
                      {Object.entries(details.statusCodes).map(([code, count]) => (
                        <span key={code} className="ml-2 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded mt-1 inline-block">
                          {code} ({count})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default TopSuspiciousIpsChart;