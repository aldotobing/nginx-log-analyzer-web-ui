import React from "react";
import { motion } from "framer-motion";

interface RequestStatsProps {
  data: {
    totalRequests: number;
    uniqueIPs: number;
    totalAttackAttempts: number;
  };
}

export function RequestStats({
  data = { totalRequests: 0, uniqueIPs: 0, totalAttackAttempts: 0 },
}: RequestStatsProps) {
  // Helper function to animate numbers smoothly
  const Counter = ({ value }: { value: number }) => {
    const [count, setCount] = React.useState(0);

    React.useEffect(() => {
      const duration = 1.5; // Duration in seconds
      const interval = 10; // Interval for each update (ms)
      const steps = (duration * 1000) / interval; // Total number of updates
      const increment = value / steps;

      let currentCount = 0;
      const counterInterval = setInterval(() => {
        currentCount += increment;
        if (currentCount >= value) {
          currentCount = value;
          clearInterval(counterInterval);
        }
        setCount(Math.ceil(currentCount));
      }, interval);

      return () => clearInterval(counterInterval);
    }, [value]);

    return (
      <motion.span
        className="text-5xl font-bold text-gray-800 dark:text-gray-100"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {count.toLocaleString()}
      </motion.span>
    );
  };

  return (
    <div className="bg-gradient-to-tr from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-xl p-8 transition-transform duration-300 hover:scale-105 hover:shadow-2xl">
      <motion.h2
        className="text-3xl font-medium mb-8 text-gray-800 dark:text-gray-100 tracking-wide"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        Request Statistics
      </motion.h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
        {/* Total Requests */}
        <motion.div
          className="bg-blue-50 dark:bg-blue-800 p-6 rounded-xl shadow-md hover:shadow-lg transition duration-300"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
            Total Requests
          </p>
          <Counter value={data?.totalRequests || 0} />
        </motion.div>

        {/* Unique IPs */}
        <motion.div
          className="bg-green-50 dark:bg-green-800 p-6 rounded-xl shadow-md hover:shadow-lg transition duration-300"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
            Unique IPs
          </p>
          <Counter value={data?.uniqueIPs || 0} />
        </motion.div>

        {/* Total Attack Attempts */}
        <motion.div
          className="bg-red-50 dark:bg-red-800 p-6 rounded-xl shadow-md hover:shadow-lg transition duration-300"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7 }}
        >
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
            Total Attack Attempts
          </p>
          <Counter value={data?.totalAttackAttempts || 0} />
        </motion.div>
      </div>
    </div>
  );
}

export default RequestStats;
