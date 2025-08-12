import { SetStateAction, useCallback, useState, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  AlertCircle,
  Loader2,
  Globe,
  FileUp,
  CheckCircle,
} from "lucide-react";

interface LogStats {
  [key: string]: any;
}

interface LogUploaderProps {
  onLogParsed: (data: { stats: LogStats; parsedLines: any[] }) => void;
}

export function LogUploader({ onLogParsed }: LogUploaderProps) {
  const [activeTab, setActiveTab] = useState("file");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDetermining, setIsDetermining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [url, setUrl] = useState("");
  const [detectedLogType, setDetectedLogType] = useState("");
  const [logType, setLogType] = useState("");
  const errorRef = useRef<HTMLDivElement>(null);

  // Regex untuk Nginx dan Apache
  const nginxRegex =
    /^(\S+)\s+-\s+-\s+\[(.*?)\]\s+"(GET|POST|PUT|DELETE|HEAD|OPTIONS|PATCH)\s+.*?\s+HTTP\/\d+\.\d+"\s+\d{3}\s+\d+\s+"[^"]*"\s+"[^"]*"/;
  const apacheRegex =
    /^(\S+)\s+\S+\s+\S+\s+\[([^\]]+)\]\s+"(GET|POST|PUT|DELETE|HEAD|OPTIONS|PATCH)\s+([^\s"]+)[^"]*"\s+(\d{3})\s+(\d+|-)/;

  // Fungsi untuk menentukan jenis log berdasarkan sample baris
  const determineLogType = (
    content: string | ArrayBuffer | null
  ): string | null => {
    if (!content) return null;
    const lines = content.toString().split("\n");
    const sampleLines = lines.filter((line) => line.trim()).slice(0, 5);
    let countNginx = 0;
    let countApache = 0;
    sampleLines.forEach((line) => {
      if (nginxRegex.test(line)) countNginx++;
      if (apacheRegex.test(line)) countApache++;
    });
    if (countNginx === 0 && countApache === 0) return null;
    // Kalau sama atau jumlah Nginx lebih besar, prioritaskan Nginx
    return countNginx >= countApache
      ? "Detected Nginx Log"
      : "Detected Apache Http Log";
  };

  const processLogFile = (
    content: string | ArrayBuffer | null,
    format: string
  ) => {
    const worker = new Worker(
      new URL("../workers/logParser.js", import.meta.url)
    );
    worker.onmessage = (event) => {
      if (event.data.error) {
        setErrorMessage(event.data.error);
        setIsProcessing(false);
        setDetectedLogType("");
      } else if (event.data.progress) {
        setProgress(event.data.progress);
      } else {
        onLogParsed(event.data);
        setIsProcessing(false);
        setDetectedLogType("");
      }
    };
    worker.postMessage({ logContent: content, format });
  };

  const processLogContent = (content: string, logType: string) => {
    setIsProcessing(true);
    processLogFile(content, logType.includes("Nginx") ? "nginx" : "apache");
  };

  const onDrop = useCallback((acceptedFiles: any[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target) {
          const content = event.target.result;
          // Masuk ke mode determining
          setIsDetermining(true);
          setErrorMessage("");
          setTimeout(() => {
            const logTypeDetected = determineLogType(content);
            if (!logTypeDetected) {
              setErrorMessage(
                "This file doesn't appear to be a valid Nginx or Apache Http log. Please check the format and try again."
              );
              setIsDetermining(false);
              return;
            }
            setDetectedLogType(logTypeDetected);
            // Beri waktu agar user bisa baca dan lihat animasi check mark
            setTimeout(() => {
              setIsDetermining(false);
              setIsProcessing(true);
              processLogFile(
                content,
                logTypeDetected.includes("Nginx") ? "nginx" : "apache"
              );
            }, 1500);
          }, 1500);
        }
      };
      reader.readAsText(file);
    }
  }, [onLogParsed]);

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
      setErrorMessage("Please enter a valid URL.");
      return;
    }

    // 1. Reset state for a new submission
    setErrorMessage("");
    setIsProcessing(false);
    setDetectedLogType("");
    setIsDetermining(true);

    try {
      // 2. Fetch content
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 404)
          throw new Error("File not found at the specified URL.");
        if (response.status === 403)
          throw new Error("Access to the URL is forbidden.");
        throw new Error(
          `Failed to fetch file. Server responded with status: ${response.status}`
        );
      }
      const content = await response.text();
      if (!content.trim()) {
        throw new Error("The fetched file is empty.");
      }

      // 3. Determine log type
      const logTypeDetected = determineLogType(content);
      if (!logTypeDetected) {
        throw new Error(
          "Could not determine log type. Please ensure it's a valid Nginx or Apache log."
        );
      }

      // 4. Success path: show detected type, then process
      setDetectedLogType(logTypeDetected);
      setTimeout(() => {
        setIsDetermining(false);
        setIsProcessing(true);
        processLogFile(
          content,
          logTypeDetected.includes("Nginx") ? "nginx" : "apache"
        );
      }, 1500); // Artificial delay for UX
    } catch (error) {
      // 5. Error path: set error message and stop all loading states
      let message = "An unknown error occurred.";
      if (error instanceof Error) {
        message = error.message;
      }
      if (
        error instanceof TypeError &&
        error.message.includes("Failed to fetch")
      ) {
        message =
          "Failed to fetch the file. This could be a network issue or a CORS policy on the server preventing access.";
      }

      setErrorMessage(message);
      setIsDetermining(false);
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (errorMessage && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [errorMessage]);

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
          className={`flex flex-1 items-center justify-center space-x-3 rounded-lg px-4 py-3 text-sm font-medium transition-transform duration-300 transform ${
            activeTab === "file"
              ? "bg-white text-blue-600 shadow-md dark:bg-gray-700 dark:text-blue-400 scale-100"
              : "bg-gray-100 text-gray-600 hover:bg-white hover:text-gray-900 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white scale-100 hover:scale-105"
          }`}
        >
          <FileUp
            className={`h-4 w-4 ${activeTab === "file" ? "text-blue-500" : ""}`}
          />
          <span>Upload File</span>
        </button>

        <button
          onClick={() => setActiveTab("url")}
          className={`flex flex-1 items-center justify-center space-x-3 rounded-lg px-4 py-3 text-sm font-medium transition-transform duration-300 transform ${
            activeTab === "url"
              ? "bg-white text-blue-600 shadow-md dark:bg-gray-700 dark:text-blue-400 scale-100"
              : "bg-gray-100 text-gray-600 hover:bg-white hover:text-gray-900 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white scale-100 hover:scale-105"
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
            ref={errorRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-lg border border-red-100 dark:border-red-900/30 mx-auto max-w-2xl w-full mb-6"
          >
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-red-700 dark:text-red-300">
                  Failed to load file
                </p>
                <div className="text-sm text-red-600 dark:text-red-400 space-y-1">
                  {errorMessage.split('\n').map((line, i) => (
                    <p key={i} className={i > 0 ? 'text-xs opacity-90' : ''}>
                      {line.replace(/^[•\-]\s*/, '')}
                    </p>
                  ))}
                </div>
              </div>
            </div>
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

              {isDetermining ? (
                <DeterminingState logType={detectedLogType} />
              ) : isProcessing ? (
                <ProcessingState
                  progress={progress}
                  logType={detectedLogType}
                />
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
                  {isDetermining ? (
                    <DeterminingState logType={detectedLogType} />
                  ) : isProcessing ? (
                    <ProcessingState
                      progress={progress}
                      logType={detectedLogType}
                    />
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
function ProcessingState({
  progress,
  logType,
}: {
  progress: number;
  logType?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 relative z-10"
    >
      {logType && (
        <p className="text-sm font-medium text-green-600 dark:text-green-400">
          {logType}
        </p>
      )}
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

// Determining State Component
function DeterminingState({ logType }: { logType: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-center space-x-3">
        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
          Determining Log Type...
        </p>
      </div>
      {logType && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex items-center justify-center space-x-2"
        >
          <p className="text-sm font-medium text-green-600 dark:text-green-400">
            {logType}
          </p>
          <CheckCircle className="h-5 w-5 text-green-500" />
        </motion.div>
      )}
    </motion.div>
  );
}
