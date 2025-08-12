"use client";

import { SetStateAction, useState, useEffect, useCallback } from "react";
import { Dashboard } from "../components/Dashboard";
import { DarkModeToggle } from "../components/DarkModeToggle";
import { LogUploader } from "../components/LogUploader";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Plus, Lock, FileText, BarChart3, RotateCw, Github, Twitter, Wifi, Link, Upload } from "lucide-react";
import { LiveDashboard } from "@/components/LiveDashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AnalysisMode = 'upload' | 'live' | null;

import { LogData } from "../components/LiveDashboard";

export default function Home() {
  const [logData, setLogData] = useState<LogData | null>(null);
  const [parsedLines, setParsedLines] = useState<any[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>(null);
  const [wsUrl, setWsUrl] = useState<string>('');

  useEffect(() => {
    const savedTheme = localStorage.getItem("darkMode");
    setIsDarkMode(savedTheme ? JSON.parse(savedTheme) : false);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("darkMode", JSON.stringify(isDarkMode));
    }
  }, [isDarkMode, isLoaded]);

  const handleLogParsed = useCallback((data: { stats: LogData; parsedLines: any[] }) => {
    if (data && data.stats && data.parsedLines) {
      setLogData(data.stats);
      setParsedLines(data.parsedLines);
      setAnalysisMode('upload'); // Mark that we are in upload analysis mode
    }
  }, []);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  const handleNewAnalysis = useCallback(() => {
    // Reset URL to home page and reload to ensure clean state
    window.location.href = '/';
    window.location.reload();
  }, []);

  const handleConnectToSocket = () => {
    if (wsUrl) {
      setAnalysisMode('live');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.6, staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-pulse w-8 h-8 bg-blue-500 rounded-full"></div>
      </div>
    );
  }

  const renderInitialSelection = () => (
    <motion.div
      key="selection"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto"
    >
      <div className="text-center mb-12">
        <motion.h1 
          variants={itemVariants} 
          className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4"
        >
          HTTP Log Analyzer
        </motion.h1>
        <motion.p variants={itemVariants} className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed mt-4">
          Get powerful insights from your Nginx and Apache logs via file upload or a live WebSocket stream.
        </motion.p>
        <motion.div variants={itemVariants} className="flex justify-center space-x-12 mt-8">
          <div className="flex items-center">
            <img src="/assets/img/nginx.png" alt="Nginx" className="h-16 w-16 object-contain" />
          </div>
          <div className="flex items-center">
            <img src="/assets/img/apache.png" alt="Apache" className="h-16 w-16 object-contain" />
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* File Upload Option */}
        <motion.div 
          variants={itemVariants} 
          className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center mb-4">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 mr-3">
              <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold">File or URL Analysis</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Upload log files or fetch them from a URL for detailed analysis.
          </p>
          <LogUploader onLogParsed={handleLogParsed} />
        </motion.div>

        {/* Live Report Option */}
        <motion.div 
          variants={itemVariants} 
          className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center mb-4">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 mr-3">
              <Wifi className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-semibold">Live Monitoring</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Connect to a WebSocket stream for real-time log analysis.
          </p>
          <div className="space-y-4">
            <div className="flex space-x-2">
              <Input 
                type="url" 
                placeholder="ws://your-server:8080" 
                value={wsUrl}
                onChange={(e) => setWsUrl(e.target.value)}
                className="flex-grow"
              />
              <Button 
                onClick={handleConnectToSocket} 
                disabled={!wsUrl}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                Connect
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );

  const renderDashboard = () => {
    if (analysisMode === 'live') {
      return (
        <motion.div
          key="live-dashboard"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <LiveDashboard wsUrl={wsUrl} />
        </motion.div>
      );
    }
    if (analysisMode === 'upload' && logData) {
      return (
        <motion.div
          key="upload-dashboard"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
            <div className="p-6 sm:p-8">
              <Dashboard stats={logData} parsedLines={parsedLines} />
            </div>
          </div>
        </motion.div>
      );
    }
    return null;
  };

  return (
    <div className={isDarkMode ? "dark" : ""}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-300">
        <nav className="backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/30 dark:border-gray-700/30 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <motion.div variants={itemVariants} className="flex items-center space-x-3">
                <img src="/assets/img/analyze.jpg" alt="HTTP Log Analyzer" className="w-10 h-10 rounded-lg object-cover"/>
                <div>
                  <h1 className="text-xl lg:text-2xl font-bold">HTTP Log Analyzer</h1>
                  <span className="text-xs text-blue-600 dark:text-blue-400">Professional Edition</span>
                </div>
              </motion.div>
              <motion.div variants={itemVariants} className="flex items-center space-x-3">
                {analysisMode && (
                  <Button 
                    onClick={handleNewAnalysis}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center"
                  >
                    <RotateCw className="w-4 h-4 mr-2" />
                    New Analysis
                  </Button>
                )}
                <DarkModeToggle isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
              </motion.div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <AnimatePresence mode="wait">
              {analysisMode ? renderDashboard() : renderInitialSelection()}
            </AnimatePresence>
          </motion.div>
        </main>

        <footer className="border-t border-gray-200/30 dark:border-gray-700/30 mt-16 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 md:mb-0">
                Crafted with ❤️ by <a href="https://aldotobing.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">Aldo Tobing</a>
              </p>
              <div className="flex space-x-6">
                <a href="https://x.com/aldo_tobing" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors">
                  <Twitter className="h-5 w-5" />
                  <span className="sr-only">Twitter</span>
                </a>
                <a href="https://github.com/aldotobing" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors">
                  <Github className="h-5 w-5" />
                  <span className="sr-only">GitHub</span>
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
