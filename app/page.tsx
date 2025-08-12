"use client";

import { SetStateAction, useState, useEffect, useCallback } from "react";
import { Dashboard } from "../components/Dashboard";
import { DarkModeToggle } from "../components/DarkModeToggle";
import { LogUploader } from "../components/LogUploader";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Plus, Lock, FileText, BarChart3, RotateCw, Github, Twitter } from "lucide-react";

export default function Home() {
  interface LogStats {
    // Add specific properties of stats here
    [key: string]: any;
  }

  const [logData, setLogData] = useState<LogStats | null>(null);
  const [parsedLines, setParsedLines] = useState<any[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [fileName, setFileName] = useState<string>("");

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("darkMode");
    if (savedTheme !== null) {
      setIsDarkMode(JSON.parse(savedTheme));
    } else {
      // Default to light mode
      setIsDarkMode(false);
    }
    setIsLoaded(true);
  }, []);

  // Save theme preference
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("darkMode", JSON.stringify(isDarkMode));
    }
  }, [isDarkMode, isLoaded]);

  const handleLogParsed = useCallback((data: { stats: LogStats; parsedLines: any[] }) => {
    if (data && data.stats && data.parsedLines) {
      setLogData(data.stats);
      setParsedLines(data.parsedLines);
    } else {
      // Handle potential error or old data format
      setLogData(data);
      setParsedLines([]);
    }
  }, []);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  const handleNewLog = useCallback(() => {
    window.location.href = '/';
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-8 h-8 bg-blue-500 rounded-full animate-bounce"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={isDarkMode ? "dark" : ""}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-300">
        {/* Header Section */}
        <nav className="backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <motion.div
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                className="flex items-center space-x-3"
              >
                <div className="flex items-center space-x-2">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg overflow-hidden">
                    <img 
                      src="/assets/img/analyze.jpg" 
                      alt="HTTP Log Analyzer" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h1 className="text-xl lg:text-2xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">
                      HTTP Log Analyzer
                    </h1>
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      Professional Edition
                    </span>
                  </div>
                </div>
                <div className="hidden sm:flex items-center space-x-2">
                  {logData && fileName && (
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full dark:bg-green-900/50 dark:text-green-300 border border-green-200 dark:border-green-800 flex items-center">
                      <FileText className="w-3 h-3 mr-1" />
                      Processed
                    </span>
                  )}
                </div>
              </motion.div>

              <motion.div
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                className="flex items-center space-x-3"
              >
                {logData && (
                  <motion.button
                    onClick={handleNewLog}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-5 py-2 font-medium text-white bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full flex items-center space-x-2 transition-all duration-300 ease-in-out shadow-md hover:shadow-lg hover:shadow-blue-500/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900"
                  >
                    <RotateCw className="w-4 h-4" />
                    <span className="hidden sm:inline">New Analysis</span>
                    <span className="sm:hidden">New</span>
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
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence mode="wait">
              {!logData ? (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Hero Section */}
                  <div className="text-center mb-12">
                    <motion.div
                      variants={itemVariants}
                      className="mb-6"
                    >
                      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                        Analyze Your Server Logs
                      </h2>
                      <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                        Get powerful insights from your Nginx and Apache HTTP server logs with advanced analytics, 
                        performance metrics, and security monitoring.
                      </p>
                    </motion.div>

                    <motion.div
                      variants={itemVariants}
                      className="flex justify-center items-center space-x-8 mb-8"
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <img
                          src="/assets/img/nginx.png"
                          alt="Nginx Logo"
                          className="w-16 sm:w-20 lg:w-24 h-auto drop-shadow-lg"
                          loading="lazy"
                        />
                      </div>
                      <div className="text-2xl text-gray-400 dark:text-gray-500">+</div>
                      <div className="flex flex-col items-center space-y-2">
                        <img
                          src="/assets/img/apache.png"
                          alt="Apache Logo"
                          className="w-16 sm:w-20 lg:w-24 h-auto drop-shadow-lg"
                          loading="lazy"
                        />
                      </div>
                    </motion.div>
                  </div>

                  {/* Upload Section */}
                  <motion.div
                    variants={itemVariants}
                    className="max-w-2xl mx-auto"
                  >
                    <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl">
                      <LogUploader
                        onLogParsed={handleLogParsed}
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    variants={itemVariants}
                    className="flex justify-center mt-8"
                  >
                    <ChevronDown className="w-6 h-6 text-gray-400 dark:text-gray-500 animate-bounce" />
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 sm:p-8">
                      <Dashboard logData={logData} parsedLines={parsedLines} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200/50 dark:border-gray-700/50 mt-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="flex flex-col items-center space-y-6"
            >
              <motion.div
                variants={itemVariants}
                className="flex flex-col sm:flex-row items-center justify-center gap-2 text-sm text-gray-700 dark:text-gray-300 text-center"
              >
                <span className="flex items-center">
                  <Lock className="h-4 w-4 mr-1.5 flex-shrink-0" />
                  <span className="font-medium">Privacy First</span>
                </span>
                <span className="hidden sm:inline">•</span>
                <span>Your logs are processed locally and never stored</span>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="flex flex-col items-center space-y-6"
              >
                <div className="flex flex-col items-center space-y-4">
                  <p className="text-center text-sm text-gray-700 dark:text-gray-300">
                    Crafted with <span className="text-red-500">❤️</span> by{" "}
                    <a 
                      href="https://aldotobing.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent hover:opacity-90 transition-opacity"
                    >
                      Aldo Tobing
                    </a>
                  </p>

                  <div className="flex items-center space-x-6">
                    <a
                      href="https://github.com/aldotobing"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
                      aria-label="GitHub Profile"
                    >
                      <Github className="w-5 h-5" />
                    </a>
                    <a
                      href="https://twitter.com/aldo_tobing"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
                      aria-label="Twitter Profile"
                    >
                      <Twitter className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </footer>
      </div>
    </div>
  );
}