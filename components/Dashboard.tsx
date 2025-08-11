import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Activity, Shield, TrendingUp } from "lucide-react";
import { RequestStats } from "./RequestStats";
import { HttpMethodsChart } from "./HttpMethodsChart";
import { StatusCodesChart } from "./StatusCodesChart";
import { AttackDistributionChart } from "./AttackDistributionChart";
import TrafficOverTimeChart from "./TrafficOverTimeChart";
import { RecentAttacksTable } from "./RecentAttacksTable";
import TopIpAddressesChart from "./TopIpAddressChart";
import TopReferringUrlsChart from "./TopReferringUrlsChart";
import TopRequestedUrlsChart from "./TopRequestedUrlsChart.tsx";

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

interface LogData {
  requestStats?: any;
  httpMethods?: any;
  statusCodes?: any;
  attackDistribution?: any;
  trafficOverTime?: any[];
  recentAttacks?: any[];
  topIp?: Record<string, number>;
  topReferrers?: Record<string, number>;
  topRequestedUrls?: Record<string, number>;
  suspiciousIps?: Record<string, SuspiciousIpData>;
}

interface DashboardProps {
  logData?: LogData;
}

export function Dashboard({ logData = {} }: DashboardProps) {
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
  } = logData;

  // Memoized calculations for performance
  const dashboardMetrics = useMemo(() => {
    const totalRequests = requestStats?.totalRequests || 0;
    const attackCount = recentAttacks?.length || 0;
    const suspiciousIpCount = suspiciousIps ? Object.keys(suspiciousIps).length : 0;
    const uniqueIps = topIp ? Object.keys(topIp).length : 0;

    return {
      totalRequests,
      attackCount,
      suspiciousIpCount,
      uniqueIps,
      hasData: totalRequests > 0,
    };
  }, [requestStats, recentAttacks, suspiciousIps, topIp]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 30,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        duration: 0.5,
        ease: "easeOut"
      } 
    },
  };

  const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    },
  };

  // Quick stats component
  const QuickStats = () => (
    <motion.div
      variants={itemVariants}
      className="col-span-full mb-6"
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Requests</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {dashboardMetrics.totalRequests.toLocaleString()}
              </p>
            </div>
            <Activity className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl p-4 border border-red-200 dark:border-red-800/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600 dark:text-red-400">Security Events</p>
              <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                {dashboardMetrics.attackCount.toLocaleString()}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Suspicious IPs</p>
              <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                {dashboardMetrics.suspiciousIpCount.toLocaleString()}
              </p>
            </div>
            <Shield className="h-8 w-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4 border border-green-200 dark:border-green-800/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400">Unique Visitors</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {dashboardMetrics.uniqueIps.toLocaleString()}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>
      </div>
    </motion.div>
  );

  // Error boundary component
  const ChartWrapper = ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="p-1">
        {React.isValidElement(children) ? children : (
          <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Unable to load {title}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (!dashboardMetrics.hasData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center min-h-[400px]"
      >
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <Activity className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Data Available
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md">
            Upload a log file to see detailed analytics and insights about your server traffic.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <motion.div
        variants={headerVariants}
        initial="hidden"
        animate="visible"
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
              Log Analytics Dashboard
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Comprehensive analysis of your server logs
            </p>
          </div>
          <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live Analysis</span>
          </div>
        </div>
      </motion.div>

      {/* Main Dashboard Grid */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-12 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Quick Stats */}
        <QuickStats />

        {/* Request Stats - Full width */}
        <motion.div
          className="lg:col-span-12"
          variants={itemVariants}
        >
          <ChartWrapper title="Request Statistics">
            <RequestStats data={requestStats} />
          </ChartWrapper>
        </motion.div>

        {/* Traffic Over Time - Full width */}
        <motion.div
          className="lg:col-span-12"
          variants={itemVariants}
        >
          <ChartWrapper title="Traffic Over Time">
            <TrafficOverTimeChart data={trafficOverTime || []} />
          </ChartWrapper>
        </motion.div>

        {/* HTTP Methods and Status Codes */}
        <motion.div
          className="lg:col-span-6"
          variants={itemVariants}
        >
          <ChartWrapper title="HTTP Methods">
            <HttpMethodsChart data={httpMethods || {}} />
          </ChartWrapper>
        </motion.div>

        <motion.div
          className="lg:col-span-6"
          variants={itemVariants}
        >
          <ChartWrapper title="Status Codes">
            <StatusCodesChart data={statusCodes || {}} />
          </ChartWrapper>
        </motion.div>

        {/* Attack Distribution and Top IPs */}
        <motion.div
          className="lg:col-span-6"
          variants={itemVariants}
        >
          <ChartWrapper title="Attack Distribution">
            <AttackDistributionChart data={attackDistribution || {}} />
          </ChartWrapper>
        </motion.div>

        <motion.div
          className="lg:col-span-6"
          variants={itemVariants}
        >
          <ChartWrapper title="Top IP Addresses">
            <TopIpAddressesChart data={topIp || {}} />
          </ChartWrapper>
        </motion.div>

        {/* Top URLs */}
        <motion.div
          className="lg:col-span-6"
          variants={itemVariants}
        >
          <ChartWrapper title="Top Requested URLs">
            <TopRequestedUrlsChart fetchData={async () => topRequestedUrls || {}} />
          </ChartWrapper>
        </motion.div>

        <motion.div
          className="lg:col-span-6"
          variants={itemVariants}
        >
          <ChartWrapper title="Top Referring URLs">
            <TopReferringUrlsChart fetchData={async () => topReferrers || {}} />
          </ChartWrapper>
        </motion.div>

        {/* Recent Attacks Table - Full width */}
        <motion.div
          className="lg:col-span-12"
          variants={itemVariants}
        >
          <ChartWrapper title="Recent Security Events">
            <RecentAttacksTable data={recentAttacks || []} />
          </ChartWrapper>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default Dashboard;