"use client";

import { SetStateAction, useState, useEffect } from "react";
import { Dashboard } from "../components/Dashboard";
import { DarkModeToggle } from "../components/DarkModeToggle";
import { LogUploader } from "../components/LogUploader";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Plus } from "lucide-react";

export default function Home() {
  const [logData, setLogData] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [, setIsLoaded] = useState(false);
  const [loading, setLoading] = useState(false); // New loading state

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleLogParsed = (data: SetStateAction<null>) => {
    setLogData(data);
    setLoading(false); // Set loading to false once data is parsed
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleFileUpload = () => {
    setLoading(true); // Set loading to true when file is being processed
  };

  const handleNewLog = () => {
    setLogData(null);
  };

  return (
    <div
      className={
        isDarkMode ? "dark overflow-x-hidden" : "overflow-x-hidden bg-gray-50"
      }
    >
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        {/* Header Section */}
        <nav className="border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-4">
            <div className="flex items-center justify-between">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex items-center space-x-4"
              >
                <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800 dark:text-gray-100 font-poppins tracking-wide">
                  Nginx Log Analyzer
                </h1>
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900 dark:text-blue-100">
                  Beta
                </span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="flex items-center"
              >
                {/* Tampilkan button "New" kalo ada log yang udah diupload */}
                {logData && (
                  <motion.button
                    onClick={handleNewLog}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4 }}
                    className="mr-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full shadow cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-300 antialiased font-sans flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New
                  </motion.button>
                )}
                <DarkModeToggle
                  isDarkMode={isDarkMode}
                  toggleDarkMode={toggleDarkMode}
                />
              </motion.div>
            </div>
          </div>
        </nav>
        {/* Main Content */}
        <main className="max-w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-8">
          <AnimatePresence mode="wait">
            {!logData ? (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 sm:p-8 border border-gray-200 dark:border-gray-700 shadow-md"
              >
                <div className="space-y-5">
                  <div className="text-center">
                    <img
                      src="/assets/img/nginx.png"
                      alt="Analyze Your Nginx Logs"
                      className="w-24 sm:w-32 lg:w-40 mx-auto"
                    />
                    <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto font-roboto">
                      Upload your Nginx log file and get powerful insights into
                      your server’s traffic and performance.
                    </p>
                  </div>

                  {/* Loading State with Spinner */}
                  {loading ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                      className="flex justify-center items-center space-x-2"
                    >
                      <div className="w-8 h-8 border-t-4 border-blue-500 border-solid rounded-full animate-spin" />
                      <span className="text-lg text-gray-600 dark:text-gray-400 font-roboto">
                        Processing...
                      </span>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4, delay: 0.5 }}
                      className="bg-white dark:bg-gray-800 rounded-lg p-6 sm:p-8 border border-gray-200 dark:border-gray-700 shadow-md"
                    >
                      <LogUploader
                        onLogParsed={handleLogParsed}
                        onFileUpload={handleFileUpload}
                      />
                    </motion.div>
                  )}

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.7 }}
                    className="flex justify-center"
                  >
                    <ChevronDown className="w-6 h-6 text-gray-400 animate-bounce" />
                  </motion.div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 sm:p-8 border border-gray-200 dark:border-gray-700"
              >
                <Dashboard logData={logData} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
        {/* Footer */}
        <footer className="border-t border-gray-200 dark:border-gray-800 mt-16">
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-6">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="text-center text-sm text-gray-600 dark:text-gray-400 font-roboto"
            >
              Your logs stay private. We respect your data.
            </motion.p>
          </div>

          <div className="text-center mt-4">
            <p className="text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-300 transition-colors duration-300">
              Built with ❤️ by{" "}
              <span className="font-semibold">Aldo Tobing</span>
            </p>
          </div>

          <div className="flex justify-center items-center mt-4">
            <a
              href="https://github.com/aldotobing"
              target="_blank"
              rel="noopener noreferrer"
              className="mx-2"
            >
              <img
                src="/assets/img/github-mark.png"
                alt="GitHub"
                className="h-5 w-5 hover:opacity-80 transition-opacity duration-300"
              />
            </a>
            <a
              href="https://twitter.com/aldo_tobing"
              target="_blank"
              rel="noopener noreferrer"
              className="mx-2"
            >
              <img
                src="/assets/img/x.png"
                alt="Twitter"
                className="h-4 w-4 hover:opacity-80 transition-opacity duration-300"
              />
            </a>
          </div>
          <br></br>
        </footer>
      </div>
    </div>
  );
}
