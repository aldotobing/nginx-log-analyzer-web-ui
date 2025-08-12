// components/Dashboard.tsx
import React, { useMemo, useState, useCallback, memo } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Activity, XCircle } from "lucide-react";
import { RequestStats } from "./RequestStats";
import { HttpMethodsChart } from "./HttpMethodsChart";
import { StatusCodesChart } from "./StatusCodesChart";
import { AttackDistributionChart } from "./AttackDistributionChart";
import TrafficOverTimeChart from "./TrafficOverTimeChart";

// Memoized version of TrafficOverTimeChart to prevent unnecessary re-renders
const MemoizedTrafficOverTimeChart = memo(TrafficOverTimeChart);
import { RecentAttacksTable } from "./RecentAttacksTable";
import TopIpAddressesChart from "./TopIpAddressChart";
import TopReferringUrlsChart from "./TopReferringUrlsChart";
import TopRequestedUrlsChart from "./TopRequestedUrlsChart";
import TopSuspiciousIpsChart from "./TopSuspiciousIpsChart";
import { aggregateLogData } from "../lib/log-aggregator";

interface DashboardProps {
  logData?: any;
  parsedLines?: any[];
}

export function Dashboard({ logData: initialLogData = {}, parsedLines = [] }: DashboardProps) {
  const [filters, setFilters] = useState<Record<string, any>>({});

  const handleSetFilter = useCallback((key: string, value: any) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      if (value === null || value === undefined) {
        delete newFilters[key];
      } else {
        newFilters[key] = value;
      }
      return newFilters;
    });
  }, []);

  const clearFilters = () => {
    setFilters({});
  };

  const filteredData = useMemo(() => {
    //console.log('=== Dashboard: Filters changed ===', filters);
    //console.log('Initial parsed lines count:', parsedLines.length);
    
    if (Object.keys(filters).length === 0) {
      //console.log('No filters, returning initial data');
      return initialLogData;
    }

    const filteredLines = parsedLines.filter(line => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        
        if (key === 'status') {
          if (typeof value === 'string' && value.endsWith('xx')) {
            const statusPrefix = value.slice(0, 1);
            return line.status && line.status.toString().startsWith(statusPrefix);
          }
          return line.status && line.status.toString() === value.toString();
        }
        if (key === 'ipAddress') {
          return line.ipAddress === value;
        }
        if (key === 'method') {
          return line.method && line.method.toLowerCase() === value.toLowerCase();
        }
        return line[key] === value;
      });
    });

    //console.log('Filtering with', filteredLines.length, 'lines after applying filters');
    const result = aggregateLogData(filteredLines, filters);
    //console.log('Filtered data result - traffic data points:', result.trafficOverTime.filter(x => x.count > 0).length, 'out of', result.trafficOverTime.length);
    //console.log('First few traffic data points:', result.trafficOverTime.filter(x => x.count > 0).slice(0, 3));
    return result;
  }, [filters, parsedLines, initialLogData]);

  const {
    requestStats,
    httpMethods,
    statusCodes,
    attackDistribution,
    trafficOverTime,
    recentAttacks,
    topIp,
    topReferrers,
    topRequestedUrls,
    suspiciousIps,
  } = filteredData || {};

  const hasData = useMemo(() => {
      return initialLogData && initialLogData.requestStats && initialLogData.requestStats.totalRequests > 0;
  }, [initialLogData]);


  if (!hasData) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Activity className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold">No Data Available</h3>
          <p className="text-gray-500">Upload a log file to begin analysis.</p>
        </div>
      </motion.div>
    );
  }
  
  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Log Analytics Dashboard
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Comprehensive analysis of your server logs
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live Analysis</span>
          </div>
        </div>

      {Object.keys(filters).length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-4">
              <span className="font-semibold">Filters Active:</span>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(filters).map(([key, value]) => (
                  <span key={key} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-full">
                    {key}: {value}
                  </span>
                ))}
              </div>
          </div>
          <button onClick={clearFilters} className="p-1 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800/50 rounded-full">
            <XCircle className="w-5 h-5" />
          </button>
        </motion.div>
      )}

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="lg:col-span-12" variants={itemVariants}>
          <RequestStats data={{...requestStats, suspiciousIps: suspiciousIps ? Object.keys(suspiciousIps).length : 0, totalAttackAttempts: recentAttacks?.length || 0 }} />
        </motion.div>
        <motion.div className="lg:col-span-12" variants={itemVariants}>
            <MemoizedTrafficOverTimeChart 
              data={trafficOverTime || []} 
              key={JSON.stringify(filters)} // Force re-render when filters change
            />
        </motion.div>
        <motion.div className="md:col-span-1 lg:col-span-6" variants={itemVariants}>
            <HttpMethodsChart data={httpMethods || {}} onFilter={handleSetFilter} activeFilter={filters?.method} />
        </motion.div>
        <motion.div className="md:col-span-1 lg:col-span-6" variants={itemVariants}>
            <StatusCodesChart data={statusCodes || {}} onFilter={handleSetFilter} activeFilter={filters?.status} />
        </motion.div>
        <motion.div className="md:col-span-1 lg:col-span-6" variants={itemVariants}>
            <AttackDistributionChart data={attackDistribution || {}} onFilter={handleSetFilter} activeFilter={filters?.attackType} />
        </motion.div>
        <motion.div className="md:col-span-1 lg:col-span-6" variants={itemVariants}>
            <TopIpAddressesChart data={topIp || {}} suspiciousIps={suspiciousIps || {}} onFilter={handleSetFilter} activeFilter={filters?.ipAddress} />
        </motion.div>
        <motion.div className="md:col-span-1 lg:col-span-6" variants={itemVariants}>
            <TopRequestedUrlsChart data={topRequestedUrls} />
        </motion.div>
        <motion.div className="md:col-span-1 lg:col-span-6" variants={itemVariants}>
            <TopReferringUrlsChart data={topReferrers || {}} />
        </motion.div>
        <motion.div className="lg:col-span-12" variants={itemVariants}>
            <TopSuspiciousIpsChart data={suspiciousIps || {}} />
        </motion.div>
        <motion.div className="lg:col-span-12" variants={itemVariants}>
            <RecentAttacksTable data={recentAttacks || []} />
        </motion.div>
      </motion.div>
    </div>
  );
}

export default Dashboard;
