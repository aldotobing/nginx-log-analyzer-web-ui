"use client";

import { useState } from "react";
import { FileUploader } from "../components/FileUploader";
import { Dashboard } from "../components/Dashboard";
import { DarkModeToggle } from "../components/DarkModeToggle";

export default function Home() {
  const [logData, setLogData] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleLogParsed = (data) => {
    setLogData(data);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className={isDarkMode ? "dark" : ""}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <div className="container mx-auto px-4 py-8">
          <header className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              Nginx Log Analyzer
            </h1>
            <DarkModeToggle
              isDarkMode={isDarkMode}
              toggleDarkMode={toggleDarkMode}
            />
          </header>
          {!logData ? (
            <FileUploader onLogParsed={handleLogParsed} />
          ) : (
            <Dashboard logData={logData} />
          )}
        </div>
      </div>
    </div>
  );
}
