import { SetStateAction, useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  AlertCircle,
  Loader2,
  Link,
  Globe,
  FileUp,
} from "lucide-react";

interface LogUploaderProps {
  onLogParsed: (data: SetStateAction<null>) => void;
  onFileUpload: () => void;
}

export function LogUploader({ onLogParsed, onFileUpload }: LogUploaderProps) {
  const [activeTab, setActiveTab] = useState("file");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [url, setUrl] = useState("");

  const isNginxLog = (content: string | ArrayBuffer | null) => {
    if (!content) return false;
    const sanitizedContent = content
      .toString()
      .replace(/\r?\n|\r/g, " ")
      .trim();
    const nginxLogPattern =
      /(\d+\.\d+\.\d+\.\d+)\s+-\s+-\s+\[.*?\]\s+"(GET|POST|PUT|DELETE|HEAD|OPTIONS|PATCH)\s+.*?\s+HTTP\/\d\.\d"\s+\d{3}\s+(\d+|-)\s+"(.*?)"\s+"(.*?)"/;
    return nginxLogPattern.test(sanitizedContent);
  };

  const onDrop = useCallback((acceptedFiles: any[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target) {
          const content = event.target.result;
          if (isNginxLog(content)) {
            setIsProcessing(true);
            setErrorMessage("");
            processLogFile(content);
          } else {
            setErrorMessage(
              "This file doesn't appear to be a valid Nginx log. Please check the format and try again."
            );
          }
        }
      };
      reader.readAsText(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/plain": [".log", ".txt"],
    },
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
    onDropAccepted: () => setIsDragging(false),
  });

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) {
      setErrorMessage("Please enter a valid URL");
      return;
    }

    setIsProcessing(true);
    setErrorMessage("");
    onFileUpload();

    try {
      const response = await fetch(url);
      const content = await response.text();

      if (isNginxLog(content)) {
        processLogFile(content);
      } else {
        setErrorMessage("The URL doesn't contain a valid Nginx log format");
        setIsProcessing(false);
      }
    } catch (error) {
      setErrorMessage(
        "Failed to fetch log file from URL. Please check the URL and try again."
      );
      setIsProcessing(false);
    }
  };

  const processLogFile = (content: string | ArrayBuffer | null) => {
    const worker = new Worker(
      new URL("../workers/logParser.js", import.meta.url)
    );
    worker.onmessage = (event) => {
      if (event.data.progress) {
        setProgress(event.data.progress);
      } else {
        onLogParsed(event.data);
        setIsProcessing(false);
      }
    };
    worker.postMessage(content);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* Enhanced Tab Navigation */}
      <div className="flex space-x-2 rounded-xl bg-gray-50/50 p-1.5 dark:bg-gray-800/50 backdrop-blur-sm shadow-sm">
        <button
          onClick={() => setActiveTab("file")}
          className={`flex flex-1 items-center justify-center space-x-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-300 
            ${
              activeTab === "file"
                ? "bg-white text-blue-600 shadow-md dark:bg-gray-700 dark:text-blue-400 transform-gpu scale-100"
                : "text-gray-600 hover:bg-white/50 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700/50 transform-gpu scale-95 hover:scale-100"
            }`}
        >
          <FileUp
            className={`h-4 w-4 ${activeTab === "file" ? "text-blue-500" : ""}`}
          />
          <span>Upload File</span>
        </button>
        <button
          onClick={() => setActiveTab("url")}
          className={`flex flex-1 items-center justify-center space-x-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-300
            ${
              activeTab === "url"
                ? "bg-white text-blue-600 shadow-md dark:bg-gray-700 dark:text-blue-400 transform-gpu scale-100"
                : "text-gray-600 hover:bg-white/50 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700/50 transform-gpu scale-95 hover:scale-100"
            }`}
        >
          <Globe
            className={`h-4 w-4 ${activeTab === "url" ? "text-blue-500" : ""}`}
          />
          <span>Fetch from URL</span>
        </button>
      </div>

      {/* Enhanced Error Message */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-center space-x-2 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-lg"
          >
            <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
            <p className="text-sm font-medium text-red-600 dark:text-red-400">
              {errorMessage}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Content Area */}
      <AnimatePresence mode="wait">
        {activeTab === "file" ? (
          <motion.div
            key="file-upload"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <div
              {...getRootProps()}
              className={`relative overflow-hidden rounded-xl border-2 border-dashed p-12 text-center transition-all duration-300
          ${
            isDragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg"
              : "border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 hover:shadow-md"
          } cursor-pointer group`}
            >
              <input {...getInputProps()} />

              {/* Subtle background pattern */}
              <div className="absolute inset-0 opacity-5 dark:opacity-10">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10" />
                <div className="h-full w-full bg-[radial-gradient(circle,_transparent_20%,_#f0f0f0_20%,_#f0f0f0_21%,_transparent_21%,_transparent_50%)] bg-[length:1em_1em] dark:bg-[radial-gradient(circle,_transparent_20%,_#1a1a1a_20%,_#1a1a1a_21%,_transparent_21%,_transparent_50%)]" />
              </div>

              {isProcessing ? (
                <ProcessingState progress={progress} />
              ) : (
                <UploadState
                  isDragActive={isDragActive}
                  isDragging={isDragging}
                />
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="url-input"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div
              className={`relative overflow-hidden rounded-xl dark:border-gray-700 p-8 shadow-sm bg-white dark:bg-gray-800 transition-all duration-300`}
            >
              {/* Beautified URL Input and Button */}
              <div className="flex flex-col gap-6">
                {/* Styled Input */}
                <div className="relative">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Enter log file URL"
                    className="w-full rounded-full border bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-3 text-sm shadow-inner transition-all duration-200 
                placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-300 
                dark:from-gray-700 dark:to-gray-800 dark:text-white dark:placeholder:text-gray-500 dark:focus:ring-blue-500"
                  />
                  <Globe className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-blue-400" />
                </div>

                {/* Styled Button */}
                <div className="w-full">
                  {isProcessing ? (
                    <ProcessingState progress={progress} />
                  ) : (
                    <button
                      type="submit"
                      onClick={handleUrlSubmit}
                      className="w-full rounded-full bg-gradient-to-r from-blue-500 to-blue-700 px-4 py-3 text-sm font-medium text-white 
    shadow-md transition-all duration-200 hover:from-blue-700 hover:to-blue-800 focus:outline-none 
    focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-500 transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Fetch and Analyze Log
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Processing State Component
function ProcessingState({ progress }: { progress: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 relative z-10"
    >
      <div className="flex items-center justify-center space-x-3">
        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
          Processing log file...
        </p>
      </div>
      <div className="relative h-2 w-full max-w-md mx-auto overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500"
          initial={{ width: "0%" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {progress}% complete
      </p>
    </motion.div>
  );
}

// Upload State Component
function UploadState({
  isDragActive,
  isDragging,
}: {
  isDragActive: boolean;
  isDragging: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <div className="relative">
        <motion.div
          animate={isDragging ? { y: 10, scale: 0.95 } : { y: 0, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
        </motion.div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
          {isDragActive
            ? "Drop your log file here"
            : "Drop your log file here, or click to browse"}
        </p>
        <div className="flex items-center justify-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
          <FileText className="h-4 w-4" />
          <span>Accepts .log and .txt files</span>
        </div>
      </div>
    </motion.div>
  );
}
