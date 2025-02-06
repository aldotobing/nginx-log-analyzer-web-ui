import React from "react";
import { motion } from "framer-motion";
import { RequestStats } from "./RequestStats";
import { HttpMethodsChart } from "./HttpMethodsChart";
import { StatusCodesChart } from "./StatusCodesChart";
import { AttackDistributionChart } from "./AttackDistributionChart";
import { TrafficOverTimeChart } from "./TrafficOverTimeChart";
import { RecentAttacksTable } from "./RecentAttacksTable";
import TopIpAddressesChart from "./TopIpAddressChart";
import TopReferringUrlsChart from "./TopReferringUrlsChart";

interface LogData {
  requestStats?: any;
  httpMethods?: any;
  statusCodes?: any;
  attackDistribution?: any;
  trafficOverTime?: any[];
  recentAttacks?: any[];
  topIp?: Record<string, number>;
  topReferrers?: Record<string, number>;
  suspiciousIps?: Record<
    string,
    {
      attackCount: number;
      requestCount: number;
      lastSeen: string;
      uniquePaths: number;
      uniqueUserAgents: number;
      bandwidthUsage: number;
      methods: Record<string, number>;
      statusCodes: Record<string, number>;
    }
  >;
}

export function Dashboard({ logData = {} as LogData }) {
  const {
    requestStats,
    httpMethods,
    statusCodes,
    attackDistribution,
    trafficOverTime,
    recentAttacks,
    topIp,
    topReferrers,
  } = logData;

  // Variants for smooth animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2, // Delay between each child animation
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Request Stats */}
      <motion.div
        className="md:col-span-2 xl:col-span-3"
        variants={itemVariants}
      >
        <RequestStats data={requestStats} />
      </motion.div>

      {/* HTTP Methods Chart */}
      <motion.div className="md:col-span-1" variants={itemVariants}>
        <HttpMethodsChart data={httpMethods || {}} />
      </motion.div>

      {/* Status Codes Chart */}
      <motion.div className="md:col-span-1" variants={itemVariants}>
        <StatusCodesChart data={statusCodes || {}} />
      </motion.div>

      {/* Attack Distribution Chart */}
      <motion.div
        className="md:col-span-2 xl:col-span-1"
        variants={itemVariants}
      >
        <AttackDistributionChart data={attackDistribution || {}} />
      </motion.div>

      {/* Top IP Addresses Chart */}
      <motion.div className="md:col-span-1" variants={itemVariants}>
        <TopIpAddressesChart data={topIp || {}} />
      </motion.div>

      {/* Top Referring URLs Chart */}
      <motion.div className="md:col-span-2" variants={itemVariants}>
        <TopReferringUrlsChart fetchData={async () => topReferrers || {}} />
      </motion.div>

      {/* Traffic Over Time Chart */}
      <motion.div
        className="md:col-span-2 xl:col-span-3"
        variants={itemVariants}
      >
        <TrafficOverTimeChart data={trafficOverTime || []} />
      </motion.div>

      {/* Recent Attacks Table */}
      <motion.div
        className="md:col-span-2 xl:col-span-3"
        variants={itemVariants}
      >
        <RecentAttacksTable data={recentAttacks || []} />
      </motion.div>
    </motion.div>
  );
}

export default Dashboard;
