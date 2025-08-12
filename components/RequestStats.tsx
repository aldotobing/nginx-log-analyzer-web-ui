import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { Activity, Users, Shield, TrendingUp, AlertTriangle } from "lucide-react";

interface RequestStatsData {
  totalRequests: number;
  uniqueIPs: number;
  totalAttackAttempts: number;
  avgRequestsPerHour?: number;
  peakHour?: string;
  securityScore?: number;
  suspiciousIps?: number;
  bandwidthUsage?: number;
}

interface RequestStatsProps {
  data?: RequestStatsData;
  className?: string;
}

export function RequestStats({
  data = { 
    totalRequests: 0, 
    uniqueIPs: 0, 
    totalAttackAttempts: 0,
    avgRequestsPerHour: 0,
    peakHour: "N/A",
    securityScore: 0,
    suspiciousIps: 0,
    bandwidthUsage: 0
  },
  className = ""
}: RequestStatsProps) {
  // Refs to store the spring animations for each counter
  const totalRequestsSpring = useRef(useSpring(data.totalRequests, { 
    damping: 25,
    stiffness: 100,
    mass: 1.2
  })).current;
  
  const uniqueIPsSpring = useRef(useSpring(data.uniqueIPs, { 
    damping: 25,
    stiffness: 100,
    mass: 1.2
  })).current;
  
  const totalAttackAttemptsSpring = useRef(useSpring(data.totalAttackAttempts, { 
    damping: 25,
    stiffness: 100,
    mass: 1.2
  })).current;
  
  const suspiciousIpsSpring = useRef(useSpring(data.suspiciousIps || 0, { 
    damping: 25,
    stiffness: 100,
    mass: 1.2
  })).current;

  // Update springs when data changes
  useEffect(() => {
    totalRequestsSpring.set(data.totalRequests);
    uniqueIPsSpring.set(data.uniqueIPs);
    totalAttackAttemptsSpring.set(data.totalAttackAttempts);
    suspiciousIpsSpring.set(data.suspiciousIps || 0);
  }, [data, totalRequestsSpring, uniqueIPsSpring, totalAttackAttemptsSpring, suspiciousIpsSpring]);

  // Transform springs to display values
  const totalRequestsDisplay = useTransform(totalRequestsSpring, (value) => 
    Math.round(value).toLocaleString()
  );
  
  const uniqueIPsDisplay = useTransform(uniqueIPsSpring, (value) => 
    Math.round(value).toLocaleString()
  );
  
  const totalAttackAttemptsDisplay = useTransform(totalAttackAttemptsSpring, (value) => 
    Math.round(value).toLocaleString()
  );
  
  const suspiciousIpsDisplay = useTransform(suspiciousIpsSpring, (value) => 
    Math.round(value).toLocaleString()
  );

  // Calculate derived metrics
  const metrics = useMemo(() => {
    const attackRate = data.totalRequests > 0 
      ? ((data.totalAttackAttempts / data.totalRequests) * 100) 
      : 0;
    
    const avgRequestsPerIP = data.uniqueIPs > 0 
      ? Math.round(data.totalRequests / data.uniqueIPs) 
      : 0;

    const securityLevel = attackRate < 1 ? 'High' : attackRate < 5 ? 'Medium' : 'Low';
    const securityColor = attackRate < 1 ? 'green' : attackRate < 5 ? 'yellow' : 'red';

    return {
      attackRate: Math.round(attackRate * 100) / 100,
      avgRequestsPerIP,
      securityLevel,
      securityColor,
      hasData: data.totalRequests > 0
    };
  }, [data]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.15
      }
    }
  };

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.85,
      rotateX: -15,
      rotateY: -15,
      rotateZ: -5
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      rotateX: 0,
      rotateY: 0,
      rotateZ: 0,
      transition: {
        type: "spring" as const,
        stiffness: 200,
        damping: 18,
        mass: 0.8,
        duration: 0.7
      }
    },
    hover: {
      y: -8,
      rotateZ: 2,
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 15
      }
    }
  };

  const statCards = [
    {
      title: "Total Requests",
      value: data.totalRequests,
      display: totalRequestsDisplay,
      icon: Activity,
      color: "blue",
      bgGradient: "from-blue-500/10 to-blue-600/10",
      borderColor: "border-blue-200 dark:border-blue-800/50",
      textColor: "text-blue-700 dark:text-blue-300",
      iconColor: "text-blue-500",
      description: "All HTTP requests processed"
    },
    {
      title: "Unique Visitors",
      value: data.uniqueIPs,
      display: uniqueIPsDisplay,
      icon: Users,
      color: "green",
      bgGradient: "from-green-500/10 to-green-600/10",
      borderColor: "border-green-200 dark:border-green-800/50", 
      textColor: "text-green-700 dark:text-green-300",
      iconColor: "text-green-500",
      description: `Avg ${metrics.avgRequestsPerIP} requests per IP`
    },
    {
      title: "Security Events",
      value: data.totalAttackAttempts,
      display: totalAttackAttemptsDisplay,
      icon: Shield,
      color: "red",
      bgGradient: "from-red-500/10 to-red-600/10",
      borderColor: "border-red-200 dark:border-red-800/50",
      textColor: "text-red-700 dark:text-red-300", 
      iconColor: "text-red-500",
      description: `${metrics.attackRate}% of total traffic`
    },
    {
      title: "Suspicious IPs",
      value: data.suspiciousIps || 0,
      display: suspiciousIpsDisplay,
      icon: AlertTriangle,
      color: "orange",
      bgGradient: "from-orange-500/10 to-orange-600/10",
      borderColor: "border-orange-200 dark:border-orange-800/50",
      textColor: "text-orange-700 dark:text-orange-300",
      iconColor: "text-orange-500",
      description: "IPs flagged for suspicious activity"
    }
  ];

  if (!metrics.hasData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ 
          type: "spring", 
          stiffness: 100, 
          damping: 12,
          duration: 0.7 
        }}
        className={`bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700/50 p-8 ${className}`}
      >
        <div className="text-center">
          <motion.div 
            className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              type: "spring", 
              stiffness: 150, 
              damping: 10,
              delay: 0.2 
            }}
          >
            <Activity className="h-8 w-8 text-gray-400" />
          </motion.div>
          <motion.h3
            className="text-lg font-semibold text-gray-900 dark:text-white mb-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            No Request Data
          </motion.h3>
          <motion.p
            className="text-gray-600 dark:text-gray-400"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Upload a log file to see request statistics and analytics.
          </motion.p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg ${className}`}
    >
      {/* Header */}
      <div className="p-6 pb-4 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center justify-between">
          <div>
            <motion.h2
              className="text-2xl font-bold text-gray-900 dark:text-white"
              initial={{ opacity: 0, x: -20, rotateX: -10 }}
              animate={{ opacity: 1, x: 0, rotateX: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 150, 
                damping: 15,
                duration: 0.7 
              }}
            >
              Request Overview
            </motion.h2>
            <motion.p
              className="text-gray-600 dark:text-gray-400 mt-1"
              initial={{ opacity: 0, x: -20, rotateX: -10 }}
              animate={{ opacity: 1, x: 0, rotateX: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 150, 
                damping: 15,
                duration: 0.7, 
                delay: 0.05 
              }}
            >
              Key metrics from your server logs
            </motion.p>
          </div>
          
          {/* Security Score Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7, rotateY: -20, rotateX: -10 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0, rotateX: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 250, 
              damping: 20,
              mass: 0.8,
              duration: 0.6, 
              delay: 0.3 
            }}
            whileHover={{ 
              scale: 1.08,
              rotateZ: 3,
              transition: { duration: 0.2 }
            }}
            className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
              metrics.securityColor === 'green' 
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' 
                : metrics.securityColor === 'yellow'
                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
            }`}
          >
            {metrics.securityColor === 'green' ? (
              <Shield className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <span>Security: {metrics.securityLevel}</span>
          </motion.div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.title}
                variants={cardVariants}
                whileHover={{ 
                  scale: 1.02,
                  transition: { duration: 0.2 }
                }}
                className={`relative overflow-hidden bg-gradient-to-br ${stat.bgGradient} rounded-xl border ${stat.borderColor} p-4 hover:shadow-lg transition-all duration-300`}
              >
                {/* Background Icon */}
                <div className="absolute top-1 right-1 opacity-5">
                  <Icon className="h-16 w-16" />
                </div>

                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-1.5 rounded-lg bg-white/50 dark:bg-gray-800/50`}>
                      <Icon className={`h-4 w-4 ${stat.iconColor}`} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h3 className={`text-xs font-semibold ${stat.textColor} uppercase tracking-wide`}>
                      {stat.title}
                    </h3>
                    
                    <div className={stat.textColor}>
                      <motion.span 
                        className="text-3xl lg:text-4xl font-bold tracking-tight"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ 
                          type: "spring",
                          damping: 20,
  stiffness: 100,
  mass: 1.2
                        }}
                      >
                        {stat.display}
                      </motion.span>
                    </div>

                    <p className="text-[10px] text-gray-600 dark:text-gray-400 leading-tight">
                      {stat.description}
                    </p>
                  </div>
                </div>

                {/* Progress indicator */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700">
                  <motion.div
                    className={`h-full bg-gradient-to-r ${
                      stat.color === 'blue' ? 'from-blue-400 to-blue-600' :
                      stat.color === 'green' ? 'from-green-400 to-green-600' :
                      stat.color === 'red' ? 'from-red-400 to-red-600' :
                      'from-orange-400 to-orange-600'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ 
                      type: "spring",
                      stiffness: 50,
                      damping: 15,
                      duration: 1.5, 
                      delay: 0.5 + index * 0.1 
                    }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Additional Insights */}
        {(data.avgRequestsPerHour || data.peakHour) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, rotateX: -10 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 150, 
              damping: 18,
              mass: 0.9,
              duration: 0.7,
              delay: 0.8
            }}
            whileHover={{ 
              y: -5,
              rotateZ: 2,
              transition: { duration: 0.2 }
            }}
            className="mt-4 p-3 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-gray-200/50 dark:border-gray-700/50"
          >
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                <TrendingUp className="h-4 w-4" />
                <span>Traffic Insights</span>
              </div>
              <div className="text-gray-900 dark:text-white font-medium">
                {data.peakHour && `Peak: ${data.peakHour}`}
                {data.avgRequestsPerHour && ` • ${data.avgRequestsPerHour.toLocaleString()} req/hr avg`}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export default RequestStats;