import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";

export function FileUploader({ onLogParsed }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);

  // Updated regex to match Nginx log format based on provided example
  const isNginxLog = (content) => {
    const sanitizedContent = content.replace(/\r?\n|\r/g, " ").trim();
    const nginxLogPattern =
      /(\d+\.\d+\.\d+\.\d+)\s+-\s+-\s*\[.*\]\s*"\S+\s+\S+\s+\S+"\s*\d{3}\s+\d+\s+"-"\s*"\S+"/;
    return nginxLogPattern.test(sanitizedContent);
  };

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target.result;
        if (isNginxLog(content)) {
          setIsProcessing(true);
          processLogFile(content);
        } else {
          setErrorMessage(
            "This is not a valid Nginx log file. Please upload a valid .log or .txt file."
          );
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
  });

  const processLogFile = (content) => {
    const worker = new Worker(
      new URL("../workers/logParser.js", import.meta.url)
    );
    worker.onmessage = (event) => {
      if (event.data.progress) {
        setProgress(event.data.progress);
      } else {
        onLogParsed(event.data);
        setIsProcessing(false);
        setErrorMessage(null); // Reset error message on success
      }
    };
    worker.postMessage(content);
  };

  return (
    <div
      {...getRootProps()}
      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
    >
      <input {...getInputProps()} />
      {errorMessage && (
        <div className="text-red-500 mb-4">
          <p>{errorMessage}</p>
        </div>
      )}
      {isProcessing ? (
        <div>
          <p>Processing log file...</p>
          <progress value={progress} max="100" className="w-full mt-4" />
        </div>
      ) : isDragActive ? (
        <p>Drop the log file here...</p>
      ) : (
        <div>
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2">
            Drag & drop a log file here, or click to select one
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Supported formats: .log, .txt
          </p>
        </div>
      )}
    </div>
  );
}
