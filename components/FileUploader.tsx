import { SetStateAction, useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, AlertCircle, Loader2 } from "lucide-react";

interface FileUploaderProps {
  onLogParsed: (data: SetStateAction<null>) => void;
  onFileUpload: () => void;
}

export function FileUploader({ onLogParsed }: FileUploaderProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);

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
    >
      <div
        {...getRootProps()}
        className={`relative overflow-hidden rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200
          ${
            isDragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : "border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600"
          }
              cursor-pointer
        `}
      >
        <input {...getInputProps()} />

        {/* Background animation for drag state */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-blue-500 dark:bg-blue-400"
            />
          )}
        </AnimatePresence>

        {/* Error Message */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 flex items-center justify-center space-x-2 text-red-500 dark:text-red-400"
            >
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm font-medium">{errorMessage}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Processing State */}
        {isProcessing ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-center space-x-3">
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Processing log file...
              </p>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <motion.div
                className="absolute inset-y-0 left-0 bg-blue-500 dark:bg-blue-400"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {progress}% complete
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="relative">
              <motion.div
                animate={
                  isDragging ? { y: 10, scale: 0.95 } : { y: 0, scale: 1 }
                }
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
        )}
      </div>
    </motion.div>
  );
}
