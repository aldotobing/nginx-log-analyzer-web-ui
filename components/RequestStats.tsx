export function RequestStats({
  data = { totalRequests: 0, uniqueIPs: 0, totalAttackAttempts: 0 },
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-transform duration-300 hover:scale-105 hover:shadow-2xl">
      <h2 className="text-2xl font-medium mb-6 text-gray-800 dark:text-gray-100">
        Request Statistics
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        {/* Total Requests */}
        <div className="bg-blue-100 dark:bg-blue-800 p-6 rounded-xl shadow-md hover:bg-blue-200 dark:hover:bg-blue-700 transition duration-200">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
            Total Requests
          </p>
          <p className="text-4xl font-semibold text-gray-800 dark:text-gray-100">
            {(data?.totalRequests || 0).toLocaleString()}
          </p>
        </div>

        {/* Unique IPs */}
        <div className="bg-green-100 dark:bg-green-800 p-6 rounded-xl shadow-md hover:bg-green-200 dark:hover:bg-green-700 transition duration-200">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
            Unique IPs
          </p>
          <p className="text-4xl font-semibold text-gray-800 dark:text-gray-100">
            {(data?.uniqueIPs || 0).toLocaleString()}
          </p>
        </div>

        {/* Total Attack Attempts */}
        <div className="bg-red-100 dark:bg-red-800 p-6 rounded-xl shadow-md hover:bg-red-200 dark:hover:bg-red-700 transition duration-200">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
            Total Attack Attempts
          </p>
          <p className="text-4xl font-semibold text-gray-800 dark:text-gray-100">
            {(data?.totalAttackAttempts || 0).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
