import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { 
  AlertTriangle, 
  Eye, 
  FileText, 
  Hash,
  Clock,
  Activity,
  Wifi,
  ExternalLink,
  Shield
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

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
  parsedLines: any[];
  className?: string;
}

export function TopSuspiciousIpsChart({ data, parsedLines, className = "" }: TopSuspiciousIpsChartProps) {
  const [selectedIp, setSelectedIp] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const sortedData = useMemo(() => {
    return Object.entries(data)
      .sort((a, b) => b[1].attackCount - a[1].attackCount)
      .slice(0, 10); // Limit to top 10
  }, [data]);

  const attackLogs = useMemo(() => {
    if (!selectedIp) return [];
    return parsedLines.filter(line => line.ipAddress === selectedIp && line.attackType);
  }, [selectedIp, parsedLines]);

  const handleAttackCountClick = (ip: string) => {
    setSelectedIp(ip);
    setIsModalOpen(true);
  };

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className={`${className} bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 overflow-hidden`}>
        <div className="px-6 py-6 pb-4 border-b border-gray-200/50 dark:border-gray-700/50">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <span>Top Suspicious IP Addresses</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            IP addresses with detected attack attempts
          </p>
        </div>
        <div className="p-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Suspicious IPs Detected
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              No suspicious activity found in the analyzed logs.
            </p>
          </div>
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
      // Nginx timestamp format: 11/Aug/2025:03:30:00 +0700
      // Parse the timestamp properly
      const match = dateString.match(/(\d{2})\/(\w{3})\/(\d{4}):(\d{2}):(\d{2}):(\d{2})/);
      if (match) {
        const [, day, month, year, hour, minute] = match;
        // Return an even shorter format: "08/11 03:30"
        return `${month}/${day} ${hour}:${minute}`;
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
      <div className="px-6 py-6 pb-4 border-b border-gray-200/50 dark:border-gray-700/50">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          <span>Top Suspicious IP Addresses</span>
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          IP addresses with detected attack attempts
        </p>
      </div>
      <div className="px-6 py-6">
        <div className="flex flex-col space-y-4">
          <motion.div
            className="flex flex-col mt-2 space-y-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
              {sortedData.map(([ip, details], index) => (
                <motion.div
                  key={ip}
                  variants={itemVariants}
                  className="p-5 rounded-xl border border-gray-200 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white break-all">{ip}</h3>
                          <a 
                            href={`https://whois.domaintools.com/${ip}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                            title="View WHOIS information"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(details.lastSeen)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div 
                      className="bg-gradient-to-r from-red-500 to-orange-500 px-4 py-2 rounded-lg flex items-center self-start shadow cursor-pointer"
                      onClick={() => handleAttackCountClick(ip)}
                    >
                      <AlertTriangle className="h-5 w-5 text-white mr-2" />
                      <span className="text-sm font-bold text-white">
                        {details.attackCount} attack{details.attackCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-5 border-t border-gray-200/50 dark:border-gray-700/50">
                    <div className="flex items-center min-w-0 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                      <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg mr-3">
                        <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Total Requests</p>
                        <p className="font-semibold text-gray-900 dark:text-white truncate text-lg">
                          {details.requestCount.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center min-w-0 bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                      <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg mr-3">
                        <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Unique Paths</p>
                        <p className="font-semibold text-gray-900 dark:text-white truncate text-lg">
                          {details.uniquePaths}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center min-w-0 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                      <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg mr-3">
                        <Eye className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">User Agents</p>
                        <p className="font-semibold text-gray-900 dark:text-white truncate text-lg">
                          {details.uniqueUserAgents}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center min-w-0 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                      <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-lg mr-3">
                        <Hash className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Bandwidth</p>
                        <p className="font-semibold text-gray-900 dark:text-white truncate text-lg">
                          {formatBytes(details.bandwidthUsage)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-5 border-t border-gray-200/50 dark:border-gray-700/50">
                    <div className="flex flex-wrap gap-3">
                      <div className="flex-1 min-w-[200px]">
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                          <Wifi className="h-4 w-4 mr-1.5" />
                          HTTP Methods
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(details.methods).map(([method, count]) => (
                            <span 
                              key={method} 
                              className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-medium"
                            >
                              {method} <span className="font-normal text-gray-500">({count})</span>
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-[200px]">
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                          <Activity className="h-4 w-4 mr-1.5" />
                          Status Codes
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(details.statusCodes).map(([code, count]) => {
                            let colorClass = "bg-gray-100 dark:bg-gray-700";
                            if (code.startsWith("2")) colorClass = "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200";
                            if (code.startsWith("4")) colorClass = "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200";
                            if (code.startsWith("5")) colorClass = "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200";
                            
                            return (
                              <span 
                                key={code} 
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${colorClass}`}
                              >
                                {code} <span className="font-normal">({count})</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
          ))}
          </motion.div>
        </div>
      </div>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Attack Logs for {selectedIp}</DialogTitle>
            <DialogDescription>
              Showing all detected attack logs for this IP address.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                        <th scope="col" className="px-6 py-3">Timestamp</th>
                        <th scope="col" className="px-6 py-3">Method</th>
                        <th scope="col" className="px-6 py-3">Path</th>
                        <th scope="col" className="px-6 py-3">Status</th>
                        <th scope="col" className="px-6 py-3">Attack Type</th>
                    </tr>
                </thead>
                <tbody>
                    {attackLogs.map((log, index) => (
                        <tr key={index} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                            <td className="px-6 py-4">{formatDate(log.timestamp)}</td>
                            <td className="px-6 py-4">{log.method}</td>
                            <td className="px-6 py-4 break-all">{log.path}</td>
                            <td className="px-6 py-4">{log.status}</td>
                            <td className="px-6 py-4">{log.attackType}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TopSuspiciousIpsChart;